import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../theme';

const screenWidth = Dimensions.get('window').width - SPACING.lg * 2;

export default StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  scroll: { 
    paddingHorizontal: SPACING.lg, 
    paddingTop: SPACING.xl + 20,
    paddingBottom: SPACING.xxl * 2 
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
  periodRow: { 
    flexDirection: 'row', 
    gap: SPACING.xs, 
    marginBottom: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.full,
    padding: 4
  },
  periodBtn: { 
    flex: 1, 
    paddingVertical: SPACING.sm + 2, 
    borderRadius: RADIUS.full, 
    alignItems: 'center', 
  },
  periodActive: { 
    backgroundColor: 'rgba(16,185,129,0.15)', 
  },
  periodText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textMuted, 
    fontWeight: FONT_WEIGHT.medium 
  },
  periodTextActive: { 
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold 
  },
  statsRow: { 
    flexDirection: 'row', 
    gap: SPACING.md, 
    marginBottom: SPACING.lg 
  },
  statCard: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: 4
  },
  statValue: { 
    fontSize: FONT_SIZE.lg, 
    fontWeight: FONT_WEIGHT.heavy, 
    color: COLORS.textPrimary, 
    marginTop: 6 
  },
  statLabel: { 
    fontSize: 10, 
    color: COLORS.textSecondary, 
    marginTop: 2,
    textAlign: 'center'
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
    width: 44, 
    height: 44, 
    borderRadius: RADIUS.md, 
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
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    marginTop: 4 
  },
  compDetails: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingTop: SPACING.md, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.05)' 
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
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary
  },
  compDetailDivider: { 
    width: 1, 
    height: 32, 
    backgroundColor: 'rgba(255,255,255,0.1)' 
  },
  viewToggle: { 
    flexDirection: 'row', 
    gap: SPACING.xs, 
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.full,
    padding: 4,
    minWidth: '100%'
  },
  viewTab: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: SPACING.xs, 
    paddingVertical: SPACING.sm + 2, 
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full, 
  },
  viewTabActive: { 
    backgroundColor: 'rgba(16,185,129,0.15)', 
  },
  viewTabText: { 
    fontSize: 12, 
    color: COLORS.textMuted, 
    fontWeight: FONT_WEIGHT.medium 
  },
  viewTabTextActive: { 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.bold 
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
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  reportDesc: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    marginBottom: SPACING.lg 
  },
  reportBtns: { 
    flexDirection: 'row', 
    gap: SPACING.md 
  },
  reportBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: SPACING.sm, 
    paddingVertical: SPACING.md, 
    borderRadius: RADIUS.full, 
    backgroundColor: 'rgba(59,130,246,0.1)', 
  },
  reportBtnText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.info, 
    fontWeight: FONT_WEIGHT.bold 
  },
  chartCard: { 
    marginBottom: SPACING.lg 
  },
  chartTitle: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  chartHelpText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    marginBottom: SPACING.lg, 
    marginTop: 4 
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
    borderWidth: 1,
    backgroundColor: 'rgba(16,185,129,0.05)'
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
    marginLeft: SPACING.sm 
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
    backgroundColor: 'rgba(255,255,255,0.1)' 
  },
  insightCard: { 
    marginBottom: SPACING.xxl 
  },
  insightHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    marginBottom: SPACING.md 
  },
  insightTitle: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.bold, 
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
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  totalsDesc: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    marginTop: 4, 
    marginBottom: SPACING.lg 
  },
  totalsGrid: { 
    flexDirection: 'row', 
    gap: SPACING.md 
  },
  totalItem: { 
    flex: 1, 
    alignItems: 'center', 
    gap: 4, 
    paddingVertical: SPACING.md, 
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.lg, 
    backgroundColor: 'rgba(255,255,255,0.03)' 
  },
  totalIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 8 
  },
  totalLabel: { 
    fontSize: 11, 
    color: COLORS.textMuted, 
    fontWeight: FONT_WEIGHT.semibold, 
    textAlign: 'center' 
  },
  totalEnergy: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.bold, 
    textAlign: 'center' 
  },
  totalCost: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.bold, 
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
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  breakdownDesc: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    marginTop: 4, 
    marginBottom: SPACING.lg 
  },
  tableHeader: { 
    flexDirection: 'row', 
    paddingVertical: SPACING.md, 
    paddingHorizontal: SPACING.xs, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.1)' 
  },
  tableHeaderCell: { 
    fontSize: 10, 
    color: COLORS.textMuted, 
    fontWeight: FONT_WEIGHT.bold, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  tableRow: { 
    flexDirection: 'row', 
    paddingVertical: SPACING.md, 
    paddingHorizontal: SPACING.xs, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.03)' 
  },
  tableRowAlt: { 
    backgroundColor: 'rgba(255,255,255,0.02)' 
  },
  tableCell: { 
    fontSize: 12, 
    color: COLORS.textSecondary 
  },
  tableCellHighlight: { 
    fontSize: 12, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.bold 
  },
  tableTotalRow: { 
    flexDirection: 'row', 
    paddingVertical: SPACING.md, 
    paddingHorizontal: SPACING.xs, 
    borderTopWidth: 2, 
    borderTopColor: COLORS.primary, 
    backgroundColor: 'rgba(16,185,129,0.05)',
    marginTop: 0,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg
  },
  tableTotalCell: { 
    fontSize: 12, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.bold 
  },
  // Exact Column Layouts to prevent overlapping
  colDate: { flex: 0.28, textAlign: 'left' },
  colKwh: { flex: 0.20, textAlign: 'right' },
  colWatts: { flex: 0.17, textAlign: 'right' },
  colCost: { flex: 0.22, textAlign: 'right' },
  colReads: { flex: 0.13, textAlign: 'right' },
  historySection: { 
    marginBottom: SPACING.xxl * 2 
  },
  // Filter Dropdown
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs
  },
  filterTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 6
  },
  filterDropdownText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.semibold
  },
  // Timeline Group
  histGroup: { 
    marginBottom: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  histGroupHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.03)'
  },
  histDate: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.bold, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  // History Table
  histTableWrapper: {
    paddingBottom: SPACING.sm
  },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)'
  },
  histRowAlt: {
    backgroundColor: 'rgba(255,255,255,0.01)'
  },
  histColTime: { flex: 0.22, textAlign: 'left', fontSize: 12, color: COLORS.textSecondary },
  histColWatts: { flex: 0.20, textAlign: 'right', fontSize: 12, color: COLORS.textPrimary, fontWeight: 'bold' },
  histColKwh: { flex: 0.22, textAlign: 'right', fontSize: 12, color: COLORS.textSecondary },
  histColCost: { flex: 0.26, textAlign: 'right', fontSize: 12, color: COLORS.primary, fontWeight: 'bold' },
  histColStatus: { flex: 0.10, alignItems: 'flex-end', justifyContent: 'center' },
  
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  emptyHist: { 
    alignItems: 'center', 
    paddingVertical: SPACING.xxl, 
    gap: SPACING.sm 
  },
  emptyHistText: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textMuted 
  }
});
