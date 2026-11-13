'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { AccountScope, AccountType, InitialAccountInput } from '@/types/finance';
import {
  AlertCircle,
  Banknote,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  KeyRound,
  Landmark,
  Lock,
  Plus,
  Shield,
  Smartphone,
  Trash2,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { registerHousehold } = useFinance();

  // Form states
  const [householdName, setHouseholdName] = useState('');
  const [primaryName, setPrimaryName] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [primaryRelationship, setPrimaryRelationship] = useState<'Suami' | 'Istri'>('Suami');

  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');

  const [wipeDemoData, setWipeDemoData] = useState(true);

  // Security password & confirmation
  const [securityPassword, setSecurityPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Accounts state
  const [accounts, setAccounts] = useState<InitialAccountInput[]>([
    {
      name: 'BCA Rekening Bersama',
      account_type: 'BANK',
      scope: 'SHARED',
      opening_balance: 10000000,
      account_number: '123-456-7890',
    },
    {
      name: 'Kas Dompet Tunai',
      account_type: 'CASH',
      scope: 'SHARED',
      opening_balance: 1500000,
    },
  ]);

  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('BANK');
  const [newAccScope, setNewAccScope] = useState<AccountScope>('SHARED');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccNumber, setNewAccNumber] = useState('');

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleAddAccount = () => {
    if (!newAccName.trim()) {
      setStatusMessage({ type: 'error', text: 'Nama rekening tidak boleh kosong' });
      return;
    }

    const bal = parseInt(newAccBalance.replace(/[^0-9]/g, ''), 10) || 0;
    setAccounts([
      ...accounts,
      {
        name: newAccName.trim(),
        account_type: newAccType,
        scope: newAccScope,
        opening_balance: bal,
        account_number: newAccNumber.trim() || undefined,
      },
    ]);

    // Reset account inputs
    setNewAccName('');
    setNewAccBalance('');
    setNewAccNumber('');
    setStatusMessage(null);
  };

  const handleRemoveAccount = (index: number) => {
    setAccounts(accounts.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!primaryName.trim()) {
      setStatusMessage({ type: 'error', text: 'Nama Anda wajib diisi' });
      return;
    }
    if (!householdName.trim()) {
      setStatusMessage({ type: 'error', text: 'Nama Rumah Tangga wajib diisi' });
      return;
    }
    if (accounts.length === 0) {
      setStatusMessage({ type: 'error', text: 'Daftarkan minimal 1 rekening atau dompet riil' });
      return;
    }

    // Password validation: if filled, check length and confirmation
    if (securityPassword.trim()) {
      if (securityPassword.trim().length < 4) {
        setStatusMessage({ type: 'error', text: 'Password / PIN minimal terdiri dari 4 digit/karakter' });
        return;
      }
      if (securityPassword.trim() !== confirmPassword.trim()) {
        setStatusMessage({ type: 'error', text: 'Konfirmasi password tidak cocok. Pastikan kedua kolom password sama.' });
        return;
      }
    }

    const partnerRel = primaryRelationship === 'Suami' ? 'Istri' : 'Suami';

    const res = registerHousehold({
      householdName: householdName.trim(),
      primaryUser: {
        name: primaryName.trim(),
        email: primaryEmail.trim() || `${primaryName.toLowerCase().replace(/\\s+/g, '')}@nest.local`,
        relationship: primaryRelationship,
      },
      partnerUser: partnerName.trim()
        ? {
            name: partnerName.trim(),
            email: partnerEmail.trim() || `${partnerName.toLowerCase().replace(/\\s+/g, '')}@nest.local`,
            relationship: partnerRel,
          }
        : undefined,
      accounts,
      wipeDemoData,
      securityPassword: securityPassword.trim() || undefined,
    });

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}

      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1800);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="clay-card bg-[#F4F7FB] max-w-2xl w-full max-h-[92vh] flex flex-col shadow-clay-lg relative overflow-hidden animate-in fade-in zoom-in-95">
        {/* Fixed/Sticky Header */}
        <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200/80 bg-[#F4F7FB]/95 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-clay-primary to-indigo-600 text-white flex items-center justify-center shadow-clay-sm shrink-0">
              <Users className="w-5 h-5 drop-shadow" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-800 leading-tight">
                Pendaftaran Akun Baru (Sign Up)
              </h3>
              <p className="text-xs text-slate-500">
                Atur identitas keluarga, rekening riil, dan password keamanan Anda
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-5">
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold flex items-center space-x-2 ${
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* SECTION 1: PROFIL KELUARGA & ANDA */}
            <div className="clay-card-flat p-4 bg-white/95 space-y-3">
              <div className="flex items-center space-x-2 pb-1 border-b border-slate-100">
                <User className="w-4 h-4 text-clay-primary" />
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  1. Profil Keluarga &amp; Anda (Owner)
                </h4>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Nama Rumah Tangga / Keluarga *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Keluarga Handoko &amp; Maya"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl clay-inset text-xs font-semibold text-slate-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Nama Lengkap Anda *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Handoko Pratama"
                    value={primaryName}
                    onChange={(e) => setPrimaryName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl clay-inset text-xs font-semibold text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Peran dalam Keluarga
                  </label>
                  <select
                    value={primaryRelationship}
                    onChange={(e) => setPrimaryRelationship(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl clay-inset text-xs font-semibold text-slate-800 bg-white"
                  >
                    <option value="Suami">Suami</option>
                    <option value="Istri">Istri</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Email Anda (Untuk Login &amp; Notifikasi)
                </label>
                <input
                  type="email"
                  placeholder="handoko@gmail.com"
                  value={primaryEmail}
                  onChange={(e) => setPrimaryEmail(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl clay-inset text-xs text-slate-800 bg-white"
                />
              </div>
            </div>

            {/* SECTION 2: DATA PASANGAN */}
            <div className="clay-card-flat p-4 bg-white/95 space-y-3">
              <div className="flex items-center space-x-2 pb-1 border-b border-slate-100">
                <Heart className="w-4 h-4 text-pink-500" />
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  2. Data Pasangan (Partner - Model Couple v1.1)
                </h4>
              </div>

              <p className="text-[11px] text-slate-500">
                Diperlukan untuk aturan <strong>Maker-Checker</strong> persetujuan transaksi di atas Rp 1 Juta.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Nama Pasangan ({primaryRelationship === 'Suami' ? 'Istri' : 'Suami'})
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Maya Anggraini"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl clay-inset text-xs font-semibold text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Email Pasangan
                  </label>
                  <input
                    type="email"
                    placeholder="maya@gmail.com"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl clay-inset text-xs text-slate-800 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: REKENING & SALDO AWAL RIIL */}
            <div className="clay-card-flat p-4 bg-white/95 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    3. Rekening &amp; Saldo Awal Riil ({accounts.length})
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400">
                  Diposting otomatis ke Buku Besar
                </span>
              </div>

              {/* Existing Accounts List */}
              <div className="space-y-2">
                {accounts.map((acc, index) => (
                  <div
                    key={index}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-700 shadow-sm">
                        {acc.account_type === 'CASH' ? (
                          <Banknote className="w-4 h-4 text-emerald-600" />
                        ) : acc.account_type === 'E_WALLET' ? (
                          <Smartphone className="w-4 h-4 text-purple-600" />
                        ) : (
                          <Landmark className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">{acc.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {acc.scope === 'SHARED' ? 'Bersama' : 'Pribadi'} · {acc.account_number || acc.account_type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-extrabold text-slate-800">
                        Rp {acc.opening_balance.toLocaleString('id-ID')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAccount(index)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg"
                        title="Hapus Rekening"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Add Account Form */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2">
                <span className="text-[11px] font-bold text-blue-900 block">
                  + Tambah Rekening Lainnya
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Nama Bank / E-Wallet (mis: BCA)"
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-blue-200 text-xs bg-white"
                  />
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value as any)}
                    className="px-3 py-1.5 rounded-lg border border-blue-200 text-xs bg-white"
                  >
                    <option value="BANK">Bank</option>
                    <option value="E_WALLET">E-Wallet</option>
                    <option value="CASH">Kas Tunai</option>
                    <option value="SAVINGS">Tabungan</option>
                  </select>
                  <select
                    value={newAccScope}
                    onChange={(e) => setNewAccScope(e.target.value as any)}
                    className="px-3 py-1.5 rounded-lg border border-blue-200 text-xs bg-white"
                  >
                    <option value="SHARED">Rekening Bersama</option>
                    <option value="PERSONAL">Rekening Pribadi</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Saldo Awal (Rp)"
                    value={newAccBalance}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      setNewAccBalance(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-blue-200 text-xs bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Nomor Rekening (Opsional)"
                    value={newAccNumber}
                    onChange={(e) => setNewAccNumber(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-blue-200 text-xs bg-white"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddAccount}
                    className="clay-button px-3.5 py-1.5 bg-blue-600 text-white text-xs font-bold shadow-sm"
                  >
                    + Tambahkan ke Daftar
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 4: PASSWORD / PIN KEAMANAN */}
            <div className="clay-card-flat p-4 bg-white/95 space-y-3 border-2 border-indigo-100">
              <div className="flex items-center space-x-2 pb-1 border-b border-slate-100">
                <Lock className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  4. Password / PIN Keamanan Aplikasi
                </h4>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Tetapkan password pembuka aplikasi. Agar lebih pasti dan tidak salah ketik, masukkan password pada kedua kolom di bawah ini (minimal 4 karakter atau angka).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Password / PIN Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimal 4 karakter..."
                      value={securityPassword}
                      onChange={(e) => setSecurityPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 rounded-xl clay-inset text-xs font-semibold text-slate-800 bg-white"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1.5"
                      title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Konfirmasi Password / PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Ketik ulang password..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-9 pr-10 py-2 rounded-xl clay-inset text-xs font-semibold text-slate-800 bg-white transition ${
                        confirmPassword && confirmPassword !== securityPassword
                          ? 'border-2 border-rose-500'
                          : confirmPassword && confirmPassword === securityPassword
                          ? 'border-2 border-emerald-500'
                          : ''
                      }`}
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    {confirmPassword && confirmPassword === securityPassword && (
                      <span className="absolute right-3 top-2.5 text-emerald-600 text-xs font-bold flex items-center">
                        ✓ Cocok
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5: OPSI DATA RIIL BERSIH */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wipeDemoData}
                  onChange={(e) => setWipeDemoData(e.target.checked)}
                  className="mt-0.5 rounded text-clay-primary focus:ring-clay-primary w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Mulai dari Nol (Bersihkan Seluruh Riwayat Transaksi Demo)
                  </span>
                  <span className="text-[11px] text-slate-500 leading-snug block mt-0.5">
                    Centang untuk memulai pencatatan keuangan riil keluarga Anda tanpa tercampur data transaksi fiktif Budi &amp; Siti sebelumnya.
                  </span>
                </div>
              </label>
            </div>

            {/* Submit Action Button */}
            <div className="pt-2 pb-3">
              <button
                type="submit"
                className="w-full clay-button clay-button-primary py-3 text-sm font-bold shadow-clay-primary flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan &amp; Aktifkan Akun Riil Sekarang</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
