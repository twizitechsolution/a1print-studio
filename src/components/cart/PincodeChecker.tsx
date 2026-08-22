import React, { useState } from 'react';
import { Truck, CheckCircle2, AlertTriangle, Search } from 'lucide-react';

export const PincodeChecker: React.FC = () => {
  const [pincode, setPincode] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'serviceable' | 'unserviceable'>('idle');

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6 || !/^\d+$/.test(pincode)) {
      setStatus('unserviceable');
      return;
    }

    setStatus('checking');
    setTimeout(() => {
      // Simulate Indian pincode validation
      if (['0', '9'].includes(pincode[0])) {
        setStatus('unserviceable');
      } else {
        setStatus('serviceable');
      }
    }, 600);
  };

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold text-[#160E4B] font-jost">
        <Truck className="w-4 h-4 text-[#F82BA9]" /> Check Delivery Pincode Serviceability
      </div>

      <form onSubmit={handleCheck} className="flex gap-2">
        <input
          type="text"
          maxLength={6}
          placeholder="Enter 6-digit Pincode (e.g. 110001)"
          value={pincode}
          onChange={(e) => setPincode(e.target.value)}
          className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:border-[#F82BA9]"
        />
        <button
          type="submit"
          disabled={status === 'checking'}
          className="px-4 py-2 text-xs font-bold bg-[#F82BA9] hover:bg-[#D61B90] text-white rounded-lg transition-colors flex items-center gap-1"
        >
          {status === 'checking' ? 'Checking...' : 'Check Pincode'}
        </button>
      </form>

      {status === 'serviceable' && (
        <div className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 pt-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Great news! Express Delivery available to Pincode <strong>{pincode}</strong> in 3-5 business days.</span>
        </div>
      )}

      {status === 'unserviceable' && (
        <div className="text-xs text-rose-700 font-medium flex items-center gap-1.5 pt-1">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Invalid Pincode or limited serviceability. Please enter a valid 6-digit Indian Pincode.</span>
        </div>
      )}
    </div>
  );
};
