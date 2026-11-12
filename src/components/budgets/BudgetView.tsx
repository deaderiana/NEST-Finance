'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatIDR } from '@/lib/ledgerEngine';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Plus,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export const BudgetView: React.FC = () => {
  const { budgets, categories, transactions, hideBalance } = useFinance();
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'HOUSEHOLD' | 'PERSONAL'>('ALL');

  // Calculate pending commitments per category
  const pendingByCat = transactions
    .filter((t) => t.status === 'PENDING_APPROVAL' && t.category_id)
    .reduce((acc, t) => {
      acc[t.category_id!] = (acc[t.category_id!] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const totalBudget = budgets.reduce((acc, b) => acc + b.amount_limit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const totalRemaining = Math.max(0, totalBudget - totalSpent);
  const overallPct = Math.round((totalSpent / (totalBudget || 1)) * 100);

  return (
    <div className="space-y-4">
      {/* Overview Clay Card */}
      <div className="clay-card p-5 sm:p-6 bg-gradient-to-br from-white to-blue-50/40 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Anggaran Bulanan Keluarga
            </span>
            <h2 className="text-2xl font-extrabold text-slate-800 mt-1">
              {formatIDR(totalSpent, hideBalance)}{' '}
              <span className="text-xs font-normal text-slate-400">
                / {formatIDR(totalBudget, hideBalance)}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Sisa Kuota Anggaran: <strong className="text-emerald-600">{formatIDR(totalRemaining, hideBalance)}</strong>
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-clay-sm">
            <PieChart className="w-6 h-6" />
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600">
            <span>Terpakai: {overallPct}%</span>
            <span>Batas Aman: 85%</span>
          </div>
          <div className="w-full h-3.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5 clay-inset">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPct >= 90
                  ? 'bg-rose-500'
                  : overallPct >= 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, overallPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Scope Filter */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-800">Rincian Pos Anggaran</h3>
        <div className="flex items-center space-x-1 p-1 bg-[#E8EFF5] rounded-full clay-inset text-xs">
          <button
            onClick={() => setScopeFilter('ALL')}
            className={`px-3 py-1 rounded-full font-medium ${
              scopeFilter === 'ALL' ? 'clay-pill-active' : 'clay-pill-inactive'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setScopeFilter('HOUSEHOLD')}
            className={`px-3 py-1 rounded-full font-medium ${
              scopeFilter === 'HOUSEHOLD' ? 'clay-pill-active' : 'clay-pill-inactive'
            }`}
          >
            Rumah Tangga
          </button>
          <button
            onClick={() => setScopeFilter('PERSONAL')}
            className={`px-3 py-1 rounded-full font-medium ${
              scopeFilter === 'PERSONAL' ? 'clay-pill-active' : 'clay-pill-inactive'
            }`}
          >
            Pribadi
          </button>
        </div>
      </div>

      {/* Budget List */}
      <div className="space-y-3">
        {budgets.map((b) => {
          const category = categories.find((c) => c.id === b.category_id);
          const percent = Math.round((b.spent / b.amount_limit) * 100);
          const isWarning = percent >= b.warning_threshold_pct;
          const isExceeded = percent >= 100;
          const pendingAmount = pendingByCat[b.category_id || ''] || 0;

          return (
            <div key={b.id} className="clay-card-flat p-4 bg-white/95 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-xs text-slate-800">
                      {category?.name || 'Anggaran Umum'}
                    </h4>
                    {isExceeded ? (
                      <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Melebihi Kuota</span>
                      </span>
                    ) : isWarning ? (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Peringatan ({percent}%)</span>
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Aman</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Batas: {formatIDR(b.amount_limit, hideBalance)} · Peringatan pada {b.warning_threshold_pct}%
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-extrabold text-slate-800">
                    {formatIDR(b.spent, hideBalance)}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Sisa: {formatIDR(Math.max(0, b.amount_limit - b.spent), hideBalance)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 clay-inset">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isExceeded
                      ? 'bg-rose-500'
                      : isWarning
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, percent)}%` }}
                />
              </div>

              {/* Pending Commitment Notice (PRD 6.7: shown as commitment, not actual expense) */}
              {pendingAmount > 0 && (
                <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-800 flex items-center justify-between">
                  <span>
                    Komitmen Menunggu Persetujuan: <strong>{formatIDR(pendingAmount, hideBalance)}</strong>
                  </span>
                  <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1.5 py-0.5 rounded font-medium">
                    Belum Terposting
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
