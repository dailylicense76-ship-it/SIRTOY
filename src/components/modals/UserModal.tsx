import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { X, ShieldCheck, Users } from 'lucide-react';

export const UserModal: React.FC = () => {
  const { db, activeModal, modalParams, closeModal, saveUser, showToast } = useApp();

  const editId = modalParams.id as string | undefined;
  const existing = editId ? db.users.find(u => u.id === editId) : undefined;

  const [name, setName] = useState(existing?.name || '');
  const [username, setUsername] = useState(existing?.username || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(existing?.role || 'Staff');
  const [collectorId, setCollectorId] = useState(existing?.collectorId || '');
  const [status, setStatus] = useState<'Active' | 'Inactive'>(existing?.status || 'Active');

  if (activeModal !== 'userModal') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      showToast('Name and username are required.', 'warn');
      return;
    }
    if (!editId && (!password || password.length < 6)) {
      showToast('Password must be at least 6 characters.', 'warn');
      return;
    }
    const success = await saveUser(
      {
        name: name.trim(),
        username: username.trim(),
        role,
        collectorId,
        status
      },
      password,
      editId
    );
    if (success) setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-slate-300 overflow-hidden my-auto animate-3d-modal">
        <div
          style={{
            backgroundColor: '#1e3a8a',
            backgroundImage: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1d4ed8 100%)',
            color: '#ffffff',
            borderColor: '#60a5fa'
          }}
          className="flex items-center justify-between px-5 py-4 border-b shadow-md"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center font-black shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base leading-tight">
                {editId ? 'Edit System User Account' : 'Create System User Account'}
              </h3>
              <p className="text-[11px] text-blue-100 font-semibold">User credentials, RBAC permissions & role control</p>
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
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              placeholder="e.g. Maria Santos"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Username *</label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              placeholder="e.g. msantos"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              {editId ? 'New Password (leave blank to keep current)' : 'Password *'}
            </label>
            <input
              type="password"
              minLength={6}
              required={!editId}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">System Role *</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
            >
              <option value="Developer">System Developer (Software Reseller / Key Issuer)</option>
              <option value="Admin">Administrator (Full System Control)</option>
              <option value="Staff">Staff (Operations & Collection Management)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Linked Collector Assignment</label>
            <select
              value={collectorId}
              onChange={e => setCollectorId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
            >
              <option value="">None / Office Staff</option>
              {db.collectors.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Account Status *</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as 'Active' | 'Inactive')}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive / Disabled</option>
            </select>
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
              Save User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
