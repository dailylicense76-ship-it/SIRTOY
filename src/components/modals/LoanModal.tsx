import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { LoanType, Frequency, DisbursementMethod } from '../../types';
import { schedulePlan, money, datef, today, bname, outstanding, round2 } from '../../utils/calculations';
import { printLoanAgreement } from '../../utils/print';
import { X, AlertCircle, Banknote, FileSignature, Search, Tag, User, Sparkles, RotateCcw, Check, Star } from 'lucide-react';

export const LoanModal: React.FC = () => {
  const { db, activeModal, modalParams, closeModal, saveLoan, showToast } = useApp();

  const editId = modalParams.id as string | undefined;
  const presetBorrowerId = modalParams.borrowerId as string | undefined;
  const renewedFromId = modalParams.renewedFrom as string | undefined;
  const renewalRequestId = modalParams.renewalRequestId as string | undefined;

  const existing = editId ? db.loans.find(l => l.id === editId) : undefined;
  const presetBorrower = presetBorrowerId ? db.borrowers.find(b => b.id === presetBorrowerId) : undefined;

  const [borrowerSearch, setBorrowerSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Blank by default if creating a brand new loan without a preset borrower
  const [borrowerId, setBorrowerId] = useState(existing?.borrowerId || presetBorrowerId || '');
  const [date, setDate] = useState(existing?.date || today());
  const [principal, setPrincipal] = useState(existing?.principal ? String(existing.principal) : '');
  const [rate, setRate] = useState(existing?.rate ? String(existing.rate) : '');
  const [months, setMonths] = useState(existing?.months ? String(existing.months) : '1');
  const [frequency, setFrequency] = useState<Frequency>(existing?.frequency || 'Monthly');
  const [loanType, setLoanType] = useState<LoanType>(existing?.loanType || 'Flat');
  const [disbursementMethod, setDisbursementMethod] = useState<DisbursementMethod>(existing?.disbursementMethod || 'Cash');
  const [ref, setRef] = useState(existing?.ref || '');
  const [remarks, setRemarks] = useState(existing?.remarks || '');
  const [fee, setFee] = useState(existing?.fee !== undefined ? String(existing.fee) : '0');
  const [feeDeductFromCash, setFeeDeductFromCash] = useState(
    existing ? (existing.feePaid >= existing.fee && existing.fee > 0) : true
  );

  useEffect(() => {
    if (presetBorrowerId) setBorrowerId(presetBorrowerId);
  }, [presetBorrowerId]);

  if (activeModal !== 'loanModal') return null;

  const selectedBorrower = db.borrowers.find(b => b.id === borrowerId);
  const selectedCollector = selectedBorrower ? db.collectors.find(c => c.id === selectedBorrower.collectorId) : undefined;
  const selectedArea = selectedBorrower ? db.areas.find(a => a.id === selectedBorrower.areaId) : undefined;

  // Borrower's loan history for automatic credit evaluation & status tags
  const borrowerLoans = selectedBorrower ? db.loans.filter(l => l.borrowerId === selectedBorrower.id) : [];
  const borrowerActiveLoans = borrowerLoans.filter(l => outstanding(l) > 0.01 && l.approvalStatus !== 'Rejected');
  const borrowerPaidLoans = borrowerLoans.filter(l => l.status === 'Paid' || outstanding(l) <= 0.01);

  // Auto-deduct previous balance state for fast renewals & top-ups
  const [autoDeductPreviousLoan, setAutoDeductPreviousLoan] = useState(false);
  const [selectedAutoDeductLoanId, setSelectedAutoDeductLoanId] = useState<string>('');

  useEffect(() => {
    if (borrowerActiveLoans.length > 0) {
      setSelectedAutoDeductLoanId(borrowerActiveLoans[0].id);
    } else {
      setSelectedAutoDeductLoanId('');
      setAutoDeductPreviousLoan(false);
    }
  }, [borrowerId, borrowerActiveLoans.length]);

  const activePreviousLoan = db.loans.find(l => l.id === selectedAutoDeductLoanId);
  const previousLoanBalance = (autoDeductPreviousLoan && activePreviousLoan) ? outstanding(activePreviousLoan) : 0;

  const handleSelectBorrower = (id: string) => {
    setBorrowerId(id);
    setBorrowerSearch('');
    setIsSearchFocused(false);
  };

  const handleResetToBlank = () => {
    setBorrowerId('');
    setBorrowerSearch('');
    setPrincipal('');
    setRate('');
    setMonths('1');
    setFee('0');
    setRef('');
    setRemarks('');
    setAutoDeductPreviousLoan(false);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  // Smart matching algorithm:
  // 1. Borrower Name
  // 2. ID # (full or trailing digits e.g. "1", "05")
  // 3. Contact Phone
  // 4. Area Name
  const filteredBorrowers = db.borrowers.filter(b => {
    if (!borrowerSearch.trim()) return true;
    const q = borrowerSearch.trim().toLowerCase();
    const cleanQ = q.replace(/[^a-z0-9]/gi, '');
    const bDigits = (b.idNo || b.id || '').replace(/\D/g, '');
    const areaName = (db.areas.find(a => a.id === b.areaId)?.name || '').toLowerCase();

    return (
      bname(b).toLowerCase().includes(q) ||
      (b.idNo || '').toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      (cleanQ.length > 0 && bDigits.endsWith(cleanQ)) ||
      (b.contact || '').includes(q) ||
      areaName.includes(q)
    );
  });

  const pNum = Math.max(0, Number(principal) || 0);
  const rNum = Math.max(0, Number(rate) || 0);
  const mNum = Math.max(1, Math.floor(Number(months) || 1));
  const fNum = Math.max(0, Number(fee) || 0);

  const plan = schedulePlan(pNum, rNum, mNum, frequency, date, loanType);
  const netProceeds = Math.max(0, round2(pNum - (feeDeductFromCash ? fNum : 0) - previousLoanBalance));
  const effectiveTotalPayable = plan.total + (feeDeductFromCash ? 0 : fNum);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerId) {
      showToast('Please select a borrower.', 'warn');
      return;
    }
    if (autoDeductPreviousLoan && pNum < previousLoanBalance + (feeDeductFromCash ? fNum : 0)) {
      showToast(`Ang bagong loan principal (${money(pNum)}) ay dapat mas malaki kaysa sa lumang balanse (${money(previousLoanBalance)}).`, 'warn');
      return;
    }
    saveLoan(
      {
        borrowerId,
        principal: pNum,
        rate: rNum,
        months: mNum,
        frequency,
        loanType,
        method: loanType,
        date,
        disbursementMethod,
        fee: fNum,
        feePaid: feeDeductFromCash ? fNum : 0,
        ref: ref.trim(),
        remarks: remarks.trim(),
        autoDeductLoanId: autoDeductPreviousLoan ? selectedAutoDeductLoanId : undefined,
        renewedFrom: autoDeductPreviousLoan ? selectedAutoDeductLoanId : renewedFromId,
        renewalRequestId
      },
      editId
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl xl:max-w-6xl w-full shadow-2xl border-2 border-slate-300 overflow-hidden my-auto max-h-[94vh] flex flex-col animate-3d-modal">
        {/* Landscape Header */}
        <div
          style={{
            backgroundColor: '#1e1b4b',
            backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #3730a3 100%)',
            color: '#ffffff',
            borderColor: '#818cf8'
          }}
          className="flex items-center justify-between px-5 py-3.5 border-b shadow-md flex-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center font-black shadow-inner">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-white text-sm sm:text-base leading-tight">
                {editId ? 'Edit Loan Contract' : renewedFromId ? 'Renew Borrower Loan' : 'New Loan Application & Disbursement'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-indigo-100 font-semibold">Landscape Layout • Auto-proportioned compact inputs with live side-by-side computation</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/20 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body - Side-by-Side Landscape Grid */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {Boolean(modalParams.autoCreated) && selectedBorrower && (
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-300 text-blue-900 text-xs flex items-center gap-2 flex-none">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-none" />
              <span>
                <b>New Borrower Registered:</b> Complete initial loan application for <b>{bname(selectedBorrower)}</b> (ID: {selectedBorrower.idNo || selectedBorrower.id}).
              </span>
            </div>
          )}

          {renewedFromId && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2 flex-none">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-none" />
              <span>
                <b>↻ Renewal Mode:</b> Creating new loan for <b>{bname(selectedBorrower)}</b>. Previous paid loan is retained in history.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
            {/* LEFT COLUMN: Terms Encoding (7 of 12 cols in landscape) */}
            <div className="lg:col-span-7 space-y-3">
              {/* Borrower / Client Picker with Live Floating Name Tags */}
              <div className="space-y-1 relative">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Client / Borrower Name Tag *</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {selectedBorrower && !editId && !renewedFromId && (
                      <button
                        type="button"
                        onClick={handleResetToBlank}
                        className="text-[10px] text-rose-600 hover:text-rose-700 font-black flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset to Blank</span>
                      </button>
                    )}
                    <span className="text-[10px] text-slate-400 font-semibold">{db.borrowers.length} registered</span>
                  </div>
                </div>

                {/* If Borrower is ALREADY Selected, show Active Name Tag Banner AT THE TOP */}
                {selectedBorrower ? (
                  <>
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border-2 border-indigo-500/50 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center flex-none shadow-xs">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded bg-indigo-700 text-white text-[9px] font-black uppercase font-mono">
                              {selectedBorrower.idNo || selectedBorrower.id}
                            </span>
                            <b className="text-xs font-black text-slate-900 truncate">{bname(selectedBorrower)}</b>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                            Area: <b>{selectedArea?.name || 'No Area'}</b> • Contact: <b>{selectedBorrower.contact || 'None'}</b>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-none">
                        {borrowerActiveLoans.length > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-black">
                            Active: {borrowerActiveLoans[0].loanNo}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[10px] font-black flex items-center gap-0.5">
                            <Check className="w-3 h-3" />
                            Eligible
                          </span>
                        )}

                        {!editId && !renewedFromId && (
                          <button
                            type="button"
                            onClick={handleResetToBlank}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 border border-slate-300 text-slate-700 hover:text-rose-700 text-xs font-black shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                            <span>Change</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Auto-Deduct Previous Balance Toggle for Top-Up / Fast Renewal */}
                    {borrowerActiveLoans.length > 0 && !editId && (
                      <div className="p-3 rounded-2xl bg-amber-50/90 border-2 border-amber-300 shadow-xs space-y-2 animate-fadeIn">
                        <label className="flex items-center gap-2 cursor-pointer font-black text-xs text-amber-950 select-none">
                          <input
                            type="checkbox"
                            checked={autoDeductPreviousLoan}
                            onChange={e => setAutoDeductPreviousLoan(e.target.checked)}
                            className="w-4 h-4 accent-amber-600 rounded"
                          />
                          <span>⚡ Auto-Deduct Lumang Balanse (Top-Up / Renewal Loan)</span>
                        </label>

                        {autoDeductPreviousLoan && (
                          <div className="pl-6 space-y-2 text-xs text-amber-900 pt-1 border-t border-amber-200">
                            <div className="flex flex-wrap justify-between items-center gap-2">
                              <span className="font-bold">Pautang na I-ooffset / Isasara:</span>
                              <select
                                value={selectedAutoDeductLoanId}
                                onChange={e => setSelectedAutoDeductLoanId(e.target.value)}
                                className="px-2.5 py-1 border border-amber-300 rounded-xl text-xs font-bold bg-white text-slate-900"
                              >
                                {borrowerActiveLoans.map(al => (
                                  <option key={al.id} value={al.id}>
                                    {al.loanNo} • Natitirang Balanse: {money(outstanding(al))}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="p-2 rounded-xl bg-white/90 border border-amber-200 flex justify-between items-center font-bold">
                              <span className="text-slate-600">Ibawas sa matatanggap na cash:</span>
                              <b className="text-rose-700 font-black text-sm">-{money(previousLoanBalance)}</b>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  /* If NO Borrower Selected, show Search Bar. Results display cleanly in-flow at the top! */
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-indigo-600 absolute left-3 top-2.5" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        autoFocus
                        value={borrowerSearch}
                        onChange={e => setBorrowerSearch(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && filteredBorrowers.length > 0) {
                            e.preventDefault();
                            handleSelectBorrower(filteredBorrowers[0].id);
                          }
                        }}
                        placeholder="Mag-type ng Customer Name, ID # (hal. 1, 05, B-00001), o Phone..."
                        className="w-full pl-8 pr-7 py-2 border-2 border-indigo-400 focus:border-indigo-600 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 bg-indigo-50/20 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-xs"
                      />
                      {borrowerSearch && (
                        <button
                          type="button"
                          onClick={() => setBorrowerSearch('')}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* MATCHING RESULTS - Only appears when user TYPES. Rendered in-flow so it NEVER covers modal fields below! */}
                    {borrowerSearch.trim().length > 0 && (
                      <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-2 animate-fadeIn">
                        <div className="flex justify-between items-center text-[10px] font-black text-indigo-900 uppercase">
                          <span>Matching Client Name Tags ({filteredBorrowers.length})</span>
                          <span className="text-slate-500 font-normal">Pindutin para piliin</span>
                        </div>

                        {filteredBorrowers.length === 0 ? (
                          <div className="p-2 text-center text-xs text-slate-500 italic">
                            Walang customer na tumutugma sa "<b>{borrowerSearch}</b>".
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                            {filteredBorrowers.slice(0, 8).map(b => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => handleSelectBorrower(b.id)}
                                className="p-2 rounded-xl bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-700 text-left transition-all shadow-xs flex items-center justify-between gap-2 group cursor-pointer"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.2 rounded bg-indigo-100 group-hover:bg-white text-indigo-800 group-hover:text-indigo-900 text-[9px] font-black font-mono">
                                      {b.idNo || b.id}
                                    </span>
                                    <b className="text-xs font-black truncate">{bname(b)}</b>
                                  </div>
                                  <div className="text-[10px] opacity-75 truncate mt-0.5">
                                    {db.areas.find(a => a.id === b.areaId)?.name || 'No Area'} • {b.contact || 'No phone'}
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-indigo-700 group-hover:text-white flex-none">
                                  Piliin →
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Compact Settings Form */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                {/* Row 1: Date + Collector + Disbursement Method */}
                <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
                  <div className="w-full sm:w-36 flex-none">
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Loan Date *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
                    />
                  </div>
                  <div className="flex-1 min-w-[130px]">
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Collector (Auto)</label>
                    <input
                      type="text"
                      readOnly
                      value={selectedCollector ? selectedCollector.name : selectedBorrower ? 'Unassigned' : 'Auto on select'}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-bold bg-slate-100 text-slate-800"
                    />
                  </div>
                  <div className="w-full sm:w-36 flex-none">
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Channel</label>
                    <select
                      value={disbursementMethod}
                      onChange={e => setDisbursementMethod(e.target.value as DisbursementMethod)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white"
                    >
                      <option value="Cash">Cash</option>
                      <option value="GCash">GCash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Check">Check</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Principal / Capital with Quick Chips (Compact auto-width) */}
                <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <label className="text-[11px] font-extrabold text-slate-700">Principal / Capital (₱) *</label>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase mr-0.5">Quick:</span>
                      {[5000, 10000, 20000, 50000].map(pVal => (
                        <button
                          key={pVal}
                          type="button"
                          onClick={() => setPrincipal(String(pVal))}
                          className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-100 text-[10px] font-bold text-slate-600 hover:text-indigo-800 transition-colors"
                        >
                          ₱{(pVal / 1000)}k
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-600">₱</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={principal}
                      onChange={e => setPrincipal(e.target.value)}
                      className="w-36 px-2.5 py-1.5 border-2 border-indigo-200 focus:border-indigo-600 rounded-xl text-xs font-black text-slate-900 bg-white"
                      placeholder="e.g. 10000"
                    />
                    <span className="text-[11px] text-slate-400 font-medium">Original principal loan proceeds</span>
                  </div>
                </div>

                {/* Row 3: Rate %, Months, Frequency & Method (Compact inline row) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Rate */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-extrabold text-slate-700">Rate / Mo (%)</label>
                      <div className="flex gap-0.5">
                        {[5, 10, 20].map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRate(String(r))}
                            className="px-1 py-0.2 rounded bg-slate-100 hover:bg-indigo-100 text-[9px] font-bold text-slate-600"
                          >
                            {r}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={rate}
                      onChange={e => setRate(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-xl text-xs font-black text-slate-900 bg-white text-center"
                      placeholder="e.g. 5"
                    />
                  </div>

                  {/* Months */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-extrabold text-slate-700">Months</label>
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setMonths(String(m))}
                            className="px-1 py-0.2 rounded bg-slate-100 hover:bg-indigo-100 text-[9px] font-bold text-slate-600"
                          >
                            {m}m
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      required
                      value={months}
                      onChange={e => setMonths(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-xl text-xs font-black text-slate-900 bg-white text-center"
                      placeholder="e.g. 1"
                    />
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Frequency</label>
                    <select
                      value={frequency}
                      onChange={e => setFrequency(e.target.value as Frequency)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Semi-monthly">Semi-monthly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>

                  {/* Method */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Formula</label>
                    <select
                      value={loanType}
                      onChange={e => setLoanType(e.target.value as LoanType)}
                      className="w-full px-1.5 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white"
                    >
                      <option value="Flat">Flat Rate</option>
                      <option value="Standard Amortization">Standard Amort.</option>
                      <option value="Diminishing">Diminishing</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Processing / Service Fee - Auto Compact */}
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                    <label className="text-[11px] font-black text-amber-950">Processing / Service Fee</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFee('0')}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                          fNum === 0 ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        ₱0
                      </button>
                      <button
                        type="button"
                        onClick={() => setFee('150')}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                          fNum === 150 ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        ₱150
                      </button>
                      <button
                        type="button"
                        onClick={() => setFee('300')}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                          fNum === 300 ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        ₱300
                      </button>
                      {pNum > 0 && (
                        <button
                          type="button"
                          onClick={() => setFee(String(Math.round(pNum * 0.02)))}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                            fNum === Math.round(pNum * 0.02) && fNum > 0 ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          2% (₱{Math.round(pNum * 0.02)})
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-amber-900">₱</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={fee}
                        onChange={e => setFee(e.target.value)}
                        placeholder="0.00"
                        className="w-24 px-2 py-1 border border-amber-300 rounded-lg text-xs font-black text-slate-900 bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-700">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="feeMode"
                          checked={feeDeductFromCash}
                          onChange={() => setFeeDeductFromCash(true)}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span>Bawas sa cash release</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="feeMode"
                          checked={!feeDeductFromCash}
                          onChange={() => setFeeDeductFromCash(false)}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span>Idagdag sa hulugan</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Row 5: Reference (compact w-36) + Remarks */}
                <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
                  <div className="w-full sm:w-36 flex-none">
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Ref / Voucher #</label>
                    <input
                      type="text"
                      value={ref}
                      onChange={e => setRef(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
                      placeholder="e.g. V-0012"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Remarks / Internal Notes</label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
                      placeholder="Approval remarks or guarantor details"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Live Calculation Dashboard & Schedule (5 of 12 cols in landscape) */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="text-[11px] font-black uppercase tracking-wider text-indigo-950 border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>Live Contract Calculation</span>
                <span className="text-[10px] text-indigo-600 font-bold">{plan.rows.length} Installments</span>
              </div>

              {/* Financial Highlight Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
                  <span className="text-[9px] font-bold uppercase text-slate-500 block">Principal Capital</span>
                  <b className="text-sm font-black text-slate-900">{money(pNum)}</b>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                  <span className="text-[9px] font-bold uppercase text-indigo-700 block">Total Interest ({rate || 0}%)</span>
                  <b className="text-sm font-black text-indigo-900">+{money(plan.totalInterest)}</b>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 shadow-xs">
                  <span className="text-[9px] font-black uppercase text-emerald-800 block">Net Cash Disbursed</span>
                  <b className="text-base font-black text-emerald-900">{money(netProceeds)}</b>
                  <span className="text-[9px] text-emerald-700 block mt-0.5">
                    {feeDeductFromCash && fNum > 0 ? `(Bawas ang ₱${fNum} fee)` : 'Buong cash release'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-900 to-blue-900 text-white shadow-xs">
                  <span className="text-[9px] font-bold uppercase text-indigo-200 block">Total Client Payable</span>
                  <b className="text-base font-black text-white">{money(effectiveTotalPayable)}</b>
                  <span className="text-[9px] text-indigo-200 block mt-0.5">
                    {plan.rows[0] ? `${money(plan.rows[0].amount)} / ${frequency}` : '—'}
                  </span>
                </div>
              </div>

              {/* Installment Schedule Table - Compact Landscape height */}
              <div className="flex-1 min-h-[160px] max-h-56 overflow-y-auto border border-slate-200 rounded-xl bg-white text-xs">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-extrabold text-[9px] uppercase sticky top-0 z-10">
                    <tr>
                      <th className="p-1 text-left border-b">#</th>
                      <th className="p-1 text-left border-b">Due</th>
                      <th className="p-1 text-right border-b">Amort.</th>
                      <th className="p-1 text-right border-b">Principal</th>
                      <th className="p-1 text-right border-b">Interest</th>
                      <th className="p-1 text-right border-b">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] text-slate-800">
                    {plan.rows.slice(0, 10).map(r => (
                      <tr key={r.n} className="hover:bg-slate-50">
                        <td className="p-1 font-bold text-slate-500">{r.n}</td>
                        <td className="p-1 text-[10px]">{datef(r.due)}</td>
                        <td className="p-1 text-right font-black text-indigo-900">{money(r.amount)}</td>
                        <td className="p-1 text-right text-slate-600">{money(r.principal)}</td>
                        <td className="p-1 text-right text-indigo-600">{money(r.interest)}</td>
                        <td className="p-1 text-right font-semibold">{money(r.endingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons in Right Panel Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 mt-auto">
                {existing ? (
                  <button
                    type="button"
                    onClick={() => printLoanAgreement(db, existing.id)}
                    style={{ backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border hover:bg-amber-200 transition-all cursor-pointer"
                    title="Print Promissory Note & Agreement"
                  >
                    <FileSignature className="w-3.5 h-3.5 text-amber-800" />
                    <span>Agreement</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">Ready to Disburse</span>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!borrowerId || pNum <= 0}
                    className="btn-3d-blue px-5 py-2 rounded-xl text-xs font-black shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    {editId ? 'Save Contract' : 'Release Loan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
