import { StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_WEIGHT, SHADOWS } from '../../../theme';

export default StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  badge: {
    backgroundColor: `${COLORS.warning}20`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  listContainer: {
    gap: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
    marginRight: 12,
  },
  tenantName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
    overflow: 'hidden',
  },
  dueText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  }
});
