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
});
