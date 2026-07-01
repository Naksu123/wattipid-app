import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/styles/theme';
import styles from '../../../styles/components/landlord/Overview/RecentTransactionsWidget.styles';

export default function RecentTransactionsWidget({ history, onViewAll }) {
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
        <TouchableOpacity onPress={onViewAll}>
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


