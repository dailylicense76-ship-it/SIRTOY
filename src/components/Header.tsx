import React from 'react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import { Search, CreditCard, Menu, HardDrive, CheckCircle2, Calculator, ShieldCheck, Key } from 'lucide-react';
import { getStoredLicense } from '../utils/license';

const labels: Record<string, string> = {
  dashboard: 'Dashboard',
  borrowers: 'Borrowers',
  loans: 'Loans',
  collections: 'Collections',
  bulkPayment: 'Bulk Payment & Field Collections',
  capital: 'Capital Management',
  expenses: 'Expenses Tracker',
  collectors: 'Collectors',
  collectorPerformance: 'Collector Performance',
  areas: 'Areas',
  reconciliation: 'Cash Reconciliation',
  approvals: 'Approvals',
  restructure: 'Restructuring',
  reports: 'Reports',
  users: 'Users & Roles',
  settings: 'Settings',
  audit: 'Audit Trail'
};

export const Header: React.FC = () => {
  const {
    activePage,
    go,
    openModal,
    toggleMobileSidebar,
    pcFolderName,
    isPcFolderConnected,
    connectPCFolder,
    reconnectPCFolder
  } = useApp();

  const title = labels[activePage] || 'Dashboard';
  const todayFormatted = new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const license = getStoredLicense();

  return (
    <header className="top sticky top-0 z-30 flex flex-wrap justify-between items-center bg-slate-50/90 border-b border-slate-200 backdrop-blur-md px-5 py-3 gap-2">
      <div className="flex items-center gap-3">
        <button
          onClick={() => toggleMobileSidebar()}
          className="md:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-black text-slate-900 leading-tight">{title}</h1>
          <div className="text-xs font-medium text-slate-500">{todayFormatted}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Software License Status Badge */}
        <button
          onClick={() => openModal('activationModal')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
            license.isValid
              ? license.isTrial
                ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
              : 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100'
          }`}
          title="Click to view license status or enter activation product key"
        >
          {license.isTrial ? (
            <Key className="w-3.5 h-3.5 text-amber-600 flex-none" />
          ) : license.isValid ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-none" />
          ) : (
            <Key className="w-3.5 h-3.5 text-rose-600 flex-none" />
          )}
          <span className="hidden sm:inline">
            {license.isTrial
              ? `7-Day Trial (${license.daysLeft ?? 0}d left)`
              : license.isValid
              ? `License: ${license.licenseType}`
              : 'Activate License'}
          </span>
        </button>

        {/* PC Folder Database Connector */}
        <button
          onClick={isPcFolderConnected ? reconnectPCFolder : connectPCFolder}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
            isPcFolderConnected
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
          }`}
          title="Select or reconnect local PC folder as database"
        >
          <HardDrive className="w-3.5 h-3.5 flex-none" />
          <span>
            {isPcFolderConnected ? `PC Folder: ${pcFolderName}` : 'Connect PC Folder'}
          </span>
          {isPcFolderConnected && <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-none" />}
        </button>

        {/* PWA Desktop App Installation */}
        <PWAInstallButton />

        {/* Quick Denomination Counter Tool */}
        <button
          onClick={() => openModal('denominationModal')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
          title="Open Cash Denomination Bill Counter"
        >
          <Calculator className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Cash Counter</span>
        </button>

        {/* Universal Fast Search Button */}
        <button
          onClick={() => openModal('searchModal')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all group"
          title="Universal Search (Press Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden md:inline-flex items-center text-[10px] font-extrabold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            Ctrl+K
          </kbd>
        </button>

        <button
          onClick={() => openModal('paymentModal')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
          title="Record customer loan payment"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>+ Record Payment</span>
        </button>
      </div>
    </header>
  );
};
