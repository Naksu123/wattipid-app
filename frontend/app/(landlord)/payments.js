import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLiveOverview } from '../../services/database';
import { getPaymentHistory } from '../../services/paymentService';
import { COLORS, SPACING, FONT_WEIGHT, RADIUS } from '@/styles/theme';

import PaymentStatusWidget from '../../components/landlord/Overview/PaymentStatusWidget';
import PendingPaymentsWidget from '../../components/landlord/Overview/PendingPaymentsWidget';
import RecentTransactionsWidget from '../../components/landlord/Overview/RecentTransactionsWidget';

export default function PaymentsDashboard() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Initial Load
  useEffect(() => {
    loadData();
  }, []);

  // Smart Sync: 5-Second Short Polling for Real-Time Dashboard
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [overviewResult, historyResult] = await Promise.all([
          getLiveOverview(),
          getPaymentHistory()
        ]);
        if (overviewResult) setData(overviewResult);
        if (historyResult) setHistory(historyResult);
      } catch (err) {
        // Suppress network errors on background poll
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [overviewResult, historyResult] = await Promise.all([
        getLiveOverview(),
        getPaymentHistory()
      ]);
      if (overviewResult) setData(overviewResult);
      if (historyResult) setHistory(historyResult);
    } catch (err) {
      console.error('[loadPaymentsData] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textMuted, marginTop: 12 }}>Syncing Finances...</Text>
      </View>
    );
  }

  const paymentSummary = data?.paymentSummary || null;
  const pendingPayments = data?.pendingPayments || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Payment Gateway</Text>
          <Text style={styles.subtitle}>Manage collections and verifications</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="wallet-outline" size={28} color={COLORS.primary} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        {/* Payment Tracking (Collection Rate) */}
        <PaymentStatusWidget summary={paymentSummary} />

        <View style={{ height: 16 }} />

        {/* Pending Verification Approvals */}
        <PendingPaymentsWidget payments={pendingPayments} onRefresh={loadData} />

        <View style={{ height: 16 }} />

        {/* Payment Ledger (Recent Transactions) */}
        <RecentTransactionsWidget history={history} />

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: FONT_WEIGHT.heavy,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: SPACING.lg,
  }
});
