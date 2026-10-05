import { StyleSheet, Platform } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme';

export default StyleSheet.create({
  // Modal Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 8,
    width: '100%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll Body
  scroll: {
    width: '100%',
    paddingVertical: 2,
    flexShrink: 1,
  },

  // Profile Identity Chip
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 9,
    marginBottom: 10,
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#059669',
    borderWidth: 1.5,
    borderColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  profileEmail: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  roleBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },

  // Sections
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 5,
    marginLeft: 2,
  },
  card: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 7,
  },

  // Inputs
  inputGroup: {
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
  },
  inputWrapperActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  inputIcon: {
    marginRight: 7,
  },
  input: {
    flex: 1,
    height: '100%',
    color: COLORS.textPrimary,
    fontSize: 12.5,
  },
  eyeIcon: {
    padding: 5,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginLeft: 2,
  },
  validationText: {
    fontSize: 10,
    color: COLORS.danger,
  },
  helperText: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginBottom: 2,
  },

  // Strength Bar
  strengthBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 3,
  },
  strengthFill: {
    height: '100%',
  },
  strengthLabel: {
    fontSize: 9.5,
    marginTop: 2,
    textAlign: 'right',
    fontWeight: '600',
  },

  // Footer Actions
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1.3,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
  },
  saveBtnLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#042F2E',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
