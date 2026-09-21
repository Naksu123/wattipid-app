import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../theme';

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
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: SPACING.xl 
  },
  greeting: { 
    fontSize: FONT_SIZE.xxl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary,
    letterSpacing: -0.5
  },
  roomLabel: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium
  },
  lastSeenDot: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted 
  },
  lastSeenText: { 
    fontSize: FONT_SIZE.xs, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  compChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    paddingVertical: SPACING.sm, 
    paddingHorizontal: SPACING.md, 
    marginBottom: SPACING.lg,
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  compText: { 
    fontSize: FONT_SIZE.sm, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  gaugeCard: { 
    alignItems: 'center', 
    paddingVertical: SPACING.lg, 
    marginBottom: SPACING.lg 
  },
  sensorStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: SPACING.md
  },
  sensorStat: {
    alignItems: 'center',
    flex: 1
  },
  sensorStatLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginBottom: 4
  },
  sensorStatValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2
  },
  sensorStatValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary
  },
  sensorStatUnit: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary
  },
  financialCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg
  },
  financialBlock: {
    flex: 1
  },
  financialLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginBottom: 6
  },
  financialValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4
  },
  financialPrefix: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium
  },
  financialValue: {
    fontSize: 28,
    fontWeight: FONT_WEIGHT.heavy,
    color: COLORS.textPrimary
  },
  financialUnit: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold
  },
  pf: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    alignSelf: 'center',
    gap: SPACING.sm, 
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.full
  },
  pfLabel: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary 
  },
  pfValue: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.bold 
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.sm, 
    marginBottom: SPACING.md 
  },
  metricCard: { 
    width: '48%',
    alignItems: 'flex-start', 
    padding: SPACING.md, 
    paddingVertical: SPACING.md,
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2
  },
  metricValue: { 
    fontSize: FONT_SIZE.lg, 
    fontWeight: FONT_WEIGHT.heavy, 
    color: COLORS.textPrimary, 
  },
  metricUnit: { 
    fontSize: FONT_SIZE.sm, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.textSecondary 
  },
  metricLabel: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textMuted, 
    marginTop: 4 
  },
  totalsCard: { 
    marginBottom: SPACING.lg 
  },
  totalsTitle: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary,
    marginBottom: SPACING.md
  },
  totalsGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    gap: SPACING.sm 
  },
  totalItem: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: SPACING.lg, 
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.xl, 
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  totalIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: SPACING.sm 
  },
  totalLabel: { 
    fontSize: 12, 
    color: COLORS.textSecondary, 
    fontWeight: FONT_WEIGHT.medium, 
    marginBottom: 4
  },
  totalEnergy: { 
    fontSize: FONT_SIZE.lg, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.bold, 
    textAlign: 'center',
    marginBottom: 2
  },
  totalUnit: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
  },
  totalCost: { 
    fontSize: 13, 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.bold, 
    textAlign: 'center' 
  },
  budgetCard: { 
    marginBottom: SPACING.lg,
    padding: SPACING.lg
  },
  budgetHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: SPACING.md 
  },
  budgetTitle: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.textPrimary, 
  },
  budgetPct: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    fontWeight: FONT_WEIGHT.bold 
  },
  budgetBar: { 
    height: 8, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 4, 
    overflow: 'hidden', 
    marginBottom: SPACING.sm 
  },
  budgetFill: { 
    height: '100%', 
    borderRadius: 4 
  },
  budgetText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary 
  },
  tipCard: { 
    marginBottom: SPACING.lg, 
    padding: SPACING.lg,
    position: 'relative' 
  },
  tipDismiss: { 
    position: 'absolute', 
    top: 16, 
    right: 16, 
    zIndex: 1, 
    padding: 4 
  },
  tipRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: SPACING.lg, 
    paddingRight: SPACING.xl 
  },
  tipIconWrap: { 
    width: 48, 
    height: 48, 
    borderRadius: RADIUS.lg, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)'
  },
  tipContent: { 
    flex: 1 
  },
  tipTitle: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary, 
    marginBottom: 6 
  },
  tipMessage: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    lineHeight: 20 
  },
  rateCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    padding: SPACING.md, 
    marginBottom: SPACING.xxl,
    justifyContent: 'center'
  },
  rateText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textMuted 
  },
  demoBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginLeft: 8,
  },
  demoText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  
  // Phase 4 - Super Dashboard Styles
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
    letterSpacing: 0.5
  },
  liveIndicatorWrap: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium
  },
  quickActionsScroll: {
    marginBottom: SPACING.lg
  },
  quickActionBtn: {
    alignItems: 'center',
    marginRight: SPACING.md,
    width: 72
  },
  quickActionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  quickActionText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: FONT_WEIGHT.medium
  },
  
  // Statement of Account Card
  soaCard: {
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1
  },
  soaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  soaTitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 1
  },
  soaAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING.md
  },
  soaAmount: {
    fontSize: 32,
    fontWeight: FONT_WEIGHT.heavy,
    color: COLORS.white
  },
  soaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  soaLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted
  },
  soaValue: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.semibold
  },
  soaActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)'
  },
  soaBtnPrimary: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center'
  },
  soaBtnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  soaBtnText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.xs
  },
  
  // Payment Status Overview
  statsScroll: {
    marginBottom: SPACING.lg
  },
  statCard: {
    width: 140,
    padding: SPACING.md,
    marginRight: SPACING.sm,
    alignItems: 'flex-start'
  },
  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 4
  },
  
  // Recent Activities
  activityItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md
  },
  activityLine: {
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    position: 'absolute',
    left: 15,
    top: 30,
    bottom: -15
  },
  activityIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    zIndex: 2
  },
  activityContent: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  activityTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: 4
  },
  activityMessage: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginBottom: 6
  },
  activityTime: {
    fontSize: 10,
    color: COLORS.textMuted
  },
  emptyActivity: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.sm,
    fontStyle: 'italic',
    marginVertical: SPACING.lg
  },
  
  // Account Summary
  accountCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.xxl
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  
  // Budget Section in Live Cost Card
  budgetContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },

  // ================= REDESIGN STYLES =================
  redesignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerInfo: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  roomPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.28)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 9,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  roomPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#10B981',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  liveOnlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.28)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 14,
  },
  liveOnlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveOnlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  liveOnlineBadgeOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.28)',
  },
  liveOnlineDotOffline: {
    backgroundColor: '#EF4444',
  },
  liveOnlineTextOffline: {
    color: '#EF4444',
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0E1626',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0E1626',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#0E1626',
  },

  // Cards
  redesignCard: {
    backgroundColor: '#0C1322',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  cardHeaderSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 14,
  },

  // Hero Card Sub-metrics
  subMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
  subMetricCol: {
    alignItems: 'center',
  },
  subMetricLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  subMetricValue: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Billing Cycle Summary Box
  billingBoxesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  billingBox: {
    flex: 1,
    backgroundColor: '#090F1C',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  billingBoxLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 6,
  },
  billingBoxKwh: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  billingBoxCostToday: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#10B981',
  },
  billingBoxCostCycle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#F59E0B',
  },

  // Itemized breakdown
  breakdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  breakdownToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  breakdownList: {
    marginTop: 10,
    gap: 8,
    backgroundColor: '#080E1A',
    padding: 12,
    borderRadius: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12.5,
    color: '#94A3B8',
  },
  breakdownValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Budget Tracking Card
  budgetMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  budgetMetricCol: {
    flex: 1,
  },
  budgetMetricLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  budgetMetricValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  budgetProgressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  budgetProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetStatusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 9,
  },
  budgetStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  budgetPromptWrap: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  budgetPromptText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 10,
  },
  setBudgetBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  setBudgetBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#042F2E',
  },

  // Wattage Trend
  noTrendDataBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  noTrendDataText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  noTrendDataSubtext: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
  },
  trendTimeAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
    marginTop: 6,
  },
  trendTimeLabel: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },

  // Energy Tip Banner
  tipBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C1322',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginBottom: 20,
  },
  tipIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tipMessageText: {
    flex: 1,
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
  },
  tipDismissBtn: {
    padding: 4,
    marginLeft: 8,
  },
});

