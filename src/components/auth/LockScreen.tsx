'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import {
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Shield,
  Sparkles,
  Unlock,
  Users,
} from 'lucide-react';

export const LockScreen: React.FC = () => {
  const {
    household,
    currentUser,
    users,
    setCurrentUser,
    unlockApp,
  } = useFinance();

  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passwordInput.trim()) {
      setErrorMsg('Masukkan password atau PIN terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    const res = unlockApp(passwordInput.trim());
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.message);
      setPasswordInput('');
    } else {
      setErrorMsg(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#EBF1F6] px-4 py-6 overflow-y-auto">
      {/* Decorative background blurs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-tr from-blue-400/20 via-indigo-400/20 to-purple-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm clay-card p-6 sm:p-8 bg-white/95 border border-white/80 shadow-clay-lg animate-in zoom-in-95 duration-300 text-center">
        {/* App Logo & Brand */}
        <div className="flex flex-col items-center space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-clay-primary to-indigo-600 flex items-center justify-center text-white shadow-clay-sm">
            <Lock className="w-7 h-7 drop-shadow" />
          </div>

          <div>
            <div className="flex items-center justify-center space-x-1.5">
              <h1 className="font-extrabold text-xl text-slate-800 tracking-tight">
                NEST<span className="text-clay-primary">.Finance</span>
              </h1>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full border border-indigo-200">
                v1.1
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              {household.name}
            </p>
          </div>
        </div>

        {/* Lock Title */}
        <div className="mt-5 space-y-1">
          <h2 className="text-base font-bold text-slate-800">
            Pembukuan Terkunci
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Masukkan Password atau PIN untuk membuka akses ke data keuangan keluarga Anda.
          </p>
        </div>

        {/* Switch User / Active Profile */}
        <div className="mt-4 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                currentUser.relationship === 'Suami' ? 'bg-blue-500' : 'bg-pink-500'
              }`}
            >
              {currentUser.display_name.charAt(0)}
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-slate-800 block leading-tight">
                {currentUser.display_name}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {currentUser.relationship} ({currentUser.role === 'OWNER' ? 'Kepala Keluarga' : 'Pasangan'})
              </span>
            </div>
          </div>

          {users.length > 1 && (
            <div className="flex space-x-1">
              {users.map((u) => {
                if (u.id === currentUser.id) return null;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setCurrentUser(u.id);
                      setErrorMsg(null);
                    }}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    Ganti ke {u.relationship}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Password Form */}
        <form onSubmit={handleUnlock} className="mt-5 space-y-4 text-left">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1 uppercase tracking-wider">
              Password / PIN Keamanan
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                placeholder="Masukkan PIN atau password..."
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl clay-inset text-sm font-semibold bg-white text-slate-800 transition ${
                  errorMsg ? 'border-2 border-rose-500 ring-2 ring-rose-200' : ''
                }`}
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-2.5"
                title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center animate-in shake">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full clay-button clay-button-primary py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2"
          >
            <Unlock className="w-4 h-4" />
            <span>Buka Pembukuan</span>
          </button>
        </form>

        {/* Security badge note */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Dilindungi Enkripsi &amp; Maker-Checker Keuangan</span>
        </div>
      </div>
    </div>
  );
};
