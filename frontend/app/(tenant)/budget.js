import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CopilotStep, walkthroughable } from 'react-native-copilot';
import { useTourAutoStart } from '@/contexts/TourContext';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { useConsumption } from '../../contexts/ConsumptionContext';
import { setBudget, getBudget, resetBudget, getBillingCycle, getConsumptionComparison } from '../../services/database';
import AnimatedBudgetRing from '../../components/ui/AnimatedBudgetRing';
import GlassCard from '../../components/ui/GlassCard';
import { BaseModal, ModalHeader, ModalBody, ModalFooter } from '../../components/modals/BaseModal';
import ErrorBoundary from '@/components/ErrorBoundary';

import { COLORS, GRADIENTS } from '@/styles/theme';
import s from '@/styles/tenant/budget.styles';

const BUDGET_TABS = ['daily', 'weekly', 'monthly'];

const CopilotView = walkthroughable(View);

function BudgetScreen() {
  const { user } = useAuth();
  const { showModal } = useModal();
  const roomId = user?.room_id || 'Room 1';
  const { todayUsage, weekUsage, monthUsage } = useConsumption();
  const [monthlyBudget, setMonthlyBudgetInput] = useState('');
  const [budgetData, setBudgetData] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [compPeriod, setCompPeriod] = useState('weekly');
  const [activeTab, setActiveTab] = useState('monthly');
  const [editing, setEditing] = useState(false);
  const [billingCycle, setBillingCycle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const reqSeqRef = useRef(0);
  const scrollViewRef = useRef(null);

  useTourAutoStart('budget', !loading, scrollViewRef);

  // ─── 1. Instant Cache Restoration (Zero-Latency Load) ────────
  useEffect(() => {
    let isMounted = true;
    const restoreCachedBudget = async () => {
      if (!roomId) return;
      try {
        const cached = await AsyncStorage.getItem(`cached_budget_${roomId}`);
        if (cached && isMounted) {
          const parsed = JSON.parse(cached);
          if (parsed && parseFloat(parsed.monthly_budget) > 0) {
            setBudgetData(parsed);
            setMonthlyBudgetInput(String(parsed.monthly_budget || ''));
            setLoading(false); // Valid cached budget exists, display immediately!
          }
        }
        const cachedBc = await AsyncStorage.getItem(`cached_billing_cycle_${roomId}`);
        if (cachedBc && isMounted) {
          setBillingCycle(JSON.parse(cachedBc));
        }
      } catch (err) {
        console.warn('[Budget] Cache restoration error:', err);
      }
    };
    restoreCachedBudget();
    return () => { isMounted = false; };
  }, [roomId]);

  const hasBudgetDataRef = useRef(false);
  useEffect(() => {
    hasBudgetDataRef.current = !!budgetData;
  }, [budgetData]);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ─── 2. Authoritative Data Fetch & Background Sync ──────────
  const loadData = useCallback(async () => {
    if (!user || !roomId) return;
    const currentSeq = ++reqSeqRef.current;
    try {
      // Only show full loading spinner if we don't already have budget data
      if (!hasBudgetDataRef.current) {
        setLoading(true);
      }
      const [b, bc, comp] = await Promise.all([
        getBudget(roomId),
        getBillingCycle(roomId),
        getConsumptionComparison(roomId, compPeriod, user?.name),
      ]);

      // Protect against race conditions and unmounted state updates
      if (!isMountedRef.current || currentSeq !== reqSeqRef.current) return;

      if (b && parseFloat(b.monthly_budget) > 0) {
        setBudgetData(b);
        setMonthlyBudgetInput(String(b.monthly_budget || ''));
        await AsyncStorage.setItem(`cached_budget_${roomId}`, JSON.stringify(b));
      } else {
        // Explicitly no budget or budget set to 0
        setBudgetData(null);
        setMonthlyBudgetInput('');
        await AsyncStorage.removeItem(`cached_budget_${roomId}`);
      }

      if (bc && isMountedRef.current) {
        setBillingCycle(bc);
        await AsyncStorage.setItem(`cached_billing_cycle_${roomId}`, JSON.stringify(bc));
      }
      if (isMountedRef.current) {
        setComparison(comp);
      }
    } catch (e) {
      console.warn('[Budget] loadData error:', e);
      // Keep exist    } finally {
      if (isMountedRef.current && currentSeq === reqSeqRef.current) {
        setLoading(false);
      }
    }
  }, [roomId, user, compPeriod]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSetBudget = async () => {
    const val = parseFloat(monthlyBudget);
    if (!val || val <= 0 || !isFinite(val)) { showModal({ type: 'warning', title: 'Invalid', message: 'Enter a valid budget amount' }); return; }
    
    try {
      const result = await setBudget(roomId, val);
      const newBudgetObj = { 
        monthly_budget: val, 
        daily_allowance: Number(result.daily_allowance || (val / 30)), 
        weekly_allowance: Number(result.weekly_allowance || (val / 4.3)), 
        remaining_days: Number(result.remaining_days || 30), 
        days_in_month: Number(result.days_in_month || 30) 
      };
      if (isMountedRef.current) {
        setBudgetData(newBudgetObj);
        setLoading(false);
        setEditing(false);
      }
      await AsyncStorage.setItem(`cached_budget_${roomId}`, JSON.stringify(newBudgetObj));
      
      showModal({
        type: 'success',
        title: 'Budget Saved',
        message: `Monthly budget updated to ₱${val.toFixed(2)}. Daily allowance: ₱${Number(result.daily_allowance || val / 30).toFixed(2)}.`,
      });
    } catch (err) {
      console.warn("Error setting budget:", err);
      showModal({ type: 'error', title: 'Error', message: 'Failed to save budget. Please try again.' });
    }
  };

  const dailyAllowance = Number(budgetData?.daily_allowance || 0);
  const weeklyAllowance = Number(budgetData?.weekly_allowance || 0);
  const monthlyBudgetVal = Number(budgetData?.monthly_budget || 0);

  const getActiveSpent = () => {
    if (activeTab === 'daily') return Number(todayUsage?.totalCost || 0);
    if (activeTab === 'weekly') return Number(weekUsage?.totalCost || 0);
    return Number(monthUsage?.electricityCharge !== undefined ? monthUsage.electricityCharge : (monthUsage?.totalCost || 0));
  };
  const getActiveLimit = () => {
    if (activeTab === 'daily') return dailyAllowance;
    if (activeTab === 'weekly') return weeklyAllowance;
    return monthlyBudgetVal;
  };
  const activeSpent = Math.max(0, Number(getActiveSpent() || 0));
  const activeLimit = Math.max(0, Number(getActiveLimit() || 0));
  const activePct = (activeLimit > 0 && isFinite(activeSpent / activeLimit)) ? (activeSpent / activeLimit) * 100 : 0;

  const getStatusInfo = (pct) => {
    const safePct = isNaN(pct) || !isFinite(pct) ? 0 : pct;
    if (safePct < 75) return { text: 'Normal', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', msg: 'You are within your safe budget range.' };
    if (safePct < 90) return { text: 'Approaching', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', msg: 'You are getting close to your budget limit.' };
    if (safePct <= 100) return { text: 'Warning', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', msg: 'You are almost at your budget limit. Monitor your consumption.' };
    return { text: 'Exceeded', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)', msg: 'You have exceeded your budget. Please manage your consumption.' };
  };

  const statusInfo = getStatusInfo(activePct);

  // Reset budget handler
  const handleResetBudget = () => {
    showModal({
      type: 'confirm',
      title: 'Reset Budget',
      message: 'Are you sure you want to reset your monthly budget? This will clear your allowance targets.',
      primaryButtonText: 'Reset',
      onPrimaryPress: confirmResetBudget,
      secondaryButtonText: 'Cancel',
    });
  };

  const confirmResetBudget = async () => {
    try {
      await resetBudget(roomId);
      if (isMountedRef.current) {
        setBudgetData(null);
        setMonthlyBudgetInput('');
      }
      await AsyncStorage.removeItem(`cached_budget_${roomId}`);
    } catch (err) {
      console.warn("Error resetting budget:", err);
      showModal({ type: 'error', title: 'Error', message: 'Failed to reset budget. Please try again.' });
    }
  };

  return (
    <KeyboardAvoidingView style={[s.container, { backgroundColor: COLORS.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView 
        ref={scrollViewRef} 
        style={s.container} 
        contentContainerStyle={s.scroll} 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => {
          if (scrollViewRef.current) {
            scrollViewRef.current._scrollY = e.nativeEvent.contentOffset.y;
          }
        }}
      >


        {/* Budget Setup / Edit Modal */}
        <BaseModal visible={editing} onClose={() => setEditing(false)}>
          <ModalHeader 
            title="Set Monthly Budget" 
            icon="wallet" 
            iconColor={COLORS.primary} 
            onClose={budgetData ? () => setEditing(false) : null} 
          />
          <ModalBody scrollable={false}>
            <View style={s.budgetInputContainer}>
              {/* Massive Floating Input */}
              <View style={s.budgetInputWrap}>
                <Text style={s.currencyLabel}>₱</Text>
                <TextInput 
                  style={s.inputModal} 
                  placeholder="0" 
                  placeholderTextColor={COLORS.textMuted}
                  value={monthlyBudget} 
                  onChangeText={setMonthlyBudgetInput} 
                  keyboardType="numeric" 
                  autoFocus
                />
              </View>

              {/* Live Daily Preview */}
              {parseFloat(monthlyBudget) > 0 ? (
                <View style={s.livePreviewContainer}>
                  <Text style={s.livePreviewText}>
                    ≈ ₱{(parseFloat(monthlyBudget) / (budgetData?.days_in_month || 30)).toFixed(2)} / day
                  </Text>
                </View>
              ) : (
                <View style={[s.livePreviewContainer, { opacity: 0 }]}><Text style={s.livePreviewText}>Placeholder</Text></View>
              )}

              {/* Quick Select Chips */}
              <View style={s.presetChipsContainer}>
                {['500', '1000', '2500', '5000'].map(amount => (
                  <TouchableOpacity 
                    key={amount}
                    style={s.presetChip}
                    onPress={() => setMonthlyBudgetInput(amount)}
                    activeOpacity={0.7}
                  >
                  <Text style={s.presetChipText}>₱{amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ModalBody>
          <ModalFooter 
            primaryLabel={budgetData ? 'Update Budget' : 'Set Budget'}
            onPrimaryPress={handleSetBudget}
            secondaryLabel={budgetData ? 'Cancel' : null}
            onSecondaryPress={() => setEditing(false)}
          />
        </BaseModal>

        {/* Step 1 of 3: Live Budget */}
        <CopilotStep
          text={`Live Budget shows your current budget usage in real time. It helps you see how much of your budget has already been used and how much remains.\n\nStatus Levels:\n• Normal • Approaching • Warning • Exceeded\nThe status changes depending on how much of the budget has been consumed.`}
          order={12}
          name="budget_live"
        >
          <CopilotView style={s.fullWidth}>
            {!editing ? (
              loading && !budgetData ? (
                /* STATE 1: LOADING SKELETON (Prevents wrong UI flash) */
                <GlassCard style={[s.progressCard, { alignItems: 'center', justifyContent: 'center', minHeight: 280, paddingVertical: 40 }]}>
                  <ActivityIndicator size="large" color={COLORS.primary} style={{ marginBottom: 16 }} />
                  <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 6 }}>Loading Budget Data...</Text>
                  <Text style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center' }}>Retrieving your spending limits and allowance</Text>
                </GlassCard>
              ) : !budgetData ? (
                /* STATE 2: NO BUDGET CONFIGURED (Only after loading has verified no budget exists) */
                <GlassCard style={s.emptyBudgetCard}>
                  <View style={s.emptyBudgetIconWrap}>
                    <Ionicons name="wallet-outline" size={40} color={COLORS.primary} />
                  </View>
                  <Text style={s.emptyBudgetTitle}>No Budget Set</Text>
                  <Text style={s.emptyBudgetDesc}>Set a monthly budget to automatically track your daily and weekly allowances.</Text>
                  <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.8} style={s.fullWidth}>
                    <LinearGradient colors={GRADIENTS.primary} style={s.emptyBudgetBtn}>
                      <Text style={s.emptyBudgetBtnText}>Set Monthly Budget</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </GlassCard>
              ) : (
                /* STATE 3: BUDGET EXISTS */
                <View style={s.fullWidth}>
                  {/* Period Tabs */}
                  <View style={s.tabRow}>
                    {BUDGET_TABS.map(tab => (
                      <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}
                        style={[s.tabBtn, activeTab === tab && s.tabActive]} activeOpacity={0.7}>
                        <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Progress Ring & Alert Status */}
                  <GlassCard style={s.progressCard}>
                    <View style={s.liveIndicatorWrap}>
                      <View style={s.liveDot} />
                      <Text style={s.liveText}>Live</Text>
                    </View>

                    <View style={s.progressCenter}>
                      <AnimatedBudgetRing spent={activeSpent} limit={activeLimit} size={200}
                        label={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Budget`} />
                    </View>

                    {/* Modern Alert Badge */}
                    <View style={[s.alertBadgeContainer, { backgroundColor: statusInfo.bg, borderColor: statusInfo.border }]}>
                      <Text style={[s.alertBadgeText, { color: statusInfo.color }]}>
                        {statusInfo.text}
                      </Text>
                    </View>

                    {/* Main Action Buttons */}
                    <View style={s.mainActionRow}>
                      <TouchableOpacity onPress={() => setEditing(true)} style={s.mainEditBtn} activeOpacity={0.8}>
                        <Ionicons name="create-outline" size={16} color={COLORS.textPrimary} />
                        <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' }}>Edit Budget</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleResetBudget} style={s.mainResetBtn} activeOpacity={0.8}>
                        <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                </View>
              )
            ) : (
              <View style={{ width: '100%', height: 1 }} />
            )}
          </CopilotView>
        </CopilotStep>

        {/* Step 2 of 3: Budget Breakdown */}
        <CopilotStep
          text="Budget Breakdown shows how your budget is being used across different periods, such as daily, weekly, and monthly consumption. This helps you understand where your electricity spending is increasing."
          order={13}
          name="budget_breakdown"
        >
          <CopilotView style={s.fullWidth}>
            {!loading && budgetData && !editing ? (
              <GlassCard style={s.breakdownCard}>
                <View style={s.breakdownHeader}>
                  <Text style={s.breakdownTitle} numberOfLines={1}>Budget Breakdown</Text>
                  <View style={s.breakdownActions}>
                    <TouchableOpacity onPress={handleResetBudget} style={s.resetBudgetBtn}>
                      <Ionicons name="refresh-outline" size={14} color={COLORS.danger} />
                      <Text style={s.resetBudgetText}>Reset</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditing(true)} style={s.editBudgetBtn}>
                      <Ionicons name="create-outline" size={14} color={COLORS.primary} />
                      <Text style={s.editBudgetText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={s.breakdownGrid}>
                  {[
                    { label: 'Daily', limit: dailyAllowance, spent: todayUsage?.totalCost || 0, icon: 'today-outline', color: COLORS.info },
                    { label: 'Weekly', limit: weeklyAllowance, spent: weekUsage?.totalCost || 0, icon: 'calendar-outline', color: COLORS.accent },
                    { label: 'Monthly', limit: monthlyBudgetVal, spent: monthUsage?.electricityCharge !== undefined ? monthUsage.electricityCharge : (monthUsage?.totalCost || 0), icon: 'albums-outline', color: COLORS.primary },
                  ].map((item, i) => {
                    const safeLimit = Number(item.limit || 0);
                    const safeSpent = Number(item.spent || 0);
                    const pct = (safeLimit > 0 && isFinite(safeSpent / safeLimit)) ? Math.min(Math.max((safeSpent / safeLimit) * 100, 0), 100) : 0;
                    const barColor = pct > 90 ? COLORS.danger : pct > 70 ? COLORS.warning : item.color;
                    return (
                      <View key={i} style={s.breakdownItem}>
                        <View style={s.breakdownItemHeader}>
                          <View style={s.breakdownIconWrap}>
                            <Ionicons name={item.icon} size={16} color={item.color} />
                          </View>
                          <Text style={s.breakdownLabel}>{item.label}</Text>
                          <Text style={s.breakdownPct}>{pct.toFixed(0)}%</Text>
                        </View>
                        <View style={s.bar}>
                          <View style={[s.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                        </View>
                        <View style={s.breakdownAmounts}>
                          <Text style={s.breakdownSpent}>₱{safeSpent.toFixed(2)}</Text>
                          <Text style={s.breakdownLimit}>/ ₱{safeLimit.toFixed(2)}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
                <View style={s.remainingInfo}>
                  <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                  <Text style={s.remainingText}>
                    {billingCycle?.cycle_end && typeof billingCycle.cycle_end === 'string'
                      ? Math.max(0, Math.ceil((new Date(billingCycle.cycle_end.replace(' ', 'T')) - new Date()) / (1000 * 60 * 60 * 24)))
                      : (budgetData?.remaining_days || 0)} days remaining this cycle
                  </Text>
                </View>
              </GlassCard>
            ) : (
              <View style={{ width: '100%', height: 1 }} />
            )}
          </CopilotView>
        </CopilotStep>

        {/* Step 3 of 3: Budget Comparison */}
        <CopilotStep
          text="Budget Comparison allows you to compare your electricity consumption and budget performance across different periods. Use this information to identify changes in your spending and improve your budget management."
          order={14}
          name="budget_comparison"
        >
          <CopilotView style={s.fullWidth}>
            <GlassCard style={s.compCard}>
              <View style={s.compHeader}>
                <View style={s.compTitleRow}>
                  <Ionicons name="swap-horizontal" size={20} color={COLORS.info} />
                  <Text style={s.compTitle}>Budget Comparison</Text>
                </View>
                <View style={s.compPeriodRow}>
                  {BUDGET_TABS.map(p => (
                    <TouchableOpacity key={p} onPress={() => setCompPeriod(p)}
                      style={[s.compPeriodBtn, compPeriod === p && s.compPeriodActive]}>
                      <Text style={[s.compPeriodText, compPeriod === p && s.compPeriodTextActive]}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={s.compBody}>
                <View style={s.compCol}>
                  <Text style={s.compColLabel}>Previous</Text>
                  <Text style={s.compColVal}>₱{Number(comparison?.previous?.totalCost || 0).toFixed(2)}</Text>
                  <Text style={s.compColSub}>{Number(comparison?.previous?.totalEnergy || 0).toFixed(3)} kWh</Text>
                </View>
                <View style={s.compArrow}>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.textMuted} />
                </View>
                <View style={s.compCol}>
                  <Text style={s.compColLabel}>Current</Text>
                  <Text style={s.compColVal}>₱{Number(comparison?.current?.totalCost || 0).toFixed(2)}</Text>
                  <Text style={s.compColSub}>{Number(comparison?.current?.totalEnergy || 0).toFixed(3)} kWh</Text>
                </View>
              </View>
              {comparison?.costPctChange != null && Number(comparison.costPctChange) !== 0 ? (
                <View style={[s.compBadge, { backgroundColor: Number(comparison.costPctChange) > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)' }]}>
                  <Ionicons name={Number(comparison.costPctChange) > 0 ? 'trending-up' : 'trending-down'} size={16}
                    color={Number(comparison.costPctChange) > 0 ? COLORS.danger : COLORS.primary} />
                  <Text style={[s.compBadgeText, { color: Number(comparison.costPctChange) > 0 ? COLORS.danger : COLORS.primary }]}>
                    Consumption is {Math.abs(Number(comparison.costPctChange || 0)).toFixed(1)}% {Number(comparison.costPctChange) > 0 ? 'higher' : 'lower'} than last {compPeriod === 'daily' ? 'day' : compPeriod === 'weekly' ? 'week' : 'month'}
                  </Text>
                </View>
              ) : (
                <View style={[s.compBadge, { backgroundColor: 'rgba(59,130,246,0.08)' }]}>
                  <Ionicons name="information-circle-outline" size={16} color={COLORS.info} />
                  <Text style={[s.compBadgeText, { color: COLORS.info }]}>
                    Compare spending trends against previous periods to keep consumption on track.
                  </Text>
                </View>
              )}
            </GlassCard>
          </CopilotView>
        </CopilotStep>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function SafeBudgetScreen() {
  return (
    <ErrorBoundary>
      <BudgetScreen />
    </ErrorBoundary>
  );
}
