import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../../styles/theme';
import GlassCard from '../ui/GlassCard';
import styles from '../../styles/components/modals/TermsAgreementModal.styles';
import { getActiveTerms } from '../../services/termsApi';

export default function TermsAgreementModal({ visible, onAccept, onDecline, isLoginMode = false }) {
    const [loading, setLoading] = useState(true);
    const [termsData, setTermsData] = useState(null);
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [accepted, setAccepted] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [declineModalVisible, setDeclineModalVisible] = useState(false);
    const scrollViewRef = useRef(null);

    useEffect(() => {
        if (visible) {
            setHasScrolledToBottom(false);
            setAccepted(false);
            fetchTerms();
        }
    }, [visible]);

    const fetchTerms = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const response = await getActiveTerms();
            if (response.success && response.data) {
                setTermsData(response.data);
            } else {
                setErrorMsg('Failed to load Terms and Conditions.');
            }
        } catch (error) {
            setErrorMsg('Network error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleScroll = (event) => {
        if (hasScrolledToBottom) return; // Only trigger once

        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 50; // trigger slightly before absolute bottom
        if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            setHasScrolledToBottom(true);
        }
    };

    const handleDecline = () => {
        setDeclineModalVisible(true);
    };

    const confirmDecline = () => {
        setDeclineModalVisible(false);
        onDecline();
    };

    const cancelDecline = () => {
        setDeclineModalVisible(false);
    };

    const handleAccept = () => {
        if (!termsData) return;
        const deviceInfo = `${Platform.OS} ${Platform.Version}`;
        onAccept(termsData.version.id, deviceInfo);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleDecline}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.appTitle}>Wattipid</Text>
                    <Text style={styles.modalTitle}>Terms and Conditions Agreement</Text>
                </View>

                {/* Content */}
                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Loading Legal Documents...</Text>
                    </View>
                ) : errorMsg ? (
                    <View style={styles.centerContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
                        <Text style={styles.errorText}>{errorMsg}</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={fetchTerms}>
                            <Text style={styles.retryBtnText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={styles.versionBanner}>
                            <Ionicons name="information-circle" size={16} color={COLORS.info} style={{ marginRight: 6 }} />
                            <Text style={styles.versionText}>
                                Version {termsData.version.version_number} • Effective {new Date(termsData.version.effective_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </Text>
                        </View>
                        
                        <Text style={styles.subtitle}>
                            Please review and accept the Terms and Conditions before {isLoginMode ? "accessing your account" : "creating your account"}.
                        </Text>

                        <ScrollView 
                            ref={scrollViewRef}
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={true}
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                        >
                            {termsData.sections.map((section, index) => (
                                <View key={index} style={styles.sectionBlock}>
                                    <Text style={styles.sectionTitle}>{section.title}</Text>
                                    <Text style={styles.sectionText}>{section.content}</Text>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Footer area */}
                        <View style={styles.footer}>
                            {!hasScrolledToBottom ? (
                                <View style={styles.scrollNotice}>
                                    <Ionicons name="arrow-down-circle-outline" size={20} color={COLORS.warning} />
                                    <Text style={styles.scrollNoticeText}>Please scroll to the end of the Terms and Conditions to continue.</Text>
                                </View>
                            ) : (
                                <TouchableOpacity 
                                    style={styles.checkboxContainer} 
                                    onPress={() => setAccepted(!accepted)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
                                        {accepted && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                                    </View>
                                    <Text style={styles.checkboxLabel}>
                                        I have read, understood, and agree to the Wattipid Terms and Conditions, Electricity Billing Policies, Payment Verification Policies, Miscellaneous Fees, Penalty Policies, and User Responsibilities.
                                    </Text>
                                </TouchableOpacity>
                            )}

                            <View style={styles.actionRow}>
                                <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
                                    <Text style={styles.declineBtnText}>Decline</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={[styles.acceptBtn, (!hasScrolledToBottom || !accepted) && styles.acceptBtnDisabled]} 
                                    disabled={!hasScrolledToBottom || !accepted}
                                    onPress={handleAccept}
                                >
                                    <Text style={styles.acceptBtnText}>Agree & Continue</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        {/* Custom Decline Alert Modal */}
                        <Modal visible={declineModalVisible} transparent animationType="fade">
                            <View style={styles.alertOverlay}>
                                <View style={styles.alertBox}>
                                    <View style={styles.alertIconBox}>
                                        <Ionicons name="warning" size={32} color={COLORS.warning} />
                                    </View>
                                    <Text style={styles.alertTitle}>Terms Required</Text>
                                    <Text style={styles.alertMessage}>
                                        You must accept the Terms and Conditions to {isLoginMode ? "continue using Wattipid." : "create a Wattipid account."}
                                    </Text>
                                    <View style={styles.alertActionRow}>
                                        <TouchableOpacity style={styles.alertCancelBtn} onPress={cancelDecline}>
                                            <Text style={styles.alertCancelBtnText}>Review Again</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.alertConfirmBtn} onPress={confirmDecline}>
                                            <Text style={styles.alertConfirmBtnText}>Exit</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    </>
                )}
            </View>
        </Modal>
    );
}


