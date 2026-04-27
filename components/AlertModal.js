import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, SHADOWS } from '../constants/theme';

const TIPS = [
  'Turn off lights when leaving the room to save up to 10% on your bill.',
  'Unplug chargers when not in use — phantom power adds up!',
  'Use a fan instead of air conditioning when possible.',
  'Set your AC to 25°C for optimal energy efficiency.',
  'Study using natural daylight whenever available.',
  'Limit the use of high-wattage appliances during peak hours.',
  'Turn off your monitor when taking breaks.',
  'Use LED bulbs — they consume 75% less energy than incandescent bulbs.',
];

export default function AlertModal({
  visible = false,
  type = 'warning', // 'warning' | 'danger' | 'info'
  title = 'Alert',
  message = '',
  onAcknowledge,
  onAdjustSettings,
  showTip = true,
  customTip = null,
}) {
  const config = {
    warning: { icon: 'warning', color: COLORS.warning, bgColor: 'rgba(245, 158, 11, 0.15)' },
    danger: { icon: 'alert-circle', color: COLORS.danger, bgColor: 'rgba(239, 68, 68, 0.15)' },
    info: { icon: 'information-circle', color: COLORS.info, bgColor: 'rgba(59, 130, 246, 0.15)' },
  };

  const { icon, color, bgColor } = config[type] || config.warning;
  const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
  const displayTip = customTip || randomTip;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
            <Ionicons name={icon} size={48} color={color} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color }]}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Wattipid Tip */}
          {showTip && (
            <View style={styles.tipContainer}>
              <View style={styles.tipHeader}>
                <Ionicons name="leaf" size={16} color={COLORS.primary} />
                <Text style={styles.tipLabel}>Wattipid Tip</Text>
              </View>
              <Text style={styles.tipText}>{displayTip}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onAcknowledge}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Acknowledge</Text>
            </TouchableOpacity>

            {onAdjustSettings && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onAdjustSettings}
                activeOpacity={0.8}
              >
                <Ionicons name="settings-outline" size={18} color={COLORS.primary} />
                <Text style={styles.secondaryButtonText}>Adjust Settings</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.lg,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  tipContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    width: '100%',
    marginBottom: SPACING.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  tipLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
    marginLeft: SPACING.xs,
  },
  tipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    gap: SPACING.sm,
  },
  button: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.white,
  },
  secondaryButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: SPACING.xs,
  },
  secondaryButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.primary,
  },
});
