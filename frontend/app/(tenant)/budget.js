import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { CopilotStep, walkthroughable } from 'react-native-copilot';
import { useTourAutoStart } from '@/contexts/TourContext';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { useConsumption } from '../../contexts/ConsumptionContext';
import { setBudget, getBudget, resetBudget, getBillingCycle, getConsumptionComparison } from '../../services/database';
import AnimatedBudgetRing from '../../components/ui/AnimatedBudgetRing';
import { BaseModal, ModalHeader, ModalBody, ModalFooter } from '../../components/modals/BaseModal';
import ErrorBoundary from '@/components/ErrorBoundary';

import { COLORS } from '@/styles/theme';
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
  const [comparison, setComparison] = useState({
    current: { totalEnergy: 0, totalCost: 0 },
    previous: { totalEnergy: 0, totalCost: 0 },
    costPctChange: 0,
    energyPctChange: 0,
    isAbnormal: false
  });
  const [compPeriod, setCompPeriod] = useState('weekly');
  const [activeTab, setActiveTab] = useState('monthly');
  const [editing, setEditing] = useState(false);
  const [billingCycle, setBillingCycle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);

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
            setLoading(false);
          }
        }
        const cachedBc = await AsyncStorage.getItem(`cached_billing_cycle_${roomId}`);
        if (cachedBc && isMounted) {
          setBillingCycle(JSON.parse(cachedBc));
        }
        const cachedComp = await AsyncStorage.getItem(`cached_budget_comp_${roomId}`);
        if (cachedComp && isMounted) {
          setComparison(JSON.parse(cachedComp));
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
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ─── 2. Authoritative Data Fetch & Background Sync ──────────
  const loadData = useCallback(async () => {
    if (!user || !roomId) return;
    const currentSeq = ++reqSeqRef.current;
    try {
      setLoadError(null);
      if (!hasBudgetDataRef.current) {
        setLoading(true);
      }
      const [b, bc] = await Promise.all([
        getBudget(roomId),
        getBillingCycle(roomId),
      ]);

      if (!isMountedRef.current || currentSeq !== reqSeqRef.current) return;

      if (b && parseFloat(b.monthly_budget) > 0) {
        setBudgetData(b);
        setMonthlyBudgetInput(String(b.monthly_budget || ''));
        await AsyncStorage.setItem(`cached_budget_${roomId}`, JSON.stringify(b));
      } else {
        setBudgetData(null);
        setMonthlyBudgetInput('');
        await AsyncStorage.removeItem(`cached_budget_${roomId}`);
      }

      if (bc && isMountedRef.current) {
        setBillingCycle(bc);
        await AsyncStorage.setItem(`cached_billing_cycle_${roomId}`, JSON.stringify(bc));
      }
    } catch (e) {
      console.warn('[Budget] loadData error:', e);
      if (isMountedRef.current && !hasBudgetDataRef.current) {
        setLoadError('Unable to load budget data. Please check connection.');
      }
    } finally {
      if (isMountedRef.current && currentSeq === reqSeqRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [roomId, user]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await fetchComparison(compPeriod);
  };

  // ─── 3. Comparison Data Fetch ──────────────────────────────
  const compCacheRef = useRef({});
  const compSeqRef = useRef(0);

  const fetchComparison = useCallback(async (period) => {
    if (!roomId) return;

    if (compCacheRef.current[period]) {
      setComparison(compCacheRef.current[period]);
    }

    const seq = ++compSeqRef.current;
    try {
      const comp = await getConsumptionComparison(roomId, period, user?.name);
      if (!isMountedRef.current || seq !== compSeqRef.current) return;
      if (comp) {
        compCacheRef.current[period] = comp;
        setComparison(comp);
        AsyncStorage.setItem(`cached_budget_comp_${roomId}`, JSON.stringify(comp)).catch(() => {});
      }
    } catch (e) {
      console.warn('[Budget] fetchComparison error:', e?.message || e);
    }
  }, [roomId, user?.name]);

  useEffect(() => {
    fetchComparison(compPeriod);
  }, [compPeriod, fetchComparison]);

  const handleCompPeriodChange = useCallback((newPeriod) => {
    if (newPeriod === compPeriod) return;
    setCompPeriod(newPeriod);
  }, [compPeriod]);

  // ─── 4. Set Budget Handler (NO MIN / MAX RESTRICTIONS) ───────
  const handleSetBudget = async () => {
    const val = parseFloat(monthlyBudget);
    if (!val || val <= 0 || !isFinite(val)) { 
      showModal({ type: 'warning', title: 'Invalid Budget', message: 'Please enter a valid numeric budget amount.' }); 
      return; 
    }
    
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
      AsyncStorage.removeItem(`@cached_tenant_dashboard_${roomId}`).catch(() => {});
      
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

  // ─── 5. Reset Budget Handler ────────────────────────────────
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
      AsyncStorage.removeItem(`@cached_tenant_dashboard_${roomId}`).catch(() => {});
    } catch (err) {
      console.warn("Error resetting budget:", err);
      showModal({ type: 'error', title: 'Error', message: 'Failed to reset budget. Please try again.' });
    }
  };

  // ─── 6. Derived Metric Calculations ─────────────────────────
  const dailyAllowance = Number(budgetData?.daily_allowance || 0);
  const weeklyAllowance = Number(budgetData?.weekly_allowance || 0);
  const monthlyBudgetVal = Number(budgetData?.monthly_budget || 0);

  const getActiveSpent = () => {
    if (activeTab === 'daily') return Number(todayUsage?.totalCost || 0);
    if (activeTab === 'weekly') return Number(weekUsage?.totalCost || 0);
    return Number(monthUsage?.electricityCharge !== undefined ? monthUsage.electricityCharge : (monthUsage?.totalCost || 0));
  };

  const getActiveEnergy = () => {
    if (activeTab === 'daily') return Number(todayUsage?.totalEnergy || 0);
    if (activeTab === 'weekly') return Number(weekUsage?.totalEnergy || 0);
    return Number(monthUsage?.totalEnergy || 0);
  };

  const getActiveLimit = () => {
    if (activeTab === 'daily') return dailyAllowance;
    if (activeTab === 'weekly') return weeklyAllowance;
    return monthlyBudgetVal;
  };

  const activeSpent = Math.max(0, Number(getActiveSpent() || 0));
  const activeEnergy = Math.max(0, Number(getActiveEnergy() || 0));
  const activeLimit = Math.max(0, Number(getActiveLimit() || 0));
  const activePct = (activeLimit > 0 && isFinite(activeSpent / activeLimit)) ? (activeSpent / activeLimit) * 100 : 0;
  const activeRemaining = Math.max(0, activeLimit - activeSpent);

  const getStatusInfo = (pct) => {
    const safePct = isNaN(pct) || !isFinite(pct) ? 0 : pct;
    if (safePct < 75) {
      return { 
        text: 'Normal', 
        color: '#10B981', 
        bg: 'rgba(16, 185, 129, 0.12)', 
        border: 'rgba(16, 185, 129, 0.3)', 
        icon: 'checkmark-circle-outline',
        msg: 'You are within your safe budget range.' 
      };
    }
    if (safePct < 90) {
      return { 
        text: 'Approaching', 
        color: '#F59E0B', 
        bg: 'rgba(245, 158, 11, 0.12)', 
        border: 'rgba(245, 158, 11, 0.3)', 
        icon: 'alert-circle-outline',
        msg: 'You are getting close to your budget limit.' 
      };
    }
    if (safePct <= 100) {
      return { 
        text: 'Warning', 
        color: '#EF4444', 
        bg: 'rgba(239, 68, 68, 0.12)', 
        border: 'rgba(239, 68, 68, 0.3)', 
        icon: 'warning-outline',
        msg: 'You are almost at your budget limit. Monitor your consumption.' 
      };
    }
    return { 
      text: 'Exceeded', 
      color: '#8B5CF6', 
      bg: 'rgba(139, 92, 246, 0.12)', 
      border: 'rgba(139, 92, 246, 0.3)', 
      icon: 'alert-outline',
      msg: 'You have exceeded your budget. Please manage consumption.' 
    };
  };

  const statusInfo = getStatusInfo(activePct);

  // Remaining days in cycle
  const daysRemaining = useMemo(() => {
    if (billingCycle?.cycle_end && typeof billingCycle.cycle_end === 'string') {
      try {
        const endTs = new Date(billingCycle.cycle_end.replace(' ', 'T')).getTime();
        if (!isNaN(endTs)) {
          return Math.max(0, Math.ceil((endTs - Date.now()) / (1000 * 60 * 60 * 24)));
        }
      } catch (_e) {}
    }
    return Math.max(0, Number(budgetData?.remaining_days || 30));
  }, [billingCycle?.cycle_end, budgetData?.remaining_days]);

  // Daily spend target calculation
  const spendTarget = dailyAllowance > 0 ? dailyAllowance : (monthlyBudgetVal > 0 ? monthlyBudgetVal / 30 : 0);

  return (
    <View style={s.container}>
      <ScrollView 
        ref={scrollViewRef} 
        style={s.container} 
        contentContainerStyle={s.scroll} 
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* ================= 1. COMPACT HEADER ================= */}
        <View style={s.compactHeader}>
          <Text style={s.pageTitle}>Smart Budgeting</Text>
          <Text style={s.pageSubtitle}>Track spending targets and manage electricity costs.</Text>
        </View>

        {/* ================= 2. LIVE BUDGET PROGRESS (Matches smart-budgeting.png) ================= */}
        <CopilotStep
          text="Live Budget shows how much of your electricity budget has been used and helps you monitor your current budget status."
          order={12}
          name="budget_live"
        >
          <CopilotView style={s.fullWidth}>
            {!editing ? (
              loading && !budgetData ? (
                /* Loading State */
                <View style={s.loadingCard}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={s.loadingText}>Retrieving budget and spending limits...</Text>
                </View>
              ) : !budgetData ? (
                /* Empty State: No Budget Set */
                <View style={s.emptyBudgetCard}>
                  <View style={s.emptyBudgetIconWrap}>
                    <Ionicons name="wallet-outline" size={32} color="#10B981" />
                  </View>
                  <Text style={s.emptyBudgetTitle}>No Budget Set Yet</Text>
                  <Text style={s.emptyBudgetDesc}>
                    Set a monthly budget to automatically track your daily and weekly electricity allowances.
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setEditing(true)} 
                    activeOpacity={0.8} 
                    style={s.emptyBudgetBtn}
                  >
                    <Text style={s.emptyBudgetBtnText}>Set Monthly Budget</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Configured Budget Display */
                <View style={s.fullWidth}>
                  {/* Period Switcher Tabs */}
                  <View style={s.tabRow}>
                    {BUDGET_TABS.map(tab => (
                      <TouchableOpacity 
                        key={tab} 
                        onPress={() => setActiveTab(tab)}
                        style={[s.tabBtn, activeTab === tab && s.tabActive]} 
                        activeOpacity={0.7}
                      >
                        <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Main Circular Progress Ring Card */}
                  <View style={s.progressCard}>
                    {/* Live Indicator & Status Badge */}
                    <View style={s.liveIndicatorWrap}>
                      <View style={s.liveDotWrap}>
                        <View style={s.liveDot} />
                        <Text style={s.liveText}>LIVE</Text>
                      </View>

                      <View style={[s.statusBadge, { backgroundColor: statusInfo.bg, borderColor: statusInfo.border }]}>
                        <Ionicons name={statusInfo.icon} size={13} color={statusInfo.color} />
                        <Text style={[s.statusBadgeText, { color: statusInfo.color }]}>
                          {statusInfo.text}
                        </Text>
                      </View>
                    </View>

                    {/* Animated Circular Gauge */}
                    <View style={s.progressCenter}>
                      <AnimatedBudgetRing 
                        spent={activeSpent} 
                        limit={activeLimit} 
                        size={190}
                        label={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Budget`} 
                      />
                    </View>

                    {/* Billing Cycle Pill (from smart-budgeting.png) */}
                    <View style={s.cyclePill}>
                      <Ionicons name="time-outline" size={14} color="#F59E0B" />
                      <Text style={s.cyclePillText}>
                        {daysRemaining} Days Left in Current Billing Cycle
                      </Text>
                    </View>

                    {/* Action Buttons: Edit & Reset */}
                    <View style={s.mainActionRow}>
                      <TouchableOpacity 
                        onPress={() => setEditing(true)} 
                        style={s.mainEditBtn} 
                        activeOpacity={0.8}
                      >
                        <Ionicons name="create-outline" size={15} color="#10B981" />
                        <Text style={s.mainEditBtnText}>Edit Budget</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        onPress={handleResetBudget} 
                        style={s.mainResetBtn} 
                        activeOpacity={0.8}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={15} color="#EF4444" />
                        <Text style={s.mainResetBtnText}>Reset</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Daily Spend Target Card (from smart-budgeting.png) */}
                  {spendTarget > 0 && (
                    <View style={s.targetCard}>
                      <View style={s.targetIconBadge}>
                        <Ionicons name="calculator-outline" size={18} color="#10B981" />
                      </View>
                      <View style={s.targetContent}>
                        <Text style={s.targetLabel}>Daily Spend Target</Text>
                        <Text style={s.targetDesc}>
                          Spend under ₱{spendTarget.toFixed(2)}/day to stay on track.
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )
            ) : null}
          </CopilotView>
        </CopilotStep>

        {/* ================= 3. BUDGET BREAKDOWN (PRIORITY SECTION) ================= */}
        <CopilotStep
          text="Budget Breakdown shows how your electricity budget is being used across the available periods."
          order={13}
          name="budget_breakdown"
        >
          <CopilotView style={s.fullWidth}>
            {!loading && budgetData && !editing ? (
              <View style={s.breakdownCard}>
                {/* Header */}
                <View style={s.sectionHeaderRow}>
                  <View style={s.sectionTitleRow}>
                    <Ionicons name="pie-chart-outline" size={15} color="#10B981" />
                    <Text style={s.sectionTitle}>BUDGET BREAKDOWN</Text>
                  </View>
                </View>

                {/* Clear Math Formula Strip: [BUDGET] - [USED] = [REMAINING] */}
                <View style={s.mathContainer}>
                  <View style={s.mathCol}>
                    <Text style={s.mathLabel}>Budget</Text>
                    <Text style={s.mathValue}>₱{activeLimit.toFixed(2)}</Text>
                    <Text style={s.mathSub}>{activeTab.toUpperCase()}</Text>
                  </View>

                  <View style={s.mathSign}>
                    <Text style={s.mathSignText}>−</Text>
                  </View>

                  <View style={s.mathCol}>
                    <Text style={s.mathLabel}>Cost Used</Text>
                    <Text style={s.mathValue}>₱{activeSpent.toFixed(2)}</Text>
                    <Text style={s.mathSub}>{activeEnergy.toFixed(2)} kWh</Text>
                  </View>

                  <View style={s.mathSign}>
                    <Text style={s.mathSignText}>=</Text>
                  </View>

                  <View style={s.mathCol}>
                    <Text style={s.mathLabel}>Remaining</Text>
                    <Text style={[s.mathValue, { color: activeSpent > activeLimit ? '#EF4444' : '#10B981' }]}>
                      ₱{activeRemaining.toFixed(2)}
                    </Text>
                    <Text style={[s.mathSub, { color: activeSpent > activeLimit ? '#EF4444' : '#10B981' }]}>
                      {activeSpent > activeLimit ? 'EXCEEDED' : `${Math.round(100 - activePct)}% LEFT`}
                    </Text>
                  </View>
                </View>

                {/* Supporting Status Row */}
                <View style={[s.statusRow, { backgroundColor: statusInfo.bg, borderColor: statusInfo.border }]}>
                  <Ionicons name={statusInfo.icon} size={15} color={statusInfo.color} />
                  <Text style={[s.statusText, { color: statusInfo.color }]}>
                    {statusInfo.msg}
                  </Text>
                </View>

                {/* Multi-Period Allowance Breakdown Bars */}
                <View style={s.breakdownGrid}>
                  {[
                    { label: 'Daily Allowance', limit: dailyAllowance, spent: todayUsage?.totalCost || 0, icon: 'today-outline', color: '#38BDF8' },
                    { label: 'Weekly Allowance', limit: weeklyAllowance, spent: weekUsage?.totalCost || 0, icon: 'calendar-outline', color: '#A855F7' },
                    { label: 'Monthly Budget', limit: monthlyBudgetVal, spent: monthUsage?.electricityCharge !== undefined ? monthUsage.electricityCharge : (monthUsage?.totalCost || 0), icon: 'albums-outline', color: '#10B981' },
                  ].map((item, i) => {
                    const safeLimit = Number(item.limit || 0);
                    const safeSpent = Number(item.spent || 0);
                    const pct = (safeLimit > 0 && isFinite(safeSpent / safeLimit)) ? Math.min(Math.max((safeSpent / safeLimit) * 100, 0), 100) : 0;
                    const barColor = pct >= 100 ? '#8B5CF6' : pct >= 90 ? '#EF4444' : pct >= 75 ? '#F59E0B' : item.color;

                    return (
                      <View key={i} style={s.breakdownItem}>
                        <View style={s.breakdownItemHeader}>
                          <View style={s.breakdownItemLeft}>
                            <View style={[s.breakdownIconBadge, { backgroundColor: `${item.color}20` }]}>
                              <Ionicons name={item.icon} size={14} color={item.color} />
                            </View>
                            <Text style={s.breakdownLabel}>{item.label}</Text>
                          </View>

                          <View style={s.breakdownAmounts}>
                            <Text style={s.breakdownSpent}>₱{safeSpent.toFixed(2)}</Text>
                            <Text style={s.breakdownLimit}>/ ₱{safeLimit.toFixed(2)}</Text>
                            <Text style={[s.breakdownPct, { color: barColor }]}>
                              ({Math.round(pct)}%)
                            </Text>
                          </View>
                        </View>

                        <View style={s.barTrack}>
                          <View style={[s.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </CopilotView>
        </CopilotStep>

        {/* ================= 4. BUDGET COMPARISON ================= */}
        <CopilotStep
          text="Budget Comparison allows you to compare your electricity consumption or budget performance across different periods."
          order={14}
          name="budget_comparison"
        >
          <CopilotView style={s.fullWidth}>
            <View style={s.compCard}>
              <View style={s.compHeader}>
                <View style={s.sectionTitleRow}>
                  <Ionicons name="swap-horizontal" size={15} color="#38BDF8" />
                  <Text style={s.sectionTitle}>BUDGET COMPARISON</Text>
                </View>
              </View>

              {/* Period Selector: Daily | Weekly | Monthly (Full width, no overflow) */}
              <View style={s.compPeriodRow}>
                {BUDGET_TABS.map(p => (
                  <TouchableOpacity 
                    key={p} 
                    onPress={() => handleCompPeriodChange(p)}
                    activeOpacity={0.7}
                    style={[s.compPeriodBtn, compPeriod === p && s.compPeriodActive]}
                  >
                    <Text style={[s.compPeriodText, compPeriod === p && s.compPeriodTextActive]}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Side-by-Side Comparison Columns */}
              <View style={s.compBody}>
                <View style={s.compCol}>
                  <Text style={s.compColLabel} numberOfLines={1}>
                    Previous {compPeriod === 'daily' ? 'Day' : compPeriod === 'weekly' ? 'Week' : 'Month'}
                  </Text>
                  <Text style={s.compColVal}>
                    ₱{Number.isFinite(Number(comparison?.previous?.totalCost)) ? Number(comparison.previous.totalCost).toFixed(2) : '0.00'}
                  </Text>
                  <Text style={s.compColSub}>
                    {Number.isFinite(Number(comparison?.previous?.totalEnergy)) ? Number(comparison.previous.totalEnergy).toFixed(2) : '0.00'} kWh
                  </Text>
                </View>

                <View style={s.compArrow}>
                  <Ionicons name="arrow-forward" size={18} color="#64748B" />
                </View>

                <View style={s.compCol}>
                  <Text style={s.compColLabel} numberOfLines={1}>
                    Current {compPeriod === 'daily' ? 'Day' : compPeriod === 'weekly' ? 'Week' : 'Month'}
                  </Text>
                  <Text style={s.compColVal}>
                    ₱{Number.isFinite(Number(comparison?.current?.totalCost)) ? Number(comparison.current.totalCost).toFixed(2) : '0.00'}
                  </Text>
                  <Text style={s.compColSub}>
                    {Number.isFinite(Number(comparison?.current?.totalEnergy)) ? Number(comparison.current.totalEnergy).toFixed(2) : '0.00'} kWh
                  </Text>
                </View>
              </View>

              {/* Trend Indicator Badge */}
              {(() => {
                const pct = Number(comparison?.costPctChange);
                const hasChange = Number.isFinite(pct) && pct !== 0;
                if (hasChange) {
                  const isHigher = pct > 0;
                  const absPct = Math.abs(pct).toFixed(1);
                  const periodLabel = compPeriod === 'daily' ? 'day' : compPeriod === 'weekly' ? 'week' : 'month';
                  return (
                    <View 
                      style={[
                        s.compBadge, 
                        { 
                          backgroundColor: isHigher ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          borderColor: isHigher ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'
                        }
                      ]}
                    >
                      <Ionicons 
                        name={isHigher ? 'trending-up' : 'trending-down'} 
                        size={15}
                        color={isHigher ? '#EF4444' : '#10B981'} 
                      />
                      <Text style={[s.compBadgeText, { color: isHigher ? '#EF4444' : '#10B981' }]}>
                        Cost is {absPct}% {isHigher ? 'higher' : 'lower'} than previous {periodLabel}.
                      </Text>
                    </View>
                  );
                }
                return (
                  <View 
                    style={[
                      s.compBadge, 
                      { backgroundColor: 'rgba(56, 189, 248, 0.08)', borderColor: 'rgba(56, 189, 248, 0.2)' }
                    ]}
                  >
                    <Ionicons name="information-circle-outline" size={15} color="#38BDF8" />
                    <Text style={[s.compBadgeText, { color: '#38BDF8' }]}>
                      Track trends across periods to identify opportunities to conserve electricity.
                    </Text>
                  </View>
                );
              })()}
            </View>
          </CopilotView>
        </CopilotStep>

        {/* ================= 5. SMART BUDGET INSIGHT ================= */}
        {!loading && budgetData && !editing && (
          <View style={s.insightCard}>
            <View style={s.insightHeader}>
              <Ionicons name="sparkles" size={14} color="#10B981" />
              <Text style={s.insightBadgeText}>BUDGET INSIGHT</Text>
            </View>
            <Text style={s.insightTitle}>
              {activePct > 90 ? 'Consumption Alert' : activePct > 75 ? 'Pacing Recommendation' : 'On Track'}
            </Text>
            <Text style={s.insightDesc}>
              {activePct > 90
                ? `You have used ${Math.round(activePct)}% of your ${activeTab} electricity budget. Consider limiting standby appliance usage to stay on target.`
                : activePct > 75
                ? `Your current electricity spending is approaching your ${activeTab} target. Spending under ₱${spendTarget.toFixed(2)}/day will keep you balanced.`
                : `Your electricity spending is pacing safely within your ${activeTab} target (${Math.round(activePct)}% used). Keep up the good habits!`}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ================= 6. MANUAL EDIT BUDGET MODAL (NO MIN/MAX RESTRICTIONS) ================= */}
      <BaseModal visible={editing} onClose={() => setEditing(false)}>
        <ModalHeader 
          title="Set Monthly Budget" 
          icon="wallet" 
          iconColor="#10B981" 
          onClose={budgetData ? () => setEditing(false) : null} 
        />
        <ModalBody scrollable={false}>
          <View style={s.budgetInputContainer}>
            {/* Current Budget Indicator */}
            {monthlyBudgetVal > 0 && (
              <View style={s.currentBudgetPill}>
                <Text style={s.currentBudgetText}>
                  Current Budget: ₱{monthlyBudgetVal.toFixed(2)}
                </Text>
              </View>
            )}

            {/* Custom Numeric Input (NO MIN / MAX RESTRICTIONS) */}
            <View style={s.budgetInputWrap}>
              <Text style={s.currencyLabel}>₱</Text>
              <TextInput 
                style={s.inputModal} 
                placeholder="0.00" 
                placeholderTextColor="#64748B"
                value={monthlyBudget} 
                onChangeText={setMonthlyBudgetInput} 
                keyboardType="numeric" 
                autoFocus={true}
              />
            </View>

            {/* Live Daily Preview Calculation */}
            {parseFloat(monthlyBudget) > 0 ? (
              <View style={s.livePreviewContainer}>
                <Text style={s.livePreviewText}>
                  ≈ ₱{(parseFloat(monthlyBudget) / (budgetData?.days_in_month || 30)).toFixed(2)} / day allowance
                </Text>
              </View>
            ) : (
              <View style={[s.livePreviewContainer, { opacity: 0 }]}>
                <Text style={s.livePreviewText}>Placeholder</Text>
              </View>
            )}

            {/* Quick Suggestion Chips (Purely for Convenience - NOT Min/Max bounds) */}
            <View style={s.presetChipsContainer}>
              {['500', '1000', '2000', '3000', '5000'].map(amount => (
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
          primaryLabel={budgetData ? 'Update Budget' : 'Save Budget'}
          onPrimaryPress={handleSetBudget}
          secondaryLabel={budgetData ? 'Cancel' : null}
          onSecondaryPress={() => setEditing(false)}
        />
      </BaseModal>
    </View>
  );
}

export default function SafeBudgetScreen() {
  return (
    <ErrorBoundary>
      <BudgetScreen />
    </ErrorBoundary>
  );
}
