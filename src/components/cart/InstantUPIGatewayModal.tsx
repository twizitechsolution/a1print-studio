import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, QrCode, Smartphone, CreditCard, Lock, Sparkles, Copy, Loader2, ArrowRight } from 'lucide-react';

interface InstantUPIGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  orderTitle?: string;
  onPaymentSuccess: (paymentId: string) => void;
}

export const InstantUPIGatewayModal: React.FC<InstantUPIGatewayModalProps> = ({
  isOpen,
  onClose,
  amount,
  customerName,
  customerPhone,
  customerEmail,
  orderTitle,
  onPaymentSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'intent' | 'vpa' | 'card'>('qr');
  const [upiVpa, setUpiVpa] = useState('');
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const upiId = '7790098801@ybl'; // Merchant UPI ID
  const merchantName = 'A1print Studio';
  
  // Dynamic UPI URL for QR Code & Intent Apps
  const upiPayUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(orderTitle || 'A1print Photo Gift Order')}`;
  
  // High quality QR Code Generator API URL
  const qrCodeImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiPayUrl)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulatePayment = (app: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const simulatedPaymentId = `pay_upi_${Date.now()}`;
      onPaymentSuccess(simulatedPaymentId);
    }, 1800);
  };

  const handleVpaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiVpa || !upiVpa.includes('@')) {
      alert('Please enter a valid UPI ID (e.g. 9876543210@ybl or name@okicici)');
      return;
    }
    handleSimulatePayment('UPI Collect');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-jost animate-fadeIn select-none">
      <div className="relative bg-white text-gray-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-pink-200 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3C187B] to-[#F82BA9] text-white flex items-center justify-center font-extrabold text-sm shadow-md">
              A1
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-1.5">
                A1print Instant Prepaid Gateway <ShieldCheck className="w-4 h-4 text-emerald-600 fill-emerald-100" />
              </h3>
              <span className="text-xs text-gray-500 font-bold">100% Encrypted • 9% Prepaid Discount Applied</span>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Amount Banner */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-pink-100 flex items-center justify-between font-bold">
          <div>
            <span className="text-xs text-gray-500 block">Total Payment Amount:</span>
            <span className="text-2xl font-extrabold text-[#F82BA9]">₹{amount}.00</span>
          </div>
          <div className="text-right text-xs text-purple-900">
            <span className="block font-bold">Order for {customerName.split(' ')[0]}</span>
            <span className="text-[11px] text-gray-500">{customerPhone}</span>
          </div>
        </div>

        {/* Payment Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-2xl font-bold text-xs">
          <button
            onClick={() => setActiveTab('qr')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'qr' ? 'bg-white text-[#F82BA9] shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <QrCode className="w-4 h-4" /> Scan QR
          </button>

          <button
            onClick={() => setActiveTab('intent')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'intent' ? 'bg-white text-[#F82BA9] shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Smartphone className="w-4 h-4" /> UPI Apps
          </button>

          <button
            onClick={() => setActiveTab('vpa')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'vpa' ? 'bg-white text-[#F82BA9] shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CreditCard className="w-4 h-4" /> UPI ID
          </button>
        </div>

        {/* Tab 1: Scan UPI QR Code */}
        {activeTab === 'qr' && (
          <div className="text-center space-y-4 py-2">
            <div className="w-48 h-48 mx-auto bg-white p-2.5 rounded-2xl border-2 border-dashed border-pink-300 shadow-md flex items-center justify-center relative">
              <img src={qrCodeImgUrl} alt="UPI QR Code" className="w-full h-full object-contain" />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-800">Scan with PhonePe, Google Pay, Paytm, or BHIM camera</p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">Merchant UPI: {upiId}</span>
                <button
                  onClick={handleCopyUpi}
                  className="p-1 text-purple-700 hover:text-[#F82BA9] rounded-lg transition-colors cursor-pointer"
                  title="Copy UPI ID"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {copied && <span className="text-[11px] text-emerald-600 font-bold">Copied!</span>}
              </div>
            </div>

            <button
              onClick={() => handleSimulatePayment('UPI QR Scan')}
              disabled={isProcessing}
              className="w-full py-3.5 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Payment...
                </>
              ) : (
                'I Have Completed Payment'
              )}
            </button>
          </div>
        )}

        {/* Tab 2: Direct UPI App Intents */}
        {activeTab === 'intent' && (
          <div className="space-y-3 py-2">
            <p className="text-xs font-bold text-gray-600 text-center">Click your preferred app to launch instant payment:</p>

            <div className="grid grid-cols-2 gap-3 font-bold text-xs">
              <button
                onClick={() => handleSimulatePayment('PhonePe')}
                disabled={isProcessing}
                className="p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl flex items-center justify-between text-purple-900 transition-all cursor-pointer"
              >
                <span>PhonePe</span>
                <ArrowRight className="w-4 h-4 text-purple-600" />
              </button>

              <button
                onClick={() => handleSimulatePayment('Google Pay')}
                disabled={isProcessing}
                className="p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl flex items-center justify-between text-blue-900 transition-all cursor-pointer"
              >
                <span>Google Pay</span>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </button>

              <button
                onClick={() => handleSimulatePayment('Paytm')}
                disabled={isProcessing}
                className="p-4 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-2xl flex items-center justify-between text-sky-900 transition-all cursor-pointer"
              >
                <span>Paytm UPI</span>
                <ArrowRight className="w-4 h-4 text-sky-600" />
              </button>

              <button
                onClick={() => handleSimulatePayment('BHIM UPI')}
                disabled={isProcessing}
                className="p-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-900 transition-all cursor-pointer"
              >
                <span>BHIM UPI</span>
                <ArrowRight className="w-4 h-4 text-amber-600" />
              </button>
            </div>

            {isProcessing && (
              <div className="p-3 bg-pink-50 border border-pink-200 rounded-xl text-center text-xs font-bold text-[#F82BA9] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Confirming UPI Payment...
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Collect Request via UPI VPA */}
        {activeTab === 'vpa' && (
          <form onSubmit={handleVpaSubmit} className="space-y-4 py-2 text-xs font-bold">
            <div className="space-y-1">
              <label className="text-gray-700">Enter your Mobile/UPI VPA ID:</label>
              <input
                type="text"
                required
                placeholder="e.g. 7790098801@ybl / name@okicici"
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9]"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Sending Collect Request...
                </>
              ) : (
                'Send Payment Collect Request'
              )}
            </button>
          </form>
        )}

        {/* Footer Security Badge */}
        <div className="pt-2 text-center text-[11px] text-gray-500 font-bold flex items-center justify-center gap-1.5 border-t border-gray-100">
          <Lock className="w-3.5 h-3.5 text-purple-700" /> Powered by A1print Instant Secure Payment Server
        </div>

      </div>
    </div>
  );
};
