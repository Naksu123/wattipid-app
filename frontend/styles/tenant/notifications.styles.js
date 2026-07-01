import { StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_WEIGHT } from '../theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.textMuted, marginTop: 12, fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingTop: Platform.OS === 'android' ? 16 : SPACING.md, paddingBottom: 12,
  },
  backBtn: { padding: 8, backgroundColor: COLORS.surface, borderRadius: 12 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: FONT_WEIGHT.heavy, color: COLORS.textPrimary },
  headerBadge: { backgroundColor: COLORS.primary, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  headerBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  markAllText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  markAllTextDisabled: { opacity: 0.4 },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: SPACING.lg, marginBottom: 12,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    paddingHorizontal: 14, height: 44,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14 },

  // Tabs
  tabScroll: { maxHeight: 44, marginBottom: 8 },
  tabContainer: { paddingHorizontal: SPACING.lg, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: COLORS.surface, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: '#fff' },

  // List
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: 4 },
  searchResultLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12, fontStyle: 'italic' },

  // Notification Card
  notifCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  unreadCard: {
    backgroundColor: 'rgba(34,197,94,0.04)',
    borderColor: 'rgba(34,197,94,0.15)',
  },
  notifTop: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  unreadTitle: { fontWeight: '800' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  notifMessage: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 8 },
  notifMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sevBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  sevText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  timeText: { fontSize: 11, color: COLORS.textMuted },
  deleteBtn: { padding: 4, marginLeft: 4 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyTitle: { fontSize: 17, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginBottom: 6 },
  emptySubtext: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});
