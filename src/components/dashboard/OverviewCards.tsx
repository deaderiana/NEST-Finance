'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatIDR } from '@/lib/ledgerEngine';
import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  Scale,
  TrendingUp,
  Wallet,
} from 'lucide-react';

export const OverviewCards: React.FC = () => {
  const {
    totalLiquidBalance,
    totalIncome,
    totalExpense,
    netCashflow,
    hideBalance,
  } = useFinance();

  return (
    <div className="space-y-4">
      {/* Main Liquid Balance Clay Card */}
      <div className="clay-card p-5 sm:p-6 bg-gradient-to-br from-[#F6F9FD] to-[#EDF3F9] relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-100/60 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-100/40 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Kekayaan Likuid
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                Semua Rekening
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1 tracking-tight">
              {formatIDR(totalLiquidBalance, hideBalance)}
            </h2>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-clay-primary to-blue-400 text-white flex items-center justify-center shadow-clay-primary">
            <Wallet className="w-6 h-6 drop-shadow" />
          </div>
        </div>

        {/* Balance Status Line */}
        <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <Scale className="w-4 h-4 text-emerald-500" />
            <span>Buku Besar: <strong>Terkonsolidasi & Seimbang</strong></span>
          </div>
          <span className="text-[11px] bg-emerald-100/80 text-emerald-700 font-medium px-2 py-0.5 rounded-lg">
            Terverifikasi Realtime
          </span>
        </div>
      </div>

      {/* Grid of Income, Expense, and Net Cashflow */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Income Card */}
        <div className="clay-card-flat p-4 bg-gradient-to-br from-white to-emerald-50/40 border-emerald-100/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Uang Masuk</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-emerald-700 tracking-tight">
            +{formatIDR(totalIncome, hideBalance)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Bulan November 2026</p>
        </div>

        {/* Expense Card */}
        <div className="clay-card-flat p-4 bg-gradient-to-br from-white to-rose-50/40 border-rose-100/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Uang Keluar</span>
            <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-rose-700 tracking-tight">
            -{formatIDR(totalExpense, hideBalance)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Pengeluaran & Cicilan</p>
        </div>

        {/* Net Cash Flow Card */}
        <div className="clay-card-flat p-4 bg-gradient-to-br from-white to-indigo-50/40 border-indigo-100/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Arus Kas Bersih</span>
            <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-lg font-bold tracking-tight ${
              netCashflow >= 0 ? 'text-indigo-700' : 'text-rose-700'
            }`}
          >
            {netCashflow >= 0 ? '+' : ''}
            {formatIDR(netCashflow, hideBalance)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Surplus Bersih Keluarga</p>
        </div>
      </div>
    </div>
  );
};
