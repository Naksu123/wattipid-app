import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { getAvailableBillingCycles, getMultipleSettings } from '../../services/database';
import { submitPayment } from '../../services/paymentService';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import GlassCard from '../../components/ui/GlassCard';
import DynamicQRCode from '../../components/tenant/Billing/DynamicQRCode';
import { COLORS, SPACING } from '../../styles/theme';
import styles from '../../styles/tenant/payment.styles';

export default function TenantPaymentScreen() {
    const { user } = useAuth();
    const { showModal } = useModal();
    const router = useRouter();
    const [billingCycle, setBillingCycle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Wizard State
    const [step, setStep] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState(null); // 'Cash', 'GCash', 'Maya'
    const [referenceNumber, setReferenceNumber] = useState('');
    const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [proofUri, setProofUri] = useState(null);
    const [proofBase64, setProofBase64] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Landlord Settings
    const [landlordInfo, setLandlordInfo] = useState({});

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const fetchData = useCallback(async () => {
        try {
            if (!user?.room_id) {
                setError('No room assigned to your account.');
                setLoading(false);
                return;
            }
            
            // Fetch billing cycles
            const response = await getAvailableBillingCycles(user.room_id);
            const cycles = response?.data || response || [];
            
            if (cycles && cycles.length > 0) {
                // Find the OLDEST unpaid invoice to force chronological payments
                let unpaidInvoices = cycles.filter(c => c.status === 'completed' && 
                    ['unpaid', 'pending_verification', 'overdue', 'partially_paid'].includes(c.payment_status));
                let latestInvoice = unpaidInvoices.length > 0 ? unpaidInvoices[unpaidInvoices.length - 1] : null;
                if (!latestInvoice) {
                    latestInvoice = cycles.find(c => c.status === 'completed');
                }
                setBillingCycle(latestInvoice || null);
            }

            // Fetch landlord settings for payment methods in a single request
            const settings = await getMultipleSettings([
                'gcash_name', 'gcash_number', 'gcash_qr',
                'maya_name', 'maya_number', 'maya_qr'
            ]);
            
            setLandlordInfo({
                gcash_name: settings?.gcash_name || 'Not configured',
                gcash_number: settings?.gcash_number || 'Not configured',
                gcash_qr: settings?.gcash_qr || null,
                maya_name: settings?.maya_name || 'Not configured',
                maya_number: settings?.maya_number || 'Not configured',
                maya_qr: settings?.maya_qr || null
            });

        } catch (err) {
            console.warn('[TenantPayment] Failed to load data:', err);
            setError('Unable to load billing information.');
        } finally {
            setLoading(false);
        }
    }, [user?.room_id]);

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
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets?.[0]) {
                setProofUri(result.assets[0].uri);
                // ImagePicker provides raw base64 without prefix
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
                    // Store WITH prefix so we know it's already formatted
                    setProofBase64(`data:${mimeType};base64,${base64}`);
                }
            } catch (fallbackErr) {
                 console.warn('[TenantPayment] DocumentPicker Error:', fallbackErr);
                 showModal({ type: 'error', title: 'Error', message: 'Unable to open file picker. This device may not support file selection.' });
            }
        }
    };

    const [verifying, setVerifying] = useState(false);

    const verifyPaymentSuccess = async () => {
        try {
            const response = await getAvailableBillingCycles(user.room_id);
            const cycles = response?.data || response || [];
            const targetCycle = cycles.find(c => c.id === billingCycle.id);
            
            if (targetCycle && (targetCycle.payment_status === 'pending_verification' || targetCycle.payment_status === 'paid')) {
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    };

    const handleSubmit = async () => {
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
            let grandTotal = parseFloat(billingCycle.grand_total || 0);
            if (grandTotal === 0) {
                 grandTotal = parseFloat(billingCycle.electricity_charge || 0) + 
                              parseFloat(billingCycle.penalty_amount || 0) + 
                              parseFloat(billingCycle.monthly_rent || 0) + 
                              parseFloat(billingCycle.previous_balance || 0) + 
                              parseFloat(billingCycle.additional_charges || 0) - 
                              parseFloat(billingCycle.discounts || 0);
            }
            if (grandTotal === 0) grandTotal = parseFloat(billingCycle.total_cost || 0) + parseFloat(billingCycle.penalty_amount || 0);
            
            const remainingBalance = grandTotal - parseFloat(billingCycle.amount_paid || 0);
            const amountToPay = remainingBalance > 0 ? remainingBalance : grandTotal;

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
            fetchData();
        } catch (err) {
            const errorMsg = typeof err === 'string' ? err : (err?.message || 'Failed to submit payment.');
            
            // If it's a network/timeout error, verify before failing
            if (errorMsg.includes('connect') || errorMsg.includes('longer than expected') || errorMsg.includes('unavailable')) {
                console.warn('[TenantPayment] Connection unstable. Verifying if payment succeeded on backend...');
                setVerifying(true);
                
                // Wait briefly before verifying to allow backend to process
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

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading billing info...</Text>
            </View>
        );
    }

    if (error) {
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

    let grandTotal = parseFloat(billingCycle.grand_total || 0);
    if (grandTotal === 0) {
        grandTotal = parseFloat(billingCycle.electricity_charge || 0) + 
                     parseFloat(billingCycle.penalty_amount || 0) + 
                     parseFloat(billingCycle.monthly_rent || 0) + 
                     parseFloat(billingCycle.previous_balance || 0) + 
                     parseFloat(billingCycle.additional_charges || 0) - 
                     parseFloat(billingCycle.discounts || 0);
    }
    if (grandTotal === 0) grandTotal = parseFloat(billingCycle.total_cost || 0) + parseFloat(billingCycle.penalty_amount || 0);
    
    const amountPaid = parseFloat(billingCycle.amount_paid || 0);
    const totalDue = grandTotal - amountPaid;
    
    const isPending = billingCycle.payment_status === 'pending_verification';
    const isPaid = billingCycle.payment_status === 'paid';

    const formatStatus = (status) => {
        if (!status) return 'Unpaid';
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                
                {/* Hero Card for Amount Due */}
                <View style={styles.heroCard}>
                    <Text style={styles.heroTitle}>Remaining Balance</Text>
                    <Text style={styles.heroAmount}>₱{totalDue.toFixed(2)}</Text>
                    <View style={[styles.statusBox, isPaid && styles.statusBoxPaid, isPending && styles.statusBoxPending, { marginTop: 8 }]}>
                        <Text style={[styles.statusText, isPaid && styles.statusTextPaid, isPending && styles.statusTextPending]}>
                            Status: <Text style={styles.statusBold}>{formatStatus(billingCycle.payment_status)}</Text>
                        </Text>
                    </View>
                </View>

                {(!isPending && !isPaid) && (
                    <GlassCard style={styles.wizardCard}>
                        {/* WIZARD PROGRESS */}
                        <View style={styles.wizardProgress}>
                            <View style={[styles.stepCircle, step >= 1 && styles.stepCircleActive]}><Text style={styles.stepText}>1</Text></View>
                            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
                            <View style={[styles.stepCircle, step >= 2 && styles.stepCircleActive]}><Text style={styles.stepText}>2</Text></View>
                            <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
                            <View style={[styles.stepCircle, step >= 3 && styles.stepCircleActive]}><Text style={styles.stepText}>3</Text></View>
                        </View>

                        {/* STEP 1: Select Method */}
                        {step === 1 && (
                            <View>
                                <Text style={styles.stepTitle}>Select Payment Method</Text>
                                <TouchableOpacity style={[styles.methodBtn, paymentMethod === 'GCash' && styles.methodBtnGCashActive]} onPress={() => setPaymentMethod('GCash')}>
                                    <Ionicons name="phone-portrait-outline" size={24} color={paymentMethod === 'GCash' ? '#3B82F6' : COLORS.textMuted} />
                                    <Text style={[styles.methodBtnText, paymentMethod === 'GCash' && styles.methodBtnTextGCash]}>GCash</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.methodBtn, paymentMethod === 'Maya' && styles.methodBtnMayaActive]} onPress={() => setPaymentMethod('Maya')}>
                                    <Ionicons name="card-outline" size={24} color={paymentMethod === 'Maya' ? '#10B981' : COLORS.textMuted} />
                                    <Text style={[styles.methodBtnText, paymentMethod === 'Maya' && styles.methodBtnTextMaya]}>Maya</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.methodBtn, paymentMethod === 'Cash' && styles.methodBtnCashActive]} onPress={() => setPaymentMethod('Cash')}>
                                    <Ionicons name="cash-outline" size={24} color={paymentMethod === 'Cash' ? COLORS.textPrimary : COLORS.textMuted} />
                                    <Text style={[styles.methodBtnText, paymentMethod === 'Cash' && styles.methodBtnTextCash]}>Cash / Hand-Over</Text>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={[styles.nextBtn, !paymentMethod && styles.btnDisabled]} 
                                    onPress={() => setStep(2)}
                                    disabled={!paymentMethod}
                                >
                                    <Text style={styles.nextBtnText}>Continue</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* STEP 2: Instructions */}
                        {step === 2 && (
                            <View>
                                <Text style={styles.stepTitle}>Payment Instructions</Text>
                                
                                {paymentMethod === 'Cash' && (
                                    <View style={styles.instructionsBox}>
                                        <Ionicons name="cash-outline" size={48} color={COLORS.primary} style={styles.instructionsIcon} />
                                        <Text style={styles.instructionsText}>Please hand over your cash payment directly to the landlord or facility manager.</Text>
                                        <Text style={styles.instructionsText}>After handing over the cash, proceed to the next step to log your payment date for our records.</Text>
                                    </View>
                                )}

                                {paymentMethod === 'GCash' && (
                                    <View style={styles.instructionsBox}>
                                        <Text style={styles.accountLabel}>GCash Name</Text>
                                        <Text style={styles.accountValue}>{landlordInfo.gcash_name}</Text>
                                        
                                        <Text style={styles.accountLabel}>GCash Number</Text>
                                        <Text style={styles.accountValue}>{landlordInfo.gcash_number}</Text>
                                        
                                        {landlordInfo.gcash_qr ? (
                                            <View style={styles.qrContainer}>
                                                <Text style={styles.accountLabel}>Scan Landlord QR Code</Text>
                                                <Image source={{uri: landlordInfo.gcash_qr}} style={styles.qrImage} resizeMode="contain" />
                                            </View>
                                        ) : (
                                            <DynamicQRCode invoiceNumber={billingCycle.invoice_number || billingCycle.id} amount={totalDue} method="GCash" />
                                        )}
                                    </View>
                                )}

                                {paymentMethod === 'Maya' && (
                                    <View style={styles.instructionsBox}>
                                        <Text style={styles.accountLabel}>Maya Name</Text>
                                        <Text style={styles.accountValue}>{landlordInfo.maya_name}</Text>
                                        
                                        <Text style={styles.accountLabel}>Maya Number</Text>
                                        <Text style={styles.accountValue}>{landlordInfo.maya_number}</Text>
                                        
                                        {landlordInfo.maya_qr ? (
                                            <View style={styles.qrContainer}>
                                                <Text style={styles.accountLabel}>Scan Landlord QR Code</Text>
                                                <Image source={{uri: landlordInfo.maya_qr}} style={styles.qrImage} resizeMode="contain" />
                                            </View>
                                        ) : (
                                            <DynamicQRCode invoiceNumber={billingCycle.invoice_number || billingCycle.id} amount={totalDue} method="Maya" />
                                        )}
                                    </View>
                                )}

                                <View style={styles.wizardFooter}>
                                    <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                                        <Text style={styles.backBtnText}>Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(3)}>
                                        <Text style={styles.nextBtnText}>Next</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* STEP 3: Submission Form */}
                        {step === 3 && (
                            <View>
                                <Text style={styles.stepTitle}>Submit Payment Details</Text>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputLabel}>Date of Payment (YYYY-MM-DD)</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        value={paymentDate}
                                        onChangeText={setPaymentDate}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={COLORS.textMuted}
                                    />
                                </View>

                                {paymentMethod !== 'Cash' && (
                                    <>
                                        <View style={styles.inputContainer}>
                                            <Text style={styles.inputLabel}>Reference Number</Text>
                                            <TextInput 
                                                style={styles.input} 
                                                placeholder="e.g. 123456789"
                                                placeholderTextColor={COLORS.textMuted}
                                                value={referenceNumber}
                                                onChangeText={setReferenceNumber}
                                            />
                                        </View>

                                        <Text style={styles.inputLabel}>Proof of Payment (Screenshot)</Text>
                                        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                                            <Ionicons name={proofUri ? "image-outline" : "cloud-upload-outline"} size={32} color={COLORS.primary} />
                                            <Text style={styles.uploadText}>{proofUri ? 'Change Image' : 'Select Receipt Image'}</Text>
                                        </TouchableOpacity>

                                        {proofUri && proofBase64 !== 'fallback_no_image' && (
                                            <Image source={{ uri: proofUri }} style={styles.previewImage} resizeMode="contain" />
                                        )}
                                    </>
                                )}

                                <View style={styles.wizardFooter}>
                                    <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
                                        <Text style={styles.backBtnText}>Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.nextBtn, styles.submitBtn]} 
                                        onPress={handleSubmit}
                                        disabled={submitting || verifying}
                                    >
                                        {(submitting || verifying) ? (
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                                                <Text style={styles.submitBtnText}>
                                                    {verifying ? 'Checking payment status...' : 'Submitting...'}
                                                </Text>
                                            </View>
                                        ) : (
                                            <Text style={styles.submitBtnText}>Submit Payment</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </GlassCard>
                )}

                {isPending && (
                    <GlassCard style={styles.pendingBox}>
                        <Ionicons name="time-outline" size={48} color={COLORS.warning} />
                        <Text style={styles.pendingText}>Your payment is currently under review by the landlord. We will notify you once verified.</Text>
                    </GlassCard>
                )}

                {isPaid && (
                    <GlassCard style={styles.paidBox}>
                        <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.success} />
                        <Text style={styles.paidText}>This invoice has been fully paid and verified!</Text>
                    </GlassCard>
                )}
            </ScrollView>
        </View>
    );
}

