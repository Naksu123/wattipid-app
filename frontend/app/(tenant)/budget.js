import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { useConsumption } from '../../contexts/ConsumptionContext';
import { setBudget, getBudget, resetBudget, getBillingCycle, getTransactionHistory, getConsumptionComparison } from '../../services/database';
import AnimatedBudgetRing from '../../components/ui/AnimatedBudgetRing';
import GlassCard from '../../components/ui/GlassCard';
import { BaseModal, ModalHeader, ModalBody, ModalFooter } from '../../components/modals/BaseModal';

import { COLORS, GRADIENTS } from '@/styles/theme';
import s from '@/styles/tenant/budget.styles';

const BUDGET_TABS = ['daily', 'weekly', 'monthly'];

export default function BudgetScreen() {
  const { user } = useAuth();
  const { showModal } = useModal();
  const roomId = user?.room_id || 'Room 1';
  const { todayUsage, weekUsage, monthUsage } = useConsumption();
  const [monthlyBudget, setMonthlyBudgetInput] = useState('');
  const [budgetData, setBudgetData] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [compPeriod, setCompPeriod] = useState('weekly');
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('monthly');
  const [editing, setEditing] = useState(false);
  const [resetVisible, setResetVisible] = useState(false);
  const [budgetConfirm, setBudgetConfirm] = useState(null); // inline confirmation message
  const [billingCycle, setBillingCycle] = useState(null);

  const loadData = useCallback(async () => {
    if (!user || !roomId) return;
    const [b, bc, txns, comp] = await Promise.all([
      getBudget(roomId),
      getBillingCycle(roomId),
      getTransactionHistory(roomId, 20, 'all', user?.name),
      getConsumptionComparison(roomId, compPeriod, user?.name),
    ]);
    if (b) { 
      setBudgetData(b); 
      setMonthlyBudgetInput(String(b.monthly_budget || '')); 
    }
    if (bc) {
      setBillingCycle(bc);
    }
    setTransactions(txns || []);
    setComparison(comp);
  }, [roomId, user?.name, compPeriod]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSetBudget = async () => {
    const val = parseFloat(monthlyBudget);
    if (!val || val <= 0) { showModal({ type: 'warning', title: 'Invalid', message: 'Enter a valid budget amount' }); return; }
    
    try {
      const result = await setBudget(roomId, val);
      setBudgetData({ 
        monthly_budget: val, 
        daily_allowance: result.dailyAllowance, 
        weekly_allowance: result.weeklyAllowance, 
        remaining_days: result.remainingDays, 
        days_in_month: result.daysInMonth 
      });
      setEditing(false);
      
      // Inline confirmation instead of pop-up
      setBudgetConfirm({
        monthly: val,
        daily: result.dailyAllowance,
        weekly: result.weeklyAllowance,
        daysInMonth: result.daysInMonth,
      });
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => setBudgetConfirm(null), 5000);
    } catch (err) {
      console.warn("Error setting budget:", err);
      showModal({ type: 'error', title: 'Error', message: 'Failed to save budget. Please try again.' });
    }
  };

  const dailyAllowance = budgetData?.daily_allowance || 0;
  const weeklyAllowance = budgetData?.weekly_allowance || 0;
  const monthlyBudgetVal = budgetData?.monthly_budget || 0;

  const getActiveSpent = () => {
    if (activeTab === 'daily') return todayUsage.totalCost;
    if (activeTab === 'weekly') return weekUsage.totalCost;
    return monthUsage.totalCost;
  };
  const getActiveLimit = () => {
    if (activeTab === 'daily') return dailyAllowance;
    if (activeTab === 'weekly') return weeklyAllowance;
    return monthlyBudgetVal;
  };
  const activeSpent = getActiveSpent();
  const activeLimit = getActiveLimit();
  const activePct = activeLimit > 0 ? (activeSpent / activeLimit) * 100 : 0;

  // Animation values for the Alert Status bar
  const animatedPct = useRef(new Animated.Value(activePct)).current;
  
  useEffect(() => {
    Animated.timing(animatedPct, {
      toValue: activePct,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false // Animating width percentage requires JS driver
    }).start();
  }, [activePct, animatedPct]);

  const getStatusInfo = (pct) => {
    if (pct < 75) return { text: 'NORMAL', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', msg: 'You are within your safe budget range.' };
    if (pct < 90) return { text: 'APPROACHING', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', msg: 'You are getting close to your budget limit.' };
    if (pct <= 100) return { text: 'WARNING', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', msg: 'You are almost at your budget limit. Monitor your consumption.' };
    return { text: 'EXCEEDED', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)', msg: 'You have exceeded your budget. Please manage your consumption.' };
  };

  const statusInfo = getStatusInfo(activePct);



  // Reset budget handler
  const handleResetBudget = () => {
    setResetVisible(true);
  };

  const confirmResetBudget = async () => {
    await resetBudget(roomId);
    setBudgetData(null);
    setMonthlyBudgetInput('');
    setBudgetConfirm(null);
    setResetVisible(false);
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const safeTs = typeof ts === 'string' ? ts.replace(' ', 'T') : ts;
    const d = new Date(safeTs);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };
  const formatTime = (ts) => {
    if (!ts) return '';
    const safeTs = typeof ts === 'string' ? ts.replace(' ', 'T') : ts;
    const d = new Date(safeTs);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <KeyboardAvoidingView style={[s.container, { backgroundColor: COLORS.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>


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

        {/* Empty State for No Budget */}
        {!budgetData && !editing && (
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
        )}

        {/* Reset Budget Modal */}
        <BaseModal visible={resetVisible} onClose={() => setResetVisible(false)}>
          <ModalHeader 
            title="Reset Budget" 
            icon="trash" 
            iconColor={COLORS.danger} 
            onClose={() => setResetVisible(false)} 
          />
          <ModalBody scrollable={false}>
            <Text style={s.modalMessage}>
              This will clear your budget settings for this month. You can set a new budget afterwards. Are you sure?
            </Text>
          </ModalBody>
          <ModalFooter 
            primaryLabel="Reset"
            onPrimaryPress={confirmResetBudget}
            primaryDanger={true}
            secondaryLabel="Cancel"
            onSecondaryPress={() => setResetVisible(false)}
          />
        </BaseModal>

        {/* Inline Budget Confirmation (replaces pop-up) */}
        {budgetConfirm && (
          <GlassCard style={s.confirmCard}>
            <View style={s.confirmHeader}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={s.confirmTitle}>Budget Updated</Text>
              <TouchableOpacity onPress={() => setBudgetConfirm(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={s.confirmGrid}>
              <View style={s.confirmItem}>
                <Text style={s.confirmLabel}>Monthly</Text>
                <Text style={s.confirmValue}>₱{Number(budgetConfirm.monthly || 0).toFixed(2)}</Text>
              </View>
              <View style={s.confirmDivider} />
              <View style={s.confirmItem}>
                <Text style={s.confirmLabel}>Daily</Text>
                <Text style={s.confirmValue}>₱{Number(budgetConfirm.daily || 0).toFixed(2)}</Text>
              </View>
              <View style={s.confirmDivider} />
              <View style={s.confirmItem}>
                <Text style={s.confirmLabel}>Weekly</Text>
                <Text style={s.confirmValue}>₱{Number(budgetConfirm.weekly || 0).toFixed(2)}</Text>
              </View>
            </View>
            <Text style={s.confirmSub}>{budgetConfirm.daysInMonth} days in this month</Text>
          </GlassCard>
        )}

        {/* Budget Overview with Tabs */}
        {budgetData && !editing && (
          <View>
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

            {/* Budget Breakdown */}
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
                  { label: 'Daily', limit: dailyAllowance, spent: todayUsage.totalCost, icon: 'today-outline', color: COLORS.info },
                  { label: 'Weekly', limit: weeklyAllowance, spent: weekUsage.totalCost, icon: 'calendar-outline', color: COLORS.accent },
                  { label: 'Monthly', limit: monthlyBudgetVal, spent: monthUsage.totalCost, icon: 'albums-outline', color: COLORS.primary },
                ].map((item, i) => {
                  const pct = item.limit > 0 ? Math.min((item.spent / item.limit) * 100, 100) : 0;
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
                        <Text style={s.breakdownSpent}>₱{Number(item.spent || 0).toFixed(2)}</Text>
                        <Text style={s.breakdownLimit}>/ ₱{Number(item.limit || 0).toFixed(2)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
              <View style={s.remainingInfo}>
                <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
                <Text style={s.remainingText}>
                  {billingCycle?.cycle_end ? Math.max(0, Math.ceil((new Date(billingCycle.cycle_end.replace(' ', 'T')) - new Date()) / (1000 * 60 * 60 * 24))) : (budgetData?.remaining_days || 0)} days remaining this cycle
                </Text>
              </View>
            </GlassCard>
          </View>
        )}

        {/* Comparison Card */}
        {comparison && (comparison.current.totalCost > 0 || comparison.previous.totalCost > 0) && (
          <GlassCard style={s.compCard}>
            <View style={s.compHeader}>
              <View style={s.compTitleRow}>
                <Ionicons name="swap-horizontal" size={20} color={COLORS.info} />
                <Text style={s.compTitle}>Comparison</Text>
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
                <Text style={s.compColVal}>₱{Number(comparison.previous?.totalCost || 0).toFixed(2)}</Text>
                <Text style={s.compColSub}>{Number(comparison.previous?.totalEnergy || 0).toFixed(3)} kWh</Text>
              </View>
              <View style={s.compArrow}>
                <Ionicons name="arrow-forward" size={20} color={COLORS.textMuted} />
              </View>
              <View style={s.compCol}>
                <Text style={s.compColLabel}>Current</Text>
                <Text style={s.compColVal}>₱{Number(comparison.current?.totalCost || 0).toFixed(2)}</Text>
                <Text style={s.compColSub}>{Number(comparison.current?.totalEnergy || 0).toFixed(3)} kWh</Text>
              </View>
            </View>
            {comparison.costPctChange !== 0 && (
              <View style={[s.compBadge, { backgroundColor: comparison.costPctChange > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)' }]}>
                <Ionicons name={comparison.costPctChange > 0 ? 'trending-up' : 'trending-down'} size={16}
                  color={comparison.costPctChange > 0 ? COLORS.danger : COLORS.primary} />
                <Text style={[s.compBadgeText, { color: comparison.costPctChange > 0 ? COLORS.danger : COLORS.primary }]}>
                  Consumption is {Math.abs(Number(comparison.costPctChange || 0)).toFixed(1)}% {comparison.costPctChange > 0 ? 'higher' : 'lower'} than last {compPeriod === 'daily' ? 'day' : compPeriod === 'weekly' ? 'week' : 'month'}
                </Text>
              </View>
            )}
          </GlassCard>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
