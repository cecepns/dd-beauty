import React, { createContext, useContext, useState } from 'react';
import toast from 'react-hot-toast';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('dd_beauty_token'));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('dd_beauty_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      if (res.success) {
        const userData = res.data;
        const authToken = userData.token || 'dd-beauty-token-' + userData.id;
        setToken(authToken);
        setUser(userData);
        localStorage.setItem('dd_beauty_token', authToken);
        localStorage.setItem('dd_beauty_user', JSON.stringify(userData));
        toast.success(`Selamat datang kembali, ${userData.name || 'Admin'}!`);
        return true;
      } else {
        toast.error(res.message || 'Login gagal');
        return false;
      }
    } catch (err) {
      toast.error(err.message || 'Email atau password salah');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('dd_beauty_token');
    localStorage.removeItem('dd_beauty_user');
    toast.success('Anda telah keluar dari panel.');
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, isAuthenticated: Boolean(token) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
