import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../theme';

export default StyleSheet.create({
  // ============ Layout ============
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    padding: SPACING.lg,
    paddingBottom: 100,
    paddingTop: SPACING.xl,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ============ Hero Card ============
  heroCard: {
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)'
  },
  heroTitle: {
    fontSize: FONT_SIZE.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm
  },
  heroAmount: {
    fontSize: 56,
    fontWeight: '300',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs
  },
  heroSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted
  },

  // ============ Status ============
  statusBox: {
    marginTop: SPACING.lg,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  statusBoxPaid: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusBoxPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  statusTextPaid: {
    color: COLORS.success,
  },
  statusTextPending: {
    color: COLORS.warning,
  },
  statusBold: {
    fontWeight: '700',
    fontSize: FONT_SIZE.xs + 1,
  },

  // ============ Wizard ============
  wizardCard: {
    padding: SPACING.xl,
    paddingTop: SPACING.lg,
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  wizardProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.sm,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  stepCircleCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepText: {
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    fontSize: 13,
  },
  stepTextActive: {
    color: COLORS.white,
  },
  stepLine: {
    height: 2,
    flex: 1,
    maxWidth: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: -2,
    zIndex: 1,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  stepTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // ============ Payment Methods ============
  methodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: RADIUS.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  methodBtnGCashActive: {
    backgroundColor: 'rgba(59,130,246,0.1)',
    borderColor: 'rgba(59,130,246,0.3)',
  },
  methodBtnMayaActive: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  methodBtnCashActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  methodBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  methodBtnTextGCash: {
    color: '#3B82F6',
    fontWeight: 'bold'
  },
  methodBtnTextMaya: {
    color: '#10B981',
    fontWeight: 'bold'
  },
  methodBtnTextCash: {
    color: COLORS.textPrimary,
    fontWeight: 'bold'
  },

  // ============ Instructions ============
  instructionsBox: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: SPACING.sm,
  },
  instructionsText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  instructionsIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  accountLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  accountValue: {
    fontSize: 18,
    color: COLORS.textPrimary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  qrContainer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: RADIUS.sm,
  },

  // ============ Wizard Footer ============
  wizardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: SPACING.xl * 1.5,
    marginBottom: SPACING.sm,
  },
  backBtn: {
    display: 'none', // using PremiumAnimatedButton instead
  },
  backBtnText: {
    display: 'none',
  },
  nextBtn: {
    display: 'none',
  },
  nextBtnText: {
    display: 'none',
  },
  btnDisabled: {
    opacity: 0.5,
  },

  // ============ Inputs ============
  inputContainer: {
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  input: {
    color: COLORS.textPrimary,
    paddingVertical: 12,
    paddingHorizontal: 4,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },

  // ============ Upload ============
  uploadBtn: {
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderStyle: 'dashed',
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    marginBottom: SPACING.lg,
  },
  uploadText: {
    marginTop: 8,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  // ============ Submit ============
  submitBtn: {
    marginTop: 0,
  },
  submitBtnText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
  },

  // ============ Status Boxes ============
  pendingBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    padding: 24,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    marginTop: SPACING.md,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
  },
  pendingText: {
    color: COLORS.warning,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: 22,
  },
  paidBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    padding: 24,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    marginTop: SPACING.md,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
  },
  paidText: {
    color: COLORS.success,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: FONT_WEIGHT.medium,
    lineHeight: 22,
  },

  // ============ Utility ============
  retryBtn: {
    marginTop: 16,
    padding: 12,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
  },
  retryBtnText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 12,
  },
  errorText: {
    color: COLORS.textMuted,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  noPendingText: {
    color: COLORS.textMuted,
    marginTop: 12,
  },
});
