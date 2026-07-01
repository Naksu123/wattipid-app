import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, SafeAreaView, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getLiveOverview } from '../../services/database';
import apiClient from '../../services/apiClient';
import { COLORS } from '../../styles/theme';
import styles from '../../styles/landlord/overview.styles';

import StatCard from '../../components/landlord/Overview/StatCard';
import LiveConsumptionWidget from '../../components/landlord/Overview/LiveConsumptionWidget';
import ActivityTimelineWidget from '../../components/landlord/Overview/ActivityTimelineWidget';

export default function OverviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initial Load
  useEffect(() => {
    loadLiveOverview();
  }, []);

  // Smart Sync: 5-Second Short Polling for Real-Time Dashboard
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await getLiveOverview();
        if (result) {
          setData(result);
        }
        
        // Also fetch unread count
        const unreadRes = await apiClient.post('/api.php', { 
          action: 'getUnreadNotificationCount',
          userId: user?.id,
          role: user?.role
        });
        if (unreadRes.data.success) {
          setUnreadCount(unreadRes.data.data);
        }
      } catch (err) {
        // Suppress network errors on background poll
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadLiveOverview = async () => {
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
  };

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
  const recentActivities = data?.recentActivities || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Admin'} 👋</Text>
          <Text style={styles.subtitle}>Real-Time Command Center</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(landlord)/notifications')}>
            <Ionicons name="notifications-outline" size={26} color={COLORS.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(landlord)/settings')}>
            <View style={styles.profileIconWrapper}>
              <Ionicons name="person-circle-outline" size={32} color={COLORS.primary} />
            </View>
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
        <Text style={styles.sectionTitle}>System Analytics</Text>
        <View style={styles.gridRow}>
          <StatCard title="Total Tenants" value={statistics.totalTenants || 0} icon="person-outline" color="#8b5cf6" />
          <StatCard title="Total Collection" value={statistics.monthlyRevenue?.toFixed(2) || '0.00'} prefix="₱" icon="checkmark-circle-outline" color="#22c55e" />
        </View>
        <View style={styles.gridRow}>
          <StatCard title="Outstanding Balance" value={statistics.outstandingRevenue?.toFixed(2) || '0.00'} prefix="₱" icon="time-outline" color="#f97316" />
          <StatCard title="Total Revenue" value={statistics.totalBilled?.toFixed(2) || '0.00'} prefix="₱" icon="cash-outline" color={COLORS.primary} />
        </View>

        <View style={{ height: 24 }} />

        {/* Live Activity Feed */}
        <ActivityTimelineWidget activities={recentActivities} />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


