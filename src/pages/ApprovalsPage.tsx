import React from 'react';
import { useApp } from '../context/AppContext';
import { money, bname, datef } from '../utils/calculations';
import { printLoanAgreement } from '../utils/print';
import { CheckCircle2, Check, X, ShieldAlert, Sparkles, Banknote, Receipt, FileSignature } from 'lucide-react';

export const ApprovalsPage: React.FC = () => {
  const { db, openModal, approveLoan, rejectLoan, approveExpense, rejectExpense, approveRenewal, rejectRenewal } = useApp();

  const pendingLoans = db.loans.filter(l => l.approvalStatus === 'Pending');
  const pendingExpenses = db.expenses.filter(x => x.approvalStatus === 'Pending');
  const pendingRenewals = db.renewalRequests.filter(x => x.status === 'Pending');

  return (
    <div className="space-y-4">
      {/* 3D Header Banner - Royal Purple Theme */}
      <div
        style={{
          backgroundColor: '#4c1d95',
          backgroundImage: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #6d28d9 100%)',
          color: '#ffffff',
          borderColor: '#a78bfa'
        }}
        className="p-5 rounded-3xl border shadow-xl flex flex-wrap justify-between items-center gap-3"
      >
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
            className="w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner"
          >
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 style={{ color: '#ffffff' }} className="text-lg font-black leading-tight">
              Managerial Approvals & Risk Authorization
            </h2>
            <p style={{ color: '#e9d5ff' }} className="text-xs mt-0.5">
              Review and approve loan releases, large expense vouchers, and restructuring requests.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{pendingLoans.length + pendingExpenses.length + pendingRenewals.length} Pending Actions</span>
          </span>
        </div>
      </div>

      {/* 3D Color-Coded KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              Pending Loan Releases
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {pendingLoans.length} Loans
            </div>
            <span style={{ color: '#dbeafe' }} className="text-[10px] font-semibold block mt-1">
              Awaiting manager release approval
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"
          >
            <Banknote className="w-7 h-7 text-white" />
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
              Pending Expense Vouchers
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {pendingExpenses.length} Vouchers
            </div>
            <span style={{ color: '#fef3c7' }} className="text-[10px] font-semibold block mt-1">
              Awaiting disbursement authorization
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"
          >
            <Receipt className="w-7 h-7 text-white" />
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#4c1d95',
            backgroundImage: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%)',
            color: '#ffffff',
            borderColor: '#c4b5fd'
          }}
          className="p-5 rounded-3xl border shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all"
        >
          <div>
            <span style={{ color: '#ede9fe' }} className="text-[11px] font-black uppercase tracking-wider block">
              Loan Renewals Queue
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {pendingRenewals.length} Renewals
            </div>
            <span style={{ color: '#ede9fe' }} className="text-[10px] font-semibold block mt-1">
              Borrower repeat credit requests
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"
          >
            <Sparkles className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending Loans */}
        <div style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} className="p-5 rounded-3xl border shadow-md space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <h3 style={{ color: '#0f172a' }} className="text-sm font-black">Pending Loans</h3>
            <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }} className="px-2.5 py-0.5 rounded-full text-xs font-black">
              {pendingLoans.length}
            </span>
          </div>

          <div className="space-y-3">
            {pendingLoans.map(l => {
              const b = db.borrowers.find(x => x.id === l.borrowerId);
              return (
                <div key={l.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <b style={{ color: '#0f172a' }} className="font-extrabold block">{l.loanNo}</b>
                      <span className="text-slate-600 font-semibold">{bname(b)}</span>
                    </div>
                    <b className="text-sm font-black text-blue-600">{money(l.principal)}</b>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Requested by {l.createdBy || 'staff'} • {datef(l.date)}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => printLoanAgreement(db, l.id)}
                      style={{ backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}
                      className="px-2.5 py-1.5 rounded-xl font-black text-xs flex items-center justify-center gap-1 border hover:bg-amber-200 cursor-pointer shadow-xs"
                      title="Preview and Print Loan Agreement & Promissory Note"
                    >
                      <FileSignature className="w-3.5 h-3.5 text-amber-700" />
                      <span>Agreement</span>
                    </button>
                    <button
                      onClick={() => {
                        openModal('adminConfirmModal', {
                          title: 'Kumpirmahin ang Pag-Approve ng Pautang',
                          description: `Ipasok ang Admin Password para kumpirmahin ang pag-disburse/approve sa Pautang #${l.loanNo} (${bname(b)}) na nagkakahalaga ng ₱${l.principal.toLocaleString()}.`,
                          actionLabel: 'Kumpirmahin at Approve',
                          onConfirm: () => approveLoan(l.id)
                        });
                      }}
                      style={{ backgroundColor: '#059669', color: '#ffffff' }}
                      className="flex-1 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-sm hover:bg-emerald-700 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => {
                        openModal('adminConfirmModal', {
                          title: 'Kumpirmahin ang Pag-Reject ng Pautang',
                          description: `Ipasok ang Admin Password para kumpirmahin ang pag-reject sa Pautang #${l.loanNo} (${bname(b)}).`,
                          actionLabel: 'Kumpirmahin at Reject',
                          onConfirm: () => rejectLoan(l.id)
                        });
                      }}
                      style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
                      className="flex-1 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 hover:bg-red-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              );
            })}
            {!pendingLoans.length && <div className="text-xs text-slate-400 italic text-center py-6">No pending loans to approve.</div>}
          </div>
        </div>

        {/* Pending Expenses */}
        <div style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} className="p-5 rounded-3xl border shadow-md space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <h3 style={{ color: '#0f172a' }} className="text-sm font-black">Pending Expenses</h3>
            <span style={{ backgroundColor: '#fef3c7', color: '#92400e' }} className="px-2.5 py-0.5 rounded-full text-xs font-black">
              {pendingExpenses.length}
            </span>
          </div>

          <div className="space-y-3">
            {pendingExpenses.map(x => (
              <div key={x.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <b style={{ color: '#0f172a' }} className="font-extrabold block">{x.category}</b>
                    <span className="text-slate-600 font-semibold">{x.description}</span>
                  </div>
                  <b className="text-sm font-black text-rose-600">{money(x.amount)}</b>
                </div>
                <div className="text-[11px] text-slate-500">
                  By {x.user} • {datef(x.date)}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      openModal('adminConfirmModal', {
                        title: 'Kumpirmahin ang Pag-Approve ng Gastos',
                        description: `Ipasok ang Admin Password para kumpirmahin ang pag-approve sa gastusin (${x.category}) na ₱${x.amount.toLocaleString()}.`,
                        actionLabel: 'Kumpirmahin at Approve',
                        onConfirm: () => approveExpense(x.id)
                      });
                    }}
                    style={{ backgroundColor: '#059669', color: '#ffffff' }}
                    className="flex-1 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-sm hover:bg-emerald-700 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => {
                      openModal('adminConfirmModal', {
                        title: 'Kumpirmahin ang Pag-Reject ng Gastos',
                        description: `Ipasok ang Admin Password para kumpirmahin ang pag-reject sa gastusin (${x.category}) na ₱${x.amount.toLocaleString()}.`,
                        actionLabel: 'Kumpirmahin at Reject',
                        onConfirm: () => rejectExpense(x.id)
                      });
                    }}
                    style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
                    className="flex-1 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 hover:bg-red-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
            {!pendingExpenses.length && <div className="text-xs text-slate-400 italic text-center py-6">No pending expenses to approve.</div>}
          </div>
        </div>

        {/* Pending Renewal Requests */}
        <div style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} className="p-5 rounded-3xl border shadow-md space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <h3 style={{ color: '#0f172a' }} className="text-sm font-black">Renewal Requests</h3>
            <span style={{ backgroundColor: '#faf5ff', color: '#6b21a8' }} className="px-2.5 py-0.5 rounded-full text-xs font-black">
              {pendingRenewals.length}
            </span>
          </div>

          <div className="space-y-3">
            {pendingRenewals.map(r => {
              const b = db.borrowers.find(x => x.id === r.borrowerId);
              return (
                <div key={r.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <b style={{ color: '#0f172a' }} className="font-extrabold block">Renewal for {b ? bname(b) : 'Client'}</b>
                      <span className="text-slate-600 font-semibold">{(r as any).remarks || 'Standard Renewal'}</span>
                    </div>
                    <b className="text-sm font-black text-indigo-600">{money((r as any).newPrincipal)}</b>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Requested on {datef(r.requestedAt)}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => approveRenewal(r.id)}
                      style={{ backgroundColor: '#059669', color: '#ffffff' }}
                      className="flex-1 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-sm hover:bg-emerald-700 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => rejectRenewal(r.id)}
                      style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
                      className="flex-1 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 hover:bg-red-200 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              );
            })}
            {!pendingRenewals.length && <div className="text-xs text-slate-400 italic text-center py-6">No pending renewals.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
