import { StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../../theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  historySection: {
    flex: 1,
    padding: SPACING.lg,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30,41,59,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20
  },
  filterDropdownText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 13
  },
  histGroup: {
    marginBottom: 20
  },
  histGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingLeft: 4
  },
  histDate: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 14
  },
  histTableWrapper: {
    paddingBottom: 4
  },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    marginBottom: 4
  },
  histRowAlt: {
    backgroundColor: 'rgba(255,255,255,0.01)'
  },
  histColTime: { flex: 1, color: COLORS.textPrimary, fontWeight: '600', fontSize: 13 },
  histColWatts: { flex: 1, color: COLORS.textPrimary, fontSize: 13 },
  histColKwh: { flex: 1, color: COLORS.textPrimary, fontSize: 13 },
  histColCost: { flex: 1, color: COLORS.textPrimary, fontWeight: '600', fontSize: 13 },
  histColStatus: { width: 40, alignItems: 'flex-end' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  emptyHist: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyHistText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontWeight: '500'
  },
  filterOption: {
    padding: 16, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: RADIUS.md, 
    marginBottom: 8, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)'
  },
  filterOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(34,197,94,0.1)'
  },
  datePickerControl: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: RADIUS.md, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)'
  }
});
