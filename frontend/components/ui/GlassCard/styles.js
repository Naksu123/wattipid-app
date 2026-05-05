import { StyleSheet } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/styles/theme';

export default StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  noPadding: {
    padding: 0,
  },
});
