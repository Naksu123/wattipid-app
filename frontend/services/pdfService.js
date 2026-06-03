import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Image } from 'react-native';
import { getMonthlyConsumptionFiltered, getDailyBreakdownFiltered, getSetting, getTransactionHistory, getConsumptionComparison } from './database';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Resolving the Wattipid logo
const logoSource = require('../assets/images/Wattipid-icon.png');
const logoUri = Image.resolveAssetSource(logoSource).uri;

export async function generateMonthlyReport({ roomId, tenantName, tenantStartDate, moveOutDate, year, month }) {
  const rate = parseFloat(await getSetting('rate_per_kwh') || '12.50');

  // Current month consumption (filtered by tenant's occupancy period)
  const current = await getMonthlyConsumptionFiltered(roomId, year, month, tenantStartDate, moveOutDate);

  // Last month consumption
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const previous = await getMonthlyConsumptionFiltered(roomId, prevYear, prevMonth, tenantStartDate, moveOutDate);

  const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonthDate = new Date(year, month, 1);
  nextMonthDate.setDate(nextMonthDate.getDate() - 1);
  const endStr = `${year}-${String(month).padStart(2, '0')}-${String(nextMonthDate.getDate()).padStart(2, '0')}`;

  const dailyHistory = await getDailyBreakdownFiltered(roomId, startStr, endStr, tenantStartDate, moveOutDate);

  const totalCost = current.totalEnergy * rate;
  const prevCost = previous.totalEnergy * rate;
  
  const diffEnergy = current.totalEnergy - previous.totalEnergy;
  const diffCost = totalCost - prevCost;
  const isHigher = diffEnergy > 0;

  const generated = new Date().toLocaleString();
  const reportTitle = `${MONTH_NAMES[month - 1]} ${year}`;

  const dailyRows = dailyHistory.length > 0 
    ? dailyHistory.map(d => {
        const date = new Date(d.date);
        const dayStr = `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
        return `<tr><td>${dayStr}</td><td>${d.energy.toFixed(3)} kWh</td><td>₱${(d.energy * rate).toFixed(2)}</td></tr>`;
      }).join('')
    : `<tr><td colspan="3" style="text-align:center;color:#94A3B8;">No data recorded</td></tr>`;

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
    .company h1 { color: #16A34A; font-size: 28px; letter-spacing: 1px; margin-bottom: 4px; display: flex; align-items: center; gap: 12px; }
    .company img { width: 36px; height: 36px; border-radius: 8px; }
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
    .comp-card.diff { background: ${isHigher ? '#FEF2F2' : '#F0FDF4'}; border-color: ${isHigher ? '#FECACA' : '#BBF7D0'}; }
    .comp-card.diff .value { color: ${isHigher ? '#DC2626' : '#16A34A'}; }
    
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
      <h1><img src="${logoUri}" /> Wattipid</h1>
      <p>Electricity Statement of Account</p>
    </div>
    <div class="statement-badge">
      <div class="title">MONTHLY STATEMENT</div>
      <div class="date">${reportTitle}</div>
    </div>
  </div>

  <div class="customer-section">
    <div class="bill-to">
      <h3>Bill To</h3>
      <h2>${tenantName}</h2>
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
        <h2>₱${totalCost.toFixed(2)}</h2>
      </div>
      <div class="usage-stats">
        <div class="stat-item">
          <span>Energy Consumed</span>
          <strong>${current.totalEnergy.toFixed(3)} kWh</strong>
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
        <div class="value">${current.totalEnergy.toFixed(3)} kWh</div>
      </div>
      <div class="comp-card">
        <div class="label">Previous Month</div>
        <div class="value">${previous.totalEnergy.toFixed(3)} kWh</div>
      </div>
      <div class="comp-card diff">
        <div class="label">Difference</div>
        <div class="value">${isHigher ? '+' : ''}${diffEnergy.toFixed(2)} kWh</div>
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
  return { uri, fileName: `${roomId.replace(/\s+/g, '')}_${reportTitle.replace(' ', '_')}_Report.pdf` };
}

export async function generateCycleReport({ roomId, tenantName, startDate, endDate, reportTitle, isWeekly, room = null, billingCycle = null }) {
  const defaultRate = parseFloat(await getSetting('rate_per_kwh') || '12.50');
  
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  
  const fetchedHistory = await getTransactionHistory(roomId, 300, 'daily', tenantName, 0, startStr, endStr);
  
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
  
  // USE BACKEND VALUES IF AVAILABLE to prevent display discrepancies
  const cycleEnergy = billingCycle ? parseFloat(billingCycle.total_kwh || 0) : filteredHistory.reduce((a, b) => a + (Number(b.energy || b.totalEnergy) || 0), 0);
  const electricityCharge = billingCycle ? parseFloat(billingCycle.total_cost || 0) : cycleEnergy * defaultRate;
  
  // Calculate effective rate for breakdown math (just to ensure math adds up)
  const rate = cycleEnergy > 0 ? (electricityCharge / cycleEnergy) : defaultRate;

  const generated = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const billingMonth = `${months[endDate.getMonth()]} ${endDate.getFullYear()}`;
  
  const timestampId = generated.getTime().toString().slice(-8);
  const invoiceNo = `2026${timestampId}`;
  const accountNo = `WT-AC-00${roomId.replace(/\D/g, '') || '1'}`;
  const serialNo = `GE${generated.getTime().toString().slice(-8)}`;

  // --- Breakdown Math to simulate the exact invoice ---
  const p_dist = rate * 0.15;
  const p_sup = rate * 0.05;
  const p_met = rate * 0.05;
  const p_gen = rate * 0.50;
  const p_trans = rate * 0.10;
  const p_sys = rate * 0.05;
  const p_vat = rate * 0.10;

  const a_dist = cycleEnergy * p_dist;
  const a_sup = cycleEnergy * p_sup;
  const a_met = cycleEnergy * p_met;
  const sub1 = a_dist + a_sup + a_met;

  const a_gen = cycleEnergy * p_gen;
  const a_trans = cycleEnergy * p_trans;
  const a_sys = cycleEnergy * p_sys;
  const sub2 = a_gen + a_trans + a_sys;

  const a_vat = cycleEnergy * p_vat;
  const sub3 = a_vat;

  const vatableSales = sub1 + sub2;
  const electricitySubtotal = vatableSales + sub3; 
  
  // Use exact backend penalty if available, otherwise default to 0 for display
  const penaltyFee = billingCycle ? parseFloat(billingCycle.penalty_amount || 0) : 0;
  const totalDue = electricityCharge + penaltyFee;

  // Estimate penalty if paid after due date (just for text display on the invoice)
  const estimatedPenalty = totalDue * 0.02;
  const totalAfterDueDate = totalDue + estimatedPenalty;
  
  const dueDateStr = billingCycle && billingCycle.due_date 
    ? new Date(billingCycle.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
    : dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @page { margin: 0; }
    body { 
      font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; 
      font-size: 11px; 
      color: #111827; 
      background: #f4f4f4; 
      margin: 0; 
      padding: 20px;
      display: flex;
      justify-content: center;
    }
    .receipt {
       width: 340px;
       background: #fff;
       padding: 18px;
       box-shadow: 0 4px 12px rgba(0,0,0,0.08);
       border-radius: 4px;
       box-sizing: border-box;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: 700; }
    
    .header { padding-bottom: 12px; border-bottom: 2px solid #E5E7EB; margin-bottom: 12px; }
    .logo-row { display: flex; align-items: center; justify-content: center; margin-bottom: 12px; gap: 10px;}
    .logo-circle { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .logo-circle img { width: 100%; height: 100%; object-fit: contain; }
    .company-details { text-align: left; line-height: 1.2; }
    .company-name { font-size: 13px; font-weight: 800; color: #16A34A; }
    .company-sub { font-size: 9px; color: #6B7280; margin-top: 2px;}
    
    .invoice-title { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 10px; margin-bottom: 4px; color: #111827;}
    .invoice-no { font-size: 11px; margin-bottom: 12px; color: #4B5563; }
    
    .contact-info { font-size: 10px; line-height: 1.4; margin-bottom: 12px; text-align: center; color: #6B7280;}
    
    .notice-box { border: 1px solid #FCD34D; background: #FFFBEB; padding: 8px; font-size: 10px; text-align: center; margin-bottom: 12px; color: #B45309; border-radius: 4px;}
    .notice-box .strong { font-weight: 800; font-size: 11px; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px;}
    
    .acct-row { border-top: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB; padding: 6px 0; display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #374151;}
    
    .tenant-info { padding: 8px 0; border-bottom: 1px solid #E5E7EB; font-size: 12px; line-height: 1.4; font-weight: 700; color: #111827;}
    .tenant-info span { color: #6B7280; font-weight: 500; font-size: 11px; }
    
    .meter-details { display: flex; border-bottom: 1px solid #E5E7EB; padding: 8px 0; font-size: 11px; color: #4B5563;}
    .meter-left { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .meter-right { flex: 1; border-left: 1px solid #E5E7EB; padding-left: 8px; display: flex; flex-direction: column; gap: 6px;}
    .meter-details span { font-weight: 700; color: #111827; }
    
    .reading-table { width: 100%; text-align: center; font-size: 11px; border-bottom: 1px solid #E5E7EB; border-collapse: collapse; margin-bottom: 4px;}
    .reading-table th { padding: 6px 0; color: #6B7280; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px;}
    .reading-table td { padding: 6px 0; font-weight: 600; color: #111827;}
    .reading-table .kwh-val { font-size: 16px; font-weight: 800; color: #16A34A; }
    
    .rate-table { width: 100%; font-size: 10px; border-collapse: collapse; margin-bottom: 8px; color: #374151; }
    .rate-table th { border-bottom: 1px solid #E5E7EB; padding: 6px 0; text-align: left; color: #6B7280; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px;}
    .rate-table td { padding: 4px 0; }
    .rate-table .num { text-align: right; width: 55px; font-weight: 500;}
    
    .subtotal-row { border-top: 1px solid #E5E7EB; font-weight: 700; color: #111827; }
    .border-bottom { border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-bottom: 6px;}
    
    .amount-box { border-top: 2px solid #E5E7EB; border-bottom: 2px solid #E5E7EB; padding: 10px 0; font-size: 11px; color: #4B5563;}
    .amount-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .amount-row span:last-child { font-weight: 600; color: #111827;}
    
    .final-due-box { padding: 12px 0 4px 0; display: flex; justify-content: space-between; align-items: flex-end; }
    .final-due-label { font-weight: 800; font-size: 12px; display: flex; flex-direction: column; gap: 4px; color: #111827;}
    .final-due-val-col { text-align: right; }
    .final-due-val { font-size: 22px; font-weight: 900; color: #10B981; letter-spacing: -0.5px;}
    .final-due-date { font-size: 11px; font-weight: 700; color: #DC2626; margin-top: 2px;}
    
    .overdue-box { margin-top: 8px; padding: 8px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 4px; font-size: 10px; color: #991B1B; }
    .overdue-row { display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 4px;}
    .overdue-row.total { font-weight: 800; font-size: 12px; color: #DC2626; border-top: 1px solid #FECACA; padding-top: 4px; margin-top: 2px;}
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo-row">
        <div class="logo-circle">
          <img src="${logoUri}" alt="Wattipid" />
        </div>
        <div class="company-details">
          <div class="company-sub">Bacolod City, Negros Occidental<br>VAT REG. TIN 123 - 456 - 789 - 00000</div>
        </div>
      </div>
      <div class="text-center">
        <div class="invoice-title">Spot Billing Invoice</div>
        <div class="invoice-no">Invoice Number: <strong>${invoiceNo}</strong></div>
      </div>
      <div class="contact-info">
        For billing concerns/inquiry, connect with us<br>through our 24/7 hotlines and channels.<br>
        📞 Smart: 0998-123-4567 Globe: 0917-123-4567
      </div>
      <div class="notice-box">
        <div class="strong">NOTICE TO CUSTOMER</div>
        Once due date has lapsed, please ensure to pay within 48 hours the total amount due to avoid disconnection of service.
      </div>
    </div>

    <div class="acct-row">
      <div>Acct. No.: ${accountNo}</div>
      <div>Route: @${roomId.replace(/\D/g, '') || '1'}</div>
    </div>

    <div class="tenant-info">
      ${tenantName ? tenantName.toUpperCase() : 'TENANT'}<br>
      MRRP<br>
      Billing Month: ${billingMonth.toUpperCase()}
    </div>

    <div class="meter-details">
      <div class="meter-left">
        <div>Serial: <span style="float:right">${serialNo}</span></div>
        <div>Demand: <span style="float:right"></span></div>
      </div>
      <div class="meter-right">
        <div>Multiplier: <span style="float:right">1</span></div>
        <div>Type: <span style="float:right">RESIDENTIAL</span></div>
        <div>Load Factor: <span style="float:right">0</span></div>
      </div>
    </div>

    <table class="reading-table">
      <tr>
        <th style="text-align:left;">Period</th>
        <th>Reading</th>
        <th>Used kWh</th>
      </tr>
      <tr>
        <td style="text-align:left;">${startStr.replace(/-/g, '/')} - ${endStr.replace(/-/g, '/')}</td>
        <td>${cycleEnergy.toFixed(2)}</td>
        <td class="kwh-val">${cycleEnergy.toFixed(2)}</td>
      </tr>
    </table>

    <table class="rate-table">
      <tr>
        <th>RATE COMPONENT</th>
        <th class="num">PRICE</th>
        <th class="num">AMOUNT</th>
      </tr>
      <tr>
        <td>Distribution Charge</td>
        <td class="num">${p_dist.toFixed(4)}</td>
        <td class="num">${a_dist.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Demand Charge</td>
        <td class="num">--</td>
        <td class="num">0.00</td>
      </tr>
      <tr>
        <td>Supply Charge</td>
        <td class="num">${p_sup.toFixed(4)}</td>
        <td class="num">${a_sup.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Metering Charge</td>
        <td class="num">${p_met.toFixed(4)}</td>
        <td class="num">${a_met.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Retail Metering Charge</td>
        <td class="num">--</td>
        <td class="num">0.00</td>
      </tr>
      <tr>
        <td>R.F.S.C.</td>
        <td class="num">--</td>
        <td class="num">0.00</td>
      </tr>
      <tr class="subtotal-row border-bottom">
        <td>Provider Related Charges</td>
        <td class="num">Subtotal</td>
        <td class="num">${sub1.toFixed(2)}</td>
      </tr>

      <tr>
        <td>Generation Charge</td>
        <td class="num">${p_gen.toFixed(4)}</td>
        <td class="num">${a_gen.toFixed(2)}</td>
      </tr>
      <tr>
        <td>ILP Recovery</td>
        <td class="num">--</td>
        <td class="num">0.00</td>
      </tr>
      <tr>
        <td>Power Act Reduction</td>
        <td class="num">--</td>
        <td class="num">0.00</td>
      </tr>
      <tr>
        <td>Transmission Charge</td>
        <td class="num">${p_trans.toFixed(4)}</td>
        <td class="num">${a_trans.toFixed(2)}</td>
      </tr>
      <tr>
        <td>System Loss Charge</td>
        <td class="num">${p_sys.toFixed(4)}</td>
        <td class="num">${a_sys.toFixed(2)}</td>
      </tr>
      <tr class="subtotal-row border-bottom">
        <td>Supplier Related Charges</td>
        <td class="num">Subtotal</td>
        <td class="num">${sub2.toFixed(2)}</td>
      </tr>

      <tr>
        <td>Senior Citizen Subsidy</td>
        <td class="num">0.0000</td>
        <td class="num">0.00</td>
      </tr>
      <tr class="subtotal-row border-bottom">
        <td>Subsidies</td>
        <td class="num">Subtotal</td>
        <td class="num">0.00</td>
      </tr>

      <tr>
        <td>VAT on Generation</td>
        <td class="num">${(p_vat * 0.5).toFixed(4)}</td>
        <td class="num">${(a_vat * 0.5).toFixed(2)}</td>
      </tr>
      <tr>
        <td>VAT on Transmission</td>
        <td class="num">${(p_vat * 0.2).toFixed(4)}</td>
        <td class="num">${(a_vat * 0.2).toFixed(2)}</td>
      </tr>
      <tr>
        <td>VAT on System Loss</td>
        <td class="num">${(p_vat * 0.1).toFixed(4)}</td>
        <td class="num">${(a_vat * 0.1).toFixed(2)}</td>
      </tr>
      <tr>
        <td>VAT on Distribution</td>
        <td class="num">${(p_vat * 0.2).toFixed(4)}</td>
        <td class="num">${(a_vat * 0.2).toFixed(2)}</td>
      </tr>
      <tr class="subtotal-row border-bottom">
        <td>Taxes & Universal Charges</td>
        <td class="num">Subtotal</td>
        <td class="num">${sub3.toFixed(2)}</td>
      </tr>

      <tr class="subtotal-row">
        <td>Other Charges</td>
        <td class="num">Subtotal</td>
        <td class="num">0.00</td>
      </tr>
    </table>

    <div class="amount-box">
      <div class="text-right bold" style="margin-bottom:4px;">AMOUNT (PHP)</div>
      <div class="amount-row"><span>Vatable Sales</span><span>${vatableSales.toFixed(2)}</span></div>
      <div class="amount-row"><span>VAT-Exempt Sales</span><span>0.00</span></div>
      <div class="amount-row"><span>Zero Rated Sales</span><span>0.00</span></div>
      <div class="amount-row"><span>VAT Amount</span><span>${sub3.toFixed(2)}</span></div>
      <div class="amount-row"><span>Electricity Subtotal</span><span>${electricitySubtotal.toFixed(2)}</span></div>
      <div class="amount-row"><span>Amount Due</span><span>${totalDue.toFixed(2)}</span></div>
    </div>

    <div class="final-due-box">
      <div class="final-due-label">
        <div>Current Amount Due</div>
        <div style="font-weight:normal;">Current Bill Due Date</div>
      </div>
      <div class="final-due-val-col">
        <div class="final-due-val">${totalDue.toFixed(2)}</div>
        <div class="final-due-date">${dueDateStr}</div>
      </div>
    </div>

    <div class="overdue-box">
      <div class="overdue-row"><span>Penalty if paid after Due Date (2%)</span><span>${penaltyFee.toFixed(2)}</span></div>
      <div class="overdue-row total"><span>Amount Due After ${dueDateStr}</span><span>${totalAfterDueDate.toFixed(2)}</span></div>
    </div>
  </div>
</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return { uri, fileName: `${invoiceNo}.pdf` };
}

export async function shareReport(uri) {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    return { success: true };
  }
  return { success: false, message: 'Sharing is not available on this device' };
}
