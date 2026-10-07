import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  today,
  money,
  performancePeriodBounds,
  collectorPerformanceRow,
  round2,
  datef,
  aname
} from '../utils/calculations';
import { printCollectorPerformanceReport } from '../utils/print';
import {
  Printer,
  TrendingUp,
  HandCoins,
  Calendar,
  BarChart3,
  Award,
  DollarSign,
  Banknote,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2
} from 'lucide-react';

export const CollectorPerformancePage: React.FC = () => {
  const { db } = useApp();

  const [period, setPeriod] = useState<string>('Monthly');
  const [asOfDate, setAsOfDate] = useState<string>(today());
  const [selectedCollectorId, setSelectedCollectorId] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'overview' | 'monthly' | 'yearly'>('overview');

  const bounds = performancePeriodBounds(period, asOfDate);

  // Time horizons based on asOfDate
  const currentYear = asOfDate.slice(0, 4);
  const currentMonth = asOfDate.slice(0, 7);

  // Rows for the selected period
  const rows = useMemo(() => {
    return db.collectors
      .map(c => collectorPerformanceRow(c, period, bounds.from, bounds.to, db))
      .filter(x => selectedCollectorId === 'ALL' || x.c.id === selectedCollectorId);
  }, [db, period, bounds, selectedCollectorId]);

  // Multi-horizon COLLECTIONS for the selected collector / all collectors
  const {
    todayCollected,
    monthCollected,
    yearCollected,
    allTimeCollected,
    todayTxCount,
    monthTxCount,
    yearTxCount,
    allTimeTxCount
  } = useMemo(() => {
    let tSum = 0, mSum = 0, ySum = 0, aSum = 0;
    let tCnt = 0, mCnt = 0, yCnt = 0, aCnt = 0;

    for (const p of db.payments) {
      if (selectedCollectorId !== 'ALL' && p.collectorId !== selectedCollectorId) {
        continue;
      }
      const amt = Number(p.amount) || 0;
      aSum += amt;
      aCnt++;

      if (p.date === asOfDate) {
        tSum += amt;
        tCnt++;
      }
      if (p.date && p.date.startsWith(currentMonth)) {
        mSum += amt;
        mCnt++;
      }
      if (p.date && p.date.startsWith(currentYear)) {
        ySum += amt;
        yCnt++;
      }
    }

    return {
      todayCollected: round2(tSum),
      monthCollected: round2(mSum),
      yearCollected: round2(ySum),
      allTimeCollected: round2(aSum),
      todayTxCount: tCnt,
      monthTxCount: mCnt,
      yearTxCount: yCnt,
      allTimeTxCount: aCnt
    };
  }, [db.payments, selectedCollectorId, asOfDate, currentMonth, currentYear]);

  // Multi-horizon LOAN RELEASES for the selected collector / all collectors
  const {
    todayRelease,
    monthRelease,
    yearRelease,
    allTimeRelease,
    todayReleaseCount,
    monthReleaseCount,
    yearReleaseCount,
    allTimeReleaseCount
  } = useMemo(() => {
    let tRel = 0, mRel = 0, yRel = 0, aRel = 0;
    let tCnt = 0, mCnt = 0, yCnt = 0, aCnt = 0;

    for (const l of db.loans) {
      if (l.approvalStatus === 'Rejected' || l.status === 'Rejected') continue;

      if (selectedCollectorId !== 'ALL') {
        const borrower = db.borrowers.find(b => b.id === l.borrowerId);
        const matchCollector = l.collectorId === selectedCollectorId || (borrower && borrower.collectorId === selectedCollectorId);
        if (!matchCollector) continue;
      }

      const pAmt = Number(l.principal) || 0;
      aRel += pAmt;
      aCnt++;

      if (l.date === asOfDate) {
        tRel += pAmt;
        tCnt++;
      }
      if (l.date && l.date.startsWith(currentMonth)) {
        mRel += pAmt;
        mCnt++;
      }
      if (l.date && l.date.startsWith(currentYear)) {
        yRel += pAmt;
        yCnt++;
      }
    }

    return {
      todayRelease: round2(tRel),
      monthRelease: round2(mRel),
      yearRelease: round2(yRel),
      allTimeRelease: round2(aRel),
      todayReleaseCount: tCnt,
      monthReleaseCount: mCnt,
      yearReleaseCount: yCnt,
      allTimeReleaseCount: aCnt
    };
  }, [db.loans, db.borrowers, selectedCollectorId, asOfDate, currentMonth, currentYear]);

  // Monthly Breakdown Data for the selected year (Jan - Dec)
  const monthlyBreakdown = useMemo(() => {
    const months = [
      { num: '01', name: 'Enero' },
      { num: '02', name: 'Pebrero' },
      { num: '03', name: 'Marso' },
      { num: '04', name: 'Abril' },
      { num: '05', name: 'Mayo' },
      { num: '06', name: 'Hunyo' },
      { num: '07', name: 'Hulyo' },
      { num: '08', name: 'Agosto' },
      { num: '09', name: 'Setyembre' },
      { num: '10', name: 'Oktubre' },
      { num: '11', name: 'Nobyembre' },
      { num: '12', name: 'Disyembre' }
    ];

    const maxMonth = Math.max(1, ...months.map(m => {
      const ym = `${currentYear}-${m.num}`;
      return db.payments
        .filter(p => (selectedCollectorId === 'ALL' || p.collectorId === selectedCollectorId) && p.date.startsWith(ym))
        .reduce((s, p) => s + p.amount, 0);
    }));

    return months.map(m => {
      const ym = `${currentYear}-${m.num}`;
      const payments = db.payments.filter(
        p => (selectedCollectorId === 'ALL' || p.collectorId === selectedCollectorId) && p.date.startsWith(ym)
      );
      const totalAmt = round2(payments.reduce((s, p) => s + p.amount, 0));
      const percentageOfMax = Math.round((totalAmt / maxMonth) * 100);

      // Monthly release
      const releases = db.loans.filter(l => {
        if (l.approvalStatus === 'Rejected' || l.status === 'Rejected') return false;
        if (selectedCollectorId !== 'ALL') {
          const borrower = db.borrowers.find(b => b.id === l.borrowerId);
          if (l.collectorId !== selectedCollectorId && borrower?.collectorId !== selectedCollectorId) return false;
        }
        return l.date && l.date.startsWith(ym);
      });
      const totalReleaseAmt = round2(releases.reduce((s, l) => s + (l.principal || 0), 0));

      return {
        key: ym,
        monthName: m.name,
        total: totalAmt,
        count: payments.length,
        barPercent: percentageOfMax,
        isCurrent: ym === currentMonth,
        releaseTotal: totalReleaseAmt,
        releaseCount: releases.length
      };
    });
  }, [db.payments, db.loans, db.borrowers, selectedCollectorId, currentYear, currentMonth]);

  // Yearly Breakdown Data
  const yearlyBreakdown = useMemo(() => {
    const yearSet = new Set<string>();
    yearSet.add(currentYear);
    for (const p of db.payments) {
      if (p.date && p.date.length >= 4) {
        yearSet.add(p.date.slice(0, 4));
      }
    }
    for (const l of db.loans) {
      if (l.date && l.date.length >= 4) {
        yearSet.add(l.date.slice(0, 4));
      }
    }
    const sortedYears = Array.from(yearSet).sort().reverse();

    return sortedYears.map(yr => {
      const payments = db.payments.filter(
        p => (selectedCollectorId === 'ALL' || p.collectorId === selectedCollectorId) && p.date.startsWith(yr)
      );
      const totalAmt = round2(payments.reduce((s, p) => s + p.amount, 0));

      const releases = db.loans.filter(l => {
        if (l.approvalStatus === 'Rejected' || l.status === 'Rejected') return false;
        if (selectedCollectorId !== 'ALL') {
          const borrower = db.borrowers.find(b => b.id === l.borrowerId);
          if (l.collectorId !== selectedCollectorId && borrower?.collectorId !== selectedCollectorId) return false;
        }
        return l.date && l.date.startsWith(yr);
      });
      const totalRel = round2(releases.reduce((s, l) => s + (l.principal || 0), 0));

      return {
        year: yr,
        total: totalAmt,
        count: payments.length,
        isCurrent: yr === currentYear,
        releaseTotal: totalRel,
        releaseCount: releases.length
      };
    });
  }, [db.payments, db.loans, db.borrowers, selectedCollectorId, currentYear]);

  return (
    <div className="space-y-5 pb-16">
      {/* 3D Header Banner - Royal Blue Theme */}
      <div
        style={{
          backgroundColor: '#1e3a8a',
          backgroundImage: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1e40af 100%)',
          color: '#ffffff',
          borderColor: '#60a5fa'
        }}
        className="p-5 rounded-3xl border shadow-xl flex flex-wrap justify-between items-center gap-3"
      >
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
            className="w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner"
          >
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 style={{ color: '#ffffff' }} className="text-lg font-black leading-tight flex items-center gap-2">
              <span>Collector Performance & Historical Analytics</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-400 text-blue-950 text-[10px] font-black uppercase">
                Araw • Buwan • Taon
              </span>
            </h2>
            <p style={{ color: '#dbeafe' }} className="text-xs mt-0.5">
              Tingnan ang real-time today collection, buwanang koleksyon (MTD), taunang koleksyon (YTD), at loan releases (pautang na na-release).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div>
            <label style={{ color: '#dbeafe' }} className="block text-[10px] font-extrabold uppercase mb-0.5">Period</label>
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
            >
              <option value="Daily">Daily (Araw-araw)</option>
              <option value="Weekly">Weekly (Lingguhan)</option>
              <option value="Semi-monthly">Semi-monthly (Kinsenas)</option>
              <option value="Monthly">Monthly (Kada Buwan)</option>
              <option value="Yearly">Yearly (Kada Taon)</option>
              <option value="All-Time">All-Time Overall (Lahat)</option>
            </select>
          </div>

          <div>
            <label style={{ color: '#dbeafe' }} className="block text-[10px] font-extrabold uppercase mb-0.5">As of Date</label>
            <input
              type="date"
              value={asOfDate}
              onChange={e => setAsOfDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
            />
          </div>

          <div>
            <label style={{ color: '#dbeafe' }} className="block text-[10px] font-extrabold uppercase mb-0.5">Collector</label>
            <select
              value={selectedCollectorId}
              onChange={e => setSelectedCollectorId(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white min-w-[160px]"
            >
              <option value="ALL">🌐 Lahat ng Collectors</option>
              {db.collectors.map(c => (
                <option key={c.id} value={c.id}>
                  👤 {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => printCollectorPerformanceReport(db, period, asOfDate, selectedCollectorId)}
            style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.3)'
            }}
            className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-md border hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: 💰 MULTI-HORIZON COLLECTION METRIC CARDS */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
          <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            <span>Koleksyon ng Collector (Inflows / Payments Collected)</span>
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Horizon 1: TODAY'S COLLECTION */}
          <div
            style={{
              backgroundColor: '#047857',
              backgroundImage: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              borderColor: '#6ee7b7'
            }}
            className="p-4 rounded-3xl border shadow-lg flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <span style={{ color: '#d1fae5' }} className="text-[10px] font-black uppercase tracking-wider block">
                Today Collection
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-800/60 text-white text-[9px] font-bold">
                {datef(asOfDate)}
              </span>
            </div>
            <b style={{ color: '#ffffff' }} className="text-2xl sm:text-3xl font-black mt-2 block">
              {money(todayCollected)}
            </b>
            <span style={{ color: '#d1fae5' }} className="text-[10px] font-semibold block mt-1">
              {todayTxCount} transaksyon na naitala ngayon
            </span>
          </div>

          {/* Horizon 2: THIS MONTH'S COLLECTION */}
          <div
            style={{
              backgroundColor: '#1e40af',
              backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
              color: '#ffffff',
              borderColor: '#93c5fd'
            }}
            className="p-4 rounded-3xl border shadow-lg flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <span style={{ color: '#bfdbfe' }} className="text-[10px] font-black uppercase tracking-wider block">
                Monthly Collection
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-900/60 text-white text-[9px] font-bold">
                MTD ({currentMonth})
              </span>
            </div>
            <b style={{ color: '#ffffff' }} className="text-2xl sm:text-3xl font-black mt-2 block">
              {money(monthCollected)}
            </b>
            <span style={{ color: '#dbeafe' }} className="text-[10px] font-semibold block mt-1">
              {monthTxCount} transaksyon sa buwang ito
            </span>
          </div>

          {/* Horizon 3: THIS YEAR'S COLLECTION */}
          <div
            style={{
              backgroundColor: '#b45309',
              backgroundImage: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              color: '#ffffff',
              borderColor: '#fde68a'
            }}
            className="p-4 rounded-3xl border shadow-lg flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <span style={{ color: '#fef3c7' }} className="text-[10px] font-black uppercase tracking-wider block">
                Yearly Collection
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-900/60 text-white text-[9px] font-bold">
                YTD ({currentYear})
              </span>
            </div>
            <b style={{ color: '#ffffff' }} className="text-2xl sm:text-3xl font-black mt-2 block">
              {money(yearCollected)}
            </b>
            <span style={{ color: '#fef3c7' }} className="text-[10px] font-semibold block mt-1">
              {yearTxCount} resibo ngayong {currentYear}
            </span>
          </div>

          {/* Horizon 4: ALL-TIME OVERALL COLLECTION */}
          <div
            style={{
              backgroundColor: '#4c1d95',
              backgroundImage: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)',
              color: '#ffffff',
              borderColor: '#c4b5fd'
            }}
            className="p-4 rounded-3xl border shadow-lg flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <span style={{ color: '#ede9fe' }} className="text-[10px] font-black uppercase tracking-wider block">
                Total Collection
              </span>
              <span className="px-2 py-0.5 rounded-full bg-purple-900/60 text-white text-[9px] font-bold">
                All-Time
              </span>
            </div>
            <b style={{ color: '#ffffff' }} className="text-2xl sm:text-3xl font-black mt-2 block">
              {money(allTimeCollected)}
            </b>
            <span style={{ color: '#ede9fe' }} className="text-[10px] font-semibold block mt-1">
              {allTimeTxCount} kabuuang naipong koleksyon
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: 💸 MULTI-HORIZON LOAN RELEASES METRIC CARDS (Requested Feature) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
          <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
            <span>Pautang na Na-Release ng Collector (Outflows / Loan Disbursements)</span>
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {/* Release 1: TODAY LOAN RELEASE */}
          <div
            style={{
              backgroundColor: '#0f766e',
              backgroundImage: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
              color: '#ffffff',
              borderColor: '#99f6e4'
            }}
            className="p-4 rounded-3xl border shadow-lg flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <span style={{ color: '#ccfbf1' }} className="text-[10px] font-black uppercase tracking-wider block flex items-center gap-1">
                <HandCoins className="w-3 h-3" /> Today Release
              </span>
              <span className="px-2 py-0.5 rounded-full bg-teal-900/60 text-white text-[9px] font-bold">
                {datef(asOfDate)}
              </span>
            </div>
            <b style={{ color: '#ffffff' }} className="text-2xl sm:text-3xl font-black mt-2 block">
              {money(todayRelease)}
            </b>
            <span style={{ color: '#ccfbf1' }} className="text-[10px] font-semibold block mt-1">
              {todayReleaseCount} pautang na na-release ngayon
            </span>
          </div>

          {/* Release 2: MONTHLY LOAN RELEASE */}
          <div
            style={{
              backgroundColor: '#0369a1',
              backgroundImage: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              borderColor: '#7dd3fc'
            }}
            className="p-4 rounded-3xl border shadow-lg flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <span style={{ color: '#e0f2fe' }} className="text-[10px] font-black uppercase tracking-wider block flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Monthly Release
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-900/60 text-white text-[9px] font-bold">
                MTD ({currentMonth})
              </span>
            </div>
            <b style={{ color: '#ffffff' }} className="text-2xl sm:text-3xl font-black mt-2 block">
              {money(monthRelease)}
            </b>
            <span style={{ color: '#e0f2fe' }} className="text-[10px] font-semibold block mt-1">
              {monthReleaseCount} pautang na naipamahagi ngayong buwan
            </span>
          </div>

          {/* Release 3: YEARLY LOAN RELEASE */}
          <div
            style={{
              backgroundColor: '#c2410c',
              backgroundImage: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
              color: '#ffffff',
              borderColor: '#fed7aa'
            }}
            className="p-4 rounded-3xl border shadow-lg flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <span style={{ color: '#ffedd5' }} className="text-[10px] font-black uppercase tracking-wider block flex items-center gap-1">
                <BarChart3 className="w-3 h-3" /> Yearly Release
              </span>
              <span className="px-2 py-0.5 rounded-full bg-orange-950/60 text-white text-[9px] font-bold">
                YTD ({currentYear})
              </span>
            </div>
            <b style={{ color: '#ffffff' }} className="text-2xl sm:text-3xl font-black mt-2 block">
              {money(yearRelease)}
            </b>
            <span style={{ color: '#ffedd5' }} className="text-[10px] font-semibold block mt-1">
              {yearReleaseCount} pautang naipamahagi ngayong {currentYear}
            </span>
          </div>

          {/* Release 4: TOTAL / ALL-TIME LOAN RELEASE */}
          <div
            style={{
              backgroundColor: '#334155',
              backgroundImage: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
              color: '#ffffff',
              borderColor: '#cbd5e1'
            }}
            className="p-4 rounded-3xl border shadow-lg flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <span style={{ color: '#e2e8f0' }} className="text-[10px] font-black uppercase tracking-wider block flex items-center gap-1">
                <Banknote className="w-3 h-3" /> Total Release
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-900/70 text-white text-[9px] font-bold">
                All-Time
              </span>
            </div>
            <b style={{ color: '#ffffff' }} className="text-2xl sm:text-3xl font-black mt-2 block">
              {money(allTimeRelease)}
            </b>
            <span style={{ color: '#cbd5e1' }} className="text-[10px] font-semibold block mt-1">
              {allTimeReleaseCount} kabuuang pautang na na-release
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Views */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Collector Quota & Performance List</span>
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'monthly'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Buwanang Kasaysayan ({currentYear} Jan - Dec)</span>
        </button>
        <button
          onClick={() => setActiveTab('yearly')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'yearly'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Taunang Kasaysayan (Annual History)</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW COLLECTOR PERFORMANCE TABLE */}
      {activeTab === 'overview' && (
        <div style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} className="p-5 rounded-3xl border shadow-md space-y-3">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Collector Matrix: Koleksyon at Pautang (Releases)
              </h3>
              <p className="text-xs text-slate-500">
                Detalyadong ulat ng koleksyon at na-release na pautang kada collector para sa Araw, Buwan, at Kabuuan.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
              Saklaw ng Period: <b>{datef(bounds.from)} – {datef(bounds.to)}</b> ({period})
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-xs text-left min-w-[1100px]">
              <thead style={{ backgroundColor: '#f1f5f9', color: '#475569' }} className="font-black text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Collector</th>
                  <th className="p-3 text-center">Clients</th>
                  <th className="p-3 text-right bg-emerald-50/50">Today Collection</th>
                  <th className="p-3 text-right bg-teal-50/50">Today Release</th>
                  <th className="p-3 text-right bg-blue-50/50">Month Collection</th>
                  <th className="p-3 text-right bg-sky-50/50">Month Release</th>
                  <th className="p-3 text-right bg-purple-50/50">Total Collection</th>
                  <th className="p-3 text-right bg-slate-100">Total Release</th>
                  <th className="p-3 text-right">{period} Quota</th>
                  <th className="p-3 text-right">Achievement %</th>
                  <th className="p-3 text-center">Active / Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold" style={{ color: '#1e293b' }}>
                {rows.map(x => {
                  const cToday = db.payments.filter(p => p.collectorId === x.c.id && p.date === asOfDate).reduce((s, p) => s + p.amount, 0);
                  const cMonth = db.payments.filter(p => p.collectorId === x.c.id && p.date.startsWith(currentMonth)).reduce((s, p) => s + p.amount, 0);
                  const cOverall = db.payments.filter(p => p.collectorId === x.c.id).reduce((s, p) => s + p.amount, 0);

                  // Releases for this collector
                  const cLoans = db.loans.filter(l => {
                    if (l.approvalStatus === 'Rejected' || l.status === 'Rejected') return false;
                    const borrower = db.borrowers.find(b => b.id === l.borrowerId);
                    return l.collectorId === x.c.id || borrower?.collectorId === x.c.id;
                  });
                  const cRelToday = cLoans.filter(l => l.date === asOfDate).reduce((s, l) => s + (l.principal || 0), 0);
                  const cRelMonth = cLoans.filter(l => l.date && l.date.startsWith(currentMonth)).reduce((s, l) => s + (l.principal || 0), 0);
                  const cRelOverall = cLoans.reduce((s, l) => s + (l.principal || 0), 0);

                  return (
                    <tr key={x.c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <b style={{ color: '#0f172a' }} className="font-extrabold block text-sm">{x.c.name}</b>
                        <small style={{ color: '#64748b' }} className="font-medium text-[10px]">{aname(db.areas.find(a => a.id === x.c.areaId))}</small>
                      </td>
                      <td className="p-3 text-center font-bold">{x.clients}</td>
                      <td className="p-3 text-right font-black text-emerald-800 bg-emerald-50/20">{money(cToday)}</td>
                      <td className="p-3 text-right font-black text-teal-800 bg-teal-50/20">{money(cRelToday)}</td>
                      <td className="p-3 text-right font-black text-blue-900 bg-blue-50/20">{money(cMonth)}</td>
                      <td className="p-3 text-right font-black text-sky-900 bg-sky-50/20">{money(cRelMonth)}</td>
                      <td className="p-3 text-right font-black text-purple-900 bg-purple-50/20">{money(cOverall)}</td>
                      <td className="p-3 text-right font-black text-slate-800 bg-slate-50">{money(cRelOverall)}</td>
                      <td className="p-3 text-right font-black" style={{ color: '#0f172a' }}>{money(x.quota)}</td>
                      <td className="p-3 text-right">
                        <span
                          style={{
                            backgroundColor: x.achievement >= 100 ? '#d1fae5' : x.achievement > 0 ? '#dbeafe' : '#f1f5f9',
                            color: x.achievement >= 100 ? '#065f46' : x.achievement > 0 ? '#1e40af' : '#64748b'
                          }}
                          className="inline-block px-2.5 py-0.5 rounded-lg font-black text-[11px]"
                        >
                          {x.achievement.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-blue-700 font-bold">{x.active}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-rose-700 font-bold">{x.overdue}</span>
                      </td>
                    </tr>
                  );
                })}
                {!rows.length && (
                  <tr>
                    <td colSpan={11} className="p-6 text-center text-slate-400 italic">Walang collector data para sa napiling filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY HISTORICAL SUMMARY (JANUARY - DECEMBER) */}
      {activeTab === 'monthly' && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Buwanang Koleksyon at Releases para sa Taong {currentYear}
              </h3>
              <p className="text-xs text-slate-500">
                Paghahambing ng Koleksyon at Pautang (Releases) kada buwan para kay: <b>{selectedCollectorId === 'ALL' ? 'Lahat ng Collectors' : db.collectors.find(c => c.id === selectedCollectorId)?.name}</b>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-black text-amber-900 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                Koleksyon sa {currentYear}: {money(yearCollected)}
              </span>
              <span className="font-black text-teal-900 bg-teal-50 px-3 py-1 rounded-xl border border-teal-200">
                Na-release sa {currentYear}: {money(yearRelease)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {monthlyBreakdown.map(m => (
              <div
                key={m.key}
                className={`p-3.5 rounded-2xl border transition-all ${
                  m.isCurrent
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-400 shadow-md ring-2 ring-blue-400/20'
                    : m.total > 0 || m.releaseTotal > 0
                    ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    : 'bg-slate-50/50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <b className={`text-xs font-black ${m.isCurrent ? 'text-blue-950' : 'text-slate-800'}`}>
                    {m.monthName} {currentYear}
                  </b>
                  {m.isCurrent && (
                    <span className="px-2 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase">
                      Kasalukuyan
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 pt-1 border-t border-slate-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <ArrowDownLeft className="w-3 h-3" /> Koleksyon:
                    </span>
                    <b className="text-slate-900 font-black">{money(m.total)}</b>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-teal-700 font-bold flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" /> Na-release:
                    </span>
                    <b className="text-teal-900 font-black">{money(m.releaseTotal)}</b>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-semibold mt-2 pt-1 border-t border-slate-200 flex justify-between items-center">
                  <span>{m.count} bayad • {m.releaseCount} releases</span>
                  <span>Net: <b>{money(m.total - m.releaseTotal)}</b></span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    style={{ width: `${m.barPercent}%` }}
                    className={`h-full rounded-full ${m.isCurrent ? 'bg-blue-600' : 'bg-emerald-600'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: YEARLY HISTORICAL SUMMARY (ANNUAL TOTALS) */}
      {activeTab === 'yearly' && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Taunang Kasaysayan (Annual History Matrix)
              </h3>
              <p className="text-xs text-slate-500">
                Kasaysayan ng Koleksyon at Pautang kada taon para kay: <b>{selectedCollectorId === 'ALL' ? 'Lahat ng Collectors' : db.collectors.find(c => c.id === selectedCollectorId)?.name}</b>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-black text-purple-900 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200">
                All-Time Koleksyon: {money(allTimeCollected)}
              </span>
              <span className="font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-300">
                All-Time Release: {money(allTimeRelease)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {yearlyBreakdown.map(yr => (
              <div
                key={yr.year}
                className={`p-4 rounded-2xl border transition-all ${
                  yr.isCurrent
                    ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-400 shadow-md'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Taon</span>
                  <b className="text-base font-black text-purple-950 font-mono">{yr.year}</b>
                </div>

                <div className="space-y-2 mt-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-700 font-bold">Kabuuang Koleksyon:</span>
                    <b className="text-base font-black text-slate-900">{money(yr.total)}</b>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-teal-700 font-bold">Kabuuang Na-release:</span>
                    <b className="text-sm font-black text-teal-900">{money(yr.releaseTotal)}</b>
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-semibold mt-3 pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span>{yr.count} resibo • {yr.releaseCount} loans</span>
                  <span className="text-[11px] font-black text-slate-700">Net: {money(yr.total - yr.releaseTotal)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
