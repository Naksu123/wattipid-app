import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, SHADOWS } from '../theme';

export default StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  scroll: { 
    flexGrow: 1, 
    paddingHorizontal: SPACING.lg, 
    paddingTop: SPACING.xxl 
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: COLORS.surface, 
    marginBottom: SPACING.lg 
  },
  header: { 
    alignItems: 'center', 
    marginBottom: SPACING.xl 
  },
  iconCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: 'rgba(33,150,243,0.1)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: SPACING.md 
  },
  title: { 
    fontSize: FONT_SIZE.xxl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  subtitle: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary, 
    textAlign: 'center', 
    marginTop: SPACING.sm, 
    paddingHorizontal: SPACING.xl 
  },
  card: { 
    backgroundColor: COLORS.surfaceGlass, 
    borderRadius: RADIUS.xl, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    padding: SPACING.xl, 
    ...SHADOWS.md 
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
    marginBottom: SPACING.md, 
    textAlign: 'center' 
  },
  btn: { 
    backgroundColor: COLORS.primary, 
    borderRadius: RADIUS.md, 
    height: 52, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: SPACING.sm 
  },
  btnDisabled: { 
    opacity: 0.7 
  },
  btnText: { 
    fontSize: FONT_SIZE.lg, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: '#fff' 
  },
  resendBtn: { 
    marginTop: SPACING.xl, 
    alignItems: 'center' 
  },
  resendText: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary 
  },
  resendLink: { 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.semibold 
  },
});
