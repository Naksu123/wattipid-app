import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { getOverdueAccounts, triggerPenaltyCalculation } from '../../services/penaltyService';
import StatCard from '../../components/landlord/Overview/StatCard';
import { COLORS } from '../../styles/theme';
import styles from '../../styles/landlord/penalties.styles';

export default function PenaltyCenterScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [analytics, setAnalytics] = useState({ totalOverdueAccounts: 0, totalActivePenalties: 0 });
  const [calculating, setCalculating] = useState(false);

  const loadData = async () => {
    try {
      const res = await getOverdueAccounts();
      setAccounts(res.accounts || []);
      setAnalytics({
        totalOverdueAccounts: res.analytics?.totalOverdueAccounts || 0,
        totalActivePenalties: res.analytics?.totalActivePenalties || 0
      });
    } catch (err) {
      console.error(err);
      Alert.alert("Error", typeof err === 'string' ? err : err.message || "Failed to load overdue accounts.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRunCalculation = async () => {
    setCalculating(true);
    try {
      const res = await triggerPenaltyCalculation();
      Alert.alert("Calculation Complete", res.message);
      await loadData();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to run calculation");
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Overdue Center</Text>
            <Text style={styles.subtitle}>Manage late payments and active penalties</Text>
          </View>
          <TouchableOpacity 
            style={[styles.calcButton, calculating && { opacity: 0.7 }]} 
            onPress={handleRunCalculation}
            disabled={calculating}
          >
            {calculating ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="calculator-outline" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          <StatCard title="Overdue Accounts" value={analytics.totalOverdueAccounts} icon="warning-outline" color={COLORS.danger} />
          <StatCard title="Active Penalties" value={Number(analytics.totalActivePenalties).toFixed(2)} prefix="₱" icon="alert-circle-outline" color="#f97316" />
        </View>

        <Text style={styles.sectionTitle}>Overdue Accounts</Text>
        
        {accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.success} style={{ marginBottom: 10 }} />
            <Text style={styles.emptyStateText}>No overdue accounts found!</Text>
            <Text style={styles.emptyStateSubtext}>All your tenants are up to date with their payments.</Text>
          </View>
        ) : (
          accounts.map(acc => (
            <View key={acc.id} style={styles.accountCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.roomText}>Room {acc.room_id}</Text>
                  <Text style={styles.tenantText}>{acc.tenant_name || 'Unknown Tenant'}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{acc.days_overdue} Days Late</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Original Balance:</Text>
                <Text style={styles.finValue}>₱{Number(acc.original_balance).toFixed(2)}</Text>
              </View>
              <View style={styles.finRow}>
                <Text style={[styles.finLabel, { color: COLORS.danger }]}>Penalty Added:</Text>
                <Text style={[styles.finValue, { color: COLORS.danger }]}>₱{Number(acc.penalty_amount).toFixed(2)}</Text>
              </View>
              <View style={styles.finRowTotal}>
                <Text style={styles.finTotalLabel}>Total Due:</Text>
                <Text style={styles.finTotalValue}>₱{Number(acc.total_amount_due).toFixed(2)}</Text>
              </View>


            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}


