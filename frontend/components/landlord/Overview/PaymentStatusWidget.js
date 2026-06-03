import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GlassCard from '../../ui/GlassCard';
import { COLORS, RADIUS, FONT_WEIGHT, SPACING } from '@/styles/theme';

export default function PaymentStatusWidget({ summary }) {
  const total = parseInt(summary?.total) || 0;
  const pending = parseInt(summary?.pending) || 0;
  const verified = parseInt(summary?.verified) || 0;
  const collectedAmt = parseFloat(summary?.collectedAmount) || 0;
  const outstandingAmt = parseFloat(summary?.outstandingAmount) || 0;

  const verifiedPct = total > 0 ? (verified / total) * 100 : 0;
  const pendingPct = total > 0 ? (pending / total) * 100 : 0;

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.title}>Billing Collection Status</Text>
      
      {total === 0 ? (
        <Text style={styles.empty}>No billing cycles recorded yet.</Text>
      ) : (
        <View style={styles.container}>
          {/* Multi-color Progress Bar */}
          <View style={styles.barContainer}>
            <View style={[styles.barSegment, { width: `${verifiedPct}%`, backgroundColor: COLORS.success, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }]} />
            <View style={[styles.barSegment, { width: `${pendingPct}%`, backgroundColor: COLORS.warning, borderTopRightRadius: 6, borderBottomRightRadius: 6 }]} />
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.legendVal}>{verified}</Text>
              <Text style={styles.legendLabel}>Paid</Text>
              <Text style={styles.legendAmount}>₱{collectedAmt.toFixed(2)}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.legendVal}>{pending}</Text>
              <Text style={styles.legendLabel}>Unpaid</Text>
              <Text style={styles.legendAmount}>₱{outstandingAmt.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderRadius: RADIUS.xl,
  },
  title: {
    fontSize: 14,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  empty: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic'
  },
  barContainer: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  barSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  legendVal: {
    fontSize: 16,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  legendLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  legendAmount: {
    fontSize: 12,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
    marginTop: 2,
  }
});
