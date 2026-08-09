import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Platform, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect , router } from 'expo-router';
import { COLORS, FONT_WEIGHT } from '../../styles/theme';
import styles from '../../styles/tenant/notifications.styles';
import apiClient from '../../services/apiClient';
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
    }, [activeCategory, fetchNotifications])
  );

  const fetchNotifications = useCallback(async () => {
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
      console.warn('Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCategory]);

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

  const renderNotificationCard = ({ item: notif }) => {
    const isUnread = parseInt(notif.is_read) === 0;
    const catConfig = CATEGORY_ICONS[notif.category] || CATEGORY_ICONS.system;
    const sevConfig = SEVERITY_CONFIG[notif.severity] || SEVERITY_CONFIG.info;
    const timeStr = timeAgo(notif.created_at);

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
                <Text style={[styles.notifTitle, isUnread && styles.unreadTitle]} numberOfLines={1}>{notif.title}</Text>
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
            <Text style={styles.notifMessage} numberOfLines={2} ellipsizeMode="tail">{notif.message}</Text>
            <View style={styles.notifMeta}>
              {/* Severity badge */}
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
      {/* REBUILT RESPONSIVE HEADER */}
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
          <Text style={{ fontSize: 22, fontWeight: FONT_WEIGHT.heavy, color: COLORS.textPrimary, flexShrink: 1 }} numberOfLines={1} ellipsizeMode="tail">
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={{ backgroundColor: COLORS.primary, borderRadius: 10, minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, marginLeft: 8, flexShrink: 0 }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {/* Right Area: Action */}
        <TouchableOpacity style={{ flexShrink: 0, padding: 4 }} onPress={handleMarkAllRead} disabled={unreadCount === 0}>
          <Text style={{ color: COLORS.primary, fontWeight: '600', fontSize: 14, opacity: unreadCount === 0 ? 0.4 : 1 }}>
            Read all
          </Text>
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

      {/* REBUILT CATEGORY FILTER */}
      <View style={{ width: '100%', overflow: 'hidden' }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={{ width: '100%', flexGrow: 0, marginBottom: 12 }} 
          contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}
        >
          {CATEGORIES.map((cat, index) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.tab, 
                activeCategory === cat.key && styles.tabActive,
                { marginRight: index === CATEGORIES.length - 1 ? 0 : 8 }
              ]}
              onPress={() => { setActiveCategory(cat.key); setSearchQuery(''); setSearchResults(null); setLoading(true); }}
              activeOpacity={0.7}
            >
              <Ionicons name={cat.icon} size={14} color={activeCategory === cat.key ? '#fff' : COLORS.textMuted} />
              <Text style={[styles.tabText, activeCategory === cat.key && styles.tabTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notification List */}
      {searchResults !== null && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <Text style={styles.searchResultLabel}>
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
          </Text>
        </View>
      )}

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
              {searchResults !== null ? 'No results found' : 'You\'re all caught up!'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchResults !== null
                ? 'Try a different search term.'
                : `No ${activeCategory !== 'all' ? activeCategory : ''} notifications at the moment.`
              }
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}


