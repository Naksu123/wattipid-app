import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Animated, Pressable } from 'react-native';
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
    case 'payment': return { name: 'cash-outline', color: COLORS.success };
    case 'penalty': return { name: 'warning-outline', color: COLORS.danger };
    case 'room': return { name: 'home-outline', color: COLORS.primary };
    case 'system': return { name: 'server-outline', color: COLORS.secondary };
    default: return { name: 'notifications-outline', color: COLORS.primary };
  }
};

const NotificationItem = ({ notif, onPress, onDelete }) => {
  const isUnread = parseInt(notif.is_read) === 0;
  const { name, color } = renderIcon(notif.category || 'system');
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

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.post('/api.php', { 
        action: 'getNotifications', 
        limit: 50,
        userId: user?.id,
        role: user?.role
      });
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
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
    if (notif.type === 'payment_submitted') {
      try {
        const data = notif.data_json ? JSON.parse(notif.data_json) : null;
        if (data && data.paymentId) {
          router.push(`/(landlord)/payments?paymentId=${data.paymentId}`);
        }
      } catch (e) {
        console.warn('Failed to parse notification data_json:', e);
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
      setNotifications(prev => prev.filter(n => n.id !== id));
      refreshUnreadCount();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };



  if (loading) {
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
        {notifications.length === 0 ? (
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


