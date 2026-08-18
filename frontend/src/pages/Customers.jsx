import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  FileHeart,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  Eye,
  Clock,
  Receipt
} from 'lucide-react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { formatDate, formatShortDate, formatRupiah } from '../utils/formatters';
import DebounceSearch from '../components/DebounceSearch';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('');

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddMedicalModalOpen, setIsAddMedicalModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State Customer
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'female',
    birth_date: '',
    address: '',
    member_status: 'regular',
    notes: '',
  });

  // Form State Medical Record
  const [medicalForm, setMedicalForm] = useState({
    skin_type: 'Kombinasi',
    allergies: 'Tidak ada',
    skin_concerns: '',
    contraindications: 'Tidak ada',
    treatment_history_notes: '',
    beautician_notes: '',
    record_date: new Date().toISOString().split('T')[0],
  });

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        member_status: memberFilter || undefined,
      };
      const res = await request.get(API_ENDPOINTS.CUSTOMERS.LIST, params);
      if (res.success) {
        setCustomers(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error('Gagal memuat data customer: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, memberFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Open Create Customer Modal
  const handleOpenCreateModal = () => {
    setSelectedCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      gender: 'female',
      birth_date: '',
      address: '',
      member_status: 'regular',
      notes: '',
    });
    setIsCustomerModalOpen(true);
  };

  // Open Edit Customer Modal
  const handleOpenEditModal = (cust) => {
    setSelectedCustomer(cust);
    setFormData({
      name: cust.name,
      phone: cust.phone,
      email: cust.email || '',
      gender: cust.gender || 'female',
      birth_date: cust.birth_date ? cust.birth_date.split('T')[0] : '',
      address: cust.address || '',
      member_status: cust.member_status || 'regular',
      notes: cust.notes || '',
    });
    setIsCustomerModalOpen(true);
  };

  // View Customer Detail & Medical Records
  const handleViewDetail = async (cust) => {
    setSelectedCustomer(cust);
    try {
      const res = await request.get(API_ENDPOINTS.CUSTOMERS.DETAIL(cust.id));
      if (res.success) {
        setSelectedCustomerDetail(res.data);
        setIsDetailModalOpen(true);
      }
    } catch (err) {
      toast.error('Gagal memuat data detail: ' + err.message);
    }
  };

  // Submit Customer (Create / Update)
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Nama dan Nomor WhatsApp wajib diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      if (selectedCustomer) {
        const res = await request.put(API_ENDPOINTS.CUSTOMERS.UPDATE(selectedCustomer.id), formData);
        if (res.success) {
          toast.success('Data pelanggan berhasil diperbarui');
          setIsCustomerModalOpen(false);
          fetchCustomers();
        }
      } else {
        const res = await request.post(API_ENDPOINTS.CUSTOMERS.CREATE, formData);
        if (res.success) {
          toast.success('Pelanggan baru berhasil ditambahkan');
          setIsCustomerModalOpen(false);
          fetchCustomers();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Medical Record
  const handleMedicalSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await request.post(API_ENDPOINTS.MEDICAL_RECORDS.CREATE, {
        customer_id: selectedCustomer.id,
        ...medicalForm,
      });
      if (res.success) {
        toast.success('Rekam medis berhasil ditambahkan!');
        setIsAddMedicalModalOpen(false);
        // Refresh detail modal
        handleViewDetail(selectedCustomer);
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan rekam medis');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Customer
  const handleDeleteConfirm = async () => {
    try {
      setIsSubmitting(true);
      const res = await request.delete(API_ENDPOINTS.CUSTOMERS.DELETE(selectedCustomer.id));
      if (res.success) {
        toast.success('Pelanggan berhasil dihapus');
        setIsDeleteOpen(false);
        if (isDetailModalOpen) setIsDetailModalOpen(false);
        fetchCustomers();
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-fade-in font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-beauty-600" />
            Customer & Rekam Medis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data pelanggan, status membership, riwayat rekam medis kulit, dan alergi.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-beauty-600 hover:bg-beauty-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-beauty-300/40 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Pelanggan Baru
        </button>
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
            placeholder="Cari nama atau nomor WhatsApp..."
          />
        </div>

        <select
          value={memberFilter}
          onChange={(e) => {
            setMemberFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="w-full sm:w-auto px-3.5 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 focus:ring-2 focus:ring-beauty-500 outline-none cursor-pointer"
        >
          <option value="">Semua Tingkat Member</option>
          <option value="regular">Regular Member</option>
          <option value="vip">VIP Member</option>
          <option value="vvip">VVIP Member</option>
        </select>
      </div>

      {/* CLEAN MINIMALIST TABLE */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={4} />
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            title="Tidak Ada Data Pelanggan"
            description="Belum ada data pelanggan yang sesuai dengan kriteria pencarian."
            actionText="Tambah Pelanggan"
            onAction={handleOpenCreateModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-rose-50/50 text-slate-600 font-bold border-b border-rose-100 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Nama Pelanggan</th>
                  <th className="py-3.5 px-4">Nomor WhatsApp</th>
                  <th className="py-3.5 px-4">Status & Kunjungan</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {customers.map((cust) => {
                  const memberBadgeStyles = {
                    vvip: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
                    vip: 'bg-purple-100 text-purple-800 border-purple-300 font-bold',
                    regular: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
                  };

                  return (
                    <tr key={cust.id} className="hover:bg-rose-50/30 transition-colors">
                      {/* Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-beauty-50 border border-beauty-100 flex items-center justify-center text-beauty-700 font-bold text-xs">
                            {cust.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {cust.name}
                              {cust.member_status === 'vvip' && (
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-beauty-700 font-medium">
                              {cust.customer_code}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{cust.phone}</span>
                        </div>
                        {cust.email && (
                          <div className="text-xs text-slate-400 mt-0.5">{cust.email}</div>
                        )}
                      </td>

                      {/* Member & Visits */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] uppercase border ${
                              memberBadgeStyles[cust.member_status] || memberBadgeStyles.regular
                            }`}
                          >
                            {cust.member_status}
                          </span>
                          <span className="text-xs text-slate-500">
                            <strong>{cust.total_visits || 0}x</strong> kunjungan
                          </span>
                        </div>
                      </td>

                      {/* Clean Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* DETAIL & MEDICAL RECORD BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleViewDetail(cust)}
                            className="p-1.5 rounded-xl bg-beauty-50 hover:bg-beauty-100 text-beauty-700 transition-all flex items-center gap-1 text-xs font-semibold px-2.5 shadow-2xs"
                            title="Lihat Detail & Rekam Medis"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>

                          {/* EDIT */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(cust)}
                            className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
                            title="Edit Pelanggan"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* DELETE */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(cust);
                              setIsDeleteOpen(true);
                            }}
                            className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
                            title="Hapus Pelanggan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* ========================================================================= */}
      {/* MODAL: CUSTOMER DETAIL & MEDICAL RECORDS (POPUP ACTION DETAIL)            */}
      {/* ========================================================================= */}
      {selectedCustomerDetail && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Detail Pelanggan & Rekam Medis"
          subtitle={`${selectedCustomerDetail.name} • ${selectedCustomerDetail.customer_code}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5 text-xs sm:text-sm">
            {/* Profil Pelanggan */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-900 text-sm">{selectedCustomerDetail.name}</span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase bg-beauty-100 text-beauty-800">
                  {selectedCustomerDetail.member_status} Member
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <p><strong>WhatsApp:</strong> {selectedCustomerDetail.phone}</p>
                <p><strong>Email:</strong> {selectedCustomerDetail.email || '-'}</p>
                <p><strong>Total Kunjungan:</strong> {selectedCustomerDetail.total_visits || 0} kali</p>
                <p><strong>Alamat:</strong> {selectedCustomerDetail.address || '-'}</p>
              </div>

              {selectedCustomerDetail.notes && (
                <div className="pt-1 text-xs text-beauty-700 italic">
                  Catatan: "{selectedCustomerDetail.notes}"
                </div>
              )}
            </div>

            {/* Section Rekam Medis */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileHeart className="w-4 h-4 text-beauty-600" />
                  Riwayat Rekam Medis & Kulit
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setMedicalForm({
                      skin_type: 'Kombinasi',
                      allergies: 'Tidak ada',
                      skin_concerns: '',
                      contraindications: 'Tidak ada',
                      treatment_history_notes: '',
                      beautician_notes: '',
                      record_date: new Date().toISOString().split('T')[0],
                    });
                    setIsAddMedicalModalOpen(true);
                  }}
                  className="px-2.5 py-1 bg-beauty-600 hover:bg-beauty-700 text-white text-xs font-bold rounded-lg transition-all"
                >
                  + Tambah Rekam Medis
                </button>
              </div>

              {(!selectedCustomerDetail.medical_records || selectedCustomerDetail.medical_records.length === 0) ? (
                <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500">Belum ada data rekam medis kulit.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {selectedCustomerDetail.medical_records.map((rec) => (
                    <div key={rec.id} className="p-3.5 rounded-xl bg-white border border-rose-100 shadow-2xs space-y-2 text-xs">
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                        <span className="font-bold text-beauty-800">Tipe Kulit: {rec.skin_type || 'Normal'}</span>
                        <span className="text-slate-400 text-[11px]">{formatDate(rec.record_date)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded-lg bg-rose-50/50 text-rose-900">
                          <strong>Alergi:</strong> {rec.allergies || 'Tidak ada'}
                        </div>
                        <div className="p-2 rounded-lg bg-amber-50/50 text-amber-900">
                          <strong>Kontraindikasi:</strong> {rec.contraindications || 'Tidak ada'}
                        </div>
                      </div>
                      {rec.skin_concerns && (
                        <p className="text-slate-600 text-[11px]"><strong>Keluhan:</strong> {rec.skin_concerns}</p>
                      )}
                      {rec.beautician_notes && (
                        <p className="text-slate-600 text-[11px]"><strong>Saran Terapis:</strong> {rec.beautician_notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT CUSTOMER                                             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title={selectedCustomer ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
        subtitle="Kelola profil pelanggan studio kecantikan"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCustomerSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Jessica Olivia"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-beauty-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08123456789"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-beauty-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@domain.com"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Membership</label>
              <select
                value={formData.member_status}
                onChange={(e) => setFormData({ ...formData, member_status: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              >
                <option value="regular">Regular</option>
                <option value="vip">VIP</option>
                <option value="vvip">VVIP</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Alamat</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Alamat tempat tinggal pelanggan..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Khusus</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Preferensi aroma, terapis favorit..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-beauty-600 hover:bg-beauty-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pelanggan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ADD MEDICAL RECORD ENTRY                                           */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddMedicalModalOpen}
        onClose={() => setIsAddMedicalModalOpen(false)}
        title="Tambah Rekam Medis & Kulit"
        subtitle={`Untuk: ${selectedCustomer?.name}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleMedicalSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Kulit</label>
              <select
                value={medicalForm.skin_type}
                onChange={(e) => setMedicalForm({ ...medicalForm, skin_type: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
              >
                <option value="Normal">Normal</option>
                <option value="Kering">Kering (Dry Skin)</option>
                <option value="Berminyak">Berminyak (Oily Skin)</option>
                <option value="Kombinasi">Kombinasi (Combination)</option>
                <option value="Sensitif">Sensitif (Sensitive)</option>
                <option value="Acne-prone">Cenderung Berjerawat (Acne-prone)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Periksa</label>
              <input
                type="date"
                required
                value={medicalForm.record_date}
                onChange={(e) => setMedicalForm({ ...medicalForm, record_date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Riwayat Alergi (Skincare, Obat, Parfum)
            </label>
            <input
              type="text"
              value={medicalForm.allergies}
              onChange={(e) => setMedicalForm({ ...medicalForm, allergies: e.target.value })}
              placeholder="Contoh: Alergi alkohol pekat, paraben..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kontraindikasi (Hamil, Menyusui, Minum Retinoid)
            </label>
            <input
              type="text"
              value={medicalForm.contraindications}
              onChange={(e) => setMedicalForm({ ...medicalForm, contraindications: e.target.value })}
              placeholder="Contoh: Sedang hamil trimester 1..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Keluhan Utama</label>
            <textarea
              rows={2}
              value={medicalForm.skin_concerns}
              onChange={(e) => setMedicalForm({ ...medicalForm, skin_concerns: e.target.value })}
              placeholder="Flek hitam, jerawat aktif, pori besar..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Saran / Catatan Terapis</label>
            <textarea
              rows={2}
              value={medicalForm.beautician_notes}
              onChange={(e) => setMedicalForm({ ...medicalForm, beautician_notes: e.target.value })}
              placeholder="Rekomendasi perawatan..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddMedicalModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-beauty-600 hover:bg-beauty-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Rekam Medis'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Pelanggan"
        message={`Apakah Anda yakin ingin menghapus data pelanggan ${selectedCustomer?.name}?`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
