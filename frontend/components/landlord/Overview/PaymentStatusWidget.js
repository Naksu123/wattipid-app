import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import GlassCard from '../../ui/GlassCard';
import { COLORS } from '@/styles/theme';
import styles from '../../../styles/components/landlord/Overview/PaymentStatusWidget.styles';

export default function PaymentStatusWidget({ summary }) {
  const total = parseInt(summary?.total) || 0;
  const pending = parseInt(summary?.pending) || 0;
  const verified = parseInt(summary?.verified) || 0;
  const collectedAmt = parseFloat(summary?.collectedAmount) || 0;
  const outstandingAmt = parseFloat(summary?.outstandingAmount) || 0;

  const verifiedPct = total > 0 ? (verified / total) * 100 : 0;
  const pendingPct = total > 0 ? (pending / total) * 100 : 0;

  const verifiedAnim = useRef(new Animated.Value(0)).current;
  const pendingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(verifiedAnim, {
      toValue: verifiedPct,
      duration: 1000,
      useNativeDriver: false,
    }).start();
    
    Animated.timing(pendingAnim, {
      toValue: pendingPct,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [verifiedPct, pendingPct]);

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.title}>Billing Collection Status</Text>
      
      {total === 0 ? (
        <Text style={styles.empty}>No billing cycles recorded yet.</Text>
      ) : (
        <View style={styles.container}>
          {/* Multi-color Progress Bar */}
          <View style={styles.barContainer}>
            <Animated.View style={[styles.barSegment, { 
                width: verifiedAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), 
                backgroundColor: COLORS.success, 
                borderTopLeftRadius: 6, 
                borderBottomLeftRadius: 6 
            }]} />
            <Animated.View style={[styles.barSegment, { 
                width: pendingAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), 
                backgroundColor: COLORS.warning, 
                borderTopRightRadius: 6, 
                borderBottomRightRadius: 6 
            }]} />
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


