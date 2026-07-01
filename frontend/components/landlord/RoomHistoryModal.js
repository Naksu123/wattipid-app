import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTransactionHistory, getAvailableBillingCycles } from '../../services/database';
import { COLORS, RADIUS, SPACING } from '../../styles/theme';
import { BaseModal, ModalHeader, ModalBody } from '../modals/BaseModal';
import s from '../../styles/components/landlord/RoomHistoryModal.styles';

export default function RoomHistoryModal({ visible, onClose, roomId }) {
  const [transactions, setTransactions] = useState([]);
  const [historyLimit, setHistoryLimit] = useState(50);
  const [availableCycles, setAvailableCycles] = useState([]);
  
  const [historyStartDate, setHistoryStartDate] = useState(null);
  const [historyEndDate, setHistoryEndDate] = useState(null);
  const [historyTitle, setHistoryTitle] = useState('Active Billing Cycle');
  
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());

  useEffect(() => {
    if (visible && roomId) {
      loadCycles();
    }
  }, [visible, roomId]);

  const loadCycles = async () => {
    const cycles = await getAvailableBillingCycles(roomId);
    if (cycles && cycles.length > 0) {
      setAvailableCycles(cycles);
      if (!historyStartDate) {
        setHistoryStartDate(new Date(cycles[0].cycle_start));
        setHistoryEndDate(new Date(cycles[0].cycle_end));
        setHistoryTitle('Active Billing Cycle');
      }
    } else {
      setAvailableCycles([]);
    }
  };

  const loadHistoryData = useCallback(async () => {
    if (!roomId) return;
    const startStr = historyStartDate ? historyStartDate.toISOString().split('T')[0] : null;
    const endStr = historyEndDate ? historyEndDate.toISOString().split('T')[0] : null;
    const txns = await getTransactionHistory(roomId, 500, 'minute', null, 0, startStr, endStr);
    setTransactions(txns || []);
  }, [roomId, historyStartDate, historyEndDate]);

  useEffect(() => {
    if (visible) {
      loadHistoryData();
    }
  }, [visible, loadHistoryData, historyLimit]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Room {roomId} History</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={s.historySection}>
          <View style={s.filterHeader}>
            <Text style={s.filterTitle}>Transaction Logs</Text>
            <TouchableOpacity style={s.filterDropdown} onPress={() => setShowFilterModal(true)} activeOpacity={0.7}>
              <Text style={s.filterDropdownText}>{historyTitle}</Text>
              <Ionicons name="calendar-outline" size={16} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {transactions.length > 0 ? (
              transactions.map((group, gIdx) => (
                <View key={gIdx} style={s.histGroup}>
                  <View style={s.histGroupHeader}>
                    <Text style={s.histDate}>{group.title}</Text>
                    <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.histTableWrapper}>
                    <View style={{ minWidth: 350, paddingHorizontal: 0 }}>
                      {group.data.slice(0, historyLimit).map((tx, i) => {
                        const power = Number(tx.power || 0);
                        const statusColor = power > 1500 ? COLORS.danger : (power > 500 ? COLORS.warning : COLORS.primary);
                        return (
                          <View key={i} style={[s.histRow, i % 2 === 0 && s.histRowAlt]}>
                            <Text style={s.histColTime} numberOfLines={1}>{tx.time_label || '--'}</Text>
                            <Text style={s.histColWatts} numberOfLines={1}>{power.toFixed(0)}W</Text>
                            <Text style={s.histColKwh} numberOfLines={1}>{Number(tx.energy || 0).toFixed(4)}</Text>
                            <Text style={s.histColCost} numberOfLines={1}>₱{Math.abs(Number(tx.cost || 0)).toFixed(2)}</Text>
                            <View style={s.histColStatus}>
                              <View style={[s.statusDot, { backgroundColor: statusColor }]} />
                            </View>
                          </View>
                        );
                      })}
                      {group.data.length > historyLimit && (
                        <TouchableOpacity 
                          onPress={() => setHistoryLimit(prev => prev + 20)}
                          style={{ padding: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(30,41,59,0.03)', marginTop: 10, borderRadius: RADIUS.md }}
                        >
                          <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Load 20 More Logs</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </ScrollView>
                </View>
              ))
            ) : (
              <View style={s.emptyHist}>
                <Ionicons name="analytics-outline" size={36} color={COLORS.textMuted} />
                <Text style={s.emptyHistText}>No history logs found for this period</Text>
              </View>
            )}
          </ScrollView>
        </View>

        <BaseModal visible={showFilterModal} onClose={() => setShowFilterModal(false)}>
          <ModalHeader title="Filter History" icon="calendar" iconColor={COLORS.primary} onClose={() => setShowFilterModal(false)} />
          <ModalBody scrollable={true}>
            <Text style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 12 }}>Select a predefined range or pick custom dates to filter logs.</Text>
            
            <TouchableOpacity style={[s.filterOption, historyTitle === 'Active Billing Cycle' && s.filterOptionActive]}
              onPress={() => {
                if(availableCycles.length > 0) {
                  setHistoryStartDate(new Date(availableCycles[0].cycle_start));
                  setHistoryEndDate(new Date(availableCycles[0].cycle_end));
                  setHistoryTitle('Active Billing Cycle');
                }
                setShowFilterModal(false);
              }}>
              <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold' }}>Active Billing Cycle</Text>
              {availableCycles.length > 0 && <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4 }}>{new Date(availableCycles[0].cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric' })} – {new Date(availableCycles[0].cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric' })}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={[s.filterOption, historyTitle === 'Previous Billing Cycle' && s.filterOptionActive]}
              onPress={() => {
                if(availableCycles.length > 1) {
                  setHistoryStartDate(new Date(availableCycles[1].cycle_start));
                  setHistoryEndDate(new Date(availableCycles[1].cycle_end));
                  setHistoryTitle('Previous Billing Cycle');
                } else {
                  Alert.alert('Not Available', 'No previous billing cycle found.');
                }
                setShowFilterModal(false);
              }}>
              <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold' }}>Previous Billing Cycle</Text>
              {availableCycles.length > 1 && <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4 }}>{new Date(availableCycles[1].cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric' })} – {new Date(availableCycles[1].cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric' })}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={[s.filterOption, historyTitle === 'Today' && s.filterOptionActive, { marginBottom: 16 }]}
              onPress={() => {
                const today = new Date();
                setHistoryStartDate(today);
                setHistoryEndDate(today);
                setHistoryTitle('Today');
                setShowFilterModal(false);
              }}>
              <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold' }}>Today</Text>
            </TouchableOpacity>

            <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', marginBottom: 12 }}>Custom Date Range</Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 4 }}>Start Date</Text>
                <View style={s.datePickerControl}>
                  <TouchableOpacity onPress={() => { const d = new Date(customStart); d.setDate(d.getDate()-1); setCustomStart(d); }} style={{ padding: 10 }}><Ionicons name="chevron-back" size={16} color={COLORS.primary}/></TouchableOpacity>
                  <Text style={{ flex: 1, textAlign: 'center', color: COLORS.textPrimary, fontSize: 13 }}>{customStart.toLocaleDateString('default', { month: 'short', day: 'numeric' })}</Text>
                  <TouchableOpacity onPress={() => { const d = new Date(customStart); d.setDate(d.getDate()+1); setCustomStart(d); }} style={{ padding: 10 }}><Ionicons name="chevron-forward" size={16} color={COLORS.primary}/></TouchableOpacity>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 4 }}>End Date</Text>
                <View style={s.datePickerControl}>
                  <TouchableOpacity onPress={() => { const d = new Date(customEnd); d.setDate(d.getDate()-1); setCustomEnd(d); }} style={{ padding: 10 }}><Ionicons name="chevron-back" size={16} color={COLORS.primary}/></TouchableOpacity>
                  <Text style={{ flex: 1, textAlign: 'center', color: COLORS.textPrimary, fontSize: 13 }}>{customEnd.toLocaleDateString('default', { month: 'short', day: 'numeric' })}</Text>
                  <TouchableOpacity onPress={() => { const d = new Date(customEnd); d.setDate(d.getDate()+1); setCustomEnd(d); }} style={{ padding: 10 }}><Ionicons name="chevron-forward" size={16} color={COLORS.primary}/></TouchableOpacity>
                </View>
              </View>
            </View>
            
            <TouchableOpacity style={{ backgroundColor: COLORS.primary, padding: 14, borderRadius: RADIUS.md, alignItems: 'center', marginTop: 16 }}
              onPress={() => {
                if (customStart > customEnd) {
                  Alert.alert('Invalid Range', 'Start date cannot be after end date.');
                  return;
                }
                setHistoryStartDate(customStart);
                setHistoryEndDate(customEnd);
                setHistoryTitle(`${customStart.toLocaleDateString('default', { month: 'short', day: 'numeric' })} – ${customEnd.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`);
                setShowFilterModal(false);
              }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Apply Custom Range</Text>
            </TouchableOpacity>
          </ModalBody>
        </BaseModal>
      </SafeAreaView>
    </Modal>
  );
}


