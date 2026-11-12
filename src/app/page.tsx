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

export default function Home() {
  const { activeTab } = useFinance();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#EBF1F6] text-slate-800 pb-24">
      {/* Top Header with Registration Action */}
      <Header onOpenRegisterModal={() => setIsRegisterModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-4 sm:py-6">
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
