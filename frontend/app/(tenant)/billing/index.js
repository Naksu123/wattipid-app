import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, LayoutAnimation, Platform, UIManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CopilotStep, walkthroughable } from 'react-native-copilot';
import { useTourAutoStart } from '@/contexts/TourContext';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { getTenantBillingOverview } from '../../../services/database';
import GlassCard from '../../../components/ui/GlassCard';
import { COLORS, SPACING, RADIUS } from '../../../styles/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CopilotView = walkthroughable(View);

// ─── Payment Screen Skeleton (Zero Blank Screen Flash) ─────────
const PaymentSkeleton = () => (
    <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Header Brand Skeleton */}
            <View style={styles.brandRow}>
                <View style={[styles.skeletonLine, { width: 140, height: 26, borderRadius: 13 }]} />
                <View style={[styles.skeletonLine, { width: 90, height: 26, borderRadius: 13 }]} />
            </View>

            {/* Hero Card Skeleton */}
            <GlassCard style={styles.heroCard} premium>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <View style={[styles.skeletonLine, { width: 120, height: 14 }]} />
                    <View style={[styles.skeletonLine, { width: 70, height: 22, borderRadius: 11 }]} />
                </View>
                <View style={[styles.skeletonLine, { width: 100, height: 12, marginBottom: 8 }]} />
                <View style={[styles.skeletonLine, { width: 180, height: 38, marginBottom: 12 }]} />
                <View style={[styles.skeletonLine, { width: 140, height: 14, marginBottom: 20 }]} />
                <View style={[styles.skeletonLine, { width: '100%', height: 48, borderRadius: 12, marginBottom: 14 }]} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={[styles.skeletonLine, { flex: 1, height: 38, borderRadius: 10 }]} />
                    <View style={[styles.skeletonLine, { flex: 1, height: 38, borderRadius: 10 }]} />
                </View>
            </GlassCard>

            {/* Breakdown Skeleton */}
            <View style={[styles.skeletonLine, { width: 180, height: 14, marginVertical: 14, marginLeft: 4 }]} />
            <GlassCard style={styles.cardContainer}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: i < 5 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
                        <View style={[styles.skeletonLine, { width: 130, height: 14 }]} />
                        <View style={[styles.skeletonLine, { width: 70, height: 14 }]} />
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

    // Authoritative Overview State
    const [overviewData, setOverviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [expandedOverdueId, setExpandedOverdueId] = useState(null);
    const [breakdownPage, setBreakdownPage] = useState(1); // 1 = Statement Charges, 2 = Balance & Arrears
    const [overduePage, setOverduePage] = useState(1);
    const OVERDUE_PAGE_SIZE = 2;

    const reqSeqRef = useRef(0);
    const scrollViewRef = useRef(null);

    useTourAutoStart('billing', true, scrollViewRef);

    // ─── 1. Instant Cache Restoration (Zero-Latency First Frame) ──
    useEffect(() => {
        let isMounted = true;
        const restoreCache = async () => {
            if (!user?.room_id) return;
            try {
                const cached = await AsyncStorage.getItem(`cached_tenant_billing_overview_${user.room_id}`);
                if (cached && isMounted) {
                    const parsed = JSON.parse(cached);
                    if (parsed && (parsed.current_bill || parsed.total_outstanding || parsed.active_cycle || parsed.current_bill_state)) {
                        setOverviewData(parsed);
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.warn('[Billing] Cache restoration error:', err);
            }
        };
        restoreCache();
        return () => { isMounted = false; };
    }, [user?.room_id]);

    const hasDataRef = useRef(false);
    useEffect(() => {
        hasDataRef.current = !!overviewData;
    }, [overviewData]);

    // ─── 2. Authoritative Data Fetch (ISO/IEC 25010 Fault Tolerance) ───
    const fetchOverview = useCallback(async () => {
        if (!user?.room_id) {
            setLoading(false);
            return;
        }
        const currentSeq = ++reqSeqRef.current;
        setFetchError(false);
        try {
            if (!hasDataRef.current) {
                setLoading(true);
            }

            const response = await getTenantBillingOverview(user.room_id);
            if (currentSeq !== reqSeqRef.current) return;

            // Handle unwrapped vs wrapped responses from apiCall
            const overview = response?.data || response;
            if (overview && (overview.has_current_bill !== undefined || overview.current_bill_state || overview.total_outstanding)) {
                setOverviewData(overview);
                setFetchError(false);
                await AsyncStorage.setItem(`cached_tenant_billing_overview_${user.room_id}`, JSON.stringify(overview));
            }
        } catch (error) {
            console.error('Failed to fetch billing overview:', error);
            if (!hasDataRef.current) {
                setFetchError(true);
            }
        } finally {
            if (currentSeq === reqSeqRef.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, [user?.room_id]);

    useEffect(() => {
        fetchOverview();
    }, [fetchOverview]);

    useFocusEffect(
        useCallback(() => {
            fetchOverview();
        }, [fetchOverview])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchOverview();
    };

    const toggleBreakdown = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowBreakdown(!showBreakdown);
    };

    const toggleOverdueDetails = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedOverdueId(expandedOverdueId === id ? null : id);
    };

    // ─── Status Config Helper ─────────────────────────────────────
    const getStatusConfig = (status) => {
        switch (status) {
            case 'paid':
                return { color: COLORS.success, bg: 'rgba(16, 185, 129, 0.15)', icon: 'checkmark-circle', text: 'PAID' };
            case 'pending_verification':
                return { color: COLORS.warning, bg: 'rgba(245, 158, 11, 0.15)', icon: 'time', text: 'PENDING' };
            case 'overdue':
                return { color: COLORS.danger, bg: 'rgba(239, 68, 68, 0.15)', icon: 'alert-circle', text: 'OVERDUE' };
            case 'partially_paid':
                return { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', icon: 'pie-chart', text: 'PARTIAL' };
            default:
                return { color: COLORS.textSecondary, bg: 'rgba(255, 255, 255, 0.1)', icon: 'ellipse', text: 'UNPAID' };
        }
    };

    // ─── Render Skeleton while Initial Cache is Loading ───────────
    if (loading && !overviewData) {
        return <PaymentSkeleton />;
    }

    // ─── Render Error/Offline Recovery View (ISO/IEC 25010 Recoverability) ───
    if (fetchError && !overviewData) {
        return (
            <View style={styles.container}>
                <ScrollView
                    contentContainerStyle={[styles.scroll, styles.errorCenterContainer]}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
                >
                    <GlassCard style={styles.errorCard}>
                        <Ionicons name="cloud-offline-outline" size={44} color={COLORS.warning} style={{ marginBottom: 12 }} />
                        <Text style={styles.errorTitle}>Unable to Connect</Text>
                        <Text style={styles.errorSubtitle}>
                            We could not retrieve your current billing records. Please check your network connection or tap retry.
                        </Text>
                        <TouchableOpacity
                            style={styles.retryBtn}
                            onPress={fetchOverview}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel="Retry loading billing overview"
                        >
                            <Ionicons name="refresh" size={16} color="#FFFFFF" />
                            <Text style={styles.retryBtnText}>Retry Connection</Text>
                        </TouchableOpacity>
                    </GlassCard>
                </ScrollView>
            </View>
        );
    }

    const currentBill = overviewData?.current_bill;
    const activeCycle = overviewData?.active_cycle;
    const currentBillState = overviewData?.current_bill_state || (currentBill ? 'generated' : (activeCycle ? 'cycle_active' : 'none'));
    const overdueBills = overviewData?.overdue_bills || [];
    const paidBills = overviewData?.paid_bills || [];
    const totalOutstanding = overviewData?.total_outstanding || {
        current_bill_due: 0.00,
        previous_balance: 0.00,
        overdue_penalties: 0.00,
        total_overdue: 0.00,
        pending_verification: 0.00,
        grand_total: 0.00,
    };

    const hasCurrentBill = currentBillState === 'generated' && !!currentBill;
    const isCycleActive = currentBillState === 'cycle_active' && !!activeCycle;
    const hasOverdueBills = overdueBills.length > 0;
    const totalOverduePages = Math.ceil(overdueBills.length / OVERDUE_PAGE_SIZE);
    const paginatedOverdueBills = overdueBills.slice((overduePage - 1) * OVERDUE_PAGE_SIZE, overduePage * OVERDUE_PAGE_SIZE);
    const firstActionableOverdue = overdueBills.find(b => b.payment_status !== 'pending_verification' && !b.is_pending_verification);
    const hasPendingVerificationBills = overdueBills.some(b => b.payment_status === 'pending_verification' || b.is_pending_verification);

    // Precise Amount Calculations
    const currentCycleCost = parseFloat(currentBill?.current_cycle_cost || 0);
    const currentLatePenalty = parseFloat(currentBill?.penalty_amount || 0);
    const currentAmountDue = parseFloat(totalOutstanding?.current_bill_due || currentBill?.amount_due || 0);
    const previousBalance = parseFloat(totalOutstanding?.previous_balance || 0);
    const overduePenalties = parseFloat(totalOutstanding?.overdue_penalties || 0);
    const totalPenalties = overduePenalties + currentLatePenalty;
    const overdueBalance = parseFloat(totalOutstanding?.total_overdue || 0);
    const pendingVerification = parseFloat(totalOutstanding?.pending_verification || 0);
    const grandTotal = parseFloat(totalOutstanding?.grand_total || 0);

    // Hero Status Definition
    const isCurrentPaid = currentBill?.payment_status === 'paid';
    const isCurrentPending = currentBill?.payment_status === 'pending_verification';
    const isCurrentOverdue = currentBill?.payment_status === 'overdue';

    let displayStatus = 'unpaid';
    if (grandTotal === 0 && !hasPendingVerificationBills) {
        displayStatus = 'paid';
    } else if (hasPendingVerificationBills || isCurrentPending) {
        displayStatus = 'pending_verification';
    } else if (firstActionableOverdue || isCurrentOverdue) {
        displayStatus = 'overdue';
    } else if (hasCurrentBill) {
        displayStatus = currentBill.payment_status;
    }

    const heroStatusConfig = getStatusConfig(displayStatus);

    const formatDate = (dateStr, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', options);
        } catch {
            return dateStr;
        }
    };

    // Primary CTA Handler
    const handlePrimaryPayment = () => {
        if (firstActionableOverdue) {
            router.push({
                pathname: '/(tenant)/payment',
                params: {
                    cycleId: firstActionableOverdue.id,
                    type: 'overdue',
                    amount: firstActionableOverdue.total_overdue,
                    invoiceNumber: firstActionableOverdue.invoice_number,
                },
            });
        } else if (hasCurrentBill && !isCurrentPaid && !isCurrentPending) {
            router.push({
                pathname: '/(tenant)/payment',
                params: {
                    cycleId: currentBill.id,
                    type: 'current',
                    amount: currentBill.amount_due,
                    invoiceNumber: currentBill.invoice_number,
                },
            });
        }
    };

    const handleViewPdf = () => {
        const targetCycle = currentBill || (overdueBills.length > 0 ? overdueBills[0] : null) || (paidBills.length > 0 ? paidBills[0] : null);
        if (targetCycle) {
            router.push({
                pathname: '/(tenant)/pdf-viewer',
                params: {
                    id: targetCycle.id,
                    cycleId: targetCycle.id,
                    invoice_number: targetCycle.invoice_number || '',
                    invoiceNumber: targetCycle.invoice_number || '',
                },
            });
        } else {
            showModal({ type: 'info', title: 'Invoice PDF', message: 'No invoice statements available to view yet.' });
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >
                {/* ═══════════════════════════════════════════════════════════
                    TOP BRAND HEADER
                   ═══════════════════════════════════════════════════════════ */}
                <View style={styles.brandRow}>
                    <View style={styles.brandPill}>
                        <Ionicons name="shield-checkmark" size={13} color={COLORS.primary} />
                        <Text style={styles.brandPillText}>WATTIPID BILLING</Text>
                    </View>
                    <View style={styles.roomPill}>
                        <Ionicons name="home-outline" size={13} color={COLORS.textSecondary} />
                        <Text style={styles.roomPillText}>{user?.room_id ? `Room ${user.room_id}` : 'Assigned Room'}</Text>
                    </View>
                </View>

                {/* ═══════════════════════════════════════════════════════════
                    HERO CARD: STATUS, TOTAL OUTSTANDING & PRIMARY ACTION
                   ═══════════════════════════════════════════════════════════ */}
                <GlassCard style={styles.heroCard} premium>
                    {/* Top Row: Invoice Identifier & Status Badge (Step 19) */}
                    <CopilotStep
                        text="Shows your current statement identifier and authoritative payment status."
                        order={19}
                        name="payment_invoice"
                    >
                        <CopilotView style={styles.heroHeaderRow}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.heroInvoiceLabel}>
                                    {hasCurrentBill ? 'STATEMENT INVOICE' : (isCycleActive ? 'CYCLE RECORDING' : 'ACCOUNT STATUS')}
                                </Text>
                                <Text style={styles.heroInvoiceNumber} numberOfLines={1}>
                                    {hasCurrentBill ? currentBill.invoice_number || 'Current Statement' : (isCycleActive ? 'Live Meter Active' : 'No Current Dues')}
                                </Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: heroStatusConfig.bg }]}>
                                <Ionicons name={heroStatusConfig.icon} size={12} color={heroStatusConfig.color} style={{ marginRight: 4 }} />
                                <Text style={[styles.statusText, { color: heroStatusConfig.color }]}>
                                    {heroStatusConfig.text}
                                </Text>
                            </View>
                        </CopilotView>
                    </CopilotStep>

                    {/* Active Cycle Meter Banner if recording */}
                    {isCycleActive && !hasCurrentBill && (
                        <View style={styles.activeRecordingBanner}>
                            <View style={styles.pulseDot} />
                            <Text style={styles.activeRecordingText} numberOfLines={1}>
                                Submeter active: {formatDate(activeCycle.cycle_start)} – {formatDate(activeCycle.cycle_end)}
                            </Text>
                        </View>
                    )}

                    {/* Step 20: Amount Due & Primary Payment Button */}
                    <CopilotStep
                        text="Shows total outstanding balance and provides the direct action to submit a payment."
                        order={20}
                        name="payment_amount_due"
                    >
                        <CopilotView style={{ width: '100%' }}>
                            {/* Hero Amount Figure: Total Outstanding */}
                            <View style={styles.heroAmountBlock}>
                                <Text style={styles.heroAmountLabel}>Total Outstanding</Text>
                                <View style={styles.heroAmountRow}>
                                    <Text style={styles.currencySymbol}>₱</Text>
                                    <Text style={styles.heroAmountValue} numberOfLines={1}>
                                        {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>
                                </View>

                                {/* Dynamic Sub-caption / Due Date */}
                                {displayStatus === 'overdue' ? (
                                    <View style={styles.heroOverdueWarning}>
                                        <Ionicons name="alert-circle" size={13} color={COLORS.danger} />
                                        <Text style={styles.heroOverdueText}>
                                            Overdue balance requires immediate settlement
                                        </Text>
                                    </View>
                                ) : hasCurrentBill && currentBill.due_date ? (
                                    <Text style={styles.heroDueDateText}>
                                        Payment Due: {formatDate(currentBill.due_date)}
                                    </Text>
                                ) : isCycleActive ? (
                                    <Text style={styles.heroDueDateText}>
                                        Bill generation on {formatDate(activeCycle.cycle_end)}
                                    </Text>
                                ) : (
                                    <Text style={[styles.heroDueDateText, { color: COLORS.success }]}>
                                        All billing statements are fully settled
                                    </Text>
                                )}
                            </View>

                            {/* Single Primary Payment CTA */}
                            {grandTotal > 0 ? (
                                <TouchableOpacity
                                    style={styles.primaryPayBtn}
                                    onPress={handlePrimaryPayment}
                                    activeOpacity={0.85}
                                    accessible={true}
                                    accessibilityRole="button"
                                    accessibilityLabel={firstActionableOverdue
                                        ? `Pay Overdue Balance of ${parseFloat(firstActionableOverdue.total_overdue).toFixed(2)} pesos`
                                        : `Pay Statement Balance of ${currentAmountDue.toFixed(2)} pesos`}
                                    accessibilityHint="Navigates to the payment submission form"
                                >
                                    <Ionicons name="card" size={16} color="#FFFFFF" />
                                    <Text style={styles.primaryPayBtnText}>
                                        {firstActionableOverdue
                                            ? `Pay Overdue Balance • ₱${parseFloat(firstActionableOverdue.total_overdue).toFixed(2)}`
                                            : `Pay Statement • ₱${currentAmountDue.toFixed(2)}`}
                                    </Text>
                                </TouchableOpacity>
                            ) : pendingVerification > 0 ? (
                                <TouchableOpacity
                                    style={styles.pendingActionPill}
                                    onPress={() => showModal({
                                        type: 'info',
                                        title: 'Payment Under Review',
                                        message: `Your payment of ₱${pendingVerification.toFixed(2)} was received and is awaiting landlord verification.`,
                                    })}
                                    activeOpacity={0.8}
                                    accessible={true}
                                    accessibilityRole="button"
                                    accessibilityLabel="Payment Under Landlord Review. Tap for details."
                                >
                                    <Ionicons name="time-outline" size={15} color={COLORS.warning} />
                                    <Text style={styles.pendingActionText}>Payment Under Landlord Review</Text>
                                </TouchableOpacity>
                            ) : (
                                <View
                                    style={styles.settledActionPill}
                                    accessible={true}
                                    accessibilityRole="text"
                                    accessibilityLabel="All billing statements settled and up to date."
                                >
                                    <Ionicons name="checkmark-circle" size={15} color={COLORS.success} />
                                    <Text style={styles.settledActionText}>All Statements Settled • Up to Date</Text>
                                </View>
                            )}
                        </CopilotView>
                    </CopilotStep>

                    {/* Step 21: Hero Quick Action Pills */}
                    <CopilotStep
                        text="Quickly access past payment logs or view and download your official statement PDF."
                        order={21}
                        name="payment_history"
                    >
                        <CopilotView style={styles.heroQuickActionsRow}>
                            <TouchableOpacity
                                style={styles.quickActionPill}
                                onPress={() => router.push('/(tenant)/billing-history')}
                                activeOpacity={0.8}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityLabel="Open Billing History"
                                accessibilityHint="Navigates to previous payment statements and history"
                            >
                                <Ionicons name="time-outline" size={15} color={COLORS.primary} />
                                <Text style={styles.quickActionText}>Billing History</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.quickActionPill}
                                onPress={handleViewPdf}
                                activeOpacity={0.8}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityLabel="View Statement PDF"
                                accessibilityHint="Opens the statement invoice document in the PDF viewer"
                            >
                                <Ionicons name="document-text-outline" size={15} color={COLORS.primary} />
                                <Text style={styles.quickActionText}>View Statement PDF</Text>
                            </TouchableOpacity>
                        </CopilotView>
                    </CopilotStep>
                </GlassCard>

                {/* ═══════════════════════════════════════════════════════════
                    CONDITIONAL: PRIOR OVERDUE INVOICES (Actionable List)
                   ═══════════════════════════════════════════════════════════ */}
                {hasOverdueBills && (
                    <View style={styles.overdueSection}>
                        <View style={styles.sectionTitleRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.sectionHeaderTitleWarning}>
                                    {firstActionableOverdue ? 'ACTION REQUIRED: OVERDUE BILLS' : 'PREVIOUS BILLS (UNDER REVIEW)'}
                                </Text>
                                <View style={styles.overdueCountBadge}>
                                    <Text style={styles.overdueCountText}>{overdueBills.length}</Text>
                                </View>
                            </View>
                        </View>

                        {paginatedOverdueBills.map((item) => {
                            const isPending = item.payment_status === 'pending_verification' || item.is_pending_verification;
                            const isExpanded = expandedOverdueId === item.id;

                            return (
                                <GlassCard
                                    key={item.id}
                                    style={[
                                        styles.overdueCard,
                                        isPending && styles.pendingOverdueCard,
                                    ]}
                                >
                                    <View style={styles.overdueCardHeader}>
                                        <View style={{ flex: 1, marginRight: 8 }}>
                                            <Text style={[styles.overdueTypeLabel, isPending && { color: '#F59E0B' }]}>
                                                {isPending ? 'Payment Under Review' : 'Overdue Statement'}
                                            </Text>
                                            <Text style={styles.overdueInvoiceNum} numberOfLines={1}>
                                                {item.invoice_number || `Invoice #${item.id}`}
                                            </Text>
                                            <Text style={styles.overduePeriodText} numberOfLines={1}>
                                                Period: {formatDate(item.cycle_start)} – {formatDate(item.cycle_end)}
                                            </Text>
                                        </View>

                                        {isPending ? (
                                            <View style={styles.pendingBadgeWrap}>
                                                <Ionicons name="time" size={11} color="#F59E0B" />
                                                <Text style={styles.pendingBadgeText}>Reviewing</Text>
                                            </View>
                                        ) : (
                                            <View style={styles.daysLateBadgeWrap}>
                                                <Ionicons name="alert-circle" size={11} color={COLORS.danger} />
                                                <Text style={styles.daysLateBadgeText}>
                                                    {item.days_overdue > 0 ? `${item.days_overdue}d Late` : 'Overdue'}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* 3-Column Summary */}
                                    <View style={styles.overdueGridBox}>
                                        <View style={styles.gridCol}>
                                            <Text style={styles.gridLabel}>Base Amount</Text>
                                            <Text style={styles.gridVal}>₱{parseFloat(item.base_amount || 0).toFixed(2)}</Text>
                                        </View>
                                        <View style={styles.gridCol}>
                                            <Text style={styles.gridLabel}>Late Fee</Text>
                                            <Text style={[styles.gridVal, { color: isPending ? '#F59E0B' : COLORS.danger }]}>
                                                +₱{parseFloat(item.penalty_amount || 0).toFixed(2)}
                                            </Text>
                                        </View>
                                        <View style={[styles.gridCol, { alignItems: 'flex-end' }]}>
                                            <Text style={styles.gridLabel}>{isPending ? 'Submitted Total' : 'Overdue Total'}</Text>
                                            <Text style={[styles.gridTotalVal, isPending && { color: '#F59E0B' }]}>
                                                ₱{parseFloat(item.total_overdue || 0).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Actions */}
                                    <View style={styles.overdueActionsRow}>
                                        <TouchableOpacity
                                            style={styles.overdueDetailsBtn}
                                            onPress={() => toggleOverdueDetails(item.id)}
                                            activeOpacity={0.8}
                                            accessible={true}
                                            accessibilityRole="button"
                                            accessibilityLabel={isExpanded ? `Hide details for invoice ${item.invoice_number}` : `View details for invoice ${item.invoice_number}`}
                                            accessibilityHint="Toggles breakdown of base electricity, penalties, and room rent for this past statement"
                                        >
                                            <Ionicons name={isExpanded ? 'chevron-up' : 'information-circle-outline'} size={14} color={COLORS.textSecondary} />
                                            <Text style={styles.overdueDetailsBtnText}>{isExpanded ? 'Hide' : 'Details'}</Text>
                                        </TouchableOpacity>

                                        {isPending ? (
                                            <TouchableOpacity
                                                style={styles.overdueAwaitingBtn}
                                                onPress={() => showModal({
                                                    type: 'info',
                                                    title: 'Payment Under Review',
                                                    message: `Your payment of ₱${parseFloat(item.pending_payment?.amount || item.total_overdue || 0).toFixed(2)} for ${item.invoice_number} is pending landlord verification.`,
                                                })}
                                                activeOpacity={0.8}
                                                accessible={true}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Payment of ${parseFloat(item.pending_payment?.amount || item.total_overdue || 0).toFixed(2)} pesos under landlord review. Tap for details.`}
                                            >
                                                <Ionicons name="hourglass-outline" size={14} color="#F59E0B" />
                                                <Text style={styles.overdueAwaitingBtnText}>Awaiting Approval</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity
                                                style={styles.overduePayNowBtn}
                                                onPress={() => router.push({
                                                    pathname: '/(tenant)/payment',
                                                    params: {
                                                        cycleId: item.id,
                                                        type: 'overdue',
                                                        amount: item.total_overdue,
                                                        invoiceNumber: item.invoice_number,
                                                    },
                                                })}
                                                activeOpacity={0.85}
                                                accessible={true}
                                                accessibilityRole="button"
                                                accessibilityLabel={`Pay overdue invoice ${item.invoice_number} amount ₱${parseFloat(item.total_overdue || 0).toFixed(2)}`}
                                                accessibilityHint="Navigates to the payment submission form for this overdue invoice"
                                            >
                                                <Ionicons name="card" size={14} color="#FFFFFF" />
                                                <Text style={styles.overduePayNowBtnText}>Pay Overdue</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {/* Expandable Details Drawer */}
                                    {isExpanded && (
                                        <View style={styles.overdueDrawerBox}>
                                            <View style={styles.drawerDetailRow}>
                                                <Text style={styles.drawerDetailLabel}>Due Date:</Text>
                                                <Text style={styles.drawerDetailVal}>{formatDate(item.due_date)}</Text>
                                            </View>
                                            <View style={styles.drawerDetailRow}>
                                                <Text style={styles.drawerDetailLabel}>Electricity Charges:</Text>
                                                <Text style={styles.drawerDetailVal}>₱{parseFloat(item.electricity_charge || 0).toFixed(2)}</Text>
                                            </View>
                                            <View style={styles.drawerDetailRow}>
                                                <Text style={styles.drawerDetailLabel}>Miscellaneous Fee:</Text>
                                                <Text style={styles.drawerDetailVal}>₱{parseFloat(item.miscellaneous_fee || 0).toFixed(2)}</Text>
                                            </View>
                                            {parseFloat(item.monthly_rent || 0) > 0 && (
                                                <View style={styles.drawerDetailRow}>
                                                    <Text style={styles.drawerDetailLabel}>Monthly Rent:</Text>
                                                    <Text style={styles.drawerDetailVal}>₱{parseFloat(item.monthly_rent).toFixed(2)}</Text>
                                                </View>
                                            )}
                                            {parseFloat(item.amount_paid || 0) > 0 && (
                                                <View style={styles.drawerDetailRow}>
                                                    <Text style={styles.drawerDetailLabel}>Paid to Date:</Text>
                                                    <Text style={[styles.drawerDetailVal, { color: COLORS.success }]}>-₱{parseFloat(item.amount_paid).toFixed(2)}</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </GlassCard>
                            );
                        })}

                        {/* Overdue Minimal Pagination Bar */}
                        {totalOverduePages > 1 && (
                            <View style={styles.overduePaginationBar}>
                                <Text style={styles.overduePaginationText}>
                                    Showing {(overduePage - 1) * OVERDUE_PAGE_SIZE + 1}–{Math.min(overduePage * OVERDUE_PAGE_SIZE, overdueBills.length)} of {overdueBills.length}
                                </Text>
                                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                                    <TouchableOpacity
                                        style={[styles.overduePageBtn, overduePage === 1 && styles.pageNavBtnDisabled]}
                                        onPress={() => setOverduePage(p => Math.max(1, p - 1))}
                                        disabled={overduePage === 1}
                                        activeOpacity={0.7}
                                        accessibilityLabel="Previous overdue bills page"
                                    >
                                        <Ionicons name="chevron-back" size={13} color={overduePage === 1 ? '#475569' : COLORS.textPrimary} />
                                    </TouchableOpacity>
                                    <View style={styles.overduePageIndicator}>
                                        <Text style={styles.overduePageIndicatorText}>{overduePage} / {totalOverduePages}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.overduePageBtn, overduePage >= totalOverduePages && styles.pageNavBtnDisabled]}
                                        onPress={() => setOverduePage(p => Math.min(totalOverduePages, p + 1))}
                                        disabled={overduePage >= totalOverduePages}
                                        activeOpacity={0.7}
                                        accessibilityLabel="Next overdue bills page"
                                    >
                                        <Ionicons name="chevron-forward" size={13} color={overduePage >= totalOverduePages ? '#475569' : COLORS.textPrimary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    CONSOLIDATED STATEMENT & BALANCE BREAKDOWN CARD
                    (Clearly distinguishes all 6 financial components without duplicates)
                   ═══════════════════════════════════════════════════════════ */}
                <CopilotStep
                    text="Shows your itemized charges including energy consumption, penalties, balance forward, and payment credits."
                    order={22}
                    name="payment_breakdown"
                >
                    <CopilotView style={styles.copilotWrapper}>
                        <View style={styles.sectionTitleRow}>
                            <Text style={styles.sectionHeaderTitle}>STATEMENT & BALANCE BREAKDOWN</Text>
                            {hasCurrentBill && currentBill.cycle_start && (
                                <Text style={styles.sectionPeriodSubtitle}>
                                    {formatDate(currentBill.cycle_start)} – {formatDate(currentBill.cycle_end)}
                                </Text>
                            )}
                        </View>

                        <GlassCard style={styles.cardContainer}>
                            {/* Segmented Pagination Tabs */}
                            <View style={styles.breakdownTabRow}>
                                <TouchableOpacity
                                    style={[styles.breakdownTab, breakdownPage === 1 && styles.breakdownTabActive]}
                                    onPress={() => {
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        setBreakdownPage(1);
                                    }}
                                    activeOpacity={0.8}
                                    accessibilityRole="tab"
                                    accessibilityLabel="Statement Charges page"
                                    accessibilityState={{ selected: breakdownPage === 1 }}
                                >
                                    <Ionicons 
                                        name="receipt-outline" 
                                        size={13} 
                                        color={breakdownPage === 1 ? COLORS.primary : COLORS.textMuted} 
                                    />
                                    <Text style={[styles.breakdownTabText, breakdownPage === 1 && styles.breakdownTabTextActive]}>
                                        1. Statement Charges
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.breakdownTab, breakdownPage === 2 && styles.breakdownTabActive]}
                                    onPress={() => {
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        setBreakdownPage(2);
                                    }}
                                    activeOpacity={0.8}
                                    accessibilityRole="tab"
                                    accessibilityLabel="Balance and Arrears page"
                                    accessibilityState={{ selected: breakdownPage === 2 }}
                                >
                                    <Ionicons 
                                        name="wallet-outline" 
                                        size={13} 
                                        color={breakdownPage === 2 ? '#38BDF8' : COLORS.textMuted} 
                                    />
                                    <Text style={[styles.breakdownTabText, breakdownPage === 2 && styles.breakdownTabTextActive]}>
                                        2. Balance & Arrears
                                    </Text>
                                    {(totalPenalties > 0 || overdueBalance > 0) && (
                                        <View style={styles.tabBadgeDot} />
                                    )}
                                </TouchableOpacity>
                            </View>

                            {/* ─── PAGE 1: CURRENT STATEMENT BREAKDOWN ─── */}
                            {breakdownPage === 1 ? (
                                <View style={styles.pageContentWrap}>
                                    <View style={styles.pageHeaderRow}>
                                        <View style={styles.pageHeaderTag}>
                                            <Ionicons name="flash-outline" size={11} color={COLORS.primary} />
                                            <Text style={styles.pageHeaderTagText}>CURRENT STATEMENT</Text>
                                        </View>
                                        <Text style={styles.pageHeaderSubtitle}>
                                            {hasCurrentBill ? (currentBill.invoice_number || 'Current Cycle') : 'Active Metering'}
                                        </Text>
                                    </View>

                                    {/* 1. CURRENT CYCLE COST */}
                                    <View style={styles.breakdownItemBlock}>
                                        <View style={styles.breakdownRow}>
                                            <View style={styles.labelCol}>
                                                <View style={styles.bulletTitleRow}>
                                                    <View style={[styles.dotIndicator, { backgroundColor: '#3B82F6' }]} />
                                                    <Text style={styles.itemTitle}>Current Cycle Cost</Text>
                                                </View>
                                                <Text style={styles.itemSubtitle}>Base electricity, common fees & room accommodation</Text>
                                            </View>
                                            <Text style={styles.itemValue}>
                                                ₱{currentCycleCost.toFixed(2)}
                                            </Text>
                                        </View>

                                        {/* Collapsible Toggle for Itemized kWh & EPIRA Breakdown */}
                                        {hasCurrentBill && (
                                            <TouchableOpacity
                                                style={styles.breakdownToggleBtn}
                                                onPress={toggleBreakdown}
                                                activeOpacity={0.8}
                                                accessible={true}
                                                accessibilityRole="button"
                                                accessibilityLabel={showBreakdown ? 'Hide itemized charges and EPIRA regulatory breakdown' : 'View itemized electricity consumption and EPIRA regulatory breakdown'}
                                                accessibilityHint="Toggles detailed breakdown of generation, transmission, system loss, distribution, VAT, and miscellaneous charges"
                                            >
                                                <Ionicons
                                                    name={showBreakdown ? 'chevron-up-circle-outline' : 'receipt-outline'}
                                                    size={14}
                                                    color={COLORS.primary}
                                                />
                                                <Text style={styles.breakdownToggleText}>
                                                    {showBreakdown ? 'Hide Itemized Charges' : 'View Itemized Electricity & Fees'}
                                                </Text>
                                                <Ionicons
                                                    name={showBreakdown ? 'chevron-up' : 'chevron-down'}
                                                    size={12}
                                                    color={COLORS.primary}
                                                />
                                            </TouchableOpacity>
                                        )}

                                        {/* Smooth Expandable Itemized Charges Drawer */}
                                        {showBreakdown && hasCurrentBill && (
                                            <View style={styles.itemizedChargesDrawer}>
                                                {/* Submeter Consumption */}
                                                <View style={styles.submeterRow}>
                                                    <Text style={styles.submeterLabel}>Submeter Consumption</Text>
                                                    <Text style={styles.submeterVal}>
                                                        {parseFloat(currentBill.total_kwh || 0).toFixed(2)} kWh @ ₱{parseFloat(currentBill.rate_per_kwh || 12.50).toFixed(2)}/kWh
                                                    </Text>
                                                </View>

                                                {/* Readings Sub-box */}
                                                <View style={styles.readingsBox}>
                                                    <View style={styles.readingRow}>
                                                        <Text style={styles.readingLabel}>Previous Reading:</Text>
                                                        <Text style={styles.readingVal}>{parseFloat(currentBill.previous_reading || 0).toFixed(4)} kWh</Text>
                                                    </View>
                                                    <View style={styles.readingRow}>
                                                        <Text style={styles.readingLabel}>Current Reading:</Text>
                                                        <Text style={styles.readingVal}>{parseFloat(currentBill.current_reading || 0).toFixed(4)} kWh</Text>
                                                    </View>
                                                </View>

                                                {/* EPIRA Sub-components Grid */}
                                                <Text style={styles.epiraHeader}>EPIRA Regulatory Components (R.A. 9136)</Text>
                                                <View style={styles.epiraGrid}>
                                                    <View style={styles.epiraItem}>
                                                        <Text style={styles.epiraLabel}>Generation:</Text>
                                                        <Text style={styles.epiraVal}>₱{parseFloat(currentBill.breakdown?.generation || 0).toFixed(2)}</Text>
                                                    </View>
                                                    <View style={styles.epiraItem}>
                                                        <Text style={styles.epiraLabel}>Transmission:</Text>
                                                        <Text style={styles.epiraVal}>₱{parseFloat(currentBill.breakdown?.transmission || 0).toFixed(2)}</Text>
                                                    </View>
                                                    <View style={styles.epiraItem}>
                                                        <Text style={styles.epiraLabel}>System Loss:</Text>
                                                        <Text style={styles.epiraVal}>₱{parseFloat(currentBill.breakdown?.system_loss || 0).toFixed(2)}</Text>
                                                    </View>
                                                    <View style={styles.epiraItem}>
                                                        <Text style={styles.epiraLabel}>Distribution:</Text>
                                                        <Text style={styles.epiraVal}>₱{parseFloat(currentBill.breakdown?.distribution || 0).toFixed(2)}</Text>
                                                    </View>
                                                    <View style={styles.epiraItem}>
                                                        <Text style={styles.epiraLabel}>Metering & Supply:</Text>
                                                        <Text style={styles.epiraVal}>
                                                            ₱{(parseFloat(currentBill.breakdown?.metering || 0) + parseFloat(currentBill.breakdown?.supply || 0)).toFixed(2)}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.epiraItem}>
                                                        <Text style={styles.epiraLabel}>Value Added Tax (VAT):</Text>
                                                        <Text style={styles.epiraVal}>₱{parseFloat(currentBill.breakdown?.vat || 0).toFixed(2)}</Text>
                                                    </View>
                                                </View>

                                                {/* Miscellaneous Fee */}
                                                <View style={styles.drawerFeeRow}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.drawerFeeLabel}>Miscellaneous Fee</Text>
                                                        <Text style={styles.drawerFeeSub}>Common hallway lighting & facility operations</Text>
                                                    </View>
                                                    <Text style={styles.drawerFeeVal}>
                                                        ₱{parseFloat(currentBill.miscellaneous_fee || currentBill.breakdown?.miscellaneous || 0).toFixed(2)}
                                                    </Text>
                                                </View>

                                                {/* Room Accommodation Rent if applicable */}
                                                {parseFloat(currentBill.monthly_rent || currentBill.breakdown?.rent || 0) > 0 && (
                                                    <View style={styles.drawerFeeRow}>
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={styles.drawerFeeLabel}>Monthly Room Rent</Text>
                                                            <Text style={styles.drawerFeeSub}>Fixed accommodation charge</Text>
                                                        </View>
                                                        <Text style={styles.drawerFeeVal}>
                                                            ₱{parseFloat(currentBill.monthly_rent || currentBill.breakdown?.rent).toFixed(2)}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.itemSeparator} />

                                    {/* 2. CURRENT AMOUNT DUE */}
                                    <View style={styles.breakdownRow}>
                                        <View style={styles.labelCol}>
                                            <View style={styles.bulletTitleRow}>
                                                <View style={[styles.dotIndicator, { backgroundColor: COLORS.primary }]} />
                                                <Text style={styles.itemTitle}>Current Amount Due</Text>
                                            </View>
                                            <Text style={styles.itemSubtitle}>
                                                {hasCurrentBill
                                                    ? `Net statement balance (Cycle cost ${currentLatePenalty > 0 ? '+ late fee ' : ''}- payments)`
                                                    : (isCycleActive ? 'Unbilled — active cycle in progress' : 'No current billing active')}
                                            </Text>
                                        </View>
                                        <Text style={[styles.itemValue, { color: currentAmountDue > 0 ? COLORS.textPrimary : COLORS.textMuted }]}>
                                            ₱{currentAmountDue.toFixed(2)}
                                        </Text>
                                    </View>

                                    {/* Quick Advance Button to Page 2 */}
                                    <TouchableOpacity
                                        style={styles.pageSwitchPromptBtn}
                                        onPress={() => {
                                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                            setBreakdownPage(2);
                                        }}
                                        activeOpacity={0.8}
                                        accessibilityRole="button"
                                        accessibilityLabel="View Balance and Arrears on page 2"
                                    >
                                        <Text style={styles.pageSwitchPromptText}>View Balance & Arrears (2/2)</Text>
                                        <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                /* ─── PAGE 2: BALANCE & ARREARS BREAKDOWN ─── */
                                <View style={styles.pageContentWrap}>
                                    <View style={styles.pageHeaderRow}>
                                        <View style={styles.pageHeaderTag}>
                                            <Ionicons name="time-outline" size={11} color="#F59E0B" />
                                            <Text style={styles.pageHeaderTagText}>BALANCE & ARREARS</Text>
                                        </View>
                                        <Text style={styles.pageHeaderSubtitle}>Past Cycles & Net Outstanding</Text>
                                    </View>

                                    {/* 3. PREVIOUS BALANCE */}
                                    <View style={styles.breakdownRow}>
                                        <View style={styles.labelCol}>
                                            <View style={styles.bulletTitleRow}>
                                                <View style={[styles.dotIndicator, { backgroundColor: previousBalance > 0 ? '#F59E0B' : 'rgba(255,255,255,0.2)' }]} />
                                                <Text style={styles.itemTitle}>Previous Balance</Text>
                                            </View>
                                            <Text style={styles.itemSubtitle}>Unpaid base charges carried from prior billing cycles</Text>
                                        </View>
                                        <Text style={[styles.itemValue, previousBalance > 0 ? { color: '#F59E0B', fontWeight: '700' } : styles.dimmedValue]}>
                                            ₱{previousBalance.toFixed(2)}
                                        </Text>
                                    </View>

                                    <View style={styles.itemSeparator} />

                                    {/* 4. PENALTIES */}
                                    <View style={styles.breakdownRow}>
                                        <View style={styles.labelCol}>
                                            <View style={styles.bulletTitleRow}>
                                                <View style={[styles.dotIndicator, { backgroundColor: totalPenalties > 0 ? COLORS.danger : 'rgba(255,255,255,0.2)' }]} />
                                                <Text style={styles.itemTitle}>Penalties</Text>
                                            </View>
                                            <Text style={styles.itemSubtitle}>Accumulated late payment fees from past overdue cycles</Text>
                                        </View>
                                        <Text style={[styles.itemValue, totalPenalties > 0 ? { color: COLORS.danger, fontWeight: '700' } : styles.dimmedValue]}>
                                            {totalPenalties > 0 ? `+₱${totalPenalties.toFixed(2)}` : '₱0.00'}
                                        </Text>
                                    </View>

                                    <View style={styles.itemSeparator} />

                                    {/* 5. OVERDUE BALANCE */}
                                    <View style={styles.breakdownRow}>
                                        <View style={styles.labelCol}>
                                            <View style={styles.bulletTitleRow}>
                                                <View style={[styles.dotIndicator, { backgroundColor: overdueBalance > 0 ? COLORS.danger : 'rgba(255,255,255,0.2)' }]} />
                                                <Text style={styles.itemTitle}>Overdue Balance</Text>
                                            </View>
                                            <Text style={styles.itemSubtitle}>Total past overdue balance (Previous balance + Late penalties)</Text>
                                        </View>
                                        <Text style={[styles.itemValue, overdueBalance > 0 ? { color: COLORS.danger, fontWeight: '800' } : styles.dimmedValue]}>
                                            ₱{overdueBalance.toFixed(2)}
                                        </Text>
                                    </View>

                                    {/* CONDITIONAL: PENDING VERIFICATION DEDUCTION */}
                                    {pendingVerification > 0 && (
                                        <>
                                            <View style={styles.itemSeparator} />
                                            <View style={styles.breakdownRow}>
                                                <View style={styles.labelCol}>
                                                    <View style={styles.bulletTitleRow}>
                                                        <Ionicons name="time" size={13} color="#F59E0B" />
                                                        <Text style={[styles.itemTitle, { color: '#F59E0B' }]}>Pending Verification</Text>
                                                    </View>
                                                    <Text style={styles.itemSubtitle}>Payments submitted awaiting landlord review</Text>
                                                </View>
                                                <Text style={[styles.itemValue, { color: '#F59E0B', fontWeight: '700' }]}>
                                                    -₱{pendingVerification.toFixed(2)}
                                                </Text>
                                            </View>
                                        </>
                                    )}

                                    {/* HIGHLIGHTED TOTAL ROW */}
                                    <View style={styles.totalOutstandingDivider} />
                                    <View style={styles.totalOutstandingRow}>
                                        <View style={{ flex: 1, marginRight: 8 }}>
                                            <Text style={styles.totalOutstandingLabel}>Total Outstanding</Text>
                                            <Text style={styles.totalOutstandingSub}>Net payable balance across all cycles</Text>
                                        </View>
                                        <Text style={styles.totalOutstandingValue}>
                                            ₱{grandTotal.toFixed(2)}
                                        </Text>
                                    </View>

                                    {/* Quick Back Button to Page 1 */}
                                    <TouchableOpacity
                                        style={styles.pageSwitchPromptBtn}
                                        onPress={() => {
                                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                            setBreakdownPage(1);
                                        }}
                                        activeOpacity={0.8}
                                        accessibilityRole="button"
                                        accessibilityLabel="Back to Statement Charges on page 1"
                                    >
                                        <Ionicons name="arrow-back" size={14} color={COLORS.primary} />
                                        <Text style={styles.pageSwitchPromptText}>Back to Statement Charges (1/2)</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Minimal Pagination Navigation Bar */}
                            <View style={styles.cardPaginationBar}>
                                <TouchableOpacity
                                    style={[styles.pageNavBtn, breakdownPage === 1 && styles.pageNavBtnDisabled]}
                                    onPress={() => {
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        setBreakdownPage(1);
                                    }}
                                    disabled={breakdownPage === 1}
                                    activeOpacity={0.7}
                                    accessibilityRole="button"
                                    accessibilityLabel="Previous page: Statement Charges"
                                >
                                    <Ionicons name="chevron-back" size={13} color={breakdownPage === 1 ? '#475569' : COLORS.primary} />
                                    <Text style={[styles.pageNavText, breakdownPage === 1 && styles.pageNavTextDisabled]}>Prev</Text>
                                </TouchableOpacity>

                                <View style={styles.paginationDotsWrap}>
                                    <TouchableOpacity
                                        style={[styles.paginationDot, breakdownPage === 1 && styles.paginationDotActive]}
                                        onPress={() => {
                                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                            setBreakdownPage(1);
                                        }}
                                        accessibilityRole="button"
                                        accessibilityLabel="Go to page 1"
                                    />
                                    <TouchableOpacity
                                        style={[styles.paginationDot, breakdownPage === 2 && styles.paginationDotActive]}
                                        onPress={() => {
                                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                            setBreakdownPage(2);
                                        }}
                                        accessibilityRole="button"
                                        accessibilityLabel="Go to page 2"
                                    />
                                    <Text style={styles.paginationPageLabel}>
                                        Page {breakdownPage} of 2
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={[styles.pageNavBtn, breakdownPage === 2 && styles.pageNavBtnDisabled]}
                                    onPress={() => {
                                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                        setBreakdownPage(2);
                                    }}
                                    disabled={breakdownPage === 2}
                                    activeOpacity={0.7}
                                    accessibilityRole="button"
                                    accessibilityLabel="Next page: Balance and Arrears"
                                >
                                    <Text style={[styles.pageNavText, breakdownPage === 2 && styles.pageNavTextDisabled]}>Next</Text>
                                    <Ionicons name="chevron-forward" size={13} color={breakdownPage === 2 ? '#475569' : COLORS.primary} />
                                </TouchableOpacity>
                            </View>
                        </GlassCard>
                    </CopilotView>
                </CopilotStep>

                {/* ═══════════════════════════════════════════════════════════
                    BILLING HISTORY: RECENT SETTLED STATEMENTS
                   ═══════════════════════════════════════════════════════════ */}
                <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionHeaderTitle}>RECENT SETTLED INVOICES</Text>
                    <TouchableOpacity
                        onPress={() => router.push('/(tenant)/billing-history')}
                        activeOpacity={0.7}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel="View All Settled Invoices"
                        accessibilityHint="Navigates to the full billing history screen"
                    >
                        <Text style={styles.viewAllHistoryLink}>View All →</Text>
                    </TouchableOpacity>
                </View>

                {paidBills.length > 0 ? (
                    <GlassCard style={styles.historyCardContainer}>
                        {paidBills.slice(0, 3).map((bill, index) => (
                            <TouchableOpacity
                                key={bill.id || index}
                                onPress={() => router.push({
                                    pathname: '/(tenant)/pdf-viewer',
                                    params: { id: bill.id, invoice_number: bill.invoice_number || '' },
                                })}
                                activeOpacity={0.7}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityLabel={`View PDF statement for invoice ${bill.invoice_number || bill.id}`}
                                style={[
                                    styles.historyItemRow,
                                    index < Math.min(paidBills.length, 3) - 1 && styles.historyItemBorder,
                                ]}
                            >
                                <View style={styles.historyIconBox}>
                                    <Ionicons name="checkmark-done-circle" size={20} color={COLORS.success} />
                                </View>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.historyInvoiceText} numberOfLines={1}>
                                        {bill.invoice_number || `Invoice #${bill.id}`}
                                    </Text>
                                    <Text style={styles.historyPeriodText} numberOfLines={1}>
                                        {formatDate(bill.cycle_start)} – {formatDate(bill.cycle_end)}
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.historyAmountText}>
                                        ₱{parseFloat(bill.total_amount_due || bill.amount_paid || 0).toFixed(2)}
                                    </Text>
                                    <View style={styles.historyPaidBadge}>
                                        <Text style={styles.historyPaidBadgeText}>SETTLED</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </GlassCard>
                ) : (
                    <GlassCard style={styles.emptyHistoryCard}>
                        <Ionicons name="receipt-outline" size={24} color={COLORS.textSecondary} style={{ marginBottom: 6 }} />
                        <Text style={styles.emptyHistoryTitle}>No Settled Invoices Yet</Text>
                        <Text style={styles.emptyHistorySub}>Completed and settled billing records will appear here.</Text>
                    </GlassCard>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    BILLING POLICIES & COMPLIANCE FOOTER
                   ═══════════════════════════════════════════════════════════ */}
                <GlassCard style={styles.policyCard}>
                    <View style={styles.policyItem}>
                        <Ionicons name="shield-checkmark-outline" size={15} color={COLORS.primary} />
                        <Text style={styles.policyText}>
                            Electricity rates and breakdowns adhere strictly to R.A. 9136 (EPIRA) submeter pass-through guidelines.
                        </Text>
                    </View>
                    <View style={styles.policyItem}>
                        <Ionicons name="time-outline" size={15} color={COLORS.warning} />
                        <Text style={styles.policyText}>
                            Automated late penalties apply at 12:00 AM once a billing statement passes its configured due date.
                        </Text>
                    </View>
                </GlassCard>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scroll: {
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.sm,
        paddingBottom: 110,
    },
    copilotWrapper: {
        width: '100%',
        alignSelf: 'stretch',
    },

    // Brand Row
    brandRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        marginTop: 4,
    },
    brandPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: RADIUS.full,
    },
    brandPillText: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.primary,
        letterSpacing: 0.8,
    },
    roomPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: RADIUS.full,
    },
    roomPillText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },

    // Hero Card
    heroCard: {
        padding: SPACING.md,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.25)',
        width: '100%',
        overflow: 'hidden',
    },
    heroHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
        width: '100%',
    },
    heroInvoiceLabel: {
        fontSize: 10.5,
        color: COLORS.textMuted,
        letterSpacing: 0.8,
        fontWeight: '700',
    },
    heroInvoiceNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: RADIUS.full,
        flexShrink: 0,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.6,
    },

    activeRecordingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: RADIUS.md,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
        width: '100%',
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#3B82F6',
        flexShrink: 0,
    },
    activeRecordingText: {
        fontSize: 11,
        color: '#93C5FD',
        fontWeight: '600',
        flexShrink: 1,
    },

    heroAmountBlock: {
        marginBottom: 14,
        width: '100%',
    },
    heroAmountLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    heroAmountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 3,
    },
    currencySymbol: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.primary,
    },
    heroAmountValue: {
        fontSize: 34,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.6,
    },
    heroDueDateText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 6,
    },
    heroOverdueWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 6,
    },
    heroOverdueText: {
        fontSize: 12,
        color: COLORS.danger,
        fontWeight: '600',
    },

    primaryPayBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.md,
        width: '100%',
        minHeight: 46,
        marginBottom: 12,
    },
    primaryPayBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
    pendingActionPill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingVertical: 11,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.25)',
        width: '100%',
        minHeight: 44,
        marginBottom: 12,
    },
    pendingActionText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.warning,
    },
    settledActionPill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        paddingVertical: 11,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        width: '100%',
        minHeight: 44,
        marginBottom: 12,
    },
    settledActionText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.success,
    },

    heroQuickActionsRow: {
        flexDirection: 'row',
        gap: 8,
        width: '100%',
    },
    quickActionPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        paddingVertical: 9,
        paddingHorizontal: 8,
        borderRadius: RADIUS.sm,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        minHeight: 44,
    },
    quickActionText: {
        fontSize: 11.5,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },

    // Section Titles
    sectionTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 14,
        marginBottom: 8,
        paddingHorizontal: 2,
    },
    sectionHeaderTitle: {
        fontSize: 11.5,
        fontWeight: '700',
        color: COLORS.textSecondary,
        letterSpacing: 0.8,
    },
    sectionHeaderTitleWarning: {
        fontSize: 11.5,
        fontWeight: '800',
        color: COLORS.danger,
        letterSpacing: 0.8,
    },
    sectionPeriodSubtitle: {
        fontSize: 11,
        color: COLORS.textMuted,
    },
    viewAllHistoryLink: {
        fontSize: 11.5,
        fontWeight: '600',
        color: COLORS.primary,
    },

    // Consolidated Statement Breakdown Card
    cardContainer: {
        padding: SPACING.md,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        width: '100%',
        overflow: 'hidden',
    },
    // Segmented Pagination Tabs for Breakdown
    breakdownTabRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        borderRadius: RADIUS.md,
        padding: 3,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    breakdownTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: RADIUS.sm,
        gap: 6,
        position: 'relative',
    },
    breakdownTabActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    breakdownTabText: {
        fontSize: 11.5,
        fontWeight: '600',
        color: COLORS.textMuted,
    },
    breakdownTabTextActive: {
        color: COLORS.textPrimary,
        fontWeight: '700',
    },
    tabBadgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.danger,
        marginLeft: -2,
    },

    // Page Content Wrapper & Headers
    pageContentWrap: {
        width: '100%',
    },
    pageHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    pageHeaderTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.full,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    pageHeaderTagText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.textSecondary,
        letterSpacing: 0.5,
    },
    pageHeaderSubtitle: {
        fontSize: 11,
        color: COLORS.textMuted,
        fontWeight: '500',
    },

    // Page Switch Prompt Buttons
    pageSwitchPromptBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 14,
        paddingVertical: 9,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.06)',
        borderRadius: RADIUS.sm,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.15)',
        minHeight: 40,
    },
    pageSwitchPromptText: {
        fontSize: 11.5,
        fontWeight: '600',
        color: COLORS.primary,
    },

    // Minimal Bottom Pagination Bar
    cardPaginationBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.06)',
        width: '100%',
    },
    pageNavBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: RADIUS.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        minHeight: 34,
    },
    pageNavBtnDisabled: {
        opacity: 0.35,
        borderColor: 'transparent',
        backgroundColor: 'transparent',
    },
    pageNavText: {
        fontSize: 11.5,
        fontWeight: '600',
        color: COLORS.primary,
    },
    pageNavTextDisabled: {
        color: '#475569',
    },
    paginationDotsWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
    },
    paginationDotActive: {
        width: 18,
        backgroundColor: COLORS.primary,
    },
    paginationPageLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginLeft: 4,
        fontWeight: '500',
    },

    breakdownItemBlock: {
        width: '100%',
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
        paddingVertical: 3,
    },
    labelCol: {
        flex: 1,
        marginRight: 10,
    },
    bulletTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dotIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        flexShrink: 0,
    },
    itemTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    itemSubtitle: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginTop: 2,
        lineHeight: 15,
    },
    itemValue: {
        fontSize: 13.5,
        fontWeight: '600',
        color: COLORS.textPrimary,
        textAlign: 'right',
        flexShrink: 0,
    },
    dimmedValue: {
        color: COLORS.textMuted,
        fontWeight: '400',
    },
    itemSeparator: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginVertical: 9,
        width: '100%',
    },

    // Breakdown Toggle
    breakdownToggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.07)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: RADIUS.sm,
        marginTop: 8,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.15)',
        minHeight: 44,
    },
    breakdownToggleText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.primary,
    },

    // Itemized Charges Drawer
    itemizedChargesDrawer: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: RADIUS.md,
        padding: 12,
        marginTop: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        width: '100%',
    },
    submeterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
        width: '100%',
    },
    submeterLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    submeterVal: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
    readingsBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: RADIUS.sm,
        padding: 8,
        marginBottom: 8,
        gap: 4,
    },
    readingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    readingLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
    },
    readingVal: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    epiraHeader: {
        fontSize: 10.5,
        fontWeight: '700',
        color: COLORS.textMuted,
        letterSpacing: 0.5,
        marginBottom: 6,
        marginTop: 4,
    },
    epiraGrid: {
        gap: 5,
        marginBottom: 8,
    },
    epiraItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    epiraLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    epiraVal: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    drawerFeeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.06)',
    },
    drawerFeeLabel: {
        fontSize: 11.5,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    drawerFeeSub: {
        fontSize: 10,
        color: COLORS.textMuted,
    },
    drawerFeeVal: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },

    // Total Outstanding Highlight
    totalOutstandingDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        marginTop: 10,
        marginBottom: 10,
        width: '100%',
    },
    totalOutstandingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 2,
    },
    totalOutstandingLabel: {
        fontSize: 14.5,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    totalOutstandingSub: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginTop: 1,
    },
    totalOutstandingValue: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.primary,
        letterSpacing: -0.4,
    },

    // Overdue List
    overdueSection: {
        marginBottom: 14,
        width: '100%',
    },
    overdueCountBadge: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: RADIUS.full,
    },
    overdueCountText: {
        fontSize: 10.5,
        fontWeight: '700',
        color: COLORS.danger,
    },
    overdueCard: {
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        backgroundColor: 'rgba(239, 68, 68, 0.03)',
        width: '100%',
    },
    pendingOverdueCard: {
        borderColor: 'rgba(245, 158, 11, 0.3)',
        backgroundColor: 'rgba(245, 158, 11, 0.03)',
    },
    overdueCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    overdueTypeLabel: {
        fontSize: 10.5,
        fontWeight: '700',
        color: COLORS.danger,
        letterSpacing: 0.5,
    },
    overdueInvoiceNum: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginTop: 1,
    },
    overduePeriodText: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    daysLateBadgeWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: RADIUS.full,
    },
    daysLateBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.danger,
    },
    pendingBadgeWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: RADIUS.full,
    },
    pendingBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#F59E0B',
    },
    overdueGridBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        padding: 10,
        borderRadius: RADIUS.sm,
        marginBottom: 10,
    },
    gridCol: {
        flex: 1,
    },
    gridLabel: {
        fontSize: 10,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    gridVal: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    gridTotalVal: {
        fontSize: 13,
        fontWeight: '800',
        color: COLORS.danger,
    },
    overdueActionsRow: {
        flexDirection: 'row',
        gap: 8,
        width: '100%',
    },
    overdueDetailsBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        borderRadius: RADIUS.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        minHeight: 44,
    },
    overdueDetailsBtnText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    overduePayNowBtn: {
        flex: 1.4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        borderRadius: RADIUS.sm,
        backgroundColor: '#DC2626',
        minHeight: 44,
    },
    overduePayNowBtnText: {
        fontSize: 11.5,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    overdueAwaitingBtn: {
        flex: 1.4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        borderRadius: RADIUS.sm,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)',
        minHeight: 44,
    },
    overdueAwaitingBtnText: {
        fontSize: 11.5,
        fontWeight: '700',
        color: '#F59E0B',
    },
    overdueDrawerBox: {
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.06)',
        gap: 4,
    },
    drawerDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    drawerDetailLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
    },
    drawerDetailVal: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },

    // Overdue Minimal Pagination Bar
    overduePaginationBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    overduePaginationText: {
        fontSize: 11,
        color: COLORS.textMuted,
    },
    overduePageBtn: {
        width: 32,
        height: 32,
        borderRadius: RADIUS.sm,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    overduePageIndicator: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        borderRadius: RADIUS.xs,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    overduePageIndicatorText: {
        fontSize: 10.5,
        fontWeight: '700',
        color: COLORS.textSecondary,
    },

    // Recent Settled History Card
    historyCardContainer: {
        padding: 0,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        width: '100%',
        overflow: 'hidden',
    },
    historyItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        width: '100%',
    },
    historyItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    },
    historyIconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    historyInvoiceText: {
        fontSize: 12.5,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    historyPeriodText: {
        fontSize: 10.5,
        color: COLORS.textMuted,
        marginTop: 1,
    },
    historyAmountText: {
        fontSize: 12.5,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    historyPaidBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: RADIUS.full,
        marginTop: 2,
    },
    historyPaidBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: COLORS.success,
    },
    emptyHistoryCard: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        width: '100%',
    },
    emptyHistoryTitle: {
        fontSize: 12.5,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    emptyHistorySub: {
        fontSize: 11,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginTop: 2,
    },

    // Compliance Policy Footer
    policyCard: {
        padding: 12,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        width: '100%',
        gap: 8,
    },
    policyItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    policyText: {
        flex: 1,
        fontSize: 11,
        color: COLORS.textMuted,
        lineHeight: 16,
    },

    // Skeleton
    skeletonLine: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 4,
    },

    // Error / Offline Recovery (ISO/IEC 25010)
    errorCenterContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
    },
    errorCard: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.25)',
    },
    errorTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 6,
        textAlign: 'center',
    },
    errorSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
        textAlign: 'center',
        marginBottom: 18,
        lineHeight: 18,
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: RADIUS.md,
        minHeight: 44,
    },
    retryBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
