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
  X,
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
    addSavingsGoal,
    addDebt,
    addBill,
    payBill,
    hideBalance,
  } = useFinance();

  const [activeSection, setActiveSection] = useState<'GOALS' | 'DEBTS' | 'BILLS'>('GOALS');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [savingAmount, setSavingAmount] = useState('500000');
  const [savingAccountId, setSavingAccountId] = useState(accounts[0]?.id || '');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Modals for creating new items
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);

  // Form states for Goal
  const [goalName, setGoalName] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalIcon, setGoalIcon] = useState('ShieldCheck');

  // Form states for Debt
  const [debtName, setDebtName] = useState('');
  const [debtCreditor, setDebtCreditor] = useState('');
  const [debtPrincipal, setDebtPrincipal] = useState('');
  const [debtInstallment, setDebtInstallment] = useState('');
  const [debtDueDateDay, setDebtDueDateDay] = useState('10');
  const [debtInterestRate, setDebtInterestRate] = useState('0');
  const [debtScheme, setDebtScheme] = useState<'SYARIAH' | 'CONVENTIONAL'>('SYARIAH');

  // Form states for Bill
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDueDate, setBillDueDate] = useState('');
  const [billPeriod, setBillPeriod] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  const getGoalIcon = (iconName: string) => {
    switch (iconName) {
      case 'Plane':
        return <Plane className="w-5 h-5 text-blue-500" />;
      case 'Baby':
        return <Baby className="w-5 h-5 text-pink-500" />;
      case 'Building':
        return <Building className="w-5 h-5 text-amber-500" />;
      case 'Heart':
        return <Heart className="w-5 h-5 text-rose-500" />;
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

  const handleCreateGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(goalTargetAmount.replace(/[^0-9]/g, ''), 10);
    if (!goalName.trim() || !amt || amt <= 0) {
      setStatusMessage('Nama target dan nominal sasaran wajib diisi.');
      return;
    }
    const res = addSavingsGoal({
      name: goalName.trim(),
      target_amount: amt,
      target_date: goalTargetDate || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      category_icon: goalIcon,
    });
    if (res.success) {
      setStatusMessage(res.message);
      setIsAddGoalOpen(false);
      setGoalName('');
      setGoalTargetAmount('');
      setGoalTargetDate('');
      try {
        confetti({ particleCount: 30, spread: 50 });
      } catch (e) {}
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleCreateDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseInt(debtPrincipal.replace(/[^0-9]/g, ''), 10);
    const installment = parseInt(debtInstallment.replace(/[^0-9]/g, ''), 10) || 0;
    if (!debtName.trim() || !principal || principal <= 0) {
      setStatusMessage('Nama cicilan dan pokok pinjaman wajib diisi.');
      return;
    }
    const res = addDebt({
      name: debtName.trim(),
      creditor: debtCreditor.trim() || 'Bank / Lembaga Pembiayaan',
      initial_principal: principal,
      remaining_principal: principal,
      monthly_installment: installment,
      due_date_day: parseInt(debtDueDateDay, 10) || 10,
      interest_rate_pct: debtScheme === 'SYARIAH' ? 0 : (parseFloat(debtInterestRate) || 0),
    });
    if (res.success) {
      setStatusMessage(res.message);
      setIsAddDebtOpen(false);
      setDebtName('');
      setDebtCreditor('');
      setDebtPrincipal('');
      setDebtInstallment('');
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleCreateBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(billAmount.replace(/[^0-9]/g, ''), 10);
    if (!billTitle.trim() || !amt || amt <= 0) {
      setStatusMessage('Nama tagihan dan nominal wajib diisi.');
      return;
    }
    const res = addBill({
      title: billTitle.trim(),
      amount: amt,
      due_date: billDueDate || new Date().toISOString().split('T')[0],
      recurring_period: billPeriod,
    });
    if (res.success) {
      setStatusMessage(res.message);
      setIsAddBillOpen(false);
      setBillTitle('');
      setBillAmount('');
      setBillDueDate('');
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Quick populate sample bills
  const handlePopulateSampleBills = () => {
    addBill({
      title: 'Listrik PLN Pascabayar',
      amount: 450000,
      due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      recurring_period: 'MONTHLY',
    });
    addBill({
      title: 'WiFi Indihome / Fiber',
      amount: 375000,
      due_date: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0],
      recurring_period: 'MONTHLY',
    });
    addBill({
      title: 'Air PDAM & Iuran Lingkungan (IPL)',
      amount: 175000,
      due_date: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
      recurring_period: 'MONTHLY',
    });
    setStatusMessage('3 Tagihan rutin standar keluarga berhasil ditambahkan!');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Quick populate sample goals
  const handlePopulateSampleGoals = () => {
    addSavingsGoal({
      name: 'Dana Darurat 6 Bulan',
      target_amount: 30000000,
      target_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      category_icon: 'ShieldCheck',
    });
    addSavingsGoal({
      name: 'Liburan Keluarga Akhir Tahun',
      target_amount: 8000000,
      target_date: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      category_icon: 'Plane',
    });
    setStatusMessage('Target tabungan darurat & liburan berhasil ditambahkan!');
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
            <div>
              <h3 className="font-bold text-sm text-slate-800">Target & Impian Keluarga</h3>
              <span className="text-[11px] text-slate-500">
                Alokasi dana internal (bukan konsumsi belanja)
              </span>
            </div>
            <button
              onClick={() => setIsAddGoalOpen(true)}
              className="clay-button clay-button-primary px-3 py-1.5 text-xs font-bold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Target</span>
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="clay-card-flat p-8 bg-white/95 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center text-clay-primary shadow-clay-sm">
                <Target className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">Belum Ada Target Tabungan</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Rencanakan impian keluarga seperti dana darurat, liburan, pendidikan anak, atau renovasi rumah.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setIsAddGoalOpen(true)}
                  className="clay-button clay-button-primary px-4 py-2 text-xs font-bold inline-flex items-center space-x-1.5 shadow-clay-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Pasang Target Tabungan Pertama</span>
                </button>
                <button
                  onClick={handlePopulateSampleGoals}
                  className="clay-button bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3.5 py-2 text-xs font-bold"
                >
                  ✨ Contoh Target (Dana Darurat & Liburan)
                </button>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* SECTION 2: DEBTS & INSTALLMENTS */}
      {activeSection === 'DEBTS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Daftar Liabilitas & Cicilan</h3>
              <span className="text-[11px] text-slate-500">
                Pelunasan pokok mengurangi sisa hutang keluarga
              </span>
            </div>
            <button
              onClick={() => setIsAddDebtOpen(true)}
              className="clay-button bg-rose-500 text-white hover:bg-rose-600 px-3 py-1.5 text-xs font-bold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Cicilan</span>
            </button>
          </div>

          {debts.length === 0 ? (
            <div className="clay-card-flat p-8 bg-white/95 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-clay-sm">
                <CreditCard className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">Tidak Ada Hutang / Cicilan Tercatat</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Keluarga Anda bebas hutang atau belum mencatat cicilan KPR, kendaraan, atau pembiayaan lainnya.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsAddDebtOpen(true)}
                  className="clay-button bg-rose-500 text-white hover:bg-rose-600 px-4 py-2 text-xs font-bold inline-flex items-center space-x-1.5 shadow-clay-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Catat Cicilan / Hutang Baru</span>
                </button>
              </div>
            </div>
          ) : (
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
                            Kreditur: {debt.creditor} · {debt.interest_rate_pct === 0 ? '🌙 Syariah (Angsuran Tetap)' : `Bunga: ${debt.interest_rate_pct}%`}
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
                        <span className="text-[10px] text-slate-400 block">{debtScheme === 'SYARIAH' ? 'Angsuran Tetap / Bulan' : 'Cicilan / Bulan'}</span>
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
          )}
        </div>
      )}

      {/* SECTION 3: BILLS & RECURRING */}
      {activeSection === 'BILLS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Tagihan Rutin & Pengingat</h3>
              <span className="text-[11px] text-slate-500">
                Konfirmasi pembayaran otomatis mencatat transaksi pengeluaran
              </span>
            </div>
            <button
              onClick={() => setIsAddBillOpen(true)}
              className="clay-button clay-button-primary px-3 py-1.5 text-xs font-bold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Tagihan</span>
            </button>
          </div>

          {bills.length === 0 ? (
            <div className="clay-card-flat p-8 bg-white/95 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-clay-sm">
                <Zap className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">Belum Ada Tagihan Rutin</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Catat tagihan bulanan seperti Listrik PLN, WiFi Internet, PDAM, BPJS, atau IPL agar keuangan keluarga teratur.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setIsAddBillOpen(true)}
                  className="clay-button clay-button-primary px-4 py-2 text-xs font-bold inline-flex items-center space-x-1.5 shadow-clay-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Tagihan Rutin</span>
                </button>
                <button
                  onClick={handlePopulateSampleBills}
                  className="clay-button bg-amber-50 text-amber-800 hover:bg-amber-100 px-3.5 py-2 text-xs font-bold inline-flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Isi Contoh Tagihan (PLN, WiFi, PDAM)</span>
                </button>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* MODAL 1: CREATE GOAL */}
      {isAddGoalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="clay-card bg-white p-5 max-w-sm w-full space-y-4 shadow-clay-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800">Pasang Target Tabungan Baru</h4>
              <button
                onClick={() => setIsAddGoalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoalSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Nama Target / Impian
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Dana Darurat, Liburan Bali"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Target Sasaran Nominal (IDR)
                </label>
                <input
                  type="number"
                  required
                  placeholder="10000000"
                  value={goalTargetAmount}
                  onChange={(e) => setGoalTargetAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl clay-inset text-sm font-bold bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Target Tanggal Tercapai
                </label>
                <input
                  type="date"
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Ikon Kategori
                </label>
                <div className="flex items-center space-x-2">
                  {[
                    { id: 'ShieldCheck', label: 'Keamanan' },
                    { id: 'Plane', label: 'Liburan' },
                    { id: 'Baby', label: 'Anak' },
                    { id: 'Building', label: 'Rumah' },
                  ].map((ic) => (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => setGoalIcon(ic.id)}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                        goalIcon === ic.id
                          ? 'border-clay-primary bg-indigo-50 text-clay-primary'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {ic.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddGoalOpen(false)}
                  className="px-3 py-1.5 rounded-full text-xs text-slate-500 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="clay-button clay-button-primary px-4 py-1.5 text-xs font-bold"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE DEBT */}
      {isAddDebtOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="clay-card bg-white p-5 max-w-sm w-full space-y-4 shadow-clay-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800">Catat Cicilan / Liabilitas Baru</h4>
              <button
                onClick={() => setIsAddDebtOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDebtSubmit} className="space-y-3">
              {/* Skema Pembiayaan: Syariah vs Konvensional */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Skema Pembiayaan
                </label>
                <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl clay-inset">
                  <button
                    type="button"
                    onClick={() => {
                      setDebtScheme('SYARIAH');
                      setDebtInterestRate('0');
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      debtScheme === 'SYARIAH'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    🌙 Syariah (Angsuran Tetap / Bebas Bunga)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDebtScheme('CONVENTIONAL');
                      if (debtInterestRate === '0') setDebtInterestRate('7.5');
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      debtScheme === 'CONVENTIONAL'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    🏛️ Konvensional
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Nama Cicilan / Hutang
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: KPR Rumah, Cicilan Motor"
                  value={debtName}
                  onChange={(e) => setDebtName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Kreditur / Lembaga
                </label>
                <input
                  type="text"
                  placeholder="Misal: Bank Mandiri, BCA Finance"
                  value={debtCreditor}
                  onChange={(e) => setDebtCreditor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    {debtScheme === 'SYARIAH' ? 'Total Sisa Kewajiban (IDR)' : 'Sisa Pokok (IDR)'}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="50000000"
                    value={debtPrincipal}
                    onChange={(e) => setDebtPrincipal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl clay-inset text-xs font-bold bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Cicilan / Bulan
                  </label>
                  <input
                    type="number"
                    placeholder="2500000"
                    value={debtInstallment}
                    onChange={(e) => setDebtInstallment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl clay-inset text-xs font-bold bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Tgl Jatuh Tempo (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={debtDueDateDay}
                    onChange={(e) => setDebtDueDateDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Bunga (% p.a)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={debtInterestRate}
                    onChange={(e) => setDebtInterestRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddDebtOpen(false)}
                  className="px-3 py-1.5 rounded-full text-xs text-slate-500 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="clay-button bg-rose-500 text-white hover:bg-rose-600 px-4 py-1.5 text-xs font-bold"
                >
                  Simpan Cicilan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE BILL */}
      {isAddBillOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="clay-card bg-white p-5 max-w-sm w-full space-y-4 shadow-clay-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800">Tambah Tagihan Rutin</h4>
              <button
                onClick={() => setIsAddBillOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBillSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Nama Tagihan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Listrik PLN, WiFi Indihome, BPJS"
                  value={billTitle}
                  onChange={(e) => setBillTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Nominal Tagihan (IDR)
                </label>
                <input
                  type="number"
                  required
                  placeholder="350000"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl clay-inset text-sm font-bold bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Tanggal Jatuh Tempo
                </label>
                <input
                  type="date"
                  value={billDueDate}
                  onChange={(e) => setBillDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Periode Pembayaran
                </label>
                <select
                  value={billPeriod}
                  onChange={(e) => setBillPeriod(e.target.value as 'MONTHLY' | 'YEARLY')}
                  className="w-full px-3 py-2 rounded-xl clay-inset text-xs bg-white text-slate-800"
                >
                  <option value="MONTHLY">Bulanan (Setiap Bulan)</option>
                  <option value="YEARLY">Tahunan (PBB / STNK / Asuransi)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBillOpen(false)}
                  className="px-3 py-1.5 rounded-full text-xs text-slate-500 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="clay-button clay-button-primary px-4 py-1.5 text-xs font-bold"
                >
                  Simpan Tagihan
                </button>
              </div>
            </form>
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
