'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatIDR } from '@/lib/ledgerEngine';
import { Account, AccountScope } from '@/types/finance';
import {
  Banknote,
  Building2,
  Landmark,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';

export const AccountsSection: React.FC = () => {
  const { accounts, users, hideBalance } = useFinance();
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'SHARED' | 'BUDI' | 'SITI'>('ALL');

  const getIcon = (type: string, iconName?: string) => {
    switch (iconName) {
      case 'Landmark':
        return <Landmark className="w-5 h-5 text-blue-600" />;
      case 'Building2':
        return <Building2 className="w-5 h-5 text-amber-600" />;
      case 'Banknote':
        return <Banknote className="w-5 h-5 text-emerald-600" />;
      case 'Smartphone':
        return <Smartphone className="w-5 h-5 text-purple-600" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-pink-600" />;
      default:
        return <Wallet className="w-5 h-5 text-slate-600" />;
    }
  };

  const sharedAccounts = accounts.filter((a) => a.scope === 'SHARED');
  const budiAccounts = accounts.filter((a) => a.owner_user_id === 'user-budi');
  const sitiAccounts = accounts.filter((a) => a.owner_user_id === 'user-siti');

  const filteredAccounts =
    selectedFilter === 'SHARED'
      ? sharedAccounts
      : selectedFilter === 'BUDI'
      ? budiAccounts
      : selectedFilter === 'SITI'
      ? sitiAccounts
      : accounts;

  return (
    <div className="space-y-3">
      {/* Header and Scope Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-base text-slate-800">Rekening & Dompet</h3>
          <p className="text-xs text-slate-500">
            Transparansi penuh: Rekening Bersama, Suami, dan Istri
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 p-1 bg-[#E8EFF5] rounded-full clay-inset overflow-x-auto text-xs">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1 rounded-full font-medium transition-all ${
              selectedFilter === 'ALL' ? 'clay-pill-active' : 'clay-pill-inactive'
            }`}
          >
            Semua ({accounts.length})
          </button>
          <button
            onClick={() => setSelectedFilter('SHARED')}
            className={`px-3 py-1 rounded-full font-medium transition-all ${
              selectedFilter === 'SHARED' ? 'clay-pill-active' : 'clay-pill-inactive'
            }`}
          >
            Bersama ({sharedAccounts.length})
          </button>
          <button
            onClick={() => setSelectedFilter('BUDI')}
            className={`px-3 py-1 rounded-full font-medium transition-all ${
              selectedFilter === 'BUDI' ? 'clay-pill-active' : 'clay-pill-inactive'
            }`}
          >
            Budi ({budiAccounts.length})
          </button>
          <button
            onClick={() => setSelectedFilter('SITI')}
            className={`px-3 py-1 rounded-full font-medium transition-all ${
              selectedFilter === 'SITI' ? 'clay-pill-active' : 'clay-pill-inactive'
            }`}
          >
            Siti ({sitiAccounts.length})
          </button>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredAccounts.map((acc) => {
          const owner = users.find((u) => u.id === acc.owner_user_id);
          const isShared = acc.scope === 'SHARED';

          return (
            <div
              key={acc.id}
              className="clay-card-flat p-4 bg-white/95 hover:translate-y-[-2px] transition-transform"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#EEF4FA] flex items-center justify-center shadow-clay-sm">
                    {getIcon(acc.account_type, acc.icon)}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 leading-tight">
                      {acc.name}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {acc.account_number || acc.account_type}
                    </span>
                  </div>
                </div>

                {/* Scope Badge */}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isShared
                      ? 'bg-blue-100 text-blue-700'
                      : owner?.relationship === 'Suami'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-pink-100 text-pink-700'
                  }`}
                >
                  {isShared ? 'Bersama' : owner?.relationship}
                </span>
              </div>

              {/* Balance */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Saldo Realtime</span>
                  <span className="text-sm font-extrabold text-slate-800 tracking-tight">
                    {formatIDR(acc.current_balance, hideBalance)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  IDR
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
