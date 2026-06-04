import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../contexts/AuthContext';
import { getConsumptionHistory, getConsumptionComparison, getDailyBreakdown, getHourlyBreakdown, getTransactionHistory, getTotalConsumptionToday, getTotalConsumptionWeek, getTotalConsumptionMonth, getAvailableBillingCycles, getSetting, getPaymentInsights } from '../../services/database';
import { getMonthlyForecast } from '../../services/notificationApi';
import { generateConsumptionReport } from '../../services/reportService';
import { BaseModal, ModalHeader, ModalBody, ModalFooter } from '../../components/modals/BaseModal';
import GlassCard from '../../components/ui/GlassCard';
import { COLORS, SPACING, RADIUS } from '@/styles/theme';
import s from '@/styles/tenant/analytics.styles';

const screenWidth = Dimensions.get('window').width - SPACING.lg * 2;
const PERIODS = ['daily', 'weekly', 'monthly'];

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('weekly');
  const [availableCycles, setAvailableCycles] = useState([]);
  const [selectedPdfCycle, setSelectedPdfCycle] = useState(null);
  const [selectedPdfWeek, setSelectedPdfWeek] = useState(null);
  const [showPdfCycleDrop, setShowPdfCycleDrop] = useState(false);
  const [showPdfWeekDrop, setShowPdfWeekDrop] = useState(false);
  const [historyStartDate, setHistoryStartDate] = useState(null);
  const [historyEndDate, setHistoryEndDate] = useState(null);
  const [historyTitle, setHistoryTitle] = useState('Active Billing Cycle');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());
  const [historyFilter, setHistoryFilter] = useState('minute');
  const [history, setHistory] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [todayUsage, setTodayUsage] = useState({ totalEnergy: 0, totalCost: 0 });
  const [weekUsage, setWeekUsage] = useState({ totalEnergy: 0, totalCost: 0 });
  const [monthUsage, setMonthUsage] = useState({ totalEnergy: 0, totalCost: 0 });
  const [transactions, setTransactions] = useState([]);
  const [hourlyBreakdown, setHourlyBreakdown] = useState([]);
  const [activeView, setActiveView] = useState('charts'); // 'charts' | 'history' | 'breakdown'
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [rate, setRate] = useState(12.50);
  const [forecast, setForecast] = useState(null);
  const [paymentInsights, setPaymentInsights] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(20);
  const roomId = user?.room_id || 'Room 1';

  const loadStatsData = useCallback(async () => {
    if (!user || !roomId) return;
    const tenantName = user?.name;
    const [data, comp, today, week, month, cyclesData, fetchedRateStr] = await Promise.all([
      getConsumptionHistory(roomId, period, tenantName),
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
      
      // Initialize History Range to Active Cycle if not set
      if (!historyStartDate) {
        setHistoryStartDate(new Date(cyclesData[0].cycle_start));
        setHistoryEndDate(new Date(cyclesData[0].cycle_end));
      }
    }
    
    // Force perfect UI alignment for the user's dashboard view across all arrays
    const alignedData = (data || []).map(item => ({
      ...item,
      cost: (item.energy || item.totalEnergy || 0) * fetchedRate,
      totalCost: (item.totalEnergy || item.energy || 0) * fetchedRate
    }));

    setHistory(alignedData);
    setComparison(comp);
    setTodayUsage({ ...today, totalCost: (today?.totalEnergy || 0) * fetchedRate });
    setWeekUsage({ ...week, totalCost: (week?.totalEnergy || 0) * fetchedRate });
    setMonthUsage({ ...month, totalCost: (month?.totalEnergy || 0) * fetchedRate });

    try {
      const forecastData = await getMonthlyForecast(roomId, tenantName);
      setForecast(forecastData);
    } catch (e) {}

    if (period === 'daily') {
      const hourly = await getHourlyBreakdown(roomId, tenantName);
      const alignedHourly = (hourly || []).map(item => ({
        ...item,
        cost: (item.energy || item.totalEnergy || 0) * fetchedRate,
        totalCost: (item.totalEnergy || item.energy || 0) * fetchedRate
      }));
      setHourlyBreakdown(alignedHourly);
      setBreakdown([]);
    } else {
      const dailyBreakdown = [...alignedData].reverse();
      setBreakdown(dailyBreakdown);
      setHourlyBreakdown([]);
    }
    
    try {
        const pInsights = await getPaymentInsights(roomId);
        if (pInsights?.data) {
             setPaymentInsights(pInsights.data);
        }
    } catch (e) { console.warn("Failed to load payment insights", e); }
    
    setSelectedPoint(null);
  }, [roomId, period]);

  const loadHistoryData = useCallback(async () => {
    if (!user || !roomId) return;
    const tenantName = user?.name;
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const startStr = historyStartDate ? historyStartDate.toISOString().split('T')[0] : null;
    const endStr = historyEndDate ? historyEndDate.toISOString().split('T')[0] : null;
    const txns = await getTransactionHistory(roomId, 500, historyFilter, tenantName, 0, startStr, endStr);
    setTransactions(txns || []);
  }, [roomId, historyFilter, selectedDate]);

  useEffect(() => { 
    loadStatsData(); 
    const interval = setInterval(() => {
      loadStatsData();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadStatsData]);

  useEffect(() => {
    loadHistoryData();
    const interval = setInterval(() => {
      loadHistoryData();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadHistoryData]);

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    if (newDate <= new Date()) setSelectedDate(newDate);
  };

  const chartConfig = {
    backgroundGradientFrom: 'transparent', backgroundGradientTo: 'transparent',
    color: (o = 1) => `rgba(34, 197, 94, ${o})`,
    labelColor: () => COLORS.textMuted, strokeWidth: 2,
    decimalPlaces: 1,
    propsForBackgroundLines: { strokeDasharray: '', stroke: COLORS.border, strokeWidth: 0.5 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary },
    useShadowColorFromDataset: false,
  };

  const labels = history.length > 0 ? history.map((h, i) => {
    if (period === 'daily') return h.label || `${String(i).padStart(2, '0')}:00`;
    if (period === 'weekly') {
      if (h.label !== undefined && h.label !== null) {
        return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][parseInt(h.label)] || 'Day';
      }
      return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i % 7];
    }
    return `D${h.day || h.label || (i + 1)}`;
  }) : ['No Data'];

  const energyData = history.length > 0 ? history.map(h => h.energy || 0) : [0];
  const costData = history.length > 0 ? history.map(h => h.cost || 0) : [0];
  const chartWidth = Math.max(screenWidth - SPACING.xl, labels.length * 45);

  const handleDataPointClick = (data) => {
    const { index } = data;
    if (history.length === 0 || !history[index]) return;
    const pointHistory = history[index];
    setSelectedPoint({
      label: labels[index],
      energy: energyData[index],
      cost: costData[index],
      avgPower: pointHistory.avgPower || 0,
      peakPower: pointHistory.peakPower || 0,
    });
  };
  const totalEnergy = energyData.reduce((a, b) => a + b, 0);
  const totalCost = totalEnergy * rate; // Force perfectly aligned math instead of summing historical rounded costs
  const avgPower = history.length > 0 ? history.reduce((a, h) => a + (h.avgPower || 0), 0) / history.length : 0;
  const peakPower = Math.max(...history.map(h => h.peakPower || 0), 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  };

  const VIEW_TABS = [
    { key: 'charts', icon: 'bar-chart-outline', label: 'Charts' },
    { key: 'breakdown', icon: 'list-outline', label: 'Breakdown' },
    { key: 'history', icon: 'receipt-outline', label: 'History' },
    { key: 'payments', icon: 'wallet-outline', label: 'Payments' },
  ];

  // ─── PDF Report Generation ──────────────────────────────────────────────────
  const generateReport = async () => {
    setGeneratingPdf(true);
    try {
      if (!selectedPdfCycle) return;
      
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
      
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];
      
      // Fetch data for the specific range
      const [fetchedHistory, fetchedComp] = await Promise.all([
        getTransactionHistory(roomId, 300, 'daily', user?.name, 0, startStr, endStr),
        getConsumptionComparison(roomId, selectedPdfWeek ? 'weekly' : 'monthly', user?.name)
      ]);
      
      // The API returns grouped data: [{ title: '...', data: [{...}] }]
      const flattenedHistory = (fetchedHistory || []).reduce((acc, group) => {
        if (group.data && Array.isArray(group.data)) {
          return acc.concat(group.data);
        }
        return acc;
      }, []);

      // Normalize boundaries to prevent excluding the first/last days due to time constraints
      const startBoundary = new Date(startDate);
      startBoundary.setHours(0, 0, 0, 0);
      const endBoundary = new Date(endDate);
      endBoundary.setHours(23, 59, 59, 999);

      // Filter the history precisely to the selected range (already filtered by backend but just in case)
      const filteredHistory = flattenedHistory.filter(h => {
        const d = new Date(h.group_date || h.day || h.timestamp);
        return d >= startBoundary && d <= endBoundary;
      });
      
      const now = new Date();
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const dateRange = `${months[startDate.getMonth()]} ${startDate.getDate()} – ${months[endDate.getMonth()]} ${endDate.getDate()}, ${endDate.getFullYear()}`;
      
      const compData = fetchedComp || { current: { totalEnergy: 0, totalCost: 0 }, previous: { totalEnergy: 0, totalCost: 0 }, costPctChange: 0, energyPctChange: 0, costDiff: 0 };
      
      const repTotalEnergy = filteredHistory.reduce((a, b) => a + (Number(b.totalEnergy || b.energy) || 0), 0);
      const repTotalCost = repTotalEnergy * rate;
      const repAvgPower = filteredHistory.length > 0 ? filteredHistory.reduce((a, h) => a + (Number(h.avgPower) || 0), 0) / filteredHistory.length : 0;
      const repPeakPower = Math.max(...filteredHistory.map(h => Number(h.peakPower) || 0), 0);
      
      const breakdownRows = filteredHistory.map(r =>
        `<tr><td>${formatDate(r.group_date || r.day || r.timestamp)}</td><td>${(parseFloat(r.totalEnergy || r.energy || 0)).toFixed(3)} kWh</td><td>₱${(parseFloat(r.totalCost || r.cost || 0)).toFixed(2)}</td><td>${(parseFloat(r.avgPower || 0)).toFixed(1)}W</td></tr>`
      ).join('');

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1E293B; padding: 40px; font-size: 13px; background: #fff; line-height: 1.5; }
    .bill-container { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #22C55E; padding-bottom: 20px; margin-bottom: 30px; }
    .company h1 { color: #16A34A; font-size: 28px; letter-spacing: 1px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
    .company p { color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .statement-badge { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px 20px; border-radius: 6px; text-align: right; }
    .statement-badge .title { font-weight: 700; color: #0F172A; font-size: 16px; margin-bottom: 4px; text-transform: uppercase; }
    .statement-badge .date { color: #64748B; font-size: 12px; }
    
    .customer-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .bill-to h3 { font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .bill-to h2 { font-size: 20px; color: #0F172A; margin-bottom: 4px; }
    .bill-to p { color: #475569; font-size: 14px; }
    .account-details table { width: 100%; border-collapse: collapse; }
    .account-details td { padding: 4px 0; }
    .account-details td:first-child { color: #64748B; font-size: 12px; padding-right: 24px; text-align: right; }
    .account-details td:last-child { color: #0F172A; font-weight: 600; font-size: 13px; text-align: right; }
    
    .summary-section { margin-bottom: 40px; }
    .section-title { font-size: 14px; font-weight: 700; color: #0F172A; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; display: flex; overflow: hidden; }
    .amount-due { background: #22C55E; color: white; padding: 24px; flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .amount-due span { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; margin-bottom: 4px; }
    .amount-due h2 { font-size: 32px; font-weight: 700; }
    .usage-stats { flex: 2; padding: 24px; display: flex; gap: 32px; align-items: center; }
    .stat-item { flex: 1; }
    .stat-item span { display: block; font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .stat-item strong { display: block; font-size: 18px; color: #0F172A; }
    
    .comparison-grid { display: flex; gap: 16px; margin-bottom: 40px; }
    .comp-card { flex: 1; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; text-align: center; }
    .comp-card .label { font-size: 11px; color: #64748B; text-transform: uppercase; margin-bottom: 8px; }
    .comp-card .value { font-size: 16px; font-weight: 600; color: #0F172A; }
    .comp-card.diff { background: ${compData.costDiff > 0 ? '#FEF2F2' : '#F0FDF4'}; border-color: ${compData.costDiff > 0 ? '#FECACA' : '#BBF7D0'}; }
    .comp-card.diff .value { color: ${compData.costDiff > 0 ? '#DC2626' : '#16A34A'}; }
    
    table.breakdown { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
    table.breakdown th { background: #F1F5F9; color: #475569; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E2E8F0; }
    table.breakdown td { padding: 12px; border-bottom: 1px solid #E2E8F0; color: #0F172A; font-size: 13px; }
    table.breakdown tr:nth-child(even) td { background: #FAFAF9; }
    
    .footer { text-align: center; border-top: 1px solid #E2E8F0; padding-top: 24px; color: #94A3B8; font-size: 11px; }
  </style>
</head>
<body>
<div class="bill-container">
  <div class="header">
    <div class="company">
      <h1>⚡ Wattipid</h1>
      <p>Electricity Statement of Account</p>
    </div>
    <div class="statement-badge">
      <div class="title">${reportTitle}</div>
      <div class="date">${dateRange}</div>
    </div>
  </div>

  <div class="customer-section">
    <div class="bill-to">
      <h3>Bill To</h3>
      <h2>${user?.name || 'Tenant'}</h2>
      <p>Room: ${roomId}</p>
    </div>
    <div class="account-details">
      <table>
        <tr><td>Statement Date:</td><td>${now.toLocaleDateString()}</td></tr>
        <tr><td>Report Type:</td><td>${selectedPdfWeek ? 'Weekly' : 'Monthly'} Analytics</td></tr>
      </table>
    </div>
  </div>

  <div class="summary-section">
    <div class="section-title">Account Summary</div>
    <div class="summary-box">
      <div class="amount-due">
        <span>Total Cost</span>
        <h2>₱${repTotalCost.toFixed(2)}</h2>
      </div>
      <div class="usage-stats">
        <div class="stat-item">
          <span>Energy Consumed</span>
          <strong>${repTotalEnergy.toFixed(3)} kWh</strong>
        </div>
        <div class="stat-item">
          <span>Avg Power Load</span>
          <strong>${repAvgPower.toFixed(1)} W</strong>
        </div>
        <div class="stat-item">
          <span>Rate per kWh</span>
          <strong>₱${rate.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  </div>

  <div class="summary-section">
    <div class="section-title">Comparison vs Previous ${selectedPdfWeek ? 'Week' : 'Month'}</div>
    <div class="comparison-grid">
      <div class="comp-card">
        <div class="label">Current ${selectedPdfWeek ? 'Week' : 'Month'}</div>
        <div class="value">₱${compData.current.totalCost.toFixed(2)}</div>
      </div>
      <div class="comp-card">
        <div class="label">Previous ${selectedPdfWeek ? 'Week' : 'Month'}</div>
        <div class="value">₱${compData.previous.totalCost.toFixed(2)}</div>
      </div>
      <div class="comp-card diff">
        <div class="label">Difference</div>
        <div class="value">${compData.costDiff > 0 ? '+' : ''}₱${compData.costDiff.toFixed(2)}</div>
      </div>
    </div>
  </div>

  ${filteredHistory.length > 0 ? `
  <div class="summary-section">
    <div class="section-title">Daily Breakdown</div>
    <table class="breakdown">
      <thead><tr><th>Date</th><th>Energy</th><th>Cost</th><th>Avg Power</th></tr></thead>
      <tbody>${breakdownRows}</tbody>
    </table>
  </div>` : ''}

  <div class="footer">
    This is a computer-generated document. No signature is required.<br>
    Generated by Wattipid System • ${now.toLocaleDateString()} ${now.toLocaleTimeString()}
  </div>
</div>
</body>
</html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Wattipid ${reportTitle}` });
    } catch (err) {
      Alert.alert('Error', 'Failed to generate report: ' + err.message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Backend now handles the heavy lifting and returns exactly {title, data} arrays

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: 20 }}>
          <Text style={s.title}>Analytics</Text>
          <Text style={s.subtitle}>Analyze your consumption patterns</Text>
        </View>

        {/* Period Selector */}
        <View style={s.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity key={p} onPress={() => setPeriod(p)}
              style={[s.periodBtn, period === p && s.periodActive]} activeOpacity={0.7}>
              <Text style={[s.periodText, period === p && s.periodTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ textAlign: 'center', fontSize: 11, color: COLORS.textMuted, marginBottom: 16, marginTop: -10 }}>
          <Ionicons name="information-circle-outline" size={12} color={COLORS.textMuted} /> Analytics are calculated only from the active billing cycle.
        </Text>

        {/* Summary Stats */}
        <View style={s.statsRow}>
          <GlassCard style={s.statCard}>
            <Ionicons name="flash" size={18} color={COLORS.primary} />
            <Text style={s.statValue}>{Number(totalEnergy || 0).toFixed(2)}</Text>
            <Text style={s.statLabel}>{period === 'daily' ? 'Daily kWh' : period === 'weekly' ? 'Weekly kWh' : 'Monthly kWh'}</Text>
          </GlassCard>
          <GlassCard style={s.statCard}>
            <Ionicons name="cash" size={18} color={COLORS.warning} />
            <Text style={s.statValue}>₱{Number(totalCost || 0).toFixed(2)}</Text>
            <Text style={s.statLabel}>{period === 'daily' ? 'Daily Cost' : period === 'weekly' ? 'Weekly Cost' : 'Monthly Cost'}</Text>
          </GlassCard>
          <GlassCard style={s.statCard}>
            <Ionicons name="trending-up" size={18} color={COLORS.danger} />
            <Text style={s.statValue}>{Number(peakPower || 0).toFixed(0)}</Text>
            <Text style={s.statLabel}>Peak W</Text>
          </GlassCard>
        </View>

        {/* Comparison Banner */}
        {comparison && comparison.costPctChange !== 0 && (
          <GlassCard style={s.compBanner}>
            <View style={s.compBannerRow}>
              <View style={[s.compIcon, { backgroundColor: (comparison.costPctChange || 0) >= 0 ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)' }]}>
                <Ionicons name={(comparison.costPctChange || 0) >= 0 ? 'trending-up' : 'trending-down'} size={20}
                  color={(comparison.costPctChange || 0) >= 0 ? COLORS.danger : COLORS.success} />
              </View>
              <View style={s.compBannerContent}>
                <Text style={[s.compBannerTitle, { color: (comparison.costPctChange || 0) >= 0 ? COLORS.danger : COLORS.success }]}>
                  {(comparison.costPctChange || 0) > 0 ? '+' : ''}{Number(comparison.costPctChange || 0).toFixed(1)}% { (comparison.costPctChange || 0) >= 0 ? 'Higher' : 'Lower' }
                </Text>
                <Text style={s.compBannerSub}>
                  vs previous {period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'} (₱{Number(comparison.previous?.totalCost || 0).toFixed(2)} → ₱{Number(comparison.current?.totalCost || 0).toFixed(2)})
                </Text>
              </View>
            </View>
            <View style={s.compDetails}>
              <View style={s.compDetailItem}>
                <Text style={s.compDetailLabel}>Energy Change</Text>
                <Text style={[s.compDetailVal, { color: (comparison.energyPctChange || 0) >= 0 ? COLORS.danger : COLORS.success }]}>
                  {(comparison.energyPctChange || 0) > 0 ? '+' : ''}{Number(comparison.energyPctChange || 0).toFixed(1)}%
                </Text>
              </View>
              <View style={s.compDetailDivider} />
              <View style={s.compDetailItem}>
                <Text style={s.compDetailLabel}>Cost Difference</Text>
                <Text style={[s.compDetailVal, { color: (comparison.costDiff || 0) >= 0 ? COLORS.danger : COLORS.success }]}>
                  {(comparison.costDiff || 0) > 0 ? '+' : ''}₱{Number(comparison.costDiff || 0).toFixed(2)}
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* View Toggle */}
        <View style={s.viewToggle}>
          {VIEW_TABS.map(tab => (
            <TouchableOpacity key={tab.key} onPress={() => { setActiveView(tab.key); setHistoryLimit(20); }}
              style={[s.viewTab, activeView === tab.key && s.viewTabActive]} activeOpacity={0.7}>
              <Ionicons name={tab.icon} size={16} color={activeView === tab.key ? COLORS.primary : COLORS.textMuted} />
              <Text style={[s.viewTabText, activeView === tab.key && s.viewTabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>


        {/* PDF Report Generation */}
        <GlassCard style={s.reportCard}>
          <View style={s.reportHeader}>
            <Ionicons name="document-text" size={18} color={COLORS.info} />
            <Text style={s.reportTitle}>Generate Report</Text>
          </View>
          <Text style={s.reportDesc}>Export consumption data as a PDF report</Text>
          <View style={{ marginTop: 12 }}>
            <Text style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 8 }}>Select Billing Cycle</Text>
            <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} onPress={() => setShowPdfCycleDrop(!showPdfCycleDrop)}>
              <Text style={{ color: COLORS.textPrimary }}>
                {selectedPdfCycle ? `${new Date(selectedPdfCycle.cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(selectedPdfCycle.cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Loading...'}
              </Text>
              <Ionicons name={showPdfCycleDrop ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.primary} />
            </TouchableOpacity>

            {showPdfCycleDrop && availableCycles.length > 0 && (
              <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', maxHeight: 150, overflow: 'hidden' }}>
                <ScrollView nestedScrollEnabled>
                  {availableCycles.map((c, i) => (
                    <TouchableOpacity key={i} style={{ padding: 12, borderBottomWidth: i !== availableCycles.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }} 
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
                <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 12, marginBottom: 8 }}>Select Week (Optional)</Text>
                <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} onPress={() => setShowPdfWeekDrop(!showPdfWeekDrop)}>
                  <Text style={{ color: COLORS.textPrimary }}>
                    {selectedPdfWeek ? `${selectedPdfWeek.label} (${new Date(selectedPdfWeek.start).toLocaleDateString('default', { month: 'short', day: 'numeric' })} – ${new Date(selectedPdfWeek.end).toLocaleDateString('default', { month: 'short', day: 'numeric' })})` : 'Entire Billing Cycle'}
                  </Text>
                  <Ionicons name={showPdfWeekDrop ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.primary} />
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
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md, marginTop: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                      <TouchableOpacity style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }} 
                        onPress={() => { setSelectedPdfWeek(null); setShowPdfWeekDrop(false); }}>
                        <Text style={{ color: !selectedPdfWeek ? COLORS.primary : COLORS.textPrimary, fontWeight: !selectedPdfWeek ? 'bold' : 'normal' }}>Entire Billing Cycle</Text>
                      </TouchableOpacity>
                      {weeks.map((week, i) => (
                        <TouchableOpacity key={i} style={{ padding: 12, borderBottomWidth: i !== weeks.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }} 
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

            <TouchableOpacity style={{ backgroundColor: COLORS.info, padding: 14, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', marginTop: 16, flexDirection: 'row', gap: 8 }} onPress={() => generateReport()} disabled={generatingPdf || !selectedPdfCycle} activeOpacity={0.7}>
              {generatingPdf ? <ActivityIndicator size="small" color="#fff" /> : (
                <><Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Download PDF Report</Text></>
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Charts View */}
        {activeView === 'charts' && (
          <>
            {/* Interactive Data Detail Card */}
            {selectedPoint && (
              <GlassCard style={s.selectedPointCard}>
                <View style={s.selectedHeader}>
                  <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                  <Text style={s.selectedTitle}>{period === 'daily' ? 'Time' : period === 'weekly' ? 'Day' : 'Date'}: {selectedPoint.label}</Text>
                  <TouchableOpacity onPress={() => setSelectedPoint(null)} style={s.closeSelectedBtn}>
                    <Ionicons name="close" size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={s.selectedGrid}>
                  <View style={s.selectedItem}>
                    <Text style={s.selectedItemLabel}>Energy</Text>
                    <Text style={[s.selectedItemValue, { color: COLORS.primary }]}>{selectedPoint.energy.toFixed(3)} kWh</Text>
                  </View>
                  <View style={s.selectedDivider} />
                  <View style={s.selectedItem}>
                    <Text style={s.selectedItemLabel}>Cost</Text>
                    <Text style={[s.selectedItemValue, { color: COLORS.warning }]}>₱{selectedPoint.cost.toFixed(2)}</Text>
                  </View>
                  <View style={s.selectedDivider} />
                  <View style={s.selectedItem}>
                    <Text style={s.selectedItemLabel}>Avg Power</Text>
                    <Text style={s.selectedItemValue}>{selectedPoint.avgPower.toFixed(0)} W</Text>
                  </View>
                </View>
              </GlassCard>
            )}

            <GlassCard style={s.chartCard}>
              <Text style={s.chartTitle}>Energy Consumption (kWh)</Text>
              <Text style={s.chartHelpText}>Tap on points to view details</Text>
              {history.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chartScroll}>
                  <LineChart 
                    data={{ labels: labels, datasets: [{ data: energyData }] }}
                    width={chartWidth} 
                    height={220} 
                    chartConfig={chartConfig}
                    bezier 
                    style={s.chart} 
                    withInnerLines={false} 
                    withOuterLines={false}
                    fromZero 
                    yAxisSuffix="" 
                    onDataPointClick={handleDataPointClick}
                  />
                </ScrollView>
              ) : (
                <Text style={s.noData}>No data available yet</Text>
              )}
            </GlassCard>

            <GlassCard style={s.chartCard}>
              <Text style={s.chartTitle}>Cost Breakdown (₱)</Text>
              <Text style={s.chartHelpText}>Tap on bars to view details</Text>
              {history.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chartScroll}>
                  <BarChart 
                    data={{ labels: labels, datasets: [{ data: costData }] }}
                    width={chartWidth} 
                    height={220}
                    chartConfig={{ ...chartConfig, color: (o = 1) => `rgba(249, 115, 22, ${o})` }}
                    style={s.chart} 
                    withInnerLines={false} 
                    fromZero 
                    yAxisSuffix="" 
                    yAxisLabel="₱" 
                    showBarTops={false}
                  />
                </ScrollView>
              ) : (
                <Text style={s.noData}>No data available yet</Text>
              )}
            </GlassCard>

            {/* Insights */}
            <GlassCard style={s.insightCard}>
              <View style={s.insightHeader}>
                <Ionicons name="bulb" size={20} color={COLORS.warning} />
                <Text style={s.insightTitle}>Insights</Text>
              </View>
              <Text style={s.insightText}>
                • Average power draw: {avgPower.toFixed(0)}W{'\n'}
                • Peak recorded: {peakPower.toFixed(0)}W{'\n'}
                • Estimated monthly cost: ₱{(totalCost * (30 / Math.max(history.length, 1))).toFixed(2)}
              </Text>
            </GlassCard>
          </>
        )}

        {/* Breakdown View - Detailed Computation */}
        {activeView === 'breakdown' && (
          <>


            {/* Daily Breakdown Table */}
            {breakdown.length > 0 && (
              <GlassCard style={s.breakdownCard}>
                <View style={s.breakdownHeader}>
                  <Ionicons name="calendar" size={18} color={COLORS.primary} />
                  <Text style={s.breakdownTitle}>{period === 'monthly' ? 'Monthly' : (period === 'weekly' ? 'Weekly' : 'Daily')} Breakdown</Text>
                </View>
                <Text style={s.breakdownDesc}>Detailed daily consumption metrics</Text>
                {/* Table Header */}
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
                {/* Totals Row */}
                <View style={s.tableTotalRow}>
                  <Text style={[s.tableTotalCell, s.colDate]}>TOTAL</Text>
                  <Text style={[s.tableTotalCell, s.colKwh]} numberOfLines={1}>{breakdown.reduce((a, r) => a + (Number(r.totalEnergy || r.energy || 0)), 0).toFixed(3)}</Text>
                  <Text style={[s.tableTotalCell, s.colWatts]} numberOfLines={1}>{(breakdown.reduce((a, r) => a + (Number(r.avgPower || 0)), 0) / Math.max(breakdown.length, 1)).toFixed(0)}</Text>
                  <Text style={[s.tableTotalCell, s.colCost, { color: COLORS.primary }]} numberOfLines={1}>₱{breakdown.reduce((a, r) => a + (Number(r.totalCost || r.cost || 0)), 0).toFixed(2)}</Text>
                  <Text style={[s.tableTotalCell, s.colReads]} numberOfLines={1}>{breakdown.reduce((a, r) => a + (Number(r.entries || r.entryCount || 0)), 0)}</Text>
                </View>
              </GlassCard>
            )}

            {/* Hourly Breakdown (for Daily view) */}
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
                    <Text style={[s.tableCell, s.colDate]} numberOfLines={1}>{String(row.hour).padStart(2, '0')}:00</Text>
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

        {/* Table-based History System */}
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
                          style={{ padding: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)', marginTop: 10, borderRadius: RADIUS.md }}
                        >
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
      
      {/* History Date Filter Modal */}
      <BaseModal visible={showHistoryModal} onClose={() => setShowHistoryModal(false)}>
        <ModalHeader title="Filter History" icon="calendar" iconColor={COLORS.primary} onClose={() => setShowHistoryModal(false)} />
        <ModalBody scrollable={true}>
          <Text style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 12 }}>Select a predefined range or pick custom dates to filter logs.</Text>
          
          <TouchableOpacity style={{ padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.md, marginBottom: 8, borderWidth: 1, borderColor: historyTitle === 'Active Billing Cycle' ? COLORS.primary : 'rgba(255,255,255,0.05)' }}
            onPress={() => {
              if(availableCycles.length > 0) {
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
              if(availableCycles.length > 1) {
                setHistoryStartDate(new Date(availableCycles[1].cycle_start));
                setHistoryEndDate(new Date(availableCycles[1].cycle_end));
                setHistoryTitle('Previous Billing Cycle');
              } else {
                Alert.alert('Not Available', 'No previous billing cycle found.');
              }
              setShowHistoryModal(false);
            }}>
            <Text style={{ color: COLORS.textPrimary, fontWeight: 'bold' }}>Previous Billing Cycle</Text>
            {availableCycles.length > 1 && <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4 }}>{new Date(availableCycles[1].cycle_start).toLocaleDateString('default', { month: 'short', day: 'numeric' })} – {new Date(availableCycles[1].cycle_end).toLocaleDateString('default', { month: 'short', day: 'numeric' })}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={{ padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.md, marginBottom: 16, borderWidth: 1, borderColor: historyTitle === 'Today' ? COLORS.primary : 'rgba(255,255,255,0.05)' }}
            onPress={() => {
              const today = new Date();
              setHistoryStartDate(today);
              setHistoryEndDate(today);
              setHistoryTitle('Today');
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
              if (customStart > customEnd) {
                Alert.alert('Invalid Range', 'Start date cannot be after end date.');
                return;
              }
              setHistoryStartDate(customStart);
              setHistoryEndDate(customEnd);
              setHistoryTitle(`${customStart.toLocaleDateString('default', { month: 'short', day: 'numeric' })} – ${customEnd.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`);
              setShowHistoryModal(false);
            }}>
            <Text style={{ color: '#000', fontWeight: 'bold' }}>Apply Custom Range</Text>
          </TouchableOpacity>
        </ModalBody>
      </BaseModal>
      </ScrollView>
    </View>
  );
}
