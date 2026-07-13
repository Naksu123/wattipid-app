import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../theme';

const screenWidth = Dimensions.get('window').width;

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

  // Header
  title: { 
    fontSize: FONT_SIZE.xxl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary,
    letterSpacing: -0.5
  },
  subtitle: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary, 
    marginBottom: SPACING.lg 
  },

  // Period Tabs
  periodRow: { 
    flexDirection: 'row', 
    gap: SPACING.xs, 
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.full,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  periodBtn: { 
    flex: 1, 
    paddingVertical: SPACING.sm + 2, 
    borderRadius: RADIUS.full, 
    alignItems: 'center', 
  },
  periodActive: { 
    backgroundColor: 'rgba(16,185,129,0.18)',
  },
  periodText: { 
    fontSize: 13, 
    color: COLORS.textMuted, 
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  periodTextActive: { 
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold 
  },

  // Date Navigation
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  dateNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dateNavCenter: {
    flex: 1,
    alignItems: 'center',
  },
  dateNavTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  dateNavSub: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Summary Cards
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    flex: 1,
    maxWidth: (screenWidth - SPACING.lg * 2 - SPACING.md) / 2,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
  },
  summaryCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  summaryCardLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryCardValue: {
    fontSize: FONT_SIZE.md + 2,
    fontWeight: FONT_WEIGHT.heavy,
    color: COLORS.textPrimary,
  },
  summaryCardTrend: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.semibold,
    marginTop: 2,
  },

  // Chart Card
  chartCard: { 
    marginBottom: SPACING.lg 
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  chartTitle: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  chartUnit: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
  },

  // Bottom Stats
  bottomStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    marginTop: SPACING.sm,
  },
  bottomStatLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  bottomStatValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  bottomStatDiff: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  bottomStatDiffText: {
    fontSize: 13,
    fontWeight: FONT_WEIGHT.bold,
  },

  // Insights
  insightCard: {
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
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
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },
  insightText: { 
    flex: 1,
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    lineHeight: 20 
  },

  // Recommendations
  recCard: {
    marginBottom: SPACING.lg,
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.15)',
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  recTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.warning,
  },
  recText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // View Toggle
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

  // Report Card
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

  // Breakdown Table
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
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg
  },
  tableTotalCell: { 
    fontSize: 12, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.bold 
  },
  colDate: { flex: 0.28, textAlign: 'left' },
  colKwh: { flex: 0.20, textAlign: 'right' },
  colWatts: { flex: 0.17, textAlign: 'right' },
  colCost: { flex: 0.22, textAlign: 'right' },
  colReads: { flex: 0.13, textAlign: 'right' },

  // History
  historySection: { 
    marginBottom: SPACING.xxl * 2 
  },
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
  },

  // No data
  noData: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textMuted, 
    textAlign: 'center', 
    paddingVertical: SPACING.xxl 
  },

  // Disclaimer
  disclaimer: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
    fontStyle: 'italic',
  },
});
