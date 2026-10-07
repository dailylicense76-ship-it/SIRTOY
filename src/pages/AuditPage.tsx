import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, ClipboardList, ShieldCheck } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const { db } = useApp();
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const rows = db.audit.filter(a => (a.action + ' ' + a.module + ' ' + a.user + ' ' + JSON.stringify(a.details)).toLowerCase().includes(q));

  return (
    <div className="space-y-4">
      {/* 3D Header Banner - Deep Slate Navy */}
      <div
        style={{
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          color: '#ffffff',
          borderColor: '#64748b'
        }}
        className="p-5 rounded-3xl border shadow-xl flex flex-wrap justify-between items-center gap-3"
      >
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)', color: '#ffffff' }}
            className="w-12 h-12 rounded-2xl border flex items-center justify-center shadow-inner"
          >
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 style={{ color: '#ffffff' }} className="text-lg font-black leading-tight">
              Immutable System Audit Trail & Event Log
            </h2>
            <p style={{ color: '#cbd5e1' }} className="text-xs mt-0.5">
              Tamper-evident chronological logs of every loan approval, payment, settings change, and login event.
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search audit trail events..."
            className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 w-52 sm:w-64 bg-white"
          />
        </div>
      </div>

      {/* Audit Table */}
      <div style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} className="p-5 rounded-3xl border shadow-md space-y-3">
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs text-left">
            <thead style={{ backgroundColor: '#f1f5f9', color: '#475569' }} className="font-black text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">User</th>
                <th className="p-3">Action</th>
                <th className="p-3">Module</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold" style={{ color: '#1e293b' }}>
              {rows.map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="p-3 whitespace-nowrap" style={{ color: '#64748b' }}>{new Date(a.at).toLocaleString('en-PH')}</td>
                  <td className="p-3 font-bold" style={{ color: '#0f172a' }}>{a.user}</td>
                  <td className="p-3 font-extrabold" style={{ color: '#2563eb' }}>{a.action}</td>
                  <td className="p-3">
                    <span style={{ backgroundColor: '#f1f5f9', color: '#334155' }} className="px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {a.module}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px]" style={{ color: '#475569' }}>
                    {typeof a.details === 'string' ? a.details : JSON.stringify(a.details)}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 italic">No audit records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
