import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl, Modal, TextInput, ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAllRooms, generateNewTenantCode, updateRoomStatus, saveTenantInvitation, getMonthlyConsumptionFiltered, getSetting, revokeTenant, transferTenant, getVacantRooms } from '../../services/database';
import { sendTenantAccessCode } from '../../services/emailService';
import { generateMonthlyReport, shareReport } from '../../services/pdfService';
import RoomCard from '../../components/RoomCard';
import GlassCard from '../../components/GlassCard';
import StatusBadge from '../../components/StatusBadge';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, GRADIENTS, SHADOWS } from '../../constants/theme';

export default function RoomsScreen() {
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
  const [reportRoom, setReportRoom] = useState(null);
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

  // Code Success Modal
  const [codeSuccessVisible, setCodeSuccessVisible] = useState(false);
  const [successCodeData, setSuccessCodeData] = useState({ code: '', room: '', email: '' });

  // General Success (for reset, etc.)
  const [generalSuccessVisible, setGeneralSuccessVisible] = useState(false);
  const [generalSuccessData, setGeneralSuccessData] = useState({ title: '', message: '', icon: 'checkmark-circle' });

  // Consumption cache
  const [consumptionData, setConsumptionData] = useState({});
  const [rate, setRate] = useState(12.5);

  useEffect(() => { loadRooms(); }, []);

  const loadRooms = async () => {
    const summary = await getBuildingSummary();
    if (summary) {
      const { rooms: roomData, totals } = summary;
      
      // Map rooms with their specific consumption data
      const mappedRooms = (roomData || []).map(r => ({
        ...r,
        consumption: {
          energy: r.currEnergy || 0,
          cost: (r.currEnergy || 0) * rate
        },
        prevConsumption: {
          energy: r.prevEnergy || 0,
          cost: (r.prevEnergy || 0) * rate
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
    
    const rateVal = await getSetting('rate_per_kwh');
    if (rateVal) setRate(parseFloat(rateVal));
  };

  const onRefresh = async () => { setRefreshing(true); await loadRooms(); setRefreshing(false); };



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
    if (!tenantEmail.trim()) { setEmailError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(tenantEmail.trim())) { setEmailError('Enter a valid email address'); return; }

    setSending(true);
    try {
      await saveTenantInvitation(tenantEmail.trim(), selectedRoom.room_id, selectedRoom.tenant_code);
      const result = await sendTenantAccessCode(tenantEmail.trim(), selectedRoom.room_id, selectedRoom.tenant_code);
      setSendModalVisible(false);
      setTenantEmail('');

      if (result.success) {
        setSuccessCodeData({
          code: result.mockCode || selectedRoom.tenant_code,
          room: selectedRoom.room_id,
          email: tenantEmail.trim()
        });
        setCodeSuccessVisible(true);
      } else {
        Alert.alert('Failed', result.message || 'Could not send the access code.');
      }
      loadRooms();
    } catch (_err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportRoom) return;
    setGeneratingPdf(true);
    try {
      const now = new Date();
      const result = await generateMonthlyReport({
        roomId: reportRoom.room_id,
        tenantName: reportRoom.tenant_name,
        tenantStartDate: reportRoom.tenant_start_date,
        moveOutDate: reportRoom.move_out_date,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      });
      setReportModalVisible(false);
      await shareReport(result.uri);
    } catch (err) {
      Alert.alert('Error', 'Failed to generate report: ' + err.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
  const onProcessCount = rooms.filter(r => r.status === 'on_process').length;
  const vacantCount = rooms.filter(r => r.status === 'vacant').length;

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <Text style={s.title}>Room Management</Text>
        <Text style={s.subtitle}>Manage tenant access and room assignments</Text>

        <View style={s.statsRow}>
          <GlassCard style={s.statCard}>
            <Text style={s.statNum}>{rooms.length}</Text>
            <Text style={s.statLabel}>Total</Text>
          </GlassCard>
          <GlassCard style={[s.statCard, { borderColor: COLORS.primary }]}>
            <Text style={[s.statNum, { color: COLORS.primary }]}>{occupiedCount}</Text>
            <Text style={s.statLabel}>Occupied</Text>
          </GlassCard>
          <GlassCard style={[s.statCard, { borderColor: COLORS.warning }]}>
            <Text style={[s.statNum, { color: COLORS.warning }]}>{onProcessCount}</Text>
            <Text style={s.statLabel}>On Process</Text>
          </GlassCard>
          <GlassCard style={s.statCard}>
            <Text style={s.statNum}>{vacantCount}</Text>
            <Text style={s.statLabel}>Vacant</Text>
          </GlassCard>
        </View>

        <GlassCard style={s.infoCard}>
          <Ionicons name="information-circle" size={18} color={COLORS.info} />
          <Text style={s.infoText}>
            Tap a room for actions: send codes, generate reports, transfer or revoke tenants. Historical data is always preserved.
          </Text>
        </GlassCard>

        {rooms.map(room => (
          <View key={room.room_id}>
            <GlassCard style={[s.roomCard, room.status === 'occupied' && { borderColor: COLORS.primary }]}>
              <View style={s.roomHeader}>
                <View style={s.roomInfo}>
                  <View style={[s.roomIcon, { backgroundColor: room.status === 'occupied' ? 'rgba(34,197,94,0.15)' : room.status === 'on_process' ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)' }]}>
                    <Ionicons name={room.status === 'occupied' ? 'flash' : room.status === 'on_process' ? 'time' : 'flash-outline'} size={22} color={room.status === 'occupied' ? COLORS.primary : room.status === 'on_process' ? COLORS.warning : COLORS.textMuted} />
                  </View>
                  <View>
                    <Text style={s.roomId}>{room.room_id}</Text>
                    <Text style={s.tenantName}>{room.tenant_name || 'No tenant assigned'}</Text>
                  </View>
                </View>
                <StatusBadge status={room.status} size="sm" />
              </View>

              {room.status === 'occupied' && room.tenant_start_date && (
                <View style={s.moveInRow}>
                  {isActive && room.consumption && (
                    <View style={styles.stats}>
                      <View style={styles.stat}>
                        <Ionicons name="flash-outline" size={14} color={COLORS.accent} />
                        <Text style={styles.statValue}>{Number(room.consumption.energy || 0).toFixed(2)} kWh</Text>
                      </View>
                      <View style={styles.stat}>
                        <Text style={styles.statLabel}>₱</Text>
                        <Text style={styles.statValue}>{Number(room.consumption.cost || 0).toFixed(2)}</Text>
                      </View>
                    </View>
                  )}
                  <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                  <Text style={s.moveInText}>Move-in: {room.tenant_start_date}{room.move_out_date ? `  •  Move-out: ${room.move_out_date}` : ''}</Text>
                </View>
              )}

              {room.status === 'occupied' && consumptionData[room.room_id] && (
                <>
                  <View style={s.consumptionRow}>
                    <View style={s.consumptionItem}>
                      <Text style={s.consumptionLabel}>Consumption</Text>
                      <Text style={s.consumptionValue}>{Number(consumptionData[room.room_id].current.totalEnergy || 0).toFixed(2)} kWh</Text>
                    </View>
                    <View style={s.consumptionItem}>
                      <Text style={s.consumptionLabel}>Cost</Text>
                      <Text style={[s.consumptionValue, { color: COLORS.warning }]}>₱{(Number(consumptionData[room.room_id].current.totalEnergy || 0) * rate).toFixed(2)}</Text>
                    </View>
                    <View style={s.consumptionItem}>
                      <Text style={s.consumptionLabel}>vs Last Mo.</Text>
                      <Text style={[s.consumptionValue, { color: consumptionData[room.room_id].diff > 0 ? COLORS.danger : COLORS.primary }]}>
                        {consumptionData[room.room_id].diff > 0 ? '+' : ''}{Number(consumptionData[room.room_id].diff || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  <View style={s.cardActions}>
                    <TouchableOpacity
                      style={s.actionBtn}
                      activeOpacity={0.7}
                      onPress={(e) => { e.stopPropagation && e.stopPropagation(); setReportRoom(room); setReportModalVisible(true); }}
                    >
                      <Ionicons name="document-text-outline" size={16} color={COLORS.info} />
                      <Text style={[s.actionBtnText, { color: COLORS.info }]}>Report</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.actionBtn}
                      activeOpacity={0.7}
                      onPress={async (e) => {
                        e.stopPropagation && e.stopPropagation();
                        const vacant = await getVacantRooms();
                        if (vacant.length === 0) {
                          Alert.alert('No Vacant Rooms', 'There are no vacant rooms available for transfer.');
                          return;
                        }
                        setTransferFromRoom(room);
                        setVacantRoomsList(vacant);
                        setTransferModalVisible(true);
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
                    {room.status === 'vacant' && (
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
                          await updateRoomStatus(room.room_id, 'vacant', null, null);
                          setGeneralSuccessData({
                            title: 'Room Reset',
                            message: `${room.room_id} is now officially vacant.`,
                            icon: 'home-outline'
                          });
                          setGeneralSuccessVisible(true);
                          loadRooms();
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
                  </View>
                </>
              )}
            </GlassCard>
          </View>
        ))}
      </ScrollView>

      {/* Send Code Modal */}
      <Modal visible={sendModalVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setSendModalVisible(false)}>
        <View style={s.overlay}>
            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              <View style={s.modalIcon}>
                <Ionicons name="mail" size={32} color={COLORS.primary} />
              </View>
              <Text style={s.modalTitle}>Send Access Code</Text>
              <Text style={s.modalDesc}>
                Enter the tenant's email. They will receive the access code for{' '}
                <Text style={s.modalRoom}>{selectedRoom?.room_id}</Text>. Code expires in 5 minutes.
              </Text>
              <View style={s.codePreview}>
                <Ionicons name="key-outline" size={16} color={COLORS.warning} />
                <Text style={s.codePreviewText}>Code: </Text>
                <Text style={s.codePreviewValue}>{selectedRoom?.tenant_code}</Text>
              </View>

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
              <View style={s.reportPreview}>
                <View style={s.reportRow}>
                  <Text style={s.reportLabel}>Current Month</Text>
                  <Text style={s.reportValue}>{Number(consumptionData[reportRoom.room_id].current.totalEnergy || 0).toFixed(4)} kWh</Text>
                </View>
                <View style={s.reportRow}>
                  <Text style={s.reportLabel}>Last Month</Text>
                  <Text style={s.reportValue}>{Number(consumptionData[reportRoom.room_id].previous.totalEnergy || 0).toFixed(4)} kWh</Text>
                </View>
                <View style={[s.reportRow, { borderBottomWidth: 0 }]}>
                  <Text style={s.reportLabel}>Est. Bill</Text>
                  <Text style={[s.reportValue, { color: COLORS.warning }]}>₱{(Number(consumptionData[reportRoom.room_id].current.totalEnergy || 0) * rate).toFixed(2)}</Text>
                </View>
              </View>
            )}

            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setReportModalVisible(false)} activeOpacity={0.7}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.sendBtnWrap} onPress={handleGenerateReport} disabled={generatingPdf} activeOpacity={0.8}>
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
                <Text style={s.successSubtitle}>Access code successfully delivered.</Text>
              </View>

              <View style={s.codeContainer}>
                <Text style={s.codeContainerLabel}>TENANT ACCESS CODE</Text>
                <View style={s.codeBox}>
                  <Text style={s.codeText}>{successCodeData.code}</Text>
                </View>
                <View style={s.roomBadge}>
                  <Ionicons name="business" size={14} color={COLORS.primary} />
                  <Text style={s.roomBadgeText}>{successCodeData.room}</Text>
                </View>
              </View>

              <View style={s.successDetails}>
                <View style={s.detailRow}>
                  <Ionicons name="time-outline" size={18} color={COLORS.warning} />
                  <Text style={s.detailText}>Code expires in <Text style={{fontWeight:'700', color: COLORS.textPrimary}}>5 minutes</Text>.</Text>
                </View>
                <View style={s.detailRow}>
                  <Ionicons name="people-outline" size={18} color={COLORS.primary} />
                  <Text style={s.detailText}>The tenant can now use this code to sign up.</Text>
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
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl + 10, paddingBottom: SPACING.xxl },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  statsRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.lg },
  statCard: { flex: 1, alignItems: 'center', padding: SPACING.sm },
  statNum: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg, padding: SPACING.md },
  infoText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, flex: 1 },

  // Room card inline
  roomCard: { marginBottom: SPACING.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  roomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  roomInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  roomIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  roomId: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  tenantName: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, marginTop: 2 },
  moveInRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.sm },
  moveInText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  consumptionRow: { flexDirection: 'row', gap: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border, marginBottom: SPACING.sm },
  consumptionItem: { flex: 1 },
  consumptionLabel: { fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  consumptionValue: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginTop: 2 },
  codeFooter: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  codeLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  codeValue: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.semibold, fontFamily: 'monospace' },
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm, marginTop: SPACING.xs, gap: SPACING.xs },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: SPACING.sm, backgroundColor: COLORS.backgroundLight, borderRadius: RADIUS.md },
  actionBtnText: { fontSize: 12, fontWeight: FONT_WEIGHT.semibold },

  // Modal shared
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.75)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
    zIndex: 999 
  },
  modal: { 
    backgroundColor: COLORS.surface, 
    borderRadius: RADIUS.xl, 
    padding: SPACING.xl, 
    width: '100%', 
    maxWidth: 360, 
    maxHeight: '85%', // Prevent overflow
    borderWidth: 1, 
    borderColor: COLORS.border,
    elevation: 10,
    zIndex: 1000
  },
  modalIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(34,197,94,0.12)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: SPACING.md },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  modalDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.md },
  modalRoom: { color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold },
  codePreview: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.md, justifyContent: 'center' },
  codePreviewText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  codePreviewValue: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.warning, fontFamily: 'monospace', letterSpacing: 1 },
  emailWrap: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.backgroundLight, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 50, marginBottom: SPACING.xs },
  emailWrapErr: { borderColor: COLORS.danger },
  emailInput: { flex: 1, fontSize: FONT_SIZE.md, color: COLORS.textPrimary },
  emailError: { fontSize: FONT_SIZE.xs, color: COLORS.danger, marginBottom: SPACING.sm },
  timerNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.sm },
  timerNoteText: { fontSize: FONT_SIZE.xs, color: COLORS.warning, flex: 1, marginLeft: SPACING.xs },
  modalActions: { flexDirection: 'row', marginTop: SPACING.md },
  cancelBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelText: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.medium },
  cancelBtnOutline: { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primary, alignItems: 'center' },
  cancelTextGreen: { fontSize: FONT_SIZE.md, color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold },
  removeBtnSolid: { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.danger, alignItems: 'center' },
  primaryBtnSolid: { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  removeTextWhite: { fontSize: FONT_SIZE.md, color: '#fff', fontWeight: FONT_WEIGHT.semibold },
  successBtnSolid: { width: '100%', paddingVertical: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center', marginTop: SPACING.md },
  closeModalBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  revokeInfoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundLight, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, gap: SPACING.md },
  revokeInfoText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, flex: 1 },
  successIconWrap: { alignSelf: 'center', marginBottom: SPACING.lg, marginTop: SPACING.md, position: 'relative' },
  successIconInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  particle: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, opacity: 0.7 },
  sendBtnWrap: { flex: 1, borderRadius: RADIUS.md, overflow: 'hidden' },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.md },
  sendText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: '#fff' },

  // Report preview
  reportPreview: { backgroundColor: COLORS.backgroundLight, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md, overflow: 'hidden' },
  reportRow: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  reportLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  reportValue: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },

  // Transfer
  transferItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, backgroundColor: COLORS.backgroundLight, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  transferItemText: { flex: 1, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textPrimary },

  // Code Sent Success Modal (Premium Dark Theme)
  successModal: { 
    backgroundColor: COLORS.surface, 
    borderRadius: RADIUS.xl, 
    width: '100%', 
    maxWidth: 320, 
    maxHeight: '85%', // Safer height constraint
    ...SHADOWS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 12, // Even higher elevation
    zIndex: 1100
  },
  successScroll: { flexGrow: 0 },
  successScrollContent: { padding: 24, alignItems: 'center' },
  successHeader: { alignItems: 'center', marginBottom: 20 },
  successIconPill: { marginBottom: 16 },
  successIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(34,197,94,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
  successTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  codeContainer: { width: '100%', backgroundColor: COLORS.backgroundLight, borderRadius: RADIUS.lg, padding: 20, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  codeContainerLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 12 },
  codeBox: { backgroundColor: COLORS.surface, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary, marginBottom: 12 },
  codeText: { fontSize: 28, fontWeight: '800', color: COLORS.primary, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', letterSpacing: 2 },
  roomBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  roomBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary, marginLeft: 6 },
  successDetails: { width: '100%', paddingHorizontal: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  detailText: { fontSize: 13, color: COLORS.textSecondary, flex: 1, marginLeft: 12 },
  successFooter: { padding: 20, paddingTop: 0 },
  successOkBtn: { backgroundColor: COLORS.primary, width: '100%', height: 54, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', ...SHADOWS.md },
  successOkBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Reset Specific
  resetWarningBox: { 
    backgroundColor: 'rgba(245,158,11,0.08)', 
    borderRadius: RADIUS.lg, 
    padding: SPACING.md, 
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.15)'
  },
  resetWarningHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  resetWarningTitle: { fontSize: 11, fontWeight: '800', color: COLORS.warning, letterSpacing: 1 },
  resetWarningItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  bullet: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.warning },
  resetWarningText: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  resetBtnSolid: { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.warning, alignItems: 'center' },
});