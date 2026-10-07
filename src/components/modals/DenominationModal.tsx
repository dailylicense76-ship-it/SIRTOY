import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { money, today, systemCashOnHand } from '../../utils/calculations';
import { renderAndPrintHTML } from '../../utils/print';
import { X, Calculator, Copy, Printer, Check, ArrowRight, RotateCcw } from 'lucide-react';

interface DenominationItem {
  label: string;
  value: number;
  type: 'bill' | 'coin';
  color: string;
}

const DENOMINATIONS: DenominationItem[] = [
  { label: '₱1,000 Bill', value: 1000, type: 'bill', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { label: '₱500 Bill', value: 500, type: 'bill', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { label: '₱200 Bill', value: 200, type: 'bill', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { label: '₱100 Bill', value: 100, type: 'bill', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { label: '₱50 Bill', value: 50, type: 'bill', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  { label: '₱20 Bill / Coin', value: 20, type: 'bill', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  { label: '₱10 Coin', value: 10, type: 'coin', color: 'text-slate-700 bg-slate-100 border-slate-300' },
  { label: '₱5 Coin', value: 5, type: 'coin', color: 'text-slate-700 bg-slate-100 border-slate-300' },
  { label: '₱1 Coin', value: 1, type: 'coin', color: 'text-slate-700 bg-slate-100 border-slate-300' },
  { label: '₱0.25 (25¢ Coin)', value: 0.25, type: 'coin', color: 'text-slate-700 bg-slate-100 border-slate-300' }
];

export const DenominationModal: React.FC = () => {
  const { db, user, activeModal, closeModal, openModal, showToast } = useApp();

  const [counts, setCounts] = useState<Record<number, number>>({
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    1: 0,
    0.25: 0
  });

  const [targetExpected, setTargetExpected] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (activeModal !== 'denominationModal') return null;

  const sysCash = systemCashOnHand(db);
  const targetNum = targetExpected !== '' ? Number(targetExpected) || 0 : sysCash;

  const totalBills = DENOMINATIONS.filter(d => d.type === 'bill').reduce(
    (sum, d) => sum + (counts[d.value] || 0) * d.value,
    0
  );
  const totalCoins = DENOMINATIONS.filter(d => d.type === 'coin').reduce(
    (sum, d) => sum + (counts[d.value] || 0) * d.value,
    0
  );
  const grandTotal = totalBills + totalCoins;
  const variance = grandTotal - targetNum;

  const handleCountChange = (value: number, rawVal: string) => {
    const qty = Math.max(0, parseInt(rawVal, 10) || 0);
    setCounts(prev => ({ ...prev, [value]: qty }));
  };

  const handleReset = () => {
    setCounts({
      1000: 0,
      500: 0,
      200: 0,
      100: 0,
      50: 0,
      20: 0,
      10: 0,
      5: 0,
      1: 0,
      0.25: 0
    });
  };

  const generateBreakdownText = () => {
    const lines = [
      `=== CASH DENOMINATION BREAKDOWN ===`,
      `Company: ${db.settings.company}`,
      `Date: ${today()} | Counted by: ${user?.name || 'Staff'}`,
      `---------------------------------`
    ];

    DENOMINATIONS.forEach(d => {
      const qty = counts[d.value] || 0;
      if (qty > 0) {
        lines.push(`${d.label.padEnd(16)} : ${qty} pcs = ${money(qty * d.value)}`);
      }
    });

    lines.push(`---------------------------------`);
    lines.push(`Total Bills Amount  : ${money(totalBills)}`);
    lines.push(`Total Coins Amount  : ${money(totalCoins)}`);
    lines.push(`GRAND TOTAL CASH    : ${money(grandTotal)}`);
    lines.push(`Expected / Target   : ${money(targetNum)}`);
    lines.push(`Variance            : ${money(variance)} (${Math.abs(variance) < 0.01 ? 'BALANCED' : variance < 0 ? 'SHORTAGE' : 'OVERAGE'})`);
    lines.push(`=================================`);

    return lines.join('\n');
  };

  const handleCopyBreakdown = () => {
    const text = generateBreakdownText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Cash breakdown copied to clipboard!', 'ok');
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintSlip = () => {
    const rowsHtml = DENOMINATIONS.map(d => {
      const qty = counts[d.value] || 0;
      return `
        <tr>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${d.label}</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-family: monospace;">${qty}</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700; font-family: monospace;">${money(qty * d.value)}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Cash Denomination Slip - ${today()}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; color: #0f172a; max-width: 480px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; }
          .header h2 { margin: 0; font-size: 16px; font-weight: 800; text-transform: uppercase; }
          .header p { margin: 3px 0 0; font-size: 11px; color: #475569; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px; }
          th { background: #f1f5f9; padding: 6px 10px; text-align: left; font-size: 10px; text-transform: uppercase; border-bottom: 1.5px solid #cbd5e1; }
          .summary-box { background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 20px; }
          .summary-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; }
          .summary-total { display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; border-top: 1.5px solid #0f172a; padding-top: 6px; margin-top: 6px; }
          .sig-row { display: flex; justify-content: space-between; margin-top: 35px; }
          .sig-box { width: 45%; text-align: center; border-top: 1px solid #475569; padding-top: 6px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${db.settings.company}</h2>
          <p>DAILY CASH DENOMINATION & COUNT SLIP</p>
          <p>Date: <b>${today()}</b> | Cashier / Collector: <b>${user?.name || 'Staff'}</b></p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Denomination</th>
              <th style="text-align: center;">Pieces (Qty)</th>
              <th style="text-align: right;">Total (₱)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="summary-box">
          <div class="summary-row"><span>Total Paper Bills:</span> <b>${money(totalBills)}</b></div>
          <div class="summary-row"><span>Total Coins:</span> <b>${money(totalCoins)}</b></div>
          <div class="summary-row"><span>Target / Expected Cash:</span> <b>${money(targetNum)}</b></div>
          <div class="summary-total">
            <span>PHYSICAL CASH TOTAL:</span>
            <span>${money(grandTotal)}</span>
          </div>
          <div class="summary-row" style="margin-top: 6px; font-weight: 700; color: ${Math.abs(variance) < 0.01 ? '#166534' : variance < 0 ? '#b91c1c' : '#1d4ed8'};">
            <span>Variance:</span>
            <span>${money(variance)} (${Math.abs(variance) < 0.01 ? 'BALANCED' : variance < 0 ? 'SHORTAGE' : 'OVERAGE'})</span>
          </div>
        </div>

        <div class="sig-row">
          <div class="sig-box">
            <b>${user?.name || 'Cashier / Collector'}</b><br />
            Counted & Remitted By
          </div>
          <div class="sig-box">
            <b>Manager / Auditor</b><br />
            Verified & Received By
          </div>
        </div>
      </body>
      </html>
    `;

    renderAndPrintHTML(`Cash-Slip-${today()}`, html);
  };

  const handleApplyToReconciliation = () => {
    closeModal();
    openModal('reconciliationModal', {
      actualCash: grandTotal,
      notes: `Count breakdown: 1000x${counts[1000] || 0}, 500x${counts[500] || 0}, 200x${counts[200] || 0}, 100x${counts[100] || 0}, 50x${counts[50] || 0}, 20x${counts[20] || 0}, Coins=${money(totalCoins)}`
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-slate-300 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-3d-modal">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base leading-tight">Cash Denomination Counter</h3>
              <p className="text-[11px] text-slate-300">Quick money bill & coin calculator for remittance & cashier counting</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Target / Baseline Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-[11px] font-bold text-slate-700 block">Expected Remittance / Target</span>
              <small className="text-[10px] text-slate-500">System Cash on Hand: <b>{money(sysCash)}</b></small>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={targetExpected}
                onChange={e => setTargetExpected(e.target.value)}
                placeholder={`Default (${money(sysCash)})`}
                className="w-44 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white"
              />
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                title="Reset all counts to zero"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Denomination Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DENOMINATIONS.map(d => {
              const count = counts[d.value] || 0;
              const subtotal = count * d.value;
              return (
                <div
                  key={d.value}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    count > 0 ? 'bg-blue-50/50 border-blue-300 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${d.color}`}>
                      {d.value >= 1 ? `₱${d.value}` : '25¢'}
                    </span>
                    <span className="text-xs font-extrabold text-slate-800">{d.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={count === 0 ? '' : count}
                      onChange={e => handleCountChange(d.value, e.target.value)}
                      placeholder="0"
                      className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-xs font-black text-center text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <span className="text-xs font-mono font-black text-slate-900 w-20 text-right">
                      {money(subtotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grand Total Summary Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Bills</span>
                <b className="text-sm font-black text-white">{money(totalBills)}</b>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Coins</span>
                <b className="text-sm font-black text-white">{money(totalCoins)}</b>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Target Due</span>
                <b className="text-sm font-black text-slate-200">{money(targetNum)}</b>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Variance</span>
                <b className={`text-sm font-black ${Math.abs(variance) < 0.01 ? 'text-emerald-400' : variance < 0 ? 'text-rose-400' : 'text-blue-400'}`}>
                  {money(variance)}
                </b>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-slate-400 block">Total Physical Cash Counted</span>
                <div className="text-2xl font-black text-emerald-400">{money(grandTotal)}</div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                  Math.abs(variance) < 0.01
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : variance < 0
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {Math.abs(variance) < 0.01 ? '✓ Balanced (Tugma ang Pera)' : variance < 0 ? `⚠️ Shortage: ${money(Math.abs(variance))}` : `⚠️ Overage: ${money(variance)}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyBreakdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Breakdown'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrintSlip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-200"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleApplyToReconciliation}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all"
            >
              <span>Save to Reconciliation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
