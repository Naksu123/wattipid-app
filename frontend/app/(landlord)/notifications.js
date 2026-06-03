import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_WEIGHT, SHADOWS } from '@/styles/theme';
import apiClient from '../../services/apiClient';
import { router } from 'expo-router';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.post('/api.php', { action: 'getNotifications', limit: 50 });
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
      await apiClient.post('/api.php', { action: 'markAllAsRead' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await apiClient.post('/api.php', { action: 'markAsRead', notificationId: id });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
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
          <Text style={[styles.title, isUnread && styles.unreadText]}>{notif.title}</Text>
          <Text style={styles.message}>{notif.message}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg },
  headerTitle: { fontSize: 20, fontWeight: FONT_WEIGHT.heavy, color: COLORS.textPrimary },
  backBtn: { padding: 8, backgroundColor: COLORS.surface, borderRadius: 12 },
  markAllText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  scroll: { padding: SPACING.lg, paddingBottom: 100 },
  notifCard: { flexDirection: 'row', backgroundColor: COLORS.surface, padding: 16, borderRadius: RADIUS.lg, marginBottom: 12, ...SHADOWS.sm, alignItems: 'center' },
  unreadCard: { backgroundColor: '#ffffff', borderColor: `${COLORS.primary}30`, borderWidth: 1 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 4 },
  unreadText: { fontWeight: '800', color: '#000' },
  message: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20 },
  date: { fontSize: 12, color: COLORS.textMuted, marginTop: 8, opacity: 0.7 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary, marginLeft: 10 },
  emptyText: { marginTop: 16, color: COLORS.textMuted, fontSize: 16 },
});
