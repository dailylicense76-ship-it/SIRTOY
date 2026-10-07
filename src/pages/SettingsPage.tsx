import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Lock,
  Database as DbIcon,
  RefreshCw,
  Download,
  HardDrive,
  FolderCheck,
  Building2,
  AlertTriangle,
  FileSpreadsheet,
  Settings2,
  CheckCircle2,
  Key,
  FileText,
  Award,
  Sparkles
} from 'lucide-react';
import { exportLoansToCSV, exportPaymentsToCSV, exportBorrowersToCSV } from '../utils/calculations';
import { getStoredLicense } from '../utils/license';

export const SettingsPage: React.FC = () => {
  const {
    db,
    user,
    openModal,
    changePassword,
    repairCollectionAssignments,
    runIntegrityCheck,
    exportBackup,
    updateCompanySettings,
    pcFolderName,
    isPcFolderConnected,
    connectPCFolder,
    reconnectPCFolder,
    syncToPCFolder,
    disconnectPCFolder
  } = useApp();

  const currentLicense = getStoredLicense();

  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Company and Penalty State
  const [companyName, setCompanyName] = useState(db.settings.company || 'SIRTOY LENDING PLUS, INC.');
  const [logoPreview, setLogoPreview] = useState(db.settings.logoUrl || '/logo.png');
  const [penaltyType, setPenaltyType] = useState<'Flat' | 'Percentage'>(db.settings.penaltyType || 'Flat');
  const [penaltyRate, setPenaltyRate] = useState<string>(String(db.settings.penaltyRate ?? 50));
  const [penaltyGraceDays, setPenaltyGraceDays] = useState<string>(String(db.settings.penaltyGraceDays ?? 0));

  const report = runIntegrityCheck();

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await changePassword(curPass, newPass, confirmPass);
    if (ok) {
      setCurPass('');
      setNewPass('');
      setConfirmPass('');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setLogoPreview(res);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const pRateNum = Math.max(0, Number(penaltyRate) || 0);
    const pGraceNum = Math.max(0, Math.floor(Number(penaltyGraceDays) || 0));
    updateCompanySettings(companyName, logoPreview, penaltyType, pRateNum, pGraceNum);
  };

  return (
    <div className="space-y-5 pb-16">
      {/* PC Folder Database Storage Banner */}
      <div className="card bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-lg border border-slate-700/60 space-y-4">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Local PC Folder Database Control Center</h2>
              <p className="text-xs text-slate-300">Use any local folder on your Windows/Mac PC (e.g. <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">C:\SIRTOY_DATABASE</code>) as your live database storage.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
              isPcFolderConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              <FolderCheck className="w-4 h-4" />
              <span>{isPcFolderConnected ? `Active: ${pcFolderName}` : 'Not Connected'}</span>
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-xs leading-relaxed space-y-2 text-slate-200">
          <p>
            <b>100% Offline PC Database Mode:</b> When a PC folder is selected, the application automatically creates and updates structured JSON files (<code className="text-amber-300">BORROWERS.json</code>, <code className="text-amber-300">LOANS.json</code>, <code className="text-amber-300">PAYMENTS.json</code>, <code className="text-amber-300">EXPENSES.json</code>, <code className="text-amber-300">AUDIT.json</code>) directly in your selected PC directory.
          </p>
          <p className="text-slate-400">
            Automated date-stamped backup snapshots are also written to a <code className="text-slate-300">Backups/</code> subfolder inside your selected PC directory whenever data is saved.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={connectPCFolder}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xs shadow-md transition-all cursor-pointer"
          >
            <HardDrive className="w-4 h-4" />
            <span>Select Local PC Folder</span>
          </button>

          {isPcFolderConnected && (
            <>
              <button
                onClick={syncToPCFolder}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sync Now</span>
              </button>
              <button
                onClick={reconnectPCFolder}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-all cursor-pointer"
              >
                <span>Re-verify Permissions</span>
              </button>
              <button
                onClick={disconnectPCFolder}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-700 text-white font-bold text-xs transition-all cursor-pointer"
              >
                <span>Disconnect</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Company Settings & Late Overdue Penalty Rule */}
        <div className="card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-sm text-slate-900">Company & Overdue Penalty Rules</h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-3.5">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Company / Lending Business Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Company Logo / Icon Image</label>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl border-2 border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold">No Logo</span>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-amber-50 file:text-amber-900 hover:file:bg-amber-100 cursor-pointer"
                  />
                  <small className="text-[10px] text-slate-400 block mt-1">PNG, JPG, or SVG. Visible offline on sidebar, receipts, and collection sheets.</small>
                </div>
              </div>
            </div>

            {/* Overdue Penalty Rule Config */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-2.5">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-black text-amber-950">Overdue Penalty / Multa Configuration</h4>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Uri ng Penalty</label>
                  <select
                    value={penaltyType}
                    onChange={e => setPenaltyType(e.target.value as 'Flat' | 'Percentage')}
                    className="w-full px-2.5 py-1.5 border border-amber-300 rounded-xl font-bold bg-white text-slate-900"
                  >
                    <option value="Flat">Fixed Halaga (₱ Flat)</option>
                    <option value="Percentage">Porsyento (% ng Arrears)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {penaltyType === 'Flat' ? 'Halaga ng Multa (₱)' : 'Rate (%)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={penaltyRate}
                    onChange={e => setPenaltyRate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-amber-300 rounded-xl font-black bg-white text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Grace Period (Araw bago magka-multa)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={penaltyGraceDays}
                    onChange={e => setPenaltyGraceDays(e.target.value)}
                    className="w-24 px-2.5 py-1.5 border border-amber-300 rounded-xl font-black bg-white text-slate-900"
                  />
                  <span className="text-[11px] text-slate-500 font-semibold">
                    araw (0 = agad magka-penalty pagka-miss ng due date)
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md transition-colors cursor-pointer"
            >
              ✓ I-save ang Company Settings & Penalty Rule
            </button>
          </form>
        </div>

        {/* 1-Click Excel / CSV Exporters Suite & Backup */}
        <div className="card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-900">1-Click Excel / CSV Exporter Suite</h3>
          </div>

          <p className="text-xs text-slate-500">
            I-download ang malinis at kumpletong CSV spreadsheets para sa bookkeeping, accounting, at backup.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => exportLoansToCSV(db)}
              className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 text-left transition-all cursor-pointer shadow-xs"
            >
              <b className="text-xs font-black block">📑 Loans Masterlist (CSV)</b>
              <span className="text-[10px] text-emerald-700 font-medium">Lahat ng pautang, terms, at balanse</span>
            </button>

            <button
              onClick={() => exportPaymentsToCSV(db)}
              className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-950 text-left transition-all cursor-pointer shadow-xs"
            >
              <b className="text-xs font-black block">💳 Collection Ledger (CSV)</b>
              <span className="text-[10px] text-blue-700 font-medium">Lahat ng naitalang bayad at resibo</span>
            </button>

            <button
              onClick={() => exportBorrowersToCSV(db)}
              className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-950 text-left transition-all cursor-pointer shadow-xs"
            >
              <b className="text-xs font-black block">👥 Borrowers Directory (CSV)</b>
              <span className="text-[10px] text-purple-700 font-medium">Profiles, contacts, area, at co-maker</span>
            </button>

            <button
              onClick={exportBackup}
              className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 text-left transition-all cursor-pointer shadow-xs"
            >
              <b className="text-xs font-black block">💾 Full JSON Backup</b>
              <span className="text-[10px] text-slate-600 font-medium">Buong database restore file</span>
            </button>
          </div>

          {/* Database Info Summary */}
          <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs font-semibold text-slate-700">
            <div className="flex justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
              <span>Total Borrowers:</span>
              <b className="text-slate-900">{db.borrowers.length}</b>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
              <span>Total Loans:</span>
              <b className="text-slate-900">{db.loans.length}</b>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
              <span>Total Posted Payments:</span>
              <b className="text-slate-900">{db.payments.length}</b>
            </div>
          </div>
        </div>

        {/* Security Password Settings */}
        <div className="card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-sm text-slate-900">Change Account Password</h3>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Current Password *</label>
              <input
                type="password"
                required
                value={curPass}
                onChange={e => setCurPass(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">Confirm New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm transition-colors cursor-pointer"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Database Integrity Doctor */}
        <div className="card bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-sm text-slate-900">Database Integrity & Health Doctor</h3>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 space-y-1">
            <div className="flex justify-between font-black">
              <span>Database Status:</span>
              <span className={report.ok ? 'text-emerald-700' : 'text-amber-700'}>
                {report.ok ? '✓ 100% Healthy & Clean' : `⚠️ ${report.summary.total} minor issue(s) detected`}
              </span>
            </div>
            <p className="text-[11px] text-indigo-800">
              Awtomatikong sinusuri ang orphan records, duplicate loan numbers, at mismatched borrower-collector links.
            </p>
          </div>

          <button
            onClick={repairCollectionAssignments}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-sm transition-colors cursor-pointer"
          >
            Auto-Repair & Clean Database Links
          </button>
        </div>

        {/* Commercial License & Legal Liability EULA Section */}
        <div className="card bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 p-5 rounded-2xl border border-amber-500/30 shadow-md space-y-4 text-white col-span-1 md:col-span-2">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">Software Piracy Protection, Product Key & Legal EULA</h3>
                <p className="text-xs text-slate-300">
                  Manage software activation, Machine ID hardware fingerprinting, and End User License Agreement (EULA).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                currentLicense.isValid
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                <Award className="w-4 h-4" />
                <span>{currentLicense.isValid ? `Active: ${currentLicense.clientName} (${currentLicense.licenseType})` : 'Unregistered Demo Mode'}</span>
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-xs leading-relaxed space-y-2 text-slate-200">
            <p>
              <b>Legal Liability Protection:</b> By utilizing this software, you agree that the application is a calculation and tracking tool. The company and user assume full responsibility for input accuracy, loan terms, and maintaining local database backups.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => openModal('activationModal')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xs shadow-md transition-all cursor-pointer"
            >
              <Key className="w-4 h-4" />
              <span>Manage Product Key & Machine ID</span>
            </button>

            <button
              type="button"
              onClick={() => openModal('eulaModal')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>View EULA & Legal Disclaimer Agreement</span>
            </button>

            {user?.role === 'Developer' && (
              <button
                type="button"
                onClick={() => openModal('keyGeneratorModal')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs shadow-md transition-all cursor-pointer ring-2 ring-amber-300"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>👑 Open Developer Master License Issuer</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
