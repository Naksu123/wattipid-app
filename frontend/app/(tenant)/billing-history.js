import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getTenantBillingHistory } from '../../services/database';

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
            case 'paid': return { color: '#16A34A', bg: '#DCFCE7', text: 'PAID' };
            case 'pending_verification': return { color: '#F59E0B', bg: '#FEF3C7', text: 'PENDING' };
            case 'overdue': return { color: '#DC2626', bg: '#FEE2E2', text: 'OVERDUE' };
            case 'rejected': return { color: '#991B1B', bg: '#FECACA', text: 'REJECTED' };
            default: return { color: '#475569', bg: '#F1F5F9', text: 'UNPAID' };
        }
    };

    const renderItem = ({ item }) => {
        const statusConfig = getStatusConfig(item.payment_status);
        const amount = parseFloat(item.grand_total || (item.electricity_charge + item.penalty_amount)).toLocaleString('en-US', { minimumFractionDigits: 2 });
        const monthYear = new Date(item.cycle_end).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const consumption = parseFloat(item.total_kwh).toFixed(2);

        return (
            <TouchableOpacity 
                style={styles.card}
                onPress={() => router.push({ pathname: '/(tenant)/pdf-viewer', params: { id: item.id } })}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.invoiceNumber}>{item.invoice_number || `WT-2026${item.id}`}</Text>
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
                        <Text style={[styles.infoValue, { color: item.payment_status === 'overdue' ? '#DC2626' : '#475569' }]}>
                            {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.infoLabel}>Amount Due</Text>
                        <Text style={styles.amountValue}>₱{amount}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#16A34A" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Billing History</Text>
                <Text style={styles.headerSubtitle}>View and download past invoices</Text>
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
                        <Ionicons name="documents-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No billing history available.</Text>
                    </View>
                }
                ListFooterComponent={
                    hasMore && history.length > 0 ? (
                        <ActivityIndicator style={{ margin: 20 }} color="#16A34A" />
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    header: { padding: 24, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
    headerSubtitle: { fontSize: 14, color: '#64748B' },
    
    listContainer: { padding: 16, gap: 16 },
    card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 12 },
    invoiceNumber: { fontSize: 13, fontWeight: '700', color: '#334155' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    statusText: { fontSize: 11, fontWeight: '800' },
    
    cardBody: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    infoCol: { flex: 1 },
    infoLabel: { fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    infoValue: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
    
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8 },
    amountValue: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
    emptyText: { marginTop: 16, fontSize: 15, color: '#64748B' }
});
