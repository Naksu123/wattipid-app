import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCopilot, CopilotStep, walkthroughable } from 'react-native-copilot';
import { useTourAutoStart, useTourContext } from '@/contexts/TourContext';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { getAvailableBillingCycles, getBillingDetails } from '../../../services/database';
import GlassCard from '../../../components/ui/GlassCard';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../../../styles/theme';

const CopilotGlassCard = walkthroughable(GlassCard);
const CopilotView = walkthroughable(View);

// ─── Payment Screen Skeleton (Zero Blank Screen Flash) ─────────
const PaymentSkeleton = () => (
    <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Header Details Skeleton */}
            <GlassCard style={styles.headerDetails}>
                <View style={styles.headerItem}>
                    <View style={[styles.skeletonLine, { width: 80, height: 10, marginBottom: 8 }]} />
                    <View style={[styles.skeletonLine, { width: 110, height: 14 }]} />
                </View>
                <View style={styles.headerItem}>
                    <View style={[styles.skeletonLine, { width: 80, height: 10, marginBottom: 8 }]} />
                    <View style={[styles.skeletonLine, { width: 130, height: 14 }]} />
                </View>
            </GlassCard>

            {/* Amount Due Card Skeleton */}
            <GlassCard style={styles.amountDueCard} premium>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={[styles.skeletonLine, { width: 140, height: 12 }]} />
                    <View style={[styles.skeletonLine, { width: 60, height: 20, borderRadius: 10 }]} />
                </View>
                <View style={[styles.skeletonLine, { width: 120, height: 32, marginBottom: 16 }]} />
                <View style={[styles.skeletonLine, { width: 100, height: 12, marginBottom: 6 }]} />
                <View style={[styles.skeletonLine, { width: 150, height: 16, marginBottom: 20 }]} />
                <View style={[styles.skeletonLine, { width: '100%', height: 48, borderRadius: 12 }]} />
            </GlassCard>

            {/* Action Row Skeleton */}
            <View style={styles.actionRow}>
                <View style={[styles.actionBtn, { borderColor: 'rgba(255,255,255,0.06)' }]}>
                    <View style={[styles.skeletonLine, { width: 90, height: 14 }]} />
                </View>
                <View style={[styles.actionBtn, { borderColor: 'rgba(255,255,255,0.06)' }]}>
                    <View style={[styles.skeletonLine, { width: 70, height: 14 }]} />
                </View>
            </View>

            {/* Section Title Skeleton */}
            <View style={[styles.skeletonLine, { width: 130, height: 12, marginBottom: 12, marginLeft: 4 }]} />

            {/* Breakdown Card Skeleton */}
            <GlassCard style={[styles.breakdownContainer, { padding: 16 }]}>
                {[1, 2, 3].map((i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
                        <View style={[styles.skeletonLine, { width: 36, height: 36, borderRadius: 18, marginRight: 12 }]} />
                        <View style={{ flex: 1 }}>
                            <View style={[styles.skeletonLine, { width: 110, height: 14, marginBottom: 6 }]} />
                            <View style={[styles.skeletonLine, { width: 70, height: 10 }]} />
                        </View>
                        <View style={[styles.skeletonLine, { width: 60, height: 16 }]} />
                    </View>
                ))}
            </GlassCard>
        </ScrollView>
    </View>
);

export default function TenantBillingScreen() {
    const { user } = useAuth();
    const { showModal } = useModal();
    const router = useRouter();
    const [billingDetails, setBillingDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedSection, setExpandedSection] = useState('electricity');
    
    const reqSeqRef = useRef(0);
    const scrollViewRef = useRef(null);
    const { currentTourScreen } = useTourContext();

    useTourAutoStart('billing', true, scrollViewRef);

    // ─── 1. Instant Cache Restoration (Zero-Latency First Frame) ──
    useEffect(() => {
        let isMounted = true;
        const restoreCachedBilling = async () => {
            if (!user?.room_id) return;
            try {
                const cached = await AsyncStorage.getItem(`cached_billing_${user.room_id}`);
                if (cached && isMounted) {
                    const parsed = JSON.parse(cached);
                    if (parsed && (parsed.invoice_number || parsed.grand_total)) {
                        setBillingDetails(parsed);
                        setLoading(false); // Valid cached invoice found! Display immediately
                    }
                }
            } catch (err) {
                console.warn('[Billing] Cache restoration error:', err);
            }
        };
        restoreCachedBilling();
        return () => { isMounted = false; };
    }, [user?.room_id]);

    const hasBillingDetailsRef = useRef(false);
    useEffect(() => {
        hasBillingDetailsRef.current = !!billingDetails;
    }, [billingDetails]);

    // ─── 2. Authoritative Data Fetch & Background Revalidation ────
    const fetchBillingDetails = useCallback(async () => {
        if (!user?.room_id) {
            setLoading(false);
            return;
        }
        const currentSeq = ++reqSeqRef.current;
        try {
            // Only set loading true if there is no billing data in state/cache yet
            if (!hasBillingDetailsRef.current) {
                setLoading(true);
            }
            
            const cycles = await getAvailableBillingCycles(user.room_id);
            if (currentSeq !== reqSeqRef.current) return;

            if (cycles && cycles.length > 0) {
                const latestInvoiceSummary = cycles.find(c => c.status === 'completed') || cycles[0];
                if (latestInvoiceSummary) {
                    // Update state immediately with the summary record
                    setBillingDetails(latestInvoiceSummary);
                    setLoading(false);
                    await AsyncStorage.setItem(`cached_billing_${user.room_id}`, JSON.stringify(latestInvoiceSummary));

                    // Fetch full payment history in parallel
                    const fullDetails = await getBillingDetails(latestInvoiceSummary.invoice_number, latestInvoiceSummary.id, user.room_id);
                    if (currentSeq === reqSeqRef.current && fullDetails) {
                        setBillingDetails(fullDetails);
                        await AsyncStorage.setItem(`cached_billing_${user.room_id}`, JSON.stringify(fullDetails));
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch billing details:', error);
        } finally {
            if (currentSeq === reqSeqRef.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, [user?.room_id]);

    useEffect(() => {
        fetchBillingDetails();
    }, [fetchBillingDetails]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBillingDetails();
    };

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    // Default mock data when no statement is available yet (guarantees zero tour break)
    const effectiveDetails = billingDetails || {
        invoice_number: 'INV-' + (user?.room_id ? String(user.room_id).replace(/\s+/g, '') : '101') + '-001',
        cycle_start: new Date(Date.now() - 30 * 86400000).toISOString(),
        cycle_end: new Date().toISOString(),
        due_date: new Date(Date.now() + 3 * 86400000).toISOString(),
        payment_status: 'unpaid',
        previous_reading: 120.5,
        current_reading: 145.2,
        total_kwh: 24.7,
        rate_per_kwh: 12.50,
        monthly_rent: 0,
        electricity_charge: 308.75,
        previous_balance: 0,
        additional_charges: 0,
        discounts: 0,
        penalty_amount: 0,
        grand_total: 308.75
    };

    const {
        invoice_number,
        cycle_start,
        cycle_end,
        due_date,
        payment_status,
        previous_reading,
        current_reading,
        total_kwh,
        rate_per_kwh,
        monthly_rent,
        electricity_charge,
        previous_balance,
        additional_charges,
        discounts,
        penalty_amount,
        grand_total
    } = effectiveDetails;

    const getStatusStyle = (status) => {
        switch (status) {
            case 'paid': return { color: COLORS.success, bg: 'rgba(16, 185, 129, 0.15)', icon: 'checkmark-circle' };
            case 'pending_verification': return { color: COLORS.warning, bg: 'rgba(245, 158, 11, 0.15)', icon: 'time' };
            case 'overdue': return { color: COLORS.danger, bg: 'rgba(239, 68, 68, 0.15)', icon: 'warning' };
            case 'rejected': return { color: COLORS.danger, bg: 'rgba(239, 68, 68, 0.15)', icon: 'close-circle' };
            default: return { color: COLORS.textSecondary, bg: 'rgba(255, 255, 255, 0.1)', icon: 'alert-circle' };
        }
    };
    
    const safeStatus = payment_status || 'unpaid';
    const statusConfig = getStatusStyle(safeStatus);
    const computedGrandTotal = parseFloat(electricity_charge || 0) + parseFloat(penalty_amount || 0) + parseFloat(monthly_rent || 0) + parseFloat(previous_balance || 0) + parseFloat(additional_charges || 0) - parseFloat(discounts || 0);

    const formatStatus = (status) => {
        if (!status) return 'Unpaid';
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    let computedDueDate = due_date;
    if (!computedDueDate && cycle_end) {
        const dateObj = new Date(cycle_end);
        dateObj.setDate(dateObj.getDate() + 3);
        computedDueDate = dateObj;
    }

    return (
        <View style={styles.container}>
            <ScrollView 
                ref={scrollViewRef}
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={(e) => {
                    if (scrollViewRef.current) {
                        scrollViewRef.current._scrollY = e.nativeEvent.contentOffset.y;
                    }
                }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >


                
                {/* Step 1 of 4: Invoice Number & Billing Period */}
                <CopilotStep
                    text="This section shows your current invoice number and billing period."
                    order={15}
                    name="billing_invoice"
                >
                    <CopilotView>
                        <GlassCard style={styles.headerDetails}>
                            <View style={styles.headerItem}>
                                <Text style={styles.headerLabel}>Invoice Number</Text>
                                <Text style={styles.headerValue}>{invoice_number || 'N/A'}</Text>
                            </View>
                            <View style={styles.headerItem}>
                                <Text style={styles.headerLabel}>Billing Period</Text>
                                <Text style={styles.headerValue}>
                                    {cycle_start ? new Date(cycle_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'} - 
                                    {cycle_end ? new Date(cycle_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                </Text>
                            </View>
                        </GlassCard>
                    </CopilotView>
                </CopilotStep>

                {/* Step 2 of 4: Current Amount Due */}
                <CopilotStep
                    text="This section shows the amount currently due, the due date, and your payment status."
                    order={16}
                    name="billing_amountDue"
                >
                    <CopilotView>
                        <GlassCard style={styles.amountDueCard} premium>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs, width: '100%' }}>
                                <Text style={[styles.amountDueLabel, { marginBottom: 0 }]}>Current Amount Due</Text>
                                
                                <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0, marginRight: -4 }]}>
                                    <Ionicons name={statusConfig.icon} size={10} color={statusConfig.color} style={{ marginRight: 4 }} />
                                    <Text style={[styles.statusText, { color: statusConfig.color, fontSize: 9 }]} numberOfLines={1}>
                                        {formatStatus(safeStatus)}
                                    </Text>
                                </View>
                            </View>
                            
                            <Text style={[styles.amountDueValue, { marginBottom: SPACING.md }]}>
                                ₱{computedGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                            
                            <View style={[styles.dueRow, { marginTop: 8 }]}>
                                <View>
                                    <Text style={styles.dueLabel}>Due Date</Text>
                                    <Text style={styles.dueValue}>{computedDueDate ? new Date(computedDueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</Text>
                                </View>
                            </View>
                            
                            {safeStatus !== 'paid' && safeStatus !== 'pending_verification' && (
                                <TouchableOpacity 
                                    style={styles.payButton}
                                    onPress={() => router.push('/(tenant)/payment')}
                                >
                                    <Text style={styles.payButtonText}>Pay Now</Text>
                                </TouchableOpacity>
                            )}
                        </GlassCard>
                    </CopilotView>
                </CopilotStep>

                {/* Step 3 of 4: Billing History & View PDF */}
                <CopilotStep
                    text="Use Billing History to review previous bills and View PDF to open your billing document."
                    order={17}
                    name="billing_actions"
                >
                    <CopilotView style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tenant)/billing-history')}>
                            <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                            <Text style={styles.actionBtnText}>Billing History</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/(tenant)/pdf-viewer', params: { id: effectiveDetails.id || 1, invoice_number: effectiveDetails.invoice_number } })}>
                            <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
                            <Text style={styles.actionBtnText}>View PDF</Text>
                        </TouchableOpacity>
                    </CopilotView>
                </CopilotStep>

                <Text style={styles.sectionTitle}>Billing Breakdown</Text>
                
                {/* Step 4 of 4: Billing Breakdown */}
                <CopilotStep
                    text="This section provides a detailed breakdown of your bill and shows how the total amount due is calculated."
                    order={18}
                    name="billing_breakdown"
                >
                    <CopilotView>
                        <GlassCard style={styles.breakdownContainer}>
                    {parseFloat(monthly_rent || 0) > 0 && (
                        <View style={styles.accordionItem}>
                            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('rent')}>
                                <View style={[styles.accordionIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                                    <Ionicons name="home-outline" size={20} color="#3B82F6" />
                                </View>
                                <View style={styles.accordionTitleWrap}>
                                    <Text style={styles.accordionTitle}>Monthly Room Rent</Text>
                                    <Text style={styles.accordionSub}>Fixed monthly rental fee</Text>
                                </View>
                                <View style={styles.accordionRight}>
                                    <Text style={styles.accordionAmount}>₱{parseFloat(monthly_rent).toLocaleString('en-US', {minimumFractionDigits: 2})}</Text>
                                    <Ionicons name={expandedSection === 'rent' ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary} />
                                </View>
                            </TouchableOpacity>
                            {expandedSection === 'rent' && (
                                <View style={styles.accordionBody}>
                                    <Text style={styles.accordionDesc}>This is the standard monthly rental charge for your room as established in your contract.</Text>
                                </View>
                            )}
                        </View>
                    )}

                    <View style={styles.accordionItem}>
                        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('electricity')}>
                            <View style={[styles.accordionIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                                <Ionicons name="flash-outline" size={20} color="#F59E0B" />
                            </View>
                            <View style={styles.accordionTitleWrap}>
                                <Text style={styles.accordionTitle}>Electricity Charge</Text>
                                <Text style={styles.accordionSub}>Based on actual consumption</Text>
                            </View>
                            <View style={styles.accordionRight}>
                                <Text style={styles.accordionAmount}>₱{parseFloat(electricity_charge || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}</Text>
                                <Ionicons name={expandedSection === 'electricity' ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary} />
                            </View>
                        </TouchableOpacity>
                        {expandedSection === 'electricity' && (
                            <View style={styles.accordionBody}>
                                <Text style={styles.accordionDesc}>This charge is based on your actual electricity consumption measured by the Wattipid monitoring device.</Text>
                                
                                <View style={styles.meterBox}>
                                    <View style={styles.meterRow}>
                                        <Text style={styles.meterLabel}>Previous Reading</Text>
                                        <Text style={styles.meterValue}>{parseFloat(previous_reading || 0).toFixed(2)} kWh</Text>
                                    </View>
                                    <View style={styles.meterRow}>
                                        <Text style={styles.meterLabel}>Current Reading</Text>
                                        <Text style={styles.meterValue}>{(parseFloat(current_reading || 0) > 0 ? parseFloat(current_reading) : (parseFloat(previous_reading || 0) + parseFloat(total_kwh || 0))).toFixed(2)} kWh</Text>
                                    </View>
                                    <View style={styles.divider} />
                                    <View style={styles.meterRow}>
                                        <Text style={styles.meterLabel}>Total Consumption</Text>
                                        <Text style={[styles.meterValue, { color: COLORS.primary, fontWeight: '700' }]}>{parseFloat(total_kwh || 0).toFixed(2)} kWh</Text>
                                    </View>
                                    <View style={styles.meterRow}>
                                        <Text style={styles.meterLabel}>Rate Per kWh</Text>
                                        <Text style={styles.meterValue}>₱{parseFloat(rate_per_kwh || 12.50).toFixed(2)}</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    {parseFloat(previous_balance || 0) > 0 && (
                        <View style={styles.accordionItem}>
                            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('balance')}>
                                <View style={[styles.accordionIconWrap, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                                    <Ionicons name="time-outline" size={20} color="#8B5CF6" />
                                </View>
                                <View style={styles.accordionTitleWrap}>
                                    <Text style={styles.accordionTitle}>Previous Balance</Text>
                                    <Text style={styles.accordionSub}>Unpaid amounts from last month</Text>
                                </View>
                                <View style={styles.accordionRight}>
                                    <Text style={styles.accordionAmount}>₱{parseFloat(previous_balance).toLocaleString('en-US', {minimumFractionDigits: 2})}</Text>
                                    <Ionicons name={expandedSection === 'balance' ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary} />
                                </View>
                            </TouchableOpacity>
                            {expandedSection === 'balance' && (
                                <View style={styles.accordionBody}>
                                    <Text style={styles.accordionDesc}>This represents the total unpaid balance carried over from your previous billing statement.</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {parseFloat(penalty_amount || 0) > 0 && (
                        <View style={styles.accordionItem}>
                            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('penalty')}>
                                <View style={[styles.accordionIconWrap, { backgroundColor: 'rgba(225, 29, 72, 0.15)' }]}>
                                    <Ionicons name="alert-outline" size={20} color="#E11D48" />
                                </View>
                                <View style={styles.accordionTitleWrap}>
                                    <Text style={styles.accordionTitle}>Penalty Charges</Text>
                                    <Text style={[styles.accordionSub, { color: COLORS.danger }]}>Late payment fees</Text>
                                </View>
                                <View style={styles.accordionRight}>
                                    <Text style={[styles.accordionAmount, { color: COLORS.danger }]}>₱{parseFloat(penalty_amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</Text>
                                    <Ionicons name={expandedSection === 'penalty' ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary} />
                                </View>
                            </TouchableOpacity>
                            {expandedSection === 'penalty' && (
                                <View style={styles.accordionBody}>
                                    <Text style={styles.accordionDesc}>A standard late fee applied automatically due to failure to settle the account on or before the due date.</Text>
                                </View>
                            )}
                        </View>
                    )}
                    
                    {parseFloat(additional_charges || 0) > 0 && (
                        <View style={styles.accordionItem}>
                            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('additional')}>
                                <View style={[styles.accordionIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
                                    <Ionicons name="add-circle-outline" size={20} color={COLORS.textPrimary} />
                                </View>
                                <View style={styles.accordionTitleWrap}>
                                    <Text style={styles.accordionTitle}>Additional Charges</Text>
                                    <Text style={styles.accordionSub}>Other fees applied</Text>
                                </View>
                                <View style={styles.accordionRight}>
                                    <Text style={styles.accordionAmount}>₱{parseFloat(additional_charges).toLocaleString('en-US', {minimumFractionDigits: 2})}</Text>
                                    <Ionicons name={expandedSection === 'additional' ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {parseFloat(discounts || 0) > 0 && (
                        <View style={styles.accordionItem}>
                            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('discount')}>
                                <View style={[styles.accordionIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                                    <Ionicons name="pricetag-outline" size={20} color="#10B981" />
                                </View>
                                <View style={styles.accordionTitleWrap}>
                                    <Text style={styles.accordionTitle}>Discounts Applied</Text>
                                    <Text style={styles.accordionSub}>Deductions from total</Text>
                                </View>
                                <View style={styles.accordionRight}>
                                    <Text style={[styles.accordionAmount, { color: COLORS.success }]}>-₱{parseFloat(discounts).toLocaleString('en-US', {minimumFractionDigits: 2})}</Text>
                                    <Ionicons name={expandedSection === 'discount' ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                    
                    <View style={styles.totalComputationRow}>
                        <Text style={styles.totalComputationLabel}>Grand Total Due</Text>
                        <Text style={styles.totalComputationValue}>
                            ₱{computedGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                    </View>
                </GlassCard>
                </CopilotView>
                </CopilotStep>

                <Text style={styles.sectionTitle}>Important Notes</Text>
                <GlassCard style={styles.notesCard}>
                    <View style={styles.noteItem}>
                        <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.noteText}>Invoices are generated on the {cycle_start ? new Date(cycle_start).getDate() : '1st'} of each month.</Text>
                    </View>
                    <View style={styles.noteItem}>
                        <Ionicons name="warning-outline" size={16} color={COLORS.warning} />
                        <Text style={styles.noteText}>A penalty fee applies for payments made after the due date.</Text>
                    </View>
                    <View style={styles.noteItem}>
                        <Ionicons name="help-circle-outline" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.noteText}>Contact your landlord if you notice discrepancies in your reading.</Text>
                    </View>
                </GlassCard>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: SPACING.lg, paddingBottom: 120 },
    center: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, color: COLORS.textMuted, fontSize: FONT_SIZE.md },
    emptyText: { marginTop: 16, fontSize: FONT_SIZE.md, color: COLORS.textMuted, textAlign: 'center' },
    refreshButton: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: COLORS.primary, borderRadius: RADIUS.md },
    refreshButtonText: { color: COLORS.white, fontWeight: FONT_WEIGHT.bold },
    
    brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 10 },
    brandText: { marginLeft: 8, fontSize: 11, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary, letterSpacing: 0.5 },
    invoiceTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.heavy, color: COLORS.textPrimary, marginBottom: SPACING.lg, marginTop: SPACING.md },
    
    headerDetails: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md, marginBottom: SPACING.lg },
    headerItem: { flex: 1 },
    headerLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginBottom: 4 },
    headerValue: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
    
    amountDueCard: { padding: SPACING.xl, marginBottom: SPACING.lg },
    amountDueLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, letterSpacing: 1, marginBottom: 8 },
    amountDueValue: { color: COLORS.white, fontSize: 24, fontWeight: FONT_WEIGHT.heavy, marginBottom: SPACING.lg },
    dueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' },
    dueLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, marginBottom: 4 },
    dueValue: { color: COLORS.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full },
    statusText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
    payButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', marginTop: SPACING.xl },
    payButtonText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },

    actionRow: { flexDirection: 'row', gap: 12, marginBottom: SPACING.xl },
    actionBtn: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(16, 185, 129, 0.05)', paddingVertical: 14, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
    actionBtnText: { marginLeft: 8, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },

    sectionTitle: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary, letterSpacing: 1, marginTop: SPACING.xl, marginBottom: SPACING.sm, marginLeft: SPACING.xs },
    breakdownContainer: { padding: 0, overflow: 'hidden' },
    
    accordionItem: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)', paddingHorizontal: SPACING.lg },
    accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.lg },
    
    accordionIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
    accordionTitleWrap: { flex: 1 },
    
    accordionTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
    accordionSub: { fontSize: 13, color: COLORS.textSecondary },
    accordionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    accordionAmount: { fontSize: 17, fontWeight: '400', color: COLORS.textPrimary },
    
    accordionBody: { paddingBottom: SPACING.lg, paddingLeft: 56 },
    accordionDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, marginBottom: SPACING.md },
    
    meterBox: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: RADIUS.md, padding: SPACING.md, marginTop: 4 },
    meterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    meterLabel: { fontSize: 13, color: COLORS.textSecondary },
    meterValue: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 12 },
    
    totalComputationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, paddingVertical: SPACING.xl, backgroundColor: 'rgba(255,255,255,0.02)' },
    totalComputationLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
    totalComputationValue: { fontSize: 24, fontWeight: '300', color: COLORS.textPrimary },
    
    notesCard: { padding: SPACING.md, marginBottom: SPACING.xl },
    noteItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm, gap: 8 },
    noteText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
    skeletonLine: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 4,
    }
});
