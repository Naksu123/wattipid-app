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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  viewAllBtn: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
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
    color: COLORS.textPrimary,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: COLORS.textMuted,
    marginTop: 8,
    fontSize: 13,
  }
});
