import React from 'react';
import { useApp } from '../context/AppContext';
import { Users, Plus, ShieldCheck, UserCheck } from 'lucide-react';
import borrowersIcon from '../assets/images/borrowers_3d_icon_1791390015615.jpg';
import activeLoansIcon from '../assets/images/active_loans_3d_icon_1791390595213.jpg';

export const UsersPage: React.FC = () => {
  const { db, user, openModal } = useApp();

  return (
    <div className="space-y-4">
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
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 style={{ color: '#ffffff' }} className="text-lg font-black leading-tight">
              User Accounts & Role Permissions
            </h2>
            <p style={{ color: '#dbeafe' }} className="text-xs mt-0.5">
              Manage System Administrator, Manager, and Field Cashier operator credentials.
            </p>
          </div>
        </div>

        <div>
          {user?.role === 'Admin' && (
            <button
              onClick={() => openModal('userModal')}
              style={{
                backgroundColor: '#d97706',
                backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                borderColor: '#fcd34d'
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all border cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Add User Account</span>
            </button>
          )}
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
              Total Operator Accounts
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {db.users.length} Users
            </div>
            <span style={{ color: '#dbeafe' }} className="text-[10px] font-semibold block mt-1">
              Authorized system operators
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={borrowersIcon} alt="Users" className="w-full h-full object-cover" />
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
              Active Logins
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {db.users.filter(u => u.status === 'Active').length} Active
            </div>
            <span style={{ color: '#d1fae5' }} className="text-[10px] font-semibold block mt-1">
              Ready for workstation login
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={activeLoansIcon} alt="Active Logins" className="w-full h-full object-cover" />
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#4c1d95',
            backgroundImage: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%)',
            color: '#ffffff',
            borderColor: '#c4b5fd'
          }}
          className="p-5 rounded-3xl border shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all"
        >
          <div>
            <span style={{ color: '#ede9fe' }} className="text-[11px] font-black uppercase tracking-wider block">
              System Roles & RBAC
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              2 Levels
            </div>
            <span style={{ color: '#ede9fe' }} className="text-[10px] font-semibold block mt-1">
              Admin & Staff access controls
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={borrowersIcon} alt="RBAC" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} className="p-5 rounded-3xl border shadow-md space-y-3">
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs text-left">
            <thead style={{ backgroundColor: '#f1f5f9', color: '#475569' }} className="font-black text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Full Name</th>
                <th className="p-3">Username</th>
                <th className="p-3">System Role</th>
                <th className="p-3">Linked Collector</th>
                <th className="p-3 text-center">Status</th>
                {user?.role === 'Admin' && <th className="p-3 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold" style={{ color: '#1e293b' }}>
              {db.users.map(u => {
                const colObj = db.collectors.find(c => c.id === u.collectorId);
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <b style={{ color: '#0f172a' }} className="font-extrabold block text-sm">{u.name}</b>
                    </td>
                    <td className="p-3 font-mono font-bold" style={{ color: '#2563eb' }}>{u.username}</td>
                    <td className="p-3">
                      <span
                        style={{
                          backgroundColor: u.role === 'Admin' ? '#eff6ff' : '#f1f5f9',
                          color: u.role === 'Admin' ? '#1d4ed8' : '#334155'
                        }}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-black"
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3" style={{ color: '#475569' }}>{colObj ? colObj.name : '—'}</td>
                    <td className="p-3 text-center">
                      <span
                        style={{
                          backgroundColor: u.status === 'Active' ? '#d1fae5' : '#fee2e2',
                          color: u.status === 'Active' ? '#065f46' : '#991b1b'
                        }}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-black"
                      >
                        {u.status}
                      </span>
                    </td>
                    {user?.role === 'Admin' && (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => openModal('userModal', { id: u.id })}
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
