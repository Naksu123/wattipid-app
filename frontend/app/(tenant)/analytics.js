import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../contexts/AuthContext';
import { getConsumptionHistory, getConsumptionComparison, getDailyBreakdown, getHourlyBreakdown, getTransactionHistory, getTotalConsumptionToday, getTotalConsumptionWeek, getTotalConsumptionMonth, getSetting } from '../../services/database';
import { getMonthlyForecast } from '../../services/notificationApi';
import { generateConsumptionReport } from '../../services/reportService';
import GlassCard from '../../components/ui/GlassCard';
import { COLORS, SPACING, RADIUS } from '@/styles/theme';
import s from '@/styles/tenant/analytics.styles';

const screenWidth = Dimensions.get('window').width - SPACING.lg * 2;
const PERIODS = ['daily', 'weekly', 'monthly'];

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('weekly');
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
  const [rate, setRate] = useState(12.5);
  const [forecast, setForecast] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [historyLimit, setHistoryLimit] = useState(20);
  const roomId = user?.room_id || 'Room 1';

  const loadStatsData = useCallback(async () => {
    if (!user || !roomId) return;
    const tenantName = user?.name;
    const [data, comp, today, week, month, rateVal] = await Promise.all([
      getConsumptionHistory(roomId, period, tenantName),
      getConsumptionComparison(roomId, period, tenantName),
      getTotalConsumptionToday(roomId, tenantName),
      getTotalConsumptionWeek(roomId, tenantName),
      getTotalConsumptionMonth(roomId, tenantName),
      getSetting('rate_per_kwh')
    ]);
    
    setHistory(data || []);
    setComparison(comp);
    setTodayUsage(today);
    setWeekUsage(week);
    setMonthUsage(month);
    if (rateVal) setRate(parseFloat(rateVal));

    try {
      const forecastData = await getMonthlyForecast(roomId, tenantName);
      setForecast(forecastData);
    } catch (e) {}

    if (period === 'daily') {
      const hourly = await getHourlyBreakdown(roomId, tenantName);
      setHourlyBreakdown(hourly || []);
      setBreakdown([]);
    } else {
      const dailyBreakdown = [...(data || [])].reverse();
      setBreakdown(dailyBreakdown);
      setHourlyBreakdown([]);
    }
    
    setSelectedPoint(null);
  }, [roomId, period]);

  const loadHistoryData = useCallback(async () => {
    if (!user || !roomId) return;
    const tenantName = user?.name;
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const txns = await getTransactionHistory(roomId, 500, historyFilter, tenantName, 0, historyFilter === 'minute' ? dateStr : null);
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
  const totalCost = costData.reduce((a, b) => a + b, 0);
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
  ];

  // ─── PDF Report Generation ──────────────────────────────────────────────────
  const generateReport = async (reportType) => {
    setGeneratingPdf(true);
    try {
      const now = new Date();
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      let dateRange = '';
      let reportTitle = '';

      if (reportType === 'weekly') {
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(now);
        monday.setDate(now.getDate() - diffToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        dateRange = `${months[monday.getMonth()]} ${monday.getDate()} – ${months[sunday.getMonth()]} ${sunday.getDate()}, ${sunday.getFullYear()}`;
        reportTitle = 'Weekly Consumption Report';
      } else {
        dateRange = `${months[now.getMonth()]} 1 – ${now.getDate()}, ${now.getFullYear()}`;
        reportTitle = 'Monthly Consumption Report';
      }

      const compData = comparison || { current: { totalEnergy: 0, totalCost: 0 }, previous: { totalEnergy: 0, totalCost: 0 }, costPctChange: 0, energyPctChange: 0, costDiff: 0 };
      const breakdownRows = breakdown.slice(0, 31).map(r =>
        `<tr><td>${formatDate(r.day)}</td><td>${(parseFloat(r.totalEnergy || r.energy || 0)).toFixed(3)} kWh</td><td>₱${(parseFloat(r.totalCost || r.cost || 0)).toFixed(2)}</td><td>${(parseFloat(r.avgPower || 0)).toFixed(1)}W</td></tr>`
      ).join('');

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
        <style>
          body{font-family:system-ui,sans-serif;color:#1e293b;padding:32px;max-width:700px;margin:0 auto}
          h1{color:#16a34a;font-size:24px;margin-bottom:4px}
          .subtitle{color:#64748b;font-size:13px;margin-bottom:24px}
          .card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px}
          .card h3{margin:0 0 8px;font-size:15px;color:#334155}
          .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9}
          .row:last-child{border:none}
          .label{color:#64748b;font-size:13px}
          .value{font-weight:600;font-size:14px}
          .up{color:#ef4444} .down{color:#22c55e}
          table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
          th{background:#f1f5f9;padding:8px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px}
          td{padding:6px 8px;border-bottom:1px solid #f1f5f9}
          .footer{text-align:center;color:#94a3b8;font-size:11px;margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0}
        </style></head><body>
        <h1>⚡ ${reportTitle}</h1>
        <p class="subtitle">Room: ${roomId} • ${dateRange}</p>

        <div class="card"><h3>Total Consumption</h3>
          <div class="row"><span class="label">Energy Used</span><span class="value">${totalEnergy.toFixed(3)} kWh</span></div>
          <div class="row"><span class="label">Total Cost</span><span class="value">₱${totalCost.toFixed(2)}</span></div>
          <div class="row"><span class="label">Average Power</span><span class="value">${avgPower.toFixed(1)} W</span></div>
          <div class="row"><span class="label">Peak Power</span><span class="value">${peakPower.toFixed(0)} W</span></div>
        </div>

        <div class="card"><h3>Comparison vs Previous ${reportType === 'weekly' ? 'Week' : 'Month'}</h3>
          <div class="row"><span class="label">Previous Cost</span><span class="value">₱${compData.previous.totalCost.toFixed(2)}</span></div>
          <div class="row"><span class="label">Current Cost</span><span class="value">₱${compData.current.totalCost.toFixed(2)}</span></div>
          <div class="row"><span class="label">Difference</span><span class="value ${compData.costDiff > 0 ? 'up' : 'down'}">${compData.costDiff > 0 ? '+' : ''}₱${compData.costDiff.toFixed(2)} (${compData.costPctChange > 0 ? '+' : ''}${compData.costPctChange.toFixed(1)}%)</span></div>
          <div class="row"><span class="label">Energy Change</span><span class="value ${compData.energyPctChange > 0 ? 'up' : 'down'}">${compData.energyPctChange > 0 ? '+' : ''}${compData.energyPctChange.toFixed(1)}%</span></div>
        </div>

        ${breakdown.length > 0 ? `<div class="card"><h3>Daily Breakdown</h3>
          <table><thead><tr><th>Date</th><th>Energy</th><th>Cost</th><th>Avg Power</th></tr></thead>
          <tbody>${breakdownRows}</tbody></table></div>` : ''}

        <div class="footer">Generated by Wattipid • ${now.toLocaleDateString()} ${now.toLocaleTimeString()}</div>
      </body></html>`;

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
              <View style={[s.compIcon, { backgroundColor: (comparison.costPctChange || 0) >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }]}>
                <Ionicons name={(comparison.costPctChange || 0) >= 0 ? 'trending-up' : 'trending-down'} size={20}
                  color={(comparison.costPctChange || 0) >= 0 ? COLORS.success : COLORS.danger} />
              </View>
              <View style={s.compBannerContent}>
                <Text style={[s.compBannerTitle, { color: (comparison.costPctChange || 0) >= 0 ? COLORS.success : COLORS.danger }]}>
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
                <Text style={[s.compDetailVal, { color: (comparison.energyPctChange || 0) >= 0 ? COLORS.success : COLORS.danger }]}>
                  {(comparison.energyPctChange || 0) > 0 ? '+' : ''}{Number(comparison.energyPctChange || 0).toFixed(1)}%
                </Text>
              </View>
              <View style={s.compDetailDivider} />
              <View style={s.compDetailItem}>
                <Text style={s.compDetailLabel}>Cost Difference</Text>
                <Text style={[s.compDetailVal, { color: (comparison.costDiff || 0) >= 0 ? COLORS.success : COLORS.danger }]}>
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

        {/* Monthly Forecast Card */}
        {forecast && forecast.projected_monthly_cost > 0 && (
          <GlassCard style={[s.insightCard, { borderLeftWidth: 3, borderLeftColor: 
            forecast.risk_level === 'critical' ? COLORS.danger : 
            forecast.risk_level === 'high' ? COLORS.warning : 
            forecast.risk_level === 'medium' ? COLORS.accent : COLORS.primary }]}>
            <View style={s.insightHeader}>
              <Ionicons name="analytics" size={20} color={COLORS.info} />
              <Text style={s.insightTitle}>Monthly Forecast</Text>
              <View style={[s.periodBtn, { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: 
                forecast.risk_level === 'critical' ? 'rgba(239,68,68,0.15)' : 
                forecast.risk_level === 'high' ? 'rgba(245,158,11,0.15)' : 
                forecast.risk_level === 'medium' ? 'rgba(249,115,22,0.15)' : 'rgba(34,197,94,0.15)' }]}>
                <Text style={[s.periodText, { fontSize: 11, color: 
                  forecast.risk_level === 'critical' ? COLORS.danger : 
                  forecast.risk_level === 'high' ? COLORS.warning : 
                  forecast.risk_level === 'medium' ? COLORS.accent : COLORS.primary }]}>
                  {forecast.risk_level.toUpperCase()} RISK
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 12 }}>
              <View style={s.compDetails}>
                <View style={s.compDetailItem}>
                  <Text style={s.compDetailLabel}>Projected Bill</Text>
                  <Text style={[s.compDetailVal, { color: forecast.risk_level === 'critical' || forecast.risk_level === 'high' ? COLORS.danger : COLORS.primary, fontSize: 18 }]}>
                    ₱{Number(forecast.projected_monthly_cost || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={s.compDetailDivider} />
                <View style={s.compDetailItem}>
                  <Text style={s.compDetailLabel}>Budget</Text>
                  <Text style={[s.compDetailVal, { fontSize: 18 }]}>
                    ₱{Number(forecast.monthly_budget || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={[s.compDetails, { marginTop: 8 }]}>
                <View style={s.compDetailItem}>
                  <Text style={s.compDetailLabel}>Trend</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name={forecast.trend === 'increasing' ? 'arrow-up' : forecast.trend === 'decreasing' ? 'arrow-down' : 'remove'} 
                      size={14} color={forecast.trend === 'increasing' ? COLORS.danger : forecast.trend === 'decreasing' ? COLORS.success : COLORS.textMuted} />
                    <Text style={[s.compDetailVal, { color: forecast.trend === 'increasing' ? COLORS.danger : forecast.trend === 'decreasing' ? COLORS.success : COLORS.textMuted }]}>
                      {forecast.trend} ({forecast.trend_pct > 0 ? '+' : ''}{Number(forecast.trend_pct || 0).toFixed(1)}%)
                    </Text>
                  </View>
                </View>
                <View style={s.compDetailDivider} />
                <View style={s.compDetailItem}>
                  <Text style={s.compDetailLabel}>Daily Target</Text>
                  <Text style={[s.compDetailVal, { color: COLORS.primary }]}>
                    ₱{Number(forecast.daily_budget_to_stay_on_track || 0).toFixed(2)}/day
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 }}>
                <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} />
                <Text style={{ fontSize: 11, color: COLORS.textMuted }}>
                  {forecast.days_remaining} days left • Confidence: {forecast.confidence} • Day {forecast.days_elapsed}/{forecast.days_in_month}
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* PDF Report Generation */}
        <GlassCard style={s.reportCard}>
          <View style={s.reportHeader}>
            <Ionicons name="document-text" size={18} color={COLORS.info} />
            <Text style={s.reportTitle}>Generate Report</Text>
          </View>
          <Text style={s.reportDesc}>Export consumption data as a PDF report</Text>
          <View style={s.reportBtns}>
            <TouchableOpacity style={s.reportBtn} onPress={() => generateReport('weekly')} disabled={generatingPdf} activeOpacity={0.7}>
              {generatingPdf ? <ActivityIndicator size="small" color={COLORS.info} /> : (
                <><Ionicons name="calendar-outline" size={14} color={COLORS.info} />
                <Text style={s.reportBtnText}>Weekly</Text></>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={s.reportBtn} onPress={() => generateReport('monthly')} disabled={generatingPdf} activeOpacity={0.7}>
              {generatingPdf ? <ActivityIndicator size="small" color={COLORS.info} /> : (
                <><Ionicons name="albums-outline" size={14} color={COLORS.info} />
                <Text style={s.reportBtnText}>Monthly</Text></>
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
              <TouchableOpacity style={s.filterDropdown} onPress={() => setShowFilter(!showFilter)} activeOpacity={0.7}>
                <Text style={s.filterDropdownText}>
                  {historyFilter === 'minute' ? 'Every Minute' : historyFilter === 'daily' ? 'Daily' : historyFilter === 'weekly' ? 'Weekly' : 'Monthly'}
                </Text>
                <Ionicons name={showFilter ? "chevron-up" : "chevron-down"} size={16} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {historyFilter === 'minute' && (
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: RADIUS.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'}}>
                <TouchableOpacity onPress={() => changeDate(-1)} style={{padding: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.md}}>
                  <Ionicons name="chevron-back" size={20} color={COLORS.primary}/>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.md}}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.textPrimary}/>
                  <Text style={{color: COLORS.textPrimary, fontSize: 14, fontWeight: 'bold'}}>
                    {`${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => changeDate(1)} style={{padding: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.md}} disabled={selectedDate >= new Date(new Date().setHours(0,0,0,0))}>
                  <Ionicons name="chevron-forward" size={20} color={selectedDate >= new Date(new Date().setHours(0,0,0,0)) ? 'rgba(255,255,255,0.2)' : COLORS.primary}/>
                </TouchableOpacity>
              </View>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setSelectedDate(date);
                }}
              />
            )}

            {showFilter && (
              <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg, padding: 8, marginBottom: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                {['minute', 'daily', 'weekly', 'monthly'].map(f => (
                  <TouchableOpacity key={f} style={{ padding: 12, borderBottomWidth: f !== 'monthly' ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.05)' }} onPress={() => { setHistoryFilter(f); setShowFilter(false); setHistoryLimit(20); }}>
                    <Text style={{ color: historyFilter === f ? COLORS.primary : COLORS.textPrimary, fontWeight: historyFilter === f ? 'bold' : 'normal', fontSize: 15 }}>
                      {f === 'minute' ? 'Every Minute (Real-time)' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

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
      </ScrollView>
    </View>
  );
}
