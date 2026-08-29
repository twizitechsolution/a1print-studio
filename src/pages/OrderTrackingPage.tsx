import React, { useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import { Order } from '../types';
import { Truck, CheckCircle2, Clock, Package, MapPin, MessageSquare, AlertCircle, RefreshCw, Send, Search } from 'lucide-react';

export const OrderTrackingPage: React.FC = () => {
  const { orders } = useCartStore();
  const [orderIdInput, setOrderIdInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const trimmedId = orderIdInput.trim().toUpperCase();
    const trimmedEmail = emailInput.trim().toLowerCase();

    if (!trimmedId) {
      setErrorMessage('Please enter a valid Order ID (e.g. ORD-849201).');
      return;
    }

    const found = orders.find((o) => {
      const idMatch = o.id.toUpperCase() === trimmedId || o.id.toUpperCase().includes(trimmedId);
      const emailOrPhoneMatch =
        !trimmedEmail ||
        (o.customer?.email || '').toLowerCase().includes(trimmedEmail) ||
        (o.customer?.phone || '').includes(trimmedEmail);
      return idMatch && emailOrPhoneMatch;
    });

    setHasSearched(true);
    if (found) {
      setSearchedOrder(found);
    } else {
      setSearchedOrder(null);
      setErrorMessage(`No matching order found for "${trimmedId}". Please verify your Order ID and Email/Phone.`);
    }
  };

  // Helper for Stepper Stage Progress matching reference screenshot media_1788033803441.png
  const getProgressStep = (status: Order['orderStatus']) => {
    switch (status) {
      case 'New':
      case 'Received':
        return 1;
      case 'Design':
      case 'Printing':
      case 'QC':
      case 'Packing':
        return 2;
      case 'Shipped':
        return 3;
      case 'Delivered':
        return 4;
      default:
        return 1;
    }
  };

  const getPaymentBadge = (status: Order['paymentStatus'], method?: string) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 🟢 Payment: {method || 'Online'} (Paid)
          </span>
        );
      case 'COD':
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> 🟠 Cash on Delivery (COD)
          </span>
        );
      case 'Pending':
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> 🔴 Payment Pending
          </span>
        );
      case 'Refund':
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-50 text-purple-600 border border-purple-200 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span> ↩️ Refund Initiated
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-50 text-gray-600 border border-gray-200">
            Payment: {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/40 via-white to-gray-50 font-sans pb-16">
      
      {/* 1. Hero Search Banner matching LovecraftbySE reference screenshot media_1788033803471.png */}
      <div className="relative bg-gradient-to-r from-pink-100 via-rose-50 to-purple-100 py-12 px-4 sm:px-6 lg:px-8 border-b border-pink-200 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-3 relative z-10">
          <h1 className="font-playfair text-3xl sm:text-5xl font-black text-[#160E4B] tracking-tight">
            Track Your Order
          </h1>
          <p className="text-sm font-semibold text-gray-600 font-jost">
            Enter your Order ID and email to check real-time printing & courier status.
          </p>

          {/* Search Form Card */}
          <form
            onSubmit={handleTrackOrder}
            className="mt-6 bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-pink-200 shadow-xl max-w-2xl mx-auto space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Order ID <span className="text-[#F82BA9]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your Order ID (e.g. ORD-849201)"
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl text-xs text-gray-900 font-mono placeholder:text-gray-400 focus:outline-none focus:border-[#F82BA9] focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Email / Phone <span className="text-[#F82BA9]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your Email or Mobile No."
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#F82BA9] focus:bg-white transition-all"
                />
              </div>
            </div>

            {errorMessage && (
              <p className="text-xs font-bold text-rose-500 bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-center">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#F82BA9] via-purple-600 to-[#160E4B] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" /> CHECK ORDER
            </button>
          </form>
        </div>
      </div>

      {/* 2. Tracked Order Results Section matching Screenshot media_1788033803441.png */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        {searchedOrder && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-8 animate-fadeIn">
            
            {/* Order Header Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
              <div>
                <span className="text-xs font-black text-[#F82BA9] uppercase tracking-wider block">Order Details</span>
                <h3 className="font-playfair text-2xl font-black text-[#160E4B]">
                  #{searchedOrder.id}
                </h3>
                <span className="text-xs text-gray-500">
                  Placed on {new Date(searchedOrder.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {getPaymentBadge(searchedOrder.paymentStatus, searchedOrder.paymentMethod)}
              </div>
            </div>

            {/* LIVE PRINTING & DISPATCH PROGRESS Stepper matching media_1788033803441.png */}
            <div className="space-y-4 bg-gradient-to-r from-pink-50/50 via-purple-50/40 to-pink-50/50 p-6 rounded-2xl border border-pink-100">
              <h4 className="text-xs font-black text-[#160E4B] uppercase tracking-wider">
                LIVE PRINTING & DISPATCH PROGRESS
              </h4>

              <div className="grid grid-cols-4 gap-2 text-center relative">
                {/* Connecting Line */}
                <div className="absolute top-4 left-[12%] right-[12%] h-1 bg-gray-200 -z-0">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${((getProgressStep(searchedOrder.orderStatus) - 1) / 3) * 100}%`,
                    }}
                  ></div>
                </div>

                {/* Step 1 */}
                <div className="space-y-2 z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                      getProgressStep(searchedOrder.orderStatus) >= 1
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {getProgressStep(searchedOrder.orderStatus) > 1 ? <CheckCircle2 className="w-5 h-5" /> : 1}
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 block">Order Placed</span>
                </div>

                {/* Step 2 */}
                <div className="space-y-2 z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                      getProgressStep(searchedOrder.orderStatus) >= 2
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {getProgressStep(searchedOrder.orderStatus) > 2 ? <CheckCircle2 className="w-5 h-5" /> : 2}
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 block">Archival Printing</span>
                </div>

                {/* Step 3 */}
                <div className="space-y-2 z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                      getProgressStep(searchedOrder.orderStatus) >= 3
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {getProgressStep(searchedOrder.orderStatus) > 3 ? <CheckCircle2 className="w-5 h-5" /> : 3}
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 block">Courier Dispatched</span>
                </div>

                {/* Step 4 */}
                <div className="space-y-2 z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                      getProgressStep(searchedOrder.orderStatus) >= 4
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {getProgressStep(searchedOrder.orderStatus) >= 4 ? <CheckCircle2 className="w-5 h-5" /> : 4}
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 block">Delivered</span>
                </div>
              </div>
            </div>

            {/* Admin Live Remark Alert Box */}
            {searchedOrder.adminRemark && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  <span>Admin Status Update Note:</span>
                  {searchedOrder.adminRemarkTimestamp && (
                    <span className="text-[10px] font-normal text-amber-700 font-mono">
                      ({new Date(searchedOrder.adminRemarkTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium pl-6">{searchedOrder.adminRemark}</p>
              </div>
            )}

            {/* Order Items List */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-700 uppercase">Items in this Order</h4>
              {searchedOrder.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-20 bg-white rounded-xl overflow-hidden border border-gray-200 shrink-0 p-1">
                      <img
                        src={item.customizedFramePreviewUrl || item.uploadedPhotoUrl || item.product?.thumbnail}
                        alt="Frame Preview"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-bold text-[#160E4B] text-sm">{item.product?.title || 'Custom Photo Frame'}</h5>
                      <p className="text-gray-500 font-mono text-[11px]">
                        Size: {item.selectedSize?.dimensions || 'A4 (8x12 Inch)'} | Frame: {item.selectedFrame?.name || 'Classic Black Wood'}
                      </p>
                      {item.customTextValues && Object.keys(item.customTextValues).length > 0 && (
                        <div className="text-[10px] text-gray-600 bg-white p-2 rounded-lg border border-gray-200 space-y-0.5 max-w-sm">
                          {Object.entries(item.customTextValues).map(([k, v]) => (
                            <div key={k} className="truncate">
                              <span className="font-bold capitalize">{k}:</span> {v}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-base text-[#160E4B]">₹{item.itemTotalPrice}</span>
                    <span className="text-[10px] text-gray-400 block font-mono">Qty: {item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Shipping Address & Track on WhatsApp matching media_1788033803441.png */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-200">
              <div className="space-y-1 text-xs">
                <span className="font-bold text-gray-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#F82BA9]" /> Delivery Shipping Address:
                </span>
                <p className="text-gray-800 font-semibold">{searchedOrder.customer?.fullName} ({searchedOrder.customer?.phone})</p>
                <p className="text-gray-600">
                  {searchedOrder.customer?.address}, {searchedOrder.customer?.city}, {searchedOrder.customer?.state} - {searchedOrder.customer?.pincode}
                </p>
              </div>

              {/* Track on WhatsApp Button */}
              <a
                href={`https://wa.me/917790098808?text=${encodeURIComponent(`Hi A1print Team, I want to check tracking details for my Order #${searchedOrder.id}`)}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 rounded-2xl bg-[#00A884] hover:bg-[#008f70] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all shrink-0"
              >
                <MessageSquare className="w-4 h-4 fill-white" /> Track on WhatsApp
              </a>
            </div>

          </div>
        )}

        {/* Default Help Card when no search initiated */}
        {!hasSearched && (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-200 p-8 space-y-3 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-pink-100 text-[#F82BA9] flex items-center justify-center mx-auto mb-2 text-2xl">
              📦
            </div>
            <h3 className="font-playfair text-xl font-bold text-[#160E4B]">Check Your Order Status Live</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Enter your 6-digit Order ID (e.g. <b>ORD-849201</b>) above to view real-time photo print progress, quality check status, and WhatsApp tracking link!
            </p>
          </div>
        )}

      </div>

    </div>
  );
};
