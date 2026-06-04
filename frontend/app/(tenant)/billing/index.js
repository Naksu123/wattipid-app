import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { getAvailableBillingCycles } from '../../../services/database';

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
            
            // We use the same getAvailableBillingCycles but grab the latest completed invoice
            const cycles = await getAvailableBillingCycles(user.room_id);
            if (cycles && cycles.length > 0) {
                const latestInvoice = cycles.find(c => c.status === 'completed');
                if (latestInvoice) {
                    setBillingDetails(latestInvoice);
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#16A34A" />
                <Text style={styles.loadingText}>Loading Billing Details...</Text>
            </View>
        );
    }

    if (!billingDetails) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={64} color="#94A3B8" />
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

    // Status Styling
    const getStatusStyle = (status) => {
        switch (status) {
            case 'paid': return { color: '#16A34A', bg: '#DCFCE7', icon: 'checkmark-circle' };
            case 'pending_verification': return { color: '#F59E0B', bg: '#FEF3C7', icon: 'time' };
            case 'overdue': return { color: '#DC2626', bg: '#FEE2E2', icon: 'warning' };
            case 'rejected': return { color: '#991B1B', bg: '#FECACA', icon: 'close-circle' };
            default: return { color: '#475569', bg: '#F1F5F9', icon: 'alert-circle' };
        }
    };
    
    const statusConfig = getStatusStyle(payment_status);

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.brandRow}>
                    <Ionicons name="flash" size={24} color="#16A34A" />
                    <Text style={styles.brandText}>WATTIPID SMART ELECTRICITY MONITORING</Text>
                </View>
                <Text style={styles.invoiceTitle}>STATEMENT OF ACCOUNT</Text>
                <View style={styles.headerDetails}>
                    <View style={styles.headerItem}>
                        <Text style={styles.headerLabel}>Invoice Number</Text>
                        <Text style={styles.headerValue}>{invoice_number || 'N/A'}</Text>
                    </View>
                    <View style={styles.headerItem}>
                        <Text style={styles.headerLabel}>Billing Period</Text>
                        <Text style={styles.headerValue}>
                            {new Date(cycle_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - 
                            {new Date(cycle_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Current Amount Due Card */}
            <View style={styles.amountDueCard}>
                <Text style={styles.amountDueLabel}>CURRENT AMOUNT DUE</Text>
                <Text style={styles.amountDueValue}>
                    ₱{parseFloat(grand_total || (electricity_charge + penalty_amount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <View style={styles.dueRow}>
                    <View>
                        <Text style={styles.dueLabel}>Due Date</Text>
                        <Text style={styles.dueValue}>{new Date(due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                        <Ionicons name={statusConfig.icon} size={16} color={statusConfig.color} style={{ marginRight: 4 }} />
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                            {payment_status.replace('_', ' ').toUpperCase()}
                        </Text>
                    </View>
                </View>
                
                {payment_status !== 'paid' && payment_status !== 'pending_verification' && (
                    <TouchableOpacity 
                        style={styles.payButton}
                        onPress={() => router.push('/(tenant)/payment')}
                    >
                        <Text style={styles.payButtonText}>Pay Now</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tenant)/billing-history')}>
                    <Ionicons name="time-outline" size={20} color="#16A34A" />
                    <Text style={styles.actionBtnText}>Billing History</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/(tenant)/pdf-viewer', params: { id: billingDetails.id } })}>
                    <Ionicons name="document-text-outline" size={20} color="#16A34A" />
                    <Text style={styles.actionBtnText}>View PDF</Text>
                </TouchableOpacity>
            </View>

            {/* Bill Breakdown Accordion */}
            <View style={styles.breakdownContainer}>
                <Text style={styles.sectionTitle}>BILLING BREAKDOWN</Text>

                {/* Monthly Rent */}
                {parseFloat(monthly_rent) > 0 && (
                    <View style={styles.accordionItem}>
                        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('rent')}>
                            <View>
                                <Text style={styles.accordionTitle}>Monthly Room Rent</Text>
                                <Text style={styles.accordionSub}>Fixed monthly rental fee</Text>
                            </View>
                            <View style={styles.accordionRight}>
                                <Text style={styles.accordionAmount}>₱{parseFloat(monthly_rent).toLocaleString('en-US', {minimumFractionDigits: 2})}</Text>
                                <Ionicons name={expandedSection === 'rent' ? 'chevron-up' : 'chevron-down'} size={20} color="#94A3B8" />
                            </View>
                        </TouchableOpacity>
                        {expandedSection === 'rent' && (
                            <View style={styles.accordionBody}>
                                <Text style={styles.accordionDesc}>This is the standard monthly rental charge for your room as established in your contract.</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Electricity Charge */}
                <View style={styles.accordionItem}>
                    <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('electricity')}>
                        <View>
                            <Text style={styles.accordionTitle}>Electricity Charge</Text>
                            <Text style={styles.accordionSub}>Based on actual consumption</Text>
                        </View>
                        <View style={styles.accordionRight}>
                            <Text style={styles.accordionAmount}>₱{parseFloat(electricity_charge).toLocaleString('en-US', {minimumFractionDigits: 2})}</Text>
                            <Ionicons name={expandedSection === 'electricity' ? 'chevron-up' : 'chevron-down'} size={20} color="#94A3B8" />
                        </View>
                    </TouchableOpacity>
                    {expandedSection === 'electricity' && (
                        <View style={styles.accordionBody}>
                            <Text style={styles.accordionDesc}>This charge is based on your actual electricity consumption measured by the Wattipid monitoring device.</Text>
                            
                            <View style={styles.meterBox}>
                                <View style={styles.meterRow}>
                                    <Text style={styles.meterLabel}>Previous Reading</Text>
                                    <Text style={styles.meterValue}>{parseFloat(previous_reading || 0).toFixed(4)} kWh</Text>
                                </View>
                                <View style={styles.meterRow}>
                                    <Text style={styles.meterLabel}>Current Reading</Text>
                                    <Text style={styles.meterValue}>{parseFloat(current_reading || total_kwh).toFixed(4)} kWh</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.meterRow}>
                                    <Text style={styles.meterLabel}>Total Consumption</Text>
                                    <Text style={[styles.meterValue, { color: '#16A34A', fontWeight: '700' }]}>{parseFloat(total_kwh).toFixed(4)} kWh</Text>
                                </View>
                                <View style={styles.meterRow}>
                                    <Text style={styles.meterLabel}>Rate Per kWh</Text>
                                    <Text style={styles.meterValue}>₱{parseFloat(rate_per_kwh || 12.50).toFixed(2)}</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Previous Balance */}
                {parseFloat(previous_balance) > 0 && (
                    <View style={styles.accordionItem}>
                        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('balance')}>
                            <View>
                                <Text style={styles.accordionTitle}>Previous Balance</Text>
                                <Text style={styles.accordionSub}>Unpaid amounts from last month</Text>
                            </View>
                            <View style={styles.accordionRight}>
                                <Text style={styles.accordionAmount}>₱{parseFloat(previous_balance).toLocaleString('en-US', {minimumFractionDigits: 2})}</Text>
                                <Ionicons name={expandedSection === 'balance' ? 'chevron-up' : 'chevron-down'} size={20} color="#94A3B8" />
                            </View>
                        </TouchableOpacity>
                        {expandedSection === 'balance' && (
                            <View style={styles.accordionBody}>
                                <Text style={styles.accordionDesc}>This represents the total unpaid balance carried over from your previous billing statement.</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Penalties */}
                {parseFloat(penalty_amount) > 0 && (
                    <View style={styles.accordionItem}>
                        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('penalty')}>
                            <View>
                                <Text style={styles.accordionTitle}>Penalty Charges</Text>
                                <Text style={[styles.accordionSub, { color: '#DC2626' }]}>Late payment fees</Text>
                            </View>
                            <View style={styles.accordionRight}>
                                <Text style={[styles.accordionAmount, { color: '#DC2626' }]}>₱{parseFloat(penalty_amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</Text>
                                <Ionicons name={expandedSection === 'penalty' ? 'chevron-up' : 'chevron-down'} size={20} color="#94A3B8" />
                            </View>
                        </TouchableOpacity>
                        {expandedSection === 'penalty' && (
                            <View style={styles.accordionBody}>
                                <Text style={styles.accordionDesc}>A standard late fee applied automatically due to failure to settle the account on or before the due date.</Text>
                            </View>
                        )}
                    </View>
                )}
                
                {/* Additional Charges */}
                {parseFloat(additional_charges) > 0 && (
                    <View style={styles.accordionItem}>
                        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('additional')}>
                            <View>
                                <Text style={styles.accordionTitle}>Additional Charges</Text>
                                <Text style={styles.accordionSub}>Other fees applied</Text>
                            </View>
                            <View style={styles.accordionRight}>
                                <Text style={styles.accordionAmount}>₱{parseFloat(additional_charges).toLocaleString('en-US', {minimumFractionDigits: 2})}</Text>
                                <Ionicons name={expandedSection === 'additional' ? 'chevron-up' : 'chevron-down'} size={20} color="#94A3B8" />
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Discounts */}
                {parseFloat(discounts) > 0 && (
                    <View style={styles.accordionItem}>
                        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('discount')}>
                            <View>
                                <Text style={styles.accordionTitle}>Discounts Applied</Text>
                                <Text style={styles.accordionSub}>Deductions from total</Text>
                            </View>
                            <View style={styles.accordionRight}>
                                <Text style={[styles.accordionAmount, { color: '#16A34A' }]}>-₱{parseFloat(discounts).toLocaleString('en-US', {minimumFractionDigits: 2})}</Text>
                                <Ionicons name={expandedSection === 'discount' ? 'chevron-up' : 'chevron-down'} size={20} color="#94A3B8" />
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
                
                <View style={styles.totalComputationRow}>
                    <Text style={styles.totalComputationLabel}>GRAND TOTAL DUE</Text>
                    <Text style={styles.totalComputationValue}>
                        ₱{parseFloat(grand_total || (electricity_charge + penalty_amount)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                </View>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    loadingText: { marginTop: 16, color: '#64748B', fontSize: 16 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyText: { marginTop: 16, fontSize: 16, color: '#64748B', textAlign: 'center' },
    refreshButton: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#16A34A', borderRadius: 8 },
    refreshButtonText: { color: '#FFF', fontWeight: '600' },
    
    header: { padding: 24, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    brandText: { marginLeft: 8, fontSize: 11, fontWeight: '700', color: '#16A34A', letterSpacing: 0.5 },
    invoiceTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
    headerDetails: { flexDirection: 'row', justifyContent: 'space-between' },
    headerItem: { flex: 1 },
    headerLabel: { fontSize: 12, color: '#64748B', marginBottom: 4 },
    headerValue: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
    
    amountDueCard: { margin: 20, backgroundColor: '#1E293B', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10 },
    amountDueLabel: { color: '#94A3B8', fontSize: 13, fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
    amountDueValue: { color: '#FFF', fontSize: 40, fontWeight: '800', marginBottom: 20 },
    dueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    dueLabel: { color: '#94A3B8', fontSize: 12, marginBottom: 4 },
    dueValue: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusText: { fontSize: 12, fontWeight: '700' },
    payButton: { backgroundColor: '#22C55E', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
    payButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

    actionRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
    actionBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    actionBtnText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#1E293B' },

    breakdownContainer: { backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', padding: 20, paddingBottom: 40 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', letterSpacing: 1, marginBottom: 16 },
    
    accordionItem: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
    accordionTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
    accordionSub: { fontSize: 12, color: '#64748B' },
    accordionRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    accordionAmount: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
    
    accordionBody: { paddingBottom: 16, paddingRight: 16 },
    accordionDesc: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 12 },
    
    meterBox: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    meterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    meterLabel: { fontSize: 13, color: '#64748B' },
    meterValue: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
    divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 },
    
    totalComputationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 20, borderTopWidth: 2, borderTopColor: '#E2E8F0' },
    totalComputationLabel: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    totalComputationValue: { fontSize: 22, fontWeight: '800', color: '#DC2626' }
});
