import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../ui/GlassCard';
import { COLORS } from '@/styles/theme';
import styles from '../../../styles/components/landlord/Overview/UnpaidTenantsWidget.styles';
import { sendManualReminder } from '../../../services/paymentService';
import { useModal } from '../../../contexts/ModalContext';

export default function UnpaidTenantsWidget({ unpaidBills }) {
  const { showModal } = useModal();
  const [isSending, setIsSending] = useState(false);

  if (!unpaidBills || unpaidBills.length === 0) {
    return (
      <GlassCard style={[styles.card, styles.emptyCard]}>
        <Ionicons name="leaf-outline" size={48} color={COLORS.primary} style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>Zero Overdue Bills!</Text>
        <Text style={styles.emptyText}>All tenants are fully caught up with their payments.</Text>
      </GlassCard>
    );
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
          <Text style={[styles.amountText, { color: statusColor }]}>₱ {amount.toFixed(2)}</Text>
          <Text style={[styles.statusBadge, { color: statusColor, backgroundColor: `${statusColor}15` }]}>
            {statusLabel}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
            <Text style={styles.title}>Pending Collections</Text>
            <View style={styles.badge}>
            <Text style={styles.badgeText}>{unpaidBills.length}</Text>
            </View>
        </View>
        <TouchableOpacity 
          style={[styles.remindAllBtn, isSending && { opacity: 0.7 }]} 
          disabled={isSending}
          onPress={async () => {
            if (isSending) return;
            setIsSending(true);
            
            let successCount = 0;
            let failCount = 0;
            let lastErrorMessage = null;
            
            const promises = unpaidBills.map(item => {
                const isOverdue = item.payment_status === 'overdue';
                const now = new Date();
                const dueDate = item.due_date ? new Date(item.due_date) : null;
                const daysRemaining = dueDate ? Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)) : 0;
                const daysOverdue = isOverdue ? Math.abs(daysRemaining) : 0;
                const amount = parseFloat(item.total_cost || 0) + parseFloat(item.penalty_amount || 0);
                
                return sendManualReminder(item.room_id, item.tenant_id, amount, daysOverdue);
            });

            try {
                const results = await Promise.allSettled(promises);
                
                results.forEach(result => {
                    if (result.status === 'fulfilled') {
                        successCount++;
                    } else {
                        failCount++;
                        lastErrorMessage = result.reason?.message || 'Unknown error';
                    }
                });

                if (failCount === 0) {
                    showModal({ type: 'success', title: 'Reminder Sent', message: 'The payment reminder was successfully sent to all pending tenants.' });
                } else if (successCount > 0) {
                    showModal({ type: 'warning', title: 'Partial Success', message: `Sent ${successCount} reminders. ${failCount} failed.` });
                } else {
                    let friendlyError = 'Something went wrong while sending the reminder. Please try again.';
                    
                    if (lastErrorMessage?.includes('Missing required parameters')) {
                        friendlyError = 'Unable to find the tenant for this payment.';
                    } else if (lastErrorMessage?.includes('tenant notifications are disabled')) {
                        friendlyError = 'Notifications are disabled for this tenant.';
                    } else if (lastErrorMessage?.includes('Session Expired') || lastErrorMessage?.includes('Unauthorized')) {
                        friendlyError = 'Your session has expired. Please sign in again.';
                    } else if (lastErrorMessage?.includes('Network Error')) {
                        friendlyError = 'Unable to connect. Please check your internet connection and try again.';
                    }

                    showModal({ type: 'error', title: 'Reminder Not Sent', message: friendlyError });
                }
            } catch (error) {
                let errMessage = typeof error === 'string' ? error : (error?.message || 'Something went wrong while sending the reminder. Please try again.');
                if (errMessage.includes('Network Error')) errMessage = 'Unable to connect. Please check your internet connection and try again.';
                showModal({ type: 'error', title: 'Reminder Not Sent', message: errMessage });
            } finally {
                setIsSending(false);
            }
        }}>
            {isSending ? (
                <ActivityIndicator size="small" color={COLORS.textPrimary} style={{ marginRight: 4 }} />
            ) : (
                <Ionicons name="notifications-outline" size={14} color={COLORS.textPrimary} />
            )}
            <Text style={styles.remindText}>{isSending ? 'Sending...' : 'Remind'}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.listContainer}>
        {unpaidBills.map((item, index) => (
          <React.Fragment key={item.id}>
            {renderItem({ item })}
            {index < unpaidBills.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>
    </GlassCard>
  );
}


