import React, { useState, useEffect, useCallback , useRef } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Animated, Easing } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/contexts/SyncContext';
import { fetchRealtimeData } from '../../services/esp32Api';
import PowerGauge from '../../components/ui/PowerGauge';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { COLORS, SPACING } from '@/styles/theme';
import ms from '@/styles/tenant/dashboard.styles';
import { getDashboardSummary } from '../../services/consumptionService';
import apiClient from '../../services/apiClient';
import { getBillingCycle, getPaymentInsights } from '../../services/database';
import { getNotificationHistory, createFrontendAlert } from '../../services/notificationApi';
import { tipsService } from '../../services/tipsService';
import { detectHighConsumptionSync } from '../../services/tipsEngine';
import { useNotification } from '@/contexts/NotificationContext';
import { useConsumption } from '@/contexts/ConsumptionContext';

let globalLastAlertKey = null;
let globalLastTipKey = null;
let globalTipDismissed = false;

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
  const lastNotifyTime = useRef(0);

  const roomId = user?.room_id || 'Room 1';

  const { globalRefreshTick, unreadCount: globalUnreadCount, isOnline } = useSync();
  const { showBanner } = useNotification();
  const [billingCycle, setBillingCycle] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0); 
  const [paymentInsights, setPaymentInsights] = useState(null);
  const [activities, setActivities] = useState([]);

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
      await fetchStaticConsumption(); // Seed the shared real-time baseline first
      
      const cycle = await getBillingCycle(roomId);

      // Fetch actual billing cycles to get the latest invoice data
      const cyclesRes = await apiClient.post('/api.php', { action: 'getAvailableBillingCycles', roomId });
      if (cyclesRes.data && cyclesRes.data.success && cyclesRes.data.data.length > 0) {
        const cycles = cyclesRes.data.data;
        // Find the OLDEST unpaid invoice to force chronological payments
        let unpaidInvoices = cycles.filter(c => c.status === 'completed' && ['unpaid', 'pending_verification', 'overdue', 'partially_paid'].includes(c.payment_status));
        let latestInvoice = unpaidInvoices.length > 0 ? unpaidInvoices[unpaidInvoices.length - 1] : null;
        if (!latestInvoice) {
            latestInvoice = cycles.find(c => c.status === 'completed') || cycles[0];
        }
        setBillingCycle(latestInvoice);
        setBudgetData(cycle?.budget || null); // Note: Budget still comes from getBillingCycle user data if needed, but we can also fetch it directly. Let's just keep cycle for budget.
      }
      
      if (cycle && cycle.budget) {
        setBudgetData(cycle.budget);
      }

      const insights = await getPaymentInsights(roomId);
      if (insights && insights.success) {
        setPaymentInsights(insights.data);
      }

      const notifs = await getNotificationHistory(null, 10);
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

      // Return true to indicate success
      return true;
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [roomId, user?.id]);

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
    await fetchStaticData();
    setRefreshing(false);
  };

  // Use the accurate total cost from the current active billing cycle for LIVE, but the Invoice Amount for the Bill card
  const activeMonthCost = monthUsage.totalCost || 0;
  
  // For the "Current Bill" Card, use the billing cycle's grand total if it's a completed invoice
  let invoiceAmountDue = activeMonthCost;
  if (billingCycle && billingCycle.status === 'completed') {
       let grandTotal = parseFloat(billingCycle.grand_total || 0);
       if (grandTotal === 0) {
           grandTotal = parseFloat(billingCycle.electricity_charge || 0) + 
                        parseFloat(billingCycle.penalty_amount || 0) + 
                        parseFloat(billingCycle.monthly_rent || 0) + 
                        parseFloat(billingCycle.previous_balance || 0) + 
                        parseFloat(billingCycle.additional_charges || 0) - 
                        parseFloat(billingCycle.discounts || 0);
       }
       if (grandTotal === 0) grandTotal = parseFloat(billingCycle.total_cost || 0) + parseFloat(billingCycle.penalty_amount || 0);
       
       invoiceAmountDue = grandTotal - parseFloat(billingCycle.amount_paid || 0);
  }

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

  const formatLastSeen = () => {
    if (!lastSeen) return 'Never seen';
    const last = new Date(lastSeen);
    return last.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const MetricCard = ({ icon, label, value, unit, color, prefix = '', formatter }) => (
  <GlassCard style={ms.metricCard}>
    <View style={[ms.metricIconWrap, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={ms.metricValueRow}>
      {prefix ? <Text style={ms.metricValue}>{prefix}</Text> : null}
      {typeof value === 'number' ? (
        <AnimatedNumber value={value} formatter={formatter || ((val) => val.toFixed(2))} style={ms.metricValue} />
      ) : (
        <Text style={ms.metricValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      )}
      {unit ? <Text style={ms.metricUnit}> {unit}</Text> : null}
    </View>
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
            <StatusBadge status={offline ? 'offline' : (relayOn ? 'active' : 'idle')} />
            <TouchableOpacity style={{ position: 'relative', padding: 4 }} onPress={() => router.push('/(tenant)/notifications')}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
              {unreadCount > 0 && (
                <View style={{ position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.danger, borderRadius: 10, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>



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

        <Text style={ms.sectionTitle}>Live Sensor</Text>
        {/* Live Sensor Widget */}
        <GlassCard gradient style={[ms.gaugeCard, offline && { opacity: 0.8 }]}>
          <View style={ms.liveIndicatorWrap}>
            <Animated.View style={[ms.liveDot, { backgroundColor: offline ? COLORS.danger : '#10B981', opacity: offline ? 1 : pulseAnim }]} />
            <Text style={ms.liveText}>{offline ? 'Offline' : 'Live Data'}</Text>
          </View>
          
          {offline ? (
            <View style={{ paddingVertical: SPACING.sm, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 100, marginBottom: 8 }}>
                <Ionicons name="cloud-offline-outline" size={32} color={COLORS.danger} />
              </View>
              <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' }}>Submeter is Offline</Text>
              <Text style={{ color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4, paddingHorizontal: 20 }}>
                Real-time monitoring is currently unavailable. Check your WiFi or submeter power.
              </Text>
              <TouchableOpacity
                style={{ marginTop: 12, paddingVertical: 8, paddingHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                onPress={() => {
                  showBanner(
                    'Troubleshooting Offline Device',
                    "1. Ensure your WiFi router is on.\n2. Check if the submeter LED is blinking.\n3. Try unplugging and re-plugging the submeter.\n4. If the issue persists, contact your landlord.",
                    'info',
                    { route: '/(tenant)/dashboard' }
                  );
                }}
              >
                <Text style={{ color: COLORS.primary, fontWeight: '500' }}>How to fix this?</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <PowerGauge value={data.power} maxValue={2000} unit="W" label="Real-Time Power" size={180} />
              
              <View style={ms.sensorStatsRow}>
                <View style={ms.sensorStat}>
                  <Text style={ms.sensorStatLabel}>Voltage</Text>
                  <View style={ms.sensorStatValueRow}>
                    <AnimatedNumber value={Number(data.voltage || 0)} formatter={(v) => v.toFixed(1)} style={ms.sensorStatValue} />
                    <Text style={ms.sensorStatUnit}>V</Text>
                  </View>
                </View>
                
                <View style={ms.sensorStat}>
                  <Text style={ms.sensorStatLabel}>Current</Text>
                  <View style={ms.sensorStatValueRow}>
                    <AnimatedNumber value={Number(data.current || 0)} formatter={(v) => v.toFixed(2)} style={ms.sensorStatValue} />
                    <Text style={ms.sensorStatUnit}>A</Text>
                  </View>
                </View>
                
                <View style={ms.sensorStat}>
                  <Text style={ms.sensorStatLabel}>Power Factor</Text>
                  <View style={ms.sensorStatValueRow}>
                    <AnimatedNumber value={Number(data.powerFactor || 1)} formatter={(v) => v.toFixed(2)} style={ms.sensorStatValue} />
                  </View>
                </View>
              </View>
            </>
          )}
        </GlassCard>

        {/* Financial Overview */}
        <Text style={ms.sectionTitle}>Live Cost</Text>
        <GlassCard style={ms.financialCard}>
          <View style={ms.financialRow}>
            <View style={ms.financialBlock}>
              <Text style={ms.financialLabel}>Total Amount Due</Text>
              <View style={ms.financialValueRow}>
                <Text style={ms.financialPrefix}>₱</Text>
                <AnimatedNumber value={offline ? 0 : Number(activeMonthCost || 0)} style={ms.financialValue} />
              </View>
            </View>
            
            <View style={[ms.financialBlock, { alignItems: 'flex-end' }]}>
              <Text style={ms.financialLabel}>Energy Today</Text>
              <View style={ms.financialValueRow}>
                <AnimatedNumber value={offline ? 0 : Number(todayUsage.totalEnergy || 0)} style={ms.financialValue} />
                <Text style={ms.financialUnit}>kWh</Text>
              </View>
            </View>
          </View>
          
          {/* Breakdown Section */}
          {(!offline && (monthUsage.monthlyRent > 0 || monthUsage.additionalCharges > 0 || monthUsage.penalty > 0 || monthUsage.previousBalance > 0)) && (
            <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8 }}>
              <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 13, color: COLORS.textMuted, marginBottom: 5 }}>TOTAL BREAKDOWN</Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: COLORS.textSecondary }}>Electricity ({Number(monthUsage.totalEnergy || 0).toFixed(2)} kWh)</Text>
                <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: COLORS.text }}>₱{Number(monthUsage.electricityCharge || 0).toFixed(2)}</Text>
              </View>
              
              {monthUsage.monthlyRent > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: COLORS.textSecondary }}>Monthly Rent</Text>
                  <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: COLORS.text }}>₱{Number(monthUsage.monthlyRent || 0).toFixed(2)}</Text>
                </View>
              )}
              
              {monthUsage.previousBalance > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: COLORS.textSecondary }}>Previous Balance</Text>
                  <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: COLORS.text }}>₱{Number(monthUsage.previousBalance || 0).toFixed(2)}</Text>
                </View>
              )}
              
              {monthUsage.additionalCharges > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: COLORS.textSecondary }}>Additional Charges</Text>
                  <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: COLORS.text }}>₱{Number(monthUsage.additionalCharges || 0).toFixed(2)}</Text>
                </View>
              )}

              {monthUsage.penalty > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: COLORS.textSecondary }}>Penalty</Text>
                  <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: COLORS.danger }}>₱{Number(monthUsage.penalty || 0).toFixed(2)}</Text>
                </View>
              )}
              
              {monthUsage.discounts > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: COLORS.textSecondary }}>Discounts</Text>
                  <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: COLORS.success }}>-₱{Number(monthUsage.discounts || 0).toFixed(2)}</Text>
                </View>
              )}
            </View>
          )}
          
          {budget && (
            <View>
              <View style={ms.budgetHeader}>
                <Ionicons name="wallet-outline" size={18} color={COLORS.primary} />
                <Text style={ms.budgetTitle}>Daily Budget</Text>
                <Text style={ms.budgetPct}>{Number(Math.min(budgetPct, 100) || 0).toFixed(0)}%</Text>
              </View>
              <View style={ms.budgetBar}>
                <Animated.View style={[ms.budgetFill, {
                  width: animatedBudgetPct.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' }),
                  backgroundColor: budgetPct > 90 ? COLORS.danger : budgetPct > 70 ? COLORS.warning : COLORS.primary,
                }]} />
              </View>
              <Text style={ms.budgetText}>₱{Number(todayUsage.totalCost || 0).toFixed(2)} / ₱{Number(budget.daily_allowance || 0).toFixed(2)}</Text>
            </View>
          )}
        </GlassCard>

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


