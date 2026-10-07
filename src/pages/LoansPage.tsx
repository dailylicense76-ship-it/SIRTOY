import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { bname, money, outstanding, datef, status, due, loanIsCurrent } from '../utils/calculations';
import { printLoanAgreement } from '../utils/print';
import { Search, Plus, FileText, CreditCard, RefreshCw, Banknote, Building2, AlertTriangle, ArrowRight, FileSignature } from 'lucide-react';
import loansIcon from '../assets/images/loans_3d_icon_1791390029321.jpg';
import outstandingIcon from '../assets/images/outstanding_3d_icon_1791390608732.jpg';
import activeLoansIcon from '../assets/images/active_loans_3d_icon_1791390595213.jpg';

export const LoansPage: React.FC = () => {
  const { db, openModal, renewLoan, approveLoan } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const q = search.trim().toLowerCase();

  const rows = db.loans.filter(l => {
    const b = db.borrowers.find(x => x.id === l.borrowerId);
    const matchesSearch = (l.loanNo + ' ' + (b ? bname(b) : '') + ' ' + l.loanType).toLowerCase().includes(q);
    const st = status(l);
    const matchesStatus = !filterStatus || st === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeLoans = db.loans.filter(loanIsCurrent);
  const totalPrincipal = db.loans.reduce((s, l) => s + (l.principal || 0), 0);
  const totalOutstanding = activeLoans.reduce((s, l) => s + outstanding(l), 0);

  return (
    <div className="space-y-4">
      {/* 3D Header Banner - Indigo Theme */}
      <div
        style={{
          backgroundColor: '#312e81',
          backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #4338ca 100%)',
          color: '#ffffff',
          borderColor: '#818cf8'
        }}
        className="p-5 rounded-3xl border shadow-xl flex flex-wrap justify-between items-center gap-3"
      >
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
            className="w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner"
          >
            <Banknote className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 style={{ color: '#ffffff' }} className="text-lg font-black leading-tight">
              Loan Portfolio & Amortization Schedules
            </h2>
            <p style={{ color: '#c7d2fe' }} className="text-xs mt-0.5">
              Track active releases, daily/weekly amortizations, overdue alerts, and loan renewals.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Current">Active / Current</option>
            <option value="Overdue">Overdue Accounts</option>
            <option value="Paid">Fully Paid</option>
            <option value="Restructured">Restructured</option>
            <option value="Pending Approval">Pending Approval</option>
          </select>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search loan #, client..."
              className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 w-48 sm:w-56 bg-white"
            />
          </div>

          <button
            onClick={() => openModal('loanModal')}
            style={{
              backgroundColor: '#059669',
              backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              borderColor: '#34d399'
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all border cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ New Loan</span>
          </button>
        </div>
      </div>

      {/* 3D Color-Coded KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          style={{
            backgroundColor: '#1e1b4b',
            backgroundImage: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 60%, #0f172a 100%)',
            color: '#ffffff',
            borderColor: '#818cf8'
          }}
          className="p-5 rounded-3xl border shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all"
        >
          <div>
            <span style={{ color: '#c7d2fe' }} className="text-[11px] font-black uppercase tracking-wider block">
              Total Disbursed Principal
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {money(totalPrincipal)}
            </div>
            <span style={{ color: '#e0e7ff' }} className="text-[10px] font-semibold block mt-1">
              All-time capital released
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={loansIcon} alt="Loans" className="w-full h-full object-cover" />
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
              Total Outstanding Portfolio
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {money(totalOutstanding)}
            </div>
            <span style={{ color: '#fef3c7' }} className="text-[10px] font-semibold block mt-1">
              Active principal + interest collectibles
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={outstandingIcon} alt="Outstanding" className="w-full h-full object-cover" />
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
              Active Loan Accounts
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {activeLoans.length} Loans
            </div>
            <span style={{ color: '#d1fae5' }} className="text-[10px] font-semibold block mt-1">
              Current running repayment plans
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={activeLoansIcon} alt="Active Loans" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} className="p-5 rounded-3xl border shadow-md space-y-3">
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs text-left">
            <thead style={{ backgroundColor: '#f1f5f9', color: '#475569' }} className="font-black text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Loan #</th>
                <th className="p-3">Borrower Name</th>
                <th className="p-3">Plan / Type</th>
                <th className="p-3 text-right">Principal</th>
                <th className="p-3 text-right">Interest</th>
                <th className="p-3 text-right">Outstanding</th>
                <th className="p-3">Maturity Date</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold" style={{ color: '#1e293b' }}>
              {rows.map(l => {
                const b = db.borrowers.find(x => x.id === l.borrowerId);
                const lStatus = status(l);
                const bal = outstanding(l);

                return (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-black" style={{ color: '#2563eb' }}>{l.loanNo}</td>
                    <td className="p-3">
                      <b style={{ color: '#0f172a' }} className="font-extrabold block text-sm">{b ? bname(b) : 'Unknown'}</b>
                      <small style={{ color: '#64748b' }} className="font-mono text-[10px]">ID: {l.borrowerId}</small>
                    </td>
                    <td className="p-3">
                      <span className="font-bold">{l.loanType}</span>
                      <small style={{ color: '#64748b' }} className="block text-[10px]">{l.rate}% Interest</small>
                    </td>
                    <td className="p-3 text-right font-bold" style={{ color: '#0f172a' }}>{money(l.principal)}</td>
                    <td className="p-3 text-right font-bold" style={{ color: '#059669' }}>{money(l.totalPayable - l.principal)}</td>
                    <td className="p-3 text-right font-black" style={{ color: bal > 0.01 ? '#b45309' : '#059669' }}>
                      {money(bal)}
                    </td>
                    <td className="p-3" style={{ color: '#475569' }}>{due(l)}</td>
                    <td className="p-3 text-center">
                      <span
                        style={{
                          backgroundColor:
                            lStatus === 'Current' ? '#d1fae5' : lStatus === 'Overdue' ? '#fee2e2' : lStatus === 'Paid' ? '#eff6ff' : '#f1f5f9',
                          color:
                            lStatus === 'Current' ? '#065f46' : lStatus === 'Overdue' ? '#991b1b' : lStatus === 'Paid' ? '#1e40af' : '#64748b'
                        }}
                        className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black"
                      >
                        {lStatus}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => printLoanAgreement(db, l.id)}
                          style={{ backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}
                          className="px-2.5 py-1 rounded-xl font-black text-[11px] shadow-xs hover:bg-amber-200 border flex items-center gap-1 cursor-pointer"
                          title="Print Official Corporate Loan Agreement & Promissory Note"
                        >
                          <FileSignature className="w-3 h-3 text-amber-700" />
                          <span>Agreement</span>
                        </button>
                        <button
                          onClick={() => openModal('soaModal', { loanId: l.id })}
                          style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}
                          className="px-2.5 py-1 rounded-xl font-bold text-[11px] shadow-xs hover:bg-blue-100 cursor-pointer"
                        >
                          SOA
                        </button>
                        {bal > 0.01 ? (
                          <button
                            onClick={() => openModal('paymentModal', { loanId: l.id })}
                            style={{ backgroundColor: '#ecfdf5', color: '#047857' }}
                            className="px-2.5 py-1 rounded-xl font-bold text-[11px] hover:bg-emerald-100 cursor-pointer"
                          >
                            + Pay
                          </button>
                        ) : (
                          <button
                            onClick={() => renewLoan(l.id)}
                            style={{ backgroundColor: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
                            className="px-2.5 py-1 rounded-xl font-black text-[11px] shadow-xs hover:bg-emerald-200 border flex items-center gap-1 cursor-pointer"
                            title="Renew this borrower's loan"
                          >
                            <RefreshCw className="w-3 h-3 text-emerald-600" />
                            <span>Renew</span>
                          </button>
                        )}
                        <button
                          onClick={() => openModal('loanModal', { id: l.id })}
                          style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}
                          className="px-2.5 py-1 rounded-xl font-bold text-[11px] hover:bg-slate-200 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-400 italic">
                    No loan records found. Click &quot;+ New Loan&quot; to disburse a loan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
