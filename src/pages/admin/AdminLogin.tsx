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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-sm space-y-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-950 font-bold text-lg flex items-center justify-center shadow-sm">
            A1
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Admin Portal
            </h1>
            <p className="text-xs text-zinc-400">
              Sign in to manage storefront operations
            </p>
          </div>
        </div>

        {/* Auth Card Container */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-xs font-medium text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 block">
                Username / Login ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 text-xs font-mono transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 block">
                Password / Passcode
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 text-xs transition-colors"
              />
            </div>

            <div className="p-3 bg-zinc-950/80 rounded-lg text-[11px] text-zinc-400 border border-zinc-800/60 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-zinc-300" /> Default Passcode:
              </span>
              <code className="text-zinc-200 font-mono font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">123456</code>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" /> Sign In
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-zinc-500">
          A1print Studio Enterprise Admin v2.0
        </p>

      </div>
    </div>
  );
};
