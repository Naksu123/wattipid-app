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
    color: COLORS.textPrimary, 
    marginBottom: SPACING.lg 
  },
  sectionLabel: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    fontWeight: FONT_WEIGHT.semibold, 
    textTransform: 'uppercase', 
    letterSpacing: 1, 
    marginBottom: SPACING.sm, 
    marginTop: SPACING.md, 
    marginLeft: SPACING.xs 
  },
  profileCard: { 
    alignItems: 'center', 
    marginBottom: SPACING.md, 
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
  inputLabel: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    fontWeight: FONT_WEIGHT.medium, 
    marginTop: SPACING.sm 
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
  sectionCard: { 
    marginBottom: SPACING.md, 
    padding: 0, 
    overflow: 'hidden' 
  },
  divider: { 
    height: 1, 
    backgroundColor: COLORS.border 
  },
  toggleItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: SPACING.md 
  },
  toggleIcon: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: 'rgba(34,197,94,0.1)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  toggleContent: { 
    flex: 1, 
    marginLeft: SPACING.md 
  },
  toggleLabel: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.medium 
  },
  toggleDesc: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    marginTop: 1 
  },
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
  modalOverlay: { 
    flex: 1, 
    backgroundColor: COLORS.overlay, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: SPACING.lg 
  },
  modalBox: { 
    backgroundColor: COLORS.surface, 
    borderRadius: RADIUS.xl, 
    padding: SPACING.xl, 
    width: '100%', 
    maxWidth: 380, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    ...SHADOWS.lg 
  },
  aboutIcon: { 
    width: 72, 
    height: 72, 
    borderRadius: 20, 
    backgroundColor: 'rgba(34,197,94,0.12)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: SPACING.md 
  },
  modalTitle: { 
    fontSize: FONT_SIZE.xl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  modalVer: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textMuted, 
    marginTop: 2, 
    marginBottom: SPACING.md 
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
    lineHeight: 22 
  },
  aboutDetails: { 
    width: '100%', 
    gap: SPACING.sm, 
    marginBottom: SPACING.lg 
  },
  aboutRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: SPACING.xs, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.border 
  },
  aboutRowLabel: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textMuted 
  },
  aboutRowValue: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.medium 
  },
  modalCloseBtn: { 
    paddingVertical: SPACING.md, 
    paddingHorizontal: SPACING.xxl, 
    borderRadius: RADIUS.md, 
    backgroundColor: COLORS.primary 
  },
  modalCloseBtnText: { 
    fontSize: FONT_SIZE.md, 
    color: '#fff', 
    fontWeight: FONT_WEIGHT.semibold 
  },
  helpList: { 
    width: '100%', 
    gap: SPACING.md, 
    marginBottom: SPACING.lg, 
    marginTop: SPACING.sm 
  },
  helpItem: { 
    flexDirection: 'row', 
    gap: SPACING.sm 
  },
  helpContent: { 
    flex: 1 
  },
  helpQ: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.semibold, 
    marginBottom: 2 
  },
  helpA: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textSecondary, 
    lineHeight: 17 
  },
  envSubtitle: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    lineHeight: 20, 
    marginBottom: SPACING.lg 
  },
  envList: { 
    gap: SPACING.md, 
    marginBottom: SPACING.lg 
  },
  envCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: SPACING.md, 
    borderRadius: RADIUS.lg, 
    backgroundColor: COLORS.backgroundLight, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    gap: SPACING.md
  },
  envCardActive: { 
    borderColor: COLORS.primary, 
    backgroundColor: 'rgba(34,197,94,0.05)' 
  },
  envCardIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  envCardContent: { 
    flex: 1 
  },
  envCardTitle: { 
    fontSize: FONT_SIZE.md, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary 
  },
  envCardUrl: { 
    fontSize: 10, 
    color: COLORS.textMuted, 
    marginTop: 2 
  },
  radio: { 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    borderWidth: 2, 
    borderColor: COLORS.border, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  radioActive: { 
    borderColor: COLORS.primary 
  },
  radioInner: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: COLORS.primary 
  },
  envWarning: { 
    flexDirection: 'row', 
    gap: SPACING.xs, 
    padding: SPACING.md, 
    backgroundColor: 'rgba(245,158,11,0.08)', 
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm
  },
  envWarningText: { 
    flex: 1, 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.warning, 
    lineHeight: 18 
  },
});
