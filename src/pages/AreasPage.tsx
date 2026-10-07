import React from 'react';
import { useApp } from '../context/AppContext';
import { money, outstanding, loanIsCurrent } from '../utils/calculations';
import { MapPin, Plus, Building2, Users } from 'lucide-react';
import borrowersIcon from '../assets/images/borrowers_3d_icon_1791390015615.jpg';
import capitalIcon from '../assets/images/capital_3d_icon_1791390644749.jpg';

export const AreasPage: React.FC = () => {
  const { db, user, openModal } = useApp();

  return (
    <div className="space-y-4">
      {/* 3D Header Banner - Teal Theme */}
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
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 style={{ color: '#ffffff' }} className="text-lg font-black leading-tight">
              Geographic Areas & Collection Zones
            </h2>
            <p style={{ color: '#ccfbf1' }} className="text-xs mt-0.5">
              Organize field operations by barangay, municipality, market zones, and assign route officers.
            </p>
          </div>
        </div>

        <div>
          {user?.role === 'Admin' && (
            <button
              onClick={() => openModal('areaModal')}
              style={{
                backgroundColor: '#d97706',
                backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                borderColor: '#fcd34d'
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all border cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Add Area / Zone</span>
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
              Total Geographic Zones
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {db.areas.length} Areas
            </div>
            <span style={{ color: '#ccfbf1' }} className="text-[10px] font-semibold block mt-1">
              Barangay & municipal territories
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={borrowersIcon} alt="Areas" className="w-full h-full object-cover" />
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
              Active Area Borrowers
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {db.borrowers.length} Clients
            </div>
            <span style={{ color: '#dbeafe' }} className="text-[10px] font-semibold block mt-1">
              Mapped client accounts
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={borrowersIcon} alt="Clients" className="w-full h-full object-cover" />
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
              Area Collector Routing
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {db.collectors.length} Assigned
            </div>
            <span style={{ color: '#fef3c7' }} className="text-[10px] font-semibold block mt-1">
              Field officers on duty
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={capitalIcon} alt="Routing" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Areas Table */}
      <div style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} className="p-5 rounded-3xl border shadow-md space-y-3">
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs text-left">
            <thead style={{ backgroundColor: '#f1f5f9', color: '#475569' }} className="font-black text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Area Name</th>
                <th className="p-3">Area Code</th>
                <th className="p-3">Assigned Collector</th>
                <th className="p-3 text-center">Registered Borrowers</th>
                <th className="p-3 text-right">Outstanding Balances</th>
                {user?.role === 'Admin' && <th className="p-3 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold" style={{ color: '#1e293b' }}>
              {db.areas.map(a => {
                const collectorObj = db.collectors.find(c => c.areaId === a.id);
                const borrowersInArea = db.borrowers.filter(b => b.areaId === a.id);
                const outBal = db.loans
                  .filter(l => {
                    const b = db.borrowers.find(x => x.id === l.borrowerId);
                    return b?.areaId === a.id && loanIsCurrent(l);
                  })
                  .reduce((s, l) => s + outstanding(l), 0);

                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="p-3 font-extrabold text-sm" style={{ color: '#0f172a' }}>{a.name}</td>
                    <td className="p-3 font-mono font-bold text-xs" style={{ color: '#2563eb' }}>{a.code || '—'}</td>
                    <td className="p-3" style={{ color: '#334155' }}>{collectorObj ? collectorObj.name : 'Unassigned'}</td>
                    <td className="p-3 text-center font-bold">{borrowersInArea.length}</td>
                    <td className="p-3 text-right font-black" style={{ color: outBal > 0.01 ? '#b45309' : '#059669' }}>
                      {money(outBal)}
                    </td>
                    {user?.role === 'Admin' && (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => openModal('areaModal', { id: a.id })}
                          style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}
                          className="px-2.5 py-1 rounded-xl font-bold text-[11px] hover:bg-slate-200 cursor-pointer"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {!db.areas.length && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 italic">No areas registered yet. Click &quot;+ Add Area&quot; to begin.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
