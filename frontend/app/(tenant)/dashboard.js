import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/contexts/SyncContext';
import { fetchRealtimeData, isDeviceConnected } from '../../services/esp32Api';
import PowerGauge from '../../components/ui/PowerGauge';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import AlertModal from '../../components/modals/AlertModal';
import { COLORS, SPACING } from '@/styles/theme';
import ms from '@/styles/tenant/dashboard.styles';
import { getDashboardSummary, getForecast } from '../../services/consumptionService';
import apiClient from '../../services/apiClient';
import { getBillingCycle, getPaymentInsights, getNotifications } from '../../services/database';
import { tipsService } from '../../services/tipsService';

export default function DashboardScreen() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const isFocused = useIsFocused();
  const [data, setData] = useState({ voltage: 0, current: 0, power: 0, energy: 0, powerFactor: 0 });
  const [relayOn, setRelayOn] = useState(true);
  const [rate, setRate] = useState(12.5);
  const [todayUsage, setTodayUsage] = useState({ totalEnergy: 0, totalCost: 0 });
  const [weekUsage, setWeekUsage] = useState({ totalEnergy: 0, totalCost: 0 });
  const [monthUsage, setMonthUsage] = useState({ totalEnergy: 0, totalCost: 0 });
  const [budget, setBudgetData] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastAlertKey, setLastAlertKey] = useState(null);
  const [alertData, setAlertData] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [smartTip, setSmartTip] = useState(null);
  const [randomTip, setRandomTip] = useState(null);
  const [tipDismissed, setTipDismissed] = useState(false);
  // GHOST FIX: Track whether we have REAL device data
  const [deviceOnline, setDeviceOnline] = useState(false);
  const lastNotifyTime = useRef(0);

  const roomId = user?.room_id || 'Room 1';

  const { globalRefreshTick, unreadCount: globalUnreadCount, isOnline } = useSync();
  const [billingCycle, setBillingCycle] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0); // We will sync this with globalUnreadCount
  const [paymentInsights, setPaymentInsights] = useState(null);
  const [activities, setActivities] = useState([]);

  // Sync Global Refresh
  useEffect(() => {
    if (globalRefreshTick > 0) {
      fetchStaticData();
    }
  }, [globalRefreshTick]);

  useEffect(() => {
    setUnreadCount(globalUnreadCount);
  }, [globalUnreadCount]);

  const fetchStaticData = useCallback(async () => {
    if (!roomId) return;
    try {
      setLoading(true);
      const result = await getDashboardSummary(roomId);
      const cycle = await getBillingCycle(roomId);

      if (result.success) {
        setTodayUsage(result.data.today);
        setWeekUsage(result.data.week);
        setComparison(result.data.week.comparison);

        // GHOST FIX: Pull dynamic billing cycle info from the backend's monthly response
        if (result.data.month) {
          setMonthUsage({
            totalEnergy: result.data.month.totalEnergy || 0,
            totalCost: result.data.month.totalCost || 0,
            cycle_start: result.data.month.cycle_start || null,
            cycle_end: result.data.month.cycle_end || null,
            next_reset: result.data.month.next_reset || null,
            tenant_start_date: result.data.month.tenant_start_date || null
          });
        }
      }

      if (cycle) {
        setBillingCycle(cycle);
        setBudgetData(cycle.budget || null);
      }

      const insights = await getPaymentInsights(roomId);
      if (insights && insights.success) {
        setPaymentInsights(insights.data);
      }

      const notifs = await getNotifications(roomId, user?.id);
      if (notifs) {
        setActivities(notifs.slice(0, 3)); // Get top 3 recent activities
      }

      const tipResult = await tipsService.getSmartRecommendation();
      if (tipResult && tipResult.success && tipResult.data) {
        setRandomTip(tipResult.data);
      }

      // Fetch unread notifications
      const unreadRes = await apiClient.post('/api.php', { action: 'getUnreadNotificationCount', userId: user?.id });
      if (unreadRes.data.success) {
        setUnreadCount(unreadRes.data.data);
      }

      return result;
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  const todayUsageRef = useRef(todayUsage);
  const budgetRef = useRef(budget);
  const lastSeenRef = useRef(lastSeen);
  const lastAlertKeyRef = useRef(lastAlertKey);
  const deviceOnlineRef = useRef(deviceOnline);

  useEffect(() => {
    todayUsageRef.current = todayUsage;
    budgetRef.current = budget;
    lastSeenRef.current = lastSeen;
    lastAlertKeyRef.current = lastAlertKey;
    deviceOnlineRef.current = deviceOnline;
  }, [todayUsage, budget, lastSeen, lastAlertKey, deviceOnline]);


  const fetchRealtimeDataLoop = useCallback(async () => {
    if (!roomId) return;
    try {
      const sensorData = await fetchRealtimeData(roomId);

      // GHOST FIX: If sensorData is null, the ESP32 is unreachable.
      // Do NOT use mock data, do NOT trigger any alerts.
      if (!sensorData) {
        setDeviceOnline(false);
        setData({ voltage: 0, current: 0, power: 0, energy: 0, powerFactor: 0 });
        setSmartTip(null); // Clear any power-based tips
        return;
      }

      // We have REAL data from the backend
      // Use the 'online' and 'lastSeen' properties calculated by the backend
      setDeviceOnline(sensorData.online === true);
      setLastSeen(sensorData.lastSeen || new Date().toISOString());

      // If the device is offline, zero out the real-time readings 
      // but keep the rest of the data intact (like energy)
      if (!sensorData.online) {
        setData({
          voltage: 0,
          current: 0,
          power: 0,
          energy: sensorData.energy || 0,
          powerFactor: 0
        });
      } else {
        setData(sensorData);
      }

      setRelayOn(sensorData.relayState !== false);

      // GHOST FIX: Only generate smart tips from REAL, validated data when online
      if (sensorData.online) {
        const tip = getSmartPopupTip(sensorData.power, todayUsageRef.current?.totalCost || 0, budgetRef.current);
        setSmartTip(tip);
      } else {
        setSmartTip(null);
      }

      // GHOST FIX: Only detect high consumption if we have REAL device data
      // AND the device is online AND the power reading is from a validated source
      if (sensorData.online && sensorData.power > 0) {
        const alert = detectHighConsumption(sensorData.power, budgetRef.current, todayUsageRef.current);
        if (alert) {
          const alertKey = `${alert.title}-${alert.type}`;
          if (alertKey !== lastAlertKeyRef.current) {
            setAlertData(alert);
            setAlertVisible(true);
            setLastAlertKey(alertKey);

            // Cooldown: only send push every 5 minutes
            const now = Date.now();
            if (now - lastNotifyTime.current > 300000) {
              sendLocalNotification(alert.title, alert.message);
              lastNotifyTime.current = now;
            }
          }
        } else {
          // Reset the alert state when power returns to normal, so it can trigger again later!
          if (lastAlertKeyRef.current !== null) {
            setLastAlertKey(null);
          }
        }
      }
    } catch (err) {
      console.warn('Real-time fetch error:', err);
    }
  }, [roomId]);

  useEffect(() => {
    if (!isFocused || !isAuthenticated) return;

    // 1. Initial fetch of everything
    fetchStaticData().then(() => fetchRealtimeDataLoop());

    // 2. Real-time loop (5 seconds for ESP32 consumption)
    const realtimeInterval = setInterval(fetchRealtimeDataLoop, 5000);

    return () => {
      clearInterval(realtimeInterval);
    };
  }, [isFocused, isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTipDismissed(false);
    await Promise.all([fetchStaticData(), fetchRealtimeDataLoop()]);
    setRefreshing(false);
  };

  // Use the accurate total cost from the current active billing cycle
  const amountDue = monthUsage.totalCost || 0;
  const budgetPct = budget && budget.daily_allowance > 0 ? (todayUsage.totalCost / budget.daily_allowance) * 100 : 0;

  // GHOST FIX: Use our tracked deviceOnline state instead of guessing from lastSeen
  const offline = !deviceOnline;

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

  const formatLastSeen = () => {
    if (!lastSeen) return 'Never seen';
    const last = new Date(lastSeen);
    return last.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const MetricCard = ({ icon, label, value, unit, color = COLORS.textPrimary }) => (
    <GlassCard style={ms.metricCard}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={ms.metricValue}>{value}<Text style={ms.metricUnit}> {unit}</Text></Text>
      <Text style={ms.metricLabel}>{label}</Text>
    </GlassCard>
  );

  return (
    <View style={ms.container}>
      {/* GLOBAL SYNC STATUS BANNER */}
      {!isOnline && (
        <View style={{ backgroundColor: COLORS.danger, padding: 8, alignItems: 'center' }}>
          <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: 'bold' }}>⚠️ Offline Mode - Waiting for network...</Text>
        </View>
      )}
      {isOnline && globalRefreshTick > 0 && !billingCycle && (
        <View style={{ backgroundColor: COLORS.success, padding: 8, alignItems: 'center' }}>
          <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: 'bold' }}>🔄 Connection Restored. Synchronizing Data...</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={ms.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>

        {/* Header */}
        <View style={ms.header}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="home" size={24} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={ms.greeting}>{roomId}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: offline ? COLORS.danger : COLORS.success }} />
              <Text style={[ms.lastSeenText, { color: offline ? COLORS.danger : COLORS.success }]}>
                {offline ? 'Submeter Offline' : `Live Data: ${formatLastSeen()}`}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity style={{ position: 'relative', padding: 4 }} onPress={() => router.push('/(tenant)/notifications')}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
              {unreadCount > 0 && (
                <View style={{ position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.danger, borderRadius: 10, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <StatusBadge status={offline ? 'offline' : (relayOn ? 'active' : 'idle')} />
          </View>
        </View>


        {/* GHOST FIX: Only show budget warning banner when device is ONLINE and real data exists */}
        {!offline && budget && budgetPct >= 80 && todayUsage.totalCost > 0 && (
          <TouchableOpacity activeOpacity={0.8} onPress={() => {
            setAlertData({
              type: budgetPct >= 100 ? 'danger' : 'warning',
              title: budgetPct >= 100 ? 'Budget Exceeded!' : 'Budget Warning',
              message: `Daily spending at ${Number(budgetPct || 0).toFixed(0)}% (₱${Number(todayUsage.totalCost || 0).toFixed(2)} / ₱${Number(budget.daily_allowance || 0).toFixed(2)}).`,
              tip: 'Reduce your power usage now. Turn off lights, unplug chargers, and avoid using high-wattage appliances.',
            });
            setAlertVisible(true);
          }}>
            <GlassCard style={[ms.alertBanner, { borderLeftColor: budgetPct >= 100 ? COLORS.danger : COLORS.warning }]}>
              <View style={[ms.alertBannerIcon, { backgroundColor: budgetPct >= 100 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)' }]}>
                <Ionicons name={budgetPct >= 100 ? 'alert-circle' : 'warning'} size={22}
                  color={budgetPct >= 100 ? COLORS.danger : COLORS.warning} />
              </View>
              <View style={ms.alertBannerContent}>
                <Text style={[ms.alertBannerTitle, { color: budgetPct >= 100 ? COLORS.danger : COLORS.warning }]}>
                  {budgetPct >= 100 ? 'Budget Exceeded' : 'Approaching Limit'}
                </Text>
                <Text style={ms.alertBannerSub}>{Number(budgetPct || 0).toFixed(0)}% of daily budget used • Tap for tips</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </GlassCard>
          </TouchableOpacity>
        )}

        {/* Comparison Chip — only show if device has real data */}
        {!offline && comparison && comparison.costPctChange !== 0 && (
          <GlassCard style={ms.compChip}>
            <Ionicons
              name={(comparison.costPctChange || 0) > 0 ? 'trending-up' : 'trending-down'}
              size={16}
              color={(comparison.costPctChange || 0) >= 0 ? COLORS.success : COLORS.danger}
            />
            <Text style={[ms.compText, { color: (comparison.costPctChange || 0) >= 0 ? COLORS.success : COLORS.danger }]}>
              {(comparison.costPctChange || 0) > 0 ? '+' : ''}
              {Number(comparison.costPctChange || 0).toFixed(0)}%
              {(comparison.costPctChange || 0) >= 0 ? ' higher' : ' lower'} than yesterday
            </Text>
          </GlassCard>
        )}

        {/* Payment Status Overview */}
        {paymentInsights && (
          <>
            <Text style={ms.sectionTitle}>Payment Overview</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ms.statsScroll}>
              <GlassCard style={ms.statCard}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                <Text style={ms.statValue}>₱{Number(paymentInsights.totalPaid || 0).toLocaleString()}</Text>
                <Text style={ms.statLabel}>Total Paid</Text>
              </GlassCard>
              <GlassCard style={[ms.statCard, { borderColor: 'rgba(245,158,11,0.3)' }]}>
                <Ionicons name="time" size={24} color={COLORS.warning} />
                <Text style={[ms.statValue, { color: COLORS.warning }]}>₱{Number(paymentInsights.totalPending || 0).toLocaleString()}</Text>
                <Text style={ms.statLabel}>Pending Verification</Text>
              </GlassCard>
              <GlassCard style={[ms.statCard, { borderColor: 'rgba(239,68,68,0.3)' }]}>
                <Ionicons name="alert-circle" size={24} color={COLORS.danger} />
                <Text style={[ms.statValue, { color: COLORS.danger }]}>₱{Number(paymentInsights.totalOverdue || 0).toLocaleString()}</Text>
                <Text style={ms.statLabel}>Total Overdue</Text>
              </GlassCard>
            </ScrollView>
          </>
        )}

        <Text style={ms.sectionTitle}>Live Consumption</Text>
        {/* Power Gauge */}
        <GlassCard gradient style={[ms.gaugeCard, offline && { opacity: 0.8 }]}>
          {offline ? (
            <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 20, borderRadius: 100, marginBottom: 15 }}>
                <Ionicons name="cloud-offline-outline" size={50} color={COLORS.danger} />
              </View>
              <Text style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: '600' }}>Submeter is Offline</Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }}>
                Real-time monitoring is currently unavailable. Check your WiFi or submeter power.
              </Text>
              <TouchableOpacity
                style={{ marginTop: 20, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                onPress={() => {
                  setAlertData({
                    type: 'info',
                    title: 'Troubleshooting Offline Device',
                    message: "1. Ensure your WiFi router is on.\n2. Check if the submeter LED is blinking.\n3. Try unplugging and re-plugging the submeter.\n4. If the issue persists, contact your landlord.",
                    tip: 'Monitoring will resume automatically once the device reconnects.'
                  });
                  setAlertVisible(true);
                }}
              >
                <Text style={{ color: COLORS.primary, fontWeight: '500' }}>How to fix this?</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <PowerGauge value={data.power} maxValue={2000} unit="W" label="Real-Time Power" size={180} />
              <View style={ms.pf}>
                <Text style={ms.pfLabel}>Power Factor</Text>
                <Text style={ms.pfValue}>{data.powerFactor}</Text>
              </View>
            </>
          )}
        </GlassCard>

        {/* Metrics Grid */}
        <View style={ms.grid}>
          <MetricCard icon="flash" label="Voltage" value={offline ? '0.0' : Number(data.voltage || 0).toFixed(1)} unit="V" color={COLORS.accent} />
          <MetricCard icon="water" label="Current" value={offline ? '0.00' : Number(data.current || 0).toFixed(2)} unit="A" color={COLORS.info} />
          <MetricCard icon="battery-charging" label="Energy Today" value={Number(todayUsage.totalEnergy || 0).toFixed(3)} unit="kWh" color={COLORS.primary} />
          <MetricCard icon="cash" label="Amount Due" value={`₱${Number(amountDue || 0).toFixed(2)}`} unit="" color={COLORS.warning} />
        </View>

        {/* Consumption Totals (Moved from Analytics) */}
        <GlassCard style={ms.totalsCard}>
          <Text style={ms.totalsTitle}>Consumption Totals</Text>
          <View style={ms.totalsGrid}>
            {[
              { label: 'Today', energy: todayUsage.totalEnergy, cost: todayUsage.totalCost, icon: 'calendar-outline', color: COLORS.info },
              { label: 'This Week', energy: weekUsage.totalEnergy, cost: weekUsage.totalCost, icon: 'grid-outline', color: COLORS.warning },
              { label: 'This Month', energy: monthUsage.totalEnergy, cost: monthUsage.totalCost, icon: 'albums-outline', color: COLORS.primary },
            ].map((item, i) => (
              <View key={i} style={ms.totalItem}>
                <View style={[ms.totalIcon, { backgroundColor: `${item.color}15` }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={ms.totalLabel}>{item.label}</Text>
                <Text style={ms.totalEnergy} numberOfLines={1} adjustsFontSizeToFit>
                  {Number(item.energy || 0).toFixed(3)}
                </Text>
                <Text style={ms.totalUnit}>kWh</Text>
                <Text style={[ms.totalCost, { marginTop: 6 }]} numberOfLines={1}>₱{Number(item.cost || 0).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* Budget Quick View */}
        {budget && (
          <GlassCard style={ms.budgetCard}>
            <View style={ms.budgetHeader}>
              <Ionicons name="wallet-outline" size={18} color={COLORS.primary} />
              <Text style={ms.budgetTitle}>Daily Budget</Text>
              <Text style={ms.budgetPct}>{Number(Math.min(budgetPct, 100) || 0).toFixed(0)}%</Text>
            </View>
            <View style={ms.budgetBar}>
              <View style={[ms.budgetFill, {
                width: `${Math.min(budgetPct, 100)}%`,
                backgroundColor: budgetPct > 90 ? COLORS.danger : budgetPct > 70 ? COLORS.warning : COLORS.primary,
              }]} />
            </View>
            <Text style={ms.budgetText}>₱{Number(todayUsage.totalCost || 0).toFixed(2)} / ₱{Number(budget.daily_allowance || 0).toFixed(2)}</Text>
          </GlassCard>
        )}

        {/* Smart Tip Card */}
        {(smartTip || randomTip) && !tipDismissed && (
          <GlassCard style={ms.tipCard}>
            <TouchableOpacity style={ms.tipDismiss} onPress={() => setTipDismissed(true)}>
              <Ionicons name="close" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
            <View style={ms.tipRow}>
              <View style={[ms.tipIconWrap, { backgroundColor: `${smartTip ? (smartTip.color || COLORS.primary) : COLORS.primary}15` }]}>
                <Ionicons name={smartTip ? (smartTip.icon || 'leaf') : (randomTip?.icon || 'bulb')} size={22} color={smartTip ? (smartTip.color || COLORS.primary) : COLORS.primary} />
              </View>
              <View style={ms.tipContent}>
                <Text style={ms.tipTitle}>{smartTip ? (smartTip.title || 'Wattipid Tip') : randomTip?.title}</Text>
                <Text style={ms.tipMessage}>{smartTip ? (smartTip.message || smartTip.tip) : randomTip?.message}</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Recent Activities */}
        <Text style={ms.sectionTitle}>Recent Activities</Text>
        <GlassCard style={{ padding: SPACING.md, marginBottom: SPACING.xl }}>
          {activities.length > 0 ? (
            <View>
              {activities.map((act, index) => (
                <View key={act.id || index} style={ms.activityItem}>
                  {index < activities.length - 1 && <View style={ms.activityLine} />}
                  <View style={ms.activityIconWrap}>
                    <Ionicons 
                      name={act.type === 'payment_verified' ? 'checkmark-circle' : act.type === 'bill_generated' ? 'document-text' : act.type === 'penalty' ? 'alert-circle' : 'notifications'} 
                      size={16} 
                      color={act.type === 'payment_verified' ? COLORS.success : act.type === 'penalty' ? COLORS.danger : COLORS.primary} 
                    />
                  </View>
                  <View style={ms.activityContent}>
                    <Text style={ms.activityTitle}>{act.title}</Text>
                    <Text style={ms.activityMessage}>{act.message}</Text>
                    <Text style={ms.activityTime}>{new Date(act.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </View>
              ))}
              <TouchableOpacity onPress={() => router.push('/(tenant)/notifications')} style={{ marginTop: 8, alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
                <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: 'bold' }}>View All Activities</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={ms.emptyActivity}>No recent activities found.</Text>
          )}
        </GlassCard>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.lg, marginBottom: SPACING.md }}>
          <Text style={[ms.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Current Bill</Text>
          <StatusBadge status={billingCycle?.payment_status || 'unpaid'} />
        </View>
        <GlassCard style={ms.soaCard}>
          
          <View style={ms.soaAmountRow}>
            <View>
              <Text style={ms.soaLabel}>Amount Due</Text>
              <Text style={ms.soaAmount}>₱{Number(amountDue || 0).toFixed(2)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={ms.soaLabel}>Due Date</Text>
              <Text style={[ms.soaValue, { color: daysUntilDue !== null && daysUntilDue < 0 ? COLORS.danger : COLORS.textPrimary }]}>
                {billingCycle?.due_date ? new Date(billingCycle.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--'}
              </Text>
            </View>
          </View>

          <View style={ms.soaRow}>
            <Text style={ms.soaLabel}>Invoice No.</Text>
            <Text style={[ms.soaValue, !billingCycle?.invoice_number && { fontStyle: 'italic', color: COLORS.textMuted, fontSize: 12 }]}>
              {billingCycle?.invoice_number || 'Pending'}
            </Text>
          </View>
          <View style={ms.soaRow}>
            <Text style={ms.soaLabel}>Billing Period</Text>
            <Text style={[ms.soaValue, { fontSize: 13 }]}>
              {monthUsage.cycle_start ? new Date(monthUsage.cycle_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--'} - {monthUsage.cycle_end ? new Date(monthUsage.cycle_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--'}
            </Text>
          </View>
          {daysUntilDue !== null && daysUntilDue < 0 && (
            <View style={ms.soaRow}>
              <Text style={ms.soaLabel}>Penalty Applied</Text>
              <Text style={[ms.soaValue, { color: COLORS.danger, fontWeight: 'bold' }]}>
                ₱{Number(billingCycle?.penalty_amount || 0).toFixed(2)}
              </Text>
            </View>
          )}

          <View style={ms.soaActions}>
            <TouchableOpacity style={ms.soaBtnSecondary} onPress={() => router.push('/(tenant)/billing')}>
              <Text style={ms.soaBtnText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[ms.soaBtnPrimary, { opacity: (billingCycle?.payment_status === 'paid' || billingCycle?.payment_status === 'pending_verification') ? 0.5 : 1 }]} 
              disabled={billingCycle?.payment_status === 'paid' || billingCycle?.payment_status === 'pending_verification'}
              onPress={() => router.push('/(tenant)/payment')}
            >
              <Text style={ms.soaBtnText}>Pay Now</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Account Summary */}
        <Text style={ms.sectionTitle}>Account Summary</Text>
        <GlassCard style={ms.accountCard}>
          <View style={ms.accountRow}>
            <Text style={ms.soaLabel}>Tenant Name</Text>
            <Text style={[ms.soaValue, { fontSize: 13 }]}>{user?.name || 'Tenant'}</Text>
          </View>
          <View style={ms.accountRow}>
            <Text style={ms.soaLabel}>Room</Text>
            <Text style={[ms.soaValue, { fontSize: 13 }]}>{roomId}</Text>
          </View>
          <View style={ms.accountRow}>
            <Text style={ms.soaLabel}>Move-In Date</Text>
            <Text style={[ms.soaValue, { fontSize: 13 }]}>
              {monthUsage.tenant_start_date ? new Date(monthUsage.tenant_start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '--'}
            </Text>
          </View>
          <View style={ms.accountRow}>
            <Text style={ms.soaLabel}>Rate (per kWh)</Text>
            <Text style={[ms.soaValue, { fontSize: 13 }]}>₱{Number(rate || 0).toFixed(2)}</Text>
          </View>
          <View style={ms.accountRow}>
            <Text style={ms.soaLabel}>Next Billing Cycle</Text>
            <Text style={[ms.soaValue, { fontSize: 13 }]}>
              {monthUsage.next_reset ? new Date(monthUsage.next_reset).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '--'}
            </Text>
          </View>
          <View style={[ms.accountRow, { borderBottomWidth: 0 }]}>
            <Text style={ms.soaLabel}>Account Status</Text>
            <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ color: COLORS.success, fontSize: 11, fontWeight: 'bold' }}>Active</Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Alert Pop-up Modal */}
      <AlertModal
        visible={alertVisible}
        type={alertData?.type || 'warning'}
        title={alertData?.title || 'Alert'}
        message={alertData?.message || ''}
        customTip={alertData?.tip}
        onAcknowledge={() => setAlertVisible(false)}
        showTip
      />
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
      return {
        type: 'danger',
        title: 'Daily Budget Exceeded!',
        message: `You have hit your daily limit! Your total cost today is ₱${todayUsage.totalCost.toFixed(2)} (Budget: ₱${budget.daily_allowance.toFixed(2)}).`,
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

  if (currentPower >= 700) {
    return {
      type: 'danger',
      title: '⚠️ Critical Power Usage!',
      message: `Extremely high power detected: ${Math.round(currentPower)}W. Are you using a heater or aircon?`,
      tip: 'High-wattage appliances consume your budget rapidly. Unplug what you don\'t need.'
    };
  }

  if (currentPower >= 240) {
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
      message: 'You have reached your daily limit. Try to minimize usage until tomorrow.'
    };
  }

  if (power > 1000) {
    return {
      icon: 'flash',
      color: COLORS.warning,
      title: 'Heavy Appliance Detected',
      message: 'A high-power device is running. Keep track of how long it stays on!'
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

/**
 * Local Notification sender (Integration point for expo-notifications)
 */
function sendLocalNotification(title, message) {
  console.log(`[PUSH] ${title}: ${message}`);
}
