import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, SHADOWS } from '../constants/theme';
import StatusBadge from './StatusBadge';

export default function RoomCard({ room, onPress }) {
  const isActive = room.status === 'occupied' || room.status === 'active';
  const borderColor = isActive ? COLORS.primary : COLORS.border;

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor }]}
      onPress={() => onPress && onPress(room)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.roomInfo}>
          <View style={[styles.roomIcon, { backgroundColor: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)' }]}>
            <Ionicons
              name={isActive ? 'flash' : 'flash-outline'}
              size={22}
              color={isActive ? COLORS.primary : COLORS.textMuted}
            />
          </View>
          <View>
            <Text style={styles.roomId}>{room.room_id}</Text>
            <Text style={styles.tenantName}>
              {room.tenant_name || 'No tenant assigned'}
            </Text>
          </View>
        </View>
        <StatusBadge status={room.status} size="sm" />
      </View>

      {isActive && (
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="flash-outline" size={14} color={COLORS.accent} />
            <Text style={styles.statValue}>{(Math.random() * 5 + 1).toFixed(2)} kWh</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>₱</Text>
            <Text style={styles.statValue}>{(Math.random() * 60 + 10).toFixed(2)}</Text>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.codeLabel}>Access Code:</Text>
        <Text style={styles.codeValue}>{room.tenant_code || '—'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  roomIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomId: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  tenantName: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.accent,
    fontWeight: FONT_WEIGHT.bold,
  },
  statValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  codeLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  codeValue: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
    fontFamily: 'monospace',
  },
});
