import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, User, Key, Sparkles, AlertCircle } from 'lucide-react';
import { AdminUser } from '../../types/admin';
import { firebaseCloudDb } from '../../config/firebase';

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser) => void;
}

export const SUPER_ADMIN_USER: AdminUser = {
  id: 'super-admin',
  name: 'Nirod Kumar (Super Admin)',
  username: 'admin',
  password: '123',
  email: 'admin@a1print.com',
  role: 'Super Admin',
  allowedTabs: [
    'dashboard',
    'catalog',
    'custom_fields',
    'orders',
    'customers',
    'coupons',
    'shipping',
    'payments',
    'design_preview',
    'reports',
    'notifications',
    'cms',
    'settings',
    'users',
  ],
  active: true,
  lastLogin: new Date().toLocaleString(),
  phone: '9876543210',
};

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cloudUsers, setCloudUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    // Load persisted custom admin users from Cloud Firestore & localStorage
    const loadUsers = async () => {
      const dbUsers = await firebaseCloudDb.getCollection('admin_users');
      const localUsersStr = localStorage.getItem('a1print_admin_users');
      const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];
      setCloudUsers([...dbUsers, ...localUsers]);
    };
    loadUsers();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const uInput = username.trim();
    const pInput = password.trim();

    // 1. Super Admin Check (Passcode '123456' or username 'admin' + password '123456')
    if (uInput === '123456' || (uInput === 'admin' && (pInput === '123456' || pInput === '123'))) {
      setError(null);
      localStorage.setItem('a1print_admin_user', JSON.stringify(SUPER_ADMIN_USER));
      onLoginSuccess(SUPER_ADMIN_USER);
      return;
    }

    // 2. Custom User Login ID + Password Match
    const matchedUser = cloudUsers.find(
      (u) =>
        u.active &&
        (u.username === uInput || u.email === uInput) &&
        (u.password === pInput || !u.password)
    );

    if (matchedUser) {
      setError(null);
      const updatedUser = { ...matchedUser, lastLogin: new Date().toLocaleString() };
      localStorage.setItem('a1print_admin_user', JSON.stringify(updatedUser));
      onLoginSuccess(updatedUser);
      return;
    }

    setError('Invalid Login ID or Password! Please check your credentials.');
  };

  return (
    <div className="min-h-screen bg-[#0B0E1B] text-white flex items-center justify-center p-4 font-jost select-none">
      
      {/* Background Decorative Radial Gradient */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-600 via-purple-900 to-transparent" />

      <div className="max-w-md w-full bg-[#121829] p-8 rounded-3xl border border-[#262E4A] shadow-2xl space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] text-white font-black text-2xl flex items-center justify-center mx-auto shadow-xl">
            A1
          </div>
          <div>
            <h2 className="font-playfair text-2xl font-extrabold text-white tracking-tight">
              A1print <span className="text-[#3B82F6]">Admin</span> Portal
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Storefront Control & Management Studio
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-gray-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#3B82F6]" /> Login ID / Username
            </label>
            <input
              type="text"
              required
              placeholder="Enter Login ID (e.g. admin)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A2035] border border-[#262E4A] text-white rounded-xl focus:outline-hidden focus:border-[#3B82F6] text-sm font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-gray-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#3B82F6]" /> Password / Passcode
            </label>
            <input
              type="password"
              required
              placeholder="Enter Password (e.g. 123456)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A2035] border border-[#262E4A] text-white rounded-xl focus:outline-hidden focus:border-[#3B82F6] text-sm"
            />
          </div>

          <div className="p-3 bg-[#1A2035] rounded-xl text-[11px] text-gray-300 font-semibold border border-[#262E4A] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#3B82F6] shrink-0" />
            <span>Super Admin Quick Passcode: <strong className="text-white">123456</strong></span>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:from-[#2563EB] hover:to-[#7C3AED] text-white font-bold text-sm rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" /> Sign In to Admin Panel
          </button>
        </form>

      </div>
    </div>
  );
};
