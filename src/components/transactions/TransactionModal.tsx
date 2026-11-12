'use client';

import React, { useState, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { TransactionType } from '@/types/finance';
import { formatIDR } from '@/lib/ledgerEngine';
import {
  Sparkles,
  X,
  Bot,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  AlertTriangle,
} from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    accounts,
    categories,
    approvalPolicy,
    createTransaction,
  } = useFinance();

  const [inputMode, setInputMode] = useState<'QUICK' | 'ADVANCED' | 'AI'>('QUICK');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const [txType, setTxType] = useState<TransactionType>('EXPENSE');
  const [amountStr, setAmountStr] = useState('');
  const [amountNum, setAmountNum] = useState(0);
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [destinationAccountId, setDestinationAccountId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState('');
  const [merchant, setMerchant] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  const handleFormatAmount = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10) || 0;
    setAmountNum(num);
    setAmountStr(num > 0 ? num.toLocaleString('id-ID') : '');
  };

  const isOverThreshold =
    txType === 'EXPENSE' &&
    amountNum >= (approvalPolicy?.threshold_amount ?? 1000000);

  const filteredCategories = categories.filter((c) =>
    txType === 'INCOME' ? c.category_type === 'INCOME' : c.category_type === 'EXPENSE'
  );

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const clean = tagInput.trim().replace(/^#/, '');
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSimulateOCR = (type: 'SUPERINDO' | 'PLN' | 'TOKOPEDIA') => {
    if (type === 'SUPERINDO') {
      setTxType('EXPENSE');
      setAmountNum(642500);
      setAmountStr((642500).toLocaleString('id-ID'));
      setDescription('Belanja Mingguan Superindo');
      setMerchant('Superindo Express');
      setCategoryId(
        categories.find((c) => c.name.toLowerCase().includes('dapur') || c.name.toLowerCase().includes('makan'))?.id ||
        categories[0]?.id || ''
      );
      setAiNotice('Struk Superindo berhasil dibaca: Total Rp 642.500');
    } else if (type === 'PLN') {
      setTxType('EXPENSE');
      setAmountNum(850000);
      setAmountStr((850000).toLocaleString('id-ID'));
      setDescription('Token Listrik PLN Bulanan');
      setMerchant('PLN');
      setCategoryId(
        categories.find((c) => c.name.toLowerCase().includes('listrik') || c.name.toLowerCase().includes('tagihan') || c.name.toLowerCase().includes('utilitas'))?.id ||
        categories[0]?.id || ''
      );
      setAiNotice('Tagihan PLN berhasil dibaca: Rp 850.000');
    } else if (type === 'TOKOPEDIA') {
      setTxType('EXPENSE');
      setAmountNum(1250000);
      setAmountStr((1250000).toLocaleString('id-ID'));
      setDescription('Belanja Elektronik Rumah Tokopedia');
      setMerchant('Tokopedia Official Store');
      setCategoryId(
        categories.find((c) => c.name.toLowerCase().includes('rumah') || c.name.toLowerCase().includes('belanja'))?.id ||
        categories[0]?.id || ''
      );
      setAiNotice('Invoice Tokopedia berhasil dibaca: Rp 1.250.000 (Perlu Maker-Checker Pasangan)');
    }
    setInputMode('QUICK');
  };

  const handleProcessAiPrompt = () => {
    if (!aiPrompt.trim()) return;
    setIsAiProcessing(true);

    setTimeout(() => {
      const lower = aiPrompt.toLowerCase();
      let extractedAmount = 0;
      const numMatch = lower.match(/(\d+[\d\.,]*)\s*(rb|ribu|k|jt|juta)?/);
      if (numMatch) {
        let val = parseFloat(numMatch[1].replace(/\./g, '').replace(',', '.'));
        const unit = numMatch[2];
        if (unit === 'rb' || unit === 'ribu' || unit === 'k') val *= 1000;
        else if (unit === 'jt' || unit === 'juta') val *= 1000000;
        extractedAmount = Math.round(val);
      } else {
        extractedAmount = 150000;
      }

      setAmountNum(extractedAmount);
      setAmountStr(extractedAmount.toLocaleString('id-ID'));

      if (lower.includes('gaji') || lower.includes('masuk') || lower.includes('bonus')) {
        setTxType('INCOME');
        setDescription('Pemasukan: ' + aiPrompt.slice(0, 30));
      } else if (lower.includes('transfer') || lower.includes('pindah')) {
        setTxType('TRANSFER');
        setDescription('Transfer Dana');
      } else {
        setTxType('EXPENSE');
        setDescription(aiPrompt.slice(0, 40));
      }

      setAiNotice(`AI berhasil menguraikan: Rp ${extractedAmount.toLocaleString('id-ID')}`);
      setIsAiProcessing(false);
      setInputMode('QUICK');
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (amountNum <= 0) {
      setStatusMessage({ type: 'error', text: 'Nominal transaksi harus lebih dari 0' });
      return;
    }
    if (!description.trim()) {
      setStatusMessage({ type: 'error', text: 'Keterangan transaksi wajib diisi' });
      return;
    }

    const res = createTransaction({
      transaction_type: txType,
      amount: amountNum,
      description: description.trim(),
      account_id: accountId,
      destination_account_id: txType === 'TRANSFER' ? destinationAccountId : undefined,
      category_id: txType === 'TRANSFER' ? undefined : (categoryId || undefined),
      merchant: merchant.trim() || undefined,
      transaction_date: txDate,
      note: note.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setTimeout(() => {
        setAmountStr('');
        setAmountNum(0);
        setDescription('');
        setMerchant('');
        setNote('');
        setTags([]);
        setStatusMessage(null);
        setAiNotice(null);
        onClose();
      }, 1200);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="clay-card bg-[#F4F7FB] max-w-lg w-full max-h-[92vh] flex flex-col shadow-clay-lg relative overflow-hidden animate-in fade-in zoom-in-95">
        {/* Fixed/Sticky Header */}
        <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200/80 bg-[#F4F7FB]/95 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-clay-primary text-white flex items-center justify-center shadow-clay-sm shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Catat Transaksi</h3>
              <p className="text-[11px] text-slate-400">
                Pencatat: <strong>{currentUser?.display_name || 'User'}</strong> ({currentUser?.relationship || 'Anggota'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-3">
          {/* Input Mode Selector */}
          <div className="flex items-center justify-center mb-3">
            <div className="flex items-center space-x-1 p-1 bg-[#E8EFF5] rounded-full clay-inset text-xs">
              <button
                type="button"
                onClick={() => setInputMode('QUICK')}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  inputMode === 'QUICK' ? 'clay-pill-active' : 'clay-pill-inactive'
                }`}
              >
                Input Cepat
              </button>
              <button
                type="button"
                onClick={() => setInputMode('ADVANCED')}
                className={`px-3 py-1 rounded-full font-semibold transition-all ${
                  inputMode === 'ADVANCED' ? 'clay-pill-active' : 'clay-pill-inactive'
                }`}
              >
                Lengkap
              </button>
              <button
                type="button"
                onClick={() => setInputMode('AI')}
                className={`px-3 py-1 rounded-full font-semibold transition-all flex items-center space-x-1 ${
                  inputMode === 'AI' ? 'clay-pill-active' : 'clay-pill-inactive'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI / OCR Struk</span>
              </button>
            </div>
          </div>

          {/* AI & OCR Assistant Mode */}
          {inputMode === 'AI' ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 space-y-3">
                <div className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-xs text-indigo-950">
                    Input Bahasa Alami (Natural Language AI)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Tulis transaksi Anda dengan kalimat sehari-hari, AI akan otomatis membedah nominal, kategori, rekening dan tipe transaksi.
                </p>
                <textarea
                  rows={3}
                  placeholder="Contoh: Belanja popok dan susu di Indomaret 185rb pakai BCA bersama..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full p-3 rounded-xl clay-inset text-xs text-slate-800 placeholder-slate-400 bg-white"
                />
                <button
                  type="button"
                  onClick={handleProcessAiPrompt}
                  disabled={isAiProcessing || !aiPrompt.trim()}
                  className="w-full clay-button clay-button-primary py-2 text-xs font-bold"
                >
                  {isAiProcessing ? 'Memproses dengan AI...' : 'Urai & Buat Draf Transaksi'}
                </button>
              </div>

              {/* OCR Receipt Scanner Simulator */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-3">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-bold text-xs text-emerald-950">
                    Pindai Struk Belanja (OCR)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600">
                  Pilih sampel struk untuk mengekstrak merchant, total belanja, dan tanggal secara otomatis:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSimulateOCR('SUPERINDO')}
                    className="p-2.5 rounded-xl bg-white border border-emerald-200 text-left hover:bg-emerald-100/50 transition-colors"
                  >
                    <span className="font-bold text-xs text-slate-800 block">Superindo</span>
                    <span className="text-[10px] text-slate-500">Rp 642.500 (Dapur)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateOCR('PLN')}
                    className="p-2.5 rounded-xl bg-white border border-emerald-200 text-left hover:bg-emerald-100/50 transition-colors"
                  >
                    <span className="font-bold text-xs text-slate-800 block">PLN Listrik</span>
                    <span className="text-[10px] text-slate-500">Rp 850.000 (Tagihan)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateOCR('TOKOPEDIA')}
                    className="p-2.5 rounded-xl bg-white border border-emerald-200 text-left hover:bg-emerald-100/50 transition-colors"
                  >
                    <span className="font-bold text-xs text-slate-800 block">Tokopedia</span>
                    <span className="text-[10px] text-slate-500">Rp 1.250.000 (&gt;1Jt)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Quick / Advanced Form */
            <form onSubmit={handleSubmit} className="space-y-3">
              {aiNotice && (
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-medium flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{aiNotice}</span>
                </div>
              )}

              {/* Transaction Type Pills */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('EXPENSE')}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    txType === 'EXPENSE'
                      ? 'clay-button-expense text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Uang Keluar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTxType('INCOME')}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    txType === 'INCOME'
                      ? 'clay-button-income text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Uang Masuk</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTxType('TRANSFER')}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    txType === 'TRANSFER'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Pindah Dana</span>
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Nominal (IDR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-slate-400 text-sm">
                    Rp
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="0"
                    value={amountStr}
                    onChange={(e) => handleFormatAmount(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl clay-inset text-lg font-extrabold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-clay-primary"
                  />
                </div>

                {/* Threshold Warning Indicator */}
                {isOverThreshold && (
                  <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 text-[11px] text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Nominal melebihi ambang batas{' '}
                      <strong>{formatIDR(approvalPolicy?.threshold_amount || 1000000)}</strong>. Transaksi ini akan berstatus{' '}
                      <strong>Menunggu Persetujuan Pasangan</strong> sebelum diposting ke buku besar.
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Keterangan Transaksi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Belanja Bulanan Superindo"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl clay-inset text-xs text-slate-800 bg-white"
                />
              </div>

              {/* Accounts & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    {txType === 'TRANSFER' ? 'Rekening Sumber' : 'Rekening'}
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl clay-inset text-xs text-slate-800 bg-white"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.scope === 'SHARED' ? 'Bersama' : 'Pribadi'})
                      </option>
                    ))}
                  </select>
                </div>

                {txType === 'TRANSFER' ? (
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Rekening Tujuan
                    </label>
                    <select
                      value={destinationAccountId}
                      onChange={(e) => setDestinationAccountId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl clay-inset text-xs text-slate-800 bg-white"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Kategori
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl clay-inset text-xs text-slate-800 bg-white"
                    >
                      <option value="">Pilih Kategori...</option>
                      {filteredCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Advanced Input Fields */}
              {inputMode === 'ADVANCED' && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Nama Merchant / Toko
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Superindo Express"
                        value={merchant}
                        onChange={(e) => setMerchant(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl clay-inset text-xs text-slate-800 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Tanggal Transaksi
                      </label>
                      <input
                        type="date"
                        value={txDate}
                        onChange={(e) => setTxDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl clay-inset text-xs text-slate-800 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Catatan Internal Keluarga
                    </label>
                    <input
                      type="text"
                      placeholder="Catatan tambahan..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl clay-inset text-xs text-slate-800 bg-white"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Tag / Label
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Tambah tag..."
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        className="flex-1 px-3 py-1.5 rounded-xl clay-inset text-xs text-slate-800 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="clay-button px-3 py-1.5 bg-slate-200 text-xs text-slate-700"
                      >
                        Tambah
                      </button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {tags.map((t) => (
                          <span
                            key={t}
                            className="bg-indigo-100 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1"
                          >
                            <span>#{t}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(t)}
                              className="hover:text-red-500"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status message */}
              {statusMessage && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-semibold ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {statusMessage.text}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 pb-3">
                <button
                  type="submit"
                  className="w-full clay-button clay-button-primary py-2.5 text-sm font-bold shadow-clay-primary"
                >
                  {isOverThreshold ? 'Ajukan Transaksi (Minta Persetujuan)' : 'Simpan & Posting Transaksi'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
