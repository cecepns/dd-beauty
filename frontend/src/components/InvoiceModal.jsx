import React, { useRef, useState } from 'react';
import { toPng, toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import {
  Printer,
  Download,
  Share2,
  FileText,
  Receipt,
  Sparkles,
  CheckCircle2,
  MessageCircle,
  Clock,
  Calendar,
  User,
  Scissors
} from 'lucide-react';
import Modal from './Modal';
import {
  formatRupiah,
  formatDate,
  formatShortDate,
  formatTime,
  getPaymentStatusBadge,
  generateWhatsAppInvoiceMessage
} from '../utils/formatters';

export default function InvoiceModal({
  isOpen,
  onClose,
  booking,
  studioSettings,
}) {
  const invoiceRef = useRef(null);
  const [template, setTemplate] = useState('pos'); // 'pos' (thermal 80mm/58mm) or 'luxury' (full invoice)
  const [isExporting, setIsExporting] = useState(false);

  if (!booking) return null;

  const studio = studioSettings || {
    studio_name: 'DD Beauty Serve',
    tagline: 'Luxury Beauty & Skin Care Studio',
    phone: '0812-8899-7722',
    email: 'care@ddbeautyserve.com',
    address: 'Ruko Emerald Boulevard Blok B3, Jakarta Selatan',
    instagram: '@ddbeauty.serve',
    receipt_footer: 'Terima kasih telah mempercayakan kecantikan Anda bersama DD Beauty Serve.'
  };

  // Direct Print via Browser
  const handlePrint = () => {
    window.print();
  };

  // Export to Image (PNG)
  const handleDownloadImage = async () => {
    if (!invoiceRef.current) return;
    try {
      setIsExporting(true);
      toast.loading('Menyiapkan gambar invoice...', { id: 'export-img' });

      const dataUrl = await toPng(invoiceRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `Invoice-${booking.invoice_number}.png`;
      link.href = dataUrl;
      link.click();

      toast.success('Invoice berhasil diunduh sebagai gambar!', { id: 'export-img' });
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunduh gambar invoice', { id: 'export-img' });
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      setIsExporting(true);
      toast.loading('Menyiapkan file PDF...', { id: 'export-pdf' });

      const dataUrl = await toPng(invoiceRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: template === 'pos' ? [80, 200] : 'a4',
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${booking.invoice_number}.pdf`);

      toast.success('Invoice berhasil diunduh sebagai PDF!', { id: 'export-pdf' });
    } catch (err) {
      console.error(err);
      toast.error('Gagal membuat file PDF', { id: 'export-pdf' });
    } finally {
      setIsExporting(false);
    }
  };

  // Send WhatsApp Direct Link
  const handleSendWhatsApp = () => {
    const rawPhone = booking.customer?.phone || '';
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }

    const message = generateWhatsAppInvoiceMessage(booking, studio);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    toast.success('Membuka WhatsApp untuk mengirim invoice...');
  };

  const paymentBadge = getPaymentStatusBadge(booking.payment_status);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invoice & Struk Perawatan"
      subtitle={`No. Invoice: ${booking.invoice_number}`}
      maxWidth="max-w-3xl"
    >
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-rose-100/80 no-print">
        {/* Template Switcher */}
        <div className="flex items-center p-1 bg-rose-50/80 border border-rose-200/60 rounded-xl">
          <button
            type="button"
            onClick={() => setTemplate('pos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${template === 'pos'
                ? 'bg-white text-beauty-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Struk POS (Thermal)
          </button>
          <button
            type="button"
            onClick={() => setTemplate('luxury')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${template === 'luxury'
                ? 'bg-white text-beauty-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Invoice Luxury
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp Direct Share */}
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm active:scale-95 transition-all"
            title="Kirim Invoice ke WhatsApp Customer"
          >
            <MessageCircle className="w-4 h-4" />
            Kirim WhatsApp
          </button>

          {/* Download Image */}
          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownloadImage}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-sm active:scale-95 transition-all disabled:opacity-50"
            title="Download Gambar PNG"
          >
            <Download className="w-4 h-4" />
            Gambar (PNG)
          </button>

          {/* Download PDF */}
          <button
            type="button"
            disabled={isExporting}
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-sm active:scale-95 transition-all disabled:opacity-50"
            title="Download Dokumen PDF"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-beauty-600 hover:bg-beauty-700 text-white text-xs font-semibold rounded-xl shadow-sm active:scale-95 transition-all"
            title="Print Struk / Invoice"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Invoice Preview Canvas */}
      <div className="flex justify-center bg-slate-100/70 p-4 sm:p-6 rounded-2xl border border-slate-200/80 overflow-x-auto">
        {/* Printable Area */}
        <div
          ref={invoiceRef}
          id="printable-receipt"
          className={`bg-white text-slate-800 transition-all ${template === 'pos'
              ? 'w-[320px] p-4 text-xs font-mono border border-slate-300 shadow-lg rounded-lg'
              : 'w-full max-w-2xl p-8 text-sm shadow-lg rounded-2xl border border-rose-100 font-sans'
            }`}
        >
          {/* =================================================== */}
          {/* TEMPLATE 1: POS THERMAL RECEIPT STYLE (58mm/80mm) */}
          {/* =================================================== */}
          {template === 'pos' && (
            <div className="space-y-3 leading-tight">
              {/* Header */}
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <div className="flex justify-center mb-1.5">
                  <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                </div>
                <h2 className="text-sm font-bold tracking-wider uppercase text-slate-900">
                  {studio.studio_name}
                </h2>
                <p className="text-[11px] text-slate-600 mt-0.5">{studio.address}</p>
                <p className="text-[11px] text-slate-600">Telp: {studio.phone}</p>
                <p className="text-[11px] text-slate-600">IG: {studio.instagram}</p>
              </div>

              {/* Transaction Meta */}
              <div className="text-[11px] space-y-1 py-1 border-b border-dashed border-slate-400">
                <div className="flex justify-between">
                  <span>No. Inv:</span>
                  <span className="font-bold">{booking.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{formatShortDate(booking.booking_date)} {formatTime(booking.booking_time)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-bold">{booking.customer?.name || 'Pelanggan'}</span>
                </div>
                <div className="flex justify-between">
                  <span>No. HP:</span>
                  <span>{booking.customer?.phone || '-'}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="py-2 border-b border-dashed border-slate-400">
                <div className="flex justify-between font-bold text-[11px] mb-1.5 pb-1 border-b border-slate-200">
                  <span>LAYANAN / TREATMENT</span>
                  <span>TOTAL</span>
                </div>
                {(booking.items || []).map((item, idx) => (
                  <div key={idx} className="mb-1.5 text-[11px]">
                    <div className="font-medium text-slate-900">{item.treatment_name}</div>
                    <div className="flex justify-between text-slate-500 pl-2">
                      <span>{item.quantity}x @{formatRupiah(item.unit_price)}</span>
                      <span className="font-semibold text-slate-800">{formatRupiah(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Calculation */}
              <div className="text-[11px] space-y-1 py-1 border-b border-dashed border-slate-400">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatRupiah(booking.subtotal)}</span>
                </div>
                {booking.discount_amount > 0 && (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Diskon {booking.discount_type === 'percentage' ? `(${booking.discount_value}%)` : ''}</span>
                    <span>-{formatRupiah(booking.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 pt-1 text-xs border-t border-slate-200">
                  <span>TOTAL AKHIR</span>
                  <span>{formatRupiah(booking.grand_total)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Dibayar (DP / Cash)</span>
                  <span className="font-bold">{formatRupiah(booking.paid_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Sisa Tagihan</span>
                  <span className="font-bold">{formatRupiah(booking.remaining_amount)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>Metode / Status:</span>
                  <span className="font-bold uppercase">{booking.payment_method} / {booking.payment_status}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-2 text-[10px] text-slate-500 space-y-1">
                <p className="font-medium">{studio.receipt_footer}</p>
                <p className="italic">Layanan & Konsultasi Kecantikan DD Beauty</p>
                <div className="pt-2 text-[9px] text-slate-400">
                  *** Dicetak otomatis oleh DD Beauty ***
                </div>
              </div>
            </div>
          )}

          {/* =================================================== */}
          {/* TEMPLATE 2: MODERN LUXURY STUDIO INVOICE (A4/A5)   */}
          {/* =================================================== */}
          {template === 'luxury' && (
            <div className="space-y-6">
              {/* Header with Logo and Studio Branding */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-rose-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-100 p-2 border border-rose-200/70 flex items-center justify-center shadow-sm">
                    <img src="/logo.png" alt="DD Beauty Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900 font-sans tracking-wide">
                      {studio.studio_name}
                    </h1>
                    <p className="text-xs text-beauty-700 font-medium">{studio.tagline}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{studio.address}</p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="inline-block px-3 py-1 bg-beauty-50 border border-beauty-200 text-beauty-800 text-xs font-bold rounded-lg uppercase tracking-wider mb-1">
                    OFFICIAL INVOICE
                  </div>
                  <div className="text-base font-bold text-slate-900">{booking.invoice_number}</div>
                  <div className="text-xs text-slate-500">
                    Tanggal: {formatDate(booking.booking_date)}
                  </div>
                </div>
              </div>

              {/* Customer & Appointment Detail Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-beauty-800 uppercase tracking-wider">
                    Informasi Pelanggan
                  </span>
                  <div className="mt-2 space-y-1 text-xs">
                    <p className="font-bold text-slate-800 text-sm">{booking.customer?.name || 'Customer'}</p>
                    <p className="text-slate-600">No. WhatsApp: {booking.customer?.phone || '-'}</p>
                    <p className="text-slate-600">Email: {booking.customer?.email || '-'}</p>
                    <p className="text-slate-600">Status Member: <span className="uppercase font-semibold text-beauty-700">{booking.customer?.member_status || 'Regular'}</span></p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100">
                  <span className="text-[11px] font-bold text-beauty-800 uppercase tracking-wider">
                    Jadwal Perawatan
                  </span>
                  <div className="mt-2 space-y-1 text-xs">
                    <p className="text-slate-700">
                      <strong>Tanggal Perawatan:</strong> {formatDate(booking.booking_date)}
                    </p>
                    <p className="text-slate-700">
                      <strong>Waktu Booking:</strong> {formatTime(booking.booking_time)} WIB
                    </p>
                    <p className="text-slate-700">
                      <strong>Status Sesi:</strong> <span className="font-semibold text-slate-900 uppercase">{booking.status}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gradient-to-r from-rose-50 to-pink-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">No</th>
                      <th className="py-3 px-4">Treatment / Layanan Kecantikan</th>
                      <th className="py-3 px-4 text-center">Jumlah / Sesi</th>
                      <th className="py-3 px-4 text-right">Harga Satuan</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {(booking.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-slate-400 font-medium">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{item.treatment_name}</td>
                        <td className="py-3 px-4 text-center font-medium">{item.quantity}x</td>
                        <td className="py-3 px-4 text-right">{formatRupiah(item.unit_price)}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{formatRupiah(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
                <div className="w-full sm:w-1/2 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                  <div className="font-bold text-slate-700">Catatan & Ketentuan:</div>
                  <p className="text-slate-500 leading-relaxed">
                    {booking.customer_notes ? `"${booking.customer_notes}"` : 'Simpan invoice ini sebagai bukti reservasi dan riwayat perawatan di DD Beauty Serve.'}
                  </p>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">Status Pembayaran:</span>
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase border ${paymentBadge.bg}`}>
                      {paymentBadge.label}
                    </span>
                  </div>
                </div>

                <div className="w-full sm:w-5/12 space-y-2 text-xs">
                  <div className="flex justify-between py-1 text-slate-600">
                    <span>Subtotal Layanan:</span>
                    <span className="font-medium">{formatRupiah(booking.subtotal)}</span>
                  </div>
                  {booking.discount_amount > 0 && (
                    <div className="flex justify-between py-1 text-rose-600 font-medium">
                      <span>Potongan Diskon:</span>
                      <span>-{formatRupiah(booking.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-t border-b border-slate-200 font-bold text-slate-900 text-sm">
                    <span>Total Pembayaran:</span>
                    <span className="text-beauty-800">{formatRupiah(booking.grand_total)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700 font-medium">
                    <span>Telah Dibayar (DP / Pelunasan):</span>
                    <span>{formatRupiah(booking.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-800 font-bold text-xs bg-rose-50/70 p-2 rounded-lg border border-rose-100">
                    <span>Sisa Tagihan:</span>
                    <span className="text-rose-700">{formatRupiah(booking.remaining_amount)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-500 text-[11px]">
                    <span>Metode Bayar:</span>
                    <span className="uppercase font-semibold text-slate-700">{booking.payment_method}</span>
                  </div>
                </div>
              </div>

              {/* Signature / Footer */}
              <div className="pt-6 border-t border-rose-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
                <div>
                  <p className="font-semibold text-slate-800">{studio.studio_name}</p>
                  <p>{studio.phone} | {studio.instagram}</p>
                </div>
                <div className="text-center sm:text-right">
                  <p className="italic text-beauty-700 font-medium">"{studio.receipt_footer}"</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
