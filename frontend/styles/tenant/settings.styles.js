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
    paddingBottom: 40,
  },

  // Compact Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#0C1322',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },

  // Profile Card (Matches profile-settings.png)
  profileCard: { 
    backgroundColor: '#0C1322',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 8,
  },
  profileMainRow: {
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
    justifyContent: 'center', 
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },
  profileInfo: { 
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  profileName: { 
    fontSize: 17, 
    fontWeight: '800', 
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  roomBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roomBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  profileEmail: { 
    fontSize: 12.5, 
    color: '#94A3B8', 
    marginTop: 1,
  },
  profileSub: { 
    fontSize: 11.5, 
    color: '#64748B', 
    marginTop: 2,
  },
  editProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },

  // Section Labels
  sectionLabel: { 
    fontSize: 11, 
    color: '#94A3B8', 
    fontWeight: '800', 
    textTransform: 'uppercase', 
    letterSpacing: 0.8, 
    marginBottom: 6, 
    marginTop: 14, 
    marginLeft: 4,
  },

  // Section Card Container
  sectionCard: { 
    backgroundColor: '#0C1322',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 4,
  },

  // Lease Information Grid (Matches profile-settings.png)
  leaseCard: {
    backgroundColor: '#0C1322',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 4,
  },
  leaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
  },
  leaseCol: {
    width: '50%',
  },
  leaseColLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 3,
  },
  leaseColValue: {
    fontSize: 13.5,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusPillActive: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },

  // Menu Rows (SettingsRow)
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 11,
  },
  menuIconBadge: { 
    width: 32, 
    height: 32, 
    borderRadius: 9, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12,
  },
  menuContent: { 
    flex: 1, 
  },
  menuLabel: { 
    fontSize: 13.5, 
    fontWeight: '600', 
    color: '#FFFFFF',
  },
  menuDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  menuValue: { 
    fontSize: 12, 
    color: '#64748B', 
    fontWeight: '600',
    marginRight: 6,
  },

  // Toggle Rows
  toggleItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 10,
  },
  toggleIconBadge: { 
    width: 32, 
    height: 32, 
    borderRadius: 9, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12,
  },
  toggleContent: { 
    flex: 1, 
  },
  toggleLabel: { 
    fontSize: 13.5, 
    fontWeight: '600', 
    color: '#FFFFFF',
  },
  toggleDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  // Dividers
  divider: { 
    height: 1, 
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },

  // Data Management Card Rows
  dataActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  dataActionContent: {
    flex: 1,
    marginRight: 12,
  },
  dataActionTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dataActionDesc: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 2,
  },
  destructiveBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sign Out Button (Matches profile-settings.png)
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
  logoutBtnText: { 
    fontSize: 13.5, 
    fontWeight: '700', 
    color: '#EF4444', 
  },

  // Version Footer
  versionText: { 
    textAlign: 'center', 
    fontSize: 11, 
    color: '#475569', 
    marginTop: 8,
    marginBottom: 20,
  },

  // Modals
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24,
  },
  modalBox: { 
    width: '100%', 
    backgroundColor: '#0C1322', 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.08)', 
    padding: 20, 
    alignItems: 'center',
  },
  aboutIcon: { 
    width: 56, 
    height: 56, 
    borderRadius: 18, 
    backgroundColor: 'rgba(16,185,129,0.12)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 12,
  },
  modalTitle: { 
    fontSize: 17, 
    fontWeight: '800', 
    color: '#FFFFFF', 
    marginBottom: 4,
  },
  modalDesc: { 
    fontSize: 12.5, 
    color: '#94A3B8', 
    textAlign: 'center', 
    lineHeight: 18,
  },
  modalCloseBtn: { 
    marginTop: 20, 
    paddingVertical: 10, 
    paddingHorizontal: 24, 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    borderRadius: 10,
  },
  modalCloseBtnText: { 
    color: '#FFFFFF', 
    fontSize: 13, 
    fontWeight: '700',
  },
  modalMessage: { 
    fontSize: 13.5, 
    color: '#94A3B8', 
    lineHeight: 20, 
  },
  envSubtitle: { 
    fontSize: 13, 
    color: '#94A3B8', 
    marginBottom: 14,
  },
  envCard: { 
    padding: 14, 
    borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.04)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)', 
    marginBottom: 10,
  },
  envCardActive: { 
    borderColor: '#10B981', 
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  envCardTitle: { 
    fontSize: 13.5, 
    fontWeight: '700', 
    color: '#FFFFFF',
  },
});
