import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchRealtimeData } from '../../services/esp32Api';
import { getSetting, getTotalConsumptionToday, getBudget, getConsumptionComparison, getRoomById, getNotifications } from '../../services/database';
import { detectHighConsumption, getSmartPopupTip } from '../../services/tipsEngine';
import { sendLocalNotification } from '../../services/notificationService';
import PowerGauge from '../../components/ui/PowerGauge';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import AlertModal from '../../components/modals/AlertModal';
import { COLORS } from '@/styles/theme';
import ms from '@/styles/tenant/dashboard.styles';

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

  const fetchStaticData = useCallback(async () => {
    try {
      const [rateVal, today, budgetVal, comp, roomInfo] = await Promise.all([
        getSetting('rate_per_kwh'),
        getTotalConsumptionToday(roomId, user?.name),
        getBudget(roomId),
        getConsumptionComparison(roomId, 'daily', user?.name),
        getRoomById(roomId),
      ]);
      
      if (rateVal) setRate(parseFloat(rateVal));
      setTodayUsage(today);
      if (budgetVal) setBudgetData(budgetVal);
      setComparison(comp);
      if (roomInfo) setLastSeen(roomInfo.last_seen);
      
      return { today, budgetVal, comp, roomInfo };
    } catch (err) {
      console.warn('Static data fetch error:', err);
      return null;
    }
  }, [roomId, user?.name]);

  const todayUsageRef = useRef(todayUsage);
  const budgetRef = useRef(budget);
  const lastSeenRef = useRef(lastSeen);
  const lastAlertKeyRef = useRef(lastAlertKey);

  useEffect(() => {
    todayUsageRef.current = todayUsage;
    budgetRef.current = budget;
    lastSeenRef.current = lastSeen;
    lastAlertKeyRef.current = lastAlertKey;
  }, [todayUsage, budget, lastSeen, lastAlertKey]);

  const fetchRealtimeDataLoop = useCallback(async () => {
    try {
      const sensorData = await fetchRealtimeData(roomId);
      
      const isNowOffline = lastSeenRef.current ? 
        (new Date().getTime() - new Date(lastSeenRef.current).getTime()) > 60000 : true;

      if (isNowOffline) {
        setData({ voltage: 0, current: 0, power: 0, energy: 0, powerFactor: 0 });
      } else {
        setData(sensorData);
      }

      setRelayOn(sensorData.relayState !== false);

      const tip = getSmartPopupTip(sensorData.power, todayUsageRef.current?.totalCost || 0, budgetRef.current);
      setSmartTip(tip);

      const alert = await detectHighConsumption(roomId, sensorData.power);
      if (alert) {
        const alertKey = `${alert.title}-${alert.type}`;
        if (alertKey !== lastAlertKeyRef.current) {
          setAlertData(alert);
          setAlertVisible(true);
          setLastAlertKey(alertKey);
          
          const now = Date.now();
          if (now - lastNotifyTime.current > 300000) {
            sendLocalNotification(alert.title, alert.message);
            lastNotifyTime.current = now;
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

    // 2. Real-time loop (5 seconds)
    const realtimeInterval = setInterval(fetchRealtimeDataLoop, 5000);
    
    // 3. Static data loop (60 seconds)
    const staticInterval = setInterval(fetchStaticData, 60000);

    return () => {
      clearInterval(realtimeInterval);
      clearInterval(staticInterval);
    };
  }, [isFocused, isAuthenticated]);

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
            <Text style={ms.greeting}>Hello, {user?.name || 'Tenant'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Ionicons name="home-outline" size={14} color={COLORS.textSecondary} />
              <Text style={ms.roomLabel}>{roomId}</Text>
              <Text style={ms.lastSeenDot}>•</Text>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: offline ? COLORS.danger : COLORS.success }} />
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
