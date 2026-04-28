import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../contexts/AuthContext';
import { getConsumptionHistory, getConsumptionComparison, getDailyBreakdown, getHourlyBreakdown, getTransactionHistory, getTotalConsumptionToday, getTotalConsumptionWeek, getTotalConsumptionMonth } from '../../services/database';
import GlassCard from '../../components/GlassCard';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../constants/theme';

const screenWidth = Dimensions.get('window').width - SPACING.lg * 2;
const PERIODS = ['daily', 'weekly', 'monthly'];

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('weekly');
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
  const roomId = user?.room_id || 'Room 1';

  const loadData = useCallback(async () => {
    if (!user || !roomId) return;
    const tenantName = user?.name;
    const [data, comp, today, week, month, txns] = await Promise.all([
      getConsumptionHistory(roomId, period, tenantName),
      getConsumptionComparison(roomId, period, tenantName),
      getTotalConsumptionToday(roomId, tenantName),
      getTotalConsumptionWeek(roomId, tenantName),
      getTotalConsumptionMonth(roomId, tenantName),
      getTransactionHistory(roomId, 50, period, tenantName),
    ]);
    
    setHistory(data || []);
    setComparison(comp);
    setTodayUsage(today);
    setWeekUsage(week);
    setMonthUsage(month);
    setTransactions(txns || []);

    // Load breakdown based on period
    if (period === 'daily') {
      const hourly = await getHourlyBreakdown(roomId, tenantName);
      setHourlyBreakdown(hourly || []);
      setBreakdown([]);
    } else {
      // Use the history data (which is already grouped by day for weekly/monthly)
      const dailyBreakdown = [...(data || [])].reverse();
      setBreakdown(dailyBreakdown);
      setHourlyBreakdown([]);
    }
    
    // Clear selection when period changes
    setSelectedPoint(null);
  }, [roomId, period]);

  useEffect(() => { loadData(); }, [loadData]);

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
        `<tr><td>${formatDate(r.day)}</td><td>${r.totalEnergy.toFixed(3)} kWh</td><td>₱${r.totalCost.toFixed(2)}</td><td>${(r.avgPower || 0).toFixed(1)}W</td></tr>`
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

  // Group transactions by date
  const groupedTxns = transactions.reduce((acc, tx) => {
    const date = tx.date_label || '';
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {});

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Analytics</Text>
        <Text style={s.subtitle}>Detailed consumption insights & history</Text>

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
            <Text style={s.statLabel}>kWh Total</Text>
          </GlassCard>
          <GlassCard style={s.statCard}>
            <Ionicons name="cash" size={18} color={COLORS.warning} />
            <Text style={s.statValue}>₱{Number(totalCost || 0).toFixed(2)}</Text>
            <Text style={s.statLabel}>Total Cost</Text>
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
              <View style={[s.compIcon, { backgroundColor: comparison.costPctChange > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)' }]}>
                <Ionicons name={comparison.costPctChange > 0 ? 'trending-up' : 'trending-down'} size={20}
                  color={comparison.costPctChange > 0 ? COLORS.danger : COLORS.primary} />
              </View>
              <View style={s.compBannerContent}>
                <Text style={s.compBannerTitle}>
                  {Math.abs(Number(comparison.costPctChange || 0)).toFixed(1)}% {comparison.costPctChange > 0 ? 'Higher' : 'Lower'}
                </Text>
                <Text style={s.compBannerSub}>
                  vs previous {period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'} (₱{Number(comparison.previous?.totalCost || 0).toFixed(2)} → ₱{Number(comparison.current?.totalCost || 0).toFixed(2)})
                </Text>
              </View>
            </View>
            <View style={s.compDetails}>
              <View style={s.compDetailItem}>
                <Text style={s.compDetailLabel}>Energy Change</Text>
                <Text style={[s.compDetailVal, { color: (comparison.energyPctChange || 0) > 0 ? COLORS.danger : COLORS.primary }]}>
                  {(comparison.energyPctChange || 0) > 0 ? '+' : ''}{Number(comparison.energyPctChange || 0).toFixed(1)}%
                </Text>
              </View>
              <View style={s.compDetailDivider} />
              <View style={s.compDetailItem}>
                <Text style={s.compDetailLabel}>Cost Difference</Text>
                <Text style={[s.compDetailVal, { color: (comparison.costDiff || 0) > 0 ? COLORS.danger : COLORS.primary }]}>
                  {(comparison.costDiff || 0) > 0 ? '+' : ''}₱{Number(comparison.costDiff || 0).toFixed(2)}
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* View Toggle */}
        <View style={s.viewToggle}>
          {VIEW_TABS.map(tab => (
            <TouchableOpacity key={tab.key} onPress={() => setActiveView(tab.key)}
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
            {/* Period Totals */}
            <GlassCard style={s.totalsCard}>
              <Text style={s.totalsTitle}>Consumption Totals</Text>
              <Text style={s.totalsDesc}>How your totals are computed from individual readings</Text>
              <View style={s.totalsGrid}>
                {[
                  { label: 'Today', energy: todayUsage.totalEnergy, cost: todayUsage.totalCost, icon: 'today-outline', color: COLORS.info },
                  { label: 'This Week', energy: weekUsage.totalEnergy, cost: weekUsage.totalCost, icon: 'calendar-outline', color: COLORS.accent },
                  { label: 'This Month', energy: monthUsage.totalEnergy, cost: monthUsage.totalCost, icon: 'albums-outline', color: COLORS.primary },
                ].map((item, i) => (
                  <View key={i} style={s.totalItem}>
                    <View style={[s.totalIcon, { backgroundColor: `${item.color}15` }]}>
                      <Ionicons name={item.icon} size={18} color={item.color} />
                    </View>
                    <Text style={s.totalLabel}>{item.label}</Text>
                    <Text style={s.totalEnergy}>{Number(item.energy || 0).toFixed(4)} kWh</Text>
                    <Text style={s.totalCost}>₱{Number(item.cost || 0).toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            {/* Daily Breakdown Table */}
            {breakdown.length > 0 && (
              <GlassCard style={s.breakdownCard}>
                <View style={s.breakdownHeader}>
                  <Ionicons name="calendar" size={18} color={COLORS.primary} />
                  <Text style={s.breakdownTitle}>Daily Breakdown</Text>
                </View>
                <Text style={s.breakdownDesc}>Sum of all readings per day this month</Text>
                {/* Table Header */}
                <View style={s.tableHeader}>
                  <Text style={[s.tableHeaderCell, { flex: 1.3 }]}>Date</Text>
                  <Text style={[s.tableHeaderCell, { flex: 1 }]}>kWh</Text>
                  <Text style={[s.tableHeaderCell, { flex: 0.8 }]}>Watts</Text>
                  <Text style={[s.tableHeaderCell, { flex: 1 }]}>Cost</Text>
                  <Text style={[s.tableHeaderCell, { flex: 0.5 }]}>Reads</Text>
                </View>
                {breakdown.map((row, i) => (
                  <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
                    <Text style={[s.tableCell, { flex: 1.3 }]}>{formatDate(row.day || row.timestamp)}</Text>
                    <Text style={[s.tableCell, { flex: 1 }]}>{Number(row.totalEnergy || row.energy || 0).toFixed(4)}</Text>
                    <Text style={[s.tableCell, { flex: 0.8 }]}>{(row.avgPower || 0).toFixed(2)}</Text>
                    <Text style={[s.tableCellHighlight, { flex: 1 }]}>₱{Number(row.totalCost || row.cost || 0).toFixed(2)}</Text>
                    <Text style={[s.tableCell, { flex: 0.5, textAlign: 'center' }]}>{row.entries || row.entryCount || '-'}</Text>
                  </View>
                ))}
                {/* Totals Row */}
                <View style={s.tableTotalRow}>
                  <Text style={[s.tableTotalCell, { flex: 1.3 }]}>TOTAL</Text>
                  <Text style={[s.tableTotalCell, { flex: 1 }]}>{breakdown.reduce((a, r) => a + (Number(r.totalEnergy || r.energy || 0)), 0).toFixed(4)}</Text>
                  <Text style={[s.tableTotalCell, { flex: 0.8 }]}>{(breakdown.reduce((a, r) => a + (Number(r.avgPower || 0)), 0) / Math.max(breakdown.length, 1)).toFixed(2)}</Text>
                  <Text style={[s.tableTotalCell, { flex: 1, color: COLORS.primary }]}>₱{breakdown.reduce((a, r) => a + (Number(r.totalCost || r.cost || 0)), 0).toFixed(2)}</Text>
                  <Text style={[s.tableTotalCell, { flex: 0.5, textAlign: 'center' }]}>{breakdown.reduce((a, r) => a + (Number(r.entries || r.entryCount || 0)), 0)}</Text>
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
                  <Text style={[s.tableHeaderCell, { flex: 1 }]}>Hour</Text>
                  <Text style={[s.tableHeaderCell, { flex: 1 }]}>kWh</Text>
                  <Text style={[s.tableHeaderCell, { flex: 1 }]}>Watts</Text>
                  <Text style={[s.tableHeaderCell, { flex: 1 }]}>Cost</Text>
                </View>
                {hourlyBreakdown.map((row, i) => (
                  <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
                    <Text style={[s.tableCell, { flex: 1 }]}>{String(row.hour).padStart(2, '0')}:00</Text>
                    <Text style={[s.tableCell, { flex: 1 }]}>{row.totalEnergy.toFixed(4)}</Text>
                    <Text style={[s.tableCell, { flex: 1 }]}>{(row.avgPower || 0).toFixed(2)}</Text>
                    <Text style={[s.tableCellHighlight, { flex: 1 }]}>₱{row.totalCost.toFixed(2)}</Text>
                  </View>
                ))}
                <View style={s.tableTotalRow}>
                  <Text style={[s.tableTotalCell, { flex: 1 }]}>TOTAL</Text>
                  <Text style={[s.tableTotalCell, { flex: 1 }]}>{hourlyBreakdown.reduce((a, r) => a + (Number(r.totalEnergy || r.energy || 0)), 0).toFixed(4)}</Text>
                  <Text style={[s.tableTotalCell, { flex: 1 }]}>{(hourlyBreakdown.reduce((a, r) => a + (Number(r.avgPower || 0)), 0) / Math.max(hourlyBreakdown.length, 1)).toFixed(2)}</Text>
                  <Text style={[s.tableTotalCell, { flex: 1, color: COLORS.primary }]}>₱{hourlyBreakdown.reduce((a, r) => a + (Number(r.totalCost || r.cost || 0)), 0).toFixed(2)}</Text>
                </View>
              </GlassCard>
            )}
          </>
        )}

        {/* History View - GCash-style Transaction List */}
        {activeView === 'history' && (
          <View style={s.historySection}>
            {Object.keys(groupedTxns).length > 0 ? (
              Object.entries(groupedTxns)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([date, txns]) => {
                const dayTotal = txns.reduce((a, t) => a + (t.cost || 0), 0);
                return (
                  <View key={date} style={s.histGroup}>
                    <View style={s.histDateRow}>
                      <Text style={s.histDate}>{formatDate(date)}</Text>
                      <Text style={s.histDayTotal}>-₱{Number(dayTotal || 0).toFixed(2)}</Text>
                    </View>
                    {txns.map((tx, i) => (
                      <View key={tx.id || i} style={s.histItem}>
                        <View style={s.histDot} />
                        <View style={s.histLine} />
                        <View style={s.histContent}>
                          <View style={s.histTop}>
                            <Text style={s.histName}>Energy Reading</Text>
                            <Text style={s.histAmount}>-₱{Number(tx.cost || 0).toFixed(2)}</Text>
                          </View>
                          <View style={s.histBottom}>
                            <Text style={s.histMeta}>{tx.time_label} • {(tx.power || 0).toFixed(0)}W • {(tx.energy || 0).toFixed(4)} kWh</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })
            ) : (
              <GlassCard style={s.emptyHist}>
                <Ionicons name="analytics-outline" size={36} color={COLORS.textMuted} />
                <Text style={s.emptyHistText}>No consumption history yet</Text>
              </GlassCard>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingTop: SPACING.xxl + 10, paddingBottom: SPACING.xxl },
  title: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  subtitle: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  // Period
  periodRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  periodBtn: { flex: 1, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceGlass, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  periodActive: { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: COLORS.primary },
  periodText: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, fontWeight: FONT_WEIGHT.medium },
  periodTextActive: { color: COLORS.primary },
  // Stats
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: { flex: 1, alignItems: 'center', padding: SPACING.md },
  statValue: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginTop: SPACING.xs },
  statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  // Comparison Banner
  compBanner: { marginBottom: SPACING.lg },
  compBannerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  compIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  compBannerContent: { flex: 1 },
  compBannerTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  compBannerSub: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  compDetails: { flexDirection: 'row', alignItems: 'center', paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  compDetailItem: { flex: 1, alignItems: 'center' },
  compDetailLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginBottom: 4 },
  compDetailVal: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  compDetailDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
  // View Toggle
  viewToggle: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  viewTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.surfaceGlass, borderWidth: 1, borderColor: COLORS.border },
  viewTabActive: { backgroundColor: 'rgba(34,197,94,0.08)', borderColor: COLORS.primary },
  viewTabText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: FONT_WEIGHT.medium },
  viewTabTextActive: { color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold },
  // Report
  reportCard: { marginBottom: SPACING.lg },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  reportTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textPrimary },
  reportDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginBottom: SPACING.md },
  reportBtns: { flexDirection: 'row', gap: SPACING.sm },
  reportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md, backgroundColor: 'rgba(59,130,246,0.08)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  reportBtnText: { fontSize: FONT_SIZE.sm, color: COLORS.info, fontWeight: FONT_WEIGHT.semibold },
  // Charts
  chartCard: { marginBottom: SPACING.lg },
  chartTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textPrimary },
  chartHelpText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginBottom: SPACING.md, marginTop: 2 },
  chartScroll: { paddingRight: SPACING.lg },
  chart: { marginLeft: -SPACING.sm, borderRadius: RADIUS.md },
  noData: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, textAlign: 'center', paddingVertical: SPACING.xxl },
  selectedPointCard: { marginBottom: SPACING.lg, borderColor: COLORS.primary, borderWidth: 1 },
  selectedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  selectedTitle: { flex: 1, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary, marginLeft: SPACING.xs },
  closeSelectedBtn: { padding: SPACING.xs },
  selectedGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectedItem: { flex: 1, alignItems: 'center' },
  selectedItemLabel: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginBottom: 4 },
  selectedItemValue: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  selectedDivider: { width: 1, height: 30, backgroundColor: COLORS.border },
  insightCard: { marginBottom: SPACING.xxl },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  insightTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textPrimary },
  insightText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 22 },
  // Totals
  totalsCard: { marginBottom: SPACING.lg },
  totalsTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textPrimary },
  totalsDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2, marginBottom: SPACING.md },
  totalsGrid: { flexDirection: 'row', gap: SPACING.sm },
  totalItem: { flex: 1, alignItems: 'center', gap: 4, padding: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.03)' },
  totalIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  totalLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: FONT_WEIGHT.medium, textAlign: 'center' },
  totalEnergy: { fontSize: FONT_SIZE.xs, color: COLORS.textPrimary, fontWeight: FONT_WEIGHT.bold, textAlign: 'center' },
  totalCost: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold, textAlign: 'center' },
  // Breakdown Table
  breakdownCard: { marginBottom: SPACING.xxl },
  breakdownHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  breakdownTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.textPrimary },
  breakdownDesc: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2, marginBottom: SPACING.md },
  tableHeader: { flexDirection: 'row', paddingVertical: SPACING.sm, paddingHorizontal: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tableHeaderCell: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: FONT_WEIGHT.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: SPACING.sm, paddingHorizontal: SPACING.xs, borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.06)' },
  tableRowAlt: { backgroundColor: 'rgba(255,255,255,0.02)' },
  tableCell: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
  tableCellHighlight: { fontSize: FONT_SIZE.xs, color: COLORS.textPrimary, fontWeight: FONT_WEIGHT.medium },
  tableTotalRow: { flexDirection: 'row', paddingVertical: SPACING.sm + 2, paddingHorizontal: SPACING.xs, borderTopWidth: 2, borderTopColor: COLORS.primary, marginTop: SPACING.xs },
  tableTotalCell: { fontSize: FONT_SIZE.xs, color: COLORS.textPrimary, fontWeight: FONT_WEIGHT.bold },
  // History
  historySection: { marginBottom: SPACING.xxl },
  histGroup: { marginBottom: SPACING.md },
  histDateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm, paddingHorizontal: SPACING.sm },
  histDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: FONT_WEIGHT.bold, textTransform: 'uppercase', letterSpacing: 1 },
  histDayTotal: { fontSize: FONT_SIZE.xs, color: COLORS.danger, fontWeight: FONT_WEIGHT.bold },
  histItem: { flexDirection: 'row', alignItems: 'flex-start', paddingLeft: SPACING.sm, marginBottom: SPACING.xs },
  histDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 14, zIndex: 1 },
  histLine: { position: 'absolute', left: SPACING.sm + 3, top: 22, bottom: -6, width: 2, backgroundColor: COLORS.border, opacity: 0.5 },
  histContent: { flex: 1, marginLeft: SPACING.md, paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, backgroundColor: COLORS.surfaceGlass, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  histTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  histName: { fontSize: FONT_SIZE.sm, color: COLORS.textPrimary, fontWeight: FONT_WEIGHT.medium },
  histAmount: { fontSize: FONT_SIZE.sm, color: COLORS.danger, fontWeight: FONT_WEIGHT.bold },
  histBottom: { marginTop: 2 },
  histMeta: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  emptyHist: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.sm },
  emptyHistText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
});
