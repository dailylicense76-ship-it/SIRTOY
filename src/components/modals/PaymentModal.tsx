import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { DisbursementMethod, Loan } from '../../types';
import { money, outstanding, total, bname, today, round2, datef, cname, aname, num, computeOverduePenalty } from '../../utils/calculations';
import { X, Search, CreditCard, CheckCircle2, AlertCircle, Printer, ArrowRight, Tag, User, Hash, Sparkles, Check, RotateCcw, ShieldAlert, ShieldCheck } from 'lucide-react';

export const PaymentModal: React.FC = () => {
  const { db, activeModal, modalParams, closeModal, recordPayment } = useApp();

  const presetLoanId = modalParams.loanId as string | undefined;

  // Active loans with unpaid balance (excluding explicitly Rejected loans)
  const activeLoans = db.loans.filter(l => outstanding(l) > 0.01 && l.approvalStatus !== 'Rejected');

  // Search and selection
  const [searchFilter, setSearchFilter] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Blank by default unless specifically triggered from a row with a preset loan ID
  const [loanId, setLoanId] = useState<string>(() => {
    if (presetLoanId && activeLoans.some(l => l.id === presetLoanId)) {
      return presetLoanId;
    }
    return '';
  });

  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<DisbursementMethod>('Cash');
  const [ref, setRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Overdue and penalty state
  const [chargePenalty, setChargePenalty] = useState(false);
  const [penaltyAmt, setPenaltyAmt] = useState('0');

  // Selected loan details
  const selectedLoan = activeLoans.find(l => l.id === loanId);
  const selectedBorrower = selectedLoan ? db.borrowers.find(b => b.id === selectedLoan.borrowerId) : undefined;
  const selectedCollector = selectedLoan ? db.collectors.find(c => c.id === selectedLoan.collectorId) : undefined;
  const selectedArea = selectedBorrower ? db.areas.find(a => a.id === selectedBorrower.areaId) : undefined;

  // Anti-Double Payment Detection
  const todayPaymentsForSelectedLoan = selectedLoan
    ? db.payments.filter(p => p.loanId === selectedLoan.id && p.date === date)
    : [];
  const alreadyPaidTodayTotal = round2(todayPaymentsForSelectedLoan.reduce((s, p) => s + p.amount, 0));
  const hasPriorPaymentToday = todayPaymentsForSelectedLoan.length > 0;

  // Next scheduled unpaid installment
  const nextSchedule = selectedLoan?.schedule?.find(s => round2(s.remaining) > 0.01);
  const nextDueAmount = nextSchedule ? round2(nextSchedule.remaining) : (selectedLoan ? outstanding(selectedLoan) : 0);
  const currentBal = selectedLoan ? outstanding(selectedLoan) : 0;

  // Overdue status and penalty computation based on configured system penalty rules
  const pastDueSchedules = (selectedLoan?.schedule || []).filter(s => s.due < date && round2(s.remaining) > 0.01);
  const overdueArrears = round2(pastDueSchedules.reduce((sum, s) => sum + num(s.remaining), 0));
  const penaltyCheck = selectedLoan ? computeOverduePenalty(selectedLoan, date, db.settings) : { penaltyAmount: 0, daysOverdue: 0, isEligible: false, explanation: '' };
  const isOverdue = pastDueSchedules.length > 0 || penaltyCheck.daysOverdue > 0;
  const defaultPenalty = penaltyCheck.penaltyAmount;

  useEffect(() => {
    if (penaltyCheck.isEligible && defaultPenalty > 0) {
      setPenaltyAmt(String(defaultPenalty));
    } else {
      setPenaltyAmt('0');
      setChargePenalty(false);
    }
  }, [loanId, penaltyCheck.isEligible, defaultPenalty]);

  // Set default amount to next due when loan is selected or initialized
  useEffect(() => {
    if (selectedLoan && !amount) {
      if (nextDueAmount > 0) {
        setAmount(String(nextDueAmount));
      } else {
        setAmount(String(currentBal));
      }
    }
  }, [selectedLoan]);

  const handleSelectLoan = (id: string) => {
    setLoanId(id);
    setValidationError(null);
    setIsSearchFocused(false);
    const l = activeLoans.find(x => x.id === id);
    if (l) {
      const nextS = l.schedule?.find(s => round2(s.remaining) > 0.01);
      const amt = nextS ? round2(nextS.remaining) : outstanding(l);
      setAmount(String(amt));
    }
  };

  const handleResetToBlank = () => {
    setLoanId('');
    setAmount('');
    setSearchFilter('');
    setValidationError(null);
    setChargePenalty(false);
    setPenaltyAmt('0');
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const enteredAmt = Math.max(0, Number(amount) || 0);
  const isOverpaying = selectedLoan ? enteredAmt > currentBal + 0.01 : false;
  const balanceAfter = isOverpaying ? 0 : Math.max(0, round2(currentBal - enteredAmt));

  // Smart matching algorithm supporting:
  // 1. Full Loan Number (e.g. LN-00042)
  // 2. Last digits of loan number (e.g. typing "42" or "2" matches LN-00042)
  // 3. Borrower Name (First, Last, Full)
  // 4. Borrower ID or Gov ID number / last digits
  // 5. Contact number
  const filteredLoans = activeLoans.filter(l => {
    if (!searchFilter.trim()) return true;
    const b = db.borrowers.find(x => x.id === l.borrowerId);
    const q = searchFilter.trim().toLowerCase();
    const cleanQ = q.replace(/[^a-z0-9]/gi, '');
    const cleanLoanNo = (l.loanNo || '').toLowerCase().replace(/[^a-z0-9]/gi, '');
    const loanDigits = (l.loanNo || '').replace(/\D/g, '');
    const bDigits = (b?.idNo || b?.id || '').replace(/\D/g, '');

    return (
      l.loanNo.toLowerCase().includes(q) ||
      cleanLoanNo.includes(cleanQ) ||
      (cleanQ.length > 0 && loanDigits.endsWith(cleanQ)) ||
      (cleanQ.length > 0 && bDigits.endsWith(cleanQ)) ||
      bname(b).toLowerCase().includes(q) ||
      (b?.idNo || '').toLowerCase().includes(q) ||
      (b?.id || '').toLowerCase().includes(q) ||
      (b?.contact || '').includes(q) ||
      (l.loanType || '').toLowerCase().includes(q)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!loanId || !selectedLoan) {
      setValidationError('Please select an active loan for this payment.');
      return;
    }

    if (enteredAmt <= 0) {
      setValidationError('Please enter a valid payment amount greater than ₱0.00.');
      return;
    }

    if (isOverpaying) {
      setValidationError(`Payment amount cannot exceed the total outstanding balance of ${money(currentBal)}.`);
      return;
    }

    // Anti-Double Payment Validation
    if (hasPriorPaymentToday && !allowDuplicate) {
      setValidationError(`🛡️ Anti-Double Payment Guard: May naitala nang bayad na ${money(alreadyPaidTodayTotal)} para sa loan na ito ngayong ${datef(date)}. Kung lehitimong karagdagang bayad ito, lagyan ng tsek ang confirmation box sa ibaba.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const penaltyNum = chargePenalty ? Math.max(0, Number(penaltyAmt) || 0) : 0;
      const finalRemarks = penaltyNum > 0
        ? (remarks.trim() ? `${remarks.trim()} | [Late Penalty Paid: ${money(penaltyNum)}]` : `[Late Penalty Paid: ${money(penaltyNum)}]`)
        : remarks.trim();

      recordPayment({
        loanId,
        date,
        amount: enteredAmt,
        method,
        ref: ref.trim(),
        remarks: finalRemarks,
        autoPrint: autoPrintReceipt
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border-2 border-slate-300 overflow-hidden my-auto max-h-[94vh] flex flex-col animate-3d-modal">
        {/* Modal Header */}
        <div
          style={{
            backgroundColor: '#064e3b',
            backgroundImage: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #047857 100%)',
            color: '#ffffff',
            borderColor: '#34d399'
          }}
          className="flex items-center justify-between px-5 py-4 border-b shadow-md flex-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center font-black shadow-inner">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base leading-tight">
                Record Customer Payment
              </h3>
              <p className="text-[11px] text-emerald-100 font-semibold">Post loan collections, amortizations, or full settlement</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/20 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {validationError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800 font-bold">
              <AlertCircle className="w-4 h-4 text-red-600 flex-none mt-0.5" />
              <div>{validationError}</div>
            </div>
          )}

          {/* Loan Picker & Quick Search with Interactive Name Tags */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span>Search Customer / Loan Name Tag *</span>
              </label>
              <div className="flex items-center gap-2">
                {selectedLoan && (
                  <button
                    type="button"
                    onClick={handleResetToBlank}
                    className="text-[10px] text-rose-600 hover:text-rose-700 font-black flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Blank</span>
                  </button>
                )}
                <span className="text-[10px] text-slate-400 font-semibold">{activeLoans.length} active loans</span>
              </div>
            </div>

            {/* If a loan is ALREADY selected, show its Active Name Tag Card at the TOP with a 1-click Change/Clear button */}
            {selectedLoan ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-500/50 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center shadow-md flex-none">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[10px] font-black tracking-wider uppercase shadow-xs">
                        {selectedLoan.loanNo}
                      </span>
                      <b className="text-sm font-black text-slate-900">{bname(selectedBorrower)}</b>
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                      ID: <b>{selectedBorrower?.idNo || selectedBorrower?.id || '—'}</b> • Area: <b>{selectedArea?.name || 'No Area'}</b> • Collector: <b>{selectedCollector?.name || '—'}</b>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-white border border-emerald-300 text-emerald-900 text-xs font-black shadow-xs">
                    Bal: {money(currentBal)}
                  </span>
                  <button
                    type="button"
                    onClick={handleResetToBlank}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-slate-700 hover:text-rose-700 text-xs font-black shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    title="Change selected customer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Change</span>
                  </button>
                </div>
              </div>
            ) : (
              /* If NO loan is selected yet, show Clean Search Box. Matched results appear directly here without covering modal! */
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    autoFocus
                    value={searchFilter}
                    onChange={e => {
                      setSearchFilter(e.target.value);
                      setValidationError(null);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && filteredLoans.length > 0) {
                        e.preventDefault();
                        handleSelectLoan(filteredLoans[0].id);
                      }
                    }}
                    placeholder="Mag-type ng Loan ID (hal. 1, 05, LN-00001) o Pangalan ng Customer..."
                    className="w-full pl-9 pr-8 py-2 border-2 border-emerald-500/50 focus:border-emerald-600 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 bg-emerald-50/20 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/20 shadow-xs"
                  />
                  {searchFilter && (
                    <button
                      type="button"
                      onClick={() => setSearchFilter('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* MATCHING RESULTS - Only appears when user TYPES. Displayed cleanly at the top so it NEVER covers the modal below! */}
                {searchFilter.trim().length > 0 && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 animate-fadeIn">
                    <div className="flex justify-between items-center text-[10px] font-black text-emerald-900 uppercase">
                      <span>Matching Customer Name Tags ({filteredLoans.length})</span>
                      <span className="text-slate-500 font-normal">Pindutin ang name tag para piliin</span>
                    </div>

                    {filteredLoans.length === 0 ? (
                      <div className="text-xs text-slate-500 italic py-1 text-center">
                        Walang natagpuang loan o customer na tumutugma sa "<b>{searchFilter}</b>".
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                        {filteredLoans.slice(0, 8).map(l => {
                          const b = db.borrowers.find(x => x.id === l.borrowerId);
                          const nextS = l.schedule?.find(s => round2(s.remaining) > 0.01);
                          return (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => handleSelectLoan(l.id)}
                              className="p-2 rounded-xl bg-white hover:bg-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-700 text-left transition-all shadow-xs flex items-center justify-between gap-2 group cursor-pointer"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 group-hover:bg-white text-emerald-800 group-hover:text-emerald-900 text-[10px] font-black font-mono">
                                    {l.loanNo}
                                  </span>
                                  <b className="text-xs font-black truncate">{bname(b)}</b>
                                </div>
                                <div className="text-[10px] opacity-75 truncate mt-0.5">
                                  ID: {b?.idNo || b?.id || '—'} • {db.areas.find(a => a.id === b?.areaId)?.name || 'No Area'}
                                </div>
                              </div>
                              <div className="text-right flex-none">
                                <div className="text-xs font-black text-emerald-800 group-hover:text-white font-mono">
                                  {money(outstanding(l))}
                                </div>
                                {nextS && (
                                  <div className="text-[9px] opacity-75">
                                    Due: {money(nextS.remaining)}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Clean Guidance when no loan is selected yet (NO default list of loans to cover the modal!) */}
          {!selectedLoan && !searchFilter.trim() && (
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-1.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <Tag className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-slate-800">Blank Payment Form</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Mag-type ng Customer Name o Loan ID sa search box sa itaas upang lumabas ang Name Tag.
              </p>
            </div>
          )}

          {/* Selected Customer & Loan Card */}
          {selectedLoan && (
            <div className="rounded-xl p-3.5 bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <b className="text-sm font-black text-slate-900 block">{bname(selectedBorrower)}</b>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {selectedArea ? selectedArea.name : 'No Area'} • Collector: {selectedCollector ? selectedCollector.name : '—'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
                    {selectedLoan.loanNo} • {selectedLoan.loanType || 'Flat'}
                  </span>
                  {selectedLoan.approvalStatus === 'Pending' && (
                    <span className="block mt-0.5 text-[9px] font-black text-amber-600">PENDING (AUTO-APPROVES ON PAY)</span>
                  )}
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-200">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Total Due</span>
                  <b className="text-xs font-black text-slate-900">{money(total(selectedLoan))}</b>
                </div>
                <div className="p-2 rounded-lg bg-amber-50/80 border border-amber-200">
                  <span className="text-[9px] font-black uppercase text-amber-700 block">Current Balance</span>
                  <b className="text-xs font-black text-amber-800">{money(currentBal)}</b>
                </div>
                <div className="p-2 rounded-lg bg-blue-50/80 border border-blue-200">
                  <span className="text-[9px] font-black uppercase text-blue-700 block">Next Installment</span>
                  <b className="text-xs font-black text-blue-800">{money(nextDueAmount)}</b>
                </div>
              </div>

              {/* Overdue Account & Penalty Surcharge Box */}
              {isOverdue && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 space-y-2">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-1.5 text-rose-900 font-black text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-none" />
                      <span>Overdue Account ({pastDueSchedules.length} past due installment{pastDueSchedules.length > 1 ? 's' : ''})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-rose-200 text-rose-950 text-[10px] font-black uppercase">
                      Past Due Arrears: {money(overdueArrears)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-rose-200 text-xs">
                    <label className="flex items-center gap-2 font-bold text-rose-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={chargePenalty}
                        onChange={e => setChargePenalty(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span>Collect Late Penalty Surcharge (3.0% standard contract rate):</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-700">₱</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={!chargePenalty}
                        value={penaltyAmt}
                        onChange={e => setPenaltyAmt(e.target.value)}
                        className="w-24 px-2 py-1 border border-rose-300 rounded-lg text-xs font-black text-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPenaltyAmt('0');
                          setChargePenalty(false);
                        }}
                        className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-black border border-rose-200 cursor-pointer"
                        title="Waive penalty for client goodwill"
                      >
                        Waive Penalty
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Inputs */}
          {selectedLoan && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Payment Date - Compact w-36 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Collection Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-36 px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
                />
              </div>

              {/* Payment Amount - Compact w-40, not giant stretched bar */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Amount (₱) *</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-slate-600">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={currentBal}
                    required
                    value={amount}
                    onChange={e => {
                      setAmount(e.target.value);
                      setValidationError(null);
                    }}
                    placeholder="0.00"
                    className={`w-36 sm:w-44 px-3 py-1.5 border-2 rounded-xl text-sm font-black text-slate-900 bg-white ${
                      isOverpaying ? 'border-red-500 ring-2 ring-red-500/20' : 'border-emerald-300 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="sm:col-span-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Quick Select:</span>
                {nextDueAmount > 0 && nextDueAmount < currentBal && (
                  <button
                    type="button"
                    onClick={() => {
                      setAmount(String(nextDueAmount));
                      setValidationError(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-black transition-colors"
                  >
                    Next Installment ({money(nextDueAmount)})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setAmount(String(currentBal));
                    setValidationError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-black transition-colors"
                >
                  Pay Full Balance ({money(currentBal)})
                </button>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Disbursement / Channel</label>
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value as DisbursementMethod)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white"
                >
                  <option value="Cash">Cash Remittance</option>
                  <option value="GCash">GCash Transfer</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Check">Check</option>
                  <option value="Other">Other Channel</option>
                </select>
              </div>

              {/* OR / Reference */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Receipt / Reference No.</label>
                <input
                  type="text"
                  value={ref}
                  onChange={e => setRef(e.target.value)}
                  placeholder="e.g. OR-88192 / GCash Ref"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
                />
              </div>

              {/* Remarks */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Field Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Optional collector remarks or customer notes..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
                />
              </div>

              {/* Live Balance Computation Preview */}
              <div className="sm:col-span-2 p-3 rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Remaining Balance After Payment</span>
                  <b className={`text-sm font-black ${isOverpaying ? 'text-red-600' : balanceAfter === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {isOverpaying ? 'INVALID: EXCEEDS BALANCE' : balanceAfter === 0 ? '₱0.00 (LOAN FULLY SETTLED!)' : money(balanceAfter)}
                  </b>
                </div>
                <div className="text-right">
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoPrintReceipt}
                      onChange={e => setAutoPrintReceipt(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Print Receipt</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedLoan || enteredAmt <= 0 || isOverpaying}
              className="btn-3d-emerald px-6 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Confirm & Post Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
