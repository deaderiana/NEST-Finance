'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import {
  Bell,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Home,
  KeyRound,
  Lock,
  LogOut,
  PlusCircle,
  Shield,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { formatDateID } from '@/lib/ledgerEngine';

interface HeaderProps {
  onOpenRegisterModal: () => void;
  onGoToLanding?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRegisterModal, onGoToLanding, onLogout }) => {
  const {
    currentUser,
    users,
    setCurrentUser,
    household,
    hideBalance,
    toggleHideBalance,
    notifications,
    markNotificationRead,
    setActiveTab,
    isPasswordSet,
    lockApp,
  } = useFinance();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-[#EBF1F6]/95 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 border-b border-white/60 w-full">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* App Logo & Household Name - Guaranteed visible and never truncated */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-clay-primary to-indigo-600 flex items-center justify-center text-white shadow-clay-sm shrink-0">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center space-x-1.5 whitespace-nowrap">
              <h1 className="font-extrabold text-base sm:text-lg text-slate-800 tracking-tight leading-none whitespace-nowrap">
                NEST<span className="text-clay-primary">.Finance</span>
              </h1>
              <span className="text-[9px] sm:text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full border border-indigo-200 shrink-0">
                v1.1
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate max-w-[110px] xs:max-w-[150px] sm:max-w-[220px] leading-tight mt-0.5">
              {household.name}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Landing Page Link Button */}
          {onGoToLanding && (
            <button
              onClick={onGoToLanding}
              className="clay-button px-2.5 sm:px-3 py-1.5 bg-[#F4F7FB] text-slate-700 hover:text-indigo-600 text-xs font-bold shrink-0 flex items-center space-x-1"
              title="Ke Halaman Depan / Landing Page"
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0" />
              <span className="hidden sm:inline">Landing</span>
            </button>
          )}

          {/* Quick Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="clay-button px-2.5 sm:px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold shrink-0 flex items-center space-x-1"
              title="Keluar dari Akun (Logout)"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 shrink-0" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          )}

          {/* Dedicated Registration Button (Only on large screens to preserve mobile header space) */}
          <button
            onClick={onOpenRegisterModal}
            className="hidden lg:flex clay-button px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-clay-sm hover:scale-105 active:scale-95 items-center space-x-1.5 shrink-0"
            title="Daftar Akun & Rumah Tangga Baru (Data Riil)"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Data Riil</span>
          </button>

          {/* Quick Lock Button (Visible when password is configured) */}
          {isPasswordSet && (
            <button
              onClick={lockApp}
              title="Kunci Layar Aplikasi Sekarang"
              className="w-8 h-8 sm:w-9 sm:h-9 clay-button bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs shrink-0 flex items-center justify-center"
            >
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {/* Privacy Toggle (Hide/Show Saldo) */}
          <button
            onClick={toggleHideBalance}
            title={hideBalance ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
            className="w-8 h-8 sm:w-9 sm:h-9 clay-button bg-[#F4F7FB] text-slate-600 hover:text-clay-primary text-xs shrink-0"
          >
            {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifModal(!showNotifModal)}
              title="Notifikasi"
              className="w-8 h-8 sm:w-9 sm:h-9 clay-button bg-[#F4F7FB] text-slate-600 hover:text-clay-primary text-xs relative shrink-0"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown & Backdrop */}
            {showNotifModal && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/10 sm:bg-transparent"
                  onClick={() => setShowNotifModal(false)}
                />
                <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-96 clay-card bg-[#F4F7FB] p-4 shadow-clay-lg z-50 animate-in fade-in zoom-in-95">
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
              </>
            )}
          </div>

          {/* Active Couple Switcher & Security Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="clay-button px-2 sm:px-3 py-1 sm:py-1.5 bg-[#F4F7FB] text-slate-700 hover:text-clay-primary flex items-center space-x-1.5 sm:space-x-2 shrink-0"
              title="Beralih Akun Anggota (Maker-Checker)"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${
                  currentUser.relationship === 'Suami' ? 'bg-blue-500' : 'bg-pink-500'
                }`}
              >
                {currentUser.display_name.charAt(0)}
              </div>
              <div className="text-left hidden md:block">
                <span className="text-xs font-semibold block leading-tight">
                  {currentUser.display_name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {currentUser.relationship} ({currentUser.role})
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Couple Switcher Dropdown & Backdrop */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/10 sm:bg-transparent"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 sm:w-72 clay-card bg-[#F4F7FB] p-3 shadow-clay-lg z-50 animate-in fade-in zoom-in-95">
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

                  {/* Security / App Lock action inside menu */}
                  <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
                    {isPasswordSet ? (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          lockApp();
                        }}
                        className="w-full flex items-center space-x-2 p-2 rounded-xl text-xs font-bold text-amber-800 hover:bg-amber-50 transition-colors"
                      >
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span>Kunci Layar Aplikasi Sekarang</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setActiveTab('settings');
                        }}
                        className="w-full flex items-center space-x-2 p-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <KeyRound className="w-4 h-4 text-slate-500" />
                        <span>Atur Password / PIN Aplikasi</span>
                      </button>
                    )}

                    {/* Go To Landing Page option */}
                    {onGoToLanding && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onGoToLanding();
                        }}
                        className="w-full flex items-center space-x-2 p-2 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition-colors"
                      >
                        <Home className="w-4 h-4 text-indigo-600" />
                        <span>Halaman Depan (Landing Page)</span>
                      </button>
                    )}

                    {/* Logout option */}
                    {onLogout && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onLogout();
                        }}
                        className="w-full flex items-center space-x-2 p-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Keluar dari Akun (Logout)</span>
                      </button>
                    )}

                    {/* Add/Register New Household link */}
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

                  <div className="mt-2 p-2 bg-amber-50 rounded-xl border border-amber-200/60 text-[10px] text-amber-800 leading-snug">
                    <span className="font-semibold block mb-0.5">💡 Prinsip Maker-Checker:</span>
                    Transaksi di atas Rp 1 Juta yang dibuat Suami hanya bisa disetujui Istri, dan sebaliknya.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
