'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatDateID, formatIDR } from '@/lib/ledgerEngine';
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Clock,
  Filter,
  RotateCcw,
  Search,
  Tag,
  XCircle,
} from 'lucide-react';

export const RecentTransactions: React.FC = () => {
  const {
    transactions,
    accounts,
    categories,
    users,
    reverseTransaction,
    hideBalance,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedTxForReversal, setSelectedTxForReversal] = useState<string | null>(null);
  const [reversalNotice, setReversalNotice] = useState<string | null>(null);

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.merchant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.note?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      typeFilter === 'ALL'
        ? true
        : typeFilter === 'PENDING'
        ? t.status === 'PENDING_APPROVAL'
        : t.transaction_type === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleConfirmReversal = (txId: string) => {
    const res = reverseTransaction(txId);
    setReversalNotice(res.message);
    setSelectedTxForReversal(null);
    setTimeout(() => setReversalNotice(null), 5000);
  };

  return (
    <div className="space-y-3">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-base text-slate-800">Riwayat Transaksi</h3>
          <p className="text-xs text-slate-500">
            Pencatatan ganda dengan integritas buku besar
          </p>
        </div>

        {/* Search input in clay-inset style */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari transaksi / merchant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-60 pl-9 pr-3 py-1.5 rounded-full clay-inset text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-clay-primary"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 p-1 bg-[#E8EFF5] rounded-full clay-inset overflow-x-auto text-xs">
        <button
          onClick={() => setTypeFilter('ALL')}
          className={`px-3 py-1 rounded-full font-medium transition-all ${
            typeFilter === 'ALL' ? 'clay-pill-active' : 'clay-pill-inactive'
          }`}
        >
          Semua ({transactions.length})
        </button>
        <button
          onClick={() => setTypeFilter('EXPENSE')}
          className={`px-3 py-1 rounded-full font-medium transition-all ${
            typeFilter === 'EXPENSE' ? 'clay-pill-active' : 'clay-pill-inactive'
          }`}
        >
          Uang Keluar
        </button>
        <button
          onClick={() => setTypeFilter('INCOME')}
          className={`px-3 py-1 rounded-full font-medium transition-all ${
            typeFilter === 'INCOME' ? 'clay-pill-active' : 'clay-pill-inactive'
          }`}
        >
          Uang Masuk
        </button>
        <button
          onClick={() => setTypeFilter('TRANSFER')}
          className={`px-3 py-1 rounded-full font-medium transition-all ${
            typeFilter === 'TRANSFER' ? 'clay-pill-active' : 'clay-pill-inactive'
          }`}
        >
          Pindah Dana
        </button>
        <button
          onClick={() => setTypeFilter('PENDING')}
          className={`px-3 py-1 rounded-full font-medium transition-all ${
            typeFilter === 'PENDING' ? 'clay-pill-active' : 'clay-pill-inactive'
          }`}
        >
          Menunggu ({transactions.filter((t) => t.status === 'PENDING_APPROVAL').length})
        </button>
      </div>

      {reversalNotice && (
        <div className="p-3 bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-medium">
          {reversalNotice}
        </div>
      )}

      {/* Transaction List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="clay-card-flat p-8 text-center text-slate-400 text-xs">
            Tidak ada transaksi yang cocok dengan pencarian
          </div>
        ) : (
          filtered.map((tx) => {
            const account = accounts.find((a) => a.id === tx.account_id);
            const destAccount = accounts.find((a) => a.id === tx.destination_account_id);
            const category = categories.find((c) => c.id === tx.category_id);
            const creator = users.find((u) => u.id === tx.created_by);

            const isIncome = tx.transaction_type === 'INCOME';
            const isTransfer = tx.transaction_type === 'TRANSFER';
            const isPending = tx.status === 'PENDING_APPROVAL';
            const isReversed = tx.status === 'REVERSED';
            const isRejected = tx.status === 'REJECTED';

            return (
              <div
                key={tx.id}
                className="clay-card-flat p-3.5 bg-white/95 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white transition-colors"
              >
                {/* Left: Icon and details */}
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-clay-sm ${
                      isIncome
                        ? 'bg-emerald-100 text-emerald-600'
                        : isTransfer
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-rose-100 text-rose-600'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : isTransfer ? (
                      <ArrowRightLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h4 className="font-bold text-xs text-slate-800">
                        {tx.description}
                      </h4>

                      {/* Status Badges */}
                      {isPending && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Menunggu Persetujuan</span>
                        </span>
                      )}
                      {isReversed && (
                        <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                          Dibalik (Reversed)
                        </span>
                      )}
                      {isRejected && (
                        <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
                          Ditolak
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1 flex-wrap">
                      <span>{formatDateID(tx.transaction_date)}</span>
                      <span>•</span>
                      <span>
                        {isTransfer ? (
                          <>
                            {account?.name} → {destAccount?.name}
                          </>
                        ) : (
                          account?.name
                        )}
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">
                        Oleh: <strong>{creator?.relationship}</strong>
                      </span>
                      {category && (
                        <>
                          <span>•</span>
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                            {category.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Reversal Action */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span
                      className={`text-sm font-extrabold tracking-tight ${
                        isReversed
                          ? 'line-through text-slate-400'
                          : isIncome
                          ? 'text-emerald-600'
                          : isTransfer
                          ? 'text-purple-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {isIncome ? '+' : isTransfer ? '' : '-'}
                      {formatIDR(tx.amount, hideBalance)}
                    </span>
                    {isPending && (
                      <span className="block text-[9px] text-amber-600 font-medium">
                        Belum Memotong Saldo
                      </span>
                    )}
                  </div>

                  {/* Reversal action for posted transactions */}
                  {tx.status === 'POSTED' && (
                    <button
                      onClick={() => setSelectedTxForReversal(tx.id)}
                      title="Koreksi Transaksi (Posting Jurnal Reversal)"
                      className="text-[10px] text-slate-400 hover:text-rose-600 flex items-center space-x-1 mt-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Koreksi / Reversal</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reversal Confirmation Dialog */}
      {selectedTxForReversal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="clay-card bg-white p-5 max-w-sm w-full space-y-3 shadow-clay-lg">
            <h4 className="font-bold text-sm text-slate-800">
              Konfirmasi Koreksi Transaksi (Reversal)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sesuai aturan buku besar (PRD Section 7.3), transaksi yang telah diposting bersifat{' '}
              <strong>abadi (immutable)</strong>. Koreksi akan membuat{' '}
              <strong>Jurnal Pembalik (Reversal Journal)</strong> dengan entri debit/kredit yang berlawanan untuk mengembalikan saldo rekening tanpa menghapus riwayat audit.
            </p>
            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedTxForReversal(null)}
                className="px-3 py-1.5 rounded-full text-xs text-slate-600 hover:bg-slate-100 font-medium"
              >
                Batal
              </button>
              <button
                onClick={() => handleConfirmReversal(selectedTxForReversal)}
                className="clay-button clay-button-expense px-4 py-1.5 text-xs font-bold"
              >
                Ya, Posting Reversal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
