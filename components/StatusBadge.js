import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../constants/theme';

export default function StatusBadge({ status = 'active', size = 'md' }) {
  const config = {
    active: { color: COLORS.primary, bgColor: 'rgba(34, 197, 94, 0.15)', label: 'Active' },
    occupied: { color: COLORS.primary, bgColor: 'rgba(34, 197, 94, 0.15)', label: 'Occupied' },
    on_process: { color: COLORS.warning, bgColor: 'rgba(245, 158, 11, 0.15)', label: 'On Process' },
    vacant: { color: COLORS.textMuted, bgColor: 'rgba(100, 116, 139, 0.15)', label: 'Vacant' },
    warning: { color: COLORS.warning, bgColor: 'rgba(245, 158, 11, 0.15)', label: 'Warning' },
    danger: { color: COLORS.danger, bgColor: 'rgba(239, 68, 68, 0.15)', label: 'Alert' },
    offline: { color: COLORS.textMuted, bgColor: 'rgba(100, 116, 139, 0.15)', label: 'Offline' },
  };

  const { color, bgColor, label } = config[status] || config.active;
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, isSmall && styles.badgeSmall]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }, isSmall && styles.textSmall]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: SPACING.xs + 2,
  },
  text: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  textSmall: {
    fontSize: FONT_SIZE.xs,
  },
});
