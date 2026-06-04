import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { getAvailableBillingCycles } from '../../services/database';
import { submitPayment } from '../../services/paymentService';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

// NOTE: expo-image-picker is NOT imported at the top level.
// It is dynamically loaded only when the user taps "Select Receipt Image".
// This prevents the app from crashing on startup in Expo Go,
// which does not include the ExponentImagePicker native module.

export default function TenantPaymentScreen() {
    const { user } = useAuth();
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
            const cycles = await getAvailableBillingCycles(user.room_id);
            if (cycles && cycles.length > 0) {
                const latestInvoice = cycles.find(c => c.status === 'completed');
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
            
            // Handle different import structures depending on how metro bundled it
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
            // Enable manual fallback mode
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
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#16a34a" />
                <Text style={{ color: '#94a3b8', marginTop: 12 }}>Loading billing info...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                <Text style={{ color: '#64748b', marginTop: 12, textAlign: 'center', paddingHorizontal: 40 }}>{error}</Text>
                <TouchableOpacity style={{ marginTop: 16, padding: 12, backgroundColor: '#16a34a', borderRadius: 8 }} onPress={() => { setError(null); setLoading(true); fetchBillingData(); }}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!billingCycle) {
        return (
            <View style={styles.center}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#10b981" />
                <Text style={{ color: '#64748b', marginTop: 12 }}>No pending invoices found.</Text>
            </View>
        );
    }

    const totalDue = parseFloat(billingCycle.total_cost || 0) + parseFloat(billingCycle.penalty_amount || 0);
    const isPending = billingCycle.payment_status === 'pending_verification';
    const isPaid = billingCycle.payment_status === 'paid';

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={styles.invoiceCard}>
                <Text style={styles.title}>Current Invoice</Text>
                
                <View style={styles.row}>
                    <Text style={styles.label}>Base Amount:</Text>
                    <Text style={styles.value}>₱{parseFloat(billingCycle.total_cost || 0).toFixed(2)}</Text>
                </View>
                {parseFloat(billingCycle.penalty_amount || 0) > 0 && (
                    <View style={styles.row}>
                        <Text style={[styles.label, {color: '#ef4444'}]}>Overdue Penalty (2%):</Text>
                        <Text style={[styles.value, {color: '#ef4444'}]}>₱{parseFloat(billingCycle.penalty_amount).toFixed(2)}</Text>
                    </View>
                )}
                <View style={[styles.row, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Due:</Text>
                    <Text style={styles.totalValue}>₱{totalDue.toFixed(2)}</Text>
                </View>

                <View style={styles.statusBox}>
                    <Text style={styles.statusText}>Status: <Text style={{fontWeight: 'bold', textTransform: 'uppercase'}}>{billingCycle.payment_status || 'unpaid'}</Text></Text>
                </View>

                <TouchableOpacity 
                    style={{ marginTop: 16, backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                    onPress={() => router.push('/(tenant)/billing')}
                >
                    <Ionicons name="document-text-outline" size={18} color="#1E293B" />
                    <Text style={{ color: '#1E293B', fontWeight: '700', fontSize: 14 }}>View Detailed Statement</Text>
                </TouchableOpacity>
            </View>

            {(!isPending && !isPaid) && (
                <View style={styles.uploadSection}>
                    <Text style={styles.uploadTitle}>Submit Payment Proof</Text>
                    
                    <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                        <Ionicons name="cloud-upload-outline" size={32} color="#16a34a" />
                        <Text style={styles.uploadText}>{proofUri ? 'Change Image' : 'Select Receipt Image'}</Text>
                    </TouchableOpacity>

                    {proofUri && proofBase64 !== 'fallback_no_image' && (
                        <Image source={{ uri: proofUri }} style={styles.previewImage} resizeMode="contain" />
                    )}

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Reference Number (Optional if image uploaded):</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="e.g. 123456789"
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
                </View>
            )}

            {isPending && (
                <View style={styles.pendingBox}>
                    <Ionicons name="time-outline" size={48} color="#f59e0b" />
                    <Text style={styles.pendingText}>Your payment is currently under review by the landlord. We will notify you once verified.</Text>
                </View>
            )}

            {isPaid && (
                <View style={styles.paidBox}>
                    <Ionicons name="checkmark-circle-outline" size={48} color="#10b981" />
                    <Text style={styles.paidText}>This invoice has been fully paid and verified!</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    invoiceCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginBottom: 20 },
    title: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    label: { fontSize: 14, color: '#64748b' },
    value: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
    totalRow: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12, marginTop: 4 },
    totalLabel: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
    totalValue: { fontSize: 20, fontWeight: '900', color: '#16a34a' },
    statusBox: { marginTop: 16, padding: 8, backgroundColor: '#f1f5f9', borderRadius: 6, alignItems: 'center' },
    statusText: { fontSize: 12, color: '#475569' },
    uploadSection: { backgroundColor: '#fff', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    uploadTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
    uploadBtn: { borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', borderRadius: 12, padding: 24, alignItems: 'center', backgroundColor: '#f8fafc', marginBottom: 16 },
    uploadText: { marginTop: 8, color: '#16a34a', fontWeight: '600' },
    previewImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 16, backgroundColor: '#f1f5f9' },
    submitBtn: { backgroundColor: '#16a34a', padding: 16, borderRadius: 8, alignItems: 'center' },
    submitBtnDisabled: { backgroundColor: '#94a3b8' },
    submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    pendingBox: { backgroundColor: '#fffbeb', padding: 24, borderRadius: 12, alignItems: 'center', borderColor: '#fde68a', borderWidth: 1 },
    pendingText: { color: '#b45309', textAlign: 'center', marginTop: 12, fontWeight: '500', lineHeight: 20 },
    paidBox: { backgroundColor: '#ecfdf5', padding: 24, borderRadius: 12, alignItems: 'center', borderColor: '#a7f3d0', borderWidth: 1 },
    paidText: { color: '#047857', textAlign: 'center', marginTop: 12, fontWeight: '500', lineHeight: 20 },
});
