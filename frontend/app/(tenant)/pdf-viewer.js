import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { getBillingDetails } from '../../services/database';
import { generateCycleReport } from '../../services/pdfService';
import { useAuth } from '../../contexts/AuthContext';
import GlassCard from '../../components/ui/GlassCard';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../../styles/theme';

export default function PDFViewerScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [pdfUri, setPdfUri] = useState(null);

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
            const billingCycle = await getBillingDetails(null, id, user.room_id);
            if (!billingCycle) {
                throw new Error('Billing record not found');
            }
            
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
                    headerStyle: {
                        backgroundColor: COLORS.background,
                    },
                    headerTintColor: COLORS.textPrimary,
                    headerShadowVisible: false,
                    headerRight: () => (
                        <TouchableOpacity onPress={handleShare} disabled={!pdfUri} style={{ marginRight: 15 }}>
                            <Ionicons name="share-outline" size={24} color={pdfUri ? COLORS.primary : COLORS.textMuted} />
                        </TouchableOpacity>
                    )
                }}
            />

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Generating secure PDF...</Text>
                </View>
            ) : pdfUri ? (
                <View style={styles.centerContainer}>
                    <GlassCard style={styles.successCard} premium>
                        <View style={styles.iconCircle}>
                            <Ionicons name="document-text" size={48} color={COLORS.primary} />
                        </View>
                        <Text style={styles.successTitle}>PDF Generated Successfully!</Text>
                        <Text style={styles.successDesc}>Your statement of account has been generated. Use the buttons below to open or save the file.</Text>
                        
                        <TouchableOpacity 
                            style={styles.primaryButton}
                            onPress={handleShare}
                        >
                            <Ionicons name="share-outline" size={20} color={COLORS.white} />
                            <Text style={styles.primaryButtonText}>Share / Save PDF</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.secondaryButton}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.secondaryButtonText}>Go Back</Text>
                        </TouchableOpacity>
                    </GlassCard>
                </View>
            ) : (
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={COLORS.danger} />
                    <Text style={styles.errorText}>Could not generate PDF</Text>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
                        <Text style={styles.secondaryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
    loadingText: { marginTop: SPACING.lg, fontSize: FONT_SIZE.md, color: COLORS.textMuted },
    
    successCard: { padding: SPACING.xxl, alignItems: 'center', width: '100%', maxWidth: 400 },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xl },
    successTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.heavy, color: COLORS.textPrimary, marginBottom: SPACING.sm, textAlign: 'center' },
    successDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xxl, lineHeight: 22 },
    
    primaryButton: { flexDirection: 'row', backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, paddingHorizontal: 24, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md },
    primaryButtonText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, marginLeft: 8 },
    
    secondaryButton: { backgroundColor: 'transparent', borderRadius: RADIUS.md, paddingVertical: 14, paddingHorizontal: 24, width: '100%', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    secondaryButtonText: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
    
    errorText: { marginTop: SPACING.lg, fontSize: FONT_SIZE.lg, color: COLORS.danger, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.xl }
});
