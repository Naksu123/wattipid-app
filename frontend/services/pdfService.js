import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { getMonthlyConsumptionFiltered, getDailyBreakdownFiltered, getSetting, getTransactionHistory } from './database';
import { getMonthlyReportStyles, getCycleReportStyles } from '../styles/pdf.styles';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

async function getBase64Logo() {
  try {
    const asset = Asset.fromModule(require('../assets/images/wattipid-logo-small.png'));
    await asset.downloadAsync();
    const base64 = await FileSystem.readAsStringAsync(asset.localUri || asset.uri, {
      encoding: 'base64',
    });
    return `data:image/png;base64,${base64}`;
  } catch (e) {
    console.warn("Could not load base64 logo for PDF", e);
    return null;
  }
}

export async function generateMonthlyReport({ roomId, tenantName, tenantStartDate, moveOutDate, year, month }) {
  const base64Logo = await getBase64Logo();
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
  <style>
${getMonthlyReportStyles(isHigher)}
  </style>
</head>
<body>
<div class="bill-container">
  <div class="header">
    <div class="company">
      <h1>${base64Logo ? `<img src="${base64Logo}" style="width:32px;height:32px;border-radius:8px;"/>` : `<span style="display:inline-block;background:#16A34A;color:#fff;border-radius:8px;padding:4px 8px;font-size:24px;margin-right:8px;">W</span>`} Wattipid</h1>
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
  const base64Logo = await getBase64Logo();
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
  
  // USE EXACT BACKEND VALUES IF AVAILABLE to establish Single Source of Truth
  const invoiceNumber = billingCycle?.invoice_number || `WT-2026${new Date().getTime().toString().slice(-8)}`;
  let rate = billingCycle ? parseFloat(billingCycle.rate_per_kwh || 0) : defaultRate;
  
  let cycleEnergy = billingCycle ? parseFloat(billingCycle.total_kwh || 0) : filteredHistory.reduce((a, b) => a + (Number(b.energy || b.totalEnergy) || 0), 0);
  
  // Backwards compatibility: if total_kwh is 0 but we have history, calculate it
  if (cycleEnergy === 0) {
      cycleEnergy = filteredHistory.reduce((a, b) => a + (Number(b.energy || b.totalEnergy) || 0), 0);
  }
  
  const electricityCharge = billingCycle ? parseFloat(billingCycle.electricity_charge || billingCycle.total_cost || 0) : cycleEnergy * rate;

  // Fallback: If cycleEnergy is STILL 0 but we have an electricity charge, reverse-calculate it
  if (cycleEnergy === 0 && electricityCharge > 0) {
      cycleEnergy = electricityCharge / (rate || defaultRate);
  }

  // Calculate effective rate for breakdown math if rate_per_kwh was 0 in old database records
  if (rate === 0 && cycleEnergy > 0 && electricityCharge > 0) {
      rate = electricityCharge / cycleEnergy;
  } else if (rate === 0) {
      rate = defaultRate;
  }
  
  const previousReading = billingCycle ? parseFloat(billingCycle.previous_reading || 0) : 0;
  const currentReading = billingCycle ? parseFloat(billingCycle.current_reading || 0) : cycleEnergy;
  const monthlyRent = billingCycle ? parseFloat(billingCycle.monthly_rent || 0) : 0;
  const previousBalance = billingCycle ? parseFloat(billingCycle.previous_balance || 0) : 0;
  const additionalCharges = billingCycle ? parseFloat(billingCycle.additional_charges || 0) : 0;
  const discounts = billingCycle ? parseFloat(billingCycle.discounts || 0) : 0;
  const penaltyFee = billingCycle ? parseFloat(billingCycle.penalty_amount || 0) : 0;
  
  let totalDue = billingCycle ? parseFloat(billingCycle.grand_total || 0) : 0;
  if (totalDue === 0 && electricityCharge > 0) {
      totalDue = electricityCharge + penaltyFee + monthlyRent + previousBalance + additionalCharges - discounts;
  }

  const generated = new Date();
  
  // If no due date is provided in the database (older records), default to 7 days after the billing cycle ended
  const fallbackDueDate = new Date(endDate);
  fallbackDueDate.setDate(fallbackDueDate.getDate() + 3);

  const amountPaid = billingCycle ? parseFloat(billingCycle.amount_paid || 0) : 0;
  const remainingBalance = Math.max(totalDue - amountPaid, 0);
  const isPaid = billingCycle ? billingCycle.payment_status === 'paid' : false;

  let paymentMethods = [];
  if (billingCycle && billingCycle.payments && billingCycle.payments.length > 0) {
      const verifiedPayments = billingCycle.payments.filter(p => p.status === 'verified');
      paymentMethods = [...new Set(verifiedPayments.map(p => p.payment_method?.toUpperCase()).filter(Boolean))];
  }
  const paymentMethodText = paymentMethods.length > 0 ? paymentMethods.join(', ') : '';

  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const billingMonth = `${months[endDate.getMonth()]} ${endDate.getFullYear()}`;
  
  const accountNo = `WT-AC-00${String(roomId).replace(/\D/g, '') || '1'}`;
  const serialNo = `GE${generated.getTime().toString().slice(-8)}`;

  // --- Breakdown Math for the visual components ---
  const p_dist = rate * 0.15;
  const p_sup = rate * 0.05;
  const p_met = rate * 0.05;
  const p_gen = rate * 0.50;
  const p_trans = rate * 0.10;
  const p_sys = rate * 0.05;
  const p_vat = rate * 0.10;

  const a_dist = billingCycle ? parseFloat(billingCycle.distribution_charge || 0) : cycleEnergy * p_dist;
  const a_sup = billingCycle ? parseFloat(billingCycle.supply_charge || 0) : cycleEnergy * p_sup;
  const a_met = billingCycle ? parseFloat(billingCycle.metering_charge || 0) : cycleEnergy * p_met;
  const sub1 = a_dist + a_sup + a_met;

  const a_gen = billingCycle ? parseFloat(billingCycle.generation_charge || 0) : cycleEnergy * p_gen;
  const a_trans = billingCycle ? parseFloat(billingCycle.transmission_charge || 0) : cycleEnergy * p_trans;
  const a_sys = billingCycle ? parseFloat(billingCycle.system_loss_charge || 0) : cycleEnergy * p_sys;
  const sub2 = a_gen + a_trans + a_sys;

  const a_vat = billingCycle ? parseFloat(billingCycle.vat_amount || 0) : cycleEnergy * p_vat;
  const sub3 = a_vat;
  
  const a_misc = billingCycle ? parseFloat(billingCycle.miscellaneous_fee || 0) : electricityCharge * 0.02;
  const sub4 = a_misc + additionalCharges;

  const vatableSales = sub1 + sub2;
  const electricitySubtotal = vatableSales + sub3 + sub4;  
  const penaltyRatePercent = 2; // Configurable penalty rate
  const estimatedPenalty = totalDue * (penaltyRatePercent / 100);
  const totalAfterDueDate = totalDue + estimatedPenalty;
  
  const dueDateStr = billingCycle && billingCycle.due_date 
    ? new Date(billingCycle.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
    : fallbackDueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

  const actualDueDate = billingCycle && billingCycle.due_date ? new Date(billingCycle.due_date) : fallbackDueDate;
  const now = new Date();
  const diffTime = now - actualDueDate;
  const daysOverdueCalc = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const daysOverdue = daysOverdueCalc > 0 ? daysOverdueCalc : 0;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
  <style>
${getCycleReportStyles()}
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo-row">
        ${base64Logo 
          ? `<div class="logo-circle"><img src="${base64Logo}" alt="Wattipid" /></div>` 
          : `<div class="logo-circle" style="background:#16A34A;color:#fff;font-size:24px;font-weight:900;">W</div>`}
        <div class="company-details">
          <div class="company-sub">Bacolod City, Negros Occidental<br>VAT REG. TIN 123 - 456 - 789 - 00000</div>
        </div>
      </div>
      <div class="text-center">
        <div class="invoice-title">Spot Billing Invoice</div>
        <div class="invoice-no">Invoice Number: <strong>${invoiceNumber}</strong></div>
      </div>
      <div class="contact-info">
        For billing concerns/inquiry, connect with us<br>through our 24/7 hotlines and channels.<br>
        📞 Smart: 0998-123-4567 Globe: 0917-123-4567
      </div>
      <div class="notice-box">
        <div class="strong">NOTICE TO CUSTOMER</div>
        Payment must be settled within 3 calendar days from billing date. Failure to pay on or before the due date will result in automatic penalty charges.
      </div>
    </div>

    <div class="acct-row">
      <div>Acct. No.: ${accountNo}</div>
      <div>Route: @${String(roomId).replace(/\D/g, '') || '1'}</div>
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

      <tr>
        <td>Miscellaneous Fee (2%)</td>
        <td class="num">--</td>
        <td class="num">${a_misc.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Additional Charges</td>
        <td class="num">--</td>
        <td class="num">${additionalCharges.toFixed(2)}</td>
      </tr>
      <tr class="subtotal-row">
        <td>Other Charges</td>
        <td class="num">Subtotal</td>
        <td class="num">${sub4.toFixed(2)}</td>
      </tr>
    </table>

    <div class="amount-box">
      <div class="text-right bold" style="margin-bottom:4px;">AMOUNT (PHP)</div>
      <div class="amount-row"><span>Vatable Sales</span><span>${vatableSales.toFixed(2)}</span></div>
      <div class="amount-row"><span>VAT-Exempt Sales</span><span>0.00</span></div>
      <div class="amount-row"><span>Zero Rated Sales</span><span>0.00</span></div>
      <div class="amount-row"><span>VAT Amount</span><span>${sub3.toFixed(2)}</span></div>
      <div class="amount-row"><span>Electricity Subtotal</span><span>${electricitySubtotal.toFixed(2)}</span></div>
      ${penaltyFee > 0 ? `<div class="amount-row" style="color:red;"><span>Overdue Penalty Applied</span><span>${penaltyFee.toFixed(2)}</span></div>` : ''}
      <div class="amount-row"><span>Total Invoice Amount</span><span>${totalDue.toFixed(2)}</span></div>
      ${amountPaid > 0 ? `<div class="amount-row" style="color:#16A34A;"><span>Amount Paid</span><span>- ${amountPaid.toFixed(2)}</span></div>` : ''}
      ${isPaid && paymentMethodText ? `<div class="amount-row" style="color:#4B5563; font-size: 10px;"><span>Paid via ${paymentMethodText}</span><span></span></div>` : ''}
    </div>

    <div class="final-due-box">
      <div class="final-due-label">
        <div>Current Amount Due</div>
        <div style="font-weight:normal;">Current Bill Due Date</div>
      </div>
      <div class="final-due-val-col">
        <div class="final-due-val">${remainingBalance.toFixed(2)}</div>
        <div class="final-due-date">${dueDateStr}</div>
      </div>
    </div>

    <div class="overdue-box">
      ${isPaid 
        ? `<div class="overdue-row total" style="color:#16A34A; border-color: #BBF7D0;"><span>FULLY PAID</span></div>`
        : penaltyFee > 0             ? (() => {
                 const originalAmountForPenalty = Number(billingCycle.electricity_charge || billingCycle.total_cost || 0);
                 const dailyPenaltyAmountCalc = (originalAmountForPenalty * (penaltyRatePercent / 100)).toFixed(2);
                 return `<div class="overdue-row"><span>Original Amount Due</span><span>${originalAmountForPenalty.toFixed(2)}</span></div>
               <div class="overdue-row"><span>Daily Penalty Rate</span><span>${penaltyRatePercent}%</span></div>
               <div class="overdue-row"><span>Daily Penalty</span><span>${dailyPenaltyAmountCalc}</span></div>
               <div class="overdue-row"><span>Days Overdue</span><span>${daysOverdue}</span></div>
               <div class="overdue-row" style="color:#DC2626;"><span>Total Penalty</span><span>+ ${penaltyFee.toFixed(2)}</span></div>
               <div class="overdue-row total" style="color:red;"><span>CURRENT BALANCE</span><span>${totalDue.toFixed(2)}</span></div>`;
               })()
            : `<div class="overdue-row"><span>Penalty if paid after Due Date (${penaltyRatePercent}%)</span><span>${estimatedPenalty.toFixed(2)}</span></div>
               <div class="overdue-row total"><span>Amount Due After ${dueDateStr}</span><span>${(remainingBalance + estimatedPenalty).toFixed(2)}</span></div>`
      }
    </div>
  </div>
</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return { uri, fileName: `${invoiceNumber}.pdf` };
}

export async function shareReport(uri) {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    return { success: true };
  }
  return { success: false, message: 'Sharing is not available on this device' };
}
