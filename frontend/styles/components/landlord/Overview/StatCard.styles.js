import { StyleSheet } from 'react-native';
import { COLORS, RADIUS, FONT_WEIGHT } from '../../../theme';

export default StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%', // Ensures 2 columns with gap
    minHeight: 100,
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
    fontSize: 14,
    color: '#fff',
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: 0.25,
    lineHeight: 18,
  },
  valueContainer: {
    marginTop: 12,
  },
  value: {
    fontSize: 20,
    fontWeight: FONT_WEIGHT.bold,
    color: '#fff',
  },
  prefix: {
    fontSize: 14,
    color: '#fff',
    fontWeight: FONT_WEIGHT.medium,
  },
  suffix: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.regular,
  }
});
