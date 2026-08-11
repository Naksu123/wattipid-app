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
    padding: SPACING.lg,
    marginTop: SPACING.sm,
  },
  wizardProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
  },
  stepLine: {
    height: 2,
    width: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  stepTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
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
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 20,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
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
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  accountValue: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  qrContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: RADIUS.md,
    marginTop: 12,
  },

  // ============ Wizard Footer ============
  wizardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 30,
  },
  backBtn: {
    flex: 1,
    padding: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  backBtnText: {
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.bold,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    gap: 8,
    marginTop: 12,
  },
  nextBtnText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.bold,
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
