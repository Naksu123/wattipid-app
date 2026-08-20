import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../styles/theme';
import { useTourContext } from '../../contexts/TourContext';

const { width } = Dimensions.get('window');

export default function TourCompletionModal() {
  const { completionModalVisible, closeCompletionModal } = useTourContext();

  if (!completionModalVisible) return null;

  return (
    <Modal
      visible={completionModalVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Success Badge */}
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
          </View>

          {/* Title & Message */}
          <Text style={styles.title}>{"You're All Set!"}</Text>
          <Text style={styles.message}>
            Now you know the basics of how Wattipid monitors your overall electricity consumption, manages budgets, provides tips, and handles payments.
          </Text>

          <View style={styles.tipBox}>
            <Ionicons name="book-outline" size={20} color="#3B82F6" />
            <Text style={styles.tipText}>
              Need a refresher later? You can replay the tour or explore detailed feature guides anytime in <Text style={{ fontWeight: '700', color: '#fff' }}>Settings → User Manual</Text>.
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={closeCompletionModal}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: Math.min(width - 32, 380),
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: 8,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    gap: 10,
    marginBottom: SPACING.xl,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#93C5FD',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
