'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import {
  Check,
  Copy,
  MessageCircle,
  QrCode,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';

interface DeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({ isOpen, onClose }) => {
  const { household, currentUser, generateSyncUrl } = useFinance();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const syncUrl = typeof window !== 'undefined' ? generateSyncUrl() : '';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    syncUrl
  )}`;

  const whatsappMessage = `Halo! Ini tautan sinkronisasi instan untuk membuka pembukuan keluarga ${household.name} di HP: ${syncUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(syncUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="clay-card bg-[#F4F7FB] max-w-lg w-full flex flex-col shadow-clay-lg relative overflow-hidden animate-in zoom-in-95 my-auto max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 bg-[#F4F7FB]/95 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-500 text-white flex items-center justify-center shadow-clay-sm shrink-0">
              <Smartphone className="w-5 h-5 drop-shadow" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-800 leading-tight">
                Hubungkan ke HP (Multi-Device)
              </h3>
              <p className="text-xs text-slate-500">
                Buka dan sinkronkan pembukuan keluarga di ponsel
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Active Family Info */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/60 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">
                Keluarga Aktif
              </span>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                {household.name}
              </p>
              <p className="text-[11px] text-slate-500">
                Masuk sebagai: {currentUser.display_name} ({currentUser.relationship})
              </p>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Siap Tersinkron</span>
            </div>
          </div>

          {/* Option 1: QR Code Scan */}
          <div className="text-center space-y-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-center space-x-2 text-slate-700 font-bold text-xs sm:text-sm">
              <QrCode className="w-4 h-4 text-indigo-600" />
              <span>Cara Tercepat: Scan dari Kamera HP</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Buka aplikasi Kamera di HP Anda dan arahkan ke kode QR di bawah:
            </p>

            <div className="inline-block p-3 rounded-2xl bg-white border-2 border-indigo-100 shadow-clay-sm">
              <img
                src={qrCodeUrl}
                alt="QR Code Sinkronisasi HP"
                className="w-44 h-44 sm:w-48 sm:h-48 mx-auto rounded-lg"
                loading="lazy"
              />
            </div>
            <p className="text-[10px] text-slate-400 italic">
              HP akan langsung membuka aplikasi dan memuat seluruh rekening & saldo Anda.
            </p>
          </div>

          {/* Option 2: Share via WhatsApp or Copy Link */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 block">
              Atau Bagikan Tautan ke HP / Pasangan:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* WhatsApp Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition active:scale-95"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Kirim via WhatsApp</span>
              </a>

              {/* Copy Link Button */}
              <button
                type="button"
                onClick={handleCopy}
                className="py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center justify-center space-x-2 transition active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-emerald-700">Tautan Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 shrink-0" />
                    <span>Salin Tautan Sync</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Direct Login Information */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
            <div className="font-bold flex items-center space-x-1.5 mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Login Langsung di HP Tanpa QR:</span>
            </div>
            Anda juga dapat langsung membuka <strong>stfinance.vercel.app</strong> di browser HP, lalu masuk menggunakan email akun Anda (misal: <strong>{currentUser.email || 'byderiana@gmail.com'}</strong>) dan password yang telah Anda buat.
          </div>
        </div>
      </div>
    </div>
  );
};
