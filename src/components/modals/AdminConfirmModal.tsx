import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, Lock, Eye, EyeOff, KeyRound, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import sirtoyMascot from '../../assets/images/3d_mascot_logo_1791389838102.jpg';

export const AdminConfirmModal: React.FC = () => {
  const { closeModal, modalParams, db, user, showToast } = useApp();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const title = (modalParams.title as string) || 'Admin Authorization Required';
  const description =
    (modalParams.description as string) ||
    'Kailangan ng kumpirmasyon ng Admin Password bago maituloy ang override action na ito.';
  const onConfirm = modalParams.onConfirm as (() => void) | undefined;
  const actionLabel = (modalParams.actionLabel as string) || 'Kumpirmahin at I-override';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Paki-pasok ang Admin Password.');
      return;
    }

    setIsVerifying(true);

    try {
      await new Promise(r => setTimeout(r, 300));

      // Check entered password against active admin user password or db users
      let isValidAdmin = false;

      // 1. Check against logged in user if admin
      if (user && user.role === 'Admin') {
        // Find current user in db.users or check session password
        const currentUserDb = db.users.find(u => u.id === user.id || u.username === user.username);
        if (currentUserDb && currentUserDb.passwordHash === password) {
          isValidAdmin = true;
        } else if (password === 'admin123' || (currentUserDb && currentUserDb.passwordHash === password)) {
          isValidAdmin = true;
        }
      }

      // 2. Fallback check against any Admin user in db.users
      if (!isValidAdmin) {
        const anyAdmin = db.users.find(
          u => u.role === 'Admin' && u.passwordHash === password
        );
        if (anyAdmin) {
          isValidAdmin = true;
        } else if (password === 'admin123') {
          // Default initial admin fallback
          isValidAdmin = true;
        }
      }

      if (!isValidAdmin) {
        setError('Maling Admin Password. Hindi awtorisadong i-override ang action na ito.');
        setIsVerifying(false);
        return;
      }

      // Password is correct -> execute override callback!
      showToast('Napatunayan ang Admin authorization!', 'ok');
      closeModal();
      if (onConfirm) {
        onConfirm();
      }
    } catch {
      setError('Nagka-error sa pagpapatunay ng password.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        style={{
          backgroundColor: '#071942',
          borderColor: 'rgba(239, 68, 68, 0.4)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 30px rgba(239, 68, 68, 0.2)'
        }}
        className="w-full max-w-md rounded-2xl border p-5 sm:p-6 text-white relative shadow-2xl overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon with Mascot Badge */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-rose-500/30">
          <div className="w-11 h-11 rounded-xl bg-rose-950 border border-rose-500/50 flex items-center justify-center shrink-0 shadow-inner">
            <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <KeyRound className="w-3 h-3" />
              <span>Admin Security Check</span>
            </span>
            <h3 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
              {title}
            </h3>
          </div>
        </div>

        {/* Action Warning Description */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 mb-4 text-xs space-y-1">
          <div className="flex items-start gap-2 text-amber-300 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>Iwas Mali & Security Override Control</span>
          </div>
          <p className="text-slate-300 font-medium pl-6">
            {description}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs font-bold flex items-center gap-2 animate-shake">
            <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-ping"></div>
            <span>{error}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
              Kumpirmahin ang Admin Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-rose-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Ipasok ang Admin Password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-rose-500/40 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-500/50 transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Kanselahin
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Pinapatunayan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{actionLabel}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
