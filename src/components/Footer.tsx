import React from 'react';
import { ExternalLink, ShieldCheck, FileText, Key } from 'lucide-react';
import { useApp } from '../context/AppContext';
import sirtoyLogo from '../assets/images/sirtoy_logo_1791375971616.jpg';

interface FooterProps {
  variant?: 'light' | 'dark';
}

export const Footer: React.FC<FooterProps> = ({ variant = 'light' }) => {
  const { openModal } = useApp();
  const isDark = variant === 'dark';
  const devFbUrl = "https://www.facebook.com/profile.php?id=61595333360264";

  return (
    <footer
      className={`w-full py-3 px-4 sm:px-6 border-t flex-none transition-colors duration-200 z-30 ${
        isDark
          ? 'bg-slate-950/95 border-slate-800 text-slate-200 shadow-2xl backdrop-blur-md'
          : 'bg-slate-900 border-slate-800 text-slate-100 shadow-xl'
      }`}
    >
      <div className="max-w-[1650px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Left: System Identification & Security Badge */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
          <img
            src={sirtoyLogo}
            alt="SIRTOY Logo"
            className="w-5 h-5 object-contain rounded bg-white p-0.5 shadow-sm flex-none"
          />
          <span className="font-extrabold tracking-wide text-white text-xs sm:text-sm">
            SIRTOY LENDING PLUS, INC.
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="hidden sm:inline text-slate-300 font-medium text-xs">
            Universal Offline Desktop Edition
          </span>
          <span className="text-slate-600 hidden md:inline">•</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-none" />
            Data Encrypted & Secured Locally
          </span>
        </div>

        {/* Right: EULA Terms & Official Developer Facebook Link */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end">
          <button
            onClick={() => openModal('eulaModal')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all cursor-pointer border border-slate-700"
            title="View End User License Agreement & Financial Liability Terms"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>EULA & Terms</span>
          </button>

          <button
            onClick={() => openModal('activationModal')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 transition-all cursor-pointer"
            title="Manage Software License & Machine ID Activation"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Software License</span>
          </button>

          <span className="text-slate-600 hidden sm:inline">•</span>

          <a
            href={devFbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-blue-500/30 border border-blue-400/50 group cursor-pointer"
            title="Open System Developer Facebook Profile (id=61595333360264)"
          >
            {/* Facebook Brand Icon */}
            <svg className="w-4 h-4 fill-current text-white flex-none" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="tracking-wide">Contact Developer</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-200 group-hover:text-white group-hover:translate-x-0.5 transition-transform flex-none" />
          </a>
        </div>
      </div>
    </footer>
  );
};
