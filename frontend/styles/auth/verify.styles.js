import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, SHADOWS } from '../theme';

export default StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: SPACING.lg, 
    paddingTop: SPACING.xxl, 
    alignItems: 'center' 
  },
  backBtn: { 
    alignSelf: 'flex-start', 
    marginBottom: SPACING.lg 
  },
  iconWrap: { 
    marginBottom: SPACING.lg 
  },
  iconCircle: { 
    width: 88, 
    height: 88, 
    borderRadius: 44, 
    alignItems: 'center', 
    justifyContent: 'center', 
    ...SHADOWS.glow(COLORS.primary) 
  },
  title: { 
    fontSize: FONT_SIZE.xxl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary, 
    marginBottom: SPACING.xs 
  },
  subtitle: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary 
  },
  email: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.semibold, 
    marginBottom: SPACING.md 
  },
  timerBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.xs, 
    backgroundColor: 'rgba(34,197,94,0.08)',
    paddingHorizontal: SPACING.md, 
    paddingVertical: SPACING.sm, 
    borderRadius: RADIUS.md, 
    marginBottom: SPACING.md 
  },
  timerText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  expiredBox: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: SPACING.xs, 
    backgroundColor: 'rgba(239,68,68,0.08)',
    paddingHorizontal: SPACING.md, 
    paddingVertical: SPACING.sm, 
    borderRadius: RADIUS.md, 
    marginBottom: SPACING.md,
    borderLeftWidth: 3, 
    borderLeftColor: COLORS.danger 
  },
  expiredText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.danger, 
    flex: 1, 
    lineHeight: 18 
  },
  mockBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.xs, 
    backgroundColor: 'rgba(245,158,11,0.1)',
    paddingHorizontal: SPACING.md, 
    paddingVertical: SPACING.sm, 
    borderRadius: RADIUS.md, 
    marginBottom: SPACING.lg 
  },
  mockText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.warning 
  },
  mockCode: { 
    fontWeight: FONT_WEIGHT.bold, 
    fontSize: FONT_SIZE.lg, 
    letterSpacing: 2 
  },
  codeRow: { 
    flexDirection: 'row', 
    gap: SPACING.sm, 
    marginBottom: SPACING.xl 
  },
  codeInput: { 
    width: 48, 
    height: 56, 
    borderRadius: RADIUS.md, 
    borderWidth: 2, 
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceGlass, 
    textAlign: 'center', 
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  codeInputFilled: { 
    borderColor: COLORS.primary, 
    backgroundColor: 'rgba(34,197,94,0.08)' 
  },
  codeInputExpired: { 
    borderColor: COLORS.danger, 
    opacity: 0.5 
  },
  btnWrap: { 
    borderRadius: RADIUS.md, 
    overflow: 'hidden', 
    width: '100%' 
  },
  btn: { 
    flexDirection: 'row', 
    paddingVertical: SPACING.md + 2, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  btnText: { 
    fontSize: FONT_SIZE.lg, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: '#fff' 
  },
  infoBox: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: SPACING.xs, 
    backgroundColor: 'rgba(59,130,246,0.08)',
    padding: SPACING.md, 
    borderRadius: RADIUS.md, 
    marginTop: SPACING.lg 
  },
  infoText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.info, 
    flex: 1, 
    lineHeight: 18 
  },
});
