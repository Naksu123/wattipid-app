import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function DashboardAlertCard({ alert }) {
  const router = useRouter();
  const { title, message, severity, category } = alert;

  // Determine styling based on severity
  const isCritical = severity === 'critical';
  
  const cardColor = isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)';
  const borderColor = isCritical ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)';
  const iconColor = isCritical ? '#EF4444' : '#F59E0B';
  const iconName = isCritical ? 'alert-circle' : 'warning';

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: cardColor, borderColor: borderColor }]}
      activeOpacity={0.8}
      onPress={() => router.navigate('/(tenant)/notifications')}
    >
      <View style={styles.iconWrapper}>
        <Ionicons name={iconName} size={28} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: iconColor }]}>{title}</Text>
        <Text style={styles.message} numberOfLines={2}>{message}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={iconColor} style={{ opacity: 0.7 }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  iconWrapper: {
    marginRight: 16,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
  }
});
