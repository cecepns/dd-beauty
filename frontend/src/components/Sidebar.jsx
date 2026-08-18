import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from './ConfirmDialog';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Sparkles,
  Receipt,
  TrendingDown,
  BarChart3,
  Settings,
  X,
  HeartHandshake,
  LogOut
} from 'lucide-react';

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    path: '/bookings',
    label: 'Booking & Layanan',
    icon: CalendarCheck,
  },
  {
    path: '/customers',
    label: 'Customer & Rekam Medis',
    icon: Users,
  },
  {
    path: '/treatments',
    label: 'Katalog Treatment',
    icon: Sparkles,
  },
  {
    path: '/expenses',
    label: 'Pengeluaran Bulanan',
    icon: TrendingDown,
  },
  {
    path: '/reports',
    label: 'Laporan Keuangan',
    icon: BarChart3,
  },
  {
    path: '/settings',
    label: 'Pengaturan Studio',
    icon: Settings,
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-rose-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Brand Header */}
        <div className="h-18 flex items-center justify-between px-5 border-b border-rose-100/70 bg-gradient-to-r from-rose-50/50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 py-2 h-auto flex items-center justify-center">
              <img src="/logo.png" alt="DD Beauty Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight font-sans flex items-center gap-1.5">
                DD Beauty
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Beauty Studio Panel</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg lg:hidden hover:bg-rose-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Utama
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-beauty-600 to-beauty-700 text-white shadow-md shadow-beauty-300/40 translate-x-1'
                    : 'text-slate-600 hover:text-beauty-800 hover:bg-rose-50/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : ''}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Logout Button in Menu */}
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all duration-200 mt-3 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Panel</span>
          </button>
        </nav>

        {/* Bottom PWA Info / Studio Tag */}
        <div className="p-4 border-t border-rose-100/70 bg-gradient-to-b from-transparent to-rose-50/40">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-rose-100 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-beauty-50 flex items-center justify-center text-beauty-600">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'DD Beauty Serve'}</p>
              <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PWA Siap Offline
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Confirm Logout Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari panel admin DD Beauty Serve?"
        confirmText="Ya, Keluar"
        cancelText="Batal"
        variant="danger"
      />
    </>
  );
}
