import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Platform, BackHandler, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getTenantBillingHistory } from '../../services/database';
import GlassCard from '../../components/ui/GlassCard';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../../styles/theme';

export default function TenantBillingHistoryScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterYear, setFilterYear] = useState('All');

    const fetchHistory = async () => {
        try {
            if (!user?.room_id) return;
            
            // We fetch a large limit to allow local filtering
            const data = await getTenantBillingHistory(user.room_id, 100, 0);
            setHistory(data);
            setFilteredHistory(data);
        } catch (error) {
            console.error('Failed to fetch billing history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory();

        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            router.navigate('/(tenant)/billing');
            return true;
        });

        return () => backHandler.remove();
    }, []);

    useEffect(() => {
        let result = history;
        
        if (filterYear !== 'All') {
            result = result.filter(item => new Date(item.cycle_end).getFullYear().toString() === filterYear);
        }

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            result = result.filter(item => 
                (item.invoice_number && item.invoice_number.toLowerCase().includes(query)) ||
                (item.payment_method && item.payment_method.toLowerCase().includes(query)) ||
                (item.payment_status && item.payment_status.toLowerCase().includes(query))
            );
        }

        setFilteredHistory(result);
    }, [searchQuery, filterYear, history]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'paid': return { color: COLORS.success, bg: 'rgba(16, 185, 129, 0.15)', text: 'PAID' };
            case 'partially_paid': return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', text: 'PARTIAL' };
            case 'pending_verification': return { color: COLORS.warning, bg: 'rgba(245, 158, 11, 0.15)', text: 'PENDING' };
            case 'overdue': return { color: COLORS.danger, bg: 'rgba(239, 68, 68, 0.15)', text: 'OVERDUE' };
            case 'rejected': return { color: COLORS.danger, bg: 'rgba(239, 68, 68, 0.15)', text: 'REJECTED' };
            default: return { color: COLORS.textSecondary, bg: 'rgba(255, 255, 255, 0.1)', text: 'UNPAID' };
        }
    };

    // Extract unique years for filter
    const availableYears = ['All', ...Array.from(new Set(history.map(item => new Date(item.cycle_end).getFullYear().toString())))].sort((a,b) => b.localeCompare(a));

    const renderItem = ({ item }) => {
        const statusConfig = getStatusConfig(item.payment_status);
        const amount = parseFloat(item.grand_total || (item.electricity_charge + item.penalty_amount + item.monthly_rent)).toLocaleString('en-US', { minimumFractionDigits: 2 });
        const monthYear = new Date(item.cycle_end).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const consumption = parseFloat(item.total_kwh || 0).toFixed(2);
        
        let computedDueDate = item.due_date;
        if (!computedDueDate && item.cycle_end) {
            const dateObj = new Date(item.cycle_end);
            dateObj.setDate(dateObj.getDate() + 7);
            computedDueDate = dateObj;
        }
        const dueDate = computedDueDate ? new Date(computedDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

        const paymentMethod = item.payment_method ? item.payment_method.toUpperCase() : 'N/A';
        const verificationDate = item.verification_date ? new Date(item.verification_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
        const verifiedBy = item.verified_by_name || 'System';

        return (
            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/(tenant)/pdf-viewer', params: { id: item.id, invoice_number: item.invoice_number } })}
            >
                <GlassCard style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.headerLeft}>
                            <Ionicons name="document-text" size={16} color={COLORS.primary} style={{marginRight: 6}} />
                            <Text style={styles.invoiceNumber}>{item.invoice_number || `WT-2026${item.id}`}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.text}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.cardBody}>
                        <View style={styles.infoCol}>
                            <Text style={styles.infoLabel}>Billing Month</Text>
                            <Text style={styles.infoValue}>{monthYear}</Text>
                        </View>
                        <View style={styles.infoCol}>
                            <Text style={styles.infoLabel}>Consumption</Text>
                            <Text style={styles.infoValue}>{consumption} kWh</Text>
                        </View>
                    </View>

                    {item.payment_status === 'paid' && (
                        <View style={styles.paymentDetailsBox}>
                            <Text style={styles.paymentDetailsText}>Paid via {paymentMethod} • Verified on {verificationDate}</Text>
                            <Text style={styles.paymentDetailsSubText}>Verified by {verifiedBy}</Text>
                        </View>
                    )}
                    
                    <View style={styles.cardFooter}>
                        <View>
                            <Text style={styles.infoLabel}>Due Date</Text>
                            <Text style={[styles.infoValue, { color: item.payment_status === 'overdue' ? COLORS.danger : COLORS.textPrimary }]}>
                                {dueDate}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.infoLabel}>Amount Due</Text>
                            <Text style={[styles.amountValue, item.payment_status === 'overdue' && { color: COLORS.danger }]}>₱{amount}</Text>
                        </View>
                    </View>
                </GlassCard>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading history...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <TouchableOpacity onPress={() => router.navigate('/(tenant)/billing')} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Billing History</Text>
                </View>
                
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search invoice or method..."
                        placeholderTextColor={COLORS.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <View style={styles.filterContainer}>
                    {availableYears.map(year => (
                        <TouchableOpacity 
                            key={year} 
                            style={[styles.filterPill, filterYear === year && styles.filterPillActive]}
                            onPress={() => setFilterYear(year)}
                        >
                            <Text style={[styles.filterText, filterYear === year && styles.filterTextActive]}>{year}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <FlatList
                data={filteredHistory}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-outline" size={48} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>No billing records found.</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    loadingText: { color: COLORS.textMuted, marginTop: 12 },
    
    header: {
        padding: SPACING.lg,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    backButton: {
        marginRight: SPACING.sm,
        padding: 4,
    },
    headerTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: FONT_WEIGHT.bold,
        color: COLORS.textPrimary,
    },
    
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, height: 44, color: COLORS.textPrimary, fontSize: 14 },
    
    filterContainer: { flexDirection: 'row', gap: 8 },
    filterPill: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: RADIUS.xl, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    filterPillActive: { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: COLORS.primary },
    filterText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
    filterTextActive: { color: COLORS.primary },

    listContainer: { padding: SPACING.lg, paddingBottom: 100 },
    card: { padding: 16, marginBottom: 16, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    invoiceNumber: { fontSize: 15, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
    
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    
    cardBody: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    infoCol: { flex: 1 },
    infoLabel: { fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    infoValue: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
    
    paymentDetailsBox: { backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: 12, borderRadius: RADIUS.sm, marginBottom: 16 },
    paymentDetailsText: { fontSize: 12, color: COLORS.success, fontWeight: '600', marginBottom: 2 },
    paymentDetailsSubText: { fontSize: 11, color: COLORS.textMuted },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    amountValue: { fontSize: 20, fontWeight: FONT_WEIGHT.heavy, color: COLORS.primary },

    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    emptyText: { color: COLORS.textMuted, marginTop: 12, fontSize: 14 }
});
