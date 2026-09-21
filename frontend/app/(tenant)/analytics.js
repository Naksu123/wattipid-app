import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useCopilot, CopilotStep, walkthroughable } from 'react-native-copilot';
import { useTourAutoStart, useTourContext } from '@/contexts/TourContext';
import { useAuth } from '../../contexts/AuthContext';
import { useModal } from '../../contexts/ModalContext';
import {
  getConsumptionHistory, getConsumptionComparison, getTransactionHistory, getTotalConsumptionToday,
  getTotalConsumptionWeek, getTotalConsumptionMonth, getAvailableBillingCycles,
  getSetting
} from '../../services/database';
import { getMonthlyForecast } from '../../services/notificationApi';
import { BaseModal, ModalHeader, ModalBody } from '../../components/modals/BaseModal';
import GlassCard from '../../components/ui/GlassCard';
import WattipidBarChart from '../../components/ui/WattipidBarChart';
import { buildAnalyticsReportHtml } from '../../services/pdfReportGenerator';
import { COLORS, SPACING, RADIUS } from '@/styles/theme';
import s from '@/styles/tenant/analytics.styles';

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const CopilotView = walkthroughable(View);

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const { showModal } = useModal();
  const { currentTourScreen } = useTourContext();
  const [period, setPeriod] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [history, setHistory] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [analysisUnit, setAnalysisUnit] = useState('kWh'); // 'kWh' or '₱'

  const [rate, setRate] = useState(12.50);
  const [availableCycles, setAvailableCycles] = useState([]);
  const [selectedPdfCycle, setSelectedPdfCycle] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [forecast, setForecast] = useState(null);

  // Loading states
  const [loadingPeriod, setLoadingPeriod] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [forecastError, setForecastError] = useState(false);
  
  const router = useRouter();
  
  const cacheRef = React.useRef({});
  const statsSeqRef = React.useRef(0);
  const forecastSeqRef = React.useRef(0);

  const scrollViewRef = React.useRef(null);
  useTourAutoStart('analytics', !loadingPeriod, scrollViewRef);

  const roomId = user?.room_id || 'Room 1';

  const getLocalDateStr = (d) => {
    if (!d) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ─── Data Loading ────────────────────────────────────────────────────────────
  // Instant Cache Restoration (Stale-While-Revalidate)
  useEffect(() => {
    let isMounted = true;
    const restoreCached = async () => {
      if (!roomId) return;
      try {
        const targetYear = selectedDate.getFullYear();
        const targetMonth = selectedDate.getMonth() + 1;
        const targetDateStr = getLocalDateStr(selectedDate);
        const cacheKey = `${period}-${targetYear}-${targetMonth}-${targetDateStr}`;
        const storageKey = `@cached_analytics_${roomId}_${cacheKey}`;
        const cached = await AsyncStorage.getItem(storageKey);
        if (cached && isMounted) {
          const parsed = JSON.parse(cached);
          if (parsed && Array.isArray(parsed.history) && parsed.history.length > 0) {
            cacheRef.current[cacheKey] = parsed;
            setHistory(parsed.history);
            if (parsed.comp) setComparison(parsed.comp);
            setLoadingPeriod(false);
          }
        }
      } catch (err) {
        console.warn('[Analytics] Cache restore error:', err);
      }
    };
    restoreCached();
    return () => { isMounted = false; };
  }, [roomId, period, selectedDate]);

  const loadStatsData = useCallback(async (isBackgroundRefresh = false) => {
    if (!user || !roomId) return;

    const seq = ++statsSeqRef.current;
    const tenantName = user?.name;
    const targetYear = selectedDate.getFullYear();
    const targetMonth = selectedDate.getMonth() + 1;
    const targetDateStr = getLocalDateStr(selectedDate);
    const cacheKey = `${period}-${targetYear}-${targetMonth}-${targetDateStr}`;
    const storageKey = `@cached_analytics_${roomId}_${cacheKey}`;

    if (cacheRef.current[cacheKey] && !isBackgroundRefresh && !refreshing) {
      const cached = cacheRef.current[cacheKey];
      setHistory(cached.history);
      setComparison(cached.comp);
      setLoadingPeriod(false);
    } else if (!isBackgroundRefresh && !cacheRef.current[cacheKey]) {
      setLoadingPeriod(true);
    }

    try {
      const [data, comp] = await Promise.all([
        getConsumptionHistory(roomId, period, tenantName, targetYear, targetMonth, targetDateStr),
        getConsumptionComparison(roomId, period, tenantName)
      ]);

      if (seq !== statsSeqRef.current) return;

      const fetchedRate = rate || 12.50;
      const alignedData = (data || []).map(item => {
        const energy = item.energy || item.totalEnergy || 0;
        const totalCost = item.cost || item.totalCost || 0;
        return {
          ...item,
          energy,
          cost: totalCost > 0 ? totalCost : energy * fetchedRate,
          totalCost: totalCost > 0 ? totalCost : energy * fetchedRate
        };
      });

      const ascendingData = [...alignedData].sort((a, b) => {
        const dateA = new Date(a.group_date || a.day || a.timestamp || a.cycle_start || 0).getTime();
        const dateB = new Date(b.group_date || b.day || b.timestamp || b.cycle_start || 0).getTime();
        if (dateA !== dateB && !isNaN(dateA) && !isNaN(dateB)) return dateA - dateB;
        return 0;
      });

      setHistory(ascendingData);
      setComparison(comp);

      const toCache = {
        history: ascendingData,
        comp
      };
      cacheRef.current[cacheKey] = toCache;
      AsyncStorage.setItem(storageKey, JSON.stringify(toCache)).catch(() => {});
    } catch (e) {
      if (e.message !== 'canceled' && e.name !== 'CanceledError') {
        console.warn('[Analytics] Core load error:', e.message);
      }
    } finally {
      setLoadingPeriod(false);
    }
  }, [roomId, period, selectedDate, user?.name, refreshing, rate]);

  const loadStaticData = useCallback(async () => {
    if (!user || !roomId) return;
    try {
      const [cyclesData, fetchedRateStr] = await Promise.all([
        getAvailableBillingCycles(roomId),
        getSetting('rate_per_kwh')
      ]);
      const fetchedRate = parseFloat(fetchedRateStr || '12.50');
      setRate(fetchedRate);

      if (cyclesData && cyclesData.length > 0) {
        setAvailableCycles(cyclesData);
        if (!selectedPdfCycle) setSelectedPdfCycle(cyclesData[0]);
      }
    } catch (e) {
      console.warn('[Analytics] Static load error:', e.message);
    }
  }, [roomId, user?.name, selectedPdfCycle]);

  const loadForecastData = useCallback(async () => {
    if (!user || !roomId) return;
    const seq = ++forecastSeqRef.current;
    setLoadingForecast(true);
    setForecastError(false);
    try {
      const forecastData = await getMonthlyForecast(roomId, user?.name);
      if (seq !== forecastSeqRef.current) return;
      setForecast(forecastData);
    } catch (e) {
      if (seq === forecastSeqRef.current) {
        setForecastError(true);
      }
    } finally {
      if (seq === forecastSeqRef.current) {
        setLoadingForecast(false);
      }
    }
  }, [roomId, user?.name]);

  useEffect(() => {
    loadStaticData();
  }, [loadStaticData]);

  useEffect(() => {
    loadStatsData();
  }, [loadStatsData]);

  useEffect(() => {
    loadForecastData();
  }, [loadForecastData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStatsData(true), loadForecastData()]);
    setRefreshing(false);
  };

  // ─── Date Navigation ─────────────────────────────────────────────────────────
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
      } else {
        return `${startMonth} ${monday.getDate()} – ${endMonth} ${sunday.getDate()}, ${sunday.getFullYear()}`;
      }
    }
    if (period === 'monthly') {
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return `${MONTH_NAMES[start.getMonth()]} 1 – ${MONTH_NAMES[end.getMonth()]} ${end.getDate()}, ${d.getFullYear()}`;
    }
    return `${d.getFullYear()}`;
  };

  // ─── Real Timeline Chart Computations (Zero Artificial Mock Data) ───────────
  const { chartLabels, chartData, chartValues, currentIndex, peakIndex, totalPeriodEnergy, totalPeriodCost } = useMemo(() => {
    let labels = [];
    let items = [];
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();

    if (period === 'daily') {
      // 24-hour timeline of the selected day: 12AM to 11PM
      const hourlyMap = {};
      (history || []).forEach(h => {
        const hr = parseInt(h.hour !== undefined ? h.hour : new Date(h.timestamp).getHours(), 10);
        if (!isNaN(hr)) {
          hourlyMap[hr] = h;
        }
      });

      for (let hr = 0; hr < 24; hr++) {
        const ampm = hr >= 12 ? 'PM' : 'AM';
        const hr12 = hr % 12 || 12;
        labels.push(`${hr12}${ampm}`);

        const entry = hourlyMap[hr];
        const energy = entry ? Number(entry.energy || entry.totalEnergy || 0) : 0;
        const cost = entry ? Number(entry.totalCost || entry.cost || 0) : energy * rate;
        items.push({
          energy,
          cost,
          value: analysisUnit === '₱' ? cost : energy,
        });
      }

      const curIdx = isToday ? today.getHours() : -1;
      const maxVal = Math.max(...items.map(i => i.value), 0);
      const pkIdx = maxVal > 0 ? items.findIndex(i => i.value === maxVal) : -1;
      const totalE = items.reduce((sum, i) => sum + i.energy, 0);
      const totalC = items.reduce((sum, i) => sum + i.cost, 0);

      return {
        chartLabels: labels,
        chartData: items,
        chartValues: items.map(i => i.value),
        currentIndex: curIdx,
        peakIndex: pkIdx,
        totalPeriodEnergy: totalE,
        totalPeriodCost: totalC,
      };
    }

    if (period === 'weekly') {
      // 7 days of the week: Mon to Sun
      const d = new Date(selectedDate);
      const dayOfWeek = d.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(d);
      monday.setDate(d.getDate() + mondayOffset);

      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const dayMap = {};
      (history || []).forEach(h => {
        // Use day or group_date directly as they're already 'YYYY-MM-DD' format
        if (h.day) dayMap[h.day] = h;
        else if (h.group_date) dayMap[h.group_date] = h;
        else if (h.timestamp) {
          // Extract date portion safely without UTC conversion
          const ds = String(h.timestamp).substring(0, 10);
          if (ds.length === 10) dayMap[ds] = h;
        }
      });

      let curIdx = -1;
      for (let i = 0; i < 7; i++) {
        const curDay = new Date(monday);
        curDay.setDate(monday.getDate() + i);
        const dateStr = getLocalDateStr(curDay);
        labels.push(dayNames[i]);

        if (curDay.toDateString() === today.toDateString()) {
          curIdx = i;
        }

        const entry = dayMap[dateStr] || null;
        const energy = entry ? Number(entry.energy || entry.totalEnergy || 0) : 0;
        const cost = entry ? Number(entry.totalCost || entry.cost || 0) : energy * rate;
        items.push({
          energy,
          cost,
          value: analysisUnit === '₱' ? cost : energy,
        });
      }

      const maxVal = Math.max(...items.map(i => i.value), 0);
      const pkIdx = maxVal > 0 ? items.findIndex(i => i.value === maxVal) : -1;
      const totalE = items.reduce((sum, i) => sum + i.energy, 0);
      const totalC = items.reduce((sum, i) => sum + i.cost, 0);

      return {
        chartLabels: labels,
        chartData: items,
        chartValues: items.map(i => i.value),
        currentIndex: curIdx,
        peakIndex: pkIdx,
        totalPeriodEnergy: totalE,
        totalPeriodCost: totalC,
      };
    }

    if (period === 'monthly') {
      // All days of the selected month
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      const dayMap = {};
      (history || []).forEach(h => {
        const dateField = h.day || h.group_date || h.timestamp;
        if (!dateField) return;
        // Parse day number from YYYY-MM-DD string safely (avoid UTC timezone shift)
        const dateStr = String(dateField).substring(0, 10); // get 'YYYY-MM-DD'
        const parts = dateStr.split('-');
        if (parts.length >= 3) {
          const dayNum = parseInt(parts[2], 10);
          if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
            dayMap[dayNum] = h;
          }
        }
      });

      const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
      const curIdx = isCurrentMonth ? today.getDate() - 1 : -1;

      for (let d = 1; d <= daysInMonth; d++) {
        labels.push(`${d}`);
        const entry = dayMap[d];
        const energy = entry ? Number(entry.energy || entry.totalEnergy || 0) : 0;
        const cost = entry ? Number(entry.totalCost || entry.cost || 0) : energy * rate;
        items.push({
          energy,
          cost,
          value: analysisUnit === '₱' ? cost : energy,
        });
      }

      const maxVal = Math.max(...items.map(i => i.value), 0);
      const pkIdx = maxVal > 0 ? items.findIndex(i => i.value === maxVal) : -1;
      const totalE = items.reduce((sum, i) => sum + i.energy, 0);
      const totalC = items.reduce((sum, i) => sum + i.cost, 0);

      return {
        chartLabels: labels,
        chartData: items,
        chartValues: items.map(i => i.value),
        currentIndex: curIdx,
        peakIndex: pkIdx,
        totalPeriodEnergy: totalE,
        totalPeriodCost: totalC,
      };
    }

    // Yearly: 12 months Jan to Dec
    const year = selectedDate.getFullYear();
    const monthMap = {};
    (history || []).forEach(h => {
      let m;
      if (h.month !== undefined) {
        m = parseInt(h.month, 10);
      } else {
        // Extract month from YYYY-MM-DD string safely (avoid UTC timezone shift)
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

    const isCurrentYear = today.getFullYear() === year;
    const curIdx = isCurrentYear ? today.getMonth() : -1;

    for (let m = 1; m <= 12; m++) {
      labels.push(MONTH_NAMES[m - 1]);
      const entry = monthMap[m];
      const energy = entry ? Number(entry.energy || entry.totalEnergy || 0) : 0;
      const cost = entry ? Number(entry.totalCost || entry.cost || 0) : energy * rate;
      items.push({
        energy,
        cost,
        value: analysisUnit === '₱' ? cost : energy,
      });
    }

    const maxVal = Math.max(...items.map(i => i.value), 0);
    const pkIdx = maxVal > 0 ? items.findIndex(i => i.value === maxVal) : -1;
    const totalE = items.reduce((sum, i) => sum + i.energy, 0);
    const totalC = items.reduce((sum, i) => sum + i.cost, 0);

    return {
      chartLabels: labels,
      chartData: items,
      chartValues: items.map(i => i.value),
      currentIndex: curIdx,
      peakIndex: pkIdx,
      totalPeriodEnergy: totalE,
      totalPeriodCost: totalC,
    };
  }, [history, period, selectedDate, rate, analysisUnit]);

  const getFootnoteText = () => {
    if (totalPeriodEnergy === 0) {
      return "No electricity consumption recorded for this period. IoT device was offline or drawing 0W.";
    }
    if (peakIndex >= 0 && chartLabels[peakIndex]) {
      const peakEnergy = chartData[peakIndex].energy;
      const peakCost = chartData[peakIndex].cost;
      const peakStr = analysisUnit === '₱' ? `₱${peakCost.toFixed(2)}` : `${peakEnergy.toFixed(3)} kWh`;

      if (period === 'daily') {
        return `Highest usage today was ${peakStr} at ${chartLabels[peakIndex]}.`;
      }
      if (period === 'weekly') {
        const fullDay = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }[chartLabels[peakIndex]] || chartLabels[peakIndex];
        return `Highest usage this week was ${peakStr} on ${fullDay}.`;
      }
      if (period === 'monthly') {
        return `Highest usage this month was ${peakStr} on ${MONTH_NAMES[selectedDate.getMonth()]} ${chartLabels[peakIndex]}.`;
      }
      return `Highest usage this year was ${peakStr} in ${chartLabels[peakIndex]}.`;
    }
    return "Normal consumption activity recorded.";
  };

  // Comparison Metrics (strict real data, no hardcoded fallbacks)
  const compPct = comparison ? Number(comparison.energyPctChange || 0) : 0;
  const compCost = comparison ? Number(comparison.costDiff || 0) : 0;

  // Forecast Metrics (strict real data, no hardcoded fallbacks)
  const forecastVal = forecast?.forecast_amount != null
    ? Number(forecast.forecast_amount)
    : (totalPeriodCost > 0 ? totalPeriodCost : 0);
  const forecastOver = forecast?.budget_diff != null
    ? Number(forecast.budget_diff)
    : 0;

  // ─── PDF Report Export ───────────────────────────────────────────────────────
  const generateReport = async () => {
    setGeneratingPdf(true);
    try {
      const activeCycle = selectedPdfCycle || availableCycles?.[0] || {
        cycle_start: getLocalDateStr(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)),
        cycle_end: getLocalDateStr(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)),
      };

      const html = buildAnalyticsReportHtml({
        period,
        dateLabel: getDateLabel(),
        selectedDate,
        roomId,
        tenantName: user?.name,
        rate,
        totalPeriodEnergy,
        totalPeriodCost,
        chartLabels,
        chartData,
        chartValues,
        peakIndex,
        analysisUnit,
        compPct,
        compCost,
        forecastVal,
        forecastOver,
        footnote: getFootnoteText(),
        activeCycle,
      });

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Wattipid_${period.toUpperCase()}_Report`,
      });
    } catch (e) {
      showModal({ type: 'error', title: 'Export Failed', message: 'Unable to generate PDF report: ' + e.message });
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <View style={s.container}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <Text style={s.title}>Energy Analytics</Text>
        </View>

        {/* ── Period Selector Pills ─────────────────────────────────────────── */}
        <CopilotStep text="Switch between Daily, Weekly, Monthly, and Yearly consumption analytics." order={1} name="analytics_period_tabs">
          <CopilotView style={s.periodRow}>
            {PERIODS.map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                style={[s.periodBtn, period === p && s.periodActive]}
                activeOpacity={0.8}
              >
                <Text style={[s.periodText, period === p && s.periodTextActive]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </CopilotView>
        </CopilotStep>

        {/* ── Date Navigator ────────────────────────────────────────────────── */}
        <View style={s.dateNav}>
          <TouchableOpacity style={s.dateNavBtn} onPress={() => navigateDate(-1)} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={s.dateNavTitle}>{getDateLabel()}</Text>
          <TouchableOpacity style={s.dateNavBtn} onPress={() => navigateDate(1)} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ── Consumption Analysis Card ─────────────────────────────────────── */}
        <CopilotStep text="Visual breakdown of your consumption across intervals with peak highlight." order={2} name="analytics_consumption_card">
          <CopilotView style={s.analysisCard}>
            <View style={s.analysisHeaderRow}>
              <Text style={s.analysisTitle}>CONSUMPTION ANALYSIS</Text>
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

            {/* Real SVG Interactive Chart */}
            <View style={{ minHeight: 230, marginBottom: 12 }}>
              {loadingPeriod && history.length === 0 ? (
                <View style={{ height: 230, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 8 }}>Updating consumption timeline...</Text>
                </View>
              ) : (
                <View>
                  {loadingPeriod && (
                    <View style={{ position: 'absolute', top: 4, right: 4, zIndex: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.7)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                      <ActivityIndicator size="small" color={COLORS.primary} style={{ transform: [{ scale: 0.6 }], marginRight: 4 }} />
                      <Text style={{ color: COLORS.textMuted, fontSize: 10 }}>Syncing...</Text>
                    </View>
                  )}
                  <WattipidBarChart
                    labels={chartLabels}
                    data={chartValues}
                    unit={analysisUnit}
                    height={230}
                    currentIndex={currentIndex}
                    peakIndex={peakIndex}
                    accentColor="#10B981"
                  />
                </View>
              )}
            </View>

            {/* Footnote / Smart Insight */}
            <View style={[s.footnoteBox, totalPeriodEnergy === 0 && { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }]}>
              <View style={[s.footnoteDot, totalPeriodEnergy === 0 && { backgroundColor: '#64748B' }]} />
              <Text style={[s.footnoteText, totalPeriodEnergy === 0 && { color: '#94A3B8' }]}>
                {getFootnoteText()}
              </Text>
            </View>
          </CopilotView>
        </CopilotStep>

        {/* ── VS LAST PERIOD Card ────────────────────────────────────────────── */}
        <View style={s.metricCard}>
          <View style={s.metricIconRed}>
            <Ionicons name="trending-up" size={24} color="#EF4444" />
          </View>
          <View style={s.metricContent}>
            <Text style={s.metricLabel}>
              VS LAST {period === 'daily' ? 'DAY' : period === 'weekly' ? 'WEEK' : period === 'yearly' ? 'YEAR' : 'MONTH'}
            </Text>
            <Text style={s.metricValueRed}>
              {compPct >= 0 ? `+${compPct.toFixed(1)}%` : `${compPct.toFixed(1)}%`} kWh • {compCost >= 0 ? `+₱${compCost.toFixed(2)}` : `-₱${Math.abs(compCost).toFixed(2)}`}
            </Text>
            <Text style={s.metricSubtext}>
              {totalPeriodEnergy === 0
                ? 'No active consumption recorded on this date'
                : `Total ${totalPeriodEnergy.toFixed(3)} kWh consumed this ${period === 'daily' ? 'day' : period === 'weekly' ? 'week' : period === 'yearly' ? 'year' : 'month'}`}
            </Text>
          </View>
        </View>

        {/* ── EOM FORECASTED BILL Card ──────────────────────────────────────── */}
        <View style={s.metricCard}>
          <View style={s.metricIconAmber}>
            <Ionicons name="pie-chart" size={24} color="#F59E0B" />
          </View>
          <View style={s.metricContent}>
            <Text style={s.metricLabel}>EOM FORECASTED BILL</Text>
            <Text style={s.metricValueAmber}>₱{forecastVal.toFixed(2)}</Text>
            <Text style={s.metricSubtext}>
              {forecastOver > 0
                ? `Estimated to be ₱${forecastOver.toFixed(0)} over your preset budget cap`
                : 'Projected within your designated monthly budget target'}
            </Text>
          </View>
        </View>

        {/* ── PDF Export Button ─────────────────────────────────────────────── */}
        <TouchableOpacity
          style={s.exportCta}
          onPress={generateReport}
          disabled={generatingPdf}
          activeOpacity={0.85}
        >
          {generatingPdf ? (
            <ActivityIndicator size="small" color="#0A0F1D" />
          ) : (
            <>
              <Ionicons name="document-text" size={18} color="#0A0F1D" />
              <Text style={s.exportCtaText}>
                Export {period.charAt(0).toUpperCase() + period.slice(1)} Report as PDF
              </Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
