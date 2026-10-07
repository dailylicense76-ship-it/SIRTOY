import React from 'react';
import { useApp } from '../../context/AppContext';
import { bname, money, outstanding, paid, datef, total } from '../../utils/calculations';
import { X, Award, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

export const CreditHistoryModal: React.FC = () => {
  const { db, activeModal, modalParams, closeModal, renewLoan } = useApp();

  const borrowerId = modalParams.borrowerId as string | undefined;
  if (activeModal !== 'creditHistoryModal' || !borrowerId) return null;

  const borrowerObj = db.borrowers.find(b => b.id === borrowerId);
  if (!borrowerObj) return null;

  const loans = db.loans.filter(l => l.borrowerId === borrowerId).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const payments = db.payments.filter(p => p.borrowerId === borrowerId);

  const totalBorrowed = loans.reduce((s, l) => s + l.principal, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const overdueCount = loans.filter(l => l.status === 'Overdue').length;
  const fullyPaidCount = loans.filter(l => l.status === 'Paid').length;
  const currentOut = loans.reduce((s, l) => s + outstanding(l), 0);

  // Simple credit rating logic
  const rating = overdueCount === 0 ? 'A+ (Excellent)' : overdueCount <= 1 ? 'B (Good)' : 'C (Risky)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-slate-300 overflow-hidden my-auto max-h-[90vh] flex flex-col animate-3d-modal">
        <div
          style={{
            backgroundColor: '#1e1b4b',
            backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #3730a3 100%)',
            color: '#ffffff',
            borderColor: '#818cf8'
          }}
          className="flex items-center justify-between px-5 py-4 border-b shadow-md flex-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center font-black shadow-inner">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base leading-tight">
                Credit History & Risk Rating — {bname(borrowerObj)}
              </h3>
              <p className="text-[11px] text-indigo-100 font-semibold">Repayment reliability, historical balances & credit rating</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/20 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Loans</span>
              <b className="text-lg font-black text-slate-900">{loans.length}</b>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Borrowed</span>
              <b className="text-lg font-black text-slate-900">{money(totalBorrowed)}</b>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Paid</span>
              <b className="text-lg font-black text-emerald-600">{money(totalPaid)}</b>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Fully Paid Loans</span>
              <b className="text-lg font-black text-emerald-600">{fullyPaidCount}</b>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Overdue Incidents</span>
              <b className={`text-lg font-black ${overdueCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{overdueCount}</b>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Current Outstanding</span>
              <b className="text-lg font-black text-amber-600">{money(currentOut)}</b>
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            overdueCount === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}>
            <div className="flex items-center gap-3">
              {overdueCount === 0 ? <ShieldCheck className="w-6 h-6 text-emerald-600 flex-none" /> : <AlertTriangle className="w-6 h-6 text-amber-600 flex-none" />}
              <div>
                <span className="text-xs font-black block">Credit Assessment: {rating}</span>
                <span className="text-[11px] font-semibold opacity-80">
                  {overdueCount === 0
                    ? 'Consistent repayment record. High priority candidate for renewal.'
                    : 'Has experienced repayment delays. Require close collector monitoring.'}
                </span>
              </div>
            </div>

            {currentOut <= 0.01 && loans.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  closeModal();
                  const lastPaid = loans.find(l => l.status === 'Paid' || outstanding(l) <= 0.01) || loans[0];
                  renewLoan(lastPaid.id);
                }}
                style={{ backgroundColor: '#065f46', color: '#ffffff' }}
                className="px-3.5 py-2 rounded-xl font-black text-xs shadow-md hover:bg-emerald-800 flex items-center gap-1.5 cursor-pointer ml-auto transition-all"
                title="Renew loan for this good-standing client"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Renew Loan</span>
              </button>
            )}
          </div>

          <div>
            <h4 className="font-extrabold text-xs text-slate-900 mb-2">Loan History Ledger</h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-extrabold text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-2">Loan No</th>
                    <th className="p-2">Date</th>
                    <th className="p-2">Method</th>
                    <th className="p-2 text-right">Principal</th>
                    <th className="p-2 text-right">Total Payable</th>
                    <th className="p-2 text-right">Outstanding</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {loans.map(l => (
                    <tr key={l.id}>
                      <td className="p-2 font-bold">{l.loanNo}</td>
                      <td className="p-2">{datef(l.date)}</td>
                      <td className="p-2">{l.loanType || l.method || 'Flat'}</td>
                      <td className="p-2 text-right">{money(l.principal)}</td>
                      <td className="p-2 text-right">{money(total(l))}</td>
                      <td className="p-2 text-right font-bold text-amber-600">{money(outstanding(l))}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          l.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : l.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!loans.length && (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-400 font-medium">No loans recorded for this borrower.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
