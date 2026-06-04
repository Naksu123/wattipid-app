import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
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
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 20;

    const fetchHistory = async (isRefresh = false) => {
        try {
            if (!user?.room_id) return;
            
            const currentOffset = isRefresh ? 0 : offset;
            const data = await getTenantBillingHistory(user.room_id, LIMIT, currentOffset);
            
            if (data.length < LIMIT) {
                setHasMore(false);
            }
            
            if (isRefresh) {
                setHistory(data);
                setOffset(LIMIT);
            } else {
                setHistory(prev => [...prev, ...data]);
                setOffset(prev => prev + LIMIT);
            }
        } catch (error) {
            console.error('Failed to fetch billing history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory(true);
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory(true);
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'paid': return { color: COLORS.success, bg: 'rgba(16, 185, 129, 0.15)', text: 'PAID' };
            case 'pending_verification': return { color: COLORS.warning, bg: 'rgba(245, 158, 11, 0.15)', text: 'PENDING' };
            case 'overdue': return { color: COLORS.danger, bg: 'rgba(239, 68, 68, 0.15)', text: 'OVERDUE' };
            case 'rejected': return { color: COLORS.danger, bg: 'rgba(239, 68, 68, 0.15)', text: 'REJECTED' };
            default: return { color: COLORS.textSecondary, bg: 'rgba(255, 255, 255, 0.1)', text: 'UNPAID' };
        }
    };

    const renderItem = ({ item }) => {
        const statusConfig = getStatusConfig(item.payment_status);
        const amount = parseFloat(item.grand_total || (item.electricity_charge + item.penalty_amount + item.monthly_rent)).toLocaleString('en-US', { minimumFractionDigits: 2 });
        const monthYear = new Date(item.cycle_end).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const consumption = parseFloat(item.total_kwh || 0).toFixed(2);
        const dueDate = item.due_date ? new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

        return (
            <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/(tenant)/pdf-viewer', params: { id: item.id } })}
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
                <Text style={styles.headerTitle}>Billing History</Text>
                <Text style={styles.headerSubtitle}>View and download your past statements of account. Tap any record to view its PDF.</Text>
            </View>

            <FlatList
                data={history}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                refreshing={refreshing}
                onRefresh={onRefresh}
                onEndReached={() => {
                    if (hasMore && !loading && !refreshing) {
                        fetchHistory(false);
                    }
                }}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="documents-outline" size={64} color={COLORS.textMuted} />
                        <Text style={styles.emptyText}>No billing history available yet.</Text>
                        <Text style={styles.emptySubText}>Once your landlord completes a billing cycle, it will appear here.</Text>
                    </View>
                }
                ListFooterComponent={
                    hasMore && history.length > 0 ? (
                        <ActivityIndicator style={{ margin: SPACING.xl }} color={COLORS.primary} />
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    loadingText: { color: COLORS.textMuted, marginTop: SPACING.md, fontSize: FONT_SIZE.md },
    
    header: { padding: SPACING.xl, paddingTop: SPACING.xl + 20, marginBottom: SPACING.sm },
    headerTitle: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.heavy, color: COLORS.textPrimary, marginBottom: 8 },
    headerSubtitle: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 20 },
    
    listContainer: { paddingHorizontal: SPACING.lg, paddingBottom: 100, gap: SPACING.md },
    card: { padding: SPACING.lg, marginBottom: SPACING.md },
    
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: SPACING.md },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    invoiceNumber: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, letterSpacing: 0.5 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
    statusText: { fontSize: 10, fontWeight: FONT_WEIGHT.heavy },
    
    cardBody: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.lg },
    infoCol: { flex: 1 },
    infoLabel: { fontSize: 10, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    infoValue: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
    
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', backgroundColor: 'rgba(255,255,255,0.03)', padding: SPACING.md, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    amountValue: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.heavy, color: COLORS.textPrimary },
    
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40 },
    emptyText: { marginTop: SPACING.lg, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, textAlign: 'center' },
    emptySubText: { marginTop: SPACING.sm, fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 }
});
