import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, SafeAreaView, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { getLiveOverview } from '../../services/database';
import apiClient from '../../services/apiClient';
import { COLORS, SPACING, FONT_WEIGHT, RADIUS } from '@/styles/theme';

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
        const unreadRes = await apiClient.post('/api.php', { action: 'getUnreadCount' });
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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textMuted, marginTop: 12 }}>Syncing Live Dashboard...</Text>
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
    paddingTop: Platform.OS === 'android' ? 20 : SPACING.lg,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: FONT_WEIGHT.heavy,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  profileBtn: {
    marginLeft: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.background,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  profileIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.1)', // Primary tint
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  totalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 12,
  },
  totalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: FONT_WEIGHT.heavy,
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: FONT_WEIGHT.bold,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  }
});
