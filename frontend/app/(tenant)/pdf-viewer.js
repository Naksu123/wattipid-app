import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { getBillingDetails } from '../../services/database';
import { generateCycleReport } from '../../services/pdfService';
import { useAuth } from '../../contexts/AuthContext';

export default function PDFViewerScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [pdfUri, setPdfUri] = useState(null);
    const [fileName, setFileName] = useState('');

    useEffect(() => {
        if (id) {
            loadAndGeneratePDF();
        } else {
            Alert.alert('Error', 'No billing record specified.');
            router.back();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, router]);

    const loadAndGeneratePDF = async () => {
        try {
            // 1. Fetch exact backend records
            const response = await getBillingDetails(null, id, user.room_id);
            if (!response || !response.success || !response.data) {
                throw new Error('Billing record not found');
            }
            
            const billingCycle = response.data;
            const startDate = new Date(billingCycle.cycle_start);
            const endDate = new Date(billingCycle.cycle_end);
            
            // 2. Pass strictly to pdfService which now uses backend values
            const result = await generateCycleReport({
                roomId: user.room_id,
                tenantName: user.name || 'Tenant',
                startDate,
                endDate,
                reportTitle: `Statement of Account`,
                isWeekly: false,
                billingCycle
            });
            
            setPdfUri(result.uri);
            setPdfUri(result.uri);
            // setFileName(result.fileName); // Not strictly needed but kept available
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            Alert.alert('Generation Failed', 'Could not generate the PDF statement.');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!pdfUri) return;
        try {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(pdfUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Share Billing Statement',
                    UTI: 'com.adobe.pdf'
                });
            } else {
                Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
            }
        } catch (error) {
            console.error('Sharing error:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen 
                options={{
                    headerTitle: 'Billing Statement PDF',
                    headerRight: () => (
                        <TouchableOpacity onPress={handleShare} disabled={!pdfUri} style={{ marginRight: 15 }}>
                            <Ionicons name="share-outline" size={24} color={pdfUri ? '#16A34A' : '#94A3B8'} />
                        </TouchableOpacity>
                    )
                }}
            />

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#16A34A" />
                    <Text style={styles.loadingText}>Generating secure PDF...</Text>
                </View>
            ) : pdfUri ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="document-text" size={80} color="#16A34A" />
                    <Text style={[styles.loadingText, { color: '#0F172A', fontWeight: 'bold' }]}>PDF Statement Ready</Text>
                    <Text style={{ textAlign: 'center', color: '#64748B', marginTop: 8, paddingHorizontal: 40 }}>
                        Your billing statement has been generated successfully. Tap the button below to view, save, or share it.
                    </Text>
                </View>
            ) : (
                <View style={styles.centerContainer}>
                    <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
                    <Text style={styles.errorText}>Failed to load PDF</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={loadAndGeneratePDF}>
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}
            
            {!loading && pdfUri && (
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.downloadBtn} onPress={handleShare}>
                        <Ionicons name="download-outline" size={20} color="#FFF" />
                        <Text style={styles.downloadBtnText}>Save / Share PDF</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, color: '#64748B', fontSize: 16 },
    errorText: { marginTop: 16, color: '#64748B', fontSize: 16, marginBottom: 20 },
    webview: { flex: 1, backgroundColor: 'transparent' },
    retryBtn: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#1E293B', borderRadius: 8 },
    retryBtnText: { color: '#FFF', fontWeight: '600' },
    
    footer: { padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    downloadBtn: { flexDirection: 'row', backgroundColor: '#16A34A', paddingVertical: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    downloadBtnText: { marginLeft: 8, color: '#FFF', fontSize: 16, fontWeight: '700' }
});
