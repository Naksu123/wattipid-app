import { StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  calcButton: { backgroundColor: COLORS.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyStateText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
  emptyStateSubtext: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
  accountCard: { backgroundColor: 'rgba(30,41,59,0.5)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  roomText: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  tenantText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  badge: { backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: COLORS.danger },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 },
  finRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  finLabel: { fontSize: 14, color: COLORS.textSecondary },
  finValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  finRowTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  finTotalLabel: { fontSize: 15, fontWeight: 'bold', color: COLORS.textPrimary },
  finTotalValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.danger },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(14,165,233,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  actionText: { fontSize: 13, fontWeight: '600', color: COLORS.primary }
});
