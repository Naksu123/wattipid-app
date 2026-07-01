import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../theme';

export default StyleSheet.create({
    // ============ Layout ============
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: SPACING.lg, paddingBottom: 100, paddingTop: SPACING.xl },
    center: { justifyContent: 'center', alignItems: 'center' },

    // ============ Header ============
    headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginBottom: SPACING.lg },

    // ============ Invoice Card ============
    invoiceCard: { padding: SPACING.lg, marginBottom: SPACING.lg },
    invoiceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.md },
    title: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },

    // ============ Rows & Labels ============
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    label: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
    value: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
    valueSuccess: { color: COLORS.success },

    // ============ Total Row ============
    totalRow: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 8 },
    totalLabel: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
    totalValue: { fontSize: 20, fontWeight: FONT_WEIGHT.heavy, color: COLORS.primary },

    // ============ Status ============
    statusBox: { marginTop: SPACING.lg, padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md, alignItems: 'center' },
    statusBoxPaid: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
    statusBoxPending: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
    statusText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, letterSpacing: 0.5 },
    statusTextPaid: { color: COLORS.success },
    statusTextPending: { color: COLORS.warning },
    statusBold: { fontWeight: 'bold', textTransform: 'uppercase' },

    // ============ Wizard ============
    wizardCard: { padding: SPACING.lg, marginTop: SPACING.sm },
    wizardProgress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
    stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    stepCircleActive: { backgroundColor: COLORS.primary },
    stepText: { color: COLORS.white, fontWeight: 'bold', fontSize: 12 },
    stepLine: { height: 2, width: 40, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 8 },
    stepLineActive: { backgroundColor: COLORS.primary },
    stepTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginBottom: SPACING.lg, textAlign: 'center' },

    // ============ Payment Methods ============
    methodBtn: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: RADIUS.lg, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    methodBtnActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(34,197,94,0.05)' },
    methodBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
    methodBtnTextActive: { color: COLORS.primary },

    // ============ Instructions ============
    instructionsBox: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    instructionsText: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 12, lineHeight: 22 },
    instructionsIcon: { alignSelf: 'center', marginBottom: 16 },
    accountLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4, marginTop: 12, textTransform: 'uppercase', letterSpacing: 1 },
    accountValue: { fontSize: 16, color: COLORS.textPrimary, fontWeight: 'bold' },
    qrContainer: { marginTop: 20, alignItems: 'center' },
    qrImage: { width: 200, height: 200, borderRadius: RADIUS.md, marginTop: 12 },

    // ============ Wizard Footer ============
    wizardFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 30 },
    backBtn: { flex: 1, padding: 16, borderRadius: RADIUS.md, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
    backBtnText: { color: COLORS.textPrimary, fontWeight: FONT_WEIGHT.bold },
    nextBtn: { flex: 1, flexDirection: 'row', padding: 16, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, gap: 8, marginTop: 12 },
    nextBtnText: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold },
    btnDisabled: { opacity: 0.5 },

    // ============ Inputs ============
    inputContainer: { marginBottom: SPACING.lg },
    inputLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginBottom: 8 },
    input: { backgroundColor: 'rgba(255,255,255,0.05)', color: COLORS.textPrimary, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

    // ============ Upload ============
    uploadBtn: { borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.4)', borderStyle: 'dashed', borderRadius: RADIUS.lg, padding: 24, alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.05)', marginBottom: SPACING.lg },
    uploadText: { marginTop: 8, color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold },
    previewImage: { width: '100%', height: 200, borderRadius: RADIUS.md, marginBottom: SPACING.lg, backgroundColor: 'rgba(0,0,0,0.2)' },

    // ============ Submit ============
    submitBtn: { marginTop: 0 },
    submitBtnText: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },

    // ============ Status Boxes ============
    pendingBox: { backgroundColor: 'rgba(245, 158, 11, 0.05)', padding: 24, borderRadius: RADIUS.xl, alignItems: 'center', marginTop: SPACING.md, borderColor: 'rgba(245, 158, 11, 0.3)', borderWidth: 1 },
    pendingText: { color: COLORS.warning, textAlign: 'center', marginTop: 12, fontWeight: FONT_WEIGHT.medium, lineHeight: 22 },
    paidBox: { backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: 24, borderRadius: RADIUS.xl, alignItems: 'center', marginTop: SPACING.md, borderColor: 'rgba(16, 185, 129, 0.3)', borderWidth: 1 },
    paidText: { color: COLORS.success, textAlign: 'center', marginTop: 12, fontWeight: FONT_WEIGHT.medium, lineHeight: 22 },

    // ============ Utility ============
    retryBtn: { marginTop: 16, padding: 12, paddingHorizontal: 24, backgroundColor: COLORS.primary, borderRadius: RADIUS.md },
    retryBtnText: { color: COLORS.white, fontWeight: '700' },
    loadingText: { color: COLORS.textMuted, marginTop: 12 },
    errorText: { color: COLORS.textMuted, marginTop: 12, textAlign: 'center', paddingHorizontal: 40 },
    noPendingText: { color: COLORS.textMuted, marginTop: 12 },
});
