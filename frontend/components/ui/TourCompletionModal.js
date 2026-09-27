import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../styles/theme';
import { useTourContext } from '../../contexts/TourContext';

const { width } = Dimensions.get('window');

export default function TourCompletionModal() {
  const { completionModalVisible, closeCompletionModal, tourRole } = useTourContext();

  if (!completionModalVisible) return null;

  const isLandlord = tourRole === 'landlord';

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
            {isLandlord
              ? 'You have completed the Landlord Tour. You now know how to monitor electricity, manage rooms, verify payments, track penalties, and configure facility tools.'
              : 'You have completed the Wattipid Tour. You now know how to monitor electricity, track your budget, view analytics, and manage bills.'}
          </Text>

          <View style={styles.tipBox}>
            <Ionicons name="book-outline" size={20} color="#3B82F6" />
            <Text style={styles.tipText}>
              Need a refresher later? Replay the tour or view complete guides anytime in{' '}
              <Text style={{ fontWeight: '700', color: '#fff' }}>Settings → User Manual</Text>.
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
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    marginBottom: SPACING.xl,
    width: '100%',
  },
  tipText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#93C5FD',
    flex: 1,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
