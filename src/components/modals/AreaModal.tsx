import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, MapPin } from 'lucide-react';

export const AreaModal: React.FC = () => {
  const { db, activeModal, modalParams, closeModal, saveArea } = useApp();

  const editId = modalParams.id as string | undefined;
  const existing = editId ? db.areas.find(a => a.id === editId) : undefined;

  const [name, setName] = useState(existing?.name || '');
  const [code, setCode] = useState(existing?.code || '');

  if (activeModal !== 'areaModal') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveArea(
      {
        name: name.trim(),
        code: code.trim()
      },
      editId
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-slate-300 overflow-hidden my-auto animate-3d-modal">
        <div
          style={{
            backgroundColor: '#1e1b4b',
            backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #3730a3 100%)',
            color: '#ffffff',
            borderColor: '#818cf8'
          }}
          className="flex items-center justify-between px-5 py-4 border-b shadow-md"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center font-black shadow-inner">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base leading-tight">
                {editId ? 'Edit Area / Territory' : 'Register New Area / Barangay'}
              </h3>
              <p className="text-[11px] text-indigo-100 font-semibold">Territory name & municipal routing code</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/20 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Area / Barangay Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              placeholder="e.g. Barangay Central, Zone 1"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Area Code</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              placeholder="e.g. A1 / BGY-01"
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
              className="btn-3d-blue px-6 py-2.5 rounded-xl text-xs font-black shadow-lg cursor-pointer"
            >
              Save Area
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
