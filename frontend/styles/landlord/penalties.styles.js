import { StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scroll: { padding: 20, paddingBottom: 100, flexGrow: 1 },
  
  // Section Headers
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, letterSpacing: 0.5 },
  headerMoreBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  
  // Overview Grid
  overviewGrid: { marginBottom: 30, marginTop: 10 },
  overviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeSuccess: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeSuccessText: { fontSize: 12, fontWeight: '600', color: COLORS.success },
  overviewGridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  overviewBox: { width: '48%', backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  overviewLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  overviewValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary },

  // Activity Section
  activitySection: { marginBottom: 30 },
  activityCard: { backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyActivity: { padding: 20, alignItems: 'center' },
  emptyActivityText: { color: COLORS.textMuted, fontSize: 14, fontStyle: 'italic' },
  activityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger, marginRight: 12, marginTop: 4, alignSelf: 'flex-start' },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
  activityDesc: { fontSize: 12, color: COLORS.textSecondary },
  activityAmount: { fontSize: 14, fontWeight: '700', color: COLORS.danger },

  // Accounts Section
  accountsSection: { flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyStateText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
  emptyStateSubtext: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
  
  // Compact Account Card
  compactAccountCard: { backgroundColor: 'rgba(15, 23, 42, 0.6)', borderRadius: 20, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  compactCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  roomText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  tenantText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  badge: { backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: COLORS.danger },
  
  compactFinContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 16 },
  compactFinCol: { flex: 1 },
  compactFinLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  compactFinValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
  compactFinTotalLabel: { fontSize: 13, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
  compactFinTotalValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.danger },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, height: '75%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  closeModalBtn: { padding: 4 },
});
