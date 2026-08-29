import React, { useState } from 'react';
import { Truck, CheckCircle2, ShieldCheck, CreditCard, Headphones, AlertTriangle } from 'lucide-react';

interface DeliveryPincodeCheckerProps {
  variant?: 'product' | 'homepage';
  className?: string;
}

export const DeliveryPincodeChecker: React.FC<DeliveryPincodeCheckerProps> = ({
  variant = 'product',
  className = '',
}) => {
  const [pincode, setPincode] = useState('754220');
  const [hasChecked, setHasChecked] = useState(false);
  const [deliveryRange, setDeliveryRange] = useState<{ start: string; end: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Helper to format date with ordinals (e.g. "5th Sep 2026")
  const formatDateWithOrdinal = (d: Date): string => {
    const day = d.getDate();
    let ordinal = 'th';
    if (day % 10 === 1 && day !== 11) ordinal = 'st';
    else if (day % 10 === 2 && day !== 12) ordinal = 'nd';
    else if (day % 10 === 3 && day !== 13) ordinal = 'rd';

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();

    return `${day}${ordinal} ${month} ${year}`;
  };

  const handleCheckDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPin = pincode.trim();
    if (!cleanPin || cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      setErrorMsg('Please enter a valid 6-digit Indian Pincode.');
      setHasChecked(false);
      return;
    }

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 5);

    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7);

    setDeliveryRange({
      start: formatDateWithOrdinal(startDate),
      end: formatDateWithOrdinal(endDate),
    });
    setHasChecked(true);
  };

  return (
    <div className={`space-y-4 font-sans select-none ${className}`}>
      
      {/* Pincode Input Box Card */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-pink-100 shadow-sm space-y-4">
        <h3 className="text-xl sm:text-2xl font-black text-[#160E4B] text-center font-playfair tracking-tight">
          Check Delivery Date by Pincode
        </h3>

        <form onSubmit={handleCheckDelivery} className="space-y-3 max-w-md mx-auto">
          <div className="space-y-1 text-left">
            <label className="text-xs font-extrabold text-gray-800 block">
              Enter your Pincode
            </label>
            <input
              type="text"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="Pincode (160055)"
              className="w-full px-4 py-3 bg-white border-2 border-emerald-500 rounded-xl text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
            />
          </div>

          {errorMsg && (
            <div className="text-xs text-red-600 font-bold flex items-center gap-1.5 pt-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-[#3C187B] to-[#5C24B5] hover:from-[#2E1260] hover:to-[#4A1D93] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer tracking-wide"
          >
            Check Delivery Date
          </button>
        </form>

        {/* Dynamic Delivery Date Estimation Result Box */}
        {hasChecked && deliveryRange && (
          <div className="mt-4 p-3.5 sm:p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center space-y-1 animate-fadeIn">
            <div className="text-xs sm:text-sm font-black text-emerald-900 flex items-center justify-center gap-1.5 flex-wrap">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Estimate Delivery by : <strong className="font-extrabold text-emerald-700 font-mono">{deliveryRange.start} - {deliveryRange.end}</strong>
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              (Delivery time may vary due to weather conditions)
            </p>
          </div>
        )}
      </div>

      {/* Cash on Delivery Available Dark Banner & Trust Badges */}
      <div className="space-y-3">
        <div className="py-3 px-4 bg-[#0E1322] text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 border border-slate-800 shadow-sm">
          <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Cash on Delivery Available</span>
        </div>

        {/* Trust Badges Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-bold text-gray-700">
          <div className="p-2.5 bg-white rounded-xl border border-gray-200 flex items-center justify-center gap-1.5 shadow-2xs">
            <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">FREE SHIPPING</span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-gray-200 flex items-center justify-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">SECURE ENCRYPTION</span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-gray-200 flex items-center justify-center gap-1.5 shadow-2xs">
            <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">SECURE PAYMENT</span>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-gray-200 flex items-center justify-center gap-1.5 shadow-2xs">
            <Headphones className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">24*7 SUPPORT</span>
          </div>
        </div>
      </div>

    </div>
  );
};
