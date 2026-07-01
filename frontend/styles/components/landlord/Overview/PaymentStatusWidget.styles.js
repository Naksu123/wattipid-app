import { StyleSheet } from 'react-native';
import { COLORS, RADIUS, FONT_WEIGHT, SPACING } from '../../../theme';

export default StyleSheet.create({
  card: {
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderRadius: RADIUS.xl,
  },
  title: {
    fontSize: 14,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  empty: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic'
  },
  barContainer: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  barSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  legendVal: {
    fontSize: 16,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  legendLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  legendAmount: {
    fontSize: 12,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
    marginTop: 2,
  }
});
