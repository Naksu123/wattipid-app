import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Animated, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useModal } from '../../contexts/ModalContext';
import { getOverdueAccounts } from '../../services/penaltyService';
import { COLORS } from '../../styles/theme';
import styles from '../../styles/landlord/penalties.styles';

export default function PenaltyCenterScreen() {
  const { showModal } = useModal();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [analytics, setAnalytics] = useState({ totalOverdueAccounts: 0, totalActivePenalties: 0, totalOutstandingBalance: 0 });
  const [activity, setActivity] = useState([]);
  const [showAllActivity, setShowAllActivity] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  const loadData = useCallback(async () => {
    try {
      const res = await getOverdueAccounts();
      setAccounts(res.accounts || []);
      setAnalytics({
        totalOverdueAccounts: res.analytics?.totalOverdueAccounts || 0,
        totalActivePenalties: res.analytics?.totalActivePenalties || 0,
        totalOutstandingBalance: res.analytics?.totalOutstandingBalance || 0
      });
      setActivity(res.activity || []);
    } catch (err) {
      console.error(err);
      showModal({ type: 'error', title: 'Error', message: typeof err === 'string' ? err : err.message || "Failed to load overdue accounts." });
    } finally {
      setLoading(false);
    }
  }, [showModal]);

  const startAnimations = () => {
    fadeAnim.setValue(0);
    translateY.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  };

  useFocusEffect(
    useCallback(() => {
      loadData().then(startAnimations);
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getHeatmapColor = (daysOverdue) => {
    if (daysOverdue <= 3) return COLORS.warning; // Yellow
    if (daysOverdue <= 7) return '#f97316'; // Orange
    return COLORS.danger; // Red
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const avgDelay = accounts.length > 0 
    ? Math.round(accounts.reduce((sum, acc) => sum + parseInt(acc.days_overdue || 0), 0) / accounts.length) 
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >

        {/* PENALTY OVERVIEW SECTION */}
        <Animated.View style={[styles.overviewGrid, { opacity: fadeAnim, transform: [{ translateY }] }]}>
          <View style={styles.overviewHeader}>
            <Text style={styles.sectionTitle}>Penalty Overview</Text>
            {accounts.length === 0 && (
              <View style={styles.badgeSuccess}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.success} style={{ marginRight: 4 }} />
                <Text style={styles.badgeSuccessText}>All Caught Up</Text>
              </View>
            )}
          </View>
          
          <View style={styles.overviewGridContainer}>
            <View style={styles.overviewBox}>
              <Text style={styles.overviewLabel}>Total Overdue</Text>
              <Text style={styles.overviewValue}>₱{Number(analytics.totalOutstandingBalance).toFixed(2)}</Text>
            </View>
            <View style={styles.overviewBox}>
              <Text style={styles.overviewLabel}>Total Penalties</Text>
              <Text style={[styles.overviewValue, { color: COLORS.warning }]}>₱{Number(analytics.totalActivePenalties).toFixed(2)}</Text>
            </View>
            <View style={styles.overviewBox}>
              <Text style={styles.overviewLabel}>Overdue Accounts</Text>
              <Text style={styles.overviewValue}>{analytics.totalOverdueAccounts}</Text>
            </View>
            <View style={styles.overviewBox}>
              <Text style={styles.overviewLabel}>Average Delay</Text>
              <Text style={[styles.overviewValue, { color: COLORS.danger }]}>{avgDelay} {avgDelay === 1 ? 'day' : 'days'}</Text>
            </View>
          </View>
        </Animated.View>

        {/* OVERDUE ACCOUNTS SECTION */}
        <View style={styles.accountsSection}>
          <Text style={styles.sectionTitle}>Overdue Accounts</Text>
          
          <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY }] }, accounts.length === 0 && { flex: 1 }]}>
            {accounts.length === 0 ? (
              <View style={[styles.emptyState, { flex: 1, minHeight: 200 }]}>
                <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.success} style={{ marginBottom: 10 }} />
                <Text style={styles.emptyStateText}>You're all caught up</Text>
                <Text style={styles.emptyStateSubtext}>No overdue accounts or active penalties.</Text>
              </View>
            ) : (
              accounts.map((acc, index) => {
                const heatmapColor = getHeatmapColor(acc.days_overdue);
                const roomDisplayName = String(acc.room_id).toLowerCase().includes('room') ? acc.room_id : `Room ${acc.room_id}`;
                
                return (
                  <View key={acc.id} style={styles.compactAccountCard}>
                    <View style={styles.compactCardHeader}>
                      <View>
                        <Text style={styles.roomText}>{roomDisplayName}</Text>
                        <Text style={styles.tenantText}>{acc.tenant_name || 'Unknown Tenant'}</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: `${heatmapColor}15`, borderColor: `${heatmapColor}30` }]}>
                        <Text style={[styles.badgeText, { color: heatmapColor }]}>{acc.days_overdue} Days Late</Text>
                      </View>
                    </View>
                    
                    <View style={styles.compactFinContainer}>
                      <View style={styles.compactFinCol}>
                        <Text style={styles.compactFinLabel}>Original Balance</Text>
                        <Text style={styles.compactFinValue}>₱{Number(acc.original_balance).toFixed(2)}</Text>
                      </View>
                      <View style={styles.compactFinCol}>
                        <Text style={[styles.compactFinLabel, { color: COLORS.warning }]}>Penalty Added</Text>
                        <Text style={[styles.compactFinValue, { color: COLORS.warning }]}>₱{Number(acc.penalty_amount).toFixed(2)}</Text>
                      </View>
                      <View style={[styles.compactFinCol, { alignItems: 'flex-end' }]}>
                        <Text style={styles.compactFinTotalLabel}>Total Due</Text>
                        <Text style={styles.compactFinTotalValue}>₱{Number(acc.total_amount_due).toFixed(2)}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </Animated.View>
        </View>

        {/* RECENT ACTIVITY SECTION */}
        <Animated.View style={[styles.activitySection, { opacity: fadeAnim, transform: [{ translateY }] }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Penalty Activity</Text>
            {activity.length > 5 && (
              <TouchableOpacity onPress={() => setShowAllActivity(true)} style={styles.headerMoreBtn}>
                <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.activityCard}>
            {activity.length === 0 ? (
              <View style={styles.emptyActivity}>
                <Text style={styles.emptyActivityText}>No recent penalty activity.</Text>
              </View>
            ) : (
              activity.slice(0, 5).map((act, idx) => {
                const roomDisplayName = String(act.room_id).toLowerCase().includes('room') ? act.room_id : `Room ${act.room_id}`;
                return (
                  <View key={act.id} style={styles.activityRow}>
                    <View style={styles.timelineDot} />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>Penalty Applied</Text>
                      <Text style={styles.activityDesc}>{roomDisplayName} · {act.tenant_name || 'Tenant'} · {act.days_overdue} days overdue</Text>
                    </View>
                    <Text style={styles.activityAmount}>₱{Number(act.penalty_amount).toFixed(2)}</Text>
                  </View>
                );
              })
            )}
          </View>
        </Animated.View>

      </ScrollView>

      {/* ALL ACTIVITY MODAL */}
      <Modal
        visible={showAllActivity}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAllActivity(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Penalty Activity</Text>
              <TouchableOpacity onPress={() => setShowAllActivity(false)} style={styles.closeModalBtn}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
              {activity.map((act, idx) => {
                const roomDisplayName = String(act.room_id).toLowerCase().includes('room') ? act.room_id : `Room ${act.room_id}`;
                return (
                  <View key={act.id} style={styles.activityRow}>
                    <View style={styles.timelineDot} />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>Penalty Applied</Text>
                      <Text style={styles.activityDesc}>{roomDisplayName} · {act.tenant_name || 'Tenant'} · {act.days_overdue} days overdue</Text>
                    </View>
                    <Text style={styles.activityAmount}>₱{Number(act.penalty_amount).toFixed(2)}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


