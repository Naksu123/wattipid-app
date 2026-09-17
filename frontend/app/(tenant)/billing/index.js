import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, LayoutAnimation, Platform, UIManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCopilot, CopilotStep, walkthroughable } from 'react-native-copilot';
import { useTourAutoStart, useTourContext } from '@/contexts/TourContext';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { getTenantBillingOverview } from '../../../services/database';
import GlassCard from '../../../components/ui/GlassCard';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../../../styles/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
            <GlassCard style={styles.cardPrimary} premium>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={[styles.skeletonLine, { width: 140, height: 12 }]} />
                    <View style={[styles.skeletonLine, { width: 60, height: 20, borderRadius: 10 }]} />
                </View>
                <View style={[styles.skeletonLine, { width: 120, height: 32, marginBottom: 16 }]} />
                <View style={[styles.skeletonLine, { width: 100, height: 12, marginBottom: 6 }]} />
                <View style={[styles.skeletonLine, { width: 150, height: 16, marginBottom: 20 }]} />
                <View style={[styles.skeletonLine, { width: '100%', height: 48, borderRadius: 12 }]} />
            </GlassCard>

            {/* Section Title Skeleton */}
            <View style={[styles.skeletonLine, { width: 130, height: 12, marginBottom: 12, marginLeft: 4 }]} />
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
    
    // Authoritative Overview State
    const [overviewData, setOverviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedSection, setExpandedSection] = useState('electricity');
    const [showCurrentBreakdown, setShowCurrentBreakdown] = useState(false);
    const [expandedOverdueId, setExpandedOverdueId] = useState(null);
    
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

    // ─── 2. Authoritative Data Fetch ──────────────────────────────
    const fetchOverview = useCallback(async () => {
        if (!user?.room_id) {
            setLoading(false);
            return;
        }
        const currentSeq = ++reqSeqRef.current;
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
                await AsyncStorage.setItem(`cached_tenant_billing_overview_${user.room_id}`, JSON.stringify(overview));
            }
        } catch (error) {
            console.error('Failed to fetch billing overview:', error);
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

    const onRefresh = () => {
        setRefreshing(true);
        fetchOverview();
    };

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const toggleOverdueDetails = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedOverdueId(expandedOverdueId === id ? null : id);
    };

    const toggleCurrentBreakdown = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowCurrentBreakdown(!showCurrentBreakdown);
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

    const currentBill = overviewData?.current_bill;
    const activeCycle = overviewData?.active_cycle;
    const currentBillState = overviewData?.current_bill_state || (currentBill ? 'generated' : (activeCycle ? 'cycle_active' : 'none'));
    const overdueBills = overviewData?.overdue_bills || [];
    const totalOutstanding = overviewData?.total_outstanding || {
        current_bill_due: 0.00,
        previous_balance: 0.00,
        overdue_penalties: 0.00,
        total_overdue: 0.00,
        grand_total: 0.00,
    };
    const hasCurrentBill = currentBillState === 'generated' && !!currentBill;
    const isCycleActive = currentBillState === 'cycle_active' && !!activeCycle;
    const hasOverdue = !!overviewData?.has_overdue && overdueBills.length > 0;

    const currentStatusConfig = currentBill ? getStatusConfig(currentBill.payment_status) : null;
    const isCurrentPaid = currentBill?.payment_status === 'paid';
    const isCurrentPending = currentBill?.payment_status === 'pending_verification';

    const formatDate = (dateStr, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', options);
        } catch {
            return dateStr;
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView 
                ref={scrollViewRef}
                contentContainerStyle={styles.scroll} 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >
                {/* ═══════════════════════════════════════════════════════════
                    BRAND / DASHBOARD HEADER
                   ═══════════════════════════════════════════════════════════ */}
                <View style={styles.brandRow}>
                    <View style={styles.brandPill}>
                        <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
                        <Text style={styles.brandPillText}>WATTIPID BILLING</Text>
                    </View>
                    <View style={styles.roomPill}>
                        <Ionicons name="home-outline" size={13} color={COLORS.textSecondary} />
                        <Text style={styles.roomPillText}>{user?.room_id || 'Assigned Room'}</Text>
                    </View>
                </View>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 1: CURRENT BILL (Dedicated Current Cycle Section)
                   ═══════════════════════════════════════════════════════════ */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitlePrimary}>CURRENT BILL</Text>
                    {hasCurrentBill && currentBill?.cycle_start && currentBill?.cycle_end && (
                        <Text style={styles.sectionPeriodSub}>
                            {formatDate(currentBill.cycle_start)} – {formatDate(currentBill.cycle_end)}
                        </Text>
                    )}
                    {isCycleActive && activeCycle?.cycle_start && activeCycle?.cycle_end && (
                        <Text style={styles.sectionPeriodSub}>
                            {formatDate(activeCycle.cycle_start)} – {formatDate(activeCycle.cycle_end)}
                        </Text>
                    )}
                </View>

                {hasCurrentBill ? (
                    /* CASE B (State 3): Completed current bill has been generated */
                    <CopilotStep
                        text="This is your current billing cycle invoice. It contains only current cycle usage charges."
                        order={2}
                        name="billing_amountDue"
                    >
                        <CopilotView style={styles.copilotFullWidth}>
                            <GlassCard style={styles.cardPrimary} premium>
                                {activeCycle && (
                                    <View style={styles.activeRecordingBanner}>
                                        <View style={styles.pulseDot} />
                                        <Text style={styles.activeRecordingText} numberOfLines={1} ellipsizeMode="tail">
                                            Next cycle recording active ({formatDate(activeCycle.cycle_start)} – {formatDate(activeCycle.cycle_end)})
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.cardHeaderRow}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Text style={styles.invoiceLabel}>Invoice Number</Text>
                                        <Text style={styles.invoiceValue} numberOfLines={1}>{currentBill.invoice_number || 'N/A'}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: currentStatusConfig.bg }]}>
                                        <Ionicons name={currentStatusConfig.icon} size={11} color={currentStatusConfig.color} style={{ marginRight: 4 }} />
                                        <Text style={[styles.statusText, { color: currentStatusConfig.color }]}>
                                            {currentStatusConfig.text}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.costBlock}>
                                    <Text style={styles.costLabel}>Current Cycle Cost</Text>
                                    <Text style={styles.costValue} numberOfLines={1}>
                                        ₱{parseFloat(currentBill.current_cycle_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>
                                    {parseFloat(currentBill.penalty_amount || 0) > 0 && (
                                        <Text style={styles.penaltySub} numberOfLines={1}>
                                            + ₱{parseFloat(currentBill.penalty_amount).toFixed(2)} current late penalty
                                        </Text>
                                    )}
                                    {parseFloat(currentBill.amount_paid || 0) > 0 && (
                                        <Text style={styles.paidSub} numberOfLines={1}>
                                            - ₱{parseFloat(currentBill.amount_paid).toFixed(2)} already paid
                                        </Text>
                                    )}
                                </View>

                                <View style={styles.dueRow}>
                                    <View style={{ flex: 1, marginRight: 8 }}>
                                        <Text style={styles.dueLabel}>Due Date</Text>
                                        <Text style={styles.dueValue} numberOfLines={1}>{formatDate(currentBill.due_date, { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
                                    </View>
                                    {currentBill.payment_status === 'overdue' && (
                                        <View style={styles.overdueFlag}>
                                            <Ionicons name="alert-circle" size={12} color={COLORS.danger} />
                                            <Text style={styles.overdueFlagText}>Past Due</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Action Buttons for Current Bill - 100% Overflow Protected */}
                                <View style={styles.btnRow}>
                                    <TouchableOpacity 
                                        style={styles.secondaryBtn} 
                                        onPress={toggleCurrentBreakdown}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name={showCurrentBreakdown ? "chevron-up" : "receipt-outline"} size={14} color={COLORS.primary} />
                                        <Text 
                                            style={styles.secondaryBtnText} 
                                            numberOfLines={1} 
                                            ellipsizeMode="tail"
                                            adjustsFontSizeToFit={true}
                                            minimumFontScale={0.75}
                                        >
                                            {showCurrentBreakdown ? "Hide Breakdown" : "View Breakdown"}
                                        </Text>
                                    </TouchableOpacity>

                                    {!isCurrentPaid && !isCurrentPending ? (
                                        <TouchableOpacity 
                                            style={styles.primaryPayBtn}
                                            onPress={() => router.push({
                                                pathname: '/(tenant)/payment',
                                                params: { 
                                                    cycleId: currentBill.id, 
                                                    type: 'current',
                                                    amount: currentBill.amount_due 
                                                }
                                            })}
                                            activeOpacity={0.85}
                                        >
                                            <Ionicons name="card" size={14} color="#fff" />
                                            <Text 
                                                style={styles.primaryPayBtnText} 
                                                numberOfLines={1} 
                                                ellipsizeMode="tail"
                                                adjustsFontSizeToFit={true}
                                                minimumFontScale={0.75}
                                            >
                                                Pay Current Bill
                                            </Text>
                                        </TouchableOpacity>
                                    ) : isCurrentPending ? (
                                        <View style={styles.pendingBadgeBox}>
                                            <Ionicons name="time-outline" size={13} color={COLORS.warning} />
                                            <Text 
                                                style={styles.pendingBadgeText} 
                                                numberOfLines={1} 
                                                ellipsizeMode="tail"
                                                adjustsFontSizeToFit={true}
                                                minimumFontScale={0.75}
                                            >
                                                Pending Review
                                            </Text>
                                        </View>
                                    ) : (
                                        <View style={styles.paidBadgeBox}>
                                            <Ionicons name="checkmark-circle" size={13} color={COLORS.success} />
                                            <Text 
                                                style={styles.paidBadgeText} 
                                                numberOfLines={1} 
                                                ellipsizeMode="tail"
                                                adjustsFontSizeToFit={true}
                                                minimumFontScale={0.75}
                                            >
                                                Settled
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Inline Expandable Breakdown for Current Bill - 100% Overflow Protected */}
                                {showCurrentBreakdown && (
                                    <View style={styles.inlineBreakdownBox}>
                                        <View style={styles.inlineBreakdownHeader}>
                                            <Ionicons name="receipt-outline" size={13} color={COLORS.primary} />
                                            <Text style={styles.inlineBreakdownTitle}>Current Cycle Itemized Charges</Text>
                                        </View>

                                        {/* Electricity */}
                                        <View style={styles.breakdownRow}>
                                            <View style={{ flex: 1, marginRight: 8 }}>
                                                <Text style={styles.breakdownItemLabel}>Electricity Charge</Text>
                                                <Text style={styles.breakdownItemSub}>
                                                    {parseFloat(currentBill.total_kwh || 0).toFixed(2)} kWh @ ₱{parseFloat(currentBill.rate_per_kwh || 12.50).toFixed(2)}/kWh
                                                </Text>
                                            </View>
                                            <Text style={styles.breakdownItemVal}>
                                                ₱{parseFloat(currentBill.breakdown?.electricity || currentBill.electricity_charge || 0).toFixed(2)}
                                            </Text>
                                        </View>

                                        {/* Meter Readings & EPIRA Subcomponents Box */}
                                        <View style={styles.inlineMeterSubBox}>
                                            <View style={styles.inlineMeterRow}>
                                                <Text style={styles.inlineMeterLabel}>Previous Reading:</Text>
                                                <Text style={styles.inlineMeterVal}>{parseFloat(currentBill.previous_reading || 0).toFixed(4)} kWh</Text>
                                            </View>
                                            <View style={styles.inlineMeterRow}>
                                                <Text style={styles.inlineMeterLabel}>Current Reading:</Text>
                                                <Text style={styles.inlineMeterVal}>{parseFloat(currentBill.current_reading || 0).toFixed(4)} kWh</Text>
                                            </View>
                                            <View style={styles.inlineMeterDivider} />
                                            <View style={styles.inlineMeterRow}>
                                                <Text style={styles.inlineMeterLabel}>Generation Charge:</Text>
                                                <Text style={styles.inlineMeterVal}>₱{parseFloat(currentBill.breakdown?.generation || 0).toFixed(2)}</Text>
                                            </View>
                                            <View style={styles.inlineMeterRow}>
                                                <Text style={styles.inlineMeterLabel}>Transmission Charge:</Text>
                                                <Text style={styles.inlineMeterVal}>₱{parseFloat(currentBill.breakdown?.transmission || 0).toFixed(2)}</Text>
                                            </View>
                                            <View style={styles.inlineMeterRow}>
                                                <Text style={styles.inlineMeterLabel}>System Loss Charge:</Text>
                                                <Text style={styles.inlineMeterVal}>₱{parseFloat(currentBill.breakdown?.system_loss || 0).toFixed(2)}</Text>
                                            </View>
                                            <View style={styles.inlineMeterRow}>
                                                <Text style={styles.inlineMeterLabel}>Distribution Charge:</Text>
                                                <Text style={styles.inlineMeterVal}>₱{parseFloat(currentBill.breakdown?.distribution || 0).toFixed(2)}</Text>
                                            </View>
                                            <View style={styles.inlineMeterRow}>
                                                <Text style={styles.inlineMeterLabel}>Metering & Supply:</Text>
                                                <Text style={styles.inlineMeterVal}>
                                                    ₱{(parseFloat(currentBill.breakdown?.metering || 0) + parseFloat(currentBill.breakdown?.supply || 0)).toFixed(2)}
                                                </Text>
                                            </View>
                                            <View style={styles.inlineMeterRow}>
                                                <Text style={styles.inlineMeterLabel}>Value Added Tax (VAT):</Text>
                                                <Text style={styles.inlineMeterVal}>₱{parseFloat(currentBill.breakdown?.vat || 0).toFixed(2)}</Text>
                                            </View>
                                        </View>

                                        {/* Miscellaneous Fee */}
                                        <View style={styles.breakdownRow}>
                                            <View style={{ flex: 1, marginRight: 8 }}>
                                                <Text style={styles.breakdownItemLabel}>Miscellaneous Fee</Text>
                                                <Text style={styles.breakdownItemSub}>Common area maintenance & facilities</Text>
                                            </View>
                                            <Text style={styles.breakdownItemVal}>
                                                ₱{parseFloat(currentBill.miscellaneous_fee || currentBill.breakdown?.miscellaneous || 0).toFixed(2)}
                                            </Text>
                                        </View>

                                        {/* Monthly Rent (if > 0) */}
                                        {parseFloat(currentBill.monthly_rent || currentBill.breakdown?.rent || 0) > 0 && (
                                            <View style={styles.breakdownRow}>
                                                <View style={{ flex: 1, marginRight: 8 }}>
                                                    <Text style={styles.breakdownItemLabel}>Monthly Room Rent</Text>
                                                    <Text style={styles.breakdownItemSub}>Fixed room accommodation charge</Text>
                                                </View>
                                                <Text style={styles.breakdownItemVal}>
                                                    ₱{parseFloat(currentBill.monthly_rent || currentBill.breakdown?.rent).toFixed(2)}
                                                </Text>
                                            </View>
                                        )}

                                        <View style={styles.inlineBreakdownDivider} />

                                        {/* Total Current Cycle Sum */}
                                        <View style={styles.inlineBreakdownTotalRow}>
                                            <Text style={styles.inlineBreakdownTotalLabel} numberOfLines={1}>
                                                Total Current Cycle Cost
                                            </Text>
                                            <Text style={styles.inlineBreakdownTotalVal}>
                                                ₱{parseFloat(currentBill.current_cycle_cost || 0).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </GlassCard>
                        </CopilotView>
                    </CopilotStep>
                ) : isCycleActive ? (
                    /* CASE A (State 2): Current billing cycle is active, recording consumption */
                    <CopilotStep
                        text="Your current cycle is actively recording consumption. Bill is generated at the end of the cycle."
                        order={2}
                        name="billing_amountDue"
                    >
                        <CopilotView style={styles.copilotFullWidth}>
                            <GlassCard style={styles.activeCycleCard} premium>
                                <View style={styles.cardHeaderRow}>
                                    <View style={styles.cycleBadgeActive}>
                                        <View style={styles.pulseDotLarge} />
                                        <Text style={styles.cycleBadgeText}>CURRENT CYCLE ACTIVE</Text>
                                    </View>
                                    <View style={styles.liveRecordingChip}>
                                        <Ionicons name="flash" size={12} color={COLORS.primary} />
                                        <Text style={styles.liveRecordingText}>Recording Live Usage</Text>
                                    </View>
                                </View>

                                <View style={styles.activeCycleBody}>
                                    <Text style={styles.activeCycleHeading}>Current billing cycle is active</Text>
                                    <Text style={styles.activeCycleDesc}>
                                        Your current electricity consumption is actively being recorded by the submeter. The bill will be generated at the end of the billing cycle.
                                    </Text>
                                </View>

                                <View style={styles.activeCycleMetaBox}>
                                    <View style={styles.metaRowItem}>
                                        <Ionicons name="calendar-outline" size={15} color={COLORS.textSecondary} />
                                        <Text style={styles.metaRowLabel}>Cycle Period:</Text>
                                        <Text style={styles.metaRowValue}>
                                            {formatDate(activeCycle.cycle_start)} – {formatDate(activeCycle.cycle_end)}
                                        </Text>
                                    </View>
                                    <View style={styles.metaRowItem}>
                                        <Ionicons name="time-outline" size={15} color={COLORS.textSecondary} />
                                        <Text style={styles.metaRowLabel}>Bill Generation Date:</Text>
                                        <Text style={styles.metaRowValue}>
                                            {formatDate(activeCycle.cycle_end)}
                                        </Text>
                                    </View>
                                    <View style={styles.metaRowItem}>
                                        <Ionicons name="cash-outline" size={15} color={COLORS.textSecondary} />
                                        <Text style={styles.metaRowLabel}>Current Bill Due:</Text>
                                        <Text style={[styles.metaRowValue, { color: COLORS.success, fontWeight: '700' }]}>
                                            ₱0.00 (Unbilled)
                                        </Text>
                                    </View>
                                </View>
                            </GlassCard>
                        </CopilotView>
                    </CopilotStep>
                ) : (
                    /* STATE 1: Genuinely no current billing activity */
                    <GlassCard style={styles.emptyCard}>
                        <Ionicons name="calendar-outline" size={32} color={COLORS.textSecondary} />
                        <Text style={styles.emptyTitle}>NO CURRENT BILL</Text>
                        <Text style={styles.emptyDesc}>
                            No active billing cycle or pending invoice found for your room.
                        </Text>
                    </GlassCard>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 2: OVERDUE BALANCES (Warning / Danger Section)
                   ═══════════════════════════════════════════════════════════ */}
                <View style={styles.sectionHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.sectionTitleWarning}>OVERDUE BALANCES</Text>
                        {hasOverdue && (
                            <View style={styles.countBadge}>
                                <Text style={styles.countBadgeText}>{overdueBills.length}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {hasOverdue ? (
                    <View style={{ gap: 12 }}>
                        {overdueBills.map((item) => {
                            const isExpanded = expandedOverdueId === item.id;
                            return (
                                <GlassCard key={item.id} style={styles.overdueCard}>
                                    <View style={styles.cardHeaderRow}>
                                        <View style={{ flex: 1, marginRight: 8 }}>
                                            <Text style={styles.overdueInvoiceLabel}>Previous Billing</Text>
                                            <Text style={styles.overdueInvoiceValue} numberOfLines={1}>
                                                {item.invoice_number || `WT-2026-${item.id}`}
                                            </Text>
                                        </View>
                                        <View style={styles.daysLateBadge}>
                                            <Ionicons name="time-outline" size={12} color="#EF4444" />
                                            <Text style={styles.daysLateText}>
                                                {item.days_overdue > 0 ? `${item.days_overdue} Days Late` : 'Overdue'}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.overduePeriodText} numberOfLines={1}>
                                        Billing Period: {formatDate(item.cycle_start)} – {formatDate(item.cycle_end)}
                                    </Text>

                                    <View style={styles.overdueGrid}>
                                        <View style={styles.overdueCol}>
                                            <Text style={styles.overdueSubLabel} numberOfLines={1}>Previous Base</Text>
                                            <Text style={styles.overdueSubValue} numberOfLines={1}>
                                                ₱{parseFloat(item.base_amount || 0).toFixed(2)}
                                            </Text>
                                        </View>
                                        <View style={styles.overdueCol}>
                                            <Text style={styles.overdueSubLabel} numberOfLines={1}>Late Penalty</Text>
                                            <Text style={[styles.overdueSubValue, { color: COLORS.danger }]} numberOfLines={1}>
                                                +₱{parseFloat(item.penalty_amount || 0).toFixed(2)}
                                            </Text>
                                        </View>
                                        <View style={[styles.overdueCol, { alignItems: 'flex-end' }]}>
                                            <Text style={styles.overdueSubLabel} numberOfLines={1}>Total Overdue</Text>
                                            <Text style={styles.overdueTotalValue} numberOfLines={1}>
                                                ₱{parseFloat(item.total_overdue || 0).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Action Buttons for Overdue Bill - 100% Overflow Protected */}
                                    <View style={styles.btnRow}>
                                        <TouchableOpacity 
                                            style={styles.secondaryBtn} 
                                            onPress={() => toggleOverdueDetails(item.id)}
                                            activeOpacity={0.8}
                                        >
                                            <Ionicons name={isExpanded ? "chevron-up" : "information-circle-outline"} size={14} color={COLORS.primary} />
                                            <Text 
                                                style={styles.secondaryBtnText} 
                                                numberOfLines={1} 
                                                ellipsizeMode="tail"
                                                adjustsFontSizeToFit={true}
                                                minimumFontScale={0.75}
                                            >
                                                {isExpanded ? "Hide Details" : "View Details"}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity 
                                            style={styles.overduePayBtn}
                                            onPress={() => router.push({
                                                pathname: '/(tenant)/payment',
                                                params: { 
                                                    cycleId: item.id, 
                                                    type: 'overdue',
                                                    amount: item.total_overdue,
                                                    invoiceNumber: item.invoice_number 
                                                }
                                            })}
                                            activeOpacity={0.85}
                                        >
                                            <Ionicons name="warning-outline" size={14} color="#fff" />
                                            <Text 
                                                style={styles.overduePayBtnText} 
                                                numberOfLines={1} 
                                                ellipsizeMode="tail"
                                                adjustsFontSizeToFit={true}
                                                minimumFontScale={0.75}
                                            >
                                                Pay Overdue
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Expandable Details for this Overdue Bill - Overflow Protected */}
                                    {isExpanded && (
                                        <View style={styles.expandedOverdueBox}>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel} numberOfLines={1}>Original Due Date</Text>
                                                <Text style={styles.detailValue} numberOfLines={1}>{formatDate(item.due_date)}</Text>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel} numberOfLines={1}>Base Cycle Charges</Text>
                                                <Text style={styles.detailValue} numberOfLines={1}>₱{parseFloat(item.base_amount || 0).toFixed(2)}</Text>
                                            </View>
                                            <View style={styles.detailRow}>
                                                <Text style={styles.detailLabel} numberOfLines={1}>Late Payment Penalty</Text>
                                                <Text style={[styles.detailValue, { color: COLORS.danger }]} numberOfLines={1}>
                                                    ₱{parseFloat(item.penalty_amount || 0).toFixed(2)}
                                                </Text>
                                            </View>
                                            {parseFloat(item.amount_paid || 0) > 0 && (
                                                <View style={styles.detailRow}>
                                                    <Text style={styles.detailLabel} numberOfLines={1}>Amount Already Paid</Text>
                                                    <Text style={[styles.detailValue, { color: COLORS.success }]} numberOfLines={1}>
                                                        -₱{parseFloat(item.amount_paid).toFixed(2)}
                                                    </Text>
                                                </View>
                                            )}
                                            <View style={[styles.detailRow, styles.detailRowTotal]}>
                                                <Text style={styles.detailTotalLabel} numberOfLines={1}>Total Outstanding</Text>
                                                <Text style={styles.detailTotalValue} numberOfLines={1}>
                                                    ₱{parseFloat(item.total_overdue || 0).toFixed(2)}
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                </GlassCard>
                            );
                        })}
                    </View>
                ) : (
                    /* Zero Overdue Balances Card */
                    <GlassCard style={styles.settledCard}>
                        <View style={styles.settledRow}>
                            <View style={styles.settledIconWrap}>
                                <Ionicons name="checkmark-sharp" size={18} color={COLORS.success} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settledTitle}>No Overdue Balance</Text>
                                <Text style={styles.settledDesc}>All previous billing cycles are fully settled. Thank you for paying on time!</Text>
                            </View>
                        </View>
                    </GlassCard>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 3: TOTAL OUTSTANDING SUMMARY
                   ═══════════════════════════════════════════════════════════ */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitleSummary}>TOTAL OUTSTANDING</Text>
                </View>

                <GlassCard style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Current Bill</Text>
                        <Text style={styles.summaryValue}>
                            ₱{parseFloat(totalOutstanding.current_bill_due || 0).toFixed(2)}
                        </Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Previous Balance</Text>
                        <Text style={styles.summaryValue}>
                            ₱{parseFloat(totalOutstanding.previous_balance || 0).toFixed(2)}
                        </Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Overdue Penalties</Text>
                        <Text style={[styles.summaryValue, parseFloat(totalOutstanding.overdue_penalties || 0) > 0 && { color: COLORS.danger }]}>
                            ₱{parseFloat(totalOutstanding.overdue_penalties || 0).toFixed(2)}
                        </Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.grandTotalRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.grandTotalLabel}>Total Outstanding</Text>
                            <Text style={styles.summaryCaption} numberOfLines={2}>Summary of all active & prior unsettled charges</Text>
                        </View>
                        <Text style={styles.grandTotalValue}>
                            ₱{parseFloat(totalOutstanding.grand_total || 0).toFixed(2)}
                        </Text>
                    </View>

                    {/* Quick Payment Options Trigger */}
                    {parseFloat(totalOutstanding.grand_total || 0) > 0 && (
                        <TouchableOpacity
                            style={styles.optionsBtn}
                            onPress={() => {
                                const target = (hasOverdue && overdueBills[0]) ? overdueBills[0] : currentBill;
                                if (target) {
                                    router.push({
                                        pathname: '/(tenant)/payment',
                                        params: { 
                                            cycleId: target.id, 
                                            type: hasOverdue ? 'overdue' : 'current',
                                            amount: hasOverdue ? target.total_overdue : target.amount_due,
                                            invoiceNumber: target.invoice_number 
                                        }
                                    });
                                }
                            }}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="card-outline" size={16} color={COLORS.primary} />
                            <Text style={styles.optionsBtnText}>Proceed to Payment</Text>
                        </TouchableOpacity>
                    )}
                </GlassCard>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 4: QUICK ACTION TILES
                   ═══════════════════════════════════════════════════════════ */}
                <CopilotStep
                    text="Use these shortcuts to view your full history or download PDF invoices."
                    order={3}
                    name="billing_actions"
                >
                    <CopilotView style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => router.push('/(tenant)/billing-history')}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                            <Text style={styles.actionBtnText}>Payment History</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => {
                                const targetCycle = currentBill || (overdueBills.length > 0 ? overdueBills[0] : null);
                                if (targetCycle) {
                                    router.push({
                                        pathname: '/(tenant)/pdf-viewer',
                                        params: { 
                                            invoiceNumber: targetCycle.invoice_number,
                                            cycleId: targetCycle.id 
                                        }
                                    });
                                } else {
                                    showModal({ type: 'info', title: 'Invoice', message: 'No completed invoices available to view.' });
                                }
                            }}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
                            <Text style={styles.actionBtnText}>Download Invoice</Text>
                        </TouchableOpacity>
                    </CopilotView>
                </CopilotStep>

                {/* ═══════════════════════════════════════════════════════════
                    SECTION 5: CURRENT CYCLE ITEMIZED BREAKDOWN (Accordion)
                   ═══════════════════════════════════════════════════════════ */}
                {currentBill && (
                    <CopilotStep
                        text="Here is the detailed itemized cost breakdown for your current cycle charges."
                        order={4}
                        name="billing_breakdown"
                    >
                        <CopilotView style={styles.copilotFullWidth}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={styles.sectionTitle}>CURRENT CYCLE BREAKDOWN</Text>
                            </View>

                            <GlassCard style={styles.breakdownContainer}>
                                {/* Electricity Item */}
                                <View style={styles.accordionItem}>
                                    <TouchableOpacity
                                        style={styles.accordionHeader}
                                        onPress={() => toggleSection('electricity')}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[styles.accordionIconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                                            <Ionicons name="flash" size={18} color="#3B82F6" />
                                        </View>
                                        <View style={styles.accordionTitleWrap}>
                                            <Text style={styles.accordionTitle} numberOfLines={1}>Electricity Charge</Text>
                                            <Text style={styles.accordionSub} numberOfLines={1}>
                                                {parseFloat(currentBill.total_kwh || 0).toFixed(2)} kWh @ ₱{parseFloat(currentBill.rate_per_kwh || 12.50).toFixed(2)}/kWh
                                            </Text>
                                        </View>
                                        <View style={styles.accordionRight}>
                                            <Text style={styles.accordionAmount}>
                                                ₱{parseFloat(currentBill.breakdown?.electricity || currentBill.electricity_charge || 0).toFixed(2)}
                                            </Text>
                                            <Ionicons 
                                                name={expandedSection === 'electricity' ? "chevron-up" : "chevron-down"} 
                                                size={16} 
                                                color={COLORS.textSecondary} 
                                            />
                                        </View>
                                    </TouchableOpacity>

                                    {expandedSection === 'electricity' && (
                                        <View style={styles.accordionBody}>
                                            <Text style={styles.accordionDesc}>
                                                Submeter consumption charges regulated under Republic Act 9136 (EPIRA).
                                            </Text>
                                            <View style={styles.meterBox}>
                                                <View style={styles.meterRow}>
                                                    <Text style={styles.meterLabel} numberOfLines={1}>Previous Reading</Text>
                                                    <Text style={styles.meterValue}>{parseFloat(currentBill.previous_reading || 0).toFixed(4)} kWh</Text>
                                                </View>
                                                <View style={styles.meterRow}>
                                                    <Text style={styles.meterLabel} numberOfLines={1}>Current Reading</Text>
                                                    <Text style={styles.meterValue}>{parseFloat(currentBill.current_reading || 0).toFixed(4)} kWh</Text>
                                                </View>
                                                <View style={styles.divider} />
                                                <View style={styles.meterRow}>
                                                    <Text style={styles.meterLabel} numberOfLines={1}>Generation Charge</Text>
                                                    <Text style={styles.meterValue}>₱{parseFloat(currentBill.breakdown?.generation || 0).toFixed(2)}</Text>
                                                </View>
                                                <View style={styles.meterRow}>
                                                    <Text style={styles.meterLabel} numberOfLines={1}>Transmission Charge</Text>
                                                    <Text style={styles.meterValue}>₱{parseFloat(currentBill.breakdown?.transmission || 0).toFixed(2)}</Text>
                                                </View>
                                                <View style={styles.meterRow}>
                                                    <Text style={styles.meterLabel} numberOfLines={1}>System Loss Charge</Text>
                                                    <Text style={styles.meterValue}>₱{parseFloat(currentBill.breakdown?.system_loss || 0).toFixed(2)}</Text>
                                                </View>
                                                <View style={styles.meterRow}>
                                                    <Text style={styles.meterLabel} numberOfLines={1}>Distribution Charge</Text>
                                                    <Text style={styles.meterValue}>₱{parseFloat(currentBill.breakdown?.distribution || 0).toFixed(2)}</Text>
                                                </View>
                                                <View style={styles.meterRow}>
                                                    <Text style={styles.meterLabel} numberOfLines={1}>Metering & Supply</Text>
                                                    <Text style={styles.meterValue}>
                                                        ₱{(parseFloat(currentBill.breakdown?.metering || 0) + parseFloat(currentBill.breakdown?.supply || 0)).toFixed(2)}
                                                    </Text>
                                                </View>
                                                <View style={styles.meterRow}>
                                                    <Text style={styles.meterLabel} numberOfLines={1}>Value Added Tax (VAT)</Text>
                                                    <Text style={styles.meterValue}>₱{parseFloat(currentBill.breakdown?.vat || 0).toFixed(2)}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {/* Miscellaneous Fee */}
                                <View style={styles.accordionItem}>
                                    <TouchableOpacity
                                        style={styles.accordionHeader}
                                        onPress={() => toggleSection('misc')}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[styles.accordionIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                                            <Ionicons name="construct-outline" size={18} color={COLORS.warning} />
                                        </View>
                                        <View style={styles.accordionTitleWrap}>
                                            <Text style={styles.accordionTitle} numberOfLines={1}>Miscellaneous Fee</Text>
                                            <Text style={styles.accordionSub} numberOfLines={1}>Common area maintenance & facilities</Text>
                                        </View>
                                        <View style={styles.accordionRight}>
                                            <Text style={styles.accordionAmount}>
                                                ₱{parseFloat(currentBill.miscellaneous_fee || currentBill.breakdown?.miscellaneous || 0).toFixed(2)}
                                            </Text>
                                            <Ionicons 
                                                name={expandedSection === 'misc' ? "chevron-up" : "chevron-down"} 
                                                size={16} 
                                                color={COLORS.textSecondary} 
                                            />
                                        </View>
                                    </TouchableOpacity>

                                    {expandedSection === 'misc' && (
                                        <View style={styles.accordionBody}>
                                            <Text style={styles.accordionDesc}>
                                                Covers common hallway lighting, water pump operation, and facility management maintenance.
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Monthly Rent (if configured) */}
                                {parseFloat(currentBill.monthly_rent || currentBill.breakdown?.rent || 0) > 0 && (
                                    <View style={styles.accordionItem}>
                                        <View style={styles.accordionHeader}>
                                            <View style={[styles.accordionIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                                                <Ionicons name="home" size={18} color={COLORS.success} />
                                            </View>
                                            <View style={styles.accordionTitleWrap}>
                                                <Text style={styles.accordionTitle} numberOfLines={1}>Monthly Room Rent</Text>
                                                <Text style={styles.accordionSub} numberOfLines={1}>Fixed room accommodation charge</Text>
                                            </View>
                                            <View style={styles.accordionRight}>
                                                <Text style={styles.accordionAmount}>
                                                    ₱{parseFloat(currentBill.monthly_rent || currentBill.breakdown?.rent).toFixed(2)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {/* Pure Current Cycle Sum (Guaranteed zero previous balance) */}
                                <View style={styles.totalComputationRow}>
                                    <View style={styles.totalComputationLabelWrap}>
                                        <Text style={styles.totalComputationLabel} numberOfLines={1}>Total Current Cycle Cost</Text>
                                        <Text style={styles.totalComputationSub} numberOfLines={1}>Electricity + Miscellaneous + Rent</Text>
                                    </View>
                                    <Text style={styles.totalComputationValue}>
                                        ₱{parseFloat(currentBill.current_cycle_cost || 0).toFixed(2)}
                                    </Text>
                                </View>
                            </GlassCard>
                        </CopilotView>
                    </CopilotStep>
                )}

                {/* Information Card when cycle is active but not billed yet */}
                {isCycleActive && !currentBill && (
                    <GlassCard style={styles.activeInfoCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.activeInfoTitle}>Live Cycle in Progress</Text>
                        </View>
                        <Text style={styles.activeInfoText}>
                            Electricity meter consumption is actively accumulating for this room. Itemized power generation, transmission, and common charges will be calculated and displayed once the billing cycle concludes on {formatDate(activeCycle.cycle_end)}.
                        </Text>
                    </GlassCard>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    BILLING POLICY NOTES
                   ═══════════════════════════════════════════════════════════ */}
                <GlassCard style={styles.notesCard}>
                    <View style={styles.noteItem}>
                        <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.noteText}>Bills are generated monthly based on actual IoT submeter readings.</Text>
                    </View>
                    <View style={styles.noteItem}>
                        <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.noteText}>Historical overdue balances and late penalties are listed separately to ensure complete billing transparency.</Text>
                    </View>
                    <View style={styles.noteItem}>
                        <Ionicons name="warning-outline" size={16} color={COLORS.warning} />
                        <Text style={styles.noteText}>Daily penalties apply automatically at 12:00 AM once a bill passes its due date.</Text>
                    </View>
                </GlassCard>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scroll: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm, paddingBottom: 120 },
    copilotFullWidth: { width: '100%', alignSelf: 'stretch' },
    center: { justifyContent: 'center', alignItems: 'center' },

    // Brand Header
    brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 4 },
    brandPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
    brandPillText: { fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.8 },
    roomPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
    roomPillText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },

    // Section Titles
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10, paddingHorizontal: 4 },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 1 },
    sectionTitlePrimary: { fontSize: 13, fontWeight: '800', color: '#10B981', letterSpacing: 1 },
    sectionTitleWarning: { fontSize: 13, fontWeight: '800', color: '#EF4444', letterSpacing: 1 },
    sectionTitleSummary: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 1 },
    sectionPeriodSub: { fontSize: 11, color: COLORS.textMuted },
    countBadge: { backgroundColor: 'rgba(239, 68, 68, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
    countBadgeText: { fontSize: 11, fontWeight: '700', color: '#EF4444' },

    // Section 1: Current Bill Card (100% Overflow Protected)
    cardPrimary: { padding: SPACING.md, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.25)', width: '100%', overflow: 'hidden' },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, width: '100%' },
    invoiceLabel: { fontSize: 11, color: COLORS.textMuted, letterSpacing: 0.5 },
    invoiceValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.full, flexShrink: 0 },
    statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    
    costBlock: { marginBottom: 16, width: '100%' },
    costLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
    costValue: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
    penaltySub: { fontSize: 11, color: COLORS.danger, marginTop: 4, fontWeight: '500' },
    paidSub: { fontSize: 11, color: COLORS.success, marginTop: 4, fontWeight: '500' },

    dueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)', marginBottom: 12, width: '100%' },
    dueLabel: { fontSize: 11, color: COLORS.textMuted },
    dueValue: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginTop: 1 },
    overdueFlag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, flexShrink: 0 },
    overdueFlagText: { fontSize: 10, fontWeight: '700', color: COLORS.danger },

    // Button Row: 100% Overflow Protected with 50/50 flex, minWidth: 0, and auto-scaling
    btnRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, width: '100%' },
    secondaryBtn: { 
        flex: 1, 
        minWidth: 0,
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 4, 
        paddingVertical: 10, 
        paddingHorizontal: 6, 
        borderRadius: RADIUS.md, 
        backgroundColor: 'rgba(255, 255, 255, 0.05)', 
        borderWidth: 1, 
        borderColor: 'rgba(255, 255, 255, 0.1)',
        minHeight: 42,
        overflow: 'hidden',
    },
    secondaryBtnText: { 
        fontSize: 11.5, 
        fontWeight: '700', 
        color: COLORS.textPrimary, 
        flexShrink: 1,
        textAlign: 'center',
    },
    primaryPayBtn: { 
        flex: 1, 
        minWidth: 0,
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 4, 
        paddingVertical: 10, 
        paddingHorizontal: 6, 
        borderRadius: RADIUS.md, 
        backgroundColor: COLORS.primary,
        minHeight: 42,
        overflow: 'hidden',
    },
    primaryPayBtnText: { 
        fontSize: 11.5, 
        fontWeight: '700', 
        color: '#FFFFFF', 
        flexShrink: 1,
        textAlign: 'center',
    },
    pendingBadgeBox: { 
        flex: 1, 
        minWidth: 0,
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 4, 
        paddingVertical: 10, 
        paddingHorizontal: 6, 
        borderRadius: RADIUS.md, 
        backgroundColor: 'rgba(245, 158, 11, 0.1)', 
        borderWidth: 1, 
        borderColor: 'rgba(245, 158, 11, 0.25)',
        minHeight: 42,
        overflow: 'hidden',
    },
    pendingBadgeText: { 
        fontSize: 11.5, 
        fontWeight: '600', 
        color: COLORS.warning, 
        flexShrink: 1,
        textAlign: 'center',
    },
    paidBadgeBox: { 
        flex: 1, 
        minWidth: 0,
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 4, 
        paddingVertical: 10, 
        paddingHorizontal: 6, 
        borderRadius: RADIUS.md, 
        backgroundColor: 'rgba(16, 185, 129, 0.1)', 
        borderWidth: 1, 
        borderColor: 'rgba(16, 185, 129, 0.25)',
        minHeight: 42,
        overflow: 'hidden',
    },
    paidBadgeText: { 
        fontSize: 11.5, 
        fontWeight: '600', 
        color: COLORS.success, 
        flexShrink: 1,
        textAlign: 'center',
    },

    // Inline Breakdown Box (Inside Current Bill Card - 100% Overflow Protected)
    inlineBreakdownBox: {
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
        width: '100%',
    },
    inlineBreakdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
        width: '100%',
    },
    inlineBreakdownTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        flex: 1,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 6,
        width: '100%',
    },
    breakdownItemLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    breakdownItemSub: {
        fontSize: 10.5,
        color: COLORS.textMuted,
        marginTop: 1,
        lineHeight: 14,
    },
    breakdownItemVal: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textPrimary,
        textAlign: 'right',
        flexShrink: 0,
        marginLeft: 8,
    },
    inlineMeterSubBox: {
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        borderRadius: RADIUS.sm,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginVertical: 6,
        gap: 5,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
    },
    inlineMeterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    inlineMeterLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        flex: 1,
        marginRight: 8,
    },
    inlineMeterVal: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textPrimary,
        flexShrink: 0,
        textAlign: 'right',
    },
    inlineMeterDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        marginVertical: 3,
        width: '100%',
    },
    inlineBreakdownDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        marginVertical: 8,
        width: '100%',
    },
    inlineBreakdownTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 6,
        width: '100%',
    },
    inlineBreakdownTotalLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textPrimary,
        flex: 1,
        marginRight: 8,
    },
    inlineBreakdownTotalVal: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.primary,
        flexShrink: 0,
        textAlign: 'right',
    },

    // State 2: Active Cycle Card
    activeCycleCard: { padding: SPACING.md, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)', backgroundColor: 'rgba(59, 130, 246, 0.03)', width: '100%', overflow: 'hidden' },
    cycleBadgeActive: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(59, 130, 246, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
    pulseDotLarge: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6' },
    cycleBadgeText: { fontSize: 10, fontWeight: '800', color: '#60A5FA', letterSpacing: 0.8 },
    liveRecordingChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
    liveRecordingText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
    activeCycleBody: { marginVertical: 14 },
    activeCycleHeading: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
    activeCycleDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
    activeCycleMetaBox: { backgroundColor: 'rgba(0, 0, 0, 0.25)', borderRadius: RADIUS.md, padding: 12, gap: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', width: '100%' },
    metaRowItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
    metaRowLabel: { fontSize: 12, color: COLORS.textMuted, flex: 1, marginLeft: 6 },
    metaRowValue: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, flexShrink: 0 },
    activeRecordingBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(59, 130, 246, 0.08)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.md, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)', width: '100%' },
    pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6', flexShrink: 0 },
    activeRecordingText: { fontSize: 11, color: '#93C5FD', fontWeight: '600', flexShrink: 1 },

    activeInfoCard: { padding: SPACING.md, marginBottom: 16, backgroundColor: 'rgba(59, 130, 246, 0.05)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.15)', width: '100%' },
    activeInfoTitle: { fontSize: 13, fontWeight: '700', color: '#60A5FA' },
    activeInfoText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, marginTop: 4 },

    // Empty Fallback
    emptyCard: { padding: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12, width: '100%' },
    emptyTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginTop: 8, marginBottom: 4 },
    emptyDesc: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },

    // Section 2: Overdue Cards (100% Overflow Protected)
    overdueCard: { padding: SPACING.md, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.03)', width: '100%', overflow: 'hidden' },
    overdueInvoiceLabel: { fontSize: 11, color: '#EF4444', fontWeight: '600', letterSpacing: 0.5 },
    overdueInvoiceValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
    daysLateBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full, flexShrink: 0 },
    daysLateText: { fontSize: 11, fontWeight: '700', color: '#EF4444' },
    overduePeriodText: { fontSize: 12, color: COLORS.textMuted, marginBottom: 12, marginTop: 2 },
    overdueGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: RADIUS.md, marginBottom: 12, width: '100%' },
    overdueCol: { flex: 1, marginRight: 4 },
    overdueSubLabel: { fontSize: 10, color: COLORS.textMuted, marginBottom: 2 },
    overdueSubValue: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
    overdueTotalValue: { fontSize: 15, fontWeight: '800', color: '#EF4444' },
    overduePayBtn: { 
        flex: 1, 
        minWidth: 0,
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 4, 
        paddingVertical: 10, 
        paddingHorizontal: 6, 
        borderRadius: RADIUS.md, 
        backgroundColor: '#DC2626',
        minHeight: 42,
        overflow: 'hidden',
    },
    overduePayBtnText: { 
        fontSize: 11.5, 
        fontWeight: '700', 
        color: '#FFFFFF', 
        flexShrink: 1,
        textAlign: 'center',
    },

    expandedOverdueBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)', gap: 8, width: '100%' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    detailLabel: { fontSize: 12, color: COLORS.textMuted, flex: 1, marginRight: 8 },
    detailValue: { fontSize: 12, fontWeight: '500', color: COLORS.textPrimary, flexShrink: 0 },
    detailRowTotal: { paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' },
    detailTotalLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, flex: 1, marginRight: 8 },
    detailTotalValue: { fontSize: 14, fontWeight: '800', color: '#EF4444', flexShrink: 0 },

    settledCard: { padding: 16, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)', width: '100%' },
    settledRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settledIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(16, 185, 129, 0.15)', alignItems: 'center', justifyContent: 'center' },
    settledTitle: { fontSize: 14, fontWeight: '700', color: COLORS.success },
    settledDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

    // Section 3: Total Outstanding Summary
    summaryCard: { padding: SPACING.md, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', width: '100%', overflow: 'hidden' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, width: '100%' },
    summaryLabel: { fontSize: 13, color: COLORS.textSecondary },
    summaryValue: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
    summaryDivider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)', marginVertical: 10 },
    grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' },
    grandTotalLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
    summaryCaption: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, maxWidth: 190 },
    grandTotalValue: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, flexShrink: 0 },
    optionsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.25)', width: '100%' },
    optionsBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },

    // Section 4: Actions Row
    actionRow: { flexDirection: 'row', gap: 10, marginBottom: 12, width: '100%' },
    actionBtn: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(16, 185, 129, 0.05)', paddingVertical: 13, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
    actionBtnText: { marginLeft: 8, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },

    // Section 5: Current Breakdown Accordion (Overflow Protected)
    breakdownContainer: { padding: 0, overflow: 'hidden', marginBottom: 16, width: '100%' },
    accordionItem: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)', paddingHorizontal: SPACING.md, width: '100%' },
    accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.md, width: '100%' },
    accordionIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0 },
    accordionTitleWrap: { flex: 1, marginRight: 8 },
    accordionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
    accordionSub: { fontSize: 11, color: COLORS.textSecondary },
    accordionRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
    accordionAmount: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
    accordionBody: { paddingBottom: SPACING.md, paddingTop: 4, paddingHorizontal: 2, width: '100%' },
    accordionDesc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, marginBottom: SPACING.sm },
    meterBox: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: RADIUS.md, padding: SPACING.md, width: '100%' },
    meterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, width: '100%' },
    meterLabel: { fontSize: 12, color: COLORS.textSecondary, flex: 1, marginRight: 8 },
    meterValue: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, flexShrink: 0, textAlign: 'right' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 8 },
    totalComputationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, backgroundColor: 'rgba(16, 185, 129, 0.03)', width: '100%' },
    totalComputationLabelWrap: { flex: 1, marginRight: 8 },
    totalComputationLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
    totalComputationSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
    totalComputationValue: { fontSize: 18, fontWeight: '700', color: COLORS.primary, flexShrink: 0 },

    // Notes
    notesCard: { padding: SPACING.md, marginBottom: SPACING.xl, width: '100%' },
    noteItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm, gap: 8, width: '100%' },
    noteText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
    
    // Skeleton
    headerDetails: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md, marginBottom: SPACING.lg, width: '100%' },
    headerItem: { flex: 1 },
    skeletonLine: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 4 }
});
