import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getNotificationHistory, markNotificationRead, 
  markAllNotificationsRead, deleteNotification, getUnreadNotificationCount 
} from '../../services/notificationApi';
import NotificationCard from '../../components/ui/NotificationCard';
import GlassCard from '../../components/ui/GlassCard';
import AlertModal from '../../components/modals/AlertModal';
import { COLORS, SPACING, RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '@/styles/theme';

const FILTERS = [
  { key: null, label: 'All', icon: 'list' },
  { key: 'budget', label: 'Budget', icon: 'wallet' },
  { key: 'consumption', label: 'Usage', icon: 'flash' },

  { key: 'system', label: 'System', icon: 'settings' },
];

export default function NotificationsScreen() {
  const { user, isAuthenticated } = useAuth();
  const isFocused = useIsFocused();
  const { refresh } = useLocalSearchParams();
  const listRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 30;

  const fetchNotifications = useCallback(async (reset = false) => {
    try {
      const newOffset = reset ? 0 : offset;
      const data = await getNotificationHistory(activeFilter, LIMIT, newOffset);
      
      if (reset) {
        setNotifications(data);
        setOffset(LIMIT);
      } else {
        setNotifications(prev => [...prev, ...data]);
        setOffset(prev => prev + LIMIT);
      }
      setHasMore(data.length === LIMIT);

      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, offset]);

  useEffect(() => {
    if (isFocused && isAuthenticated) {
      setLoading(true);
      fetchNotifications(true);
    }
  }, [isFocused, isAuthenticated, activeFilter]);

  // Handle repeated bell clicks
  useEffect(() => {
    if (refresh && isFocused) {
      setRefreshing(true);
      fetchNotifications(true);
      if (listRef.current) {
        listRef.current.scrollToOffset({ offset: 0, animated: true });
      }
    }
  }, [refresh]);

  // Poll for new notifications every 30 seconds when screen is focused
  useEffect(() => {
    if (!isFocused || !isAuthenticated) return;
    const interval = setInterval(async () => {
      try {
        const count = await getUnreadNotificationCount();
        if (count !== unreadCount) {
          setUnreadCount(count);
          fetchNotifications(true);
        }
      } catch (e) {}
    }, 30000);
    return () => clearInterval(interval);
  }, [isFocused, isAuthenticated, unreadCount]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  const handlePress = async (notif) => {
    if (!notif.is_read) {
      await markNotificationRead(notif.id);
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setSelectedNotif(notif);
    setDetailVisible(true);
  };

  const handleDelete = async (notif) => {
    await deleteNotification(notif.id);
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    if (!notif.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="notifications-off-outline" size={64} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyText}>
        {activeFilter 
          ? `No ${activeFilter} alerts yet. Adjust your filters or check back later.`
          : 'Your notification center is clean! Alerts will appear here when the system detects unusual electricity usage.'}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Filter chips */}
      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.key || 'all'}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === item.key && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter(item.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={item.icon}
              size={14}
              color={activeFilter === item.key ? COLORS.background : COLORS.textSecondary}
            />
            <Text style={[
              styles.filterLabel,
              activeFilter === item.key && styles.filterLabelActive,
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up ✓'}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Ionicons name="checkmark-done" size={16} color={COLORS.primary} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  const router = require('expo-router').useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.screenHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push('/(tenant)/dashboard');
              }
            }} 
            style={{ padding: 4 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.screenTitle}>Notifications</Text>
            <Text style={styles.screenSubtitle}>Smart electricity alerts</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.headerRight}
          activeOpacity={0.7}
          onPress={() => {
            setRefreshing(true);
            fetchNotifications(true);
            if (listRef.current) {
              listRef.current.scrollToOffset({ offset: 0, animated: true });
            }
          }}
        >
          {unreadCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{unreadCount}</Text>
            </View>
          )}
          <Ionicons name="notifications" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={notifications}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onPress={handlePress}
            onDelete={handleDelete}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        onEndReached={() => {
          if (hasMore && !loading) fetchNotifications(false);
        }}
        onEndReachedThreshold={0.3}
      />

      {/* Notification detail modal */}
      <AlertModal
        visible={detailVisible}
        type={selectedNotif?.severity === 'critical' ? 'danger' : selectedNotif?.severity === 'warning' ? 'warning' : 'info'}
        title={selectedNotif?.title?.replace(/^[^\w\s]+ /, '') || 'Alert Details'}
        message={selectedNotif?.message || ''}
        customTip={selectedNotif?.data_json ? (() => {
          try {
            const d = typeof selectedNotif.data_json === 'string' 
              ? JSON.parse(selectedNotif.data_json) 
              : selectedNotif.data_json;
            if (d.dailyPct) return `You are at ${d.dailyPct}% of your daily budget.`;
            if (d.abovePct) return `Today's usage is ${d.abovePct}% above your 7-day average.`;
            if (d.currentPower) return `Current power draw: ${d.currentPower}W`;
            if (d.projected_monthly_cost) return `Projected bill: ₱${Number(d.projected_monthly_cost).toFixed(2)}`;
            return null;
          } catch { return null; }
        })() : null}
        onAcknowledge={() => setDetailVisible(false)}
        showTip
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
  },

  // Screen header
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl + SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
  },
  screenTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  screenSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  countBadge: {
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
  },

  // Filter chips
  headerSection: {
    marginBottom: SPACING.md,
  },
  filterList: {
    paddingHorizontal: SPACING.xs,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
  },
  filterLabelActive: {
    color: COLORS.background,
  },

  // Summary bar
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  summaryText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },

  // List
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl * 2,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconWrap: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: 100,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
