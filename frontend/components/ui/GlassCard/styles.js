import { StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/styles/theme';

export default StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: RADIUS.xl, // Softer curves
    borderWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)', // Light reflection on top
    borderLeftColor: 'rgba(255, 255, 255, 0.1)', // Light reflection on left
    borderRightColor: 'rgba(0, 0, 0, 0.2)', // Shadow on right
    borderBottomColor: 'rgba(0, 0, 0, 0.3)', // Shadow on bottom
    padding: SPACING.lg,
    ...SHADOWS.md,
    overflow: 'hidden', // Ensures inner contents don't bleed out
  },
  noPadding: {
    padding: 0,
  },
});
