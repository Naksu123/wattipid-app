import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView, TextInput, Pressable, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { getAvailableBillingCycles, getMultipleSettings } from '../../services/database';
import { submitPayment } from '../../services/paymentService';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import DynamicQRCode from '../../components/tenant/Billing/DynamicQRCode';
import { COLORS, SPACING } from '../../styles/theme';
import styles from '../../styles/tenant/payment.styles';

// --- Premium Buttons ---
const PremiumAnimatedButton = ({ onPress, disabled, title, loading, type, icon }) => {
    const scale = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        if (!disabled && !loading) {
            Animated.timing(scale, {
                toValue: 0.97,
                duration: 100,
                useNativeDriver: true,
            }).start();
        }
    };

    const handlePressOut = () => {
        Animated.timing(scale, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
        }).start();
    };

    const isPrimary = type === 'primary';
    const bgColor = disabled 
        ? (isPrimary ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.03)')
        : (isPrimary ? '#10B981' : 'rgba(255, 255, 255, 0.05)');
        
    const borderColor = disabled
        ? (isPrimary ? 'transparent' : 'rgba(255, 255, 255, 0.04)')
        : (isPrimary ? '#10B981' : 'rgba(255, 255, 255, 0.1)');
        
    const textColor = disabled
        ? (isPrimary ? 'rgba(255, 255, 255, 0.5)' : '#64748B')
        : (isPrimary ? '#042F2E' : '#E2E8F0');

    return (
        <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                style={{
                    backgroundColor: bgColor,
                    borderWidth: 1,
                    borderColor: borderColor,
                    borderRadius: 12,
                    height: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    paddingHorizontal: 12,
                }}
            >
                {loading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator color={textColor} size="small" style={{ marginRight: 6, transform: [{ scale: 0.8 }] }} />
                        <Text style={{ color: textColor, fontWeight: '700', fontSize: 13.5, includeFontPadding: false }} numberOfLines={1}>
                            {typeof loading === 'string' ? loading : 'Submitting...'}
                        </Text>
                    </View>
                ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        {icon === 'back' && <Ionicons name="arrow-back" size={15} color={textColor} style={{ marginRight: 5 }} />}
                        <Text style={{ color: textColor, fontWeight: '700', fontSize: 13.5, includeFontPadding: false }} numberOfLines={1}>{title}</Text>
                        {icon === 'submit' && <Ionicons name="checkmark-circle-outline" size={16} color={textColor} style={{ marginLeft: 5 }} />}
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
};

export default function TenantPaymentScreen() {
    const { user, loading: authLoading } = useAuth();
    const { showModal } = useModal();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { cycleId, type, amount, invoiceNumber } = params || {};

    const [allCycles, setAllCycles] = useState([]);
    const [billingCycle, setBillingCycle] = useState(null);
    const [billType, setBillType] = useState(type || 'current'); // 'current' | 'overdue'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const hasDataRef = useRef(false);

    // Instant Cache Restoration (Stale-While-Revalidate)
    useEffect(() => {
        let isMounted = true;
        const restoreCachedPayment = async () => {
            if (!user?.room_id) return;
            try {
                const cached = await AsyncStorage.getItem(`@cached_tenant_payment_${user.room_id}`);
                if (cached && isMounted) {
                    const parsed = JSON.parse(cached);
                    if (parsed && (parsed.billingCycle || (parsed.allCycles && parsed.allCycles.length > 0))) {
                        if (parsed.allCycles) setAllCycles(parsed.allCycles);
                        let targetCycle = parsed.billingCycle;
                        if (cycleId && Array.isArray(parsed.allCycles)) {
                            const found = parsed.allCycles.find(c => String(c.id) === String(cycleId));
                            if (found) targetCycle = found;
                        }
                        if (targetCycle) setBillingCycle(targetCycle);
                        if (parsed.billType) setBillType(parsed.billType);
                        if (parsed.landlordInfo) setLandlordInfo(parsed.landlordInfo);
                        hasDataRef.current = true;
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.warn('[TenantPayment] Cache restoration error:', err);
            }
        };
        restoreCachedPayment();
        return () => { isMounted = false; };
    }, [user?.room_id, cycleId]);

    // Wizard State
    const [step, setStep] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState(null); // 'Cash', 'GCash', 'Maya'
    const [referenceNumber, setReferenceNumber] = useState('');
    const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [proofUri, setProofUri] = useState(null);
    const [proofBase64, setProofBase64] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [verifying, setVerifying] = useState(false);

    // Landlord Settings
    const [landlordInfo, setLandlordInfo] = useState({});

    const calculateCycleAmount = useCallback((cycle, forcedType = null) => {
        if (!cycle) return 0;
        
        // Pure current cycle base: electricity + misc + rent + additional - discounts
        const elec = parseFloat(cycle.electricity_charge || cycle.total_cost || 0);
        const misc = parseFloat(cycle.miscellaneous_fee || 0);
        const rent = parseFloat(cycle.monthly_rent || 0);
        const addl = parseFloat(cycle.additional_charges || 0);
        const disc = parseFloat(cycle.discounts || 0);
        const baseAmount = Math.max(0, elec + misc + rent + addl - disc);

        const penalty = parseFloat(cycle.penalty_amount || 0);
        const paid = parseFloat(cycle.amount_paid || 0);

        const isOverdue = forcedType === 'overdue' || cycle.payment_status === 'overdue' || (cycle.days_overdue && cycle.days_overdue > 0);

        if (isOverdue) {
            // Overdue includes base + penalty of THIS cycle minus what was paid
            return Math.max(0, baseAmount + penalty - paid);
        } else {
            // Current bill includes ONLY current cycle base minus amount paid (ZERO previous balance)
            return Math.max(0, baseAmount - paid);
        }
    }, []);

    const fetchData = useCallback(async () => {
        if (authLoading) return;
        if (!user) return;
        if (!user?.room_id) {
            setError('No room assigned to your account.');
            setLoading(false);
            return;
        }

        try {
            setError(null);
            
            // Fetch billing cycles
            const response = await getAvailableBillingCycles(user.room_id);
            const rawCycles = response?.data || response || [];
            const cycles = Array.isArray(rawCycles) ? rawCycles : (rawCycles?.cycles || []);
            
            const unpaid = cycles.filter(c => 
                ['unpaid', 'pending_verification', 'overdue', 'partially_paid'].includes(c.payment_status)
            );
            setAllCycles(unpaid);

            let chosen = null;
            if (cycleId) {
                chosen = cycles.find(c => String(c.id) === String(cycleId));
            }
            if (!chosen) {
                // If no specific cycle targeted, prefer actionable overdue first, else actionable unpaid, else pending, else completed
                const overdueFirst = unpaid.find(c => c.payment_status === 'overdue');
                const actionableUnpaid = unpaid.find(c => c.payment_status !== 'pending_verification');
                chosen = overdueFirst || actionableUnpaid || unpaid[0] || cycles.find(c => c.status === 'completed') || null;
            }

            setBillingCycle(chosen);
            let computedBillType = 'current';
            if (chosen) {
                const isCycPending = chosen.payment_status === 'pending_verification';
                const isOverdue = !isCycPending && (type === 'overdue' || chosen.payment_status === 'overdue' || (chosen.days_overdue && chosen.days_overdue > 0));
                computedBillType = isOverdue ? 'overdue' : 'current';
                setBillType(computedBillType);
            }

            // Fetch landlord settings for payment methods in a single request
            let updatedLandlordInfo = landlordInfo;
            try {
                const settings = await getMultipleSettings([
                    'gcash_name', 'gcash_number', 'gcash_qr',
                    'maya_name', 'maya_number', 'maya_qr'
                ]);
                
                updatedLandlordInfo = {
                    gcash_name: settings?.gcash_name || 'Not configured',
                    gcash_number: settings?.gcash_number || 'Not configured',
                    gcash_qr: settings?.gcash_qr || null,
                    maya_name: settings?.maya_name || 'Not configured',
                    maya_number: settings?.maya_number || 'Not configured',
                    maya_qr: settings?.maya_qr || null
                };
                setLandlordInfo(updatedLandlordInfo);
            } catch (settingsErr) {
                console.warn('[TenantPayment] Failed to load landlord payment settings:', settingsErr);
            }

            hasDataRef.current = true;

            // Persist to cache
            AsyncStorage.setItem(`@cached_tenant_payment_${user.room_id}`, JSON.stringify({
                allCycles: unpaid,
                billingCycle: chosen,
                billType: computedBillType,
                landlordInfo: updatedLandlordInfo
            })).catch(() => {});

        } catch (err) {
            console.warn('[TenantPayment] Failed to load data:', err);
            // Stale-While-Revalidate: If we already have cached data, keep it visible!
            if (!hasDataRef.current && !billingCycle) {
                setError('Unable to load billing information.');
            }
        } finally {
            setLoading(false);
        }
    }, [authLoading, user, cycleId, type]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const selectCycle = (cycle) => {
        setBillingCycle(cycle);
        const isCycPending = cycle.payment_status === 'pending_verification';
        const isOverdue = !isCycPending && (cycle.payment_status === 'overdue' || (cycle.days_overdue && cycle.days_overdue > 0));
        setBillType(isOverdue ? 'overdue' : 'current');
        setStep(1);
        setPaymentMethod(null);
    };

    const pickImage = async () => {
        try {
            const requestPermissions = ImagePicker.requestMediaLibraryPermissionsAsync || ImagePicker.default?.requestMediaLibraryPermissionsAsync;
            const launchLibrary = ImagePicker.launchImageLibraryAsync || ImagePicker.default?.launchImageLibraryAsync;

            if (typeof requestPermissions !== 'function') throw new Error("ImagePicker functions unavailable");

            const { status } = await requestPermissions();
            if (status !== 'granted') {
                showModal({ type: 'warning', title: 'Permission Required', message: 'Please allow access to your photo library.' });
                return;
            }

            let result = await launchLibrary({
                mediaTypes: ['images'],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets?.[0]) {
                setProofUri(result.assets[0].uri);
                setProofBase64(result.assets[0].base64);
            }
        } catch (err) {
            console.warn('[TenantPayment] ImagePicker Error, attempting DocumentPicker fallback:', err);
            try {
                const result = await DocumentPicker.getDocumentAsync({
                    type: ['image/*', 'application/pdf'],
                    copyToCacheDirectory: true,
                });
                
                if (!result.canceled && result.assets?.[0]) {
                    const file = result.assets[0];
                    setProofUri(file.uri);
                    
                    const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
                    const mimeType = file.mimeType || 'image/jpeg';
                    setProofBase64(`data:${mimeType};base64,${base64}`);
                }
            } catch (fallbackErr) {
                 console.warn('[TenantPayment] DocumentPicker Error:', fallbackErr);
                 showModal({ type: 'error', title: 'Error', message: 'Unable to open file picker. This device may not support file selection.' });
            }
        }
    };

    const verifyPaymentSuccess = async () => {
        try {
            const response = await getAvailableBillingCycles(user.room_id);
            const cycles = response?.data || response || [];
            const targetCycle = cycles.find(c => c.id === billingCycle?.id);
            
            if (targetCycle && (targetCycle.payment_status === 'pending_verification' || targetCycle.payment_status === 'paid')) {
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    };

    // Calculate authoritative targeted amount (Prioritize fresh server data over stale navigation params)
    const liveCalculatedDue = calculateCycleAmount(billingCycle, billType);
    const targetDue = liveCalculatedDue > 0
        ? liveCalculatedDue
        : (amount && parseFloat(amount) > 0 ? parseFloat(amount) : 0);

    const handleSubmit = async () => {
        if (billingCycle?.payment_status === 'pending_verification') {
            showModal({
                type: 'warning',
                title: 'Payment Under Review',
                message: `A payment for Invoice ${billingCycle.invoice_number || 'this cycle'} has already been submitted and is currently awaiting landlord verification. You do not need to make another payment.`
            });
            return;
        }

        if (!paymentMethod) {
            showModal({ type: 'error', title: 'Error', message: 'Please select a payment method.' });
            return;
        }

        if (paymentMethod !== 'Cash' && !proofBase64 && !proofUri && !referenceNumber) {
            showModal({ type: 'error', title: 'Error', message: 'Please attach a screenshot of your payment receipt or enter a reference number.' });
            return;
        }

        setSubmitting(true);
        setVerifying(false);
        try {
            const amountToPay = targetDue;
            const finalRef = referenceNumber || (paymentMethod === 'Cash' ? `CASH-${Math.random().toString(36).substring(2, 10).toUpperCase()}` : null);
            
            let proofUrl = null;
            if (proofBase64) {
                if (proofBase64.startsWith('data:')) {
                    proofUrl = proofBase64;
                } else {
                    proofUrl = `data:image/jpeg;base64,${proofBase64}`;
                }
            }

            await submitPayment(
                billingCycle.id, 
                user.room_id, 
                amountToPay, 
                proofUrl, 
                finalRef,
                paymentMethod,
                paymentDate
            );
            
            showModal({ type: 'success', title: 'Success', message: 'Payment submitted for verification!' });
            setProofUri(null);
            setProofBase64(null);
            setReferenceNumber('');
            setStep(4);
            AsyncStorage.removeItem(`@cached_tenant_dashboard_${user.room_id}`).catch(() => {});
            AsyncStorage.removeItem(`@cached_tenant_billing_hist_${user.room_id}`).catch(() => {});
            fetchData();
        } catch (err) {
            const errorMsg = typeof err === 'string' ? err : (err?.message || 'Failed to submit payment.');
            
            // If it's a network/timeout error, verify before failing
            if (errorMsg.includes('connect') || errorMsg.includes('longer than expected') || errorMsg.includes('unavailable')) {
                console.warn('[TenantPayment] Connection unstable. Verifying if payment succeeded on backend...');
                setVerifying(true);
                
                await new Promise(res => setTimeout(res, 2000));
                
                const verified = await verifyPaymentSuccess();
                if (verified) {
                    console.log('[TenantPayment] Payment was actually successful despite network error.');
                    showModal({ type: 'success', title: 'Success', message: 'Payment was successfully submitted despite network issues.' });
                    setStep(4);
                    fetchData();
                    setSubmitting(false);
                    setVerifying(false);
                    return;
                } else {
                    console.warn('[TenantPayment] Payment verification failed. Safe to retry.');
                    showModal({ type: 'error', title: 'Connection Issue', message: 'Connection was lost before we could confirm your payment. Please verify your internet and try again.' });
                }
            } else {
                showModal({ type: 'error', title: 'Error', message: errorMsg });
            }
        }
        setSubmitting(false);
        setVerifying(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatStatus = (status) => {
        if (!status) return 'Unpaid';
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    if ((loading && !billingCycle) || (authLoading && !billingCycle)) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading billing info...</Text>
            </View>
        );
    }

    if (error && !billingCycle) {
        return (
            <View style={[styles.container, styles.center]}>
                <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => { setError(null); setLoading(true); fetchData(); }}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!billingCycle) {
        return (
            <View style={[styles.container, styles.center]}>
                <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.primary} />
                <Text style={styles.noPendingText}>No pending invoices found.</Text>
            </View>
        );
    }

    const isPending = billingCycle.payment_status === 'pending_verification';
    const isPaid = billingCycle.payment_status === 'paid';

    return (
        <View style={styles.container}>
            {/* Top Navigation Bar */}
            <View style={styles.topBar}>
                <TouchableOpacity 
                    onPress={() => {
                        if (step > 1) {
                            setStep(s => s - 1);
                        } else {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace('/(tenant)/dashboard');
                            }
                        }
                    }} 
                    style={styles.topBackBtn} 
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>Payment</Text>
                {(!isPending && !isPaid) ? (
                    <View style={styles.topStepBadge}>
                        <Text style={styles.topStepBadgeText}>Step {step} of 3</Text>
                    </View>
                ) : (
                    <View style={{ width: 34 }} />
                )}
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                
                {/* INVOICE SWITCHER (if multiple unpaid invoices exist) */}
                {allCycles.length > 1 && (
                    <View style={styles.switcherSection}>
                        <Text style={styles.switcherLabel}>Select Bill to Pay</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcherScroll}>
                            {allCycles.map((c) => {
                                const isSel = billingCycle?.id === c.id;
                                const isCycPending = c.payment_status === 'pending_verification';
                                const isCycOverdue = !isCycPending && (c.payment_status === 'overdue' || (c.days_overdue && c.days_overdue > 0));
                                const cycDue = calculateCycleAmount(c, isCycOverdue ? 'overdue' : 'current');
                                return (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[styles.invoiceChip, isSel && styles.invoiceChipActive]}
                                        onPress={() => selectCycle(c)}
                                    >
                                        <Ionicons 
                                            name={isCycPending ? "time-outline" : (isCycOverdue ? "alert-circle" : "document-text")} 
                                            size={14} 
                                            color={isSel ? '#60A5FA' : (isCycPending ? '#F59E0B' : (isCycOverdue ? COLORS.danger : COLORS.textMuted))} 
                                            style={{ marginRight: 6 }} 
                                        />
                                        <Text style={[styles.invoiceChipText, isSel && styles.invoiceChipTextActive, isCycPending && !isSel && { color: '#F59E0B' }]}>
                                            {c.invoice_number || `INV-${c.id}`} {isCycPending ? '(Pending Review)' : `(₱${cycDue.toFixed(2)})`}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* Compact, Professional Invoice Summary Card */}
                <View style={styles.heroCard}>
                    {/* Header Row: Badge & Status */}
                    <View style={styles.heroHeaderRow}>
                        <View style={[
                            styles.targetBadge, 
                            isPending 
                                ? styles.targetBadgePending 
                                : (billType === 'overdue' ? styles.targetBadgeOverdue : styles.targetBadgeCurrent)
                        ]}>
                            <Ionicons 
                                name={isPending ? "time-outline" : (billType === 'overdue' ? "warning-outline" : "shield-checkmark-outline")} 
                                size={12} 
                                color={isPending ? '#F59E0B' : (billType === 'overdue' ? COLORS.danger : COLORS.success)} 
                            />
                            <Text style={[
                                styles.targetBadgeText, 
                                { color: isPending ? '#F59E0B' : (billType === 'overdue' ? COLORS.danger : COLORS.success) }
                            ]}>
                                {isPending ? 'Pending Review' : (billType === 'overdue' ? 'Overdue Invoice' : 'Current Bill')}
                            </Text>
                        </View>

                        <View style={[styles.statusPill, isPaid && styles.statusPillPaid, isPending && styles.statusPillPending, billType === 'overdue' && !isPaid && !isPending && styles.statusPillOverdue]}>
                            <Text style={[styles.statusPillText, isPaid && styles.statusPillTextPaid, isPending && styles.statusPillTextPending, billType === 'overdue' && !isPaid && !isPending && styles.statusPillTextOverdue]}>
                                Status: <Text style={styles.statusPillBold}>{formatStatus(billingCycle.payment_status)}</Text>
                            </Text>
                        </View>
                    </View>

                    {/* Middle: Invoice Number & Period */}
                    <View style={styles.heroMetaRow}>
                        <Text style={styles.targetInvoiceNumber} numberOfLines={1}>
                            Invoice #{billingCycle.invoice_number || invoiceNumber || billingCycle.id}
                        </Text>
                        {(billingCycle.cycle_start || billingCycle.start_date) && (billingCycle.cycle_end || billingCycle.end_date) && (
                            <Text style={styles.targetPeriod} numberOfLines={1}>
                                {formatDate(billingCycle.cycle_start || billingCycle.start_date)} – {formatDate(billingCycle.cycle_end || billingCycle.end_date)}
                            </Text>
                        )}
                    </View>

                    {/* Divider */}
                    <View style={styles.heroDivider} />

                    {/* Bottom: Amount to Pay */}
                    <View style={styles.heroAmountRow}>
                        <Text style={styles.heroTitle}>Amount to Pay</Text>
                        <Text style={styles.heroAmount}>₱{targetDue.toFixed(2)}</Text>
                    </View>
                </View>

                {(!isPending && !isPaid) && (
                    <View style={styles.wizardCard}>
                        {/* WIZARD PROGRESS */}
                        <View style={styles.wizardProgress}>
                            <View style={[styles.stepCircle, step >= 1 && styles.stepCircleActive, step > 1 && styles.stepCircleCompleted]}>
                                {step > 1 ? <Ionicons name="checkmark" size={13} color="#fff" /> : <Text style={[styles.stepText, step >= 1 && styles.stepTextActive]}>1</Text>}
                            </View>
                            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
                            <View style={[styles.stepCircle, step >= 2 && styles.stepCircleActive, step > 2 && styles.stepCircleCompleted]}>
                                {step > 2 ? <Ionicons name="checkmark" size={13} color="#fff" /> : <Text style={[styles.stepText, step >= 2 && styles.stepTextActive]}>2</Text>}
                            </View>
                            <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
                            <View style={[styles.stepCircle, step >= 3 && styles.stepCircleActive]}>
                                <Text style={[styles.stepText, step >= 3 && styles.stepTextActive]}>3</Text>
                            </View>
                        </View>

                        {/* STEP 1: Select Method */}
                        {step === 1 && (
                            <View>
                                <Text style={styles.stepTitle}>Select Payment Method</Text>
                                
                                <TouchableOpacity 
                                    style={[styles.methodBtn, paymentMethod === 'GCash' && styles.methodBtnGCashActive]} 
                                    onPress={() => setPaymentMethod('GCash')}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.methodIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                                        <Ionicons name="phone-portrait-outline" size={18} color="#3B82F6" />
                                    </View>
                                    <View style={styles.methodInfo}>
                                        <Text style={[styles.methodBtnText, paymentMethod === 'GCash' && styles.methodBtnTextGCash]}>GCash</Text>
                                        <Text style={styles.methodSubtext}>E-Wallet Instant Transfer</Text>
                                    </View>
                                    <View style={[styles.radioOuter, paymentMethod === 'GCash' && styles.radioOuterGCash]}>
                                        {paymentMethod === 'GCash' && <View style={[styles.radioInner, { backgroundColor: '#3B82F6' }]} />}
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.methodBtn, paymentMethod === 'Maya' && styles.methodBtnMayaActive]} 
                                    onPress={() => setPaymentMethod('Maya')}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.methodIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                                        <Ionicons name="card-outline" size={18} color="#10B981" />
                                    </View>
                                    <View style={styles.methodInfo}>
                                        <Text style={[styles.methodBtnText, paymentMethod === 'Maya' && styles.methodBtnTextMaya]}>Maya</Text>
                                        <Text style={styles.methodSubtext}>E-Wallet / Visa / Mastercard</Text>
                                    </View>
                                    <View style={[styles.radioOuter, paymentMethod === 'Maya' && styles.radioOuterMaya]}>
                                        {paymentMethod === 'Maya' && <View style={[styles.radioInner, { backgroundColor: '#10B981' }]} />}
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.methodBtn, paymentMethod === 'Cash' && styles.methodBtnCashActive]} 
                                    onPress={() => setPaymentMethod('Cash')}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.methodIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                                        <Ionicons name="cash-outline" size={18} color="#E2E8F0" />
                                    </View>
                                    <View style={styles.methodInfo}>
                                        <Text style={[styles.methodBtnText, paymentMethod === 'Cash' && styles.methodBtnTextCash]}>Cash / Hand-Over</Text>
                                        <Text style={styles.methodSubtext}>Direct to Landlord / Manager</Text>
                                    </View>
                                    <View style={[styles.radioOuter, paymentMethod === 'Cash' && styles.radioOuterCash]}>
                                        {paymentMethod === 'Cash' && <View style={[styles.radioInner, { backgroundColor: '#FFFFFF' }]} />}
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.wizardFooter}>
                                    <PremiumAnimatedButton 
                                        type="primary"
                                        title="Continue"
                                        onPress={() => setStep(2)}
                                        disabled={!paymentMethod}
                                    />
                                </View>
                            </View>
                        )}

                        {/* STEP 2: Instructions */}
                        {step === 2 && (
                            <View>
                                <Text style={styles.stepTitle}>Payment Instructions</Text>
                                
                                {paymentMethod === 'Cash' && (
                                    <View style={styles.cashInstructionsBox}>
                                        <View style={styles.cashIconWrap}>
                                            <Ionicons name="cash-outline" size={24} color="#10B981" />
                                        </View>
                                        <Text style={styles.instructionsTitle}>Cash Hand-Over</Text>
                                        <Text style={styles.instructionsText}>
                                            Please hand over your cash payment directly to the landlord or facility manager.
                                        </Text>
                                        <View style={styles.cashNoteBox}>
                                            <Ionicons name="information-circle-outline" size={14} color="#10B981" style={{ marginRight: 6 }} />
                                            <Text style={styles.cashNoteText}>
                                                After handing over cash, proceed to the next step to log your payment date.
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {(paymentMethod === 'GCash' || paymentMethod === 'Maya') && (
                                    <View style={styles.instructionsBox}>
                                        <View style={styles.accountCard}>
                                            <View style={styles.accountRow}>
                                                <Text style={styles.accountLabel}>{paymentMethod === 'GCash' ? 'GCash Name' : 'Maya Name'}</Text>
                                                <Text style={styles.accountValue} numberOfLines={1}>
                                                    {paymentMethod === 'GCash' ? landlordInfo.gcash_name : landlordInfo.maya_name}
                                                </Text>
                                            </View>
                                            <View style={styles.accountDivider} />
                                            <View style={styles.accountRow}>
                                                <Text style={styles.accountLabel}>{paymentMethod === 'GCash' ? 'GCash Number' : 'Maya Number'}</Text>
                                                <Text style={[styles.accountValue, styles.accountNumberHighlight]} numberOfLines={1}>
                                                    {paymentMethod === 'GCash' ? landlordInfo.gcash_number : landlordInfo.maya_number}
                                                </Text>
                                            </View>
                                        </View>
                                        
                                        {(paymentMethod === 'GCash' ? landlordInfo.gcash_qr : landlordInfo.maya_qr) ? (
                                            <View style={styles.qrContainer}>
                                                <Text style={styles.qrHeaderLabel}>SCAN LANDLORD QR CODE</Text>
                                                <View style={styles.qrImageFrame}>
                                                    <Image 
                                                        source={{ uri: paymentMethod === 'GCash' ? landlordInfo.gcash_qr : landlordInfo.maya_qr }} 
                                                        style={styles.qrImage} 
                                                        resizeMode="contain" 
                                                    />
                                                </View>
                                                <Text style={styles.qrSubtext}>InstaPay / QR Ph Compatible</Text>
                                            </View>
                                        ) : (
                                            <DynamicQRCode 
                                                invoiceNumber={billingCycle.invoice_number || billingCycle.id} 
                                                amount={targetDue} 
                                                method={paymentMethod} 
                                            />
                                        )}
                                    </View>
                                )}

                                <View style={styles.wizardFooter}>
                                    <PremiumAnimatedButton 
                                        type="secondary"
                                        title="Back"
                                        icon="back"
                                        onPress={() => setStep(1)}
                                    />
                                    <PremiumAnimatedButton 
                                        type="primary"
                                        title="Next"
                                        onPress={() => setStep(3)}
                                    />
                                </View>
                            </View>
                        )}

                        {/* STEP 3: Submission Form */}
                        {step === 3 && (
                            <View>
                                <Text style={styles.stepTitle}>Submit Payment Details</Text>

                                <View style={styles.formGroup}>
                                    <Text style={styles.inputLabel}>Date of Payment (YYYY-MM-DD)</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="calendar-outline" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                                        <TextInput 
                                            style={styles.inputField} 
                                            value={paymentDate}
                                            onChangeText={setPaymentDate}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor="#475569"
                                        />
                                    </View>
                                </View>

                                {paymentMethod !== 'Cash' && (
                                    <>
                                        <View style={styles.formGroup}>
                                            <Text style={styles.inputLabel}>Reference Number</Text>
                                            <View style={styles.inputWrapper}>
                                                <Ionicons name="receipt-outline" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                                                <TextInput 
                                                    style={styles.inputField} 
                                                    placeholder="e.g. 123456789"
                                                    placeholderTextColor="#475569"
                                                    value={referenceNumber}
                                                    onChangeText={setReferenceNumber}
                                                />
                                            </View>
                                        </View>

                                        <View style={styles.formGroup}>
                                            <Text style={styles.inputLabel}>Proof of Payment (Screenshot)</Text>
                                            <TouchableOpacity 
                                                style={[styles.uploadBox, proofUri && styles.uploadBoxUploaded]} 
                                                onPress={pickImage}
                                                activeOpacity={0.7}
                                            >
                                                <View style={styles.uploadIconCircle}>
                                                    <Ionicons 
                                                        name={proofUri ? "checkmark-circle" : "cloud-upload-outline"} 
                                                        size={18} 
                                                        color="#10B981" 
                                                    />
                                                </View>
                                                <View style={styles.uploadTextContainer}>
                                                    <Text style={styles.uploadPrimaryText}>
                                                        {proofUri ? 'Change Receipt Screenshot' : 'Select Receipt Image'}
                                                    </Text>
                                                    <Text style={styles.uploadSecondaryText}>
                                                        JPG, PNG, or PDF screenshot
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>

                                            {proofUri && proofBase64 !== 'fallback_no_image' && (
                                                <View style={styles.previewContainer}>
                                                    <Image source={{ uri: proofUri }} style={styles.previewImage} resizeMode="contain" />
                                                </View>
                                            )}
                                        </View>
                                    </>
                                )}

                                <View style={styles.wizardFooter}>
                                    <PremiumAnimatedButton 
                                        type="secondary"
                                        title="Back"
                                        icon="back"
                                        onPress={() => setStep(2)}
                                        disabled={submitting || verifying}
                                    />
                                    <PremiumAnimatedButton 
                                        type="primary"
                                        title="Submit Payment"
                                        icon="submit"
                                        onPress={handleSubmit}
                                        disabled={submitting || verifying}
                                        loading={submitting || verifying ? (verifying ? 'Checking...' : 'Submitting...') : false}
                                    />
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {isPending && (
                    <View style={styles.pendingBox}>
                        <Ionicons name="time-outline" size={32} color="#F59E0B" />
                        <Text style={styles.pendingText}>Your payment is currently under review by the landlord. We will notify you once verified.</Text>
                    </View>
                )}

                {isPaid && (
                    <View style={styles.paidBox}>
                        <Ionicons name="checkmark-circle-outline" size={32} color="#10B981" />
                        <Text style={styles.paidText}>This invoice has been fully paid and verified!</Text>
                        <TouchableOpacity 
                            style={styles.viewPdfBtn} 
                            onPress={() => router.push({ 
                                pathname: '/(tenant)/pdf-viewer', 
                                params: { id: billingCycle.id, invoice_number: billingCycle.invoice_number } 
                            })}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="document-text-outline" size={18} color="#042F2E" style={{ marginRight: 6 }} />
                            <Text style={styles.viewPdfBtnText}>View Invoice / Receipt (PDF)</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
