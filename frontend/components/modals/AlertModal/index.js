import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/styles/theme';
import styles from './styles';

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
