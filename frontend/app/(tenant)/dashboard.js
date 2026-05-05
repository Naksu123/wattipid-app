import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchRealtimeData } from '../../services/esp32Api';
import { getSetting, getTotalConsumptionToday, getBudget, getConsumptionComparison, getRoomById, getNotifications } from '../../services/database';
import { detectHighConsumption, getSmartPopupTip } from '../../services/tipsEngine';
import { sendLocalNotification } from '../../services/notificationService';
import PowerGauge from '../../components/ui/PowerGauge';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import AlertModal from '../../components/modals/AlertModal';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@/styles/theme';

export default function DashboardScreen() {
  const { user, isAuthenticated } = useAuth();
  const isFocused = useIsFocused();
  const [data, setData] = useState({ voltage: 0, current: 0, power: 0, energy: 0, powerFactor: 0 });
  const [relayOn, setRelayOn] = useState(true);
  const [rate, setRate] = useState(12.5);
  const [todayUsage, setTodayUsage] = useState({ totalEnergy: 0, totalCost: 0 });
  const [budget, setBudgetData] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  // Alert & tip state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState(null);
  const [smartTip, setSmartTip] = useState(null);
  const [tipDismissed, setTipDismissed] = useState(false);
  const [lastAlertKey, setLastAlertKey] = useState('');
  const lastNotifyTime = useRef(0);

  const roomId = user?.room_id || 'Room 1';

  const fetchData = useCallback(async () => {
    try {
      const [sensorData, rateVal, today, budgetVal, comp, roomInfo, notifications] = await Promise.all([
        fetchRealtimeData(roomId),
        getSetting('rate_per_kwh'),
        getTotalConsumptionToday(roomId, user?.name),
        getBudget(roomId),
        getConsumptionComparison(roomId, 'daily', user?.name),
        getRoomById(roomId),
        getNotifications(roomId),
      ]);
      // Handle offline state for real-time metrics
      const isNowOffline = (roomInfo && roomInfo.last_seen) ? 
        (new Date().getTime() - new Date(roomInfo.last_seen).getTime()) > 60000 : true;

      if (isNowOffline) {
        setData({ voltage: 0, current: 0, power: 0, energy: 0, powerFactor: 0 });
      } else {
        setData(sensorData);
      }

      setRelayOn(sensorData.relayState !== false);
      if (rateVal) setRate(parseFloat(rateVal));
      setTodayUsage(today);
      if (budgetVal) setBudgetData(budgetVal);
      setComparison(comp);
      if (roomInfo) setLastSeen(roomInfo.last_seen);

      // Generate smart tip
      const tip = getSmartPopupTip(sensorData.power, today.totalCost, budgetVal);
      setSmartTip(tip);

      // Detect high consumption & trigger alert
      const alert = await detectHighConsumption(roomId, sensorData.power);
      
      // Also check API flags for budget and anomalies
      let finalAlert = alert;
      
      // PRIORITY: Check for recent TipsEngine notifications from the server
      const latestNotification = notifications && notifications.length > 0 ? notifications[0] : null;
      if (latestNotification) {
        // If the server notification is recent (within last minute), use it
        const notifTime = new Date(latestNotification.timestamp).getTime();
        const nowTime = new Date().getTime();
        if (nowTime - notifTime < 60000) {
           finalAlert = {
             type: latestNotification.type === 'alert' ? 'warning' : latestNotification.type,
             title: latestNotification.title,
             message: latestNotification.message,
             tip: "TipsEngine has confirmed this event based on your recent trends."
           };
        }
      }

      if (!finalAlert && comp?.isBudgetExceeded) {
        finalAlert = { type: 'danger', title: 'Monthly Budget Exceeded', message: "You have exceeded your monthly budget. Power usage may be limited or extra charges may apply.", tip: "Reduce your consumption immediately to stay within bounds." };
      } else if (!finalAlert && comp?.isAbnormal) {
        finalAlert = { type: 'warning', title: 'Abnormal Usage Detected', message: "Your current consumption is significantly different (±30%) from your usual patterns.", tip: "Check if any heavy appliances were left on by mistake." };
      }

      if (finalAlert) {
        const alertKey = `${finalAlert.title}-${finalAlert.type}`;
        if (alertKey !== lastAlertKey) {
          setAlertData(finalAlert);
          setAlertVisible(true);
          setLastAlertKey(alertKey);

          // Trigger native notification with cooldown (5 mins)
          const now = Date.now();
          if (now - lastNotifyTime.current > 300000) {
            sendLocalNotification(
              finalAlert.title,
              finalAlert.message
            );
            lastNotifyTime.current = now;
          }
        }
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    }
  }, [roomId, lastAlertKey]);

  useEffect(() => {
    // Only run the loop if the screen is focused AND we have an active session
    if (!isFocused || !isAuthenticated) return;

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData, isFocused, isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTipDismissed(false);
    await fetchData();
    setRefreshing(false);
  };

  const amountDue = todayUsage.totalEnergy * rate;
  const budgetPct = budget && budget.daily_allowance > 0 ? (todayUsage.totalCost / budget.daily_allowance) * 100 : 0;

  const isDeviceOffline = () => {
    if (!lastSeen) return true;
    const last = new Date(lastSeen).getTime();
    const now = new Date().getTime();
    return (now - last) > 60000; // Offline if > 1 minute
  };

  const offline = isDeviceOffline();

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
      <ScrollView contentContainerStyle={ms.scroll} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}>

        {/* Header */}
        <View style={ms.header}>
          <View>
            <Text style={ms.greeting}>Hello, {user?.name || 'Tenant'} 👋</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Text style={ms.roomLabel}>Room: {roomId}</Text>
              <Text style={ms.lastSeenDot}>•</Text>
              <Text style={[ms.lastSeenText, { color: offline ? COLORS.danger : COLORS.success }]}>
                {offline ? 'Offline' : `Live: ${formatLastSeen()}`}
              </Text>
            </View>
          </View>
          <StatusBadge status={offline ? 'offline' : (relayOn ? 'active' : 'idle')} />
        </View>

        {/* High Consumption Banner (inline) */}
        {budget && budgetPct >= 80 && (
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

        {/* Comparison Chip */}
        {comparison && comparison.costPctChange !== 0 && (
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

        {/* Power Gauge */}
        <GlassCard gradient style={[ms.gaugeCard, offline && { opacity: 0.6 }]}>
          <PowerGauge value={offline ? 0 : data.power} maxValue={2000} unit="W" label={offline ? 'Device Offline' : 'Real-Time Power'} size={180} />
          <View style={ms.pf}>
            <Text style={ms.pfLabel}>Power Factor</Text>
            <Text style={ms.pfValue}>{data.powerFactor}</Text>
          </View>
        </GlassCard>

        {/* Metrics Grid */}
        <View style={ms.grid}>
          <MetricCard icon="flash" label="Voltage" value={Number(data.voltage || 0).toFixed(1)} unit="V" color={COLORS.accent} />
          <MetricCard icon="water" label="Current" value={Number(data.current || 0).toFixed(2)} unit="A" color={COLORS.info} />
          <MetricCard icon="battery-charging" label="Energy Today" value={Number(todayUsage.totalEnergy || 0).toFixed(3)} unit="kWh" color={COLORS.primary} />
          <MetricCard icon="cash" label="Amount Due" value={`₱${Number(amountDue || 0).toFixed(2)}`} unit="" color={COLORS.warning} />
        </View>

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
        {smartTip && !tipDismissed && (
          <GlassCard style={ms.tipCard}>
            <TouchableOpacity style={ms.tipDismiss} onPress={() => setTipDismissed(true)}>
              <Ionicons name="close" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
            <View style={ms.tipRow}>
              <View style={[ms.tipIconWrap, { backgroundColor: `${smartTip.color || COLORS.primary}15` }]}>
                <Ionicons name={smartTip.icon || 'leaf'} size={22} color={smartTip.color || COLORS.primary} />
              </View>
              <View style={ms.tipContent}>
                <Text style={ms.tipTitle}>{smartTip.title || 'Wattipid Tip'}</Text>
                <Text style={ms.tipMessage}>{smartTip.message || smartTip.tip}</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Rate Info */}
        <GlassCard style={ms.rateCard}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
          <Text style={ms.rateText}>Current rate: ₱{Number(rate || 0).toFixed(2)}/kWh</Text>
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

const ms = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl + 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  greeting: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  roomLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  lastSeenDot: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  lastSeenText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.medium },
  // Alert Banner
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, marginBottom: SPACING.md, borderLeftWidth: 3 },
  alertBannerIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  alertBannerContent: { flex: 1 },
  alertBannerTitle: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
  alertBannerSub: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  // Comparison
  compChip: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.sm + 2, paddingHorizontal: SPACING.md, marginBottom: SPACING.md },
  compText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold },
  // Gauge
  gaugeCard: { alignItems: 'center', paddingVertical: SPACING.xl, marginBottom: SPACING.lg },
  pf: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.md },
  pfLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  pfValue: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.semibold },
  // Metrics
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  metricCard: { width: '48.5%', alignItems: 'flex-start', padding: SPACING.md, flexGrow: 0, flexShrink: 0, flexBasis: '48%' },
  metricValue: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginTop: SPACING.sm },
  metricUnit: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium, color: COLORS.textMuted },
  metricLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  // Budget
  budgetCard: { marginBottom: SPACING.md },
  budgetHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  budgetTitle: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textPrimary, flex: 1 },
  budgetPct: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: FONT_WEIGHT.semibold },
  budgetBar: { height: 6, backgroundColor: COLORS.surfaceLight, borderRadius: 3, overflow: 'hidden', marginBottom: SPACING.xs },
  budgetFill: { height: '100%', borderRadius: 3 },
  budgetText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  // Smart Tip
  tipCard: { marginBottom: SPACING.md, position: 'relative' },
  tipDismiss: { position: 'absolute', top: 12, right: 12, zIndex: 1, padding: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, paddingRight: SPACING.lg },
  tipIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginBottom: 4 },
  tipMessage: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, lineHeight: 18 },
  // Rate
  rateCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, padding: SPACING.md, marginBottom: SPACING.xxl },
  rateText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
});
