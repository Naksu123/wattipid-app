import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    justifyContent: 'space-between',
  },

  // ─── Header & Top Bar ──────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  securityPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },

  // ─── Center Content ────────────────────────────────────────────
  centerContent: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: SPACING.sm,
  },

  // ─── Compact Status Icon Badge ─────────────────────────────────
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: SPACING.md,
  },
  iconBadgeVerifying: {
    borderColor: 'rgba(16, 185, 129, 0.45)',
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  iconBadgeSuccess: {
    borderColor: 'rgba(16, 185, 129, 0.6)',
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
  },
  iconBadgeError: {
    borderColor: 'rgba(239, 68, 68, 0.45)',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  iconBadgeExpired: {
    borderColor: 'rgba(245, 158, 11, 0.45)',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },

  // ─── Typography ────────────────────────────────────────────────
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: SPACING.md,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.18)',
    maxWidth: '92%',
  },
  emailText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryLight,
    textAlign: 'center',
  },

  // ─── Timer Status Pill ─────────────────────────────────────────
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: SPACING.lg,
  },
  timerPillWarn: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  timerPillExpired: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  timerTextWarn: {
    color: '#F59E0B',
  },
  timerTextExpired: {
    color: COLORS.danger,
  },

  // ─── Demo / Mock Box ───────────────────────────────────────────
  mockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  mockText: {
    fontSize: 12,
    color: COLORS.warning,
  },
  mockCode: {
    fontWeight: '700',
    fontSize: 13,
    color: '#FBBF24',
    letterSpacing: 1.5,
  },
  mockAutoFillBtn: {
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  mockAutoFillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FBBF24',
  },

  // ─── OTP Input Row ─────────────────────────────────────────────
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: SPACING.lg,
    width: '100%',
  },
  codeInput: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    padding: 0,
  },
  codeInputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  codeInputFilled: {
    borderColor: 'rgba(16, 185, 129, 0.35)',
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    color: '#FFFFFF',
  },
  codeInputError: {
    borderColor: COLORS.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  codeInputExpired: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    opacity: 0.35,
  },

  // ─── Contextual Feedback Banner ────────────────────────────────
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    width: '100%',
  },
  statusBannerVerifying: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusBannerSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusBannerError: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  statusBannerExpired: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  statusBannerText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },

  // ─── Primary Verification CTA ──────────────────────────────────
  btnWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    marginBottom: SPACING.md,
  },
  btn: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // ─── Secondary Resend Action ───────────────────────────────────
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
  },
  resendBtnDisabled: {
    opacity: 0.5,
  },
  resendBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  resendBtnTextMuted: {
    fontSize: 12.5,
    fontWeight: '500',
    color: COLORS.textMuted,
  },

  // ─── Security Footer Card ──────────────────────────────────────
  securityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
    marginTop: 'auto',
  },
  securityCardText: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    flex: 1,
    lineHeight: 16,
  },
});
