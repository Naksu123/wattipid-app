import { StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_WEIGHT, SHADOWS } from '../theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' }, // Deep OLED black
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  markAllText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  scroll: { padding: SPACING.lg, paddingBottom: 100 },
  notifCard: { 
    flexDirection: 'row', 
    padding: 16, 
    marginBottom: 12, 
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderRadius: 16,
  },
  unreadCard: { 
    backgroundColor: 'rgba(255, 255, 255, 0.08)', 
    borderColor: 'rgba(255, 255, 255, 0.15)', 
    borderWidth: 1,
  },
  iconBox: { 
    width: 48, height: 48, 
    borderRadius: 14, 
    justifyContent: 'center', alignItems: 'center', 
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '500', color: 'rgba(255, 255, 255, 0.6)', marginBottom: 4, letterSpacing: -0.2 },
  unreadText: { fontWeight: '700', color: '#FFFFFF' },
  message: { fontSize: 14, color: 'rgba(255, 255, 255, 0.5)', lineHeight: 20 },
  date: { fontSize: 12, color: 'rgba(255, 255, 255, 0.4)', marginTop: 8, fontWeight: '500' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginLeft: 12 },
  
  // Empty State Styles
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, padding: SPACING.xl },
  emptyIconBox: { 
    width: 80, height: 80, borderRadius: 40, 
    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
    alignItems: 'center', justifyContent: 'center', 
    marginBottom: 24 
  },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#FFFFFF', marginBottom: 8, letterSpacing: -0.5 },
  emptyText: { fontSize: 15, color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', lineHeight: 22 },
});
