import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DisbursementMethod, Loan } from '../types';
import {
  today,
  money,
  bname,
  datef,
  collectionCustomerRows,
  num,
  round2,
  outstanding,
  collectionDueAmount
} from '../utils/calculations';
import { printCollectionSheet } from '../utils/print';
import {
  Layers,
  Printer,
  Calculator,
  Search,
  CheckCircle2,
  Sparkles,
  UserCheck,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface LoanEntry {
  amount: string;
  method: DisbursementMethod;
  ref: string;
  remarks: string;
}

export const BulkPaymentPage: React.FC = () => {
  const { db, openModal, processBulkPayments, showToast } = useApp();

  // Filters & State
  const [collectionDate, setCollectionDate] = useState(today());
  const [selectedCollectorId, setSelectedCollectorId] = useState<string>(() => {
    return db.collectors[0]?.id || 'ALL';
  });
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DUE_TODAY' | 'OVERDUE' | 'WITH_BALANCE' | 'ALREADY_PAID_TODAY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [defaultMethod, setDefaultMethod] = useState<DisbursementMethod>('Cash');
  const [skipAlreadyPaidToday, setSkipAlreadyPaidToday] = useState(false);

  // Input state keyed by loan ID
  const [paymentEntries, setPaymentEntries] = useState<Record<string, LoanEntry>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [postedSuccess, setPostedSuccess] = useState<{ count: number; total: number; collectorName: string; date: string } | null>(null);

  // Selected Collector Object
  const selectedCollector = db.collectors.find(c => c.id === selectedCollectorId);

  // Payments lookup by loan ID on the current collection date (Anti-Double Payment)
  const paymentsOnSelectedDateMap = useMemo(() => {
    const map = new Map<string, Array<{ amount: number; method: string; time?: string; ref?: string; id: string }>>();
    for (const p of db.payments) {
      if (p.date === collectionDate) {
        const list = map.get(p.loanId) || [];
        list.push({ amount: p.amount, method: p.method, ref: p.reference, id: p.id });
        map.set(p.loanId, list);
      }
    }
    return map;
  }, [db.payments, collectionDate]);

  // All posted payments recorded in database on collectionDate for this collector (or all collectors)
  const postedPaymentsToday = useMemo(() => {
    return db.payments.filter(p => {
      if (p.date !== collectionDate) return false;
      if (selectedCollectorId === 'ALL') return true;

      if (p.collectorId === selectedCollectorId) return true;
      const loan = db.loans.find(l => l.id === p.loanId);
      if (loan && loan.collectorId === selectedCollectorId) return true;
      const borrower = db.borrowers.find(b => b.id === p.borrowerId);
      if (borrower && borrower.collectorId === selectedCollectorId) return true;
      return false;
    });
  }, [db.payments, db.loans, db.borrowers, collectionDate, selectedCollectorId]);

  const totalPostedAmountToday = useMemo(() => {
    return round2(postedPaymentsToday.reduce((sum, p) => sum + num(p.amount), 0));
  }, [postedPaymentsToday]);

  const postedPaymentsCountToday = postedPaymentsToday.length;

  // Fetch active customer rows assigned to this collector
  const rawCustomerRows = useMemo(() => {
    return collectionCustomerRows(db, selectedCollectorId, collectionDate);
  }, [db, selectedCollectorId, collectionDate]);

  // Flatten active loans with their borrower context
  interface FlattenedLoanRow {
    borrower: typeof rawCustomerRows[0]['b'];
    loan: Loan;
    currentBalance: number;
    expectedDueToday: number;
    isOverdue: boolean;
    overdueArrears: number;
    state: 'Active' | 'Overdue' | 'Paid';
    areaName: string;
    hasPaidToday: boolean;
    paidTodayAmount: number;
    paidTodayRecords: Array<{ amount: number; method: string; ref?: string }>;
  }

  const allLoanRows: FlattenedLoanRow[] = useMemo(() => {
    const list: FlattenedLoanRow[] = [];
    for (const crow of rawCustomerRows) {
      for (const l of crow.loans) {
        const bal = outstanding(l);
        const paidTodayList = paymentsOnSelectedDateMap.get(l.id) || [];
        const paidTodayTotal = paidTodayList.reduce((sum, item) => sum + item.amount, 0);

        // Keep row if it has balance OR if payment was recorded today
        if (bal <= 0.01 && paidTodayList.length === 0) continue;

        const dueToday = collectionDueAmount(l, collectionDate);
        const pastDueSchedules = (l.schedule || []).filter(
          s => s.due < collectionDate && round2(s.remaining) > 0.01
        );
        const isOverdue = pastDueSchedules.length > 0 && bal > 0.01;
        const arrears = pastDueSchedules.reduce((sum, s) => sum + num(s.remaining), 0);
        const area = db.areas.find(a => a.id === crow.b.areaId);

        list.push({
          borrower: crow.b,
          loan: l,
          currentBalance: bal,
          expectedDueToday: dueToday,
          isOverdue,
          overdueArrears: arrears,
          state: isOverdue ? 'Overdue' : bal <= 0.01 ? 'Paid' : 'Active',
          areaName: area ? area.name : 'No Area',
          hasPaidToday: paidTodayList.length > 0,
          paidTodayAmount: paidTodayTotal,
          paidTodayRecords: paidTodayList
        });
      }
    }
    return list;
  }, [rawCustomerRows, collectionDate, db.areas, paymentsOnSelectedDateMap]);

  // Filtered rows based on search and status tabs
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allLoanRows.filter(row => {
      // Status filter
      if (statusFilter === 'DUE_TODAY' && row.expectedDueToday <= 0.01) return false;
      if (statusFilter === 'OVERDUE' && !row.isOverdue) return false;
      if (statusFilter === 'WITH_BALANCE' && row.currentBalance <= 0.01) return false;
      if (statusFilter === 'ALREADY_PAID_TODAY' && !row.hasPaidToday) return false;

      // Text search query
      if (q) {
        const fullString = `${row.loan.loanNo} ${bname(row.borrower)} ${row.borrower.idNo || ''} ${row.borrower.contact || ''} ${row.areaName}`.toLowerCase();
        if (!fullString.includes(q)) return false;
      }
      return true;
    });
  }, [allLoanRows, statusFilter, searchQuery]);

  // Real-time Dashboard Metrics
  const totalAssignedBorrowers = new Set(allLoanRows.map(r => r.borrower.id)).size;
  const totalTargetDueToday = allLoanRows.reduce((sum, r) => sum + r.expectedDueToday, 0);
  const totalPortfolioBalance = allLoanRows.reduce((sum, r) => sum + r.currentBalance, 0);

  // Encoded summary (Pending active input values)
  const { totalEncodedAmount, encodedCount, itemsToPost, doublePaymentWarnings } = useMemo(() => {
    let sum = 0;
    let count = 0;
    const items: Array<{ loanId: string; amount: number; method: DisbursementMethod; ref: string; remarks: string; borrowerName: string; loanNo: string; currentBalance: number; hasPaidToday: boolean; paidTodayAmount: number }> = [];
    const duplicates: Array<{ loanNo: string; borrowerName: string; newAmount: number; existingAmount: number }> = [];

    for (const row of allLoanRows) {
      const entry = paymentEntries[row.loan.id];
      const val = Number(entry?.amount) || 0;
      if (val > 0) {
        sum += val;
        count++;
        items.push({
          loanId: row.loan.id,
          amount: val,
          method: entry?.method || defaultMethod,
          ref: entry?.ref || 'BULK',
          remarks: entry?.remarks || 'Bulk collection remittance',
          borrowerName: bname(row.borrower),
          loanNo: row.loan.loanNo,
          currentBalance: row.currentBalance,
          hasPaidToday: row.hasPaidToday,
          paidTodayAmount: row.paidTodayAmount
        });

        if (row.hasPaidToday) {
          duplicates.push({
            loanNo: row.loan.loanNo,
            borrowerName: bname(row.borrower),
            newAmount: val,
            existingAmount: row.paidTodayAmount
          });
        }
      }
    }
    return {
      totalEncodedAmount: sum,
      encodedCount: count,
      itemsToPost: items,
      doublePaymentWarnings: duplicates
    };
  }, [allLoanRows, paymentEntries, defaultMethod]);

  // Total Collection For Day (Saved in DB + currently pending inputs)
  const totalCollectorCollectionToday = round2(totalPostedAmountToday + totalEncodedAmount);

  const collectionEfficiency = totalTargetDueToday > 0
    ? Math.min(100, Math.round((totalCollectorCollectionToday / totalTargetDueToday) * 100))
    : 0;

  // Handlers for single row input
  const handleAmountChange = (loanId: string, val: string) => {
    setPaymentEntries(prev => {
      const existing = prev[loanId] || { amount: '', method: defaultMethod, ref: '', remarks: '' };
      return {
        ...prev,
        [loanId]: { ...existing, amount: val }
      };
    });
  };

  const handleMethodChange = (loanId: string, method: DisbursementMethod) => {
    setPaymentEntries(prev => {
      const existing = prev[loanId] || { amount: '', method: defaultMethod, ref: '', remarks: '' };
      return {
        ...prev,
        [loanId]: { ...existing, method }
      };
    });
  };

  const handleRefChange = (loanId: string, ref: string) => {
    setPaymentEntries(prev => {
      const existing = prev[loanId] || { amount: '', method: defaultMethod, ref: '', remarks: '' };
      return {
        ...prev,
        [loanId]: { ...existing, ref }
      };
    });
  };

  // Quick 1-click batch actions
  const handleSetAllDueToday = () => {
    const updated: Record<string, LoanEntry> = { ...paymentEntries };
    let filled = 0;
    for (const row of filteredRows) {
      if (skipAlreadyPaidToday && row.hasPaidToday) continue;
      const targetAmt = row.expectedDueToday > 0 ? row.expectedDueToday : row.currentBalance;
      if (targetAmt <= 0) continue;
      updated[row.loan.id] = {
        amount: String(targetAmt),
        method: defaultMethod,
        ref: updated[row.loan.id]?.ref || '',
        remarks: 'Exact amortization due today'
      };
      filled++;
    }
    setPaymentEntries(updated);
    showToast(`Inilagay ang eksaktong due amount para sa ${filled} na customer.`);
  };

  const handleSetAllFullBalance = () => {
    const updated: Record<string, LoanEntry> = { ...paymentEntries };
    let filled = 0;
    for (const row of filteredRows) {
      if (skipAlreadyPaidToday && row.hasPaidToday) continue;
      if (row.currentBalance <= 0) continue;
      updated[row.loan.id] = {
        amount: String(row.currentBalance),
        method: defaultMethod,
        ref: updated[row.loan.id]?.ref || '',
        remarks: 'Full loan payoff'
      };
      filled++;
    }
    setPaymentEntries(updated);
    showToast(`Inilagay ang buong balanse para sa ${filled} na customer.`);
  };

  const handleClearAllEntries = () => {
    setPaymentEntries({});
    showToast('Binura ang lahat ng nailagay na payment amounts.');
  };

  // Open confirmation modal with validation check
  const handleInitiateSave = () => {
    if (encodedCount === 0) {
      showToast('⚠️ Walang halaga na nailagay. Mangyaring maglagay ng payment amount sa listahan bago mag-save.', 'warn');
      return;
    }

    // Check if any amount exceeds balance
    for (const item of itemsToPost) {
      if (item.amount > item.currentBalance + 0.01) {
        showToast(`⚠️ Ang halaga para sa ${item.loanNo} (${money(item.amount)}) ay lumagpas sa balanse nitong ${money(item.currentBalance)}. Ayusin bago i-save.`, 'warn');
        return;
      }
    }

    // Open confirmation dialog
    setShowConfirmModal(true);
  };

  // Commit and Save all bulk payments
  const handleConfirmAndSaveBulkPayments = () => {
    if (itemsToPost.length === 0) {
      showToast('Walang valid na payment items.', 'warn');
      setShowConfirmModal(false);
      return;
    }

    setIsSaving(true);
    try {
      const validPayload = itemsToPost.map(it => ({
        loanId: it.loanId,
        amount: it.amount,
        method: it.method,
        ref: it.ref,
        remarks: it.remarks
      }));

      const success = processBulkPayments(collectionDate, validPayload);
      if (success) {
        const totalSaved = totalEncodedAmount;
        const countSaved = validPayload.length;
        const colName = selectedCollector ? selectedCollector.name : 'Lahat ng Collectors';

        // Clear posted entries
        setPaymentEntries({});
        setShowConfirmModal(false);

        // Open in-app success dialog
        setPostedSuccess({
          count: countSaved,
          total: totalSaved,
          collectorName: colName,
          date: collectionDate
        });
      }
    } catch (err: any) {
      showToast(`Error sa pag-save: ${err?.message || 'Hindi ma-proseso ang bulk payment'}`, 'warn');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Header Banner */}
      <div
        style={{
          backgroundColor: '#047857',
          backgroundImage: 'linear-gradient(135deg, #065f46 0%, #059669 45%, #10b981 100%)',
          color: '#ffffff',
          borderColor: '#6ee7b7'
        }}
        className="p-5 rounded-3xl border shadow-xl flex flex-wrap justify-between items-center gap-3"
      >
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
            className="w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner"
          >
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 style={{ color: '#ffffff' }} className="text-lg font-black leading-tight flex items-center gap-2">
              <span>Bulk Payment & Field Collection Matrix</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 text-[10px] font-black uppercase shadow-xs">
                Batch Posting
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black uppercase shadow-xs flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Anti-Double Guard
              </span>
            </h2>
            <p style={{ color: '#d1fae5' }} className="text-xs mt-0.5">
              Pumili ng collector, ilagay ang payment sa bawat customer, at 1-click update sa balance pagka-save!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openModal('denominationModal')}
            style={{ backgroundColor: '#0f172a', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.25)' }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs border hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
          >
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span>Cash Counter</span>
          </button>
          <button
            onClick={() => printCollectionSheet(db, collectionDate, selectedCollectorId)}
            style={{ backgroundColor: '#ffffff', color: '#065f46', borderColor: '#a7f3d0' }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-black text-xs border hover:bg-emerald-50 transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4 text-emerald-700" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Collector Filter & Date Selection Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-md space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3">
          {/* Collector & Date Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pumili ng Collector *</span>
              </label>
              <select
                value={selectedCollectorId}
                onChange={e => {
                  setSelectedCollectorId(e.target.value);
                  setPaymentEntries({}); // Reset unposted inputs on collector switch
                }}
                className="px-3 py-1.5 border-2 border-emerald-500/50 focus:border-emerald-600 rounded-xl text-xs font-black text-slate-900 bg-emerald-50/20 focus:bg-white min-w-[200px]"
              >
                <option value="ALL">🌐 Lahat ng Collectors (All Routes)</option>
                {db.collectors.map(c => (
                  <option key={c.id} value={c.id}>
                    👤 {c.name} • {db.areas.find(a => a.id === c.areaId)?.name || 'General Route'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Collection Date
              </label>
              <input
                type="date"
                value={collectionDate}
                onChange={e => setCollectionDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                Default Channel
              </label>
              <select
                value={defaultMethod}
                onChange={e => setDefaultMethod(e.target.value as DisbursementMethod)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white"
              >
                <option value="Cash">Cash (Physical)</option>
                <option value="GCash">GCash E-Wallet</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-72">
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
              Search Customer / Loan #
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Pangalan, Loan #, Barangay..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
              />
            </div>
          </div>
        </div>

        {/* 5 Real-Time Working Dashboard Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          {/* Card 1: Assigned Customers */}
          <div
            style={{
              backgroundColor: '#1e3a8a',
              backgroundImage: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)',
              color: '#ffffff',
              borderColor: '#60a5fa'
            }}
            className="p-3.5 rounded-2xl border shadow-md flex flex-col justify-between"
          >
            <span style={{ color: '#bfdbfe' }} className="text-[10px] font-black uppercase tracking-wider block">
              Mga Customer
            </span>
            <b className="text-xl sm:text-2xl font-black mt-1 text-white">{totalAssignedBorrowers}</b>
            <span style={{ color: '#dbeafe' }} className="text-[10px] font-bold block mt-0.5">
              {allLoanRows.length} aktibong pautang
            </span>
          </div>

          {/* Card 2: Target Due Today */}
          <div
            style={{
              backgroundColor: '#b45309',
              backgroundImage: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              color: '#ffffff',
              borderColor: '#fde68a'
            }}
            className="p-3.5 rounded-2xl border shadow-md flex flex-col justify-between"
          >
            <span style={{ color: '#fef3c7' }} className="text-[10px] font-black uppercase tracking-wider block">
              Due Today (Target)
            </span>
            <b className="text-xl sm:text-2xl font-black mt-1 text-white">{money(totalTargetDueToday)}</b>
            <span style={{ color: '#fef3c7' }} className="text-[10px] font-bold block mt-0.5">
              Target na hulog sa araw na ito
            </span>
          </div>

          {/* Card 3: Koleksyon Ngayong Araw (Na-post sa DB + Kasalukuyang Naka-encode) */}
          <div
            style={{
              backgroundColor: '#065f46',
              backgroundImage: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)',
              color: '#ffffff',
              borderColor: '#6ee7b7'
            }}
            className="p-3.5 rounded-2xl border shadow-md flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span style={{ color: '#d1fae5' }} className="text-[10px] font-black uppercase tracking-wider block">
                Koleksyon Ngayong Araw
              </span>
              {totalPostedAmountToday > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-950/40 text-emerald-200 text-[9px] font-black border border-emerald-400/40">
                  Na-save
                </span>
              )}
            </div>
            <b className="text-xl sm:text-2xl font-black mt-1 text-white">
              {money(totalCollectorCollectionToday)}
            </b>
            <span style={{ color: '#d1fae5' }} className="text-[10px] font-bold block mt-0.5">
              {totalPostedAmountToday > 0 && totalEncodedAmount > 0 ? (
                <span>{money(totalPostedAmountToday)} na-save + {money(totalEncodedAmount)} bago</span>
              ) : totalPostedAmountToday > 0 ? (
                <span>✓ {postedPaymentsCountToday} resibo na-save sa database</span>
              ) : totalEncodedAmount > 0 ? (
                <span>📝 {encodedCount} naka-encode (Handang i-save)</span>
              ) : (
                <span>Walang naitala sa petsang ito</span>
              )}
            </span>
          </div>

          {/* Card 4: Remittance Efficiency */}
          <div
            style={{
              backgroundColor: '#4c1d95',
              backgroundImage: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)',
              color: '#ffffff',
              borderColor: '#c4b5fd'
            }}
            className="p-3.5 rounded-2xl border shadow-md flex flex-col justify-between"
          >
            <span style={{ color: '#ede9fe' }} className="text-[10px] font-black uppercase tracking-wider block">
              Remittance Rate
            </span>
            <b className="text-xl sm:text-2xl font-black mt-1 text-white">{collectionEfficiency}%</b>
            <span style={{ color: '#ede9fe' }} className="text-[10px] font-bold block mt-0.5">
              Target Efficiency
            </span>
          </div>

          {/* Card 5: Remaining Portfolio Balance */}
          <div
            style={{
              backgroundColor: '#0f172a',
              backgroundImage: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
              color: '#ffffff',
              borderColor: '#94a3b8'
            }}
            className="p-3.5 rounded-2xl border shadow-md flex flex-col justify-between"
          >
            <span style={{ color: '#cbd5e1' }} className="text-[10px] font-black uppercase tracking-wider block">
              Total Portfolio Bal.
            </span>
            <b className="text-base sm:text-lg font-black mt-1 text-white">{money(totalPortfolioBalance)}</b>
            <span style={{ color: '#cbd5e1' }} className="text-[10px] font-bold block mt-0.5">
              Natitirang balanse
            </span>
          </div>
        </div>

        {/* Batch Action Toolbar & Status Filter Tabs */}
        <div className="pt-2 border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lahat ({allLoanRows.length})
            </button>
            <button
              onClick={() => setStatusFilter('DUE_TODAY')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'DUE_TODAY' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Due Today ({allLoanRows.filter(r => r.expectedDueToday > 0).length})
            </button>
            <button
              onClick={() => setStatusFilter('OVERDUE')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'OVERDUE' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overdue ({allLoanRows.filter(r => r.isOverdue).length})
            </button>
            <button
              onClick={() => setStatusFilter('ALREADY_PAID_TODAY')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'ALREADY_PAID_TODAY' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>May Bayad Na Ngayon ({allLoanRows.filter(r => r.hasPaidToday).length})</span>
            </button>
          </div>

          {/* Anti-Double Payment Toggle & Batch Fill Helpers */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-black text-amber-900 cursor-pointer hover:bg-amber-100 transition-colors select-none">
              <input
                type="checkbox"
                checked={skipAlreadyPaidToday}
                onChange={e => setSkipAlreadyPaidToday(e.target.checked)}
                className="w-3.5 h-3.5 accent-amber-600 rounded"
              />
              <span>🛡️ I-skip ang may bayad na kapag nag-Auto Fill</span>
            </label>

            <button
              type="button"
              onClick={handleSetAllDueToday}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Set All Exact Due</span>
            </button>
            <button
              type="button"
              onClick={handleSetAllFullBalance}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-900 text-xs font-black shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Set All Full Pay</span>
            </button>
            <button
              type="button"
              onClick={handleClearAllEntries}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-slate-600 hover:text-rose-700 text-xs font-bold cursor-pointer transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Customer Collection Matrix Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
              Collector Customer Accounts ({filteredRows.length})
            </h3>
            <span className="text-[11px] text-slate-500 font-semibold">
              • Route: <b>{selectedCollector ? selectedCollector.name : 'All Collectors'}</b>
            </span>
          </div>
          <div className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-2">
            <span>Koleksyon sa Araw na Ito: <b>{money(totalCollectorCollectionToday)}</b></span>
            {totalPostedAmountToday > 0 && (
              <span className="text-[10px] text-emerald-700 font-semibold">({money(totalPostedAmountToday)} na-save)</span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-600 font-black text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3 text-center w-10">#</th>
                <th className="p-3">Customer Profile & Name Tag</th>
                <th className="p-3">Loan Info</th>
                <th className="p-3 text-center">Status & Anti-Double Alert</th>
                <th className="p-3 text-right">Current Balance</th>
                <th className="p-3 text-right">Due Today</th>
                <th className="p-3 text-center w-48 bg-emerald-50/50">Collection Payment (₱)</th>
                <th className="p-3 text-center w-28">Channel</th>
                <th className="p-3 text-center w-28">OR / Ref #</th>
                <th className="p-3 text-right">New Balance Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {filteredRows.map((row, idx) => {
                const entry = paymentEntries[row.loan.id] || { amount: '', method: defaultMethod, ref: '', remarks: '' };
                const enteredAmt = Number(entry.amount) || 0;
                const newBalance = Math.max(0, round2(row.currentBalance - enteredAmt));
                const isPaidOff = (enteredAmt >= row.currentBalance - 0.01 && enteredAmt > 0) || row.currentBalance <= 0.01;
                const hasValue = enteredAmt > 0;
                const isDoubleWarning = hasValue && row.hasPaidToday;

                return (
                  <tr
                    key={row.loan.id}
                    className={`transition-colors ${
                      isDoubleWarning
                        ? 'bg-amber-50/70 hover:bg-amber-50 border-l-4 border-l-amber-500'
                        : hasValue
                        ? 'bg-emerald-50/40 hover:bg-emerald-50/60 border-l-4 border-l-emerald-500'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Index */}
                    <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>

                    {/* Customer Name Tag & Info */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black font-mono">
                          {row.borrower.idNo || row.borrower.id}
                        </span>
                        <b
                          className="text-slate-900 font-black text-xs hover:text-emerald-700 cursor-pointer"
                          onClick={() => openModal('borrowerModal', { id: row.borrower.id })}
                        >
                          {bname(row.borrower)}
                        </b>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                        Area: <b>{row.areaName}</b> • Tel: {row.borrower.contact || 'None'}
                      </div>
                    </td>

                    {/* Loan Info */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-black text-[10px]">
                          {row.loan.loanNo}
                        </span>
                        <span className="text-[11px] text-slate-700 font-bold">
                          {row.loan.frequency}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Original: {money(row.loan.principal)}
                      </div>
                    </td>

                    {/* Status & Anti-Double Payment Badge */}
                    <td className="p-3 text-center space-y-1">
                      {row.hasPaidToday ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[9px] border border-amber-300">
                          <ShieldAlert className="w-3 h-3 text-amber-600 flex-none" />
                          <span>May bayad na: ₱{row.paidTodayAmount.toLocaleString()}</span>
                        </div>
                      ) : row.isOverdue ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-black text-[9px] uppercase inline-block">
                          Overdue ({money(row.overdueArrears)})
                        </span>
                      ) : row.expectedDueToday > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-[9px] uppercase inline-block">
                          Due Today
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[9px] inline-block">
                          Current
                        </span>
                      )}
                    </td>

                    {/* Current Balance */}
                    <td className="p-3 text-right font-black text-slate-900">
                      {money(row.currentBalance)}
                    </td>

                    {/* Due Today */}
                    <td className="p-3 text-right font-bold text-amber-700">
                      {money(row.expectedDueToday)}
                    </td>

                    {/* Editable Payment Input */}
                    <td className="p-2.5 text-center bg-emerald-50/20">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs font-black text-slate-600">₱</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={row.currentBalance}
                            value={entry.amount}
                            disabled={row.currentBalance <= 0.01}
                            onChange={e => handleAmountChange(row.loan.id, e.target.value)}
                            placeholder={row.currentBalance <= 0.01 ? "Paid" : "0.00"}
                            className={`w-28 sm:w-32 px-2.5 py-1 border-2 rounded-xl text-xs font-black text-right text-slate-900 bg-white focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-400 ${
                              enteredAmt > row.currentBalance
                                ? 'border-rose-500 ring-rose-200'
                                : isDoubleWarning
                                ? 'border-amber-500 ring-amber-200'
                                : hasValue
                                ? 'border-emerald-500 ring-emerald-200'
                                : 'border-slate-300 focus:border-emerald-500'
                            }`}
                          />
                        </div>

                        {/* Quick One-Click helper chips per row */}
                        {row.currentBalance > 0.01 && (
                          <div className="flex items-center justify-center gap-1 text-[9px]">
                            {row.expectedDueToday > 0 && (
                              <button
                                type="button"
                                onClick={() => handleAmountChange(row.loan.id, String(row.expectedDueToday))}
                                className="px-1.5 py-0.2 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold cursor-pointer"
                                title="Set to scheduled due amount"
                              >
                                Due: ₱{row.expectedDueToday.toLocaleString()}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAmountChange(row.loan.id, String(row.currentBalance))}
                              className="px-1.5 py-0.2 rounded bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold cursor-pointer"
                              title="Set to full balance"
                            >
                              Full
                            </button>
                            {hasValue && (
                              <button
                                type="button"
                                onClick={() => handleAmountChange(row.loan.id, '')}
                                className="px-1 py-0.2 rounded bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-bold cursor-pointer"
                                title="Clear input"
                              >
                                0
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Method */}
                    <td className="p-2.5 text-center">
                      <select
                        value={entry.method || defaultMethod}
                        disabled={row.currentBalance <= 0.01}
                        onChange={e => handleMethodChange(row.loan.id, e.target.value as DisbursementMethod)}
                        className="px-2 py-1 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-800 bg-white disabled:bg-slate-100"
                      >
                        <option value="Cash">Cash</option>
                        <option value="GCash">GCash</option>
                        <option value="Bank Transfer">Bank</option>
                      </select>
                    </td>

                    {/* Ref / OR # */}
                    <td className="p-2.5 text-center">
                      <input
                        type="text"
                        value={entry.ref}
                        disabled={row.currentBalance <= 0.01}
                        onChange={e => handleRefChange(row.loan.id, e.target.value)}
                        placeholder="OR #..."
                        className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-[11px] font-mono text-slate-800 bg-white placeholder:text-slate-400 disabled:bg-slate-100"
                      />
                    </td>

                    {/* New Balance Preview */}
                    <td className="p-3 text-right">
                      {row.currentBalance <= 0.01 ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-black text-[10px] uppercase">
                          🎉 Paid In Full
                        </span>
                      ) : isPaidOff ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-black text-[10px] uppercase">
                          🎉 Paid In Full
                        </span>
                      ) : hasValue ? (
                        <div className="text-right">
                          <b className="text-xs font-black text-emerald-800 block">{money(newBalance)}</b>
                          <small className="text-[10px] text-slate-400">(-{money(enteredAmt)})</small>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">{money(row.currentBalance)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!filteredRows.length && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 italic">
                    Walang aktibong customer na tumutugma sa filter o collector na napili.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky Bottom Save Action Bar */}
      <div className="fixed bottom-0 left-0 md:left-[240px] right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-slate-300 shadow-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md flex-none">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-500">
              Koleksyon para kay: <b className="text-slate-900">{selectedCollector ? selectedCollector.name : 'Lahat ng Collectors'}</b> ({datef(collectionDate)})
            </div>
            <div className="text-sm font-black text-slate-900 flex flex-wrap items-center gap-2">
              <span>Naka-encode:</span>
              <span className="text-emerald-700 text-base">{money(totalEncodedAmount)}</span>
              <span className="text-xs text-slate-500 font-bold">({encodedCount} na customer)</span>
              {totalPostedAmountToday > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black">
                  Na-save na ngayon: {money(totalPostedAmountToday)}
                </span>
              )}
              {doublePaymentWarnings.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>{doublePaymentWarnings.length} may naunang bayad na ngayon</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {encodedCount > 0 && (
            <button
              type="button"
              onClick={handleClearAllEntries}
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-600 hover:text-rose-600 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}

          <button
            type="button"
            disabled={isSaving || encodedCount === 0}
            onClick={handleInitiateSave}
            style={{
              backgroundColor: '#059669',
              backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              borderColor: '#34d399'
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm shadow-xl hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all border cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>
              {isSaving ? 'Nag-a-update ng Balance...' : `💾 I-SAVE ANG BULK PAYMENT (${money(totalEncodedAmount)})`}
            </span>
          </button>
        </div>
      </div>

      {/* Confirmation & Anti-Double Payment Dialog Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-emerald-500 overflow-hidden p-6 space-y-4 animate-3d-modal">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black flex-none">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Kumpirmahin ang Bulk Payment Posting
                </h3>
                <p className="text-xs text-slate-500">
                  Pakisuri ang kabuuang halaga at mga account bago tuluyang i-save sa database.
                </p>
              </div>
            </div>

            {/* Anti-Double Payment Warning Box in Confirmation Modal */}
            {doublePaymentWarnings.length > 0 && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 space-y-1.5 text-xs text-amber-900">
                <div className="flex items-center gap-1.5 font-black text-amber-950">
                  <ShieldAlert className="w-4 h-4 text-amber-600 flex-none" />
                  <span>🛡️ Anti-Double Payment Notice:</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  May <b>{doublePaymentWarnings.length}</b> customer na may naitala nang bayad ngayong araw ({datef(collectionDate)}):
                </p>
                <div className="max-h-24 overflow-y-auto space-y-1 pt-1">
                  {doublePaymentWarnings.map(d => (
                    <div key={d.loanNo} className="text-[10px] flex justify-between bg-white/70 p-1.5 rounded-lg border border-amber-200">
                      <span><b>{d.borrowerName}</b> ({d.loanNo})</span>
                      <span className="text-amber-900 font-bold">Naunang Bayad: {money(d.existingAmount)} ➔ Dagdag: {money(d.newAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Details */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 font-bold">Collector Route:</span>
                <b className="text-slate-900">{selectedCollector ? selectedCollector.name : 'Lahat ng Collectors'}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-bold">Petsa ng Koleksyon:</span>
                <b className="text-slate-900">{datef(collectionDate)}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-bold">Bilang ng Customer:</span>
                <b className="text-slate-900">{encodedCount} na Account</b>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                <span className="text-emerald-950 font-black">Kabuuang Halaga ng Koleksyon:</span>
                <b className="text-emerald-700 text-base font-black">{money(totalEncodedAmount)}</b>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer"
              >
                Bumalik / Baguhin
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmAndSaveBulkPayments}
                style={{
                  backgroundColor: '#059669',
                  backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff'
                }}
                className="flex-1 px-4 py-2.5 rounded-xl font-black text-xs text-white shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>{isSaving ? 'I-nise-save...' : '✓ I-post at I-save Lahat'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation / Success Modal */}
      {postedSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-emerald-400 overflow-hidden text-center p-6 space-y-4 animate-3d-modal">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                🎉 Bulk Collection Successfully Saved!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Na-update na ang lahat ng mga loan balance sa database.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1.5 text-left">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-bold">Collector:</span>
                <b className="text-slate-900 font-black">{postedSuccess.collectorName}</b>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-bold">Petsa ng Koleksyon:</span>
                <b className="text-slate-900">{datef(postedSuccess.date)}</b>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-bold">Mga Na-post na Account:</span>
                <b className="text-slate-900">{postedSuccess.count} na Kliyente</b>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-emerald-200">
                <span className="text-emerald-950 font-black">Kabuuang Na-remit:</span>
                <b className="text-emerald-800 text-base font-black">{money(postedSuccess.total)}</b>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  printCollectionSheet(db, postedSuccess.date, selectedCollectorId);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Print Remittance Slip</span>
              </button>

              <button
                type="button"
                onClick={() => setPostedSuccess(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-black shadow-md cursor-pointer"
              >
                ✓ Tapos Na / Isara
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
