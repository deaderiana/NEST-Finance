'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { OverviewCards } from '@/components/dashboard/OverviewCards';
import { PendingApprovalBanner } from '@/components/dashboard/PendingApprovalBanner';
import { AccountsSection } from '@/components/dashboard/AccountsSection';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { RegisterModal } from '@/components/auth/RegisterModal';
import { BudgetView } from '@/components/budgets/BudgetView';
import { GoalsView } from '@/components/goals/GoalsView';
import { ReportsView } from '@/components/reports/ReportsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { LockScreen } from '@/components/auth/LockScreen';
import { CheckCircle2, KeyRound, Lock, Sparkles, UserPlus, X } from 'lucide-react';

export default function Home() {
  const {
    activeTab,
    welcomeNotice,
    dismissWelcomeNotice,
    isPasswordSet,
    isLocked,
    household,
  } = useFinance();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // If password lock is active and app is locked, render security LockScreen with Sign Up access
  if (isPasswordSet && isLocked) {
    return (
      <>
        <LockScreen onOpenSignUp={() => setIsRegisterModalOpen(true)} />
        {/* Modal SignUp can be opened from LockScreen */}
        <RegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
        />
      </>
    );
  }

  // Check if current data is default demo data
  const isDemoAccount = household.id === 'hh-pratama-rahma';

  return (
    <div className="min-h-screen flex flex-col bg-[#EBF1F6] text-slate-800 pb-24 w-full max-w-full overflow-x-hidden">
      {/* Top Header with Registration Action */}
      <Header onOpenRegisterModal={() => setIsRegisterModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 py-3 sm:py-6 overflow-x-hidden">
        {/* Welcome Notice Banner for Partner joining via Invitation Link */}
        {welcomeNotice && (
          <div className="clay-card p-4 sm:p-5 bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-blue-500/15 border-2 border-emerald-400/80 mb-4 sm:mb-6 flex items-start justify-between gap-3 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-emerald-950">
                  🎉 Selamat Datang, {welcomeNotice.partnerName}!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800 mt-1 leading-relaxed">
                  Anda telah terhubung ke pembukuan riil keluarga <strong>{welcomeNotice.householdName}</strong>. Seluruh rekening bersama, saldo, dan aturan persetujuan Maker-Checker telah disinkronkan langsung ke perangkat Anda.
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100/90 text-emerald-800 text-[11px] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Mode Pasangan (Istri) Aktif · Data Riil Bersama
                </div>
              </div>
            </div>
            <button
              onClick={dismissWelcomeNotice}
              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition shrink-0"
              title="Tutup pemberitahuan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* PROMINENT LANDING SIGNUP / SETUP PASSWORD CALL-TO-ACTION (DASHBOARD ONLY) */}
        {activeTab === 'dashboard' && (
          <div className="clay-card p-4 sm:p-5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-600 text-white shadow-clay-lg relative overflow-hidden mb-4 sm:mb-6 animate-in fade-in">
            {/* Background glowing orbs */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-teal-400/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{isDemoAccount ? 'Mulai Pembukuan Riil' : 'Keamanan & Akun'}</span>
                </div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {isDemoAccount
                    ? 'Daftar Akun Keluarga Riil & Atur Password Anda'
                    : `Pembukuan ${household.name} Aktif`}
                </h2>
                <p className="text-xs sm:text-sm text-indigo-100 max-w-xl leading-relaxed">
                  {isDemoAccount
                    ? 'Buat akun Anda dan pasangan, daftarkan rekening bank / dompet riil, dan tetapkan password keamanan agar pembukuan tidak terbuka sembarangan.'
                    : isPasswordSet
                    ? 'Aplikasi Anda sudah dilindungi Password/PIN keamanan dan aturan Maker-Checker.'
                    : 'Aplikasi belum memiliki password pembuka. Atur password keamanan sekarang agar catatan keuangan terlindungi.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-white text-indigo-800 hover:bg-indigo-50 font-extrabold text-xs shadow-md transition flex items-center gap-2 hover:scale-105 active:scale-95"
                >
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  <span>{isDemoAccount ? 'Buat Akun / Sign Up' : 'Daftar Ulang / Ganti Data'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Overview & Liquidity Balance */}
            <OverviewCards />

            {/* Maker-Checker Pending Approvals Banner */}
            <PendingApprovalBanner />

            {/* Accounts & E-Wallets Segmentation */}
            <AccountsSection />

            {/* Recent Transactions List with Reversal capability */}
            <RecentTransactions />
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <PendingApprovalBanner />
            <RecentTransactions />
          </div>
        )}

        {activeTab === 'budgets' && (
          <div className="animate-in fade-in duration-300">
            <BudgetView />
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="animate-in fade-in duration-300">
            <GoalsView />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="animate-in fade-in duration-300">
            <ReportsView />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-in fade-in duration-300">
            <SettingsView onOpenRegisterModal={() => setIsRegisterModalOpen(true)} />
          </div>
        )}
      </main>

      {/* Floating Add Transaction Modal */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Registration & Real Household Onboarding Modal with Password */}
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />

      {/* Bottom Sticky Navigation */}
      <BottomNav onOpenAddModal={() => setIsAddModalOpen(true)} />
    </div>
  );
}
