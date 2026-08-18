import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Sparkles,
  DollarSign,
  Clock,
  ArrowRight,
  Receipt,
  Plus,
  HeartHandshake,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { formatRupiah, formatDate, formatTime, getStatusBadge } from '../utils/formatters';
import StatCard from '../components/StatCard';
import { CardSkeleton } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import InvoiceModal from '../components/InvoiceModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState(null);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const res = await request.get(API_ENDPOINTS.REPORTS.DASHBOARD);
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 space-y-6">
        <div className="space-y-2">
          <div className="w-48 h-6 bg-slate-200 rounded animate-pulse" />
          <div className="w-72 h-4 bg-slate-100 rounded animate-pulse" />
        </div>
        <CardSkeleton count={4} />
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const todayAppointments = dashboardData?.today_appointments || [];
  const recentBookings = dashboardData?.recent_bookings || [];

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-beauty-800 via-beauty-700 to-rose-600 text-white p-6 sm:p-8 shadow-xl shadow-beauty-900/10">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-rose-100 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-gold-300" />
              Selamat Datang di Panel DD Beauty Serve
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight">
              Kilau Cantik & Performa Bisnis Hari Ini
            </h1>
            <p className="text-rose-100 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              Pantau jadwal reservasi treatment pelanggan, arus kas pendapatan, dan operasional salon secara terpadu.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/bookings')}
              className="px-4 py-2.5 bg-white text-beauty-800 text-xs sm:text-sm font-bold rounded-xl shadow-md hover:bg-rose-50 active:scale-95 transition-all"
            >
              + Reservasi Baru
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="px-4 py-2.5 bg-beauty-900/40 hover:bg-beauty-900/60 border border-white/20 text-white text-xs sm:text-sm font-semibold rounded-xl backdrop-blur-sm active:scale-95 transition-all"
            >
              Lihat Laporan Bulanan
            </button>
          </div>
        </div>

        {/* Ambient decorative circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Pendapatan Bulan Ini"
          value={formatRupiah(stats.total_revenue_month || 0)}
          subtitle="Total penerimaan kas & DP"
          icon={TrendingUp}
          colorScheme="emerald"
        />

        <StatCard
          title="Pengeluaran Bulan Ini"
          value={formatRupiah(stats.total_expense_month || 0)}
          subtitle="Biaya operasional & restock"
          icon={TrendingDown}
          colorScheme="rose"
        />

        <StatCard
          title="Laba Bersih (Net Profit)"
          value={formatRupiah(stats.net_profit_month || 0)}
          subtitle="Pendapatan dikurangi biaya"
          icon={DollarSign}
          colorScheme="beauty"
          trendPositive={(stats.net_profit_month || 0) >= 0}
        />

        <StatCard
          title="Piutang / Sisa Tagihan"
          value={formatRupiah(stats.total_receivables || 0)}
          subtitle="Sisa yang belum lunas"
          icon={Receipt}
          colorScheme="amber"
        />
      </div>

      {/* Grid: Jadwal Hari Ini & Reservasi Terkini */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom 1 & 2: Jadwal Treatment Hari Ini */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-rose-100/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-rose-100/60 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 text-beauty-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Jadwal Perawatan Hari Ini</h3>
                <p className="text-xs text-slate-500">
                  {todayAppointments.length} sesi booking terjadwal untuk hari ini
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/bookings')}
              className="text-xs font-bold text-beauty-700 hover:text-beauty-800 flex items-center gap-1 group"
            >
              Semua Jadwal
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {todayAppointments.length === 0 ? (
            <EmptyState
              title="Belum Ada Jadwal Hari Ini"
              description="Tidak ada reservasi treatment yang dijadwalkan untuk hari ini."
              actionText="Tambah Booking Hari Ini"
              onAction={() => navigate('/bookings')}
            />
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((apt) => {
                const badge = getStatusBadge(apt.status);
                return (
                  <div
                    key={apt.id}
                    className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:border-beauty-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{apt.customer?.name}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-mono font-semibold text-beauty-700">
                          {apt.invoice_number}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-beauty-600" />
                          {formatTime(apt.booking_time)} WIB
                        </span>
                        <span>•</span>
                        <span>Terapis: {apt.beautician_name || '-'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedBookingForInvoice(apt)}
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:text-beauty-700 text-slate-600 text-xs font-semibold shadow-2xs transition-all"
                        title="Lihat Struk/Invoice"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kolom 3: Quick Overview & Reservasi Terbaru */}
        <div className="bg-white rounded-2xl border border-rose-100/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-rose-100/60 mb-4">
              <div className="p-2 rounded-xl bg-rose-50 text-beauty-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Booking Terbaru</h3>
                <p className="text-xs text-slate-500">Transaksi terakhir yang dibuat</p>
              </div>
            </div>

            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBookingForInvoice(b)}
                  className="p-3 rounded-xl hover:bg-rose-50/50 cursor-pointer border border-transparent hover:border-rose-100 transition-all flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800">{b.customer?.name || 'Customer'}</p>
                    <p className="text-[11px] text-slate-500">
                      {formatDate(b.booking_date)} • {formatRupiah(b.grand_total)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {b.payment_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/60">
            <h4 className="text-xs font-bold text-beauty-900 mb-1">Aksi Cepat</h4>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => navigate('/customers')}
                className="p-2.5 bg-white rounded-xl border border-rose-100 text-xs font-bold text-slate-700 hover:text-beauty-700 hover:shadow-xs text-center transition-all"
              >
                + Customer
              </button>
              <button
                type="button"
                onClick={() => navigate('/expenses')}
                className="p-2.5 bg-white rounded-xl border border-rose-100 text-xs font-bold text-slate-700 hover:text-beauty-700 hover:shadow-xs text-center transition-all"
              >
                + Biaya Keluar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal for preview and print/download */}
      {selectedBookingForInvoice && (
        <InvoiceModal
          isOpen={Boolean(selectedBookingForInvoice)}
          onClose={() => setSelectedBookingForInvoice(null)}
          booking={selectedBookingForInvoice}
        />
      )}
    </div>
  );
}
