import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Tag,
  Receipt,
  FileText
} from 'lucide-react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { formatRupiah, formatDate } from '../utils/formatters';
import DebounceSearch from '../components/DebounceSearch';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

const EXPENSE_CATEGORIES = [
  { value: 'product_supply', label: 'Bahan & Produk Skincare/Lash' },
  { value: 'staff_salary', label: 'Gaji Terapis / Staf' },
  { value: 'rent', label: 'Sewa Tempat & Ruko' },
  { value: 'utilities', label: 'Listrik, Air & Internet' },
  { value: 'marketing', label: 'Marketing & Iklan Medsos' },
  { value: 'operational', label: 'Operasional & Maintenance' },
  { value: 'other', label: 'Pengeluaran Lainnya' },
];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ total_expense: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState(String(new Date().getMonth() + 1));
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    category: 'product_supply',
    title: '',
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'transfer',
    notes: '',
  });

  const fetchExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        category: categoryFilter || undefined,
        month: monthFilter || undefined,
        year: yearFilter || undefined,
      };
      const res = await request.get(API_ENDPOINTS.EXPENSES.LIST, params);
      if (res.success) {
        setExpenses(res.data);
        setSummary(res.summary || { total_expense: 0 });
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error('Gagal memuat pengeluaran: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, categoryFilter, monthFilter, yearFilter]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setSelectedExpense(null);
    setFormData({
      category: 'product_supply',
      title: '',
      amount: 100000,
      expense_date: new Date().toISOString().split('T')[0],
      payment_method: 'transfer',
      notes: '',
    });
    setIsExpenseModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (exp) => {
    setSelectedExpense(exp);
    setFormData({
      category: exp.category,
      title: exp.title,
      amount: exp.amount,
      expense_date: exp.expense_date ? exp.expense_date.split('T')[0] : '',
      payment_method: exp.payment_method || 'transfer',
      notes: exp.notes || '',
    });
    setIsExpenseModalOpen(true);
  };

  // Submit Expense
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || formData.amount === undefined || !formData.expense_date) {
      toast.error('Judul, nominal, dan tanggal pengeluaran wajib diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      if (selectedExpense) {
        const res = await request.put(API_ENDPOINTS.EXPENSES.UPDATE(selectedExpense.id), formData);
        if (res.success) {
          toast.success('Pengeluaran berhasil diperbarui');
          setIsExpenseModalOpen(false);
          fetchExpenses();
        }
      } else {
        const res = await request.post(API_ENDPOINTS.EXPENSES.CREATE, formData);
        if (res.success) {
          toast.success('Pengeluaran baru berhasil dicatat');
          setIsExpenseModalOpen(false);
          fetchExpenses();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan pengeluaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Expense
  const handleDeleteConfirm = async () => {
    try {
      setIsSubmitting(true);
      const res = await request.delete(API_ENDPOINTS.EXPENSES.DELETE(selectedExpense.id));
      if (res.success) {
        toast.success('Pengeluaran berhasil dihapus');
        setIsDeleteOpen(false);
        fetchExpenses();
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus pengeluaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (cat) => {
    const found = EXPENSE_CATEGORIES.find((c) => c.value === cat);
    return found ? found.label : cat;
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 flex items-center gap-2.5">
            <TrendingDown className="w-6 h-6 text-rose-600" />
            Pengeluaran & Biaya Operasional
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Catat dan pantau belanja bahan salon, sewa studio, gaji staf, dan operasional bulanan.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-rose-300/40 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Catat Pengeluaran Baru
        </button>
      </div>

      {/* Summary Card for Selected Period */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-rose-100 uppercase tracking-wider">
            Total Pengeluaran Bulan Ini
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
            {formatRupiah(summary.total_expense)}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs bg-black/15 backdrop-blur-xs px-3 py-2 rounded-xl">
          <Calendar className="w-4 h-4 text-rose-200" />
          <span>
            Periode: Bulan {monthFilter}, Tahun {yearFilter}
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="p-4 bg-white rounded-2xl border border-rose-100 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="w-full md:flex-1">
          <DebounceSearch
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            placeholder="Cari no. pengeluaran, judul biaya, atau keterangan..."
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="w-full md:w-auto px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 focus:ring-2 focus:ring-beauty-500 outline-none"
        >
          <option value="">Semua Kategori Biaya</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        {/* Month Filter */}
        <select
          value={monthFilter}
          onChange={(e) => {
            setMonthFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="w-full md:w-auto px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 focus:ring-2 focus:ring-beauty-500 outline-none"
        >
          <option value="">Semua Bulan</option>
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i + 1} value={String(i + 1)}>
              Bulan {i + 1}
            </option>
          ))}
        </select>

        {/* Year Filter */}
        <select
          value={yearFilter}
          onChange={(e) => {
            setYearFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="w-full md:w-auto px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 focus:ring-2 focus:ring-beauty-500 outline-none"
        >
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : expenses.length === 0 ? (
          <EmptyState
            title="Tidak Ada Catatan Pengeluaran"
            description="Belum ada transaksi pengeluaran yang dicatat pada periode ini."
            actionText="Catat Biaya Baru"
            onAction={handleOpenCreateModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-rose-50/50 text-slate-600 font-bold border-b border-rose-100 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">No. & Tanggal</th>
                  <th className="py-3.5 px-4">Kategori Biaya</th>
                  <th className="py-3.5 px-4">Judul Pengeluaran & Catatan</th>
                  <th className="py-3.5 px-4">Jumlah Nominal</th>
                  <th className="py-3.5 px-4">Metode Bayar</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 text-xs">
                        {exp.expense_number}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formatDate(exp.expense_date)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {getCategoryLabel(exp.category)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-bold text-slate-900">{exp.title}</div>
                      {exp.notes && (
                        <p className="text-xs text-slate-500 mt-0.5 italic">"{exp.notes}"</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-rose-600 text-sm">
                      {formatRupiah(exp.amount)}
                    </td>

                    <td className="py-3.5 px-4 uppercase font-semibold text-slate-600 text-xs">
                      {exp.payment_method}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(exp)}
                          className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                          title="Edit Pengeluaran"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExpense(exp);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
                          title="Hapus Pengeluaran"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
            onLimitChange={(l) => setPagination((prev) => ({ ...prev, limit: l, page: 1 }))}
          />
        </div>
      </div>

      {/* Modal: Create / Edit Expense */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title={selectedExpense ? 'Edit Data Pengeluaran' : 'Catat Pengeluaran Baru'}
        subtitle="Masukkan detail transaksi biaya operasional salon"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori Biaya <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Pengeluaran <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul Pengeluaran <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Beli Serum Collagen 10 Botol"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nominal Biaya (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Metode Bayar</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              >
                <option value="transfer">Transfer Bank</option>
                <option value="cash">Tunai / Kas Kecil</option>
                <option value="card">Kartu Debit / Kredit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Supplier</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan tambahan nomor nota, supplier, atau tujuan biaya..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Pengeluaran"
        message={`Apakah Anda yakin ingin menghapus data pengeluaran "${selectedExpense?.title}"?`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
