import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../theme';

const screenWidth = Dimensions.get('window').width;

export default StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0A0F1D' 
  },
  scroll: { 
    paddingHorizontal: 20, 
    paddingTop: 54,
    paddingBottom: 110 
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    marginBottom: 20,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#FFFFFF',
    letterSpacing: -0.5
  },

  // ── Period Tabs ──────────────────────────────────────────────────────────
  periodRow: { 
    flexDirection: 'row', 
    backgroundColor: '#131D2E',
    borderRadius: 24,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  periodBtn: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  periodActive: { 
    backgroundColor: '#10B981',
  },
  periodText: { 
    fontSize: 13, 
    color: '#94A3B8', 
    fontWeight: '600',
  },
  periodTextActive: { 
    color: '#0A0F1D',
    fontWeight: '800' 
  },

  // ── Date Navigation ──────────────────────────────────────────────────────
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  dateNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#131D2E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dateNavTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // ── Consumption Analysis Card ─────────────────────────────────────────────
  analysisCard: {
    backgroundColor: '#131D2E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  analysisHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  analysisTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  unitBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  unitBtnActive: {
    backgroundColor: '#10B981',
  },
  unitText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  unitTextActive: {
    color: '#0A0F1D',
    fontWeight: '800',
  },

  // ── Vertical Bar Capsules ─────────────────────────────────────────────────
  capsulesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    marginBottom: 18,
    paddingHorizontal: 6,
  },
  capsuleColumn: {
    alignItems: 'center',
    flex: 1,
  },
  capsuleValText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  capsuleTrack: {
    width: 38,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 19,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  capsuleFill: {
    width: '100%',
    borderRadius: 19,
  },
  capsuleFillGreen: {
    backgroundColor: '#10B981',
  },
  capsuleFillAmber: {
    backgroundColor: '#F59E0B',
  },
  capsuleLabelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 10,
  },

  // ── Insight Footnote ──────────────────────────────────────────────────────
  footnoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  footnoteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginRight: 10,
  },
  footnoteText: {
    fontSize: 12,
    color: '#FCD34D',
    flex: 1,
    lineHeight: 17,
    fontWeight: '500',
  },

  // ── Metric Comparison Cards ───────────────────────────────────────────────
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131D2E',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  metricIconRed: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  metricIconAmber: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metricValueRed: {
    fontSize: 17,
    fontWeight: '800',
    color: '#EF4444',
    marginBottom: 3,
  },
  metricValueAmber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F59E0B',
    marginBottom: 3,
  },
  metricSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },

  // ── PDF Export Button ─────────────────────────────────────────────────────
  exportCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 28,
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  exportCtaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A0F1D',
    marginLeft: 8,
    letterSpacing: 0.3,
  },

  // ── Backward-compatible styles for modals/loaders ──────────────────────────
  noData: { 
    fontSize: FONT_SIZE.sm, 
    color: COLORS.textMuted, 
    textAlign: 'center', 
    paddingVertical: 40 
  },
  disclaimer: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
    fontStyle: 'italic',
  },
});
