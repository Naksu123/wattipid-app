import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, SHADOWS } from '../theme';

export default StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  scroll: { 
    padding: SPACING.lg, 
    paddingTop: SPACING.xxl + 10 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: SPACING.lg 
  },
  greeting: { 
    fontSize: FONT_SIZE.xl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  roomLabel: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary 
  },
  lastSeenDot: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted 
  },
  lastSeenText: { 
    fontSize: FONT_SIZE.xs, 
    fontWeight: FONT_WEIGHT.medium 
  },
  alertBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.md, 
    padding: SPACING.md, 
    marginBottom: SPACING.md, 
    borderLeftWidth: 3 
  },
  alertBannerIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  alertBannerContent: { 
    flex: 1 
  },
  alertBannerTitle: { 
    fontSize: FONT_SIZE.sm, 
    fontWeight: FONT_WEIGHT.bold 
  },
  alertBannerSub: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: 2 
  },
  compChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    padding: SPACING.sm + 2, 
    paddingHorizontal: SPACING.md, 
    marginBottom: SPACING.md 
  },
  compText: { 
    fontSize: FONT_SIZE.xs, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  gaugeCard: { 
    alignItems: 'center', 
    paddingVertical: SPACING.xl, 
    marginBottom: SPACING.lg 
  },
  pf: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    marginTop: SPACING.md 
  },
  pfLabel: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textMuted 
  },
  pfValue: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: SPACING.sm, 
    marginBottom: SPACING.lg 
  },
  metricCard: { 
    width: '48.5%', 
    alignItems: 'flex-start', 
    padding: SPACING.md, 
    flexGrow: 0, 
    flexShrink: 0, 
    flexBasis: '48%' 
  },
  metricValue: { 
    fontSize: FONT_SIZE.lg, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary, 
    marginTop: SPACING.sm 
  },
  metricUnit: { 
    fontSize: FONT_SIZE.sm, 
    fontWeight: FONT_WEIGHT.medium, 
    color: COLORS.textMuted 
  },
  metricLabel: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: 2 
  },
  budgetCard: { 
    marginBottom: SPACING.md 
  },
  budgetHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    marginBottom: SPACING.sm 
  },
  budgetTitle: { 
    fontSize: FONT_SIZE.sm, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.textPrimary, 
    flex: 1 
  },
  budgetPct: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  budgetBar: { 
    height: 6, 
    backgroundColor: COLORS.surfaceLight, 
    borderRadius: 3, 
    overflow: 'hidden', 
    marginBottom: SPACING.xs 
  },
  budgetFill: { 
    height: '100%', 
    borderRadius: 3 
  },
  budgetText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted 
  },
  tipCard: { 
    marginBottom: SPACING.md, 
    position: 'relative' 
  },
  tipDismiss: { 
    position: 'absolute', 
    top: 12, 
    right: 12, 
    zIndex: 1, 
    padding: 4 
  },
  tipRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: SPACING.md, 
    paddingRight: SPACING.lg 
  },
  tipIconWrap: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  tipContent: { 
    flex: 1 
  },
  tipTitle: { 
    fontSize: FONT_SIZE.sm, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary, 
    marginBottom: 4 
  },
  tipMessage: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textSecondary, 
    lineHeight: 18 
  },
  rateCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.xs, 
    padding: SPACING.md, 
    marginBottom: SPACING.xxl 
  },
  rateText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted 
  },
});
