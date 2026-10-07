import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-5 right-5 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl text-white font-bold text-xs shadow-2xl transition-all animate-bounce ${
        toast.type === 'warn' ? 'bg-amber-600 border border-amber-500' : 'bg-slate-900 border border-slate-700'
      }`}
    >
      {toast.type === 'warn' ? <AlertTriangle className="w-4 h-4 text-amber-200" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
      <span>{toast.message}</span>
    </div>
  );
};
