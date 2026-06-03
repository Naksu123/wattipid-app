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
    ? dailyData.map(d => `<tr><td>${d.day}</td><td>${Number(d.totalEnergy).toFixed(3)} kWh</td><td>₱${Number(d.totalCost).toFixed(2)}</td></tr>`).join('')
    : '<tr><td colspan="3" style="text-align:center;color:#94A3B8;">No data recorded</td></tr>';

  const html = `
<!DOCTYPE html>
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
    .statement-badge .title { font-weight: 700; color: #0F172A; font-size: 16px; margin-bottom: 4px; }
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
    .comp-card.diff { background: ${difference > 0 ? '#FEF2F2' : '#F0FDF4'}; border-color: ${difference > 0 ? '#FECACA' : '#BBF7D0'}; }
    .comp-card.diff .value { color: ${difference > 0 ? '#DC2626' : '#16A34A'}; }
    
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
      <div class="title">MONTHLY REPORT</div>
      <div class="date">${monthName} ${year}</div>
    </div>
  </div>

  <div class="customer-section">
    <div class="bill-to">
      <h3>Bill To</h3>
      <h2>${tenantName || 'N/A'}</h2>
      <p>Room: ${roomId}</p>
    </div>
    <div class="account-details">
      <table>
        <tr><td>Statement Date:</td><td>${new Date().toLocaleDateString()}</td></tr>
        <tr><td>Move-in Date:</td><td>${tenantStartDate || 'N/A'}</td></tr>
        <tr><td>Move-out Date:</td><td>${moveOutDate || 'Active'}</td></tr>
      </table>
    </div>
  </div>

  <div class="summary-section">
    <div class="section-title">Account Summary</div>
    <div class="summary-box">
      <div class="amount-due">
        <span>Total Amount Due</span>
        <h2>₱${totalBill.toFixed(2)}</h2>
      </div>
      <div class="usage-stats">
        <div class="stat-item">
          <span>Energy Consumed</span>
          <strong>${(parseFloat(current.totalEnergy || current.energy || 0)).toFixed(3)} kWh</strong>
        </div>
        <div class="stat-item">
          <span>Rate per kWh</span>
          <strong>₱${rate.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  </div>

  <div class="summary-section">
    <div class="section-title">Consumption Comparison</div>
    <div class="comparison-grid">
      <div class="comp-card">
        <div class="label">Current Month</div>
        <div class="value">${(parseFloat(current.totalEnergy || current.energy || 0)).toFixed(3)} kWh</div>
      </div>
      <div class="comp-card">
        <div class="label">Previous Month</div>
        <div class="value">${(parseFloat(previous.totalEnergy || previous.energy || 0)).toFixed(3)} kWh</div>
      </div>
      <div class="comp-card diff">
        <div class="label">Difference</div>
        <div class="value">${difference > 0 ? '+' : ''}${difference.toFixed(3)} kWh</div>
      </div>
    </div>
  </div>

  <div class="summary-section">
    <div class="section-title">Daily Breakdown</div>
    <table class="breakdown">
      <thead><tr><th>Date</th><th>Consumption</th><th>Cost</th></tr></thead>
      <tbody>${dailyRows}</tbody>
    </table>
  </div>

  <div class="footer">
    This is a computer-generated document. No signature is required.<br>
    Generated by Wattipid System • ${generated}
  </div>
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

  const startBoundary = new Date(startDate);
  startBoundary.setHours(0, 0, 0, 0);
  const endBoundary = new Date(endDate);
  endBoundary.setHours(23, 59, 59, 999);

  const filteredHistory = flattenedHistory.filter(h => {
    const d = new Date(h.group_date || h.day || h.timestamp);
    return d >= startBoundary && d <= endBoundary;
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
        return `<tr><td>${dayStr}</td><td>${Number(d.energy || d.totalEnergy || 0).toFixed(3)} kWh</td><td>₱${Number(d.cost || d.totalCost || 0).toFixed(2)}</td></tr>`;
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
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1E293B; padding: 40px; font-size: 13px; background: #fff; line-height: 1.5; }
    .bill-container { max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #22C55E; padding-bottom: 20px; margin-bottom: 30px; }
    .company h1 { color: #16A34A; font-size: 28px; letter-spacing: 1px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
    .company p { color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .statement-badge { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px 20px; border-radius: 6px; text-align: right; }
    .statement-badge .title { font-weight: 700; color: #0F172A; font-size: 16px; margin-bottom: 4px; }
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
    .comp-card.diff { background: ${difference > 0 ? '#FEF2F2' : '#F0FDF4'}; border-color: ${difference > 0 ? '#FECACA' : '#BBF7D0'}; }
    .comp-card.diff .value { color: ${difference > 0 ? '#DC2626' : '#16A34A'}; }
    
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
      <div class="title">${isWeekly ? 'WEEKLY STATEMENT' : 'BILLING CYCLE'}</div>
      <div class="date">${dateRange}</div>
    </div>
  </div>

  <div class="customer-section">
    <div class="bill-to">
      <h3>Bill To</h3>
      <h2>${tenantName || 'N/A'}</h2>
      <p>Room: ${roomId}</p>
    </div>
    <div class="account-details">
      <table>
        <tr><td>Statement Date:</td><td>${new Date().toLocaleDateString()}</td></tr>
        <tr><td>Billing Period:</td><td>${reportTitle}</td></tr>
      </table>
    </div>
  </div>

  <div class="summary-section">
    <div class="section-title">Account Summary</div>
    <div class="summary-box">
      <div class="amount-due">
        <span>Total Amount Due</span>
        <h2>₱${repTotalCost.toFixed(2)}</h2>
      </div>
      <div class="usage-stats">
        <div class="stat-item">
          <span>Energy Consumed</span>
          <strong>${repTotalEnergy.toFixed(3)} kWh</strong>
        </div>
        <div class="stat-item">
          <span>Rate per kWh</span>
          <strong>₱${rate.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  </div>

  <div class="summary-section">
    <div class="section-title">Consumption Comparison</div>
    <div class="comparison-grid">
      <div class="comp-card">
        <div class="label">Current ${isWeekly ? 'Week' : 'Cycle'}</div>
        <div class="value">${repTotalEnergy.toFixed(3)} kWh</div>
      </div>
      <div class="comp-card">
        <div class="label">Previous ${isWeekly ? 'Week' : 'Cycle'}</div>
        <div class="value">${compData.previous.totalEnergy.toFixed(3)} kWh</div>
      </div>
      <div class="comp-card diff">
        <div class="label">Difference</div>
        <div class="value">${difference > 0 ? '+' : ''}${difference.toFixed(2)} kWh</div>
      </div>
    </div>
  </div>

  <div class="summary-section">
    <div class="section-title">Daily Breakdown</div>
    <table class="breakdown">
      <thead><tr><th>Date</th><th>Consumption</th><th>Cost</th></tr></thead>
      <tbody>${dailyRows}</tbody>
    </table>
  </div>

  <div class="footer">
    This is a computer-generated document. No signature is required.<br>
    Generated by Wattipid System • ${generated}
  </div>
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
