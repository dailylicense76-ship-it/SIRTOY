import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { money, datef, systemCashOnHand, capitalAdded, capitalWithdrawn, collectionsTotal, loanReleasedTotal, expenseTotal } from '../utils/calculations';
import { Building2, Plus, Trash2, ShieldCheck, Banknote, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import capitalIcon from '../assets/images/capital_3d_icon_1791390644749.jpg';
import outstandingIcon from '../assets/images/outstanding_3d_icon_1791390608732.jpg';

export const CapitalPage: React.FC = () => {
  const { db, user, openModal, deleteCapital } = useApp();
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const rows = db.capital.filter(x => (x.date + ' ' + x.type + ' ' + (x.description || '') + ' ' + x.user + ' ' + x.method).toLowerCase().includes(q)).slice().reverse();

  const totalCap = capitalAdded(db);
  const totalWithdrawn = capitalWithdrawn(db);
  const availCash = systemCashOnHand(db);

  return (
    <div className="space-y-4">
      {/* 3D Header Banner - Amber Theme */}
      <div
        style={{
          backgroundColor: '#78350f',
          backgroundImage: 'linear-gradient(135deg, #78350f 0%, #d97706 50%, #b45309 100%)',
          color: '#ffffff',
          borderColor: '#fbbf24'
        }}
        className="p-5 rounded-3xl border shadow-xl flex flex-wrap justify-between items-center gap-3"
      >
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
            className="w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner"
          >
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 style={{ color: '#ffffff' }} className="text-lg font-black leading-tight">
              Capital & Equity Treasury Management
            </h2>
            <p style={{ color: '#fef3c7' }} className="text-xs mt-0.5">
              Record business capital additions, investor deposits, and partner cash-outs.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user?.role === 'Admin' && (
            <button
              onClick={() => openModal('capitalModal')}
              style={{
                backgroundColor: '#059669',
                backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                borderColor: '#34d399'
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all border cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Add / Withdraw Capital</span>
            </button>
          )}
        </div>
      </div>

      {/* 3D Color-Coded KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          style={{
            backgroundColor: availCash < 0 ? '#9f1239' : '#1e40af',
            backgroundImage: availCash < 0 ? 'linear-gradient(135deg, #e11d48 0%, #9f1239 100%)' : 'linear-gradient(135deg, #2563eb 0%, #1e40af 60%, #1e1b4b 100%)',
            color: '#ffffff',
            borderColor: availCash < 0 ? '#fda4af' : '#60a5fa'
          }}
          className="p-5 rounded-3xl border shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all"
        >
          <div>
            <span style={{ color: '#dbeafe' }} className="text-[11px] font-black uppercase tracking-wider block">Available Physical Cash</span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">{money(availCash)}</div>
            <span style={{ color: '#dbeafe' }} className="text-[10px] font-semibold block mt-1">Real-time treasury on hand</span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={outstandingIcon} alt="Cash" className="w-full h-full object-cover" />
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#065f46',
            backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #064e3b 100%)',
            color: '#ffffff',
            borderColor: '#6ee7b7'
          }}
          className="p-5 rounded-3xl border shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all"
        >
          <div>
            <span style={{ color: '#d1fae5' }} className="text-[11px] font-black uppercase tracking-wider block">Total Capital Contributed</span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">{money(totalCap)}</div>
            <span style={{ color: '#d1fae5' }} className="text-[10px] font-semibold block mt-1">All owner additions & deposits</span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={capitalIcon} alt="Capital" className="w-full h-full object-cover" />
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
            <span style={{ color: '#fef3c7' }} className="text-[11px] font-black uppercase tracking-wider block">Total Capital Withdrawn</span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">{money(totalWithdrawn)}</div>
            <span style={{ color: '#fef3c7' }} className="text-[10px] font-semibold block mt-1">All owner cash-outs & withdrawals</span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={capitalIcon} alt="Withdrawn" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Capital Table */}
      <div style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} className="p-5 rounded-3xl border shadow-md space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h3 style={{ color: '#0f172a' }} className="text-sm font-black">Capital Transactions Ledger</h3>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search capital transactions..."
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 w-48 sm:w-60 bg-white"
          />
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs text-left">
            <thead style={{ backgroundColor: '#f1f5f9', color: '#475569' }} className="font-black text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3">Description / Remarks</th>
                <th className="p-3">Disbursement Method</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3">Recorded By</th>
                {user?.role === 'Admin' && <th className="p-3 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold" style={{ color: '#1e293b' }}>
              {rows.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="p-3">{datef(c.date)}</td>
                  <td className="p-3">
                    <span
                      style={{
                        backgroundColor: c.type === 'Add' ? '#d1fae5' : '#fee2e2',
                        color: c.type === 'Add' ? '#065f46' : '#991b1b'
                      }}
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-black"
                    >
                      {c.type}
                    </span>
                  </td>
                  <td className="p-3 font-bold" style={{ color: '#0f172a' }}>{c.description || '—'}</td>
                  <td className="p-3">{c.method}</td>
                  <td
                    className="p-3 text-right font-black"
                    style={{ color: c.type === 'Add' ? '#059669' : '#dc2626' }}
                  >
                    {c.type === 'Add' ? `+${money(c.amount)}` : `-${money(c.amount)}`}
                  </td>
                  <td className="p-3">{c.user}</td>
                  {user?.role === 'Admin' && (
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          openModal('adminConfirmModal', {
                            title: 'Kumpirmahin ang Pag-Bura ng Capital Record',
                            description: `Ipasok ang Admin Password para kumpirmahin ang pag-bura o pag-override sa capital ${c.type === 'Add' ? 'deposit' : 'withdrawal'} transaction na ₱${c.amount.toLocaleString()}.`,
                            actionLabel: 'Kumpirmahin at I-delete',
                            onConfirm: () => deleteCapital(c.id)
                          });
                        }}
                        style={{ color: '#dc2626' }}
                        className="p-1 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Delete capital record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 italic">No capital records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
