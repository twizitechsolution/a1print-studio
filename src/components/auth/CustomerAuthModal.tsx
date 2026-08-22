import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { X, User, Mail, Lock, Phone, Sparkles, LogIn, UserPlus, CheckCircle2 } from 'lucide-react';

export const CustomerAuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, loginUser, registerUser, openAuthModal } = useAuthStore();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration Fields
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone) {
      setErrorMsg('Please enter your Mobile number or Email address.');
      return;
    }
    setErrorMsg('');
    const success = loginUser(emailOrPhone, loginPassword);
    if (success) {
      setSuccessMsg('Successfully logged in!');
      setTimeout(() => setSuccessMsg(''), 2000);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regPhone) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    setErrorMsg('');
    const success = registerUser(regFullName, regEmail, regPhone, regPassword);
    if (success) {
      setSuccessMsg('Account created successfully!');
      setTimeout(() => setSuccessMsg(''), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-jost animate-fadeIn select-none">
      <div className="relative bg-white text-gray-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-pink-100 space-y-6">
        
        {/* Modal Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Title */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-pink-100 text-[#F82BA9] flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="font-playfair text-2xl font-extrabold text-[#160E4B]">
            {authModalMode === 'login' ? 'Customer Sign In' : 'Create New Account'}
          </h2>
          <p className="text-xs text-gray-500">
            {authModalMode === 'login'
              ? 'Access your saved orders, delivery progress, and addresses.'
              : 'Join A1print Studio to track live frame orders and save addresses.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-2xl text-xs font-bold">
          <button
            onClick={() => openAuthModal('login')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authModalMode === 'login'
                ? 'bg-[#160E4B] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </button>

          <button
            onClick={() => openAuthModal('register')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authModalMode === 'register'
                ? 'bg-[#F82BA9] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Register
          </button>
        </div>

        {/* Alert Messages */}
        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {successMsg}
          </div>
        )}

        {/* LOGIN FORM */}
        {authModalMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-bold">
            <div className="space-y-1">
              <label className="text-gray-800">Mobile Number or Email Address :</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 9583626786 or customer@gmail.com"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9]"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-gray-800">Password :</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9]"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#160E4B] hover:bg-[#251877] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Sign In to Account <LogIn className="w-4 h-4" />
            </button>

            {/* Quick Demo Sign In Shortcut */}
            <div className="pt-2 text-center border-t border-gray-100 space-y-2">
              <span className="text-[11px] text-gray-400">Want to test quickly?</span>
              <button
                type="button"
                onClick={() => {
                  setEmailOrPhone('nirod@a1printstudio.com');
                  loginUser('nirod@a1printstudio.com', '123456');
                }}
                className="w-full py-2 bg-purple-50 text-[#3C187B] hover:bg-purple-100 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-purple-200"
              >
                Sign In with Demo Customer Account
              </button>
            </div>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs font-bold">
            <div className="space-y-1">
              <label className="text-gray-800">Full Name :</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Nirod Behera"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9]"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-gray-800">Email Address :</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9]"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-gray-800">Mobile Phone Number :</label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9]"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-gray-800">Create Password :</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9]"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              Create Account & Sign In <UserPlus className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
