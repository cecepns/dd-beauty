import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import AsyncSelect from 'react-select/async';
import {
  CalendarCheck,
  Plus,
  Receipt,
  Edit,
  Trash2,
  DollarSign,
  Clock,
  User,
  Sparkles,
  Eye,
  Phone,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import {
  formatRupiah,
  formatDate,
  formatShortDate,
  formatTime,
  getStatusBadge,
  getPaymentStatusBadge,
} from '../utils/formatters';
import DebounceSearch from '../components/DebounceSearch';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { TableSkeleton } from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import InvoiceModal from '../components/InvoiceModal';

// Custom React-Select styles matching DD Beauty Rose theme
const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    borderRadius: '0.75rem',
    borderColor: state.isFocused ? '#be185d' : '#e2e8f0',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(190, 24, 93, 0.15)' : 'none',
    '&:hover': {
      borderColor: '#f472b6',
    },
    fontSize: '0.8125rem',
    padding: '1px 2px',
    backgroundColor: '#ffffff',
  }),
  option: (base, state) => ({
    ...base,
    fontSize: '0.8125rem',
    backgroundColor: state.isSelected
      ? '#be185d'
      : state.isFocused
      ? '#fdf2f8'
      : '#ffffff',
    color: state.isSelected ? '#ffffff' : '#1e293b',
    cursor: 'pointer',
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '0.75rem',
    overflow: 'hidden',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    zIndex: 60,
  }),
};

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Create/Edit Booking
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_option: null, // For React-Select
    booking_date: new Date().toISOString().split('T')[0],
    booking_time: '10:00',
    items: [{ treatment_id: '', treatment_option: null, treatment_name: '', quantity: 1, unit_price: 0, subtotal: 0 }],
    discount_type: 'nominal', // 'nominal' | 'percentage'
    discount_value: 0,
    shipping_fee: 0,
    dp_amount: 0,
    payment_method: 'qris',
    customer_notes: '',
    internal_notes: '',
  });

  // Form State for Settle Payment
  const [settleData, setSettleData] = useState({
    paid_amount: 0,
    payment_method: 'qris',
  });

  // Fetch Bookings list from backend
  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter || undefined,
        payment_status: paymentFilter || undefined,
      };
      const res = await request.get(API_ENDPOINTS.BOOKINGS.LIST, params);
      if (res.success) {
        setBookings(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error('Gagal memuat data booking: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, paymentFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Check URL params for quick action (?action=new)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      handleOpenCreateModal();
    }
  }, []);

  // --------------------------------------------------------------------------
  // REACT SELECT ASYNC SEARCH WITH 1 SECOND (1000ms) DEBOUNCE
  // --------------------------------------------------------------------------
  let customerTimer = null;
  const loadCustomerOptions = (inputValue, callback) => {
    if (customerTimer) clearTimeout(customerTimer);
    customerTimer = setTimeout(async () => {
      try {
        const res = await request.get(API_ENDPOINTS.CUSTOMERS.LIST, {
          search: inputValue || '',
          limit: 25,
        });
        const options = (res.data || []).map((c) => ({
          value: c.id,
          label: `${c.name} (${c.phone}) - [${c.member_status?.toUpperCase()}]`,
          data: c,
        }));
        callback(options);
      } catch (e) {
        callback([]);
      }
    }, 1000); // 1-second debounce
  };

  let treatmentTimer = null;
  const loadTreatmentOptions = (inputValue, callback) => {
    if (treatmentTimer) clearTimeout(treatmentTimer);
    treatmentTimer = setTimeout(async () => {
      try {
        const res = await request.get(API_ENDPOINTS.TREATMENTS.LIST, {
          search: inputValue || '',
          limit: 25,
          is_active: 1,
        });
        const options = (res.data || []).map((t) => ({
          value: t.id,
          label: `${t.name} - ${formatRupiah(t.price)} (${t.duration_minutes} mnt)`,
          price: t.price,
          name: t.name,
          data: t,
        }));
        callback(options);
      } catch (e) {
        callback([]);
      }
    }, 1000); // 1-second debounce
  };

  // Calculations for form
  const calculateFormTotals = (items, discType, discVal, shippingFee, dp) => {
    const subtotal = items.reduce((acc, it) => acc + (parseFloat(it.subtotal) || 0), 0);
    const numDiscVal = parseFloat(discVal) || 0;
    let discountAmount = 0;
    if (discType === 'percentage') {
      discountAmount = (subtotal * numDiscVal) / 100;
    } else {
      discountAmount = Math.min(numDiscVal, subtotal);
    }
    const numShip = parseFloat(shippingFee) || 0;
    const grandTotal = Math.max(0, subtotal - discountAmount) + numShip;
    const numDp = parseFloat(dp) || 0;
    const remaining = Math.max(0, grandTotal - numDp);

    return { subtotal, discountAmount, shippingFee: numShip, grandTotal, remaining };
  };

  const handleSelectCustomer = (selectedOption) => {
    setFormData({
      ...formData,
      customer_id: selectedOption ? selectedOption.value : '',
      customer_option: selectedOption,
    });
  };

  const handleSelectTreatment = (index, selectedOption) => {
    const newItems = [...formData.items];
    if (selectedOption) {
      const price = parseFloat(selectedOption.price) || 0;
      const qty = newItems[index].quantity || 1;
      newItems[index] = {
        treatment_id: selectedOption.value,
        treatment_option: selectedOption,
        treatment_name: selectedOption.name,
        quantity: qty,
        unit_price: price,
        subtotal: qty * price,
      };
    } else {
      newItems[index] = {
        treatment_id: '',
        treatment_option: null,
        treatment_name: '',
        quantity: 1,
        unit_price: 0,
        subtotal: 0,
      };
    }
    setFormData({ ...formData, items: newItems });
  };

  const handleItemQtyChange = (index, qty) => {
    const newItems = [...formData.items];
    const q = Math.max(1, parseInt(qty) || 1);
    newItems[index].quantity = q;
    newItems[index].subtotal = q * (newItems[index].unit_price || 0);
    setFormData({ ...formData, items: newItems });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { treatment_id: '', treatment_option: null, treatment_name: '', quantity: 1, unit_price: 0, subtotal: 0 },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) {
      toast.error('Minimal harus ada 1 treatment');
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleOpenCreateModal = () => {
    setFormData({
      customer_id: '',
      customer_option: null,
      booking_date: new Date().toISOString().split('T')[0],
      booking_time: '11:00',
      items: [{ treatment_id: '', treatment_option: null, treatment_name: '', quantity: 1, unit_price: 0, subtotal: 0 }],
      discount_type: 'nominal',
      discount_value: 0,
      shipping_fee: 0,
      dp_amount: 50000,
      payment_method: 'qris',
      customer_notes: '',
      internal_notes: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (booking) => {
    setSelectedBooking(booking);
    setFormData({
      customer_id: booking.customer_id,
      customer_option: booking.customer
        ? {
            value: booking.customer.id,
            label: `${booking.customer.name} (${booking.customer.phone})`,
          }
        : null,
      booking_date: booking.booking_date,
      booking_time: booking.booking_time ? booking.booking_time.substring(0, 5) : '10:00',
      status: booking.status,
      items: (booking.items || []).map((it) => ({
        treatment_id: it.treatment_id,
        treatment_option: {
          value: it.treatment_id,
          label: `${it.treatment_name} - ${formatRupiah(it.unit_price)}`,
          price: it.unit_price,
          name: it.treatment_name,
        },
        treatment_name: it.treatment_name,
        quantity: it.quantity,
        unit_price: it.unit_price,
        subtotal: it.subtotal,
      })),
      discount_type: booking.discount_type || 'nominal',
      discount_value: booking.discount_value || 0,
      shipping_fee: booking.shipping_fee || 0,
      dp_amount: booking.dp_amount || 0,
      paid_amount: booking.paid_amount || 0,
      payment_method: booking.payment_method || 'qris',
      customer_notes: booking.customer_notes || '',
      internal_notes: booking.internal_notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDetailModal = (booking) => {
    setSelectedBooking(booking);
    setIsDetailModalOpen(true);
  };

  const handleOpenSettleModal = (booking) => {
    setSelectedBooking(booking);
    setSettleData({
      paid_amount: booking.remaining_amount,
      payment_method: 'qris',
    });
    setIsSettleModalOpen(true);
  };

  // Submit Create Booking
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) {
      toast.error('Pilih customer terlebih dahulu melalui pencarian');
      return;
    }
    if (!formData.items.some((it) => it.treatment_id || it.treatment_name)) {
      toast.error('Pilih minimal 1 treatment layanan');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await request.post(API_ENDPOINTS.BOOKINGS.CREATE, formData);
      if (res.success) {
        toast.success('Booking baru berhasil dibuat!');
        setIsCreateModalOpen(false);
        fetchBookings();
        if (res.data) {
          setSelectedBookingForInvoice(res.data);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Gagal membuat booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Booking
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await request.put(API_ENDPOINTS.BOOKINGS.UPDATE(selectedBooking.id), formData);
      if (res.success) {
        toast.success('Data booking berhasil diperbarui!');
        setIsEditModalOpen(false);
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Settle Payment
  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await request.post(
        API_ENDPOINTS.BOOKINGS.SETTLE_PAYMENT(selectedBooking.id),
        settleData
      );
      if (res.success) {
        toast.success('Pelunasan berhasil dicatat!');
        setIsSettleModalOpen(false);
        if (isDetailModalOpen) setIsDetailModalOpen(false);
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.message || 'Gagal mencatat pelunasan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Booking
  const handleDeleteConfirm = async () => {
    try {
      setIsSubmitting(true);
      const res = await request.delete(API_ENDPOINTS.BOOKINGS.DELETE(selectedBooking.id));
      if (res.success) {
        toast.success('Booking berhasil dihapus');
        setIsDeleteOpen(false);
        if (isDetailModalOpen) setIsDetailModalOpen(false);
        fetchBookings();
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculated = calculateFormTotals(
    formData.items,
    formData.discount_type,
    formData.discount_value,
    formData.shipping_fee,
    formData.dp_amount
  );

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-beauty-600" />
            Manajemen Booking & Treatment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Daftar reservasi layanan, status pembayaran, dan cetak invoice kasir.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-beauty-600 hover:bg-beauty-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-beauty-300/40 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Booking Baru
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-rose-100 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="w-full md:flex-1">
          <DebounceSearch
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            placeholder="Cari nomor invoice atau nama pelanggan..."
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="w-full md:w-auto px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 focus:ring-2 focus:ring-beauty-500 outline-none"
        >
          <option value="">Semua Status Sesi</option>
          <option value="booked">Terjadwal</option>
          <option value="completed">Selesai</option>
          <option value="cancelled">Dibatalkan</option>
        </select>

        {/* Payment Status Filter */}
        <select
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="w-full md:w-auto px-3 py-2 bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl text-slate-700 focus:ring-2 focus:ring-beauty-500 outline-none"
        >
          <option value="">Semua Status Bayar</option>
          <option value="paid">Lunas</option>
          <option value="dp">DP (Sebagian)</option>
          <option value="unpaid">Belum Bayar</option>
        </select>
      </div>

      {/* CLEAN & UNCLUTTERED TABLE VIEW */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            title="Tidak Ada Data Booking"
            description="Belum ada transaksi atau jadwal reservasi yang sesuai dengan filter."
            actionText="Buat Reservasi Baru"
            onAction={handleOpenCreateModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-rose-50/50 text-slate-600 font-bold border-b border-rose-100 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Invoice & Jadwal</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Total Biaya</th>
                  <th className="py-3.5 px-4">Status & Pembayaran</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {bookings.map((booking) => {
                  const statusBadge = getStatusBadge(booking.status);
                  const payBadge = getPaymentStatusBadge(booking.payment_status);

                  return (
                    <tr key={booking.id} className="hover:bg-rose-50/30 transition-colors">
                      {/* Invoice & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {booking.invoice_number}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {formatShortDate(booking.booking_date)} • {formatTime(booking.booking_time)} WIB
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{booking.customer?.name || 'Pelanggan'}</div>
                        <div className="text-xs text-slate-400">{booking.customer?.phone || '-'}</div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{formatRupiah(booking.grand_total)}</div>
                        <div className="text-[11px] text-slate-500">
                          {booking.items?.length || 1} Layanan Treatment
                        </div>
                      </td>

                      {/* Status Badges */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                            {statusBadge.label}
                          </span>
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${payBadge.bg}`}>
                            {payBadge.label}
                          </span>
                        </div>
                      </td>

                      {/* Clean Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* DETAIL BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetailModal(booking)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1 text-xs font-semibold px-2.5"
                            title="Lihat Detail Transaksi"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>

                          {/* INVOICE / STRUK */}
                          <button
                            type="button"
                            onClick={() => setSelectedBookingForInvoice(booking)}
                            className="p-1.5 rounded-xl bg-beauty-50 text-beauty-700 hover:bg-beauty-100 transition-all shadow-2xs"
                            title="Struk / Invoice"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>

                          {/* EDIT */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(booking)}
                            className="p-1.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-200 transition-all"
                            title="Edit Booking"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* DELETE */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setIsDeleteOpen(true);
                            }}
                            className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
                            title="Hapus Booking"
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

        {/* Server-side Pagination */}
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
      {/* MODAL: DETAIL BOOKING (Clean popup showing full breakdown)                */}
      {/* ========================================================================= */}
      {selectedBooking && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Detail Reservasi & Treatment"
          subtitle={`No. Invoice: ${selectedBooking.invoice_number}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-xs sm:text-sm">
            {/* Customer & Schedule info */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-800 text-sm">{selectedBooking.customer?.name || 'Customer'}</span>
                <span className="text-xs text-beauty-700 font-semibold">{selectedBooking.customer?.phone || '-'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <p><strong>Jadwal:</strong> {formatDate(selectedBooking.booking_date)}</p>
                <p><strong>Jam:</strong> {formatTime(selectedBooking.booking_time)} WIB</p>
                <p><strong>Status Sesi:</strong> <span className="font-bold uppercase">{selectedBooking.status}</span></p>
              </div>
            </div>

            {/* List of Treatments */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Daftar Treatment Layanan
              </h4>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                {(selectedBooking.items || []).map((item, idx) => (
                  <div key={idx} className="p-3 bg-white flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{item.treatment_name}</p>
                      <p className="text-slate-400 text-[11px]">{item.quantity}x @{formatRupiah(item.unit_price)}</p>
                    </div>
                    <span className="font-bold text-slate-900">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial summary */}
            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatRupiah(selectedBooking.subtotal)}</span>
              </div>
              {selectedBooking.discount_amount > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(selectedBooking.discount_amount)}</span>
                </div>
              )}
              {selectedBooking.shipping_fee > 0 && (
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Ongkir / Biaya Transport:</span>
                  <span>+{formatRupiah(selectedBooking.shipping_fee)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-rose-200">
                <span>Grand Total:</span>
                <span className="text-beauty-800">{formatRupiah(selectedBooking.grand_total)}</span>
              </div>
              <div className="flex justify-between text-slate-700 font-medium">
                <span>Telah Dibayar (DP/Lunas):</span>
                <span>{formatRupiah(selectedBooking.paid_amount)}</span>
              </div>
              <div className="flex justify-between text-rose-700 font-bold">
                <span>Sisa Tagihan:</span>
                <span>{formatRupiah(selectedBooking.remaining_amount)}</span>
              </div>
              <div className="flex justify-between text-slate-500 pt-1 text-[11px]">
                <span>Status Bayar / Metode:</span>
                <span className="uppercase font-bold">{selectedBooking.payment_status} / {selectedBooking.payment_method}</span>
              </div>
            </div>

            {selectedBooking.customer_notes && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <strong>Catatan Khusus:</strong>
                <p className="text-slate-600 italic mt-0.5">"{selectedBooking.customer_notes}"</p>
              </div>
            )}

            {/* Action Bar inside Detail */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200">
              {selectedBooking.remaining_amount > 0 && (
                <button
                  type="button"
                  onClick={() => handleOpenSettleModal(selectedBooking)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all"
                >
                  Pelunasan DP
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedBookingForInvoice(selectedBooking);
                }}
                className="px-3.5 py-2 bg-beauty-600 hover:bg-beauty-700 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Receipt className="w-4 h-4" />
                Cetak / Download Struk
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE BOOKING (With React-Select Async 1-Sec Debounce)            */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Reservasi & Treatment Baru"
        subtitle="Cari customer dan treatment dengan auto-suggest debounce 1 detik"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          {/* Customer Search (React-Select Async) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Customer (Search by API) <span className="text-rose-500">*</span>
              </label>
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={loadCustomerOptions}
                value={formData.customer_option}
                onChange={handleSelectCustomer}
                placeholder="Ketik nama customer..."
                styles={customSelectStyles}
                noOptionsMessage={({ inputValue }) =>
                  inputValue ? 'Customer tidak ditemukan' : 'Ketik untuk mencari...'
                }
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Booking <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.booking_date}
                onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-beauty-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jam Perawatan <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={formData.booking_time}
                onChange={(e) => setFormData({ ...formData, booking_time: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-beauty-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Metode Pembayaran
            </label>
            <select
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-beauty-500 outline-none"
            >
              <option value="qris">QRIS / Instant Payment</option>
              <option value="cash">Tunai / Cash</option>
            </select>
          </div>

          {/* Treatment Items Section (React-Select Async for each row) */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-beauty-900 uppercase tracking-wider">
                Pilih Layanan Treatment (Search by API)
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-beauty-100 hover:bg-beauty-200 text-beauty-800 text-xs font-bold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                + Tambah Treatment
              </button>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                {/* React-Select Async for Treatment Search */}
                <div className="w-full sm:flex-1">
                  <AsyncSelect
                    cacheOptions
                    defaultOptions
                    loadOptions={loadTreatmentOptions}
                    value={item.treatment_option}
                    onChange={(opt) => handleSelectTreatment(index, opt)}
                    placeholder="Ketik & pilih layanan..."
                    styles={customSelectStyles}
                    noOptionsMessage={({ inputValue }) =>
                      inputValue ? 'Layanan tidak ditemukan' : 'Ketik nama layanan...'
                    }
                  />
                </div>

                {/* Quantity */}
                <div className="w-24">
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => handleItemQtyChange(index, e.target.value)}
                    placeholder="Sesi"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-center font-bold text-slate-800 focus:ring-2 focus:ring-beauty-500 outline-none"
                  />
                </div>

                {/* Subtotal */}
                <div className="w-28 text-right font-bold text-xs text-slate-900">
                  {formatRupiah(item.subtotal)}
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Discount, DP & Final Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Diskon</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="nominal">Nominal (Rp)</option>
                    <option value="percentage">Persentase (%)</option>
                  </select>
                </div>

                <div className="w-1/2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nilai Diskon</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ongkir / Transport (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.shipping_fee}
                    onChange={(e) => setFormData({ ...formData, shipping_fee: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Uang Muka (DP) (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.dp_amount}
                    onChange={(e) => setFormData({ ...formData, dp_amount: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={formData.customer_notes}
                  onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
                  placeholder="Permintaan khusus pelanggan..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>

            {/* Calculations Summary Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/70 text-xs space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatRupiah(calculated.subtotal)}</span>
                </div>
                {calculated.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Potongan Diskon:</span>
                    <span className="font-semibold">-{formatRupiah(calculated.discountAmount)}</span>
                  </div>
                )}
                {calculated.shippingFee > 0 && (
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Ongkir / Transport:</span>
                    <span className="font-semibold">+{formatRupiah(calculated.shippingFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-rose-200">
                  <span>Grand Total:</span>
                  <span className="text-beauty-800">{formatRupiah(calculated.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>DP Dibayar:</span>
                  <span>{formatRupiah(formData.dp_amount || 0)}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-bold bg-white/70 p-2 rounded-lg border border-rose-200/50">
                  <span>Sisa Tagihan:</span>
                  <span>{formatRupiah(calculated.remaining)}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic text-center">
                *Struk & invoice otomatis dibuat setelah disimpan.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-beauty-600 hover:bg-beauty-700 text-white text-xs font-bold rounded-xl shadow-md shadow-beauty-300/40 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan & Buat Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: EDIT BOOKING                                                       */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Data Booking"
        subtitle={`No. Invoice: ${selectedBooking?.invoice_number}`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status Sesi</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
            >
              <option value="booked">Terjadwal (Booked)</option>
              <option value="completed">Selesai (Completed)</option>
              <option value="cancelled">Dibatalkan (Cancelled)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
              <input
                type="date"
                value={formData.booking_date}
                onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jam</label>
              <input
                type="time"
                value={formData.booking_time}
                onChange={(e) => setFormData({ ...formData, booking_time: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ongkir / Transport (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={formData.shipping_fee}
                onChange={(e) => setFormData({ ...formData, shipping_fee: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan</label>
              <input
                type="text"
                value={formData.customer_notes}
                onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-beauty-600 hover:bg-beauty-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Perbarui Booking'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: SETTLE PAYMENT (Pelunasan DP)                                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        title="Pelunasan Sisa Pembayaran"
        subtitle={`Pelunasan untuk ${selectedBooking?.customer?.name || 'Customer'}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSettleSubmit} className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Grand Total:</span>
              <span className="font-semibold">{formatRupiah(selectedBooking?.grand_total)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Telah Dibayar (DP):</span>
              <span className="font-semibold">{formatRupiah(selectedBooking?.paid_amount)}</span>
            </div>
            <div className="flex justify-between text-rose-700 font-bold text-sm pt-2 border-t border-rose-200">
              <span>Sisa yang Harus Dilunasi:</span>
              <span>{formatRupiah(selectedBooking?.remaining_amount)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nominal yang Dibayarkan Sekarang (Rp)
            </label>
            <input
              type="number"
              required
              min="1"
              value={settleData.paid_amount}
              onChange={(e) => setSettleData({ ...settleData, paid_amount: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-beauty-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Metode Pelunasan</label>
            <select
              value={settleData.payment_method}
              onChange={(e) => setSettleData({ ...settleData, payment_method: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800"
            >
              <option value="qris">QRIS / Instant Payment</option>
              <option value="cash">Tunai / Cash</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsSettleModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Memproses...' : 'Konfirmasi Pelunasan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Reservasi Booking"
        message={`Apakah Anda yakin ingin menghapus data booking invoice ${selectedBooking?.invoice_number}?`}
        isLoading={isSubmitting}
      />

      {/* Invoice Modal */}
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
