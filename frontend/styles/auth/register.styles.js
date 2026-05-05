import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, SHADOWS } from '../theme';

export default StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  scroll: { 
    flexGrow: 1, 
    paddingHorizontal: SPACING.lg, 
    paddingTop: SPACING.xxl, 
    paddingBottom: SPACING.xl 
  },
  backBtn: { 
    marginBottom: SPACING.lg 
  },
  title: { 
    fontSize: FONT_SIZE.xxl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  subtitle: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary, 
    marginTop: SPACING.xs, 
    marginBottom: SPACING.lg 
  },
  roleToggle: { 
    flexDirection: 'row', 
    gap: SPACING.sm, 
    marginBottom: SPACING.lg 
  },
  roleBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: SPACING.xs, 
    paddingVertical: SPACING.md, 
    borderRadius: RADIUS.md, 
    backgroundColor: COLORS.surfaceGlass, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  roleBtnActive: { 
    borderColor: COLORS.primary, 
    backgroundColor: 'rgba(34,197,94,0.08)' 
  },
  roleBtnText: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.medium, 
    color: COLORS.textMuted 
  },
  roleBtnTextActive: { 
    color: COLORS.primary 
  },
  card: { 
    backgroundColor: COLORS.surfaceGlass, 
    borderRadius: RADIUS.xl, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    padding: SPACING.xl, 
    ...SHADOWS.md 
  },
  stepRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: SPACING.xs 
  },
  stepDot: { 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    backgroundColor: COLORS.surfaceLight, 
    borderWidth: 2, 
    borderColor: COLORS.border, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  stepDotActive: { 
    backgroundColor: COLORS.primary, 
    borderColor: COLORS.primary 
  },
  stepDotDone: { 
    backgroundColor: COLORS.primaryDark, 
    borderColor: COLORS.primaryDark, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  stepLine: { 
    flex: 1, 
    height: 2, 
    backgroundColor: COLORS.border, 
    marginHorizontal: SPACING.xs 
  },
  stepLineDone: { 
    backgroundColor: COLORS.primary 
  },
  stepLabel: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginBottom: SPACING.lg 
  },
  iconBox: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    width: 72, 
    height: 72, 
    borderRadius: 36, 
    backgroundColor: 'rgba(34,197,94,0.12)', 
    alignSelf: 'center', 
    marginBottom: SPACING.md 
  },
  stepTitle: { 
    fontSize: FONT_SIZE.xl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary, 
    textAlign: 'center', 
    marginBottom: SPACING.sm 
  },
  stepDesc: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    textAlign: 'center', 
    lineHeight: 20, 
    marginBottom: SPACING.lg 
  },
  mockBox: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: SPACING.sm, 
    backgroundColor: 'rgba(34,197,94,0.08)', 
    padding: SPACING.md, 
    borderRadius: RADIUS.md, 
    marginBottom: SPACING.md, 
    borderLeftWidth: 3, 
    borderLeftColor: COLORS.primary 
  },
  mockText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    flex: 1, 
    lineHeight: 20 
  },
  mockHint: { 
    color: COLORS.textMuted 
  },
  mockCode: { 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.primary, 
    fontSize: FONT_SIZE.md, 
    letterSpacing: 1 
  },
  inputGroup: { 
    marginBottom: SPACING.md 
  },
  label: { 
    fontSize: FONT_SIZE.sm, 
    fontWeight: FONT_WEIGHT.medium, 
    color: COLORS.textSecondary, 
    marginBottom: SPACING.sm 
  },
  inputWrap: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.backgroundLight, 
    borderRadius: RADIUS.md, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    paddingHorizontal: SPACING.md, 
    height: 50, 
    gap: SPACING.sm 
  },
  inputErr: { 
    borderColor: COLORS.danger 
  },
  input: { 
    flex: 1, 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textPrimary 
  },
  errText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.danger, 
    marginTop: SPACING.xs 
  },
  infoBox: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: SPACING.xs, 
    backgroundColor: 'rgba(59,130,246,0.08)', 
    padding: SPACING.md, 
    borderRadius: RADIUS.md, 
    marginBottom: SPACING.md 
  },
  infoText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.info, 
    flex: 1, 
    lineHeight: 18 
  },
  btnWrap: { 
    borderRadius: RADIUS.md, 
    overflow: 'hidden', 
    marginTop: SPACING.sm 
  },
  btn: { 
    flexDirection: 'row', 
    gap: SPACING.sm, 
    paddingVertical: SPACING.md + 2, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  btnText: { 
    fontSize: FONT_SIZE.lg, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: '#fff' 
  },
  regBtn: { 
    alignItems: 'center', 
    paddingVertical: SPACING.lg 
  },
  regText: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary 
  },
  regLink: { 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.semibold 
  },
});
