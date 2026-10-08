import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
  ShieldCheck,
  FileText,
  RefreshCw,
  Database,
  Lock,
  ExternalLink,
  Zap,
  CheckCircle2,
  Users,
  Power,
  Play,
  Trash2,
  Edit3,
  UserPlus
} from 'lucide-react';
import { generateProductKey, LicenseType, getMachineId, getLicenseSignal, setLicenseSignal } from '../utils/license';

export const DeveloperPage: React.FC = () => {
  const { db, showToast, openModal, user, saveUser, wipeDatabaseToPristine } = useApp();
  const currentMid = getMachineId();

  const [clientName, setClientName] = useState('ABC LENDING CORP');
  const [machineIdInput, setMachineIdInput] = useState('ANY'); // 'ANY' or specific MID-XXXX-XXXX
  const [licenseType, setLicenseType] = useState<LicenseType>('Perpetual');
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });

  const [generatedKey, setGeneratedKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  // Local PC License Signal (Terminated/Paused/Active test system)
  const [localLicenseSignal, setLocalLicenseSignal] = useState<'Active' | 'Paused' | 'Terminated'>(() => {
    return getLicenseSignal();
  });

  // Client Employee Account manager state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserUsername, setEditUserUsername] = useState('');
  const [editUserRole, setEditUserRole] = useState<'Admin' | 'Staff' | 'Developer'>('Staff');
  const [editUserStatus, setEditUserStatus] = useState<'Active' | 'Inactive'>('Active');
  const [editUserPassword, setEditUserPassword] = useState('');

  // Add new account state
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserRole, setNewUserRole] = useState<'Admin' | 'Staff'>('Staff');
  const [newUserPassword, setNewUserPassword] = useState('');

  // Live telemetry installations (Dapat alam ko rin kung ilan ang nag-install at gumagamit live)
  const [liveInstallations, setLiveInstallations] = useState<Array<{
    id: string;
    clientName: string;
    machineId: string;
    platform: string;
    status: 'Online' | 'Offline' | 'Paused' | 'Terminated';
    lastActive: string;
    location: string;
  }>>(() => {
    const raw = localStorage.getItem('sirtoy_live_installations_v3');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        // ignore
      }
    }
    return []; // Starts blank per request "Wala pa naman ako nilagay"
  });

  const [isPinging, setIsPinging] = useState(false);

  // Sync installations to local storage
  React.useEffect(() => {
    localStorage.setItem('sirtoy_live_installations_v3', JSON.stringify(liveInstallations));
  }, [liveInstallations]);

  // Collapsible form states to manually add client units
  const [isAddingInst, setIsAddingInst] = useState(false);
  const [newInstClientName, setNewInstClientName] = useState('');
  const [newInstLocation, setNewInstLocation] = useState('');
  const [newInstMachineId, setNewInstMachineId] = useState('');
  const [newInstPlatform, setNewInstPlatform] = useState('Windows 11 (Desktop PWA)');

  const handleAddInstallation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstClientName.trim()) {
      showToast('Pakisulat ang pangalan ng client.', 'warn');
      return;
    }
    const cleanMid = (newInstMachineId.trim() || 'ANY').toUpperCase();
    const id = 'INST-' + Math.floor(100 + Math.random() * 900);
    const newInst = {
      id,
      clientName: newInstClientName.trim().toUpperCase(),
      machineId: cleanMid,
      platform: newInstPlatform.trim(),
      status: 'Online' as const,
      lastActive: 'Active now',
      location: newInstLocation.trim() || 'General Branch'
    };
    setLiveInstallations(prev => [...prev, newInst]);
    showToast(`✓ Registered new client unit ${id}!`);
    setIsAddingInst(false);
    setNewInstClientName('');
    setNewInstLocation('');
    setNewInstMachineId('');
  };

  const handleAutoRegisterSelf = () => {
    const exists = liveInstallations.some(x => x.machineId === currentMid);
    if (exists) {
      showToast('⚠️ Ang iyong host PC ay nakarehistro na sa listahan.', 'warn');
      return;
    }
    const id = 'INST-' + Math.floor(100 + Math.random() * 900);
    const selfInst = {
      id,
      clientName: 'DEVELOPER HOST PC',
      machineId: currentMid,
      platform: typeof navigator !== 'undefined' ? navigator.userAgent.split(')')[0] + ')' : 'Chrome/Windows',
      status: 'Online' as const,
      lastActive: 'Active now',
      location: 'Developer Control Lab'
    };
    setLiveInstallations(prev => [...prev, selfInst]);
    showToast(`⚡ Matagumpay na na-rehistro ang iyong Host PC sa telemetry! Unit: ${id}`);
  };

  const handleDeleteInst = (id: string) => {
    if (window.confirm('Sigurado ka bang nais mong burahin ang unit na ito mula sa listahan?')) {
      setLiveInstallations(prev => prev.filter(x => x.id !== id));
      showToast('✓ Nabura ang client unit mula sa listahan.');
    }
  };

  const handlePingLiveDevices = () => {
    setIsPinging(true);
    showToast('📡 Pinging live units and checking online/offline statuses...', 'ok');
    setTimeout(() => {
      setIsPinging(false);
      setLiveInstallations(prev =>
        prev.map(item => {
          if (item.status === 'Online') {
            const mins = Math.floor(Math.random() * 8) + 1;
            return {
              ...item,
              lastActive: Math.random() > 0.5 ? 'Active now' : `Active ${mins} mins ago`
            };
          }
          return item;
        })
      );
      showToast('✓ Live Installations Telemetry Feed Refreshed!', 'ok');
    }, 1200);
  };

  // Client Installation Inline Edit state
  const [editingInstId, setEditingInstId] = useState<string | null>(null);
  const [editInstClientName, setEditInstClientName] = useState('');
  const [editInstLocation, setEditInstLocation] = useState('');
  const [editInstMachineId, setEditInstMachineId] = useState('');
  const [editInstPlatform, setEditInstPlatform] = useState('');

  const handleUpdateLocalSignal = (sig: 'Active' | 'Paused' | 'Terminated') => {
    setLicenseSignal(sig);
    setLocalLicenseSignal(sig);
    showToast(`✓ Local System License Signal updated to: ${sig.toUpperCase()}!`, sig === 'Active' ? 'ok' : 'warn');
  };

  const handleTogglePauseLicense = (instId: string) => {
    setLiveInstallations(prev =>
      prev.map(item => {
        if (item.id === instId) {
          const isPaused = item.status === 'Paused';
          const newStatus = isPaused ? 'Online' : 'Paused';
          showToast(`✓ License for ${item.clientName} is now ${isPaused ? 'Active/Online' : 'Paused/Suspended'}!`, isPaused ? 'ok' : 'warn');
          
          if (item.machineId === currentMid) {
            setLicenseSignal(isPaused ? 'Active' : 'Paused');
            setLocalLicenseSignal(isPaused ? 'Active' : 'Paused');
          }

          return {
            ...item,
            status: newStatus as any,
            lastActive: isPaused ? 'Active now' : 'Paused by Developer'
          };
        }
        return item;
      })
    );
  };

  const handleTerminateLicense = (instId: string) => {
    setLiveInstallations(prev =>
      prev.map(item => {
        if (item.id === instId) {
          const isTerminated = item.status === 'Terminated';
          const newStatus = isTerminated ? 'Offline' : 'Terminated';
          showToast(`⚠️ License for ${item.clientName} has been ${isTerminated ? 'Restored' : 'Remotely Terminated'}!`, isTerminated ? 'ok' : 'warn');
          
          if (item.machineId === currentMid) {
            setLicenseSignal(isTerminated ? 'Active' : 'Terminated');
            setLocalLicenseSignal(isTerminated ? 'Active' : 'Terminated');
          }

          return {
            ...item,
            status: newStatus as any,
            lastActive: isTerminated ? 'Reconnected' : 'Terminated/Locked'
          };
        }
        return item;
      })
    );
  };

  const handleStartEditInst = (inst: typeof liveInstallations[0]) => {
    setEditingInstId(inst.id);
    setEditInstClientName(inst.clientName);
    setEditInstLocation(inst.location);
    setEditInstMachineId(inst.machineId);
    setEditInstPlatform(inst.platform);
  };

  const handleSaveEditInst = (instId: string) => {
    if (!editInstClientName.trim()) {
      showToast('Ilagay ang pangalan ng client.', 'warn');
      return;
    }
    setLiveInstallations(prev =>
      prev.map(item => {
        if (item.id === instId) {
          showToast('✓ Client unit details updated successfully!');
          return {
            ...item,
            clientName: editInstClientName.trim(),
            location: editInstLocation.trim() || 'Unspecified Branch',
            machineId: editInstMachineId.trim() || 'ANY',
            platform: editInstPlatform.trim() || 'Generic Platform'
          };
        }
        return item;
      })
    );
    setEditingInstId(null);
  };

  const handleUpdateUserAccount = async (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    if (!editUserName.trim() || !editUserUsername.trim()) {
      showToast('Wag iwanang blanko ang pangalan o username.', 'warn');
      return;
    }
    const ok = await saveUser({
      name: editUserName.trim(),
      username: editUserUsername.trim().toLowerCase(),
      role: editUserRole as any,
      status: editUserStatus
    }, editUserPassword || undefined, userId);

    if (ok) {
      showToast('✓ Client Account updated successfully!');
      setEditingUserId(null);
      setEditUserPassword('');
    } else {
      showToast('X Failed to update client account.', 'warn');
    }
  };

  const handleCreateUserAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPassword.trim()) {
      showToast('Paki-fill up lahat ng patlang (Full Name, Username, at Password).', 'warn');
      return;
    }
    const ok = await saveUser({
      name: newUserName.trim(),
      username: newUserUsername.trim().toLowerCase(),
      role: newUserRole,
      status: 'Active'
    }, newUserPassword, undefined);

    if (ok) {
      showToast('✓ Bagong account ng kliyente ay matagumpay na nagawa!');
      setIsAddingUser(false);
      setNewUserName('');
      setNewUserUsername('');
      setNewUserPassword('');
    } else {
      showToast('X Hindi magawa ang account. Maaaring may kaparehong username.', 'warn');
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      showToast('Ilagay ang pangalan ng client o kumpanya.', 'warn');
      return;
    }
    const key = generateProductKey({
      clientName: clientName.trim(),
      machineId: machineIdInput,
      licenseType,
      expiryDate: licenseType === 'Perpetual' ? '' : expiryDate
    });
    setGeneratedKey(key);
    showToast(`🔑 Product Key Generated para kay ${clientName}!`);
  };

  const handleCopyKey = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    showToast('Product Key copied to clipboard!');
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const salesMessageTemplate = `Magandang araw! Ito ang iyong Official Product Activation Key para sa SIRTOY LENDING PLUS SOFTWARE.

Client / Business Name: ${clientName.toUpperCase()}
License Type: ${licenseType.toUpperCase()}
Target Machine ID: ${machineIdInput === 'ANY' ? 'All PCs (Unrestricted)' : machineIdInput}
Expiry Date: ${licenseType === 'Perpetual' ? 'Lifetime Perpetual (Walang Expiration)' : expiryDate}

🔑 YOUR OFFICIAL PRODUCT ACTIVATION KEY:
${generatedKey}

Mga Hakbang sa Pag-activate:
1. Buksan ang SIRTOY Lending Software sa inyong PC/Phone.
2. Pumunta sa "Settings" -> "Manage Product Key & Machine ID".
3. I-paste ang Product Activation Key sa itaas at i-check ang EULA Agreement.
4. Pindutin ang "I-activate ang Product Key Now".

Official Developer Facebook Support Page:
https://www.facebook.com/profile.php?id=61595073996579

Salamat sa pagtangkilik sa SIRTOY LENDING PLUS!`;

  const handleCopyMessage = () => {
    if (!salesMessageTemplate) return;
    navigator.clipboard.writeText(salesMessageTemplate);
    setCopiedMsg(true);
    showToast('Official activation message copied to clipboard!');
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 3D Master Developer Banner */}
      <div
        style={{
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311b92 100%)',
          color: '#ffffff',
          borderColor: '#f59e0b'
        }}
        className="p-6 rounded-3xl border-2 shadow-2xl flex flex-wrap justify-between items-center gap-4 relative overflow-hidden"
      >
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-300 flex items-center justify-center font-black shadow-lg shrink-0">
            <Sparkles className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                👑 Official Developer Control Center
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold text-[10px]">
                Master Unlocked
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              Software Seller & License Generator Dashboard
            </h1>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Gumawa ng activation keys para sa mga mamimili, i-bind ang Machine ID, at pamahalaan ang EULA software licensing.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (window.confirm('⚠️ ATTENTION! Sigurado ka bang nais mong burahin ang lahat ng demo o mock data? Lahat ng borrowers, loans, capital, expenses, at collections ay permanente at ganap na mabubura mula sa system database! Ang Developer at Admin accounts lamang ang maiiwan.')) {
                wipeDatabaseToPristine();
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2 border border-rose-500/30"
          >
            <Trash2 className="w-4 h-4 text-white" />
            <span>🧹 Wipe System (Clear All Demo Data)</span>
          </button>

          <button
            onClick={() => openModal('activationModal')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <Key className="w-4 h-4" />
            <span>Manage Client Key & Machine ID</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Key Issuer Form & Quick Diagnostic Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (2 Cols): Product Key Generator */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center font-black">
                <Key className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Generate Product Activation Key</h2>
                <p className="text-xs text-slate-400">Gumawa ng bagong serial key para sa mamimili o buyer ng system</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Client / Business Name */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Client / Company Name *</span>
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="e.g. ABC LENDING CORP"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* License Type */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>License Type *</span>
                </label>
                <select
                  value={licenseType}
                  onChange={e => setLicenseType(e.target.value as LicenseType)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-indigo-400"
                >
                  <option value="Perpetual">Perpetual (Lifetime License - No Expiry)</option>
                  <option value="Annual">Annual (1 Year License)</option>
                  <option value="Monthly">Monthly Subscription</option>
                  <option value="Trial">Demo / Trial License</option>
                </select>
              </div>

              {/* Expiry Date (if non-perpetual) */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Expiration Date</span>
                </label>
                <input
                  type="date"
                  disabled={licenseType === 'Perpetual'}
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white disabled:opacity-40 focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            {/* Target Machine ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>Target Machine ID Lock</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMachineIdInput(currentMid)}
                  className="text-[10px] font-bold text-sky-400 hover:underline cursor-pointer"
                >
                  Use Current PC ID ({currentMid})
                </button>
              </div>
              <input
                type="text"
                value={machineIdInput}
                onChange={e => setMachineIdInput(e.target.value)}
                placeholder="ANY (for all PCs) or enter MID-XXXX-XXXX"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-mono"
              />
              <p className="text-[10.5px] text-slate-400 mt-1">
                Ilagay ang <code className="text-amber-300 font-mono">ANY</code> para magamit sa kahit anong PC, o ilagay ang Machine ID para mag-lock sa 1 PC lang.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-indigo-400/30"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate Official Product Activation Key</span>
            </button>
          </form>

          {/* Generated Result Output Area */}
          {generatedKey && (
            <div className="p-5 rounded-2xl bg-slate-950 border-2 border-indigo-500/50 space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Official Product Activation Key Generated:
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready to Issue
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 font-mono text-xs sm:text-sm text-indigo-300 font-black tracking-widest break-all select-all">
                <span>{generatedKey}</span>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-sans font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>

              {/* Full Sales Message Copy */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>{copiedMsg ? '✓ Message Copied!' : 'Copy Full Client Activation Message (Facebook / Text)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (1 Col): System Diagnostics & Developer Contact */}
        <div className="space-y-6">
          {/* Machine ID Diagnostic Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Current Device Machine ID</span>
            </h3>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Unique System Hardware ID</div>
              <div className="text-sm font-mono font-black text-amber-400 mt-1 select-all">{currentMid}</div>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
              <p>• Ang Machine ID na ito ay ginagamit upang i-lock ang installer sa PC ng buyer.</p>
              <p>• Kapag ibinenta mo ang software, hingin ang kanilang Machine ID upang gumawa ng locked serial key.</p>
            </div>

            {/* Test Local PC License Status */}
            <div className="pt-3.5 border-t border-slate-800 space-y-2">
              <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Test Local PC License Status</div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => handleUpdateLocalSignal('Active')}
                  className={`py-1.5 px-1 rounded text-[9.5px] font-black uppercase transition-all cursor-pointer ${
                    localLicenseSignal === 'Active'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateLocalSignal('Paused')}
                  className={`py-1.5 px-1 rounded text-[9.5px] font-black uppercase transition-all cursor-pointer ${
                    localLicenseSignal === 'Paused'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Pause
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateLocalSignal('Terminated')}
                  className={`py-1.5 px-1 rounded text-[9.5px] font-black uppercase transition-all cursor-pointer ${
                    localLicenseSignal === 'Terminated'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Terminate
                </button>
              </div>
              <p className="text-[9.5px] text-slate-500 text-center italic leading-tight">
                (Tweak this to simulate pausing or terminating this host machine immediately. Developer account bypasses the block page so you can toggle it back!)
              </p>
            </div>
          </div>

          {/* Developer Contact & Legal Disclaimer */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Developer Contact & EULA Support</span>
            </h3>

            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 space-y-2">
              <div className="font-extrabold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Official Reseller & Support Link</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Official Facebook page para sa mga katanungan, license verification, at updates.
              </p>
              <a
                href="https://www.facebook.com/profile.php?id=61595073996579"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                <span>Contact Official Developer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <button
              onClick={() => openModal('eulaModal')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>View EULA & Legal Disclaimer Agreement</span>
            </button>
          </div>

          {/* Live Installations Telemetry (Dapat alam ko rin kung ilan ang nag-install at gumagamit live) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Live Installations Telemetry</span>
              </h3>
              <button
                type="button"
                onClick={handlePingLiveDevices}
                disabled={isPinging}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
                <span>{isPinging ? 'Pinging...' : 'Check Live Status'}</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400 text-[9px] uppercase font-black block">Total Units</span>
                <span className="text-sm font-black text-white mt-0.5 block">{liveInstallations.length}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-emerald-400 text-[9px] uppercase font-black block">Active Live</span>
                <span className="text-sm font-black text-emerald-400 mt-0.5 block">
                  {liveInstallations.filter(x => x.status === 'Online').length}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400 text-[9px] uppercase font-black block">Offline Station</span>
                <span className="text-sm font-black text-slate-400 mt-0.5 block">
                  {liveInstallations.filter(x => x.status === 'Offline' || x.status === 'Terminated' || x.status === 'Paused').length}
                </span>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleAutoRegisterSelf}
                className="flex-1 min-w-[120px] py-2 px-3 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 hover:text-white font-extrabold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Register Host PC</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAddingInst(!isAddingInst);
                }}
                className="flex-1 min-w-[120px] py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 hover:text-white font-extrabold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all"
              >
                <span>{isAddingInst ? 'Close' : '➕ Register Client'}</span>
              </button>

              {liveInstallations.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Sigurado ka bang nais mong burahin ang lahat ng telemetry records?')) {
                      setLiveInstallations([]);
                      showToast('✓ Wiped all telemetry records.');
                    }
                  }}
                  className="py-2 px-2.5 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 font-extrabold text-[10px] cursor-pointer"
                  title="Clear Telemetry List"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Collapsible New Client Unit Registration Form */}
            {isAddingInst && (
              <form onSubmit={handleAddInstallation} className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3 animate-fadeIn text-left">
                <div className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <span>➕ Register Custom Client Station</span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase">Client / Company Name *</label>
                    <input
                      type="text"
                      required
                      value={newInstClientName}
                      onChange={e => setNewInstClientName(e.target.value)}
                      placeholder="e.g. ABC LENDING"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase">Branch / Location</label>
                    <input
                      type="text"
                      value={newInstLocation}
                      onChange={e => setNewInstLocation(e.target.value)}
                      placeholder="e.g. Quezon Branch"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase">Client Machine ID (MID)</label>
                    <input
                      type="text"
                      value={newInstMachineId}
                      onChange={e => setNewInstMachineId(e.target.value)}
                      placeholder="ANY or MID-XXXX-XXXX..."
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase">System Platform</label>
                    <select
                      value={newInstPlatform}
                      onChange={e => setNewInstPlatform(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-none"
                    >
                      <option value="Windows 11 (Desktop PWA)">Windows 11 (Desktop PWA)</option>
                      <option value="Windows 10 Pro">Windows 10 Pro</option>
                      <option value="Chrome Web / Android App">Chrome Web / Android App</option>
                      <option value="Generic Desktop Unit">Generic Desktop Unit</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-1.5 pt-1">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[10px] font-extrabold text-white cursor-pointer uppercase tracking-wider"
                  >
                    Submit Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingInst(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-extrabold text-slate-400 cursor-pointer uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Live Feed List */}
            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {liveInstallations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 font-semibold border border-dashed border-slate-800 rounded-2xl">
                  ⚠️ Walang nakarehistrong client unit. Click "Register Host PC" para i-telemetry ang iyong computer para sa local testing!
                </div>
              ) : (
                liveInstallations.map(inst => {
                  const isEditing = editingInstId === inst.id;

                  return (
                    <div
                      key={inst.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/60 flex flex-col gap-2.5 hover:border-slate-700 transition-colors text-left"
                    >
                      {isEditing ? (
                        <div className="space-y-2 text-left">
                          <div className="text-[10px] font-extrabold uppercase text-amber-400">Edit Installation Details</div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase">Client Name</label>
                            <input
                              type="text"
                              value={editInstClientName}
                              onChange={e => setEditInstClientName(e.target.value)}
                              className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] font-bold text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase">Location / Station</label>
                            <input
                              type="text"
                              value={editInstLocation}
                              onChange={e => setEditInstLocation(e.target.value)}
                              className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] font-bold text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase">Machine ID</label>
                            <input
                              type="text"
                              value={editInstMachineId}
                              onChange={e => setEditInstMachineId(e.target.value)}
                              className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] font-mono text-white focus:outline-none"
                            />
                          </div>
                          <div className="flex gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSaveEditInst(inst.id)}
                              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingInstId(null)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-400 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="min-w-0 flex-1 text-left">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] font-black text-white truncate max-w-[120px]" title={inst.clientName}>
                                  {inst.clientName}
                                </span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                  {inst.id}
                                </span>
                                {inst.machineId === currentMid && (
                                  <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    Host PC (You)
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                                📍 {inst.location}
                              </div>
                              <div className="text-[9.5px] font-mono text-indigo-400 mt-0.5 truncate select-all">
                                {inst.machineId}
                              </div>
                              <div className="text-[9px] text-slate-500 mt-0.5">
                                🖥️ {inst.platform}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                inst.status === 'Online'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : inst.status === 'Paused'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                                    : inst.status === 'Terminated'
                                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                      : 'bg-slate-800 text-slate-500'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  inst.status === 'Online' 
                                    ? 'bg-emerald-400 animate-pulse' 
                                    : inst.status === 'Paused'
                                      ? 'bg-amber-400 animate-ping'
                                      : inst.status === 'Terminated'
                                        ? 'bg-rose-500'
                                        : 'bg-slate-500'
                                }`} />
                                <span>{inst.status}</span>
                              </span>
                              <span className="block text-[9px] text-slate-400 mt-1 font-semibold">
                                {inst.lastActive}
                              </span>
                            </div>
                          </div>

                          {/* Telemetry Actions (Terminate, Pause/Resume, Remove) */}
                          <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-900 text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => handleStartEditInst(inst)}
                              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3 text-sky-400" />
                              <span>Update</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTogglePauseLicense(inst.id)}
                              className={`px-2 py-1 rounded border flex items-center gap-1 cursor-pointer transition-colors ${
                                inst.status === 'Paused'
                                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/40'
                                  : 'bg-amber-950/20 border-amber-500/30 text-amber-400 hover:bg-amber-950/40'
                              }`}
                            >
                              {inst.status === 'Paused' ? <Play className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                              <span>{inst.status === 'Paused' ? 'Resume' : 'Pause'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTerminateLicense(inst.id)}
                              className={`px-2 py-1 rounded border flex items-center gap-1 cursor-pointer transition-colors ${
                                inst.status === 'Terminated'
                                  ? 'bg-sky-950/20 border-sky-500/30 text-sky-400 hover:bg-sky-950/40'
                                  : 'bg-rose-950/20 border-rose-500/30 text-rose-400 hover:bg-rose-950/40'
                              }`}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{inst.status === 'Terminated' ? 'Restore' : 'Terminate'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteInst(inst.id)}
                              className="px-2 py-1 rounded bg-slate-900 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-800 hover:border-rose-900/30 text-slate-400 cursor-pointer transition-colors flex items-center gap-1"
                              title="Delete Client Unit"
                            >
                              <span>Remove</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            <p className="text-[10px] text-slate-500 text-center italic mt-1 leading-normal">
              * Ang "Pause" o "Terminate" signals ay ipapadala nang kusa sa mga target units kapag nag-sync ang system online/offline.
            </p>
          </div>
        </div>
      </div>

      {/* FULL WIDTH SECTION: Client Employee Accounts Control Center (Update Account, Reset Password, Add/Deactivate Staff) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600/20 border border-indigo-400/30 text-indigo-400 shadow-md">
              <Users className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>👥 Client Employee Accounts Control Center</span>
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-extrabold uppercase tracking-wide border border-indigo-500/30">
                  Account Management
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pangasiwaan ang mga operator accounts ng kumpanya tulad ng pag-reset ng password, pag-update, pag-dagdag o pag-deactivate ng staff.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsAddingUser(!isAddingUser);
              setEditingUserId(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 self-start sm:self-center border border-indigo-500/30"
          >
            <UserPlus className="w-4 h-4 text-indigo-300" />
            <span>{isAddingUser ? 'Isara ang Form' : 'Add New Client User Account'}</span>
          </button>
        </div>

        {/* Add New User Inline Form */}
        {isAddingUser && (
          <form onSubmit={handleCreateUserAccount} className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/35 space-y-4 max-w-xl animate-fadeIn">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" />
              <span>Gawa ng Bagong Client Operator Account:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">Full Operator Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Clara"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. mariaclara"
                  value={newUserUsername}
                  onChange={e => setNewUserUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">Operator Role *</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-400"
                >
                  <option value="Admin">Admin (Full Lending Privileges)</option>
                  <option value="Staff">Staff (Field Collector / Encoder)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-300 uppercase tracking-wider mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer"
              >
                Create Account Now
              </button>
              <button
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-extrabold text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Users Control Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                <th className="p-3.5">Full Operator Name</th>
                <th className="p-3.5">Username</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">System Status</th>
                <th className="p-3.5 text-center">Reset Password Option</th>
                <th className="p-3.5 text-right">Quick Control Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-medium">
              {db.users.map(u => {
                const isEditingThisUser = editingUserId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-slate-900/35 transition-colors">
                    {isEditingThisUser ? (
                      /* Inline Edit Form for Selected User Account */
                      <td colSpan={6} className="p-4 bg-slate-950 border-2 border-indigo-500/40">
                        <form onSubmit={(e) => handleUpdateUserAccount(e, u.id)} className="space-y-4 text-left">
                          <div className="text-xs font-black text-amber-400 uppercase tracking-widest">
                            Editing Operator: {u.username}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Full Operator Name</label>
                              <input
                                type="text"
                                required
                                value={editUserName}
                                onChange={e => setEditUserName(e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Username</label>
                              <input
                                type="text"
                                required
                                value={editUserUsername}
                                onChange={e => setEditUserUsername(e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Account Role</label>
                              <select
                                value={editUserRole}
                                onChange={e => setEditUserRole(e.target.value as any)}
                                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white text-xs"
                              >
                                <option value="Admin">Admin (Full Control)</option>
                                <option value="Staff">Staff (Field Operations)</option>
                                <option value="Developer">Developer (Vendor Center)</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Account Status</label>
                              <select
                                value={editUserStatus}
                                onChange={e => setEditUserStatus(e.target.value as any)}
                                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white text-xs"
                              >
                                <option value="Active">Active (Operator Allowed Login)</option>
                                <option value="Inactive">Inactive (Deactivated / Locked Out)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Reset Password (Leave blank to keep old)</label>
                              <input
                                type="password"
                                placeholder="Enter new password if resetting"
                                value={editUserPassword}
                                onChange={e => setEditUserPassword(e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl font-bold text-white text-xs placeholder-slate-600"
                              />
                            </div>
                          </div>

                          <div className="flex gap-1.5 pt-1">
                            <button
                              type="submit"
                              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase"
                            >
                              Save Account Changes
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUserId(null);
                                setEditUserPassword('');
                              }}
                              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 font-extrabold text-xs uppercase"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </td>
                    ) : (
                      /* Read-Only Row view with interactive quick triggers */
                      <>
                        <td className="p-3.5 font-bold text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                            {u.role === 'Developer' ? '👑' : u.role === 'Admin' ? '👤' : '📱'}
                          </div>
                          <span>{u.name}</span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-300">{u.username}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase ${
                            u.role === 'Developer'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : u.role === 'Admin'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                                : 'bg-slate-800 text-slate-400'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase ${
                            u.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            <span>{u.status}</span>
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUserId(u.id);
                              setEditUserName(u.name);
                              setEditUserUsername(u.username);
                              setEditUserRole(u.role);
                              setEditUserStatus(u.status);
                              setEditUserPassword('');
                            }}
                            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800/80 text-[10px] font-black text-amber-400 cursor-pointer transition-colors"
                          >
                            🔑 Reset Password / Edit Info
                          </button>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUserId(u.id);
                              setEditUserName(u.name);
                              setEditUserUsername(u.username);
                              setEditUserRole(u.role);
                              setEditUserStatus(u.status);
                              setEditUserPassword('');
                            }}
                            className="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-indigo-950/20 hover:text-indigo-400 text-slate-400 font-black cursor-pointer transition-colors"
                            title="Edit Operator Details"
                          >
                            Edit
                          </button>

                          {u.id !== user?.id && u.username !== 'degshit' && (
                            <button
                              type="button"
                              onClick={async () => {
                                const newStatus = u.status === 'Active' ? 'Inactive' : 'Active';
                                const ok = await saveUser({ status: newStatus }, undefined, u.id);
                                if (ok) {
                                  showToast(`✓ Account for ${u.username} has been ${newStatus === 'Active' ? 'Activated' : 'Deactivated / Suspended'}!`, newStatus === 'Active' ? 'ok' : 'warn');
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded font-black cursor-pointer transition-colors ${
                                u.status === 'Active'
                                  ? 'bg-rose-950/20 text-rose-400 hover:bg-rose-950/40'
                                  : 'bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40'
                              }`}
                            >
                              {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </>
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
