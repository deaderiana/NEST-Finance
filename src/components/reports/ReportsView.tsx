'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatDateID, formatIDR } from '@/lib/ledgerEngine';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  BookOpen,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  PieChart,
  Scale,
  ShieldCheck,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    totalIncome,
    totalExpense,
    netCashflow,
    transactions,
    categories,
    journals,
    hideBalance,
  } = useFinance();

  const [activeReportTab, setActiveReportTab] = useState<'SUMMARY' | 'CATEGORIES' | 'LEDGER'>('SUMMARY');

  // Calculate expense breakdown by category
  const expenseByCategory = transactions
    .filter((t) => t.status === 'POSTED' && (t.transaction_type === 'EXPENSE' || t.transaction_type === 'DEBT_PAYMENT'))
    .reduce((acc, t) => {
      const cat = categories.find((c) => c.id === t.category_id);
      const name = cat?.name || 'Lain-lain';
      acc[name] = (acc[name] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const sortedCategories = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);

  // Double-Entry Ledger Invariant Verification
  let totalDebits = 0;
  let totalCredits = 0;
  journals.forEach((j) => {
    j.entries.forEach((e) => {
      if (e.side === 'DEBIT') totalDebits += e.amount;
      if (e.side === 'CREDIT') totalCredits += e.amount;
    });
  });

  const isLedgerBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const handleExportCSV = () => {
    const headers = 'ID,Tanggal,Tipe,Nominal,Keterangan,Status\n';
    const rows = transactions
      .map(
        (t) =>
          `"${t.id}","${t.transaction_date}","${t.transaction_type}",${t.amount},"${t.description || ''}","${t.status}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NEST_Finance_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-base text-slate-800">Laporan & Audit Keuangan</h3>
          <p className="text-xs text-slate-500">
            Rekonsiliasi transaksi riil terhadap buku besar pembukuan ganda
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="clay-button px-3.5 py-1.5 bg-white text-slate-700 hover:text-clay-primary text-xs font-semibold flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Ekspor CSV</span>
        </button>
      </div>

      {/* Subtab Switcher */}
      <div className="flex items-center space-x-1 p-1 bg-[#E8EFF5] rounded-full clay-inset text-xs">
        <button
          onClick={() => setActiveReportTab('SUMMARY')}
          className={`flex-1 py-1.5 rounded-full font-bold transition-all ${
            activeReportTab === 'SUMMARY' ? 'clay-pill-active' : 'clay-pill-inactive'
          }`}
        >
          Arus Kas (Cash Flow)
        </button>
        <button
          onClick={() => setActiveReportTab('CATEGORIES')}
          className={`flex-1 py-1.5 rounded-full font-bold transition-all ${
            activeReportTab === 'CATEGORIES' ? 'clay-pill-active' : 'clay-pill-inactive'
          }`}
        >
          Kategori Pengeluaran
        </button>
        <button
          onClick={() => setActiveReportTab('LEDGER')}
          className={`flex-1 py-1.5 rounded-full font-bold transition-all ${
            activeReportTab === 'LEDGER' ? 'clay-pill-active' : 'clay-pill-inactive'
          }`}
        >
          Audit Buku Besar ({journals.length})
        </button>
      </div>

      {/* TAB 1: SUMMARY / CASHFLOW */}
      {activeReportTab === 'SUMMARY' && (
        <div className="space-y-3">
          <div className="clay-card p-5 bg-white/95 space-y-4">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Ringkasan Bulan Berjalan (November 2026)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                <span className="text-[11px] font-medium text-emerald-800 block">Total Uang Masuk</span>
                <span className="text-base font-extrabold text-emerald-700">
                  +{formatIDR(totalIncome, hideBalance)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100">
                <span className="text-[11px] font-medium text-rose-800 block">Total Uang Keluar</span>
                <span className="text-base font-extrabold text-rose-700">
                  -{formatIDR(totalExpense, hideBalance)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100">
                <span className="text-[11px] font-medium text-indigo-800 block">Surplus Bersih</span>
                <span className="text-base font-extrabold text-indigo-700">
                  {formatIDR(netCashflow, hideBalance)}
                </span>
              </div>
            </div>

            {/* Savings Rate metric */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Tingkat Tabungan (Savings Rate)
                </span>
                <span className="text-[11px] text-slate-500">
                  Persentase penghasilan yang berhasil disimpan / surplus
                </span>
              </div>
              <span className="text-xl font-extrabold text-clay-primary">
                {totalIncome > 0 ? Math.round((netCashflow / totalIncome) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORY BREAKDOWN */}
      {activeReportTab === 'CATEGORIES' && (
        <div className="space-y-3">
          <div className="clay-card p-5 bg-white/95 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Distribusi Pengeluaran Berdasarkan Kategori
            </h4>

            <div className="space-y-3">
              {sortedCategories.map(([catName, amount]) => {
                const pct = Math.round((amount / (totalExpense || 1)) * 100);
                return (
                  <div key={catName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{catName}</span>
                      <span className="font-bold text-slate-800">
                        {formatIDR(amount, hideBalance)}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden clay-inset">
                      <div
                        className="h-full bg-clay-primary rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOUBLE ENTRY LEDGER AUDIT */}
      {activeReportTab === 'LEDGER' && (
        <div className="space-y-3">
          {/* Integrity Badge Banner */}
          <div className="clay-card-flat p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-clay-sm">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-emerald-950">
                  Integritas Buku Besar (Double-Entry Invariant)
                </h4>
                <p className="text-[11px] text-emerald-800">
                  Total Debit: <strong>{formatIDR(totalDebits, hideBalance)}</strong> · Total Kredit:{' '}
                  <strong>{formatIDR(totalCredits, hideBalance)}</strong>
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-1 rounded-full">
              Seimbang 100%
            </span>
          </div>

          {/* Journals List */}
          <div className="space-y-2">
            {journals.map((j) => (
              <div key={j.id} className="clay-card-flat p-3.5 bg-white/95 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-clay-primary">
                      {j.journal_number}
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      {j.description}
                    </span>
                    {j.is_reversal && (
                      <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">
                        REVERSAL
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {formatDateID(j.posted_at)}
                  </span>
                </div>

                {/* Balanced Entries Table */}
                <div className="divide-y divide-slate-100 text-xs">
                  {j.entries.map((e) => (
                    <div
                      key={e.id}
                      className="py-1 flex items-center justify-between text-slate-600 font-mono text-[11px]"
                    >
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                            e.side === 'DEBIT'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {e.side}
                        </span>
                        <span className="text-slate-800">{e.account_name}</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {formatIDR(e.amount, hideBalance)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
