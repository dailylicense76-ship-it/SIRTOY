import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LoanType, Frequency } from '../../types';
import { outstanding, money, datef, today, bname, schedulePlan } from '../../utils/calculations';
import { X, RefreshCw } from 'lucide-react';

export const RestructureModal: React.FC = () => {
  const { db, activeModal, closeModal, restructureLoan, showToast } = useApp();

  const activeLoans = db.loans.filter(l => outstanding(l) > 0.01 && l.approvalStatus === 'Approved');

  const [loanId, setLoanId] = useState(activeLoans[0]?.id || '');
  const [date, setDate] = useState(today());
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [months, setMonths] = useState('1');
  const [frequency, setFrequency] = useState<Frequency>('Monthly');
  const [loanType, setLoanType] = useState<LoanType>('Flat');
  const [reason, setReason] = useState('');

  if (activeModal !== 'restructureModal') return null;

  const selectedLoan = db.loans.find(l => l.id === loanId);
  const selectedBorrower = selectedLoan ? db.borrowers.find(b => b.id === selectedLoan.borrowerId) : undefined;

  const currentBal = selectedLoan ? outstanding(selectedLoan) : 0;
  const pNum = Number(principal) || currentBal;
  const rNum = Number(rate) || (selectedLoan?.rate || 0);
  const mNum = Math.max(1, Math.floor(Number(months) || 1));

  const plan = schedulePlan(pNum, rNum, mNum, frequency, date, loanType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) {
      showToast('Select a loan to restructure.', 'warn');
      return;
    }
    if (!reason.trim()) {
      showToast('Please state the restructuring reason.', 'warn');
      return;
    }
    restructureLoan(selectedLoan.id, {
      date,
      principal: pNum,
      rate: rNum,
      months: mNum,
      frequency,
      loanType,
      reason: reason.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-slate-300 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-3d-modal">
        <div
          style={{
            backgroundColor: '#881337',
            backgroundImage: 'linear-gradient(135deg, #881337 0%, #e11d48 50%, #be123c 100%)',
            color: '#ffffff',
            borderColor: '#fb7185'
          }}
          className="flex items-center justify-between px-5 py-4 border-b shadow-md flex-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center font-black shadow-inner">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base leading-tight">
                Restructure Loan Terms
              </h3>
              <p className="text-[11px] text-rose-100 font-semibold">Recalculate terms, adjust interest or extend amortization</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/20 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Existing Loan to Restructure *</label>
            <select
              required
              value={loanId}
              onChange={e => {
                setLoanId(e.target.value);
                const l = db.loans.find(x => x.id === e.target.value);
                if (l) {
                  setPrincipal(String(outstanding(l)));
                  setRate(String(l.rate));
                  setLoanType(l.loanType || 'Flat');
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
            >
              <option value="">Select Unpaid Loan</option>
              {activeLoans.map(l => {
                const b = db.borrowers.find(x => x.id === l.borrowerId);
                return (
                  <option key={l.id} value={l.id}>
                    {l.loanNo} — {bname(b)} — Current Bal: {money(outstanding(l))}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Restructure Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">New Principal / Balance (₱) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={principal || String(currentBal)}
              onChange={e => setPrincipal(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              placeholder={String(currentBal)}
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">New Rate / Month (%) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={rate}
              onChange={e => setRate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              placeholder="e.g. 5"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">New Months to Pay *</label>
            <input
              type="number"
              step="1"
              min="1"
              required
              value={months}
              onChange={e => setMonths(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">New Method *</label>
            <select
              value={loanType}
              onChange={e => setLoanType(e.target.value as LoanType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
            >
              <option value="Flat">Flat Rate — fixed interest on original principal</option>
              <option value="Standard Amortization">Standard Amortization — equal payment / reducing balance</option>
              <option value="Diminishing">Diminishing — equal principal / declining payment</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Frequency *</label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value as Frequency)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Semi-monthly">Semi-monthly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          <div className="md:col-span-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs">
            <span className="font-extrabold text-blue-900 block mb-1">Restructured Loan Terms Preview:</span>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-blue-900/80 font-medium">
              <span>Method: <b>{loanType}</b></span>
              <span>Total Payable: <b>{money(plan.total)}</b></span>
              <span>Installments: <b>{plan.periods} {frequency.toLowerCase()}s</b></span>
              <span>First Due: <b>{datef(plan.rows[0]?.due)} ({money(plan.rows[0]?.amount || 0)})</b></span>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Reason for Restructuring *</label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              placeholder="State payment difficulty or agreement details"
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedLoan}
              className="btn-3d-rose px-6 py-2.5 rounded-xl text-xs font-black shadow-lg disabled:opacity-50 cursor-pointer"
            >
              Create Restructured Loan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
