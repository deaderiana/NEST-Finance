'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Heart,
  KeyRound,
  LayoutDashboard,
  Lock,
  PlusCircle,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Smartphone,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';

interface LandingPageViewProps {
  onGoToDashboard: () => void;
  onOpenSignUp: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onGoToDashboard,
  onOpenSignUp,
}) => {
  const { household, isPasswordSet } = useFinance();
  const isDemoAccount = household.id === 'hh-pratama-rahma';

  return (
    <div className="min-h-screen flex flex-col bg-[#EBF1F6] text-slate-800 overflow-x-hidden">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#EBF1F6]/95 backdrop-blur-md px-3 sm:px-6 py-3 border-b border-white/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-clay-primary to-indigo-600 flex items-center justify-center text-white shadow-clay-sm shrink-0">
              <Shield className="w-5 h-5 drop-shadow" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 whitespace-nowrap">
                <span className="font-extrabold text-base sm:text-lg text-slate-800 tracking-tight leading-none">
                  NEST<span className="text-clay-primary">.Finance</span>
                </span>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full border border-indigo-200">
                  v1.1
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                Sistem Keuangan Pasangan Terpercaya
              </p>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <button
              onClick={onGoToDashboard}
              className="clay-button px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-indigo-600 transition flex items-center space-x-1.5"
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="hidden xs:inline">Masuk</span>
              <span>Dashboard</span>
            </button>

            <button
              onClick={onOpenSignUp}
              className="clay-button clay-button-primary px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold shadow-clay-primary flex items-center space-x-1.5 shrink-0 hover:scale-105 active:scale-95"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>Daftar (Sign Up)</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative px-3 sm:px-6 pt-6 sm:pt-12 pb-12 sm:pb-16 overflow-hidden">
        {/* Decorative blur elements */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-br from-indigo-200/40 via-blue-200/30 to-teal-100/30 blur-3xl pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4 sm:space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-clay-sm border border-indigo-100 text-indigo-700 text-xs font-extrabold uppercase tracking-wider animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Dual-Control Maker-Checker Pasangan v1.1</span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Kelola Keuangan Keluarga Lebih <span className="text-clay-primary">Terbuka</span>,{' '}
            <span className="text-emerald-600">Harmonis</span>, &amp; Terlindungi
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Aplikasi pembukuan rumah tangga berpasangan pertama dengan sistem persetujuan transaksi (*Maker-Checker*).
            Transaksi besar wajib disetujui pasangan sebelum saldo terpotong, menjaga transparansi tanpa rasa curiga.
          </p>

          {/* Primary CTA Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <button
              onClick={onOpenSignUp}
              className="w-full sm:w-auto flex-1 clay-button clay-button-primary py-3.5 px-6 text-sm sm:text-base font-extrabold shadow-clay-primary flex items-center justify-center space-x-2 hover:scale-105 active:scale-95 transition"
            >
              <UserPlus className="w-5 h-5 text-emerald-300" />
              <span>Daftar Akun Baru (Sign Up)</span>
            </button>

            <button
              onClick={onGoToDashboard}
              className="w-full sm:w-auto flex-1 clay-button py-3.5 px-6 text-sm sm:text-base font-bold text-slate-700 hover:text-indigo-600 transition flex items-center justify-center space-x-2"
            >
              <LayoutDashboard className="w-5 h-5 text-indigo-600" />
              <span>{isDemoAccount ? 'Coba Demo Dashboard' : 'Buka Dashboard'}</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-3xl mx-auto text-left">
            <div className="clay-card-flat p-2.5 sm:p-3 bg-white/80 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold text-slate-700 leading-tight">
                Maker-Checker &gt; Rp 1 Juta
              </span>
            </div>

            <div className="clay-card-flat p-2.5 sm:p-3 bg-white/80 flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold text-slate-700 leading-tight">
                Sinkronisasi Suami &amp; Istri
              </span>
            </div>

            <div className="clay-card-flat p-2.5 sm:p-3 bg-white/80 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold text-slate-700 leading-tight">
                Kunci PIN &amp; Password
              </span>
            </div>

            <div className="clay-card-flat p-2.5 sm:p-3 bg-white/80 flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold text-slate-700 leading-tight">
                Rekening Bersama &amp; Pribadi
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION PENDAFTARAN / SIGN UP PROMINENT CARD */}
      <section className="px-3 sm:px-6 py-8 bg-white/60 border-y border-white">
        <div className="max-w-4xl mx-auto">
          <div className="clay-card p-5 sm:p-8 bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white shadow-clay-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold tracking-wide uppercase border border-emerald-400/30">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Mulai Pembukuan Riil Anda</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Pendaftaran Akun Baru Keluarga (Sign Up)
                </h2>
                <p className="text-xs sm:text-sm text-indigo-100 max-w-xl leading-relaxed">
                  Daftarkan nama keluarga Anda, atur rekening awal (BCA, Mandiri, BRI, GoPay, Tunai),
                  tentukan identitas Suami &amp; Istri, serta amankan aplikasi dengan Password/PIN.
                </p>
              </div>

              <div className="shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={onOpenSignUp}
                  className="w-full md:w-auto clay-button py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-sm sm:text-base shadow-lg transition flex items-center justify-center space-x-2 hover:scale-105 active:scale-95"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Isi Formulir Pendaftaran</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FITUR UTAMA & KEUNGGULAN SISTEM */}
      <section className="px-3 sm:px-6 py-12 sm:py-16 max-w-6xl mx-auto w-full">
        <div className="text-center space-y-2 mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight">
            Kenapa Pasangan Memilih NEST.Finance?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Dirancang khusus untuk menghilangkan keraguan dan pertengkaran keuangan dengan pembukuan ganda yang adil dan transparan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Maker Checker */}
          <div className="clay-card p-5 sm:p-6 bg-white space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-clay-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-800">
              Persetujuan Pasangan (Maker-Checker)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pengeluaran di atas ambang batas (default: Rp 1.000.000) otomatis berstatus &quot;Menunggu Persetujuan&quot;.
              Saldo rekening tidak akan terpotong sampai pasangan Anda meninjau dan menekan tombol Setujui.
            </p>
          </div>

          {/* Card 2: 3 Pilar Rekening */}
          <div className="clay-card p-5 sm:p-6 bg-white space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-clay-sm">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-800">
              Rekening Bersama &amp; Rekening Pribadi
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pisahkan uang belanja dapur (Rekening Bersama) dengan tabungan pribadi Suami dan Istri.
              Total kekayaan likuid terkonsolidasi secara rapi dalam Buku Besar Berimbang.
            </p>
          </div>

          {/* Card 3: Link Sinkronisasi WhatsApp */}
          <div className="clay-card p-5 sm:p-6 bg-white space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-clay-sm">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-slate-800">
              Tautkan HP Pasangan via WhatsApp
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tidak perlu mengulang pembuatan akun! Cukup bagikan link undangan khusus langsung ke WhatsApp pasangan Anda.
              Data rekening dan aturan Maker-Checker langsung terhubung di ponselnya.
            </p>
          </div>
        </div>
      </section>

      {/* 5. CARA KERJA DALAM 3 LANGKAH */}
      <section className="px-3 sm:px-6 py-10 bg-white/70 border-t border-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-lg sm:text-2xl font-black text-slate-800">
              3 Langkah Mudah Menggunakan NEST.Finance
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Hanya butuh 2 menit untuk menyiapkan pembukuan keluarga Anda
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="clay-card-flat p-4 bg-white space-y-2 text-center sm:text-left">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center mx-auto sm:mx-0">
                1
              </div>
              <h4 className="font-bold text-sm text-slate-800">Daftar Akun Baru</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Isi nama Anda, nama pasangan, dan rekening bank atau dompet riil yang digunakan.
              </p>
            </div>

            <div className="clay-card-flat p-4 bg-white space-y-2 text-center sm:text-left">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center mx-auto sm:mx-0">
                2
              </div>
              <h4 className="font-bold text-sm text-slate-800">Undang Pasangan</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kirim link sinkronisasi ke WhatsApp pasangan agar pasangan bisa membuka pembukuan di ponselnya.
              </p>
            </div>

            <div className="clay-card-flat p-4 bg-white space-y-2 text-center sm:text-left">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center mx-auto sm:mx-0">
                3
              </div>
              <h4 className="font-bold text-sm text-slate-800">Catat &amp; Setujui</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Catat pengeluaran harian. Transaksi besar otomatis diverifikasi bersama dengan notifikasi instan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="mt-auto py-6 px-4 border-t border-slate-200 bg-[#E5ECF2] text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-700">NEST.Finance v1.1</span>
            <span>·</span>
            <span>Pembukuan Keluarga Harmonis &amp; Transparan</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenSignUp}
              className="font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              Sign Up
            </button>
            <button
              onClick={onGoToDashboard}
              className="font-bold text-indigo-600 hover:text-indigo-800 transition"
            >
              Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
