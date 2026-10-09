import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Zap,
  TrendingUp,
  Award,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

import sirtoyMascot from '../assets/images/3d_mascot_logo_1791389838102.jpg';
import sirtoyMascotFull from '../assets/images/sirtoy_mascot_logo_1791379374197.jpg';
import sirtoyLogo from '../assets/images/sirtoy_logo_1791375971616.jpg';

export const LoginPage: React.FC = () => {
  const { db, login, setupInitialAdmin, openModal } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);

  // Clear credentials on mount to prevent browser auto-fill as requested by the user
  React.useEffect(() => {
    const runClear = () => {
      setUsername('');
      setPassword('');
    };
    runClear();
    const t1 = setTimeout(runClear, 50);
    const t2 = setTimeout(runClear, 150);
    const t3 = setTimeout(runClear, 300);
    const t4 = setTimeout(runClear, 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  // Initial setup admin state if no users exist
  const [saName, setSaName] = useState('');
  const [saUser, setSaUser] = useState('');
  const [saPass, setSaPass] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const ok = await login(username, password);
      if (!ok) {
        setError('Invalid username or password. Please verify your credentials.');
      }
    } catch {
      setError('An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!saName.trim() || !saUser.trim() || saPass.length < 6) {
      setError('Enter full name, username, and password of at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await setupInitialAdmin(saName, saUser, saPass);
      if (!ok) {
        setError('Failed to setup initial administrator account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const noUsersExist = db.users.length === 0;

  return (
    <div
      style={{
        backgroundColor: '#030c22',
        backgroundImage:
          'radial-gradient(circle at 80% 20%, #0d286d 0%, #05143a 45%, #020818 100%)'
      }}
      className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden text-white font-sans select-none"
    >
      {/* Full-Screen High-Resolution SIRTOY Mascot Background Image Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <img
          src={sirtoyMascot}
          alt="SIRTOY Mascot Background"
          className="w-full h-full object-cover object-center opacity-25 filter blur-[2px] scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#020818] via-[#05143a]/85 to-[#0d286d]/70"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 75% 30%, rgba(13, 40, 109, 0.4) 0%, rgba(2, 8, 24, 0.85) 100%)'
          }}
        ></div>
      </div>

      {/* Subtle Financial Background Ambient Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20 z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] bg-sky-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        ></div>
      </div>

      {/* Main Content Container: Compact Auto-Adjusting Rectangular Split Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-4 lg:p-6 max-w-4xl mx-auto w-full">
        <div
          style={{
            backgroundColor: 'rgba(7, 25, 66, 0.92)',
            borderColor: 'rgba(59, 130, 246, 0.35)',
            backdropFilter: 'blur(24px)',
            boxShadow:
              '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 30px rgba(11, 99, 246, 0.2)'
          }}
          className="w-full max-w-3xl rounded-2xl border overflow-hidden flex flex-col md:flex-row items-stretch my-auto shadow-2xl transition-all duration-300"
        >
          {/* LEFT SIDE: Compact Auto-Adjusting Login Form (50% on Desktop) */}
          <div className="w-full md:w-1/2 p-4 sm:p-5 lg:p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-blue-500/20 bg-slate-950/50">
            {/* Brand Header with Loan Management System Emblem */}
            <div className="flex items-center gap-2.5 mb-3.5 pb-3 border-b border-blue-500/20">
              <div className="w-10 h-10 rounded-lg bg-slate-900 p-0.5 border border-amber-400/50 shadow-md shrink-0 flex items-center justify-center overflow-hidden group">
                <img
                  src={sirtoyMascot}
                  alt="Loan Management System 3D Logo"
                  className="w-full h-full object-cover rounded group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black tracking-tight leading-tight text-amber-400">
                  LOAN MANAGEMENT SYSTEM
                </h1>
                <p className="text-[9.5px] font-bold tracking-wider uppercase text-sky-300/80 mt-0.5 flex items-center gap-1">
                  <span>Fast</span>
                  <span className="text-amber-400">·</span>
                  <span>Easy</span>
                  <span className="text-amber-400">·</span>
                  <span>Secure</span>
                </p>
              </div>
            </div>

            {/* Greeting */}
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Welcome Back!
              </h2>
              <p className="text-xs font-medium text-slate-300 mt-0.5">
                Please login to your account to continue.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-950/90 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-2 animate-shake shadow-md">
                <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-ping"></div>
                <span>{error}</span>
              </div>
            )}

            {/* Form Content */}
            {!isSetupMode && !noUsersExist ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                {/* Username Input - Compact & Auto-Adjusting */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-400">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      required
                      name="sirtoy_username_secure_key"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Enter username"
                      autoComplete="one-time-code"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/90 border border-blue-500/30 text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Password Input - Compact & Auto-Adjusting */}
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      name="sirtoy_password_secure_key"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoComplete="new-password"
                      className="w-full pl-9 pr-9 py-2 rounded-lg bg-slate-900/90 border border-blue-500/30 text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Main Gradient Login Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    backgroundImage:
                      'linear-gradient(135deg, #0b63f6 0%, #2563eb 50%, #1d4ed8 100%)'
                  }}
                  className="w-full py-2.5 px-5 rounded-lg font-black text-xs uppercase tracking-wider text-white border border-blue-400/40 shadow-md hover:shadow-blue-500/30 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>LOGIN NOW</span>
                      <LogIn className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                {/* Security Badge & Developer Portal Link Below Button */}
                <div className="pt-1.5 flex flex-col items-center justify-center gap-1.5 text-[10.5px]">
                  <div className="flex items-center gap-2 font-semibold text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Secure Access</span>
                    <span className="text-slate-600">•</span>
                    <span>Authorized Personnel Only</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openModal('keyGeneratorModal')}
                    className="mt-0.5 px-3 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/30 text-amber-300 font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>🔒 Software Developer / Reseller Key Issuer</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Admin Initial Setup Mode Fallback */
              <form onSubmit={handleSetupSubmit} className="space-y-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-400/30 text-xs text-amber-200 font-semibold">
                  Initialize the primary Administrator account for your system.
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={saName}
                    onChange={e => setSaName(e.target.value)}
                    placeholder="e.g. System Admin"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-blue-500/30 text-xs font-bold text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={saUser}
                    onChange={e => setSaUser(e.target.value)}
                    placeholder="admin"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-blue-500/30 text-xs font-bold text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={saPass}
                    onChange={e => setSaPass(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-blue-500/30 text-xs font-bold text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all"
                >
                  Create Administrator
                </button>

                {!noUsersExist && (
                  <button
                    type="button"
                    onClick={() => setIsSetupMode(false)}
                    className="w-full text-center text-xs font-bold text-slate-400 hover:underline"
                  >
                    Return to Standard Login
                  </button>
                )}
              </form>
            )}
          </div>

          {/* RIGHT SIDE: Side-by-Side 3D Mascot Visual Panel (50% on Desktop) */}
          <div className="w-full md:w-1/2 p-5 sm:p-6 lg:p-7 flex flex-col justify-between items-center relative bg-gradient-to-br from-blue-950/40 via-slate-900/60 to-blue-900/30 min-h-[300px]">
            {/* Top Feature Badges Bar */}
            <div className="w-full flex items-center justify-end gap-2 flex-wrap">
              <div className="px-2.5 py-1 rounded-full bg-blue-950/80 border border-blue-400/30 backdrop-blur-md flex items-center gap-1.5 text-[10px] font-bold text-blue-200 shadow-sm">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Safe Transactions</span>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-blue-950/80 border border-blue-400/30 backdrop-blur-md flex items-center gap-1.5 text-[10px] font-bold text-blue-200 shadow-sm">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Fast Processing</span>
              </div>
            </div>

            {/* Central Mascot Container */}
            <div className="relative w-full max-w-sm flex items-center justify-center group my-3">
              {/* Radial Aura Glow behind Mascot */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/35 via-amber-400/25 to-sky-400/25 rounded-full blur-2xl scale-95 transition-transform duration-500 group-hover:scale-105"></div>

              {/* Exact Uploaded SIRTOY 3D Mascot Logo Image */}
              <div className="relative z-10 w-full flex items-center justify-center p-1">
                <img
                  src={sirtoyMascotFull}
                  alt="Loan Management System Official 3D Mascot Logo"
                  className="w-full h-auto max-h-[310px] sm:max-h-[350px] object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)] hover:scale-[1.03] transition-transform duration-300"
                />
              </div>
            </div>

            {/* Bottom Tagline Overlay */}
            <div className="text-center w-full">
              <p
                style={{
                  fontFamily: 'Georgia, serif',
                  textShadow: '0 2px 8px rgba(0,0,0,0.8)'
                }}
                className="text-lg sm:text-xl font-normal italic tracking-wide text-white"
              >
                Your Trusted Lending Partner
              </p>
              <div className="w-24 h-0.5 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full mx-auto mt-1.5 shadow-sm"></div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
