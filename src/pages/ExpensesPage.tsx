import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { money, datef, expenseTotal, expenseThisMonth } from '../utils/calculations';
import { printExpenseReport } from '../utils/print';
import { ReceiptText, Plus, Printer, Trash2, Check, X as XIcon, Calendar, TrendingDown } from 'lucide-react';
import expensesIcon from '../assets/images/expenses_3d_icon_1791390657463.jpg';

export const ExpensesPage: React.FC = () => {
  const { db, user, openModal, deleteExpense, approveExpense, rejectExpense } = useApp();
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const rows = db.expenses
    .filter(x => (x.date + ' ' + x.category + ' ' + (x.description || '') + ' ' + x.user + ' ' + (x.approvalStatus || '')).toLowerCase().includes(q))
    .slice()
    .reverse();

  const monthTotal = expenseThisMonth(db);
  const totalExp = expenseTotal(db);

  return (
    <div className="space-y-4">
      {/* 3D Header Banner - Rose & Amber Theme */}
      <div
        style={{
          backgroundColor: '#881337',
          backgroundImage: 'linear-gradient(135deg, #881337 0%, #be123c 50%, #9f1239 100%)',
          color: '#ffffff',
          borderColor: '#fb7185'
        }}
        className="p-5 rounded-3xl border shadow-xl flex flex-wrap justify-between items-center gap-3"
      >
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
            className="w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner"
          >
            <ReceiptText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 style={{ color: '#ffffff' }} className="text-lg font-black leading-tight">
              Operational Expenses & Office Vouchers
            </h2>
            <p style={{ color: '#fecdd3' }} className="text-xs mt-0.5">
              Record field transportation, fuel, office rent, utilities, and collector allowances.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => printExpenseReport(db)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.3)'
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs border hover:bg-white/25 transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={() => openModal('expenseModal')}
            style={{
              backgroundColor: '#059669',
              backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              borderColor: '#34d399'
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all border cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ Record Expense</span>
          </button>
        </div>
      </div>

      {/* 3D Color-Coded Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          style={{
            backgroundColor: '#881337',
            backgroundImage: 'linear-gradient(135deg, #e11d48 0%, #be123c 50%, #881337 100%)',
            color: '#ffffff',
            borderColor: '#fda4af'
          }}
          className="p-5 rounded-3xl border shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all"
        >
          <div>
            <span style={{ color: '#ffe4e6' }} className="text-[11px] font-black uppercase tracking-wider block">
              Total Approved Expenses
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {money(totalExp)}
            </div>
            <span style={{ color: '#ffe4e6' }} className="text-[10px] font-semibold block mt-1">
              All-time operational cash-outs
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={expensesIcon} alt="Expenses" className="w-full h-full object-cover" />
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#b45309',
            backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #92400e 100%)',
            color: '#ffffff',
            borderColor: '#fde68a'
          }}
          className="p-5 rounded-3xl border shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all"
        >
          <div>
            <span style={{ color: '#fef3c7' }} className="text-[11px] font-black uppercase tracking-wider block">
              This Month&apos;s Expenses
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {money(monthTotal)}
            </div>
            <span style={{ color: '#fef3c7' }} className="text-[10px] font-semibold block mt-1">
              Current calendar month overhead
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={expensesIcon} alt="Month Expenses" className="w-full h-full object-cover" />
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#1e293b',
            backgroundImage: 'linear-gradient(135deg, #334155 0%, #1e293b 60%, #0f172a 100%)',
            color: '#ffffff',
            borderColor: '#64748b'
          }}
          className="p-5 rounded-3xl border shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all"
        >
          <div>
            <span style={{ color: '#cbd5e1' }} className="text-[11px] font-black uppercase tracking-wider block">
              Total Recorded Vouchers
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {db.expenses.length} Entries
            </div>
            <span style={{ color: '#cbd5e1' }} className="text-[10px] font-semibold block mt-1">
              Audit logged expense entries
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={expensesIcon} alt="Vouchers" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} className="p-5 rounded-3xl border shadow-md space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h3 style={{ color: '#0f172a' }} className="text-sm font-black">Expense Vouchers Ledger</h3>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search expense category, user..."
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 w-48 sm:w-60 bg-white"
          />
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs text-left">
            <thead style={{ backgroundColor: '#f1f5f9', color: '#475569' }} className="font-black text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Category</th>
                <th className="p-3">Description</th>
                <th className="p-3">Payment Method</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3">Recorded By</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold" style={{ color: '#1e293b' }}>
              {rows.map(x => {
                const st = x.approvalStatus || 'Approved';
                return (
                  <tr key={x.id} className="hover:bg-slate-50">
                    <td className="p-3">{datef(x.date)}</td>
                    <td className="p-3">
                      <span style={{ backgroundColor: '#f1f5f9', color: '#334155' }} className="px-2 py-0.5 rounded-md font-bold text-[10px]">
                        {x.category}
                      </span>
                    </td>
                    <td className="p-3 font-bold" style={{ color: '#0f172a' }}>{x.description}</td>
                    <td className="p-3">{x.paymentMethod}</td>
                    <td className="p-3 text-right font-black" style={{ color: '#be123c' }}>{money(x.amount)}</td>
                    <td className="p-3 text-center">
                      <span
                        style={{
                          backgroundColor: st === 'Approved' ? '#d1fae5' : st === 'Rejected' ? '#fee2e2' : '#fef3c7',
                          color: st === 'Approved' ? '#065f46' : st === 'Rejected' ? '#991b1b' : '#92400e'
                        }}
                        className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black"
                      >
                        {st}
                      </span>
                    </td>
                    <td className="p-3">{x.user}</td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        {user?.role === 'Admin' && st === 'Pending' && (
                          <>
                            <button
                              onClick={() => {
                                openModal('adminConfirmModal', {
                                  title: 'Kumpirmahin ang Pag-Approve ng Gastos',
                                  description: `Ipasok ang Admin Password para kumpirmahin ang pag-approve ng gastusin na ₱${x.amount.toLocaleString()} (${x.category}).`,
                                  actionLabel: 'Kumpirmahin at Approve',
                                  onConfirm: () => approveExpense(x.id)
                                });
                              }}
                              style={{ backgroundColor: '#ecfdf5', color: '#047857' }}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-emerald-200 cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                openModal('adminConfirmModal', {
                                  title: 'Kumpirmahin ang Pag-Reject ng Gastos',
                                  description: `Ipasok ang Admin Password para kumpirmahin ang pag-reject sa voucher na ₱${x.amount.toLocaleString()} (${x.category}).`,
                                  actionLabel: 'Kumpirmahin at Reject',
                                  onConfirm: () => rejectExpense(x.id)
                                });
                              }}
                              style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-red-200 cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {user?.role === 'Admin' && (
                          <button
                            onClick={() => {
                              openModal('adminConfirmModal', {
                                title: 'Kumpirmahin ang Pag-Bura ng Voucher',
                                description: `Ipasok ang Admin Password para kumpirmahin ang pag-bura sa expense record: "${x.description}" (₱${x.amount.toLocaleString()}).`,
                                actionLabel: 'Buhayin at I-override',
                                onConfirm: () => deleteExpense(x.id)
                              });
                            }}
                            style={{ color: '#dc2626' }}
                            className="p-1 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Delete Expense Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400 italic">No expenses recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
