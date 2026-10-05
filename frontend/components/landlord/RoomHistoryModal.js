import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTransactionHistory, getAvailableBillingCycles } from '../../services/database';
import { COLORS } from '../../styles/theme';
import { BaseModal, ModalHeader, ModalBody } from '../modals/BaseModal';
import { useModal } from '../../contexts/ModalContext';
import s from '../../styles/components/landlord/RoomHistoryModal.styles';

export default function RoomHistoryModal({ visible, onClose, roomId }) {
  const { showModal } = useModal();
  const [transactions, setTransactions] = useState([]);
  const [historyLimit, setHistoryLimit] = useState(50);
  const [availableCycles, setAvailableCycles] = useState([]);
  
  const [historyStartDate, setHistoryStartDate] = useState(null);
  const [historyEndDate, setHistoryEndDate] = useState(null);
  const [historyTitle, setHistoryTitle] = useState('Active Billing Cycle');
  
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());

  const lastRoomIdRef = useRef(roomId);
  if (roomId) {
    lastRoomIdRef.current = roomId;
  }
  const displayRoomId = roomId || lastRoomIdRef.current;

  // Format header title without duplicate "Room Room 1"
  const formattedRoomTitle = useMemo(() => {
    if (!displayRoomId) return 'Room History';
    const trimmed = String(displayRoomId).trim();
    if (trimmed.toLowerCase().startsWith('room')) {
      return `${trimmed} History`;
    }
    return `Room ${trimmed} History`;
  }, [displayRoomId]);

  // Clean up temporary history state when modal is closed
  useEffect(() => {
    if (!visible) {
      setTransactions([]);
      setHistoryStartDate(null);
      setHistoryEndDate(null);
      setHistoryTitle('Active Billing Cycle');
      setShowFilterModal(false);
      setAvailableCycles([]);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && displayRoomId) {
      loadCycles();
    }
  }, [visible, displayRoomId]);

  const loadCycles = async () => {
    if (!displayRoomId) return;
    const cycles = await getAvailableBillingCycles(displayRoomId);
    if (cycles && cycles.length > 0) {
      setAvailableCycles(cycles);
      setHistoryStartDate(new Date(cycles[0].cycle_start));
      setHistoryEndDate(new Date(cycles[0].cycle_end));
      setHistoryTitle('Active Billing Cycle');
    } else {
      setAvailableCycles([]);
    }
  };

  const loadHistoryData = useCallback(async () => {
    if (!displayRoomId) return;
    const startStr = historyStartDate ? historyStartDate.toISOString().split('T')[0] : null;
    const endStr = historyEndDate ? historyEndDate.toISOString().split('T')[0] : null;
    const txns = await getTransactionHistory(displayRoomId, 500, 'minute', null, 0, startStr, endStr);
    setTransactions(txns || []);
  }, [displayRoomId, historyStartDate, historyEndDate]);

  useEffect(() => {
    if (visible) {
      loadHistoryData();
    }
  }, [visible, loadHistoryData, historyLimit]);

  // Dynamic Aggregation for Stats Section
  const stats = useMemo(() => {
    let totalCost = 0;
    let totalKwh = 0;
    let peakPower = 0;
    let totalRecords = 0;

    transactions.forEach((group) => {
      if (Array.isArray(group.data)) {
        group.data.forEach((tx) => {
          totalCost += Math.abs(Number(tx.cost || 0));
          totalKwh += Number(tx.energy || tx.kwh || 0);
          const p = Number(tx.power || tx.wattage || 0);
          if (p > peakPower) peakPower = p;
          totalRecords += 1;
        });
      }
    });

    return {
      totalCost,
      totalKwh,
      peakPower,
      totalRecords,
    };
  }, [transactions]);

  if (!visible && !displayRoomId) return null;

  return (
    <Modal visible={Boolean(visible && displayRoomId)} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={s.container}>
        {/* ── Modern SaaS Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <TouchableOpacity 
              onPress={onClose} 
              style={s.headerBackBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="arrow-back" size={17} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={s.headerTitleWrap}>
              <Text style={s.headerTitle} numberOfLines={1}>{formattedRoomTitle}</Text>
              <Text style={s.headerSubtitle} numberOfLines={1}>Consumption & Activity Audit Log</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={onClose} 
            style={s.headerCloseBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* ── Scrollable Body with Normalized Spacing ── */}
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={s.scrollContent}
        >
          {/* ── Filter Toolbar ── */}
          <View style={s.filterBar}>
            <View style={s.filterLabelWrap}>
              <Ionicons name="funnel-outline" size={12} color="#10B981" />
              <Text style={s.filterBarLabel}>FILTER PERIOD</Text>
            </View>

            <TouchableOpacity 
              style={s.filterDropdownBtn} 
              onPress={() => setShowFilterModal(true)} 
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Filter dates"
            >
              <Ionicons name="calendar-outline" size={13} color="#10B981" />
              <Text style={s.filterDropdownText} numberOfLines={1}>{historyTitle}</Text>
              <Ionicons name="chevron-down" size={12} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* ── Period Accrued Cost Summary Card ── */}
          <View style={s.costSummaryCard}>
            <View style={s.costSummaryLeft}>
              <View style={s.costIconBadge}>
                <Ionicons name="wallet-outline" size={18} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.costLabel}>PERIOD ACCRUED COST</Text>
                <Text style={s.costSubtitle} numberOfLines={1}>
                  {historyTitle} · {stats.totalRecords} records
                </Text>
              </View>
            </View>
            <View style={s.costSummaryRight}>
              <Text style={s.costSummaryValue} numberOfLines={1}>
                ₱{stats.totalCost.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* ── Secondary Stats Row (Equal Height, Symmetric) ── */}
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <View style={s.statHeader}>
                <Ionicons name="flash-outline" size={13} color="#38BDF8" />
                <Text style={s.statLabel}>TOTAL ENERGY</Text>
              </View>
              <View style={s.statValueRow}>
                <Text style={s.statValueEnergy} numberOfLines={1}>
                  {stats.totalKwh.toFixed(3)}
                </Text>
                <Text style={s.statUnit}>kWh</Text>
              </View>
            </View>

            <View style={s.statCard}>
              <View style={s.statHeader}>
                <Ionicons name="speedometer-outline" size={13} color="#F59E0B" />
                <Text style={s.statLabel}>PEAK DEMAND</Text>
              </View>
              <View style={s.statValueRow}>
                <Text style={s.statValuePower} numberOfLines={1}>
                  {stats.peakPower.toFixed(0)}
                </Text>
                <Text style={s.statUnit}>W</Text>
              </View>
            </View>
          </View>

          {/* ── Transaction Logs Section Header ── */}
          <View style={s.sectionHeader}>
            <View style={s.sectionTitleWrap}>
              <View style={s.sectionTitleRow}>
                <Ionicons name="receipt-outline" size={15} color="#10B981" />
                <Text style={s.sectionTitleText}>Transaction Logs</Text>
              </View>
              <Text style={s.sectionSubtitleText}>Per-minute telemetry</Text>
            </View>
            <View style={s.logsCountPill}>
              <Text style={s.logsCountPillText}>{stats.totalRecords} logs</Text>
            </View>
          </View>

          {/* ── Groups & Transaction Rows (Full Native Width, Perfectly Aligned) ── */}
          {transactions.length > 0 ? (
            transactions.map((group, gIdx) => (
              <View key={gIdx} style={s.dateGroup}>
                <View style={s.dateGroupHeader}>
                  <View style={s.dateGroupLeft}>
                    <Ionicons name="calendar-outline" size={13} color="#10B981" />
                    <Text style={s.dateGroupText}>{group.title}</Text>
                  </View>
                  <Text style={s.dateGroupCountText}>{group.data ? group.data.length : 0} logs</Text>
                </View>

                <View style={s.tableCard}>
                  {/* Table Column Headers */}
                  <View style={s.tableHeaderRow}>
                    <Text style={s.colHeaderTime}>TIME</Text>
                    <Text style={s.colHeaderPower}>POWER</Text>
                    <Text style={s.colHeaderEnergy}>ENERGY</Text>
                    <Text style={s.colHeaderCost}>COST</Text>
                    <View style={s.colHeaderStatus}>
                      <View style={s.headerDotIcon} />
                    </View>
                  </View>

                  {/* Table Rows */}
                  {group.data.slice(0, historyLimit).map((tx, i) => {
                    const power = Number(tx.power || tx.wattage || 0);
                    const costVal = Math.abs(Number(tx.cost || 0));
                    const energyVal = Number(tx.energy || tx.kwh || 0);
                    const statusColor = power > 1500 ? COLORS.danger : (power > 500 ? COLORS.warning : COLORS.primary);

                    return (
                      <View key={i} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
                        <Text style={s.colTime} numberOfLines={1}>
                          {tx.time_label || '--'}
                        </Text>
                        <Text style={s.colPower} numberOfLines={1}>
                          {power.toFixed(0)} W
                        </Text>
                        <Text style={s.colEnergy} numberOfLines={1}>
                          {energyVal.toFixed(4)}
                        </Text>
                        <Text style={s.colCost} numberOfLines={1}>
                          ₱{costVal.toFixed(2)}
                        </Text>
                        <View style={s.colStatus}>
                          <View style={[s.statusDot, { backgroundColor: statusColor }]} />
                        </View>
                      </View>
                    );
                  })}

                  {/* Load More Button inside Group */}
                  {group.data.length > historyLimit && (
                    <TouchableOpacity 
                      onPress={() => setHistoryLimit(prev => prev + 20)}
                      style={s.loadMoreBtn}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="chevron-down-circle-outline" size={15} color="#10B981" />
                      <Text style={s.loadMoreBtnText}>Load 20 More Records</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={s.emptyState}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="analytics-outline" size={24} color="#64748B" />
              </View>
              <Text style={s.emptyTitle}>No Activity Logs</Text>
              <Text style={s.emptyText}>No consumption or transaction records found for this period.</Text>
            </View>
          )}
        </ScrollView>

        {/* ── Filter Modal (BaseModal) ── */}
        <BaseModal visible={showFilterModal} onClose={() => setShowFilterModal(false)} centered={true}>
          <ModalHeader title="Filter History" icon="calendar" iconColor="#10B981" onClose={() => setShowFilterModal(false)} />
          <ModalBody scrollable={true}>
            <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 12 }}>
              Select a predefined billing cycle or specify a custom date range.
            </Text>
            
            <TouchableOpacity 
              style={[s.filterOption, historyTitle === 'Active Billing Cycle' && s.filterOptionActive]}
              onPress={() => {
                if (availableCycles.length > 0) {
                  setHistoryStartDate(new Date(availableCycles[0].cycle_start));
                  setHistoryEndDate(new Date(availableCycles[0].cycle_end));
                  setHistoryTitle('Active Billing Cycle');
                }
                setShowFilterModal(false);
              }}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.filterOptionTitle, historyTitle === 'Active Billing Cycle' && s.filterOptionTitleActive]}>
                  Active Billing Cycle
                </Text>
                {availableCycles.length > 0 && (
                  <Text style={s.filterOptionSubtitle}>
                    {new Date(availableCycles[0].cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric' })} – {new Date(availableCycles[0].cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                  </Text>
                )}
              </View>
              {historyTitle === 'Active Billing Cycle' && (
                <Ionicons name="checkmark-circle" size={17} color="#10B981" />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[s.filterOption, historyTitle === 'Previous Billing Cycle' && s.filterOptionActive]}
              onPress={() => {
                if (availableCycles.length > 1) {
                  setHistoryStartDate(new Date(availableCycles[1].cycle_start));
                  setHistoryEndDate(new Date(availableCycles[1].cycle_end));
                  setHistoryTitle('Previous Billing Cycle');
                } else {
                  showModal({ type: 'warning', title: 'Not Available', message: 'No previous billing cycle found.' });
                }
                setShowFilterModal(false);
              }}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.filterOptionTitle, historyTitle === 'Previous Billing Cycle' && s.filterOptionTitleActive]}>
                  Previous Billing Cycle
                </Text>
                {availableCycles.length > 1 && (
                  <Text style={s.filterOptionSubtitle}>
                    {new Date(availableCycles[1].cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric' })} – {new Date(availableCycles[1].cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                  </Text>
                )}
              </View>
              {historyTitle === 'Previous Billing Cycle' && (
                <Ionicons name="checkmark-circle" size={17} color="#10B981" />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[s.filterOption, historyTitle === 'Today' && s.filterOptionActive, { marginBottom: 12 }]}
              onPress={() => {
                const today = new Date();
                setHistoryStartDate(today);
                setHistoryEndDate(today);
                setHistoryTitle('Today');
                setShowFilterModal(false);
              }}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.filterOptionTitle, historyTitle === 'Today' && s.filterOptionTitleActive]}>
                  Today
                </Text>
                <Text style={s.filterOptionSubtitle}>Recent hourly consumption</Text>
              </View>
              {historyTitle === 'Today' && (
                <Ionicons name="checkmark-circle" size={17} color="#10B981" />
              )}
            </TouchableOpacity>

            <Text style={s.filterSectionLabel}>CUSTOM DATE RANGE</Text>
            
            <View style={s.datePickerRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#64748B', fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>
                  Start Date
                </Text>
                <View style={s.datePickerControl}>
                  <TouchableOpacity 
                    onPress={() => { const d = new Date(customStart); d.setDate(d.getDate() - 1); setCustomStart(d); }} 
                    style={s.datePickerBtn}
                  >
                    <Ionicons name="chevron-back" size={15} color="#10B981"/>
                  </TouchableOpacity>
                  <Text style={s.datePickerValueText}>
                    {customStart.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => { const d = new Date(customStart); d.setDate(d.getDate() + 1); setCustomStart(d); }} 
                    style={s.datePickerBtn}
                  >
                    <Ionicons name="chevron-forward" size={15} color="#10B981"/>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#64748B', fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>
                  End Date
                </Text>
                <View style={s.datePickerControl}>
                  <TouchableOpacity 
                    onPress={() => { const d = new Date(customEnd); d.setDate(d.getDate() - 1); setCustomEnd(d); }} 
                    style={s.datePickerBtn}
                  >
                    <Ionicons name="chevron-back" size={15} color="#10B981"/>
                  </TouchableOpacity>
                  <Text style={s.datePickerValueText}>
                    {customEnd.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => { const d = new Date(customEnd); d.setDate(d.getDate() + 1); setCustomEnd(d); }} 
                    style={s.datePickerBtn}
                  >
                    <Ionicons name="chevron-forward" size={15} color="#10B981"/>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={s.applyFilterBtn}
              onPress={() => {
                if (customStart > customEnd) {
                  showModal({ type: 'error', title: 'Invalid Range', message: 'Start date cannot be after end date.' });
                  return;
                }
                setHistoryStartDate(customStart);
                setHistoryEndDate(customEnd);
                setHistoryTitle(`${customStart.toLocaleDateString('default', { month: 'short', day: 'numeric' })} – ${customEnd.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`);
                setShowFilterModal(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={s.applyFilterBtnText}>Apply Custom Range</Text>
            </TouchableOpacity>
          </ModalBody>
        </BaseModal>
      </SafeAreaView>
    </Modal>
  );
}
