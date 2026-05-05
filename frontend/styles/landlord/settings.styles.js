import { StyleSheet } from 'react-native';
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

  // Profile
  profileCard: { 
    alignItems: 'center', 
    marginBottom: SPACING.lg, 
    paddingVertical: SPACING.xl 
  },
  avatar: { 
    width: 72, 
    height: 72, 
    borderRadius: 36, 
    backgroundColor: 'rgba(34,197,94,0.15)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: SPACING.md 
  },
  profileInfo: { 
    alignItems: 'center' 
  },
  profileName: { 
    fontSize: FONT_SIZE.xl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  profileEmail: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    marginTop: 2 
  },
  profileRole: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: SPACING.xs 
  },
  editBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.xs, 
    marginTop: SPACING.md, 
    paddingHorizontal: SPACING.md, 
    paddingVertical: SPACING.xs, 
    borderRadius: RADIUS.full, 
    borderWidth: 1, 
    borderColor: COLORS.primary 
  },
  editBtnText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.medium 
  },
  editFields: { 
    width: '100%', 
    gap: SPACING.sm 
  },
  editInputModal: { 
    height: 48, 
    backgroundColor: COLORS.backgroundLight, 
    borderRadius: RADIUS.md, 
    paddingHorizontal: SPACING.md, 
    color: COLORS.textPrimary, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    fontSize: FONT_SIZE.md 
  },

  // Rate
  rateCard: { 
    marginBottom: SPACING.lg 
  },
  rateHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    marginBottom: SPACING.sm 
  },
  rateTitle: { 
    fontSize: FONT_SIZE.lg, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: COLORS.textPrimary 
  },
  rateDesc: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    lineHeight: 20, 
    marginBottom: SPACING.md 
  },
  rateRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm 
  },
  currencyLabel: { 
    fontSize: FONT_SIZE.xl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.primary 
  },
  input: { 
    flex: 1, 
    height: 48, 
    backgroundColor: COLORS.backgroundLight, 
    borderRadius: RADIUS.md, 
    paddingHorizontal: SPACING.md, 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textPrimary, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  rateBtn: { 
    paddingHorizontal: SPACING.lg, 
    paddingVertical: SPACING.md, 
    borderRadius: RADIUS.md 
  },
  rateBtnText: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.semibold, 
    color: '#fff' 
  },

  // Menu
  menuCard: { 
    marginBottom: SPACING.md, 
    padding: 0, 
    overflow: 'hidden' 
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: SPACING.md, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  menuIcon: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: 'rgba(34,197,94,0.1)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  menuContent: { 
    flex: 1, 
    marginLeft: SPACING.md 
  },
  menuLabel: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.medium 
  },
  menuValue: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: 1 
  },
  version: { 
    textAlign: 'center', 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: SPACING.lg 
  },

  // Modals shared
  overlay: { 
    flex: 1, 
    backgroundColor: COLORS.overlay, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: SPACING.lg 
  },
  modal: { 
    backgroundColor: COLORS.surface, 
    borderRadius: RADIUS.xl, 
    padding: SPACING.xl, 
    width: '100%', 
    maxWidth: 380, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    ...SHADOWS.lg 
  },
  modalIconWrap: { 
    width: 68, 
    height: 68, 
    borderRadius: 20, 
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
    marginBottom: SPACING.xs 
  },
  modalVer: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textMuted, 
    textAlign: 'center', 
    marginBottom: SPACING.sm 
  },
  modalDesc: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    textAlign: 'center', 
    lineHeight: 20, 
    marginBottom: SPACING.lg 
  },
  modalMessage: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary, 
    lineHeight: 22, 
    marginBottom: SPACING.sm 
  },
  modalActions: { 
    flexDirection: 'row', 
    gap: SPACING.sm, 
    marginTop: SPACING.lg 
  },
  modalCancelBtn: { 
    flex: 1, 
    paddingVertical: SPACING.md, 
    borderRadius: RADIUS.md, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    alignItems: 'center' 
  },
  modalCancelText: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary, 
    fontWeight: FONT_WEIGHT.medium 
  },
  modalSaveBtnWrap: { 
    flex: 1, 
    borderRadius: RADIUS.md, 
    overflow: 'hidden' 
  },
  modalSaveBtn: { 
    paddingVertical: SPACING.md, 
    alignItems: 'center' 
  },
  modalSaveText: { 
    fontSize: FONT_SIZE.md, 
    color: '#fff', 
    fontWeight: FONT_WEIGHT.semibold 
  },
  fullCloseBtn: { 
    marginTop: SPACING.lg, 
    paddingVertical: SPACING.md, 
    borderRadius: RADIUS.md, 
    backgroundColor: COLORS.primary, 
    alignItems: 'center' 
  },
  fullCloseBtnText: { 
    fontSize: FONT_SIZE.md, 
    color: '#fff', 
    fontWeight: FONT_WEIGHT.semibold 
  },

  // ESP32
  inputLabel: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    fontWeight: FONT_WEIGHT.medium, 
    marginBottom: SPACING.sm, 
    alignSelf: 'flex-start' 
  },
  ipWrap: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    backgroundColor: COLORS.backgroundLight, 
    borderRadius: RADIUS.md, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    paddingHorizontal: SPACING.md, 
    height: 50, 
    width: '100%', 
    marginBottom: SPACING.xs 
  },
  ipWrapErr: { 
    borderColor: COLORS.danger 
  },
  ipInput: { 
    flex: 1, 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textPrimary, 
    fontFamily: 'monospace' 
  },
  inputError: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.danger, 
    alignSelf: 'flex-start', 
    marginBottom: SPACING.sm 
  },
  mockBanner: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: SPACING.sm, 
    backgroundColor: 'rgba(245,158,11,0.08)', 
    borderRadius: RADIUS.md, 
    padding: SPACING.md, 
    marginBottom: SPACING.lg, 
    borderLeftWidth: 3, 
    borderLeftColor: COLORS.warning 
  },
  mockBannerText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.warning, 
    flex: 1, 
    lineHeight: 18 
  },

  // Notifications toggles
  toggleList: { 
    width: '100%', 
    borderRadius: RADIUS.md, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    marginBottom: SPACING.sm 
  },
  toggleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: SPACING.md, 
    backgroundColor: COLORS.backgroundLight 
  },
  toggleContent: { 
    flex: 1, 
    marginRight: SPACING.sm 
  },
  toggleLabel: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.medium 
  },
  toggleDesc: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: 2 
  },
  divider: { 
    height: 1, 
    backgroundColor: COLORS.border 
  },

  // Tenant Management
  mgmtList: { 
    width: '100%', 
    borderRadius: RADIUS.md, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    marginBottom: SPACING.sm 
  },
  mgmtItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: SPACING.md, 
    backgroundColor: COLORS.backgroundLight 
  },
  mgmtIcon: { 
    width: 42, 
    height: 42, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  mgmtContent: { 
    flex: 1, 
    marginLeft: SPACING.md 
  },
  mgmtLabel: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.medium 
  },
  mgmtDesc: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: 2 
  },

  // About
  aboutDetails: { 
    width: '100%', 
    gap: 0, 
    borderRadius: RADIUS.md, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    marginBottom: SPACING.sm 
  },
  aboutRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: SPACING.sm, 
    paddingHorizontal: SPACING.md, 
    backgroundColor: COLORS.backgroundLight, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  aboutLabel: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textMuted 
  },
  aboutValue: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.medium 
  },

  // Shared Success Modal Styles
  closeModalBtn: { 
    position: 'absolute', 
    top: 16, 
    right: 16, 
    zIndex: 10 
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
  successBtnSolid: { 
    width: '100%', 
    paddingVertical: SPACING.md, 
    borderRadius: RADIUS.md, 
    backgroundColor: COLORS.primary, 
    alignItems: 'center', 
    marginTop: SPACING.md 
  },
  
  // Shared Confirmation Modal Styles
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
  primaryBtnSolid: { 
    flex: 1, 
    paddingVertical: SPACING.md, 
    borderRadius: RADIUS.md, 
    backgroundColor: COLORS.primary, 
    alignItems: 'center' 
  },
  removeBtnSolid: { 
    flex: 1, 
    paddingVertical: SPACING.md, 
    borderRadius: RADIUS.md, 
    backgroundColor: COLORS.danger, 
    alignItems: 'center' 
  },
  removeTextWhite: { 
    fontSize: FONT_SIZE.md, 
    color: '#fff', 
    fontWeight: FONT_WEIGHT.semibold 
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
});
