import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/theme';

export default function NotificationCard({ notification, onPress }) {
  const { title, message, type, category, severity, is_read, created_at } = notification;

  // Format date
  const date = new Date(created_at.replace(' ', 'T'));
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  let timeStr = '';
  if (diffDays === 0) {
    timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    timeStr = 'Yesterday';
  } else {
    timeStr = `${diffDays} days ago`;
  }

  // Determine Icon and Colors based on severity/category
  let iconName = 'notifications';
  let iconColor = COLORS.primary;
  let bgColor = 'rgba(16, 185, 129, 0.1)'; // Primary/Success tint

  if (severity === 'critical') {
    iconName = 'alert-circle';
    iconColor = '#EF4444'; // Red
    bgColor = 'rgba(239, 68, 68, 0.15)';
  } else if (severity === 'warning') {
    iconName = 'warning';
    iconColor = '#F59E0B'; // Yellow/Orange
    bgColor = 'rgba(245, 158, 11, 0.15)';
  } else if (category === 'billing' || category === 'payment') {
    iconName = 'receipt';
    iconColor = '#3B82F6'; // Blue
    bgColor = 'rgba(59, 130, 246, 0.15)';
  } else if (category === 'budget') {
    iconName = 'wallet';
    iconColor = '#8B5CF6'; // Purple
    bgColor = 'rgba(139, 92, 246, 0.15)';
  } else if (category === 'consumption') {
    iconName = 'flash';
  } else if (category === 'penalty') {
    iconName = 'trending-down';
    iconColor = '#991B1B'; // Dark Red
    bgColor = 'rgba(153, 27, 27, 0.15)';
  }

  return (
    <TouchableOpacity 
      style={[styles.card, !is_read && styles.unreadCard]} 
      onPress={() => onPress && onPress(notification)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, !is_read && styles.unreadTitle]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.time}>{timeStr}</Text>
        </View>
        {!is_read && <View style={styles.unreadDot} />}
      </View>
      <Text style={[styles.message, !is_read && styles.unreadMessage]} numberOfLines={3}>
        {message}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  unreadCard: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(59, 130, 246, 0.3)', // Subtle blue glow for unread
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  unreadTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  time: {
    color: '#64748B',
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6', // Blue dot
    marginLeft: 8,
  },
  message: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  unreadMessage: {
    color: '#E2E8F0',
  }
});
