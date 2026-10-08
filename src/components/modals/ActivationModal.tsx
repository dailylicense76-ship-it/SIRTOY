import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Key,
  ShieldCheck,
  Copy,
  Check,
  Cpu,
  Sparkles,
  ExternalLink,
  Award,
  Clock
} from 'lucide-react';
import {
  getMachineId,
  getStoredLicense,
  saveProductKey,
  removeProductKey,
  getEulaAcceptance,
  saveEulaAcceptance,
  LicenseInfo
} from '../../utils/license';

export const ActivationModal: React.FC = () => {
  const { closeModal, showToast, openModal, user } = useApp();

  const machineId = getMachineId();
  const initialLicense = getStoredLicense();
  const eulaState = getEulaAcceptance();

  const [productKeyInput, setProductKeyInput] = useState('');
  const [eulaAccepted, setEulaAccepted] = useState(eulaState.accepted);
  const [copiedMid, setCopiedMid] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo>(initialLicense);

  const handleCopyMachineId = () => {
    navigator.clipboard.writeText(machineId);
    setCopiedMid(true);
    showToast('✓ Machine ID copied! Ipadala ito sa developer para sa inyong activation key.');
    setTimeout(() => setCopiedMid(false), 2500);
  };

  const handleActivateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productKeyInput.trim()) {
      showToast('Mangyaring maglagay ng Product Key.', 'warn');
      return;
    }
    if (!eulaAccepted) {
      showToast('Paki-check ang EULA bago mag-activate.', 'warn');
      return;
    }

    const res = saveProductKey(productKeyInput);
    setLicenseInfo(res);

    if (res.isValid) {
      saveEulaAcceptance(user?.name || 'Administrator');
      showToast(`🎉 LICENSE ACTIVATED! Registered: ${res.clientName} (${res.licenseType}).`);
    } else {
      showToast(res.statusMessage, 'warn');
    }
  };

  const handleDeactivate = () => {
    if (window.confirm('Sigurado ka bang nais mong alisin ang kasalukuyang Product Key?')) {
      removeProductKey();
      const updated = getStoredLicense();
      setLicenseInfo(updated);
      setProductKeyInput('');
      showToast('Product Key removed.');
    }
  };

  const devFbUrl = 'https://www.facebook.com/profile.php?id=61595073996579';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Compact Header */}
        <div className={`px-4 py-3 text-white flex items-center justify-between bg-gradient-to-r ${
          licenseInfo.isValid
            ? 'from-slate-900 via-indigo-950 to-slate-900 border-b-2 border-emerald-500'
            : 'from-slate-900 via-rose-950 to-slate-900 border-b-2 border-amber-500'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${
              licenseInfo.isValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-tight">
                Software License Activation
              </h2>
              <span className="text-[10px] text-slate-300 font-semibold block">
                SIRTOY LENDING PLUS
              </span>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3.5">
          {/* Compact Active License Status Pill */}
          <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
            licenseInfo.isValid
              ? licenseInfo.isTrial
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              {licenseInfo.isTrial ? (
                <Clock className="w-4 h-4 text-amber-600 flex-none" />
              ) : licenseInfo.isValid ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-none" />
              ) : (
                <Key className="w-4 h-4 text-rose-600 flex-none" />
              )}
              <div className="min-w-0">
                <div className="text-[11px] font-black truncate">
                  {licenseInfo.isTrial
                    ? `7-Day Free Trial (${licenseInfo.daysLeft ?? 0} araw natitira)`
                    : licenseInfo.isValid
                    ? `Active: ${licenseInfo.clientName}`
                    : 'System Locked / Unlicensed'}
                </div>
                <div className="text-[10px] opacity-75 truncate">
                  {licenseInfo.licenseType === 'Perpetual'
                    ? 'Lifetime Perpetual'
                    : licenseInfo.expiresAt
                    ? `Expires: ${licenseInfo.expiresAt}`
                    : 'Requires Product Key'}
                </div>
              </div>
            </div>

            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-none ${
              licenseInfo.isValid
                ? licenseInfo.isTrial
                  ? 'bg-amber-200 text-amber-900'
                  : 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}>
              {licenseInfo.isTrial ? 'Trial' : licenseInfo.isValid ? 'Licensed' : 'Locked'}
            </span>
          </div>

          {/* Step 1: Device Machine ID (Compact) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-700">
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                <span>1. Hardware Machine ID (MID):</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">I-send sa Developer</span>
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                readOnly
                value={machineId}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 font-mono text-xs font-black text-slate-800 select-all"
              />
              <button
                type="button"
                onClick={handleCopyMachineId}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0 shadow-xs"
              >
                {copiedMid ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMid ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Step 2: Activation Form */}
          <form onSubmit={handleActivateKey} className="space-y-2.5 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>2. Ipasok ang Product Activation Key:</span>
              </label>
              <input
                type="text"
                required
                placeholder="SIR-PERP-CLIENT-XXXX-PERPETUAL-XXXXXX"
                value={productKeyInput}
                onChange={e => setProductKeyInput(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs font-black text-slate-900 bg-white uppercase tracking-wider focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Compact EULA checkbox */}
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2">
              <input
                type="checkbox"
                id="modalEulaCheck"
                checked={eulaAccepted}
                onChange={e => setEulaAccepted(e.target.checked)}
                className="mt-0.5 w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 cursor-pointer"
              />
              <label htmlFor="modalEulaCheck" className="text-[10px] text-slate-600 leading-tight cursor-pointer select-none">
                Sumasang-ayon ako sa <button type="button" onClick={() => openModal('eulaModal')} className="text-blue-600 underline font-bold">EULA Software Contract</button>. Ang aming kumpanya ang may buong pananagutan sa loan accounting at backups.
              </label>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                <span>I-activate ang Key</span>
              </button>

              {licenseInfo.isValid && !licenseInfo.isTrial && (
                <button
                  type="button"
                  onClick={handleDeactivate}
                  className="px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Alisin
                </button>
              )}
            </div>
          </form>

          {/* Developer Quick Contact & Master Link */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <a
              href={devFbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold hover:underline"
            >
              <span>Contact Developer (FB Support)</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {user?.role === 'Developer' && (
              <button
                type="button"
                onClick={() => openModal('keyGeneratorModal')}
                className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-800 font-bold cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Key Generator</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
