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
import { CheckCircle2, X } from 'lucide-react';

export default function Home() {
  const {
    activeTab,
    welcomeNotice,
    dismissWelcomeNotice,
    isPasswordSet,
    isLocked,
  } = useFinance();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // If password lock is active and app is locked, render security LockScreen
  if (isPasswordSet && isLocked) {
    return <LockScreen />;
  }

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

      {/* Registration & Real Household Onboarding Modal */}
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />

      {/* Bottom Sticky Navigation */}
      <BottomNav onOpenAddModal={() => setIsAddModalOpen(true)} />
    </div>
  );
}
