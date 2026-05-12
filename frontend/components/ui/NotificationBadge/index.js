import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT } from '@/styles/theme';

/**
 * Red badge showing unread notification count.
 * Designed to sit on top of the tab bar icon.
 */
export default function NotificationBadge({ count = 0, style }) {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : `${count}`;

  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text}>{displayCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  text: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs - 1,
    fontWeight: FONT_WEIGHT.bold,
    textAlign: 'center',
  },
});
