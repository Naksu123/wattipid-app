import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../theme';

export default StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  scroll: { 
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg, 
    paddingTop: SPACING.xl + 20,
    paddingBottom: SPACING.xxl * 3 
  },
  title: { 
    fontSize: FONT_SIZE.xxl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary,
    letterSpacing: -0.5
  },
  subtitle: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary, 
    marginBottom: SPACING.xl 
  },
  headerContainer: {
    marginBottom: 20
  },
  fullWidth: {
    width: '100%'
  },
  sectionDesc: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary, 
    marginBottom: SPACING.xl, 
    lineHeight: 22, 
    textAlign: 'center' 
  },
  budgetInputContainer: { 
    marginBottom: SPACING.xl, 
    alignItems: 'center' 
  },
  budgetInputWrap: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: SPACING.lg, 
    height: 80, 
    width: '100%',
    marginBottom: SPACING.md
  },
  currencyLabel: { 
    fontSize: 42, 
    fontWeight: '300', 
    color: COLORS.textMuted, 
    marginRight: SPACING.xs,
    marginTop: 6
  },
  inputModal: { 
    fontSize: 56, 
    fontWeight: '300', 
    color: COLORS.textPrimary, 
    height: '100%', 
    textAlign: 'center',
    minWidth: 150
  },
  presetChipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl
  },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.06)'
  },
  presetChipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '500'
  },
  livePreviewContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    paddingVertical: 4,
    alignSelf: 'center'
  },
  livePreviewText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '400',
    letterSpacing: 0.5
  },
  modalMessage: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary, 
    lineHeight: 22 
  },
  emptyBudgetCard: { 
    alignItems: 'center', 
    paddingVertical: SPACING.xxl, 
    marginBottom: SPACING.lg 
  },
  emptyBudgetIconWrap: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: 'rgba(16, 185, 129, 0.1)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: SPACING.md 
  },
  emptyBudgetTitle: { 
    fontSize: FONT_SIZE.xl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary, 
    marginBottom: SPACING.xs 
  },
  emptyBudgetDesc: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    textAlign: 'center', 
    paddingHorizontal: SPACING.lg, 
    marginBottom: SPACING.xl, 
    lineHeight: 20 
  },
  emptyBudgetBtn: { 
    paddingVertical: SPACING.md, 
    borderRadius: RADIUS.md, 
    alignItems: 'center', 
    width: '100%' 
  },
  emptyBudgetBtnText: { 
    color: '#fff', 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold 
  },

  tabRow: { 
    flexDirection: 'row', 
    gap: SPACING.sm, 
    marginBottom: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.full,
    padding: 4
  },
  tabBtn: { 
    flex: 1, 
    paddingVertical: SPACING.sm + 2, 
    borderRadius: RADIUS.full, 
    alignItems: 'center', 
  },
  tabActive: { 
    backgroundColor: 'rgba(16,185,129,0.15)', 
  },
  tabText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textMuted, 
    fontWeight: FONT_WEIGHT.medium 
  },
  tabTextActive: { 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  liveIndicatorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
    gap: 6
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium
  },
  progressCard: { 
    marginBottom: SPACING.lg, 
    alignItems: 'center' 
  },
  progressCenter: { 
    paddingVertical: SPACING.md 
  },
  warningBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: SPACING.xs, 
    paddingVertical: SPACING.sm, 
    marginTop: SPACING.sm, 
    backgroundColor: 'rgba(245,158,11,0.08)', 
    borderRadius: RADIUS.md, 
    width: '100%' 
  },
  warningText: { 
    fontSize: FONT_SIZE.sm, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  alertBadgeContainer: {
    marginTop: SPACING.lg,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  alertBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  mainActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.lg,
    width: '100%'
  },
  mainEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  mainResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)'
  },
  breakdownCard: { 
    marginBottom: SPACING.lg 
  },
  breakdownHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: SPACING.lg,
    gap: SPACING.sm 
  },
  breakdownTitle: { 
    flex: 1,
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary,
  },
  breakdownActions: { 
    display: 'none'
  },
  resetBudgetBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    paddingHorizontal: SPACING.sm, 
    paddingVertical: 6, 
    borderRadius: RADIUS.full, 
    backgroundColor: 'rgba(239,68,68,0.1)'
  },
  resetBudgetText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.danger, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  editBudgetBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    paddingHorizontal: SPACING.sm, 
    paddingVertical: 6, 
    borderRadius: RADIUS.full, 
    backgroundColor: 'rgba(16,185,129,0.1)'
  },
  editBudgetText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  breakdownGrid: { 
    gap: SPACING.lg 
  },
  breakdownItem: { 
    gap: SPACING.xs 
  },
  breakdownItemHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.md 
  },
  breakdownIconWrap: { 
    width: 32, 
    height: 32, 
    borderRadius: RADIUS.sm, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  breakdownLabel: { 
    flex: 1, 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  breakdownPct: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    fontWeight: FONT_WEIGHT.bold 
  },
  bar: { 
    height: 8, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 4, 
    overflow: 'hidden',
    marginTop: 4
  },
  barFill: { 
    height: '100%', 
    borderRadius: 4 
  },
  breakdownAmounts: { 
    flexDirection: 'row', 
    gap: 4,
    marginTop: 4 
  },
  breakdownSpent: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.bold 
  },
  breakdownLimit: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary 
  },
  remainingInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    marginTop: SPACING.lg, 
    paddingTop: SPACING.md, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.05)' 
  },
  remainingText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary 
  },
  compCard: { 
    marginBottom: SPACING.lg 
  },
  compHeader: { 
    marginBottom: SPACING.md 
  },
  compTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    marginBottom: SPACING.md 
  },
  compTitle: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  compPeriodRow: { 
    flexDirection: 'row', 
    gap: SPACING.xs,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.full,
    padding: 4
  },
  compPeriodBtn: { 
    flex: 1,
    paddingHorizontal: SPACING.sm, 
    paddingVertical: 6, 
    borderRadius: RADIUS.full, 
    alignItems: 'center'
  },
  compPeriodActive: { 
    backgroundColor: 'rgba(59,130,246,0.15)' 
  },
  compPeriodText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium
  },
  compPeriodTextActive: { 
    color: COLORS.info, 
    fontWeight: FONT_WEIGHT.bold 
  },
  compBody: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: SPACING.md 
  },
  compCol: { 
    flex: 1, 
    alignItems: 'center' 
  },
  compColLabel: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    marginBottom: 6 
  },
  compColVal: { 
    fontSize: FONT_SIZE.xl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  compColSub: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: 4 
  },
  compArrow: { 
    paddingHorizontal: SPACING.sm 
  },
  compBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: SPACING.xs, 
    paddingVertical: SPACING.sm, 
    paddingHorizontal: SPACING.md, 
    borderRadius: RADIUS.md 
  },
  compBadgeText: { 
    fontSize: FONT_SIZE.sm, 
    fontWeight: FONT_WEIGHT.medium, 
    flex: 1 
  },
  txnSection: { 
    marginBottom: SPACING.xxl * 2 
  },
  txnHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    marginBottom: SPACING.lg 
  },
  txnTitle: { 
    fontSize: FONT_SIZE.lg, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  txnGroup: { 
    marginBottom: SPACING.md 
  },
  txnDate: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    fontWeight: FONT_WEIGHT.bold, 
    textTransform: 'uppercase', 
    letterSpacing: 1, 
    marginBottom: SPACING.sm, 
    marginLeft: SPACING.xs 
  },
  txnCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.md, 
    padding: SPACING.md, 
    marginBottom: SPACING.sm 
  },
  txnIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: RADIUS.md, 
    backgroundColor: 'rgba(249,115,22,0.1)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  txnContent: { 
    flex: 1 
  },
  txnName: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  txnTime: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textSecondary, 
    marginTop: 4 
  },
  txnAmountCol: { 
    alignItems: 'flex-end' 
  },
  txnAmount: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.danger, 
    fontWeight: FONT_WEIGHT.bold 
  },
  txnPower: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: 4 
  },
  emptyTxn: { 
    alignItems: 'center', 
    paddingVertical: SPACING.xl, 
    gap: SPACING.sm 
  },
  emptyTxnText: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  emptyTxnSub: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textMuted 
  },
  // Budget Confirmation Card Styles
  confirmCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  confirmTitle: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  confirmGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmItem: {
    flex: 1,
    alignItems: 'center',
  },
  confirmLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  confirmValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  confirmDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  confirmSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  }
});
