'use client';

import React, { useEffect, useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { OverviewCards } from '@/components/dashboard/OverviewCards';
import { PendingApprovalBanner } from '@/components/dashboard/PendingApprovalBanner';
import { AccountsSection } from '@/components/dashboard/AccountsSection';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { RegisterModal } from '@/components/auth/RegisterModal';
import { LoginModal } from '@/components/auth/LoginModal';
import { DeviceSyncModal } from '@/components/auth/DeviceSyncModal';
import { BudgetView } from '@/components/budgets/BudgetView';
import { GoalsView } from '@/components/goals/GoalsView';
import { ReportsView } from '@/components/reports/ReportsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { LockScreen } from '@/components/auth/LockScreen';
import { LandingPageView } from '@/components/landing/LandingPageView';
import { CheckCircle2, X } from 'lucide-react';

export default function Home() {
  const {
    activeTab,
    welcomeNotice,
    dismissWelcomeNotice,
    isPasswordSet,
    isLocked,
    household,
    logout,
  } = useFinance();

  // Navigation mode: 'landing' (Halaman Depan & Pendaftaran) vs 'dashboard' (Operasional Pembukuan)
  const [viewMode, setViewMode] = useState<'landing' | 'dashboard'>('landing');
  const [isClientReady, setIsClientReady] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDeviceSyncModalOpen, setIsDeviceSyncModalOpen] = useState(false);

  // Initialize view mode based on saved preference or household state
  useEffect(() => {
    try {
      const savedView = localStorage.getItem('nest_active_view');
      if (savedView === 'dashboard' || savedView === 'landing') {
        setViewMode(savedView);
      } else {
        // If household is demo, default to landing page to welcome user
        // If already custom real household, default to dashboard
        const rawState = localStorage.getItem('nest_finance_v1_1_state');
        if (rawState) {
          const parsed = JSON.parse(rawState);
          if (parsed?.household?.id && parsed.household.id !== 'hh-pratama-rahma') {
            setViewMode('dashboard');
          } else {
            setViewMode('landing');
          }
        } else {
          setViewMode('landing');
        }
      }
    } catch (e) {
      setViewMode('landing');
    }
    setIsClientReady(true);
  }, []);

  const handleGoToDashboard = () => {
    setViewMode('dashboard');
    try {
      localStorage.setItem('nest_active_view', 'dashboard');
    } catch (e) {}
  };

  const handleGoToLanding = () => {
    setViewMode('landing');
    try {
      localStorage.setItem('nest_active_view', 'landing');
    } catch (e) {}
  };

  const handleLogout = () => {
    logout();
    handleGoToLanding();
  };

  // 1. LANDING PAGE VIEW (Terpisah Khusus Pendaftaran, Login & Fitur Utama)
  if (viewMode === 'landing') {
    return (
      <>
        <LandingPageView
          onGoToDashboard={handleGoToDashboard}
          onOpenSignUp={() => setIsRegisterModalOpen(true)}
          onOpenLogin={() => setIsLoginModalOpen(true)}
        />

        {/* Modal Masuk (Login) */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onOpenSignUp={() => setIsRegisterModalOpen(true)}
          onSuccessLogin={handleGoToDashboard}
        />

        {/* Modal Pendaftaran Akun Riil (Sign Up) */}
        <RegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={handleGoToDashboard}
        />
      </>
    );
  }

  // 2. DASHBOARD VIEW - SECURITY LOCK (Jika Password Aktif dan Layar Terkunci)
  if (isPasswordSet && isLocked) {
    return (
      <>
        <LockScreen
          onOpenSignUp={() => setIsRegisterModalOpen(true)}
          onGoToLanding={handleGoToLanding}
        />

        {/* Modal Masuk / Sign Up can be accessed if needed */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onOpenSignUp={() => setIsRegisterModalOpen(true)}
          onSuccessLogin={handleGoToDashboard}
        />

        <RegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={handleGoToDashboard}
        />
      </>
    );
  }

  // 3. DASHBOARD VIEW - MAIN APPLICATION
  return (
    <div className="min-h-screen flex flex-col bg-[#EBF1F6] text-slate-800 pb-24 w-full max-w-full overflow-x-hidden">
      {/* Top Header with Registration, Landing, Device Sync & Logout Link */}
      <Header
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onGoToLanding={handleGoToLanding}
        onLogout={handleLogout}
        onOpenDeviceSync={() => setIsDeviceSyncModalOpen(true)}
      />

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

        {/* TAB 1: DASHBOARD UTAMA */}
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

        {/* TAB 2: TRANSAKSI */}
        {activeTab === 'transactions' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <PendingApprovalBanner />
            <RecentTransactions />
          </div>
        )}

        {/* TAB 3: ANGGARAN (BUDGETS) */}
        {activeTab === 'budgets' && (
          <div className="animate-in fade-in duration-300">
            <BudgetView />
          </div>
        )}

        {/* TAB 4: TABUNGAN & GOALS */}
        {activeTab === 'goals' && (
          <div className="animate-in fade-in duration-300">
            <GoalsView />
          </div>
        )}

        {/* TAB 5: LAPORAN (REPORTS) */}
        {activeTab === 'reports' && (
          <div className="animate-in fade-in duration-300">
            <ReportsView />
          </div>
        )}

        {/* TAB 6: PENGATURAN (SETTINGS) */}
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

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onOpenSignUp={() => setIsRegisterModalOpen(true)}
        onSuccessLogin={handleGoToDashboard}
      />

      {/* Registration & Real Household Onboarding Modal with Password */}
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleGoToDashboard}
      />

      {/* Device Sync Modal (QR Code & Multi-Device Pairing) */}
      <DeviceSyncModal
        isOpen={isDeviceSyncModalOpen}
        onClose={() => setIsDeviceSyncModalOpen(false)}
      />

      {/* Bottom Sticky Navigation */}
      <BottomNav onOpenAddModal={() => setIsAddModalOpen(true)} />
    </div>
  );
}
