import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { X, User, Mail, Lock, Phone, Sparkles, LogIn, UserPlus, CheckCircle2, ArrowRight } from 'lucide-react';
import { signInWithGooglePopup } from '../../config/firebase';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const isRegister = authModalMode === 'register';

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    try {
      const res = await signInWithGooglePopup();
      if (res.success && res.email) {
        const success = registerUser(res.name, res.email, '', 'google-oauth');
        if (success) {
          setSuccessMsg(`✓ Welcome, ${res.name}!`);
          setTimeout(() => {
            setSuccessMsg('');
            closeAuthModal();
          }, 1500);
        }
      } else if (res.error) {
        setErrorMsg(`Google Sign-In: ${res.error}`);
      }
    } catch (e: any) {
      setErrorMsg('Google Sign-In popup closed or cancelled.');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      setErrorMsg('Please enter your Mobile number or Email address.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const success = loginUser(emailOrPhone.trim(), loginPassword);
      if (success) {
        setSuccessMsg('Successfully signed in!');
        setTimeout(() => {
          setSuccessMsg('');
          closeAuthModal();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setErrorMsg('Please fill in all required registration fields.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const success = registerUser(regFullName.trim(), regEmail.trim(), regPhone.trim(), regPassword);
      if (success) {
        setSuccessMsg('Account created successfully! Welcome to A1print Studio.');
        setTimeout(() => {
          setSuccessMsg('');
          closeAuthModal();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Account registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-jost animate-fadeIn select-none">
      <div className="relative bg-white text-gray-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-pink-100 space-y-5">
        
        {/* Modal Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Title */}
        <div className="text-center space-y-1 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-pink-100 text-[#F82BA9] flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="font-playfair text-2xl sm:text-3xl font-extrabold text-[#160E4B]">
            {isRegister ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-gray-500">
            {isRegister
              ? 'Join A1print Studio to save your custom frames and track orders.'
              : 'Sign in to access your orders, saved addresses & custom frames.'}
          </p>
        </div>

        {/* TOP: Prominent Google Sign-in Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-3.5 px-4 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 text-gray-800 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* OR Divider Line */}
        <div className="relative flex items-center justify-center my-2">
          <div className="w-full border-t border-gray-200"></div>
          <span className="bg-white px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider absolute">
            OR
          </span>
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

        {/* SIGN IN FORM */}
        {!isRegister ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-bold">
            <div className="space-y-1">
              <label className="text-gray-800">Mobile Number or Email Address :</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 9583626786 or customer@gmail.com"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9] font-medium"
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
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9] font-medium"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#160E4B] hover:bg-[#251877] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              Sign In <LogIn className="w-4 h-4" />
            </button>

            {/* Bottom Toggle Link */}
            <div className="pt-2 text-center text-xs">
              <span className="text-gray-500">New to A1print Studio? </span>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  openAuthModal('register');
                }}
                className="font-extrabold text-[#F82BA9] hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                Register here <ArrowRight className="w-3.5 h-3.5" />
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
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9] font-medium"
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
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9] font-medium"
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
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9] font-medium"
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
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9] font-medium"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-50"
            >
              Create Account <UserPlus className="w-4 h-4" />
            </button>

            {/* Bottom Toggle Link */}
            <div className="pt-2 text-center text-xs">
              <span className="text-gray-500">Already have an account? </span>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  openAuthModal('login');
                }}
                className="font-extrabold text-[#160E4B] hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                Sign In here <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
