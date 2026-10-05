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
  TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
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
import { CopilotStep, walkthroughable } from 'react-native-copilot';
import { useTourAutoStart } from '@/contexts/TourContext';
import { COLORS, GRADIENTS } from '@/styles/theme';
import s from '@/styles/landlord/rooms.styles';

const CopilotView = walkthroughable(View);

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

  const flatListRef = useRef(null);
  useTourAutoStart('rooms', !loading, flatListRef, 'landlord');

  // Action Menu Bottom Sheet
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [actionMenuRoom, setActionMenuRoom] = useState(null);

  // Add / Edit Room Modal
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formRoom, setFormRoom] = useState(null);
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

  // ── Universal Modal State Cleanup ──
  const resetAllActionModals = useCallback(() => {
    // Action Menu Bottom Sheet
    setActionMenuVisible(false);
    setActionMenuRoom(null);

    // Add / Edit Room Modal
    setRoomModalVisible(false);
    setIsEditMode(false);
    setFormRoom(null);
    setActionLoading(false);

    // Generate Report Modal
    setReportModalVisible(false);
    setReportRoom(null);
    setSelectedPdfCycle(null);
    setSelectedPdfWeek(null);
    setShowPdfCycleDrop(false);
    setShowPdfWeekDrop(false);
    setAvailableCycles([]);
    setGeneratingPdf(false);

    // History Modal
    setHistoryModalVisible(false);
    setHistoryRoomId(null);

    // Log Cash Payment Modal
    setCashModalVisible(false);
    setCashRoom(null);
    setSelectedCashCycle(null);
    setCashCycles([]);
    setShowCashCycleDrop(false);
    setProcessingCash(false);

    // Transfer Modal
    setTransferModalVisible(false);
    setTransferFromRoom(null);
    setVacantRoomsList([]);

    // Tenant Invitation Modal
    setSendModalVisible(false);
    setSelectedRoom(null);
    setTenantEmail('');
    setEmailError('');
    setSending(false);

    // Revoke Modals
    setRevokeModalVisible(false);
    setRevokeRoom(null);

    // Regenerate Access Code Modals
    setRegenConfirmVisible(false);
    setRegenRoom(null);

    // Archive / Restore Modal
    setArchiveModalVisible(false);
    setArchiveRoomObj(null);
    setIsRestoreMode(false);
  }, []);

  // Screen Blur / Navigate Away Lifecycle Teardown
  useFocusEffect(
    useCallback(() => {
      return () => {
        resetAllActionModals();
      };
    }, [resetAllActionModals])
  );

  // ── Dedicated Close Handlers ──
  const handleCloseActionMenu = useCallback(() => {
    setActionMenuVisible(false);
    setActionMenuRoom(null);
  }, []);

  const handleCloseReport = useCallback(() => {
    setReportModalVisible(false);
    setReportRoom(null);
    setSelectedPdfCycle(null);
    setSelectedPdfWeek(null);
    setShowPdfCycleDrop(false);
    setShowPdfWeekDrop(false);
    setAvailableCycles([]);
    setGeneratingPdf(false);
    setActionMenuVisible(false);
    setActionMenuRoom(null);
  }, []);

  const handleCloseHistory = useCallback(() => {
    setHistoryModalVisible(false);
    setHistoryRoomId(null);
    setActionMenuVisible(false);
    setActionMenuRoom(null);
  }, []);

  const handleCloseCashPayment = useCallback(() => {
    setCashModalVisible(false);
    setCashRoom(null);
    setSelectedCashCycle(null);
    setCashCycles([]);
    setShowCashCycleDrop(false);
    setProcessingCash(false);
    setActionMenuVisible(false);
    setActionMenuRoom(null);
  }, []);

  const handleCloseTransfer = useCallback(() => {
    setTransferModalVisible(false);
    setTransferFromRoom(null);
    setVacantRoomsList([]);
    setActionMenuVisible(false);
    setActionMenuRoom(null);
  }, []);

  const handleCloseRoomForm = useCallback(() => {
    setRoomModalVisible(false);
    setIsEditMode(false);
    setFormRoom(null);
    setActionLoading(false);
    setActionMenuVisible(false);
    setActionMenuRoom(null);
  }, []);

  const handleCloseSendInvitation = useCallback(() => {
    setSendModalVisible(false);
    setSelectedRoom(null);
    setTenantEmail('');
    setEmailError('');
    setSending(false);
    setActionMenuVisible(false);
    setActionMenuRoom(null);
  }, []);

  const handleCloseRevoke = useCallback(() => {
    setRevokeModalVisible(false);
    setRevokeRoom(null);
    setActionMenuVisible(false);
    setActionMenuRoom(null);
  }, []);

  const handleCloseRegenCode = useCallback(() => {
    setRegenConfirmVisible(false);
    setRegenRoom(null);
    setActionMenuVisible(false);
    setActionMenuRoom(null);
  }, []);

  const handleCloseArchive = useCallback(() => {
    setArchiveModalVisible(false);
    setArchiveRoomObj(null);
    setIsRestoreMode(false);
    setActionLoading(false);
    setActionMenuVisible(false);
    setActionMenuRoom(null);
  }, []);

  // 4. Action Menu Handlers
  const handleOpenActionMenu = (room) => {
    resetAllActionModals();
    setActionMenuRoom(room);
    setActionMenuVisible(true);
  };

  // Add / Edit Room
  const handleOpenAddRoom = () => {
    resetAllActionModals();
    setIsEditMode(false);
    setFormRoom(null);
    setRoomModalVisible(true);
  };

  const handleOpenEditRoom = (room) => {
    setActionMenuVisible(false);
    setActionMenuRoom(null);
    setIsEditMode(true);
    setFormRoom(room);
    setRoomModalVisible(true);
  };

  const handleRoomSubmit = async (formData) => {
    setActionLoading(true);
    try {
      const res = isEditMode
        ? await updateRoom(formData.room_id, formData)
        : await addRoom(formData);

      if (res && res.success) {
        handleCloseRoomForm();
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
    setActionMenuVisible(false);
    setActionMenuRoom(null);
    setSelectedRoom(room);
    setTenantEmail('');
    setEmailError('');
    setSending(false);
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

      const sentRoomId = selectedRoom.room_id;
      const sentEmail = tenantEmail.trim();
      handleCloseSendInvitation();
      setSuccessCodeData({
        code: 'Sent securely via Email',
        room: sentRoomId,
        email: sentEmail,
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
    setActionMenuVisible(false);
    setActionMenuRoom(null);
    setReportRoom(room);
    setSelectedPdfCycle(null);
    setSelectedPdfWeek(null);
    setShowPdfCycleDrop(false);
    setShowPdfWeekDrop(false);
    setGeneratingPdf(false);
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

      handleCloseReport();
      await shareReport(result.uri);
    } catch (err) {
      showModal({ type: 'error', title: 'Error', message: 'Failed to generate report: ' + err.message });
    } finally {
      setGeneratingPdf(false);
    }
  };

  // View History
  const handleOpenHistory = (room) => {
    setActionMenuVisible(false);
    setActionMenuRoom(null);
    setHistoryRoomId(room.room_id);
    setHistoryModalVisible(true);
  };

  // Cash Payment
  const handleOpenCashPayment = (room) => {
    setActionMenuVisible(false);
    setActionMenuRoom(null);
    setCashRoom(room);
    setSelectedCashCycle(null);
    setShowCashCycleDrop(false);
    setProcessingCash(false);
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
    const paidRoomId = cashRoom.room_id;
    setProcessingCash(true);
    try {
      const res = await submitOfflinePayment(selectedCashCycle.id, cashRoom.room_id, amount);
      if (res.success) {
        handleCloseCashPayment();
        showModal({
          type: 'success',
          title: 'Payment Recorded',
          message: `Successfully marked ${paidRoomId} cycle as paid in cash.`,
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
    setActionMenuVisible(false);
    setActionMenuRoom(null);
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
    handleCloseTransfer();
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
    setActionMenuVisible(false);
    setActionMenuRoom(null);
    setRevokeRoom(room);
    setRevokeModalVisible(true);
  };

  const handleConfirmRevoke = async () => {
    if (!revokeRoom) return;
    const targetRoomId = revokeRoom.room_id;
    setSending(true);
    const result = await revokeTenant(targetRoomId);
    setSending(false);
    handleCloseRevoke();
    if (result.success) {
      setRevokeSuccessMsg(`Removed "${result.tenantName}"\nfrom ${targetRoomId}`);
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
    setActionMenuVisible(false);
    setActionMenuRoom(null);
    setRegenRoom(room);
    setRegenConfirmVisible(true);
  };

  const handleConfirmRegenerate = async () => {
    if (!regenRoom) return;
    const targetRoomId = regenRoom.room_id;
    handleCloseRegenCode();
    const result = await generateNewTenantCode(targetRoomId);
    const newCode = result?.data?.tenant_code || result?.data?.code || '—';
    setRegenSuccessMsg(`Room: ${targetRoomId}\nNew Code: ${newCode}`);
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
    setActionMenuVisible(false);
    setActionMenuRoom(null);
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
    setActionMenuVisible(false);
    setActionMenuRoom(null);
    setArchiveRoomObj(room);
    setIsRestoreMode(true);
    setArchiveModalVisible(true);
  };

  const handleArchiveAction = async () => {
    if (!archiveRoomObj) return;
    setActionLoading(true);
    try {
      const fn = isRestoreMode ? restoreRoom : archiveRoom;
      const res = await fn(archiveRoomObj.room_id);
      if (res && res.success) {
        handleCloseArchive();
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

  // 5. Memoized Key Extractor & Render Item
  const keyExtractor = useCallback((item) => String(item.room_id || item.id), []);

  const renderItem = useCallback(({ item, index }) => (
    index === 0 ? (
      <CopilotStep
        text="View room power usage, manage tenants, send invitation access codes, or export monthly room PDF reports."
        order={6}
        name="landlord_room_card"
      >
        <CopilotView style={s.cardWrapper}>
          <RoomCard
            room={item}
            consumption={consumptionData[item.room_id]}
            onManage={handleOpenActionMenu}
            onMore={handleOpenActionMenu}
          />
        </CopilotView>
      </CopilotStep>
    ) : (
      <View style={s.cardWrapper}>
        <RoomCard
          room={item}
          consumption={consumptionData[item.room_id]}
          onManage={handleOpenActionMenu}
          onMore={handleOpenActionMenu}
        />
      </View>
    )
  ), [consumptionData, handleOpenActionMenu]);

  // 6. Empty State
  const renderEmptyState = useCallback(() => {
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
  }, [loading, rooms, searchQuery, handleOpenAddRoom]);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#070C18" />

      {/* ── Screen Title & Filter/Action Bar (Stably mounted above list) ── */}
      <View style={s.listHeaderContainer}>
        {/* Screen Title: Room Management */}
        <View style={s.headerTitleWrap}>
          <Text style={s.headerTitle}>Room Management</Text>
        </View>

        {/* Inline Search & Add Row and Filter Tabs (Step 5) */}
        <CopilotStep
          text="Search units, filter by status (Occupied, Vacant, Maintenance), or tap Add to create a new room."
          order={5}
          name="landlord_rooms_header"
        >
          <CopilotView style={{ width: '100%' }}>
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
                <Ionicons name="add" size={16} color="#042F2E" />
                <Text style={s.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
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
          </CopilotView>
        </CopilotStep>

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

      <FlatList
        ref={flatListRef}
        style={{ flex: 1 }}
        data={loading && (!rooms || rooms.length === 0) ? [] : filteredRooms}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
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
        onClose={handleCloseActionMenu}
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
        initialData={formRoom}
        defaultUtilityRate={rate}
        loading={actionLoading}
        onClose={handleCloseRoomForm}
        onSubmit={handleRoomSubmit}
      />

      {/* ── Archive / Restore Modal ── */}
      <ArchiveModal
        visible={archiveModalVisible}
        onClose={handleCloseArchive}
        onConfirm={handleArchiveAction}
        roomName={archiveRoomObj?.room_id}
        isLoading={actionLoading}
        isRestore={isRestoreMode}
      />

      {/* ── Room History Modal ── */}
      <RoomHistoryModal
        visible={historyModalVisible}
        onClose={handleCloseHistory}
        roomId={historyRoomId}
      />

      {/* ── Send Invitation Modal ── */}
      <Modal
        visible={sendModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCloseSendInvitation}
      >
        <TouchableWithoutFeedback onPress={handleCloseSendInvitation}>
          <View style={s.overlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation?.()}>
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
                      onPress={handleCloseSendInvitation}
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
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Generate Report Modal (SaaS Redesign) ── */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCloseReport}
      >
        <TouchableWithoutFeedback onPress={handleCloseReport}>
          <View style={s.bottomSheetOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation?.()}>
              <View style={s.saasModalCard}>
                {/* Header */}
                <View style={s.saasModalHeaderRow}>
                  <View style={s.saasModalHeaderLeft}>
                    <View style={[s.saasModalIconBadge, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                      <Ionicons name="document-text" size={17} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.saasModalTitle} numberOfLines={1}>Generate Report</Text>
                      <Text style={s.saasModalSubtitle} numberOfLines={1}>
                        {reportRoom?.room_id} • {reportRoom?.tenant_name || 'Active Tenant'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={s.saasModalCloseBtn}
                    onPress={handleCloseReport}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                  >
                    <Ionicons name="close" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

            <View style={s.saasModalDivider} />

            {/* Content Body */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              <View style={s.saasInfoBanner}>
                <Ionicons name="information-circle-outline" size={15} color="#38BDF8" />
                <Text style={s.saasInfoBannerText}>
                  Export official energy breakdown and billing summary as an audit-ready PDF.
                </Text>
              </View>

              {reportRoom && (
                <View style={{ width: '100%', marginBottom: 12 }}>
                  <Text style={s.saasModalFieldLabel}>SELECT BILLING CYCLE</Text>
                  <TouchableOpacity
                    style={s.saasDropdownTrigger}
                    onPress={() => setShowPdfCycleDrop(!showPdfCycleDrop)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="calendar-outline" size={15} color="#3B82F6" style={{ marginRight: 8 }} />
                    <Text style={s.saasDropdownTriggerText} numberOfLines={1}>
                      {selectedPdfCycle 
                        ? `${new Date(selectedPdfCycle.cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(selectedPdfCycle.cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}` 
                        : (availableCycles.length === 0 ? 'No billing data found' : 'Select cycle...')}
                    </Text>
                    <Ionicons name={showPdfCycleDrop ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
                  </TouchableOpacity>

                  {showPdfCycleDrop && availableCycles.length > 0 && (
                    <View style={s.saasDropdownMenu}>
                      <ScrollView nestedScrollEnabled style={{ maxHeight: 130 }}>
                        {availableCycles.map((c, i) => {
                          const isSel = selectedPdfCycle?.id === c.id;
                          return (
                            <TouchableOpacity
                              key={i}
                              style={s.saasDropdownItem}
                              onPress={() => {
                                setSelectedPdfCycle(c);
                                setSelectedPdfWeek(null);
                                setShowPdfCycleDrop(false);
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={[s.saasDropdownItemText, isSel && s.saasDropdownItemTextActive]}>
                                {new Date(c.cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric' })} – {new Date(c.cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </Text>
                              {isSel && <Ionicons name="checkmark" size={15} color="#10B981" />}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  {selectedPdfCycle && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={s.saasModalFieldLabel}>TIME RANGE / BREAKDOWN</Text>
                      <TouchableOpacity
                        style={s.saasDropdownTrigger}
                        onPress={() => setShowPdfWeekDrop(!showPdfWeekDrop)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="time-outline" size={15} color="#64748B" style={{ marginRight: 8 }} />
                        <Text style={s.saasDropdownTriggerText} numberOfLines={1}>
                          {selectedPdfWeek ? `${selectedPdfWeek.label} (${new Date(selectedPdfWeek.start).toLocaleDateString('default', { month: 'short', day: 'numeric' })} – ${new Date(selectedPdfWeek.end).toLocaleDateString('default', { month: 'short', day: 'numeric' })})` : 'Entire Billing Cycle (Default)'}
                        </Text>
                        <Ionicons name={showPdfWeekDrop ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
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
                          <View style={s.saasDropdownMenu}>
                            <ScrollView nestedScrollEnabled style={{ maxHeight: 130 }}>
                              <TouchableOpacity
                                style={s.saasDropdownItem}
                                onPress={() => {
                                  setSelectedPdfWeek(null);
                                  setShowPdfWeekDrop(false);
                                }}
                                activeOpacity={0.7}
                              >
                                <Text style={[s.saasDropdownItemText, !selectedPdfWeek && s.saasDropdownItemTextActive]}>
                                  Entire Billing Cycle
                                </Text>
                                {!selectedPdfWeek && <Ionicons name="checkmark" size={15} color="#10B981" />}
                              </TouchableOpacity>
                              {weeks.map((week, i) => {
                                const isSel = selectedPdfWeek?.label === week.label;
                                return (
                                  <TouchableOpacity
                                    key={i}
                                    style={s.saasDropdownItem}
                                    onPress={() => {
                                      setSelectedPdfWeek(week);
                                      setShowPdfWeekDrop(false);
                                    }}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={[s.saasDropdownItemText, isSel && s.saasDropdownItemTextActive]}>
                                      {week.label} ({week.start.toLocaleDateString('default', { month: 'short', day: 'numeric' })} – {week.end.toLocaleDateString('default', { month: 'short', day: 'numeric' })})
                                    </Text>
                                    {isSel && <Ionicons name="checkmark" size={15} color="#10B981" />}
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          </View>
                        );
                      })()}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View style={s.saasActionRow}>
              <TouchableOpacity 
                style={s.saasBtnSecondary} 
                onPress={handleCloseReport} 
                activeOpacity={0.75}
              >
                <Text style={s.saasBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saasBtnPrimary, { backgroundColor: '#3B82F6' }, (generatingPdf || !selectedPdfCycle) && { opacity: 0.6 }]}
                onPress={handleGenerateReport}
                disabled={generatingPdf || !selectedPdfCycle}
                activeOpacity={0.8}
              >
                {generatingPdf ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={15} color="#FFFFFF" />
                    <Text style={s.saasBtnPrimaryText}>Generate PDF</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>

      {/* ── Cash Payment Modal (SaaS Redesign) ── */}
      <Modal
        visible={cashModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCloseCashPayment}
      >
        <TouchableWithoutFeedback onPress={handleCloseCashPayment}>
          <View style={s.bottomSheetOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation?.()}>
              <View style={s.saasModalCard}>
                {/* Header */}
                <View style={s.saasModalHeaderRow}>
                  <View style={s.saasModalHeaderLeft}>
                    <View style={[s.saasModalIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                      <Ionicons name="card" size={17} color="#10B981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.saasModalTitle} numberOfLines={1}>Log Cash Payment</Text>
                      <Text style={[s.saasModalSubtitle, { color: '#10B981' }]} numberOfLines={1}>
                        {cashRoom?.room_id} • {cashRoom?.tenant_name || 'Active Tenant'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={s.saasModalCloseBtn}
                    onPress={handleCloseCashPayment}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                  >
                    <Ionicons name="close" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

            <View style={s.saasModalDivider} />

            {/* Content Body */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              <View style={s.saasInfoBanner}>
                <Ionicons name="information-circle-outline" size={15} color="#10B981" />
                <Text style={s.saasInfoBannerText}>
                  Record an offline cash receipt and mark the tenant's cycle as settled.
                </Text>
              </View>

              {cashRoom && cashCycles && (
                <View style={{ width: '100%', marginBottom: 12 }}>
                  {cashCycles.length === 0 ? (
                    <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                      <Ionicons name="checkmark-done-circle" size={32} color="#10B981" style={{ marginBottom: 6 }} />
                      <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '700' }}>No Unpaid Cycles</Text>
                      <Text style={{ color: '#64748B', fontSize: 11.5, textAlign: 'center', marginTop: 2 }}>
                        All billing statements for this room are fully paid.
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Text style={s.saasModalFieldLabel}>SELECT UNPAID CYCLE</Text>
                      <TouchableOpacity
                        style={s.saasDropdownTrigger}
                        onPress={() => setShowCashCycleDrop(!showCashCycleDrop)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="receipt-outline" size={15} color="#10B981" style={{ marginRight: 8 }} />
                        <Text style={s.saasDropdownTriggerText} numberOfLines={1}>
                          {selectedCashCycle
                            ? `${new Date(selectedCashCycle.cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric' })} – ${new Date(selectedCashCycle.cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`
                            : 'Select unpaid statement...'}
                        </Text>
                        <Ionicons name={showCashCycleDrop ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
                      </TouchableOpacity>

                      {showCashCycleDrop && (
                        <View style={s.saasDropdownMenu}>
                          <ScrollView nestedScrollEnabled style={{ maxHeight: 130 }}>
                            {cashCycles.map((c, i) => {
                              const isSel = selectedCashCycle?.id === c.id;
                              return (
                                <TouchableOpacity
                                  key={i}
                                  style={s.saasDropdownItem}
                                  onPress={() => {
                                    setSelectedCashCycle(c);
                                    setShowCashCycleDrop(false);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <Text style={[s.saasDropdownItemText, isSel && s.saasDropdownItemTextActive]}>
                                    {new Date(c.cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric' })} – {new Date(c.cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </Text>
                                  <Text style={{ fontSize: 12, fontWeight: '700', color: isSel ? '#10B981' : '#E2E8F0' }}>
                                    ₱{Number(c.total_amount).toFixed(2)}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                      )}

                      {/* Payment Summary Box */}
                      {selectedCashCycle && (
                        <View style={s.saasPaymentCard}>
                          <View style={s.saasPaymentRow}>
                            <Text style={s.saasPaymentLabel}>Billing Period</Text>
                            <Text style={s.saasPaymentValue}>
                              {new Date(selectedCashCycle.cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric' })} – {new Date(selectedCashCycle.cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                          </View>
                          <View style={s.saasPaymentRow}>
                            <Text style={s.saasPaymentLabel}>Method</Text>
                            <Text style={s.saasPaymentValue}>Cash In-Hand</Text>
                          </View>
                          <View style={[s.saasPaymentRow, { marginTop: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.06)' }]}>
                            <Text style={s.saasPaymentTotalLabel}>Total Amount Due</Text>
                            <Text style={s.saasPaymentTotalValue}>₱{Number(selectedCashCycle.total_amount).toFixed(2)}</Text>
                          </View>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View style={s.saasActionRow}>
              <TouchableOpacity
                style={s.saasBtnSecondary}
                onPress={handleCloseCashPayment}
                activeOpacity={0.75}
              >
                <Text style={s.saasBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saasBtnPrimary, { backgroundColor: '#10B981' }, (processingCash || !selectedCashCycle) && { opacity: 0.6 }]}
                onPress={handleCashPayment}
                disabled={processingCash || !selectedCashCycle}
                activeOpacity={0.8}
              >
                {processingCash ? (
                  <ActivityIndicator color="#042F2E" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#042F2E" />
                    <Text style={[s.saasBtnPrimaryText, { color: '#042F2E' }]}>Confirm Paid</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>

      {/* ── Transfer Modal (SaaS Redesign) ── */}
      <Modal
        visible={transferModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCloseTransfer}
      >
        <TouchableWithoutFeedback onPress={handleCloseTransfer}>
          <View style={s.bottomSheetOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation?.()}>
              <View style={s.saasModalCard}>
                {/* Header */}
                <View style={s.saasModalHeaderRow}>
                  <View style={s.saasModalHeaderLeft}>
                    <View style={[s.saasModalIconBadge, { backgroundColor: 'rgba(20, 184, 166, 0.12)' }]}>
                      <Ionicons name="swap-horizontal" size={17} color="#14B8A6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.saasModalTitle} numberOfLines={1}>Transfer Tenant</Text>
                      <Text style={[s.saasModalSubtitle, { color: '#14B8A6' }]} numberOfLines={1}>
                        {transferFromRoom?.tenant_name || 'Tenant'} • From {transferFromRoom?.room_id}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={s.saasModalCloseBtn}
                    onPress={handleCloseTransfer}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                  >
                    <Ionicons name="close" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <View style={s.saasModalDivider} />

                {/* Content Body */}
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
                  <View style={s.saasInfoBanner}>
                    <Ionicons name="information-circle-outline" size={15} color="#14B8A6" />
                    <Text style={s.saasInfoBannerText}>
                      Moving {transferFromRoom?.tenant_name} to a new unit. Prior consumption data remains securely archived in {transferFromRoom?.room_id}.
                    </Text>
                  </View>

                  <Text style={s.saasModalFieldLabel}>SELECT DESTINATION ROOM</Text>
                  {vacantRoomsList.length === 0 ? (
                    <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                      <Ionicons name="alert-circle-outline" size={30} color="#F59E0B" style={{ marginBottom: 6 }} />
                      <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '700' }}>No Vacant Rooms</Text>
                      <Text style={{ color: '#64748B', fontSize: 11.5, textAlign: 'center', marginTop: 2 }}>
                        There are currently no vacant units available for tenant transfer.
                      </Text>
                    </View>
                  ) : (
                    <View style={{ marginTop: 2 }}>
                      {vacantRoomsList.map((vRoom) => (
                        <TouchableOpacity
                          key={vRoom.room_id}
                          style={s.saasTransferItem}
                          activeOpacity={0.7}
                          onPress={() => handleTransfer(vRoom.room_id)}
                        >
                          <View style={s.saasTransferItemLeft}>
                            <View style={s.saasTransferItemIcon}>
                              <Ionicons name="home-outline" size={15} color="#94A3B8" />
                            </View>
                            <View>
                              <Text style={s.saasTransferItemTitle}>{vRoom.room_id}</Text>
                              <Text style={s.saasTransferItemSubtitle}>
                                {vRoom.room_name || vRoom.room_type || 'Vacant Unit'}
                              </Text>
                            </View>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981' }}>Select</Text>
                            <Ionicons name="arrow-forward" size={14} color="#10B981" />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </ScrollView>

                {/* Actions */}
                <View style={s.saasActionRow}>
                  <TouchableOpacity
                    style={[s.saasBtnSecondary, { width: '100%' }]}
                    onPress={handleCloseTransfer}
                    activeOpacity={0.75}
                  >
                    <Text style={s.saasBtnSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Revoke Confirmation Modal ── */}
      <Modal
        visible={revokeModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCloseRevoke}
      >
        <TouchableWithoutFeedback onPress={handleCloseRevoke}>
          <View style={s.overlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation?.()}>
              <View style={s.modal}>
                <TouchableOpacity style={s.closeModalBtn} onPress={handleCloseRevoke}>
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
                    onPress={handleCloseRevoke}
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
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
        onRequestClose={handleCloseRegenCode}
      >
        <TouchableWithoutFeedback onPress={handleCloseRegenCode}>
          <View style={s.overlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation?.()}>
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
                      onPress={handleCloseRegenCode}
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
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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