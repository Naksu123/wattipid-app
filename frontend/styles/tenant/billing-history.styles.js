import { StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontSize: 13,
  },

  // ─── Header ──────────────────────────────────────────────
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingBottom: SPACING.sm,
    backgroundColor: '#0E1424',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },

  // ─── Hero KPI Track Record ──────────────────────────────
  kpiSection: {
    marginBottom: 14,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    padding: 12,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kpiIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  kpiCaption: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // ─── Search Bar ──────────────────────────────────────────
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  searchClearBtn: {
    padding: 4,
  },

  // ─── Filter Status Segment ───────────────────────────────
  statusFilterScroll: {
    marginBottom: 10,
  },
  statusFilterRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: COLORS.primary,
  },
  statusPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statusPillTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  statusPillBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusPillBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusPillBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  statusPillBadgeTextActive: {
    color: COLORS.primaryLight,
  },

  // ─── Secondary Filter & Sort Row ─────────────────────────
  secondaryFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  yearPillsScroll: {
    flex: 1,
    marginRight: 10,
  },
  yearPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  yearPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  yearPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  yearPillText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  yearPillTextActive: {
    color: COLORS.textPrimary,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sortBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // ─── List Container ──────────────────────────────────────
  listContainer: {
    padding: SPACING.md,
    paddingBottom: 110,
  },
  listResultsCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 10,
    paddingHorizontal: 2,
    fontWeight: '500',
  },

  // ─── Redesigned Invoice Card ─────────────────────────────
  card: {
    padding: 14,
    marginBottom: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    overflow: 'hidden',
  },
  cardOverdueBorder: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.03)',
  },
  cardPendingBorder: {
    borderColor: 'rgba(245, 158, 11, 0.35)',
    backgroundColor: 'rgba(245, 158, 11, 0.03)',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  invoiceTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  cyclePeriodText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Card Content Summary
  cardContentBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: 10,
  },
  amountCol: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.4,
  },
  amountValueOverdue: {
    color: COLORS.danger,
  },
  amountValuePending: {
    color: '#F59E0B',
  },

  cardMetricsCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  consumptionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  consumptionChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dateDueChip: {
    fontSize: 10.5,
    color: COLORS.textMuted,
  },

  // Payment Verified Banner
  paymentDetailsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.18)',
    padding: 8,
    borderRadius: RADIUS.sm,
    marginBottom: 10,
    gap: 8,
  },
  paymentDetailsTextBox: {
    flex: 1,
  },
  paymentDetailsText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '700',
  },
  paymentDetailsSubText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  // Rejection notice
  rejectionNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    padding: 8,
    borderRadius: RADIUS.sm,
    marginBottom: 10,
    gap: 6,
  },
  rejectionNoticeText: {
    fontSize: 11,
    color: COLORS.danger,
    flex: 1,
  },

  // Card Action Buttons
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 38,
  },
  detailsToggleBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  viewPdfActionBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    minHeight: 38,
  },
  viewPdfActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  payOverdueActionBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: '#DC2626',
    minHeight: 38,
  },
  payOverdueActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── Expandable In-Line Breakdown Drawer ──────────────────
  breakdownDrawer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  drawerHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  meterReadingsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: RADIUS.sm,
    padding: 8,
    marginBottom: 8,
  },
  meterReadingCol: {
    flex: 1,
  },
  meterReadingLabel: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    marginBottom: 1,
  },
  meterReadingVal: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  drawerItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  drawerItemLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  drawerItemValue: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  drawerSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: 6,
  },
  drawerTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  drawerTotalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  drawerTotalVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.primary,
  },

  // ─── Empty State ─────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  emptyResetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // ─── Skeleton Loading State ──────────────────────────────
  skeletonCard: {
    padding: 14,
    marginBottom: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    gap: 12,
  },
  skeletonLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 4,
  },
});
