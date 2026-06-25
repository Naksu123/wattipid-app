import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, ActivityIndicator, TextInput, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { COLORS, SPACING, RADIUS, FONT_WEIGHT } from '@/styles/theme';
import apiClient from '../../services/apiClient';
import { router } from 'expo-router';
import { useNotification } from '../../contexts/NotificationContext';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: 'notifications-outline' },
  { key: 'budget', label: 'Budget', icon: 'wallet-outline' },
  { key: 'billing', label: 'Billing', icon: 'document-text-outline' },
  { key: 'payment', label: 'Payment', icon: 'card-outline' },
  { key: 'penalty', label: 'Penalty', icon: 'warning-outline' },
  { key: 'consumption', label: 'Usage', icon: 'flash-outline' },
  { key: 'system', label: 'System', icon: 'settings-outline' },
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
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchTimer, setSearchTimer] = useState(null);

  // Auto-refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }, [activeCategory])
  );

  const fetchNotifications = async () => {
    try {
      const action = activeCategory === 'all' ? 'getNotifications' : 'getNotificationsByCategory';
      const payload = activeCategory === 'all'
        ? { action, limit: 50 }
        : { action, category: activeCategory, limit: 50 };
      
      const response = await apiClient.post('/api.php', payload);
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (searchTimer) clearTimeout(searchTimer);

    if (text.length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await apiClient.post('/api.php', {
          action: 'searchNotifications',
          query: text,
          limit: 20,
        });
        if (response.data.success) {
          setSearchResults(response.data.data || []);
        }
      } catch (err) {
        console.warn('Search failed:', err.message);
      }
    }, 400);
    setSearchTimer(timer);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setSearchQuery('');
    setSearchResults(null);
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

  const handleMarkRead = async (id) => {
    try {
      await apiClient.post('/api.php', { action: 'markNotificationRead', notificationId: id });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      if (searchResults) {
        setSearchResults(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      }
      refreshUnreadCount();
    } catch (err) {
      console.error('Failed to mark as read:', err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.post('/api.php', { action: 'deleteNotification', notificationId: id });
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (searchResults) {
        setSearchResults(prev => prev.filter(n => n.id !== id));
      }
      refreshUnreadCount();
    } catch (err) {
      console.error('Failed to delete notification:', err.message);
    }
  };
  const unreadCountLocal = notifications.filter(n => parseInt(n.is_read) === 0).length;
  const displayList = searchResults !== null ? searchResults : notifications;

  const renderNotificationCard = (notif) => {
    const isUnread = parseInt(notif.is_read) === 0;
    const catConfig = CATEGORY_ICONS[notif.category] || CATEGORY_ICONS.system;
    const sevConfig = SEVERITY_CONFIG[notif.severity] || SEVERITY_CONFIG.info;
    const timeStr = timeAgo(notif.created_at);

    return (
      <TouchableOpacity
        key={notif.id}
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
              <Text style={[styles.notifTitle, isUnread && styles.unreadTitle]} numberOfLines={1}>{notif.title}</Text>
              {isUnread && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
            <View style={styles.notifMeta}>
              {/* Severity badge */}
              <View style={[styles.sevBadge, { backgroundColor: sevConfig.bg }]}>
                <Ionicons name={sevConfig.icon} size={10} color={sevConfig.color} />
                <Text style={[styles.sevText, { color: sevConfig.color }]}>{sevConfig.label}</Text>
              </View>
              <Text style={styles.timeText}>{timeStr}</Text>
            </View>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleMarkAllRead} disabled={unreadCount === 0}>
          <Text style={[styles.markAllText, unreadCount === 0 && { opacity: 0.4 }]}>Read all</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search notifications..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults(null); }}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContainer}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.tab, activeCategory === cat.key && styles.tabActive]}
            onPress={() => { setActiveCategory(cat.key); setSearchQuery(''); setSearchResults(null); setLoading(true); }}
            activeOpacity={0.7}
          >
            <Ionicons name={cat.icon} size={14} color={activeCategory === cat.key ? '#fff' : COLORS.textMuted} />
            <Text style={[styles.tabText, activeCategory === cat.key && styles.tabTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Notification List */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        {searchResults !== null && (
          <Text style={styles.searchResultLabel}>
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
          </Text>
        )}

        {displayList.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="notifications-off-outline" size={48} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchResults !== null ? 'No results found' : 'You\'re all caught up!'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchResults !== null
                ? 'Try a different search term.'
                : `No ${activeCategory !== 'all' ? activeCategory : ''} notifications at the moment.`
              }
            </Text>
          </View>
        ) : (
          displayList.map(renderNotificationCard)
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.textMuted, marginTop: 12, fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingTop: Platform.OS === 'android' ? 16 : SPACING.md, paddingBottom: 12,
  },
  backBtn: { padding: 8, backgroundColor: COLORS.surface, borderRadius: 12 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: FONT_WEIGHT.heavy, color: COLORS.textPrimary },
  headerBadge: { backgroundColor: COLORS.primary, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  headerBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  markAllText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: SPACING.lg, marginBottom: 12,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    paddingHorizontal: 14, height: 44,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14 },

  // Tabs
  tabScroll: { maxHeight: 44, marginBottom: 8 },
  tabContainer: { paddingHorizontal: SPACING.lg, gap: 8 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: COLORS.surface, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: '#fff' },

  // List
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: 4 },
  searchResultLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 12, fontStyle: 'italic' },

  // Notification Card
  notifCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  unreadCard: {
    backgroundColor: 'rgba(34,197,94,0.04)',
    borderColor: 'rgba(34,197,94,0.15)',
  },
  notifTop: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  unreadTitle: { fontWeight: '800' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  notifMessage: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, marginBottom: 8 },
  notifMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sevBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  sevText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  timeText: { fontSize: 11, color: COLORS.textMuted },
  deleteBtn: { padding: 4, marginLeft: 4 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyTitle: { fontSize: 17, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginBottom: 6 },
  emptySubtext: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});
