import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Printer,
  FileSpreadsheet,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { formatRupiah } from '../utils/formatters';
import StatCard from '../components/StatCard';
import { CardSkeleton } from '../components/SkeletonLoader';

export default function Reports() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await request.get(API_ENDPOINTS.REPORTS.MONTHLY_FINANCIAL, { year });
      if (res.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Error fetching financial report', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [year]);

  const handlePrint = () => {
    window.print();
  };

  const summary = reportData?.summary || { total_revenue: 0, total_expense: 0, total_net_profit: 0 };
  const breakdown = reportData?.monthly_breakdown || [];

  // Find max value for chart scaling
  const maxVal = Math.max(...breakdown.map((m) => Math.max(m.revenue, m.expense)), 1000000);

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-beauty-600" />
            Laporan Keuangan & Laba Bersih
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rekapitulasi omset pendapatan treatment vs pengeluaran operasional studio.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto no-print">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3.5 py-2 bg-white border border-slate-200 text-xs sm:text-sm font-bold rounded-xl text-slate-800 shadow-2xs focus:ring-2 focus:ring-beauty-500 outline-none cursor-pointer"
          >
            <option value={2026}>Tahun 2026</option>
            <option value={2025}>Tahun 2025</option>
            <option value={2024}>Tahun 2024</option>
          </select>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {isLoading ? (
        <CardSkeleton count={3} />
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            <StatCard
              title={`Total Omset (${year})`}
              value={formatRupiah(summary.total_revenue)}
              subtitle="Penerimaan booking & treatment"
              icon={TrendingUp}
              colorScheme="emerald"
            />

            <StatCard
              title={`Total Pengeluaran (${year})`}
              value={formatRupiah(summary.total_expense)}
              subtitle="Biaya bahan, gaji, sewa & operasional"
              icon={TrendingDown}
              colorScheme="rose"
            />

            <StatCard
              title={`Laba Bersih (${year})`}
              value={formatRupiah(summary.total_net_profit)}
              subtitle="Total pendapatan bersih studio"
              icon={DollarSign}
              colorScheme="beauty"
              trendPositive={summary.total_net_profit >= 0}
            />
          </div>

          {/* Visual Bar Comparison Chart */}
          <div className="p-6 bg-white rounded-2xl border border-rose-100 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-rose-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Grafik Arus Kas Bulanan (Tahun {year})
                </h3>
                <p className="text-xs text-slate-500">
                  Perbandingan pendapatan kas masuk (hijau) vs biaya keluar (merah)
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500" />
                  <span className="text-slate-700">Pendapatan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-500" />
                  <span className="text-slate-700">Pengeluaran</span>
                </div>
              </div>
            </div>

            {/* Chart Bars */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-6 items-end min-h-[220px]">
              {breakdown.map((m) => {
                const revHeight = Math.max(8, Math.round((m.revenue / maxVal) * 160));
                const expHeight = Math.max(8, Math.round((m.expense / maxVal) * 160));

                return (
                  <div key={m.month_index} className="flex flex-col items-center gap-2 group">
                    <div className="flex items-end gap-1 w-full justify-center h-44">
                      {/* Revenue Bar */}
                      <div
                        style={{ height: `${revHeight}px` }}
                        className="w-3.5 sm:w-4 bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all relative group-hover:scale-105"
                        title={`Pendapatan ${m.month_name}: ${formatRupiah(m.revenue)}`}
                      />
                      {/* Expense Bar */}
                      <div
                        style={{ height: `${expHeight}px` }}
                        className="w-3.5 sm:w-4 bg-rose-500 hover:bg-rose-600 rounded-t-md transition-all relative group-hover:scale-105"
                        title={`Pengeluaran ${m.month_name}: ${formatRupiah(m.expense)}`}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 group-hover:text-beauty-700">
                      {m.month_name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="bg-white rounded-2xl border border-rose-100 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-rose-100 bg-rose-50/40 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Tabel Rincian Laba Rugi per Bulan</h3>
              <span className="text-xs text-slate-500">Mata Uang: IDR (Rupiah)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Bulan</th>
                    <th className="py-3 px-4 text-right">Pendapatan Treatment</th>
                    <th className="py-3 px-4 text-right">Pengeluaran Operasional</th>
                    <th className="py-3 px-4 text-right">Laba / (Rugi) Bersih</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {breakdown.map((m) => {
                    const isProfit = m.net_profit >= 0;
                    return (
                      <tr key={m.month_index} className="hover:bg-rose-50/20 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{m.month_name}</td>
                        <td className="py-3 px-4 text-right text-emerald-700 font-semibold">
                          {formatRupiah(m.revenue)}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-700 font-semibold">
                          {formatRupiah(m.expense)}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-bold ${
                            isProfit ? 'text-slate-900' : 'text-rose-600'
                          }`}
                        >
                          {formatRupiah(m.net_profit)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              isProfit
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {isProfit ? (
                              <>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                Profit
                              </>
                            ) : (
                              <>
                                <ArrowDownRight className="w-3.5 h-3.5" />
                                Defisit
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-900">
                  <tr>
                    <td className="py-3 px-4">TOTAL TAHUNAN</td>
                    <td className="py-3 px-4 text-right text-emerald-700">
                      {formatRupiah(summary.total_revenue)}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-700">
                      {formatRupiah(summary.total_expense)}
                    </td>
                    <td className="py-3 px-4 text-right text-beauty-900 text-base">
                      {formatRupiah(summary.total_net_profit)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs uppercase font-extrabold text-beauty-700">
                        {summary.total_net_profit >= 0 ? 'Surplus' : 'Defisit'}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
