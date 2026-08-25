import React, { useState } from 'react';
import { PaymentSetting } from '../../types/admin';
import { CreditCard, DollarSign, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminPaymentManager: React.FC = () => {
  const [methods, setMethods] = useState<PaymentSetting[]>([
    {
      id: 'p1',
      name: 'Razorpay Payment Gateway (Cards, NetBanking, Wallets)',
      provider: 'razorpay',
      enabled: true,
      extraFee: 0,
      description: 'Instant online card & netbanking gateway integration.',
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

  const [codFee, setCodFee] = useState<number>(50);

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

  return (
    <div className="space-y-6 font-jost">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-playfair text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" /> Payment Gateways & COD Rules Manager
          </h3>
          <p className="text-xs text-gray-400">Configure online payment gateways, UPI QR codes, and Cash on Delivery charges.</p>
        </div>
      </div>

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
