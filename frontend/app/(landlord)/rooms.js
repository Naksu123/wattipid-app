import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  generateNewTenantCode,
  updateRoomStatus,
  saveTenantInvitation,
  getSetting,
  revokeTenant,
  transferTenant,
  getVacantRooms,
  getBuildingSummary,
  getAvailableBillingCycles,
  addRoom,
  updateRoom,
  archiveRoom,
  restoreRoom,
} from '../../services/database';
import { generateCycleReport, shareReport } from '../../services/pdfService';
import { submitOfflinePayment } from '../../services/paymentService';
import { useModal } from '../../contexts/ModalContext';
import { useSync } from '../../contexts/SyncContext';
import RoomCard from '../../components/RoomManagement/RoomCard';
import RoomActionMenuModal from '../../components/RoomManagement/RoomActionMenuModal';
import RoomFormModal from '../../components/RoomManagement/RoomFormModal';
import RoomHistoryModal from '../../components/landlord/RoomHistoryModal';
import ArchiveModal from '../../components/RoomManagement/ArchiveModal';
import { COLORS, GRADIENTS } from '@/styles/theme';
import s from '@/styles/landlord/rooms.styles';

export default function RoomsScreen() {
  const { showModal } = useModal();
  const { landlordSyncData } = useSync();

  // Core Room State
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState('All');
  const [rate, setRate] = useState(12.50);
  const [consumptionData, setConsumptionData] = useState({});

  // Action Menu Bottom Sheet
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [actionMenuRoom, setActionMenuRoom] = useState(null);

  // Add / Edit Room Modal
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Archive / Restore Modal
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);
  const [archiveRoomObj, setArchiveRoomObj] = useState(null);
  const [isRestoreMode, setIsRestoreMode] = useState(false);

  // Send Code / Invitation Modal
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [tenantEmail, setTenantEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Report Modal
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportRoom, setReportRoom] = useState(null);
  const [availableCycles, setAvailableCycles] = useState([]);
  const [selectedPdfCycle, setSelectedPdfCycle] = useState(null);
  const [selectedPdfWeek, setSelectedPdfWeek] = useState(null);
  const [showPdfCycleDrop, setShowPdfCycleDrop] = useState(false);
  const [showPdfWeekDrop, setShowPdfWeekDrop] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // History Modal
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyRoomId, setHistoryRoomId] = useState(null);

  // Transfer Modal
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferFromRoom, setTransferFromRoom] = useState(null);
  const [vacantRoomsList, setVacantRoomsList] = useState([]);

  // Revoke Modals
  const [revokeModalVisible, setRevokeModalVisible] = useState(false);
  const [revokeRoom, setRevokeRoom] = useState(null);
  const [revokeSuccessVisible, setRevokeSuccessVisible] = useState(false);
  const [revokeSuccessMsg, setRevokeSuccessMsg] = useState('');

  // Regenerate Access Code Modals
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

  // General Success Modal
  const [generalSuccessVisible, setGeneralSuccessVisible] = useState(false);
  const [generalSuccessData, setGeneralSuccessData] = useState({ title: '', message: '', icon: 'checkmark-circle' });

  const hasRoomsRef = useRef(false);

  // Instant Cache Restoration (Stale-While-Revalidate)
  useEffect(() => {
    let isMounted = true;
    const restoreCachedRooms = async () => {
      try {
        const cached = await AsyncStorage.getItem('@cached_landlord_rooms');
        if (cached && isMounted) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.rooms) && parsed.rooms.length > 0) {
            setRooms(parsed.rooms);
            if (parsed.rate) setRate(parsed.rate);
            if (parsed.consumptionData) setConsumptionData(parsed.consumptionData);
            hasRoomsRef.current = true;
            setLoading(false);
          }
        }
      } catch (err) {
        console.warn('[RoomsScreen] Cache restore error:', err);
      }
    };
    restoreCachedRooms();
    return () => { isMounted = false; };
  }, []);

  // 1. Data Loader
  const loadRooms = useCallback(async () => {
    try {
      setError(null);
      const [summary, rateVal] = await Promise.all([
        getBuildingSummary(),
        getSetting('rate_per_kwh').catch(() => null),
      ]);

      const currentRate = rateVal ? parseFloat(rateVal) : 12.50;
      setRate(currentRate);

      if (summary && summary.rooms) {
        const { rooms: roomData } = summary;

        const mappedRooms = (roomData || []).map((r) => {
          const roomRate = (r.utility_rate && parseFloat(r.utility_rate) > 0)
            ? parseFloat(r.utility_rate)
            : currentRate;

          const currentCost = (parseFloat(r.currEnergy || 0)) * roomRate;
          const previousCost = r.prevCost !== undefined
            ? parseFloat(r.prevCost)
            : (parseFloat(r.prevEnergy || 0)) * roomRate;

          return {
            ...r,
            consumption: {
              energy: parseFloat(r.currEnergy || 0),
              cost: currentCost,
            },
            prevConsumption: {
              energy: parseFloat(r.prevEnergy || 0),
              cost: previousCost,
            },
          };
        });

        setRooms(mappedRooms);

        const cData = {};
        mappedRooms.forEach((r) => {
          if (r.status === 'occupied') {
            cData[r.room_id] = {
              current: { totalEnergy: r.consumption.energy, totalCost: r.consumption.cost },
              previous: { totalEnergy: r.prevConsumption.energy, totalCost: r.prevConsumption.cost },
              diff: r.consumption.energy - r.prevConsumption.energy,
            };
          }
        });
        setConsumptionData(cData);
        hasRoomsRef.current = true;

        AsyncStorage.setItem('@cached_landlord_rooms', JSON.stringify({
          rooms: mappedRooms,
          rate: currentRate,
          consumptionData: cData
        })).catch(() => {});
      }
    } catch (err) {
      console.error('[loadRooms] Error:', err);
      if (!hasRoomsRef.current) {
        setError('Unable to load rooms. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Real-Time Sync Hook
  useEffect(() => {
    if (landlordSyncData && landlordSyncData.roomsSummary) {
      const summary = landlordSyncData.roomsSummary || {};
      const currentRate = rate || 12.50;
      const { rooms: roomData } = summary;

      if (roomData) {
        const mappedRooms = roomData.map((r) => {
          const roomRate = (r.utility_rate && parseFloat(r.utility_rate) > 0)
            ? parseFloat(r.utility_rate)
            : currentRate;

          const currentCost = (parseFloat(r.currEnergy || 0)) * roomRate;
          const previousCost = r.prevCost !== undefined
            ? parseFloat(r.prevCost)
            : (parseFloat(r.prevEnergy || 0)) * roomRate;

          return {
            ...r,
            consumption: {
              energy: parseFloat(r.currEnergy || 0),
              cost: currentCost,
            },
            prevConsumption: {
              energy: parseFloat(r.prevEnergy || 0),
              cost: previousCost,
            },
          };
        });

        setRooms(mappedRooms);

        const cData = {};
        mappedRooms.forEach((r) => {
          if (r.status === 'occupied') {
            cData[r.room_id] = {
              current: { totalEnergy: r.consumption.energy, totalCost: r.consumption.cost },
              previous: { totalEnergy: r.prevConsumption.energy, totalCost: r.prevConsumption.cost },
              diff: r.consumption.energy - r.prevConsumption.energy,
            };
          }
        });
        setConsumptionData(cData);
      }
    }
  }, [landlordSyncData, rate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRooms();
    setRefreshing(false);
  };

  // 2. Filtering & Searching
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Tab status filter
      if (filterActive === 'All' && room.status === 'archived') return false;
      if (filterActive === 'Occupied' && room.status !== 'occupied') return false;
      if (filterActive === 'Vacant' && room.status !== 'vacant' && room.status !== 'on_process') return false;
      if (filterActive === 'Under Maintenance' && room.status !== 'under_maintenance') return false;
      if (filterActive === 'Not Available' && room.status !== 'not_available') return false;
      if (filterActive === 'Archived' && room.status !== 'archived') return false;

      // Text query search
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchId = room.room_id?.toLowerCase().includes(query);
        const matchName = room.room_name?.toLowerCase().includes(query);
        const matchTenant = room.tenant_name?.toLowerCase().includes(query);
        const matchType = room.room_type?.toLowerCase().includes(query);
        return matchId || matchName || matchTenant || matchType;
      }

      return true;
    });
  }, [rooms, filterActive, searchQuery]);

  // 4. Action Menu Handlers
  const handleOpenActionMenu = (room) => {
    setActionMenuRoom(room);
    setActionMenuVisible(true);
  };

  // Add / Edit Room
  const handleOpenAddRoom = () => {
    setIsEditMode(false);
    setActionMenuRoom(null);
    setRoomModalVisible(true);
  };

  const handleOpenEditRoom = (room) => {
    setIsEditMode(true);
    setActionMenuRoom(room);
    setRoomModalVisible(true);
  };

  const handleRoomSubmit = async (formData) => {
    setActionLoading(true);
    try {
      const res = isEditMode
        ? await updateRoom(formData.room_id, formData)
        : await addRoom(formData);

      if (res && res.success) {
        setRoomModalVisible(false);
        await loadRooms();
      } else {
        showModal({
          type: 'error',
          title: 'Error',
          message: res?.message || 'Operation failed',
        });
      }
    } catch (e) {
      showModal({ type: 'error', title: 'Error', message: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Tenant Invitation
  const handleOpenSendInvitation = (room) => {
    setSelectedRoom(room);
    setTenantEmail('');
    setEmailError('');
    setSendModalVisible(true);
  };

  const handleSendCode = async () => {
    if (!tenantEmail.trim() || !tenantEmail.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setSending(true);
    try {
      const saveRes = await saveTenantInvitation(tenantEmail.trim(), selectedRoom.room_id);
      if (saveRes && !saveRes.success) {
        showModal({ type: 'error', title: 'Error', message: saveRes.message || 'Failed to save invitation' });
        setSending(false);
        return;
      }

      setSendModalVisible(false);
      setTenantEmail('');
      setSuccessCodeData({
        code: 'Sent securely via Email',
        room: selectedRoom.room_id,
        email: tenantEmail.trim(),
      });
      setCodeSuccessVisible(true);
      await loadRooms();
    } catch (err) {
      showModal({ type: 'error', title: 'Email Failed', message: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  // Generate Report
  const handleOpenReport = (room) => {
    setReportRoom(room);
    setReportModalVisible(true);
    getAvailableBillingCycles(room.room_id)
      .then((res) => {
        if (res && res.length > 0) {
          setAvailableCycles(res);
          setSelectedPdfCycle(res[0]);
        } else {
          setAvailableCycles([]);
          setSelectedPdfCycle(null);
        }
        setSelectedPdfWeek(null);
      })
      .catch((err) => console.error('Failed to fetch billing cycles:', err));
  };

  const handleGenerateReport = async () => {
    if (!reportRoom || !selectedPdfCycle) return;
    setGeneratingPdf(true);
    try {
      let startDate;
      let endDate;
      let reportTitle;

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
      showModal({ type: 'error', title: 'Error', message: 'Failed to generate report: ' + err.message });
    } finally {
      setGeneratingPdf(false);
    }
  };

  // View History
  const handleOpenHistory = (room) => {
    setHistoryRoomId(room.room_id);
    setHistoryModalVisible(true);
  };

  // Cash Payment
  const handleOpenCashPayment = (room) => {
    setCashRoom(room);
    setCashModalVisible(true);
    getAvailableBillingCycles(room.room_id).then((res) => {
      const unpaid = (res || []).filter((c) => c.payment_status === 'unpaid' || c.payment_status === 'overdue');
      setCashCycles(unpaid);
      if (unpaid.length > 0) setSelectedCashCycle(unpaid[0]);
      else setSelectedCashCycle(null);
    });
  };

  const handleCashPayment = async () => {
    if (!cashRoom || !selectedCashCycle) return;
    const amount = Number(selectedCashCycle.total_amount) || 0;
    setProcessingCash(true);
    try {
      const res = await submitOfflinePayment(selectedCashCycle.id, cashRoom.room_id, amount);
      if (res.success) {
        setCashModalVisible(false);
        setCashRoom(null);
        setCashCycles([]);
        setSelectedCashCycle(null);
        showModal({
          type: 'success',
          title: 'Payment Recorded',
          message: `Successfully marked ${cashRoom.room_id} cycle as paid in cash.`,
          onPrimaryPress: () => loadRooms(),
        });
      } else {
        showModal({ type: 'error', title: 'Payment Error', message: res.message || 'Failed to process offline payment.' });
      }
    } catch (err) {
      showModal({ type: 'error', title: 'Payment Error', message: err.message || JSON.stringify(err) });
    } finally {
      setProcessingCash(false);
    }
  };

  // Transfer Tenant
  const handleOpenTransfer = async (room) => {
    try {
      const vacant = await getVacantRooms();
      if (vacant && vacant.length > 0) {
        setVacantRoomsList(vacant);
        setTransferFromRoom(room);
        setTransferModalVisible(true);
      } else {
        showModal({ type: 'warning', title: 'No Vacant Rooms', message: 'There are no vacant rooms available for transfer.' });
      }
    } catch (err) {
      showModal({ type: 'error', title: 'Error', message: err.message || 'Failed to fetch vacant rooms' });
    }
  };

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
        icon: 'swap-horizontal',
      });
      setGeneralSuccessVisible(true);
      await loadRooms();
    } else {
      setGeneralSuccessData({
        title: 'Transfer Failed',
        message: result.message,
        icon: 'alert-circle',
      });
      setGeneralSuccessVisible(true);
    }
  };

  // Remove Tenant
  const handleOpenRevoke = (room) => {
    setRevokeRoom(room);
    setRevokeModalVisible(true);
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
      await loadRooms();
    } else {
      setGeneralSuccessData({
        title: 'Revoke Failed',
        message: result.message,
        icon: 'alert-circle',
      });
      setGeneralSuccessVisible(true);
    }
  };

  // Regenerate Access Code
  const handleOpenRegenCode = (room) => {
    setRegenRoom(room);
    setRegenConfirmVisible(true);
  };

  const handleConfirmRegenerate = async () => {
    if (!regenRoom) return;
    setRegenConfirmVisible(false);
    const result = await generateNewTenantCode(regenRoom.room_id);
    const newCode = result?.data?.tenant_code || result?.data?.code || '—';
    setRegenSuccessMsg(`Room: ${regenRoom.room_id}\nNew Code: ${newCode}`);
    setRegenSuccessVisible(true);
    await loadRooms();
  };

  // Reset to Vacant
  const handleResetToVacant = async (room) => {
    try {
      await updateRoomStatus(room.room_id, 'vacant', null, null);
      setGeneralSuccessData({
        title: 'Room Reset',
        message: `${room.room_id} is now officially vacant.`,
        icon: 'home-outline',
      });
      setGeneralSuccessVisible(true);
      await loadRooms();
    } catch (err) {
      showModal({ type: 'error', title: 'Error', message: err.message || 'Failed to update room status' });
    }
  };

  // Archive / Restore Room
  const handleOpenArchive = (room) => {
    if (room.status === 'occupied' || room.tenant_name) {
      return showModal({
        type: 'warning',
        title: 'Cannot Archive',
        message: 'Room currently has an active tenant.',
      });
    }
    setArchiveRoomObj(room);
    setIsRestoreMode(false);
    setArchiveModalVisible(true);
  };

  const handleOpenRestore = (room) => {
    setArchiveRoomObj(room);
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
        await loadRooms();
      } else {
        showModal({ type: 'error', title: 'Error', message: res?.message || 'Failed to update status' });
      }
    } catch (e) {
      showModal({ type: 'error', title: 'Error', message: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Header Component for FlatList (Sleek, Uncluttered, matches room-management.png)
  const renderListHeader = () => (
    <View style={s.listHeaderContainer}>
      {/* ── Screen Title: Room Management ── */}
      <View style={s.headerTitleWrap}>
        <Text style={s.headerTitle}>Room Management</Text>
      </View>

      {/* ── Inline Search & Add Row ── */}
      <View style={s.actionRow}>
        <View style={s.searchBarWrap}>
          <Ionicons name="search" size={18} color="#64748B" />
          <TextInput
            style={s.searchInput}
            placeholder="Search rooms..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={s.searchClearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={s.addBtn}
          onPress={handleOpenAddRoom}
          activeOpacity={0.8}
          accessibilityLabel="Add Room"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={s.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* ── Filter Tabs (Clean, Sleek, No nested badge clutter) ── */}
      <View style={s.filtersScroll}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filtersContent}
        >
          {[
            { key: 'All', label: 'All' },
            { key: 'Occupied', label: 'Occupied' },
            { key: 'Vacant', label: 'Vacant' },
            { key: 'Under Maintenance', label: 'Maintenance' },
            { key: 'Not Available', label: 'Unavailable' },
            { key: 'Archived', label: 'Archived' },
          ].map((tab) => {
            const isActive = filterActive === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[s.filterChipItem, isActive && s.filterChipItemActive]}
                onPress={() => setFilterActive(tab.key)}
                activeOpacity={0.75}
              >
                <Text style={[s.filterChipItemText, isActive && s.filterChipItemTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={s.errorBanner}>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={loadRooms} activeOpacity={0.8}>
            <Text style={s.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // 6. Empty State
  const renderEmptyState = () => {
    if (loading && (!rooms || rooms.length === 0)) {
      return (
        <View style={s.cardWrapper}>
          <View style={s.skeletonCard} />
          <View style={s.skeletonCard} />
        </View>
      );
    }

    const hasQuery = searchQuery.trim().length > 0;
    return (
      <View style={s.emptyContainer}>
        <View style={s.emptyIconWrap}>
          <Ionicons
            name={hasQuery ? 'search-outline' : 'home-outline'}
            size={36}
            color={COLORS.primary}
          />
        </View>
        <Text style={s.emptyTitle}>
          {hasQuery ? 'No matching rooms' : 'No rooms yet'}
        </Text>
        <Text style={s.emptyText}>
          {hasQuery
            ? `No rooms or tenants found matching "${searchQuery}".`
            : 'Add your first room to start managing your property.'}
        </Text>
        {!hasQuery && (
          <TouchableOpacity
            style={s.emptyAddBtn}
            onPress={handleOpenAddRoom}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={s.emptyAddBtnText}>Add Room</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#070C18" />

      <FlatList
        data={loading && (!rooms || rooms.length === 0) ? [] : filteredRooms}
        keyExtractor={(item) => String(item.room_id || item.id)}
        renderItem={({ item }) => (
          <View style={s.cardWrapper}>
            <RoomCard
              room={item}
              consumption={consumptionData[item.room_id]}
              onManage={handleOpenActionMenu}
              onMore={handleOpenActionMenu}
            />
          </View>
        )}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />

      {/* ── Room Action Menu Bottom Sheet ── */}
      <RoomActionMenuModal
        visible={actionMenuVisible}
        room={actionMenuRoom}
        onClose={() => setActionMenuVisible(false)}
        onGenerateReport={handleOpenReport}
        onViewHistory={handleOpenHistory}
        onLogCashPayment={handleOpenCashPayment}
        onTransferTenant={handleOpenTransfer}
        onRemoveTenant={handleOpenRevoke}
        onSendInvitation={handleOpenSendInvitation}
        onResetToVacant={handleResetToVacant}
        onRegenCode={handleOpenRegenCode}
        onArchiveRoom={handleOpenArchive}
        onRestoreRoom={handleOpenRestore}
        onEditRoom={handleOpenEditRoom}
      />

      {/* ── Add / Edit Room Modal ── */}
      <RoomFormModal
        visible={roomModalVisible}
        isEditMode={isEditMode}
        initialData={actionMenuRoom}
        defaultUtilityRate={rate}
        loading={actionLoading}
        onClose={() => setRoomModalVisible(false)}
        onSubmit={handleRoomSubmit}
      />

      {/* ── Archive / Restore Modal ── */}
      <ArchiveModal
        visible={archiveModalVisible}
        onClose={() => setArchiveModalVisible(false)}
        onConfirm={handleArchiveAction}
        roomName={archiveRoomObj?.room_id}
        isLoading={actionLoading}
        isRestore={isRestoreMode}
      />

      {/* ── Room History Modal ── */}
      <RoomHistoryModal
        visible={historyModalVisible}
        onClose={() => {
          setHistoryModalVisible(false);
          setHistoryRoomId(null);
        }}
        roomId={historyRoomId}
      />

      {/* ── Send Invitation Modal ── */}
      <Modal
        visible={sendModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSendModalVisible(false)}
      >
        <View style={s.overlay}>
          <View style={s.modal}>
            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              <View style={s.modalIcon}>
                <Ionicons name="mail" size={32} color={COLORS.primary} />
              </View>
              <Text style={s.modalTitle}>Send Invitation</Text>
              <Text style={s.modalDesc}>
                Enter the tenant&apos;s email. They will receive a secure access code for{' '}
                <Text style={s.modalRoom}>{selectedRoom?.room_id}</Text>.
              </Text>

              <View style={[s.emailWrap, emailError && s.emailWrapErr]}>
                <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} />
                <TextInput
                  style={s.emailInput}
                  placeholder="tenant@email.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={tenantEmail}
                  onChangeText={(t) => {
                    setTenantEmail(t);
                    setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                />
              </View>
              {emailError ? <Text style={s.emailError}>{emailError}</Text> : null}

              <View style={s.timerNote}>
                <Ionicons name="time-outline" size={14} color={COLORS.warning} />
                <Text style={s.timerNoteText}>Access code will expire 24 hrs after sending</Text>
              </View>

              <View style={[s.timerNote, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)', marginTop: 8 }]}>
                <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.danger} />
                <Text style={[s.timerNoteText, { color: COLORS.danger }]}>
                  For security reasons, access codes are only visible in email and are not shown inside the app.
                </Text>
              </View>

              <View style={s.modalActions}>
                <TouchableOpacity
                  style={s.cancelBtn}
                  onPress={() => {
                    setSendModalVisible(false);
                    setTenantEmail('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.sendBtnWrap}
                  onPress={handleSendCode}
                  disabled={sending}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={GRADIENTS.primary} style={s.sendBtn}>
                    {sending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="send" size={16} color="#fff" />
                        <Text style={s.sendText}>Send Invitation</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Generate Report Modal ── */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setReportModalVisible(false)}
      >
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
                <TouchableOpacity
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
                  onPress={() => setShowPdfCycleDrop(!showPdfCycleDrop)}
                >
                  <Text style={{ color: COLORS.textPrimary }}>
                    {selectedPdfCycle ? `${new Date(selectedPdfCycle.cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(selectedPdfCycle.cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}` : (availableCycles.length === 0 ? 'No data' : 'Loading...')}
                  </Text>
                  <Ionicons name={showPdfCycleDrop ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.primary} />
                </TouchableOpacity>

                {showPdfCycleDrop && availableCycles.length > 0 && (
                  <View style={{ backgroundColor: 'rgba(30,41,59,0.95)', borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', maxHeight: 150, overflow: 'hidden' }}>
                    <ScrollView nestedScrollEnabled>
                      {availableCycles.map((c, i) => (
                        <TouchableOpacity
                          key={i}
                          style={{ padding: 14, borderBottomWidth: i !== availableCycles.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                          onPress={() => {
                            setSelectedPdfCycle(c);
                            setSelectedPdfWeek(null);
                            setShowPdfCycleDrop(false);
                          }}
                        >
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
                    <TouchableOpacity
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
                      onPress={() => setShowPdfWeekDrop(!showPdfWeekDrop)}
                    >
                      <Text style={{ color: COLORS.textPrimary }}>
                        {selectedPdfWeek ? `${selectedPdfWeek.label} (${new Date(selectedPdfWeek.start).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(selectedPdfWeek.end).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })})` : 'Entire Billing Cycle'}
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
                          <TouchableOpacity
                            style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                            onPress={() => {
                              setSelectedPdfWeek(null);
                              setShowPdfWeekDrop(false);
                            }}
                          >
                            <Text style={{ color: !selectedPdfWeek ? COLORS.primary : COLORS.textPrimary, fontWeight: !selectedPdfWeek ? 'bold' : 'normal' }}>
                              Entire Billing Cycle
                            </Text>
                          </TouchableOpacity>
                          {weeks.map((week, i) => (
                            <TouchableOpacity
                              key={i}
                              style={{ padding: 14, borderBottomWidth: i !== weeks.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                              onPress={() => {
                                setSelectedPdfWeek(week);
                                setShowPdfWeekDrop(false);
                              }}
                            >
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
              <TouchableOpacity
                style={s.sendBtnWrap}
                onPress={handleGenerateReport}
                disabled={generatingPdf || !selectedPdfCycle}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#3B82F6', '#2563EB']} style={s.sendBtn}>
                  {generatingPdf ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="download-outline" size={16} color="#fff" />
                      <Text style={s.sendText}>Generate PDF</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Cash Payment Modal ── */}
      <Modal
        visible={cashModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setCashModalVisible(false)}
      >
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
                  <Text style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', marginTop: 10 }}>
                    No unpaid billing cycles found.
                  </Text>
                ) : (
                  <>
                    <Text style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 8, textAlign: 'left' }}>Select Unpaid Cycle</Text>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}
                      onPress={() => setShowCashCycleDrop(!showCashCycleDrop)}
                    >
                      <Text style={{ color: COLORS.textPrimary }}>
                        {selectedCashCycle
                          ? `${new Date(selectedCashCycle.cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(selectedCashCycle.cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })} (₱${Number(selectedCashCycle.total_amount).toFixed(2)})`
                          : 'Select a cycle...'}
                      </Text>
                      <Ionicons name={showCashCycleDrop ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.success} />
                    </TouchableOpacity>

                    {showCashCycleDrop && (
                      <View style={{ backgroundColor: 'rgba(30,41,59,0.95)', borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', maxHeight: 150, overflow: 'hidden' }}>
                        <ScrollView nestedScrollEnabled>
                          {cashCycles.map((c, i) => (
                            <TouchableOpacity
                              key={i}
                              style={{ padding: 14, borderBottomWidth: i !== cashCycles.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                              onPress={() => {
                                setSelectedCashCycle(c);
                                setShowCashCycleDrop(false);
                              }}
                            >
                              <Text style={{ color: selectedCashCycle?.id === c.id ? COLORS.success : COLORS.textPrimary, fontWeight: selectedCashCycle?.id === c.id ? 'bold' : 'normal' }}>
                                {new Date(c.cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric' })} – {new Date(c.cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                                <Text style={{ color: COLORS.textMuted }}>| ₱{Number(c.total_amount).toFixed(2)}</Text>
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
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => {
                  setCashModalVisible(false);
                  setCashCycles([]);
                  setSelectedCashCycle(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.sendBtnWrap}
                onPress={handleCashPayment}
                disabled={processingCash || !selectedCashCycle}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#10B981', '#059669']} style={s.sendBtn}>
                  {processingCash ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                      <Text style={s.sendText}>Confirm Paid</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Transfer Modal ── */}
      <Modal
        visible={transferModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setTransferModalVisible(false)}
      >
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

            <Text style={[s.formFieldLabel, { marginBottom: 8, marginTop: 4 }]}>SELECT DESTINATION ROOM</Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {vacantRoomsList.map((vRoom) => (
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

            <TouchableOpacity
              style={[s.cancelBtn, { marginTop: 16 }]}
              onPress={() => setTransferModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Revoke Confirmation Modal ── */}
      <Modal
        visible={revokeModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setRevokeModalVisible(false)}
      >
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
              Remove &quot;{revokeRoom?.tenant_name}&quot; from {revokeRoom?.room_id}?
            </Text>

            <View style={s.revokeInfoBox}>
              <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.primary} />
              <Text style={s.revokeInfoText}>
                All consumption and billing history{'\n'}will be preserved.
              </Text>
            </View>

            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.cancelBtnOutline}
                onPress={() => setRevokeModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={s.cancelTextGreen}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.removeBtnSolid}
                onPress={handleConfirmRevoke}
                activeOpacity={0.8}
              >
                <Text style={s.removeTextWhite}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Revoke Success Modal ── */}
      <Modal
        visible={revokeSuccessVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setRevokeSuccessVisible(false)}
      >
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
              <TouchableOpacity
                style={[s.successOkBtn, { backgroundColor: COLORS.danger }]}
                onPress={() => setRevokeSuccessVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={s.successOkBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Regenerate Confirmation Modal ── */}
      <Modal
        visible={regenConfirmVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setRegenConfirmVisible(false)}
      >
        <View style={s.overlay}>
          <View style={s.successModal}>
            <ScrollView style={s.successScroll} contentContainerStyle={s.successScrollContent} showsVerticalScrollIndicator={false}>
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
                <TouchableOpacity
                  style={[s.cancelBtn, { flex: 1, marginTop: 0 }]}
                  onPress={() => setRegenConfirmVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.successOkBtn, { flex: 1, backgroundColor: COLORS.warning }]}
                  onPress={handleConfirmRegenerate}
                  activeOpacity={0.8}
                >
                  <Text style={s.successOkBtnText}>Reset Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Regenerate Success Modal ── */}
      <Modal
        visible={regenSuccessVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setRegenSuccessVisible(false)}
      >
        <View style={s.overlay}>
          <View style={s.successModal}>
            <ScrollView style={s.successScroll} contentContainerStyle={s.successScrollContent} showsVerticalScrollIndicator={false}>
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
              <TouchableOpacity
                style={s.successOkBtn}
                onPress={() => setRegenSuccessVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={s.successOkBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Code Sent Success Modal ── */}
      <Modal
        visible={codeSuccessVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setCodeSuccessVisible(false)}
      >
        <View style={s.overlay}>
          <View style={s.successModal}>
            <ScrollView style={s.successScroll} contentContainerStyle={s.successScrollContent} showsVerticalScrollIndicator={false}>
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
                <Text style={[s.modalDesc, { color: COLORS.textPrimary, fontWeight: 'bold', marginBottom: 0 }]}>
                  {successCodeData.room}
                </Text>
              </View>

              <View style={s.successDetails}>
                <View style={s.detailRow}>
                  <Ionicons name="time-outline" size={18} color={COLORS.warning} />
                  <Text style={s.detailText}>
                    Code expires in <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>24 hours</Text>.
                  </Text>
                </View>
                <View style={s.detailRow}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.danger} />
                  <Text style={s.detailText}>For security reasons, access codes are only accessible via email.</Text>
                </View>
              </View>
            </ScrollView>

            <View style={s.successFooter}>
              <TouchableOpacity
                style={s.successOkBtn}
                onPress={() => setCodeSuccessVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={s.successOkBtnText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── General Success Modal (Reset, etc.) ── */}
      <Modal
        visible={generalSuccessVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setGeneralSuccessVisible(false)}
      >
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
              <TouchableOpacity
                style={s.successOkBtn}
                onPress={() => setGeneralSuccessVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={s.successOkBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}