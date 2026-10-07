import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { bname, money, outstanding, loanIsCurrent, esc } from '../utils/calculations';
import { Search, UserPlus, FileText, Image as ImageIcon, History, CreditCard, Users, ShieldCheck, Plus, RefreshCw } from 'lucide-react';
import borrowersIcon from '../assets/images/borrowers_3d_icon_1791390015615.jpg';
import activeLoansIcon from '../assets/images/active_loans_3d_icon_1791390595213.jpg';
import outstandingIcon from '../assets/images/outstanding_3d_icon_1791390608732.jpg';

export const BorrowersPage: React.FC = () => {
  const { db, openModal, renewLoan } = useApp();
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const rows = db.borrowers.filter(b => (bname(b) + ' ' + b.contact + ' ' + b.idNo + ' ' + b.id).toLowerCase().includes(q));

  const totalClients = db.borrowers.length;
  const clientsWithActiveLoans = db.borrowers.filter(b => {
    const bLoans = db.loans.filter(l => l.borrowerId === b.id && l.approvalStatus === 'Approved');
    return bLoans.some(loanIsCurrent);
  }).length;

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
              Borrowers & Clients Directory
            </h2>
            <p style={{ color: '#dbeafe' }} className="text-xs mt-0.5">
              Manage client profiles, government IDs, photo attachments, and Statements of Account (SOA).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search borrower name, ID, phone..."
              className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 w-52 sm:w-64 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <button
            onClick={() => openModal('borrowerModal')}
            style={{
              backgroundColor: '#d97706',
              backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              borderColor: '#fcd34d'
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all border cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-white" />
            <span>+ Add Borrower</span>
          </button>
        </div>
      </div>

      {/* Top 3 Metric Summary 3D Color-Coded Cards */}
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
              Total Registered Borrowers
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {totalClients} Clients
            </div>
            <span style={{ color: '#dbeafe' }} className="text-[10px] font-semibold block mt-1">
              Registered in customer database
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
            backgroundColor: '#065f46',
            backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #064e3b 100%)',
            color: '#ffffff',
            borderColor: '#6ee7b7'
          }}
          className="p-5 rounded-3xl border shadow-xl flex items-center justify-between group hover:-translate-y-1 transition-all"
        >
          <div>
            <span style={{ color: '#d1fae5' }} className="text-[11px] font-black uppercase tracking-wider block">
              Active Borrowers
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {clientsWithActiveLoans} Clients
            </div>
            <span style={{ color: '#d1fae5' }} className="text-[10px] font-semibold block mt-1">
              Borrowers with ongoing loans
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={activeLoansIcon} alt="Active Loans" className="w-full h-full object-cover" />
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
              Filtered in Search
            </span>
            <div style={{ color: '#ffffff' }} className="text-3xl font-black mt-1">
              {rows.length} Shown
            </div>
            <span style={{ color: '#fef3c7' }} className="text-[10px] font-semibold block mt-1">
              Matching active search filter
            </span>
          </div>
          <div
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }}
            className="w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform overflow-hidden"
          >
            <img src={outstandingIcon} alt="Search" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Borrowers Table */}
      <div style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1' }} className="p-5 rounded-3xl border shadow-md space-y-3">
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs text-left">
            <thead style={{ backgroundColor: '#f1f5f9', color: '#475569' }} className="font-black text-[10px] uppercase border-b border-slate-200">
              <tr>
                <th className="p-3">Client Name</th>
                <th className="p-3">Area</th>
                <th className="p-3">Collector</th>
                <th className="p-3">Contact</th>
                <th className="p-3 text-center">ID / Photo</th>
                <th className="p-3 text-center">Total Loans</th>
                <th className="p-3 text-right">Outstanding</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold" style={{ color: '#1e293b' }}>
              {rows.map(b => {
                const bLoans = db.loans.filter(l => l.borrowerId === b.id && l.approvalStatus === 'Approved');
                const outBal = bLoans.filter(loanIsCurrent).reduce((s, l) => s + outstanding(l), 0);
                const areaObj = db.areas.find(a => a.id === b.areaId);
                const colObj = db.collectors.find(c => c.id === b.collectorId);
                const activeLoan = bLoans.find(loanIsCurrent);

                return (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <b style={{ color: '#0f172a' }} className="font-extrabold block text-sm">{bname(b)}</b>
                      <small style={{ color: '#64748b' }} className="font-mono text-[10px]">{b.id}</small>
                    </td>
                    <td className="p-3">{areaObj ? areaObj.name : '—'}</td>
                    <td className="p-3">{colObj ? colObj.name : '—'}</td>
                    <td className="p-3">{b.contact || '—'}</td>
                    <td className="p-3 text-center">
                      {b.idImage ? (
                        <span style={{ backgroundColor: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border">
                          <ImageIcon className="w-3 h-3 text-emerald-600" /> Photo
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }} className="text-[10px] italic">None</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-bold">{bLoans.length}</td>
                    <td className="p-3 text-right font-black" style={{ color: outBal > 0.01 ? '#b45309' : '#64748b' }}>
                      {money(outBal)}
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openModal('soaModal', { borrowerId: b.id })}
                          style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}
                          className="px-2.5 py-1 rounded-xl font-bold text-[11px] shadow-xs hover:bg-blue-100 cursor-pointer"
                        >
                          SOA
                        </button>
                        <button
                          onClick={() => openModal('creditHistoryModal', { borrowerId: b.id })}
                          style={{ backgroundColor: '#f1f5f9', color: '#334155' }}
                          className="px-2.5 py-1 rounded-xl font-bold text-[11px] hover:bg-slate-200 cursor-pointer"
                        >
                          History
                        </button>
                        {activeLoan ? (
                          <button
                            onClick={() => openModal('paymentModal', { loanId: activeLoan.id })}
                            style={{ backgroundColor: '#ecfdf5', color: '#047857' }}
                            className="px-2.5 py-1 rounded-xl font-bold text-[11px] hover:bg-emerald-100 cursor-pointer"
                          >
                            + Pay
                          </button>
                        ) : bLoans.length > 0 ? (
                          <button
                            onClick={() => {
                              const lastPaid = bLoans.slice().reverse().find(l => l.status === 'Paid' || outstanding(l) <= 0.01) || bLoans[bLoans.length - 1];
                              renewLoan(lastPaid.id);
                            }}
                            style={{ backgroundColor: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
                            className="px-2.5 py-1 rounded-xl font-black text-[11px] shadow-xs hover:bg-emerald-200 border flex items-center gap-1 cursor-pointer"
                            title="Renew loan for this borrower"
                          >
                            <RefreshCw className="w-3 h-3 text-emerald-600" />
                            <span>Renew</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => openModal('loanModal', { borrowerId: b.id })}
                            style={{ backgroundColor: '#eff6ff', color: '#1e40af', borderColor: '#bfdbfe' }}
                            className="px-2.5 py-1 rounded-xl font-black text-[11px] shadow-xs hover:bg-blue-200 border flex items-center gap-1 cursor-pointer"
                            title="Issue first loan for this borrower"
                          >
                            <Plus className="w-3 h-3 text-blue-700" />
                            <span>New Loan</span>
                          </button>
                        )}
                        <button
                          onClick={() => openModal('borrowerModal', { id: b.id })}
                          style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}
                          className="px-2.5 py-1 rounded-xl font-bold text-[11px] hover:bg-slate-200 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                    No borrowers found. Click &quot;+ Add Borrower&quot; to register a new client.
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
