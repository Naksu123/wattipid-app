import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Modal,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getOverdueAccounts } from '../../services/penaltyService';
import { sendManualReminder } from '../../services/paymentService';
import styles from '../../styles/landlord/penalties.styles';

export default function PenaltyCenterScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalOverdueAccounts: 0,
    totalActivePenalties: 0,
    totalOutstandingBalance: 0,
    totalPenaltiesCollected: 0,
  });
  const [activity, setActivity] = useState([]);
  const [showAllActivity, setShowAllActivity] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'RECENT'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [remindingId, setRemindingId] = useState(null);

  const hasPenaltiesRef = React.useRef(false);

  // Instant Cache Restoration (Stale-While-Revalidate)
  useEffect(() => {
    let isMounted = true;
    const restoreCached = async () => {
      try {
        const cached = await AsyncStorage.getItem('@cached_landlord_penalties');
        if (cached && isMounted) {
          const parsed = JSON.parse(cached);
          if (parsed) {
            if (Array.isArray(parsed.accounts) && parsed.accounts.length > 0) {
              setAccounts(parsed.accounts);
              hasPenaltiesRef.current = true;
              setLoading(false);
            }
            if (parsed.analytics) setAnalytics(parsed.analytics);
            if (Array.isArray(parsed.activity)) setActivity(parsed.activity);
          }
        }
      } catch (err) {
        console.warn('[PenaltyCenterScreen] Cache restore error:', err);
      }
    };
    restoreCached();
    return () => { isMounted = false; };
  }, []);

  // Load Data from real database
  const loadData = useCallback(async () => {
    try {
      setError(null);
      const res = await getOverdueAccounts();
      const accList = res?.accounts || [];
      setAccounts(accList);
      const newAnalytics = {
        totalOverdueAccounts: res?.analytics?.totalOverdueAccounts || accList.length,
        totalActivePenalties: parseFloat(res?.analytics?.totalActivePenalties || 0),
        totalOutstandingBalance: parseFloat(res?.analytics?.totalOutstandingBalance || 0),
        totalPenaltiesCollected: parseFloat(res?.analytics?.totalPenaltiesCollected || 0),
      };
      setAnalytics(newAnalytics);
      const newActivity = res?.activity || [];
      setActivity(newActivity);
      hasPenaltiesRef.current = true;

      AsyncStorage.setItem('@cached_landlord_penalties', JSON.stringify({
        accounts: accList,
        analytics: newAnalytics,
        activity: newActivity
      })).catch(() => {});
    } catch (err) {
      console.error('[loadPenaltyData] Error:', err);
      if (!hasPenaltiesRef.current) {
        setError(typeof err === 'string' ? err : err.message || 'Failed to load penalty information.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Currency & Date formatting helpers
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
    if (!dateStr) return 'Past Due';
    const safe = typeof dateStr === 'string' ? dateStr.replace(' ', 'T') : dateStr;
    try {
      return new Date(safe).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Past Due';
    }
  };

  // Search filter predicate
  const filterBySearch = useCallback(
    (item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const tenant = (item.tenant_name || '').toLowerCase();
      const room = String(item.room_id || '').toLowerCase();
      const invoice = String(item.invoice_number || '').toLowerCase();
      return tenant.includes(q) || room.includes(q) || invoice.includes(q);
    },
    [searchQuery]
  );

  // Filtered Invoices based on search & urgency tab
  const filteredInvoices = useMemo(() => {
    let list = accounts.filter(filterBySearch);
    if (activeFilter === 'CRITICAL') {
      list = list.filter((item) => parseInt(item.days_overdue || 0) >= 7);
    } else if (activeFilter === 'RECENT') {
      list = list.filter((item) => parseInt(item.days_overdue || 0) < 7);
    }
    return list;
  }, [accounts, activeFilter, filterBySearch]);

  // Group invoices by Room/Tenant so multiple overdue invoices are kept individually identifiable
  const groupedAccounts = useMemo(() => {
    const groups = {};
    filteredInvoices.forEach((inv) => {
      const key = String(inv.room_id || inv.tenant_name || inv.id);
      if (!groups[key]) {
        groups[key] = {
          roomId: inv.room_id,
          tenantName: inv.tenant_name || 'Tenant',
          invoices: [],
          totalCombinedOutstanding: 0,
          totalCombinedPenalties: 0,
          maxDaysOverdue: 0,
        };
      }
      groups[key].invoices.push(inv);
      groups[key].totalCombinedOutstanding += parseFloat(inv.total_amount_due || 0);
      groups[key].totalCombinedPenalties += parseFloat(inv.penalty_amount || 0);
      const days = parseInt(inv.days_overdue || 0);
      if (days > groups[key].maxDaysOverdue) {
        groups[key].maxDaysOverdue = days;
      }
    });
    return Object.values(groups);
  }, [filteredInvoices]);

  // Counts for filter badges
  const criticalCount = useMemo(() => {
    return accounts.filter((item) => parseInt(item.days_overdue || 0) >= 7).length;
  }, [accounts]);

  const recentCount = useMemo(() => {
    return accounts.filter((item) => parseInt(item.days_overdue || 0) < 7).length;
  }, [accounts]);

  const uniqueOverdueRoomsCount = useMemo(() => {
    const set = new Set(accounts.map((a) => a.room_id));
    return set.size;
  }, [accounts]);

  // Send manual payment/penalty reminder
  const handleSendReminder = async (invoice) => {
    try {
      setRemindingId(invoice.id);
      const daysOverdue = parseInt(invoice.days_overdue || 1);
      const amount = parseFloat(invoice.total_amount_due || invoice.original_balance || 0);

      await sendManualReminder(invoice.room_id, invoice.tenant_id, amount, daysOverdue);
      DeviceEventEmitter.emit('showToast', {
        message: `Overdue reminder sent to ${invoice.tenant_name || 'Tenant'}!`,
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

  if (loading && (!accounts || accounts.length === 0)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Syncing Penalty Records...</Text>
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
          <Text style={styles.title}>Penalties</Text>
          <Text style={styles.subtitle}>Review overdue accounts and applicable penalties.</Text>
        </View>

        {/* Penalty / Billing Rules Settings Button */}
        <TouchableOpacity
          style={styles.headerSettingsBtn}
          onPress={() => router.push('/(landlord)/payment-settings')}
          activeOpacity={0.75}
          accessibilityLabel="Penalty Settings"
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
            onRefresh={onRefresh}
            tintColor="#10B981"
          />
        }
      >
        {/* ================= ERROR STATE ================= */}
        {error && (!accounts || accounts.length === 0) ? (
          <View style={styles.errorStateBox}>
            <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
            <Text style={styles.errorStateTitle}>Unable to load penalty information</Text>
            <Text style={styles.emptyStateSub}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadData} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ================= UNIFIED EXECUTIVE SUMMARY CARD ================= */}
        <View style={styles.summaryCard}>
          {/* Card Top Title Bar */}
          <View style={styles.summaryCardHeader}>
            <View style={styles.summaryCardTitleWrap}>
              <Ionicons name="stats-chart" size={13} color="#38BDF8" />
              <Text style={styles.summaryCardTitle}>Penalty & Overdue Overview</Text>
            </View>
            <View
              style={[
                styles.summaryStatusBadge,
                accounts.length === 0 ? styles.statusBadgeSuccess : styles.statusBadgeDanger,
              ]}
            >
              <View
                style={[
                  styles.statusBadgeDot,
                  { backgroundColor: accounts.length === 0 ? '#10B981' : '#EF4444' },
                ]}
              />
              <Text
                style={[
                  styles.summaryStatusText,
                  { color: accounts.length === 0 ? '#10B981' : '#EF4444' },
                ]}
              >
                {accounts.length === 0 ? 'All Settled' : `${accounts.length} Active`}
              </Text>
            </View>
          </View>

          {/* Top Row: Units & Invoices */}
          <View style={styles.summaryRow}>
            {/* Metric 1: Overdue Units */}
            <View style={styles.summaryCol}>
              <View style={styles.metricLabelRow}>
                <Ionicons name="business-outline" size={12} color="#EF4444" />
                <Text style={styles.metricLabel}>Overdue Units</Text>
              </View>
              <Text style={[styles.metricMainValue, { color: '#EF4444' }]}>
                {uniqueOverdueRoomsCount}
              </Text>
              <Text style={styles.metricHint}>Rooms with late fees</Text>
            </View>

            {/* Vertical Divider */}
            <View style={styles.summaryColDivider} />

            {/* Metric 2: Overdue Invoices */}
            <View style={[styles.summaryCol, styles.summaryColRight]}>
              <View style={styles.metricLabelRow}>
                <Ionicons name="document-text-outline" size={12} color="#F59E0B" />
                <Text style={styles.metricLabel}>Overdue Invoices</Text>
              </View>
              <Text style={[styles.metricMainValue, { color: '#F59E0B' }]}>
                {accounts.length}
              </Text>
              <Text style={styles.metricHint}>Unsettled cycles</Text>
            </View>
          </View>

          {/* Horizontal Divider */}
          <View style={styles.summaryRowDivider} />

          {/* Bottom Row: Total Penalties & Total Outstanding */}
          <View style={styles.summaryRow}>
            {/* Metric 3: Total Penalties */}
            <View style={styles.summaryCol}>
              <View style={styles.metricLabelRow}>
                <Ionicons name="warning-outline" size={12} color="#F59E0B" />
                <Text style={styles.metricLabel}>Total Penalties</Text>
              </View>
              <Text style={[styles.metricAmountValue, { color: '#F59E0B' }]} numberOfLines={1}>
                {formatCurrency(analytics.totalActivePenalties)}
              </Text>
              <Text style={styles.metricHint}>Accrued late fees</Text>
            </View>

            {/* Vertical Divider */}
            <View style={styles.summaryColDivider} />

            {/* Metric 4: Total Outstanding */}
            <View style={[styles.summaryCol, styles.summaryColRight]}>
              <View style={styles.metricLabelRow}>
                <Ionicons name="wallet-outline" size={12} color="#38BDF8" />
                <Text style={styles.metricLabel}>Total Outstanding</Text>
              </View>
              <Text style={[styles.metricAmountValue, { color: '#38BDF8' }]} numberOfLines={1}>
                {formatCurrency(analytics.totalOutstandingBalance)}
              </Text>
              <Text style={styles.metricHint}>Principal + penalties</Text>
            </View>
          </View>
        </View>

        {/* ================= SEARCH BAR ================= */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={17} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tenant, room, invoice..."
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

        {/* ================= FILTER SEGMENTED TABS ================= */}
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
              All Overdue
            </Text>
            <View style={[styles.filterTabBadge, activeFilter === 'ALL' && styles.filterTabBadgeActive]}>
              <Text style={[styles.filterTabBadgeText, activeFilter === 'ALL' && styles.filterTabBadgeTextActive]}>
                {accounts.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* CRITICAL (7+ DAYS) */}
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'CRITICAL' && styles.filterTabActive]}
            onPress={() => setActiveFilter('CRITICAL')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, activeFilter === 'CRITICAL' && styles.filterTabTextActive]}>
              Critical (7+ Days)
            </Text>
            <View style={[styles.filterTabBadge, activeFilter === 'CRITICAL' && styles.filterTabBadgeActive]}>
              <Text style={[styles.filterTabBadgeText, activeFilter === 'CRITICAL' && styles.filterTabBadgeTextActive]}>
                {criticalCount}
              </Text>
            </View>
          </TouchableOpacity>

          {/* RECENT (1-3 DAYS) */}
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'RECENT' && styles.filterTabActive]}
            onPress={() => setActiveFilter('RECENT')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, activeFilter === 'RECENT' && styles.filterTabTextActive]}>
              Recent (&lt; 7 Days)
            </Text>
            <View style={[styles.filterTabBadge, activeFilter === 'RECENT' && styles.filterTabBadgeActive]}>
              <Text style={[styles.filterTabBadgeText, activeFilter === 'RECENT' && styles.filterTabBadgeTextActive]}>
                {recentCount}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* ================= OVERDUE ACCOUNTS LIST ================= */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Overdue Accounts ({filteredInvoices.length})
          </Text>
          {filteredInvoices.length > 0 && (
            <Text style={styles.sectionBadge}>Action Required</Text>
          )}
        </View>

        {filteredInvoices.length === 0 ? (
          <View style={styles.emptyStateBox}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#10B981" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No matching overdue accounts' : 'All Accounts Up to Date!'}
            </Text>
            <Text style={styles.emptyStateSub}>
              {searchQuery
                ? 'Try adjusting your search criteria or switching the filter tab.'
                : 'No overdue accounts or active late penalties across all registered rooms.'}
            </Text>
          </View>
        ) : (
          groupedAccounts.map((group, groupIdx) => {
            const isMultiInvoice = group.invoices.length > 1;
            const roomLabel = String(group.roomId).toLowerCase().startsWith('room')
              ? group.roomId
              : `Room ${group.roomId}`;

            return (
              <View key={`group-${group.roomId}-${groupIdx}`} style={styles.accountGroupCard}>
                {/* Account Header */}
                <View style={styles.accountGroupHeader}>
                  <View style={styles.accountGroupHeaderLeft}>
                    <View style={styles.roomPill}>
                      <Ionicons name="business-outline" size={12} color="#38BDF8" />
                      <Text style={styles.roomPillText}>{roomLabel}</Text>
                    </View>
                    <Text style={styles.tenantName} numberOfLines={1}>
                      {group.tenantName}
                    </Text>
                  </View>

                  <View style={styles.lateBadge}>
                    <Ionicons name="alert-circle-outline" size={12} color="#EF4444" />
                    <Text style={styles.lateBadgeText}>
                      {group.maxDaysOverdue} {group.maxDaysOverdue === 1 ? 'Day' : 'Days'} Late
                    </Text>
                  </View>
                </View>

                {/* Multi-invoice Banner when more than 1 overdue bill exists for this tenant/room */}
                {isMultiInvoice && (
                  <View style={styles.multiGroupBanner}>
                    <Text style={styles.multiGroupBannerLabel}>
                      {group.invoices.length} Overdue Invoices · Combined Balance:
                    </Text>
                    <Text style={styles.multiGroupBannerValue}>
                      {formatCurrency(group.totalCombinedOutstanding)}
                    </Text>
                  </View>
                )}

                {/* Individual Invoices (Kept strictly separated, never merging their penalty bases) */}
                {group.invoices.map((inv) => {
                  const invDaysLate = parseInt(inv.days_overdue || 0);
                  const invOriginal = parseFloat(inv.original_balance || 0);
                  const invPenalty = parseFloat(inv.penalty_amount || 0);
                  const invTotal = parseFloat(inv.total_amount_due || 0);
                  const isReminding = remindingId === inv.id;

                  return (
                    <View key={`inv-${inv.id}`} style={styles.invoiceItemCard}>
                      {/* Sub-card Header */}
                      <View style={styles.invoiceItemHeader}>
                        <Text style={styles.invoiceTag}>
                          Invoice #{inv.invoice_number || inv.id}
                        </Text>
                        <Text style={styles.dueDateText}>
                          Due: {formatDate(inv.due_date)} {isMultiInvoice ? `· ${invDaysLate}d Late` : ''}
                        </Text>
                      </View>

                      {/* 3-Column Financial Breakdown */}
                      <View style={styles.invoiceBreakdownRow}>
                        <View style={styles.breakdownCol}>
                          <Text style={styles.breakdownLabel}>Original Bill</Text>
                          <Text style={styles.breakdownValue}>{formatCurrency(invOriginal)}</Text>
                        </View>

                        <View style={styles.breakdownColCenter}>
                          <Text style={styles.breakdownLabel}>Late Penalty</Text>
                          <Text style={styles.breakdownPenaltyValue}>
                            +{formatCurrency(invPenalty)}
                          </Text>
                        </View>

                        <View style={styles.breakdownColRight}>
                          <Text style={[styles.breakdownLabel, { color: '#EF4444' }]}>Total Due</Text>
                          <Text style={styles.breakdownTotalValue}>{formatCurrency(invTotal)}</Text>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          style={styles.detailsBtn}
                          onPress={() => setSelectedInvoice(inv)}
                          activeOpacity={0.8}
                          accessibilityLabel="View Invoice Details"
                        >
                          <Ionicons name="receipt-outline" size={13} color="#38BDF8" />
                          <Text style={styles.detailsBtnText}>View Details</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.remindBtn}
                          onPress={() => handleSendReminder(inv)}
                          disabled={isReminding}
                          activeOpacity={0.8}
                          accessibilityLabel="Send Payment Reminder"
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
                })}
              </View>
            );
          })
        )}

        {/* ================= PENALTY ACTIVITY TIMELINE ================= */}
        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <View style={styles.activityHeaderTitleRow}>
              <Ionicons name="time-outline" size={13} color="#F59E0B" />
              <Text style={styles.activityHeaderTitle}>Penalty Activity Log</Text>
            </View>
            {activity.length > 5 && (
              <TouchableOpacity
                style={styles.activityHeaderMoreBtn}
                onPress={() => setShowAllActivity(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.activityHeaderMoreText}>View All ({activity.length})</Text>
              </TouchableOpacity>
            )}
          </View>

          {activity.length === 0 ? (
            <View style={{ paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ color: '#64748B', fontSize: 12 }}>No recent penalty accruals recorded.</Text>
            </View>
          ) : (
            activity.slice(0, 5).map((act, idx) => {
              const isLast = idx === Math.min(activity.length, 5) - 1;
              const roomStr = String(act.room_id).toLowerCase().startsWith('room')
                ? act.room_id
                : `Room ${act.room_id}`;
              const days = parseInt(act.days_overdue || 1);

              return (
                <View
                  key={`act-${act.id}-${idx}`}
                  style={[styles.activityRow, isLast && styles.activityRowLast]}
                >
                  <View style={styles.activityDot} />
                  <View style={styles.activityInfo}>
                    <View style={styles.activityTenantRow}>
                      <Text style={styles.activityTenant}>{act.tenant_name || 'Tenant'}</Text>
                      <Text style={[styles.roomPillText, { fontSize: 10 }]}>· {roomStr}</Text>
                    </View>
                    <Text style={styles.activityMeta} numberOfLines={1}>
                      {act.invoice_number ? `Inv #${act.invoice_number} · ` : ''}
                      {days} {days === 1 ? 'day' : 'days'} overdue · {formatDate(act.penalty_date || act.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.activityAmount}>
                    +{formatCurrency(parseFloat(act.penalty_amount || 0))}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ================= INVOICE DETAILS MODAL ================= */}
      <Modal
        visible={!!selectedInvoice}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedInvoice(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Overdue Invoice Audit</Text>
              <TouchableOpacity
                onPress={() => setSelectedInvoice(null)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {selectedInvoice && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Tenant Card */}
                <View style={styles.modalTenantCard}>
                  <View style={styles.modalAvatarCircle}>
                    <Text style={styles.modalAvatarText}>
                      {(selectedInvoice.tenant_name || 'T').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.modalTenantInfo}>
                    <Text style={styles.modalTenantName}>
                      {selectedInvoice.tenant_name || 'Tenant'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <View style={styles.roomPill}>
                        <Text style={styles.roomPillText}>
                          {String(selectedInvoice.room_id).toLowerCase().startsWith('room')
                            ? selectedInvoice.room_id
                            : `Room ${selectedInvoice.room_id}`}
                        </Text>
                      </View>
                      <View style={styles.lateBadge}>
                        <Text style={styles.lateBadgeText}>
                          {selectedInvoice.days_overdue} {selectedInvoice.days_overdue === 1 ? 'Day' : 'Days'} Late
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Audit Breakdown Card */}
                <View style={styles.modalAuditCard}>
                  <Text style={styles.modalAuditTitle}>ITEMIZED CHARGES AUDIT</Text>

                  <View style={styles.modalAuditRow}>
                    <Text style={styles.modalAuditLabel}>Invoice Number</Text>
                    <Text style={styles.modalAuditValue}>
                      #{selectedInvoice.invoice_number || selectedInvoice.id}
                    </Text>
                  </View>

                  <View style={styles.modalAuditRow}>
                    <Text style={styles.modalAuditLabel}>Due Date</Text>
                    <Text style={styles.modalAuditValue}>
                      {formatDate(selectedInvoice.due_date)}
                    </Text>
                  </View>

                  <View style={styles.modalAuditRow}>
                    <Text style={styles.modalAuditLabel}>Billing Cycle ID</Text>
                    <Text style={styles.modalAuditValue}>
                      Cycle #{selectedInvoice.id}
                    </Text>
                  </View>

                  <View style={styles.modalAuditRow}>
                    <Text style={styles.modalAuditLabel}>Original Bill Balance</Text>
                    <Text style={styles.modalAuditValue}>
                      {formatCurrency(selectedInvoice.original_balance)}
                    </Text>
                  </View>

                  <View style={styles.modalAuditRow}>
                    <Text style={styles.modalAuditLabel}>Applicable Late Penalty</Text>
                    <Text style={[styles.modalAuditValue, { color: '#F59E0B' }]}>
                      +{formatCurrency(selectedInvoice.penalty_amount)}
                    </Text>
                  </View>

                  {parseFloat(selectedInvoice.previous_balance || 0) > 0 && (
                    <View style={styles.modalAuditRow}>
                      <Text style={styles.modalAuditLabel}>Previous Carryover Balance</Text>
                      <Text style={[styles.modalAuditValue, { color: '#38BDF8' }]}>
                        {formatCurrency(selectedInvoice.previous_balance)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.modalAuditTotalRow}>
                    <Text style={styles.modalAuditTotalLabel}>Net Outstanding Due</Text>
                    <Text style={styles.modalAuditTotalValue}>
                      {formatCurrency(selectedInvoice.total_amount_due)}
                    </Text>
                  </View>
                </View>

                {/* Modal Action Buttons */}
                <TouchableOpacity
                  style={styles.modalActionBtn}
                  onPress={() => {
                    handleSendReminder(selectedInvoice);
                    setSelectedInvoice(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="notifications-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.modalActionBtnText}>Send Payment Reminder</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= ALL ACTIVITY MODAL ================= */}
      <Modal
        visible={showAllActivity}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAllActivity(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Penalty Activity History</Text>
              <TouchableOpacity
                onPress={() => setShowAllActivity(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {activity.map((act, idx) => {
                const roomStr = String(act.room_id).toLowerCase().startsWith('room')
                  ? act.room_id
                  : `Room ${act.room_id}`;
                const days = parseInt(act.days_overdue || 1);
                const isLast = idx === activity.length - 1;

                return (
                  <View
                    key={`all-act-${act.id}-${idx}`}
                    style={[styles.activityRow, isLast && styles.activityRowLast]}
                  >
                    <View style={styles.activityDot} />
                    <View style={styles.activityInfo}>
                      <View style={styles.activityTenantRow}>
                        <Text style={styles.activityTenant}>{act.tenant_name || 'Tenant'}</Text>
                        <Text style={[styles.roomPillText, { fontSize: 10 }]}>· {roomStr}</Text>
                      </View>
                      <Text style={styles.activityMeta}>
                        {act.invoice_number ? `Inv #${act.invoice_number} · ` : ''}
                        {days} {days === 1 ? 'day' : 'days'} overdue · {formatDate(act.penalty_date || act.created_at)}
                      </Text>
                    </View>
                    <Text style={styles.activityAmount}>
                      +{formatCurrency(parseFloat(act.penalty_amount || 0))}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
