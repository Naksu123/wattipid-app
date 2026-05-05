import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../theme';

export default StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  scroll: { 
    padding: SPACING.lg, 
    paddingTop: SPACING.xxl + 10, 
    paddingBottom: SPACING.xxl 
  },
  title: { 
    fontSize: FONT_SIZE.xxl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  subtitle: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary, 
    marginBottom: SPACING.lg 
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
    backgroundColor: COLORS.backgroundLight, 
    borderRadius: RADIUS.lg, 
    borderWidth: 2, 
    borderColor: COLORS.primary, 
    paddingHorizontal: SPACING.lg, 
    height: 72, 
    width: '100%' 
  },
  currencyLabel: { 
    fontSize: 36, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.primary, 
    marginRight: SPACING.xs 
  },
  inputModal: { 
    flex: 1, 
    fontSize: 36, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary, 
    height: '100%', 
    textAlign: 'left' 
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
    backgroundColor: 'rgba(59,130,246,0.1)', 
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
  confirmCard: { 
    marginBottom: SPACING.lg, 
    borderLeftWidth: 3, 
    borderLeftColor: COLORS.primary 
  },
  confirmHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    marginBottom: SPACING.md 
  },
  confirmTitle: { 
    flex: 1, 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.primary 
  },
  confirmGrid: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  confirmItem: { 
    flex: 1, 
    alignItems: 'center' 
  },
  confirmLabel: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginBottom: 2 
  },
  confirmValue: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  confirmDivider: { 
    width: 1, 
    height: 28, 
    backgroundColor: COLORS.border 
  },
  confirmSub: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    textAlign: 'center', 
    marginTop: SPACING.sm 
  },
  tabRow: { 
    flexDirection: 'row', 
    gap: SPACING.sm, 
    marginBottom: SPACING.md 
  },
  tabBtn: { 
    flex: 1, 
    paddingVertical: SPACING.sm + 2, 
    borderRadius: RADIUS.md, 
    backgroundColor: COLORS.surfaceGlass, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  tabActive: { 
    backgroundColor: 'rgba(34,197,94,0.1)', 
    borderColor: COLORS.primary 
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
  breakdownCard: { 
    marginBottom: SPACING.lg 
  },
  breakdownHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: SPACING.md 
  },
  breakdownTitle: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.textPrimary 
  },
  breakdownActions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm 
  },
  resetBudgetBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    paddingHorizontal: SPACING.sm, 
    paddingVertical: 4, 
    borderRadius: RADIUS.full, 
    borderWidth: 1, 
    borderColor: COLORS.danger 
  },
  resetBudgetText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.danger, 
    fontWeight: FONT_WEIGHT.medium 
  },
  editBudgetBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    paddingHorizontal: SPACING.sm, 
    paddingVertical: 4, 
    borderRadius: RADIUS.full, 
    borderWidth: 1, 
    borderColor: COLORS.primary 
  },
  editBudgetText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.medium 
  },
  breakdownGrid: { 
    gap: SPACING.md 
  },
  breakdownItem: { 
    gap: SPACING.xs 
  },
  breakdownItemHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm 
  },
  breakdownIconWrap: { 
    width: 28, 
    height: 28, 
    borderRadius: 8, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  breakdownLabel: { 
    flex: 1, 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.medium 
  },
  breakdownPct: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textMuted, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  bar: { 
    height: 6, 
    backgroundColor: COLORS.surfaceLight, 
    borderRadius: 3, 
    overflow: 'hidden' 
  },
  barFill: { 
    height: '100%', 
    borderRadius: 3 
  },
  breakdownAmounts: { 
    flexDirection: 'row', 
    gap: 4 
  },
  breakdownSpent: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textSecondary, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  breakdownLimit: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted 
  },
  remainingInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.xs, 
    marginTop: SPACING.md, 
    paddingTop: SPACING.md, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.border 
  },
  remainingText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted 
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
    marginBottom: SPACING.sm 
  },
  compTitle: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.textPrimary 
  },
  compPeriodRow: { 
    flexDirection: 'row', 
    gap: SPACING.xs 
  },
  compPeriodBtn: { 
    paddingHorizontal: SPACING.sm, 
    paddingVertical: 4, 
    borderRadius: RADIUS.full, 
    backgroundColor: COLORS.surfaceLight 
  },
  compPeriodActive: { 
    backgroundColor: 'rgba(59,130,246,0.15)' 
  },
  compPeriodText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted 
  },
  compPeriodTextActive: { 
    color: COLORS.info, 
    fontWeight: FONT_WEIGHT.semibold 
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
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginBottom: 4 
  },
  compColVal: { 
    fontSize: FONT_SIZE.lg, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  compColSub: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: 2 
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
    marginBottom: SPACING.xxl 
  },
  txnHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    marginBottom: SPACING.md 
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
    fontWeight: FONT_WEIGHT.semibold, 
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
    marginBottom: SPACING.xs 
  },
  txnIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
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
    fontWeight: FONT_WEIGHT.medium 
  },
  txnTime: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: 2 
  },
  txnAmountCol: { 
    alignItems: 'flex-end' 
  },
  txnAmount: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.danger, 
    fontWeight: FONT_WEIGHT.bold 
  },
  txnPower: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: 2 
  },
  emptyTxn: { 
    alignItems: 'center', 
    paddingVertical: SPACING.xl, 
    gap: SPACING.sm 
  },
  emptyTxnText: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary, 
    fontWeight: FONT_WEIGHT.medium 
  },
  emptyTxnSub: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textMuted 
  },
});
