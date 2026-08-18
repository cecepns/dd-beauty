import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Settings as SettingsIcon,
  Store,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Receipt,
  Save,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';

export default function Settings() {
  const [formData, setFormData] = useState({
    studio_name: 'DD Beauty Serve',
    tagline: 'Luxury Beauty & Skin Care Studio',
    phone: '0812-8899-7722',
    email: 'care@ddbeautyserve.com',
    address: 'Ruko Emerald Boulevard Blok B3, Jakarta Selatan',
    instagram: '@ddbeauty.serve',
    receipt_footer: 'Terima kasih telah mempercayakan kecantikan Anda bersama DD Beauty Serve.',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await request.get(API_ENDPOINTS.SETTINGS.GET);
      if (res.success && res.data) {
        setFormData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await request.put(API_ENDPOINTS.SETTINGS.UPDATE, formData);
      if (res.success) {
        toast.success('Pengaturan studio berhasil diperbarui!');
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-sans text-slate-900 flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-beauty-600" />
          Pengaturan Studio & Struk Invoice
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Atur identitas studio, kontak WhatsApp bisnis, dan teks footer pada struk/invoice yang dicetak.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Studio Branding Card */}
        <div className="p-6 bg-white rounded-2xl border border-rose-100 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-rose-100/70">
            <div className="p-2 rounded-xl bg-rose-50 text-beauty-600">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Identitas Studio</h3>
              <p className="text-xs text-slate-500">Nama studio dan tagline kecantikan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Studio <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.studio_name}
                onChange={(e) => setFormData({ ...formData, studio_name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-beauty-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tagline Slogan</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-beauty-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contact & Location Card */}
        <div className="p-6 bg-white rounded-2xl border border-rose-100 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-rose-100/70">
            <div className="p-2 rounded-xl bg-rose-50 text-beauty-600">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Kontak & Lokasi</h3>
              <p className="text-xs text-slate-500">
                Informasi yang tertera pada invoice dan pesan WhatsApp otomatis
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Telepon / WA Studio <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-beauty-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Studio</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-beauty-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Akun Instagram</label>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-beauty-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap Studio</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-beauty-500 outline-none"
            />
          </div>
        </div>

        {/* Invoice Footer Card */}
        <div className="p-6 bg-white rounded-2xl border border-rose-100 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-rose-100/70">
            <div className="p-2 rounded-xl bg-rose-50 text-beauty-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Kustomisasi Struk & Invoice</h3>
              <p className="text-xs text-slate-500">Pesan penutup di bagian bawah struk belanja / invoice</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Teks Footer Struk</label>
            <textarea
              rows={2}
              value={formData.receipt_footer}
              onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-beauty-500 outline-none"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-beauty-600 hover:bg-beauty-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-beauty-300/40 active:scale-95 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Studio'}
          </button>
        </div>
      </form>
    </div>
  );
}
