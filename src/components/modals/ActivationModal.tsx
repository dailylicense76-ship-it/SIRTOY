import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Key,
  ShieldCheck,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  Lock,
  Cpu,
  Building2,
  Calendar,
  Sparkles,
  ExternalLink,
  Award
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
  const [copiedKey, setCopiedKey] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo>(initialLicense);

  const handleCopyMachineId = () => {
    navigator.clipboard.writeText(machineId);
    setCopiedMid(true);
    showToast('Machine ID copied to clipboard! Ibigay ito sa developer para sa inyong product key.');
    setTimeout(() => setCopiedMid(false), 2500);
  };

  const handleActivateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productKeyInput.trim()) {
      showToast('Mangyaring maglagay ng Product Key.', 'warn');
      return;
    }
    if (!eulaAccepted) {
      showToast('Kailangang basahin at i-check ang EULA & Liability Disclaimer bago mag-activate.', 'warn');
      return;
    }

    const res = saveProductKey(productKeyInput);
    setLicenseInfo(res);

    if (res.isValid) {
      saveEulaAcceptance(user?.name || 'Administrator');
      showToast(`🎉 LICENSE ACTIVATED SUCCESSFULLY! Sworn under ${res.clientName} (${res.licenseType}).`);
    } else {
      showToast(res.statusMessage, 'warn');
    }
  };

  const handleDeactivate = () => {
    if (window.confirm('Sigurado ka bang nais mong alisin ang kasalukuyang Product Key at ibalik sa Demo/Unlicensed mode?')) {
      removeProductKey();
      const updated = getStoredLicense();
      setLicenseInfo(updated);
      setProductKeyInput('');
      showToast('Product Key removed.');
    }
  };

  const devFbUrl = 'https://www.facebook.com/profile.php?id=61595333360264';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="card w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header Banner */}
        <div className={`p-6 text-white bg-gradient-to-r ${
          licenseInfo.isValid
            ? 'from-emerald-900 via-slate-900 to-indigo-950 border-b-4 border-emerald-500'
            : 'from-slate-900 via-amber-950 to-slate-950 border-b-4 border-amber-500'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`p-3.5 rounded-2xl ${
                licenseInfo.isValid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}>
                <Award className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 block">
                  Commercial Software Activation & Legal Registration
                </span>
                <h2 className="text-xl font-black text-white leading-tight">
                  Software License & Anti-Piracy Protection
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
          {/* Active License Status Box */}
          <div className={`p-4 rounded-2xl border ${
            licenseInfo.isValid
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : 'bg-amber-50/80 border-amber-300 text-amber-950'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className={`w-6 h-6 ${licenseInfo.isValid ? 'text-emerald-600' : 'text-amber-600'}`} />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">
                    {licenseInfo.isValid ? '✓ Registered & Active License' : '⚠️ Demo / Unregistered License'}
                  </div>
                  <div className="text-sm font-black text-slate-900">
                    {licenseInfo.clientName} ({licenseInfo.licenseType})
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                  licenseInfo.isValid ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                }`}>
                  {licenseInfo.licenseType === 'Perpetual' ? 'Lifetime Perpetual' : licenseInfo.expiresAt ? `Expires: ${licenseInfo.expiresAt}` : 'Trial Mode'}
                </span>
              </div>
            </div>

            <p className="text-xs font-semibold mt-2.5 pt-2 border-t border-slate-200/60 leading-relaxed">
              {licenseInfo.statusMessage}
            </p>
          </div>

          {/* Step 1: Buyer's Unique Machine ID */}
          <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>Inyong PC Hardware Machine ID (MID):</span>
              </label>
              <span className="text-[10px] text-slate-500 font-bold">Unique to this computer</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={machineId}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-mono text-xs font-black text-slate-800 shadow-inner select-all"
              />
              <button
                type="button"
                onClick={handleCopyMachineId}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {copiedMid ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedMid ? 'Na-kopyang MID!' : 'Kopyahin ang MID'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              💡 <b>Paano bibili ng Key:</b> Kopyahin ang Machine ID sa itaas at ipadala sa opisyal na developer sa Facebook para makuha ang inyong opisyal na Product Activation Key.
            </p>
          </div>

          {/* Activation Form */}
          <form onSubmit={handleActivateKey} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                <span>Ipasok ang inyong Product Key (Product Activation Code) *</span>
              </label>
              <input
                type="text"
                placeholder="SIR-PERP-CLIENT-ALLPC-PERPETUAL-XXXXXX"
                value={productKeyInput}
                onChange={e => setProductKeyInput(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 font-mono text-sm font-black text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm uppercase tracking-wider"
              />
            </div>

            {/* Mandatory EULA & Legal Liability Agreement Checkbox */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-300 space-y-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="eulaAcceptCheckbox"
                  checked={eulaAccepted}
                  onChange={e => setEulaAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 text-amber-600 rounded border-amber-400 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="eulaAcceptCheckbox" className="text-xs font-extrabold text-slate-800 leading-relaxed cursor-pointer select-none">
                  Sumasang-ayon ako sa <button type="button" onClick={() => openModal('eulaModal')} className="text-blue-700 underline hover:text-blue-900 font-black">End User License Agreement (EULA)</button> at kinikilala na ang system na ito ay tool lamang. Ang aming kumpanya ang may buong responsibilidad sa accuracy ng loan computation, billing, at data backups.
                </label>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => openModal('eulaModal')}
                  className="text-amber-900 hover:text-amber-950 font-black flex items-center gap-1.5 underline cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Basahin ang Buong EULA & Liability Agreement Contract</span>
                </button>

                {eulaState.accepted && (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    ✓ EULA Signed by {eulaState.acceptedBy || 'Admin'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>I-activate ang Product Key Now</span>
              </button>

              {licenseInfo.isValid && (
                <button
                  type="button"
                  onClick={handleDeactivate}
                  className="px-4 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  Alisin ang Key
                </button>
              )}
            </div>
          </form>

          {/* Admin Product Key Generator Link (Visible to Developer Users Only) */}
          {user?.role === 'Developer' && (
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-medium">
                🛡️ <b>Developer Master Tools:</b> Maaari kang mag-generate ng Product Keys para sa mga customer/buyers.
              </div>
              <button
                type="button"
                onClick={() => openModal('keyGeneratorModal')}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Open Key Generator Tool</span>
              </button>
            </div>
          )}

          {/* Contact Developer Card */}
          <div className="p-4 rounded-2xl bg-blue-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div>
              <div className="text-xs font-black uppercase text-blue-200">Official Software Developer</div>
              <div className="text-sm font-black text-white">SIRTOY LENDING PLUS Support & Sales</div>
            </div>
            <a
              href={devFbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <span>Contact Developer on Facebook</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
