import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, ActivityIndicator, Platform, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect , router } from 'expo-router';
import { COLORS, FONT_WEIGHT } from '../../styles/theme';
import styles from '../../styles/tenant/notifications.styles';
import apiClient from '../../services/apiClient';
import { useNotification } from '../../contexts/NotificationContext';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
];

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: 'alert-circle', label: 'Critical' },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: 'warning', label: 'Warning' },
  info: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: 'information-circle', label: 'Info' },
};

const CATEGORY_ICONS = {
  budget: { name: 'wallet-outline', color: '#8b5cf6' },
  billing: { name: 'document-text-outline', color: '#3b82f6' },
  payment: { name: 'card-outline', color: '#22c55e' },
  penalty: { name: 'warning-outline', color: '#ef4444' },
  consumption: { name: 'flash-outline', color: '#f59e0b' },
  forecast: { name: 'trending-up-outline', color: '#06b6d4' },
  system: { name: 'settings-outline', color: '#64748b' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TenantNotificationCenter() {
  const { unreadCount, refreshUnreadCount } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  // Auto-refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }, [])
  );

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await apiClient.post('/api.php', { action: 'getNotifications', limit: 100 });
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (err) {
      console.warn('Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.post('/api.php', { action: 'markAllNotificationsRead' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      refreshUnreadCount();
    } catch (err) {
      console.error('Failed to mark all as read:', err.message);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.post('/api.php', { action: 'deleteAllNotifications' });
              setNotifications([]);
              refreshUnreadCount();
            } catch (err) {
              console.error('Failed to delete all notifications:', err.message);
            }
          }
        }
      ]
    );
  };

  const handleMarkRead = async (id) => {
    try {
      await apiClient.post('/api.php', { action: 'markNotificationRead', notificationId: id });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      refreshUnreadCount();
    } catch (err) {
      console.error('Failed to mark as read:', err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.post('/api.php', { action: 'deleteNotification', notificationId: id });
      setNotifications(prev => prev.filter(n => n.id !== id));
      refreshUnreadCount();
    } catch (err) {
      console.error('Failed to delete notification:', err.message);
    }
  };

  const displayList = activeFilter === 'unread' 
    ? notifications.filter(n => parseInt(n.is_read) === 0) 
    : notifications;

  const renderNotificationCard = ({ item: notif }) => {
    const isUnread = parseInt(notif.is_read) === 0;
    const catConfig = CATEGORY_ICONS[notif.category] || CATEGORY_ICONS.system;
    const sevConfig = SEVERITY_CONFIG[notif.severity] || SEVERITY_CONFIG.info;
    const timeStr = timeAgo(notif.created_at);

    // Strip common emoticons and emojis
    const cleanTitle = notif.title ? notif.title.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F900}-\u{1F9FF}\u{2B50}]/gu, '').trim() : '';
    const cleanMessage = notif.message ? notif.message.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F900}-\u{1F9FF}\u{2B50}]/gu, '').trim() : '';

    return (
      <TouchableOpacity
        style={[styles.notifCard, isUnread && styles.unreadCard]}
        onPress={() => isUnread && handleMarkRead(notif.id)}
        activeOpacity={0.8}
      >
        <View style={styles.notifTop}>
          {/* Category Icon */}
          <View style={[styles.iconBox, { backgroundColor: `${catConfig.color}15` }]}>
            <Ionicons name={catConfig.name} size={22} color={catConfig.color} />
          </View>

          {/* Content */}
          <View style={styles.notifContent}>
            <View style={styles.notifHeader}>
              <View style={styles.notifTitleContainer}>
                <Text style={[styles.notifTitle, isUnread && styles.unreadTitle]} numberOfLines={1}>{cleanTitle}</Text>
                {isUnread && <View style={styles.unreadDot} />}
              </View>
              {/* Delete button */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(notif.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-outline" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.notifMessage} numberOfLines={2} ellipsizeMode="tail">{cleanMessage}</Text>
            <View style={styles.notifMeta}>
              {/* Severity badge - Optional refinement could remove this if it's too noisy */}
              <View style={[styles.sevBadge, { backgroundColor: sevConfig.bg }]}>
                <Ionicons name={sevConfig.icon} size={10} color={sevConfig.color} />
                <Text style={[styles.sevText, { color: sevConfig.color }]} numberOfLines={1}>{sevConfig.label}</Text>
              </View>
              <Text style={styles.timeText}>{timeStr}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        width: '100%', 
        paddingHorizontal: 16, 
        paddingTop: Platform.OS === 'android' ? 12 : 8, 
        paddingBottom: 12 
      }}>
        {/* Left Area: Back Button */}
        <TouchableOpacity style={{ padding: 4, flexShrink: 0 }} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {/* Center Area: Title & Badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, paddingHorizontal: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textPrimary, flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={{ backgroundColor: COLORS.primary, borderRadius: 10, minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, marginLeft: 8, flexShrink: 0 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {/* Right Area: Actions */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={handleClearAll} disabled={notifications.length === 0} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="trash-outline" size={20} color={notifications.length === 0 ? COLORS.textMuted : '#ef4444'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleMarkAllRead} disabled={unreadCount === 0} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="checkmark-done" size={22} color={unreadCount === 0 ? COLORS.textMuted : COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* FILTER TOGGLE (All / Unread) */}
      <View style={styles.filterContainer}>
        {FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterBtn, activeFilter === filter.key && styles.filterBtnActive]}
            onPress={() => setActiveFilter(filter.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LIST */}
      <FlatList
        style={{ width: '100%' }}
        data={displayList}
        renderItem={renderNotificationCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="notifications-off-outline" size={48} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {"You're all caught up!"}
            </Text>
            <Text style={styles.emptySubtext}>
              No {activeFilter === 'unread' ? 'unread ' : ''}notifications at the moment.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
