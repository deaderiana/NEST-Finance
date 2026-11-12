'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatIDR } from '@/lib/ledgerEngine';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Info,
  ShieldAlert,
  UserCheck,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PendingApprovalBanner: React.FC = () => {
  const {
    transactions,
    currentUser,
    users,
    accounts,
    categories,
    approveTransaction,
    rejectTransaction,
    approvalPolicy,
    hideBalance,
  } = useFinance();

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const pendingList = transactions.filter((t) => t.status === 'PENDING_APPROVAL');

  if (pendingList.length === 0) return null;

  const handleApprove = (txId: string) => {
    const res = approveTransaction(txId);
    if (res.success) {
      setFeedback({ message: res.message, type: 'success' });
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {
        // ignore
      }
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ message: res.message, type: 'error' });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleRejectSubmit = (txId: string) => {
    const res = rejectTransaction(txId, rejectReason || 'Ditolak oleh pasangan');
    if (res.success) {
      setFeedback({ message: res.message, type: 'success' });
      setRejectingId(null);
      setRejectReason('');
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ message: res.message, type: 'error' });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  return (
    <div className="clay-card p-5 bg-gradient-to-br from-amber-50/90 to-orange-50/60 border-amber-200/80 shadow-clay">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-clay-warning">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">
              Menunggu Persetujuan Pasangan ({pendingList.length})
            </h3>
            <p className="text-[11px] text-amber-700 font-medium">
              Ambang Batas: &gt; {formatIDR(approvalPolicy.threshold_amount, false)}
            </p>
          </div>
        </div>

        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full border border-amber-200">
          Maker-Checker Aktif
        </span>
      </div>

      {feedback && (
        <div
          className={`mb-3 p-3 rounded-xl text-xs font-medium flex items-center space-x-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-rose-100 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="space-y-3">
        {pendingList.map((tx) => {
          const creator = users.find((u) => u.id === tx.created_by);
          const account = accounts.find((a) => a.id === tx.account_id);
          const category = categories.find((c) => c.id === tx.category_id);
          const isCreator = currentUser.id === tx.created_by;

          return (
            <div
              key={tx.id}
              className="clay-card-flat p-4 bg-white/90 border border-amber-200/60 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-800">
                      {tx.description}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                      {category?.name || 'Umum'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dari: <strong>{account?.name}</strong> · Oleh:{' '}
                    <span className="font-semibold text-slate-700">
                      {creator?.display_name} ({creator?.relationship})
                    </span>
                  </p>
                  {tx.merchant && (
                    <p className="text-[11px] text-slate-400">Merchant: {tx.merchant}</p>
                  )}
                  {tx.note && (
                    <p className="text-xs text-slate-600 italic mt-1 bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                      &quot;{tx.note}&quot;
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-base font-extrabold text-rose-600">
                    {formatIDR(tx.amount, hideBalance)}
                  </span>
                  <p className="text-[10px] text-amber-600 font-medium">Saldo Belum Terpotong</p>
                </div>
              </div>

              {/* Action Buttons with Maker-Checker Logic */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                {isCreator ? (
                  <div className="flex items-center space-x-1.5 text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/80 w-full">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Anda membuat transaksi ini. Sesuai aturan PRD, hanya{' '}
                      <strong>{users.find((u) => u.id !== currentUser.id)?.display_name}</strong>{' '}
                      yang dapat menyetujui. (Ganti akun di pojok kanan atas untuk menguji).
                    </span>
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs text-emerald-700">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>Anda berwenang menyetujui transaksi pasangan</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setRejectingId(rejectingId === tx.id ? null : tx.id)}
                        className="clay-button px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => handleApprove(tx.id)}
                        className="clay-button clay-button-income px-4 py-1.5 text-xs font-bold"
                      >
                        Setujui Sekarang
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Reject Reason Form */}
              {rejectingId === tx.id && (
                <div className="mt-2 p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs space-y-2">
                  <label className="font-semibold text-rose-900 block">
                    Alasan Penolakan:
                  </label>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Contoh: Terlalu mahal / Tunda bulan depan"
                    className="w-full px-3 py-1.5 rounded-lg border border-rose-300 text-xs bg-white text-slate-800"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setRejectingId(null)}
                      className="px-2.5 py-1 text-slate-500 text-xs hover:underline"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleRejectSubmit(tx.id)}
                      className="clay-button bg-rose-600 text-white px-3 py-1 text-xs font-bold"
                    >
                      Konfirmasi Tolak
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
