import React from 'react';
import { useApp } from '../context/AppContext';
import { money, today, collectorQuotaValue } from '../utils/calculations';
import { UserCheck, Plus, TrendingUp, Zap, MapPin, Printer } from 'lucide-react';
import { printCollectorPerformanceReport } from '../utils/print';
import borrowersIcon from '../assets/images/borrowers_3d_icon_1791390015615.jpg';
import activeLoansIcon from '../assets/images/active_loans_3d_icon_1791390595213.jpg';

export const CollectorsPage: React.FC = () => {
  const { db, user, openModal, go } = useApp();

  const t = today();

  return (
    <div className="space-y-4">
      {/* 3D Header Banner - Teal & Amber Theme */}
      <div
        style={{
          backgroundColor: '#0f766e',
          backgroundImage: 'linear-gradient(135deg, #115e59 0%, #0d9488 50%, #0f766e 100%)',
          color: '#ffffff',
          borderColor: '#2dd4bf'
        }}
        className="p-5 rounded-3xl border shadow-xl flex flex-wrap justify-between items-center gap-3"
      >
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
            className="w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner"
          >
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 style={{ color: '#ffffff' }} className="text-lg font-black leading-tight">
                Field Collectors & Area Assignments
              </h2>
              <span
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)' }}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-amber-300" /> Auto Quota Active
              </span>
            </div>
            <p style={{ color: '#ccfbf1' }} className="text-xs mt-0.5">
              Manage field collection routes, barangay assignments, and daily amortization targets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => printCollectorPerformanceReport(db, 'Daily', t, 'ALL')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.3)'
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs border hover:bg-white/25 transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Daily Quotas</span>
          </button>
          {user?.role === 'Admin' && (
            <button
              onClick={() => openModal('collectorModal')}
              style={{
                backgroundColor: '#d97706',
                backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                borderColor: '#fcd34d'
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all border cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Add Collector</span>
            </button>
          )}
        </div>
      </div>

      {/* 3D Color-Coded KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          style={{
            backgroundColor: '#0f766e',
            backgroundImage: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 60%, #134e4a 100%)',
            color: '#ffffff',
            borderColor: '#5eead4'
          }}
          className="p-5 rounded-3xl border shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all"
        >
          <div>
            <span style={{ color: '#ccfbf1' }} className="text-[11px] font-black uppercase tracking-wider block">
              Registered Collectors
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {db.collectors.length} Field Officers
            </div>
            <span style={{ color: '#ccfbf1' }} className="text-[10px] font-semibold block mt-1">
              Active territory collection staff
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={borrowersIcon} alt="Collectors" className="w-full h-full object-cover" />
          </div>
        </div>

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
              Assigned Borrower Accounts
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {db.borrowers.length} Clients
            </div>
            <span style={{ color: '#dbeafe' }} className="text-[10px] font-semibold block mt-1">
              Mapped across routes & barangays
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={borrowersIcon} alt="Borrowers" className="w-full h-full object-cover" />
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
              Automatic Daily Quota
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              100% Dynamic
            </div>
            <span style={{ color: '#fef3c7' }} className="text-[10px] font-semibold block mt-1">
              Computed from active amortization dues
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={activeLoansIcon} alt="Quota" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Collectors Table */}
      <div style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} className="p-5 rounded-3xl border shadow-md space-y-3">
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs text-left">
            <thead style={{ backgroundColor: '#f1f5f9', color: '#475569' }} className="font-black text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Collector Name</th>
                <th className="p-3">Assigned Area</th>
                <th className="p-3 text-center">Clients</th>
                <th className="p-3 text-right">Auto Daily Quota</th>
                <th className="p-3 text-right bg-emerald-50/50">Today Collection</th>
                <th className="p-3 text-right bg-blue-50/50">Month (MTD)</th>
                <th className="p-3 text-right bg-amber-50/50">Year (YTD)</th>
                <th className="p-3 text-right bg-purple-50/50">Overall All-Time</th>
                <th className="p-3 text-right">Today Rate</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold" style={{ color: '#1e293b' }}>
              {db.collectors.map(c => {
                const area = db.areas.find(a => a.id === c.areaId);
                const clientsCount = db.borrowers.filter(b => b.collectorId === c.id).length;
                const currentM = t.slice(0, 7);
                const currentY = t.slice(0, 4);
                
                const collectedToday = db.payments
                  .filter(p => p.collectorId === c.id && p.date === t)
                  .reduce((s, p) => s + p.amount, 0);
                const collectedMonth = db.payments
                  .filter(p => p.collectorId === c.id && p.date.startsWith(currentM))
                  .reduce((s, p) => s + p.amount, 0);
                const collectedYear = db.payments
                  .filter(p => p.collectorId === c.id && p.date.startsWith(currentY))
                  .reduce((s, p) => s + p.amount, 0);
                const collectedOverall = db.payments
                  .filter(p => p.collectorId === c.id)
                  .reduce((s, p) => s + p.amount, 0);

                const dailyQuota = collectorQuotaValue(c, 'Daily', t, t, db);
                const rate = dailyQuota > 0 ? (collectedToday / dailyQuota) * 100 : 0;

                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <b style={{ color: '#0f172a' }} className="font-extrabold block text-sm">{c.name}</b>
                      <small style={{ color: '#64748b' }} className="font-mono text-[10px]">ID: {c.id}</small>
                    </td>
                    <td className="p-3">{area ? area.name : 'Unassigned'}</td>
                    <td className="p-3 text-center font-bold">{clientsCount}</td>
                    <td className="p-3 text-right font-black" style={{ color: '#0f172a' }}>
                      <div>{money(dailyQuota)}</div>
                      <small style={{ color: '#059669' }} className="text-[10px] font-semibold">⚡ Auto schedule</small>
                    </td>
                    <td className="p-3 text-right font-black text-emerald-800 bg-emerald-50/20">{money(collectedToday)}</td>
                    <td className="p-3 text-right font-black text-blue-900 bg-blue-50/20">{money(collectedMonth)}</td>
                    <td className="p-3 text-right font-black text-amber-900 bg-amber-50/20">{money(collectedYear)}</td>
                    <td className="p-3 text-right font-black text-purple-900 bg-purple-50/20">{money(collectedOverall)}</td>
                    <td className="p-3 text-right">
                      <span
                        style={{
                          backgroundColor: rate >= 100 ? '#d1fae5' : rate > 0 ? '#dbeafe' : '#f1f5f9',
                          color: rate >= 100 ? '#065f46' : rate > 0 ? '#1e40af' : '#64748b'
                        }}
                        className="inline-block font-black px-2.5 py-0.5 rounded-lg text-[11px]"
                      >
                        {rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        {user?.role === 'Admin' && (
                          <button
                            onClick={() => openModal('collectorModal', { id: c.id })}
                            style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}
                            className="px-2.5 py-1 rounded-xl font-bold text-[11px] hover:bg-slate-200 cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => go('collectorPerformance')}
                          style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                          className="px-2.5 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1 shadow-xs hover:bg-blue-700 cursor-pointer"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Performance</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!db.collectors.length && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                    No collectors registered. Click &quot;+ Add Collector&quot; to assign staff.
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
