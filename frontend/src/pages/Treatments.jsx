import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Plus,
  Edit,
  Trash2,
  Clock,
  Tag,
  Layers,
  CheckCircle2,
  XCircle,
  Scissors
} from 'lucide-react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { formatRupiah } from '../utils/formatters';
import DebounceSearch from '../components/DebounceSearch';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

export default function Treatments() {
  const [treatments, setTreatments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State Treatment
  const [formData, setFormData] = useState({
    name: '',
    category_id: 1,
    duration_minutes: 60,
    price: 0,
    description: '',
    is_active: 1,
  });

  // Form State Category
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'Sparkles',
  });

  const fetchCategories = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.CATEGORIES.LIST);
      if (res.success) setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTreatments = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        category_id: categoryFilter || undefined,
      };
      const res = await request.get(API_ENDPOINTS.TREATMENTS.LIST, params);
      if (res.success) {
        setTreatments(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error('Gagal memuat katalog treatment: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, categoryFilter]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTreatments();
  }, [fetchTreatments]);

  // Open Create Treatment Modal
  const handleOpenCreateModal = () => {
    setSelectedTreatment(null);
    setFormData({
      name: '',
      category_id: categories.length > 0 ? categories[0].id : 1,
      duration_minutes: 60,
      price: 150000,
      description: '',
      is_active: 1,
    });
    setIsTreatmentModalOpen(true);
  };

  // Open Edit Treatment Modal
  const handleOpenEditModal = (t) => {
    setSelectedTreatment(t);
    setFormData({
      name: t.name,
      category_id: t.category_id || 1,
      duration_minutes: t.duration_minutes || 60,
      price: t.price || 0,
      description: t.description || '',
      is_active: t.is_active,
    });
    setIsTreatmentModalOpen(true);
  };

  // Submit Treatment
  const handleTreatmentSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || formData.price === undefined) {
      toast.error('Nama dan harga treatment wajib diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      if (selectedTreatment) {
        const res = await request.put(API_ENDPOINTS.TREATMENTS.UPDATE(selectedTreatment.id), formData);
        if (res.success) {
          toast.success('Treatment berhasil diperbarui');
          setIsTreatmentModalOpen(false);
          fetchTreatments();
        }
      } else {
        const res = await request.post(API_ENDPOINTS.TREATMENTS.CREATE, formData);
        if (res.success) {
          toast.success('Treatment baru berhasil ditambahkan');
          setIsTreatmentModalOpen(false);
          fetchTreatments();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan treatment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit New Category
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name) {
      toast.error('Nama kategori wajib diisi');
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await request.post(API_ENDPOINTS.CATEGORIES.CREATE, categoryForm);
      if (res.success) {
        toast.success('Kategori baru berhasil ditambahkan');
        setIsCategoryModalOpen(false);
        fetchCategories();
        setCategoryForm({ name: '', description: '', icon: 'Sparkles' });
      }
    } catch (err) {
      toast.error(err.message || 'Gagal membuat kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Treatment
  const handleDeleteConfirm = async () => {
    try {
      setIsSubmitting(true);
      const res = await request.delete(API_ENDPOINTS.TREATMENTS.DELETE(selectedTreatment.id));
      if (res.success) {
        toast.success('Treatment berhasil dihapus');
        setIsDeleteOpen(false);
        fetchTreatments();
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus treatment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-beauty-600" />
            Katalog Layanan & Treatment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Daftar harga, durasi sesi, dan paket layanan kecantikan di DD Beauty Serve.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-rose-200 text-beauty-700 text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:bg-rose-50 transition-all"
          >
            <Layers className="w-4 h-4" />
            + Kategori
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-beauty-600 hover:bg-beauty-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-beauty-300/40 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Treatment
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="p-4 bg-white rounded-2xl border border-rose-100 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-1">
          <DebounceSearch
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            placeholder="Cari nama treatment, deskripsi paket..."
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 focus:ring-2 focus:ring-beauty-500 outline-none cursor-pointer"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Treatments Table */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : treatments.length === 0 ? (
          <EmptyState
            title="Tidak Ada Treatment Ditemukan"
            description="Belum ada layanan kecantikan yang sesuai dengan filter pencarian."
            actionText="Tambah Layanan Baru"
            onAction={handleOpenCreateModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-rose-50/50 text-slate-600 font-bold border-b border-rose-100 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Nama Treatment & Kategori</th>
                  <th className="py-3.5 px-4">Durasi Sesi</th>
                  <th className="py-3.5 px-4">Harga Layanan</th>
                  <th className="py-3.5 px-4">Deskripsi / Manfaat</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {treatments.map((t) => (
                  <tr key={t.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{t.name}</div>
                      <span className="inline-block px-2 py-0.5 mt-1 rounded-md text-[10px] font-bold bg-rose-50 text-beauty-700 border border-rose-200">
                        {t.category_name}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Clock className="w-3.5 h-3.5 text-beauty-600" />
                        <span>{t.duration_minutes} Menit</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      {formatRupiah(t.price)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 max-w-sm">
                      <p className="text-xs line-clamp-2 leading-relaxed">{t.description || '-'}</p>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(t)}
                          className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                          title="Edit Treatment"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTreatment(t);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
                          title="Hapus Treatment"
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

      {/* Modal 1: Create / Edit Treatment */}
      <Modal
        isOpen={isTreatmentModalOpen}
        onClose={() => setIsTreatmentModalOpen(false)}
        title={selectedTreatment ? 'Edit Data Treatment' : 'Tambah Treatment Baru'}
        subtitle="Atur nama layanan, kategori, durasi pengerjaan, dan tarif harga"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleTreatmentSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Treatment / Layanan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Korean Glass Skin Rejuvenation"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-beauty-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Harga Treatment (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Durasi Pengerjaan (Menit)</label>
              <input
                type="number"
                min="10"
                step="5"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status Layanan</label>
              <select
                value={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              >
                <option value={1}>Aktif (Bisa dibooking)</option>
                <option value={0}>Non-aktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi / Rincian Sesi</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Jelaskan manfaat, step treatment, dan bahan yang digunakan..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsTreatmentModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-beauty-600 hover:bg-beauty-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Treatment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Create Category */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Tambah Kategori Layanan"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Kategori <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              placeholder="Contoh: Body Slimming & Spa"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Kategori</label>
            <textarea
              rows={2}
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              placeholder="Keterangan kategori..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-beauty-600 hover:bg-beauty-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Tambah Kategori'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Treatment"
        message={`Apakah Anda yakin ingin menghapus treatment "${selectedTreatment?.name}"?`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
