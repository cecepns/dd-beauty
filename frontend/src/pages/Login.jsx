import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff, Sparkles, HeartHandshake, ShieldCheck } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50/40 to-slate-100 flex items-center justify-center p-4 sm:p-6 antialiased">
      {/* Decorative Blur Orbs */}
      <div className="fixed top-1/4 left-1/4 w-72 h-72 bg-pink-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-rose-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-rose-200/50 border border-white/80 p-6 sm:p-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-beauty-600 to-pink-500 text-white shadow-lg shadow-beauty-300/60 mb-4 transform hover:scale-105 transition-transform">
            <img src="/logo.png" alt="DD Beauty Logo" className="w-10 h-10 object-contain drop-shadow-xs" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
            DD Beauty Serve
            <Sparkles className="w-5 h-5 text-beauty-600" />
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Studio Management & Service POS Panel
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@ddbeauty.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 focus:outline-hidden focus:border-beauty-600 focus:bg-white focus:ring-3 focus:ring-beauty-100 transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 focus:outline-hidden focus:border-beauty-600 focus:bg-white focus:ring-3 focus:ring-beauty-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Demo Hint */}
          {/* <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-100/70 text-xs text-rose-800 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-beauty-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Kredensial Default Demo:</p>
              <p className="text-[11px] text-slate-600 font-mono mt-0.5">Email: <span className="font-semibold text-slate-800">admin@ddbeauty.com</span> | Pass: <span className="font-semibold text-slate-800">admin123</span></p>
            </div>
          </div> */}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-beauty-600 to-beauty-700 hover:from-beauty-700 hover:to-beauty-800 text-white font-bold text-sm rounded-2xl shadow-lg shadow-beauty-300/50 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memproses Login...</span>
              </>
            ) : (
              <span>Masuk ke Panel Studio</span>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 text-center pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1">
            <HeartHandshake className="w-3.5 h-3.5 text-beauty-500" />
            DD Beauty Serve &copy; 2026. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
