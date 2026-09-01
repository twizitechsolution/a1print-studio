import React, { useState, useEffect } from 'react';
import { PaymentSetting } from '../../types/admin';
import { CreditCard, DollarSign, ShieldCheck, Key, Save, CheckCircle2, RefreshCw } from 'lucide-react';

export const AdminPaymentManager: React.FC = () => {
  const [methods, setMethods] = useState<PaymentSetting[]>([
    {
      id: 'p1',
      name: 'Razorpay Payment Gateway (Cards, NetBanking, Wallets, UPI)',
      provider: 'razorpay',
      enabled: true,
      extraFee: 0,
      description: 'Instant online card, UPI, & netbanking gateway integration.',
    },
    {
      id: 'p2',
      name: 'Direct Instant UPI (PhonePe, GPay, Paytm, BHIM)',
      provider: 'upi',
      enabled: true,
      extraFee: 0,
      description: 'Zero transaction fee 1-click UPI QR payment gateway.',
    },
    {
      id: 'p3',
      name: 'Cash on Delivery (COD) with Extra Handling Fee',
      provider: 'cod',
      enabled: true,
      extraFee: 50,
      description: 'Pay cash upon courier delivery. Adds ₹50 risk fee.',
    },
  ]);

  const [codFee, setCodFee] = useState<number>(0);
  const [keyId, setKeyId] = useState<string>('rzp_test_TWrhN46NzOrFA4');
  const [keySecret, setKeySecret] = useState<string>('1OoKv4t5vKRYfYGRRqCpv9H0');
  const [savedStatus, setSavedStatus] = useState<string | null>(null);

  useEffect(() => {
    const savedKeyId = localStorage.getItem('razorpay_key_id');
    const savedKeySecret = localStorage.getItem('razorpay_key_secret');
    if (savedKeyId) setKeyId(savedKeyId);
    if (savedKeySecret) setKeySecret(savedKeySecret);
  }, []);

  const toggleMethod = (id: string) => {
    setMethods(
      methods.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const handleUpdateCodFee = (newFee: number) => {
    setCodFee(newFee);
    setMethods(
      methods.map((m) => (m.provider === 'cod' ? { ...m, extraFee: newFee } : m))
    );
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('razorpay_key_id', keyId.trim());
    localStorage.setItem('razorpay_key_secret', keySecret.trim());
    setSavedStatus('Razorpay API Keys saved successfully!');
    setTimeout(() => setSavedStatus(null), 4000);
  };

  return (
    <div className="space-y-6 font-jost">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-playfair text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" /> Payment Gateways & COD Rules Manager
          </h3>
          <p className="text-xs text-gray-400">Configure online payment gateways, Razorpay API Keys, UPI QR codes, and Cash on Delivery charges.</p>
        </div>
      </div>

      {savedStatus && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-bold text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {savedStatus}
        </div>
      )}

      {/* Razorpay API Keys Settings Card */}
      <form onSubmit={handleSaveCredentials} className="p-6 bg-[#121829] rounded-3xl border border-[#262E4A] space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#262E4A] pb-3">
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-pink-400" /> Razorpay Gateway Credentials Settings
          </h4>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-pink-500/10 text-[#F82BA9] font-bold border border-pink-500/20">
            Active Merchant Gateway
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
          <div className="space-y-1">
            <label className="text-gray-300">RAZORPAY KEY ID :</label>
            <input
              type="text"
              required
              placeholder="rzp_test_..."
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-4 py-2.5 rounded-xl text-white font-mono focus:outline-hidden focus:border-[#F82BA9]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-gray-300">RAZORPAY KEY SECRET :</label>
            <input
              type="password"
              required
              placeholder="Key Secret from Razorpay Dashboard"
              value={keySecret}
              onChange={(e) => setKeySecret(e.target.value)}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-4 py-2.5 rounded-xl text-white font-mono focus:outline-hidden focus:border-[#F82BA9]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-gray-400">
            Paste your Key ID & Secret from <strong className="text-white">Razorpay Dashboard ➔ Settings ➔ API Keys</strong>.
          </p>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save API Keys
          </button>
        </div>
      </form>

      {/* COD Configuration Card */}
      <div className="p-5 bg-[#121829] rounded-2xl border border-[#262E4A] space-y-3 shadow-xl">
        <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-amber-400" /> Cash on Delivery (COD) Handling Charge Rule
        </h4>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          <div className="space-y-0.5">
            <p className="text-xs text-gray-300 font-bold">Extra COD Handling Fee added to Checkout Total:</p>
            <p className="text-[11px] text-gray-400">Protects business against non-delivery / customer rejection risks.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white font-extrabold">₹</span>
            <input
              type="number"
              value={codFee}
              onChange={(e) => handleUpdateCodFee(Number(e.target.value))}
              className="w-24 bg-[#1A2035] border border-[#262E4A] px-3 py-1.5 rounded-xl text-xs text-white font-bold font-mono focus:outline-hidden"
            />
            <span className="text-xs text-emerald-400 font-bold">Per Order</span>
          </div>
        </div>
      </div>

      {/* Payment Gateways Toggle List */}
      <div className="p-5 bg-[#121829] rounded-2xl border border-[#262E4A] shadow-xl space-y-3">
        <h4 className="font-bold text-sm text-white">Active Payment Gateways ({methods.length})</h4>
        <div className="divide-y divide-[#262E4A]">
          {methods.map((m) => (
            <div key={m.id} className="py-4 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-white text-sm">{m.name}</h5>
                  <p className="text-xs text-gray-400">{m.description}</p>
                </div>
              </div>

              <button
                onClick={() => toggleMethod(m.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  m.enabled
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}
              >
                {m.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
