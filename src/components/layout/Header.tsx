'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import {
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  PlusCircle,
  Shield,
  Sparkles,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { formatDateID } from '@/lib/ledgerEngine';

interface HeaderProps {
  onOpenRegisterModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRegisterModal }) => {
  const {
    currentUser,
    users,
    setCurrentUser,
    household,
    hideBalance,
    toggleHideBalance,
    notifications,
    markNotificationRead,
    pendingApprovalsCount,
    setActiveTab,
  } = useFinance();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-[#EBF1F6]/90 backdrop-blur-md px-4 py-3 border-b border-white/60">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* App Logo & Household Name */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-clay-primary to-indigo-600 flex items-center justify-center text-white shadow-clay-sm">
            <Shield className="w-5 h-5 drop-shadow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg text-slate-800 tracking-tight leading-none">
                NEST<span className="text-clay-primary">.Finance</span>
              </h1>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded-full border border-indigo-200">
                v1.1
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate max-w-[150px] sm:max-w-xs">
              {household.name}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Dedicated Registration Button */}
          <button
            onClick={onOpenRegisterModal}
            className="clay-button px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-clay-sm hover:scale-105 active:scale-95 flex items-center space-x-1.5"
            title="Daftar Akun & Rumah Tangga Baru (Data Riil)"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Daftar Data Riil</span>
            <span className="sm:hidden">Daftar</span>
          </button>

          {/* Privacy Toggle (Hide/Show Saldo) */}
          <button
            onClick={toggleHideBalance}
            title={hideBalance ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
            className="w-9 h-9 clay-button bg-[#F4F7FB] text-slate-600 hover:text-clay-primary text-xs"
          >
            {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifModal(!showNotifModal)}
              title="Notifikasi"
              className="w-9 h-9 clay-button bg-[#F4F7FB] text-slate-600 hover:text-clay-primary text-xs relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifModal && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 clay-card bg-[#F4F7FB] p-4 shadow-clay-lg z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-clay-primary" />
                    <h3 className="font-bold text-sm text-slate-800">Pemberitahuan</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {unreadCount} belum dibaca
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-2 space-y-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Tidak ada notifikasi saat ini
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.type === 'APPROVAL_REQUEST') {
                            setActiveTab('transactions');
                            setShowNotifModal(false);
                          }
                        }}
                        className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                          n.read ? 'bg-transparent text-slate-500' : 'bg-blue-50/80 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-xs font-semibold">{n.title}</p>
                          <span className="text-[10px] text-slate-400">
                            {formatDateID(n.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-snug">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active Couple Switcher (Maker-Checker Demonstration) */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="clay-button px-3 py-1.5 bg-[#F4F7FB] text-slate-700 hover:text-clay-primary flex items-center space-x-2"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${
                  currentUser.relationship === 'Suami' ? 'bg-blue-500' : 'bg-pink-500'
                }`}
              >
                {currentUser.display_name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-semibold block leading-tight">
                  {currentUser.display_name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {currentUser.relationship} ({currentUser.role})
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Couple Switcher Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 clay-card bg-[#F4F7FB] p-3 shadow-clay-lg z-50">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                  Beralih Akun Anggota
                </p>
                <div className="space-y-1">
                  {users.map((u) => {
                    const isSelected = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          setCurrentUser(u.id);
                          setShowUserMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-clay-primary text-white shadow-sm'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isSelected
                                ? 'bg-white text-clay-primary'
                                : u.relationship === 'Suami'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-pink-100 text-pink-700'
                            }`}
                          >
                            {u.display_name.charAt(0)}
                          </div>
                          <div className="text-left">
                            <span className="block font-semibold">{u.display_name}</span>
                            <span
                              className={`text-[10px] ${
                                isSelected ? 'text-blue-100' : 'text-slate-400'
                              }`}
                            >
                              {u.relationship} · {u.role === 'OWNER' ? 'Kepala Keluarga' : 'Pasangan'}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </button>
                    );
                  })}
                </div>

                {/* Add/Register New Household link */}
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenRegisterModal();
                    }}
                    className="w-full flex items-center space-x-2 p-2 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>Daftar Rumah Tangga Riil</span>
                  </button>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200/80 px-1">
                  <p className="text-[10px] text-slate-500 leading-tight">
                    💡 <strong>Prinsip Maker-Checker</strong>: Transaksi di atas Rp 1 Juta yang dibuat Suami hanya bisa disetujui Istri, dan sebaliknya.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
