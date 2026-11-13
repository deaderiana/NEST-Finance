'use client';

import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatIDR } from '@/lib/ledgerEngine';
import { AccountScope, AccountType } from '@/types/finance';
import {
  Banknote,
  Check,
  Copy,
  Database,
  ExternalLink,
  Info,
  KeyRound,
  Landmark,
  Lock,
  Mail,
  MessageCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Share2,
  Shield,
  Sliders,
  Smartphone,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';

interface SettingsViewProps {
  onOpenRegisterModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenRegisterModal }) => {
  const {
    household,
    members,
    approvalPolicy,
    updateApprovalPolicy,
    resetAllData,
    addNewAccount,
    createInvitation,
    invitations,
    isPasswordSet,
    setAppPassword,
    removeAppPassword,
    lockApp,
  } = useFinance();

  const [thresholdInput, setThresholdInput] = useState(
    approvalPolicy.threshold_amount.toLocaleString('id-ID')
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Sync input value whenever approvalPolicy updates in context
  useEffect(() => {
    if (approvalPolicy && approvalPolicy.threshold_amount !== undefined) {
      setThresholdInput(approvalPolicy.threshold_amount.toLocaleString('id-ID'));
    }
  }, [approvalPolicy?.threshold_amount]);

  // Partner member lookup
  const partnerMember = members.find((m) => m.role === 'PARTNER');

  // Invite partner state
  const [inviteEmail, setInviteEmail] = useState(partnerMember?.email || '');
  const [inviteResult, setInviteResult] = useState<{
    message: string;
    link?: string;
    shareText?: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (partnerMember?.email && !inviteEmail) {
      setInviteEmail(partnerMember.email);
    }
  }, [partnerMember, inviteEmail]);

  // Security & Password state
  const [newPwdInput, setNewPwdInput] = useState('');
  const [oldPwdInput, setOldPwdInput] = useState('');
  const [pwdNotice, setPwdNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPwdInput.trim()) return;
    const res = setAppPassword(newPwdInput.trim());
    if (res.success) {
      setPwdNotice({ type: 'success', text: res.message });
      setNewPwdInput('');
      setOldPwdInput('');
      setIsChangingPwd(false);
    } else {
      setPwdNotice({ type: 'error', text: res.message });
    }
    setTimeout(() => setPwdNotice(null), 4000);
  };

  const handleRemovePassword = (e: React.FormEvent) => {
    e.preventDefault();
    const res = removeAppPassword(oldPwdInput.trim());
    if (res.success) {
      setPwdNotice({ type: 'success', text: res.message });
      setNewPwdInput('');
      setOldPwdInput('');
      setIsChangingPwd(false);
    } else {
      setPwdNotice({ type: 'error', text: res.message });
    }
    setTimeout(() => setPwdNotice(null), 4000);
  };

  // Quick Add Account state
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('BANK');
  const [accScope, setAccScope] = useState<AccountScope>('SHARED');
  const [accBal, setAccBal] = useState('');
  const [accNum, setAccNum] = useState('');
  const [accNotice, setAccNotice] = useState<string | null>(null);

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumStr = thresholdInput.replace(/[^0-9]/g, '');
    const num = parseInt(cleanNumStr, 10);
    if (!isNaN(num) && num >= 0) {
      const res = updateApprovalPolicy(num);
      setSaveMessage(res.message);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setSaveMessage(null);
      }, 4000);
    } else {
      setSaveMessage('Nominal ambang batas tidak valid.');
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setSaveMessage(null);
      }, 4000);
    }
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const emailToUse = inviteEmail.trim() || partnerMember?.email || 'istri@keluarga.id';
    const res = createInvitation(emailToUse);
    if (res.success) {
      setInviteResult({
        message: res.message,
        link: res.inviteLink,
        shareText: res.shareText,
      });
      setCopiedLink(false);
    } else {
      setInviteResult({ message: res.message });
    }
  };

  const handleCopyLink = () => {
    if (!inviteResult?.link) return;
    navigator.clipboard.writeText(inviteResult.link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleAddAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;
    const bal = parseInt(accBal.replace(/[^0-9]/g, ''), 10) || 0;
    const res = addNewAccount({
      name: accName.trim(),
      account_type: accType,
      scope: accScope,
      opening_balance: bal,
      account_number: accNum.trim() || undefined,
    });
    setAccNotice(res.message);
    setAccName('');
    setAccBal('');
    setAccNum('');
    setTimeout(() => setAccNotice(null), 4000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="font-bold text-base text-slate-800">Pengaturan Rumah Tangga</h3>
        <p className="text-xs text-slate-500">
          Konfigurasi data real keluarga, rekening, keamanan password, undangan pasangan, dan buku besar
        </p>
      </div>

      {/* BANNER PENDAFTARAN DATA RIIL */}
      <div className="clay-card p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-clay-sm shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-800">
                Gunakan Data Riil Keluarga Anda
              </h4>
              <p className="text-xs text-slate-600">
                Daftarkan akun dan nama pasangan Anda sendiri, masukkan rekening riil, dan bersihkan riwayat demo.
              </p>
            </div>
          </div>

          {onOpenRegisterModal && (
            <button
              onClick={onOpenRegisterModal}
              className="clay-button clay-button-income px-4 py-2 text-xs font-bold shadow-clay-income shrink-0"
            >
              + Buka Formulir Pendaftaran Riil
            </button>
          )}
        </div>
      </div>

      {/* Household & Couple Members Card */}
      <div className="clay-card p-5 bg-white/95 space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
          <Users className="w-4 h-4 text-clay-primary" />
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Profil Keluarga &amp; Anggota Terdaftar
          </h4>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 block">Nama Rumah Tangga</span>
          <strong className="text-sm text-slate-800">{household.name}</strong>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Mata Uang: IDR (Rupiah) · Zona Waktu: Asia/Jakarta · Maksimal Anggota: 2 (Model Pasangan v1.1)
          </p>
        </div>

        <div className="space-y-2 pt-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between"
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    m.relationship === 'Suami' ? 'bg-blue-500' : 'bg-pink-500'
                  }`}
                >
                  {m.display_name.charAt(0)}
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-800">{m.display_name}</h5>
                  <span className="text-[10px] text-slate-400">
                    Peran: {m.role === 'OWNER' ? 'Kepala Keluarga (Owner)' : 'Pasangan (Partner)'} · {m.relationship}
                    {m.email ? ` · ${m.email}` : ''}
                  </span>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  m.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {m.status === 'ACTIVE' ? 'Aktif' : 'Terundang'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* KEAMANAN & KUNCI APLIKASI (PASSWORD / PIN) */}
      <div className="clay-card p-5 bg-white/95 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Keamanan &amp; Kunci Aplikasi (PIN / Password)
            </h4>
          </div>
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              isPasswordSet
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-amber-100 text-amber-700 border border-amber-300'
            }`}
          >
            {isPasswordSet ? 'Aktif (Dilindungi Sandi)' : 'Belum Diatur'}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Amankan catatan keuangan, saldo rekening, dan riwayat transaksi rumah tangga Anda. Saat password aktif, aplikasi akan meminta kunci ini setiap kali dibuka di perangkat.
        </p>

        {pwdNotice && (
          <div
            className={`p-2.5 rounded-xl text-xs font-semibold ${
              pwdNotice.type === 'success'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}
          >
            {pwdNotice.text}
          </div>
        )}

        {isPasswordSet ? (
          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={lockApp}
                className="clay-button bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-xs font-bold flex items-center space-x-1.5 shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Kunci Layar Aplikasi Sekarang</span>
              </button>

              <button
                type="button"
                onClick={() => setIsChangingPwd(!isChangingPwd)}
                className="clay-button px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
              >
                {isChangingPwd ? 'Tutup Pengaturan' : 'Ubah / Hapus Password'}
              </button>
            </div>

            {isChangingPwd && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
                <form onSubmit={handleSavePassword} className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 block">
                    Ganti dengan Password / PIN Baru:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      required
                      placeholder="Password baru (min. 4 karakter)..."
                      value={newPwdInput}
                      onChange={(e) => setNewPwdInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800 font-semibold"
                    />
                    <button
                      type="submit"
                      className="clay-button clay-button-primary px-4 py-2 text-xs font-bold shrink-0"
                    >
                      Simpan Baru
                    </button>
                  </div>
                </form>

                <form onSubmit={handleRemovePassword} className="pt-2 border-t border-slate-200 space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 block">
                    Atau Nonaktifkan Password Keamanan:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      required
                      placeholder="Masukkan password saat ini..."
                      value={oldPwdInput}
                      onChange={(e) => setOldPwdInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800"
                    />
                    <button
                      type="submit"
                      className="clay-button clay-button-expense px-4 py-2 text-xs font-bold shrink-0"
                    >
                      Hapus Password
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSavePassword} className="flex flex-col sm:flex-row gap-2 pt-1">
            <input
              type="password"
              required
              placeholder="Atur PIN atau Password (min. 4 karakter)..."
              value={newPwdInput}
              onChange={(e) => setNewPwdInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800 font-semibold"
            />
            <button
              type="submit"
              className="clay-button clay-button-primary px-4 py-2 text-xs font-bold shrink-0 flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Aktifkan Password</span>
            </button>
          </form>
        )}
      </div>

      {/* Undangan Pasangan (PRD Section 6.1) */}
      <div className="clay-card p-5 bg-white/95 space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
          <Mail className="w-4 h-4 text-purple-600" />
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Undang Pasangan &amp; Sinkronisasi HP (PRD 6.1)
          </h4>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Kirimkan tautan sinkronisasi langsung ke WhatsApp atau email istri/pasangan Anda. Ketika pasangan membuka tautan ini di HP atau komputernya, ia akan <strong>langsung terhubung ke data riil keluarga {household.name}</strong> tanpa kembali ke akun demo.
        </p>

        <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            placeholder="Masukkan email pasangan..."
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800"
          />
          <button
            type="submit"
            className="clay-button clay-button-primary px-4 py-2 text-xs font-bold shrink-0 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Buat Tautan Undangan Riil</span>
          </button>
        </form>

        {inviteResult && (
          <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 text-xs space-y-3">
            <div className="flex items-start space-x-2.5">
              <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                ✓
              </div>
              <div>
                <p className="font-bold text-purple-950 text-xs sm:text-sm">
                  Tautan Sinkronisasi Riil Siap Dikirim!
                </p>
                <p className="text-[11px] text-purple-800 mt-0.5 leading-relaxed">
                  Tautan ini telah dipaketkan dengan rekening riil, anggaran, dan data {household.name}. Begitu istri membuka tautan ini di HP-nya, browsernya otomatis masuk sebagai Pasangan (Istri) dan membuka data riil bersama.
                </p>
              </div>
            </div>

            {inviteResult.link && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteResult.link}
                    className="flex-1 p-2 rounded-xl border border-purple-200 text-[11px] font-mono bg-white text-slate-700 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                      copiedLink
                        ? 'bg-emerald-600 text-white'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Tautan</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Direct WhatsApp Share button */}
                <div className="pt-1">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      inviteResult.shareText || inviteResult.link
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Kirim Langsung via WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tambah Rekening Riil Baru */}
      <div className="clay-card p-5 bg-white/95 space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
          <Wallet className="w-4 h-4 text-emerald-600" />
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Tambah Rekening Riil Tambahan
          </h4>
        </div>

        <p className="text-xs text-slate-600">
          Tambahkan rekening bank, dompet digital, atau kas tunai baru. Saldo awal akan otomatis diposting sebagai entri modal awal ke Buku Besar (*Opening Equity*).
        </p>

        {accNotice && (
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold">
            {accNotice}
          </div>
        )}

        <form onSubmit={handleAddAccountSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              required
              placeholder="Nama Bank / Akun (misal: BRI Simpedes)"
              value={accName}
              onChange={(e) => setAccName(e.target.value)}
              className="px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800"
            />
            <select
              value={accType}
              onChange={(e) => setAccType(e.target.value as any)}
              className="px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800"
            >
              <option value="BANK">Bank</option>
              <option value="E_WALLET">E-Wallet</option>
              <option value="CASH">Kas Tunai</option>
              <option value="SAVINGS">Tabungan</option>
            </select>
            <select
              value={accScope}
              onChange={(e) => setAccScope(e.target.value as any)}
              className="px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800"
            >
              <option value="SHARED">Rekening Bersama</option>
              <option value="PERSONAL">Rekening Pribadi</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Saldo Awal (Rp)"
              value={accBal}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                setAccBal(raw ? parseInt(raw, 10).toLocaleString('id-ID') : '');
              }}
              className="px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800 font-bold"
            />
            <input
              type="text"
              placeholder="Nomor Rekening (Opsional)"
              value={accNum}
              onChange={(e) => setAccNum(e.target.value)}
              className="px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="clay-button clay-button-primary px-4 py-1.5 text-xs font-bold"
            >
              + Simpan Rekening Baru
            </button>
          </div>
        </form>
      </div>

      {/* Approval Policy Form */}
      <div className="clay-card p-5 bg-white/95 space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
          <Shield className="w-4 h-4 text-amber-500" />
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Kebijakan Ambang Persetujuan (Approval Policy)
          </h4>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Setiap pengeluaran di atas batas nominal ini secara otomatis memerlukan persetujuan dari pasangan sebelum diposting ke saldo dan buku besar (Maker-Checker Invariant).
        </p>

        <form onSubmit={handleSavePolicy} className="space-y-3 pt-1">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Ambang Batas Persetujuan (IDR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 font-bold text-slate-400 text-xs">
                Rp
              </span>
              <input
                type="text"
                value={thresholdInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setThresholdInput(val ? parseInt(val, 10).toLocaleString('id-ID') : '');
                }}
                className="w-full pl-9 pr-3 py-2 rounded-xl clay-inset text-xs font-bold bg-white text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            {saveSuccess ? (
              <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveMessage || 'Kebijakan berhasil diperbarui!'}</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 font-medium">
                Nilai saat ini: <strong className="text-slate-800">{formatIDR(approvalPolicy.threshold_amount)}</strong>
              </span>
            )}

            <button
              type="submit"
              className="clay-button clay-button-primary px-4 py-1.5 text-xs font-bold shadow-clay-sm hover:scale-105 active:scale-95 transition-all"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>

      {/* Supabase Schema & Integration Info */}
      <div className="clay-card p-5 bg-white/95 space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
          <Database className="w-4 h-4 text-emerald-600" />
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Backend &amp; Migrasi Supabase
          </h4>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Aplikasi telah dirancang sepenuhnya kompatibel dengan skrip migrasi{' '}
          <code>NEST_Finance_Supabase_Migration_v1.1.sql</code> (PostgreSQL RLS, double-entry ledger, maker-checker triggers, dan 25 tabel entitas).
        </p>

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
          <p><strong>Database:</strong> Supabase PostgreSQL</p>
          <p><strong>Migration File:</strong> NEST_Finance_Supabase_Migration_v1.1.sql</p>
          <p><strong>Status RLS:</strong> Enforced on all household tables</p>
          <p><strong>Offline Sync:</strong> Active (IndexedDB / LocalStorage Cache)</p>
        </div>
      </div>

      {/* Reset Data Option */}
      <div className="clay-card p-5 bg-white/95 space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
          <RotateCcw className="w-4 h-4 text-slate-400" />
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Reset Data Uji Coba
          </h4>
        </div>

        <p className="text-xs text-slate-500">
          Kembalikan seluruh data transaksi, anggaran, rekening, dan saldo ke data awal bawaan PRD (Budi &amp; Siti).
        </p>

        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="clay-button px-4 py-2 bg-slate-100 text-slate-600 hover:text-rose-600 text-xs font-semibold"
          >
            Reset ke Data Awal Demo
          </button>
        ) : (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
            <p className="text-xs font-semibold text-rose-900">
              Yakin ingin mereset seluruh data kembali ke data demo Budi &amp; Siti?
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1 rounded-full text-xs text-slate-600 hover:bg-slate-200/60"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  resetAllData();
                  setShowResetConfirm(false);
                }}
                className="clay-button clay-button-expense px-3 py-1 text-xs font-bold"
              >
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
