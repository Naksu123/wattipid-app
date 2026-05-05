import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../theme';

export default StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  scroll: { 
    padding: SPACING.lg, 
    paddingTop: SPACING.xxl + 10, 
    paddingBottom: SPACING.xxl 
  },
  greeting: { 
    fontSize: FONT_SIZE.xxl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  subtitle: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary, 
    marginBottom: SPACING.lg 
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: SPACING.sm, 
    marginBottom: SPACING.lg 
  },
  summaryCard: { 
    width: '48%', 
    flexGrow: 1, 
    flexBasis: '47%', 
    padding: SPACING.md, 
    borderRadius: RADIUS.lg, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  summaryIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: SPACING.sm 
  },
  summaryValue: { 
    fontSize: FONT_SIZE.xl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  summaryLabel: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: 2 
  },
  facilityCard: { 
    marginBottom: SPACING.lg, 
    paddingVertical: SPACING.xl 
  },
  facilityTitle: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.textPrimary, 
    marginBottom: SPACING.lg, 
    textAlign: 'center' 
  },
  facilityRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    alignItems: 'center' 
  },
  facilityStat: { 
    alignItems: 'center' 
  },
  facilityValue: { 
    fontSize: FONT_SIZE.lg, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.primary 
  },
  facilityLabel: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: 2 
  },
  divider: { 
    width: 1, 
    height: 40, 
    backgroundColor: COLORS.border 
  },
  sectionTitle: { 
    fontSize: FONT_SIZE.lg, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary, 
    marginBottom: SPACING.md 
  },
  roomItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: SPACING.sm, 
    padding: SPACING.md 
  },
  roomLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.md 
  },
  roomDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5 
  },
  roomId: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.textPrimary 
  },
  roomTenant: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary 
  },
  roomEnergy: { 
    fontSize: FONT_SIZE.sm, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.primary 
  },
  roomStatusText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    textTransform: 'capitalize' 
  },
});
