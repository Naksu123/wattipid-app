import { StyleSheet, Platform } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../theme';

export default StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    loadingText: { color: COLORS.textMuted, marginTop: 12 },
    
    header: {
        padding: SPACING.lg,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    backButton: {
        marginRight: SPACING.sm,
        padding: 4,
    },
    headerTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.textPrimary,
    },
    
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, height: 44, color: COLORS.textPrimary, fontSize: 14 },
    
    filterContainer: { flexDirection: 'row', gap: 8 },
    filterPill: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: RADIUS.xl, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    filterPillActive: { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: COLORS.primary },
    filterText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
    filterTextActive: { color: COLORS.primary },

    listContainer: { padding: SPACING.lg, paddingBottom: 100 },
    card: { padding: 16, marginBottom: 16, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    invoiceNumber: { fontSize: 15, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
    
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    
    cardBody: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    infoCol: { flex: 1 },
    infoLabel: { fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    infoValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
    
    paymentDetailsBox: { backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: 12, borderRadius: RADIUS.sm, marginBottom: 16 },
    paymentDetailsText: { fontSize: 12, color: COLORS.success, fontWeight: '600', marginBottom: 2 },
    paymentDetailsSubText: { fontSize: 11, color: COLORS.textMuted },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    amountValue: { fontSize: 20, fontWeight: FONT_WEIGHT.heavy, color: COLORS.primary },
    amountValueOverdue: { color: COLORS.danger },

    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    emptyText: { color: COLORS.textMuted, marginTop: 12, fontSize: 14 }
});
