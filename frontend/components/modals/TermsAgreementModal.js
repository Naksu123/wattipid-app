import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../../styles/theme';
import GlassCard from '../ui/GlassCard';
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: SPACING.lg,
        paddingTop: Platform.OS === 'android' ? 40 : SPACING.lg,
        paddingBottom: SPACING.md,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center'
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    appTitle: {
        fontSize: 14,
        fontWeight: FONT_WEIGHT.heavy,
        color: COLORS.primary,
        letterSpacing: 2,
        marginBottom: 6,
        textAlign: 'center',
        textTransform: 'uppercase'
    },
    modalTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.heavy,
        color: COLORS.textPrimary,
        textAlign: 'center',
        letterSpacing: 0.5
    },
    versionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingVertical: 8,
    },
    versionText: {
        fontSize: 11,
        color: COLORS.info,
        fontWeight: FONT_WEIGHT.bold,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.lg,
        lineHeight: 22
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    loadingText: {
        marginTop: SPACING.md,
        color: COLORS.textMuted,
        fontSize: FONT_SIZE.md,
    },
    errorText: {
        marginTop: SPACING.md,
        color: COLORS.danger,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    retryBtn: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    retryBtnText: {
        color: COLORS.textPrimary,
        fontWeight: FONT_WEIGHT.bold,
    },
    scrollView: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.02)',
        marginHorizontal: SPACING.lg,
        borderRadius: RADIUS.lg,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    scrollContent: {
        padding: SPACING.lg,
        paddingBottom: 40,
    },
    sectionBlock: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: FONT_WEIGHT.heavy,
        color: COLORS.textPrimary,
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    sectionText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 24,
    },
    footer: {
        padding: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
    },
    scrollNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        padding: 12,
        borderRadius: RADIUS.sm,
        marginBottom: SPACING.md,
    },
    scrollNoticeText: {
        color: COLORS.warning,
        fontSize: 11,
        fontWeight: FONT_WEIGHT.bold,
        marginLeft: 8,
        flex: 1,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: SPACING.lg,
        backgroundColor: 'rgba(34,197,94,0.05)',
        padding: 16,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: 'rgba(34,197,94,0.2)',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: COLORS.primary,
        marginRight: 12,
        marginTop: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: COLORS.primary,
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 12,
        color: COLORS.textPrimary,
        lineHeight: 18,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    declineBtn: {
        flex: 0.35,
        height: 54,
        borderRadius: RADIUS.full,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'transparent',
    },
    declineBtnText: {
        color: COLORS.textMuted,
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold,
    },
    acceptBtn: {
        flex: 1,
        backgroundColor: COLORS.primary,
        height: 54,
        borderRadius: RADIUS.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptBtnDisabled: {
        backgroundColor: 'rgba(34,197,94,0.2)',
    },
    acceptBtnText: {
        color: COLORS.white,
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold,
    },
    alertOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    alertBox: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    alertIconBox: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    alertTitle: {
        fontSize: 18,
        fontWeight: FONT_WEIGHT.heavy,
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    alertMessage: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING.xl,
    },
    alertActionRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    alertCancelBtn: {
        flex: 1,
        height: 48,
        borderRadius: RADIUS.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    alertCancelBtnText: {
        color: COLORS.textPrimary,
        fontWeight: FONT_WEIGHT.bold,
    },
    alertConfirmBtn: {
        flex: 1,
        height: 48,
        borderRadius: RADIUS.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.danger,
    },
    alertConfirmBtnText: {
        color: COLORS.white,
        fontWeight: FONT_WEIGHT.bold,
    }
});
