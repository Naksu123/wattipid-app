import { StyleSheet, Platform } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, SHADOWS } from '@/styles/theme';

export default StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end', // Bottom sheet style
  },
  overlayCentered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'rgba(3, 7, 18, 0.82)',
  },
  keyboardView: {
    width: '100%',
    maxHeight: '90%', // 90% of screen height
  },
  keyboardViewCentered: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg, // Safe area padding
    width: '100%',
    ...SHADOWS.lg,
  },
  modalContainerCentered: {
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    backgroundColor: '#0C1322',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    width: '92%',
    maxWidth: 350,
    maxHeight: '85%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyScroll: {
    maxHeight: 460, // Reasonable max height before scrolling
  },
  bodyScrollContent: {
    paddingBottom: 4,
  },
  bodyView: {
    paddingBottom: 4,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    minHeight: 56,
  },
  footerStacked: {
    flexDirection: 'column-reverse', // Secondary below primary
    gap: SPACING.md,
  },
  footerBtn: {
    flex: 1,
    height: 44, // Touch-friendly height
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  stackedBtn: {
    width: '100%',
  },
  primaryBtn: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 13.5,
    color: '#042F2E',
    fontWeight: '800',
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryBtnText: {
    fontSize: 13.5,
    color: '#94A3B8',
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
