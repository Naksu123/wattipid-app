import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, Modal, TextInput, ActivityIndicator,
  Platform, useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAllRooms, generateNewTenantCode, updateRoomStatus, saveTenantInvitation, getMonthlyConsumptionFiltered, getSetting, revokeTenant, transferTenant, getVacantRooms, getBuildingSummary, getAvailableBillingCycles, addRoom, updateRoom, archiveRoom, restoreRoom } from '../../services/database';
import { sendTenantAccessCode } from '../../services/emailService';
import { generateMonthlyReport, generateCycleReport, shareReport } from '../../services/pdfService';
import { submitOfflinePayment } from '../../services/paymentService';
import RoomCard from '../../components/ui/RoomCard';
import RoomHistoryModal from '../../components/landlord/RoomHistoryModal';
import ArchiveModal from '../../components/RoomManagement/ArchiveModal';
import GlassCard from '../../components/ui/GlassCard';
import StatusBadge from '../../components/ui/StatusBadge';
import { COLORS, GRADIENTS } from '@/styles/theme';
import s from '@/styles/landlord/rooms.styles';

export default function RoomsScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const [rooms, setRooms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [tenantEmail, setTenantEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [startDate, setStartDate] = useState('');

  // Report modal
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyRoomId, setHistoryRoomId] = useState(null);
  const [reportRoom, setReportRoom] = useState(null);
  const [availableCycles, setAvailableCycles] = useState([]);
  const [selectedPdfCycle, setSelectedPdfCycle] = useState(null);
  const [selectedPdfWeek, setSelectedPdfWeek] = useState(null);
  const [showPdfCycleDrop, setShowPdfCycleDrop] = useState(false);
  const [showPdfWeekDrop, setShowPdfWeekDrop] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Transfer modal
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferFromRoom, setTransferFromRoom] = useState(null);
  const [vacantRoomsList, setVacantRoomsList] = useState([]);

  // Revoke modals
  const [revokeModalVisible, setRevokeModalVisible] = useState(false);
  const [revokeRoom, setRevokeRoom] = useState(null);
  const [revokeSuccessVisible, setRevokeSuccessVisible] = useState(false);
  const [revokeSuccessMsg, setRevokeSuccessMsg] = useState('');

  // Regenerate modals
  const [regenConfirmVisible, setRegenConfirmVisible] = useState(false);
  const [regenRoom, setRegenRoom] = useState(null);
  const [regenSuccessVisible, setRegenSuccessVisible] = useState(false);
  const [regenSuccessMsg, setRegenSuccessMsg] = useState('');

  // Cash Payment Modal
  const [cashModalVisible, setCashModalVisible] = useState(false);
  const [cashRoom, setCashRoom] = useState(null);
  const [cashCycles, setCashCycles] = useState([]);
  const [selectedCashCycle, setSelectedCashCycle] = useState(null);
  const [showCashCycleDrop, setShowCashCycleDrop] = useState(false);
  const [processingCash, setProcessingCash] = useState(false);

  // Code Success Modal
  const [codeSuccessVisible, setCodeSuccessVisible] = useState(false);
  const [successCodeData, setSuccessCodeData] = useState({ code: '', room: '', email: '' });

  // General Success (for reset, etc.)
  const [generalSuccessVisible, setGeneralSuccessVisible] = useState(false);
  const [generalSuccessData, setGeneralSuccessData] = useState({ title: '', message: '', icon: 'checkmark-circle' });

  // Consumption cache
  const [consumptionData, setConsumptionData] = useState({});
  const [rate, setRate] = useState(12.50);

  // New features integration
  const [filterActive, setFilterActive] = useState('All');

  // Room Form Modal
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [roomFormData, setRoomFormData] = useState({
    room_id: '', room_name: '', room_type: 'Standard',
    monthly_rent: '', utility_rate: '', description: '',
    max_occupancy: '1', status: 'vacant'
  });
  const [roomFormErrors, setRoomFormErrors] = useState({});

  // Archive Modal
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);
  const [archiveRoomObj, setArchiveRoomObj] = useState(null);
  const [isRestoreMode, setIsRestoreMode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadRooms(); }, []);

  const loadRooms = async () => {
    try {
      const summary = await getBuildingSummary();
      const rateVal = await getSetting('rate_per_kwh');
      const currentRate = rateVal ? parseFloat(rateVal) : 12.50;
      setRate(currentRate);

      if (summary) {
        const { rooms: roomData, totals } = summary;

        // Map rooms with their specific consumption data
        const mappedRooms = (roomData || []).map(r => ({
          ...r,
          consumption: {
            energy: r.currEnergy || 0,
            cost: (r.currEnergy || 0) * currentRate
          },
          prevConsumption: {
            energy: r.prevEnergy || 0,
            cost: (r.prevEnergy || 0) * currentRate
          }
        }));

        setRooms(mappedRooms);

        // Update consumption cache for reports/details
        const cData = {};
        mappedRooms.forEach(r => {
          if (r.status === 'occupied') {
            cData[r.room_id] = {
              current: { totalEnergy: r.consumption.energy, totalCost: r.consumption.cost },
              previous: { totalEnergy: r.prevConsumption.energy, totalCost: r.prevConsumption.cost },
              diff: r.consumption.energy - r.prevConsumption.energy
            };
          }
        });
        setConsumptionData(cData);
      }
    } catch (error) {
      console.error('[loadRooms] Error:', error);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await loadRooms(); setRefreshing(false); };

  const handleTransfer = async (toRoomId) => {
    if (!transferFromRoom) return;
    setSending(true);
    const result = await transferTenant(transferFromRoom.room_id, toRoomId);
    setSending(false);
    setTransferModalVisible(false);
    if (result.success) {
      setGeneralSuccessData({
        title: 'Transfer Complete',
        message: `${result.tenantName} has been transferred to ${result.toRoomId}.`,
        icon: 'swap-horizontal'
      });
      setGeneralSuccessVisible(true);
      loadRooms();
    } else {
      setGeneralSuccessData({
        title: 'Transfer Failed',
        message: result.message,
        icon: 'alert-circle'
      });
      setGeneralSuccessVisible(true);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokeRoom) return;
    setSending(true);
    const result = await revokeTenant(revokeRoom.room_id);
    setSending(false);
    setRevokeModalVisible(false);
    if (result.success) {
      setRevokeSuccessMsg(`Removed "${result.tenantName}"\nfrom ${revokeRoom.room_id}`);
      setRevokeSuccessVisible(true);
      loadRooms();
    } else {
      setGeneralSuccessData({
        title: 'Revoke Failed',
        message: result.message,
        icon: 'alert-circle'
      });
      setGeneralSuccessVisible(true);
    }
  };

  const handleConfirmRegenerate = async () => {
    if (!regenRoom) return;
    setRegenConfirmVisible(false);
    const newCode = await generateNewTenantCode(regenRoom.room_id);
    setRegenSuccessMsg(`Room: ${regenRoom.room_id}\nNew Code: ${newCode}`);
    setRegenSuccessVisible(true);
    loadRooms();
  };

  const handleSendCode = async () => {
    if (!tenantEmail.trim() || !tenantEmail.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setSending(true);
    try {
      let codeToSend = selectedRoom.tenant_code;

      if (!codeToSend) {
        const generateRes = await generateNewTenantCode(selectedRoom.room_id);
        if (generateRes && generateRes.success) {
          codeToSend = generateRes.code;
        } else {
          Alert.alert('Error', 'Failed to generate an access code automatically. Please try again.');
          setSending(false);
          return;
        }
      }

      const saveRes = await saveTenantInvitation(tenantEmail.trim(), selectedRoom.room_id, codeToSend);
      if (saveRes && !saveRes.success) {
        Alert.alert('Error', saveRes.message || 'Failed to save invitation');
        setSending(false);
        return;
      }

      const result = await sendTenantAccessCode(tenantEmail.trim(), selectedRoom.room_id, codeToSend);
      setSendModalVisible(false);
      setTenantEmail('');

      if (result.success) {
        setSuccessCodeData({
          code: result.mockCode || codeToSend,
          room: selectedRoom.room_id,
          email: tenantEmail.trim()
        });
        setCodeSuccessVisible(true);
      } else {
        Alert.alert('Failed', result.message || 'Could not send the access code.');
      }
      loadRooms();
    } catch (err) {
      Alert.alert('Email Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportRoom || !selectedPdfCycle) return;
    setGeneratingPdf(true);
    try {
      let startDate, endDate, reportTitle;

      if (selectedPdfWeek) {
        startDate = new Date(selectedPdfWeek.start);
        endDate = new Date(selectedPdfWeek.end);
        reportTitle = 'Weekly Consumption Report';
      } else {
        startDate = new Date(selectedPdfCycle.cycle_start);
        endDate = new Date(selectedPdfCycle.cycle_end);
        reportTitle = 'Monthly Consumption Report';
      }

      const result = await generateCycleReport({
        roomId: reportRoom.room_id,
        tenantName: reportRoom.tenant_name,
        startDate,
        endDate,
        reportTitle,
        isWeekly: !!selectedPdfWeek,
        room: reportRoom,
        billingCycle: selectedPdfCycle,
      });

      setReportModalVisible(false);
      await shareReport(result.uri);
    } catch (err) {
      Alert.alert('Error', 'Failed to generate report: ' + err.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const validateRoomForm = () => {
    let err = {};
    if (!roomFormData.room_id.trim()) err.room_id = 'Required';
    setRoomFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleRoomSubmit = async () => {
    if (!validateRoomForm()) return;
    setActionLoading(true);
    try {
      const payload = { ...roomFormData, monthly_rent: parseFloat(roomFormData.monthly_rent || 0), utility_rate: parseFloat(roomFormData.utility_rate || 0), max_occupancy: parseInt(roomFormData.max_occupancy || 1) };
      const res = isEditMode ? await updateRoom(payload.room_id, payload) : await addRoom(payload);
      if (res && res.success) {
        setRoomModalVisible(false);
        loadRooms();
      } else {
        Alert.alert('Error', res?.message || 'Operation failed');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openArchiveModal = (r) => {
    if (r.status === 'occupied' || r.tenant_name) return Alert.alert("Cannot Archive", "Room currently has an active tenant.");
    setArchiveRoomObj(r);
    setIsRestoreMode(false);
    setArchiveModalVisible(true);
  };

  const openRestoreModal = (r) => {
    setArchiveRoomObj(r);
    setIsRestoreMode(true);
    setArchiveModalVisible(true);
  };

  const handleArchiveAction = async () => {
    setActionLoading(true);
    try {
      const fn = isRestoreMode ? restoreRoom : archiveRoom;
      const res = await fn(archiveRoomObj.room_id);
      if (res && res.success) {
        setArchiveModalVisible(false);
        loadRooms();
      } else {
        Alert.alert('Error', res?.message || 'Failed to update status');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCashPayment = async () => {
    if (!cashRoom || !selectedCashCycle) return;
    const amount = Number(selectedCashCycle.total_amount) || 0;

    setProcessingCash(true);
    try {
      const res = await submitOfflinePayment(selectedCashCycle.id, cashRoom.room_id, amount);
      setCashModalVisible(false);
      setCashRoom(null);
      setCashCycles([]);
      setSelectedCashCycle(null);
      Alert.alert('Payment Recorded', `Successfully marked ${cashRoom.room_id} cycle as paid in cash.`, [{ text: 'OK', onPress: () => loadRooms() }]);
    } catch (err) {
      const errorMsg = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
      Alert.alert('Payment Error', errorMsg);
    } finally {
      setProcessingCash(false);
    }
  };

  const filteredRooms = rooms.filter(room => {
    if (filterActive === 'All') return room.status !== 'archived';
    if (filterActive === 'Archived') return room.status === 'archived';
    return room.status === filterActive.toLowerCase().replace(' ', '_');
  });

  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
  const onProcessCount = rooms.filter(r => r.status === 'on_process').length;
  const vacantCount = rooms.filter(r => r.status === 'vacant').length;
  const notAvailableCount = rooms.filter(r => r.status === 'not_available').length;
  const maintenanceCount = rooms.filter(r => r.status === 'under_maintenance').length;

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ flexShrink: 1, paddingRight: 16 }}>
            <Text style={s.title}>Room Management</Text>
            <Text style={s.subtitle} numberOfLines={2}>Manage tenant access and room assignments</Text>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: COLORS.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => {
              setIsEditMode(false);
              setRoomFormData({ room_id: '', room_name: '', room_type: 'Standard', monthly_rent: '', utility_rate: '', description: '', max_occupancy: '1', status: 'vacant' });
              setRoomFormErrors({});
              setRoomModalVisible(true);
            }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={s.statsRow}>
          {/* Row 1 */}
          <GlassCard style={s.statCard}>
            <Text style={s.statNum}>{rooms.length}</Text>
            <Text style={s.statLabel}>Total</Text>
          </GlassCard>
          <GlassCard style={[s.statCard, { borderColor: COLORS.primary }]}>
            <Text style={[s.statNum, { color: COLORS.primary }]}>{occupiedCount}</Text>
            <Text style={s.statLabel}>Occupied</Text>
          </GlassCard>
          <GlassCard style={s.statCard}>
            <Text style={s.statNum}>{vacantCount}</Text>
            <Text style={s.statLabel}>Vacant</Text>
          </GlassCard>

          {/* Row 2 */}
          <GlassCard style={[s.statCard, { borderColor: COLORS.warning }]}>
            <Text style={[s.statNum, { color: COLORS.warning }]}>{onProcessCount}</Text>
            <Text style={s.statLabel}>On Process</Text>
          </GlassCard>
          <GlassCard style={[s.statCard, { borderColor: COLORS.danger }]}>
            <Text style={[s.statNum, { color: COLORS.danger }]}>{notAvailableCount}</Text>
            <Text style={s.statLabel}>Not Avail</Text>
          </GlassCard>
          <GlassCard style={[s.statCard, { borderColor: COLORS.warning }]}>
            <Text style={[s.statNum, { color: COLORS.warning }]}>{maintenanceCount}</Text>
            <Text style={s.statLabel}>Maint.</Text>
          </GlassCard>
        </View>

        <GlassCard style={s.infoCard}>
          <Ionicons name="information-circle" size={18} color={COLORS.info} />
          <Text style={s.infoText}>
            Tap a room for actions: send codes, generate reports, transfer or revoke tenants. Historical data is always preserved.
          </Text>
        </GlassCard>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {['All', 'Vacant', 'Occupied', 'Under Maintenance', 'Archived'].map(f => (
            <TouchableOpacity
              key={f}
              style={{
                paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                backgroundColor: filterActive === f ? COLORS.primary : 'rgba(255,255,255,0.05)',
                marginRight: 8, borderWidth: 1, borderColor: filterActive === f ? COLORS.primary : 'rgba(255,255,255,0.1)'
              }}
              onPress={() => setFilterActive(f)}
            >
              <Text style={{ color: filterActive === f ? '#fff' : COLORS.textMuted, fontWeight: '600' }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ flexDirection: isLargeScreen ? 'row' : 'column', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {filteredRooms.map(room => (
            <View key={room.room_id} style={{ width: isLargeScreen ? '48%' : '100%' }}>
              <GlassCard style={[s.roomCard, room.status === 'occupied' && { borderColor: COLORS.primary }]}>
                <View style={s.roomHeader}>
                  <View style={s.roomInfo}>
                    <View style={[s.roomIcon, {
                      backgroundColor: room.status === 'occupied' ? 'rgba(34,197,94,0.15)' :
                        room.status === 'on_process' ? 'rgba(245,158,11,0.15)' :
                          room.status === 'not_available' ? 'rgba(239,68,68,0.15)' :
                            room.status === 'under_maintenance' ? 'rgba(245,158,11,0.15)' :
                              'rgba(100,116,139,0.15)'
                    }]}>
                      <Ionicons
                        name={room.status === 'occupied' ? 'flash' :
                          room.status === 'on_process' ? 'time' :
                            room.status === 'not_available' ? 'ban' :
                              room.status === 'under_maintenance' ? 'construct' :
                                'flash-outline'}
                        size={22}
                        color={room.status === 'occupied' ? COLORS.primary :
                          room.status === 'on_process' || room.status === 'under_maintenance' ? COLORS.warning :
                            room.status === 'not_available' ? COLORS.danger :
                              COLORS.textMuted}
                      />
                    </View>
                    <View>
                      <Text style={s.roomId}>{room.room_id} {room.room_name ? `- ${room.room_name}` : ''}</Text>
                      <Text style={s.tenantName}>{room.tenant_name || 'No tenant assigned'}</Text>
                    </View>
                  </View>
                  <StatusBadge status={room.status} size="sm" style={{ width: 95 }} />
                </View>

                {room.status === 'occupied' && room.tenant_start_date && (
                  <View style={s.moveInRow}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                    <Text style={s.moveInText}>Move-in: {room.tenant_start_date}{room.move_out_date ? `  •  Move-out: ${room.move_out_date}` : ''}</Text>
                  </View>
                )}

                {room.status === 'occupied' && consumptionData[room.room_id] && (
                  <>
                    <View style={s.consumptionRow}>
                      <View style={[s.consumptionItem, { alignItems: 'flex-start' }]}>
                        <Text style={s.consumptionLabel}>Consumption</Text>
                        <Text style={s.consumptionValue} adjustsFontSizeToFit numberOfLines={1}>{Number(consumptionData[room.room_id].current.totalEnergy || 0).toFixed(2)} kWh</Text>
                      </View>
                      <View style={[s.consumptionItem, { alignItems: 'center' }]}>
                        <Text style={s.consumptionLabel}>Cost</Text>
                        <Text style={[s.consumptionValue, { color: COLORS.warning }]} adjustsFontSizeToFit numberOfLines={1}>₱{(Number(consumptionData[room.room_id].current.totalEnergy || 0) * rate).toFixed(2)}</Text>
                      </View>
                      <View style={[s.consumptionItem, { alignItems: 'flex-end' }]}>
                        <Text style={s.consumptionLabel}>vs Last Mo.</Text>
                        <Text style={[s.consumptionValue, { color: consumptionData[room.room_id].diff > 0 ? COLORS.danger : COLORS.primary }]} adjustsFontSizeToFit numberOfLines={1}>
                          {consumptionData[room.room_id].diff > 0 ? '+' : ''}{Number(consumptionData[room.room_id].diff || 0).toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    <View style={s.cardActions}>
                      <TouchableOpacity
                        style={s.actionBtn}
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation && e.stopPropagation(); setReportRoom(room); setReportModalVisible(true);
                          getAvailableBillingCycles(room.room_id).then(res => {
                            if (res && res.length > 0) {
                              setAvailableCycles(res);
                              setSelectedPdfCycle(res[0]);
                            } else {
                              setAvailableCycles([]);
                              setSelectedPdfCycle(null);
                            }
                            setSelectedPdfWeek(null);
                          }).catch(err => {
                            console.error("Failed to fetch billing cycles", err);
                          });
                        }}
                      >
                        <Ionicons name="document-text-outline" size={16} color={COLORS.info} />
                        <Text style={[s.actionBtnText, { color: COLORS.info }]}>Report</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={s.actionBtn}
                        activeOpacity={0.7}
                        onPress={(e) => { e.stopPropagation && e.stopPropagation(); setHistoryRoomId(room.room_id); setHistoryModalVisible(true); }}
                      >
                        <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                        <Text style={[s.actionBtnText, { color: COLORS.primary }]}>History</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={s.actionBtn}
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation && e.stopPropagation();
                          setCashRoom(room);
                          setCashModalVisible(true);
                          getAvailableBillingCycles(room.room_id).then(res => {
                            const unpaid = (res || []).filter(c => c.payment_status === 'unpaid' || c.payment_status === 'overdue');
                            setCashCycles(unpaid);
                            if (unpaid.length > 0) setSelectedCashCycle(unpaid[0]);
                            else setSelectedCashCycle(null);
                          }).catch(err => console.error("Failed to fetch billing cycles for cash", err));
                        }}
                      >
                        <Ionicons name="cash-outline" size={16} color={COLORS.success} />
                        <Text style={[s.actionBtnText, { color: COLORS.success }]}>Cash</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={s.actionBtn}
                        activeOpacity={0.7}
                        onPress={async (e) => {
                          e.stopPropagation && e.stopPropagation();
                          try {
                            const vacant = await getVacantRooms();
                            if (vacant.length === 0) {
                              Alert.alert('No Vacant Rooms', 'There are no vacant rooms available for transfer.');
                              return;
                            }
                            setTransferFromRoom(room);
                            setVacantRoomsList(vacant);
                            setTransferModalVisible(true);
                          } catch (err) {
                            Alert.alert('Error', err.message || 'Failed to fetch vacant rooms');
                          }
                        }}
                      >
                        <Ionicons name="swap-horizontal" size={16} color={COLORS.warning} />
                        <Text style={[s.actionBtnText, { color: COLORS.warning }]}>Transfer</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={s.actionBtn}
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation && e.stopPropagation();
                          setRevokeRoom(room);
                          setRevokeModalVisible(true);
                        }}
                      >
                        <Ionicons name="log-out-outline" size={16} color={COLORS.danger} />
                        <Text style={[s.actionBtnText, { color: COLORS.danger }]}>Remove</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.actionBtn}
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation && e.stopPropagation();
                          setIsEditMode(true);
                          setRoomFormData({ ...room, monthly_rent: room.monthly_rent?.toString() || '', utility_rate: room.utility_rate?.toString() || '', max_occupancy: room.max_occupancy?.toString() || '1' });
                          setRoomFormErrors({});
                          setRoomModalVisible(true);
                        }}
                      >
                        <Ionicons name="create-outline" size={16} color={COLORS.textPrimary} />
                        <Text style={[s.actionBtnText, { color: COLORS.textPrimary }]}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {room.status !== 'occupied' && (
                  <>
                    <View style={s.codeFooter}>
                      <Text style={s.codeLabel}>Access Code:</Text>
                      <Text style={s.codeValue}>{room.tenant_code || '—'}</Text>
                    </View>
                    <View style={s.cardActions}>
                      {(room.status === 'vacant' || room.status === 'on_process') && (
                        <TouchableOpacity
                          style={s.actionBtn}
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedRoom(room);
                            setTenantEmail('');
                            setEmailError('');
                            setStartDate(new Date().toISOString().split('T')[0]);
                            setSendModalVisible(true);
                          }}
                        >
                          <Ionicons name="mail-outline" size={16} color={COLORS.primary} />
                          <Text style={[s.actionBtnText, { color: COLORS.primary }]}>Send Code</Text>
                        </TouchableOpacity>
                      )}
                      {room.status === 'on_process' && (
                        <TouchableOpacity
                          style={s.actionBtn}
                          activeOpacity={0.7}
                          onPress={async () => {
                            try {
                              await updateRoomStatus(room.room_id, 'vacant', null, null);
                              setGeneralSuccessData({
                                title: 'Room Reset',
                                message: `${room.room_id} is now officially vacant.`,
                                icon: 'home-outline'
                              });
                              setGeneralSuccessVisible(true);
                              loadRooms();
                            } catch (err) {
                              Alert.alert('Error', err.message || 'Failed to update room status');
                            }
                          }}
                        >
                          <Ionicons name="refresh-outline" size={16} color={COLORS.warning} />
                          <Text style={[s.actionBtnText, { color: COLORS.warning }]}>Reset</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={s.actionBtn}
                        activeOpacity={0.7}
                        onPress={() => {
                          setRegenRoom(room);
                          setRegenConfirmVisible(true);
                        }}
                      >
                        <Ionicons name="key-outline" size={16} color={COLORS.info} />
                        <Text style={[s.actionBtnText, { color: COLORS.info }]}>Regenerate</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.actionBtn}
                        activeOpacity={0.7}
                        onPress={() => {
                          setIsEditMode(true);
                          setRoomFormData({ ...room, monthly_rent: room.monthly_rent?.toString() || '', utility_rate: room.utility_rate?.toString() || '', max_occupancy: room.max_occupancy?.toString() || '1' });
                          setRoomFormErrors({});
                          setRoomModalVisible(true);
                        }}
                      >
                        <Ionicons name="create-outline" size={16} color={COLORS.textPrimary} />
                        <Text style={[s.actionBtnText, { color: COLORS.textPrimary }]}>Edit</Text>
                      </TouchableOpacity>

                      {room.status === 'archived' ? (
                        <TouchableOpacity style={s.actionBtn} activeOpacity={0.7} onPress={() => openRestoreModal(room)}>
                          <Ionicons name="refresh-outline" size={16} color={COLORS.success} />
                          <Text style={[s.actionBtnText, { color: COLORS.success }]}>Restore</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={s.actionBtn} activeOpacity={0.7} onPress={() => openArchiveModal(room)}>
                          <Ionicons name="archive-outline" size={16} color={COLORS.danger} />
                          <Text style={[s.actionBtnText, { color: COLORS.danger }]}>Archive</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}
              </GlassCard>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Send Code Modal */}
      <Modal visible={sendModalVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setSendModalVisible(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              <View style={s.modalIcon}>
                <Ionicons name="mail" size={32} color={COLORS.primary} />
              </View>
              <Text style={s.modalTitle}>Send Access Code</Text>
              <Text style={s.modalDesc}>
                Enter the tenant's email. They will receive a secure access code for{' '}
                <Text style={s.modalRoom}>{selectedRoom?.room_id}</Text>.
              </Text>


              <View style={[s.emailWrap, emailError && s.emailWrapErr]}>
                <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />
                <TextInput style={s.emailInput} placeholder="tenant@email.com" placeholderTextColor={COLORS.textMuted}
                  value={tenantEmail} onChangeText={t => { setTenantEmail(t); setEmailError(''); }}
                  keyboardType="email-address" autoCapitalize="none" autoFocus />
              </View>
              {emailError ? <Text style={s.emailError}>{emailError}</Text> : null}

              <View style={s.timerNote}>
                <Ionicons name="time-outline" size={14} color={COLORS.warning} />
                <Text style={s.timerNoteText}>Access code will expire 5 minutes after sending</Text>
              </View>

              <View style={[s.timerNote, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', marginTop: 8 }]}>
                <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.danger} />
                <Text style={[s.timerNoteText, { color: COLORS.danger }]}>For security reasons, access codes are only visible in email and are not shown inside the app.</Text>
              </View>

              <View style={s.modalActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setSendModalVisible(false); setTenantEmail(''); }} activeOpacity={0.7}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.sendBtnWrap} onPress={handleSendCode} disabled={sending} activeOpacity={0.8}>
                  <LinearGradient colors={GRADIENTS.primary} style={s.sendBtn}>
                    {sending
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <><Ionicons name="send" size={16} color="#fff" /><Text style={s.sendText}>Send Code</Text></>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal visible={reportModalVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setReportModalVisible(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={[s.modalIcon, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
              <Ionicons name="document-text" size={32} color={COLORS.info} />
            </View>
            <Text style={s.modalTitle}>Generate Monthly Report</Text>
            <Text style={s.modalDesc}>
              Generate a PDF report for <Text style={s.modalRoom}>{reportRoom?.room_id}</Text> ({reportRoom?.tenant_name || 'No tenant'}).
            </Text>

            {reportRoom && consumptionData[reportRoom.room_id] && (
              <View style={{ width: '100%', marginTop: 12, marginBottom: 20 }}>
                <Text style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 8, textAlign: 'left' }}>Select Billing Cycle</Text>
                <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }} onPress={() => setShowPdfCycleDrop(!showPdfCycleDrop)}>
                  <Text style={{ color: COLORS.textPrimary }}>
                    {selectedPdfCycle ? `${new Date(selectedPdfCycle.cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(selectedPdfCycle.cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}` : (availableCycles.length === 0 ? 'No data' : 'Loading...')}
                  </Text>
                  <Ionicons name={showPdfCycleDrop ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.primary} />
                </TouchableOpacity>

                {showPdfCycleDrop && availableCycles.length > 0 && (
                  <View style={{ backgroundColor: 'rgba(30,41,59,0.95)', borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', maxHeight: 150, overflow: 'hidden' }}>
                    <ScrollView nestedScrollEnabled>
                      {availableCycles.map((c, i) => (
                        <TouchableOpacity key={i} style={{ padding: 14, borderBottomWidth: i !== availableCycles.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                          onPress={() => {
                            setSelectedPdfCycle(c);
                            setSelectedPdfWeek(null);
                            setShowPdfCycleDrop(false);
                          }}>
                          <Text style={{ color: selectedPdfCycle?.id === c.id ? COLORS.primary : COLORS.textPrimary, fontWeight: selectedPdfCycle?.id === c.id ? 'bold' : 'normal' }}>
                            {new Date(c.cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric' })} – {new Date(c.cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {selectedPdfCycle && (
                  <>
                    <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 16, marginBottom: 8, textAlign: 'left' }}>Select Week (Optional)</Text>
                    <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }} onPress={() => setShowPdfWeekDrop(!showPdfWeekDrop)}>
                      <Text style={{ color: COLORS.textPrimary }}>
                        {selectedPdfWeek ? `${selectedPdfWeek.label} (${new Date(selectedPdfWeek.start).toLocaleDateString('default', { month: 'short', day: 'numeric' })} – ${new Date(selectedPdfWeek.end).toLocaleDateString('default', { month: 'short', day: 'numeric' })})` : 'Entire Billing Cycle'}
                      </Text>
                      <Ionicons name={showPdfWeekDrop ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.primary} />
                    </TouchableOpacity>

                    {showPdfWeekDrop && (() => {
                      const weeks = [];
                      let curr = new Date(selectedPdfCycle.cycle_start);
                      const end = new Date(selectedPdfCycle.cycle_end);
                      let w = 1;
                      while (curr < end) {
                        let wEnd = new Date(curr);
                        wEnd.setDate(wEnd.getDate() + 6);
                        if (wEnd > end) wEnd = new Date(end);
                        weeks.push({ label: `Week ${w}`, start: new Date(curr), end: wEnd });
                        curr.setDate(curr.getDate() + 7);
                        w++;
                      }

                      return (
                        <View style={{ backgroundColor: 'rgba(30,41,59,0.95)', borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                          <TouchableOpacity style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                            onPress={() => { setSelectedPdfWeek(null); setShowPdfWeekDrop(false); }}>
                            <Text style={{ color: !selectedPdfWeek ? COLORS.primary : COLORS.textPrimary, fontWeight: !selectedPdfWeek ? 'bold' : 'normal' }}>Entire Billing Cycle</Text>
                          </TouchableOpacity>
                          {weeks.map((week, i) => (
                            <TouchableOpacity key={i} style={{ padding: 14, borderBottomWidth: i !== weeks.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                              onPress={() => {
                                setSelectedPdfWeek(week);
                                setShowPdfWeekDrop(false);
                              }}>
                              <Text style={{ color: selectedPdfWeek?.label === week.label ? COLORS.primary : COLORS.textPrimary, fontWeight: selectedPdfWeek?.label === week.label ? 'bold' : 'normal' }}>
                                {week.label} ({week.start.toLocaleDateString('default', { month: 'short', day: 'numeric' })} – {week.end.toLocaleDateString('default', { month: 'short', day: 'numeric' })})
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      );
                    })()}
                  </>
                )}
              </View>
            )}

            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setReportModalVisible(false)} activeOpacity={0.7}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.sendBtnWrap} onPress={handleGenerateReport} disabled={generatingPdf || !selectedPdfCycle} activeOpacity={0.8}>
                <LinearGradient colors={['#3B82F6', '#2563EB']} style={s.sendBtn}>
                  {generatingPdf
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <><Ionicons name="download-outline" size={16} color="#fff" /><Text style={s.sendText}>Generate PDF</Text></>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transfer Modal */}
      <Modal visible={transferModalVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setTransferModalVisible(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={[s.modalIcon, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
              <Ionicons name="swap-horizontal" size={32} color={COLORS.warning} />
            </View>
            <Text style={s.modalTitle}>Transfer Tenant</Text>
            <Text style={s.modalDesc}>
              Transfer <Text style={s.modalRoom}>{transferFromRoom?.tenant_name}</Text> from{' '}
              <Text style={s.modalRoom}>{transferFromRoom?.room_id}</Text> to a vacant room.
              {'\n'}All previous consumption data will be preserved.
            </Text>

            <Text style={[s.consumptionLabel, { marginBottom: 8, marginTop: 4 }]}>SELECT DESTINATION ROOM</Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {vacantRoomsList.map(vRoom => (
                <TouchableOpacity
                  key={vRoom.room_id}
                  style={s.transferItem}
                  activeOpacity={0.7}
                  onPress={() => handleTransfer(vRoom.room_id)}
                >
                  <View style={[s.roomIcon, { backgroundColor: 'rgba(100,116,139,0.15)', width: 36, height: 36 }]}>
                    <Ionicons name="home-outline" size={18} color={COLORS.textMuted} />
                  </View>
                  <Text style={s.transferItemText}>{vRoom.room_id}</Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={[s.cancelBtn, { marginTop: 16 }]} onPress={() => setTransferModalVisible(false)} activeOpacity={0.7}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Revoke Confirmation Modal */}
      <Modal visible={revokeModalVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setRevokeModalVisible(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <TouchableOpacity style={s.closeModalBtn} onPress={() => setRevokeModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <View style={[s.modalIcon, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
              <Ionicons name="trash-outline" size={28} color={COLORS.danger} />
            </View>
            <Text style={s.modalTitle}>Confirm Revocation</Text>
            <Text style={s.modalDesc}>
              Remove "{revokeRoom?.tenant_name}" from {revokeRoom?.room_id}?
            </Text>

            <View style={s.revokeInfoBox}>
              <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.primary} />
              <Text style={s.revokeInfoText}>
                All consumption and billing history{'\n'}will be preserved.
              </Text>
            </View>

            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtnOutline} onPress={() => setRevokeModalVisible(false)} activeOpacity={0.7}>
                <Text style={s.cancelTextGreen}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.removeBtnSolid} onPress={handleConfirmRevoke} activeOpacity={0.8}>
                <Text style={s.removeTextWhite}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Revoke Success Modal */}
      <Modal visible={revokeSuccessVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setRevokeSuccessVisible(false)}>
        <View style={s.overlay}>
          <View style={s.successModal}>
            <ScrollView style={s.successScroll} contentContainerStyle={s.successScrollContent} showsVerticalScrollIndicator={false}>
              <View style={s.successHeader}>
                <View style={s.successIconPill}>
                  <View style={[s.successIconBg, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }]}>
                    <Ionicons name="checkmark-circle" size={40} color={COLORS.danger} />
                  </View>
                </View>
                <Text style={s.successTitle}>Revoked</Text>
                <Text style={s.successSubtitle}>Tenant access has been removed.</Text>
              </View>

              <View style={[s.codeContainer, { backgroundColor: 'rgba(239,68,68,0.05)' }]}>
                <Text style={s.codeContainerLabel}>STATUS UPDATED</Text>
                <Text style={[s.modalDesc, { color: COLORS.textPrimary, fontWeight: '700', marginBottom: 0 }]}>
                  {revokeSuccessMsg}
                </Text>
              </View>

              <View style={s.successDetails}>
                <View style={s.detailRow}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
                  <Text style={s.detailText}>All historical data remains safe.</Text>
                </View>
              </View>
            </ScrollView>

            <View style={s.successFooter}>
              <TouchableOpacity style={[s.successOkBtn, { backgroundColor: COLORS.danger }]} onPress={() => setRevokeSuccessVisible(false)} activeOpacity={0.8}>
                <Text style={s.successOkBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Regenerate Confirmation Modal ── */}
      <Modal visible={regenConfirmVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setRegenConfirmVisible(false)}>
        <View style={s.overlay}>
          <View style={s.successModal}>
            <ScrollView
              style={s.successScroll}
              contentContainerStyle={s.successScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={s.successHeader}>
                <View style={s.successIconPill}>
                  <View style={[s.successIconBg, { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' }]}>
                    <Ionicons name="refresh-circle" size={40} color={COLORS.warning} />
                  </View>
                </View>
                <Text style={s.successTitle}>Reset Code?</Text>
                <Text style={s.successSubtitle}>This will invalidate the current code for {regenRoom?.room_id}.</Text>
              </View>

              <View style={s.resetWarningBox}>
                <View style={s.resetWarningHeader}>
                  <Ionicons name="shield-half-outline" size={18} color={COLORS.warning} />
                  <Text style={s.resetWarningTitle}>SECURITY NOTICE</Text>
                </View>
                <View style={s.resetWarningItem}>
                  <View style={s.bullet} />
                  <Text style={s.resetWarningText}>The current code will stop working immediately.</Text>
                </View>
                <View style={s.resetWarningItem}>
                  <View style={s.bullet} />
                  <Text style={s.resetWarningText}>You must share the new code with your tenant.</Text>
                </View>
              </View>
            </ScrollView>

            <View style={s.successFooter}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={[s.cancelBtn, { flex: 1, marginTop: 0 }]} onPress={() => setRegenConfirmVisible(false)} activeOpacity={0.7}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.successOkBtn, { flex: 1, backgroundColor: COLORS.warning }]} onPress={handleConfirmRegenerate} activeOpacity={0.8}>
                  <Text style={s.successOkBtnText}>Reset Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Regenerate Success Modal ── */}
      <Modal visible={regenSuccessVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setRegenSuccessVisible(false)}>
        <View style={s.overlay}>
          <View style={s.successModal}>
            <ScrollView
              style={s.successScroll}
              contentContainerStyle={s.successScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={s.successHeader}>
                <View style={s.successIconPill}>
                  <View style={s.successIconBg}>
                    <Ionicons name="shield-checkmark" size={40} color={COLORS.primary} />
                  </View>
                </View>
                <Text style={s.successTitle}>Code Reset</Text>
                <Text style={s.successSubtitle}>New secure access code generated.</Text>
              </View>

              <View style={s.codeContainer}>
                <Text style={s.codeContainerLabel}>NEW ACCESS CODE</Text>
                <View style={s.codeBox}>
                  <Text style={s.codeText}>{regenSuccessMsg.split('New Code: ')[1] || '—'}</Text>
                </View>
                <View style={s.roomBadge}>
                  <Ionicons name="business" size={14} color={COLORS.primary} />
                  <Text style={s.roomBadgeText}>{regenRoom?.room_id}</Text>
                </View>
              </View>

              <View style={s.successDetails}>
                <View style={s.detailRow}>
                  <Ionicons name="share-social-outline" size={18} color={COLORS.primary} />
                  <Text style={s.detailText}>You must share this new code with the tenant.</Text>
                </View>
                <View style={s.detailRow}>
                  <Ionicons name="lock-closed-outline" size={18} color={COLORS.info} />
                  <Text style={s.detailText}>The old code has been permanently deactivated.</Text>
                </View>
              </View>
            </ScrollView>

            <View style={s.successFooter}>
              <TouchableOpacity style={s.successOkBtn} onPress={() => setRegenSuccessVisible(false)} activeOpacity={0.8}>
                <Text style={s.successOkBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Code Sent Success Modal ── */}
      <Modal visible={codeSuccessVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setCodeSuccessVisible(false)}>
        <View style={s.overlay}>
          <View style={s.successModal}>
            <ScrollView
              style={s.successScroll}
              contentContainerStyle={s.successScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={s.successHeader}>
                <View style={s.successIconPill}>
                  <View style={s.successIconBg}>
                    <Ionicons name="checkmark-circle" size={40} color={COLORS.primary} />
                  </View>
                </View>
                <Text style={s.successTitle}>Code Sent</Text>
                <Text style={s.successSubtitle}>Access code successfully delivered to tenant email.</Text>
              </View>

              <View style={[s.codeContainer, { paddingVertical: 20 }]}>
                <Ionicons name="business" size={24} color={COLORS.primary} style={{ marginBottom: 8 }} />
                <Text style={[s.modalDesc, { color: COLORS.textPrimary, fontWeight: 'bold', marginBottom: 0 }]}>{successCodeData.room}</Text>
              </View>

              <View style={s.successDetails}>
                <View style={s.detailRow}>
                  <Ionicons name="time-outline" size={18} color={COLORS.warning} />
                  <Text style={s.detailText}>Code expires in <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>5 minutes</Text>.</Text>
                </View>
                <View style={s.detailRow}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.danger} />
                  <Text style={s.detailText}>For security reasons, access codes are only accessible via email.</Text>
                </View>
              </View>
            </ScrollView>

            <View style={s.successFooter}>
              <TouchableOpacity style={s.successOkBtn} onPress={() => setCodeSuccessVisible(false)} activeOpacity={0.8}>
                <Text style={s.successOkBtnText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── General Success Modal (Reset, etc.) ── */}
      <Modal visible={generalSuccessVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setGeneralSuccessVisible(false)}>
        <View style={s.overlay}>
          <View style={s.successModal}>
            <View style={s.successScrollContent}>
              <View style={s.successHeader}>
                <View style={s.successIconPill}>
                  <View style={[s.successIconBg, { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)' }]}>
                    <Ionicons name={generalSuccessData.icon} size={40} color={COLORS.primary} />
                  </View>
                </View>
                <Text style={s.successTitle}>{generalSuccessData.title}</Text>
                <Text style={s.successSubtitle}>{generalSuccessData.message}</Text>
              </View>

              <View style={[s.codeContainer, { paddingVertical: 30 }]}>
                <Ionicons name="business" size={48} color={COLORS.primary} style={{ marginBottom: 12, opacity: 0.8 }} />
                <Text style={[s.modalTitle, { fontSize: 18, marginBottom: 0 }]}>Status Updated</Text>
              </View>
            </View>

            <View style={s.successFooter}>
              <TouchableOpacity style={s.successOkBtn} onPress={() => setGeneralSuccessVisible(false)} activeOpacity={0.8}>
                <Text style={s.successOkBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Room History Modal */}
      <RoomHistoryModal
        visible={historyModalVisible}
        onClose={() => { setHistoryModalVisible(false); setHistoryRoomId(null); }}
        roomId={historyRoomId}
      />

      {/* ── Room Add/Edit Modal ── */}
      <Modal visible={roomModalVisible} transparent animationType="slide" onRequestClose={() => setRoomModalVisible(false)}>
        <View style={s.overlay}>
          <View style={[s.modal, { padding: 0 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
              <View>
                <Text style={[s.modalTitle, { textAlign: 'left', marginBottom: 4 }]}>{isEditMode ? 'Edit Room' : 'Add New Room'}</Text>
                <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>{isEditMode ? 'Update room configuration.' : 'Create and configure a new room.'}</Text>
              </View>
              <TouchableOpacity onPress={() => setRoomModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 20, maxHeight: 400 }} contentContainerStyle={{ paddingBottom: 20 }}>

              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Room Number <Text style={{ color: COLORS.danger }}>*</Text></Text>
              <View style={[s.emailWrap, roomFormErrors.room_id && s.emailWrapErr, { marginBottom: 4 }]}>
                <Ionicons name="home-outline" size={18} color={COLORS.textMuted} />
                <TextInput
                  style={[s.emailInput, { marginLeft: 8 }]}
                  placeholder="e.g. 101"
                  placeholderTextColor={COLORS.textMuted}
                  value={roomFormData.room_id}
                  onChangeText={t => setRoomFormData({ ...roomFormData, room_id: t })}
                  editable={!isEditMode}
                />
              </View>
              <Text style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 20 }}>Enter a unique room number.</Text>

              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Room Type</Text>
              <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 }}>
                {['Standard', 'Shared Room'].map(type => (
                  <TouchableOpacity key={type}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: roomFormData.room_type === type ? COLORS.primary : 'transparent', alignItems: 'center' }}
                    onPress={() => setRoomFormData({ ...roomFormData, room_type: type })}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: roomFormData.room_type === type ? '#fff' : COLORS.textSecondary }}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {isEditMode && (
                <>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Room Status</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    {['vacant', 'not_available', 'under_maintenance'].map(st => (
                      <TouchableOpacity key={st}
                        style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: roomFormData.status === st ? COLORS.primary : COLORS.border, backgroundColor: roomFormData.status === st ? 'rgba(16,185,129,0.1)' : 'transparent', opacity: roomFormData.status === 'occupied' ? 0.5 : 1 }}
                        onPress={() => { if (roomFormData.status !== 'occupied') setRoomFormData({ ...roomFormData, status: st }); else Alert.alert("Cannot change status of an occupied room."); }}
                        disabled={roomFormData.status === 'occupied'}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: roomFormData.status === st ? COLORS.primary : COLORS.textSecondary }}>{st.replace('_', ' ').toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={{ flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 12 }}>
              <TouchableOpacity style={[s.cancelBtn, { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 0 }]} onPress={() => setRoomModalVisible(false)} disabled={actionLoading}>
                <Text style={[s.cancelText, { color: COLORS.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ flex: 1 }} onPress={handleRoomSubmit} disabled={actionLoading}>
                <LinearGradient colors={GRADIENTS.primary} style={{ paddingVertical: 14, borderRadius: 12, alignItems: 'center', opacity: actionLoading ? 0.7 : 1 }}>
                  {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Save Room</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ArchiveModal
        visible={archiveModalVisible}
        onClose={() => setArchiveModalVisible(false)}
        onConfirm={handleArchiveAction}
        roomName={archiveRoomObj?.room_id}
        isLoading={actionLoading}
        isRestore={isRestoreMode}
      />

      {/* Cash Payment Modal */}
      <Modal visible={cashModalVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setCashModalVisible(false)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={[s.modalIcon, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <Ionicons name="cash" size={32} color={COLORS.success} />
            </View>
            <Text style={s.modalTitle}>Receive Cash Payment</Text>
            <Text style={s.modalDesc}>
              Mark an unpaid billing cycle for <Text style={s.modalRoom}>{cashRoom?.room_id}</Text> as Paid (Cash).
            </Text>

            {cashRoom && cashCycles && (
              <View style={{ width: '100%', marginTop: 12, marginBottom: 20 }}>
                {cashCycles.length === 0 ? (
                  <Text style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', marginTop: 10 }}>No unpaid billing cycles found.</Text>
                ) : (
                  <>
                    <Text style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 8, textAlign: 'left' }}>Select Unpaid Cycle</Text>
                    <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }} onPress={() => setShowCashCycleDrop(!showCashCycleDrop)}>
                      <Text style={{ color: COLORS.textPrimary }}>
                        {selectedCashCycle ? `${new Date(selectedCashCycle.cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(selectedCashCycle.cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })} (₱${Number(selectedCashCycle.total_amount).toFixed(2)})` : 'Select a cycle...'}
                      </Text>
                      <Ionicons name={showCashCycleDrop ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.success} />
                    </TouchableOpacity>

                    {showCashCycleDrop && (
                      <View style={{ backgroundColor: 'rgba(30,41,59,0.95)', borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', maxHeight: 150, overflow: 'hidden' }}>
                        <ScrollView nestedScrollEnabled>
                          {cashCycles.map((c, i) => (
                            <TouchableOpacity key={i} style={{ padding: 14, borderBottomWidth: i !== cashCycles.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                              onPress={() => {
                                setSelectedCashCycle(c);
                                setShowCashCycleDrop(false);
                              }}>
                              <Text style={{ color: selectedCashCycle?.id === c.id ? COLORS.success : COLORS.textPrimary, fontWeight: selectedCashCycle?.id === c.id ? 'bold' : 'normal' }}>
                                {new Date(c.cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric' })} – {new Date(c.cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })} <Text style={{ color: COLORS.textMuted }}>| ₱{Number(c.total_amount).toFixed(2)}</Text>
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setCashModalVisible(false); setCashCycles([]); setSelectedCashCycle(null); }} activeOpacity={0.7}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.sendBtnWrap} onPress={handleCashPayment} disabled={processingCash || !selectedCashCycle} activeOpacity={0.8}>
                <LinearGradient colors={['#10B981', '#059669']} style={s.sendBtn}>
                  {processingCash
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <><Ionicons name="checkmark-circle-outline" size={16} color="#fff" /><Text style={s.sendText}>Confirm Paid</Text></>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}