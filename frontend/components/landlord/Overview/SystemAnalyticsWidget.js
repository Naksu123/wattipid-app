import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../ui/GlassCard';
import { COLORS } from '@/styles/theme';
import styles from '../../../styles/components/landlord/Overview/SystemAnalyticsWidget.styles';

export default function SystemAnalyticsWidget({ statistics = {} }) {
  const tenants = statistics.totalTenants || 0;
  const collection = statistics.monthlyRevenue || 0;
  const outstanding = statistics.outstandingRevenue || 0;
  const revenue = statistics.totalBilled || 0;

  return (
    <GlassCard style={styles.card}>
      {/* Hero Section: Total Revenue */}
      <View style={styles.heroSection}>
        <View style={styles.heroHeader}>
          <View style={[styles.heroIconWrap, { backgroundColor: `${COLORS.primary}15` }]}>
            <Ionicons name="cash-outline" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>Total Revenue</Text>
        </View>
        <Text style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
          <Text style={styles.heroPrefix}>₱ </Text>
          {revenue.toFixed(2)}
        </Text>
      </View>

      {/* Secondary Metrics Row */}
      <View style={styles.secondaryRow}>
        <View style={styles.secondaryBlock}>
          <Text style={styles.secondaryTitle} numberOfLines={1}>Tenants</Text>
          <Text style={[styles.secondaryValue, { color: COLORS.info }]} numberOfLines={1} adjustsFontSizeToFit>{tenants}</Text>
        </View>

        <View style={styles.secondaryBlock}>
          <Text style={styles.secondaryTitle} numberOfLines={1}>Collected</Text>
          <Text style={[styles.secondaryValue, { color: COLORS.success }]} numberOfLines={1} adjustsFontSizeToFit>
            <Text style={styles.secondaryPrefix}>₱</Text>{collection.toFixed(2)}
          </Text>
        </View>

        <View style={styles.secondaryBlock}>
          <Text style={styles.secondaryTitle} numberOfLines={1}>Outstanding</Text>
          <Text style={[styles.secondaryValue, { color: COLORS.accent }]} numberOfLines={1} adjustsFontSizeToFit>
            <Text style={styles.secondaryPrefix}>₱</Text>{outstanding.toFixed(2)}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}
