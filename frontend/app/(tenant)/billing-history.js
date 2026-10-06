import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    BackHandler,
    RefreshControl,
    ScrollView,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getTenantBillingHistory } from '../../services/database';
import GlassCard from '../../components/ui/GlassCard';
import { COLORS } from '../../styles/theme';
import styles from '../../styles/tenant/billing-history.styles';

// Enable LayoutAnimation on legacy Android architecture only; in New Architecture (Fabric) it is enabled by default
if (Platform.OS === 'android' && !global?.nativeFabricUIManager && UIManager?.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Skeleton Loading Component ──────────────────────────────
const BillingHistorySkeleton = () => (
    <View style={styles.container}>
        <View style={styles.header}>
            <View style={styles.headerTopRow}>
                <View style={styles.headerLeft}>
                    <View style={[styles.skeletonLine, { width: 40, height: 40, borderRadius: 20 }]} />
                    <View style={{ gap: 6 }}>
                        <View style={[styles.skeletonLine, { width: 140, height: 18 }]} />
                        <View style={[styles.skeletonLine, { width: 90, height: 12 }]} />
                    </View>
                </View>
                <View style={[styles.skeletonLine, { width: 38, height: 38, borderRadius: 19 }]} />
            </View>
            <View style={[styles.skeletonLine, { width: '100%', height: 42, borderRadius: 12, marginBottom: 12 }]} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
                {[80, 70, 75, 75].map((w, idx) => (
                    <View key={idx} style={[styles.skeletonLine, { width: w, height: 28, borderRadius: 14 }]} />
                ))}
            </View>
        </View>

        <View style={styles.listContainer}>
            {/* KPI Skeleton Row */}
            <View style={[styles.kpiRow, { marginBottom: 14 }]}>
                <View style={[styles.skeletonLine, { flex: 1, height: 74, borderRadius: 12 }]} />
                <View style={[styles.skeletonLine, { flex: 1, height: 74, borderRadius: 12 }]} />
            </View>

            {/* Invoices Skeletons */}
            {[1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={[styles.skeletonLine, { width: 120, height: 16 }]} />
                        <View style={[styles.skeletonLine, { width: 64, height: 22, borderRadius: 11 }]} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={[styles.skeletonLine, { width: 100, height: 24 }]} />
                        <View style={[styles.skeletonLine, { width: 90, height: 20, borderRadius: 8 }]} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                        <View style={[styles.skeletonLine, { flex: 1, height: 38, borderRadius: 8 }]} />
                        <View style={[styles.skeletonLine, { flex: 1, height: 38, borderRadius: 8 }]} />
                    </View>
                </View>
            ))}
        </View>
    </View>
);

export default function TenantBillingHistoryScreen() {
    const { user } = useAuth();
    const router = useRouter();

    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters and Search
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'paid' | 'pending' | 'overdue'
    const [filterYear, setFilterYear] = useState('All');
    const [sortMode, setSortMode] = useState('newest'); // 'newest' | 'oldest' | 'amount_desc' | 'amount_asc'
    const [expandedIds, setExpandedIds] = useState({});

    // ─── 1. Instant Cache Restoration ──────────────────────────
    useEffect(() => {
        let isMounted = true;
        const restoreCache = async () => {
            if (!user?.room_id) return;
            try {
                const cached = await AsyncStorage.getItem(`@cached_tenant_billing_hist_${user.room_id}`);
                if (cached && isMounted) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setHistory(parsed);
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.warn('[BillingHistory] Cache restore error:', err);
            }
        };
        restoreCache();
        return () => { isMounted = false; };
    }, [user?.room_id]);

    // ─── 2. Authoritative Data Fetch ───────────────────────────
    const fetchHistory = useCallback(async () => {
        try {
            if (!user?.room_id) return;
            const data = await getTenantBillingHistory(user.room_id, 100, 0);
            if (Array.isArray(data)) {
                setHistory(data);
                AsyncStorage.setItem(`@cached_tenant_billing_hist_${user.room_id}`, JSON.stringify(data)).catch(() => {});
            }
        } catch (error) {
            console.error('Failed to fetch billing history:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.room_id]);

    useEffect(() => {
        fetchHistory();

        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            router.navigate('/(tenant)/billing');
            return true;
        });

        return () => backHandler.remove();
    }, [fetchHistory, router]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    // Toggle card in-line breakdown drawer
    const toggleDetails = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIds((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    // Cycle through sort modes
    const cycleSortMode = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSortMode((current) => {
            if (current === 'newest') return 'oldest';
            if (current === 'oldest') return 'amount_desc';
            if (current === 'amount_desc') return 'amount_asc';
            return 'newest';
        });
    };

    const getSortModeLabel = () => {
        switch (sortMode) {
            case 'newest': return 'Newest First';
            case 'oldest': return 'Oldest First';
            case 'amount_desc': return 'Highest Amount';
            case 'amount_asc': return 'Lowest Amount';
            default: return 'Newest First';
        }
    };

    // Available Years
    const availableYears = useMemo(() => {
        const years = new Set(
            history
                .map((item) => {
                    const dateStr = item.cycle_end || item.due_date || item.created_at;
                    return dateStr ? new Date(dateStr).getFullYear().toString() : null;
                })
                .filter(Boolean)
        );
        return ['All', ...Array.from(years)].sort((a, b) => b.localeCompare(a));
    }, [history]);

    // Summary Counts
    const counts = useMemo(() => {
        let paid = 0;
        let pending = 0;
        let overdue = 0;

        history.forEach((item) => {
            const status = (item.payment_status || '').toLowerCase();
            if (status === 'paid') paid++;
            else if (status === 'pending_verification' || item.is_pending_verification) pending++;
            else if (status === 'overdue') overdue++;
        });

        return {
            all: history.length,
            paid,
            pending,
            overdue,
        };
    }, [history]);

    // Financial KPI Analytics (computed across all historical records)
    const kpiMetrics = useMemo(() => {
        let totalSettled = 0;
        let totalKwh = 0;
        let settledCount = 0;
        let pendingOrOverdueSum = 0;

        history.forEach((item) => {
            const total = parseFloat(
                item.grand_total ||
                (parseFloat(item.electricity_charge || 0) + parseFloat(item.penalty_amount || 0) + parseFloat(item.monthly_rent || 0)) ||
                0
            );
            const kwh = parseFloat(item.total_kwh || 0);
            totalKwh += kwh;

            const status = (item.payment_status || '').toLowerCase();
            if (status === 'paid') {
                totalSettled += parseFloat(item.amount_paid || total);
                settledCount++;
            } else if (status === 'overdue' || status === 'pending_verification') {
                pendingOrOverdueSum += total;
            }
        });

        const avgBill = settledCount > 0 ? totalSettled / settledCount : 0;

        return {
            totalSettled,
            totalKwh,
            settledCount,
            avgBill,
            pendingOrOverdueSum,
        };
    }, [history]);

    // Filter & Sort Pipeline
    const filteredHistory = useMemo(() => {
        let result = [...history];

        // 1. Year filter
        if (filterYear !== 'All') {
            result = result.filter((item) => {
                const dateStr = item.cycle_end || item.due_date || item.created_at;
                return dateStr && new Date(dateStr).getFullYear().toString() === filterYear;
            });
        }

        // 2. Status filter
        if (statusFilter !== 'all') {
            result = result.filter((item) => {
                const status = (item.payment_status || '').toLowerCase();
                if (statusFilter === 'pending') {
                    return status === 'pending_verification' || item.is_pending_verification;
                }
                return status === statusFilter;
            });
        }

        // 3. Search Query
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter((item) => {
                const invoice = (item.invoice_number || `WT-2026${item.id}`).toLowerCase();
                const method = (item.payment_method || '').toLowerCase();
                const status = (item.payment_status || '').toLowerCase();
                const monthName = item.cycle_end ? new Date(item.cycle_end).toLocaleDateString('en-US', { month: 'long' }).toLowerCase() : '';
                return invoice.includes(query) || method.includes(query) || status.includes(query) || monthName.includes(query);
            });
        }

        // 4. Sort
        result.sort((a, b) => {
            const dateA = new Date(a.cycle_end || a.due_date || a.created_at || 0).getTime();
            const dateB = new Date(b.cycle_end || b.due_date || b.created_at || 0).getTime();
            const amountA = parseFloat(a.grand_total || (parseFloat(a.electricity_charge || 0) + parseFloat(a.monthly_rent || 0)));
            const amountB = parseFloat(b.grand_total || (parseFloat(b.electricity_charge || 0) + parseFloat(b.monthly_rent || 0)));

            switch (sortMode) {
                case 'oldest': return dateA - dateB;
                case 'amount_desc': return amountB - amountA;
                case 'amount_asc': return amountA - amountB;
                case 'newest':
                default:
                    return dateB - dateA;
            }
        });

        return result;
    }, [history, filterYear, statusFilter, searchQuery, sortMode]);

    const getStatusConfig = (status, isPendingVerification) => {
        if (isPendingVerification) {
            return {
                color: '#F59E0B',
                bg: 'rgba(245, 158, 11, 0.15)',
                text: 'PENDING',
                icon: 'time-outline',
            };
        }
        switch ((status || '').toLowerCase()) {
            case 'paid':
                return { color: COLORS.success, bg: 'rgba(16, 185, 129, 0.15)', text: 'PAID', icon: 'checkmark-circle-outline' };
            case 'partially_paid':
                return { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', text: 'PARTIAL', icon: 'pie-chart-outline' };
            case 'pending_verification':
                return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', text: 'PENDING', icon: 'hourglass-outline' };
            case 'overdue':
                return { color: COLORS.danger, bg: 'rgba(239, 68, 68, 0.15)', text: 'OVERDUE', icon: 'alert-circle-outline' };
            case 'rejected':
                return { color: COLORS.danger, bg: 'rgba(239, 68, 68, 0.15)', text: 'REJECTED', icon: 'close-circle-outline' };
            default:
                return { color: COLORS.textSecondary, bg: 'rgba(255, 255, 255, 0.08)', text: 'UNPAID', icon: 'card-outline' };
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const resetFilters = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSearchQuery('');
        setStatusFilter('all');
        setFilterYear('All');
        setSortMode('newest');
    };

    // ─── Render Each Invoice Card ──────────────────────────────
    const renderItem = ({ item }) => {
        const isPending = item.payment_status === 'pending_verification' || item.is_pending_verification;
        const isOverdue = item.payment_status === 'overdue';
        const isPaid = item.payment_status === 'paid';
        const isExpanded = !!expandedIds[item.id];
        const statusConfig = getStatusConfig(item.payment_status, isPending);

        const totalAmount = parseFloat(
            item.grand_total ||
            (parseFloat(item.electricity_charge || 0) + parseFloat(item.penalty_amount || 0) + parseFloat(item.monthly_rent || 0))
        );
        const formattedAmount = totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const consumption = parseFloat(item.total_kwh || 0).toFixed(2);
        const ratePerKwh = parseFloat(item.rate_per_kwh || 12.50).toFixed(2);

        // Cycle Period Text
        const cyclePeriod = item.cycle_start && item.cycle_end
            ? `${formatDate(item.cycle_start)} – ${formatDate(item.cycle_end)}`
            : (item.cycle_end ? formatDate(item.cycle_end) : 'Billing Cycle');

        // Due date resolution
        let computedDueDate = item.due_date;
        if (!computedDueDate && item.cycle_end) {
            const dateObj = new Date(item.cycle_end);
            dateObj.setDate(dateObj.getDate() + 3);
            computedDueDate = dateObj;
        }
        const dueDate = computedDueDate ? formatDate(computedDueDate) : 'N/A';

        // Payment Info
        const paymentMethod = item.payment_method ? item.payment_method.toUpperCase() : 'N/A';
        const verificationDate = item.verification_date ? formatDate(item.verification_date) : null;
        const verifiedBy = item.verified_by_name || 'Wattipid System';

        return (
            <GlassCard
                style={[
                    styles.card,
                    isOverdue && styles.cardOverdueBorder,
                    isPending && styles.cardPendingBorder,
                ]}
            >
                {/* 1. Header Row: Invoice Number, Period & Status Badge */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={styles.invoiceTagRow}>
                            <Ionicons name="document-text" size={15} color={isOverdue ? COLORS.danger : COLORS.primary} />
                            <Text style={styles.invoiceNumber} numberOfLines={1}>
                                {item.invoice_number || `WT-2026${item.id}`}
                            </Text>
                        </View>
                        <Text style={styles.cyclePeriodText} numberOfLines={1}>
                            {cyclePeriod}
                        </Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                        <Ionicons name={statusConfig.icon} size={11} color={statusConfig.color} />
                        <Text style={[styles.statusText, { color: statusConfig.color }]}>
                            {statusConfig.text}
                        </Text>
                    </View>
                </View>

                {/* 2. Main Content Box: Amount & Energy Metrics */}
                <View style={styles.cardContentBox}>
                    <View style={styles.amountCol}>
                        <Text style={styles.amountLabel}>
                            {isPaid ? 'Amount Settled' : (isPending ? 'Submitted Amount' : 'Total Payable')}
                        </Text>
                        <Text
                            style={[
                                styles.amountValue,
                                isOverdue && styles.amountValueOverdue,
                                isPending && styles.amountValuePending,
                            ]}
                        >
                            ₱{formattedAmount}
                        </Text>
                    </View>

                    <View style={styles.cardMetricsCol}>
                        <View style={styles.consumptionChip}>
                            <Ionicons name="flash" size={12} color={COLORS.primary} />
                            <Text style={styles.consumptionChipText}>{consumption} kWh</Text>
                        </View>
                        <Text style={styles.dateDueChip}>
                            {isPaid ? (verificationDate ? `Paid ${verificationDate}` : 'Settled') : `Due: ${dueDate}`}
                        </Text>
                    </View>
                </View>

                {/* 3. Payment Verified Banner (if Paid) */}
                {isPaid && (
                    <View style={styles.paymentDetailsBox}>
                        <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
                        <View style={styles.paymentDetailsTextBox}>
                            <Text style={styles.paymentDetailsText} numberOfLines={1}>
                                Paid via {paymentMethod} {verificationDate ? `• ${verificationDate}` : ''}
                            </Text>
                            <Text style={styles.paymentDetailsSubText} numberOfLines={1}>
                                Verified by {verifiedBy}
                            </Text>
                        </View>
                    </View>
                )}

                {/* 4. Payment Under Review Banner (if Pending) */}
                {isPending && (
                    <View style={[styles.paymentDetailsBox, { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.25)' }]}>
                        <Ionicons name="hourglass" size={16} color="#F59E0B" />
                        <View style={styles.paymentDetailsTextBox}>
                            <Text style={[styles.paymentDetailsText, { color: '#F59E0B' }]} numberOfLines={1}>
                                Payment of ₱{formattedAmount} under review
                            </Text>
                            <Text style={styles.paymentDetailsSubText} numberOfLines={1}>
                                Awaiting landlord verification
                            </Text>
                        </View>
                    </View>
                )}

                {/* 5. Rejection Notice (if Rejected) */}
                {item.payment_status === 'rejected' && (
                    <View style={styles.rejectionNoticeBox}>
                        <Ionicons name="alert-circle" size={15} color={COLORS.danger} />
                        <Text style={styles.rejectionNoticeText}>
                            {item.rejection_reason || 'Payment proof rejected by landlord. Please re-submit payment.'}
                        </Text>
                    </View>
                )}

                {/* 6. In-line Expandable Drawer */}
                {isExpanded && (
                    <View style={styles.breakdownDrawer}>
                        <Text style={styles.drawerHeader}>Itemized Statement Details</Text>

                        {/* Meter Readings */}
                        {(item.previous_reading || item.current_reading) && (
                            <View style={styles.meterReadingsBox}>
                                <View style={styles.meterReadingCol}>
                                    <Text style={styles.meterReadingLabel}>Prev Reading</Text>
                                    <Text style={styles.meterReadingVal}>{parseFloat(item.previous_reading || 0).toFixed(2)} kWh</Text>
                                </View>
                                <View style={[styles.meterReadingCol, { alignItems: 'flex-end' }]}>
                                    <Text style={styles.meterReadingLabel}>Current Reading</Text>
                                    <Text style={styles.meterReadingVal}>{parseFloat(item.current_reading || 0).toFixed(2)} kWh</Text>
                                </View>
                            </View>
                        )}

                        {/* Electricity Charge */}
                        <View style={styles.drawerItemRow}>
                            <Text style={styles.drawerItemLabel}>
                                Electricity ({consumption} kWh @ ₱{ratePerKwh})
                            </Text>
                            <Text style={styles.drawerItemValue}>
                                ₱{parseFloat(item.electricity_charge || item.total_cost || 0).toFixed(2)}
                            </Text>
                        </View>

                        {/* Monthly Room Rent */}
                        {parseFloat(item.monthly_rent || 0) > 0 && (
                            <View style={styles.drawerItemRow}>
                                <Text style={styles.drawerItemLabel}>Monthly Room Rent</Text>
                                <Text style={styles.drawerItemValue}>
                                    ₱{parseFloat(item.monthly_rent).toFixed(2)}
                                </Text>
                            </View>
                        )}

                        {/* Miscellaneous Fee */}
                        {parseFloat(item.miscellaneous_fee || 0) > 0 && (
                            <View style={styles.drawerItemRow}>
                                <Text style={styles.drawerItemLabel}>Miscellaneous / Hallway Fee</Text>
                                <Text style={styles.drawerItemValue}>
                                    ₱{parseFloat(item.miscellaneous_fee).toFixed(2)}
                                </Text>
                            </View>
                        )}

                        {/* Late Penalties */}
                        {parseFloat(item.penalty_amount || 0) > 0 && (
                            <View style={styles.drawerItemRow}>
                                <Text style={[styles.drawerItemLabel, { color: COLORS.danger }]}>Late Payment Penalty</Text>
                                <Text style={[styles.drawerItemValue, { color: COLORS.danger }]}>
                                    +₱{parseFloat(item.penalty_amount).toFixed(2)}
                                </Text>
                            </View>
                        )}

                        {/* Amount Paid to date */}
                        {parseFloat(item.amount_paid || 0) > 0 && (
                            <View style={styles.drawerItemRow}>
                                <Text style={[styles.drawerItemLabel, { color: COLORS.success }]}>Paid to Date</Text>
                                <Text style={[styles.drawerItemValue, { color: COLORS.success }]}>
                                    -₱{parseFloat(item.amount_paid).toFixed(2)}
                                </Text>
                            </View>
                        )}

                        <View style={styles.drawerSeparator} />

                        {/* Drawer Net Total */}
                        <View style={styles.drawerTotalRow}>
                            <Text style={styles.drawerTotalLabel}>Invoice Net Total</Text>
                            <Text style={styles.drawerTotalVal}>₱{formattedAmount}</Text>
                        </View>
                    </View>
                )}

                {/* 7. Action Footer: Breakdown Toggle, View PDF & Pay Now */}
                <View style={[styles.cardFooterRow, isExpanded && { marginTop: 12 }]}>
                    <TouchableOpacity
                        style={styles.detailsToggleBtn}
                        onPress={() => toggleDetails(item.id)}
                        activeOpacity={0.8}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={isExpanded ? 'Hide itemized breakdown' : 'View itemized breakdown'}
                    >
                        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.textSecondary} />
                        <Text style={styles.detailsToggleBtnText}>{isExpanded ? 'Hide' : 'Breakdown'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.viewPdfActionBtn}
                        onPress={() => router.push({
                            pathname: '/(tenant)/pdf-viewer',
                            params: { id: item.id, invoice_number: item.invoice_number || '' },
                        })}
                        activeOpacity={0.8}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`View official PDF statement for ${item.invoice_number || item.id}`}
                    >
                        <Ionicons name="document-text-outline" size={14} color={COLORS.primary} />
                        <Text style={styles.viewPdfActionBtnText}>View PDF</Text>
                    </TouchableOpacity>

                    {(isOverdue || item.payment_status === 'unpaid' || item.payment_status === 'rejected') && (
                        <TouchableOpacity
                            style={styles.payOverdueActionBtn}
                            onPress={() => router.push({
                                pathname: '/(tenant)/payment',
                                params: {
                                    cycleId: item.id,
                                    type: isOverdue ? 'overdue' : 'current',
                                    amount: totalAmount,
                                    invoiceNumber: item.invoice_number,
                                },
                            })}
                            activeOpacity={0.85}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel={`Pay statement ${item.invoice_number || item.id} amount ₱${formattedAmount}`}
                        >
                            <Ionicons name="card" size={14} color="#FFFFFF" />
                            <Text style={styles.payOverdueActionBtnText}>Pay Now</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </GlassCard>
        );
    };

    if (loading && (!history || history.length === 0)) {
        return <BillingHistorySkeleton />;
    }

    return (
        <View style={styles.container}>
            {/* ═══════════════════════════════════════════════════════════
                TOP HEADER & NAVIGATION
               ═══════════════════════════════════════════════════════════ */}
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity
                            onPress={() => router.navigate('/(tenant)/billing')}
                            style={styles.backButton}
                            activeOpacity={0.7}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel="Back to Billing Dashboard"
                        >
                            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <View style={styles.headerTextWrap}>
                            <Text style={styles.headerTitle}>Billing History</Text>
                            <Text style={styles.headerSubtitle}>
                                {user?.room_id ? `Room ${user.room_id}` : 'Tenant Statements'} • {history.length} records
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.headerActionBtn}
                        onPress={onRefresh}
                        activeOpacity={0.7}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="Refresh billing history"
                    >
                        <Ionicons name="refresh-outline" size={18} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={17} color={COLORS.textMuted} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search invoice number, month, or method..."
                        placeholderTextColor={COLORS.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                        autoCapitalize="none"
                        accessible={true}
                        accessibilityLabel="Search invoices input"
                    />
                    {searchQuery.trim().length > 0 && (
                        <TouchableOpacity
                            onPress={() => setSearchQuery('')}
                            style={styles.searchClearBtn}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel="Clear search input"
                        >
                            <Ionicons name="close-circle" size={17} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Status Filter Segment Pills */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.statusFilterScroll}
                    contentContainerStyle={styles.statusFilterRow}
                >
                    {[
                        { key: 'all', label: 'All', count: counts.all },
                        { key: 'paid', label: 'Paid', count: counts.paid },
                        { key: 'pending', label: 'Pending', count: counts.pending },
                        { key: 'overdue', label: 'Overdue', count: counts.overdue },
                    ].map((tab) => {
                        const isActive = statusFilter === tab.key;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.statusPill, isActive && styles.statusPillActive]}
                                onPress={() => {
                                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                    setStatusFilter(tab.key);
                                }}
                                activeOpacity={0.8}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityLabel={`Filter by ${tab.label}, ${tab.count} items`}
                                accessibilityState={{ selected: isActive }}
                            >
                                <Text style={[styles.statusPillText, isActive && styles.statusPillTextActive]}>
                                    {tab.label}
                                </Text>
                                <View style={[styles.statusPillBadge, isActive && styles.statusPillBadgeActive]}>
                                    <Text style={[styles.statusPillBadgeText, isActive && styles.statusPillBadgeTextActive]}>
                                        {tab.count}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Secondary Controls: Year Filter Pills & Sort Button */}
                <View style={styles.secondaryFilterRow}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.yearPillsScroll}
                        contentContainerStyle={styles.yearPillsRow}
                    >
                        {availableYears.map((year) => {
                            const isYearActive = filterYear === year;
                            return (
                                <TouchableOpacity
                                    key={year}
                                    style={[styles.yearPill, isYearActive && styles.yearPillActive]}
                                    onPress={() => {
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        setFilterYear(year);
                                    }}
                                    activeOpacity={0.7}
                                    accessible={true}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Filter by year ${year}`}
                                >
                                    <Text style={[styles.yearPillText, isYearActive && styles.yearPillTextActive]}>
                                        {year}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <TouchableOpacity
                        style={styles.sortBtn}
                        onPress={cycleSortMode}
                        activeOpacity={0.7}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Sort by: ${getSortModeLabel()}. Tap to switch.`}
                    >
                        <Ionicons name="swap-vertical" size={13} color={COLORS.primary} />
                        <Text style={styles.sortBtnText}>{getSortModeLabel()}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ═══════════════════════════════════════════════════════════
                STATEMENT HISTORY LIST WITH HERO KPI HEADER
               ═══════════════════════════════════════════════════════════ */}
            <FlatList
                data={filteredHistory}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                initialNumToRender={8}
                maxToRenderPerBatch={8}
                windowSize={5}
                removeClippedSubviews={Platform.OS !== 'web'}
                ListHeaderComponent={() => (
                    <View style={styles.kpiSection}>
                        {/* 2-Card KPI Row: Total Settled & Energy Usage */}
                        <View style={styles.kpiRow}>
                            <View style={styles.kpiCard}>
                                <View style={styles.kpiHeaderRow}>
                                    <Text style={styles.kpiLabel}>Total Settled</Text>
                                    <View style={[styles.kpiIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                                        <Ionicons name="checkmark-done" size={13} color={COLORS.success} />
                                    </View>
                                </View>
                                <Text style={styles.kpiValue} numberOfLines={1}>
                                    ₱{kpiMetrics.totalSettled.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Text>
                                <Text style={styles.kpiCaption}>
                                    {kpiMetrics.settledCount} statements paid
                                </Text>
                            </View>

                            <View style={styles.kpiCard}>
                                <View style={styles.kpiHeaderRow}>
                                    <Text style={styles.kpiLabel}>Total Energy</Text>
                                    <View style={[styles.kpiIconBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                                        <Ionicons name="flash" size={13} color="#3B82F6" />
                                    </View>
                                </View>
                                <Text style={styles.kpiValue} numberOfLines={1}>
                                    {kpiMetrics.totalKwh.toFixed(1)} kWh
                                </Text>
                                <Text style={styles.kpiCaption}>
                                    Avg ₱{kpiMetrics.avgBill.toFixed(2)}/cycle
                                </Text>
                            </View>
                        </View>

                        {/* Results Count indicator */}
                        <Text style={[styles.listResultsCount, { marginTop: 14 }]}>
                            Showing {filteredHistory.length} of {history.length} {filteredHistory.length === 1 ? 'statement' : 'statements'}
                            {statusFilter !== 'all' ? ` (${statusFilter.toUpperCase()})` : ''}
                            {filterYear !== 'All' ? ` in ${filterYear}` : ''}
                        </Text>
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconBox}>
                            <Ionicons name="document-text-outline" size={32} color={COLORS.textMuted} />
                        </View>
                        <Text style={styles.emptyTitle}>No Invoices Found</Text>
                        <Text style={styles.emptySubtitle}>
                            {searchQuery || statusFilter !== 'all' || filterYear !== 'All'
                                ? 'No billing statements match your current search or filter criteria.'
                                : 'You currently do not have any past billing statements recorded.'}
                        </Text>
                        {(searchQuery || statusFilter !== 'all' || filterYear !== 'All') && (
                            <TouchableOpacity
                                style={styles.emptyResetBtn}
                                onPress={resetFilters}
                                activeOpacity={0.8}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityLabel="Reset all filters and search"
                            >
                                <Ionicons name="refresh" size={14} color={COLORS.primary} />
                                <Text style={styles.emptyResetBtnText}>Reset Filters</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />
        </View>
    );
}
