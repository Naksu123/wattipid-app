import { StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../theme';

export default StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  scroll: { 
    paddingHorizontal: SPACING.lg, 
    paddingTop: SPACING.xl + 20, 
    paddingBottom: SPACING.xxl * 2 
  },
  title: { 
    fontSize: FONT_SIZE.xxl, 
    fontWeight: FONT_WEIGHT.bold, 
    color: COLORS.textPrimary,
    letterSpacing: -0.5
  },
  subtitle: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textSecondary, 
    marginBottom: SPACING.xl 
  },
  dailyCard: { 
    marginBottom: SPACING.lg, 
    paddingTop: SPACING.xl 
  },
  dailyBadge: { 
    position: 'absolute', 
    top: 12, 
    right: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: SPACING.sm, 
    paddingVertical: 3, 
    borderRadius: RADIUS.full 
  },
  dailyBadgeText: { 
    fontSize: 10, 
    color: '#fff', 
    fontWeight: FONT_WEIGHT.bold, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  dailyContent: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: SPACING.md 
  },
  dailyIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    backgroundColor: 'rgba(34,197,94,0.12)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  dailyText: { 
    flex: 1 
  },
  dailyCat: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.semibold, 
    textTransform: 'uppercase', 
    letterSpacing: 1, 
    marginBottom: 4 
  },
  dailyTip: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    lineHeight: 20 
  },
  tabRow: { 
    flexDirection: 'row', 
    gap: SPACING.sm, 
    marginBottom: SPACING.lg 
  },
  tabBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 4, 
    paddingVertical: 12, 
    paddingHorizontal: 4,
    borderRadius: RADIUS.md, 
    backgroundColor: COLORS.surfaceGlass, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  tabActive: { 
    backgroundColor: 'rgba(34,197,94,0.1)', 
    borderColor: COLORS.primary 
  },
  tabText: { 
    fontSize: 11, 
    color: COLORS.textMuted, 
    fontWeight: FONT_WEIGHT.medium 
  },
  tabTextActive: { 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  tabBadge: { 
    backgroundColor: COLORS.primary, 
    borderRadius: 10, 
    minWidth: 20, 
    height: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 5 
  },
  tabBadgeText: { 
    fontSize: 10, 
    color: '#fff', 
    fontWeight: FONT_WEIGHT.bold 
  },
  statusBanner: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: SPACING.md, 
    marginBottom: SPACING.md 
  },
  statusRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    flex: 1 
  },
  statusDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4 
  },
  statusText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textSecondary, 
    flex: 1 
  },
  statusTime: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted 
  },
  dynamicCard: { 
    marginBottom: SPACING.sm 
  },
  dynamicHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.md, 
    marginBottom: SPACING.sm 
  },
  dynamicIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  dynamicMeta: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  dynamicCat: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    fontWeight: FONT_WEIGHT.semibold, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  priorityBadge: { 
    paddingHorizontal: SPACING.sm, 
    paddingVertical: 2, 
    borderRadius: RADIUS.full 
  },
  priorityText: { 
    fontSize: 9, 
    fontWeight: FONT_WEIGHT.bold, 
    letterSpacing: 0.5 
  },
  dynamicTip: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    lineHeight: 20 
  },
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: SPACING.xxl, 
    gap: SPACING.sm 
  },
  emptyState2: { 
    alignItems: 'center', 
    paddingVertical: SPACING.xxl, 
    gap: SPACING.md 
  },
  emptyTitle: { 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  emptyDesc: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textMuted 
  },
  howCard: { 
    marginTop: SPACING.md, 
    marginBottom: SPACING.xxl 
  },
  howHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    marginBottom: SPACING.sm 
  },
  howTitle: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.info, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  howText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted, 
    lineHeight: 18 
  },
  catScroll: { 
    marginBottom: SPACING.md 
  },
  catContainer: { 
    gap: SPACING.sm 
  },
  catBtn: { 
    paddingHorizontal: SPACING.md, 
    paddingVertical: SPACING.sm, 
    borderRadius: RADIUS.full, 
    backgroundColor: COLORS.surfaceGlass, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  catActive: { 
    backgroundColor: 'rgba(34,197,94,0.12)', 
    borderColor: COLORS.primary 
  },
  catText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textMuted, 
    fontWeight: FONT_WEIGHT.medium 
  },
  catTextActive: { 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.semibold 
  },
  summaryBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: SPACING.sm, 
    padding: SPACING.md, 
    marginBottom: SPACING.md 
  },
  summaryBarText: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.textMuted 
  },
  tipCard: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: SPACING.md, 
    marginBottom: SPACING.sm, 
    padding: SPACING.md 
  },
  tipIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    backgroundColor: 'rgba(34,197,94,0.1)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 2 
  },
  tipContent: { 
    flex: 1 
  },
  tipHeaderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 4, 
    gap: SPACING.sm 
  },
  tipTitle: { 
    flex: 1, 
    fontSize: FONT_SIZE.md, 
    color: COLORS.textPrimary, 
    fontWeight: FONT_WEIGHT.bold 
  },
  impactBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: RADIUS.sm, 
    flexShrink: 0, 
    alignSelf: 'flex-start',
    marginTop: 2
  },
  impactText: { 
    fontSize: 8, 
    fontWeight: '800', 
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  tipCategory: { 
    fontSize: FONT_SIZE.xs, 
    color: COLORS.primary, 
    fontWeight: FONT_WEIGHT.semibold, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  tipText: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textSecondary, 
    lineHeight: 20 
  },
  reasonBox: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 6, 
    marginTop: 10, 
    padding: 8, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: RADIUS.sm, 
    borderLeftWidth: 2, 
    borderLeftColor: COLORS.warning 
  },
  reasonText: { 
    flex: 1, 
    fontSize: 11, 
    color: COLORS.textMuted, 
    fontStyle: 'italic', 
    lineHeight: 16, 
    flexWrap: 'wrap' 
  },
  // --- INTERACTIVE TIPS SYSTEM ---
  interactiveCard: {
    padding: SPACING.xl,
    borderRadius: RADIUS.xxl,
    marginBottom: SPACING.lg,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  tipCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm
  },
  tipCatLabel: {
    fontSize: 12,
    fontWeight: FONT_WEIGHT.heavy,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.5
  },
  tipMainTitle: {
    fontSize: 22,
    fontWeight: FONT_WEIGHT.heavy,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    lineHeight: 28
  },
  tipMainMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.xl
  },
  interactiveFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  likeBtnActive: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.2)'
  },
  likeCount: {
    fontSize: 14,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorBox: {
    padding: SPACING.lg,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center',
    marginBottom: SPACING.lg
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.full
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: FONT_WEIGHT.bold
  }
});
