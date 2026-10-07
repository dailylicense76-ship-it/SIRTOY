import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, MapPin, UserCheck } from 'lucide-react';

export const CollectorModal: React.FC = () => {
  const { db, activeModal, modalParams, closeModal, saveCollector, showToast } = useApp();

  const editId = modalParams.id as string | undefined;
  const existingCollector = editId ? db.collectors.find(c => c.id === editId) : undefined;
  const existingArea = existingCollector ? db.areas.find(a => a.id === existingCollector.areaId) : undefined;

  const [name, setName] = useState(existingCollector?.name || '');
  const [areaName, setAreaName] = useState(existingArea?.name || '');
  const [areaCode, setAreaCode] = useState(existingArea?.code || '');
  const [dailyQuota, setDailyQuota] = useState(existingCollector?.dailyQuota ? String(existingCollector.dailyQuota) : '0');
  const [weeklyQuota, setWeeklyQuota] = useState(existingCollector?.weeklyQuota ? String(existingCollector.weeklyQuota) : '0');
  const [semiMonthlyQuota, setSemiMonthlyQuota] = useState(existingCollector?.semiMonthlyQuota ? String(existingCollector.semiMonthlyQuota) : '0');
  const [monthlyQuota, setMonthlyQuota] = useState(existingCollector?.monthlyQuota ? String(existingCollector.monthlyQuota) : '0');

  if (activeModal !== 'collectorModal') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !areaName.trim()) {
      showToast('Please enter both the Collector name and the Area / Barangay name.', 'warn');
      return;
    }
    saveCollector(
      {
        name: name.trim(),
        dailyQuota: Math.max(0, Number(dailyQuota) || 0),
        weeklyQuota: Math.max(0, Number(weeklyQuota) || 0),
        semiMonthlyQuota: Math.max(0, Number(semiMonthlyQuota) || 0),
        monthlyQuota: Math.max(0, Number(monthlyQuota) || 0)
      },
      {
        name: areaName.trim(),
        code: areaCode.trim()
      },
      editId
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-slate-300 overflow-hidden my-auto animate-3d-modal">
        <div
          style={{
            backgroundColor: '#134e4a',
            backgroundImage: 'linear-gradient(135deg, #134e4a 0%, #0f766e 50%, #0d9488 100%)',
            color: '#ffffff',
            borderColor: '#2dd4bf'
          }}
          className="flex items-center justify-between px-5 py-4 border-b shadow-md"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center font-black shadow-inner">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base leading-tight">
                {editId ? 'Edit Collector & Route' : 'Register Collector & Assigned Area'}
              </h3>
              <p className="text-[11px] text-teal-100 font-semibold">Collector profile, territory assignment & quota parameters</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/20 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Collector Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              placeholder="e.g. Pedro Penduko"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Area / Barangay Name *</label>
            <input
              type="text"
              required
              list="existingAreaList"
              value={areaName}
              onChange={e => setAreaName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              placeholder="Type or select Barangay"
            />
            <datalist id="existingAreaList">
              {db.areas.map(a => (
                <option key={a.id} value={a.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Area Code</label>
            <input
              type="text"
              value={areaCode}
              onChange={e => setAreaCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              placeholder="e.g. BGY-01 / Zone 2"
            />
          </div>

          <div className="md:col-span-2 p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-[11px] text-emerald-950 space-y-1">
            <div className="flex items-center gap-1.5 font-black text-emerald-900">
              <span>⚡ 100% Automatic Dynamic Quota Active</span>
            </div>
            <p className="leading-relaxed">
              Ang target quota (Daily, Weekly, Monthly) ay <b>awtomatikong kinakalkula</b> mula sa aktwal na scheduled amortizations ng mga pautang sa rutang ito. Hindi mo na kailangang mag-manual set.
            </p>
          </div>

          <div className="md:col-span-2">
            <details className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <summary className="font-extrabold cursor-pointer text-slate-800 select-none">
                ⚙️ Optional: Manual Fixed Quota Override (Optional lamang kung may fixed baseline)
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Fixed Daily Quota (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={dailyQuota}
                    onChange={e => setDailyQuota(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white"
                    placeholder="0 = Full Automatic"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Fixed Weekly Quota (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={weeklyQuota}
                    onChange={e => setWeeklyQuota(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white"
                    placeholder="0 = Full Automatic"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Fixed Semi-monthly (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={semiMonthlyQuota}
                    onChange={e => setSemiMonthlyQuota(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white"
                    placeholder="0 = Full Automatic"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Fixed Monthly Quota (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={monthlyQuota}
                    onChange={e => setMonthlyQuota(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white"
                    placeholder="0 = Full Automatic"
                  />
                </div>
              </div>
            </details>
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
              className="btn-3d-teal px-6 py-2.5 rounded-xl text-xs font-black shadow-lg cursor-pointer"
            >
              Save Collector & Area
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
