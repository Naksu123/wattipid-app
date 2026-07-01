import { StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_WEIGHT, SHADOWS } from '../theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg },
  headerTitle: { fontSize: 20, fontWeight: FONT_WEIGHT.heavy, color: COLORS.textPrimary },
  backBtn: { padding: 8, backgroundColor: COLORS.surface, borderRadius: 12 },
  markAllText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  scroll: { padding: SPACING.lg, paddingBottom: 100 },
  notifCard: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: 16, borderRadius: RADIUS.lg, marginBottom: 12, ...SHADOWS.sm, alignItems: 'center' },
  unreadCard: { backgroundColor: '#ffffff', borderColor: `${COLORS.primary}30`, borderWidth: 1 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  unreadText: { fontWeight: '800', color: '#000' },
  message: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20 },
  date: { fontSize: 12, color: COLORS.textMuted, marginTop: 8, opacity: 0.7 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginLeft: 10 },
  emptyText: { marginTop: 16, color: COLORS.textMuted, fontSize: 16 },
});
