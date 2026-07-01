import { StyleSheet } from 'react-native';
import { COLORS, RADIUS, FONT_WEIGHT } from '../../../theme';

export default StyleSheet.create({
  card: {
    padding: 20,
    marginBottom: 20,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)', // warning color
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: FONT_WEIGHT.heavy,
    color: '#fff',
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  dot: {
    position: 'absolute',
    left: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  coreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  liveText: {
    fontSize: 9,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.success,
    letterSpacing: 0.5,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dataBlock: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.heavy,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  value: {
    fontSize: 32,
    fontWeight: FONT_WEIGHT.bold,
    color: '#fff',
  },
  unit: {
    fontSize: 16,
    color: COLORS.warning,
    fontWeight: FONT_WEIGHT.bold,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
  }
});
