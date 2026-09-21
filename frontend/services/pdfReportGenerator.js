/**
 * Wattipid Energy Analytics - PDF Report Generator
 * Builds high-resolution, print-optimized HTML/SVG documents for Expo Print.
 * Exactly aligns with the on-screen analytics calculations, dates, costs, and charts.
 */

export function buildAnalyticsReportHtml(options) {
  const {
    period = 'weekly',
    dateLabel = '',
    selectedDate = new Date(),
    roomId = 'Room 1',
    tenantName = 'Tenant',
    rate = 12.50,
    totalPeriodEnergy = 0,
    totalPeriodCost = 0,
    chartLabels = [],
    chartData = [],
    chartValues = [],
    peakIndex = -1,
    analysisUnit = 'kWh',
    compPct = 0,
    compCost = 0,
    forecastVal = 0,
    forecastOver = 0,
    footnote = '',
    activeCycle = null,
  } = options;

  const effectiveRate = parseFloat(rate || 12.50);
  const now = new Date();
  const issueDateStr = now.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const docRefNumber = `WT-${period.toUpperCase().slice(0, 3)}-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${String(now.getTime()).slice(-6)}`;

  // Period Titles & Badges
  const periodTitles = {
    daily: 'Daily Electricity Consumption Report',
    weekly: 'Weekly Electricity Consumption Report',
    monthly: 'Monthly Electricity Consumption Report',
    yearly: 'Annual Electricity Consumption Report',
  };
  const periodBadgeText = `${period.toUpperCase()} STATEMENT`;
  const reportMainTitle = periodTitles[period] || 'Electricity Consumption Report';

  // Compare label
  const compLabel = period === 'daily' ? 'DAY' : period === 'weekly' ? 'WEEK' : period === 'yearly' ? 'YEAR' : 'MONTH';

  // Calculate active intervals and average
  const totalItems = chartData.length;
  const activeItemsCount = chartData.filter(i => (i.energy || 0) > 0).length;
  const avgEnergy = totalItems > 0 ? totalPeriodEnergy / totalItems : 0;
  const avgCost = totalItems > 0 ? totalPeriodCost / totalItems : 0;

  // Peak Details
  let peakDetailStr = 'No peak recorded';
  if (peakIndex >= 0 && chartLabels[peakIndex] && chartData[peakIndex]) {
    const pEnergy = Number(chartData[peakIndex].energy || 0);
    const pCost = Number(chartData[peakIndex].cost || 0);
    peakDetailStr = `${chartLabels[peakIndex]} (${pEnergy.toFixed(3)} kWh • ₱${pCost.toFixed(2)})`;
  }

  // ─── Generate Inline SVG Chart ───────────────────────────────────────────────
  const chartSvgWidth = 760;
  const chartSvgHeight = 220;
  const plotLeft = 65;
  const plotRight = 735;
  const plotTop = 32;
  const plotBottom = 185;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;

  const maxVal = Math.max(...chartValues, 0.001);
  const isAllZero = totalPeriodEnergy === 0;

  // Horizontal Grid Lines
  const gridSteps = [1.0, 0.75, 0.5, 0.25, 0.0];
  let gridLinesSvg = '';
  gridSteps.forEach(step => {
    const yPos = plotBottom - step * plotHeight;
    const valAtStep = maxVal * step;
    const valLabel = isAllZero
      ? (step === 0 ? '0' : '')
      : analysisUnit === '₱'
        ? `₱${valAtStep.toFixed(valAtStep >= 10 ? 1 : 2)}`
        : `${valAtStep.toFixed(valAtStep >= 1 ? 2 : 3)} ${analysisUnit}`;

    gridLinesSvg += `
      <line x1="${plotLeft}" y1="${yPos}" x2="${plotRight}" y2="${yPos}" stroke="#E2E8F0" stroke-width="1" stroke-dasharray="${step === 0 ? '0' : '4 4'}" />
      ${valLabel ? `<text x="${plotLeft - 8}" y="${yPos + 4}" font-size="10" font-weight="500" fill="#94A3B8" text-anchor="end">${valLabel}</text>` : ''}
    `;
  });

  // Bars and X-Axis Labels
  let barsSvg = '';
  const numBars = chartLabels.length;
  if (numBars > 0) {
    const slotWidth = plotWidth / numBars;
    const barWidth = Math.max(Math.min(slotWidth * 0.65, 42), 6);

    chartLabels.forEach((label, idx) => {
      const item = chartData[idx] || { energy: 0, cost: 0, value: 0 };
      const val = chartValues[idx] || 0;
      const isPeak = idx === peakIndex && val > 0;
      const centerX = plotLeft + (idx + 0.5) * slotWidth;
      const barX = centerX - barWidth / 2;

      // Determine bar height
      if (val > 0) {
        const barHeight = Math.max((val / maxVal) * plotHeight, 4);
        const barY = plotBottom - barHeight;
        const barColor = isPeak ? '#10B981' : '#059669';

        barsSvg += `
          <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" rx="3" ry="3" fill="${barColor}" />
        `;

        // Peak Badge above bar
        if (isPeak) {
          const badgeW = 44;
          const badgeH = 16;
          const badgeY = Math.max(barY - badgeH - 4, 8);
          barsSvg += `
            <rect x="${centerX - badgeW / 2}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="4" fill="#10B981" />
            <text x="${centerX}" y="${badgeY + 11}" font-size="9" font-weight="700" fill="#FFFFFF" text-anchor="middle">PEAK</text>
          `;
        }
      } else {
        // Zero / Idle indicator
        barsSvg += `
          <rect x="${barX}" y="${plotBottom - 2}" width="${barWidth}" height="2" rx="1" fill="#E2E8F0" />
        `;
      }

      // X-Axis Labels logic
      let showLabel = true;
      if (period === 'monthly') {
        // For monthly 30 days: show 1, 5, 10, 15, 20, 25, last day, and peak
        const dayNum = parseInt(label, 10);
        showLabel = dayNum === 1 || dayNum % 5 === 0 || dayNum === numBars || idx === peakIndex;
      } else if (period === 'daily') {
        // For daily 24 hours: show every 3 hours (12AM, 3AM, 6AM, etc.) and peak
        showLabel = idx % 3 === 0 || idx === peakIndex;
      }

      if (showLabel) {
        const fontColor = isPeak ? '#10B981' : '#64748B';
        const fontWeight = isPeak ? '700' : '500';
        barsSvg += `
          <text x="${centerX}" y="${plotBottom + 18}" font-size="10" font-weight="${fontWeight}" fill="${fontColor}" text-anchor="middle">${label}</text>
        `;
      }
    });
  }

  // ─── Generate Detailed Breakdown Table Rows ───────────────────────────────────
  let tableRowsHtml = '';
  if (numBars > 0) {
    chartLabels.forEach((label, idx) => {
      const item = chartData[idx] || { energy: 0, cost: 0, value: 0 };
      const energy = Number(item.energy || 0);
      const cost = Number(item.cost || 0);
      const isPeak = idx === peakIndex && (energy > 0 || cost > 0);
      const sharePct = totalPeriodEnergy > 0 ? (energy / totalPeriodEnergy) * 100 : 0;

      // Date column display
      let rowDateDisplay = label;
      if (period === 'weekly') {
        const d = new Date(selectedDate);
        const dayOfWeek = d.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(d);
        monday.setDate(d.getDate() + mondayOffset);

        const curDay = new Date(monday);
        curDay.setDate(monday.getDate() + idx);
        const dayFullNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const mName = curDay.toLocaleDateString('en-US', { month: 'short' });
        rowDateDisplay = `${dayFullNames[idx]}, ${mName} ${curDay.getDate()}`;
      } else if (period === 'monthly') {
        const mName = selectedDate.toLocaleDateString('en-US', { month: 'short' });
        rowDateDisplay = `${mName} ${label}, ${selectedDate.getFullYear()}`;
      } else if (period === 'yearly') {
        rowDateDisplay = `${label} ${selectedDate.getFullYear()}`;
      } else if (period === 'daily') {
        const hr = idx;
        const ampm = hr >= 12 ? 'PM' : 'AM';
        const hr12 = hr % 12 || 12;
        const nextHr = (hr + 1) % 24;
        const nextAmpm = nextHr >= 12 ? 'PM' : 'AM';
        const nextHr12 = nextHr % 12 || 12;
        rowDateDisplay = `${hr12}:00 ${ampm} – ${nextHr12}:00 ${nextAmpm}`;
      }

      // Status Badge
      let statusBadge = `<span class="badge badge-idle">○ Idle (0W)</span>`;
      if (isPeak) {
        statusBadge = `<span class="badge badge-peak">★ Peak Usage</span>`;
      } else if (energy > 0) {
        statusBadge = `<span class="badge badge-recorded">● Recorded</span>`;
      }

      const rowClass = isPeak ? 'tr-peak' : energy > 0 ? 'tr-active' : 'tr-idle';

      tableRowsHtml += `
        <tr class="${rowClass}">
          <td><strong>${rowDateDisplay}</strong></td>
          <td class="num">${energy.toFixed(4)} kWh</td>
          <td class="num">₱${cost.toFixed(2)}</td>
          <td class="num">${sharePct.toFixed(1)}%</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    });
  }

  // ─── Assemble Complete High-Quality HTML ──────────────────────────────────────
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Wattipid Energy Report - ${dateLabel}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm 15mm 15mm 15mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0F172A;
            background: #FFFFFF;
            font-size: 11px;
            line-height: 1.45;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
          }

          /* Header Section */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #10B981;
            padding-bottom: 14px;
            margin-bottom: 16px;
          }
          .logo-group {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo-badge {
            width: 36px;
            height: 36px;
            border-radius: 9px;
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: 900;
            box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
          }
          .brand-title {
            font-size: 20px;
            font-weight: 800;
            color: #0F172A;
            letter-spacing: -0.5px;
          }
          .brand-sub {
            font-size: 10px;
            color: #64748B;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .header-meta {
            text-align: right;
          }
          .period-pill {
            display: inline-block;
            background: #ECFDF5;
            color: #065F46;
            border: 1px solid #A7F3D0;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .meta-date {
            font-size: 12px;
            font-weight: 700;
            color: #0F172A;
          }
          .meta-ref {
            font-size: 9px;
            color: #94A3B8;
            margin-top: 2px;
          }

          /* Info Banner */
          .info-banner {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 14px;
            gap: 12px;
          }
          .info-col .info-label {
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            color: #64748B;
            letter-spacing: 0.3px;
            margin-bottom: 2px;
          }
          .info-col .info-value {
            font-size: 12px;
            font-weight: 700;
            color: #0F172A;
          }

          /* Top 4 Summary Cards */
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 14px;
          }
          .metric-card {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 10px 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
          }
          .metric-card.highlight {
            background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
            border-color: #A7F3D0;
          }
          .card-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748B;
            margin-bottom: 4px;
            letter-spacing: 0.3px;
          }
          .card-value {
            font-size: 17px;
            font-weight: 800;
            color: #0F172A;
            line-height: 1.2;
          }
          .card-value.emerald {
            color: #059669;
          }
          .card-subtext {
            font-size: 9px;
            color: #64748B;
            margin-top: 3px;
          }

          /* Comparison & Forecast Box */
          .intel-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 14px;
          }
          .intel-card {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 10px 12px;
          }
          .intel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
          }
          .intel-title {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            color: #475569;
          }
          .intel-stat {
            font-size: 13px;
            font-weight: 800;
          }
          .intel-stat.red { color: #DC2626; }
          .intel-stat.amber { color: #D97706; }
          .intel-desc {
            font-size: 9.5px;
            color: #64748B;
          }

          /* Insight Footnote Banner */
          .insight-box {
            background: #F0FDF4;
            border: 1px solid #BBF7D0;
            border-radius: 6px;
            padding: 8px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 14px;
          }
          .insight-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10B981;
            flex-shrink: 0;
          }
          .insight-text {
            font-size: 10.5px;
            font-weight: 600;
            color: #065F46;
          }

          /* Chart Section */
          .chart-section {
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            background: #FFFFFF;
            padding: 12px 14px 10px 14px;
            margin-bottom: 16px;
          }
          .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }
          .chart-title {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #1E293B;
            letter-spacing: 0.5px;
          }
          .chart-legend {
            display: flex;
            gap: 12px;
            font-size: 9px;
            color: #64748B;
          }
          .legend-item {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .legend-color {
            width: 8px;
            height: 8px;
            border-radius: 2px;
          }

          /* Breakdown Table */
          .table-section {
            margin-bottom: 18px;
          }
          .section-heading {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            color: #1E293B;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
          }
          table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          table.data-table th {
            background: #F1F5F9;
            color: #475569;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            padding: 7px 10px;
            border-bottom: 2px solid #CBD5E1;
            text-align: left;
          }
          table.data-table td {
            padding: 6px 10px;
            border-bottom: 1px solid #F1F5F9;
            color: #1E293B;
          }
          table.data-table th.num,
          table.data-table td.num {
            text-align: right;
          }
          tr.tr-active {
            background: #F8FAFC;
          }
          tr.tr-peak {
            background: #ECFDF5;
            font-weight: 600;
          }
          tr.tr-idle {
            color: #94A3B8;
          }
          tr.tr-totals {
            background: #F1F5F9;
            border-top: 2px solid #CBD5E1;
            font-weight: 800;
            font-size: 10.5px;
          }
          tr.tr-totals td {
            padding: 8px 10px;
            border-bottom: none;
          }

          /* Status Badges */
          .badge {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 8.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          .badge-recorded {
            background: #E0F2FE;
            color: #0369A1;
          }
          .badge-peak {
            background: #D1FAE5;
            color: #065F46;
          }
          .badge-idle {
            background: #F1F5F9;
            color: #94A3B8;
          }

          /* Document Footer */
          .doc-footer {
            border-top: 1px solid #E2E8F0;
            padding-top: 12px;
            margin-top: 14px;
            text-align: center;
            color: #94A3B8;
            font-size: 9px;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="container">

          <!-- ── Header ─────────────────────────────────────────────── -->
          <div class="header">
            <div class="logo-group">
              <div class="logo-badge">W</div>
              <div>
                <div class="brand-title">WATTIPID</div>
                <div class="brand-sub">Smart Submetering & Analytics</div>
              </div>
            </div>
            <div class="header-meta">
              <div class="period-pill">${periodBadgeText}</div>
              <div class="meta-date">${dateLabel}</div>
              <div class="meta-ref">Doc Ref: ${docRefNumber} • Generated: ${issueDateStr}</div>
            </div>
          </div>

          <!-- ── Customer & Account Banner ──────────────────────────── -->
          <div class="info-banner">
            <div class="info-col">
              <div class="info-label">Room Identifier</div>
              <div class="info-value">${roomId}</div>
            </div>
            <div class="info-col">
              <div class="info-label">Account Tenant</div>
              <div class="info-value">${tenantName || 'Tenant'}</div>
            </div>
            <div class="info-col">
              <div class="info-label">Tariff Rate</div>
              <div class="info-value">₱${effectiveRate.toFixed(2)} / kWh</div>
            </div>
            <div class="info-col">
              <div class="info-label">Active Cycle</div>
              <div class="info-value">${activeCycle?.cycle_start ? `${activeCycle.cycle_start} – ${activeCycle.cycle_end}` : 'Standard Calendar'}</div>
            </div>
          </div>

          <!-- ── Key Summary Metric Cards ───────────────────────────── -->
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="card-label">Total Consumption</div>
              <div class="card-value">${totalPeriodEnergy.toFixed(3)} <span style="font-size:11px;font-weight:600;color:#64748B;">kWh</span></div>
              <div class="card-subtext">${activeItemsCount} active of ${totalItems} intervals</div>
            </div>
            <div class="metric-card highlight">
              <div class="card-label" style="color:#065F46;">Total Electricity Cost</div>
              <div class="card-value emerald">₱${totalPeriodCost.toFixed(2)}</div>
              <div class="card-subtext" style="color:#047857;">Based on ₱${effectiveRate.toFixed(2)}/kWh</div>
            </div>
            <div class="metric-card">
              <div class="card-label">Average / Interval</div>
              <div class="card-value">${avgEnergy.toFixed(3)} <span style="font-size:11px;font-weight:600;color:#64748B;">kWh</span></div>
              <div class="card-subtext">₱${avgCost.toFixed(2)} per interval</div>
            </div>
            <div class="metric-card">
              <div class="card-label">Peak Usage</div>
              <div class="card-value" style="font-size:13px;word-break:break-word;">${peakDetailStr}</div>
              <div class="card-subtext">Highest recorded interval</div>
            </div>
          </div>

          <!-- ── Comparative Analysis & Forecast ───────────────────── -->
          <div class="intel-row">
            <div class="intel-card">
              <div class="intel-header">
                <span class="intel-title">VS LAST ${compLabel}</span>
                <span class="intel-stat red">${compPct >= 0 ? '+' : ''}${compPct.toFixed(1)}% kWh</span>
              </div>
              <div class="intel-desc">
                ${compCost >= 0 ? `+₱${compCost.toFixed(2)}` : `-₱${Math.abs(compCost).toFixed(2)}`} variance compared to previous period
              </div>
            </div>
            <div class="intel-card">
              <div class="intel-header">
                <span class="intel-title">EOM Forecasted Bill</span>
                <span class="intel-stat amber">₱${forecastVal.toFixed(2)}</span>
              </div>
              <div class="intel-desc">
                ${forecastOver > 0 ? `Estimated ₱${forecastOver.toFixed(0)} over your budget cap` : 'Projected within designated monthly budget target'}
              </div>
            </div>
          </div>

          <!-- ── Smart Insight Footnote ─────────────────────────────── -->
          ${footnote ? `
            <div class="insight-box">
              <div class="insight-dot"></div>
              <div class="insight-text">${footnote}</div>
            </div>
          ` : ''}

          <!-- ── Timeline SVG Chart ─────────────────────────────────── -->
          <div class="chart-section">
            <div class="chart-header">
              <span class="chart-title">CONSUMPTION ANALYSIS TIMELINE (${analysisUnit})</span>
              <div class="chart-legend">
                <div class="legend-item"><div class="legend-color" style="background:#059669;"></div>Recorded Usage</div>
                <div class="legend-item"><div class="legend-color" style="background:#10B981;"></div>Peak Usage</div>
                <div class="legend-item"><div class="legend-color" style="background:#E2E8F0;"></div>Idle (0W)</div>
              </div>
            </div>
            <svg width="100%" height="220" viewBox="0 0 ${chartSvgWidth} ${chartSvgHeight}" xmlns="http://www.w3.org/2000/svg">
              ${gridLinesSvg}
              ${barsSvg}
            </svg>
          </div>

          <!-- ── Detailed Breakdown Table ───────────────────────────── -->
          <div class="table-section">
            <div class="section-heading">Detailed Consumption Breakdown</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Interval / Date</th>
                  <th class="num">Energy Consumed</th>
                  <th class="num">Electricity Cost</th>
                  <th class="num">Share (%)</th>
                  <th>Recording Status</th>
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
                <tr class="tr-totals">
                  <td>TOTAL PERIOD CONSUMPTION</td>
                  <td class="num">${totalPeriodEnergy.toFixed(4)} kWh</td>
                  <td class="num">₱${totalPeriodCost.toFixed(2)}</td>
                  <td class="num">100.0%</td>
                  <td>${activeItemsCount} / ${totalItems} Active Intervals</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- ── Official Verification Footer ───────────────────────── -->
          <div class="doc-footer">
            <p>Wattipid Smart IoT Submetering System • Official Verified Analytics Document</p>
            <p>This is a computer-generated statement issued by the Wattipid Submetering Engine. No manual signature required.</p>
          </div>

        </div>
      </body>
    </html>
  `;
}
