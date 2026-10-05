import { StyleSheet, Platform, StatusBar } from 'react-native';
import { COLORS } from '../theme';

export default StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  scroll: { 
    paddingHorizontal: 16, 
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 20) + 16, 
    paddingBottom: 40 
  },

  // Control Panel Header (Matches landlord-settings.png)
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 16 
  },
  subtitle: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#10B981', 
    letterSpacing: 1, 
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#FFFFFF', 
    letterSpacing: -0.4 
  },
  gearBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 11, 
    backgroundColor: '#0C1322', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.08)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },

  // Profile Card
  profileCard: { 
    backgroundColor: '#0C1322',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16, 
    marginBottom: 14,
  },
  profileTop: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 14, 
  },
  avatar: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    backgroundColor: 'rgba(16, 185, 129, 0.12)', 
    borderWidth: 2, 
    borderColor: '#10B981', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },
  profileInfo: { 
    flex: 1 
  },
  profileName: { 
    fontSize: 17, 
    fontWeight: '800', 
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  profileEmail: { 
    fontSize: 12.5, 
    color: '#94A3B8', 
    marginTop: 1,
  },
  roleBadge: { 
    alignSelf: 'flex-start', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6, 
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginTop: 4,
  },
  roleText: { 
    fontSize: 9.5, 
    fontWeight: '800', 
    color: '#10B981', 
    letterSpacing: 0.8 
  },
  editProfileBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    paddingTop: 10, 
    marginTop: 12,
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255, 255, 255, 0.05)' 
  },
  editProfileText: { 
    fontSize: 12, 
    color: '#10B981', 
    fontWeight: '700' 
  },

  // Group Headers
  groupTitle: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#94A3B8', 
    letterSpacing: 0.8, 
    textTransform: 'uppercase',
    marginBottom: 6, 
    marginTop: 10, 
    marginLeft: 4 
  },

  // Menu Cards
  menuCard: { 
    backgroundColor: '#0C1322',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14, 
    paddingVertical: 4,
    marginBottom: 4,
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 11,
  },
  highlightedItem: { 
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  menuIcon: { 
    width: 34, 
    height: 34, 
    borderRadius: 10, 
    backgroundColor: 'rgba(16, 185, 129, 0.12)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12 
  },
  menuContent: { 
    flex: 1 
  },
  menuLabel: { 
    fontSize: 13.5, 
    fontWeight: '600', 
    color: '#FFFFFF' 
  },
  menuValue: { 
    fontSize: 11.5, 
    color: '#64748B', 
    marginTop: 1 
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },

  // Sign Out Button (Matches landlord-settings.png)
  logoutBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 20,
    marginBottom: 8,
  },
  logoutText: { 
    fontSize: 13.5, 
    fontWeight: '700', 
    color: '#EF4444' 
  },
  footerVersion: { 
    textAlign: 'center', 
    fontSize: 11, 
    color: '#475569', 
    marginTop: 8,
    marginBottom: 20,
  },

  // Modals & Form Elements
  confirmMsg: { 
    fontSize: 13.5, 
    color: '#94A3B8', 
    textAlign: 'center', 
    lineHeight: 20 
  },
  form: { 
    gap: 14, 
    width: '100%',
    paddingVertical: 4,
  },
  inputGroup: { 
    gap: 6 
  },
  label: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#94A3B8', 
    letterSpacing: 0.5 
  },
  input: { 
    backgroundColor: '#070D18', 
    borderRadius: 12, 
    paddingHorizontal: 14, 
    paddingVertical: 11,
    color: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)',
    fontSize: 13.5,
  },
  toggleList: { 
    width: '100%', 
    gap: 8,
    paddingVertical: 4,
  },
  toggleRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  toggleContent: { 
    flex: 1,
    marginRight: 10,
  },
  toggleLabel: { 
    fontSize: 13.5, 
    color: '#FFFFFF', 
    fontWeight: '600' 
  },
  toggleDesc: { 
    fontSize: 11, 
    color: '#64748B', 
    marginTop: 1 
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#070D18',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#FFFFFF',
    fontSize: 13.5,
  },
  passwordEye: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  passwordErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  passwordErrorText: {
    flex: 1,
    fontSize: 12,
    color: '#EF4444',
    lineHeight: 16,
  },

  // Floating Centered Modals (Facility Tools)
  modalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  modalPillWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  modalPillText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 11.5,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 10,
  },
  numericInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#070D18',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 12,
    height: 44,
    marginTop: 4,
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
    marginRight: 6,
  },
  numericInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    paddingVertical: 0,
    height: '100%',
  },
  unitSymbol: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94A3B8',
    marginLeft: 6,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    width: '100%',
  },
  presetChip: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 2,
  },
  presetChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
    borderWidth: 1.5,
  },
  presetChipActiveWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
    borderWidth: 1.5,
  },
  presetChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  presetChipTextActive: {
    color: '#10B981',
    fontWeight: '800',
  },
  calculationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  calculationHintText: {
    color: '#94A3B8',
    fontSize: 10.5,
    fontWeight: '500',
  },
  fixedPolicyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 8,
  },
  fixedPolicyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fixedPolicyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fixedPolicySub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  fixedPolicyBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  fixedPolicyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  toggleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginBottom: 6,
  },
  toggleRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  toggleDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toggleDesc: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  modalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
  },
  modalBtnSecondary: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalBtnSecondaryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  modalBtnPrimary: {
    flex: 1.2,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  modalBtnPrimaryText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#042F2E',
  },
});
