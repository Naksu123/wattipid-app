import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Animated, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/theme';
import styles from '../../styles/landlord/notifications.styles';
import GlassCard from '../../components/ui/GlassCard';
import apiClient from '../../services/apiClient';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const renderIcon = (type) => {
  switch (type) {
    case 'payment':
    case 'payment_submitted':
    case 'payment_verified':
    case 'payment_rejected':
      return { name: 'cash-outline', color: COLORS.success };
    case 'penalty': return { name: 'warning-outline', color: COLORS.danger };
    case 'room': return { name: 'home-outline', color: COLORS.primary };
    case 'system': return { name: 'server-outline', color: COLORS.secondary };
    default: return { name: 'notifications-outline', color: COLORS.primary };
  }
};

const NotificationItem = ({ notif, onPress, onDelete }) => {
  const isUnread = parseInt(notif.is_read) === 0;
  const { name, color } = renderIcon(notif.category || notif.type || 'system');
  const dateStr = new Date(notif.created_at).toLocaleString();

  // Strip common emoticons and emojis
  const cleanTitle = notif.title ? notif.title.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F900}-\u{1F9FF}\u{2B50}]/gu, '').trim() : '';
  const cleanMessage = notif.message ? notif.message.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F900}-\u{1F9FF}\u{2B50}]/gu, '').trim() : '';

  // Animation
  const scale = React.useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.timing(scale, { toValue: 0.96, duration: 100, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => onPress(notif)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <GlassCard style={[styles.notifCard, isUnread && styles.unreadCard]}>
          <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
            <Ionicons name={name} size={24} color={color} />
          </View>
          <View style={styles.content}>
            <Text style={[styles.title, isUnread && styles.unreadText]}>{cleanTitle}</Text>
            <Text style={styles.message}>{cleanMessage}</Text>
            <Text style={styles.date}>{dateStr}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => onDelete(notif.id)} 
            style={{ padding: 8, marginLeft: 8 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
          {isUnread && <View style={styles.unreadDot} />}
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
};

export default function NotificationCenter() {
  const { user } = useAuth();
  const { refreshUnreadCount } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Instant Cache Restoration (Stale-While-Revalidate)
  useEffect(() => {
    let isMounted = true;
    const restoreCached = async () => {
      try {
        const cached = await AsyncStorage.getItem('@cached_landlord_notifications');
        if (cached && isMounted) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setNotifications(parsed);
            setLoading(false);
          }
        }
      } catch (err) {
        console.warn('[LandlordNotifications] Cache restore error:', err);
      }
    };
    restoreCached();
    return () => { isMounted = false; };
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      setError(null);
      const response = await apiClient.post('/api.php', { 
        action: 'getNotifications', 
        limit: 50,
        userId: user?.id,
        role: user?.role
      });
      if (response.data.success) {
        const list = response.data.data || [];
        setNotifications(list);
        AsyncStorage.setItem('@cached_landlord_notifications', JSON.stringify(list)).catch(() => {});
      } else {
        setNotifications(prev => {
          if (prev.length === 0) setError(response.data.message || 'Unable to load notifications.');
          return prev;
        });
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setNotifications(prev => {
        if (prev.length === 0) setError('Unable to load notifications. Please check your connection.');
        return prev;
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.post('/api.php', { 
        action: 'markAllNotificationsRead',
        userId: user?.id,
        role: user?.role 
      });
      setNotifications(prev => {
        const updated = prev.map(n => ({ ...n, is_read: 1 }));
        AsyncStorage.setItem('@cached_landlord_notifications', JSON.stringify(updated)).catch(() => {});
        return updated;
      });
      refreshUnreadCount();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await apiClient.post('/api.php', { 
        action: 'markNotificationRead', 
        notificationId: id,
        userId: user?.id,
        role: user?.role
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      refreshUnreadCount();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleNotificationTap = async (notif) => {
    // 1. Mark as read if unread
    if (parseInt(notif.is_read) === 0) {
      await handleMarkRead(notif.id);
    }

    // 2. Deep linking based on type
    if (notif.type === 'payment_submitted' || notif.type === 'payment_verified' || notif.type === 'payment_rejected') {
      try {
        const data = typeof notif.data_json === 'string' ? JSON.parse(notif.data_json) : (notif.data_json || {});
        if (data?.paymentId) {
          router.push(`/(landlord)/payments?paymentId=${data.paymentId}`);
        } else {
          router.push(`/(landlord)/payments`);
        }
      } catch (e) {
        console.warn('Failed to parse notification data_json:', e);
        router.push(`/(landlord)/payments`);
      }
    }
  };

  const handleClearAll = async () => {
    try {
      await apiClient.post('/api.php', { 
        action: 'deleteAllNotifications',
        userId: user?.id,
        role: user?.role 
      });
      setNotifications([]);
      AsyncStorage.removeItem('@cached_landlord_notifications').catch(() => {});
      refreshUnreadCount();
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await apiClient.post('/api.php', { 
        action: 'deleteNotification', 
        notificationId: id,
        userId: user?.id,
        role: user?.role
      });
      setNotifications(prev => {
        const filtered = prev.filter(n => n.id !== id);
        AsyncStorage.setItem('@cached_landlord_notifications', JSON.stringify(filtered)).catch(() => {});
        return filtered;
      });
      refreshUnreadCount();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  if (loading && (!notifications || notifications.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity onPress={handleMarkAllRead} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="checkmark-done" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="trash-bin-outline" size={24} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        {error ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
              <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
            </View>
            <Text style={styles.emptyTitle}>Unable to load notifications</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity 
              onPress={handleRefresh} 
              style={{
                marginTop: 16,
                paddingHorizontal: 20,
                paddingVertical: 10,
                backgroundColor: COLORS.primary,
                borderRadius: 12
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
           <View style={styles.emptyContainer}>
             <View style={styles.emptyIconBox}>
               <Ionicons name="notifications-off-outline" size={48} color={COLORS.primary} />
             </View>
             <Text style={styles.emptyTitle}>{"You're all caught up!"}</Text>
             <Text style={styles.emptyText}>There are no new notifications at the moment.</Text>
           </View>
        ) : (
          notifications.map(notif => (
            <NotificationItem 
              key={notif.id} 
              notif={notif} 
              onPress={handleNotificationTap} 
              onDelete={handleDeleteNotification}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


