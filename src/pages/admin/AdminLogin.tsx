import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Key, Sparkles, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'admin' && password.trim() === 'admin123') {
      setError(null);
      onLoginSuccess();
    } else {
      setError('Invalid Username or Password! (Hint: admin / admin123)');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E1B] text-white flex items-center justify-center p-4 font-jost select-none">
      
      {/* Background Decorative Radial Gradient */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-600 via-purple-900 to-transparent" />

      <div className="max-w-md w-full bg-[#121829] p-8 rounded-3xl border border-[#262E4A] shadow-2xl space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] text-white font-black text-2xl flex items-center justify-center mx-auto shadow-xl">
            A1
          </div>
          <div>
            <h2 className="font-playfair text-3xl font-extrabold text-white tracking-tight">
              A1print<span className="text-[#3B82F6]"> Admin</span> Login
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Dedicated Store & Print Studio Admin Portal
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
              <User className="w-3.5 h-3.5 text-[#3B82F6]" /> Username
            </label>
            <input
              type="text"
              required
              placeholder="Enter admin username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A2035] border border-[#262E4A] text-white rounded-xl focus:outline-hidden focus:border-[#3B82F6] text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-gray-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#3B82F6]" /> Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#1A2035] border border-[#262E4A] text-white rounded-xl focus:outline-hidden focus:border-[#3B82F6] text-sm"
            />
          </div>

          <div className="p-3 bg-[#1A2035] rounded-xl text-[11px] text-gray-300 font-semibold border border-[#262E4A] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#3B82F6] shrink-0" />
            <span>Credentials: Username: <strong className="text-white">admin</strong> | Password: <strong className="text-white">admin123</strong></span>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:from-[#2563EB] hover:to-[#7C3AED] text-white font-bold text-sm rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" /> Secure A1print Admin Login
          </button>
        </form>

      </div>
    </div>
  );
};
