import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getLiveOverview } from '../../services/database';
import { getPaymentHistory } from '../../services/paymentService';
import { useSync } from '../../contexts/SyncContext';
import { COLORS } from '../../styles/theme';
import styles from '../../styles/landlord/payments.styles';

import PaymentStatusWidget from '../../components/landlord/Overview/PaymentStatusWidget';
import PendingPaymentsWidget from '../../components/landlord/Overview/PendingPaymentsWidget';
import RecentTransactionsWidget from '../../components/landlord/Overview/RecentTransactionsWidget';
import UnpaidTenantsWidget from '../../components/landlord/Overview/UnpaidTenantsWidget';
import PaymentHistoryModal from '../../components/landlord/Overview/PaymentHistoryModal';

export default function PaymentsDashboard() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const router = useRouter();

  const { landlordSyncData } = useSync();

  // Initial Load
  useEffect(() => {
    loadData();
  }, []);

  // Smart Sync: Hook into global real-time stream instead of unoptimized polling
  useEffect(() => {
    if (landlordSyncData && landlordSyncData.liveOverview) {
      setData(landlordSyncData.liveOverview);
    }
  }, [landlordSyncData]);

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Syncing Finances...</Text>
      </View>
    );
  }

  const paymentSummary = data?.paymentSummary || null;
  const pendingPayments = data?.pendingPayments || [];
  const unpaidBills = data?.unpaidBills || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      


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

        {/* Pending Collections / Unpaid Tenants */}
        <UnpaidTenantsWidget unpaidBills={unpaidBills} />

        <View style={{ height: 16 }} />

        {/* Payment Ledger (Recent Transactions) */}
        <RecentTransactionsWidget history={history} onViewAll={() => setHistoryModalVisible(true)} />

        <View style={{ height: 100 }} />
      </ScrollView>

      <PaymentHistoryModal 
        visible={historyModalVisible} 
        onClose={() => setHistoryModalVisible(false)} 
        history={history} 
      />

      <TouchableOpacity 
        style={styles.floatingSettingsBtn} 
        onPress={() => router.push('/(landlord)/payment-settings')}
        activeOpacity={0.8}
      >
        <Ionicons name="options" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}


