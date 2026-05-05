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
    paddingTop: SPACING.xxl + 20, 
    paddingBottom: SPACING.xl 
  },
  header: { 
    alignItems: 'center', 
    marginBottom: SPACING.xl 
  },
  logoCircle: { 
    width: 88, 
    height: 88, 
    borderRadius: 44, 
    alignItems: 'center', 
    justifyContent: 'center', 
    ...SHADOWS.glow(COLORS.primary) 
  },
  appName: { 
    fontSize: FONT_SIZE.hero, 
    fontWeight: FONT_WEIGHT.heavy, 
    color: COLORS.textPrimary, 
    letterSpacing: 1, 
    marginTop: SPACING.md 
  },
  tagline: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary, 
    marginTop: SPACING.xs 
  },
  card: { 
    backgroundColor: COLORS.surfaceGlass, 
    borderRadius: RADIUS.xl, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    padding: SPACING.xl, 
    ...SHADOWS.md 
  },
  title: { 
    fontSize: FONT_SIZE.xxl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary, 
    marginBottom: SPACING.xs 
  },
  subtitle: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary, 
    marginBottom: SPACING.xl 
  },
  inputGroup: { 
    marginBottom: SPACING.lg 
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
    height: 52, 
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
  btnWrap: { 
    borderRadius: RADIUS.md, 
    overflow: 'hidden', 
    marginTop: SPACING.sm 
  },
  btn: { 
    paddingVertical: SPACING.md + 2, 
    alignItems: 'center' 
  },
  btnText: { 
    fontSize: FONT_SIZE.lg, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: '#fff' 
  },
  demoBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.xs, 
    backgroundColor: 'rgba(59,130,246,0.08)', 
    padding: SPACING.md, 
    borderRadius: RADIUS.md, 
    marginTop: SPACING.lg 
  },
  demoText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.info, 
    flex: 1 
  },
  divider: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: SPACING.lg 
  },
  divLine: { 
    flex: 1, 
    height: 1, 
    backgroundColor: COLORS.border 
  },
  divText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textMuted, 
    marginHorizontal: SPACING.md 
  },
  regBtn: { 
    alignItems: 'center', 
    paddingVertical: SPACING.sm 
  },
  regText: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary 
  },
  regLink: { 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  forgotBtn: { 
    alignSelf: 'flex-end', 
    marginTop: SPACING.sm 
  },
  forgotText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.medium 
  },
  footer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: SPACING.xl, 
    gap: SPACING.xs 
  },
  footerText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted 
  },
});
