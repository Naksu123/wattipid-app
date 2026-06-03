import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { getOverdueAccounts, triggerPenaltyCalculation } from '../../services/penaltyService';
import StatCard from '../../components/landlord/Overview/StatCard';
import { COLORS } from '@/styles/theme';

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

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="paper-plane-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.actionText}>Remind</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  calcButton: { backgroundColor: COLORS.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyStateText: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 4 },
  emptyStateSubtext: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
  accountCard: { backgroundColor: 'rgba(30,41,59,0.5)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  roomText: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  tenantText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  badge: { backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: COLORS.danger },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 },
  finRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  finLabel: { fontSize: 14, color: COLORS.textSecondary },
  finValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  finRowTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  finTotalLabel: { fontSize: 15, fontWeight: 'bold', color: COLORS.textPrimary },
  finTotalValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.danger },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(14,165,233,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  actionText: { fontSize: 13, fontWeight: '600', color: COLORS.primary }
});
