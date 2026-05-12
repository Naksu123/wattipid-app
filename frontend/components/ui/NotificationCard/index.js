import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '@/styles/theme';

const CATEGORY_CONFIG = {
  budget: { icon: 'wallet', color: COLORS.warning, label: 'Budget' },
  consumption: { icon: 'flash', color: COLORS.accent, label: 'Consumption' },
  forecast: { icon: 'trending-up', color: COLORS.info, label: 'Forecast' },
  system: { icon: 'settings', color: COLORS.textMuted, label: 'System' },
};

const SEVERITY_COLORS = {
  critical: COLORS.danger,
  warning: COLORS.warning,
  info: COLORS.info,
};

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationCard({ notification, onPress, onDelete }) {
  const { title, message, category, severity, is_read, created_at } = notification;
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.system;
  const severityColor = SEVERITY_COLORS[severity] || COLORS.info;

  return (
    <TouchableOpacity
      style={[styles.card, !is_read && styles.unread]}
      onPress={() => onPress?.(notification)}
      activeOpacity={0.7}
    >
      {/* Severity indicator bar */}
      <View style={[styles.severityBar, { backgroundColor: severityColor }]} />

      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: `${severityColor}18` }]}>
          <Ionicons name={config.icon} size={22} color={severityColor} />
        </View>

        {/* Text */}
        <View style={styles.textWrap}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, !is_read && styles.unreadText]} numberOfLines={1}>
              {title?.replace(/^[^\w\s]+ /, '') || 'Alert'}
            </Text>
            {!is_read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.message} numberOfLines={2}>{message}</Text>
          <View style={styles.meta}>
            <View style={[styles.badge, { backgroundColor: `${config.color}20` }]}>
              <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
            </View>
            <Text style={styles.time}>{timeAgo(created_at)}</Text>
          </View>
        </View>

        {/* Delete button */}
        {onDelete && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(notification)}>
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  unread: {
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  severityBar: {
    height: 3,
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    padding: SPACING.md,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  textWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
    flex: 1,
  },
  unreadText: {
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.bold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  message: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },
  time: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  deleteBtn: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});
