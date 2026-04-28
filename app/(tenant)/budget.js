import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { setBudget, getBudget, getTotalConsumptionToday, getTotalConsumptionWeek, getTotalConsumptionMonth, getTransactionHistory, getConsumptionComparison, getDatabase } from '../../services/database';
import BudgetProgressRing from '../../components/BudgetProgressRing';
import GlassCard from '../../components/GlassCard';
import { BaseModal, ModalHeader, ModalBody, ModalFooter } from '../../components/BaseModal';

import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, GRADIENTS } from '../../constants/theme';

const BUDGET_TABS = ['daily', 'weekly', 'monthly'];

export default function BudgetScreen() {
  const { user } = useAuth();
  const roomId = user?.room_id || 'Room 1';
  const [monthlyBudget, setMonthlyBudgetInput] = useState('');
  const [budgetData, setBudgetData] = useState(null);
  const [todayUsage, setTodayUsage] = useState({ totalEnergy: 0, totalCost: 0 });
  const [weekUsage, setWeekUsage] = useState({ totalEnergy: 0, totalCost: 0 });
  const [monthUsage, setMonthUsage] = useState({ totalEnergy: 0, totalCost: 0 });
  const [comparison, setComparison] = useState(null);
  const [compPeriod, setCompPeriod] = useState('weekly');
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('monthly');
  const [editing, setEditing] = useState(false);
  const [resetVisible, setResetVisible] = useState(false);
  const [budgetConfirm, setBudgetConfirm] = useState(null); // inline confirmation message

  const loadData = useCallback(async () => {
    if (!user || !roomId) return;
    const [b, t, w, m, txns, comp] = await Promise.all([
      getBudget(roomId),
      getTotalConsumptionToday(roomId, user?.name),
      getTotalConsumptionWeek(roomId, user?.name),
      getTotalConsumptionMonth(roomId, user?.name),
      getTransactionHistory(roomId, 20, 'all', user?.name),
      getConsumptionComparison(roomId, compPeriod, user?.name),
    ]);
    if (b) { setBudgetData(b); setMonthlyBudgetInput(b.monthly_budget.toString()); }
    setTodayUsage(t);
    setWeekUsage(w);
    setMonthUsage(m);
    setTransactions(txns || []);
    setComparison(comp);
  }, [roomId, user?.name, compPeriod]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSetBudget = async () => {
    const val = parseFloat(monthlyBudget);
    if (!val || val <= 0) { Alert.alert('Invalid', 'Enter a valid budget amount'); return; }
    const result = await setBudget(roomId, val);
    setBudgetData({ monthly_budget: val, daily_allowance: result.dailyAllowance, weekly_allowance: result.weeklyAllowance, remaining_days: result.remainingDays, days_in_month: result.daysInMonth });
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
    loadData();
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



  // Reset budget handler
  const handleResetBudget = () => {
    setResetVisible(true);
  };

  const confirmResetBudget = async () => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM budget_settings WHERE room_id = ?', [roomId]);
    setBudgetData(null);
    setMonthlyBudgetInput('');
    setBudgetConfirm(null);
    setResetVisible(false);
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };
  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group transactions by date
  const groupedTxns = transactions.reduce((acc, tx) => {
    const date = tx.date_label || formatDate(tx.timestamp);
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {});

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Budget Manager</Text>
        <Text style={s.subtitle}>Track spending across daily, weekly & monthly</Text>


        {/* Budget Setup / Edit Modal */}
        <BaseModal visible={editing} onClose={() => setEditing(false)}>
          <ModalHeader 
            title="Set Monthly Budget" 
            icon="wallet" 
            iconColor={COLORS.primary} 
            onClose={budgetData ? () => setEditing(false) : null} 
          />
          <ModalBody scrollable={false}>
            <Text style={s.sectionDesc}>
              We'll calculate your daily and weekly allowances proportionally based on the number of days this month.
            </Text>
            <View style={s.budgetInputContainer}>
              <View style={s.budgetInputWrap}>
                <Text style={s.currencyLabel}>₱</Text>
                <TextInput 
                  style={s.inputModal} 
                  placeholder="0.00" 
                  placeholderTextColor={COLORS.textMuted}
                  value={monthlyBudget} 
                  onChangeText={setMonthlyBudgetInput} 
                  keyboardType="numeric" 
                  autoFocus
                />
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
            <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.8} style={{ width: '100%' }}>
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

            {/* Progress Ring */}
            <GlassCard style={s.progressCard}>
              <View style={s.progressCenter}>
                <BudgetProgressRing spent={activeSpent} limit={activeLimit} size={160}
                  label={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Budget`} />
              </View>
              {activePct >= 90 && (
                <View style={s.warningBanner}>
                  <Ionicons name="warning" size={16} color={activePct >= 100 ? COLORS.danger : COLORS.warning} />
                  <Text style={[s.warningText, { color: activePct >= 100 ? COLORS.danger : COLORS.warning }]}>
                    {activePct >= 100 ? 'Budget exceeded!' : 'Approaching limit!'}
                  </Text>
                </View>
              )}
            </GlassCard>

            {/* Budget Breakdown */}
            <GlassCard style={s.breakdownCard}>
              <View style={s.breakdownHeader}>
                <Text style={s.breakdownTitle}>Budget Breakdown</Text>
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
                <Text style={s.remainingText}>{budgetData?.remaining_days || 0} days remaining this month</Text>
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

        {/* Transaction History - GCash Style */}
        <View style={s.txnSection}>
          <View style={s.txnHeader}>
            <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
            <Text style={s.txnTitle}>Recent Transactions</Text>
          </View>
          {Object.keys(groupedTxns).length > 0 ? (
            Object.entries(groupedTxns).map(([date, txns]) => (
              <View key={date} style={s.txnGroup}>
                <Text style={s.txnDate}>{formatDate(date)}</Text>
                {txns.map((tx, i) => (
                  <GlassCard key={tx.id || i} style={s.txnCard}>
                    <View style={s.txnIcon}>
                      <Ionicons name="flash" size={18} color={COLORS.accent} />
                    </View>
                    <View style={s.txnContent}>
                      <Text style={s.txnName}>Energy Consumption</Text>
                      <Text style={s.txnTime}>{tx.time_label || formatTime(tx.timestamp)} • {Number(tx.energy || 0).toFixed(4)} kWh</Text>
                    </View>
                    <View style={s.txnAmountCol}>
                      <Text style={s.txnAmount}>-₱{(tx.cost || 0).toFixed(2)}</Text>
                      <Text style={s.txnPower}>{(tx.power || 0).toFixed(0)}W</Text>
                    </View>
                  </GlassCard>
                ))}
              </View>
            ))
          ) : (
            <GlassCard style={s.emptyTxn}>
              <Ionicons name="document-text-outline" size={32} color={COLORS.textMuted} />
              <Text style={s.emptyTxnText}>No transactions yet</Text>
              <Text style={s.emptyTxnSub}>Consumption data will appear here</Text>
            </GlassCard>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl + 10, paddingBottom: SPACING.xxl },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  // Setup
  sectionDesc: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginBottom: SPACING.xl, lineHeight: 22, textAlign: 'center' },
  budgetInputContainer: { marginBottom: SPACING.xl, alignItems: 'center' },
  budgetInputWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.backgroundLight, borderRadius: RADIUS.lg, borderWidth: 2, borderColor: COLORS.primary, paddingHorizontal: SPACING.lg, height: 72, width: '100%' },
  currencyLabel: { fontSize: 36, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary, marginRight: SPACING.xs },
  inputModal: { flex: 1, fontSize: 36, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, height: '100%', textAlign: 'left' },
  modalMessage: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, lineHeight: 22 },
  // Empty Budget State
  emptyBudgetCard: { alignItems: 'center', paddingVertical: SPACING.xxl, marginBottom: SPACING.lg },
  emptyBudgetIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(59,130,246,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  emptyBudgetTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  emptyBudgetDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl, lineHeight: 20 },
  emptyBudgetBtn: { paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', width: '100%' },
  emptyBudgetBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold },
  // Inline confirmation
  confirmCard: { marginBottom: SPACING.lg, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  confirmHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  confirmTitle: { flex: 1, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.primary },
  confirmGrid: { flexDirection: 'row', alignItems: 'center' },
  confirmItem: { flex: 1, alignItems: 'center' },
  confirmLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginBottom: 2 },
  confirmValue: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  confirmDivider: { width: 1, height: 28, backgroundColor: COLORS.border },
  confirmSub: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm },
  // Tabs
  tabRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  tabBtn: { flex: 1, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceGlass, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: COLORS.primary },
  tabText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, fontWeight: FONT_WEIGHT.medium },
  tabTextActive: { color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold },
  // Progress
  progressCard: { marginBottom: SPACING.lg, alignItems: 'center' },
  progressCenter: { paddingVertical: SPACING.md },
  warningBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.sm, marginTop: SPACING.sm, backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: RADIUS.md, width: '100%' },
  warningText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  // Breakdown
  breakdownCard: { marginBottom: SPACING.lg },
  breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  breakdownTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textPrimary },
  breakdownActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  resetBudgetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.danger },
  resetBudgetText: { fontSize: FONT_SIZE.xs, color: COLORS.danger, fontWeight: FONT_WEIGHT.medium },
  editBudgetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.primary },
  editBudgetText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: FONT_WEIGHT.medium },
  breakdownGrid: { gap: SPACING.md },
  breakdownItem: { gap: SPACING.xs },
  breakdownItemHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  breakdownIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  breakdownLabel: { flex: 1, fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: FONT_WEIGHT.medium },
  breakdownPct: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, fontWeight: FONT_WEIGHT.semibold },
  bar: { height: 6, backgroundColor: COLORS.surfaceLight, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  breakdownAmounts: { flexDirection: 'row', gap: 4 },
  breakdownSpent: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.semibold },
  breakdownLimit: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  remainingInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  remainingText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  // Comparison
  compCard: { marginBottom: SPACING.lg },
  compHeader: { marginBottom: SPACING.md },
  compTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  compTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textPrimary },
  compPeriodRow: { flexDirection: 'row', gap: SPACING.xs },
  compPeriodBtn: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceLight },
  compPeriodActive: { backgroundColor: 'rgba(59,130,246,0.15)' },
  compPeriodText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  compPeriodTextActive: { color: COLORS.info, fontWeight: FONT_WEIGHT.semibold },
  compBody: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  compCol: { flex: 1, alignItems: 'center' },
  compColLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginBottom: 4 },
  compColVal: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  compColSub: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  compArrow: { paddingHorizontal: SPACING.sm },
  compBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md },
  compBadgeText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium, flex: 1 },
  // Transactions
  txnSection: { marginBottom: SPACING.xxl },
  txnHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  txnTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  txnGroup: { marginBottom: SPACING.md },
  txnDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: FONT_WEIGHT.semibold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.sm, marginLeft: SPACING.xs },
  txnCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, marginBottom: SPACING.xs },
  txnIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(249,115,22,0.1)', alignItems: 'center', justifyContent: 'center' },
  txnContent: { flex: 1 },
  txnName: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: FONT_WEIGHT.medium },
  txnTime: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  txnAmountCol: { alignItems: 'flex-end' },
  txnAmount: { fontSize: FONT_SIZE.sm, color: COLORS.danger, fontWeight: FONT_WEIGHT.bold },
  txnPower: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  emptyTxn: { alignItems: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
  emptyTxnText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.medium },
  emptyTxnSub: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
});
