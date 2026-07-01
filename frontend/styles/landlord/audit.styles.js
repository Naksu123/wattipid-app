import { StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_WEIGHT, SHADOWS } from '../theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg },
  headerTitle: { fontSize: 20, fontWeight: FONT_WEIGHT.heavy, color: COLORS.textPrimary },
  backBtn: { padding: 8, backgroundColor: COLORS.surface, borderRadius: 12 },
  scroll: { padding: SPACING.lg, paddingBottom: 100 },
  disclaimer: { fontSize: 13, color: COLORS.success, marginBottom: 20, textAlign: 'center' },
  logCard: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: 16, borderRadius: RADIUS.lg, marginBottom: 12, ...SHADOWS.sm, alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  details: { flex: 1 },
  actionText: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary },
  targetText: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  dateText: { fontSize: 11, color: COLORS.textMuted, marginTop: 6, opacity: 0.8 },
  
  // Modal Premium Styling
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '85%', padding: SPACING.xl, paddingBottom: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', ...SHADOWS.lg },
  modalDragIndicator: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  closeBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  modalScroll: { marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: RADIUS.lg, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  detailIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  codeSection: { marginTop: 12, marginBottom: 16 },
  detailLabel: { fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  jsonBox: { backgroundColor: '#0f172a', padding: 16, borderRadius: RADIUS.lg, marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  jsonText: { fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: COLORS.success, lineHeight: 18 },
  loadingText: { marginTop: 12, color: COLORS.textMuted }
});
