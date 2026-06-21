import React from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_WEIGHT } from '@/styles/theme';

export default function PaymentHistoryModal({ visible, onClose, history }) {
  const renderItem = ({ item }) => {
    const isApproved = item.status === 'verified';
    const isRejected = item.status === 'rejected';
    
    let statusColor = COLORS.warning;
    let iconName = 'time-outline';
    
    if (isApproved) {
      statusColor = COLORS.success;
      iconName = 'checkmark-circle-outline';
    } else if (isRejected) {
      statusColor = COLORS.danger;
      iconName = 'close-circle-outline';
    }

    const dateStr = item.paid_at ? new Date(item.paid_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown Date';

    return (
      <View style={styles.transactionRow}>
        <View style={[styles.iconBox, { backgroundColor: `${statusColor}15` }]}>
          <Ionicons name={iconName} size={24} color={statusColor} />
        </View>
        <View style={styles.details}>
          <Text style={styles.tenantName}>{item.tenant_name || item.room_id}</Text>
          <Text style={styles.metaText}>{item.payment_method?.toUpperCase()} • {dateStr}</Text>
          {item.reference_number ? (
            <Text style={styles.metaText}>Ref: {item.reference_number}</Text>
          ) : null}
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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name={Platform.OS === 'ios' ? "chevron-down" : "close"} size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Full Payment Ledger</Text>
          <View style={{ width: 28 }} />
        </View>

        {(!history || history.length === 0) ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No transactions found.</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            ItemSeparatorComponent={() => <View style={styles.divider} />}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  title: {
    fontSize: 18,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  listContainer: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  details: {
    flex: 1,
    marginRight: 12,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontSize: 15,
  }
});
