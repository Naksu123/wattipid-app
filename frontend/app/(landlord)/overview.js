import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { useSync } from '../../contexts/SyncContext';
import { getLiveOverview } from '../../services/database';
import { COLORS } from '../../styles/theme';
import styles from '../../styles/landlord/overview.styles';

const LANDLORD_OVERVIEW_CACHE_KEY = '@cached_landlord_overview';

export default function OverviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { landlordSyncData, unreadCount } = useSync();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeActionPage, setActiveActionPage] = useState(0);
  const actionScrollRef = useRef(null);

  const screenWidth = Dimensions.get('window').width;
  const pageWidth = screenWidth - 32;

  const actionPages = useMemo(() => [
    [
      {
        id: 'add-room',
        title: 'Add Room',
        desc: 'Assign a new unit',
        icon: 'business-outline',
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.12)',
        onPress: () => router.push('/(landlord)/rooms'),
      },
      {
        id: 'verify-payment',
        title: 'Verify Payment',
        desc: 'Confirm latest deposit',
        icon: 'wallet-outline',
        color: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.12)',
        onPress: () => router.push('/(landlord)/payments'),
      },
    ],
    [
      {
        id: 'set-tariff',
        title: 'Set Tariff',
        desc: 'Update pricing rules',
        icon: 'flash-outline',
        color: '#38BDF8',
        bgColor: 'rgba(56, 189, 248, 0.12)',
        onPress: () => router.push('/(landlord)/settings'),
      },
      {
        id: 'view-reports',
        title: 'View Reports',
        desc: 'Export usage insights',
        icon: 'stats-chart-outline',
        color: '#A855F7',
        bgColor: 'rgba(168, 85, 247, 0.12)',
        onPress: () => router.push('/(landlord)/audit'),
      },
    ],
    [
      {
        id: 'manage-tips',
        title: 'Manage Tips',
        desc: 'Curate dorm advice',
        icon: 'bulb-outline',
        color: '#10B981',
        bgColor: 'rgba(16, 185, 129, 0.12)',
        onPress: () => router.push('/(landlord)/manage-tips'),
      },
      {
        id: 'system-audit',
        title: 'Audit Logs',
        desc: 'Compliance records',
        icon: 'shield-checkmark-outline',
        color: '#6366F1',
        bgColor: 'rgba(99, 102, 241, 0.12)',
        onPress: () => router.push('/(landlord)/audit'),
      },
    ],
  ], [router]);

  const loadLiveOverview = useCallback(async () => {
    try {
      const result = await getLiveOverview();
      if (result) {
        setData(result);
        AsyncStorage.setItem(LANDLORD_OVERVIEW_CACHE_KEY, JSON.stringify(result)).catch(() => {});
      }
    } catch (err) {
      console.error('[loadLiveOverview] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Stale-While-Revalidate: Instant render from cache + background revalidation
  useEffect(() => {
    let isMounted = true;
    const initOverview = async () => {
      try {
        const cached = await AsyncStorage.getItem(LANDLORD_OVERVIEW_CACHE_KEY);
        if (cached && isMounted) {
          const parsed = JSON.parse(cached);
          if (parsed) {
            setData(parsed);
            setLoading(false); // Render UI immediately without waiting for network!
          }
        }
      } catch (cacheErr) {
        console.warn('[Overview] Cache read failed:', cacheErr);
      }
      // Revalidate in background
      loadLiveOverview();
    };

    initOverview();

    return () => {
      isMounted = false;
    };
  }, [loadLiveOverview]);

  // Smart Sync: Hook into global real-time stream
  useEffect(() => {
    if (landlordSyncData && landlordSyncData.liveOverview) {
      setData(landlordSyncData.liveOverview);
      AsyncStorage.setItem(LANDLORD_OVERVIEW_CACHE_KEY, JSON.stringify(landlordSyncData.liveOverview)).catch(() => {});
    }
  }, [landlordSyncData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLiveOverview();
    setRefreshing(false);
  };

  // Landlord initials & first name
  const initials = useMemo(() => {
    if (!user?.name) return 'LA';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  }, [user?.name]);

  const firstName = useMemo(() => {
    if (!user?.name) return 'Landlord';
    return user.name.trim().split(/\s+/)[0];
  }, [user?.name]);

  // Currency Formatter
  const formatCurrency = (val) => {
    return (
      '₱' +
      Number(val || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  // Only block screen if there is NO cached data available (e.g. brand new install)
  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Syncing Live Dashboard...</Text>
      </View>
    );
  }

  const statistics = data?.statistics || {};
  const liveElectricity = data?.liveElectricity || { todayEnergyKwh: 0, livePeakPowerW: 0 };
  const pendingPayments = data?.pendingPayments || [];
  const unpaidBills = data?.unpaidBills || [];
  const overdueCount =
    data?.penaltyAnalytics?.overdueBills ??
    unpaidBills.filter((b) => b.payment_status === 'overdue').length;

  // System Load Capacity
  const MAX_CAPACITY_W = 10000;
  const currentLoad = liveElectricity.livePeakPowerW || 0;
  const loadPct = Math.min((currentLoad / MAX_CAPACITY_W) * 100, 100);
  let loadBarColor = '#10B981';
  if (loadPct > 80) loadBarColor = '#EF4444';
  else if (loadPct > 50) loadBarColor = '#F59E0B';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ================= HEADER (Matches landlord-dashboard.png) ================= */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Avatar with Initials - Tappable to open Settings */}
          <TouchableOpacity
            style={styles.avatarCircle}
            onPress={() => router.push('/(landlord)/settings')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Profile and settings"
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.greeting} numberOfLines={1}>
              Hello, {firstName}
            </Text>
            <Text style={styles.subtitle}>Real-Time Monitoring Dashboard</Text>
          </View>
        </View>

        {/* Right Actions: Notification Bell + Settings Icon beside name */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => router.push('/(landlord)/notifications')}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="notifications-outline" size={19} color="#FFFFFF" />
            {unreadCount > 0 && <View style={styles.notifBadgeDot} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => router.push('/(landlord)/settings')}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="settings-outline" size={19} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ================= CONTENT SCROLL ================= */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* ================= 1. LIVE ELECTRICITY MONITOR ================= */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Live Electricity Monitor</Text>
            <View style={styles.syncingBadge}>
              <View style={styles.syncingDot} />
              <Text style={styles.syncingText}>SYNCING</Text>
            </View>
          </View>

          {/* Metric Boxes Row */}
          <View style={styles.monitorRow}>
            {/* Today's Usage Box */}
            <View style={styles.monitorBox}>
              <Text style={styles.monitorBoxLabel}>{"Today's Usage"}</Text>
              <Text style={styles.monitorBoxValue} numberOfLines={1}>
                {Number(liveElectricity.todayEnergyKwh || 0).toFixed(2)}{' '}
                <Text style={styles.monitorBoxUnit}>kWh</Text>
              </Text>
              <View style={styles.monitorBoxMeta}>
                <View style={styles.metaPillLive}>
                  <Text style={styles.metaPillLiveText}>LIVE</Text>
                </View>
                <Text style={styles.metaDescText} numberOfLines={1}>
                  Live sync
                </Text>
              </View>
            </View>

            {/* 5-Min Peak Load Box */}
            <View style={styles.monitorBox}>
              <Text style={styles.monitorBoxLabel}>5-Min Peak Load</Text>
              <Text style={styles.monitorBoxValue} numberOfLines={1}>
                {Number(liveElectricity.livePeakPowerW || 0).toFixed(1)}{' '}
                <Text style={styles.monitorBoxUnit}>W</Text>
              </Text>
              <View style={styles.monitorBoxMeta}>
                <View style={styles.metaPillPeak}>
                  <Text style={styles.metaPillPeakText}>PEAK</Text>
                </View>
                <Text style={styles.metaDescText} numberOfLines={1}>
                  Stable load
                </Text>
              </View>
            </View>
          </View>

          {/* System Load Capacity Bar */}
          <View style={styles.loadCapacityHeader}>
            <Text style={styles.loadCapacityTitle}>System Load Capacity</Text>
            <Text style={[styles.loadCapacityPct, { color: loadBarColor }]}>
              {loadPct.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.loadTrack}>
            <View
              style={[
                styles.loadFill,
                { width: `${Math.max(loadPct, 2)}%`, backgroundColor: loadBarColor },
              ]}
            />
          </View>
        </View>

        {/* ================= 2. TOTAL REVENUE & FINANCIAL SUMMARY ================= */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Total Revenue</Text>
            <Text style={styles.quickActionsTag}>This month</Text>
          </View>
          <Text style={styles.revenueSubtitle}>Total collected & billed</Text>
          <Text style={styles.revenueHeroValue} numberOfLines={1}>
            {formatCurrency(statistics.totalBilled || statistics.monthlyRevenue || 0)}
          </Text>

          {/* Secondary Financial / Operational Row */}
          <View style={styles.financialRow}>
            <View style={styles.financialCard}>
              <Text style={styles.financialLabel}>Tenants</Text>
              <Text style={[styles.financialValue, { color: '#38BDF8' }]} numberOfLines={1}>
                {statistics.totalTenants || 0}
              </Text>
            </View>

            <View style={styles.financialCard}>
              <Text style={styles.financialLabel}>Collected</Text>
              <Text style={[styles.financialValue, { color: '#10B981' }]} numberOfLines={1}>
                {formatCurrency(statistics.monthlyRevenue || 0)}
              </Text>
            </View>

            <View style={styles.financialCard}>
              <Text style={styles.financialLabel}>Outstanding</Text>
              <Text style={[styles.financialValue, { color: '#F59E0B' }]} numberOfLines={1}>
                {formatCurrency(statistics.outstandingRevenue || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* ================= 3. ROOM OCCUPANCY & PAYMENT ALERTS ================= */}
        <View style={styles.sectionRowHeader}>
          <Text style={styles.sectionRowTitle}>Room Occupancy</Text>
          <TouchableOpacity
            onPress={() => router.push('/(landlord)/rooms')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ fontSize: 11.5, color: '#10B981', fontWeight: '700' }}>Manage Rooms ›</Text>
          </TouchableOpacity>
        </View>

        {/* Occupancy Status Grid */}
        <View style={styles.occupancyGrid}>
          <View style={styles.occupancyBox}>
            <Text style={[styles.occupancyBoxValue, { color: '#10B981' }]}>
              {statistics.occupiedRooms || 0}
            </Text>
            <Text style={styles.occupancyBoxLabel}>Occupied</Text>
          </View>

          <View style={styles.occupancyBox}>
            <Text style={[styles.occupancyBoxValue, { color: '#38BDF8' }]}>
              {statistics.vacantRooms || 0}
            </Text>
            <Text style={styles.occupancyBoxLabel}>Available</Text>
          </View>

          <View style={styles.occupancyBox}>
            <Text style={[styles.occupancyBoxValue, { color: '#F59E0B' }]}>
              {statistics.maintenanceRooms || 0}
            </Text>
            <Text style={styles.occupancyBoxLabel}>Maintenance</Text>
          </View>

          <View style={styles.occupancyBox}>
            <Text style={[styles.occupancyBoxValue, { color: '#FFFFFF' }]}>
              {statistics.totalRooms || 0}
            </Text>
            <Text style={styles.occupancyBoxLabel}>Total Units</Text>
          </View>
        </View>

        {/* Payment Action Alerts */}
        {(pendingPayments.length > 0 || overdueCount > 0) && (
          <View style={styles.paymentAlertsCard}>
            {pendingPayments.length > 0 && (
              <TouchableOpacity
                style={styles.alertItem}
                onPress={() => router.push('/(landlord)/payments')}
                activeOpacity={0.75}
              >
                <View style={styles.alertItemLeft}>
                  <View style={[styles.alertIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                    <Ionicons name="receipt-outline" size={17} color="#F59E0B" />
                  </View>
                  <View>
                    <Text style={styles.alertTitle}>Pending Verifications</Text>
                    <Text style={styles.alertSubtitle}>Awaiting landlord confirmation</Text>
                  </View>
                </View>
                <View style={[styles.alertPill, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                  <Text style={[styles.alertPillText, { color: '#F59E0B' }]}>
                    {pendingPayments.length} pending
                  </Text>
                  <Ionicons name="chevron-forward" size={12} color="#F59E0B" />
                </View>
              </TouchableOpacity>
            )}

            {overdueCount > 0 && (
              <TouchableOpacity
                style={styles.alertItem}
                onPress={() => router.push('/(landlord)/penalties')}
                activeOpacity={0.75}
              >
                <View style={styles.alertItemLeft}>
                  <View style={[styles.alertIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                    <Ionicons name="warning-outline" size={17} color="#EF4444" />
                  </View>
                  <View>
                    <Text style={styles.alertTitle}>Overdue Accounts</Text>
                    <Text style={styles.alertSubtitle}>Unsettled past due date</Text>
                  </View>
                </View>
                <View style={[styles.alertPill, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <Text style={[styles.alertPillText, { color: '#EF4444' }]}>
                    {overdueCount} overdue
                  </Text>
                  <Ionicons name="chevron-forward" size={12} color="#EF4444" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ================= 4. QUICK ACTIONS (Sliding Pagination Carousel like Tips) ================= */}
        <View style={styles.quickActionsHeader}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <Text style={styles.quickActionsTag}>Slide to browse</Text>
        </View>

        <ScrollView
          ref={actionScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={pageWidth + 12}
          snapToAlignment="start"
          contentContainerStyle={{ gap: 12 }}
          onScroll={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / (pageWidth + 12));
            setActiveActionPage(Math.min(actionPages.length - 1, Math.max(0, idx)));
          }}
          scrollEventThrottle={32}
        >
          {actionPages.map((page, pageIdx) => (
            <View key={pageIdx} style={[styles.quickActionPage, { width: pageWidth }]}>
              {page.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.quickActionCard}
                  onPress={action.onPress}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={action.title}
                >
                  <View style={[styles.quickActionIconBox, { backgroundColor: action.bgColor }]}>
                    <Ionicons name={action.icon} size={22} color={action.color} />
                  </View>
                  <Text style={styles.quickActionTitle}>{action.title}</Text>
                  <Text style={styles.quickActionDesc}>{action.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>

        {/* Carousel Dot Indicators (Matches Tips carousel) */}
        <View style={styles.carouselIndicators}>
          {actionPages.map((_, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => {
                actionScrollRef.current?.scrollTo({ x: idx * (pageWidth + 12), animated: true });
                setActiveActionPage(idx);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel={`Quick actions page ${idx + 1}`}
            >
              <View
                style={[
                  styles.carouselDot,
                  activeActionPage === idx && styles.carouselDotActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
