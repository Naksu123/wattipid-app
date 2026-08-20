import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import GlassCard from '../../ui/GlassCard';
import { COLORS } from '@/styles/theme';
import styles from '../../../styles/components/landlord/Overview/PendingPaymentsWidget.styles';
import PaymentVerificationModal from './PaymentVerificationModal';

export default function PendingPaymentsWidget({ payments = [], onRefresh }) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Filter ONLY payments that are waiting for landlord verification
  const pendingVerifications = payments.filter(p => p.status === 'pending' || p.payment_status === 'pending_verification');

  // Deep-linking: auto-open modal if navigated from notification
  React.useEffect(() => {
    if (params?.paymentId && pendingVerifications.length > 0) {
      const match = pendingVerifications.find(p => String(p.id) === String(params.paymentId));
      if (match && (!selectedPayment || selectedPayment.id !== match.id)) {
        setSelectedPayment(match);
      }
    }
  }, [params?.paymentId, pendingVerifications]);

  if (!pendingVerifications || pendingVerifications.length === 0) {
    return (
      <GlassCard style={[styles.card, styles.emptyCard]}>
        <Ionicons name="checkmark-done-circle-outline" size={48} color={COLORS.success} style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>{"You're all caught up!"}</Text>
        <Text style={styles.emptyText}>No pending verifications required.</Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="alert-circle-outline" size={20} color={COLORS.accent} />
          <Text style={styles.title}>Pending Payments</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(landlord)/payments')}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {pendingVerifications.map((item, index) => {
          const name = item.tenant_name || 'Unknown';
          const room = item.room_name || item.room_id || '?';
          // Use item.amount (from payments table) if available, fallback to total_cost + penalty (if from billing_cycles)
          const amount = parseFloat(item.amount || item.total_cost || 0) + (item.amount ? 0 : parseFloat(item.penalty_amount || 0));
          
          return (
            <View key={item.id || index} style={[styles.item, index === payments.length - 1 && styles.lastItem]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.room}>Room {room}</Text>
              </View>
              <View style={styles.amountWrap}>
                <Text style={styles.amount}>₱ {amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
                <TouchableOpacity style={styles.verifyBtn} onPress={() => setSelectedPayment(item)}>
                  <Ionicons name="shield-checkmark-outline" size={14} color="#fff" />
                  <Text style={styles.verifyText}>Verify</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      <PaymentVerificationModal 
        visible={!!selectedPayment}
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
        onRefresh={onRefresh}
      />
    </GlassCard>
  );
}
