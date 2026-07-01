import { StyleSheet } from 'react-native';
import { COLORS, RADIUS, FONT_WEIGHT, SPACING } from '../../../theme';

export default StyleSheet.create({
  card: {
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderRadius: RADIUS.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  empty: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
  },
  timeline: {
    paddingLeft: 4,
  },
  itemRow: {
    flexDirection: 'row',
  },
  nodeCol: {
    width: 24,
    alignItems: 'center',
  },
  node: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceGlass,
    zIndex: 2,
  },
  nodeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 4,
  },
  contentCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 24,
  },
  actHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  actTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actType: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.heavy,
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  desc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  }
});
