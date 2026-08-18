import React, { useState, useEffect } from 'react';
import { Menu, Plus, Calendar, Clock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from './ConfirmDialog';

export default function Header({ onOpenSidebar }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(currentTime);

  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const getInitials = (name) => {
    if (!name) return 'DD';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 sm:h-18 bg-white/90 backdrop-blur-md border-b border-rose-100/80 px-4 sm:px-8 flex items-center justify-between transition-all">
        {/* Left section: Hamburger & Title */}
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="p-2 -ml-1 text-slate-600 hover:text-beauty-700 hover:bg-rose-50 rounded-xl lg:hidden transition-colors cursor-pointer"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:block">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              DD Beauty Studio
              <span className="w-1.5 h-1.5 rounded-full bg-beauty-500" />
              <span className="text-xs font-normal text-slate-500">Panel Reservasi & Keuangan</span>
            </h2>
          </div>
        </div>

        {/* Right section: Live Time, Quick Add Booking, User Profile & Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Live Clock Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50/70 border border-rose-100/80 text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-beauty-600" />
            <span>{formattedDate}</span>
            <span className="text-rose-300">|</span>
            <Clock className="w-3.5 h-3.5 text-beauty-600" />
            <span className="font-mono font-bold text-slate-900">{formattedTime} WIB</span>
          </div>

          {/* Quick Booking Button */}
          <button
            type="button"
            onClick={() => navigate('/bookings?action=new')}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-r from-beauty-600 to-beauty-700 hover:from-beauty-700 hover:to-beauty-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm shadow-beauty-300/50 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Booking Baru</span>
          </button>

          {/* User Avatar & Logout */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-beauty-600 to-pink-400 p-0.5 shadow-sm">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-beauty-700 font-bold text-xs">
                {getInitials(user?.name)}
              </div>
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name || 'Admin Beauty'}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role || 'Owner / Kasir'}</p>
            </div>

            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer ml-1"
              title="Keluar dari Panel"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Confirm Logout Modal */}
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
