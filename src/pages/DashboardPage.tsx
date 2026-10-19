import React from 'react';
import { useApp } from '../context/AppContext';
import activeLoansIcon from '../assets/images/active_loans_3d_icon_1791390595213.jpg';
import outstandingIcon from '../assets/images/outstanding_3d_icon_1791390608732.jpg';
import collectionsCardIcon from '../assets/images/collections_card_3d_icon_1791390619239.jpg';
import overdueCardIcon from '../assets/images/overdue_card_3d_icon_1791390630674.jpg';
import capitalIcon from '../assets/images/capital_3d_icon_1791390644749.jpg';
import expensesIcon from '../assets/images/expenses_3d_icon_1791390657463.jpg';
import profitIcon from '../assets/images/profit_3d_icon_1791390669903.jpg';
import {
  loanIsCurrent,
  outstanding,
  money,
  today,
  capitalAdded,
  loanReleasedTotal,
  systemCashOnHand,
  expenseThisMonth,
  expenseTotal,
  grossIncome,
  netProfit,
  financialStatus,
  principalCollectedTotal,
  interestCollectedTotal,
  netCashFlow,
  status,
  bname,
  cname,
  aname,
  due
} from '../utils/calculations';
import {
  Printer,
  TrendingUp,
  CreditCard,
  Plus,
  UserPlus,
  ShieldCheck,
  Calculator,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  AlertTriangle
} from 'lucide-react';
import { printCollectorPerformanceReport } from '../utils/print';

export const DashboardPage: React.FC = () => {
  const { db, go, openModal } = useApp();

  const currentLoans = React.useMemo(() => db.loans.filter(loanIsCurrent), [db.loans]);
  const totalOutstanding = React.useMemo(() => currentLoans.reduce((sum, l) => sum + outstanding(l), 0), [currentLoans]);
  const todayPayments = React.useMemo(() => db.payments.filter(p => p.date === today()), [db.payments]);
  const todayCollectionsAmt = React.useMemo(() => todayPayments.reduce((sum, p) => sum + p.amount, 0), [todayPayments]);
  const overdueLoans = React.useMemo(() => db.loans.filter(l => status(l) === 'Overdue'), [db.loans]);

  const cashAvailable = React.useMemo(() => systemCashOnHand(db), [db]);
  const profit = React.useMemo(() => netProfit(db), [db]);

  return (
    <div className="space-y-4">
      {/* Quick Action Command Center - Compact High-End Toolbar */}
      <div
        style={{
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)',
          color: '#ffffff'
        }}
        className="relative overflow-hidden flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 rounded-2xl border border-slate-700/80 shadow-lg"
      >
        <div className="relative z-10 flex items-center gap-2">
          <span
            style={{ backgroundColor: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.4)' }}
            className="p-1 rounded-lg border"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <div>
            <h2 style={{ color: '#ffffff' }} className="text-sm font-black leading-tight">
              Operations Center
            </h2>
            <p style={{ color: '#94a3b8' }} className="text-[11px]">
              Daily field transactions & quick actions
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => openModal('paymentModal')}
            style={{
              backgroundColor: '#059669',
              backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              borderColor: '#34d399'
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition-all border cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-white" />
            <span>+ Record Payment</span>
          </button>

          <button
            onClick={() => openModal('loanModal')}
            style={{
              backgroundColor: '#2563eb',
              backgroundImage: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              borderColor: '#60a5fa'
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition-all border cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>+ New Loan</span>
          </button>

          <button
            onClick={() => openModal('borrowerModal')}
            style={{
              backgroundColor: '#d97706',
              backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              borderColor: '#fcd34d'
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition-all border cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-white" />
            <span>+ Add Borrower</span>
          </button>

          <button
            onClick={() => go('collections')}
            style={{
              backgroundColor: '#1e293b',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.2)'
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs border hover:bg-slate-700 transition-all cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Collections</span>
          </button>

          <button
            onClick={() => openModal('denominationModal')}
            style={{
              backgroundColor: '#1e293b',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.2)'
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs border hover:bg-slate-700 transition-all cursor-pointer"
            title="Open Cash Denomination Bill Counter"
          >
            <Calculator className="w-3.5 h-3.5 text-blue-400" />
            <span>Counter</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI High-End Compact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Active Loans Card - Royal Blue */}
        <div
          style={{
            backgroundColor: '#1e40af',
            backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #1e40af 60%, #1e1b4b 100%)',
            color: '#ffffff',
            borderColor: '#60a5fa'
          }}
          className="p-3.5 rounded-2xl border shadow-md flex items-center justify-between group hover:-translate-y-0.5 transition-all"
        >
          <div>
            <span style={{ color: '#bfdbfe' }} className="text-[10px] font-black uppercase tracking-wider block">
              Active Loans
            </span>
            <div style={{ color: '#ffffff' }} className="text-2xl font-black mt-0.5">
              {currentLoans.length}
            </div>
            <span style={{ color: '#dbeafe' }} className="text-[10px] font-medium block mt-0.5">
              Ongoing borrower accounts
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/30 shadow-sm group-hover:scale-105 transition-transform bg-white/95">
            <img src={activeLoansIcon} alt="Active Loans 3D" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Total Outstanding Card - Warm Gold Amber */}
        <div
          style={{
            backgroundColor: '#b45309',
            backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #92400e 100%)',
            color: '#ffffff',
            borderColor: '#fde68a'
          }}
          className="p-3.5 rounded-2xl border shadow-md flex items-center justify-between group hover:-translate-y-0.5 transition-all"
        >
          <div>
            <span style={{ color: '#fef3c7' }} className="text-[10px] font-black uppercase tracking-wider block">
              Total Outstanding
            </span>
            <div style={{ color: '#ffffff' }} className="text-lg sm:text-xl font-black mt-0.5">
              {money(totalOutstanding)}
            </div>
            <span style={{ color: '#fef3c7' }} className="text-[10px] font-medium block mt-0.5">
              Principal + interest dues
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/30 shadow-sm group-hover:scale-105 transition-transform bg-white/95">
            <img src={outstandingIcon} alt="Outstanding 3D" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Today's Collections Card - Emerald Green */}
        <div
          style={{
            backgroundColor: '#065f46',
            backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #064e3b 100%)',
            color: '#ffffff',
            borderColor: '#6ee7b7'
          }}
          className="p-3.5 rounded-2xl border shadow-md flex items-center justify-between group hover:-translate-y-0.5 transition-all"
        >
          <div>
            <span style={{ color: '#d1fae5' }} className="text-[10px] font-black uppercase tracking-wider block">
              Today&apos;s Collections
            </span>
            <div style={{ color: '#ffffff' }} className="text-lg sm:text-xl font-black mt-0.5">
              {money(todayCollectionsAmt)}
            </div>
            <span style={{ color: '#d1fae5' }} className="text-[10px] font-medium block mt-0.5">
              {todayPayments.length} posted payments
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/30 shadow-sm group-hover:scale-105 transition-transform bg-white/95">
            <img src={collectionsCardIcon} alt="Collections 3D" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Overdue Accounts Card - Crimson Rose */}
        <div
          style={{
            backgroundColor: '#9f1239',
            backgroundImage: 'linear-gradient(135deg, #e11d48 0%, #be123c 50%, #881337 100%)',
            color: '#ffffff',
            borderColor: '#fda4af'
          }}
          className="p-3.5 rounded-2xl border shadow-md flex items-center justify-between group hover:-translate-y-0.5 transition-all"
        >
          <div>
            <span style={{ color: '#ffe4e6' }} className="text-[10px] font-black uppercase tracking-wider block">
              Overdue Accounts
            </span>
            <div style={{ color: '#ffffff' }} className="text-2xl font-black mt-0.5">
              {overdueLoans.length}
            </div>
            <span style={{ color: '#ffe4e6' }} className="text-[10px] font-medium block mt-0.5">
              Delayed loan accounts
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/30 shadow-sm group-hover:scale-105 transition-transform bg-white/95">
            <img src={overdueCardIcon} alt="Overdue 3D" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* 3 Secondary Cards: Capital, Expenses, Net Profit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Capital Card */}
        <div
          style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
          className="p-3.5 rounded-2xl border shadow-sm flex items-center justify-between group hover:shadow-md transition-all"
        >
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">Capital / Available Cash</span>
              <button onClick={() => go('capital')} className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer">
                <span>Manage</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div style={{ color: cashAvailable < 0 ? '#dc2626' : '#0f172a' }} className="text-lg font-black truncate">
              {money(cashAvailable)}
            </div>
            <span className="text-[10px] text-slate-500 block truncate mt-0.5">
              Injected: <b>{money(capitalAdded(db))}</b> • Released: <b>{money(loanReleasedTotal(db))}</b>
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shadow-xs flex-none group-hover:scale-105 transition-transform">
            <img src={capitalIcon} alt="Capital 3D" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Expenses Card */}
        <div
          style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
          className="p-3.5 rounded-2xl border shadow-sm flex items-center justify-between group hover:shadow-md transition-all"
        >
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Expenses This Month</span>
              <span style={{ backgroundColor: '#fef3c7', color: '#92400e' }} className="px-1.5 py-0.2 rounded-md text-[9px] font-bold">
                Tracker
              </span>
            </div>
            <div style={{ color: '#0f172a' }} className="text-lg font-black truncate">
              {money(expenseThisMonth(db))}
            </div>
            <span className="text-[10px] text-slate-500 block truncate mt-0.5">
              All-time operational: <b>{money(expenseTotal(db))}</b>
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shadow-xs flex-none group-hover:scale-105 transition-transform">
            <img src={expensesIcon} alt="Expenses 3D" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Net Profit Card */}
        <div
          style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}
          className="p-3.5 rounded-2xl border shadow-sm flex items-center justify-between group hover:shadow-md transition-all"
        >
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Net Profit / Loss</span>
              <span
                style={{
                  backgroundColor: profit >= 0 ? '#d1fae5' : '#fee2e2',
                  color: profit >= 0 ? '#065f46' : '#991b1b'
                }}
                className="px-1.5 py-0.2 rounded-md text-[9px] font-extrabold"
              >
                {financialStatus(db)}
              </span>
            </div>
            <div style={{ color: profit < 0 ? '#dc2626' : '#059669' }} className="text-lg font-black truncate">
              {money(profit)}
            </div>
            <span className="text-[10px] text-slate-500 block truncate mt-0.5">
              Gross interest: <b className="text-emerald-700">{money(grossIncome(db))}</b>
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shadow-xs flex-none group-hover:scale-105 transition-transform">
            <img src={profitIcon} alt="Profit 3D" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Financial Health & Cash Flow Grid */}
      <div style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }} className="p-3.5 sm:p-4 rounded-2xl border shadow-sm">
        <h3 style={{ color: '#0f172a' }} className="font-black text-xs mb-2.5 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>Financial Health & Cash Flow Summary</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center">
          <div style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }} className="p-2 rounded-xl border">
            <span style={{ color: '#64748b' }} className="text-[9px] font-bold uppercase block">Capital Added</span>
            <b style={{ color: '#0f172a' }} className="text-xs font-black mt-0.5 block">{money(capitalAdded(db))}</b>
          </div>
          <div style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }} className="p-2 rounded-xl border">
            <span style={{ color: '#1d4ed8' }} className="text-[9px] font-bold uppercase block">Loan Releases</span>
            <b style={{ color: '#1e3a8a' }} className="text-xs font-black mt-0.5 block">{money(loanReleasedTotal(db))}</b>
          </div>
          <div style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }} className="p-2 rounded-xl border">
            <span style={{ color: '#047857' }} className="text-[9px] font-bold uppercase block">Principal In</span>
            <b style={{ color: '#064e3b' }} className="text-xs font-black mt-0.5 block">{money(principalCollectedTotal(db))}</b>
          </div>
          <div style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }} className="p-2 rounded-xl border">
            <span style={{ color: '#047857' }} className="text-[9px] font-bold uppercase block">Interest In</span>
            <b style={{ color: '#064e3b' }} className="text-xs font-black mt-0.5 block">{money(interestCollectedTotal(db))}</b>
          </div>
          <div style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }} className="p-2 rounded-xl border">
            <span style={{ color: '#b45309' }} className="text-[9px] font-bold uppercase block">Expenses</span>
            <b style={{ color: '#78350f' }} className="text-xs font-black mt-0.5 block">{money(expenseTotal(db))}</b>
          </div>
          <div style={{ backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }} className="p-2 rounded-xl border">
            <span style={{ color: '#4338ca' }} className="text-[9px] font-bold uppercase block">Net Cash Flow</span>
            <b style={{ color: '#312e81' }} className="text-xs font-black mt-0.5 block">{money(netCashFlow(db))}</b>
          </div>
          <div style={{ backgroundColor: '#f0fdfa', borderColor: '#99f6e4' }} className="p-2 rounded-xl border">
            <span style={{ color: '#0f766e' }} className="text-[9px] font-bold uppercase block">System Cash</span>
            <b style={{ color: '#134e4a' }} className="text-xs font-black mt-0.5 block">{money(cashAvailable)}</b>
          </div>
          <div style={{ backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }} className="p-2 rounded-xl border">
            <span style={{ color: '#7e22ce' }} className="text-[9px] font-bold uppercase block">Counted Cash</span>
            <b style={{ color: '#581c87' }} className="text-xs font-black mt-0.5 block">
              {db.cashReconciliations[0] ? money(db.cashReconciliations[0].actualCash) : 'Not Counted'}
            </b>
          </div>
        </div>
      </div>

      {/* Collector Daily Performance Table */}
      <div style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }} className="p-3.5 sm:p-4 rounded-2xl border shadow-sm space-y-2.5">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h3 style={{ color: '#0f172a' }} className="font-black text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Collector Daily Performance & Live Route Targets</span>
            </h3>
            <p style={{ color: '#64748b' }} className="text-xs">Real-time daily quota vs posted collections</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => printCollectorPerformanceReport(db, 'Daily', today(), 'ALL')}
              style={{ backgroundColor: '#f8fafc', color: '#334155', borderColor: '#cbd5e1' }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border hover:bg-slate-200 text-xs font-bold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Quotas</span>
            </button>
            <button
              onClick={() => go('collectorPerformance')}
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-blue-700 text-xs font-bold shadow-sm cursor-pointer"
            >
              <span>View Full Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs text-left">
            <thead style={{ backgroundColor: '#f1f5f9', color: '#475569' }} className="font-black text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Collector Name</th>
                <th className="p-3">Assigned Area</th>
                <th className="p-3 text-center">Active Clients</th>
                <th className="p-3 text-right">Auto Daily Quota</th>
                <th className="p-3 text-right">Collected Today</th>
                <th className="p-3 text-right">Achievement %</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold" style={{ color: '#1e293b' }}>
              {db.collectors.map(c => {
                const area = db.areas.find(a => a.id === c.areaId);
                const clients = db.borrowers.filter(b => b.collectorId === c.id);
                const collected = db.payments
                  .filter(p => p.collectorId === c.id && p.date === today())
                  .reduce((s, p) => s + p.amount, 0);
                const quota = c.dailyQuota || 0;
                const pct = quota > 0 ? (collected / quota) * 100 : 0;

                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-black" style={{ color: '#0f172a' }}>{c.name}</td>
                    <td className="p-3" style={{ color: '#475569' }}>{area ? area.name : 'Unassigned'}</td>
                    <td className="p-3 text-center font-bold">{clients.length}</td>
                    <td className="p-3 text-right font-black" style={{ color: '#0f172a' }}>{money(quota)}</td>
                    <td className="p-3 text-right font-black" style={{ color: '#059669' }}>{money(collected)}</td>
                    <td className="p-3 text-right">
                      <span
                        style={{
                          backgroundColor: pct >= 100 ? '#d1fae5' : pct > 0 ? '#dbeafe' : '#f1f5f9',
                          color: pct >= 100 ? '#065f46' : pct > 0 ? '#1e40af' : '#64748b'
                        }}
                        className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-black"
                      >
                        {pct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        style={{
                          backgroundColor: pct >= 100 ? '#d1fae5' : '#fef3c7',
                          color: pct >= 100 ? '#065f46' : '#92400e'
                        }}
                        className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black"
                      >
                        {pct >= 100 ? 'Target Met' : 'Collecting'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!db.collectors.length && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                    No collectors registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overdue Accounts Table */}
      <div style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} className="p-5 rounded-3xl border shadow-md space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 style={{ color: '#0f172a' }} className="font-black text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Overdue Loan Accounts & Past Due Alerts</span>
            </h3>
            <p style={{ color: '#64748b' }} className="text-xs">Borrowers requiring field follow-up or restructuring</p>
          </div>
          <button
            onClick={() => go('loans')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Loans</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs text-left">
            <thead style={{ backgroundColor: '#f1f5f9', color: '#475569' }} className="font-black text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Borrower Name</th>
                <th className="p-3">Loan #</th>
                <th className="p-3">Collector</th>
                <th className="p-3">Area</th>
                <th className="p-3 text-right">Principal</th>
                <th className="p-3 text-right">Balance Due</th>
                <th className="p-3">Maturity / Due</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold" style={{ color: '#1e293b' }}>
              {overdueLoans.slice(0, 10).map(l => {
                const b = db.borrowers.find(x => x.id === l.borrowerId);
                const col = db.collectors.find(c => c.id === l.collectorId);
                const area = db.areas.find(a => a.id === b?.areaId);

                return (
                  <tr key={l.id} className="hover:bg-red-50/50 transition-colors">
                    <td className="p-3 font-black" style={{ color: '#0f172a' }}>{b ? bname(b) : 'Unknown'}</td>
                    <td className="p-3 font-mono font-bold" style={{ color: '#2563eb' }}>{l.loanNo}</td>
                    <td className="p-3" style={{ color: '#334155' }}>{cname(col)}</td>
                    <td className="p-3" style={{ color: '#334155' }}>{aname(area)}</td>
                    <td className="p-3 text-right font-bold" style={{ color: '#0f172a' }}>{money(l.principal)}</td>
                    <td className="p-3 text-right font-black" style={{ color: '#dc2626' }}>{money(outstanding(l))}</td>
                    <td className="p-3" style={{ color: '#64748b' }}>{due(l)}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => openModal('soaModal', { loanId: l.id })}
                        style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}
                        className="px-2.5 py-1 rounded-xl font-extrabold text-[11px] shadow-xs hover:bg-blue-100 cursor-pointer"
                      >
                        View SOA
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!overdueLoans.length && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-emerald-600 font-bold">
                    ✓ All accounts are healthy and current! No overdue loans detected.
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
