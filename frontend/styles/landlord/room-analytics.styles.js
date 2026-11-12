import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Palette Constants (Wattipid Dark Navy Identity) ──────────────────────────
export const PALETTE = {
  bg: '#080E1B',
  cardPrimary: '#111A2C',
  cardSecondary: '#182338',
  accent: '#13B8D2',
  success: '#12B886',
  warning: '#F59E0B',
  error: '#EF4444',
  textPrimary: '#F5F7FA',
  textSecondary: '#94A3B8',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
};

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.bg,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 48,
  },

  // ── Header Bar ─────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
    backgroundColor: PALETTE.bg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: PALETTE.cardPrimary,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitleGroup: {
    flex: 1,
    minWidth: 0,
  },
  screenTitle: {
    fontSize: 21, // 20–22 sp
    fontWeight: '700',
    color: PALETTE.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
    flexWrap: 'wrap',
  },
  screenSubtitle: {
    fontSize: 13, // 12–14 sp
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(18, 184, 134, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(18, 184, 134, 0.25)',
  },
  statusBadgeOffline: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PALETTE.success,
  },
  statusDotOffline: {
    backgroundColor: PALETTE.textSecondary,
  },
  statusText: {
    fontSize: 11, // 11 sp
    fontWeight: '600',
    color: PALETTE.success,
  },
  statusTextOffline: {
    color: PALETTE.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.cardPrimary,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Multi-Room Pill Strip ──────────────────────────────────────────────────
  roomPillScroll: {
    marginBottom: 14,
  },
  roomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: PALETTE.cardPrimary,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginRight: 8,
    gap: 6,
  },
  roomPillActive: {
    backgroundColor: 'rgba(19, 184, 210, 0.14)',
    borderColor: PALETTE.accent,
  },
  roomPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PALETTE.textSecondary,
  },
  roomPillDotActive: {
    backgroundColor: PALETTE.accent,
  },
  roomPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  roomPillTextActive: {
    color: PALETTE.textPrimary,
    fontWeight: '600',
  },

  // ── Reporting Period Pills (Daily, Weekly, Monthly, Yearly) ────────────────
  periodRow: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardPrimary,
    borderRadius: 14,
    padding: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    width: '100%',
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodActive: {
    backgroundColor: PALETTE.accent,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  periodTextActive: {
    color: '#042F2E',
    fontWeight: '700',
  },

  // ── Date Navigator ────────────────────────────────────────────────────────
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardPrimary,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    width: '100%',
  },
  dateNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: PALETTE.cardSecondary,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dateNavCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  dateNavTitle: {
    fontSize: 14, // 14 sp
    fontWeight: '600',
    color: PALETTE.textPrimary,
  },

  // ── Section Titles (Sentence Case, 15–17 sp, Weight 600) ───────────────────
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 16, // 15–17 sp
    fontWeight: '600', // weight 600 for section headings
    color: PALETTE.textPrimary,
    letterSpacing: -0.2,
  },
  sectionBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(19, 184, 210, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(19, 184, 210, 0.25)',
    flexShrink: 0,
  },
  sectionBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.accent,
  },

  // ── State Banner Cards (Offline, Error, No Records, Zero Consumption) ──────
  stateBannerCard: {
    backgroundColor: PALETTE.cardPrimary,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  stateBannerIcon: {
    marginBottom: 10,
  },
  stateBannerTitle: {
    fontSize: 15, // 14–15 sp card heading
    fontWeight: '600',
    color: PALETTE.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  stateBannerMessage: {
    fontSize: 13, // 12–14 sp supporting description
    fontWeight: '400',
    color: PALETTE.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
    marginBottom: 12,
  },
  stateRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: PALETTE.cardSecondary,
    borderWidth: 1,
    borderColor: PALETTE.accent,
  },
  stateRetryText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.accent,
  },

  // ── Summary Metrics Grid (5 KPI Cards - Sentence Case) ────────────────────
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
    width: '100%',
  },
  metricCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 42) / 2,
    backgroundColor: PALETTE.cardPrimary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  metricCardWide: {
    width: '100%',
    minWidth: '100%',
    backgroundColor: PALETTE.cardPrimary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  metricCardAccent: {
    borderColor: 'rgba(19, 184, 210, 0.35)',
    backgroundColor: 'rgba(19, 184, 210, 0.05)',
  },
  metricCardSuccess: {
    borderColor: 'rgba(18, 184, 134, 0.35)',
    backgroundColor: 'rgba(18, 184, 134, 0.05)',
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14, // 14–15 sp card headings
    fontWeight: '500', // weight 500 for card labels
    color: PALETTE.textSecondary,
  },
  metricValue: {
    fontSize: 24, // 22–26 sp summary values
    fontWeight: '700', // weight 700 for major numerical values
    color: PALETTE.textPrimary,
    letterSpacing: -0.5,
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  metricSubtext: {
    fontSize: 12.5, // 12–14 sp supporting descriptions
    fontWeight: '400', // weight 400 for descriptions
    color: PALETTE.textSecondary,
    marginTop: 4,
  },
  metricDiffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  metricDiffText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Chart Card ────────────────────────────────────────────────────────────
  chartCard: {
    backgroundColor: PALETTE.cardPrimary,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 16,
    width: '100%',
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    width: '100%',
  },
  chartTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  chartTitle: {
    fontSize: 15, // 14–15 sp card headings
    fontWeight: '600',
    color: PALETTE.textPrimary,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardSecondary,
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: PALETTE.border,
    flexShrink: 0,
  },
  unitBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  unitBtnActive: {
    backgroundColor: PALETTE.accent,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  unitTextActive: {
    color: '#042F2E',
    fontWeight: '700',
  },
  chartFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: PALETTE.borderLight,
    width: '100%',
  },
  chartFootnoteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PALETTE.success,
    flexShrink: 0,
  },
  chartFootnoteText: {
    fontSize: 12.5, // 12–14 sp supporting description
    fontWeight: '400',
    color: PALETTE.textSecondary,
    flex: 1,
  },

  // ── Interval Breakdown Card (Clean 2-Column Responsive Layout) ─────────────
  breakdownCard: {
    backgroundColor: PALETTE.cardPrimary,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 16,
    width: '100%',
    overflow: 'hidden',
  },
  // ── Stacked Breakdown Summary (Vertical 3-Row Layout) ────────────────────
  breakdownSummaryStack: {
    backgroundColor: PALETTE.cardSecondary,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    width: '100%',
  },
  summaryStackRow: {
    paddingVertical: 6,
    width: '100%',
  },
  summaryStackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  summaryStackDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  summaryStackLabel: {
    fontSize: 13, // 13–14 sp summary labels
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  summaryStackContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    width: '100%',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryStackDate: {
    fontSize: 15.5, // 15–16 sp dates
    fontWeight: '600',
    color: PALETTE.textPrimary,
    flexShrink: 1,
  },
  summaryStackMetrics: {
    fontSize: 14.5, // 14–15 sp
    fontWeight: '700',
    textAlign: 'right',
  },
  summaryStackDivider: {
    height: 1,
    backgroundColor: PALETTE.borderLight,
    marginVertical: 4,
    width: '100%',
  },
  summaryStackTotalCard: {
    backgroundColor: 'rgba(18, 184, 134, 0.08)',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(18, 184, 134, 0.25)',
    width: '100%',
  },
  summaryStackTotalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  summaryStackTotalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  summaryStackTotalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  summaryStackTotalEnergy: {
    fontSize: 18, // 18 sp bold
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  summaryStackTotalCost: {
    fontSize: 18, // 18 sp bold
    fontWeight: '700',
    color: PALETTE.success,
  },

  // Legacy fallback banner
  breakdownSummaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardSecondary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    width: '100%',
  },
  bannerCol: {
    flex: 1,
    minWidth: 0,
  },
  bannerColLabel: {
    fontSize: 12, // 12–13 sp secondary label
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  bannerColValue: {
    fontSize: 15, // 15–17 sp main data values
    fontWeight: '700',
    color: PALETTE.textPrimary,
    marginTop: 2,
  },

  // ── Unified Pagination Component (Daily, Weekly, Monthly, Yearly) ──────────
  paginationWrapper: {
    backgroundColor: PALETTE.cardSecondary,
    borderRadius: 12,
    padding: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    width: '100%',
  },
  paginationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    width: '100%',
  },
  paginationCountText: {
    fontSize: 12.5, // 12–13 sp
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  paginationRangeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(19, 184, 210, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(19, 184, 210, 0.25)',
  },
  paginationRangeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.accent,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 4,
  },
  paginationNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: PALETTE.cardPrimary,
    borderWidth: 1,
    borderColor: PALETTE.border,
    flexShrink: 0,
  },
  paginationNavBtnDisabled: {
    opacity: 0.35,
  },
  paginationNavBtnText: {
    fontSize: 11.5, // 11.5 sp
    fontWeight: '600',
    color: PALETTE.textPrimary,
  },
  paginationNavBtnTextDisabled: {
    color: PALETTE.textSecondary,
  },
  paginationPagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    flexShrink: 0,
  },
  paginationPagePill: {
    minWidth: 26,
    height: 28,
    paddingHorizontal: 3,
    borderRadius: 7,
    backgroundColor: PALETTE.cardPrimary,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationPagePillActive: {
    backgroundColor: PALETTE.accent,
    borderColor: PALETTE.accent,
  },
  paginationPagePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    textAlign: 'center',
  },
  paginationPagePillTextActive: {
    color: '#042F2E',
    fontWeight: '700',
  },

  // ── Two-Column Hourly Record Layout (Requirement 4) ────────────────────────
  // LEFT: Hour label, Progress indicator, Usage status
  // RIGHT: Energy consumption in kWh, Electricity cost in Philippine pesos
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.borderLight,
    width: '100%',
  },
  breakdownLeftCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
    justifyContent: 'center',
  },
  breakdownRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
    minWidth: 80,
  },
  hourLabel: {
    fontSize: 15, // 15–16 sp dates / interval label
    fontWeight: '600',
    color: PALETTE.textPrimary,
    marginBottom: 4,
    flexShrink: 1,
  },
  progressTrack: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 5,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  statusTextLine: {
    fontSize: 12, // 12–13 sp secondary label
    fontWeight: '400',
    color: PALETTE.textSecondary,
    flexShrink: 1,
  },
  consumptionKwhText: {
    fontSize: 15, // 14–16 sp consumption values
    fontWeight: '700',
    color: PALETTE.textPrimary,
    textAlign: 'right',
  },
  consumptionCostText: {
    fontSize: 13, // 12–14 sp
    fontWeight: '500',
    color: PALETTE.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },

  // ── Multi-Room Comparison Section (Section 4 - Sentence Case) ──────────────
  comparisonCard: {
    backgroundColor: PALETTE.cardPrimary,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 16,
    width: '100%',
    overflow: 'hidden',
  },
  propAvgStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardSecondary,
    borderWidth: 1,
    borderColor: 'rgba(19, 184, 210, 0.25)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    width: '100%',
  },
  propAvgLeft: {
    flex: 1,
    minWidth: 0,
  },
  propAvgLabel: {
    fontSize: 12, // 12–13 sp secondary label
    fontWeight: '500',
    color: PALETTE.accent,
  },
  propAvgValue: {
    fontSize: 16, // 15–17 sp main data value
    fontWeight: '700',
    color: PALETTE.textPrimary,
    marginTop: 3,
  },
  propAvgBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  propAvgBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  comparisonRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.borderLight,
    gap: 12,
    width: '100%',
  },
  comparisonRankRowActive: {
    backgroundColor: 'rgba(19, 184, 210, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 10,
    marginHorizontal: -10,
    borderWidth: 1,
    borderColor: 'rgba(19, 184, 210, 0.25)',
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: PALETTE.cardSecondary,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  comparisonRoomInfo: {
    flex: 1,
    minWidth: 0,
  },
  comparisonRoomTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  comparisonRoomName: {
    fontSize: 14.5,
    fontWeight: '600',
    color: PALETTE.textPrimary,
  },
  currentRoomPill: {
    backgroundColor: 'rgba(19, 184, 210, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  currentRoomPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: PALETTE.accent,
  },
  comparisonTenantName: {
    fontSize: 12, // 12–13 sp
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  comparisonValues: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  comparisonEnergy: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  comparisonDiffText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  // ── Consumption Insights Cards (Section 5 - Sentence Case) ────────────────
  insightsCard: {
    backgroundColor: PALETTE.cardPrimary,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 20,
    width: '100%',
    overflow: 'hidden',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.borderLight,
    width: '100%',
  },
  insightIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: PALETTE.cardSecondary,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  insightText: {
    fontSize: 13.5, // 12–14 sp supporting description
    color: PALETTE.textPrimary,
    lineHeight: 20,
    flex: 1,
    fontWeight: '400',
    minWidth: 0,
  },

  // ── PDF Export Button (Section 6 - Sentence Case) ──────────────────────────
  exportCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.success,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    shadowColor: PALETTE.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
    width: '100%',
  },
  exportCtaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#042F2E',
    letterSpacing: 0.2,
  },
});
