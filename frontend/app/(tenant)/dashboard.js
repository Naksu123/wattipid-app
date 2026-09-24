import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCopilot, CopilotStep, walkthroughable } from 'react-native-copilot';
import { useTourAutoStart, useTourContext } from '@/contexts/TourContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/contexts/SyncContext';
import PowerGauge from '../../components/ui/PowerGauge';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import { COLORS, SPACING } from '@/styles/theme';
import ms from '@/styles/tenant/dashboard.styles';
import apiClient from '../../services/apiClient';
import { getBillingCycle, getPaymentInsights, getHourlyBreakdown } from '../../services/database';
import { getNotificationHistory, createFrontendAlert } from '../../services/notificationApi';
import { tipsService } from '../../services/tipsService';
import { detectHighConsumptionSync } from '../../services/tipsEngine';
import { useNotification } from '@/contexts/NotificationContext';
import { useConsumption } from '@/contexts/ConsumptionContext';
import Svg, { Path, Line, Circle as SvgCircle } from 'react-native-svg';

const getTenantDashboardCacheKey = (rId) => `@cached_tenant_dashboard_${rId}`;

let globalLastAlertKey = null;
let globalLastTipKey = null;
let globalTipDismissed = false;

const CopilotView = walkthroughable(View);

export default function DashboardScreen() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [lastAlertKey, setLastAlertKeyState] = useState(globalLastAlertKey);
  const [lastTipKey, setLastTipKeyState] = useState(globalLastTipKey);
  const setLastAlertKey = (key) => { globalLastAlertKey = key; setLastAlertKeyState(key); };
  const setLastTipKey = (key) => { globalLastTipKey = key; setLastTipKeyState(key); };
  const [smartTip, setSmartTip] = useState(null);
  const [randomTip, setRandomTip] = useState(null);
  const [tipDismissed, setTipDismissedState] = useState(globalTipDismissed);
  const setTipDismissed = (val) => { globalTipDismissed = val; setTipDismissedState(val); };
  
  const { data, deviceOnline, lastSeen, rate, todayUsage, weekUsage, monthUsage, comparison, todayUsageRef, monthUsageRef, fetchStaticConsumption } = useConsumption();
  
  const [relayOn, setRelayOn] = useState(true);
  const [budget, setBudgetData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [debugVisible, setDebugVisible] = useState(false);
  const lastNotifyTime = useRef(0);

  const roomId = user?.room_id || 'Room 1';

  const { globalRefreshTick, unreadCount: globalUnreadCount, isOnline } = useSync();
  const { showBanner } = useNotification();
  const [billingCycle, setBillingCycle] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0); 
  const [paymentInsights, setPaymentInsights] = useState(null);
  const [activities, setActivities] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [breakdownExpanded, setBreakdownExpanded] = useState(false);

  // Copilot Tour & First-Time Onboarding
  const scrollViewRef = useRef(null);
  const { currentTourScreen, checkAndPromptOnboarding } = useTourContext();
  useTourAutoStart('dashboard', !loading, scrollViewRef);

  useEffect(() => {
    if (user?.id && user?.role === 'tenant' && !loading) {
      checkAndPromptOnboarding(user);
    }
  }, [user, loading, checkAndPromptOnboarding]);

  // Live Pulse Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, [pulseAnim]);

  const lastFetchTimeRef = useRef(0);
  const isFetchingRef = useRef(false);

  // Stale-While-Revalidate: Load cached dashboard state immediately on mount
  useEffect(() => {
    let isMounted = true;
    const loadCachedDashboard = async () => {
      if (!roomId) return;
      try {
        const cachedStr = await AsyncStorage.getItem(getTenantDashboardCacheKey(roomId));
        if (cachedStr && isMounted) {
          const cached = JSON.parse(cachedStr);
          if (cached) {
            if (cached.billingCycle) setBillingCycle(cached.billingCycle);
            if (cached.budget) setBudgetData(cached.budget);
            if (cached.paymentInsights) setPaymentInsights(cached.paymentInsights);
            if (cached.activities) setActivities(cached.activities);
            if (cached.randomTip) setRandomTip(cached.randomTip);
            if (cached.hourlyData) setHourlyData(cached.hourlyData);
            setLoading(false); // Render immediately from cache!
          }
        }
      } catch (cacheErr) {
        console.warn('[Dashboard] Cache read failed:', cacheErr);
      }
    };

    loadCachedDashboard();
    return () => {
      isMounted = false;
    };
  }, [roomId]);

  const fetchStaticData = useCallback(async (isManualRefresh = false) => {
    if (!roomId) return null;
    const now = Date.now();
    if (!isManualRefresh && (isFetchingRef.current || now - lastFetchTimeRef.current < 2500)) {
      return null;
    }

    try {
      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;

      // Parallelize all independent read requests to avoid sequential 8-roundtrip latency
      const [
        ,
        cycleRes,
        cyclesRes,
        insightsRes,
        notifsRes,
        tipRes,
        hourlyRes
      ] = await Promise.allSettled([
        fetchStaticConsumption(),
        getBillingCycle(roomId),
        apiClient.post('/api.php', { action: 'getAvailableBillingCycles', roomId }),
        getPaymentInsights(roomId),
        getNotificationHistory(null, 10),
        tipsService.getSmartRecommendation(),
        getHourlyBreakdown(roomId)
      ]);

      let cycleData = null;
      if (cycleRes.status === 'fulfilled' && cycleRes.value) {
        cycleData = cycleRes.value;
        if (cycleData.budget) {
          setBudgetData(cycleData.budget);
        }
      }

      let latestInvoice = null;
      if (cyclesRes.status === 'fulfilled' && cyclesRes.value?.data?.success) {
        const cycles = cyclesRes.value.data.data;
        if (Array.isArray(cycles) && cycles.length > 0) {
          const unpaidInvoices = cycles.filter(c => c.status === 'completed' && ['unpaid', 'pending_verification', 'overdue', 'partially_paid'].includes(c.payment_status));
          latestInvoice = unpaidInvoices.length > 0 ? unpaidInvoices[unpaidInvoices.length - 1] : null;
          if (!latestInvoice) {
            latestInvoice = cycles.find(c => c.status === 'completed') || cycles[0];
          }
          setBillingCycle(latestInvoice);
          if (cycleData?.budget) {
            setBudgetData(cycleData.budget);
          }
        }
      }

      let freshInsights = null;
      if (insightsRes.status === 'fulfilled' && insightsRes.value?.success) {
        freshInsights = insightsRes.value.data;
        setPaymentInsights(freshInsights);
      }

      let freshActivities = null;
      if (notifsRes.status === 'fulfilled' && notifsRes.value) {
        freshActivities = notifsRes.value.slice(0, 3);
        setActivities(freshActivities);
      }

      let freshTip = null;
      if (tipRes.status === 'fulfilled' && tipRes.value?.success && tipRes.value.data) {
        freshTip = tipRes.value.data;
        setRandomTip(freshTip);
      }

      let freshHourly = null;
      if (hourlyRes.status === 'fulfilled' && Array.isArray(hourlyRes.value)) {
        freshHourly = hourlyRes.value;
        setHourlyData(freshHourly);
      }

      // Persist fresh data into cache for next instant launch
      const cachePayload = {
        billingCycle: latestInvoice || undefined,
        budget: cycleData?.budget || undefined,
        paymentInsights: freshInsights || undefined,
        activities: freshActivities || undefined,
        randomTip: freshTip || undefined,
        hourlyData: freshHourly || undefined,
      };
      AsyncStorage.setItem(getTenantDashboardCacheKey(roomId), JSON.stringify(cachePayload)).catch(() => {});

      return true;
    } catch (err) {
      console.warn('[Dashboard] fetchStaticData error:', err);
      return null;
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [roomId, fetchStaticConsumption]);

  // Sync Global Refresh (debounced by fetchStaticData)
  useEffect(() => {
    if (globalRefreshTick > 0) {
      fetchStaticData();
    }
  }, [globalRefreshTick, fetchStaticData]);

  useEffect(() => {
    setUnreadCount(globalUnreadCount);
  }, [globalUnreadCount]);

  const budgetRef = useRef(budget);
  const lastAlertKeyRef = useRef(lastAlertKey);
  const lastTipKeyRef = useRef(lastTipKey);

  useEffect(() => {
    budgetRef.current = budget;
    lastAlertKeyRef.current = lastAlertKey;
    lastTipKeyRef.current = lastTipKey;
  }, [budget, lastAlertKey, lastTipKey]);


  // Watch the global consumption sensor data and trigger tips/alerts locally
  useEffect(() => {
    if (!deviceOnline) {
      setSmartTip(null);
      return;
    }
    
    // Generate smart tips from REAL, validated data
    const tip = getSmartPopupTip(data.power, todayUsageRef.current?.totalCost || 0, budgetRef.current);
    setSmartTip(tip);

    if (tip && (tip.color === COLORS.danger || tip.color === COLORS.warning)) {
      const tipAlertKey = `tip-${tip.title}`;
      if (tipAlertKey !== lastTipKeyRef.current) {
        showBanner(tip.title, tip.message, tip.color === COLORS.danger ? 'critical' : 'warning', { route: '/(tenant)/analytics' });
        createFrontendAlert(roomId, 'smart_tip', 'consumption', tip.color === COLORS.danger ? 'critical' : 'warning', tip.title, tip.message, { route: '/(tenant)/analytics' });
        setLastTipKey(tipAlertKey);
      }
    }

    // High consumption alert check
    if (data.power > 0) {
      const alert = detectHighConsumptionSync(data.power, budgetRef.current, todayUsageRef.current, monthUsageRef.current);
      if (alert) {
        const alertKey = `${alert.title}-${alert.type}`;
        if (alertKey !== lastAlertKeyRef.current) {
          showBanner(alert.title, alert.message, alert.type === 'danger' ? 'critical' : 'warning', { route: '/(tenant)/analytics' });
          createFrontendAlert(roomId, 'high_consumption', 'consumption', alert.type === 'danger' ? 'critical' : 'warning', alert.title, alert.message, { route: '/(tenant)/analytics' });
          setLastAlertKey(alertKey);

          const now = Date.now();
          if (now - lastNotifyTime.current > 300000) {
            lastNotifyTime.current = now;
          }
        }
      } else {
        if (lastAlertKeyRef.current !== null) {
          setLastAlertKey(null);
        }
      }
    }
  }, [data.power, deviceOnline, roomId, showBanner]);

  useEffect(() => {
    if (!isFocused || !isAuthenticated) return;
    // 1. Initial fetch of static dashboard non-consumption data
    fetchStaticData();
  }, [isFocused, isAuthenticated, fetchStaticData]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTipDismissed(false);
    await fetchStaticData(true);
    setRefreshing(false);
  };

  // Calculate dynamic cost based on exact energy and rate to ensure matching between apps
  const enforcedRate = rate || 12.50;
  const totalEnergyKwh = Number(monthUsage?.totalEnergy || 0);

  // Authoritative electricity charge for the current billing cycle
  const electricityCharge = Number(
    monthUsage?.electricityCharge !== undefined && monthUsage?.electricityCharge !== null
      ? monthUsage.electricityCharge
      : (monthUsage?.totalCost !== undefined && monthUsage?.totalCost !== null ? monthUsage.totalCost : totalEnergyKwh * enforcedRate)
  );

  // Current cycle charges only (Previous balance/billing is kept strictly separate)
  const monthlyRent = Number(
    monthUsage?.monthlyRent !== undefined && Number(monthUsage.monthlyRent) > 0
      ? monthUsage.monthlyRent
      : (billingCycle?.monthly_rent !== undefined ? billingCycle.monthly_rent : 0)
  );

  const additionalCharges = Number(
    monthUsage?.additionalCharges !== undefined && Number(monthUsage.additionalCharges) > 0
      ? monthUsage.additionalCharges
      : (billingCycle?.additional_charges !== undefined ? billingCycle.additional_charges : 0)
  );

  const discounts = Number(
    monthUsage?.discounts !== undefined && Number(monthUsage.discounts) > 0
      ? monthUsage.discounts
      : (billingCycle?.discounts !== undefined ? billingCycle.discounts : 0)
  );

  // Current Cycle Cost ONLY reflects the current billing period (penalty only appears in Payment)
  const currentCycleTotal = Math.max(0, electricityCharge + monthlyRent + additionalCharges - discounts);
  let invoiceAmountDue = currentCycleTotal;
  let isShowingPreviousInvoice = false;


  const budgetPct = budget && budget.daily_allowance > 0 ? (todayUsage.totalCost / budget.daily_allowance) * 100 : 0;

  // GHOST FIX: Use our tracked deviceOnline state instead of guessing from lastSeen
  const offline = !deviceOnline || !isOnline;
  
  // Budget animation
  const animatedBudgetPct = useRef(new Animated.Value(budgetPct)).current;
  useEffect(() => {
    Animated.timing(animatedBudgetPct, {
      toValue: budgetPct,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false // Width animation
    }).start();
  }, [budgetPct, animatedBudgetPct]);

  // Calculate due date data if applicable
  const dueDateStr = billingCycle?.due_date;
  const paymentStatus = billingCycle?.payment_status;
  let daysUntilDue = null;
  if (dueDateStr && (paymentStatus === 'unpaid' || paymentStatus === 'overdue')) {
    const dueDate = new Date(dueDateStr);
    const now = new Date();
    // Reset time part for accurate day difference
    dueDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    daysUntilDue = Math.round((dueDate - now) / 86400000);
  }

  // Tenant Avatar Initials & Clean Room label (no icons, no duplicate room name, no floor/property)
  const getInitials = (fullName) => {
    if (!fullName) return 'AC';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  const tenantInitials = getInitials(user?.name || user?.username || 'Alex Cruz');
  const firstName = (user?.name || user?.username || 'Alex').trim().split(/\s+/)[0];

  const formatRoomOnly = (raw) => {
    if (!raw) return 'Room 1';
    let str = String(raw).trim();
    // Remove floor or property suffixes if present (e.g. "Room 3B - Floor 2" -> "Room 3B")
    str = str.replace(/\s*[-–—|•].*$/, '');
    // Ensure "Room " is prefixed once and not duplicated
    if (/^room\b/i.test(str)) {
      return str;
    }
    return `Room ${str}`;
  };
  const roomLabel = formatRoomOnly(user?.room_name || user?.room_id || roomId);

  // Actual IoT readings only for Today's Wattage Trend (strictly no simulated/fake/interpolated data)
  const {
    chartWidth,
    chartHeight,
    padX,
    padY,
    plotHeight,
    coords,
    hasActualSensorData,
    segmentPaths,
  } = useMemo(() => {
    const validHourlyPoints = Array.isArray(hourlyData)
      ? hourlyData.filter(d => (Number(d.entries) > 0 && (Number(d.avgPower) > 0 || Number(d.peakPower) > 0)))
      : [];

    const cWidth = 320;
    const cHeight = 85;
    const pX = 14;
    const pY = 12;
    const pWidth = cWidth - pX * 2;
    const pHeight = cHeight - pY * 2;

    let pts = validHourlyPoints.map(p => {
      const hour = Math.min(Math.max(parseInt(p.hour, 10) || 0, 0), 23);
      const power = Number(p.avgPower || p.peakPower || 0);
      return { hour, power };
    });

    if (!offline && deviceOnline && data.power > 0) {
      const currentHour = new Date().getHours();
      const existingIdx = pts.findIndex(c => c.hour === currentHour);
      if (existingIdx >= 0) {
        pts[existingIdx] = { hour: currentHour, power: Number(data.power) };
      } else {
        pts.push({ hour: currentHour, power: Number(data.power) });
      }
    }

    pts.sort((a, b) => a.hour - b.hour);
    const hasData = pts.length > 0;
    let paths = [];

    if (hasData) {
      const maxActualWattage = Math.max(...pts.map(c => c.power), 100);

      pts = pts.map(c => {
        const x = pX + (c.hour / 23) * pWidth;
        const y = pY + pHeight - (c.power / maxActualWattage) * pHeight;
        return { ...c, x, y };
      });

      const segments = [];
      let currentSegment = [];

      for (let i = 0; i < pts.length; i++) {
        if (currentSegment.length === 0) {
          currentSegment.push(pts[i]);
        } else {
          const prev = currentSegment[currentSegment.length - 1];
          if (pts[i].hour === prev.hour + 1) {
            currentSegment.push(pts[i]);
          } else {
            segments.push(currentSegment);
            currentSegment = [pts[i]];
          }
        }
      }
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
      }

      paths = segments.filter(seg => seg.length > 1).map(seg => {
        let path = `M ${seg[0].x} ${seg[0].y}`;
        for (let i = 1; i < seg.length; i++) {
          const prev = seg[i - 1];
          const curr = seg[i];
          const midX = (prev.x + curr.x) / 2;
          path += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
        }
        return path;
      });
    }

    return {
      chartWidth: cWidth,
      chartHeight: cHeight,
      padX: pX,
      padY: pY,
      plotHeight: pHeight,
      coords: pts,
      hasActualSensorData: hasData,
      segmentPaths: paths,
    };
  }, [hourlyData, offline, deviceOnline, data.power]);

  return (
    <View style={ms.container}>
      {/* GLOBAL SYNC STATUS BANNER */}
      {!isOnline && (
        <View style={{ backgroundColor: COLORS.danger, padding: 8, alignItems: 'center' }}>
          <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: 'bold' }}>Offline Mode - Waiting for network...</Text>
        </View>
      )}
      {isOnline && globalRefreshTick > 0 && !billingCycle && (
        <View style={{ backgroundColor: COLORS.success, padding: 8, alignItems: 'center' }}>
          <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: 'bold' }}>Connection Restored. Synchronizing Data...</Text>
        </View>
      )}

      <ScrollView 
        ref={scrollViewRef} 
        contentContainerStyle={ms.scroll} 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => {
          if (scrollViewRef.current) {
            scrollViewRef.current._scrollY = e.nativeEvent.contentOffset.y;
          }
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Redesigned Header matching tenant-dashboard.png */}
        <View style={ms.redesignHeader}>
          <View style={ms.headerLeft}>
            {/* Avatar Circle with Initials - Tappable to open settings/profile */}
            <TouchableOpacity 
              style={ms.avatarCircle}
              onPress={() => router.push('/(tenant)/settings')}
              activeOpacity={0.85}
              accessibilityLabel="Profile and Settings"
              accessibilityRole="button"
            >
              <Text style={ms.avatarText}>{tenantInitials}</Text>
            </TouchableOpacity>

            {/* Name and Room (Clean text only, no icons, no duplicate room name) */}
            <View style={ms.headerInfo}>
              <Text style={ms.greetingText} numberOfLines={1}>Hi, {firstName}</Text>
              <View style={ms.roomPill}>
                <Text style={ms.roomPillText}>{roomLabel}</Text>
              </View>
            </View>
          </View>

          {/* Right Actions: Live Online badge, Notification Bell, and Settings Button */}
          <View style={ms.headerRight}>
            <View style={[ms.liveOnlineBadge, offline && ms.liveOnlineBadgeOffline]}>
              <View style={[ms.liveOnlineDot, offline && ms.liveOnlineDotOffline]} />
              <Text style={[ms.liveOnlineText, offline && ms.liveOnlineTextOffline]}>
                {offline ? 'Offline' : 'Live Online'}
              </Text>
            </View>

            <TouchableOpacity 
              style={ms.headerActionBtn} 
              onPress={() => router.push('/(tenant)/notifications')}
              activeOpacity={0.8}
              accessibilityLabel="Notifications"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="notifications-outline" size={19} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={ms.notifBadgeDot} />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={ms.headerActionBtn} 
              onPress={() => router.push('/(tenant)/settings')}
              activeOpacity={0.8}
              accessibilityLabel="Settings"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="settings-outline" size={19} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 1: Real-Time Power Hero Card */}
        <CopilotStep
          text="This section displays your latest electricity monitoring data, including real-time power, voltage, current, and power factor."
          order={1}
          name="dashboard_live_sensor"
        >
          <CopilotView>
            <View style={ms.redesignCard}>
              {/* Arch Power Gauge with text-only sub-badge (NO icons) */}
              <PowerGauge 
                value={data.power} 
                maxValue={2000} 
                unit="W" 
                size={270} 
                isOffline={offline} 
              />

              {/* Card Divider */}
              <View style={ms.cardDivider} />

              {/* 3-Column Sub-Metrics (Voltage, Current, Power Factor - NO icons) */}
              <View style={ms.subMetricsRow}>
                <View style={ms.subMetricCol}>
                  <Text style={ms.subMetricLabel}>Voltage</Text>
                  <Text style={ms.subMetricValue}>
                    {offline ? '--' : `${Math.round(data.voltage || 0)}V`}
                  </Text>
                </View>

                <View style={ms.subMetricCol}>
                  <Text style={ms.subMetricLabel}>Current</Text>
                  <Text style={ms.subMetricValue}>
                    {offline ? '--' : `${Number(data.current || 0).toFixed(1)}A`}
                  </Text>
                </View>

                <View style={ms.subMetricCol}>
                  <Text style={ms.subMetricLabel}>Power Factor</Text>
                  <Text style={ms.subMetricValue}>
                    {offline ? '--' : Number(data.powerFactor || 1).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </CopilotView>
        </CopilotStep>

        {/* Step 2: Billing Cycle Summary Card (Live Cost Preserved) */}
        <CopilotStep
          text="This section shows your current electricity-related cost and today's energy consumption based on the latest available monitoring data."
          order={2}
          name="dashboard_live_cost"
        >
          <CopilotView>
            <View style={ms.redesignCard}>
              {/* Card Header Row */}
              <View style={ms.cardHeaderRow}>
                <Text style={ms.cardHeaderTitle}>BILLING CYCLE SUMMARY</Text>
                {comparison && comparison.costPctChange !== 0 ? (
                  <Text style={[ms.cardHeaderSub, { color: (comparison.costPctChange || 0) <= 0 ? '#10B981' : '#EF4444' }]}>
                    {(comparison.costPctChange || 0) <= 0 ? '▼' : '▲'} {Math.abs(Number(comparison.costPctChange || 0)).toFixed(1)}% vs yesterday
                  </Text>
                ) : (
                  <Text style={ms.cardHeaderSub}>Active Cycle</Text>
                )}
              </View>

              {/* Today's Usage vs Current Cycle Boxes */}
              <View style={ms.billingBoxesRow}>
                {/* Box 1: Today's Usage */}
                <View style={ms.billingBox}>
                  <Text style={ms.billingBoxLabel}>{"Today's Usage"}</Text>
                  <Text style={ms.billingBoxKwh}>
                    {Number(todayUsage.totalEnergy || 0).toFixed(1)} kWh
                  </Text>
                  <Text style={ms.billingBoxCostToday}>
                    ₱{Number(todayUsage.totalCost || 0).toFixed(2)}
                  </Text>
                </View>

                {/* Box 2: Current Cycle */}
                <View style={ms.billingBox}>
                  <Text style={ms.billingBoxLabel}>Current Cycle</Text>
                  <Text style={ms.billingBoxKwh}>
                    {totalEnergyKwh.toFixed(1)} kWh
                  </Text>
                  <Text style={ms.billingBoxCostCycle}>
                    ₱{Number(currentCycleTotal || 0).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Itemized Breakdown Toggle for Live Cost */}
              {(!offline && (electricityCharge > 0 || totalEnergyKwh > 0 || monthlyRent > 0 || additionalCharges > 0)) && (
                <View>
                  <TouchableOpacity 
                    style={ms.breakdownToggle}
                    onPress={() => setBreakdownExpanded(!breakdownExpanded)}
                    activeOpacity={0.8}
                  >
                    <Text style={ms.breakdownToggleText}>
                      {breakdownExpanded ? 'Hide Itemized Breakdown' : 'View Itemized Breakdown'}
                    </Text>
                    <Ionicons 
                      name={breakdownExpanded ? 'chevron-up' : 'chevron-down'} 
                      size={15} 
                      color="#64748B" 
                    />
                  </TouchableOpacity>

                  {breakdownExpanded && (
                    <View style={ms.breakdownList}>
                      <View style={ms.breakdownItem}>
                        <Text style={ms.breakdownLabel}>Electricity Charge</Text>
                        <Text style={ms.breakdownValue}>₱{electricityCharge.toFixed(2)}</Text>
                      </View>
                      {monthlyRent > 0 && (
                        <View style={ms.breakdownItem}>
                          <Text style={ms.breakdownLabel}>Monthly Rent</Text>
                          <Text style={ms.breakdownValue}>₱{monthlyRent.toFixed(2)}</Text>
                        </View>
                      )}
                      {additionalCharges > 0 && (
                        <View style={ms.breakdownItem}>
                          <Text style={ms.breakdownLabel}>Additional Charges</Text>
                          <Text style={ms.breakdownValue}>₱{additionalCharges.toFixed(2)}</Text>
                        </View>
                      )}
                      {discounts > 0 && (
                        <View style={ms.breakdownItem}>
                          <Text style={ms.breakdownLabel}>Discounts</Text>
                          <Text style={[ms.breakdownValue, { color: '#10B981' }]}>-₱{discounts.toFixed(2)}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          </CopilotView>
        </CopilotStep>

        {/* Daily Budget Tracking Card */}
        <View style={ms.redesignCard}>
          {/* Header Row */}
          <View style={ms.cardHeaderRow}>
            <Text style={ms.cardHeaderTitle}>DAILY BUDGET TRACKING</Text>
            {budget && budget.daily_allowance > 0 ? (
              <View style={[
                ms.budgetStatusBadge,
                { backgroundColor: budgetPct > 100 ? 'rgba(239, 68, 68, 0.15)' : (budgetPct > 75 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)') }
              ]}>
                <Text style={[
                  ms.budgetStatusText,
                  { color: budgetPct > 100 ? '#EF4444' : (budgetPct > 75 ? '#F59E0B' : '#10B981') }
                ]}>
                  {budgetPct > 100 ? 'Budget Exceeded' : (budgetPct > 75 ? 'Near Limit' : 'On Track')}
                </Text>
              </View>
            ) : null}
          </View>

          {budget && budget.daily_allowance > 0 ? (
            <View>
              {/* 3 Metric Columns: Daily Budget, Spent Today, Remaining */}
              <View style={ms.budgetMetricsRow}>
                <View style={ms.budgetMetricCol}>
                  <Text style={ms.budgetMetricLabel}>Daily Budget</Text>
                  <Text style={ms.budgetMetricValue}>₱{Number(budget.daily_allowance).toFixed(2)}</Text>
                </View>

                <View style={ms.budgetMetricCol}>
                  <Text style={ms.budgetMetricLabel}>{"Today's Cost"}</Text>
                  <Text style={[ms.budgetMetricValue, { color: budgetPct > 90 ? '#EF4444' : '#FFFFFF' }]}>
                    ₱{Number(todayUsage?.totalCost || 0).toFixed(2)}
                  </Text>
                </View>

                <View style={[ms.budgetMetricCol, { alignItems: 'flex-end' }]}>
                  <Text style={ms.budgetMetricLabel}>Remaining</Text>
                  <Text style={[
                    ms.budgetMetricValue, 
                    { color: (Number(budget.daily_allowance) - Number(todayUsage?.totalCost || 0)) <= 0 ? '#EF4444' : '#10B981' }
                  ]}>
                    ₱{Math.max(0, Number(budget.daily_allowance) - Number(todayUsage?.totalCost || 0)).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Animated Progress Bar */}
              <View style={ms.budgetProgressBarBg}>
                <Animated.View style={[
                  ms.budgetProgressBarFill,
                  {
                    width: animatedBudgetPct.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' }),
                    backgroundColor: budgetPct > 90 ? '#EF4444' : (budgetPct > 70 ? '#F59E0B' : '#10B981'),
                  }
                ]} />
              </View>
            </View>
          ) : (
            <View style={ms.budgetPromptWrap}>
              <Text style={ms.budgetPromptText}>No daily budget configured yet.</Text>
              <TouchableOpacity 
                style={ms.setBudgetBtn}
                onPress={() => router.push('/(tenant)/budget')}
                activeOpacity={0.8}
              >
                <Text style={ms.setBudgetBtnText}>Set Daily Budget</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Today's Wattage Trend Card (Strictly Actual IoT Sensor Data Only) */}
        <View style={ms.redesignCard}>
          <View style={ms.cardHeaderRow}>
            <Text style={ms.cardHeaderTitle}>{"TODAY'S WATTAGE TREND"}</Text>
            <Text style={ms.cardHeaderSub}>24-Hour Real-Time</Text>
          </View>

          {hasActualSensorData ? (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                {/* Horizontal guide lines */}
                <Line x1={padX} y1={padY + plotHeight * 0.25} x2={chartWidth - padX} y2={padY + plotHeight * 0.25} stroke="rgba(255, 255, 255, 0.05)" strokeWidth={1} strokeDasharray="4 4" />
                <Line x1={padX} y1={padY + plotHeight * 0.5} x2={chartWidth - padX} y2={padY + plotHeight * 0.5} stroke="rgba(255, 255, 255, 0.05)" strokeWidth={1} strokeDasharray="4 4" />
                <Line x1={padX} y1={padY + plotHeight * 0.75} x2={chartWidth - padX} y2={padY + plotHeight * 0.75} stroke="rgba(255, 255, 255, 0.05)" strokeWidth={1} strokeDasharray="4 4" />

                {/* Actual Sensor Readings Splines (only consecutive hours connected, no interpolation across gaps) */}
                {segmentPaths.map((pathStr, sIdx) => (
                  <Path
                    key={sIdx}
                    d={pathStr}
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fill="none"
                    strokeLinecap="round"
                  />
                ))}

                {/* Actual Recorded Data Points */}
                {coords.map((pt, idx) => (
                  <SvgCircle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={3}
                    fill="#10B981"
                  />
                ))}
              </Svg>

              {/* 24-Hour Time Axis Labels */}
              <View style={ms.trendTimeAxisRow}>
                <Text style={ms.trendTimeLabel}>00:00</Text>
                <Text style={ms.trendTimeLabel}>06:00</Text>
                <Text style={ms.trendTimeLabel}>12:00</Text>
                <Text style={ms.trendTimeLabel}>18:00</Text>
                <Text style={ms.trendTimeLabel}>23:00</Text>
              </View>
            </View>
          ) : (
            <View style={ms.noTrendDataBox}>
              <Text style={ms.noTrendDataText}>No Data</Text>
              <Text style={ms.noTrendDataSubtext}>
                {offline 
                  ? 'Submeter is offline. Real-time readings are unavailable.' 
                  : 'No sensor readings recorded for today yet.'}
              </Text>
            </View>
          )}
        </View>

        {/* Step 3: Energy Tip Banner matching tenant-dashboard.png */}
        <CopilotStep
          text="Wattipid Smart Insights provides useful information and recommendations based on your electricity consumption patterns and behavior."
          order={3}
          name="dashboard_smart_insights"
        >
          <CopilotView>
            {!tipDismissed && (
              <View style={ms.tipBannerCard}>
                <View style={[
                  ms.tipIconBadge,
                  smartTip?.color ? {
                    backgroundColor: `${smartTip.color}1F`,
                    borderColor: `${smartTip.color}40`,
                  } : null
                ]}>
                  <Ionicons 
                    name={smartTip?.icon || 'leaf'} 
                    size={17} 
                    color={smartTip?.color || '#10B981'} 
                  />
                </View>
                <View style={ms.tipTextContainer}>
                  {smartTip?.title ? (
                    <Text style={ms.tipTitleText}>{smartTip.title}</Text>
                  ) : null}
                  <Text style={ms.tipMessageText}>
                    {smartTip
                      ? (smartTip.message || smartTip.tip)
                      : (randomTip?.message || 'Tip: Ironing clothes in bulk during off-peak hours (10PM-6AM) saves up to ₱120/month.')}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={ms.tipDismissBtn}
                  onPress={() => setTipDismissed(true)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
            )}
          </CopilotView>
        </CopilotStep>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

// --- HELPER FUNCTIONS ---

/**
 * GHOST FIX: Detects high consumption ONLY from real, validated power readings.
 * This function is ONLY called when we have confirmed real ESP32 data.
 * It no longer receives roomId — it uses pure values that are already validated.
 */
function detectHighConsumption(currentPower, budget, todayUsage) {
  // First, check if the daily budget is exceeded (regardless of current power load)
  if (budget && budget.daily_allowance > 0 && todayUsage && todayUsage.totalCost > 0) {
    if (todayUsage.totalCost >= budget.daily_allowance) {
      const todayCostNum = parseFloat(todayUsage.totalCost) || 0;
      const budgetNum = parseFloat(budget.daily_allowance) || 0;
      return {
        type: 'danger',
        title: 'Daily Budget Exceeded!',
        message: `You have hit your daily limit! Your total cost today is ₱${todayCostNum.toFixed(2)} (Budget: ₱${budgetNum.toFixed(2)}).`,
        tip: 'Minimize non-essential appliances for the rest of the day to avoid high bills.'
      };
    }
  }

  // Next, check for high power (requires minimum meaningful power to eliminate zero/noise readings)
  if (!currentPower || currentPower < 100) return null;

  // GHOST FIX: Validate that power is within physically possible range
  // Typical residential submeter max is ~5000W
  if (currentPower > 5000) {
    console.warn('Ignoring unrealistic power reading:', currentPower);
    return null;
  }

  if (currentPower >= 750) {
    return {
      type: 'danger',
      title: '⚠️ Critical Power Usage!',
      message: `Extremely high power detected: ${Math.round(currentPower)}W. Are you using a heater or aircon?`,
      tip: 'High-wattage appliances consume your budget rapidly. Unplug what you don\'t need.'
    };
  }

  if (currentPower >= 500) {
    return {
      type: 'warning',
      title: 'High Consumption Alert',
      message: `Your current usage is ${Math.round(currentPower)}W. This is higher than your usual pattern.`,
      tip: 'Consider turning off some lights or fans to save on your daily budget.'
    };
  }

  return null;
}

/**
 * Generates dynamic tips based on current power and remaining budget.
 * GHOST FIX: Only called when deviceOnline is true with real data.
 */
function getSmartPopupTip(power, todayCost, budget) {
  if (!budget) return null;
  const budgetPct = (todayCost / budget.daily_allowance) * 100;

  if (budgetPct > 95) {
    return {
      icon: 'alert-circle',
      color: COLORS.danger,
      title: 'Budget Exhausted',
      message: 'You hit your daily limit! To avoid extra costs, unplug idle electronics, turn off unnecessary lights, and avoid using heavy appliances like irons or heaters for the rest of the day.'
    };
  }

  if (power >= 750) {
    return {
      icon: 'flash',
      color: COLORS.danger,
      title: 'Critical Power Usage!',
      message: 'Extremely high power draw detected! To prevent rapid budget depletion, immediately unplug heavy appliances like heaters or irons that you aren\'t actively using.'
    };
  }

  if (power >= 500) {
    return {
      icon: 'warning',
      color: COLORS.warning,
      title: 'High Consumption Alert',
      message: 'Your current usage is higher than normal. Consider turning off unused lights, fans, or appliances to conserve your daily budget.'
    };
  }

  if (budgetPct < 30 && power < 100) {
    return {
      icon: 'leaf',
      color: COLORS.success,
      title: 'Doing Great!',
      message: 'You are well within your budget today. Keep up the good work!'
    };
  }

  // If no dynamic alert is triggered, return null so the dashboard can display a random database tip
  return null;
}


