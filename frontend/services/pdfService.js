import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getMonthlyConsumptionFiltered, getDailyBreakdownFiltered, getSetting, getTransactionHistory, getConsumptionComparison } from './database';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export async function generateMonthlyReport({ roomId, tenantName, tenantStartDate, moveOutDate, year, month }) {
  const rate = parseFloat(await getSetting('rate_per_kwh') || '12.50');

  // Current month consumption (filtered by tenant's occupancy period)
  const current = await getMonthlyConsumptionFiltered(roomId, year, month, tenantStartDate, moveOutDate);

  // Last month consumption
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const previous = await getMonthlyConsumptionFiltered(roomId, prevYear, prevMonth, tenantStartDate, moveOutDate);

  // Daily breakdown
  const dailyData = await getDailyBreakdownFiltered(roomId, year, month, tenantStartDate, moveOutDate);

  // Safety check to prevent crash if API fails
  if (!current || !previous) {
    throw new Error('Failed to fetch consumption data for the report. Please check your connection.');
  }

  const difference = (current.totalEnergy || 0) - (previous.totalEnergy || 0);
  const totalBill = (current.totalEnergy || 0) * rate;
  const monthName = MONTH_NAMES[month - 1];
  const generated = new Date().toLocaleString();

  // Build daily rows
  const dailyRows = dailyData.length > 0
    ? dailyData.map(d => `<tr><td>${d.day}</td><td>${Number(d.totalEnergy).toFixed(4)} kWh</td><td>₱${Number(d.totalCost).toFixed(2)}</td></tr>`).join('')
    : '<tr><td colspan="3" style="text-align:center;color:#94A3B8;">No data recorded</td></tr>';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1E293B; padding: 32px; font-size: 12px; }
    .header { text-align: center; margin-bottom: 24px; border-bottom: 3px solid #22C55E; padding-bottom: 16px; }
    .header h1 { font-size: 22px; color: #22C55E; margin-bottom: 4px; }
    .header h2 { font-size: 14px; color: #475569; font-weight: 400; }
    .header .date { font-size: 11px; color: #94A3B8; margin-top: 8px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 13px; font-weight: 700; color: #0F172A; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 10px; }
    .info-grid { display: flex; gap: 16px; margin-bottom: 16px; }
    .info-item { flex: 1; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; }
    .info-label { font-size: 10px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 15px; font-weight: 700; color: #0F172A; margin-top: 4px; }
    .summary-grid { display: flex; gap: 12px; }
    .summary-card { flex: 1; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 12px; text-align: center; }
    .summary-card.diff { background: ${difference > 0 ? '#FEF2F2' : '#F0FDF4'}; border-color: ${difference > 0 ? '#FECACA' : '#BBF7D0'}; }
    .summary-card .label { font-size: 10px; color: #64748B; }
    .summary-card .value { font-size: 16px; font-weight: 700; color: #16A34A; margin-top: 4px; }
    .summary-card.diff .value { color: ${difference > 0 ? '#DC2626' : '#16A34A'}; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #0F172A; color: #fff; padding: 8px 12px; text-align: left; font-weight: 600; }
    td { padding: 7px 12px; border-bottom: 1px solid #E2E8F0; }
    tr:nth-child(even) td { background: #F8FAFC; }
    .billing { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 16px; }
    .billing-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .billing-total { font-size: 16px; font-weight: 700; color: #D97706; border-top: 2px solid #FDE68A; padding-top: 8px; margin-top: 8px; }
    .footer { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px solid #E2E8F0; font-size: 10px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚡ Wattipid</h1>
    <h2>Monthly Electricity Consumption Report</h2>
    <div class="date">${monthName} ${year} • Generated: ${generated}</div>
  </div>

  <div class="section">
    <div class="section-title">Tenant & Room Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Tenant Name</div>
        <div class="info-value">${tenantName || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Room Number</div>
        <div class="info-value">${roomId}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Move-in Date</div>
        <div class="info-value">${tenantStartDate || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Move-out Date</div>
        <div class="info-value">${moveOutDate || 'Active'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Consumption Summary</div>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="label">Current Month</div>
        <div class="value">${(parseFloat(current.totalEnergy || current.energy || 0)).toFixed(4)} kWh</div>
      </div>
      <div class="summary-card">
        <div class="label">Last Month</div>
        <div class="value">${(parseFloat(previous.totalEnergy || previous.energy || 0)).toFixed(4)} kWh</div>
      </div>
      <div class="summary-card diff">
        <div class="label">Difference</div>
        <div class="value">${difference > 0 ? '+' : ''}${difference.toFixed(4)} kWh</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Daily Breakdown</div>
    <table>
      <thead><tr><th>Date</th><th>Consumption</th><th>Cost</th></tr></thead>
      <tbody>${dailyRows}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Billing</div>
    <div class="billing">
      <div class="billing-row"><span>Rate per kWh</span><span>₱${rate.toFixed(2)}</span></div>
      <div class="billing-row"><span>Total Consumption</span><span>${(parseFloat(current.totalEnergy || current.energy || 0)).toFixed(4)} kWh</span></div>
      <div class="billing-row billing-total"><span>Total Bill</span><span>₱${totalBill.toFixed(2)}</span></div>
    </div>
  </div>

  <div class="footer">
    Generated by Wattipid • ${generated}
  </div>
</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return { uri, fileName: `${roomId.replace(/\s+/g, '')}_${monthName}_${year}.pdf` };
}


export async function generateCycleReport({ roomId, tenantName, startDate, endDate, reportTitle, isWeekly }) {
  const rate = parseFloat(await getSetting('rate_per_kwh') || '12.50');
  
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  
  const [fetchedHistory, fetchedComp] = await Promise.all([
    getTransactionHistory(roomId, 300, 'daily', tenantName, 0, startStr, endStr),
    getConsumptionComparison(roomId, isWeekly ? 'weekly' : 'monthly', tenantName)
  ]);
  
  const flattenedHistory = (fetchedHistory || []).reduce((acc, group) => {
    if (group.data && Array.isArray(group.data)) {
      return acc.concat(group.data);
    }
    return acc;
  }, []);

  const filteredHistory = flattenedHistory.filter(h => {
    const d = new Date(h.group_date || h.day || h.timestamp);
    return d >= startDate && d <= endDate;
  });
  
  const compData = fetchedComp || { current: { totalEnergy: 0, totalCost: 0 }, previous: { totalEnergy: 0, totalCost: 0 }, costPctChange: 0, energyPctChange: 0, costDiff: 0 };
  
  const repTotalEnergy = filteredHistory.reduce((a, b) => a + (Number(b.energy || b.totalEnergy) || 0), 0);
  const repTotalCost = repTotalEnergy * rate;
  
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dateRange = `${months[startDate.getMonth()]} ${startDate.getDate()} – ${months[endDate.getMonth()]} ${endDate.getDate()}, ${endDate.getFullYear()}`;
  const generated = new Date().toLocaleString();

  const dailyRows = filteredHistory.length > 0
    ? filteredHistory.map(d => {
        const dDate = new Date(d.group_date || d.day || d.timestamp);
        const dayStr = `${months[dDate.getMonth()]} ${dDate.getDate()}`;
        return `<tr><td>${dayStr}</td><td>${Number(d.energy || d.totalEnergy || 0).toFixed(4)} kWh</td><td>₱${Number(d.cost || d.totalCost || 0).toFixed(2)}</td></tr>`;
      }).join('')
    : '<tr><td colspan="3" style="text-align:center;color:#94A3B8;">No data recorded</td></tr>';

  const difference = compData.costDiff || 0;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1E293B; padding: 32px; font-size: 12px; }
    .header { text-align: center; margin-bottom: 24px; border-bottom: 3px solid #22C55E; padding-bottom: 16px; }
    .header h1 { font-size: 22px; color: #22C55E; margin-bottom: 4px; }
    .header h2 { font-size: 14px; color: #475569; font-weight: 400; }
    .header .date { font-size: 11px; color: #94A3B8; margin-top: 8px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 13px; font-weight: 700; color: #0F172A; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 10px; }
    .info-grid { display: flex; gap: 16px; margin-bottom: 16px; }
    .info-item { flex: 1; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; }
    .info-label { font-size: 10px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-size: 15px; font-weight: 700; color: #0F172A; margin-top: 4px; }
    .summary-grid { display: flex; gap: 12px; }
    .summary-card { flex: 1; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 12px; text-align: center; }
    .summary-card.diff { background: ${difference > 0 ? '#FEF2F2' : '#F0FDF4'}; border-color: ${difference > 0 ? '#FECACA' : '#BBF7D0'}; }
    .summary-card .label { font-size: 10px; color: #64748B; }
    .summary-card .value { font-size: 16px; font-weight: 700; color: #16A34A; margin-top: 4px; }
    .summary-card.diff .value { color: ${difference > 0 ? '#DC2626' : '#16A34A'}; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #0F172A; color: #fff; padding: 8px 12px; text-align: left; font-weight: 600; }
    td { padding: 7px 12px; border-bottom: 1px solid #E2E8F0; }
    tr:nth-child(even) td { background: #F8FAFC; }
    .billing { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 16px; }
    .billing-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .billing-total { font-size: 16px; font-weight: 700; color: #D97706; border-top: 2px solid #FDE68A; padding-top: 8px; margin-top: 8px; }
    .footer { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px solid #E2E8F0; font-size: 10px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚡ Wattipid</h1>
    <h2>${reportTitle}</h2>
    <div class="date">${dateRange} • Generated: ${generated}</div>
  </div>

  <div class="section">
    <div class="section-title">Tenant & Room Information</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Tenant Name</div>
        <div class="info-value">${tenantName || 'N/A'}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Room Number</div>
        <div class="info-value">${roomId}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Consumption Summary</div>
    <div class="summary-grid">
      <div class="summary-card">
        <div class="label">Current ${isWeekly ? 'Week' : 'Cycle'}</div>
        <div class="value">${repTotalEnergy.toFixed(4)} kWh</div>
      </div>
      <div class="summary-card">
        <div class="label">Previous ${isWeekly ? 'Week' : 'Cycle'}</div>
        <div class="value">${compData.previous.totalEnergy.toFixed(4)} kWh</div>
      </div>
      <div class="summary-card diff">
        <div class="label">Difference</div>
        <div class="value">${difference > 0 ? '+' : ''}${difference.toFixed(2)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Daily Breakdown</div>
    <table>
      <thead><tr><th>Date</th><th>Consumption</th><th>Cost</th></tr></thead>
      <tbody>${dailyRows}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Billing</div>
    <div class="billing">
      <div class="billing-row"><span>Rate per kWh</span><span>₱${rate.toFixed(2)}</span></div>
      <div class="billing-row"><span>Total Consumption</span><span>${repTotalEnergy.toFixed(4)} kWh</span></div>
      <div class="billing-row billing-total"><span>Total Bill</span><span>₱${repTotalCost.toFixed(2)}</span></div>
    </div>
  </div>

  <div class="footer">
    Generated by Wattipid • ${generated}
  </div>
</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return { uri, fileName: `${roomId.replace(/\s+/g, '')}_${isWeekly ? 'Weekly' : 'Monthly'}_Report.pdf` };
}

export async function shareReport(uri) {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    return { success: true };
  }
  return { success: false, message: 'Sharing is not available on this device' };
}
