import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/theme';
import styles from '../../styles/landlord/notifications.styles';
import apiClient from '../../services/apiClient';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

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

  const renderIcon = (type) => {
    switch (type) {
      case 'payment': return { name: 'cash-outline', color: COLORS.success };
      case 'penalty': return { name: 'warning-outline', color: COLORS.danger };
      case 'room': return { name: 'home-outline', color: COLORS.primary };
      case 'system': return { name: 'server-outline', color: COLORS.secondary };
      default: return { name: 'notifications-outline', color: COLORS.primary };
    }
  };

  const renderItem = (notif) => {
    const isUnread = parseInt(notif.is_read) === 0;
    const { name, color } = renderIcon(notif.category || 'system');
    const dateStr = new Date(notif.created_at).toLocaleString();

    // Strip common emoticons and emojis
    const cleanTitle = notif.title ? notif.title.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F900}-\u{1F9FF}\u{2B50}]/gu, '').trim() : '';
    const cleanMessage = notif.message ? notif.message.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F900}-\u{1F9FF}\u{2B50}]/gu, '').trim() : '';

    return (
      <TouchableOpacity 
        key={notif.id} 
        style={[styles.notifCard, isUnread && styles.unreadCard]}
        onPress={() => isUnread && handleMarkRead(notif.id)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
          <Ionicons name={name} size={24} color={color} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, isUnread && styles.unreadText]}>{cleanTitle}</Text>
          <Text style={styles.message}>{cleanMessage}</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
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
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        {notifications.length === 0 ? (
           <View style={styles.center}>
             <Ionicons name="notifications-off-outline" size={48} color={COLORS.border} />
             <Text style={styles.emptyText}>No notifications yet.</Text>
           </View>
        ) : (
          notifications.map(renderItem)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


