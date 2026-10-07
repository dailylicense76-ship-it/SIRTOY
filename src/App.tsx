import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { BorrowersPage } from './pages/BorrowersPage';
import { LoansPage } from './pages/LoansPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { BulkPaymentPage } from './pages/BulkPaymentPage';
import { CapitalPage } from './pages/CapitalPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { CollectorsPage } from './pages/CollectorsPage';
import { CollectorPerformancePage } from './pages/CollectorPerformancePage';
import { AreasPage } from './pages/AreasPage';
import { RestructurePage } from './pages/RestructurePage';
import { ReconciliationPage } from './pages/ReconciliationPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditPage } from './pages/AuditPage';
import { DeveloperPage } from './pages/DeveloperPage';

import { BorrowerModal } from './components/modals/BorrowerModal';
import { LoanModal } from './components/modals/LoanModal';
import { PaymentModal } from './components/modals/PaymentModal';
import { CapitalModal } from './components/modals/CapitalModal';
import { ExpenseModal } from './components/modals/ExpenseModal';
import { CollectorModal } from './components/modals/CollectorModal';
import { AreaModal } from './components/modals/AreaModal';
import { RestructureModal } from './components/modals/RestructureModal';
import { ReconciliationModal } from './components/modals/ReconciliationModal';
import { UserModal } from './components/modals/UserModal';
import { SearchModal } from './components/modals/SearchModal';
import { SOAModal } from './components/modals/SOAModal';
import { CreditHistoryModal } from './components/modals/CreditHistoryModal';
import { PrintModal } from './components/modals/PrintModal';
import { DenominationModal } from './components/modals/DenominationModal';
import { AdminConfirmModal } from './components/modals/AdminConfirmModal';
import { ActivationModal } from './components/modals/ActivationModal';
import { KeyGeneratorModal } from './components/modals/KeyGeneratorModal';
import { EulaModal } from './components/modals/EulaModal';

import { getStoredLicense, getMachineId, saveProductKey, saveEulaAcceptance, getLicenseSignal } from './utils/license';
import {
  Lock,
  Cpu,
  Copy,
  Check,
  Key,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Award
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, activePage, activeModal, modalParams, openModal, showToast, logout } = useApp();

  const [licenseInput, setLicenseInput] = React.useState('');
  const [copiedMid, setCopiedMid] = React.useState(false);
  const [eulaChecked, setEulaChecked] = React.useState(false);
  const [activationTrigger, setActivationTrigger] = React.useState(0); // Trigger re-evaluation of license state

  const licenseState = React.useMemo(() => {
    return getStoredLicense();
  }, [activationTrigger]);

  const isUnlocked = React.useMemo(() => {
    if (!user) return true;
    if (user.role === 'Developer') return true; // Developer always bypasses activation check
    const signal = getLicenseSignal();
    if (signal === 'Paused' || signal === 'Terminated') return false;
    return licenseState.isValid;
  }, [user, licenseState, activationTrigger]);

  // Global Keyboard Shortcuts (e.g. Ctrl + K / Cmd + K to open search)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openModal('searchModal');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openModal]);

  if (!user) {
    return <LoginPage />;
  }

  // Full-Screen System Locked Block Screen (if License is Invalid & user is not Developer)
  if (!isUnlocked) {
    const mid = getMachineId();
    const signal = getLicenseSignal();

    const handleCopyMID = () => {
      navigator.clipboard.writeText(mid);
      setCopiedMid(true);
      showToast('✓ Machine ID copied! Send this to the developer for activation key.', 'ok');
      setTimeout(() => setCopiedMid(false), 2500);
    };

    const handleActivateSystem = (e: React.FormEvent) => {
      e.preventDefault();
      if (!licenseInput.trim()) {
        showToast('Mangyaring ipasok ang inyong Product Key.', 'warn');
        return;
      }
      if (!eulaChecked) {
        showToast('Kailangan mong i-check ang EULA & Disclaimer para magpatuloy.', 'warn');
        return;
      }

      const res = saveProductKey(licenseInput);
      if (res.isValid) {
        saveEulaAcceptance(user.name || 'System Operator');
        showToast('🎉 PRODUCT KEY ACTIVATED SUCCESSFULLY! System is now unlocked.', 'ok');
        setActivationTrigger(prev => prev + 1); // Unlock immediately
      } else {
        showToast(res.statusMessage || 'Maling Product Key. Mangyaring subukan muli.', 'warn');
      }
    };

    return (
      <div
        style={{
          backgroundColor: '#030c22',
          backgroundImage: 'radial-gradient(circle at 50% 50%, #0d286d 0%, #05143a 50%, #020818 100%)'
        }}
        className="min-h-screen w-full flex items-center justify-center p-4 text-white relative overflow-x-hidden font-sans select-none"
      >
        {/* Anti-Piracy Warning Grid Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}></div>

        <div className="relative z-10 w-full max-w-xl p-6 sm:p-8 rounded-3xl border border-rose-500/35 bg-slate-950/90 shadow-2xl space-y-6 text-center backdrop-blur-xl">
          <div className="flex flex-col items-center">
            {/* Immersive Lock/Signal Logo */}
            <div className={`w-16 h-14 rounded-2xl flex items-center justify-center shadow-lg relative border-2 ${
              signal === 'Terminated'
                ? 'bg-rose-950/40 border-rose-600 text-rose-500 animate-bounce'
                : signal === 'Paused'
                  ? 'bg-amber-950/40 border-amber-500 text-amber-500 animate-pulse'
                  : 'bg-rose-500/10 border-rose-500 text-rose-400 animate-pulse'
            }`}>
              <Lock className="w-8 h-8" />
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-4 uppercase">
              {signal === 'Terminated'
                ? '🛑 LICENSE PERMANENTLY TERMINATED'
                : signal === 'Paused'
                  ? '⏸️ SYSTEM LICENSE PAUSED'
                  : '⚠️ PRODUCT ACTIVATION REQUIRED'}
            </h1>
            <p className="text-[10px] sm:text-xs font-bold text-rose-300 tracking-wider mt-1 uppercase">
              SIRTOY LENDING PLUS — OFFLINE PROTECTION SYSTEM
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left text-xs font-semibold text-slate-300 leading-relaxed space-y-2.5">
            <p className="text-rose-300 font-extrabold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>LICENSING ALERT & DISCIPLINE NOTICE:</span>
            </p>
            {signal === 'Terminated' ? (
              <p className="text-rose-200">
                Ang lisensya para sa lending software na ito ay **tinapos o tinanggal na ng Developer**. Ito ay dulot ng paglabag sa software contract, pagtapos ng pinagkasunduang panahon, o hindi pagbabayad ng lisensya. Makipag-ugnayan sa facebook.com/profile.php?id=61595333360264 upang muling buksan ang serbisyo.
              </p>
            ) : signal === 'Paused' ? (
              <p className="text-amber-200">
                Ang inyong system access ay **pansamantalang sinuspinde o naka-pause ng Developer**. Mangyaring makipag-ugnayan sa inyong reseller o Developer upang i-resume ang lisensya ng inyong kumpanya.
              </p>
            ) : (
              <p>Naka-lock ang system para sa kaligtasan ng kumpanya at software. Hindi mo magagamit ang kabuuang system (borrowers directory, loans ledger, collections) kung walang valid na activation key.</p>
            )}
          </div>

          {signal === 'Active' ? (
            <form onSubmit={handleActivateSystem} className="space-y-4 text-left">
              {/* Step 1: Device Machine ID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>1. Inyong PC Hardware Machine ID (MID):</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={mid}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs font-black text-amber-400 select-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={handleCopyMID}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    {copiedMid ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedMid ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Kopyahin ang MID sa itaas at ipadala sa developer para makuha ang inyong Product Key.
                </p>
              </div>

              {/* Step 2: Activation Key Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>2. Ipasok ang inyong Product Activation Key:</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="SIR-PERP-CLIENT-ALLPC-PERPETUAL-XXXXXX"
                  value={licenseInput}
                  onChange={e => setLicenseInput(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs font-black text-white focus:outline-none focus:border-indigo-400 shadow-inner uppercase tracking-widest placeholder-slate-600"
                />
              </div>

              {/* EULA Accept */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="eulaAcceptCheck"
                    checked={eulaChecked}
                    onChange={e => setEulaChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-700 bg-slate-950 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label htmlFor="eulaAcceptCheck" className="text-[11px] font-bold text-slate-300 leading-normal cursor-pointer select-none">
                    Sumasang-ayon ako sa <button type="button" onClick={() => openModal('eulaModal')} className="text-sky-400 underline hover:text-sky-300 font-black">EULA Software Contract</button>. Ang kumpanya namin ang may buong responsibilidad sa loan computations, billing, at database record backups.
                  </label>
                </div>
              </div>

              {/* Action Activation Button */}
              <button
                type="submit"
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 border border-amber-300/30"
              >
                <Award className="w-4.5 h-4.5 text-slate-950" />
                <span>I-activate ang Product Key Now</span>
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Display MID even during suspension for reference */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Hardware Machine ID Lock</span>
                <span className="text-xs font-mono font-black text-amber-400 mt-0.5 block select-all">{mid}</span>
              </div>

              {/* Locked/Paused/Terminated Action to logout or change account */}
              <button
                type="button"
                onClick={logout}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Logout Account / Switch User
              </button>
            </div>
          )}

          {/* Contact Developer Social Link Card */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-left">
              <div className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Official Sales & Registration</div>
              <div className="font-extrabold text-white">SIRTOY Lending Software Support</div>
            </div>
            <a
              href="https://www.facebook.com/profile.php?id=61595333360264"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
            >
              <span>Contact Developer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      <Sidebar />

      <div className="md:ml-0 flex flex-col min-h-screen transition-all duration-300">
        <Header />

        <main className="p-4 sm:p-6 max-w-[1650px] w-full mx-auto flex-1">
          {activePage === 'developer' && <DeveloperPage />}
          {activePage === 'dashboard' && <DashboardPage />}
          {activePage === 'borrowers' && <BorrowersPage />}
          {activePage === 'loans' && <LoansPage />}
          {activePage === 'collections' && <CollectionsPage />}
          {activePage === 'bulkPayment' && <BulkPaymentPage />}
          {activePage === 'capital' && <CapitalPage />}
          {activePage === 'expenses' && <ExpensesPage />}
          {activePage === 'reconciliation' && <ReconciliationPage />}
          {activePage === 'approvals' && <ApprovalsPage />}
          {activePage === 'collectors' && <CollectorsPage />}
          {activePage === 'collectorPerformance' && <CollectorPerformancePage />}
          {activePage === 'areas' && <AreasPage />}
          {activePage === 'restructure' && <RestructurePage />}
          {activePage === 'reports' && <ReportsPage />}
          {activePage === 'users' && <UsersPage />}
          {activePage === 'settings' && <SettingsPage />}
          {activePage === 'audit' && <AuditPage />}
        </main>

        <Footer variant="light" />
      </div>

      {/* Global Modals - Freshly mounted on open to guarantee clean state */}
      {activeModal === 'borrowerModal' && <BorrowerModal key={`b-${String(modalParams.id || 'new')}`} />}
      {activeModal === 'loanModal' && (
        <LoanModal key={`l-${String(modalParams.id || modalParams.borrowerId || modalParams.renewedFrom || 'new')}`} />
      )}
      {activeModal === 'paymentModal' && <PaymentModal key={`p-${String(modalParams.loanId || 'new')}`} />}
      {activeModal === 'capitalModal' && <CapitalModal key="cap" />}
      {activeModal === 'expenseModal' && <ExpenseModal key="exp" />}
      {activeModal === 'collectorModal' && <CollectorModal key={`col-${String(modalParams.id || 'new')}`} />}
      {activeModal === 'areaModal' && <AreaModal key={`area-${String(modalParams.id || 'new')}`} />}
      {activeModal === 'restructureModal' && <RestructureModal key="restruct" />}
      {activeModal === 'reconciliationModal' && <ReconciliationModal key="recon" />}
      {activeModal === 'userModal' && <UserModal key={`user-${String(modalParams.id || 'new')}`} />}
      {activeModal === 'searchModal' && <SearchModal key="search" />}
      {activeModal === 'soaModal' && (
        <SOAModal key={`soa-${String(modalParams.borrowerId || modalParams.loanId || '')}`} />
      )}
      {activeModal === 'creditHistoryModal' && (
        <CreditHistoryModal key={`history-${String(modalParams.borrowerId || '')}`} />
      )}
      {activeModal === 'printModal' && (
        <PrintModal key={`print-${String(modalParams.title || 'doc')}`} />
      )}
      {activeModal === 'denominationModal' && <DenominationModal key="denom" />}
      {activeModal === 'adminConfirmModal' && <AdminConfirmModal key="admin-confirm" />}
      {activeModal === 'activationModal' && <ActivationModal key="activation" />}
      {activeModal === 'keyGeneratorModal' && <KeyGeneratorModal key="key-gen" />}
      {activeModal === 'eulaModal' && <EulaModal key="eula" />}

      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
