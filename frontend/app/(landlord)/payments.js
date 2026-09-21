import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  TextInput,
  DeviceEventEmitter,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getLiveOverview } from '../../services/database';
import { getPaymentHistory, sendManualReminder } from '../../services/paymentService';
import { useSync } from '../../contexts/SyncContext';
import { generateAndShareReceipt } from '../../utils/ReceiptGenerator';
import PaymentVerificationModal from '../../components/landlord/Overview/PaymentVerificationModal';
import styles from '../../styles/landlord/payments.styles';

export default function PaymentsDashboard() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { landlordSyncData } = useSync();

  const [data, setData] = useState(landlordSyncData?.liveOverview || null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(!landlordSyncData?.liveOverview);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'OVERDUE'
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [remindingId, setRemindingId] = useState(null);
  const [ledgerPage, setLedgerPage] = useState(1);
  const LEDGER_PAGE_SIZE = 5;
  const handledPaymentIdRef = useRef(null);

  // Instant Cache Restoration (Stale-While-Revalidate)
  useEffect(() => {
    let isMounted = true;
    const restoreCached = async () => {
      try {
        const [cachedOverview, cachedHistory] = await Promise.all([
          AsyncStorage.getItem('@cached_landlord_overview'),
          AsyncStorage.getItem('@cached_landlord_payments_history')
        ]);
        if (isMounted) {
          if (cachedOverview) {
            setData(prev => prev || JSON.parse(cachedOverview));
          }
          if (cachedHistory) {
            const parsed = JSON.parse(cachedHistory);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setHistory(parsed);
              setLoading(false);
            }
          }
        }
      } catch (err) {
        console.warn('[PaymentsDashboard] Cache restore error:', err);
      }
    };
    restoreCached();
    return () => { isMounted = false; };
  }, []);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const [overviewResult, historyResult] = await Promise.all([
        getLiveOverview(),
        getPaymentHistory(),
      ]);
      if (overviewResult) {
        setData(overviewResult);
        AsyncStorage.setItem('@cached_landlord_overview', JSON.stringify(overviewResult)).catch(() => {});
      }
      if (historyResult && Array.isArray(historyResult)) {
        setHistory(historyResult);
        AsyncStorage.setItem('@cached_landlord_payments_history', JSON.stringify(historyResult)).catch(() => {});
      }
    } catch (err) {
      console.error('[loadPaymentsData] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time Sync update
  useEffect(() => {
    if (landlordSyncData && landlordSyncData.liveOverview) {
      setData(landlordSyncData.liveOverview);
    }
  }, [landlordSyncData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Extracted Data Sets
  const pendingPayments = useMemo(() => {
    const list = data?.pendingPayments || [];
    // Also include any pending items from history if not already in list
    const fromHistory = history.filter(
      (h) => h.status === 'pending' && !list.some((p) => String(p.id) === String(h.id))
    );
    return [...list, ...fromHistory];
  }, [data?.pendingPayments, history]);

  const unpaidBills = useMemo(() => {
    return data?.unpaidBills || [];
  }, [data?.unpaidBills]);

  const verifiedPayments = useMemo(() => {
    return history.filter((p) => p.status === 'verified');
  }, [history]);

  const rejectedPayments = useMemo(() => {
    return history.filter((p) => p.status === 'rejected');
  }, [history]);

  // Deep-linking: Automatically open Payment Verification Modal when paymentId is passed via notification navigation
  useEffect(() => {
    if (params?.paymentId && !loading && handledPaymentIdRef.current !== String(params.paymentId)) {
      const pId = String(params.paymentId);
      const target = pendingPayments.find((p) => String(p.id) === pId) ||
                     history.find((p) => String(p.id) === pId);

      if (target) {
        handledPaymentIdRef.current = pId;
        setSelectedPayment(target);
        if (target.status === 'pending') {
          setActiveFilter('PENDING');
        }
      } else {
        // Fallback: If not found in loaded sets, fetch latest payment history to open modal
        getPaymentHistory().then((allHistory) => {
          if (Array.isArray(allHistory)) {
            const found = allHistory.find((p) => String(p.id) === pId);
            if (found) {
              handledPaymentIdRef.current = pId;
              setSelectedPayment(found);
              if (found.status === 'pending') {
                setActiveFilter('PENDING');
              }
            }
          }
        }).catch((err) => console.warn('[PaymentsDashboard] Deep-link payment lookup error:', err));
      }
    }
  }, [params?.paymentId, loading, pendingPayments, history]);

  const paymentSummary = data?.paymentSummary || {};
  const totalCollected = parseFloat(
    paymentSummary.collectedAmount ??
      data?.statistics?.monthlyRevenue ??
      verifiedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  );


  // Send Manual Reminder
  const handleSendReminder = async (item) => {
    try {
      setRemindingId(item.id);
      const isOverdue = item.payment_status === 'overdue';
      const now = new Date();
      const dueDate = item.due_date ? new Date(item.due_date) : null;
      const daysRemaining = dueDate ? Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)) : 0;
      const daysOverdue = isOverdue ? Math.abs(daysRemaining) : 0;
      const amount = parseFloat(item.outstanding_balance ?? item.grand_total ?? item.total_cost ?? 0);

      await sendManualReminder(item.room_id, item.tenant_id, amount, daysOverdue);
      DeviceEventEmitter.emit('showToast', {
        message: `Reminder sent to ${item.tenant_name || 'Tenant'}!`,
        type: 'success',
      });
    } catch (err) {
      DeviceEventEmitter.emit('showToast', {
        message: typeof err === 'string' ? err : err.message || 'Failed to send reminder.',
        type: 'error',
      });
    } finally {
      setRemindingId(null);
    }
  };

  // Download Receipt
  const handleDownloadReceipt = async (item) => {
    try {
      await generateAndShareReceipt(item);
    } catch {
      Alert.alert('Error', 'Failed to generate receipt. Please try again.');
    }
  };

  // Search filter helper
  const filterBySearch = useCallback(
    (item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const tenant = (item.tenant_name || item.tenantName || '').toLowerCase();
      const room = String(item.room_name || item.room_id || '').toLowerCase();
      const invoice = String(item.invoice_number || '').toLowerCase();
      const ref = String(item.reference_number || '').toLowerCase();
      return tenant.includes(q) || room.includes(q) || invoice.includes(q) || ref.includes(q);
    },
    [searchQuery]
  );

  // Combined processed payments (verified + rejected) sorted by newest first
  const processedPayments = useMemo(() => {
    return history
      .filter((p) => p.status === 'verified' || p.status === 'rejected')
      .sort((a, b) => {
        const dateA = new Date(a.paid_at || a.updated_at || a.created_at || 0).getTime();
        const dateB = new Date(b.paid_at || b.updated_at || b.created_at || 0).getTime();
        return dateB - dateA;
      });
  }, [history]);

  const filteredPending = useMemo(
    () => pendingPayments.filter(filterBySearch),
    [pendingPayments, filterBySearch]
  );
  const filteredVerified = useMemo(
    () => verifiedPayments.filter(filterBySearch),
    [verifiedPayments, filterBySearch]
  );
  const filteredRejected = useMemo(
    () => rejectedPayments.filter(filterBySearch),
    [rejectedPayments, filterBySearch]
  );
  const filteredOverdue = useMemo(
    () => unpaidBills.filter(filterBySearch),
    [unpaidBills, filterBySearch]
  );
  const filteredProcessed = useMemo(() => {
    let list = processedPayments;
    if (activeFilter === 'VERIFIED') {
      list = list.filter((p) => p.status === 'verified');
    } else if (activeFilter === 'REJECTED') {
      list = list.filter((p) => p.status === 'rejected');
    }
    return list.filter(filterBySearch);
  }, [processedPayments, activeFilter, filterBySearch]);

  // Reset pagination when search or status filter changes
  useEffect(() => {
    setLedgerPage(1);
  }, [searchQuery, activeFilter]);

  const totalLedgerPages = useMemo(() => {
    return Math.ceil(filteredProcessed.length / LEDGER_PAGE_SIZE) || 1;
  }, [filteredProcessed.length]);

  const paginatedProcessed = useMemo(() => {
    const start = (ledgerPage - 1) * LEDGER_PAGE_SIZE;
    return filteredProcessed.slice(start, start + LEDGER_PAGE_SIZE);
  }, [filteredProcessed, ledgerPage]);

  // Format Helpers
  const formatCurrency = (val) => {
    return (
      '₱' +
      Number(val || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recent';
    const safe = typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr;
    try {
      return new Date(safe).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Syncing Finances...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* ================= COMPACT HEADER ================= */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Payments</Text>
          <Text style={styles.subtitle}>Review and manage tenant payments.</Text>
        </View>

        {/* Payment Settings Button */}
        <TouchableOpacity
          style={styles.headerSettingsBtn}
          onPress={() => router.push('/(landlord)/payment-settings')}
          activeOpacity={0.75}
          accessibilityLabel="Payment Settings"
        >
          <Ionicons name="options-outline" size={20} color="#38BDF8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#10B981"
          />
        }
      >
        {/* ================= COMPACT 4-METRIC SUMMARY ================= */}
        <View style={styles.summaryGrid}>
          {/* 1. Pending */}
          <TouchableOpacity
            style={[
              styles.metricCard,
              activeFilter === 'PENDING' && styles.metricCardActive,
            ]}
            onPress={() => setActiveFilter(activeFilter === 'PENDING' ? 'ALL' : 'PENDING')}
            activeOpacity={0.8}
          >
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Pending</Text>
              <View style={[styles.metricDot, { backgroundColor: '#F59E0B' }]} />
            </View>
            <Text style={[styles.metricValue, { color: '#F59E0B' }]}>
              {pendingPayments.length}
            </Text>
            <Text style={styles.metricSub}>Need review</Text>
          </TouchableOpacity>

          {/* 2. Verified */}
          <TouchableOpacity
            style={[
              styles.metricCard,
              activeFilter === 'VERIFIED' && styles.metricCardActive,
            ]}
            onPress={() => setActiveFilter(activeFilter === 'VERIFIED' ? 'ALL' : 'VERIFIED')}
            activeOpacity={0.8}
          >
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Verified</Text>
              <View style={[styles.metricDot, { backgroundColor: '#10B981' }]} />
            </View>
            <Text style={[styles.metricValue, { color: '#10B981' }]}>
              {verifiedPayments.length}
            </Text>
            <Text style={styles.metricSub}>Approved</Text>
          </TouchableOpacity>

          {/* 3. Overdue */}
          <TouchableOpacity
            style={[
              styles.metricCard,
              activeFilter === 'OVERDUE' && styles.metricCardActive,
            ]}
            onPress={() => setActiveFilter(activeFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
            activeOpacity={0.8}
          >
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Overdue</Text>
              <View style={[styles.metricDot, { backgroundColor: '#EF4444' }]} />
            </View>
            <Text style={[styles.metricValue, { color: '#EF4444' }]}>
              {unpaidBills.length}
            </Text>
            <Text style={styles.metricSub}>Past due date</Text>
          </TouchableOpacity>

          {/* 4. Total Collected */}
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Collected</Text>
              <View style={[styles.metricDot, { backgroundColor: '#38BDF8' }]} />
            </View>
            <Text style={[styles.metricValue, { fontSize: 16, color: '#38BDF8' }]} numberOfLines={1}>
              {formatCurrency(totalCollected)}
            </Text>
            <Text style={styles.metricSub}>Total settled</Text>
          </View>
        </View>

        {/* ================= SEARCH BAR ================= */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={17} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tenant, room, invoice, ref..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.searchClearBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* ================= STATUS FILTER TABS ================= */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterTabsScroll}
          contentContainerStyle={styles.filterTabsContainer}
        >
          {/* ALL */}
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'ALL' && styles.filterTabActive]}
            onPress={() => setActiveFilter('ALL')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, activeFilter === 'ALL' && styles.filterTabTextActive]}>
              All
            </Text>
            <View style={[styles.filterTabBadge, activeFilter === 'ALL' && styles.filterTabBadgeActive]}>
              <Text style={[styles.filterTabBadgeText, activeFilter === 'ALL' && styles.filterTabBadgeTextActive]}>
                {pendingPayments.length + history.length + unpaidBills.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* PENDING */}
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'PENDING' && styles.filterTabActive]}
            onPress={() => setActiveFilter('PENDING')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, activeFilter === 'PENDING' && styles.filterTabTextActive]}>
              Pending
            </Text>
            <View style={[styles.filterTabBadge, activeFilter === 'PENDING' && styles.filterTabBadgeActive]}>
              <Text style={[styles.filterTabBadgeText, activeFilter === 'PENDING' && styles.filterTabBadgeTextActive]}>
                {pendingPayments.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* VERIFIED */}
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'VERIFIED' && styles.filterTabActive]}
            onPress={() => setActiveFilter('VERIFIED')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, activeFilter === 'VERIFIED' && styles.filterTabTextActive]}>
              Verified
            </Text>
            <View style={[styles.filterTabBadge, activeFilter === 'VERIFIED' && styles.filterTabBadgeActive]}>
              <Text style={[styles.filterTabBadgeText, activeFilter === 'VERIFIED' && styles.filterTabBadgeTextActive]}>
                {verifiedPayments.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* REJECTED */}
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'REJECTED' && styles.filterTabActive]}
            onPress={() => setActiveFilter('REJECTED')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, activeFilter === 'REJECTED' && styles.filterTabTextActive]}>
              Rejected
            </Text>
            <View style={[styles.filterTabBadge, activeFilter === 'REJECTED' && styles.filterTabBadgeActive]}>
              <Text style={[styles.filterTabBadgeText, activeFilter === 'REJECTED' && styles.filterTabBadgeTextActive]}>
                {rejectedPayments.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* OVERDUE */}
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'OVERDUE' && styles.filterTabActive]}
            onPress={() => setActiveFilter('OVERDUE')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, activeFilter === 'OVERDUE' && styles.filterTabTextActive]}>
              Overdue
            </Text>
            <View style={[styles.filterTabBadge, activeFilter === 'OVERDUE' && styles.filterTabBadgeActive]}>
              <Text style={[styles.filterTabBadgeText, activeFilter === 'OVERDUE' && styles.filterTabBadgeTextActive]}>
                {unpaidBills.length}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* ================= 1. PENDING PAYMENTS (PRIMARY ACTION AREA) ================= */}
        {(activeFilter === 'ALL' || activeFilter === 'PENDING') && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Pending Verifications ({filteredPending.length})
              </Text>
              {filteredPending.length > 0 && (
                <Text style={styles.sectionBadge}>Action Required</Text>
              )}
            </View>

            {filteredPending.length === 0 ? (
              activeFilter === 'PENDING' && (
                <View style={styles.emptyStateBox}>
                  <Ionicons name="checkmark-done-circle-outline" size={44} color="#10B981" />
                  <Text style={styles.emptyStateTitle}>{"You're all caught up!"}</Text>
                  <Text style={styles.emptyStateSub}>
                    No pending payment verifications currently required.
                  </Text>
                </View>
              )
            ) : (
              filteredPending.map((item) => {
                const name = item.tenant_name || item.tenantName || 'Tenant';
                const room = item.room_name || item.room_id || '?';
                const roomLabel = String(room).toLowerCase().startsWith('room') ? room : `Room ${room}`;
                const initial = name.trim().charAt(0).toUpperCase() || 'T';
                const amt = parseFloat(
                  item.amount ??
                    item.outstanding_balance ??
                    (item.grand_total
                      ? parseFloat(item.grand_total) - parseFloat(item.amount_paid || 0)
                      : parseFloat(item.total_cost || 0) + parseFloat(item.penalty_amount || 0))
                );
                const subDate = formatDate(item.payment_date || item.created_at);

                return (
                  <View key={item.id} style={styles.pendingCard}>
                    {/* Header Row */}
                    <View style={styles.pendingCardHeader}>
                      <View style={styles.roomPill}>
                        <Ionicons name="business-outline" size={12} color="#38BDF8" />
                        <Text style={styles.roomPillText}>{roomLabel}</Text>
                      </View>
                      <View style={styles.statusBadgePending}>
                        <Ionicons name="time-outline" size={12} color="#F59E0B" />
                        <Text style={styles.statusBadgePendingText}>PENDING</Text>
                      </View>
                    </View>

                    {/* Body */}
                    <View style={styles.pendingBody}>
                      <View style={styles.tenantAvatarWrap}>
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarText}>{initial}</Text>
                        </View>
                        <View style={styles.tenantDetails}>
                          <Text style={styles.pendingTenantName} numberOfLines={1}>
                            {name}
                          </Text>
                          <Text style={styles.pendingInvoiceText} numberOfLines={1}>
                            {item.invoice_number ? `Invoice #${item.invoice_number}` : `Inv #${item.billing_cycle_id || item.id}`}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.pendingAmountBox}>
                        <Text style={styles.pendingAmountValue}>{formatCurrency(amt)}</Text>
                        <Text style={styles.paymentMethodChip}>
                          {item.payment_method || 'GCash'}
                        </Text>
                      </View>
                    </View>

                    {/* Footer Row with Meta and Review Action */}
                    <View style={styles.pendingCardFooter}>
                      <View style={styles.pendingMetaRow}>
                        <View style={styles.pendingMetaItem}>
                          <Ionicons name="calendar-outline" size={12} color="#64748B" />
                          <Text style={styles.submissionDateText} numberOfLines={1}>
                            Submitted {subDate}
                          </Text>
                        </View>
                        {item.reference_number ? (
                          <View style={styles.pendingMetaItem}>
                            <Ionicons name="barcode-outline" size={12} color="#64748B" />
                            <Text style={styles.submissionRefText} numberOfLines={1}>
                              Ref {item.reference_number}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <TouchableOpacity
                        style={styles.reviewBtn}
                        onPress={() => setSelectedPayment(item)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="shield-checkmark-outline" size={14} color="#FFFFFF" />
                        <Text style={styles.reviewBtnText}>Review & Verify</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ================= 2. OVERDUE ACCOUNTS ================= */}
        {(activeFilter === 'ALL' || activeFilter === 'OVERDUE') && (
          <View style={{ marginTop: activeFilter === 'ALL' ? 8 : 0 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Overdue Invoices ({filteredOverdue.length})
              </Text>
              {filteredOverdue.length > 0 && (
                <Text style={[styles.sectionBadge, { color: '#EF4444' }]}>Unsettled</Text>
              )}
            </View>

            {filteredOverdue.length === 0 ? (
              activeFilter === 'OVERDUE' && (
                <View style={styles.emptyStateBox}>
                  <Ionicons name="shield-checkmark-outline" size={44} color="#10B981" />
                  <Text style={styles.emptyStateTitle}>Zero Overdue Bills!</Text>
                  <Text style={styles.emptyStateSub}>
                    All tenant billing accounts are fully caught up.
                  </Text>
                </View>
              )
            ) : (
              filteredOverdue.map((bill) => {
                const room = bill.room_name || bill.room_id || '?';
                const roomLabel = String(room).toLowerCase().startsWith('room') ? room : `Room ${room}`;
                const name = bill.tenant_name || 'Tenant';
                const now = new Date();
                const dueDate = bill.due_date ? new Date(bill.due_date) : null;
                const daysLate = dueDate ? Math.max(1, Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24))) : 1;
                const baseCost = parseFloat(bill.electricity_charge || bill.total_cost || 0);
                const penalty = parseFloat(bill.penalty_amount || 0);
                const totalDue = parseFloat(bill.outstanding_balance ?? (baseCost + penalty));
                const isReminding = remindingId === bill.id;

                return (
                  <View key={`overdue-${bill.id}`} style={styles.overdueCard}>
                    {/* Header */}
                    <View style={styles.overdueHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={styles.roomPill}>
                          <Ionicons name="business-outline" size={12} color="#38BDF8" />
                          <Text style={styles.roomPillText}>{roomLabel}</Text>
                        </View>
                        <Text style={[styles.itemTenantName, { fontSize: 13 }]} numberOfLines={1}>
                          {name}
                        </Text>
                      </View>
                      <View style={styles.overdueLateBadge}>
                        <Text style={styles.overdueLateText}>{daysLate} {daysLate === 1 ? 'Day' : 'Days'} Late</Text>
                      </View>
                    </View>

                    {/* Breakdown */}
                    <View style={styles.overdueBreakdownRow}>
                      <Text style={styles.overdueBreakdownLabel}>Invoice #{bill.invoice_number || bill.id}</Text>
                      <Text style={styles.overdueBreakdownValue}>Base: {formatCurrency(baseCost)}</Text>
                    </View>
                    {penalty > 0 && (
                      <View style={styles.overdueBreakdownRow}>
                        <Text style={styles.overdueBreakdownLabel}>Late Penalty Applied</Text>
                        <Text style={[styles.overdueBreakdownValue, { color: '#EF4444' }]}>
                          +{formatCurrency(penalty)}
                        </Text>
                      </View>
                    )}

                    {/* Total & Action */}
                    <View style={styles.overdueTotalRow}>
                      <View>
                        <Text style={[styles.overdueBreakdownLabel, { fontSize: 11 }]}>Current Balance</Text>
                        <Text style={styles.overdueTotalAmount}>{formatCurrency(totalDue)}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.remindBtn}
                        onPress={() => handleSendReminder(bill)}
                        disabled={isReminding}
                        activeOpacity={0.8}
                      >
                        {isReminding ? (
                          <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                          <>
                            <Ionicons name="notifications-outline" size={13} color="#EF4444" />
                            <Text style={styles.remindBtnText}>Send Reminder</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ================= 3. UNIFIED MINIMAL TABLE: VERIFIED & REJECTED PAYMENTS ================= */}
        {(activeFilter === 'ALL' || activeFilter === 'VERIFIED' || activeFilter === 'REJECTED') && (
          <View style={{ marginTop: activeFilter === 'ALL' ? 8 : 0 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeFilter === 'VERIFIED'
                  ? `Verified Payments (${filteredProcessed.length})`
                  : activeFilter === 'REJECTED'
                  ? `Rejected Submissions (${filteredProcessed.length})`
                  : `Payment Ledger (${filteredProcessed.length})`}
              </Text>
              {activeFilter === 'ALL' && filteredProcessed.length > 0 && (
                <Text style={styles.sectionBadge}>
                  {filteredVerified.length} Paid · {filteredRejected.length} Rejected
                </Text>
              )}
            </View>

            {filteredProcessed.length === 0 ? (
              <View style={styles.emptyStateBox}>
                <Ionicons
                  name={activeFilter === 'REJECTED' ? 'close-circle-outline' : 'receipt-outline'}
                  size={44}
                  color="#64748B"
                />
                <Text style={styles.emptyStateTitle}>
                  {activeFilter === 'VERIFIED'
                    ? 'No verified payments'
                    : activeFilter === 'REJECTED'
                    ? 'No rejected payments'
                    : 'No processed transactions'}
                </Text>
                <Text style={styles.emptyStateSub}>
                  {activeFilter === 'VERIFIED'
                    ? 'Approved tenant payments will appear here with downloadable receipts.'
                    : activeFilter === 'REJECTED'
                    ? 'Any rejected payments will be recorded here with rejection reasons.'
                    : 'Verified and rejected payment submissions will appear in this ledger.'}
                </Text>
              </View>
            ) : (
              <View style={styles.tableCard}>
                <View style={styles.tableHeader}>
                  <View style={styles.tableHeaderTitleRow}>
                    <Ionicons name="receipt-outline" size={13} color="#10B981" />
                    <Text style={styles.tableHeaderTitle}>Transaction Ledger</Text>
                  </View>
                  <Text style={styles.tableHeaderCount}>{filteredProcessed.length} Records</Text>
                </View>

                {/* Column Headers for Minimal Table Layout */}
                <View style={styles.tableColumnsRow}>
                  <Text style={styles.tableColLabelLeft}>Tenant / Date</Text>
                  <Text style={styles.tableColLabelRight}>Amount / Status</Text>
                </View>

                {paginatedProcessed.map((item, index) => {
                  const isVerified = item.status === 'verified';
                  const name = item.tenant_name || item.tenantName || item.room_id || 'Tenant';
                  const room = item.room_name || item.room_id || '?';
                  const roomStr = String(room).toLowerCase().startsWith('room') ? room : `Room ${room}`;
                  const amt = parseFloat(item.amount || 0);
                  const dateStr = formatDate(item.paid_at || item.updated_at || item.payment_date || item.created_at);
                  const isLast = index === paginatedProcessed.length - 1;

                  return (
                    <View
                      key={`processed-${item.id}-${index}`}
                      style={[styles.tableRow, isLast && styles.tableRowLast]}
                    >
                      {/* Status Icon Indicator */}
                      <View
                        style={[
                          styles.tableIconBox,
                          {
                            backgroundColor: isVerified
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'rgba(239, 68, 68, 0.12)',
                          },
                        ]}
                      >
                        <Ionicons
                          name={isVerified ? 'checkmark' : 'close'}
                          size={12}
                          color={isVerified ? '#10B981' : '#EF4444'}
                        />
                      </View>

                      {/* Main Tenant Details */}
                      <View style={styles.tableTenantInfo}>
                        <View style={styles.tableTenantNameRow}>
                          <Text style={styles.tableTenantName} numberOfLines={1}>
                            {name}
                          </Text>
                          <Text style={styles.tableRoomTag}>{roomStr}</Text>
                        </View>

                        <Text style={styles.tableMeta} numberOfLines={1}>
                          {dateStr} • {item.payment_method || 'GCash'}
                          {item.reference_number ? ` • Ref ${item.reference_number}` : ''}
                        </Text>

                        {!isVerified && item.rejection_reason ? (
                          <Text style={styles.tableReason} numberOfLines={1}>
                            Reason: {item.rejection_reason}
                          </Text>
                        ) : null}
                      </View>

                      {/* Amount & Status Badge / Receipt */}
                      <View style={styles.tableAmountBox}>
                        <Text style={styles.tableAmount}>{formatCurrency(amt)}</Text>
                        <View style={styles.tableStatusLine}>
                          <View
                            style={[
                              styles.tableStatusPill,
                              {
                                backgroundColor: isVerified
                                  ? 'rgba(16, 185, 129, 0.12)'
                                  : 'rgba(239, 68, 68, 0.12)',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.tableStatusText,
                                { color: isVerified ? '#10B981' : '#EF4444' },
                              ]}
                            >
                              {isVerified ? 'VERIFIED' : 'REJECTED'}
                            </Text>
                          </View>

                          {isVerified && (
                            <TouchableOpacity
                              style={styles.tableReceiptBtn}
                              onPress={() => handleDownloadReceipt(item)}
                              activeOpacity={0.7}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                              accessibilityLabel="Download Receipt"
                            >
                              <Ionicons name="document-text-outline" size={10} color="#38BDF8" />
                              <Text style={styles.tableReceiptText}>Receipt</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}

                {/* Minimal Table Pagination */}
                {totalLedgerPages > 1 ? (
                  <View style={styles.paginationRow}>
                    <Text style={styles.paginationInfo}>
                      Showing {(ledgerPage - 1) * LEDGER_PAGE_SIZE + 1}–
                      {Math.min(ledgerPage * LEDGER_PAGE_SIZE, filteredProcessed.length)} of{' '}
                      {filteredProcessed.length}
                    </Text>

                    <View style={styles.paginationBtns}>
                      <TouchableOpacity
                        style={[styles.pageBtn, ledgerPage === 1 && styles.pageBtnDisabled]}
                        onPress={() => setLedgerPage((prev) => Math.max(1, prev - 1))}
                        disabled={ledgerPage === 1}
                        activeOpacity={0.7}
                        accessibilityLabel="Previous Page"
                      >
                        <Ionicons
                          name="chevron-back"
                          size={12}
                          color={ledgerPage === 1 ? '#475569' : '#38BDF8'}
                        />
                        <Text
                          style={[
                            styles.pageBtnText,
                            ledgerPage === 1 && styles.pageBtnTextDisabled,
                          ]}
                        >
                          Prev
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.pageIndicator}>
                        <Text style={styles.pageIndicatorText}>
                          {ledgerPage} / {totalLedgerPages}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.pageBtn,
                          ledgerPage >= totalLedgerPages && styles.pageBtnDisabled,
                        ]}
                        onPress={() => setLedgerPage((prev) => Math.min(totalLedgerPages, prev + 1))}
                        disabled={ledgerPage >= totalLedgerPages}
                        activeOpacity={0.7}
                        accessibilityLabel="Next Page"
                      >
                        <Text
                          style={[
                            styles.pageBtnText,
                            ledgerPage >= totalLedgerPages && styles.pageBtnTextDisabled,
                          ]}
                        >
                          Next
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={12}
                          color={ledgerPage >= totalLedgerPages ? '#475569' : '#38BDF8'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.paginationSingleRow}>
                    <Text style={styles.paginationInfo}>
                      Showing all {filteredProcessed.length} records
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ================= MODAL: PAYMENT VERIFICATION & AUDIT ================= */}
      <PaymentVerificationModal
        visible={!!selectedPayment}
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
        onRefresh={loadData}
      />
    </SafeAreaView>
  );
}
