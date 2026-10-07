import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  today,
  money,
  bname,
  cname,
  aname,
  datef,
  collectionCustomerRows,
  num,
  outstanding
} from '../utils/calculations';
import { printCollectionSheet, printPaymentReceipt } from '../utils/print';
import { Printer, Download, CreditCard, Trash2, CheckSquare, Calculator, Receipt, ShieldCheck, Layers } from 'lucide-react';

export const CollectionsPage: React.FC = () => {
  const { db, user, openModal, voidPayment, exportPaymentsCSV, go } = useApp();

  const [collectionDate, setCollectionDate] = useState(today());
  const [collectorFilter, setCollectorLabelFilter] = useState('ALL');
  const [paymentQuery, setPaymentQuery] = useState('');
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());

  const activeCollectorRows = collectionCustomerRows(db, collectorFilter, collectionDate);
  const activeSectionRows = activeCollectorRows.filter(x => x.state === 'Active');
  const overdueSectionRows = activeCollectorRows.filter(x => x.state === 'Overdue');

  const todayCollected = db.payments
    .filter(p => p.date === collectionDate && (collectorFilter === 'ALL' || p.collectorId === collectorFilter))
    .reduce((s, p) => s + p.amount, 0);

  const totalExpected = activeCollectorRows.reduce((s, x) => s + x.expectedToday, 0);
  const totalBalance = activeCollectorRows.reduce((s, x) => s + x.totalOutstanding, 0);
  const totalCapital = activeCollectorRows.reduce((s, x) => s + x.loans.reduce((q, l) => q + l.principal, 0), 0);

  const filterQ = paymentQuery.trim().toLowerCase();
  const paymentHistoryRows = db.payments
    .filter(p => (p.loanNo + ' ' + p.borrowerName + ' ' + (p.reference || '') + ' ' + cname(db.collectors.find(c => c.id === p.collectorId))).toLowerCase().includes(filterQ))
    .slice()
    .reverse();

  return (
    <div className="space-y-4">
      {/* 3D Header Banner - Emerald Theme */}
      <div
        style={{
          backgroundColor: '#064e3b',
          backgroundImage: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #047857 100%)',
          color: '#ffffff',
          borderColor: '#34d399'
        }}
        className="p-5 rounded-3xl border shadow-xl flex flex-wrap justify-between items-center gap-3"
      >
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
            className="w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner"
          >
            <Receipt className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 style={{ color: '#ffffff' }} className="text-lg font-black leading-tight">
              Daily Collections & Field Remittance
            </h2>
            <p style={{ color: '#d1fae5' }} className="text-xs mt-0.5">
              Record daily customer amortizations, bulk collection sheets, and reconcile cash on hand.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => go('bulkPayment')}
            style={{
              backgroundColor: '#047857',
              backgroundImage: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
              color: '#ffffff',
              borderColor: '#6ee7b7'
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition-all border cursor-pointer"
          >
            <Layers className="w-4 h-4 text-emerald-200" />
            <span>⚡ Bulk Payment Tab</span>
          </button>
          <button
            onClick={() => openModal('denominationModal')}
            style={{
              backgroundColor: '#1e293b',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.25)'
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs border hover:bg-slate-700 transition-all cursor-pointer shadow-sm"
          >
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span>Cash Counter</span>
          </button>
          <button
            onClick={() => openModal('paymentModal')}
            style={{
              backgroundColor: '#d97706',
              backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              borderColor: '#fcd34d'
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all border cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-white" />
            <span>+ Record Payment</span>
          </button>
        </div>
      </div>

      {/* Daily Collection Sheet Controls & Filter Bar */}
      <div style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} className="p-5 rounded-3xl border shadow-md space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h3 style={{ color: '#0f172a' }} className="text-sm font-black">Daily Collection Sheet Generator</h3>
            <p style={{ color: '#64748b' }} className="text-xs">Select date and collector to print route sheets</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div>
              <label style={{ color: '#64748b' }} className="block text-[10px] font-extrabold uppercase mb-0.5">Collection Date</label>
              <input
                type="date"
                value={collectionDate}
                onChange={e => setCollectionDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
              />
            </div>
            <div>
              <label style={{ color: '#64748b' }} className="block text-[10px] font-extrabold uppercase mb-0.5">Filter Collector</label>
              <select
                value={collectorFilter}
                onChange={e => setCollectorLabelFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
              >
                <option value="ALL">All Collectors</option>
                {db.collectors.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => printCollectionSheet(db, collectionDate, collectorFilter)}
              style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
              className="mt-4 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl hover:bg-slate-800 text-xs font-bold shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print Paper Sheet</span>
            </button>
          </div>
        </div>

        {/* 4 Collection 3D Color-Coded Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            style={{
              backgroundColor: '#1e40af',
              backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
              color: '#ffffff',
              borderColor: '#60a5fa'
            }}
            className="p-4 rounded-2xl border shadow-md flex flex-col justify-between"
          >
            <span style={{ color: '#bfdbfe' }} className="text-[10px] font-black uppercase block">Active Customers</span>
            <b style={{ color: '#ffffff' }} className="text-2xl font-black mt-1">{activeSectionRows.length}</b>
            <span style={{ color: '#dbeafe' }} className="text-[10px] font-bold block mt-1">Due Today: {money(totalExpected)}</span>
          </div>

          <div
            style={{
              backgroundColor: '#9f1239',
              backgroundImage: 'linear-gradient(135deg, #e11d48 0%, #9f1239 100%)',
              color: '#ffffff',
              borderColor: '#fda4af'
            }}
            className="p-4 rounded-2xl border shadow-md flex flex-col justify-between"
          >
            <span style={{ color: '#ffe4e6' }} className="text-[10px] font-black uppercase block">Overdue Accounts</span>
            <b style={{ color: '#ffffff' }} className="text-2xl font-black mt-1">{overdueSectionRows.length}</b>
            <span style={{ color: '#ffe4e6' }} className="text-[10px] font-bold block mt-1">Delayed repayments</span>
          </div>

          <div
            style={{
              backgroundColor: '#b45309',
              backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
              color: '#ffffff',
              borderColor: '#fde68a'
            }}
            className="p-4 rounded-2xl border shadow-md flex flex-col justify-between"
          >
            <span style={{ color: '#fef3c7' }} className="text-[10px] font-black uppercase block">Assigned Capital</span>
            <b style={{ color: '#ffffff' }} className="text-xl font-black mt-1">{money(totalCapital)}</b>
            <span style={{ color: '#fef3c7' }} className="text-[10px] font-bold block mt-1">Active loan contracts</span>
          </div>

          <div
            style={{
              backgroundColor: '#065f46',
              backgroundImage: 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)',
              color: '#ffffff',
              borderColor: '#6ee7b7'
            }}
            className="p-4 rounded-2xl border shadow-md flex flex-col justify-between"
          >
            <span style={{ color: '#d1fae5' }} className="text-[10px] font-black uppercase block">Posted Collections</span>
            <b style={{ color: '#ffffff' }} className="text-2xl font-black mt-1">{money(todayCollected)}</b>
            <span style={{ color: '#d1fae5' }} className="text-[10px] font-bold block mt-1">Remitted for {datef(collectionDate)}</span>
          </div>
        </div>

        {/* Active Customers Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div style={{ backgroundColor: '#eff6ff' }} className="px-4 py-2 border-b border-slate-200 flex justify-between items-center">
            <h4 style={{ color: '#1e40af' }} className="font-black text-xs">🟦 Active Collectible Customers ({activeSectionRows.length})</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead style={{ backgroundColor: '#f8fafc', color: '#475569' }} className="font-black text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Customer / Loans</th>
                  <th className="p-2.5">Area</th>
                  <th className="p-2.5">Loan Type</th>
                  <th className="p-2.5">Next Due</th>
                  <th className="p-2.5 text-right">Due Today</th>
                  <th className="p-2.5 text-right">Total Balance</th>
                  <th className="p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold" style={{ color: '#1e293b' }}>
                {activeSectionRows.map((x, i) => (
                  <tr key={x.b.id} className="hover:bg-slate-50">
                    <td className="p-2.5">{i + 1}</td>
                    <td className="p-2.5">
                      <b style={{ color: '#0f172a' }} className="font-black block">{bname(x.b)}</b>
                      <small style={{ color: '#64748b' }} className="font-mono text-[10px]">{x.loans.map(l => l.loanNo).join(', ')}</small>
                    </td>
                    <td className="p-2.5">{aname(db.areas.find(a => a.id === x.b.areaId))}</td>
                    <td className="p-2.5">{x.loans.map(l => l.loanType || l.method || 'Flat').join(', ')}</td>
                    <td className="p-2.5">{x.next ? datef(x.next.due) : '—'}</td>
                    <td className="p-2.5 text-right font-black" style={{ color: '#0f172a' }}>{money(x.expectedToday)}</td>
                    <td className="p-2.5 text-right font-black" style={{ color: '#b45309' }}>{money(x.totalOutstanding)}</td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => {
                          const targetLoan = x.loans.find(l => outstanding(l) > 0.01) || x.loans[0];
                          if (targetLoan) openModal('paymentModal', { loanId: targetLoan.id });
                        }}
                        style={{ backgroundColor: '#059669', color: '#ffffff' }}
                        className="px-3 py-1 font-bold text-[11px] rounded-lg shadow-xs hover:bg-emerald-700 cursor-pointer"
                      >
                        + Pay
                      </button>
                    </td>
                  </tr>
                ))}
                {!activeSectionRows.length && (
                  <tr>
                    <td colSpan={8} className="p-5 text-center text-slate-400 italic">No active collectible customers for this date/collector.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overdue Customers Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div style={{ backgroundColor: '#fef2f2' }} className="px-4 py-2 border-b border-slate-200 flex justify-between items-center">
            <h4 style={{ color: '#991b1b' }} className="font-black text-xs">🟥 Overdue Customers ({overdueSectionRows.length})</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead style={{ backgroundColor: '#f8fafc', color: '#475569' }} className="font-black text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Customer / Loans</th>
                  <th className="p-2.5">Area</th>
                  <th className="p-2.5">Loan Type</th>
                  <th className="p-2.5">Oldest Due</th>
                  <th className="p-2.5 text-right">Collection Arrears</th>
                  <th className="p-2.5 text-right">Total Balance</th>
                  <th className="p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold" style={{ color: '#1e293b' }}>
                {overdueSectionRows.map((x, i) => (
                  <tr key={x.b.id} className="hover:bg-red-50/40">
                    <td className="p-2.5">{i + 1}</td>
                    <td className="p-2.5">
                      <b style={{ color: '#0f172a' }} className="font-black block">{bname(x.b)}</b>
                      <small style={{ color: '#64748b' }} className="font-mono text-[10px]">{x.loans.map(l => l.loanNo).join(', ')}</small>
                    </td>
                    <td className="p-2.5">{aname(db.areas.find(a => a.id === x.b.areaId))}</td>
                    <td className="p-2.5">{x.loans.map(l => l.loanType || l.method || 'Flat').join(', ')}</td>
                    <td className="p-2.5 font-bold" style={{ color: '#dc2626' }}>{x.next ? datef(x.next.due) : '—'}</td>
                    <td className="p-2.5 text-right font-black" style={{ color: '#dc2626' }}>{money(x.expectedToday)}</td>
                    <td className="p-2.5 text-right font-black" style={{ color: '#b45309' }}>{money(x.totalOutstanding)}</td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => {
                          const targetLoan = x.loans.find(l => outstanding(l) > 0.01) || x.loans[0];
                          if (targetLoan) openModal('paymentModal', { loanId: targetLoan.id });
                        }}
                        style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                        className="px-3 py-1 font-bold text-[11px] rounded-lg shadow-xs hover:bg-red-700 cursor-pointer"
                      >
                        + Pay
                      </button>
                    </td>
                  </tr>
                ))}
                {!overdueSectionRows.length && (
                  <tr>
                    <td colSpan={8} className="p-5 text-center text-slate-400 italic">No overdue customers recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment History Ledger */}
      <div style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} className="p-5 rounded-3xl border shadow-md space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h3 style={{ color: '#0f172a' }} className="text-sm font-black">Payment History Ledger</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={paymentQuery}
              onChange={e => setPaymentQuery(e.target.value)}
              placeholder="Search receipt ref, client..."
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 w-48 sm:w-60 bg-white"
            />
            <button
              onClick={exportPaymentsCSV}
              style={{ backgroundColor: '#f8fafc', color: '#334155', borderColor: '#cbd5e1' }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border hover:bg-slate-200 font-bold text-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs text-left">
            <thead style={{ backgroundColor: '#f1f5f9', color: '#475569' }} className="font-black text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Loan</th>
                <th className="p-2.5">Borrower</th>
                <th className="p-2.5">Collector</th>
                <th className="p-2.5">Area</th>
                <th className="p-2.5 text-right">Amount</th>
                <th className="p-2.5">Method</th>
                <th className="p-2.5">Reference</th>
                <th className="p-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold" style={{ color: '#1e293b' }}>
              {paymentHistoryRows.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-2.5">{datef(p.date)}</td>
                  <td className="p-2.5 font-bold" style={{ color: '#2563eb' }}>{p.loanNo}</td>
                  <td className="p-2.5" style={{ color: '#0f172a' }}>{p.borrowerName}</td>
                  <td className="p-2.5">{cname(db.collectors.find(c => c.id === p.collectorId))}</td>
                  <td className="p-2.5">{aname(db.areas.find(a => a.id === p.areaId))}</td>
                  <td className="p-2.5 text-right font-black" style={{ color: '#059669' }}>{money(p.amount)}</td>
                  <td className="p-2.5">{p.method}</td>
                  <td className="p-2.5 font-mono text-[11px]">{p.reference || '—'}</td>
                  <td className="p-2.5 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => printPaymentReceipt(db, p.id)}
                        style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}
                        className="px-2.5 py-1 rounded-lg font-bold text-[10px] hover:bg-blue-100 cursor-pointer shadow-xs"
                      >
                        Receipt
                      </button>
                      {user?.role === 'Admin' && (
                        <button
                          onClick={() => {
                            openModal('adminConfirmModal', {
                              title: 'Kumpirmahin ang Pag-Void ng Bayad',
                              description: `Kailangan ng Admin Password bago ma-void ang Resibo #${p.reference || p.loanNo} na nagkakahalaga ng ₱${p.amount.toLocaleString()}.`,
                              actionLabel: 'Kumpirmahin ang Void',
                              onConfirm: () => voidPayment(p.id)
                            });
                          }}
                          style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
                          className="px-2 py-1 rounded-lg font-bold text-[10px] hover:bg-red-200 cursor-pointer"
                          title="Void payment override"
                        >
                          Void
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!paymentHistoryRows.length && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-400 italic">No payments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
