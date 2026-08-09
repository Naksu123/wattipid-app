export const pdfColors = {
  primary: '#16A34A',
  primaryBg: '#F0FDF4',
  primaryBorder: '#BBF7D0',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  border: '#E2E8F0',
  background: '#F8FAFC',
};

export const pdfTypography = {
  fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  bodySize: '11px',
};

export const getMonthlyReportStyles = (isHigher) => `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1E293B; padding: 40px; font-size: 13px; background: #fff; line-height: 1.5; }
  .bill-container { max-width: 800px; margin: 0 auto; }
  
  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #22C55E; padding-bottom: 20px; margin-bottom: 30px; }
  .company h1 { color: ${pdfColors.primary}; font-size: 28px; letter-spacing: 1px; margin-bottom: 4px; display: flex; align-items: center; gap: 12px; }
  .company img { width: 36px; height: 36px; border-radius: 8px; }
  .company p { color: ${pdfColors.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  
  /* Badges */
  .statement-badge { background: ${pdfColors.background}; border: 1px solid ${pdfColors.border}; padding: 12px 20px; border-radius: 6px; text-align: right; }
  .statement-badge .title { font-weight: 700; color: ${pdfColors.textPrimary}; font-size: 16px; margin-bottom: 4px; }
  .statement-badge .date { color: ${pdfColors.textMuted}; font-size: 12px; }
  
  /* Customer */
  .customer-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .bill-to h3 { font-size: 11px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .bill-to h2 { font-size: 20px; color: ${pdfColors.textPrimary}; margin-bottom: 4px; }
  .bill-to p { color: ${pdfColors.textSecondary}; font-size: 14px; }
  
  /* Account Details */
  .account-details table { width: 100%; border-collapse: collapse; }
  .account-details td { padding: 4px 0; }
  .account-details td:first-child { color: ${pdfColors.textMuted}; font-size: 12px; padding-right: 24px; text-align: right; }
  .account-details td:last-child { color: ${pdfColors.textPrimary}; font-weight: 600; font-size: 13px; text-align: right; }
  
  /* Summary */
  .summary-section { margin-bottom: 40px; }
  .section-title { font-size: 14px; font-weight: 700; color: ${pdfColors.textPrimary}; border-bottom: 1px solid ${pdfColors.border}; padding-bottom: 8px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
  .summary-box { background: ${pdfColors.background}; border: 1px solid ${pdfColors.border}; border-radius: 8px; display: flex; overflow: hidden; }
  
  /* Amounts */
  .amount-due { background: #22C55E; color: white; padding: 24px; flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .amount-due span { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; margin-bottom: 4px; }
  .amount-due h2 { font-size: 32px; font-weight: 700; }
  
  /* Stats */
  .usage-stats { flex: 2; padding: 24px; display: flex; gap: 32px; align-items: center; }
  .stat-item { flex: 1; }
  .stat-item span { display: block; font-size: 11px; color: ${pdfColors.textMuted}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .stat-item strong { display: block; font-size: 18px; color: ${pdfColors.textPrimary}; }
  
  /* Comparison */
  .comparison-grid { display: flex; gap: 16px; margin-bottom: 40px; }
  .comp-card { flex: 1; border: 1px solid ${pdfColors.border}; border-radius: 6px; padding: 16px; text-align: center; }
  .comp-card .label { font-size: 11px; color: ${pdfColors.textMuted}; text-transform: uppercase; margin-bottom: 8px; }
  .comp-card .value { font-size: 16px; font-weight: 600; color: ${pdfColors.textPrimary}; }
  .comp-card.diff { background: ${isHigher ? pdfColors.dangerBg : pdfColors.primaryBg}; border-color: ${isHigher ? pdfColors.dangerBorder : pdfColors.primaryBorder}; }
  .comp-card.diff .value { color: ${isHigher ? pdfColors.danger : pdfColors.primary}; }
  
  /* Tables */
  table.breakdown { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
  table.breakdown th { background: #F1F5F9; color: ${pdfColors.textSecondary}; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid ${pdfColors.border}; }
  table.breakdown td { padding: 12px; border-bottom: 1px solid ${pdfColors.border}; color: ${pdfColors.textPrimary}; font-size: 13px; }
  table.breakdown tr:nth-child(even) td { background: #FAFAF9; }
  
  /* Footer */
  .footer { text-align: center; border-top: 1px solid ${pdfColors.border}; padding-top: 24px; color: #94A3B8; font-size: 11px; }
`;

export const getCycleReportStyles = () => `
  @page { margin: 0; }
  body { 
    font-family: ${pdfTypography.fontFamily}; 
    font-size: ${pdfTypography.bodySize}; 
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
  .text-red { color: ${pdfColors.danger}; }
  
  /* Header & Logo */
  .header { padding-bottom: 12px; border-bottom: 2px solid #E5E7EB; margin-bottom: 12px; }
  .logo-row { display: flex; align-items: center; justify-content: center; margin-bottom: 12px; gap: 10px;}
  .logo-circle { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .logo-circle img { width: 100%; height: 100%; object-fit: contain; }
  .company-details { text-align: left; line-height: 1.2; }
  .company-name { font-size: 13px; font-weight: 800; color: ${pdfColors.primary}; }
  .company-sub { font-size: 9px; color: #6B7280; margin-top: 2px;}
  
  /* Invoice Info */
  .invoice-title { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 10px; margin-bottom: 4px; color: #111827;}
  .invoice-no { font-size: 11px; margin-bottom: 12px; color: #4B5563; }
  
  /* Contact & Notices */
  .contact-info { font-size: 10px; line-height: 1.4; margin-bottom: 12px; text-align: center; color: #6B7280;}
  .notice-box { border: 1px solid #FCD34D; background: #FFFBEB; padding: 8px; font-size: 10px; text-align: center; margin-bottom: 12px; color: #B45309; border-radius: 4px;}
  .notice-box .strong { font-weight: 800; font-size: 11px; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px;}
  
  /* Details */
  .acct-row { border-top: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB; padding: 6px 0; display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #374151;}
  .tenant-info { padding: 8px 0; border-bottom: 1px solid #E5E7EB; font-size: 12px; line-height: 1.4; font-weight: 700; color: #111827;}
  .tenant-info span { color: #6B7280; font-weight: 500; font-size: 11px; }
  
  /* Meter */
  .meter-details { display: flex; border-bottom: 1px solid #E5E7EB; padding: 8px 0; font-size: 11px; color: #4B5563;}
  .meter-left { flex: 1; display: flex; flex-direction: column; gap: 6px; }
  .meter-right { flex: 1; border-left: 1px solid #E5E7EB; padding-left: 8px; display: flex; flex-direction: column; gap: 6px;}
  .meter-details span { font-weight: 700; color: #111827; }
  
  /* Tables */
  .reading-table { width: 100%; text-align: center; font-size: 11px; border-bottom: 1px solid #E5E7EB; border-collapse: collapse; margin-bottom: 4px;}
  .reading-table th { padding: 6px 0; color: #6B7280; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px;}
  .reading-table td { padding: 6px 0; font-weight: 600; color: #111827;}
  .reading-table .kwh-val { font-size: 16px; font-weight: 800; color: ${pdfColors.primary}; }
  
  .rate-table { width: 100%; font-size: 10px; border-collapse: collapse; margin-bottom: 8px; color: #374151; }
  .rate-table th { border-bottom: 1px solid #E5E7EB; padding: 6px 0; text-align: left; color: #6B7280; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px;}
  .rate-table td { padding: 4px 0; }
  .rate-table .num { text-align: right; width: 55px; font-weight: 500;}
  
  .subtotal-row { border-top: 1px solid #E5E7EB; font-weight: 700; color: #111827; }
  .border-bottom { border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-bottom: 6px;}
  
  /* Amounts */
  .amount-box { border-top: 2px solid #E5E7EB; border-bottom: 2px solid #E5E7EB; padding: 10px 0; font-size: 11px; color: #4B5563;}
  .amount-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .amount-row span:last-child { font-weight: 600; color: #111827;}
  
  /* Due Box */
  .final-due-box { padding: 12px 0 4px 0; display: flex; justify-content: space-between; align-items: flex-end; }
  .final-due-label { font-weight: 800; font-size: 12px; display: flex; flex-direction: column; gap: 4px; color: #111827;}
  .final-due-val-col { text-align: right; }
  .final-due-val { font-size: 22px; font-weight: 900; color: #10B981; letter-spacing: -0.5px;}
  .final-due-date { font-size: 11px; font-weight: 700; color: ${pdfColors.danger}; margin-top: 2px;}
  
  /* Overdue */
  .overdue-box { margin-top: 8px; padding: 8px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 4px; font-size: 10px; color: #991B1B; }
  .overdue-row { display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 4px;}
  .overdue-row.total { font-weight: 800; font-size: 12px; color: ${pdfColors.danger}; border-top: 1px solid #FECACA; padding-top: 4px; margin-top: 2px;}
`;
