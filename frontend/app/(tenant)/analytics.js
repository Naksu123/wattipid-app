import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
import { COLORS, SPACING, RADIUS } from '@/styles/theme';
import s from '@/styles/tenant/analytics.styles';

const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const { showModal } = useModal();
  const [period, setPeriod] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [history, setHistory] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [hourlyBreakdown, setHourlyBreakdown] = useState([]);
  const [todayUsage, setTodayUsage] = useState({ totalEnergy: 0, totalCost: 0 });
  const [weekUsage, setWeekUsage] = useState({ totalEnergy: 0, totalCost: 0 });
  const [monthUsage, setMonthUsage] = useState({ totalEnergy: 0, totalCost: 0 });
  const [rate, setRate] = useState(12.50);
  const [availableCycles, setAvailableCycles] = useState([]);
  const [selectedPdfCycle, setSelectedPdfCycle] = useState(null);
  const [activeView, setActiveView] = useState('charts');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [historyStartDate, setHistoryStartDate] = useState(null);
  const [historyEndDate, setHistoryEndDate] = useState(null);
  const [historyTitle, setHistoryTitle] = useState('Active Billing Cycle');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());
  const [historyFilter, setHistoryFilter] = useState('minute');
  const [historyLimit, setHistoryLimit] = useState(20);
  const [forecast, setForecast] = useState(null);

  const roomId = user?.room_id || 'Room 1';

  // ─── Data Loading ────────────────────────────────────────────────────────────
  const loadStatsData = useCallback(async () => {
    if (!user || !roomId) return;
    const tenantName = user?.name;
    const targetYear = selectedDate.getFullYear();
    const targetMonth = selectedDate.getMonth() + 1; // 1-12
    const targetDateStr = selectedDate.toISOString().split('T')[0];

    const [data, comp, today, week, month, cyclesData, fetchedRateStr] = await Promise.all([
      getConsumptionHistory(roomId, period, tenantName, targetYear, targetMonth, targetDateStr),
      getConsumptionComparison(roomId, period, tenantName),
      getTotalConsumptionToday(roomId, tenantName),
      getTotalConsumptionWeek(roomId, tenantName),
      getTotalConsumptionMonth(roomId, tenantName),
      getAvailableBillingCycles(roomId),
      getSetting('rate_per_kwh')
    ]);

    const fetchedRate = parseFloat(fetchedRateStr || '12.50');
    setRate(fetchedRate);

    if (cyclesData && cyclesData.length > 0) {
      setAvailableCycles(cyclesData);
      if (!selectedPdfCycle) setSelectedPdfCycle(cyclesData[0]);
      if (!historyStartDate) {
        setHistoryStartDate(new Date(cyclesData[0].cycle_start));
        setHistoryEndDate(new Date(cyclesData[0].cycle_end));
      }
    }

    const alignedData = (data || []).map(item => ({
      ...item,
      cost: (item.energy || item.totalEnergy || 0) * fetchedRate,
      totalCost: (item.totalEnergy || item.energy || 0) * fetchedRate
    }));

    // Sort chronologically (ascending) for the chart
    const ascendingData = [...alignedData].sort((a, b) => {
      const dateA = new Date(a.group_date || a.day || a.timestamp || a.cycle_start || 0).getTime();
      const dateB = new Date(b.group_date || b.day || b.timestamp || b.cycle_start || 0).getTime();
      if (dateA !== dateB && !isNaN(dateA) && !isNaN(dateB)) return dateA - dateB;
      if (a.hour !== undefined && b.hour !== undefined) return a.hour - b.hour;
      if (a.month !== undefined && b.month !== undefined) return a.month - b.month;
      return 0;
    });

    setHistory(ascendingData);
    setComparison(comp);
    setTodayUsage({ ...today, totalCost: (today?.totalEnergy || 0) * fetchedRate });
    setWeekUsage({ ...week, totalCost: (week?.totalEnergy || 0) * fetchedRate });
    setMonthUsage({ ...month, totalCost: (month?.totalEnergy || 0) * fetchedRate });

    try {
      const forecastData = await getMonthlyForecast(roomId, tenantName);
      setForecast(forecastData);
    } catch (_e) {}

    if (period === 'daily') {
      setHourlyBreakdown([...ascendingData].reverse()); // descending for table
      setBreakdown([]);
    } else {
      setBreakdown([...ascendingData].reverse()); // descending for table
      setHourlyBreakdown([]);
    }
  }, [roomId, period, selectedDate, historyStartDate, selectedPdfCycle, user?.name]);

  const loadHistoryData = useCallback(async () => {
    if (!user || !roomId) return;
    const tenantName = user?.name;
    const startStr = historyStartDate ? historyStartDate.toISOString().split('T')[0] : null;
    const endStr = historyEndDate ? historyEndDate.toISOString().split('T')[0] : null;
    const txns = await getTransactionHistory(roomId, 500, historyFilter, tenantName, 0, startStr, endStr);
    setTransactions(txns || []);
  }, [roomId, historyFilter, historyStartDate, historyEndDate, user?.name]);

  useEffect(() => {
    loadStatsData();
    const interval = setInterval(loadStatsData, 60000);
    return () => clearInterval(interval);
  }, [loadStatsData]);

  useEffect(() => {
    loadHistoryData();
    const interval = setInterval(loadHistoryData, 60000);
    return () => clearInterval(interval);
  }, [loadHistoryData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatsData();
    await loadHistoryData();
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
      // Cap navigation to today so users don't get stuck if the exact date is in the future
      setSelectedDate(today);
    } else {
      setSelectedDate(d);
    }
  };

  const getDateLabel = () => {
    const d = selectedDate;
    if (period === 'daily') {
      return `${d.getDate()} ${MONTH_FULL[d.getMonth()]} ${d.getFullYear()}`;
    }
    if (period === 'weekly') {
      const dayOfWeek = d.getDay();
      const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - offset);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.getDate()} ${MONTH_NAMES[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MONTH_NAMES[weekEnd.getMonth()]}`;
    }
    if (period === 'monthly') {
      return `${MONTH_FULL[d.getMonth()]} ${d.getFullYear()}`;
    }
    return `${d.getFullYear()}`;
  };

  // ─── Computed Data ────────────────────────────────────────────────────────────
  const currentIndex = useMemo(() => {
    const today = new Date();
    const isSameDay = selectedDate.getDate() === today.getDate() && selectedDate.getMonth() === today.getMonth() && selectedDate.getFullYear() === today.getFullYear();
    const isSameMonth = selectedDate.getMonth() === today.getMonth() && selectedDate.getFullYear() === today.getFullYear();
    const isSameYear = selectedDate.getFullYear() === today.getFullYear();

    if (period === 'daily' && isSameDay) {
      const currentHour = today.getHours();
      return history.findIndex(h => parseInt(h.hour) === currentHour);
    }
    if (period === 'weekly') {
      const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      return history.findIndex(h => h.day === todayStr);
    }
    if (period === 'monthly' && isSameMonth) {
      const todayDate = today.getDate();
      return history.findIndex(h => {
         const d = new Date(h.day || h.timestamp);
         return !isNaN(d.getTime()) && d.getDate() === todayDate;
      });
    }
    if (period === 'yearly' && isSameYear) {
      const currentMonth = today.getMonth() + 1;
      return history.findIndex(h => parseInt(h.month) === currentMonth);
    }
    return -1;
  }, [history, period, selectedDate]);

  const labels = useMemo(() => {
    if (history.length === 0) return [];
    return history.map((h, i) => {
      if (period === 'daily') {
        if (h.hour !== undefined) {
          const hr = parseInt(h.hour);
          const ampm = hr >= 12 ? 'PM' : 'AM';
          const hr12 = hr % 12 || 12;
          return `${hr12}${ampm}`; // e.g. "1PM", "2PM"
        }
        return `${String(i).padStart(2,'0')}:00`;
      }
      if (period === 'weekly') {
        if (h.label !== undefined && h.label !== null) {
          return DAY_NAMES[parseInt(h.label)] || DAY_NAMES[i % 7];
        }
        return DAY_NAMES[i % 7];
      }
      if (period === 'yearly') {
        return MONTH_NAMES[(h.month || i + 1) - 1];
      }
      // monthly
      if (h.day || h.timestamp || h.group_date) {
        const dt = new Date(h.day || h.timestamp || h.group_date);
        if (!isNaN(dt.getTime())) return `${dt.getDate()}`;
      }
      return `${h.label || (i + 1)}`;
    });
  }, [history, period]);

  const energyData = useMemo(() =>
    history.length > 0 ? history.map(h => h.energy || 0) : []
  , [history]);

  const totalEnergy = energyData.reduce((a, b) => a + b, 0);
  const totalCost = totalEnergy * rate;
  const avgEnergy = history.length > 0 ? totalEnergy / history.length : 0;
  const avgPower = history.length > 0 ? history.reduce((a, h) => a + (h.avgPower || 0), 0) / history.length : 0;
  const peakPower = Math.max(...history.map(h => h.peakPower || 0), 0);

  const peakIndex = energyData.length > 0 ? energyData.indexOf(Math.max(...energyData)) : -1;
  const nonZeroEnergies = energyData.filter(e => e > 0);
  const lowestIndex = nonZeroEnergies.length > 0 ? energyData.indexOf(Math.min(...nonZeroEnergies)) : -1;

  // Previous period comparison data for chart overlay
  const comparisonChartData = useMemo(() => {
    if (period !== 'weekly' && period !== 'yearly') return null;
    // We don't have per-bar comparison data from the API, so we return null
    // The comparison banner will still show totals
    return null;
  }, [period]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
  };

  // ─── Insights Generator ──────────────────────────────────────────────────────
  const insights = useMemo(() => {
    const arr = [];
    if (comparison) {
      const pct = comparison.energyPctChange || 0;
      if (pct > 0) arr.push(`Your electricity consumption increased by ${Math.abs(pct).toFixed(1)}% compared to the previous ${period === 'daily' ? 'day' : period === 'weekly' ? 'week' : period === 'monthly' ? 'month' : 'year'}.`);
      else if (pct < 0) arr.push(`Great job! Consumption decreased by ${Math.abs(pct).toFixed(1)}% compared to the previous period.`);
      else arr.push('Consumption remains stable compared to the previous period.');
    }
    if (peakIndex >= 0 && labels[peakIndex]) {
      arr.push(`Highest consumption was recorded at ${labels[peakIndex]} with ${energyData[peakIndex].toFixed(3)} kWh.`);
    }
    if (avgPower > 0) arr.push(`Average power draw: ${avgPower.toFixed(0)}W`);
    if (peakPower > 0) arr.push(`Peak power recorded: ${peakPower.toFixed(0)}W`);
    if (totalCost > 0) {
      const estMonthly = totalCost * (30 / Math.max(history.length, 1));
      arr.push(`Estimated monthly cost at current rate: ₱${estMonthly.toFixed(2)}`);
    }
    return arr;
  }, [comparison, peakIndex, labels, energyData, avgPower, peakPower, totalCost, history.length, period]);

  const recommendation = useMemo(() => {
    if (!comparison) return 'Keep monitoring your consumption patterns to optimize electricity usage.';
    const pct = comparison.energyPctChange || 0;
    if (pct <= -10) return "Excellent! Your electricity consumption is highly efficient. Continue your current habits to maintain savings.";
    if (pct < 0) return "Good progress! Your consumption is decreasing. Keep it up by turning off unused appliances.";
    if (pct <= 5) return "Your consumption is stable. Unplugging idle chargers and turning off unused lights could yield further savings.";
    if (pct <= 15) return "Your consumption is slightly increasing. Consider reviewing high-wattage appliance usage during peak hours.";
    return "High consumption detected. Reduce appliance usage during peak hours and unplug unused devices to save on electricity costs.";
  }, [comparison]);

  // ─── View Tabs ────────────────────────────────────────────────────────────────
  const VIEW_TABS = [
    { key: 'charts', icon: 'bar-chart-outline', label: 'Charts' },
    { key: 'breakdown', icon: 'list-outline', label: 'Breakdown' },
    { key: 'history', icon: 'receipt-outline', label: 'History' }
  ];

  // ─── PDF Report ───────────────────────────────────────────────────────────────
  const generateReport = async () => {
    setGeneratingPdf(true);
    try {
      if (!selectedPdfCycle) return;
      let startDate, endDate, reportType;
      if (period === 'daily') {
        startDate = new Date(selectedDate); endDate = new Date(selectedDate);
        reportType = 'Daily Consumption Analytics Report';
      } else if (period === 'weekly') {
        startDate = new Date(selectedDate);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        endDate = new Date(startDate); endDate.setDate(endDate.getDate() + 6);
        reportType = 'Weekly Consumption Analytics Report';
      } else if (period === 'yearly') {
        startDate = new Date(selectedDate.getFullYear(), 0, 1);
        endDate = new Date(selectedDate.getFullYear(), 11, 31);
        reportType = 'Yearly Consumption Analytics Report';
      } else {
        const activeCycle = availableCycles?.find(c => new Date(c.cycle_start) <= selectedDate && new Date(c.cycle_end) >= selectedDate) || availableCycles?.[0];
        if (activeCycle) { startDate = new Date(activeCycle.cycle_start); endDate = new Date(activeCycle.cycle_end); }
        else { startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1); endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0); }
        reportType = 'Monthly Consumption Analytics Report';
      }
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];
      const [fetchedHistory, fetchedComp] = await Promise.all([
        getTransactionHistory(roomId, 300, 'daily', user?.name, 0, startStr, endStr),
        getConsumptionComparison(roomId, period, user?.name)
      ]);
      const flattenedHistory = (fetchedHistory || []).reduce((acc, group) => {
        if (group.data && Array.isArray(group.data)) return acc.concat(group.data);
        return acc;
      }, []);
      const startBoundary = new Date(startDate); startBoundary.setHours(0,0,0,0);
      const endBoundary = new Date(endDate); endBoundary.setHours(23,59,59,999);
      const filteredHistory = flattenedHistory.filter(h => {
        const d = new Date(h.group_date || h.day || h.timestamp);
        return d >= startBoundary && d <= endBoundary;
      });
      const now = new Date();
      const dateRange = `${MONTH_FULL[startDate.getMonth()]} ${startDate.getDate()} – ${MONTH_FULL[endDate.getMonth()]} ${endDate.getDate()}, ${endDate.getFullYear()}`;
      const compData = fetchedComp || { current: { totalEnergy: 0, totalCost: 0 }, previous: { totalEnergy: 0, totalCost: 0 }, costPctChange: 0, energyPctChange: 0, costDiff: 0 };
      const repTotalEnergy = filteredHistory.reduce((a, b) => a + (Number(b.totalEnergy || b.energy) || 0), 0);
      const repTotalCost = repTotalEnergy * rate;
      const validPowerHistory = filteredHistory.filter(h => Number(h.avgPower) > 0);
      const repAvgPower = validPowerHistory.length > 0 ? validPowerHistory.reduce((a, h) => a + Number(h.avgPower), 0) / validPowerHistory.length : 0;
      let efficiencyScore = 'Average', efficiencyPct = 50, effStatusColor = '#EAB308';
      if (compData.energyPctChange <= -10) { efficiencyScore = 'Excellent'; efficiencyPct = 95; effStatusColor = '#22C55E'; }
      else if (compData.energyPctChange < 0) { efficiencyScore = 'Good'; efficiencyPct = 80; effStatusColor = '#10B981'; }
      else if (compData.energyPctChange <= 5) { efficiencyScore = 'Average'; efficiencyPct = 60; effStatusColor = '#3B82F6'; }
      else if (compData.energyPctChange <= 15) { efficiencyScore = 'High Consumption'; efficiencyPct = 35; effStatusColor = '#F97316'; }
      else { efficiencyScore = 'Critical Consumption'; efficiencyPct = 15; effStatusColor = '#EF4444'; }
      const pdfInsights = [];
      if (compData.energyPctChange > 0) pdfInsights.push(`Electricity consumption increased by ${compData.energyPctChange.toFixed(1)}% compared to the previous period.`);
      else if (compData.energyPctChange < 0) pdfInsights.push(`Great job! Consumption reduced by ${Math.abs(compData.energyPctChange).toFixed(1)}% compared to the previous period.`);
      else pdfInsights.push(`Consumption remains perfectly stable compared to the previous period.`);
      let pdfRecommendation = '';
      if (efficiencyScore === 'Excellent' || efficiencyScore === 'Good') pdfRecommendation = "Your electricity consumption is highly efficient. Continue your current habits to maintain savings.";
      else if (efficiencyScore === 'Average') pdfRecommendation = "Your consumption is stable. Unplugging idle chargers and turning off unused lights could yield further savings.";
      else pdfRecommendation = "High consumption detected. Consider reviewing high-wattage appliance usage during peak hours.";
      const breakdownRows = filteredHistory.map(r => {
        const energy = Number(r.totalEnergy || r.energy || 0);
        const cost = energy * rate;
        const pwr = Number(r.avgPower || 0);
        let status = 'Normal';
        if (pwr > 1000) status = 'High';
        if (pwr < 100) status = 'Low';
        const pct = repTotalEnergy > 0 ? ((energy / repTotalEnergy) * 100).toFixed(1) : '0.0';
        return `<tr><td>${formatDate(r.group_date || r.day || r.timestamp)}</td><td>${energy.toFixed(3)} kWh</td><td>₱${cost.toFixed(2)}</td><td>${pwr.toFixed(1)}W</td><td><span class="status-badge ${status.toLowerCase()}">${status}</span></td><td>${pct}%</td></tr>`;
      }).join('');
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1E293B;padding:30px;font-size:11px;background:#fff;line-height:1.4;}.report-container{max-width:800px;margin:0 auto;}.header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #10B981;padding-bottom:15px;margin-bottom:20px;}.company h1{color:#10B981;font-size:24px;letter-spacing:1px;margin-bottom:2px;}.company p{color:#475569;font-size:10px;font-weight:bold;letter-spacing:.5px;}.report-title-box{text-align:right;}.report-title-box h2{font-size:14px;color:#0F172A;text-transform:uppercase;margin-bottom:4px;}.report-title-box p{font-size:10px;color:#64748B;}.tenant-info{display:flex;justify-content:space-between;background:#F8FAFC;padding:12px;border-radius:6px;margin-bottom:20px;border:1px solid #E2E8F0;}.tenant-col{flex:1;}.tenant-col span{display:block;font-size:9px;color:#64748B;text-transform:uppercase;margin-bottom:2px;}.tenant-col strong{display:block;font-size:12px;color:#0F172A;}.section-title{font-size:12px;font-weight:700;color:#10B981;border-bottom:1px solid #E2E8F0;padding-bottom:6px;margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px;}.kpi-grid{display:flex;gap:10px;margin-bottom:20px;}.kpi-card{flex:1;background:#F8FAFC;border:1px solid #E2E8F0;padding:12px;border-radius:6px;text-align:center;}.kpi-card span{display:block;font-size:9px;color:#64748B;text-transform:uppercase;margin-bottom:4px;}.kpi-card strong{display:block;font-size:16px;color:#0F172A;}.kpi-card.highlight{background:#10B981;color:white;border-color:#10B981;}.kpi-card.highlight span,.kpi-card.highlight strong{color:white;}.row{display:flex;gap:20px;margin-bottom:20px;}.col{flex:1;}.efficiency-box{border:1px solid #E2E8F0;padding:16px;border-radius:6px;text-align:center;height:100%;}.eff-score{font-size:28px;font-weight:bold;color:${effStatusColor};margin:10px 0;}.eff-bar-bg{background:#E2E8F0;height:8px;border-radius:4px;margin-top:10px;overflow:hidden;}.eff-bar-fill{background:${effStatusColor};height:100%;width:${efficiencyPct}%;}.comp-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}.comp-item{background:#F8FAFC;padding:10px;border-radius:4px;border:1px solid #E2E8F0;}.comp-item span{font-size:9px;color:#64748B;display:block;}.comp-item strong{font-size:13px;color:#0F172A;display:block;margin-top:2px;}.comp-item.diff strong{color:${compData.energyPctChange > 0 ? '#EF4444' : '#10B981'};}.insight-list{list-style:none;padding-left:0;margin-bottom:0;}.insight-list li{background:#F0FDF4;border-left:3px solid #10B981;padding:8px 12px;margin-bottom:8px;font-size:11px;color:#0F172A;}.rec-box{background:#FEF3C7;border:1px solid #FCD34D;padding:12px;border-radius:6px;color:#92400E;font-size:11px;font-weight:500;}table{width:100%;border-collapse:collapse;margin-bottom:20px;}th{background:#F1F5F9;color:#475569;padding:8px;text-align:left;font-size:9px;text-transform:uppercase;border-bottom:2px solid #E2E8F0;}td{padding:8px;border-bottom:1px solid #E2E8F0;font-size:11px;}tr:nth-child(even) td{background:#FAFAF9;}.status-badge{padding:2px 6px;border-radius:12px;font-size:9px;font-weight:bold;text-transform:uppercase;}.status-badge.normal{background:#E0F2FE;color:#0369A1;}.status-badge.high{background:#FEE2E2;color:#B91C1C;}.status-badge.low{background:#DCFCE7;color:#15803D;}.footer{text-align:center;border-top:1px solid #E2E8F0;padding-top:15px;color:#64748B;font-size:9px;line-height:1.5;}.footer strong{color:#0F172A;display:block;margin-bottom:4px;font-size:10px;}</style></head><body><div class="report-container"><div class="header"><div class="company"><h1>⚡ WATTIPID</h1><p>SMART ELECTRICITY MONITORING</p></div><div class="report-title-box"><h2>${reportType}</h2><p>Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}</p></div></div><div class="tenant-info"><div class="tenant-col"><span>Tenant Name</span><strong>${user?.name || 'Tenant'}</strong></div><div class="tenant-col"><span>Room Number</span><strong>${roomId}</strong></div><div class="tenant-col"><span>Reporting Period</span><strong>${dateRange}</strong></div><div class="tenant-col" style="text-align:right;"><span>Current Rate</span><strong>₱${rate.toFixed(2)} / kWh</strong></div></div><div class="section-title">Executive Summary</div><div class="kpi-grid"><div class="kpi-card highlight"><span>Total Energy Consumed</span><strong>${repTotalEnergy.toFixed(3)} kWh</strong></div><div class="kpi-card"><span>Estimated Cost</span><strong>₱${repTotalCost.toFixed(2)}</strong></div><div class="kpi-card"><span>Daily Average</span><strong>${(repTotalEnergy / Math.max(filteredHistory.length, 1)).toFixed(3)} kWh/day</strong></div><div class="kpi-card"><span>Average Power Load</span><strong>${repAvgPower.toFixed(1)} W</strong></div></div><div class="row"><div class="col"><div class="section-title">Energy Efficiency Score</div><div class="efficiency-box"><div style="font-size:10px;color:#64748B;text-transform:uppercase;">Consumption Rating</div><div class="eff-score">${efficiencyScore}</div><div style="font-size:11px;color:#475569;">Performance relative to baseline</div><div class="eff-bar-bg"><div class="eff-bar-fill"></div></div></div></div><div class="col"><div class="section-title">Historical Comparison</div><div class="comp-grid"><div class="comp-item"><span>Current Period</span><strong>${compData.current.totalEnergy.toFixed(3)} kWh</strong></div><div class="comp-item"><span>Previous Period</span><strong>${compData.previous.totalEnergy.toFixed(3)} kWh</strong></div><div class="comp-item diff"><span>Difference</span><strong>${compData.energyPctChange > 0 ? '↑' : '↓'} ${Math.abs(compData.energyPctChange).toFixed(1)}%</strong></div><div class="comp-item"><span>Cost Difference</span><strong>${compData.costDiff > 0 ? '+' : ''}₱${compData.costDiff.toFixed(2)}</strong></div></div></div></div><div class="section-title">Wattipid Smart Insights</div><ul class="insight-list">${pdfInsights.map(i => `<li>${i}</li>`).join('')}</ul><div style="margin-top:15px;margin-bottom:20px;"><div class="rec-box"><strong>RECOMMENDATION:</strong> ${pdfRecommendation}</div></div><div class="section-title">Detailed Consumption Breakdown</div><table><thead><tr><th>Date</th><th>Energy (kWh)</th><th>Est. Cost</th><th>Avg Load</th><th>Status</th><th>Contribution</th></tr></thead><tbody>${breakdownRows || '<tr><td colspan="6" style="text-align:center;">No data available for this period.</td></tr>'}</tbody></table><div class="footer"><strong>DISCLAIMER</strong>This report is intended for electricity consumption monitoring and analytics purposes only.<br>It is NOT an official billing statement, invoice, or statement of account.<br>Actual billing information can be viewed separately within the Wattipid Billing Module.<div style="margin-top:10px;opacity:0.7;">This is a computer-generated report. No signature required.<br>Generated by Wattipid Smart Electricity Monitoring System.</div></div></div></body></html>`;
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: reportType });
    } catch (err) {
      showModal({ type: 'error', title: 'Error', message: 'Failed to generate report: ' + err.message });
    } finally {
      setGeneratingPdf(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={{ marginBottom: 16 }}>
          <Text style={s.title}>Consumption Analytics</Text>
          <Text style={s.subtitle}>Power consumption report</Text>
        </View>

        {/* ── Period Tabs ─────────────────────────────────────────────────────── */}
        <View style={s.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity key={p} onPress={() => setPeriod(p)}
              style={[s.periodBtn, period === p && s.periodActive]} activeOpacity={0.7}>
              <Text style={[s.periodText, period === p && s.periodTextActive]}>
                {p === 'daily' ? 'DAY' : p === 'weekly' ? 'WEEK' : p === 'monthly' ? 'MONTH' : 'YEAR'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Date Navigation ─────────────────────────────────────────────────── */}
        <View style={s.dateNav}>
          <TouchableOpacity style={s.dateNavBtn} onPress={() => navigateDate(-1)} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={s.dateNavCenter}>
            <Text style={s.dateNavTitle}>{getDateLabel()}</Text>
            <Text style={s.dateNavSub}>
              Total consumption: {totalEnergy.toFixed(3)} kWh
            </Text>
          </View>
          <TouchableOpacity style={s.dateNavBtn} onPress={() => navigateDate(1)} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── Summary Cards ───────────────────────────────────────────────────── */}
        <View style={s.summaryGrid}>
          <GlassCard style={s.summaryCard}>
            <View style={[s.summaryCardIcon, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
              <Ionicons name="trending-up" size={16} color={COLORS.danger} />
            </View>
            <Text style={s.summaryCardLabel}>Peak Power</Text>
            <Text style={s.summaryCardValue} numberOfLines={1} adjustsFontSizeToFit>{peakPower.toFixed(0)} W</Text>
          </GlassCard>

          <GlassCard style={s.summaryCard}>
            <View style={[s.summaryCardIcon, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
              <Ionicons name="analytics" size={16} color={COLORS.info} />
            </View>
            <Text style={s.summaryCardLabel}>Average</Text>
            <Text style={s.summaryCardValue} numberOfLines={1} adjustsFontSizeToFit>{avgEnergy.toFixed(3)} kWh</Text>
            {comparison && comparison.energyPctChange !== 0 && (
              <Text style={[s.summaryCardTrend, { color: comparison.energyPctChange > 0 ? COLORS.danger : COLORS.success }]}>
                {comparison.energyPctChange > 0 ? '↑' : '↓'} {Math.abs(comparison.energyPctChange).toFixed(1)}%
              </Text>
            )}
          </GlassCard>
        </View>

        {/* ── View Toggle ─────────────────────────────────────────────────────── */}
        <View style={{ marginBottom: SPACING.lg }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.viewToggle}>
            {VIEW_TABS.map(tab => (
              <TouchableOpacity key={tab.key} onPress={() => { setActiveView(tab.key); setHistoryLimit(20); }}
                style={[s.viewTab, activeView === tab.key && s.viewTabActive]} activeOpacity={0.7}>
                <Ionicons name={tab.icon} size={16} color={activeView === tab.key ? COLORS.primary : COLORS.textMuted} />
                <Text style={[s.viewTabText, activeView === tab.key && s.viewTabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── Charts View ─────────────────────────────────────────────────────── */}
        {activeView === 'charts' && (
          <>
            {/* Bar Chart */}
            <GlassCard style={s.chartCard}>
              <View style={s.chartHeader}>
                <Text style={s.chartTitle}>Electricity Consumption</Text>
                <Text style={s.chartUnit}>{period === 'daily' ? 'Wh' : 'kWh'}</Text>
              </View>

              {energyData.length > 0 ? (
                <WattipidBarChart
                  labels={labels}
                  data={energyData}
                  comparisonData={comparisonChartData}
                  unit={period === 'daily' ? 'Wh' : 'kWh'}
                  height={230}
                  currentIndex={currentIndex}
                  lowlightIndex={lowestIndex}
                  accentColor={COLORS.primary}
                />
              ) : (
                <Text style={s.noData}>No consumption data available yet</Text>
              )}

              {/* Bottom Stats */}
              {comparison && (
                <View style={s.bottomStats}>
                  <View>
                    <Text style={s.bottomStatLabel}>
                      Consumption for the {period === 'daily' ? 'day' : period === 'weekly' ? 'week' : period === 'monthly' ? 'month' : 'year'}
                    </Text>
                    <Text style={s.bottomStatValue}>{totalEnergy.toFixed(3)} kWh</Text>
                  </View>
                  {comparison.energyPctChange !== 0 && (
                    <View style={s.bottomStatDiff}>
                      <Ionicons
                        name={comparison.energyPctChange > 0 ? 'arrow-up' : 'arrow-down'}
                        size={14}
                        color={comparison.energyPctChange > 0 ? COLORS.danger : COLORS.success}
                      />
                      <Text style={[s.bottomStatDiffText, { color: comparison.energyPctChange > 0 ? COLORS.danger : COLORS.success }]}>
                        {comparison.energyPctChange > 0 ? '+' : ''}{comparison.energyPctChange.toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </GlassCard>

            <Text style={s.disclaimer}>
              Power consumption is approximate and may differ from the actual value.
            </Text>

            {/* Insights */}
            {insights.length > 0 && (
              <GlassCard style={s.insightCard}>
                <View style={s.insightHeader}>
                  <Ionicons name="bulb" size={20} color={COLORS.warning} />
                  <Text style={s.insightTitle}>Smart Insights</Text>
                </View>
                {insights.map((text, i) => (
                  <View key={i} style={s.insightItem}>
                    <View style={s.insightDot} />
                    <Text style={s.insightText}>{text}</Text>
                  </View>
                ))}
              </GlassCard>
            )}

            {/* Recommendations */}
            <GlassCard style={s.recCard}>
              <View style={s.recHeader}>
                <Ionicons name="shield-checkmark" size={18} color={COLORS.warning} />
                <Text style={s.recTitle}>Recommendation</Text>
              </View>
              <Text style={s.recText}>{recommendation}</Text>
            </GlassCard>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── Breakdown View ──────────────────────────────────────────────────── */}
        {activeView === 'breakdown' && (
          <>
            {breakdown.length > 0 && (
              <GlassCard style={s.breakdownCard}>
                <View style={s.breakdownHeader}>
                  <Ionicons name="calendar" size={18} color={COLORS.primary} />
                  <Text style={s.breakdownTitle}>
                    {period === 'monthly' ? 'Monthly' : (period === 'weekly' ? 'Weekly' : period === 'yearly' ? 'Yearly' : 'Daily')} Breakdown
                  </Text>
                </View>
                <Text style={s.breakdownDesc}>Detailed consumption metrics</Text>
                <View style={s.tableHeader}>
                  <Text style={[s.tableHeaderCell, s.colDate]}>Date</Text>
                  <Text style={[s.tableHeaderCell, s.colKwh]}>kWh</Text>
                  <Text style={[s.tableHeaderCell, s.colWatts]}>Watts</Text>
                  <Text style={[s.tableHeaderCell, s.colCost, { color: COLORS.primary }]}>Cost</Text>
                  <Text style={[s.tableHeaderCell, s.colReads]}>Read</Text>
                </View>
                {breakdown.map((row, i) => (
                  <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
                    <Text style={[s.tableCell, s.colDate]} numberOfLines={1}>{formatDate(row.day || row.timestamp)}</Text>
                    <Text style={[s.tableCell, s.colKwh]} numberOfLines={1}>{Number(row.totalEnergy || row.energy || 0).toFixed(3)}</Text>
                    <Text style={[s.tableCell, s.colWatts]} numberOfLines={1}>{(row.avgPower || 0).toFixed(0)}</Text>
                    <Text style={[s.tableCellHighlight, s.colCost]} numberOfLines={1}>₱{Number(row.totalCost || row.cost || 0).toFixed(2)}</Text>
                    <Text style={[s.tableCell, s.colReads]} numberOfLines={1}>{row.entries || row.entryCount || '-'}</Text>
                  </View>
                ))}
                <View style={s.tableTotalRow}>
                  <Text style={[s.tableTotalCell, s.colDate]}>TOTAL</Text>
                  <Text style={[s.tableTotalCell, s.colKwh]} numberOfLines={1}>{breakdown.reduce((a, r) => a + (Number(r.totalEnergy || r.energy || 0)), 0).toFixed(3)}</Text>
                  <Text style={[s.tableTotalCell, s.colWatts]} numberOfLines={1}>{(breakdown.reduce((a, r) => a + (Number(r.avgPower || 0)), 0) / Math.max(breakdown.length, 1)).toFixed(0)}</Text>
                  <Text style={[s.tableTotalCell, s.colCost, { color: COLORS.primary }]} numberOfLines={1}>₱{breakdown.reduce((a, r) => a + (Number(r.totalCost || r.cost || 0)), 0).toFixed(2)}</Text>
                  <Text style={[s.tableTotalCell, s.colReads]} numberOfLines={1}>{breakdown.reduce((a, r) => a + (Number(r.entries || r.entryCount || 0)), 0)}</Text>
                </View>
              </GlassCard>
            )}

            {hourlyBreakdown.length > 0 && period === 'daily' && (
              <GlassCard style={s.breakdownCard}>
                <View style={s.breakdownHeader}>
                  <Ionicons name="time" size={18} color={COLORS.accent} />
                  <Text style={s.breakdownTitle}>Hourly Breakdown (24h)</Text>
                </View>
                <Text style={s.breakdownDesc}>Consumption per hour today (00:00–23:59)</Text>
                <View style={s.tableHeader}>
                  <Text style={[s.tableHeaderCell, s.colDate]}>Hour</Text>
                  <Text style={[s.tableHeaderCell, s.colKwh]}>kWh</Text>
                  <Text style={[s.tableHeaderCell, s.colWatts]}>Watts</Text>
                  <Text style={[s.tableHeaderCell, s.colCost, { color: COLORS.primary }]}>Cost</Text>
                  <Text style={[s.tableHeaderCell, s.colReads]}></Text>
                </View>
                {hourlyBreakdown.map((row, i) => (
                  <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
                    <Text style={[s.tableCell, s.colDate]} numberOfLines={1}>{String(row.hour).padStart(2,'0')}:00</Text>
                    <Text style={[s.tableCell, s.colKwh]} numberOfLines={1}>{(parseFloat(row.totalEnergy || row.energy || 0)).toFixed(3)}</Text>
                    <Text style={[s.tableCell, s.colWatts]} numberOfLines={1}>{(parseFloat(row.avgPower || 0)).toFixed(0)}</Text>
                    <Text style={[s.tableCellHighlight, s.colCost]} numberOfLines={1}>₱{(parseFloat(row.totalCost || row.cost || 0)).toFixed(2)}</Text>
                    <Text style={[s.tableCell, s.colReads]}></Text>
                  </View>
                ))}
                <View style={s.tableTotalRow}>
                  <Text style={[s.tableTotalCell, s.colDate]}>TOTAL</Text>
                  <Text style={[s.tableTotalCell, s.colKwh]} numberOfLines={1}>{hourlyBreakdown.reduce((a, r) => a + (Number(r.totalEnergy || r.energy || 0)), 0).toFixed(3)}</Text>
                  <Text style={[s.tableTotalCell, s.colWatts]} numberOfLines={1}>{(hourlyBreakdown.reduce((a, r) => a + (Number(r.avgPower || 0)), 0) / Math.max(hourlyBreakdown.length, 1)).toFixed(0)}</Text>
                  <Text style={[s.tableTotalCell, s.colCost, { color: COLORS.primary }]} numberOfLines={1}>₱{hourlyBreakdown.reduce((a, r) => a + (Number(r.totalCost || r.cost || 0)), 0).toFixed(2)}</Text>
                  <Text style={[s.tableTotalCell, s.colReads]}></Text>
                </View>
              </GlassCard>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── History View ────────────────────────────────────────────────────── */}
        {activeView === 'history' && (
          <View style={s.historySection}>
            <View style={s.filterHeader}>
              <Text style={s.filterTitle}>History Logs</Text>
              <TouchableOpacity style={s.filterDropdown} onPress={() => setShowHistoryModal(true)} activeOpacity={0.7}>
                <Text style={s.filterDropdownText}>{historyTitle}</Text>
                <Ionicons name="calendar-outline" size={16} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

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
                          style={{ padding: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)', marginTop: 10, borderRadius: RADIUS.md }}>
                          <Text style={{ color: COLORS.primary, fontWeight: 'bold' }}>Load 20 More Logs</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </ScrollView>
                </View>
              ))
            ) : (
              <GlassCard style={s.emptyHist}>
                <Ionicons name="analytics-outline" size={36} color={COLORS.textMuted} />
                <Text style={s.emptyHistText}>No history logs found</Text>
              </GlassCard>
            )}
          </View>
        )}

        {/* ── History Date Filter Modal ───────────────────────────────────────── */}
        <BaseModal visible={showHistoryModal} onClose={() => setShowHistoryModal(false)}>
          <ModalHeader title="Filter History" icon="calendar" iconColor={COLORS.primary} onClose={() => setShowHistoryModal(false)} />
          <ModalBody scrollable={true}>
            <Text style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 12 }}>Select a predefined range or pick custom dates to filter logs.</Text>

            <TouchableOpacity style={{ padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.md, marginBottom: 8, borderWidth: 1, borderColor: historyTitle === 'Active Billing Cycle' ? COLORS.primary : 'rgba(255,255,255,0.05)' }}
              onPress={() => {
                if (availableCycles.length > 0) {
                  setHistoryStartDate(new Date(availableCycles[0].cycle_start));
                  setHistoryEndDate(new Date(availableCycles[0].cycle_end));
                  setHistoryTitle('Active Billing Cycle');
                }
                setShowHistoryModal(false);
              }}>
              <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold' }}>Active Billing Cycle</Text>
              {availableCycles.length > 0 && <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4 }}>{new Date(availableCycles[0].cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric' })} – {new Date(availableCycles[0].cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric' })}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={{ padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.md, marginBottom: 8, borderWidth: 1, borderColor: historyTitle === 'Previous Billing Cycle' ? COLORS.primary : 'rgba(255,255,255,0.05)' }}
              onPress={() => {
                if (availableCycles.length > 1) {
                  setHistoryStartDate(new Date(availableCycles[1].cycle_start));
                  setHistoryEndDate(new Date(availableCycles[1].cycle_end));
                  setHistoryTitle('Previous Billing Cycle');
                } else { showModal({ type: 'warning', title: 'Not Available', message: 'No previous billing cycle found.' }); }
                setShowHistoryModal(false);
              }}>
              <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold' }}>Previous Billing Cycle</Text>
              {availableCycles.length > 1 && <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4 }}>{new Date(availableCycles[1].cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric' })} – {new Date(availableCycles[1].cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric' })}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={{ padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.md, marginBottom: 16, borderWidth: 1, borderColor: historyTitle === 'Today' ? COLORS.primary : 'rgba(255,255,255,0.05)' }}
              onPress={() => {
                const today = new Date();
                setHistoryStartDate(today); setHistoryEndDate(today); setHistoryTitle('Today');
                setShowHistoryModal(false);
              }}>
              <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold' }}>Today</Text>
            </TouchableOpacity>

            <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold', marginBottom: 12 }}>Custom Date Range</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 4 }}>Start Date</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                  <TouchableOpacity onPress={() => { const d = new Date(customStart); d.setDate(d.getDate()-1); setCustomStart(d); }} style={{ padding: 10 }}><Ionicons name="chevron-back" size={16} color={COLORS.primary}/></TouchableOpacity>
                  <Text style={{ flex: 1, textAlign: 'center', color: COLORS.textPrimary, fontSize: 13 }}>{customStart.toLocaleDateString('default', { month: 'short', day: 'numeric' })}</Text>
                  <TouchableOpacity onPress={() => { const d = new Date(customStart); d.setDate(d.getDate()+1); setCustomStart(d); }} style={{ padding: 10 }}><Ionicons name="chevron-forward" size={16} color={COLORS.primary}/></TouchableOpacity>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 4 }}>End Date</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                  <TouchableOpacity onPress={() => { const d = new Date(customEnd); d.setDate(d.getDate()-1); setCustomEnd(d); }} style={{ padding: 10 }}><Ionicons name="chevron-back" size={16} color={COLORS.primary}/></TouchableOpacity>
                  <Text style={{ flex: 1, textAlign: 'center', color: COLORS.textPrimary, fontSize: 13 }}>{customEnd.toLocaleDateString('default', { month: 'short', day: 'numeric' })}</Text>
                  <TouchableOpacity onPress={() => { const d = new Date(customEnd); d.setDate(d.getDate()+1); setCustomEnd(d); }} style={{ padding: 10 }}><Ionicons name="chevron-forward" size={16} color={COLORS.primary}/></TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity style={{ backgroundColor: COLORS.primary, padding: 14, borderRadius: RADIUS.md, alignItems: 'center', marginTop: 16 }}
              onPress={() => {
                if (customStart > customEnd) { showModal({ type: 'error', title: 'Invalid Range', message: 'Start date cannot be after end date.' }); return; }
                setHistoryStartDate(customStart); setHistoryEndDate(customEnd);
                setHistoryTitle(`${customStart.toLocaleDateString('default', { month: 'short', day: 'numeric' })} – ${customEnd.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`);
                setShowHistoryModal(false);
              }}>
              <Text style={{ color: '#000', fontWeight: 'bold' }}>Apply Custom Range</Text>
            </TouchableOpacity>
          </ModalBody>
        </BaseModal>

        {/* ── PDF Report ──────────────────────────────────────────────────────── */}
        <GlassCard style={s.reportCard}>
          <View style={s.reportHeader}>
            <Ionicons name="document-text" size={18} color={COLORS.info} />
            <Text style={s.reportTitle}>Generate Report</Text>
          </View>
          <Text style={s.reportDesc}>Export a detailed PDF analytics report for the currently viewed {period} period.</Text>
          <View style={{ marginTop: 12 }}>
            <TouchableOpacity
              style={{ backgroundColor: COLORS.info, padding: 14, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginTop: 8, flexDirection: 'row', gap: 8 }}
              onPress={() => generateReport()} disabled={generatingPdf} activeOpacity={0.7}>
              {generatingPdf ? <ActivityIndicator size="small" color="#fff" /> : (
                <><Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Download {period.charAt(0).toUpperCase() + period.slice(1)} Report</Text></>
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>

      </ScrollView>
    </View>
  );
}
