import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/theme';
import styles from '../../styles/components/ui/NotificationCard.styles';
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


