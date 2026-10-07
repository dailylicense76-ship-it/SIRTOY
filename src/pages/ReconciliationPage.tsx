import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { systemCashOnHand, money, datef, today, round2, num, cname, aname } from '../utils/calculations';
import { printReconciliationReport, printCollectorTurnoverVoucher } from '../utils/print';
import {
  ShieldCheck,
  Plus,
  Printer,
  Calculator,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  FileCheck2,
  RotateCcw
} from 'lucide-react';

export const ReconciliationPage: React.FC = () => {
  const { db, openModal, recordCashReconciliation, showToast, user } = useApp();

  const [activeTab, setActiveTab] = useState<'turnover' | 'drawer'>('turnover');

  // Daily Collector Settlement State
  const [settlementDate, setSettlementDate] = useState(today());
  const [selectedCollectorId, setSelectedCollectorId] = useState<string>(() => {
    return db.collectors[0]?.id || '';
  });
  const [settlementNotes, setSettlementNotes] = useState('');

  // Physical Denomination Counters
  const [denoms, setDenoms] = useState<Record<string, number>>({
    '1000': 0,
    '500': 0,
    '200': 0,
    '100': 0,
    '50': 0,
    '20': 0,
    'coins': 0
  });

  const selectedCollector = db.collectors.find(c => c.id === selectedCollectorId);
  const selectedArea = selectedCollector ? db.areas.find(a => a.id === selectedCollector.areaId) : undefined;

  // Compute collector collections for settlementDate
  const collectorPayments = useMemo(() => {
    return db.payments.filter(p => {
      if (p.date !== settlementDate) return false;
      if (!selectedCollectorId) return false;
      if (p.collectorId === selectedCollectorId) return true;
      const loan = db.loans.find(l => l.id === p.loanId);
      if (loan && loan.collectorId === selectedCollectorId) return true;
      const borrower = db.borrowers.find(b => b.id === p.borrowerId);
      if (borrower && borrower.collectorId === selectedCollectorId) return true;
      return false;
    });
  }, [db.payments, db.loans, db.borrowers, settlementDate, selectedCollectorId]);

  const physicalCashPayments = collectorPayments.filter(p => p.method === 'Cash' || !p.method);
  const digitalPayments = collectorPayments.filter(p => p.method !== 'Cash' && !!p.method);

  const totalGrossCollection = round2(collectorPayments.reduce((s, p) => s + num(p.amount), 0));
  const totalCashCollected = round2(physicalCashPayments.reduce((s, p) => s + num(p.amount), 0));
  const totalDigitalCollected = round2(digitalPayments.reduce((s, p) => s + num(p.amount), 0));

  // Compute collector expenses / gas allowance on settlementDate
  const collectorExpenses = useMemo(() => {
    return db.expenses.filter(x => {
      if (x.date !== settlementDate) return false;
      if (x.approvalStatus === 'Rejected') return false;
      const descLower = (x.description || '').toLowerCase();
      const colNameLower = selectedCollector ? selectedCollector.name.toLowerCase() : '';
      return colNameLower && descLower.includes(colNameLower);
    });
  }, [db.expenses, settlementDate, selectedCollector]);

  const totalFieldExpenses = round2(collectorExpenses.reduce((s, x) => s + num(x.amount), 0));

  // Compute collector field disbursements / loan releases on settlementDate
  const collectorReleases = useMemo(() => {
    return db.loans.filter(l => {
      if (l.date !== settlementDate) return false;
      if (l.approvalStatus === 'Rejected') return false;
      if (!selectedCollectorId) return false;
      const borrower = db.borrowers.find(b => b.id === l.borrowerId);
      return l.collectorId === selectedCollectorId || (borrower && borrower.collectorId === selectedCollectorId);
    });
  }, [db.loans, db.borrowers, settlementDate, selectedCollectorId]);

  const totalFieldReleases = round2(collectorReleases.reduce((s, l) => s + num(l.principal), 0));

  // Expected Net Physical Cash Handed Over to Cashier
  const expectedNetCash = Math.max(0, round2(totalCashCollected - totalFieldExpenses - totalFieldReleases));

  // Actual Physical Cash Counted
  const actualPhysicalCashCounted = round2(
    (denoms['1000'] || 0) * 1000 +
    (denoms['500'] || 0) * 500 +
    (denoms['200'] || 0) * 200 +
    (denoms['100'] || 0) * 100 +
    (denoms['50'] || 0) * 50 +
    (denoms['20'] || 0) * 20 +
    (denoms['coins'] || 0)
  );

  const variance = round2(actualPhysicalCashCounted - expectedNetCash);
  const isBalanced = Math.abs(variance) <= 0.01;
  const isShortage = variance < -0.01;
  const isOverage = variance > 0.01;

  const handleDenomChange = (key: string, val: string) => {
    const n = Math.max(0, parseInt(val, 10) || 0);
    setDenoms(prev => ({ ...prev, [key]: n }));
  };

  const handleClearDenoms = () => {
    setDenoms({
      '1000': 0,
      '500': 0,
      '200': 0,
      '100': 0,
      '50': 0,
      '20': 0,
      'coins': 0
    });
  };

  const handleSaveTurnOver = () => {
    if (!selectedCollector) {
      showToast('Pumili ng collector para sa turn-over.', 'warn');
      return;
    }

    const noteDetails = `[COLLECTOR REMITTANCE TURN-OVER] Collector: ${selectedCollector.name} | Gross: ${money(totalGrossCollection)} (Cash: ${money(totalCashCollected)}, E-Wallet: ${money(totalDigitalCollected)}) | Less Expenses: -${money(totalFieldExpenses)} | Less Releases: -${money(totalFieldReleases)} | Expected Cash: ${money(expectedNetCash)} | Actual Counted: ${money(actualPhysicalCashCounted)} | Status: ${isBalanced ? 'BALANCED' : isShortage ? `SHORTAGE (${money(variance)})` : `OVERAGE (+${money(variance)})`} ${settlementNotes ? `| Notes: ${settlementNotes}` : ''}`;

    recordCashReconciliation({
      date: settlementDate,
      actualCash: actualPhysicalCashCounted,
      notes: noteDetails
    });

    showToast(`✓ Matagumpay na naitala ang Daily Turn-over para kay ${selectedCollector.name}! (${isBalanced ? 'Balanced' : isShortage ? 'Shortage' : 'Overage'})`);
  };

  const sysCash = systemCashOnHand(db);
  const latestCount = db.cashReconciliations[0];
  const actualDrawerCash = latestCount ? latestCount.actualCash : null;
  const drawerVariance = latestCount ? latestCount.variance : null;

  return (
    <div className="space-y-4 pb-16">
      {/* 3D Header Banner */}
      <div
        style={{
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)',
          color: '#ffffff',
          borderColor: '#38bdf8'
        }}
        className="p-5 rounded-3xl border shadow-xl flex flex-wrap justify-between items-center gap-3"
      >
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
            className="w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner"
          >
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 style={{ color: '#ffffff' }} className="text-lg font-black leading-tight flex items-center gap-2">
              <span>Daily Remittance Settlement & Cash Audit</span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-400 text-cyan-950 text-[10px] font-black uppercase">
                Shortage / Overage Guard
              </span>
            </h2>
            <p style={{ color: '#bae6fd' }} className="text-xs mt-0.5">
              I-audit ang perang nai-turnover ng collector laban sa nakolekta, bawas gas/expenses, at actual physical bills count.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => printReconciliationReport(db)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.3)'
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs border hover:bg-white/25 transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Audit Report</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('turnover')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'turnover'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Daily Collector Turn-Over Settlement (Shortage / Overage)</span>
        </button>
        <button
          onClick={() => setActiveTab('drawer')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'drawer'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Banknote className="w-3.5 h-3.5" />
          <span>Main Vault & Drawer Cash History</span>
        </button>
      </div>

      {/* TAB 1: DAILY COLLECTOR REMITTANCE TURN-OVER SETTLEMENT */}
      {activeTab === 'turnover' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-wrap justify-between items-center gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span>Collector na Mag-te-turn-over *</span>
                </label>
                <select
                  value={selectedCollectorId}
                  onChange={e => setSelectedCollectorId(e.target.value)}
                  className="px-3 py-1.5 border-2 border-sky-400 focus:border-sky-600 rounded-xl text-xs font-black text-slate-900 bg-sky-50/20 focus:bg-white min-w-[200px]"
                >
                  {db.collectors.map(c => (
                    <option key={c.id} value={c.id}>
                      👤 {c.name} • {db.areas.find(a => a.id === c.areaId)?.name || 'General Route'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                  Turn-Over Date
                </label>
                <input
                  type="date"
                  value={settlementDate}
                  onChange={e => setSettlementDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white"
                />
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Assigned Route</span>
              <b className="text-xs text-slate-800 font-black">{selectedArea?.name || 'All Areas'}</b>
            </div>
          </div>

          {/* 4 Multi-Factor Audit Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Card 1: Gross Physical Cash Collected */}
            <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-300 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 block flex items-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" /> 1. Cash na Nakolekta
                </span>
                <b className="text-2xl font-black text-emerald-950 block mt-1.5">
                  {money(totalCashCollected)}
                </b>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 block mt-1">
                {physicalCashPayments.length} cash payments {totalDigitalCollected > 0 && `(+${money(totalDigitalCollected)} GCash)`}
              </span>
            </div>

            {/* Card 2: Less Field Expenses / Gasoline */}
            <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-900 block flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" /> 2. Bawas Field Expenses
                </span>
                <b className="text-2xl font-black text-rose-950 block mt-1.5">
                  -{money(totalFieldExpenses)}
                </b>
              </div>
              <span className="text-[10px] font-semibold text-rose-700 block mt-1">
                {collectorExpenses.length} approved gas / allowances
              </span>
            </div>

            {/* Card 3: Less Field Loan Releases */}
            <div className="p-4 rounded-3xl bg-amber-50 border border-amber-300 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" /> 3. Bawas Field Releases
                </span>
                <b className="text-2xl font-black text-amber-950 block mt-1.5">
                  -{money(totalFieldReleases)}
                </b>
              </div>
              <span className="text-[10px] font-semibold text-amber-700 block mt-1">
                {collectorReleases.length} pautang na ini-release sa field
              </span>
            </div>

            {/* Card 4: Expected Net Physical Cash */}
            <div className="p-4 rounded-3xl bg-slate-900 text-white border border-slate-700 shadow-md flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 block">
                  4. Expected Cash sa Vault
                </span>
                <b className="text-2xl font-black text-white block mt-1.5">
                  {money(expectedNetCash)}
                </b>
              </div>
              <span className="text-[10px] font-semibold text-slate-300 block mt-1">
                Dapat i-abot sa Cashier
              </span>
            </div>
          </div>

          {/* Interactive Physical Cash Breakdown & Settlement Calculator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT: Denomination Counter (7 of 12) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200 shadow-md space-y-3.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-sky-600" />
                  <h3 className="text-sm font-black text-slate-900">
                    Physical Cash Bill & Coin Breakdown Counter
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleClearDenoms}
                  className="text-[11px] font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>I-reset</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { key: '1000', label: '₱1,000 Bill', val: 1000 },
                  { key: '500', label: '₱500 Bill', val: 500 },
                  { key: '200', label: '₱200 Bill', val: 200 },
                  { key: '100', label: '₱100 Bill', val: 100 },
                  { key: '50', label: '₱50 Bill', val: 50 },
                  { key: '20', label: '₱20 Bill', val: 20 }
                ].map(denom => (
                  <div key={denom.key} className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[10px] font-black text-slate-600 uppercase block">{denom.label}</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={denoms[denom.key] || ''}
                        onChange={e => handleDenomChange(denom.key, e.target.value)}
                        placeholder="0 piraso"
                        className="w-full px-2 py-1 border border-slate-300 rounded-xl text-xs font-black text-slate-900 bg-white"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-sky-800 block text-right">
                      = {money((denoms[denom.key] || 0) * denom.val)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-slate-600 uppercase block">Barya / Loose Coins Total (₱)</span>
                  <small className="text-[10px] text-slate-400">₱20, ₱10, ₱5, ₱1 coins</small>
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={denoms['coins'] || ''}
                    onChange={e => handleDenomChange('coins', e.target.value)}
                    placeholder="₱0.00"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-black text-right text-slate-900 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT: Settlement Verdict & 1-Click Save (5 of 12) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-md flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-black text-slate-900">
                    Turn-Over Audit Verdict
                  </h3>
                </div>

                {/* Actual vs Expected Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-bold">Collector:</span>
                    <b className="text-slate-900 font-black">{selectedCollector ? selectedCollector.name : 'Pumili'}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-bold">Expected Cash:</span>
                    <b className="text-slate-900 font-black">{money(expectedNetCash)}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-bold">Actual Counted Cash:</span>
                    <b className="text-emerald-700 font-black text-sm">{money(actualPhysicalCashCounted)}</b>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                    <span className="font-black text-slate-800">Variance:</span>
                    <b className={`font-black text-base ${isBalanced ? 'text-emerald-600' : isShortage ? 'text-rose-600' : 'text-blue-600'}`}>
                      {variance > 0 ? `+${money(variance)}` : money(variance)}
                    </b>
                  </div>
                </div>

                {/* Status Badge Notification */}
                <div className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
                  isBalanced
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : isShortage
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : 'bg-blue-50 border-blue-300 text-blue-950'
                }`}>
                  {isBalanced ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-none" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-none" />
                  )}
                  <div>
                    <b className="text-xs font-black block">
                      {isBalanced ? '✓ 100% Exact & Balanced' : isShortage ? '⚠️ Cash Shortage Detected' : 'ℹ️ Cash Overage Detected'}
                    </b>
                    <span className="text-[11px] font-semibold opacity-90">
                      {isBalanced
                        ? 'Eksakto ang perang nai-turnover sa vault.'
                        : isShortage
                        ? `Kulang ng ${money(Math.abs(variance))} ang perang ini-abot ng collector.`
                        : `Sobra ng ${money(variance)} ang perang ini-abot ng collector.`}
                    </span>
                  </div>
                </div>

                {/* Remarks / Settlement Notes */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                    Audit Notes / Lagda ng Cashier & Collector
                  </label>
                  <input
                    type="text"
                    value={settlementNotes}
                    onChange={e => setSettlementNotes(e.target.value)}
                    placeholder="hal. Na-verify ni Cashier Anna, pirmado ng collector..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedCollector) {
                      showToast('Pumili ng collector bago mag-print.', 'warn');
                      return;
                    }
                    printCollectorTurnoverVoucher({
                      db,
                      collector: selectedCollector,
                      date: settlementDate,
                      totalGross: totalGrossCollection,
                      totalCash: totalCashCollected,
                      totalDigital: totalDigitalCollected,
                      totalExpenses: totalFieldExpenses,
                      totalReleases: totalFieldReleases,
                      expectedCash: expectedNetCash,
                      actualCash: actualPhysicalCashCounted,
                      variance,
                      denoms,
                      notes: settlementNotes
                    });
                  }}
                  className="px-4 py-3 rounded-2xl font-black text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-700" />
                  <span>Print Turn-Over Voucher</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveTurnOver}
                  style={{
                    backgroundColor: isShortage ? '#e11d48' : '#059669',
                    backgroundImage: isShortage
                      ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff'
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>✓ I-SAVE ANG SETTLEMENT ({money(actualPhysicalCashCounted)})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MAIN VAULT & DRAWER AUDIT HISTORY */}
      {activeTab === 'drawer' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              style={{
                backgroundColor: sysCash < 0 ? '#9f1239' : '#1e40af',
                backgroundImage: sysCash < 0 ? 'linear-gradient(135deg, #e11d48 0%, #9f1239 100%)' : 'linear-gradient(135deg, #2563eb 0%, #1e40af 60%, #1e1b4b 100%)',
                color: '#ffffff',
                borderColor: sysCash < 0 ? '#fda4af' : '#60a5fa'
              }}
              className="p-5 rounded-3xl border shadow-xl flex items-center justify-between"
            >
              <div>
                <span style={{ color: '#dbeafe' }} className="text-[11px] font-black uppercase tracking-wider block">
                  System Calculated Cash
                </span>
                <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
                  {money(sysCash)}
                </div>
                <span style={{ color: '#dbeafe' }} className="text-[10px] font-semibold block mt-1">
                  Expected drawer balance
                </span>
              </div>
              <div
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
                className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner"
              >
                <Banknote className="w-7 h-7 text-white" />
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#065f46',
                backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #064e3b 100%)',
                color: '#ffffff',
                borderColor: '#6ee7b7'
              }}
              className="p-5 rounded-3xl border shadow-xl flex items-center justify-between"
            >
              <div>
                <span style={{ color: '#d1fae5' }} className="text-[11px] font-black uppercase tracking-wider block">
                  Actual Physical Count
                </span>
                <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
                  {actualDrawerCash !== null ? money(actualDrawerCash) : 'Not Counted'}
                </div>
                <span style={{ color: '#d1fae5' }} className="text-[10px] font-semibold block mt-1">
                  Latest counted bills & coins
                </span>
              </div>
              <div
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
                className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner"
              >
                <Calculator className="w-7 h-7 text-white" />
              </div>
            </div>

            <div
              style={{
                backgroundColor: drawerVariance !== null && Math.abs(drawerVariance) > 0.01 ? (drawerVariance < 0 ? '#9f1239' : '#1e40af') : '#065f46',
                backgroundImage:
                  drawerVariance !== null && Math.abs(drawerVariance) > 0.01
                    ? drawerVariance < 0
                      ? 'linear-gradient(135deg, #e11d48 0%, #9f1239 100%)'
                      : 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)',
                color: '#ffffff',
                borderColor: '#6ee7b7'
              }}
              className="p-5 rounded-3xl border shadow-xl flex items-center justify-between"
            >
              <div>
                <span style={{ color: '#ffffff', opacity: 0.85 }} className="text-[11px] font-black uppercase tracking-wider block">
                  Drawer Cash Variance
                </span>
                <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
                  {drawerVariance !== null ? money(drawerVariance) : 'Not Counted'}
                </div>
                <span style={{ color: '#ffffff', opacity: 0.9 }} className="text-[10px] font-semibold block mt-1">
                  {drawerVariance === null
                    ? 'No audit recorded yet'
                    : Math.abs(drawerVariance) <= 0.01
                    ? '✓ Drawer 100% Balanced'
                    : drawerVariance < 0
                    ? '⚠️ Cash Shortage'
                    : '⚠️ Cash Overage'}
                </span>
              </div>
              <div
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
                className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner"
              >
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          {/* Reconciliation History Table */}
          <div style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} className="p-5 rounded-3xl border shadow-md space-y-3">
            <h3 style={{ color: '#0f172a' }} className="text-sm font-black">Cash Count & Reconciliation History</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead style={{ backgroundColor: '#f1f5f9', color: '#475569' }} className="font-black text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">System Expected</th>
                    <th className="p-3 text-right">Actual Count</th>
                    <th className="p-3 text-right">Variance</th>
                    <th className="p-3">Audit Notes / Breakdown</th>
                    <th className="p-3">Counted By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold" style={{ color: '#1e293b' }}>
                  {db.cashReconciliations.slice(0, 100).map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-3">{datef(r.date)}</td>
                      <td className="p-3 text-right font-bold" style={{ color: '#0f172a' }}>{money(r.systemCash)}</td>
                      <td className="p-3 text-right font-black" style={{ color: '#059669' }}>{money(r.actualCash)}</td>
                      <td
                        className="p-3 text-right font-black"
                        style={{ color: Math.abs(r.variance) > 0.01 ? (r.variance < 0 ? '#dc2626' : '#2563eb') : '#059669' }}
                      >
                        {money(r.variance)}
                      </td>
                      <td className="p-3" style={{ color: '#334155' }}>{r.notes || '—'}</td>
                      <td className="p-3 font-bold">{r.user}</td>
                    </tr>
                  ))}
                  {!db.cashReconciliations.length && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 italic">No cash counts recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
