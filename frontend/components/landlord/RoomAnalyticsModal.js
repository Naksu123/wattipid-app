import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useModal } from '../../contexts/ModalContext';
import {
  getConsumptionHistory,
  getConsumptionComparison,
  getRoomsConsumptionComparison,
  getAllRooms,
  getAvailableBillingCycles,
} from '../../services/database';
import WattipidBarChart from '../ui/WattipidBarChart';
import { buildAnalyticsReportHtml } from '../../services/pdfReportGenerator';
import s, { PALETTE } from '../../styles/landlord/room-analytics.styles';

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL_NAMES = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

// Daily Breakdown: 3 pages of exactly 8 hourly records each (Requirement 2.D & Section 4)
const DAILY_PAGES = [
  { id: 0, title: '12–7 AM', startHour: 0, endHour: 7 },
  { id: 1, title: '8 AM–3 PM', startHour: 8, endHour: 15 },
  { id: 2, title: '4–11 PM', startHour: 16, endHour: 23 },
];

export default function RoomAnalyticsModal({ visible, room, defaultRate = 12.50, onClose }) {
  const { showModal } = useModal();

  const lastRoomRef = useRef(room);
  if (room) {
    lastRoomRef.current = room;
  }
  const displayRoom = room || lastRoomRef.current;
  const currentRoomId = displayRoom?.room_id || 'Room 1';

  // Room list & active room selection
  const [selectedRoomId, setSelectedRoomId] = useState(currentRoomId);
  const [allRoomsList, setAllRoomsList] = useState([]);

  // Filter and timeline states
  const [period, setPeriod] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [analysisUnit, setAnalysisUnit] = useState('kWh'); // 'kWh' or '₱'
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed pagination for daily, weekly, monthly, yearly

  // Data states
  const [history, setHistory] = useState([]);
  const [periodComparison, setPeriodComparison] = useState(null);
  const [roomsComparisonData, setRoomsComparisonData] = useState(null);
  const [availableCycles, setAvailableCycles] = useState([]);

  // UI & Loading states
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const cacheRef = useRef({});
  const loadSeqRef = useRef(0);
  const abortControllerRef = useRef(null);
  const scrollViewRef = useRef(null);

  // Sync selectedRoomId whenever modal becomes visible or room changes
  useEffect(() => {
    if (visible && displayRoom?.room_id) {
      setSelectedRoomId(displayRoom.room_id);
    }
  }, [visible, displayRoom?.room_id]);

  // Reset pagination to page 1 whenever period, date, or room changes (Requirement 8)
  useEffect(() => {
    setCurrentPage(0);
  }, [period, selectedDate, selectedRoomId]);

  const getLocalDateStr = (d) => {
    if (!d) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load all rooms for multi-room comparison and quick switcher
  useEffect(() => {
    if (!visible) return;
    let isMounted = true;
    getAllRooms()
      .then((res) => {
        if (isMounted && Array.isArray(res)) {
          setAllRoomsList(res);
        }
      })
      .catch((err) => console.warn('[RoomAnalyticsModal] getAllRooms error:', err));
    return () => {
      isMounted = false;
    };
  }, [visible]);

  // Active room data object
  const activeRoomObj = useMemo(() => {
    const found = allRoomsList.find((r) => r.room_id === selectedRoomId);
    return found || displayRoom || { room_id: selectedRoomId, tenant_name: '', status: 'occupied' };
  }, [allRoomsList, selectedRoomId, displayRoom]);

  const rate = Number(activeRoomObj?.utility_rate || displayRoom?.utility_rate || defaultRate || 12.50);

  // Hardware live / online status calculation (Sentence Case)
  const hardwareStatus = useMemo(() => {
    if (!activeRoomObj?.last_seen) {
      return { isOnline: false, label: 'IoT meter offline', color: PALETTE.textSecondary };
    }
    const lastSeenTime = new Date(activeRoomObj.last_seen).getTime();
    const diffSec = (Date.now() - lastSeenTime) / 1000;
    if (diffSec <= 60) {
      return { isOnline: true, label: 'IoT meter online', color: PALETTE.success };
    }
    if (diffSec <= 3600) {
      const mins = Math.floor(diffSec / 60);
      return { isOnline: false, label: `Sync: ${mins}m ago`, color: PALETTE.warning };
    }
    return { isOnline: false, label: 'IoT meter offline', color: PALETTE.textSecondary };
  }, [activeRoomObj?.last_seen]);

  // ─── Data Loading for Selected Room and Period ─────────────────────────────
  const loadRoomAnalytics = useCallback(
    async (isBackground = false) => {
      if (!visible || !selectedRoomId) return;
      const seq = ++loadSeqRef.current;

      // Abort previous pending requests to prevent race conditions & duplicate fetching
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const signal = abortController.signal;

      const targetYear = selectedDate.getFullYear();
      const targetMonth = selectedDate.getMonth() + 1;
      const targetDateStr = getLocalDateStr(selectedDate);
      const cacheKey = `@room_analytics_${selectedRoomId}_${period}_${targetYear}_${targetMonth}_${targetDateStr}`;

      if (cacheRef.current[cacheKey] && !isBackground && !refreshing) {
        const cached = cacheRef.current[cacheKey];
        setHistory(cached.history || []);
        setPeriodComparison(cached.periodComparison || null);
        setRoomsComparisonData(cached.roomsComparisonData || null);
        setLoading(false);
        setLoadError(null);
      } else if (!isBackground && !cacheRef.current[cacheKey]) {
        setLoading(true);
        setLoadError(null);
      }

      try {
        const tenantName = activeRoomObj?.tenant_name || null;

        // Fetch using Promise.allSettled with abort signals
        const results = await Promise.allSettled([
          getConsumptionHistory(selectedRoomId, period, tenantName, targetYear, targetMonth, targetDateStr, { signal }),
          getConsumptionComparison(selectedRoomId, period, tenantName, { signal }),
          getRoomsConsumptionComparison(period, targetDateStr, targetYear, targetMonth, { signal }),
          getAvailableBillingCycles(selectedRoomId, { signal }),
        ]);

        if (seq !== loadSeqRef.current) return;

        const historyResult = results[0];
        const compResult = results[1];
        const multiRoomsResult = results[2];
        const cyclesResult = results[3];

        if (historyResult.status === 'rejected') {
          const errMsg = historyResult.reason?.message || 'Failed to retrieve consumption records';
          if (!errMsg.includes('canceled') && !errMsg.includes('aborted')) {
            setLoadError(errMsg);
          }
          return;
        }

        const historyData = historyResult.value || [];
        const compData = compResult.status === 'fulfilled' ? compResult.value : null;
        const multiRoomsData = multiRoomsResult.status === 'fulfilled' ? multiRoomsResult.value : null;
        const cyclesData = cyclesResult.status === 'fulfilled' ? cyclesResult.value : [];

        const effectiveRate = rate || 12.50;
        const normalizedHistory = historyData.map((item) => {
          const energy = Number(item.energy !== undefined ? item.energy : item.totalEnergy || 0);
          const totalCost = Number(item.cost !== undefined ? item.cost : item.totalCost || 0);
          const cost = totalCost > 0 ? totalCost : energy * effectiveRate;
          return {
            ...item,
            energy,
            cost,
            totalCost: cost,
          };
        });

        // Sort ascending by time/date for accurate timeline charts
        normalizedHistory.sort((a, b) => {
          const dateA = new Date(a.group_date || a.day || a.timestamp || a.cycle_start || 0).getTime();
          const dateB = new Date(b.group_date || b.day || b.timestamp || b.cycle_start || 0).getTime();
          if (dateA && dateB && !isNaN(dateA) && !isNaN(dateB)) return dateA - dateB;
          return 0;
        });

        setHistory(normalizedHistory);
        setPeriodComparison(compData || null);
        setRoomsComparisonData(multiRoomsData || null);
        if (cyclesData && cyclesData.length > 0) {
          setAvailableCycles(cyclesData);
        }
        setLoadError(null);

        const toCache = {
          history: normalizedHistory,
          periodComparison: compData,
          roomsComparisonData: multiRoomsData,
        };
        cacheRef.current[cacheKey] = toCache;
        AsyncStorage.setItem(cacheKey, JSON.stringify(toCache)).catch(() => {});
      } catch (err) {
        if (err.name !== 'CanceledError' && err.message !== 'canceled' && !err.message?.includes('aborted')) {
          console.warn('[RoomAnalyticsModal] Load error:', err?.message || err);
          if (seq === loadSeqRef.current) {
            setLoadError(err?.message || 'Error loading analytics');
          }
        }
      } finally {
        if (seq === loadSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [visible, selectedRoomId, period, selectedDate, rate, activeRoomObj?.tenant_name, refreshing]
  );

  useEffect(() => {
    if (visible) {
      loadRoomAnalytics();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [visible, loadRoomAnalytics]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoomAnalytics(true);
    setRefreshing(false);
  };

  // ─── Date Navigation Handlers ───────────────────────────────────────────────
  const navigateDate = (direction) => {
    const d = new Date(selectedDate);
    if (period === 'daily') d.setDate(d.getDate() + direction);
    else if (period === 'weekly') d.setDate(d.getDate() + direction * 7);
    else if (period === 'monthly') d.setMonth(d.getMonth() + direction);
    else d.setFullYear(d.getFullYear() + direction);

    const today = new Date();
    if (d > today) {
      setSelectedDate(today);
    } else {
      setSelectedDate(d);
    }
  };

  const isCurrentPeriod = useMemo(() => {
    const today = new Date();
    if (period === 'daily') {
      return selectedDate.toDateString() === today.toDateString();
    }
    if (period === 'weekly') {
      const d = new Date(selectedDate);
      const diff = today.getTime() - d.getTime();
      return diff >= 0 && diff < 7 * 86400000 && selectedDate.getDay() <= today.getDay();
    }
    if (period === 'monthly') {
      return (
        selectedDate.getFullYear() === today.getFullYear() &&
        selectedDate.getMonth() === today.getMonth()
      );
    }
    return selectedDate.getFullYear() === today.getFullYear();
  }, [period, selectedDate]);

  const getDateLabel = () => {
    const d = selectedDate;
    if (period === 'daily') {
      return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
    if (period === 'weekly') {
      const dayOfWeek = d.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(d);
      monday.setDate(d.getDate() + mondayOffset);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const startMonth = MONTH_NAMES[monday.getMonth()];
      const endMonth = MONTH_NAMES[sunday.getMonth()];
      if (startMonth === endMonth) {
        return `${startMonth} ${monday.getDate()} – ${sunday.getDate()}, ${monday.getFullYear()}`;
      }
      return `${startMonth} ${monday.getDate()} – ${endMonth} ${sunday.getDate()}, ${sunday.getFullYear()}`;
    }
    if (period === 'monthly') {
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      return `${MONTH_FULL[start.getMonth()]} ${start.getFullYear()}`;
    }
    return `${d.getFullYear()}`;
  };

  // ─── Timeline Chart Data Computation ───────────────────────────────────────
  const {
    chartLabels,
    chartData,
    chartValues,
    currentIndex,
    peakIndex,
    lowestIndex,
    totalPeriodEnergy,
    totalPeriodCost,
    activeIntervalsCount,
  } = useMemo(() => {
    const labels = [];
    const items = [];
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();

    if (period === 'daily') {
      // 24-hour timeline of the selected day: 12 AM to 11 PM (Hours 0 to 23)
      const hourlyMap = {};
      (history || []).forEach((h) => {
        const hr = parseInt(h.hour !== undefined ? h.hour : new Date(h.timestamp).getHours(), 10);
        if (!isNaN(hr)) hourlyMap[hr] = h;
      });

      for (let hr = 0; hr < 24; hr++) {
        const ampm = hr >= 12 ? 'PM' : 'AM';
        const hr12 = hr % 12 || 12;
        labels.push(`${hr12}${ampm}`);

        const entry = hourlyMap[hr];
        const energy = entry ? Number(entry.energy || entry.totalEnergy || 0) : 0;
        const cost = entry ? Number(entry.totalCost || entry.cost || 0) : energy * rate;

        items.push({
          hour: hr,
          label: `${hr12} ${ampm}`,
          dayName: `${hr12} ${ampm}`,
          isCurrent: isToday && hr === today.getHours(),
          energy,
          cost,
          value: analysisUnit === '₱' ? cost : energy,
        });
      }
    } else if (period === 'weekly') {
      // Monday to Sunday (7 days)
      const d = new Date(selectedDate);
      const dayOfWeek = d.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(d);
      monday.setDate(d.getDate() + mondayOffset);

      const dayMap = {};
      (history || []).forEach((h) => {
        if (h.day) dayMap[h.day] = h;
        else if (h.group_date) dayMap[h.group_date] = h;
        else if (h.timestamp) {
          const ds = String(h.timestamp).substring(0, 10);
          if (ds.length === 10) dayMap[ds] = h;
        }
      });

      for (let i = 0; i < 7; i++) {
        const curDay = new Date(monday);
        curDay.setDate(monday.getDate() + i);
        const dateStr = getLocalDateStr(curDay);
        labels.push(DAY_NAMES[i]);

        const entry = dayMap[dateStr] || null;
        const energy = entry ? Number(entry.energy || entry.totalEnergy || 0) : 0;
        const cost = entry ? Number(entry.totalCost || entry.cost || 0) : energy * rate;
        const curDayMonth = MONTH_NAMES[curDay.getMonth()];
        const curDayNum = curDay.getDate();

        items.push({
          label: DAY_NAMES[i],
          dayName: `${DAY_FULL_NAMES[DAY_NAMES[i]]} · ${curDayMonth} ${curDayNum}`,
          fullDayName: `${DAY_FULL_NAMES[DAY_NAMES[i]]} · ${curDayMonth} ${curDayNum}`,
          dateStr,
          isToday: curDay.toDateString() === today.toDateString(),
          energy,
          cost,
          value: analysisUnit === '₱' ? cost : energy,
        });
      }
    } else if (period === 'monthly') {
      // All days of the selected month
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const dayMap = {};
      (history || []).forEach((h) => {
        const dateField = h.day || h.group_date || h.timestamp;
        if (!dateField) return;
        const dateStr = String(dateField).substring(0, 10);
        const parts = dateStr.split('-');
        if (parts.length >= 3) {
          const dayNum = parseInt(parts[2], 10);
          if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
            dayMap[dayNum] = h;
          }
        }
      });

      for (let d = 1; d <= daysInMonth; d++) {
        labels.push(`${d}`);
        const entry = dayMap[d];
        const energy = entry ? Number(entry.energy || entry.totalEnergy || 0) : 0;
        const cost = entry ? Number(entry.totalCost || entry.cost || 0) : energy * rate;

        const curDayDate = new Date(year, month, d);
        const dayOfWeekShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][curDayDate.getDay()];
        const dayOfWeekFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][curDayDate.getDay()];
        const isToday = curDayDate.toDateString() === today.toDateString();

        items.push({
          dayNum: d,
          label: `${d}`,
          dayName: `${MONTH_NAMES[month]} ${d} · ${dayOfWeekFull}`,
          fullDayName: `${MONTH_NAMES[month]} ${d} (${dayOfWeekFull})`,
          dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
          dayOfWeek: dayOfWeekFull,
          isToday,
          energy,
          cost,
          value: analysisUnit === '₱' ? cost : energy,
        });
      }
    } else {
      // Yearly: 12 months Jan to Dec
      const year = selectedDate.getFullYear();
      const monthMap = {};
      (history || []).forEach((h) => {
        let m;
        if (h.month !== undefined) {
          m = parseInt(h.month, 10);
        } else {
          const dateField = h.day || h.group_date || h.timestamp;
          if (dateField) {
            const parts = String(dateField).substring(0, 7).split('-');
            if (parts.length >= 2) m = parseInt(parts[1], 10);
          }
        }
        if (!isNaN(m) && m >= 1 && m <= 12) {
          monthMap[m] = h;
        }
      });

      for (let m = 1; m <= 12; m++) {
        labels.push(MONTH_NAMES[m - 1]);
        const entry = monthMap[m];
        const energy = entry ? Number(entry.energy || entry.totalEnergy || 0) : 0;
        const cost = entry ? Number(entry.totalCost || entry.cost || 0) : energy * rate;
        items.push({
          monthNum: m,
          label: MONTH_NAMES[m - 1],
          dayName: `${MONTH_FULL[m - 1]} ${year}`,
          monthName: MONTH_FULL[m - 1],
          fullDayName: `${MONTH_FULL[m - 1]} ${year}`,
          energy,
          cost,
          value: analysisUnit === '₱' ? cost : energy,
        });
      }
    }

    let curIdx = -1;
    if (period === 'daily') {
      curIdx = isToday ? today.getHours() : -1;
    } else if (period === 'weekly') {
      curIdx = items.findIndex((i) => i.isToday);
    } else if (period === 'monthly') {
      const isCurMonth =
        today.getFullYear() === selectedDate.getFullYear() &&
        today.getMonth() === selectedDate.getMonth();
      curIdx = isCurMonth ? today.getDate() - 1 : -1;
    } else {
      const isCurYear = today.getFullYear() === selectedDate.getFullYear();
      curIdx = isCurYear ? today.getMonth() : -1;
    }

    const maxVal = Math.max(...items.map((i) => i.value), 0);
    const pkIdx = maxVal > 0 ? items.findIndex((i) => i.value === maxVal) : -1;

    const nonZeroItems = items.filter((i) => i.value > 0);
    let lowIdx = -1;
    if (nonZeroItems.length > 0) {
      const minNonZeroVal = Math.min(...nonZeroItems.map((i) => i.value));
      lowIdx = items.findIndex((i) => i.value === minNonZeroVal);
    }

    const totalE = items.reduce((sum, i) => sum + i.energy, 0);
    const totalC = items.reduce((sum, i) => sum + i.cost, 0);
    const activeCount = items.filter((i) => i.energy > 0).length;

    return {
      chartLabels: labels,
      chartData: items,
      chartValues: items.map((i) => i.value),
      currentIndex: curIdx,
      peakIndex: pkIdx,
      lowestIndex: lowIdx,
      totalPeriodEnergy: totalE,
      totalPeriodCost: totalC,
      activeIntervalsCount: activeCount,
    };
  }, [history, period, selectedDate, rate, analysisUnit]);

  // ─── Unified Paginated Records (Daily: 8/page; Weekly, Monthly, Yearly: 7/page) ───
  const pageSize = period === 'daily' ? 8 : 7;
  const totalRecords = chartData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(currentPage, totalPages - 1);

  const startIndex = safePage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedData = useMemo(() => {
    return chartData.slice(startIndex, endIndex);
  }, [chartData, startIndex, endIndex]);

  // Contextual page range label (e.g. "Days 1–7", "January – July", "12 AM – 7 AM")
  const pageRangeLabel = useMemo(() => {
    if (totalRecords === 0) return '';
    if (period === 'daily') {
      const pageBlocks = ['12 AM – 7 AM', '8 AM – 3 PM', '4 PM – 11 PM'];
      return pageBlocks[safePage] || `Hours ${startIndex}–${endIndex - 1}`;
    }
    if (period === 'weekly') {
      return 'Monday – Sunday';
    }
    if (period === 'monthly') {
      return `Days ${startIndex + 1}–${endIndex}`;
    }
    if (period === 'yearly') {
      return safePage === 0 ? 'January – July' : 'August – December';
    }
    return `Page ${safePage + 1} of ${totalPages}`;
  }, [period, safePage, startIndex, endIndex, totalRecords, totalPages]);

  // ─── Summary Cards Calculations (Section 3: 5 Key Metrics - Sentence Case) ──
  const summaryMetrics = useMemo(() => {
    const dayCount = period === 'weekly' ? 7 : period === 'monthly' ? chartData.length || 30 : 1;
    const avgDailyEnergy = dayCount > 0 ? totalPeriodEnergy / dayCount : 0;
    const avgDailyCost = dayCount > 0 ? totalPeriodCost / dayCount : 0;

    let highestDayLabel = 'None';
    let highestDayVal = '0.00 kWh · ₱0.00';
    if (peakIndex >= 0 && chartData[peakIndex]) {
      const item = chartData[peakIndex];
      highestDayLabel = item.fullDayName || item.dayName || item.label || 'Peak';
      highestDayVal = `${item.energy.toFixed(2)} kWh · ₱${item.cost.toFixed(2)}`;
    }

    let lowestDayLabel = 'None';
    let lowestDayVal = '0.00 kWh · ₱0.00';
    if (lowestIndex >= 0 && chartData[lowestIndex]) {
      const item = chartData[lowestIndex];
      lowestDayLabel = item.fullDayName || item.dayName || item.label || 'Lowest';
      lowestDayVal = `${item.energy.toFixed(2)} kWh · ₱${item.cost.toFixed(2)}`;
    }

    const compPct = periodComparison ? Number(periodComparison.energyPctChange || 0) : 0;
    const compCost = periodComparison ? Number(periodComparison.costDiff || 0) : 0;

    return {
      totalEnergy: totalPeriodEnergy,
      totalCost: totalPeriodCost,
      avgDailyEnergy,
      avgDailyCost,
      highestDayLabel,
      highestDayVal,
      lowestDayLabel,
      lowestDayVal,
      compPct,
      compCost,
    };
  }, [period, chartData, totalPeriodEnergy, totalPeriodCost, peakIndex, lowestIndex, periodComparison]);

  // ─── Multi-Room Comparison Metrics (Section 4 - Sentence Case) ──────────────
  const roomComparisonComputed = useMemo(() => {
    const rooms = roomsComparisonData?.rooms || [];
    if (!rooms || rooms.length === 0) {
      return {
        rooms: [],
        avgPropertyEnergy: 0,
        avgPropertyCost: 0,
        highestRoom: null,
        lowestRoom: null,
        currentRoomEnergy: totalPeriodEnergy,
        currentRoomDiffPct: 0,
      };
    }

    const avgPropEnergy = Number(roomsComparisonData?.avgPropertyEnergy || 0);
    const avgPropCost = Number(roomsComparisonData?.avgPropertyCost || 0);
    const highestRoom = roomsComparisonData?.highestRoom || rooms[0] || null;

    const activeRooms = rooms.filter((r) => r.totalEnergy > 0);
    const lowestRoom =
      roomsComparisonData?.lowestRoom ||
      (activeRooms.length > 0 ? activeRooms[activeRooms.length - 1] : rooms[rooms.length - 1]);

    const currentRoomItem = rooms.find((r) => r.room_id === selectedRoomId);
    const currentRoomEnergy = currentRoomItem ? currentRoomItem.totalEnergy : totalPeriodEnergy;

    let diffVsAvg = 0;
    if (avgPropEnergy > 0) {
      diffVsAvg = ((currentRoomEnergy - avgPropEnergy) / avgPropEnergy) * 100;
    }

    return {
      rooms,
      avgPropertyEnergy: avgPropEnergy,
      avgPropertyCost: avgPropCost,
      highestRoom,
      lowestRoom,
      currentRoomEnergy,
      currentRoomDiffPct: diffVsAvg,
    };
  }, [roomsComparisonData, selectedRoomId, totalPeriodEnergy]);

  // ─── Automated Data-Driven Insights Engine (Section 5 - Sentence Case) ──────
  const insights = useMemo(() => {
    const generated = [];

    // 1. Peak Day observation
    if (peakIndex >= 0 && chartData[peakIndex]) {
      const peakItem = chartData[peakIndex];
      const peakName = peakItem.fullDayName || peakItem.dayName || peakItem.label;
      const peakEnergyStr = `${peakItem.energy.toFixed(2)} kWh`;
      if (period === 'weekly') {
        generated.push(
          `${selectedRoomId} recorded its highest electricity consumption on ${peakName} (${peakEnergyStr} • ₱${peakItem.cost.toFixed(2)}).`
        );
      } else if (period === 'daily') {
        generated.push(
          `${selectedRoomId} recorded its peak hourly electricity demand at ${peakName} (${peakEnergyStr} • ₱${peakItem.cost.toFixed(2)}).`
        );
      } else if (period === 'monthly') {
        generated.push(
          `${selectedRoomId} reached its highest daily consumption this month on day ${peakName} (${peakEnergyStr}).`
        );
      } else {
        generated.push(
          `${selectedRoomId} recorded peak electricity usage in ${peakName} (${peakEnergyStr}).`
        );
      }
    }

    // 2. Trend vs Previous Period observation
    if (periodComparison && Math.abs(summaryMetrics.compPct) >= 0.1) {
      const pct = Math.abs(summaryMetrics.compPct).toFixed(1);
      const isUp = summaryMetrics.compPct > 0;
      const periodName =
        period === 'daily'
          ? 'previous day'
          : period === 'weekly'
          ? 'previous week'
          : period === 'yearly'
          ? 'previous year'
          : 'previous month';
      generated.push(
        `Electricity consumption ${isUp ? 'increased' : 'decreased'} by ${pct}% compared to the ${periodName}.`
      );
    }

    // 3. Property Benchmark observation
    if (roomComparisonComputed.avgPropertyEnergy > 0 && totalPeriodEnergy > 0) {
      const diff = roomComparisonComputed.currentRoomDiffPct;
      if (Math.abs(diff) >= 1) {
        const dir = diff > 0 ? 'more' : 'less';
        generated.push(
          `This room consumed ${Math.abs(diff).toFixed(1)}% ${dir} electricity than the property's average room consumption (${roomComparisonComputed.avgPropertyEnergy.toFixed(2)} kWh).`
        );
      } else {
        generated.push(
          `This room's electricity consumption was directly on par with the property average.`
        );
      }
    }

    // 4. Lowest consumption observation
    if (lowestIndex >= 0 && chartData[lowestIndex] && chartData[lowestIndex].energy > 0) {
      const lowestItem = chartData[lowestIndex];
      const lowName = lowestItem.fullDayName || lowestItem.dayName || lowestItem.label;
      generated.push(
        `Lowest active consumption was registered on ${lowName} at ${lowestItem.energy.toFixed(2)} kWh.`
      );
    }

    if (totalPeriodEnergy === 0) {
      if (!hardwareStatus.isOnline) {
        generated.push(
          `No electricity consumption records logged for ${selectedRoomId} during this period. IoT meter was offline or not transmitting.`
        );
      } else {
        generated.push(
          `Verified zero electricity consumption. IoT meter is active and confirmed zero load for this period.`
        );
      }
    }

    return generated;
  }, [
    peakIndex,
    lowestIndex,
    chartData,
    selectedRoomId,
    period,
    periodComparison,
    summaryMetrics.compPct,
    roomComparisonComputed,
    totalPeriodEnergy,
    hardwareStatus.isOnline,
  ]);

  // ─── PDF Report Generator & Exporter (Section 6) ───────────────────────────
  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      const activeCycle = availableCycles?.[0] || {
        cycle_start: getLocalDateStr(
          new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        ),
        cycle_end: getLocalDateStr(
          new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
        ),
      };

      const html = buildAnalyticsReportHtml({
        period,
        dateLabel: getDateLabel(),
        selectedDate,
        roomId: selectedRoomId,
        roomNumber: activeRoomObj?.room_number || '',
        tenantName: activeRoomObj?.tenant_name || 'Unassigned Tenant',
        rate,
        totalPeriodEnergy,
        totalPeriodCost,
        chartLabels,
        chartData,
        chartValues,
        peakIndex,
        analysisUnit,
        compPct: summaryMetrics.compPct,
        compCost: summaryMetrics.compCost,
        forecastVal: totalPeriodCost,
        forecastOver: 0,
        highestDayStr: `${summaryMetrics.highestDayLabel} · ${summaryMetrics.highestDayVal}`,
        lowestDayStr: `${summaryMetrics.lowestDayLabel} · ${summaryMetrics.lowestDayVal}`,
        averageDailyStr: `${summaryMetrics.avgDailyEnergy.toFixed(3)} kWh/day (₱${summaryMetrics.avgDailyCost.toFixed(2)}/day)`,
        insights,
        roomComparisons: roomComparisonComputed,
        activeCycle,
      });

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Wattipid_${selectedRoomId}_${period}_analytics_report`,
      });
    } catch (err) {
      showModal({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not generate analytics report PDF: ' + err.message,
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (!visible && !displayRoom) return null;

  return (
    <Modal
      visible={Boolean(visible && displayRoom)}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.bg} />

        {/* ── Header Bar ─────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <TouchableOpacity
              onPress={onClose}
              style={s.backBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back to Room Management"
            >
              <Ionicons name="arrow-back" size={20} color={PALETTE.textPrimary} />
            </TouchableOpacity>
            <View style={s.headerTitleGroup}>
              <Text style={s.screenTitle} numberOfLines={1}>
                {selectedRoomId} analytics
              </Text>
              <View style={s.headerSubRow}>
                <Text style={s.screenSubtitle} numberOfLines={1}>
                  {activeRoomObj?.tenant_name || 'Vacant room'}
                </Text>
                <View style={[s.statusBadge, !hardwareStatus.isOnline && s.statusBadgeOffline]}>
                  <View style={[s.statusDot, !hardwareStatus.isOnline && s.statusDotOffline]} />
                  <Text style={[s.statusText, !hardwareStatus.isOnline && s.statusTextOffline]}>
                    {hardwareStatus.label}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={s.headerRight}>
            <TouchableOpacity
              style={s.headerIconBtn}
              onPress={handleGeneratePdf}
              disabled={generatingPdf}
              activeOpacity={0.7}
              accessibilityLabel="Export PDF"
            >
              {generatingPdf ? (
                <ActivityIndicator size="small" color={PALETTE.accent} />
              ) : (
                <Ionicons name="document-text-outline" size={20} color={PALETTE.accent} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={s.headerIconBtn}
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color={PALETTE.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={s.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PALETTE.accent} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* ── Multi-Room Selector Pill Strip ───────────────────────────── */}
          {allRoomsList.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.roomPillScroll}
            >
              {allRoomsList
                .filter((r) => r.status !== 'archived')
                .map((rm) => {
                  const isActive = rm.room_id === selectedRoomId;
                  return (
                    <TouchableOpacity
                      key={rm.room_id}
                      style={[s.roomPill, isActive && s.roomPillActive]}
                      onPress={() => setSelectedRoomId(rm.room_id)}
                      activeOpacity={0.75}
                    >
                      <View style={[s.roomPillDot, isActive && s.roomPillDotActive]} />
                      <Text style={[s.roomPillText, isActive && s.roomPillTextActive]}>
                        {rm.room_id}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          )}

          {/* ── Reporting Period Filters (Daily, Weekly, Monthly, Yearly) ──── */}
          <View style={s.periodRow}>
            {PERIODS.map((p) => {
              const isActive = period === p;
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPeriod(p)}
                  style={[s.periodBtn, isActive && s.periodActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[s.periodText, isActive && s.periodTextActive]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Date Navigator ────────────────────────────────────────────── */}
          <View style={s.dateNav}>
            <TouchableOpacity
              style={s.dateNavBtn}
              onPress={() => navigateDate(-1)}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color={PALETTE.textPrimary} />
            </TouchableOpacity>
            <View style={s.dateNavCenter}>
              <Ionicons name="calendar-outline" size={16} color={PALETTE.accent} />
              <Text style={s.dateNavTitle}>{getDateLabel()}</Text>
            </View>
            <TouchableOpacity
              style={[s.dateNavBtn, isCurrentPeriod && { opacity: 0.3 }]}
              onPress={() => navigateDate(1)}
              disabled={isCurrentPeriod}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={18} color={PALETTE.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* ── Distinct State Handling Banners (Sentence Case) ────────────── */}
          {loadError ? (
            <View style={s.stateBannerCard}>
              <Ionicons name="alert-circle" size={32} color={PALETTE.error} style={s.stateBannerIcon} />
              <Text style={s.stateBannerTitle}>Error loading consumption</Text>
              <Text style={s.stateBannerMessage}>{loadError}</Text>
              <TouchableOpacity style={s.stateRetryBtn} onPress={() => loadRoomAnalytics()}>
                <Ionicons name="refresh" size={14} color={PALETTE.accent} />
                <Text style={s.stateRetryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : !loading && totalPeriodEnergy === 0 ? (
            !hardwareStatus.isOnline ? (
              <View style={s.stateBannerCard}>
                <Ionicons name="cloud-offline-outline" size={32} color={PALETTE.textSecondary} style={s.stateBannerIcon} />
                <Text style={s.stateBannerTitle}>IoT submeter offline</Text>
                <Text style={s.stateBannerMessage}>
                  The IoT hardware for {selectedRoomId} is currently not transmitting readings or was inactive during this period.
                </Text>
                <TouchableOpacity style={s.stateRetryBtn} onPress={() => loadRoomAnalytics()}>
                  <Ionicons name="refresh" size={14} color={PALETTE.accent} />
                  <Text style={s.stateRetryText}>Check connection</Text>
                </TouchableOpacity>
              </View>
            ) : history.length === 0 ? (
              <View style={s.stateBannerCard}>
                <Ionicons name="document-text-outline" size={32} color={PALETTE.textSecondary} style={s.stateBannerIcon} />
                <Text style={s.stateBannerTitle}>No records found</Text>
                <Text style={s.stateBannerMessage}>
                  No electricity records were logged for {selectedRoomId} in the selected {period} timeframe.
                </Text>
              </View>
            ) : (
              <View style={s.stateBannerCard}>
                <Ionicons name="power-outline" size={32} color={PALETTE.accent} style={s.stateBannerIcon} />
                <Text style={s.stateBannerTitle}>Zero consumption verified</Text>
                <Text style={s.stateBannerMessage}>
                  Verified 0.00 kWh. The room circuit remained idle with no active electrical load during this period.
                </Text>
              </View>
            )
          ) : null}

          {/* ── Section: Summary Overview (Sentence Case - 5 Key Metrics) ──── */}
          <View style={s.sectionHeaderRow}>
            <View style={s.sectionTitleWrap}>
              <Text style={s.sectionTitle}>Summary overview</Text>
            </View>
            <View style={s.sectionBadge}>
              <Text style={s.sectionBadgeText}>₱{rate.toFixed(2)} / kWh</Text>
            </View>
          </View>

          <View style={s.metricsGrid}>
            {/* 1. Total electricity consumption */}
            <View style={[s.metricCard, s.metricCardAccent]}>
              <View style={s.metricHeaderRow}>
                <Text style={s.metricLabel}>Total consumption</Text>
              </View>
              <Text style={s.metricValue}>
                {summaryMetrics.totalEnergy.toFixed(2)} <Text style={s.metricUnit}>kWh</Text>
              </Text>
              {summaryMetrics.compPct !== 0 && (
                <View
                  style={[
                    s.metricDiffBadge,
                    {
                      backgroundColor:
                        summaryMetrics.compPct > 0
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(18, 184, 134, 0.15)',
                    },
                  ]}
                >
                  <Ionicons
                    name={summaryMetrics.compPct > 0 ? 'arrow-up' : 'arrow-down'}
                    size={12}
                    color={summaryMetrics.compPct > 0 ? PALETTE.error : PALETTE.success}
                  />
                  <Text
                    style={[
                      s.metricDiffText,
                      { color: summaryMetrics.compPct > 0 ? PALETTE.error : PALETTE.success },
                    ]}
                  >
                    {Math.abs(summaryMetrics.compPct).toFixed(1)}% vs last {period}
                  </Text>
                </View>
              )}
            </View>

            {/* 2. Total electricity cost */}
            <View style={[s.metricCard, s.metricCardSuccess]}>
              <View style={s.metricHeaderRow}>
                <Text style={s.metricLabel}>Total cost</Text>
              </View>
              <Text style={[s.metricValue, { color: PALETTE.success }]}>
                ₱{summaryMetrics.totalCost.toFixed(2)}
              </Text>
              <Text style={s.metricSubtext}>
                {summaryMetrics.compCost !== 0
                  ? `${summaryMetrics.compCost > 0 ? '+' : ''}₱${summaryMetrics.compCost.toFixed(2)} vs previous`
                  : 'Zero cost variance'}
              </Text>
            </View>

            {/* 3. Average daily consumption */}
            <View style={s.metricCardWide}>
              <View style={s.metricHeaderRow}>
                <Text style={s.metricLabel}>Average daily consumption</Text>
              </View>
              <Text style={s.metricValue}>
                {summaryMetrics.avgDailyEnergy.toFixed(3)}{' '}
                <Text style={s.metricUnit}>kWh / day</Text>
              </Text>
              <Text style={s.metricSubtext}>
                Estimated daily cost: ₱{summaryMetrics.avgDailyCost.toFixed(2)} / day
              </Text>
            </View>

            {/* 4. Highest consumption day */}
            <View style={s.metricCard}>
              <View style={s.metricHeaderRow}>
                <Text style={s.metricLabel}>Highest usage day</Text>
              </View>
              <Text style={[s.metricValue, { fontSize: 16 }]} numberOfLines={2}>
                {summaryMetrics.highestDayLabel}
              </Text>
              <Text style={s.metricSubtext} numberOfLines={1}>
                {summaryMetrics.highestDayVal}
              </Text>
            </View>

            {/* 5. Lowest consumption day */}
            <View style={s.metricCard}>
              <View style={s.metricHeaderRow}>
                <Text style={s.metricLabel}>Lowest usage day</Text>
              </View>
              <Text style={[s.metricValue, { fontSize: 16 }]} numberOfLines={2}>
                {summaryMetrics.lowestDayLabel}
              </Text>
              <Text style={s.metricSubtext} numberOfLines={1}>
                {summaryMetrics.lowestDayVal}
              </Text>
            </View>
          </View>

          {/* ── Interactive Consumption Timeline Chart (Sentence Case) ─────── */}
          <View style={s.chartCard}>
            <View style={s.chartHeaderRow}>
              <View style={s.chartTitleWrap}>
                <Ionicons name="bar-chart-outline" size={16} color={PALETTE.accent} />
                <Text style={s.chartTitle}>Consumption timeline</Text>
              </View>
              <View style={s.unitToggle}>
                <TouchableOpacity
                  style={[s.unitBtn, analysisUnit === 'kWh' && s.unitBtnActive]}
                  onPress={() => setAnalysisUnit('kWh')}
                  activeOpacity={0.8}
                >
                  <Text style={[s.unitText, analysisUnit === 'kWh' && s.unitTextActive]}>kWh</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.unitBtn, analysisUnit === '₱' && s.unitBtnActive]}
                  onPress={() => setAnalysisUnit('₱')}
                  activeOpacity={0.8}
                >
                  <Text style={[s.unitText, analysisUnit === '₱' && s.unitTextActive]}>₱</Text>
                </TouchableOpacity>
              </View>
            </View>

            {loading && history.length === 0 ? (
              <View style={{ height: 230, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="small" color={PALETTE.accent} />
                <Text style={{ color: PALETTE.textSecondary, fontSize: 12, marginTop: 8 }}>
                  Loading verified telemetry records...
                </Text>
              </View>
            ) : (
              <WattipidBarChart
                labels={chartLabels}
                data={chartValues}
                unit={analysisUnit}
                height={230}
                currentIndex={currentIndex}
                peakIndex={peakIndex}
                lowlightIndex={lowestIndex}
                accentColor={PALETTE.accent}
              />
            )}

            <View style={s.chartFootnote}>
              <View
                style={[
                  s.chartFootnoteDot,
                  totalPeriodEnergy === 0 && { backgroundColor: PALETTE.textSecondary },
                ]}
              />
              <Text style={s.chartFootnoteText}>
                {totalPeriodEnergy === 0
                  ? 'No electrical consumption recorded for this timeframe.'
                  : `Peak interval: ${summaryMetrics.highestDayLabel} · ${summaryMetrics.highestDayVal}`}
              </Text>
            </View>
          </View>

          {/* ── Section: Daily Interval Breakdown (Requirement 4: Two-Column) ─ */}
          <View style={s.sectionHeaderRow}>
            <View style={s.sectionTitleWrap}>
              <Text style={s.sectionTitle}>
                {period === 'daily'
                  ? 'Daily interval breakdown'
                  : period === 'weekly'
                  ? 'Daily breakdown (Monday to Sunday)'
                  : period === 'monthly'
                  ? 'Monthly breakdown'
                  : 'Yearly breakdown'}
              </Text>
            </View>
            <View style={s.sectionBadge}>
              <Text style={s.sectionBadgeText}>
                {activeIntervalsCount} / {chartData.length} active
              </Text>
            </View>
          </View>

          <View style={s.breakdownCard}>
            {/* ── Stacked Breakdown Summary (Vertical 3-Row Layout) ─────────── */}
            <View style={s.breakdownSummaryStack}>
              {/* 1. Peak usage row */}
              <View style={s.summaryStackRow}>
                <View style={s.summaryStackHeader}>
                  <View style={[s.summaryStackDot, { backgroundColor: PALETTE.warning }]} />
                  <Text style={s.summaryStackLabel}>Peak usage</Text>
                </View>
                <View style={s.summaryStackContent}>
                  <Text style={s.summaryStackDate}>
                    {summaryMetrics.highestDayLabel}
                  </Text>
                  <Text style={[s.summaryStackMetrics, { color: PALETTE.warning }]}>
                    {summaryMetrics.highestDayVal}
                  </Text>
                </View>
              </View>

              <View style={s.summaryStackDivider} />

              {/* 2. Lowest usage row */}
              <View style={s.summaryStackRow}>
                <View style={s.summaryStackHeader}>
                  <View style={[s.summaryStackDot, { backgroundColor: PALETTE.accent }]} />
                  <Text style={s.summaryStackLabel}>Lowest usage</Text>
                </View>
                <View style={s.summaryStackContent}>
                  <Text style={s.summaryStackDate}>
                    {summaryMetrics.lowestDayLabel}
                  </Text>
                  <Text style={[s.summaryStackMetrics, { color: PALETTE.accent }]}>
                    {summaryMetrics.lowestDayVal}
                  </Text>
                </View>
              </View>

              <View style={s.summaryStackDivider} />

              {/* 3. Period total row - visually prominent */}
              <View style={s.summaryStackTotalCard}>
                <View style={s.summaryStackTotalHeader}>
                  <View style={[s.summaryStackDot, { backgroundColor: PALETTE.success }]} />
                  <Text style={s.summaryStackTotalLabel}>Period total</Text>
                </View>
                <View style={s.summaryStackTotalContent}>
                  <Text style={s.summaryStackTotalEnergy}>
                    {totalPeriodEnergy.toFixed(2)} kWh
                  </Text>
                  <Text style={s.summaryStackTotalCost}>
                    ₱{totalPeriodCost.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Unified Pagination Component (Daily: 8/page; Weekly, Monthly, Yearly: 7/page) ── */}
            <View style={s.paginationWrapper}>
              <View style={s.paginationHeader}>
                <Text style={s.paginationCountText}>
                  Showing {startIndex + 1}–{endIndex} of {totalRecords} records
                </Text>
                {pageRangeLabel ? (
                  <View style={s.paginationRangeBadge}>
                    <Text style={s.paginationRangeText}>{pageRangeLabel}</Text>
                  </View>
                ) : null}
              </View>

              <View style={s.paginationControls}>
                <TouchableOpacity
                  style={[s.paginationNavBtn, safePage === 0 && s.paginationNavBtnDisabled]}
                  onPress={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  activeOpacity={0.7}
                  accessibilityLabel="Previous page"
                >
                  <Ionicons
                    name="chevron-back"
                    size={12}
                    color={safePage === 0 ? PALETTE.textSecondary : PALETTE.textPrimary}
                  />
                  <Text
                    style={[
                      s.paginationNavBtnText,
                      safePage === 0 && s.paginationNavBtnTextDisabled,
                    ]}
                  >
                    {totalPages >= 5 ? 'Prev' : 'Previous'}
                  </Text>
                </TouchableOpacity>

                <View style={s.paginationPagesRow}>
                  {Array.from({ length: totalPages }, (_, i) => {
                    const isActive = safePage === i;
                    return (
                      <TouchableOpacity
                        key={`page-${i}`}
                        style={[s.paginationPagePill, isActive && s.paginationPagePillActive]}
                        onPress={() => setCurrentPage(i)}
                        activeOpacity={0.8}
                        accessibilityLabel={`Page ${i + 1}`}
                      >
                        <Text
                          style={[
                            s.paginationPagePillText,
                            isActive && s.paginationPagePillTextActive,
                          ]}
                        >
                          {i + 1}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={[
                    s.paginationNavBtn,
                    safePage >= totalPages - 1 && s.paginationNavBtnDisabled,
                  ]}
                  onPress={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage >= totalPages - 1}
                  activeOpacity={0.7}
                  accessibilityLabel="Next page"
                >
                  <Text
                    style={[
                      s.paginationNavBtnText,
                      safePage >= totalPages - 1 && s.paginationNavBtnTextDisabled,
                    ]}
                  >
                    Next
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color={safePage >= totalPages - 1 ? PALETTE.textSecondary : PALETTE.textPrimary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Clean Two-Column Record Layout (Requirement 4) */}
            {paginatedData.map((item, idx) => {
              const fullIndex = startIndex + idx;
              const isPeak = fullIndex === peakIndex && item.energy > 0;
              const isLowest = fullIndex === lowestIndex && item.energy > 0;
              const isCurrent = item.isCurrent || item.isToday;

              const prevItem = fullIndex > 0 ? chartData[fullIndex - 1] : null;
              let diffPct = null;
              if (prevItem && prevItem.energy > 0) {
                diffPct = ((item.energy - prevItem.energy) / prevItem.energy) * 100;
              }

              const maxEnergy = Math.max(...chartData.map((d) => d.energy), 0.001);
              const progress = (item.energy / maxEnergy) * 100;

              // Usage status label
              let statusTag = 'Idle';
              if (isPeak) {
                statusTag = 'Peak';
              } else if (isLowest) {
                statusTag = 'Lowest';
              } else if (isCurrent) {
                statusTag = period === 'daily' ? 'Current hour' : period === 'yearly' ? 'Current month' : 'Today';
              } else if (item.energy > 0) {
                statusTag = 'Active';
              }

              const diffStr = diffPct !== null
                ? `${diffPct > 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`} vs prev`
                : 'Baseline';

              const statusLine = `${diffStr} · ${statusTag}`;

              const labelText = period === 'daily'
                ? item.label // e.g. "12 AM", "4 PM"
                : item.dayName || item.label;

              return (
                <View key={`${item.label}-${fullIndex}`} style={s.breakdownRow}>
                  {/* LEFT: Date/Hour label, Progress indicator, Usage status */}
                  <View style={s.breakdownLeftCol}>
                    <Text style={s.hourLabel}>
                      {labelText}
                    </Text>

                    <View style={s.progressTrack}>
                      <View
                        style={[
                          s.progressBar,
                          {
                            width: `${Math.min(Math.max(progress, item.energy > 0 ? 5 : 0), 100)}%`,
                            backgroundColor: isPeak ? PALETTE.warning : isLowest ? PALETTE.accent : PALETTE.accent,
                          },
                        ]}
                      />
                    </View>

                    <Text style={s.statusTextLine}>
                      {statusLine}
                    </Text>
                  </View>

                  {/* RIGHT: Energy consumption in kWh, Electricity cost in Philippine pesos */}
                  <View style={s.breakdownRightCol}>
                    <Text style={s.consumptionKwhText} numberOfLines={1}>
                      {item.energy.toFixed(3)} kWh
                    </Text>
                    <Text style={s.consumptionCostText} numberOfLines={1}>
                      ₱{item.cost.toFixed(2)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── Section: Multi-Room Comparison (Section 4 - Sentence Case) ──── */}
          <View style={s.sectionHeaderRow}>
            <View style={s.sectionTitleWrap}>
              <Text style={s.sectionTitle}>Room comparison ({period})</Text>
            </View>
            <View style={s.sectionBadge}>
              <Text style={s.sectionBadgeText}>
                {roomComparisonComputed.rooms.length} rooms tracked
              </Text>
            </View>
          </View>

          <View style={s.comparisonCard}>
            {/* Property Average Banner */}
            <View style={s.propAvgStrip}>
              <View style={s.propAvgLeft}>
                <Text style={s.propAvgLabel}>Property average</Text>
                <Text style={s.propAvgValue}>
                  {roomComparisonComputed.avgPropertyEnergy.toFixed(2)} kWh{' '}
                  <Text style={{ fontSize: 12, color: PALETTE.textSecondary }}>
                    (₱{roomComparisonComputed.avgPropertyCost.toFixed(2)})
                  </Text>
                </Text>
              </View>

              <View
                style={[
                  s.propAvgBadge,
                  {
                    backgroundColor:
                      roomComparisonComputed.currentRoomDiffPct > 0
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(18, 184, 134, 0.15)',
                  },
                ]}
              >
                <Text
                  style={[
                    s.propAvgBadgeText,
                    {
                      color:
                        roomComparisonComputed.currentRoomDiffPct > 0 ? PALETTE.error : PALETTE.success,
                    },
                  ]}
                >
                  {roomComparisonComputed.currentRoomDiffPct > 0 ? '+' : ''}
                  {roomComparisonComputed.currentRoomDiffPct.toFixed(1)}% vs avg
                </Text>
              </View>
            </View>

            {/* Highest & Lowest Consuming Rooms */}
            <View style={[s.breakdownSummaryBanner, { marginBottom: 14 }]}>
              <View style={s.bannerCol}>
                <Text style={s.bannerColLabel}>Highest consuming room</Text>
                <Text style={[s.bannerColValue, { color: PALETTE.warning }]} numberOfLines={1}>
                  {roomComparisonComputed.highestRoom
                    ? `${roomComparisonComputed.highestRoom.room_id} (${Number(roomComparisonComputed.highestRoom.totalEnergy).toFixed(2)} kWh)`
                    : 'N/A'}
                </Text>
              </View>
              <View style={s.bannerCol}>
                <Text style={s.bannerColLabel}>Lowest consuming room</Text>
                <Text style={[s.bannerColValue, { color: PALETTE.accent }]} numberOfLines={1}>
                  {roomComparisonComputed.lowestRoom
                    ? `${roomComparisonComputed.lowestRoom.room_id} (${Number(roomComparisonComputed.lowestRoom.totalEnergy).toFixed(2)} kWh)`
                    : 'N/A'}
                </Text>
              </View>
            </View>

            {/* Room-by-Room Ranking List */}
            {roomComparisonComputed.rooms.map((rm, idx) => {
              const isCurrent = rm.room_id === selectedRoomId;
              const diffPct =
                totalPeriodEnergy > 0
                  ? (((rm.totalEnergy - totalPeriodEnergy) / totalPeriodEnergy) * 100)
                  : 0;

              return (
                <TouchableOpacity
                  key={rm.room_id}
                  style={[s.comparisonRankRow, isCurrent && s.comparisonRankRowActive]}
                  onPress={() => setSelectedRoomId(rm.room_id)}
                  activeOpacity={0.7}
                >
                  <View style={s.rankBadge}>
                    <Text style={s.rankBadgeText}>#{idx + 1}</Text>
                  </View>

                  <View style={s.comparisonRoomInfo}>
                    <View style={s.comparisonRoomTitleRow}>
                      <Text style={s.comparisonRoomName}>{rm.room_id}</Text>
                      {isCurrent && (
                        <View style={s.currentRoomPill}>
                          <Text style={s.currentRoomPillText}>Selected</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.comparisonTenantName}>
                      {rm.tenant_name || 'Vacant'} · {rm.status}
                    </Text>
                  </View>

                  <View style={s.comparisonValues}>
                    <Text style={s.comparisonEnergy}>
                      {Number(rm.totalEnergy).toFixed(2)} kWh
                    </Text>
                    <Text
                      style={[
                        s.comparisonDiffText,
                        {
                          color: isCurrent
                            ? PALETTE.accent
                            : diffPct > 0
                            ? PALETTE.error
                            : diffPct < 0
                            ? PALETTE.success
                            : PALETTE.textSecondary,
                        },
                      ]}
                    >
                      {isCurrent
                        ? 'Current room'
                        : diffPct > 0
                        ? `+${diffPct.toFixed(1)}% vs this room`
                        : `${diffPct.toFixed(1)}% vs this room`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Section: Automated Consumption Insights (Section 5) ────────── */}
          <View style={s.sectionHeaderRow}>
            <View style={s.sectionTitleWrap}>
              <Text style={s.sectionTitle}>Automated consumption insights</Text>
            </View>
            <View style={s.sectionBadge}>
              <Text style={s.sectionBadgeText}>Data-driven</Text>
            </View>
          </View>

          <View style={s.insightsCard}>
            {insights.map((insight, idx) => (
              <View key={idx} style={s.insightItem}>
                <View
                  style={[
                    s.insightIconBadge,
                    {
                      borderColor:
                        idx === 0
                          ? 'rgba(18, 184, 134, 0.3)'
                          : idx === 1
                          ? 'rgba(245, 158, 11, 0.3)'
                          : 'rgba(19, 184, 210, 0.3)',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      idx === 0
                        ? 'flash'
                        : idx === 1
                        ? 'trending-up'
                        : 'information-circle'
                    }
                    size={16}
                    color={idx === 0 ? PALETTE.success : idx === 1 ? PALETTE.warning : PALETTE.accent}
                  />
                </View>
                <Text style={s.insightText}>{insight}</Text>
              </View>
            ))}
          </View>

          {/* ── Section: Generate Report CTA Button (Section 6) ─────────────── */}
          <TouchableOpacity
            style={s.exportCta}
            onPress={handleGeneratePdf}
            disabled={generatingPdf}
            activeOpacity={0.85}
          >
            {generatingPdf ? (
              <ActivityIndicator size="small" color="#042F2E" />
            ) : (
              <>
                <Ionicons name="document-text" size={18} color="#042F2E" />
                <Text style={s.exportCtaText}>
                  Export {period} analytics report (PDF)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
