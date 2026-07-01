import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../theme';

export default StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
    loadingText: { marginTop: SPACING.lg, fontSize: FONT_SIZE.md, color: COLORS.textMuted },
    
    successCard: { padding: SPACING.xxl, alignItems: 'center', width: '100%', maxWidth: 400 },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xl },
    successTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.heavy, color: COLORS.textPrimary, marginBottom: SPACING.sm, textAlign: 'center' },
    successDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xxl, lineHeight: 22 },
    
    primaryButton: { flexDirection: 'row', backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, paddingHorizontal: 24, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
    primaryButtonText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, marginLeft: 8 },
    
    secondaryButton: { backgroundColor: 'transparent', borderRadius: RADIUS.md, paddingVertical: 14, paddingHorizontal: 24, width: '100%', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    secondaryButtonText: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
    
    errorText: { marginTop: SPACING.lg, fontSize: FONT_SIZE.lg, color: COLORS.danger, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.xs },
    errorSubtext: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, textAlign: 'center', marginBottom: SPACING.xl, paddingHorizontal: 20 },

    headerIconBtnLeft: { marginLeft: 15, marginRight: 15 },
    headerIconBtnRight: { marginRight: 15 }
});
