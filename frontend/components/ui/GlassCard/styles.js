import { StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/styles/theme';

export default StyleSheet.create({
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: RADIUS.xl, // Softer curves
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: SPACING.lg,
    ...SHADOWS.md,
    overflow: 'hidden', // Ensures inner contents don't bleed out
  },
  noPadding: {
    padding: 0,
  },
});
