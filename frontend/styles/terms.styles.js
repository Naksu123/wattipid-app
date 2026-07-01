import { StyleSheet, Platform } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from './theme';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: Platform.OS === 'android' ? 40 : SPACING.lg,
        paddingBottom: SPACING.md,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        zIndex: 10,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.heavy,
        color: COLORS.textPrimary,
    },
    lastUpdated: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.primary,
        fontWeight: FONT_WEIGHT.bold,
        marginTop: 2,
    },
    searchContainer: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.background,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        height: 48,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        color: COLORS.textPrimary,
        fontSize: FONT_SIZE.md,
        marginLeft: SPACING.sm,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xl,
    },
    introText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textMuted,
        marginBottom: SPACING.lg,
        lineHeight: 20,
    },
    sectionCard: {
        marginBottom: SPACING.sm,
        padding: 0,
        overflow: 'hidden',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.textPrimary,
        flex: 1,
        paddingRight: SPACING.md,
    },
    sectionContent: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: SPACING.sm,
    },
    sectionText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: SPACING.md,
        fontSize: FONT_SIZE.md,
        color: COLORS.textMuted,
    },
    footer: {
        padding: SPACING.lg,
        backgroundColor: 'rgba(15, 23, 42, 0.98)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.primary,
        marginRight: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: COLORS.primary,
    },
    checkboxLabel: {
        flex: 1,
        fontSize: FONT_SIZE.sm,
        color: COLORS.textPrimary,
        fontWeight: FONT_WEIGHT.bold,
    },
    acceptButton: {
        backgroundColor: COLORS.primary,
        height: 54,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptButtonDisabled: {
        backgroundColor: 'rgba(34,197,94,0.3)',
    },
    acceptButtonText: {
        color: COLORS.white,
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold,
    }
});
