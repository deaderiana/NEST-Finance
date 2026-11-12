'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { formatDateID, formatIDR } from '@/lib/ledgerEngine';
import {
  Baby,
  Building,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Heart,
  Plane,
  Plus,
  Receipt,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const GoalsView: React.FC = () => {
  const {
    goals,
    debts,
    bills,
    accounts,
    addSavingsContribution,
    payBill,
    hideBalance,
  } = useFinance();

  const [activeSection, setActiveSection] = useState<'GOALS' | 'DEBTS' | 'BILLS'>('GOALS');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [savingAmount, setSavingAmount] = useState('500000');
  const [savingAccountId, setSavingAccountId] = useState(accounts[0]?.id || '');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const getGoalIcon = (iconName: string) => {
    switch (iconName) {
      case 'Plane':
        return <Plane className="w-5 h-5 text-blue-500" />;
      case 'Baby':
        return <Baby className="w-5 h-5 text-pink-500" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
    }
  };

  const handleContributeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId) return;

    const amt = parseInt(savingAmount.replace(/[^0-9]/g, ''), 10);
    if (!amt || amt <= 0) return;

    const res = addSavingsContribution(selectedGoalId, amt, savingAccountId);
    if (res.success) {
      setStatusMessage(res.message);
      setSelectedGoalId(null);
      try {
        confetti({ particleCount: 35, spread: 60 });
      } catch (e) {}
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      setStatusMessage(res.message);
    }
  };

  const handlePayBillClick = (billId: string) => {
    const acc = accounts.find((a) => a.scope === 'SHARED') || accounts[0];
    const res = payBill(billId, acc.id);
    setStatusMessage(res.message);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-1 p-1 bg-[#E8EFF5] rounded-full clay-inset text-xs">
          <button
            onClick={() => setActiveSection('GOALS')}
            className={`px-4 py-1.5 rounded-full font-bold transition-all ${
              activeSection === 'GOALS' ? 'clay-pill-active' : 'clay-pill-inactive'
            }`}
          >
            Target Tabungan ({goals.length})
          </button>
          <button
            onClick={() => setActiveSection('DEBTS')}
            className={`px-4 py-1.5 rounded-full font-bold transition-all ${
              activeSection === 'DEBTS' ? 'clay-pill-active' : 'clay-pill-inactive'
            }`}
          >
            Hutang & Cicilan ({debts.length})
          </button>
          <button
            onClick={() => setActiveSection('BILLS')}
            className={`px-4 py-1.5 rounded-full font-bold transition-all ${
              activeSection === 'BILLS' ? 'clay-pill-active' : 'clay-pill-inactive'
            }`}
          >
            Tagihan Rutin ({bills.filter((b) => !b.is_paid).length})
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold">
          {statusMessage}
        </div>
      )}

      {/* SECTION 1: SAVINGS GOALS */}
      {activeSection === 'GOALS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">Target & Impian Keluarga</h3>
            <span className="text-[11px] text-slate-500">
              Alokasi internal (bukan konsumsi belanja)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goals.map((goal) => {
              const progressPct = Math.min(
                100,
                Math.round((goal.current_amount / goal.target_amount) * 100)
              );
              return (
                <div key={goal.id} className="clay-card-flat p-4 bg-white/95 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center shadow-clay-sm">
                        {getGoalIcon(goal.category_icon)}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">{goal.name}</h4>
                        <span className="text-[10px] text-slate-400">
                          Target: {formatDateID(goal.target_date)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-clay-primary">
                      {progressPct}%
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 clay-inset">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-clay-primary to-indigo-500 transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Terkumpul</span>
                      <strong className="text-slate-800">
                        {formatIDR(goal.current_amount, hideBalance)}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Sasaran</span>
                      <strong className="text-slate-800">
                        {formatIDR(goal.target_amount, hideBalance)}
                      </strong>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedGoalId(goal.id)}
                    className="w-full clay-button py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold mt-1"
                  >
                    + Tambah Tabungan
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: DEBTS & INSTALLMENTS */}
      {activeSection === 'DEBTS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">Daftar Liabilitas & Cicilan</h3>
            <span className="text-[11px] text-slate-500">
              Pelunasan pokok mengurangi hutang
            </span>
          </div>

          <div className="space-y-3">
            {debts.map((debt) => {
              const paidAmount = debt.initial_principal - debt.remaining_principal;
              const paidPct = Math.round((paidAmount / debt.initial_principal) * 100);

              return (
                <div key={debt.id} className="clay-card-flat p-4 bg-white/95 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shadow-clay-sm text-rose-600">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800">{debt.name}</h4>
                        <span className="text-[10px] text-slate-400">
                          Kreditur: {debt.creditor} · Bunga: {debt.interest_rate_pct}%
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
                      Jatuh Tempo Tgl {debt.due_date_day}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 clay-inset">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Sisa Pokok</span>
                      <strong className="text-rose-600 font-extrabold">
                        {formatIDR(debt.remaining_principal, hideBalance)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Cicilan / Bulan</span>
                      <strong className="text-slate-800">
                        {formatIDR(debt.monthly_installment, hideBalance)}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Terbayar</span>
                      <strong className="text-emerald-600">{paidPct}%</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: BILLS & RECURRING */}
      {activeSection === 'BILLS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">Tagihan Rutin & Pengingat</h3>
            <span className="text-[11px] text-slate-500">
              Konfirmasi pembayaran memposting transaksi
            </span>
          </div>

          <div className="space-y-2">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="clay-card-flat p-3.5 bg-white/95 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-clay-sm ${
                      bill.is_paid
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}
                  >
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">{bill.title}</h4>
                    <span className="text-[11px] text-slate-400">
                      Jatuh Tempo: {formatDateID(bill.due_date)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 block">
                      {formatIDR(bill.amount, hideBalance)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold ${
                        bill.is_paid ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {bill.is_paid ? 'Lunas' : 'Belum Dibayar'}
                    </span>
                  </div>

                  {!bill.is_paid ? (
                    <button
                      onClick={() => handlePayBillClick(bill.id)}
                      className="clay-button clay-button-primary px-3 py-1.5 text-xs font-bold"
                    >
                      Bayar
                    </button>
                  ) : (
                    <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-full">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contribution Modal */}
      {selectedGoalId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="clay-card bg-white p-5 max-w-sm w-full space-y-4 shadow-clay-lg">
            <h4 className="font-bold text-sm text-slate-800">Tambah Alokasi Tabungan</h4>
            <p className="text-xs text-slate-500">
              Pindahkan dana dari rekening operasional ke target impian keluarga.
            </p>

            <form onSubmit={handleContributeSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Nominal Alokasi (IDR)
                </label>
                <input
                  type="text"
                  required
                  value={savingAmount}
                  onChange={(e) => setSavingAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl clay-inset text-sm font-bold bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Sumber Rekening
                </label>
                <select
                  value={savingAccountId}
                  onChange={(e) => setSavingAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatIDR(a.current_balance, hideBalance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedGoalId(null)}
                  className="px-3 py-1.5 rounded-full text-xs text-slate-500 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="clay-button clay-button-primary px-4 py-1.5 text-xs font-bold"
                >
                  Simpan Alokasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
