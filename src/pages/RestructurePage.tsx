import React from 'react';
import { useApp } from '../context/AppContext';
import { money } from '../utils/calculations';
import { RefreshCw, Plus, ShieldCheck } from 'lucide-react';

export const RestructurePage: React.FC = () => {
  const { db, user, openModal } = useApp();

  const restructureAudits = db.audit.filter(x => x.module === 'Restructure').slice(0, 100);

  return (
    <div className="space-y-4">
      {/* 3D Header Banner - Rose / Amber Theme */}
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
            <RefreshCw className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 style={{ color: '#ffffff' }} className="text-lg font-black leading-tight">
              Loan Restructuring & Term Modification
            </h2>
            <p style={{ color: '#fecdd3' }} className="text-xs mt-0.5">
              Refinance distressed accounts with new payment terms while preserving full historical audit logs.
            </p>
          </div>
        </div>

        <div>
          {user?.role === 'Admin' && (
            <button
              onClick={() => openModal('restructureModal')}
              style={{
                backgroundColor: '#d97706',
                backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                borderColor: '#fcd34d'
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all border cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Restructure Loan</span>
            </button>
          )}
        </div>
      </div>

      {/* 3D Color-Coded KPI Cards */}
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
              Restructured Cases
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {restructureAudits.length} Accounts
            </div>
            <span style={{ color: '#ffe4e6' }} className="text-[10px] font-semibold block mt-1">
              Refinanced distress accounts
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"
          >
            <RefreshCw className="w-7 h-7 text-white" />
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#1e40af',
            backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #1e40af 60%, #1e1b4b 100%)',
            color: '#ffffff',
            borderColor: '#60a5fa'
          }}
          className="p-5 rounded-3xl border shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all"
        >
          <div>
            <span style={{ color: '#bfdbfe' }} className="text-[11px] font-black uppercase tracking-wider block">
              Historical Loan Integrity
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              100% Preserved
            </div>
            <span style={{ color: '#dbeafe' }} className="text-[10px] font-semibold block mt-1">
              Previous ledger terms archived
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"
          >
            <ShieldCheck className="w-7 h-7 text-white" />
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
            <span style={{ color: '#d1fae5' }} className="text-[11px] font-black uppercase tracking-wider block">
              Auto Schedule Regeneration
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              Active
            </div>
            <span style={{ color: '#d1fae5' }} className="text-[10px] font-semibold block mt-1">
              Clean amortization schedules
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"
          >
            <Plus className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* Restructure Log Table */}
      <div style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} className="p-5 rounded-3xl border shadow-md space-y-3">
        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 font-medium">
          <b>ℹ️ Restructuring Rule:</b> The original loan status is archived as <i>Restructured</i> and a new loan schedule is generated with linked audit trails. Outstanding interest and remaining principal are recomputed cleanly.
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs text-left">
            <thead style={{ backgroundColor: '#f1f5f9', color: '#475569' }} className="font-black text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Date / Time</th>
                <th className="p-3">Old Loan #</th>
                <th className="p-3">New Refinanced Loan</th>
                <th className="p-3">Borrower</th>
                <th className="p-3 text-right">Restructured Balance</th>
                <th className="p-3">Reason / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold" style={{ color: '#1e293b' }}>
              {restructureAudits.map(a => {
                const details = typeof a.details === 'object' && a.details !== null ? (a.details as Record<string, unknown>) : {};
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="p-3" style={{ color: '#64748b' }}>{new Date(a.at).toLocaleString('en-PH')}</td>
                    <td className="p-3 font-mono font-bold" style={{ color: '#0f172a' }}>{String(details.oldLoan || '—')}</td>
                    <td className="p-3 font-mono font-black" style={{ color: '#059669' }}>{String(details.newLoan || '—')}</td>
                    <td className="p-3 font-bold" style={{ color: '#0f172a' }}>{String(details.borrower || '—')}</td>
                    <td className="p-3 text-right font-black" style={{ color: '#b45309' }}>{money(Number(details.balance) || 0)}</td>
                    <td className="p-3" style={{ color: '#475569' }}>{String(details.reason || a.details || '—')}</td>
                  </tr>
                );
              })}
              {!restructureAudits.length && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 italic">No loan restructuring records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
