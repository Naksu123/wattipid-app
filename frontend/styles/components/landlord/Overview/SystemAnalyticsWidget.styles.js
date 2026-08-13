import { StyleSheet } from 'react-native';
import { COLORS, RADIUS, FONT_WEIGHT } from '../../../theme';

export default StyleSheet.create({
  card: {
    padding: 24,
    marginBottom: 16,
    borderRadius: RADIUS.xxl,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 42,
    fontWeight: FONT_WEIGHT.heavy,
    color: '#fff',
    letterSpacing: -1,
  },
  heroPrefix: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  secondaryBlock: {
    flex: 1,
    alignItems: 'center',
  },
  secondaryTitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.semibold,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  secondaryValue: {
    fontSize: 18,
    fontWeight: FONT_WEIGHT.bold,
  },
  secondaryPrefix: {
    fontSize: 12,
    fontWeight: FONT_WEIGHT.medium,
    opacity: 0.7,
  }
});
