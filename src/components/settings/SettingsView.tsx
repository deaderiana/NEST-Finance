'use client';

import React, { useState } from 'react';
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
  Landmark,
  Mail,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Shield,
  Sliders,
  Smartphone,
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
  } = useFinance();

  const [thresholdInput, setThresholdInput] = useState(
    approvalPolicy.threshold_amount.toLocaleString('id-ID')
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Invite partner state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteResult, setInviteResult] = useState<{ message: string; link?: string } | null>(null);

  // Quick Add Account state
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('BANK');
  const [accScope, setAccScope] = useState<AccountScope>('SHARED');
  const [accBal, setAccBal] = useState('');
  const [accNum, setAccNum] = useState('');
  const [accNotice, setAccNotice] = useState<string | null>(null);

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(thresholdInput.replace(/[^0-9]/g, ''), 10);
    if (num > 0) {
      updateApprovalPolicy(num);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    const res = createInvitation(inviteEmail.trim());
    if (res.success) {
      setInviteResult({ message: res.message, link: res.inviteLink });
      setInviteEmail('');
    } else {
      setInviteResult({ message: res.message });
    }
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
          Konfigurasi data real keluarga, rekening, undangan pasangan, dan buku besar
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

      {/* Undangan Pasangan (PRD Section 6.1) */}
      <div className="clay-card p-5 bg-white/95 space-y-3">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
          <Mail className="w-4 h-4 text-purple-600" />
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Undang Pasangan Bergabung (Token Hash PRD 6.1)
          </h4>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Kirimkan tautan undangan satu-kali-pakai (*single-use token*) kepada pasangan Anda. Tautan kedaluwarsa otomatis dalam 7 hari.
        </p>

        <form onSubmit={handleSendInvite} className="flex gap-2">
          <input
            type="email"
            placeholder="Masukkan email pasangan..."
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800"
          />
          <button
            type="submit"
            className="clay-button clay-button-primary px-4 py-2 text-xs font-bold shrink-0"
          >
            Kirim Undangan
          </button>
        </form>

        {inviteResult && (
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs space-y-1">
            <p className="font-semibold text-purple-900">{inviteResult.message}</p>
            {inviteResult.link && (
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={inviteResult.link}
                  className="flex-1 p-1.5 rounded-lg border border-purple-200 text-[10px] font-mono bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteResult.link!);
                    alert('Tautan undangan berhasil disalin!');
                  }}
                  className="px-2 py-1 bg-purple-600 text-white rounded-lg text-xs font-bold"
                >
                  Salin
                </button>
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
              <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                <Check className="w-4 h-4" />
                <span>Kebijakan berhasil diperbarui!</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                Nilai saat ini: {formatIDR(approvalPolicy.threshold_amount)}
              </span>
            )}

            <button
              type="submit"
              className="clay-button clay-button-primary px-4 py-1.5 text-xs font-bold"
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
