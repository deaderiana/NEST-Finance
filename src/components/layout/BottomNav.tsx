'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';
import {
  ArrowLeftRight,
  BarChart3,
  Home,
  PieChart,
  Plus,
  Settings,
  Target,
} from 'lucide-react';

interface BottomNavProps {
  onOpenAddModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenAddModal }) => {
  const { activeTab, setActiveTab, pendingApprovalsCount } = useFinance();

  const leftNavItems = [
    { id: 'dashboard', label: 'Beranda', icon: Home },
    {
      id: 'transactions',
      label: 'Transaksi',
      icon: ArrowLeftRight,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { id: 'budgets', label: 'Anggaran', icon: PieChart },
  ];

  const rightNavItems = [
    { id: 'goals', label: 'Tabungan', icon: Target },
    { id: 'reports', label: 'Laporan', icon: BarChart3 },
    { id: 'settings', label: 'Lainnya', icon: Settings },
  ];

  const renderNavButton = (item: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        className={`flex flex-col items-center justify-center py-1 px-1.5 sm:px-2.5 rounded-2xl transition-all relative flex-1 ${
          isActive
            ? 'text-clay-primary font-bold'
            : 'text-slate-500 hover:text-slate-800 font-medium'
        }`}
      >
        <div
          className={`p-1.5 rounded-xl transition-all ${
            isActive
              ? 'bg-clay-primary/10 shadow-clay-sm text-clay-primary'
              : 'bg-transparent'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight leading-tight">{item.label}</span>

        {item.badge && (
          <span className="absolute top-0 right-2 w-4 h-4 bg-amber-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow ring-1 ring-white">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#EBF1F6]/95 backdrop-blur-md border-t border-white/80 px-2 py-1.5 sm:py-2">
      <div className="max-w-xl mx-auto flex items-center justify-between relative">
        {/* Left 3 Menu Items (Beranda, Transaksi, Anggaran) */}
        <div className="flex-1 flex items-center justify-around">
          {leftNavItems.map(renderNavButton)}
        </div>

        {/* Center Space & Perfectly Centered Floating Action Button */}
        <div className="w-14 sm:w-16 flex items-center justify-center shrink-0">
          <button
            onClick={onOpenAddModal}
            className="absolute left-1/2 -translate-x-1/2 -top-5 sm:-top-6 w-14 h-14 rounded-full bg-gradient-to-tr from-clay-primary to-indigo-600 text-white flex items-center justify-center shadow-clay-primary hover:scale-105 active:scale-95 transition-all ring-4 ring-[#EBF1F6] z-10"
            title="Tambah Transaksi Baru"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Right 3 Menu Items (Tabungan, Laporan, Lainnya) */}
        <div className="flex-1 flex items-center justify-around">
          {rightNavItems.map(renderNavButton)}
        </div>
      </div>
    </div>
  );
};
