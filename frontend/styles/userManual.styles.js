import { StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from './theme';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ─── Header ─────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'android' ? (SPACING.xl + 12) : SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: FONT_WEIGHT.heavy,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.heavy,
    color: COLORS.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ─── Search ─────────────────────────────────────────────
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: SPACING.md,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  clearBtn: {
    padding: 4,
  },

  // ─── Results Count ──────────────────────────────────────
  resultsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  resultsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
  },
  clearSearchBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  clearSearchText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
  },

  // ─── Scroll Content ─────────────────────────────────────
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },

  // ─── Accordion ──────────────────────────────────────────
  accordionContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    ...SHADOWS.sm,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  accordionHeaderActive: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Accordion Body ─────────────────────────────────────
  accordionBody: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: 'rgba(11,15,25,0.5)',
  },

  // ─── Step Card ──────────────────────────────────────────
  stepCard: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  stepNumberWrap: {
    alignItems: 'center',
    width: 28,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16,185,129,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: FONT_WEIGHT.heavy,
    color: COLORS.primary,
  },
  stepLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: 'rgba(16,185,129,0.1)',
    marginTop: 6,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 4,
  },
  stepHeading: {
    fontSize: 14,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  stepText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textMuted,
  },

  // ─── Empty State ────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(107,114,128,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    lineHeight: 20,
  },
});
