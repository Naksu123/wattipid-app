import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Generates a professional PDF report for a tenant's consumption.
 * @param {Object} data - The report data
 * @param {string} data.tenantName - Name of the tenant
 * @param {string} data.roomId - Room identifier
 * @param {string} data.period - 'weekly' or 'monthly'
 * @param {Array} data.breakdown - Array of daily readings
 * @param {number} data.totalCost - Total cost for the period
 * @param {number} data.totalEnergy - Total energy for the period
 * @param {number} data.rate - Rate per kWh
 */
export async function generateConsumptionReport(data) {
  const { tenantName, roomId, period, breakdown, totalCost, totalEnergy, rate } = data;
  const dateStr = new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #1f2937; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #22c55e; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { color: #22c55e; font-size: 28px; font-weight: bold; }
          .invoice-info { text-align: right; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #111827; }
          .meta { color: #6b7280; font-size: 14px; }
          
          .customer-section { margin-bottom: 30px; display: flex; justify-content: space-between; }
          .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #6b7280; margin-bottom: 5px; }
          .value { font-size: 16px; color: #111827; font-weight: 500; }
          
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
          .summary-card { background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; }
          .summary-label { font-size: 12px; color: #6b7280; margin-bottom: 5px; }
          .summary-value { font-size: 20px; font-weight: bold; color: #111827; }
          .summary-unit { font-size: 12px; color: #6b7280; margin-left: 2px; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f3f4f6; color: #4b5563; font-size: 12px; font-weight: bold; text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; }
          td { padding: 12px; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
          .tr-total { background: #f9fafb; font-weight: bold; }
          
          .footer { text-align: center; margin-top: 50px; color: #9ca3af; font-size: 12px; border-top: 1px solid #f3f4f6; padding-top: 20px; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: bold; }
          .badge-green { background: #dcfce7; color: #166534; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">WATTIPID</div>
          <div class="invoice-info">
            <div class="title">Electricity Statement</div>
            <div class="meta">Date Issued: ${dateStr}</div>
            <div class="meta">Period: ${period.toUpperCase()}</div>
          </div>
        </div>

        <div class="customer-section">
          <div>
            <div class="section-title">Billed To</div>
            <div class="value">${tenantName || 'Tenant'}</div>
            <div class="meta">Room: ${roomId}</div>
          </div>
          <div style="text-align: right">
            <div class="section-title">Status</div>
            <div class="badge badge-green">PAID / TRACKED</div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">Total Consumption</div>
            <div class="summary-value">${totalEnergy.toFixed(4)}<span class="summary-unit">kWh</span></div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Average Rate</div>
            <div class="summary-value">₱${rate.toFixed(2)}<span class="summary-unit">/kWh</span></div>
          </div>
          <div class="summary-card" style="background: #22c55e10; border-color: #22c55e40;">
            <div class="summary-label">Total Amount Due</div>
            <div class="summary-value" style="color: #166534;">₱${totalCost.toFixed(2)}</div>
          </div>
        </div>

        <div class="section-title">Daily Usage Details</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>kWh Consumed</th>
              <th>Peak Power (W)</th>
              <th>Amount Due (₱)</th>
            </tr>
          </thead>
          <tbody>
            ${breakdown.map(row => `
              <tr>
                <td>${row.date_label}</td>
                <td>${Number(row.energy).toFixed(4)}</td>
                <td>${Number(row.power).toFixed(0)}W</td>
                <td>₱${Number(row.cost).toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="tr-total">
              <td>TOTALS</td>
              <td>${totalEnergy.toFixed(4)} kWh</td>
              <td>-</td>
              <td>₱${totalCost.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <p>Thank you for using Wattipid IoT Energy Monitor.</p>
          <p>This is a computer-generated statement and does not require a signature.</p>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    if (Platform.OS === 'ios') {
      await Sharing.shareAsync(uri);
    } else {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Receipt' });
    }
    return true;
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return false;
  }
}
