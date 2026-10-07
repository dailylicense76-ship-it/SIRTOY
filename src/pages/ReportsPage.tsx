import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { printExecutiveSummaryReport } from '../utils/print';
import {
  today,
  addDays,
  money,
  datef,
  bname,
  cname,
  aname,
  outstanding,
  status,
  due,
  dateDiffDays,
  capitalAdded,
  loanReleasedTotal,
  principalCollectedTotal,
  interestCollectedTotal,
  expenseTotal,
  availableCapital,
  systemCashOnHand,
  netProfit,
  financialStatus,
  paymentInterest,
  exportLoansToCSV,
  exportPaymentsToCSV,
  exportBorrowersToCSV
} from '../utils/calculations';
import {
  Printer,
  Download,
  Upload,
  FileBarChart,
  Banknote,
  TrendingUp,
  ShieldCheck,
  FileSpreadsheet,
  AlertTriangle,
  Copy,
  Check,
  Phone,
  UserCheck,
  Clock
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { db, exportBackup, importBackup, showToast } = useApp();

  const [from, setFrom] = useState(addDays(today(), -30));
  const [to, setTo] = useState(today());
  const [type, setType] = useState<'collections' | 'loans' | 'aging' | 'finance' | 'borrowers'>('aging');
  const [collectorId, setCollectorId] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importBackup(reader.result as string);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleCopySMS = (borrowerName: string, loanNo: string, arrears: number, days: number, collectorName: string, areaName: string, id: string) => {
    const comp = db.settings.company || 'Lending Plus';
    const text = `Magandang araw ${borrowerName}, paalala mula sa ${comp}. Ang inyong hulog sa Loan #${loanNo} ay ${days} araw nang overdue na may halagang ${money(arrears)}. Mangyaring makipag-ugnayan sa inyong collector na si ${collectorName} (${areaName}) upang maiwasan ang karagdagang multa. Salamat!`;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Kinopya ang SMS Payment Reminder para kay ${borrowerName}!`);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const renderReportContent = () => {
    if (type === 'collections') {
      const rows = db.payments.filter(p => p.date >= from && p.date <= to && (!collectorId || p.collectorId === collectorId));
      const totalAmt = rows.reduce((s, p) => s + p.amount, 0);

      return (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900">Collection Summary ({datef(from)} – {datef(to)})</h3>
              <p className="text-xs text-slate-500">Lahat ng naitalang hulog at remitance sa napiling panahon.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportPaymentsToCSV(db)}
                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                <span>Export CSV</span>
              </button>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">Total: {money(totalAmt)}</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-extrabold text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Collector</th>
                  <th className="p-2.5">Area</th>
                  <th className="p-2.5">Loan</th>
                  <th className="p-2.5">Borrower</th>
                  <th className="p-2.5 text-right">Amount</th>
                  <th className="p-2.5">Method</th>
                  <th className="p-2.5">OR / Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {rows.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-2.5">{datef(p.date)}</td>
                    <td className="p-2.5">{cname(db.collectors.find(c => c.id === p.collectorId))}</td>
                    <td className="p-2.5">{aname(db.areas.find(a => a.id === p.areaId))}</td>
                    <td className="p-2.5 font-bold font-mono text-blue-700">{p.loanNo}</td>
                    <td className="p-2.5 font-bold">{p.borrowerName}</td>
                    <td className="p-2.5 text-right font-black text-emerald-700">{money(p.amount)}</td>
                    <td className="p-2.5">{p.method}</td>
                    <td className="p-2.5 font-mono text-slate-500">{p.reference || '—'}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 italic">No collections found in this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (type === 'loans') {
      const rows = db.loans.filter(l => l.date >= from && l.date <= to && (!collectorId || l.collectorId === collectorId));

      return (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900">Loan Portfolio Releases ({datef(from)} – {datef(to)})</h3>
              <p className="text-xs text-slate-500">Mga pautang na na-release sa napiling petsa.</p>
            </div>
            <button
              onClick={() => exportLoansToCSV(db)}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Loans CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-extrabold text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Loan</th>
                  <th className="p-2.5">Borrower</th>
                  <th className="p-2.5">Collector</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5 text-right">Principal</th>
                  <th className="p-2.5 text-right">Outstanding</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {rows.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold font-mono text-blue-700">{l.loanNo}</td>
                    <td className="p-2.5 font-bold">{bname(db.borrowers.find(b => b.id === l.borrowerId))}</td>
                    <td className="p-2.5">{cname(db.collectors.find(c => c.id === l.collectorId))}</td>
                    <td className="p-2.5">{datef(l.date)}</td>
                    <td className="p-2.5 text-right font-bold">{money(l.principal)}</td>
                    <td className="p-2.5 text-right font-black text-amber-700">{money(outstanding(l))}</td>
                    <td className="p-2.5 font-bold">{status(l)}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 italic">No loans found in this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // PAR (PORTFOLIO AT RISK) & AGING MATRIX WITH DELINQUENCY ACTION LIST
    if (type === 'aging') {
      const now = today();
      const activePortfolio = db.loans.filter(l => (l.approvalStatus || 'Approved') === 'Approved' && outstanding(l) > 0.01 && (!collectorId || l.collectorId === collectorId));
      const totalPortfolioBal = activePortfolio.reduce((s, l) => s + outstanding(l), 0);

      const buckets = [
        { key: 'CURRENT', name: 'Current (On-Time)', min: 0, max: 0, color: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900' },
        { key: 'MILD', name: '1–7 Araw (Mild / Notice 1)', min: 1, max: 7, color: 'amber', bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-900' },
        { key: 'MODERATE', name: '8–30 Araw (Moderate Risk)', min: 8, max: 30, color: 'orange', bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-950' },
        { key: 'HIGH', name: '31–60 Araw (High Risk / Demand)', min: 31, max: 60, color: 'rose', bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-950' },
        { key: 'DEFAULT', name: '60+ Araw (Default / Write-off)', min: 61, max: 99999, color: 'purple', bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-950' }
      ];

      // Flatten overdue loans with borrower and schedule context
      const delinquentLoans = activePortfolio.map(l => {
        const b = db.borrowers.find(x => x.id === l.borrowerId);
        const c = db.collectors.find(x => x.id === l.collectorId) || (b ? db.collectors.find(x => x.id === b.collectorId) : undefined);
        const a = b ? db.areas.find(x => x.id === b.areaId) : undefined;
        const pastDueSchedules = (l.schedule || []).filter(s => s.due < now && Number(s.remaining) > 0.01);
        const isPastDue = pastDueSchedules.length > 0;
        const oldestDue = isPastDue ? pastDueSchedules[0].due : (l.dueDate || now);
        const daysOver = isPastDue ? Math.max(0, dateDiffDays(oldestDue, now)) : 0;
        const arrears = pastDueSchedules.reduce((s, x) => s + Number(x.remaining), 0);

        let bucketKey = 'CURRENT';
        if (daysOver >= 61) bucketKey = 'DEFAULT';
        else if (daysOver >= 31) bucketKey = 'HIGH';
        else if (daysOver >= 8) bucketKey = 'MODERATE';
        else if (daysOver >= 1) bucketKey = 'MILD';

        return {
          loan: l,
          borrower: b,
          collector: c,
          area: a,
          daysOverdue: daysOver,
          arrears: arrears > 0 ? arrears : outstanding(l),
          balance: outstanding(l),
          bucketKey,
          isOverdue: isPastDue
        };
      });

      const bucketSummary = buckets.map(b => {
        const matches = delinquentLoans.filter(d => d.bucketKey === b.key);
        const bal = matches.reduce((s, x) => s + x.balance, 0);
        const percent = totalPortfolioBal > 0 ? (bal / totalPortfolioBal) * 100 : 0;
        return {
          ...b,
          count: matches.length,
          balance: bal,
          percent
        };
      });

      const onlyDelinquent = delinquentLoans.filter(d => d.isOverdue).sort((a, b) => b.daysOverdue - a.daysOverdue);

      return (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Portfolio at Risk (PAR) & Delinquency Aging Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Kabuuang Active Portfolio: <b>{money(totalPortfolioBal)}</b> ({activePortfolio.length} loans)
              </p>
            </div>
            <button
              onClick={() => exportLoansToCSV(db)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Aging List (CSV)</span>
            </button>
          </div>

          {/* 5 PAR Aging Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {bucketSummary.map(x => (
              <div key={x.key} className={`p-3 rounded-2xl border shadow-xs flex flex-col justify-between ${x.bg} ${x.border}`}>
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-wider block ${x.text}`}>
                    {x.name}
                  </span>
                  <b className="text-base sm:text-lg font-black text-slate-900 block mt-1">
                    {money(x.balance)}
                  </b>
                </div>
                <div className="mt-2 pt-1 border-t border-slate-200/60 flex justify-between items-center text-[10px] font-bold text-slate-600">
                  <span>{x.count} loans</span>
                  <span>{x.percent.toFixed(1)}% PAR</span>
                </div>
              </div>
            ))}
          </div>

          {/* Delinquency Action & Demand List */}
          <div className="pt-2 space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Mga Delinquent / Overdue Accounts na Kailangan ng Follow-up ({onlyDelinquent.length})</span>
              </h4>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-xs text-left min-w-[950px]">
                <thead className="bg-slate-50 text-slate-600 font-extrabold text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Customer & Area</th>
                    <th className="p-3">Loan # & Term</th>
                    <th className="p-3">Collector Route</th>
                    <th className="p-3 text-center">Overdue Days</th>
                    <th className="p-3 text-right">Missed Arrears</th>
                    <th className="p-3 text-right">Total Balance</th>
                    <th className="p-3">Co-Maker & Contact</th>
                    <th className="p-3 text-center">Action / SMS Reminder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {onlyDelinquent.map(d => {
                    const b = d.borrower;
                    const bNameStr = b ? bname(b) : 'Unknown';
                    const colNameStr = d.collector ? d.collector.name : 'Unassigned';
                    const areaNameStr = d.area ? d.area.name : 'Route';

                    return (
                      <tr key={d.loan.id} className="hover:bg-rose-50/40 transition-colors">
                        <td className="p-3">
                          <b className="text-slate-900 font-extrabold block text-xs">{bNameStr}</b>
                          <small className="text-slate-500 font-medium text-[10px]">
                            ID: {b?.idNo || b?.id || '—'} • Tel: {b?.contact || 'No phone'}
                          </small>
                        </td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-black text-[10px]">
                            {d.loan.loanNo}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">{d.loan.frequency}</span>
                        </td>
                        <td className="p-3">
                          <b className="text-slate-900">{colNameStr}</b>
                          <small className="text-slate-500 block text-[10px]">{areaNameStr}</small>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            d.daysOverdue >= 60
                              ? 'bg-purple-100 text-purple-900'
                              : d.daysOverdue >= 30
                              ? 'bg-rose-100 text-rose-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}>
                            {d.daysOverdue} araw
                          </span>
                        </td>
                        <td className="p-3 text-right font-black text-rose-700">
                          {money(d.arrears)}
                        </td>
                        <td className="p-3 text-right font-black text-slate-900">
                          {money(d.balance)}
                        </td>
                        <td className="p-3">
                          <div className="text-[11px] text-slate-800">
                            <b>{b?.comaker || 'Walang Co-Maker'}</b>
                          </div>
                          {b?.comakerContact && (
                            <small className="text-slate-500 text-[10px]">Tel: {b.comakerContact}</small>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleCopySMS(bNameStr, d.loan.loanNo, d.arrears, d.daysOverdue, colNameStr, areaNameStr, d.loan.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-[10px] shadow-xs flex items-center justify-center gap-1 mx-auto transition-all cursor-pointer"
                          >
                            {copiedId === d.loan.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span className="text-emerald-800">Kinopya!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-amber-700" />
                                <span>Kopyahin SMS</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!onlyDelinquent.length && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-emerald-700 italic font-bold">
                        🎉 Walang overdue accounts! Lahat ng customer ay on-time magbayad.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'finance') {
      const periodPayments = db.payments.filter(p => p.date >= from && p.date <= to);
      const periodExpenses = db.expenses.filter(x => x.approvalStatus === 'Approved' && x.date >= from && x.date <= to);
      const periodLoanReleases = db.loans.filter(l => (l.approvalStatus || 'Approved') === 'Approved' && !l.restructureFrom && l.date >= from && l.date <= to);

      const mCollections = periodPayments.reduce((s, p) => s + p.amount, 0);
      const mInterest = periodPayments.reduce((s, p) => s + paymentInterest(p, db), 0);
      const mPrincipal = Math.max(0, mCollections - mInterest);
      const mExpenses = periodExpenses.reduce((s, x) => s + x.amount, 0);
      const mReleases = periodLoanReleases.reduce((s, l) => s + l.principal, 0);
      const mNetProfit = mInterest - mExpenses;

      return (
        <div className="space-y-5">
          <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-200">All-Time Financial Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Capital Added</span>
              <b className="text-sm font-black text-slate-900">{money(capitalAdded(db))}</b>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Loan Releases</span>
              <b className="text-sm font-black text-slate-900">{money(loanReleasedTotal(db))}</b>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Principal Collected</span>
              <b className="text-sm font-black text-emerald-600">{money(principalCollectedTotal(db))}</b>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Interest Income</span>
              <b className="text-sm font-black text-indigo-600">{money(interestCollectedTotal(db))}</b>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Expenses</span>
              <b className="text-sm font-black text-red-600">{money(expenseTotal(db))}</b>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Available Cash</span>
              <b className="text-sm font-black text-slate-900">{money(availableCapital(db))}</b>
            </div>
          </div>

          <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-200 pt-2">Selected Period ({datef(from)} – {datef(to)})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Period Collections</span>
              <b className="text-sm font-black text-slate-900">{money(mCollections)}</b>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Period Releases</span>
              <b className="text-sm font-black text-slate-900">{money(mReleases)}</b>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Period Expenses</span>
              <b className="text-sm font-black text-red-600">{money(mExpenses)}</b>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Period Net Profit</span>
              <b className={`text-sm font-black ${mNetProfit < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{money(mNetProfit)}</b>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-black text-slate-900">Borrower Profiles & Master Ledger Summary</h3>
            <p className="text-xs text-slate-500">Kabuuang listahan ng mga registered borrowers at kanilang mga balanse.</p>
          </div>
          <button
            onClick={() => exportBorrowersToCSV(db)}
            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
            <span>Export Borrowers CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-extrabold text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-2.5">Borrower Name</th>
                <th className="p-2.5">Area</th>
                <th className="p-2.5">Collector</th>
                <th className="p-2.5 text-center">Total Loans</th>
                <th className="p-2.5 text-right">Total Borrowed</th>
                <th className="p-2.5 text-right">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
              {db.borrowers.map(b => {
                const bLoans = db.loans.filter(l => l.borrowerId === b.id);
                const outBal = bLoans.reduce((s, l) => s + outstanding(l), 0);
                const totalP = bLoans.reduce((s, l) => s + l.principal, 0);

                return (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold">{bname(b)}</td>
                    <td className="p-2.5">{aname(db.areas.find(a => a.id === b.areaId))}</td>
                    <td className="p-2.5">{cname(db.collectors.find(c => c.id === b.collectorId))}</td>
                    <td className="p-2.5 text-center">{bLoans.length}</td>
                    <td className="p-2.5 text-right">{money(totalP)}</td>
                    <td className="p-2.5 text-right font-black text-amber-600">{money(outBal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-16">
      {/* 3D Header Banner - Purple & Indigo Theme */}
      <div
        style={{
          backgroundColor: '#4c1d95',
          backgroundImage: 'linear-gradient(135deg, #312e81 0%, #6366f1 50%, #4c1d95 100%)',
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
            <FileBarChart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 style={{ color: '#ffffff' }} className="text-lg font-black leading-tight">
              Reports, PAR Aging & Excel Exporter
            </h2>
            <p style={{ color: '#e0e7ff' }} className="text-xs mt-0.5">
              Generate executive financial reports, portfolio aging, demand reminders, and download complete offline backups.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => printExecutiveSummaryReport(db)}
            style={{
              backgroundColor: '#059669',
              backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              borderColor: '#34d399'
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all border cursor-pointer"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Print Executive PDF</span>
          </button>
          <button
            onClick={exportBackup}
            style={{
              backgroundColor: '#d97706',
              backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              borderColor: '#fcd34d'
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all border cursor-pointer"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Backup JSON</span>
          </button>
          <label
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.3)'
            }}
            className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border hover:bg-white/25 text-xs font-bold transition-all shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Restore JSON</span>
            <input type="file" accept="application/json" onChange={handleRestoreFile} className="hidden" />
          </label>
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
              Total Loan Capital Released
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {money(loanReleasedTotal(db))}
            </div>
            <span style={{ color: '#dbeafe' }} className="text-[10px] font-semibold block mt-1">
              All-time cumulative releases
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
            backgroundColor: '#065f46',
            backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #064e3b 100%)',
            color: '#ffffff',
            borderColor: '#6ee7b7'
          }}
          className="p-5 rounded-3xl border shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all"
        >
          <div>
            <span style={{ color: '#d1fae5' }} className="text-[11px] font-black uppercase tracking-wider block">
              Gross Interest Income
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {money(interestCollectedTotal(db))}
            </div>
            <span style={{ color: '#d1fae5' }} className="text-[10px] font-semibold block mt-1">
              Earned profit from collections
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"
          >
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
        </div>

        <div
          style={{
            backgroundColor: netProfit(db) >= 0 ? '#065f46' : '#9f1239',
            backgroundImage:
              netProfit(db) >= 0
                ? 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)'
                : 'linear-gradient(135deg, #e11d48 0%, #9f1239 100%)',
            color: '#ffffff',
            borderColor: netProfit(db) >= 0 ? '#6ee7b7' : '#fda4af'
          }}
          className="p-5 rounded-3xl border shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all"
        >
          <div>
            <span style={{ color: '#ffffff', opacity: 0.85 }} className="text-[11px] font-black uppercase tracking-wider block">
              Net Profit Status
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {money(netProfit(db))}
            </div>
            <span style={{ color: '#ffffff', opacity: 0.9 }} className="text-[10px] font-semibold block mt-1">
              {financialStatus(db)} • Less {money(expenseTotal(db))} expenses
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"
          >
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} className="p-5 rounded-3xl border shadow-md space-y-4">
        {/* Filter Controls & Module Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <div>
            <label style={{ color: '#64748b' }} className="block text-[10px] font-extrabold uppercase mb-1">From Date</label>
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
            />
          </div>

          <div>
            <label style={{ color: '#64748b' }} className="block text-[10px] font-extrabold uppercase mb-1">To Date</label>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
            />
          </div>

          <div>
            <label style={{ color: '#64748b' }} className="block text-[10px] font-extrabold uppercase mb-1">Report Module</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="w-full px-3 py-1.5 border-2 border-indigo-400 focus:border-indigo-600 rounded-xl text-xs font-bold text-slate-900 bg-white"
            >
              <option value="aging">🚨 PAR (Portfolio at Risk) & Aging</option>
              <option value="collections">💵 Collection Summary</option>
              <option value="loans">📑 Loan Portfolio Releases</option>
              <option value="finance">📊 Cash Flow / Profitability</option>
              <option value="borrowers">👥 Borrower Ledger Directory</option>
            </select>
          </div>

          <div>
            <label style={{ color: '#64748b' }} className="block text-[10px] font-extrabold uppercase mb-1">Filter Collector</label>
            <select
              value={collectorId}
              onChange={e => setCollectorId(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
            >
              <option value="">All Collectors</option>
              {db.collectors.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2">{renderReportContent()}</div>
      </div>
    </div>
  );
};
