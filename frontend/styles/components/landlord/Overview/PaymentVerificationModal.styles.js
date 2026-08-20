import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, SHADOWS } from '../../../theme';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: SPACING.md,
    maxHeight: height * 0.9,
    minHeight: height * 0.6,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  scrollContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 4,
  },

  // Amount Hero
  amountContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: SPACING.lg,
  },
  amountLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '300',
    color: COLORS.textPrimary,
  },
  
  // Details Grid
  detailsGrid: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.sm,
  },
  detailValue: {
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
    fontSize: FONT_SIZE.sm,
  },
  
  // Proof of Payment
  proofSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  proofImageContainer: {
    width: '100%',
    height: 350,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#fff', // White background for receipts
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofImage: {
    width: '100%',
    height: '100%',
  },
  missingProof: {
    color: COLORS.textMuted,
    marginTop: 10,
    fontSize: FONT_SIZE.sm,
  },
  
  // Input (for rejection)
  rejectionInputContainer: {
    marginBottom: SPACING.lg,
  },
  rejectionInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: RADIUS.md,
    color: COLORS.textPrimary,
    padding: SPACING.md,
    fontSize: FONT_SIZE.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Action Buttons
  actionContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  rejectButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  rejectButtonActive: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.glow(COLORS.primary),
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.md,
    letterSpacing: 0.5,
  },
  rejectButtonText: {
    color: COLORS.danger,
  },
  rejectButtonTextActive: {
    color: COLORS.white,
  },
  disabledButton: {
    opacity: 0.5,
  }
});
