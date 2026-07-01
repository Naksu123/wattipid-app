import { StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  headerIconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  scroll: { padding: SPACING.lg },
  
  searchSection: { marginBottom: SPACING.xl },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 54,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small
  },
  searchInput: { flex: 1, marginLeft: 10, color: COLORS.textPrimary, fontSize: 16 },
  catScroll: { paddingBottom: 5 },
  catBtn: { 
    paddingHorizontal: 18, 
    paddingVertical: 8, 
    borderRadius: RADIUS.full, 
    backgroundColor: COLORS.surfaceGlass,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8
  },
  catActive: { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: COLORS.primary },
  catText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.medium },
  catTextActive: { color: COLORS.primary, fontWeight: FONT_WEIGHT.bold },

  statsRow: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: RADIUS.xl, 
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statLabel: { fontSize: 10, color: COLORS.textMuted, letterSpacing: 1, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },

  tipCard: { marginBottom: SPACING.md, padding: 16, borderRadius: RADIUS.xl },
  inactiveCard: { opacity: 0.6 },
  tipRow: { flexDirection: 'row', gap: 16 },
  iconContainer: { 
    width: 54, 
    height: 54, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  tipContent: { flex: 1 },
  tipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  tipTitle: { fontSize: 16, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, flex: 1 },
  tipCategory: { fontSize: 11, color: COLORS.primary, fontWeight: FONT_WEIGHT.heavy, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  tipMessage: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  tipFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  engagement: { flexDirection: 'row', gap: 16 },
  engItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  engText: { fontSize: 12, color: COLORS.textMuted, fontWeight: FONT_WEIGHT.medium },
  actions: { flexDirection: 'row' },
  actionBtn: { padding: 4 },

  loaderContainer: { alignItems: 'center', marginTop: 40 },
  loaderText: { marginTop: 12, color: COLORS.textMuted, fontSize: 14 },
  emptyState: { alignItems: 'center', marginTop: 40, padding: SPACING.xl },
  emptyTitle: { fontSize: 18, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginTop: 16 },
  emptyDesc: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 8 },

  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 12, fontWeight: FONT_WEIGHT.heavy, color: COLORS.textMuted, letterSpacing: 1 },
  input: { 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: RADIUS.lg, 
    padding: 14, 
    color: COLORS.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  iconInputRow: { flexDirection: 'row', alignItems: 'center' },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pickerBtn: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: RADIUS.md, 
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  pickerBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pickerText: { fontSize: 12, color: COLORS.textSecondary },
  pickerTextActive: { color: '#fff', fontWeight: 'bold' },
});
