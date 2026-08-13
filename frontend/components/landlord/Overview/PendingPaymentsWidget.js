import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import GlassCard from '../../ui/GlassCard';
import { COLORS } from '@/styles/theme';
import styles from '../../../styles/components/landlord/Overview/PendingPaymentsWidget.styles';

export default function PendingPaymentsWidget({ payments = [] }) {
  const router = useRouter();

  // Filter ONLY payments that are waiting for landlord verification
  const pendingVerifications = payments.filter(p => p.payment_status === 'pending_verification');

  if (!pendingVerifications || pendingVerifications.length === 0) {
    return (
      <GlassCard style={[styles.card, styles.emptyCard]}>
        <Ionicons name="checkmark-done-circle-outline" size={48} color={COLORS.success} style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>You're all caught up!</Text>
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
          const amount = parseFloat(item.total_cost || 0) + parseFloat(item.penalty_amount || 0);
          
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
                <TouchableOpacity style={styles.verifyBtn} onPress={() => router.push('/(landlord)/payments')}>
                  <Ionicons name="shield-checkmark-outline" size={14} color="#fff" />
                  <Text style={styles.verifyText}>Verify</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </GlassCard>
  );
}
