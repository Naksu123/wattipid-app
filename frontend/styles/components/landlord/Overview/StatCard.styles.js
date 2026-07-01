import { StyleSheet } from 'react-native';
import { COLORS, RADIUS, FONT_WEIGHT } from '../../../theme';

export default StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%', // Ensures 2 columns with gap
    minHeight: 110,
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.4)', // Subtle dark background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  valueContainer: {
    marginTop: 12,
  },
  value: {
    fontSize: 28,
    fontWeight: FONT_WEIGHT.heavy,
    color: COLORS.textPrimary,
  }
});
