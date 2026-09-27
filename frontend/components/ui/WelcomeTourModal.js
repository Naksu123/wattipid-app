import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../styles/theme';
import { useTourContext } from '../../contexts/TourContext';

const { width } = Dimensions.get('window');

export default function WelcomeTourModal() {
  const { welcomeModalVisible, startContinuousTour, skipTour, tourRole } = useTourContext();

  if (!welcomeModalVisible) return null;

  const isLandlord = tourRole === 'landlord';

  return (
    <Modal
      visible={welcomeModalVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Brand Icon Header */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name={isLandlord ? "business" : "flash"} size={32} color="#10B981" />
            </View>
            <View style={styles.glowEffect} />
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>
            {isLandlord ? 'Welcome, Dormitory Admin' : 'Welcome to Wattipid'}
          </Text>
          <Text style={styles.subtitle}>
            {isLandlord
              ? 'Your smart command center for real-time submeter monitoring, room assignment, tenant management, payment verification, and billing.'
              : 'Your smart companion for monitoring room electricity usage, tracking your budget, exploring consumption trends, and managing bills.'}
          </Text>

          {/* Key Value Points */}
          <View style={styles.featuresList}>
            {isLandlord ? (
              <>
                <View style={styles.featureItem}>
                  <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Ionicons name="speedometer-outline" size={18} color="#10B981" />
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={styles.featureTitle}>Real-Time Monitoring</Text>
                    <Text style={styles.featureDesc}>Live power load, energy consumption, and capacity</Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <Ionicons name="business-outline" size={18} color="#3B82F6" />
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={styles.featureTitle}>Room Management</Text>
                    <Text style={styles.featureDesc}>Assign rooms, invite tenants, and generate reports</Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <Ionicons name="wallet-outline" size={18} color="#F59E0B" />
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={styles.featureTitle}>Payment Verification</Text>
                    <Text style={styles.featureDesc}>Review deposit receipts and verify payments with one tap</Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={styles.featureTitle}>Penalty & Overdue Center</Text>
                    <Text style={styles.featureDesc}>Track late accounts and send automated reminder notices</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.featureItem}>
                  <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Ionicons name="speedometer-outline" size={18} color="#10B981" />
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={styles.featureTitle}>Real-Time Consumption</Text>
                    <Text style={styles.featureDesc}>Live power draw and energy usage from your submeter</Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <Ionicons name="pie-chart-outline" size={18} color="#3B82F6" />
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={styles.featureTitle}>Budget & Alerts</Text>
                    <Text style={styles.featureDesc}>Set limits and get proactive warning before overspending</Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={styles.featureTitle}>Smart Tips & Analytics</Text>
                    <Text style={styles.featureDesc}>Personalized recommendations based on usage patterns</Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                    <Ionicons name="receipt-outline" size={18} color="#A855F7" />
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={styles.featureTitle}>Billing & Easy Payment</Text>
                    <Text style={styles.featureDesc}>Transparent charge breakdown and online payment upload</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => startContinuousTour(tourRole)}
            >
              <Text style={styles.primaryButtonText}>Start Full Tour</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              activeOpacity={0.7}
              onPress={skipTour}
            >
              <Text style={styles.secondaryButtonText}>Skip for Now</Text>
            </TouchableOpacity>
          </View>
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
    width: Math.min(width - 32, 400),
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
  iconContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 44,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  featuresList: {
    width: '100%',
    gap: 12,
    marginBottom: SPACING.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 15,
  },
  actionsContainer: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  secondaryButton: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
