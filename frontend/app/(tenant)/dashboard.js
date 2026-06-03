import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchRealtimeData, isDeviceConnected } from '../../services/esp32Api';
import PowerGauge from '../../components/ui/PowerGauge';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import AlertModal from '../../components/modals/AlertModal';
import { COLORS } from '@/styles/theme';
import ms from '@/styles/tenant/dashboard.styles';
import { getDashboardSummary, getForecast } from '../../services/consumptionService';
import { getBillingCycle } from '../../services/database';
import { tipsService } from '../../services/tipsService';

export default function DashboardScreen() {
  const { user, isAuthenticated } = useAuth();
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

  const [billingCycle, setBillingCycle] = useState(null);

  const fetchStaticData = useCallback(async () => {
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

      const tipResult = await tipsService.getSmartRecommendation();
      if (tipResult && tipResult.success && tipResult.data) {
        setRandomTip(tipResult.data);
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
    await Promise.all([fetchStaticData(), fetchRealtimeDataLoop()]);
    setRefreshing(false);
  };

  // Use the accurate total cost from the current active billing cycle
  const amountDue = monthUsage.totalCost || 0;
  const budgetPct = budget && budget.daily_allowance > 0 ? (todayUsage.totalCost / budget.daily_allowance) * 100 : 0;

  // GHOST FIX: Use our tracked deviceOnline state instead of guessing from lastSeen
  const offline = !deviceOnline;

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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={ms.greeting}>Hello, {user?.name || 'Tenant'}</Text>
            </View>
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

        {/* Billing Cycle Info */}
        <GlassCard style={[ms.rateCard, { flexDirection: 'column', alignItems: 'flex-start', padding: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
            <Text style={[ms.rateText, { marginLeft: 8, fontWeight: 'bold', color: COLORS.textPrimary, flex: 1 }]}>Active Billing Cycle</Text>
            <Text style={{ fontSize: 12, color: COLORS.textMuted }}>Rate: ₱{Number(rate || 0).toFixed(2)}/kWh</Text>
          </View>

          <View style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: COLORS.textMuted }}>Billing Period</Text>
              <Text style={{ fontSize: 12, color: COLORS.textPrimary, fontWeight: '500' }}>
                {monthUsage.cycle_start ? new Date(monthUsage.cycle_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--'} - {monthUsage.cycle_end ? new Date(monthUsage.cycle_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: COLORS.textMuted }}>Next Reset</Text>
              <Text style={{ fontSize: 12, color: COLORS.warning, fontWeight: '500' }}>
                {monthUsage.next_reset ? new Date(monthUsage.next_reset).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '--'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
              <Text style={{ fontSize: 12, color: COLORS.textMuted }}>Move-in Date</Text>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' }}>
                {monthUsage.tenant_start_date ? new Date(monthUsage.tenant_start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '--'}
              </Text>
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
