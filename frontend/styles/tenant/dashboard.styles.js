import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, SHADOWS } from '../theme';

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
  alertBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.md, 
    padding: SPACING.md, 
    marginBottom: SPACING.lg, 
    borderLeftWidth: 4 
  },
  alertBannerIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: RADIUS.md, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  alertBannerContent: { 
    flex: 1 
  },
  alertBannerTitle: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.bold 
  },
  alertBannerSub: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    marginTop: 4 
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
    paddingVertical: SPACING.xxl, 
    marginBottom: SPACING.lg 
  },
  pf: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
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
    gap: SPACING.md, 
    marginBottom: SPACING.lg 
  },
  metricCard: { 
    width: '47%',
    alignItems: 'flex-start', 
    padding: SPACING.md, 
    paddingVertical: SPACING.lg,
  },
  metricValue: { 
    fontSize: FONT_SIZE.xl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary, 
    marginTop: SPACING.md 
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
  }
});
