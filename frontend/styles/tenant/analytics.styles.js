import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../theme';

const screenWidth = Dimensions.get('window').width - SPACING.lg * 2;

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
  periodRow: { 
    flexDirection: 'row', 
    gap: SPACING.sm, 
    marginBottom: SPACING.lg 
  },
  periodBtn: { 
    flex: 1, 
    paddingVertical: SPACING.sm + 2, 
    borderRadius: RADIUS.md, 
    backgroundColor: COLORS.surfaceGlass, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  periodActive: { 
    backgroundColor: 'rgba(34,197,94,0.1)', 
    borderColor: COLORS.primary 
  },
  periodText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textMuted, 
    fontWeight: FONT_WEIGHT.medium 
  },
  periodTextActive: { 
    color: COLORS.primary 
  },
  statsRow: { 
    flexDirection: 'row', 
    gap: SPACING.sm, 
    marginBottom: SPACING.lg 
  },
  statCard: { 
    flex: 1, 
    alignItems: 'center', 
    padding: SPACING.md 
  },
  statValue: { 
    fontSize: FONT_SIZE.lg, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary, 
    marginTop: SPACING.xs 
  },
  statLabel: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: 2 
  },
  compBanner: { 
    marginBottom: SPACING.lg 
  },
  compBannerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.md, 
    marginBottom: SPACING.md 
  },
  compIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  compBannerContent: { 
    flex: 1 
  },
  compBannerTitle: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  compBannerSub: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: 2 
  },
  compDetails: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: SPACING.md, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.border 
  },
  compDetailItem: { 
    flex: 1, 
    alignItems: 'center' 
  },
  compDetailLabel: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginBottom: 4 
  },
  compDetailVal: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.bold 
  },
  compDetailDivider: { 
    width: 1, 
    height: 32, 
    backgroundColor: COLORS.border 
  },
  viewToggle: { 
    flexDirection: 'row', 
    gap: SPACING.sm, 
    marginBottom: SPACING.lg 
  },
  viewTab: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: SPACING.xs, 
    paddingVertical: SPACING.sm, 
    borderRadius: RADIUS.md, 
    backgroundColor: COLORS.surfaceGlass, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  viewTabActive: { 
    backgroundColor: 'rgba(34,197,94,0.08)', 
    borderColor: COLORS.primary 
  },
  viewTabText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    fontWeight: FONT_WEIGHT.medium 
  },
  viewTabTextActive: { 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  reportCard: { 
    marginBottom: SPACING.lg 
  },
  reportHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    marginBottom: SPACING.xs 
  },
  reportTitle: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.textPrimary 
  },
  reportDesc: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginBottom: SPACING.md 
  },
  reportBtns: { 
    flexDirection: 'row', 
    gap: SPACING.sm 
  },
  reportBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: SPACING.xs, 
    paddingVertical: SPACING.sm + 2, 
    borderRadius: RADIUS.md, 
    backgroundColor: 'rgba(59,130,246,0.08)', 
    borderWidth: 1, 
    borderColor: 'rgba(59,130,246,0.2)' 
  },
  reportBtnText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.info, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  chartCard: { 
    marginBottom: SPACING.lg 
  },
  chartTitle: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.textPrimary 
  },
  chartHelpText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginBottom: SPACING.md, 
    marginTop: 2 
  },
  chartScroll: { 
    paddingRight: SPACING.lg 
  },
  chart: { 
    marginLeft: -SPACING.sm, 
    borderRadius: RADIUS.md 
  },
  noData: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textMuted, 
    textAlign: 'center', 
    paddingVertical: SPACING.xxl 
  },
  selectedPointCard: { 
    marginBottom: SPACING.lg, 
    borderColor: COLORS.primary, 
    borderWidth: 1 
  },
  selectedHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: SPACING.md 
  },
  selectedTitle: { 
    flex: 1, 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.primary, 
    marginLeft: SPACING.xs 
  },
  closeSelectedBtn: { 
    padding: SPACING.xs 
  },
  selectedGrid: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  selectedItem: { 
    flex: 1, 
    alignItems: 'center' 
  },
  selectedItemLabel: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginBottom: 4 
  },
  selectedItemValue: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  selectedDivider: { 
    width: 1, 
    height: 30, 
    backgroundColor: COLORS.border 
  },
  insightCard: { 
    marginBottom: SPACING.xxl 
  },
  insightHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    marginBottom: SPACING.sm 
  },
  insightTitle: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.textPrimary 
  },
  insightText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    lineHeight: 22 
  },
  totalsCard: { 
    marginBottom: SPACING.lg 
  },
  totalsTitle: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.textPrimary 
  },
  totalsDesc: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: 2, 
    marginBottom: SPACING.md 
  },
  totalsGrid: { 
    flexDirection: 'row', 
    gap: SPACING.sm 
  },
  totalItem: { 
    flex: 1, 
    alignItems: 'center', 
    gap: 4, 
    padding: SPACING.sm, 
    borderRadius: RADIUS.md, 
    backgroundColor: 'rgba(255,255,255,0.03)' 
  },
  totalIcon: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 4 
  },
  totalLabel: { 
    fontSize: 10, 
    color: COLORS.textMuted, 
    fontWeight: FONT_WEIGHT.medium, 
    textAlign: 'center' 
  },
  totalEnergy: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.bold, 
    textAlign: 'center' 
  },
  totalCost: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.semibold, 
    textAlign: 'center' 
  },
  breakdownCard: { 
    marginBottom: SPACING.xxl 
  },
  breakdownHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm 
  },
  breakdownTitle: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.textPrimary 
  },
  breakdownDesc: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: 2, 
    marginBottom: SPACING.md 
  },
  tableHeader: { 
    flexDirection: 'row', 
    paddingVertical: SPACING.sm, 
    paddingHorizontal: SPACING.xs, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  tableHeaderCell: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    fontWeight: FONT_WEIGHT.semibold, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  tableRow: { 
    flexDirection: 'row', 
    paddingVertical: SPACING.sm, 
    paddingHorizontal: SPACING.xs, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(148,163,184,0.06)' 
  },
  tableRowAlt: { 
    backgroundColor: 'rgba(255,255,255,0.02)' 
  },
  tableCell: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textSecondary 
  },
  tableCellHighlight: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.medium 
  },
  tableTotalRow: { 
    flexDirection: 'row', 
    paddingVertical: SPACING.sm + 2, 
    paddingHorizontal: SPACING.xs, 
    borderTopWidth: 2, 
    borderTopColor: COLORS.primary, 
    marginTop: SPACING.xs 
  },
  tableTotalCell: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.bold 
  },
  historySection: { 
    marginBottom: SPACING.xxl 
  },
  histGroup: { 
    marginBottom: SPACING.md 
  },
  histDateRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: SPACING.sm, 
    paddingHorizontal: SPACING.sm 
  },
  histDate: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    fontWeight: FONT_WEIGHT.bold, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  histDayTotal: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.danger, 
    fontWeight: FONT_WEIGHT.bold 
  },
  histItem: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    paddingLeft: SPACING.sm, 
    marginBottom: SPACING.xs 
  },
  histDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: COLORS.primary, 
    marginTop: 14, 
    zIndex: 1 
  },
  histLine: { 
    position: 'absolute', 
    left: SPACING.sm + 3, 
    top: 22, 
    bottom: -6, 
    width: 2, 
    backgroundColor: COLORS.border, 
    opacity: 0.5 
  },
  histContent: { 
    flex: 1, 
    marginLeft: SPACING.md, 
    paddingVertical: SPACING.md, 
    paddingHorizontal: SPACING.md, 
    backgroundColor: COLORS.surfaceGlass, 
    borderRadius: RADIUS.md, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  histTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  histName: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.medium 
  },
  histAmount: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.danger, 
    fontWeight: FONT_WEIGHT.bold 
  },
  histBottom: { 
    marginTop: 2 
  },
  histMeta: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted 
  },
  emptyHist: { 
    alignItems: 'center', 
    paddingVertical: SPACING.xxl, 
    gap: SPACING.sm 
  },
  emptyHistText: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textMuted 
  },
});
