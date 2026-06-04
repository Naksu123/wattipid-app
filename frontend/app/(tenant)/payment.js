import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { getAvailableBillingCycles } from '../../services/database';
import { submitPayment } from '../../services/paymentService';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../components/ui/GlassCard';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../../styles/theme';

export default function TenantPaymentScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [billingCycle, setBillingCycle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [proofUri, setProofUri] = useState(null);
    const [proofBase64, setProofBase64] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [referenceNumber, setReferenceNumber] = useState('');

    useEffect(() => {
        fetchBillingData();
    }, []);

    const fetchBillingData = async () => {
        try {
            if (!user?.room_id) {
                setError('No room assigned to your account.');
                setLoading(false);
                return;
            }
            const response = await getAvailableBillingCycles(user.room_id);
            const cycles = response?.data || response || [];
            
            if (cycles && cycles.length > 0) {
                // Find the most recent invoice that needs action
                let latestInvoice = cycles.find(c => c.status === 'completed' && ['unpaid', 'pending_verification', 'overdue'].includes(c.payment_status));
                if (!latestInvoice) {
                    latestInvoice = cycles.find(c => c.status === 'completed');
                }
                setBillingCycle(latestInvoice || null);
            }
        } catch (err) {
            console.warn('[TenantPayment] Failed to load billing data:', err);
            setError('Unable to load billing information.');
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        try {
            const ImagePicker = await import('expo-image-picker');
            const requestPermissions = ImagePicker.requestMediaLibraryPermissionsAsync || ImagePicker.default?.requestMediaLibraryPermissionsAsync;
            const launchLibrary = ImagePicker.launchImageLibraryAsync || ImagePicker.default?.launchImageLibraryAsync;

            if (typeof requestPermissions !== 'function') {
                throw new Error("ImagePicker functions unavailable in this environment.");
            }

            const { status } = await requestPermissions();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please allow access to your photo library to upload payment proof.');
                return;
            }

            let result = await launchLibrary({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets?.[0]) {
                setProofUri(result.assets[0].uri);
                setProofBase64(result.assets[0].base64);
            }
        } catch (err) {
            console.warn('[TenantPayment] Image picker error:', err);
            Alert.alert(
                'Image Picker Unavailable',
                'Image upload is not supported in this Expo Go build. Please enter your reference number manually below.',
                [{ text: 'OK' }]
            );
            setProofBase64('fallback_no_image');
        }
    };

    const handleSubmit = async () => {
        if (!proofBase64 && !proofUri && !referenceNumber) {
            Alert.alert('Error', 'Please attach a screenshot of your payment receipt or enter a reference number.');
            return;
        }

        if (proofBase64 === 'fallback_no_image' && !referenceNumber) {
             Alert.alert('Error', 'Reference number is required when not uploading an image.');
             return;
        }

        executeSubmit(referenceNumber || `REF-${Date.now()}`);
    };

    const executeSubmit = async (referenceNumber) => {
        setSubmitting(true);
        try {
            const proofUrl = proofBase64 === 'fallback_no_image' ? null : `data:image/jpeg;base64,${proofBase64}`;
            const totalAmount = parseFloat(billingCycle.total_cost || 0) + parseFloat(billingCycle.penalty_amount || 0);

            await submitPayment(
                billingCycle.id, 
                user.room_id, 
                totalAmount, 
                proofUrl, 
                referenceNumber
            );
            
            Alert.alert('Success', 'Payment submitted for verification!');
            setProofUri(null);
            setProofBase64(null);
            setReferenceNumber('');
            fetchBillingData();
        } catch (err) {
            console.warn('[TenantPayment] Submit error:', err);
            Alert.alert('Error', typeof err === 'string' ? err : (err?.message || 'Failed to submit payment.'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ color: COLORS.textMuted, marginTop: 12 }}>Loading billing info...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, styles.center]}>
                <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
                <Text style={{ color: COLORS.textMuted, marginTop: 12, textAlign: 'center', paddingHorizontal: 40 }}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => { setError(null); setLoading(true); fetchBillingData(); }}>
                    <Text style={{ color: COLORS.white, fontWeight: '700' }}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!billingCycle) {
        return (
            <View style={[styles.container, styles.center]}>
                <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.primary} />
                <Text style={{ color: COLORS.textMuted, marginTop: 12 }}>No pending invoices found.</Text>
            </View>
        );
    }

    const totalDue = parseFloat(billingCycle.total_cost || 0) + parseFloat(billingCycle.penalty_amount || 0);
    const isPending = billingCycle.payment_status === 'pending_verification';
    const isPaid = billingCycle.payment_status === 'paid';
    const isOverdue = billingCycle.payment_status === 'overdue';

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scroll}>
                
                <Text style={styles.headerTitle}>Payment Portal</Text>

                <GlassCard style={styles.invoiceCard}>
                    <View style={styles.invoiceHeader}>
                        <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.title}>Current Invoice</Text>
                    </View>
                    
                    <View style={styles.row}>
                        <Text style={styles.label}>Base Amount</Text>
                        <Text style={styles.value}>₱{parseFloat(billingCycle.total_cost || 0).toFixed(2)}</Text>
                    </View>
                    {parseFloat(billingCycle.penalty_amount || 0) > 0 && (
                        <View style={styles.row}>
                            <Text style={[styles.label, {color: COLORS.danger}]}>Overdue Penalty (2%)</Text>
                            <Text style={[styles.value, {color: COLORS.danger}]}>₱{parseFloat(billingCycle.penalty_amount).toFixed(2)}</Text>
                        </View>
                    )}
                    <View style={[styles.row, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total Due</Text>
                        <Text style={styles.totalValue}>₱{totalDue.toFixed(2)}</Text>
                    </View>

                    <View style={[styles.statusBox, isPaid && {backgroundColor: 'rgba(16, 185, 129, 0.15)'}, isPending && {backgroundColor: 'rgba(245, 158, 11, 0.15)'}]}>
                        <Text style={[styles.statusText, isPaid && {color: COLORS.success}, isPending && {color: COLORS.warning}]}>
                            Status: <Text style={{fontWeight: 'bold', textTransform: 'uppercase'}}>{billingCycle.payment_status || 'unpaid'}</Text>
                        </Text>
                    </View>

                    <TouchableOpacity 
                        style={styles.detailedBtn}
                        onPress={() => router.push('/(tenant)/billing')}
                    >
                        <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
                        <Text style={styles.detailedBtnText}>View Detailed Statement</Text>
                    </TouchableOpacity>
                </GlassCard>

                {(!isPending && !isPaid) && (
                    <GlassCard style={styles.uploadSection}>
                        <Text style={styles.uploadTitle}>Submit Payment Proof</Text>
                        
                        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                            <Ionicons name={proofUri ? "image-outline" : "cloud-upload-outline"} size={32} color={COLORS.primary} />
                            <Text style={styles.uploadText}>{proofUri ? 'Change Image' : 'Select Receipt Image'}</Text>
                        </TouchableOpacity>

                        {proofUri && proofBase64 !== 'fallback_no_image' && (
                            <Image source={{ uri: proofUri }} style={styles.previewImage} resizeMode="contain" />
                        )}

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Reference Number (Optional if image uploaded)</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="e.g. 123456789"
                                placeholderTextColor={COLORS.textMuted}
                                value={referenceNumber}
                                onChangeText={setReferenceNumber}
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.submitBtn, (!proofUri && !referenceNumber) && styles.submitBtnDisabled]} 
                            onPress={handleSubmit}
                            disabled={(!proofUri && !referenceNumber) || submitting}
                        >
                            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit for Verification</Text>}
                        </TouchableOpacity>
                    </GlassCard>
                )}

                {isPending && (
                    <GlassCard style={[styles.pendingBox, { borderColor: 'rgba(245, 158, 11, 0.3)', borderWidth: 1 }]}>
                        <Ionicons name="time-outline" size={48} color={COLORS.warning} />
                        <Text style={styles.pendingText}>Your payment is currently under review by the landlord. We will notify you once verified.</Text>
                    </GlassCard>
                )}

                {isPaid && (
                    <GlassCard style={[styles.paidBox, { borderColor: 'rgba(16, 185, 129, 0.3)', borderWidth: 1 }]}>
                        <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.success} />
                        <Text style={styles.paidText}>This invoice has been fully paid and verified!</Text>
                    </GlassCard>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: SPACING.lg, paddingBottom: 100, paddingTop: SPACING.xl },
    center: { justifyContent: 'center', alignItems: 'center' },
    
    headerTitle: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginBottom: SPACING.xl },

    invoiceCard: { padding: SPACING.lg, marginBottom: SPACING.lg },
    invoiceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.md },
    title: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
    
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    label: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
    value: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
    
    totalRow: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 8 },
    totalLabel: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
    totalValue: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.heavy, color: COLORS.primary },
    
    statusBox: { marginTop: SPACING.lg, padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md, alignItems: 'center' },
    statusText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, letterSpacing: 0.5 },
    
    detailedBtn: { marginTop: SPACING.md, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
    detailedBtnText: { color: COLORS.primary, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },

    uploadSection: { padding: SPACING.lg, marginTop: SPACING.sm },
    uploadTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginBottom: SPACING.lg },
    
    uploadBtn: { borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.4)', borderStyle: 'dashed', borderRadius: RADIUS.lg, padding: 24, alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.05)', marginBottom: SPACING.lg },
    uploadText: { marginTop: 8, color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold },
    
    previewImage: { width: '100%', height: 200, borderRadius: RADIUS.md, marginBottom: SPACING.lg, backgroundColor: 'rgba(0,0,0,0.2)' },
    
    inputContainer: { marginBottom: SPACING.xl },
    inputLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginBottom: 8 },
    input: { backgroundColor: 'rgba(255,255,255,0.05)', color: COLORS.textPrimary, padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    
    submitBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: RADIUS.md, alignItems: 'center' },
    submitBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.1)' },
    submitBtnText: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.md },
    
    pendingBox: { backgroundColor: 'rgba(245, 158, 11, 0.05)', padding: 24, borderRadius: RADIUS.xl, alignItems: 'center', marginTop: SPACING.md },
    pendingText: { color: COLORS.warning, textAlign: 'center', marginTop: 12, fontWeight: FONT_WEIGHT.medium, lineHeight: 22 },
    
    paidBox: { backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: 24, borderRadius: RADIUS.xl, alignItems: 'center', marginTop: SPACING.md },
    paidText: { color: COLORS.success, textAlign: 'center', marginTop: 12, fontWeight: FONT_WEIGHT.medium, lineHeight: 22 },

    retryBtn: { marginTop: 16, padding: 12, paddingHorizontal: 24, backgroundColor: COLORS.primary, borderRadius: RADIUS.md }
});
