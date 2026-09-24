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
});
