import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/styles/theme';
import styles from '../../../styles/components/landlord/Overview/UnpaidTenantsWidget.styles';

export default function UnpaidTenantsWidget({ unpaidBills }) {
  if (!unpaidBills || unpaidBills.length === 0) {
    return null; // Don't show the widget if there are no unpaid bills
  }

  const renderItem = ({ item }) => {
    const isOverdue = item.payment_status === 'overdue';
    const hasPenalty = parseFloat(item.penalty_amount || 0) > 0;
    
    // Calculate remaining days
    const now = new Date();
    const dueDate = item.due_date ? new Date(item.due_date) : null;
    const daysRemaining = dueDate ? Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)) : null;
    
    // Determine status badge
    let statusLabel, statusColor, iconName;
    if (hasPenalty && isOverdue) {
      statusLabel = 'PENALTY';
      statusColor = '#DC2626';
      iconName = 'alert-circle';
    } else if (isOverdue) {
      statusLabel = 'OVERDUE';
      statusColor = COLORS.danger;
      iconName = 'alert-circle-outline';
    } else if (daysRemaining !== null && daysRemaining <= 0) {
      statusLabel = 'DUE TODAY';
      statusColor = '#DC2626';
      iconName = 'alarm-outline';
    } else if (daysRemaining !== null && daysRemaining === 1) {
      statusLabel = 'DUE SOON';
      statusColor = '#F59E0B';
      iconName = 'time-outline';
    } else {
      statusLabel = 'UNPAID';
      statusColor = COLORS.warning;
      iconName = 'time-outline';
    }

    const dateStr = item.due_date ? new Date(item.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Unknown Due Date';
    const amount = parseFloat(item.total_cost || 0) + parseFloat(item.penalty_amount || 0);

    return (
      <View style={styles.transactionRow}>
        <View style={[styles.iconBox, { backgroundColor: `${statusColor}15` }]}>
          <Ionicons name={iconName} size={20} color={statusColor} />
        </View>
        <View style={styles.details}>
          <Text style={styles.tenantName} numberOfLines={1}>{item.tenant_name || 'Unknown Tenant'}</Text>
          <Text style={styles.metaText}>Room: {item.room_name || item.room_id}</Text>
          {daysRemaining !== null && !isOverdue && (
            <Text style={[styles.metaText, { color: statusColor, fontWeight: '600' }]}>
              {daysRemaining > 0 ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining` : 'Due today'}
            </Text>
          )}
        </View>
        <View style={styles.amountBox}>
          <Text style={[styles.amountText, { color: statusColor }]}>₱{amount.toFixed(2)}</Text>
          <Text style={[styles.statusBadge, { color: statusColor, backgroundColor: `${statusColor}10` }]}>
            {statusLabel}
          </Text>
          <Text style={styles.dueText}>Due {dateStr}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Pending Collections</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unpaidBills.length}</Text>
        </View>
      </View>
      
      <View style={styles.listContainer}>
        {unpaidBills.map((item, index) => (
          <React.Fragment key={item.id}>
            {renderItem({ item })}
            {index < unpaidBills.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}


