import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_WEIGHT, SHADOWS } from '@/styles/theme';

export default function RecentTransactionsWidget({ history }) {
  if (!history || history.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Payment Ledger</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={32} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No recent transactions found.</Text>
        </View>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const isApproved = item.status === 'verified';
    const isRejected = item.status === 'rejected';
    const isPending = item.status === 'pending';
    
    let statusColor = COLORS.warning;
    let iconName = 'time-outline';
    
    if (isApproved) {
      statusColor = COLORS.success;
      iconName = 'checkmark-circle-outline';
    } else if (isRejected) {
      statusColor = COLORS.danger;
      iconName = 'close-circle-outline';
    }

    const dateStr = item.paid_at ? new Date(item.paid_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown Date';

    return (
      <View style={styles.transactionRow}>
        <View style={[styles.iconBox, { backgroundColor: `${statusColor}15` }]}>
          <Ionicons name={iconName} size={20} color={statusColor} />
        </View>
        <View style={styles.details}>
          <Text style={styles.tenantName}>{item.tenant_name || item.room_id}</Text>
          <Text style={styles.metaText}>{item.payment_method?.toUpperCase()} • {dateStr}</Text>
        </View>
        <View style={styles.amountBox}>
          <Text style={styles.amountText}>₱{parseFloat(item.amount || 0).toFixed(2)}</Text>
          <Text style={[styles.statusBadge, { color: statusColor, backgroundColor: `${statusColor}10` }]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment Ledger</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllBtn}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.listContainer}>
        {history.slice(0, 5).map((item, index) => (
          <React.Fragment key={item.id}>
            {renderItem({ item })}
            {index < Math.min(history.length - 1, 4) && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  viewAllBtn: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  listContainer: {
    gap: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  tenantName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: COLORS.textMuted,
    marginTop: 8,
    fontSize: 13,
  }
});
