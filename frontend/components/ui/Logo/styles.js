import { StyleSheet } from 'react-native';
import { COLORS, FONT_WEIGHT, SPACING, RADIUS } from '../../../styles/theme';

export default StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  appName: {
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.bold,
    marginTop: SPACING.sm,
    letterSpacing: 0.5,
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  logoImage: {
    resizeMode: 'contain',
  },
});
