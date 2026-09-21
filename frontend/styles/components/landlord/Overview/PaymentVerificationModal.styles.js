import { StyleSheet, Dimensions } from 'react-native';
import { SPACING, RADIUS } from '../../../theme';

const { height } = Dimensions.get('window');

export default StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0A0F1D',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 0,
    maxHeight: height * 0.92,
    minHeight: height * 0.65,
    paddingTop: SPACING.md,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: RADIUS.full,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  },
  scrollContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl + 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tenant Info Card
  tenantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: SPACING.md,
  },
  tenantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tenantAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tenantInfo: {
    flex: 1,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  tenantSub: {
    fontSize: 13,
    color: '#94A3B8',
  },

  // Proof Card
  proofCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    minHeight: 140,
  },
  proofIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  proofThumbnail: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  proofFileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
    textAlign: 'center',
  },
  proofHint: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  viewFullsizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  viewFullsizeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  missingProofText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
  },

  // Audit Section
  auditCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  auditTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    paddingHorizontal: 2,
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  auditRowLast: {
    borderBottomWidth: 0,
  },
  auditLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  auditValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  auditValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  auditValueMatch: {
    color: '#10B981',
  },
  auditValueWarning: {
    color: '#F59E0B',
  },
  copyBtn: {
    padding: 3,
  },

  // Rejection Box
  rejectionBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  rejectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8,
  },
  rejectionInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },

  // Action Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  rejectBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  rejectBtnActive: {
    backgroundColor: '#EF4444',
  },
  rejectBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  rejectBtnTextActive: {
    color: '#FFFFFF',
  },
  approveBtn: {
    backgroundColor: '#10B981',
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelRejectBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  cancelRejectText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.5,
  },

  // Fullsize Viewer Modal
  fullsizeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullsizeClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 50,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullsizeImage: {
    width: '94%',
    height: '75%',
  },
});
