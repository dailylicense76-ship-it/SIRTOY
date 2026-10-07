import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { systemCashOnHand, money, today } from '../../utils/calculations';
import { X, Calculator, ChevronDown, ChevronUp } from 'lucide-react';

const DENOMS = [
  { label: '₱1,000', value: 1000 },
  { label: '₱500', value: 500 },
  { label: '₱200', value: 200 },
  { label: '₱100', value: 100 },
  { label: '₱50', value: 50 },
  { label: '₱20', value: 20 },
  { label: 'Coins (₱10/5/1)', value: 1, isCoinGroup: true }
];

export const ReconciliationModal: React.FC = () => {
  const { db, activeModal, modalParams, closeModal, recordCashReconciliation } = useApp();

  const [date, setDate] = useState(today());
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [showDenomHelper, setShowDenomHelper] = useState(false);
  const [counts, setCounts] = useState<Record<number, number>>({
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    1: 0
  });

  useEffect(() => {
    if (activeModal === 'reconciliationModal') {
      if (modalParams.actualCash !== undefined) {
        setActualCash(String(modalParams.actualCash));
      }
      if (modalParams.notes) {
        setNotes(String(modalParams.notes));
      }
    }
  }, [activeModal, modalParams]);

  if (activeModal !== 'reconciliationModal') return null;

  const sysCash = systemCashOnHand(db);
  const actNum = Number(actualCash) || 0;
  const variance = actNum - sysCash;

  const handleDenomChange = (val: number, qtyStr: string) => {
    const qty = Math.max(0, parseInt(qtyStr, 10) || 0);
    const updated = { ...counts, [val]: qty };
    setCounts(updated);

    const calculatedTotal =
      (updated[1000] || 0) * 1000 +
      (updated[500] || 0) * 500 +
      (updated[200] || 0) * 200 +
      (updated[100] || 0) * 100 +
      (updated[50] || 0) * 50 +
      (updated[20] || 0) * 20 +
      (updated[1] || 0);

    setActualCash(String(calculatedTotal));

    // Auto-update notes with breakdown summary
    const billBreakdown = `1000x${updated[1000] || 0}, 500x${updated[500] || 0}, 200x${updated[200] || 0}, 100x${updated[100] || 0}, 50x${updated[50] || 0}, 20x${updated[20] || 0}, Coins=${money(updated[1] || 0)}`;
    setNotes(prev => {
      if (!prev || prev.includes('1000x')) {
        return `Count breakdown: ${billBreakdown}`;
      }
      return prev;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordCashReconciliation({
      date,
      actualCash: actNum,
      notes: notes.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-slate-300 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-3d-modal">
        <div
          style={{
            backgroundColor: '#134e4a',
            backgroundImage: 'linear-gradient(135deg, #134e4a 0%, #0f766e 50%, #0d9488 100%)',
            color: '#ffffff',
            borderColor: '#2dd4bf'
          }}
          className="flex items-center justify-between px-5 py-4 border-b shadow-md flex-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center font-black shadow-inner">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base leading-tight">
                Cash Count & Reconciliation
              </h3>
              <p className="text-[11px] text-teal-100 font-semibold">Physical drawer counting, system audit & variance verification</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/20 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Reconciliation Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">System Calculated Cash</label>
            <input
              type="text"
              readOnly
              value={money(sysCash)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-slate-100 text-slate-900"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-extrabold text-slate-700">Actual Physical Cash Count (₱) *</label>
              <button
                type="button"
                onClick={() => setShowDenomHelper(!showDenomHelper)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{showDenomHelper ? 'Hide Bill Counter' : 'Open Bill & Coin Counter'}</span>
                {showDenomHelper ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={actualCash}
              onChange={e => setActualCash(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          {/* Interactive Denomination Sub-Counter */}
          {showDenomHelper && (
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2 animate-in fade-in">
              <div className="text-[11px] font-bold text-blue-900 flex justify-between items-center">
                <span>💵 Fast Bill & Coin Counter</span>
                <small className="text-[10px] text-blue-600">Auto-computes total cash</small>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {DENOMS.map(d => (
                  <div key={d.value} className="flex items-center justify-between bg-white p-1.5 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-700 text-[11px]">{d.label}</span>
                    <input
                      type="number"
                      min="0"
                      value={counts[d.value] === 0 ? '' : counts[d.value]}
                      onChange={e => handleDenomChange(d.value, e.target.value)}
                      placeholder={d.isCoinGroup ? '₱ coins' : 'pcs'}
                      className="w-16 px-1.5 py-0.5 border border-slate-300 rounded text-[11px] font-black text-center text-slate-900 bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Variance (Actual vs System)</span>
            <b className={`text-base font-black ${Math.abs(variance) < 0.01 ? 'text-emerald-600' : variance < 0 ? 'text-red-600' : 'text-blue-600'}`}>
              {money(variance)}
            </b>
            <small className="block text-[11px] font-bold text-slate-500 mt-1">
              {Math.abs(variance) < 0.01 ? '✓ Cash drawer balanced' : variance < 0 ? '⚠️ Short cash count' : '⚠️ Overage in cash count'}
            </small>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Audit Notes / Explanation</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              placeholder="Explain any cash shortage or overage if applicable"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
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
              Save Reconciliation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
