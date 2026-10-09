import { Database, Borrower, Loan, Payment, Collector } from '../types';
import {
  datef,
  money,
  esc,
  bname,
  outstanding,
  total,
  paid,
  today,
  paymentPrincipal,
  paymentInterest,
  collectionCustomerRows,
  num,
  round2,
  performancePeriodBounds,
  collectorPerformanceRow,
  cname,
  aname
} from './calculations';

export function renderAndPrintHTML(title: string, htmlContent: string): void {
  // Try opening a clean pristine pop-up window first.
  // This completely bypasses any app modals, sidebars, controls, or background overlays,
  // which is crucial for old browsers (like on Windows 7) where media-print visibility styles may fail.
  try {
    const w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(htmlContent);
      w.document.close();
      w.document.title = title;
      return;
    }
  } catch (e) {
    console.warn('Pop-up printing blocked by browser, falling back to modal preview:', e);
  }

  // Fallback: Dispatch custom event to trigger the interactive in-app PrintModal
  try {
    window.dispatchEvent(
      new CustomEvent('sirtoy-open-print-modal', {
        detail: { title, html: htmlContent }
      })
    );
  } catch (err) {
    console.warn('Print modal dispatch warning:', err);
  }
}

// -------------------------------------------------------------
// EXECUTIVE & CORPORATE PRINT STYLESHEET
// Clean, standard, highly legible typography and crisp borders
// -------------------------------------------------------------
function getCorporatePrintStyle(orientation: 'portrait' | 'landscape' = 'portrait', isReceipt: boolean = false): string {
  if (isReceipt) {
    return `
      @page { size: auto; margin: 8mm; }
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #0f172a;
        background: #ffffff;
        font-size: 13px;
        line-height: 1.5;
        margin: 0 auto;
        padding: 24px;
        max-width: 440px;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .receipt-card {
        border: 1.5px solid #0f172a;
        border-radius: 8px;
        padding: 20px;
        background: #ffffff;
      }
      .receipt-header {
        text-align: center;
        border-bottom: 2px solid #0f172a;
        padding-bottom: 14px;
        margin-bottom: 16px;
      }
      .company-name {
        font-size: 18px;
        font-weight: 900;
        letter-spacing: 0.5px;
        color: #0f172a;
        margin: 0 0 2px 0;
        text-transform: uppercase;
      }
      .company-sub {
        font-size: 11px;
        font-weight: 600;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 6px;
      }
      .doc-title {
        font-size: 15px;
        font-weight: 800;
        letter-spacing: 1px;
        color: #0f172a;
        background: #f1f5f9;
        padding: 4px 12px;
        display: inline-block;
        border-radius: 4px;
        margin-top: 4px;
      }
      .meta-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        font-size: 12px;
        margin-bottom: 14px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 10px;
        border-radius: 6px;
      }
      .meta-item { display: flex; flex-direction: column; }
      .meta-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
      .meta-val { font-size: 12px; font-weight: 700; color: #0f172a; }
      .amount-banner {
        background: #f0fdf4;
        border: 2px solid #16a34a;
        border-radius: 6px;
        padding: 12px;
        text-align: center;
        margin-bottom: 16px;
      }
      .amount-banner-label {
        font-size: 11px;
        font-weight: 800;
        color: #15803d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .amount-banner-val {
        font-size: 24px;
        font-weight: 900;
        color: #166534;
        margin-top: 2px;
      }
      .ledger-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 16px;
      }
      .ledger-table td {
        padding: 6px 4px;
        border-bottom: 1px solid #e2e8f0;
        font-size: 12px;
      }
      .ledger-table td:last-child {
        text-align: right;
        font-weight: 700;
        color: #0f172a;
      }
      .signatures-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-top: 28px;
        padding-top: 10px;
      }
      .sig-box {
        text-align: center;
        border-top: 1.5px solid #0f172a;
        padding-top: 6px;
        font-size: 11px;
        font-weight: 700;
        color: #334155;
      }
      .sig-sub {
        font-size: 9px;
        font-weight: 500;
        color: #64748b;
        margin-top: 1px;
      }
      .receipt-footer {
        text-align: center;
        font-size: 10px;
        color: #64748b;
        margin-top: 16px;
        border-top: 1px dashed #cbd5e1;
        padding-top: 10px;
      }
    `;
  }

  // Standard corporate document styling (A4 Portrait or Landscape)
  return `
    @page {
      size: ${orientation === 'landscape' ? 'A4 landscape' : 'A4 portrait'};
      margin: 12mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.45;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .letterhead {
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .letterhead-brand h1 {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 2px 0;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .letterhead-brand p {
      font-size: 10px;
      font-weight: 600;
      color: #475569;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .letterhead-doc {
      text-align: right;
    }
    .letterhead-doc h2 {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 3px 0;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .letterhead-doc p {
      font-size: 10px;
      color: #64748b;
      margin: 0;
    }
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .kpi-card {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 8px 10px;
      border-radius: 6px;
    }
    .kpi-card-label {
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
    }
    .kpi-card-value {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      display: block;
      margin-top: 2px;
    }
    .info-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 14px;
      background: #ffffff;
      margin-bottom: 14px;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 16px;
      align-items: center;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px 16px;
      font-size: 11px;
    }
    .info-field b { color: #475569; font-weight: 600; font-size: 10px; text-transform: uppercase; display: block; }
    .info-field span { font-weight: 700; color: #0f172a; }
    .table-section-title {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 14px 0 6px 0;
      padding-bottom: 4px;
      border-bottom: 1px solid #cbd5e1;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      margin-bottom: 14px;
      page-break-inside: auto;
    }
    table.data-table tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    table.data-table th {
      background: #f1f5f9;
      color: #1e293b;
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      text-align: left;
    }
    table.data-table td {
      padding: 5px 8px;
      border: 1px solid #e2e8f0;
      font-size: 10.5px;
      color: #1e293b;
      vertical-align: middle;
    }
    table.data-table tr:nth-child(even) td {
      background: #f8fafc;
    }
    table.data-table td.text-right, table.data-table th.text-right {
      text-align: right;
    }
    table.data-table td.text-center, table.data-table th.text-center {
      text-align: center;
    }
    .totals-row td {
      background: #f1f5f9 !important;
      font-weight: 800 !important;
      color: #0f172a !important;
      border-top: 1.5px solid #0f172a !important;
    }
    .signatures-block {
      margin-top: 28px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      page-break-inside: avoid;
    }
    .sig-line {
      border-top: 1.5px solid #0f172a;
      padding-top: 6px;
      text-align: center;
      font-size: 10.5px;
      font-weight: 700;
      color: #1e293b;
    }
    .sig-line small {
      display: block;
      font-size: 9px;
      font-weight: 500;
      color: #64748b;
      margin-top: 1px;
    }
    .cert-notice {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 16px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
    }
  `;
}

// -------------------------------------------------------------
// 1. OFFICIAL PAYMENT RECEIPT
// Standard, authoritative payment acknowledgment slip
// -------------------------------------------------------------
export function printPaymentReceipt(db: Database, paymentId: string): void {
  const p = db.payments.find(x => x.id === paymentId);
  if (!p) {
    console.warn('Payment not found.');
    return;
  }
  const l = db.loans.find(x => x.id === p.loanId);
  const b = db.borrowers.find(x => x.id === (p.borrowerId || l?.borrowerId));
  const collectorObj = db.collectors.find(c => c.id === p.collectorId);
  const areaObj = db.areas.find(a => a.id === (b?.areaId || collectorObj?.areaId));

  const currentOutstanding = l ? outstanding(l) : 0;
  const previousBalance = round2(currentOutstanding + num(p.amount));

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Payment Receipt - ${esc(p.loanNo)}</title><style>
    ${getCorporatePrintStyle('portrait', true)}
  </style></head><body>
    <div class="receipt-card">
      <div class="receipt-header">
        <h1 class="company-name">${esc(db.settings.company || 'LOAN MANAGEMENT SYSTEM, INC.')}</h1>
        <div class="company-sub">Microfinance & Lending Services</div>
        <div class="doc-title">OFFICIAL PAYMENT RECEIPT</div>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Receipt No.</span>
          <span class="meta-val font-mono">${esc(p.id)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Date & Time</span>
          <span class="meta-val">${datef(p.date)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Loan Account</span>
          <span class="meta-val">${esc(p.loanNo)}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Loan Product</span>
          <span class="meta-val">${esc(l?.loanType || l?.method || 'Standard Term')}</span>
        </div>
      </div>

      <div class="amount-banner">
        <div class="amount-banner-label">Total Amount Received</div>
        <div class="amount-banner-val">${money(p.amount)}</div>
      </div>

      <table class="ledger-table">
        <tr>
          <td>Borrower Name</td>
          <td><b>${esc(bname(b))}</b></td>
        </tr>
        <tr>
          <td>Payment Mode</td>
          <td>${esc(p.method || 'Cash')} ${p.reference ? `(Ref: ${esc(p.reference)})` : ''}</td>
        </tr>
        <tr>
          <td>Principal Portion</td>
          <td>${money(p.principalCollected ?? paymentPrincipal(p, db))}</td>
        </tr>
        <tr>
          <td>Interest Portion</td>
          <td>${money(p.interestCollected ?? paymentInterest(p, db))}</td>
        </tr>
        <tr>
          <td>Previous Balance</td>
          <td>${money(previousBalance)}</td>
        </tr>
        <tr style="border-top: 1.5px solid #0f172a;">
          <td><b>Remaining Balance</b></td>
          <td style="font-size: 14px; color: #0f172a;"><b>${money(currentOutstanding)}</b></td>
        </tr>
        <tr>
          <td>Assigned Collector</td>
          <td>${esc(cname(collectorObj))}</td>
        </tr>
        <tr>
          <td>Area / Branch</td>
          <td>${esc(aname(areaObj))}</td>
        </tr>
      </table>

      <div class="signatures-grid">
        <div class="sig-box">
          Customer Signature
          <div class="sig-sub">Conforme / Borrower</div>
        </div>
        <div class="sig-box">
          ${esc(cname(collectorObj))}
          <div class="sig-sub">Authorized Collector / Cashier</div>
        </div>
      </div>

      <div class="receipt-footer">
        This document serves as an official proof of payment.<br>
        Thank you for paying on time! Retain this receipt for your records.
      </div>
    </div>
    <script>window.onload=()=>window.print()</script>
  </body></html>`;

  renderAndPrintHTML(`Payment Receipt ${p.loanNo}`, html);
}

// -------------------------------------------------------------
// 2. STATEMENT OF ACCOUNT (SOA) - BORROWER & LOAN
// Bank-grade, crystal-clear corporate layout
// -------------------------------------------------------------
function soaScheduleRows(l: Loan): string {
  let running = round2(l?.principal || 0);
  return (l?.schedule || []).map((r, i) => {
    const begin = Number.isFinite(Number(r.beginningBalance)) && num(r.beginningBalance) > 0 ? round2(r.beginningBalance) : running;
    const amount = round2(r.amount);
    const principalPart = round2(r.principal);
    const interest = round2(r.interest);
    const paidAmt = round2(r.paid);
    const remaining = round2(Math.max(0, amount - paidAmt));
    const ending = Number.isFinite(Number(r.endingBalance)) && num(r.endingBalance) > 0 ? round2(r.endingBalance) : round2(Math.max(0, begin - principalPart));
    running = ending;
    return `<tr>
      <td class="text-center">${i + 1}</td>
      <td>${datef(r.due)}</td>
      <td class="text-right">${money(begin)}</td>
      <td class="text-right"><b>${money(amount)}</b></td>
      <td class="text-right">${money(principalPart)}</td>
      <td class="text-right">${money(interest)}</td>
      <td class="text-right">${money(paidAmt)}</td>
      <td class="text-right">${money(remaining)}</td>
      <td class="text-right">${money(ending)}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="9" class="text-center">No amortization schedule.</td></tr>';
}

function soaPaymentRows(db: Database, l: Loan): string {
  const rows = db.payments.filter(p => p.loanId === l.id).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return rows.map((p, i) => `<tr>
    <td class="text-center">${i + 1}</td>
    <td>${datef(p.date)}</td>
    <td class="font-mono">${esc(p.id || '')}</td>
    <td class="text-right"><b>${money(p.amount)}</b></td>
    <td class="text-right">${money(p.principalCollected ?? paymentPrincipal(p, db))}</td>
    <td class="text-right">${money(p.interestCollected ?? paymentInterest(p, db))}</td>
    <td>${esc(p.method || '')}</td>
    <td>${esc(p.reference || '—')}</td>
  </tr>`).join('') || '<tr><td colspan="8" class="text-center">No payment history recorded for this loan yet.</td></tr>';
}

function soaLoanHTML(db: Database, l: Loan, includePayments = true): string {
  const ps = db.payments.filter(p => p.loanId === l.id);
  const paidAmt = ps.reduce((s, p) => s + num(p.amount), 0);
  return `
    <div style="margin-top: 18px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; page-break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 8px;">
        <div>
          <span style="font-size: 13px; font-weight: 800; color: #0f172a;">Loan No: ${esc(l.loanNo)}</span>
          <span style="margin-left: 8px; font-size: 11px; font-weight: 700; color: #475569;">(${esc(l.loanType || l.method || 'Standard')})</span>
        </div>
        <span style="font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 4px; background: ${l.status === 'Paid' ? '#dcfce7; color: #15803d' : '#f1f5f9; color: #1e293b'};">
          ${esc(l.status)}
        </span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; background: #f8fafc; padding: 8px; border-radius: 4px;">
        <div><small style="color: #64748b; font-weight: 700;">PRINCIPAL</small><div style="font-weight: 800;">${money(l.principal)}</div></div>
        <div><small style="color: #64748b; font-weight: 700;">TOTAL PAYABLE</small><div style="font-weight: 800;">${money(total(l))}</div></div>
        <div><small style="color: #64748b; font-weight: 700;">TOTAL PAID</small><div style="font-weight: 800; color: #166534;">${money(paidAmt)}</div></div>
        <div><small style="color: #64748b; font-weight: 700;">OUTSTANDING</small><div style="font-weight: 800; color: #991b1b;">${money(outstanding(l))}</div></div>
      </div>

      <div class="table-section-title">Amortization Schedule</div>
      <table class="data-table">
        <thead>
          <tr>
            <th class="text-center">#</th>
            <th>Due Date</th>
            <th class="text-right">Beginning</th>
            <th class="text-right">Amortization</th>
            <th class="text-right">Principal</th>
            <th class="text-right">Interest</th>
            <th class="text-right">Paid</th>
            <th class="text-right">Remaining</th>
            <th class="text-right">Ending</th>
          </tr>
        </thead>
        <tbody>${soaScheduleRows(l)}</tbody>
      </table>

      ${includePayments ? `
        <div class="table-section-title">Collections Credited</div>
        <table class="data-table">
          <thead>
            <tr>
              <th class="text-center">#</th>
              <th>Date</th>
              <th>Receipt No</th>
              <th class="text-right">Amount Paid</th>
              <th class="text-right">Principal</th>
              <th class="text-right">Interest</th>
              <th>Method</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>${soaPaymentRows(db, l)}</tbody>
        </table>
      ` : ''}
    </div>
  `;
}

export function borrowerSOABody(db: Database, b: Borrower): string {
  const loans = db.loans.filter(l => l.borrowerId === b.id).slice().sort((a, z) => String(a.date).localeCompare(String(z.date)));
  const approvedLoans = loans.filter(l => (l.approvalStatus || 'Approved') === 'Approved');
  const totalPrincipal = approvedLoans.reduce((s, l) => s + num(l.principal), 0);
  const totalPaid = approvedLoans.reduce((s, l) => s + paid(l), 0);
  const balance = approvedLoans.reduce((s, l) => s + outstanding(l), 0);

  const photoHtml = b.idImage
    ? `<img src="${esc(b.idImage)}" alt="Customer ID" style="width: 72px; height: 86px; object-fit: cover; border: 1.5px solid #0f172a; border-radius: 4px;">`
    : `<div style="width: 72px; height: 86px; border: 1px dashed #94a3b8; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #64748b; text-align: center; background: #f8fafc;">Photo on File</div>`;

  const areaName = aname(db.areas.find(a => a.id === b.areaId));
  const collectorName = cname(db.collectors.find(c => c.id === b.collectorId));

  return `
    <div class="info-card">
      <div>${photoHtml}</div>
      <div class="info-grid">
        <div class="info-field"><b>Full Legal Name</b><span>${esc(bname(b))}</span></div>
        <div class="info-field"><b>Account / Customer ID</b><span class="font-mono">${esc(b.id)}</span></div>
        <div class="info-field"><b>ID Document</b><span>${esc((b.idType || '') + ' ' + (b.idNo || '')).trim() || 'Verified'}</span></div>
        <div class="info-field"><b>Mobile Contact</b><span>${esc(b.contact || '—')}</span></div>
        <div class="info-field"><b>Residence Address</b><span>${esc(b.address || '—')}</span></div>
        <div class="info-field"><b>Assigned Area / Route</b><span>${esc(areaName)} (${esc(collectorName)})</span></div>
        <div class="info-field"><b>Co-Maker Details</b><span>${esc(b.comaker || 'None on record')} ${b.comakerContact ? `(${esc(b.comakerContact)})` : ''}</span></div>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-card">
        <span class="kpi-card-label">Approved Accounts</span>
        <span class="kpi-card-value">${approvedLoans.length} Loans</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-card-label">Total Principal Borrowed</span>
        <span class="kpi-card-value">${money(totalPrincipal)}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-card-label">Total Collections Made</span>
        <span class="kpi-card-value" style="color: #166534;">${money(totalPaid)}</span>
      </div>
      <div class="kpi-card" style="border-color: #fca5a5; background: #fef2f2;">
        <span class="kpi-card-label" style="color: #991b1b;">Current Account Balance</span>
        <span class="kpi-card-value" style="color: #991b1b;">${money(balance)}</span>
      </div>
    </div>

    ${approvedLoans.map(l => soaLoanHTML(db, l, true)).join('') || '<div style="padding: 24px; text-align: center; color: #64748b;">No approved loan records found for this client.</div>'}
  `;
}

export function printBorrowerSOA(db: Database, borrowerId: string): void {
  const b = db.borrowers.find(x => x.id === borrowerId);
  if (!b) {
    console.warn('Borrower not found.');
    return;
  }
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>SOA - ${esc(bname(b))}</title><style>
    ${getCorporatePrintStyle('portrait')}
  </style></head><body>
    <div class="letterhead">
      <div class="letterhead-brand">
        <h1>${esc(db.settings.company || 'LOAN MANAGEMENT SYSTEM, INC.')}</h1>
        <p>Microfinance, Consumer Credit & Small Business Loans</p>
      </div>
      <div class="letterhead-doc">
        <h2>STATEMENT OF ACCOUNT</h2>
        <p>As of Date: <b>${datef(today())}</b></p>
      </div>
    </div>

    ${borrowerSOABody(db, b)}

    <div class="signatures-block">
      <div class="sig-line">
        Customer Signature (Conforme)
        <small>Client Acknowledgment</small>
      </div>
      <div class="sig-line">
        Prepared By
        <small>Assigned Credit Officer / Collector</small>
      </div>
      <div class="sig-line">
        Verified Correct
        <small>Branch Operations Manager</small>
      </div>
    </div>

    <div class="cert-notice">
      Official computerized Statement of Account generated by Loan Management System.<br>
      This document certifies the current loan ledger standings as reflected in official company records.
    </div>
    <script>window.onload=()=>window.print()</script>
  </body></html>`;

  renderAndPrintHTML(`SOA - ${bname(b)}`, html);
}

export function printLoanSOA(db: Database, loanId: string): void {
  const l = db.loans.find(x => x.id === loanId);
  const b = l ? db.borrowers.find(x => x.id === l.borrowerId) : null;
  if (!l || !b) {
    console.warn('Loan or borrower not found.');
    return;
  }
  const areaName = aname(db.areas.find(a => a.id === b.areaId));
  const collectorName = cname(db.collectors.find(c => c.id === b.collectorId));

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>SOA - ${esc(l.loanNo)}</title><style>
    ${getCorporatePrintStyle('portrait')}
  </style></head><body>
    <div class="letterhead">
      <div class="letterhead-brand">
        <h1>${esc(db.settings.company || 'LOAN MANAGEMENT SYSTEM, INC.')}</h1>
        <p>Microfinance, Consumer Credit & Small Business Loans</p>
      </div>
      <div class="letterhead-doc">
        <h2>STATEMENT OF ACCOUNT</h2>
        <p>Loan No: <b>${esc(l.loanNo)}</b> • Date: <b>${datef(today())}</b></p>
      </div>
    </div>

    <div class="info-card">
      <div class="info-grid" style="grid-template-columns: repeat(3, 1fr); width: 100%;">
        <div class="info-field"><b>Borrower Name</b><span>${esc(bname(b))}</span></div>
        <div class="info-field"><b>Customer ID</b><span class="font-mono">${esc(b.id)}</span></div>
        <div class="info-field"><b>Contact</b><span>${esc(b.contact || '—')}</span></div>
        <div class="info-field"><b>Address</b><span>${esc(b.address || '—')}</span></div>
        <div class="info-field"><b>Area / Route</b><span>${esc(areaName)}</span></div>
        <div class="info-field"><b>Account Collector</b><span>${esc(collectorName)}</span></div>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-card">
        <span class="kpi-card-label">Loan Product</span>
        <span class="kpi-card-value">${esc(l.loanType || l.method || 'Standard')}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-card-label">Principal Released</span>
        <span class="kpi-card-value">${money(l.principal)}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-card-label">Total Payable</span>
        <span class="kpi-card-value">${money(total(l))}</span>
      </div>
      <div class="kpi-card" style="border-color: #fca5a5; background: #fef2f2;">
        <span class="kpi-card-label" style="color: #991b1b;">Current Balance</span>
        <span class="kpi-card-value" style="color: #991b1b;">${money(outstanding(l))}</span>
      </div>
    </div>

    <div class="table-section-title">Contract Amortization Schedule</div>
    <table class="data-table">
      <thead>
        <tr>
          <th class="text-center">#</th>
          <th>Due Date</th>
          <th class="text-right">Beginning</th>
          <th class="text-right">Amortization Due</th>
          <th class="text-right">Principal</th>
          <th class="text-right">Interest</th>
          <th class="text-right">Paid</th>
          <th class="text-right">Remaining</th>
          <th class="text-right">Ending</th>
        </tr>
      </thead>
      <tbody>${soaScheduleRows(l)}</tbody>
    </table>

    <div class="table-section-title">Payments & Remittances Ledger</div>
    <table class="data-table">
      <thead>
        <tr>
          <th class="text-center">#</th>
          <th>Payment Date</th>
          <th>Receipt No.</th>
          <th class="text-right">Amount Paid</th>
          <th class="text-right">Principal Portion</th>
          <th class="text-right">Interest Portion</th>
          <th>Payment Method</th>
          <th>Reference / Remarks</th>
        </tr>
      </thead>
      <tbody>${soaPaymentRows(db, l)}</tbody>
    </table>

    <div class="signatures-block">
      <div class="sig-line">
        Customer Signature (Conforme)
        <small>Client Acknowledgment</small>
      </div>
      <div class="sig-line">
        Prepared By
        <small>Account Collector / Credit Officer</small>
      </div>
      <div class="sig-line">
        Verified Correct
        <small>Branch Operations Manager</small>
      </div>
    </div>

    <div class="cert-notice">
      Official Statement of Account issued by ${esc(db.settings.company || 'Loan Management System, Inc.')}. Thank you for your continued patronage.
    </div>
    <script>window.onload=()=>window.print()</script>
  </body></html>`;

  renderAndPrintHTML(`SOA - ${l.loanNo}`, html);
}

// -------------------------------------------------------------
// 3. DAILY FIELD COLLECTION RUN SHEET
// Designed specifically for field collectors on routes (A4 Landscape)
// -------------------------------------------------------------
export function printCollectionSheet(db: Database, collectionDate: string, collectorId: string): void {
  const d = collectionDate || today();
  const cid = collectorId || 'ALL';
  const rows = collectionCustomerRows(db, cid, d);
  const active = rows.filter(x => x.state === 'Active');
  const overdue = rows.filter(x => x.state === 'Overdue');

  if (!rows.length) {
    console.warn('No active or overdue customers are available for this collection sheet.');
    return;
  }

  const collectorObj = db.collectors.find(c => c.id === cid);
  const collectorLabel = cid === 'ALL' ? 'All Collectors' : cname(collectorObj);
  const areaLabel = cid === 'ALL' ? 'Multiple Areas' : aname(db.areas.find(a => a.id === collectorObj?.areaId));

  const totalCapital = rows.reduce((s, x) => s + x.loans.reduce((q, l) => q + num(l.principal), 0), 0);
  const totalBalance = rows.reduce((s, x) => s + num(x.totalOutstanding), 0);
  const expected = rows.reduce((s, x) => s + num(x.expectedToday), 0);

  // Dynamic auto-fit and auto-adjust styles depending on the size of the customer list
  let fontSize = '11px';
  let headerFontSize = '12px';
  let titleFontSize = '18px';
  let padding = '5px 8px';
  let tableMargin = '15px';
  let kpiPadding = '8px 10px';
  let pageMargin = '8mm';

  if (rows.length > 30) {
    fontSize = '7.5px';
    headerFontSize = '8.5px';
    titleFontSize = '14px';
    padding = '2px 4px';
    tableMargin = '8px';
    kpiPadding = '4px 6px';
    pageMargin = '4mm';
  } else if (rows.length > 15) {
    fontSize = '9px';
    headerFontSize = '10px';
    titleFontSize = '16px';
    padding = '3.5px 6px';
    tableMargin = '10px';
    kpiPadding = '6px 8px';
    pageMargin = '6mm';
  }

  const makeCustomerRows = (rs: typeof rows, startNo = 1) => rs.map((x, i) => {
    const loanNumbers = x.loans.map(l => l.loanNo).join(', ');
    const loanTypes = x.loans.map(l => l.loanType || l.method || 'Standard').join(', ');
    const areaName = aname(db.areas.find(a => a.id === x.b.areaId));
    const subtextStyle = fontSize === '11px' 
      ? 'font-size: 9px; color: #475569;' 
      : `font-size: calc(${fontSize} - 1px); color: #475569;`;

    return `<tr>
      <td class="text-center">${startNo + i}</td>
      <td>
        <b style="color: #000000;">${esc(bname(x.b))}</b>
        <div style="${subtextStyle}">${esc(x.b.contact || 'No Contact')} • ${esc(areaName)}</div>
      </td>
      <td>
        <b style="color: #000000;">${esc(loanNumbers)}</b>
        <div style="${subtextStyle}">${esc(loanTypes)}</div>
      </td>
      <td>${esc(x.b.address || '—')}</td>
      <td class="text-right font-mono"><b>${money(x.expectedToday)}</b></td>
      <td class="text-right font-mono" style="${x.arrears > 0 ? 'font-weight: bold; color: #b91c1c;' : ''}">${money(x.arrears)}</td>
      <td class="text-right font-mono" style="font-weight: bold;">${money(x.totalOutstanding)}</td>
      <td style="border: 1px solid #000000; background: #ffffff;"></td>
      <td style="border: 1px solid #000000; background: #ffffff;"></td>
      <td style="border: 1px solid #000000; background: #ffffff; min-width: 80px;"></td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Daily Collection Sheet - ${d}</title><style>
    @page {
      size: A4 portrait;
      margin: ${pageMargin};
    }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      color: #000000;
      background: #ffffff;
      font-size: ${fontSize};
      line-height: 1.35;
      margin: 0;
      padding: 0;
    }
    .print-header {
      border-bottom: 2px solid #000000;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .print-header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .print-title {
      font-size: ${titleFontSize};
      font-weight: 900;
      color: #000000;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .print-subtitle {
      font-size: calc(${fontSize} - 0.5px);
      font-weight: 600;
      color: #334155;
      margin: 2px 0 0 0;
      text-transform: uppercase;
    }
    .print-meta-info {
      text-align: right;
    }
    .print-meta-info h2 {
      font-size: calc(${titleFontSize} - 2px);
      font-weight: 800;
      color: #000000;
      margin: 0 0 2px 0;
      text-transform: uppercase;
    }
    .print-meta-info p {
      font-size: calc(${fontSize} - 0.5px);
      margin: 0;
      color: #334155;
    }
    
    /* KPI Tables (No grid layout for robust multi-browser print) */
    .kpi-table-classic {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: ${tableMargin};
    }
    .kpi-table-classic td {
      border: 1px solid #000000;
      padding: ${kpiPadding};
      text-align: center;
      background: #ffffff;
      width: 20%;
    }
    .kpi-label-classic {
      font-size: calc(${fontSize} - 2px);
      font-weight: bold;
      color: #475569;
      text-transform: uppercase;
      display: block;
      margin-bottom: 1px;
    }
    .kpi-value-classic {
      font-size: calc(${headerFontSize} + 1px);
      font-weight: 900;
      color: #000000;
    }

    table.data-table-classic {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: ${tableMargin};
      page-break-inside: auto;
    }
    table.data-table-classic tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    table.data-table-classic th {
      background: #f1f5f9;
      color: #000000;
      font-size: calc(${fontSize} - 1px);
      font-weight: 800;
      text-transform: uppercase;
      padding: ${padding};
      border: 1px solid #000000;
      text-align: left;
    }
    table.data-table-classic td {
      padding: ${padding};
      border: 1px solid #000000;
      font-size: ${fontSize};
      color: #000000;
      vertical-align: middle;
    }
    table.data-table-classic tr:nth-child(even) td {
      background: #fafafa;
    }
    table.data-table-classic tr.totals-row-classic td {
      background: #e2e8f0 !important;
      font-weight: bold !important;
      color: #000000 !important;
      border-top: 2px solid #000000 !important;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono { font-family: monospace; }
    
    .remittance-block-classic {
      margin-top: 15px;
      border: 1.5px solid #000000;
      padding: 10px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .remittance-log-classic {
      font-size: ${fontSize};
      width: 50%;
    }
    .remittance-log-classic b {
      display: block;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .remittance-grid-classic {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
    }
    .remittance-field {
      margin-bottom: 3px;
    }
    .sig-line-classic {
      width: 22%;
      border-top: 1px solid #000000;
      text-align: center;
      padding-top: 4px;
      margin-top: auto;
      font-size: ${fontSize};
      font-weight: bold;
    }
    .sig-line-classic small {
      display: block;
      font-size: calc(${fontSize} - 2px);
      color: #475569;
      font-weight: normal;
      margin-top: 1px;
    }
  </style></head><body>
    <div class="print-header">
      <div class="print-header-top">
        <div class="print-brand">
          <h1 class="print-title">${esc(db.settings.company || 'LOAN MANAGEMENT SYSTEM, INC.')}</h1>
          <p class="print-subtitle">Daily Field Collection Run Sheet & Route Ledger</p>
        </div>
        <div class="print-meta-info">
          <h2>COLLECTION SHEET</h2>
          <p>Collection Date: <b>${datef(d)}</b> • Route / Area: <b>${esc(areaLabel)}</b></p>
        </div>
      </div>
    </div>

    <table class="kpi-table-classic">
      <tr>
        <td>
          <span class="kpi-label-classic">Assigned Collector</span>
          <span class="kpi-value-classic">${esc(collectorLabel)}</span>
        </td>
        <td>
          <span class="kpi-label-classic">Scheduled Accounts</span>
          <span class="kpi-value-classic">${rows.length} Clients (${overdue.length} Past Due)</span>
        </td>
        <td>
          <span class="kpi-label-classic">Target Daily Collection</span>
          <span class="kpi-value-classic">${money(expected)}</span>
        </td>
        <td>
          <span class="kpi-label-classic">Total Route Balance</span>
          <span class="kpi-value-classic">${money(totalBalance)}</span>
        </td>
        <td>
          <span class="kpi-label-classic">Total Capital Out</span>
          <span class="kpi-value-classic">${money(totalCapital)}</span>
        </td>
      </tr>
    </table>

    <table class="data-table-classic">
      <thead>
        <tr>
          <th class="text-center" style="width: 3%;">#</th>
          <th style="width: 24%;">Borrower Client</th>
          <th style="width: 14%;">Loan Account</th>
          <th style="width: 18%;">Route / Address</th>
          <th class="text-right" style="width: 9%;">Due Today</th>
          <th class="text-right" style="width: 8%;">Past Due</th>
          <th class="text-right" style="width: 9%;">Total Bal.</th>
          <th class="text-center" style="width: 5%;">Actual Coll.</th>
          <th class="text-center" style="width: 5%;">Receipt #</th>
          <th class="text-center" style="width: 5%;">Borrower Sig.</th>
        </tr>
      </thead>
      <tbody>
        ${makeCustomerRows(rows, 1)}
        <tr class="totals-row-classic">
          <td colspan="4" class="text-right"><b>GRAND TOTALS:</b></td>
          <td class="text-right font-mono"><b>${money(expected)}</b></td>
          <td class="text-right font-mono"><b>${money(rows.reduce((s, x) => s + num(x.arrears), 0))}</b></td>
          <td class="text-right font-mono"><b>${money(totalBalance)}</b></td>
          <td colspan="3" style="font-size: calc(${fontSize} - 1px); text-align: center; color: #000000; font-weight: bold;">Turn-over breakdown below</td>
        </tr>
      </tbody>
    </table>

    <div class="remittance-block-classic">
      <div class="remittance-log-classic">
        <b>FIELD REMITTANCE TURN-OVER & AUDIT LOG</b>
        <div class="remittance-grid-classic">
          <div class="remittance-field">Total Cash Remitted: ₱ __________________</div>
          <div class="remittance-field">Shortage / Over: ₱ __________________</div>
          <div class="remittance-field">Total Receipts Issued: __________________</div>
          <div class="remittance-field">Total Clients Paid: __________________</div>
        </div>
      </div>
      <div class="sig-line-classic">
        ${esc(collectorLabel)}
        <small>Remitted By (Field Collector)</small>
      </div>
      <div class="sig-line-classic">
        Authorized Branch Cashier
        <small>Received & Audited By</small>
      </div>
    </div>
    <script>window.onload=()=>window.print()</script>
  </body></html>`;;

  renderAndPrintHTML(`Collection Sheet ${d}`, html);
}

// -------------------------------------------------------------
// 4. COLLECTOR PERFORMANCE REPORT
// -------------------------------------------------------------
export function printCollectorPerformanceReport(db: Database, period: string, asOfDate: string, collectorId: string): void {
  const pPeriod = period || 'Daily';
  const asOf = asOfDate || today();
  const cid = collectorId || 'ALL';
  const bounds = performancePeriodBounds(pPeriod, asOf);

  const rows = db.collectors
    .map(c => collectorPerformanceRow(c, pPeriod, bounds.from, bounds.to, db))
    .filter(x => cid === 'ALL' || x.c.id === cid);

  if (!rows.length) {
    console.warn('No collector records found.');
    return;
  }

  const totalQuota = round2(rows.reduce((s, x) => s + x.quota, 0));
  const totalCollected = round2(rows.reduce((s, x) => s + x.collected, 0));
  const achievement = totalQuota ? (totalCollected / totalQuota) * 100 : 0;

  const trs = rows.map((x, i) => `<tr>
    <td class="text-center">${i + 1}</td>
    <td><b>${esc(x.c.name)}</b></td>
    <td>${esc(aname(db.areas.find(a => a.id === x.c.areaId)))}</td>
    <td class="text-right font-mono">${money(x.c.dailyQuota)}</td>
    <td class="text-right font-mono">${money(x.c.weeklyQuota)}</td>
    <td class="text-right font-mono">${money(x.quota)}</td>
    <td class="text-right font-mono" style="font-weight: 800; color: #166534;">${money(x.collected)}</td>
    <td class="text-right font-mono" style="${x.variance < 0 ? 'color: #b91c1c;' : 'color: #166534;'}">${money(x.variance)}</td>
    <td class="text-right font-mono" style="font-weight: 800;">${x.achievement.toFixed(1)}%</td>
    <td class="text-center">${x.active}</td>
    <td class="text-center" style="${x.overdue > 0 ? 'color: #b91c1c; font-weight: 800;' : ''}">${x.overdue}</td>
  </tr>`).join('');

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Collector Performance Audit</title><style>
    ${getCorporatePrintStyle('landscape')}
  </style></head><body>
    <div class="letterhead">
      <div class="letterhead-brand">
        <h1>${esc(db.settings.company || 'LOAN MANAGEMENT SYSTEM, INC.')}</h1>
        <p>Field Operations & Human Resource Performance Tracking</p>
      </div>
      <div class="letterhead-doc">
        <h2>COLLECTOR PERFORMANCE AUDIT REPORT</h2>
        <p>Period: <b>${esc(pPeriod)}</b> (${datef(bounds.from)} to ${datef(bounds.to)})</p>
      </div>
    </div>

    <div class="kpi-row" style="grid-template-columns: repeat(3, 1fr);">
      <div class="kpi-card">
        <span class="kpi-card-label">Target Assigned Quota</span>
        <span class="kpi-card-value">${money(totalQuota)}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-card-label">Actual Collections Credited</span>
        <span class="kpi-card-value" style="color: #166534;">${money(totalCollected)}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-card-label">Portfolio Quota Achievement</span>
        <span class="kpi-card-value" style="${achievement >= 100 ? 'color: #166534;' : 'color: #b45309;'}">${achievement.toFixed(1)}%</span>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th class="text-center">#</th>
          <th>Collector Name</th>
          <th>Assigned Route</th>
          <th class="text-right">Daily Target</th>
          <th class="text-right">Weekly Target</th>
          <th class="text-right">Period Quota</th>
          <th class="text-right">Total Collected</th>
          <th class="text-right">Variance</th>
          <th class="text-right">Efficiency %</th>
          <th class="text-center">Active Clients</th>
          <th class="text-center">Delinquent</th>
        </tr>
      </thead>
      <tbody>
        ${trs}
        <tr class="totals-row">
          <td colspan="5" class="text-right"><b>PORTFOLIO TOTAL:</b></td>
          <td class="text-right font-mono">${money(totalQuota)}</td>
          <td class="text-right font-mono" style="color: #166534;">${money(totalCollected)}</td>
          <td class="text-right font-mono">${money(totalCollected - totalQuota)}</td>
          <td class="text-right font-mono">${achievement.toFixed(1)}%</td>
          <td class="text-center">${rows.reduce((s, x) => s + x.active, 0)}</td>
          <td class="text-center">${rows.reduce((s, x) => s + x.overdue, 0)}</td>
        </tr>
      </tbody>
    </table>

    <div class="signatures-block" style="grid-template-columns: 1fr 1fr;">
      <div class="sig-line">
        Branch Supervisor / Lead Auditor
        <small>Field Audit Verified</small>
      </div>
      <div class="sig-line">
        Branch Operations Head
        <small>Executive Management Review</small>
      </div>
    </div>
    <script>window.onload=()=>window.print()</script>
  </body></html>`;

  renderAndPrintHTML('Collector Performance', html);
}

// -------------------------------------------------------------
// 5. EXPENSE REPORT
// -------------------------------------------------------------
export function printExpenseReport(db: Database): void {
  const rows = db.expenses.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const approved = rows.filter(x => x.approvalStatus === 'Approved');
  const totalAmt = approved.reduce((s, x) => s + num(x.amount), 0);

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Expense & Disbursement Report</title><style>
    ${getCorporatePrintStyle('portrait')}
  </style></head><body>
    <div class="letterhead">
      <div class="letterhead-brand">
        <h1>${esc(db.settings.company || 'LOAN MANAGEMENT SYSTEM, INC.')}</h1>
        <p>Corporate Financial Accounting & Disbursements Ledger</p>
      </div>
      <div class="letterhead-doc">
        <h2>OPERATING EXPENSES REPORT</h2>
        <p>Printed Date: <b>${datef(today())}</b></p>
      </div>
    </div>

    <div class="kpi-row" style="grid-template-columns: 1fr 1fr;">
      <div class="kpi-card">
        <span class="kpi-card-label">Approved Disbursements</span>
        <span class="kpi-card-value">${approved.length} Transactions</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-card-label">Total Operating Expenses</span>
        <span class="kpi-card-value" style="color: #991b1b;">${money(totalAmt)}</span>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Expense Category</th>
          <th>Description & Purpose</th>
          <th>Disbursed By</th>
          <th>Approval</th>
          <th class="text-right">Amount (₱)</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(x => `<tr>
          <td>${datef(x.date)}</td>
          <td><b>${esc(x.category)}</b></td>
          <td>${esc(x.description || '—')}</td>
          <td>${esc(x.user || 'system')}</td>
          <td>${esc(x.approvalStatus || 'Approved')}</td>
          <td class="text-right font-mono"><b>${money(x.amount)}</b></td>
        </tr>`).join('') || '<tr><td colspan="6" class="text-center">No expense records found.</td></tr>'}
        <tr class="totals-row">
          <td colspan="5" class="text-right"><b>TOTAL APPROVED EXPENSES:</b></td>
          <td class="text-right font-mono" style="color: #991b1b;"><b>${money(totalAmt)}</b></td>
        </tr>
      </tbody>
    </table>

    <div class="signatures-block" style="grid-template-columns: 1fr 1fr;">
      <div class="sig-line">
        Prepared By (Accounting Officer)
        <small>Finance Staff</small>
      </div>
      <div class="sig-line">
        Approved By (Managing Director)
        <small>Executive Management</small>
      </div>
    </div>
    <script>window.onload=()=>window.print()</script>
  </body></html>`;

  renderAndPrintHTML('Expense Report', html);
}

// -------------------------------------------------------------
// 6. CASH RECONCILIATION REPORT
// -------------------------------------------------------------
export function printReconciliationReport(db: Database): void {
  const rows = db.cashReconciliations || [];
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Cash Reconciliation Ledger</title><style>
    ${getCorporatePrintStyle('portrait')}
  </style></head><body>
    <div class="letterhead">
      <div class="letterhead-brand">
        <h1>${esc(db.settings.company || 'LOAN MANAGEMENT SYSTEM, INC.')}</h1>
        <p>Internal Audit & Daily Vault Balancing Log</p>
      </div>
      <div class="letterhead-doc">
        <h2>DAILY CASH RECONCILIATION AUDIT</h2>
        <p>Printed Date: <b>${datef(today())}</b></p>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Audit Date</th>
          <th class="text-right">System Cash</th>
          <th class="text-right">Actual Physical Cash</th>
          <th class="text-right">Variance (Over/Short)</th>
          <th>Explanation / Notes</th>
          <th>Audited By</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `<tr>
          <td>${datef(r.date)}</td>
          <td class="text-right font-mono">${money(r.systemCash)}</td>
          <td class="text-right font-mono"><b>${money(r.actualCash)}</b></td>
          <td class="text-right font-mono" style="${r.variance < 0 ? 'color: #b91c1c; font-weight: 800;' : r.variance > 0 ? 'color: #15803d; font-weight: 800;' : ''}">${money(r.variance)}</td>
          <td>${esc(r.notes || 'Balanced')}</td>
          <td>${esc(r.user || 'system')}</td>
        </tr>`).join('') || '<tr><td colspan="6" class="text-center">No cash reconciliation records recorded.</td></tr>'}
      </tbody>
    </table>

    <div class="signatures-block" style="grid-template-columns: 1fr 1fr;">
      <div class="sig-line">
        Cash Custodian / Vault Officer
        <small>Cashier Signature</small>
      </div>
      <div class="sig-line">
        Branch Auditor / Supervisor
        <small>Verification Signature</small>
      </div>
    </div>
    <script>window.onload=()=>window.print()</script>
  </body></html>`;

  renderAndPrintHTML('Cash Reconciliation', html);
}

// -------------------------------------------------------------
// 7. EXECUTIVE PORTFOLIO SUMMARY REPORT
// -------------------------------------------------------------
export function printExecutiveSummaryReport(db: Database): void {
  const validLoans = db.loans.filter(l => l.status !== 'Rejected' && l.approvalStatus !== 'Rejected');
  const activeLoans = validLoans.filter(l => l.status !== 'Paid');
  const totalPrincipalDisbursed = round2(validLoans.reduce((s, l) => s + num(l.principal), 0));
  const totalPaidSum = round2(db.payments.reduce((s, p) => s + num(p.amount), 0));
  const totalOutstandingBalance = round2(activeLoans.reduce((s, l) => s + outstanding(l), 0));
  const totalBorrowers = db.borrowers.length;

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Executive Portfolio Summary</title><style>
    ${getCorporatePrintStyle('portrait')}
  </style></head><body>
    <div class="letterhead">
      <div class="letterhead-brand">
        <h1>${esc(db.settings.company || 'LOAN MANAGEMENT SYSTEM, INC.')}</h1>
        <p>Executive Financial Overview & Risk Portfolio Report</p>
      </div>
      <div class="letterhead-doc">
        <h2>PORTFOLIO PERFORMANCE SUMMARY</h2>
        <p>Report Date: <b>${datef(today())}</b></p>
      </div>
    </div>

    <div class="kpi-row">
      <div class="kpi-card">
        <span class="kpi-card-label">Total Clients Registered</span>
        <span class="kpi-card-value">${totalBorrowers} Borrowers</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-card-label">Active Loan Accounts</span>
        <span class="kpi-card-value">${activeLoans.length} Loans</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-card-label">Total Capital Disbursed</span>
        <span class="kpi-card-value">${money(totalPrincipalDisbursed)}</span>
      </div>
      <div class="kpi-card" style="border-color: #cbd5e1; background: #f8fafc;">
        <span class="kpi-card-label">Current Outstanding Portfolio</span>
        <span class="kpi-card-value" style="color: #0f172a;">${money(totalOutstandingBalance)}</span>
      </div>
    </div>

    <div class="table-section-title">ACTIVE LOAN PORTFOLIO BREAKDOWN</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Loan No</th>
          <th>Borrower Name</th>
          <th>Route / Collector</th>
          <th class="text-right">Principal</th>
          <th class="text-right">Total Payable</th>
          <th class="text-right">Total Paid</th>
          <th class="text-right">Outstanding Balance</th>
          <th class="text-center">Status</th>
        </tr>
      </thead>
      <tbody>
        ${activeLoans.map(l => {
          const b = db.borrowers.find(x => x.id === l.borrowerId);
          const col = db.collectors.find(c => c.id === (b?.collectorId || l.collectorId));
          return `<tr>
            <td class="font-mono"><b>${esc(l.loanNo)}</b></td>
            <td><b>${esc(bname(b))}</b></td>
            <td>${esc(cname(col))}</td>
            <td class="text-right font-mono">${money(l.principal)}</td>
            <td class="text-right font-mono">${money(total(l))}</td>
            <td class="text-right font-mono" style="color: #166534;">${money(paid(l))}</td>
            <td class="text-right font-mono" style="font-weight: 800; color: #0f172a;">${money(outstanding(l))}</td>
            <td class="text-center">${esc(l.status)}</td>
          </tr>`;
        }).join('') || '<tr><td colspan="8" class="text-center">No active loans found.</td></tr>'}
        <tr class="totals-row">
          <td colspan="3" class="text-right"><b>TOTAL ACTIVE BALANCE:</b></td>
          <td class="text-right font-mono">${money(activeLoans.reduce((s, l) => s + num(l.principal), 0))}</td>
          <td class="text-right font-mono">${money(activeLoans.reduce((s, l) => s + total(l), 0))}</td>
          <td class="text-right font-mono">${money(totalPaidSum)}</td>
          <td class="text-right font-mono"><b>${money(totalOutstandingBalance)}</b></td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <div class="table-section-title">COLLECTOR & AREA ROUTE DISTRIBUTION</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Collector Name</th>
          <th>Assigned Route / Area</th>
          <th class="text-center">Active Borrowers</th>
          <th class="text-right">Managed Portfolio Value</th>
        </tr>
      </thead>
      <tbody>
        ${db.collectors.map(c => {
          const colLoans = activeLoans.filter(l => {
            const b = db.borrowers.find(x => x.id === l.borrowerId);
            return (b?.collectorId || l.collectorId) === c.id;
          });
          const colBal = round2(colLoans.reduce((s, l) => s + outstanding(l), 0));
          const a = db.areas.find(area => area.id === c.areaId);
          return `<tr>
            <td><b>${esc(c.name)}</b></td>
            <td>${esc(aname(a))}</td>
            <td class="text-center">${colLoans.length}</td>
            <td class="text-right font-mono"><b>${money(colBal)}</b></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>

    <div class="signatures-block" style="grid-template-columns: 1fr 1fr;">
      <div class="sig-line">
        Prepared By (Credit & Operations)
        <small>Branch Portfolio Analyst</small>
      </div>
      <div class="sig-line">
        Approved By (Executive Management)
        <small>Managing Director / President</small>
      </div>
    </div>
    <script>window.onload=()=>window.print()</script>
  </body></html>`;

  renderAndPrintHTML('Executive Portfolio Report', html);
}

function pesoInWords(n: number): string {
  const rounded = Math.round(n);
  if (rounded <= 0) return 'ZERO PESOS ONLY';
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  function helper(num: number): string {
    if (num === 0) return '';
    if (num < 20) return ones[num] + ' ';
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? '-' + ones[num % 10] : '') + ' ';
    if (num < 1000) return ones[Math.floor(num / 100)] + ' HUNDRED ' + helper(num % 100);
    if (num < 1000000) return helper(Math.floor(num / 1000)) + 'THOUSAND ' + helper(num % 1000);
    return helper(Math.floor(num / 1000000)) + 'MILLION ' + helper(num % 1000000);
  }
  return helper(rounded).trim() + ' PESOS ONLY';
}

export function printLoanAgreement(db: Database, loanId: string): void {
  const l = db.loans.find(x => x.id === loanId);
  const b = l ? db.borrowers.find(x => x.id === l.borrowerId) : null;
  if (!l || !b) {
    console.warn('Loan or borrower not found for agreement printing.');
    return;
  }

  const areaObj = db.areas.find(a => a.id === b.areaId);
  const colObj = db.collectors.find(c => c.id === b.collectorId || c.id === l.collectorId);
  const areaName = aname(areaObj);
  const collectorName = cname(colObj);
  const companyName = db.settings.company || 'LOAN MANAGEMENT SYSTEM, INC.';
  const logoUrl = db.settings.logoUrl || '/logo.png';
  const totalAmount = total(l);
  const totalInterest = Math.max(0, totalAmount - l.principal - (l.fee || 0));
  const netProceeds = Math.max(0, l.principal - (l.fee || 0));
  const principalWords = pesoInWords(l.principal);
  const totalWords = pesoInWords(totalAmount);

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Loan Agreement & Promissory Note - ${esc(l.loanNo)}</title><style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 10.5px;
      line-height: 1.4;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header-logo {
      width: 52px;
      height: 52px;
      object-fit: contain;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
    }
    .header-titles h1 {
      font-size: 17px;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 2px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-titles p {
      font-size: 9.5px;
      font-weight: 600;
      color: #475569;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-right {
      text-align: right;
    }
    .header-right .doc-badge {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-size: 11px;
      font-weight: 900;
      padding: 3px 10px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header-right .doc-meta {
      font-size: 9.5px;
      color: #334155;
      margin-top: 4px;
      font-weight: 600;
    }
    .section-title {
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      color: #0f172a;
      background: #f1f5f9;
      border-left: 4px solid #2563eb;
      padding: 4px 8px;
      margin: 10px 0 6px 0;
      letter-spacing: 0.5px;
    }
    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }
    .party-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      background: #f8fafc;
    }
    .party-card-title {
      font-size: 10px;
      font-weight: 800;
      color: #1e40af;
      text-transform: uppercase;
      margin-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2px;
    }
    .field-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      margin-bottom: 2px;
    }
    .field-label {
      color: #64748b;
      font-weight: 600;
    }
    .field-val {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
    }
    .disclosure-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      border: 1px solid #cbd5e1;
    }
    .disclosure-table th, .disclosure-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
      font-size: 10px;
    }
    .disclosure-table th {
      background: #f1f5f9;
      font-weight: 800;
      text-transform: uppercase;
      color: #334155;
      width: 25%;
    }
    .disclosure-table td {
      font-weight: 700;
      color: #0f172a;
      width: 25%;
    }
    .highlight-net {
      background: #ecfdf5 !important;
      color: #065f46 !important;
      font-weight: 900 !important;
      font-size: 11px !important;
    }
    .promissory-box {
      border: 1.5px solid #1e293b;
      background: #fafaf9;
      padding: 10px 12px;
      border-radius: 6px;
      margin-bottom: 10px;
      text-align: justify;
      line-height: 1.45;
    }
    .promissory-box h4 {
      margin: 0 0 6px 0;
      text-align: center;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
    }
    .terms-list {
      margin: 0;
      padding-left: 18px;
      font-size: 9.5px;
      color: #334155;
      line-height: 1.4;
    }
    .terms-list li {
      margin-bottom: 4px;
      text-align: justify;
    }
    .schedule-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px;
      margin-bottom: 10px;
      text-align: center;
    }
    .sched-item {
      display: flex;
      flex-direction: column;
    }
    .sched-item-label {
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .sched-item-val {
      font-size: 11px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
    }
    .signatures-container {
      display: grid;
      grid-template-columns: 2fr 1fr 2fr 2fr;
      gap: 12px;
      margin-top: 14px;
      padding-top: 6px;
    }
    .sig-column {
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    .sig-line-top {
      border-top: 1.5px solid #0f172a;
      padding-top: 4px;
      font-size: 10px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
    }
    .sig-role {
      font-size: 8.5px;
      font-weight: 600;
      color: #64748b;
      margin-top: 1px;
    }
    .thumbmark-box {
      width: 72px;
      height: 70px;
      border: 1.5px dashed #475569;
      border-radius: 4px;
      margin: 0 auto 4px auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: 700;
      color: #64748b;
      text-align: center;
      padding: 4px;
      line-height: 1.1;
      background: #ffffff;
    }
    .ack-box {
      margin-top: 10px;
      padding: 6px 10px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      background: #f1f5f9;
      font-size: 9px;
      color: #334155;
      text-align: center;
      font-weight: 600;
    }
  </style></head><body>
    <!-- Header -->
    <div class="header-box">
      <div class="header-left">
        <img src="${esc(logoUrl)}" alt="Logo" class="header-logo" onerror="this.style.display='none'" />
        <div class="header-titles">
          <h1>${esc(companyName)}</h1>
          <p>Truth in Lending Act Disclosure Statement & Loan Agreement (R.A. 3765)</p>
        </div>
      </div>
      <div class="header-right">
        <div class="doc-badge">LOAN AGREEMENT</div>
        <div class="doc-meta">Loan No: <b>${esc(l.loanNo)}</b></div>
        <div class="doc-meta">Date: <b>${datef(l.date)}</b></div>
      </div>
    </div>

    <!-- Section I: Parties -->
    <div class="section-title">I. Contracting Parties (Mga Partido sa Kasunduan)</div>
    <div class="parties-grid">
      <div class="party-card">
        <div class="party-card-title">Borrower / Debtor (Nanghihiram)</div>
        <div class="field-row"><span class="field-label">Full Name:</span><span class="field-val">${esc(bname(b))}</span></div>
        <div class="field-row"><span class="field-label">Borrower ID:</span><span class="field-val font-mono">${esc(b.id)}</span></div>
        <div class="field-row"><span class="field-label">Contact No:</span><span class="field-val">${esc(b.contact || '—')}</span></div>
        <div class="field-row"><span class="field-label">Address:</span><span class="field-val">${esc(b.address || '—')}</span></div>
        <div class="field-row"><span class="field-label">Valid ID:</span><span class="field-val">${esc(b.idType || 'Govt ID')}: ${esc(b.idNo || 'Verified on file')}</span></div>
      </div>

      <div class="party-card">
        <div class="party-card-title">Co-Maker / Guarantor & Account Officer</div>
        <div class="field-row"><span class="field-label">Co-Maker Name:</span><span class="field-val">${esc(b.comaker || 'None / Self-Guaranteed')}</span></div>
        <div class="field-row"><span class="field-label">Co-Maker Contact:</span><span class="field-val">${esc(b.comakerContact || '—')}</span></div>
        <div class="field-row"><span class="field-label">Assigned Collector:</span><span class="field-val">${esc(collectorName)}</span></div>
        <div class="field-row"><span class="field-label">Area / Route:</span><span class="field-val">${esc(areaName)}</span></div>
        <div class="field-row"><span class="field-label">Creditor / Lender:</span><span class="field-val">${esc(companyName)}</span></div>
      </div>
    </div>

    <!-- Section II: Financial Disclosure -->
    <div class="section-title">II. Disclosure Statement of Loan Financing (R.A. No. 3765)</div>
    <table class="disclosure-table">
      <tr>
        <th>1. Principal Loan Amount</th>
        <td><b>${money(l.principal)}</b></td>
        <th>5. Repayment Frequency</th>
        <td><b>${esc(l.frequency || 'Monthly')}</b></td>
      </tr>
      <tr>
        <th>2. Contract Interest Rate</th>
        <td>${l.rate}% (${esc(l.loanType || 'Flat')})</td>
        <th>6. Term / Installments</th>
        <td>${l.months} Month(s) (${l.term || (l.schedule ? l.schedule.length : 1)} Periods)</td>
      </tr>
      <tr>
        <th>3. Processing / Service Fee</th>
        <td>${money(l.fee || 0)}</td>
        <th>7. Installment Amortization</th>
        <td><b style="color: #2563eb;">${money(l.dailyCollection || (l.totalPayable / (l.term || 1)))}</b></td>
      </tr>
      <tr>
        <th>4. Net Cash Proceeds Released</th>
        <td class="highlight-net">${money(netProceeds)}</td>
        <th>8. Total Amount Payable</th>
        <td style="color: #0f172a; font-weight: 900;">${money(totalAmount)}</td>
      </tr>
      <tr>
        <th>Release / Start Date</th>
        <td>${datef(l.date)}</td>
        <th>Maturity Due Date</th>
        <td><b>${datef(l.dueDate)}</b></td>
      </tr>
    </table>

    <!-- Section III: Promissory Note -->
    <div class="promissory-box">
      <h4>PROMISSORY NOTE & UNCONDITIONAL UNDERTAKING (PANGAKO SA PAGBABAYAD)</h4>
      <p style="margin: 0; font-size: 10px;">
        <b>FOR VALUE RECEIVED</b>, I/we, the undersigned Borrower and Co-Maker, jointly, severally, and solidarily promise to pay to the order of <b>${esc(companyName)}</b> the principal sum of <b>${esc(principalWords)} (₱${l.principal.toLocaleString('en-PH', { minimumFractionDigits: 2 })})</b> together with interest and agreed charges, amounting to a total sum of <b>${esc(totalWords)} (₱${totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })})</b>, payable according to the installments specified above.
      </p>
    </div>

    <!-- Section IV: Terms & Conditions -->
    <div class="section-title">III. Terms and Conditions (Mga Tuntunin at Kundisyon)</div>
    <ol class="terms-list">
      <li><b>Punctual Payment:</b> The Borrower agrees to pay each scheduled installment on or before its due date to the authorized company field collector or designated branch office. Official Receipts (OR) shall be issued upon each collection.</li>
      <li><b>Default & Late Penalty:</b> Failure to pay any installment on the scheduled due date shall subject the overdue installment to an overdue penalty surcharge of 3.0% per month or the prevailing standard rate until fully paid.</li>
      <li><b>Acceleration Clause:</b> In the event that the Borrower fails to pay two (2) successive installments, or in case of abandonment, death, bankruptcy, or fraudulent misrepresentation, the ENTIRE unpaid balance of this loan shall immediately become due, demandable, and payable in full without need of judicial notice or demand.</li>
      <li><b>Solidary Liability of Co-Maker (Solidum):</b> The Co-Maker hereby binds himself/herself jointly and solidarily with the Borrower for the full payment of this loan. The Co-Maker expressly waives the benefit of excussion (prior exhaustion of the Borrower's assets) and agrees to assume immediate full payment upon Borrower's default.</li>
      <li><b>Attorney's Fees & Venue:</b> In case this account is referred to an attorney or small claims court for collection, the Borrower and Co-Maker agree to pay an additional sum equivalent to 15% of the total claim as liquidated damages and attorney's fees. Venue of legal action shall be exclusively in the competent courts having jurisdiction over the creditor's principal office.</li>
    </ol>

    <!-- Signatures -->
    <div class="section-title" style="margin-top: 12px;">IV. Signatures, Conforme & Acknowledgement of Release</div>
    <div class="signatures-container">
      <!-- Borrower -->
      <div class="sig-column">
        <div style="height: 38px;"></div>
        <div class="sig-line-top">${esc(bname(b))}</div>
        <div class="sig-role">Borrower (Pirma sa Ibabaw ng Pangalan)</div>
      </div>

      <!-- Right Thumbmark Box -->
      <div class="sig-column">
        <div class="thumbmark-box">
          RIGHT THUMBMARK<br>(Hinlalaki)
        </div>
        <div class="sig-role">Right Thumbmark</div>
      </div>

      <!-- Co-Maker -->
      <div class="sig-column">
        <div style="height: 38px;"></div>
        <div class="sig-line-top">${esc(b.comaker || 'CO-MAKER / GUARANTOR')}</div>
        <div class="sig-role">Co-Maker / Solidary Guarantor</div>
      </div>

      <!-- Approving Officer -->
      <div class="sig-column">
        <div style="height: 38px;"></div>
        <div class="sig-line-top">${esc(l.approvedBy || 'CREDIT MANAGER')}</div>
        <div class="sig-role">Disbursing / Releasing Officer</div>
      </div>
    </div>

    <div class="ack-box">
      <b>BORROWER ACKNOWLEDGEMENT OF RECEIPT:</b> I hereby certify that I have read and understood all terms of this agreement and have received the net loan proceeds of <b>${money(netProceeds)}</b> in cash/check on <b>${datef(l.date)}</b>.
    </div>

    <script>window.onload=()=>window.print()</script>
  </body></html>`;

  renderAndPrintHTML(`Loan Agreement - ${esc(l.loanNo)} - ${bname(b)}`, html);
}

export function printCollectorTurnoverVoucher(params: {
  db: Database;
  collector: Collector;
  date: string;
  totalGross: number;
  totalCash: number;
  totalDigital: number;
  totalExpenses: number;
  totalReleases: number;
  expectedCash: number;
  actualCash: number;
  variance: number;
  denoms: Record<string, number>;
  notes?: string;
}): void {
  const { db, collector, date, totalGross, totalCash, totalDigital, totalExpenses, totalReleases, expectedCash, actualCash, variance, denoms, notes } = params;
  const companyName = db.settings.company || 'LOAN MANAGEMENT SYSTEM, INC.';
  const area = db.areas.find(a => a.id === collector.areaId);

  const isBalanced = Math.abs(variance) <= 0.01;
  const isShortage = variance < -0.01;
  const isOverage = variance > 0.01;
  const statusBadge = isBalanced
    ? '<span style="color: #166534; background: #dcfce7; padding: 4px 10px; border-radius: 9999px; font-weight: 900; font-size: 11px;">BALANCED / EXACT</span>'
    : isShortage
    ? `<span style="color: #991b1b; background: #fee2e2; padding: 4px 10px; border-radius: 9999px; font-weight: 900; font-size: 11px;">SHORTAGE: -₱${Math.abs(variance).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>`
    : `<span style="color: #075985; background: #e0f2fe; padding: 4px 10px; border-radius: 9999px; font-weight: 900; font-size: 11px;">OVERAGE: +₱${variance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Daily Collector Turn-Over Voucher - ${esc(collector.name)} - ${datef(date)}</title>
    <style>
      ${getCorporatePrintStyle('portrait', true)}
      .denom-table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 10px 0; }
      .denom-table th, .denom-table td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right; }
      .denom-table th { background: #f8fafc; font-weight: 800; text-align: left; }
    </style>
  </head><body>
    <div class="receipt-card">
      <div class="receipt-header">
        <h1 class="company-name">${esc(companyName)}</h1>
        <div class="company-sub">Field Operations & Cash Audit Control</div>
        <div class="doc-title" style="margin-top: 6px;">DAILY COLLECTOR TURN-OVER SLIP</div>
        <div class="doc-subtitle">Official Cash Remittance & Audit Settlement</div>
      </div>

      <div class="info-table" style="font-size: 11px; margin-bottom: 12px;">
        <div class="info-row"><span class="info-label">Turn-Over Date:</span><span class="info-val"><b>${datef(date)}</b></span></div>
        <div class="info-row"><span class="info-label">Field Collector:</span><span class="info-val"><b>${esc(collector.name)}</b> (ID: ${esc(collector.id)})</span></div>
        <div class="info-row"><span class="info-label">Route / Assigned Area:</span><span class="info-val"><b>${esc(area?.name || 'General Route')}</b></span></div>
        <div class="info-row"><span class="info-label">Audit Settlement Status:</span><span class="info-val">${statusBadge}</span></div>
      </div>

      <div style="border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a; padding: 8px 0; margin-bottom: 12px; font-size: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>1. Gross Collection Total:</span>
          <b>₱${totalGross.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</b>
        </div>
        <div style="display: flex; justify-content: space-between; margin-left: 12px; color: #475569; font-size: 11px;">
          <span>• Physical Cash Collections:</span>
          <span>₱${totalCash.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
        </div>
        ${totalDigital > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-left: 12px; color: #475569; font-size: 11px;">
          <span>• Digital / GCash Collections:</span>
          <span>₱${totalDigital.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
        </div>` : ''}

        <div style="display: flex; justify-content: space-between; margin-top: 6px; color: #b91c1c;">
          <span>2. Less: Field Gasoline / Expenses:</span>
          <b>-₱${totalExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</b>
        </div>

        ${totalReleases > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-top: 4px; color: #b91c1c;">
          <span>3. Less: On-the-Spot Field Releases:</span>
          <b>-₱${totalReleases.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</b>
        </div>` : ''}

        <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #cbd5e1; font-weight: 900; font-size: 13px;">
          <span>EXPECTED PHYSICAL CASH IN VAULT:</span>
          <b>₱${expectedCash.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</b>
        </div>
      </div>

      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; margin-top: 10px;">Physical Bills & Coins Count:</div>
      <table class="denom-table">
        <thead>
          <tr><th style="width: 40%;">Denomination</th><th style="width: 25%; text-align: center;">Qty (Pcs)</th><th>Subtotal</th></tr>
        </thead>
        <tbody>
          <tr><td style="text-align: left;">₱1,000 Bill</td><td style="text-align: center;">${denoms['1000'] || 0}</td><td>₱${((denoms['1000'] || 0) * 1000).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td></tr>
          <tr><td style="text-align: left;">₱500 Bill</td><td style="text-align: center;">${denoms['500'] || 0}</td><td>₱${((denoms['500'] || 0) * 500).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td></tr>
          <tr><td style="text-align: left;">₱200 Bill</td><td style="text-align: center;">${denoms['200'] || 0}</td><td>₱${((denoms['200'] || 0) * 200).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td></tr>
          <tr><td style="text-align: left;">₱100 Bill</td><td style="text-align: center;">${denoms['100'] || 0}</td><td>₱${((denoms['100'] || 0) * 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td></tr>
          <tr><td style="text-align: left;">₱50 Bill</td><td style="text-align: center;">${denoms['50'] || 0}</td><td>₱${((denoms['50'] || 0) * 50).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td></tr>
          <tr><td style="text-align: left;">₱20 Bill</td><td style="text-align: center;">${denoms['20'] || 0}</td><td>₱${((denoms['20'] || 0) * 20).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td></tr>
          <tr><td style="text-align: left;">Loose Coins</td><td style="text-align: center;">-</td><td>₱${(denoms['coins'] || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td></tr>
        </tbody>
        <tfoot>
          <tr style="background: #f1f5f9; font-weight: 900;">
            <td colspan="2" style="text-align: left;">ACTUAL PHYSICAL CASH COUNTED:</td>
            <td>₱${actualCash.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
          </tr>
        </tfoot>
      </table>

      ${notes ? `<div style="font-size: 10px; color: #475569; margin: 8px 0; padding: 6px; background: #f8fafc; border-radius: 6px;"><b>Audit Remarks:</b> ${esc(notes)}</div>` : ''}

      <div style="margin-top: 24px; display: flex; justify-content: space-between; text-align: center; font-size: 10px;">
        <div style="width: 45%;">
          <div style="border-bottom: 1px solid #0f172a; height: 32px;"></div>
          <b style="display: block; margin-top: 4px;">${esc(collector.name)}</b>
          <span style="color: #64748b;">Turned Over by (Field Collector)</span>
        </div>
        <div style="width: 45%;">
          <div style="border-bottom: 1px solid #0f172a; height: 32px;"></div>
          <b style="display: block; margin-top: 4px;">CASHIER / AUDITOR</b>
          <span style="color: #64748b;">Received & Audited by (Vault Custodian)</span>
        </div>
      </div>
    </div>
    <script>window.onload=()=>window.print()</script>
  </body></html>`;

  renderAndPrintHTML(`Turn-Over Slip - ${esc(collector.name)} - ${datef(date)}`, html);
}


