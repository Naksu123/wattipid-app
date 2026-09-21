import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator,
  Platform, StyleSheet, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getActiveTerms } from '../../services/termsApi';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Default terms sections to ensure instant, beautiful display matching terms-and-conditions.png
const DEFAULT_SECTIONS = [
  {
    title: 'Acceptance of Terms',
    content: 'By creating an account and using Wattipid, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.',
  },
  {
    title: 'Service Description',
    content: 'Wattipid provides IoT-based smart energy submetering, real-time consumption monitoring, automated billing, and payment facilitation services for residential tenants and property managers.',
  },
  {
    title: 'User Accounts',
    content: 'You are responsible for maintaining the confidentiality of your account credentials. Tenant accounts are linked to specific rooms via invitation codes provided by landlords.',
  },
  {
    title: 'Billing & Payments',
    content: 'Electricity consumption is measured via certified submetering hardware. Bills are calculated based on actual kWh usage multiplied by the landlord utility rate and applicable fees.',
  },
  {
    title: 'Privacy & Data Protection',
    content: 'Wattipid collects energy consumption metrics and account information strictly to calculate billing, generate energy insights, and facilitate property management communications.',
  },
  {
    title: 'Submeter Hardware & Security',
    content: 'Users agree not to tamper with IoT hardware submeters, attempt unauthorized data access, reverse engineer the platform, or bypass payment verification mechanisms.',
  },
];

export default function TermsAgreementModal({ 
  visible, 
  onAccept, 
  onDecline, 
  onClose,
  isLoginMode = false 
}) {
  const [loading, setLoading] = useState(true);
  const [termsData, setTermsData] = useState(null);
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (visible) {
      fetchTerms();
    }
  }, [visible]);

  const fetchTerms = async () => {
    setLoading(true);
    try {
      const response = await getActiveTerms();
      if (response.success && response.data) {
        setTermsData(response.data);
      }
    } catch (error) {
      console.warn('[TermsModal] Failed to fetch active terms, using defaults:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoginMode) {
      setDeclineModalVisible(true);
    } else {
      if (onClose) {
        onClose();
      } else if (onDecline) {
        onDecline();
      }
    }
  };

  const confirmDecline = () => {
    setDeclineModalVisible(false);
    if (onDecline) onDecline();
  };

  const cancelDecline = () => {
    setDeclineModalVisible(false);
  };

  const handleAccept = () => {
    const versionId = termsData?.version?.id || 1;
    const deviceInfo = `${Platform.OS} ${Platform.Version}`;
    onAccept(versionId, deviceInfo);
  };

  const sections = (termsData?.sections && termsData.sections.length > 0)
    ? termsData.sections
    : DEFAULT_SECTIONS;

  const versionText = termsData?.version?.effective_date
    ? `Last updated: ${new Date(termsData.version.effective_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    : 'Last updated: October 2026';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Dimmed backdrop touchable to dismiss */}
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose} 
        />

        {/* Floating Modal Sheet Card */}
        <View style={styles.floatCard}>
          {/* Top Drag Indicator Pill */}
          <View style={styles.pillContainer}>
            <View style={styles.dragPill} />
          </View>

          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitles}>
              <Text style={styles.title}>Terms & Conditions</Text>
              <Text style={styles.subtitleGreen}>{versionText}</Text>
            </View>

            {/* Circular Close Button */}
            <TouchableOpacity 
              style={styles.closeBtn} 
              onPress={handleClose}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Intro Description */}
          <Text style={styles.introText}>
            Please read these Terms of Service carefully before agreeing. They outline your rights and obligations as a user of a Wattipid smart submetered property.
          </Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Scrollable Terms Content */}
          {loading && !termsData ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loaderText}>Loading Terms of Service...</Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              {sections.map((section, index) => (
                <View key={index} style={styles.sectionItem}>
                  {/* Number Badge & Title Row */}
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.numBadge}>
                      <Text style={styles.numBadgeText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                  </View>

                  {/* Section Content */}
                  <Text style={styles.sectionContent}>{section.content}</Text>
                </View>
              ))}

              <View style={{ height: 16 }} />
            </ScrollView>
          )}

          {/* Floating Sticky Footer matching terms-and-conditions.png */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.acceptBtn}
              activeOpacity={0.88}
              onPress={handleAccept}
            >
              <Ionicons name="checkmark-circle" size={18} color="#042F2E" style={{ marginRight: 8 }} />
              <Text style={styles.acceptBtnText}>
                Agree & Accept
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Decline Confirmation Dialog (Only active in mandatory login mode) */}
        <Modal visible={declineModalVisible} transparent animationType="fade">
          <View style={styles.alertOverlay}>
            <View style={styles.alertCard}>
              <View style={styles.alertIconAura}>
                <Ionicons name="warning-outline" size={32} color="#F59E0B" />
              </View>
              <Text style={styles.alertTitle}>Terms Required</Text>
              <Text style={styles.alertDesc}>
                You must accept the Terms and Conditions to continue accessing Wattipid services.
              </Text>
              <View style={styles.alertActions}>
                <TouchableOpacity style={styles.alertReviewBtn} onPress={cancelDecline} activeOpacity={0.8}>
                  <Text style={styles.alertReviewBtnText}>Review Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.alertExitBtn} onPress={confirmDecline} activeOpacity={0.8}>
                  <Text style={styles.alertExitBtnText}>Exit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  floatCard: {
    backgroundColor: '#0C1322',
    borderRadius: 26,
    maxHeight: Math.min(SCREEN_HEIGHT * 0.85, 680),
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.65,
    shadowRadius: 24,
    elevation: 25,
  },
  pillContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dragPill: {
    width: 44,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 8,
  },
  headerTitles: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtitleGreen: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: {
    fontSize: 13.5,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 13,
    color: '#94A3B8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  sectionItem: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  numBadge: {
    width: 25,
    height: 25,
    borderRadius: 7,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  numBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#10B981',
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  sectionContent: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20,
    paddingLeft: 35,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'transparent',
  },
  acceptBtn: {
    width: '100%',
    backgroundColor: '#10B981',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  acceptBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#042F2E',
    letterSpacing: 0.2,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  alertCard: {
    width: '100%',
    backgroundColor: '#0E1626',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  alertIconAura: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertDesc: {
    fontSize: 13.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  alertReviewBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  alertReviewBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  alertExitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  alertExitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
