import { StyleSheet, Platform } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, SHADOWS } from '../theme';

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
  title: { 
    fontSize: FONT_SIZE.xxl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  subtitle: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary, 
    marginBottom: SPACING.lg 
  },
  statsRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg 
  },
  statCard: { 
    width: '32%',
    alignItems: 'center', 
    padding: SPACING.sm,
    marginBottom: 8
  },
  statNum: { 
    fontSize: FONT_SIZE.xl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  statLabel: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: 2 
  },
  infoCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    marginBottom: SPACING.lg, 
    padding: SPACING.md 
  },
  infoText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    flex: 1 
  },
  roomCard: { 
    marginBottom: SPACING.md, 
    padding: SPACING.lg, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  roomHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: SPACING.sm 
  },
  roomInfo: { 
    flex: 1,
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.md,
    marginRight: SPACING.sm
  },
  roomIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  roomId: { 
    fontSize: FONT_SIZE.lg, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  tenantName: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    marginTop: 2 
  },
  moveInRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.xs, 
    marginBottom: SPACING.sm 
  },
  moveInText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted 
  },
  consumptionRow: { 
    flexDirection: 'row', 
    gap: SPACING.sm, 
    paddingTop: SPACING.sm, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.border, 
    marginBottom: SPACING.sm 
  },
  consumptionItem: { 
    flex: 1 
  },
  consumptionLabel: { 
    fontSize: 10, 
    color: COLORS.textMuted, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  consumptionValue: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary, 
    marginTop: 2 
  },
  codeFooter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.xs, 
    paddingTop: SPACING.sm, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.border 
  },
  codeLabel: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted 
  },
  codeValue: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textSecondary, 
    fontWeight: FONT_WEIGHT.semibold, 
    fontFamily: 'monospace' 
  },
  cardActions: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    alignItems: 'center', 
    justifyContent: 'space-between', 
    borderTopWidth: 1, 
    borderTopColor: COLORS.border, 
    paddingTop: SPACING.sm, 
    marginTop: SPACING.xs, 
    gap: SPACING.xs 
  },
  actionBtn: { 
    width: '48%', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 4, 
    paddingVertical: SPACING.sm, 
    backgroundColor: COLORS.backgroundLight, 
    borderRadius: RADIUS.md 
  },
  actionBtnText: { 
    fontSize: 12, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.75)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
    zIndex: 999 
  },
  modal: { 
    backgroundColor: COLORS.surface, 
    borderRadius: RADIUS.xl, 
    padding: SPACING.xl, 
    width: '100%', 
    maxWidth: 360, 
    maxHeight: '85%', 
    borderWidth: 1, 
    borderColor: COLORS.border,
    elevation: 10,
    zIndex: 1000
  },
  modalIcon: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: 'rgba(34,197,94,0.12)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    alignSelf: 'center', 
    marginBottom: SPACING.md 
  },
  modalTitle: { 
    fontSize: FONT_SIZE.xl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary, 
    textAlign: 'center', 
    marginBottom: SPACING.sm 
  },
  modalDesc: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    textAlign: 'center', 
    lineHeight: 20, 
    marginBottom: SPACING.md 
  },
  modalRoom: { 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  codePreview: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.xs, 
    backgroundColor: 'rgba(245,158,11,0.08)', 
    borderRadius: RADIUS.md, 
    padding: SPACING.sm, 
    marginBottom: SPACING.md, 
    justifyContent: 'center' 
  },
  codePreviewText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary 
  },
  codePreviewValue: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.warning, 
    fontFamily: 'monospace', 
    letterSpacing: 1 
  },
  emailWrap: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    backgroundColor: COLORS.backgroundLight, 
    borderRadius: RADIUS.md, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    paddingHorizontal: SPACING.md, 
    height: 50, 
    marginBottom: SPACING.xs 
  },
  emailWrapErr: { 
    borderColor: COLORS.danger 
  },
  emailInput: { 
    flex: 1, 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textPrimary 
  },
  emailError: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.danger, 
    marginBottom: SPACING.sm 
  },
  timerNote: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(245,158,11,0.08)', 
    borderRadius: RADIUS.md, 
    padding: SPACING.sm, 
    marginBottom: SPACING.sm 
  },
  timerNoteText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.warning, 
    flex: 1, 
    marginLeft: SPACING.xs 
  },
  modalActions: { 
    flexDirection: 'row', 
    marginTop: SPACING.md 
  },
  cancelBtn: { 
    flex: 1, 
    paddingVertical: SPACING.md, 
    borderRadius: RADIUS.md, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    alignItems: 'center' 
  },
  cancelText: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary, 
    fontWeight: FONT_WEIGHT.medium 
  },
  cancelBtnOutline: { 
    flex: 1, 
    paddingVertical: SPACING.md, 
    borderRadius: RADIUS.md, 
    borderWidth: 1, 
    borderColor: COLORS.primary, 
    alignItems: 'center' 
  },
  cancelTextGreen: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  removeBtnSolid: { 
    flex: 1, 
    paddingVertical: SPACING.md, 
    borderRadius: RADIUS.md, 
    backgroundColor: COLORS.danger, 
    alignItems: 'center' 
  },
  primaryBtnSolid: { 
    flex: 1, 
    paddingVertical: SPACING.md, 
    borderRadius: RADIUS.md, 
    backgroundColor: COLORS.primary, 
    alignItems: 'center' 
  },
  removeTextWhite: { 
    fontSize: FONT_SIZE.md, 
    color: '#fff', 
    fontWeight: FONT_WEIGHT.semibold 
  },
  successBtnSolid: { 
    width: '100%', 
    paddingVertical: SPACING.md, 
    borderRadius: RADIUS.md, 
    backgroundColor: COLORS.primary, 
    alignItems: 'center', 
    marginTop: SPACING.md 
  },
  closeModalBtn: { 
    position: 'absolute', 
    top: 16, 
    right: 16, 
    zIndex: 10 
  },
  revokeInfoBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.backgroundLight, 
    borderRadius: RADIUS.md, 
    padding: SPACING.md, 
    marginBottom: SPACING.md, 
    gap: SPACING.md 
  },
  revokeInfoText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    flex: 1 
  },
  successIconWrap: { 
    alignSelf: 'center', 
    marginBottom: SPACING.lg, 
    marginTop: SPACING.md, 
    position: 'relative' 
  },
  successIconInner: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: COLORS.primary, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  particle: { 
    position: 'absolute', 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: COLORS.primary, 
    opacity: 0.7 
  },
  sendBtnWrap: { 
    flex: 1, 
    borderRadius: RADIUS.md, 
    overflow: 'hidden' 
  },
  sendBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: SPACING.xs, 
    paddingVertical: SPACING.md 
  },
  sendText: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: '#fff' 
  },
  reportPreview: { 
    backgroundColor: COLORS.backgroundLight, 
    borderRadius: RADIUS.md, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    marginBottom: SPACING.md, 
    overflow: 'hidden' 
  },
  reportRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: SPACING.md, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  reportLabel: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary 
  },
  reportValue: { 
    fontSize: FONT_SIZE.sm, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  transferItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.md, 
    padding: SPACING.md, 
    backgroundColor: COLORS.backgroundLight, 
    borderRadius: RADIUS.md, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    marginBottom: SPACING.sm 
  },
  transferItemText: { 
    flex: 1, 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.textPrimary 
  },
  successModal: { 
    backgroundColor: COLORS.surface, 
    borderRadius: RADIUS.xl, 
    width: '100%', 
    maxWidth: 320, 
    maxHeight: '85%', 
    ...SHADOWS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 12, 
    zIndex: 1100
  },
  successScroll: { 
    flexGrow: 0 
  },
  successScrollContent: { 
    padding: 24, 
    alignItems: 'center' 
  },
  successHeader: { 
    alignItems: 'center', 
    marginBottom: 20 
  },
  successIconPill: { 
    marginBottom: 16 
  },
  successIconBg: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: 'rgba(34,197,94,0.1)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(34,197,94,0.2)' 
  },
  successTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: COLORS.textPrimary, 
    marginBottom: 8 
  },
  successSubtitle: { 
    fontSize: 14, 
    color: COLORS.textSecondary, 
    textAlign: 'center', 
    lineHeight: 20 
  },
  codeContainer: { 
    width: '100%', 
    backgroundColor: COLORS.backgroundLight, 
    borderRadius: RADIUS.lg, 
    padding: 20, 
    alignItems: 'center', 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  codeContainerLabel: { 
    fontSize: 10, 
    fontWeight: '700', 
    color: COLORS.textMuted, 
    letterSpacing: 1, 
    marginBottom: 12 
  },
  codeBox: { 
    backgroundColor: COLORS.surface, 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: COLORS.primary, 
    marginBottom: 12 
  },
  codeText: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: COLORS.primary, 
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', 
    letterSpacing: 2 
  },
  roomBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(34,197,94,0.1)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20 
  },
  roomBadgeText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: COLORS.primary, 
    marginLeft: 6 
  },
  successDetails: { 
    width: '100%', 
    paddingHorizontal: 4 
  },
  detailRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 14 
  },
  detailText: { 
    fontSize: 13, 
    color: COLORS.textSecondary, 
    flex: 1, 
    marginLeft: 12 
  },
  successFooter: { 
    padding: 20, 
    paddingTop: 0 
  },
  successOkBtn: { 
    backgroundColor: COLORS.primary, 
    width: '100%', 
    height: 54, 
    borderRadius: RADIUS.md, 
    alignItems: 'center', 
    justifyContent: 'center', 
    ...SHADOWS.md 
  },
  successOkBtnText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '700' 
  },
  resetWarningBox: { 
    backgroundColor: 'rgba(245,158,11,0.08)', 
    borderRadius: RADIUS.lg, 
    padding: SPACING.md, 
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.15)'
  },
  resetWarningHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginBottom: 10 
  },
  resetWarningTitle: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: COLORS.warning, 
    letterSpacing: 1 
  },
  resetWarningItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    marginBottom: 6 
  },
  bullet: { 
    width: 4, 
    height: 4, 
    borderRadius: 2, 
    backgroundColor: COLORS.warning 
  },
  resetWarningText: { 
    fontSize: 12, 
    color: COLORS.textSecondary, 
    flex: 1 
  },
  resetBtnSolid: { 
    flex: 1, 
    paddingVertical: SPACING.md, 
    borderRadius: RADIUS.md, 
    backgroundColor: COLORS.warning, 
    alignItems: 'center' 
  },
});
