import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { getAvailableBillingCycles, getBillingDetails } from '../../../services/database';
import GlassCard from '../../../components/ui/GlassCard';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../../../styles/theme';

export default function TenantBillingScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [billingDetails, setBillingDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedSection, setExpandedSection] = useState('electricity');

    const fetchBillingDetails = async () => {
        try {
            if (!user?.room_id) {
                setLoading(false);
                return;
            }
            
            const cycles = await getAvailableBillingCycles(user.room_id);
            if (cycles && cycles.length > 0) {
                const latestInvoiceSummary = cycles.find(c => c.status === 'completed');
                if (latestInvoiceSummary) {
                    const fullDetails = await getBillingDetails(latestInvoiceSummary.invoice_number, latestInvoiceSummary.id, user.room_id);
                    if (fullDetails) {
                        setBillingDetails(fullDetails);
                    } else {
                        setBillingDetails(latestInvoiceSummary);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch billing details:', error);
            Alert.alert('Error', 'Could not load your billing details. Please try again later.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBillingDetails();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBillingDetails();
    };

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading Statement...</Text>
            </View>
        );
    }

    if (!billingDetails) {
        return (
            <View style={[styles.container, styles.center]}>
                <Ionicons name="receipt-outline" size={64} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>No billing records available.</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                    <Text style={styles.refreshButtonText}>Refresh</Text>
                </TouchableOpacity>
            </View>
        );
    }

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
    } = billingDetails;

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
    const computedGrandTotal = parseFloat(grand_total || (parseFloat(electricity_charge || 0) + parseFloat(penalty_amount || 0) + parseFloat(monthly_rent || 0) + parseFloat(previous_balance || 0) + parseFloat(additional_charges || 0) - parseFloat(discounts || 0)));

    let computedDueDate = due_date;
    if (!computedDueDate && cycle_end) {
        const dateObj = new Date(cycle_end);
        dateObj.setDate(dateObj.getDate() + 3);
        computedDueDate = dateObj;
    }

    return (
        <View style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >

                <Text style={styles.invoiceTitle}>Statement of Account</Text>
                
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

                <GlassCard style={styles.amountDueCard} premium>
                    <Text style={styles.amountDueLabel}>CURRENT AMOUNT DUE</Text>
                    <Text style={styles.amountDueValue}>
                        ₱{computedGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <View style={styles.dueRow}>
                        <View>
                            <Text style={styles.dueLabel}>Due Date</Text>
                            <Text style={styles.dueValue}>{computedDueDate ? new Date(computedDueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                            <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} style={{ marginRight: 4 }} />
                            <Text style={[styles.statusText, { color: statusConfig.color }]}>
                                {safeStatus.replace('_', ' ').toUpperCase()}
                            </Text>
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

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tenant)/billing-history')}>
                        <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                        <Text style={styles.actionBtnText}>Billing History</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/(tenant)/pdf-viewer', params: { id: billingDetails.id, invoice_number: billingDetails.invoice_number } })}>
                        <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
                        <Text style={styles.actionBtnText}>View PDF</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>BILLING BREAKDOWN</Text>
                
                <GlassCard style={styles.breakdownContainer}>
                    {parseFloat(monthly_rent || 0) > 0 && (
                        <View style={styles.accordionItem}>
                            <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('rent')}>
                                <View>
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
                            <View>
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
                                <View>
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
                                <View>
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
                                <View>
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
                                <View>
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
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: SPACING.lg, paddingBottom: 60 },
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
    dueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    dueLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs, marginBottom: 4 },
    dueValue: { color: COLORS.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full },
    statusText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },
    payButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', marginTop: SPACING.xl },
    payButtonText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },

    actionRow: { flexDirection: 'row', gap: 12, marginBottom: SPACING.xl },
    actionBtn: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(16, 185, 129, 0.05)', paddingVertical: 14, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
    actionBtnText: { marginLeft: 8, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },

    sectionTitle: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary, letterSpacing: 1, marginBottom: SPACING.sm, marginLeft: 4 },
    breakdownContainer: { padding: SPACING.md },
    
    accordionItem: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.md },
    accordionTitle: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginBottom: 2 },
    accordionSub: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
    accordionRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    accordionAmount: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
    
    accordionBody: { paddingBottom: SPACING.md },
    accordionDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, lineHeight: 20, marginBottom: SPACING.md },
    
    meterBox: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.sm, padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    meterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    meterLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
    meterValue: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 8 },
    
    totalComputationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    totalComputationLabel: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.heavy, color: COLORS.textPrimary },
    totalComputationValue: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.heavy, color: COLORS.danger }
});
