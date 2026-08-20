import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useSync } from '../../contexts/SyncContext';
import { getLiveOverview } from '../../services/database';
import apiClient from '../../services/apiClient';
import { COLORS } from '../../styles/theme';
import styles from '../../styles/landlord/overview.styles';

import SystemAnalyticsWidget from '../../components/landlord/Overview/SystemAnalyticsWidget';
import LiveConsumptionWidget from '../../components/landlord/Overview/LiveConsumptionWidget';

export default function OverviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { landlordSyncData, unreadCount, setUnreadCount } = useSync();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Initial Load
  useEffect(() => {
    loadLiveOverview();
  }, [loadLiveOverview]);

  // Smart Sync: Hook into global real-time stream
  useEffect(() => {
    if (landlordSyncData && landlordSyncData.liveOverview) {
      // Data arrives effortlessly via backend sync stream
      setData(landlordSyncData.liveOverview);
    }
  }, [landlordSyncData]);

  const loadLiveOverview = useCallback(async () => {
    try {
      const result = await getLiveOverview();
      if (result) {
        setData(result);
      }
      
      try {
        const unreadRes = await apiClient.post('/api.php', { 
          action: 'getUnreadNotificationCount', 
          userId: user?.id,
          role: user?.role
        });
        if (unreadRes.data.success) {
          setUnreadCount(unreadRes.data.data);
        }
      } catch (unreadErr) {
        console.warn('Failed to load unread count:', unreadErr.message);
      }
    } catch (err) {
      console.error('[loadLiveOverview] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLiveOverview();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Syncing Live Dashboard...</Text>
      </View>
    );
  }

  const statistics = data?.statistics || {};
  const liveElectricity = data?.liveElectricity || { todayEnergyKwh: 0, livePeakPowerW: 0 };

  const pendingPayments = data?.pendingPayments || [];
  const unpaidBills = data?.unpaidBills || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Admin'} </Text>
          <Text style={styles.subtitle}>Real-Time Monitoring Dashboard</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(landlord)/notifications')}>
            <Ionicons name="notifications-outline" size={26} color={COLORS.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >

        {/* Live Consumption Monitor */}
        <LiveConsumptionWidget 
          todayEnergyKwh={liveElectricity.todayEnergyKwh} 
          livePeakPowerW={liveElectricity.livePeakPowerW} 
        />

        {/* System Analytics Section */}
        <SystemAnalyticsWidget statistics={statistics} />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


