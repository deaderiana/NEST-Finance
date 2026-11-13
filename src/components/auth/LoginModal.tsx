'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  X,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSignUp?: () => void;
  onSuccessLogin?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onOpenSignUp,
  onSuccessLogin,
}) => {
  const { login } = useFinance();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setStatusMessage({ type: 'error', text: 'Masukkan email akun yang terdaftar.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const res = login(email.trim(), password.trim());
    setIsSubmitting(false);

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        onClose();
        if (onSuccessLogin) onSuccessLogin();
      }, 900);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleQuickDemoLogin = (demoRole: 'budi' | 'siti') => {
    const demoEmail = demoRole === 'budi' ? 'budi@nest.local' : 'siti@nest.local';
    const res = login(demoEmail, '');
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        onClose();
        if (onSuccessLogin) onSuccessLogin();
      }, 700);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in">
      <div className="clay-card bg-[#F4F7FB] max-w-md w-full flex flex-col shadow-clay-lg relative overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 bg-[#F4F7FB]/95 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-clay-primary to-indigo-600 text-white flex items-center justify-center shadow-clay-sm shrink-0">
              <LogIn className="w-5 h-5 drop-shadow" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-800 leading-tight">
                Masuk ke Akun Anda
              </h3>
              <p className="text-xs text-slate-500">
                Akses pembukuan keuangan keluarga Anda
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Email Anda / Akun Terdaftar
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Contoh: nama@gmail.com..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl clay-inset text-xs sm:text-sm font-semibold text-slate-800 bg-white placeholder:font-normal placeholder:text-slate-400"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-600 block">
                  Password / PIN Keamanan
                </label>
                <span className="text-[10px] text-slate-400">Minimal 4 karakter</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password atau PIN akun Anda..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl clay-inset text-xs sm:text-sm font-semibold text-slate-800 bg-white placeholder:font-normal placeholder:text-slate-400"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-2"
                  title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full clay-button clay-button-primary py-3 text-sm font-extrabold shadow-clay-primary flex items-center justify-center space-x-2 transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk ke Dashboard'}</span>
            </button>
          </form>

          {/* Switch to Sign Up */}
          {onOpenSignUp && (
            <div className="pt-2 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-500 mb-2">Belum memiliki akun keluarga?</p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSignUp();
                }}
                className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center justify-center space-x-1.5"
              >
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>Buat Akun Baru (Sign Up)</span>
              </button>
            </div>
          )}

          {/* Quick Demo Option */}
          <div className="pt-2 text-center border-t border-slate-200">
            <span className="text-[11px] text-slate-400 block mb-2 font-medium">
              Atau coba akun demo cepat:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('budi')}
                className="flex-1 py-1.5 px-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700 transition"
              >
                Demo: Budi (Suami)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('siti')}
                className="flex-1 py-1.5 px-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-700 transition"
              >
                Demo: Siti (Istri)
              </button>
            </div>
          </div>

          {/* Security Assurance */}
          <div className="flex items-center justify-center space-x-1.5 text-[10px] text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Data keluarga dienkripsi dan terisolasi per akun</span>
          </div>
        </div>
      </div>
    </div>
  );
};
