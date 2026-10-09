import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  Key,
  Copy,
  Check,
  Building2,
  Cpu,
  Calendar,
  Award,
  Send,
  Lock,
  ShieldAlert,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { generateProductKey, LicenseType, getMachineId } from '../../utils/license';

export const KeyGeneratorModal: React.FC = () => {
  const { closeModal, showToast, user } = useApp();
  const currentMid = getMachineId();

  // Developer Passcode Authentication State
  const [devPasscode, setDevPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(() => user?.role === 'Developer');
  const [authError, setAuthError] = useState('');

  const [clientName, setClientName] = useState('ABC LENDING CORP');
  const [machineIdInput, setMachineIdInput] = useState('ANY'); // 'ANY' or specific MID-XXXX-XXXX-XXXX-XXXX
  const [licenseType, setLicenseType] = useState<LicenseType>('Perpetual');
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });

  const [generatedKey, setGeneratedKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  // Default Master Passcode for Software Developer / Vendor
  const VALID_DEV_PASSCODES = ['SIRTOY-DEV-2026', 'SIRTOY-DEV', 'sirtoydev', 'admin123', 'SIRTOY2026'];

  const handleDevUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (VALID_DEV_PASSCODES.includes(devPasscode.trim())) {
      setIsUnlocked(true);
      showToast('✓ Verified! Welcome to Developer Master License Issuer Portal.');
    } else {
      setAuthError('Maling Developer Passcode. Ang tool na ito ay eksklusibo sa Developer/Vendor lamang.');
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const key = generateProductKey({
      clientName,
      machineId: machineIdInput,
      licenseType,
      expiryDate: licenseType === 'Perpetual' ? '' : expiryDate
    });
    setGeneratedKey(key);
    showToast(`🔑 Product Key Generated for ${clientName}!`);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    showToast('Product Key copied to clipboard!');
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const salesMessageTemplate = ` Good day! Attached is your Official Product Activation Key for LOAN MANAGEMENT SYSTEM SOFTWARE.

Client/Business: ${clientName.toUpperCase()}
License Type: ${licenseType.toUpperCase()}
Target Machine ID: ${machineIdInput === 'ANY' ? 'All PCs (Unrestricted)' : machineIdInput}
Expiry: ${licenseType === 'Perpetual' ? 'Lifetime Perpetual (No Expiration)' : expiryDate}

🔑 YOUR PRODUCT ACTIVATION KEY:
${generatedKey}

Instructions:
1. Open Loan Management System Software
2. Click "Software License" or Activation Banner
3. Paste the Product Activation Key above and check the EULA agreement
4. Click "I-activate ang Product Key Now"

Developer Support Page: https://www.facebook.com/profile.php?id=61595073996579
Thank you for choosing LOAN MANAGEMENT SYSTEM!`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(salesMessageTemplate);
    setCopiedMsg(true);
    showToast('Customer Activation Email/SMS template copied!');
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="card w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b-4 border-amber-500">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                  Vendor & Software Reseller Tool
                </span>
                <h2 className="text-xl font-black text-white leading-tight">
                  Product Key Generator (License Issuer)
                </h2>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              ✕ Isara
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {!isUnlocked ? (
            /* Developer Lock Screen */
            <div className="space-y-5 py-2">
              <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/40 text-white space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <KeyRound className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                      Developer Security Portal
                    </span>
                    <h3 className="text-base font-black text-white">
                      Eksklusibong Access para sa Software Developer / Vendor
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Ang Product Key Generator ay para lamang sa <b>Software Developer (Seller)</b> para makapag-issue ng lisensya sa iyong mga buyers/clients. Hindi ito accessible sa mga ordinaryong Admin o Staff ng kumpanya upang maiwasan ang libreng pag-generate ng keys.
                </p>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-300 flex items-center justify-between">
                  <span>Developer Master Passcode:</span>
                  <code className="bg-amber-950 px-2 py-0.5 rounded text-amber-400 border border-amber-500/40 font-mono font-black">SIRTOY-DEV-2026</code>
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleDevUnlock} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-indigo-600" />
                    <span>I-pasok ang Developer Security Passcode *</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasscode ? 'text' : 'password'}
                      required
                      autoFocus
                      value={devPasscode}
                      onChange={e => setDevPasscode(e.target.value)}
                      placeholder="e.g. SIRTOY-DEV-2026"
                      className="w-full pl-3.5 pr-10 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-600 font-mono text-sm font-black text-slate-900 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDevPasscode('SIRTOY-DEV-2026')}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Auto-Fill Developer Code
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-300" />
                    <span>I-unlock ang Developer Key Generator</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Unlocked Product Key Generator Form */
            <>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-black text-emerald-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Authenticated as Software Developer / Reseller</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsUnlocked(false)}
                  className="text-[10px] underline font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  I-lock muli
                </button>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>Buyer / Company Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={e => setClientName(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-black text-slate-900 bg-white uppercase"
                  placeholder="e.g. LOAN MANAGEMENT INC"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span>License Type *</span>
                </label>
                <select
                  value={licenseType}
                  onChange={e => setLicenseType(e.target.value as LicenseType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-black text-slate-900 bg-white"
                >
                  <option value="Perpetual">Perpetual (Lifetime Buyout)</option>
                  <option value="Annual">Annual Subscription (1 Year)</option>
                  <option value="Monthly">Monthly Subscription (30 Days)</option>
                  <option value="Trial">Trial Demo (14 Days)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  <span>Buyer Machine ID (MID Binding)</span>
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={machineIdInput}
                    onChange={e => setMachineIdInput(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs font-black text-slate-900 bg-white uppercase"
                    placeholder="MID-XXXX-XXXX-XXXX-XXXX or ANY"
                  />
                  <div className="flex gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setMachineIdInput('ANY')}
                      className={`px-2 py-1 rounded font-bold ${machineIdInput === 'ANY' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                    >
                      ANY PC (Unbound)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMachineIdInput(currentMid)}
                      className={`px-2 py-1 rounded font-bold ${machineIdInput === currentMid ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                    >
                      Use Current PC MID
                    </button>
                  </div>
                </div>
              </div>

              {licenseType !== 'Perpetual' && (
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>License Expiration Date *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-black text-slate-900 bg-white"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Signed Product Activation Key</span>
            </button>
          </form>

          {/* Result Output Area */}
          {generatedKey && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white border border-amber-500/40 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Generated Product Key</span>
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  Cryptographically Signed
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm font-black text-amber-300 select-all tracking-wider break-all text-center">
                {generatedKey}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey ? 'Kopyado Na!' : 'Kopyahin ang Key'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {copiedMsg ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  <span>{copiedMsg ? 'Message Copied!' : 'Kopyahin ang Message Template'}</span>
                </button>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
