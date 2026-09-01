import React, { useState } from 'react';
import { CartItem } from '../types';
import { LiveCustomizedFrameThumbnail } from '../components/customizer/LiveCustomizedFrameThumbnail';
import { Trash2, ArrowRight, ShoppingBag } from 'lucide-react';

interface CartPageProps {
  items: CartItem[];
  subtotal: number;
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onNavigate: (page: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  items,
  subtotal,
  onRemoveItem,
  onUpdateQuantity,
  onNavigate,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    const code = couponInput.trim().toUpperCase();

    // Validate per-customer usage limit (1-5 times or Unlimited)
    const storedUserRaw = localStorage.getItem('a1print_customer_user');
    const userEmail = storedUserRaw ? (JSON.parse(storedUserRaw).email || 'customer') : 'guest';
    const redemptionsRaw = localStorage.getItem('a1print_coupon_redemptions_v1');
    const redemptionsMap = redemptionsRaw ? JSON.parse(redemptionsRaw) : {};
    const userUsedCount = redemptionsMap[userEmail]?.[code] || 0;

    // Default 1-time limit per customer for standard codes
    const perUserLimit = (code === 'UNLIMITED20' || code === 'REPEAT5') ? 5 : 1;

    if (userUsedCount >= perUserLimit) {
      setCouponError(`⚠️ You have already reached your maximum allowed usage limit (${perUserLimit} time) for promo code '${code}'!`);
      return;
    }

    if (code === 'SAVE10' || code === 'FIRST10' || code === 'WELCOME10') {
      setAppliedCoupon({ code, discountPercent: 10 });
      setCouponError(null);
    } else if (code === 'FESTIVE20' || code === 'RAKHI20' || code === 'SPECIAL20' || code === 'UNLIMITED20') {
      setAppliedCoupon({ code, discountPercent: 20 });
      setCouponError(null);
    } else if (code === 'A1PRINT5' || code === 'REPEAT5') {
      setAppliedCoupon({ code, discountPercent: 5 });
      setCouponError(null);
    } else {
      setCouponError('Invalid coupon code. Try "SAVE10" or "FESTIVE20"!');
    }
  };

  const discountAmount = appliedCoupon ? Math.round((subtotal * appliedCoupon.discountPercent) / 100) : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center font-jost space-y-6 select-none">
        <div className="w-20 h-20 bg-purple-50 text-[#3C187B] rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="font-playfair text-3xl font-bold text-[#160E4B]">Your Cart is Currently Empty</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">Explore our collection of custom photo frames and create a personalized gift today!</p>
        <button
          onClick={() => onNavigate('catalog')}
          className="px-8 py-3.5 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-bold text-xs rounded-xl shadow-lg transition-all"
        >
          Explore All Frames
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-jost select-none">
      
      {/* Page Title */}
      <h1 className="font-playfair text-3xl sm:text-4xl font-extrabold text-[#160E4B]">
        Shopping Cart ({items.length} Custom Items)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="p-6 bg-white rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              
              <div className="flex items-center gap-4">
                {/* Bulletproof Live Frame Thumbnail Component */}
                <div className="w-20 h-24 shrink-0">
                  <LiveCustomizedFrameThumbnail item={item} />
                </div>

                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-sm text-[#160E4B]">{item.product?.title || 'Custom Photo Frame'}</h4>
                  <p className="text-[#F82BA9] font-bold">Size: {item.selectedSize?.name || 'A4 (8x12 Inch)'}</p>
                  <p className="text-gray-500">Frame Style: {item.selectedFrame?.name || 'Classic Black Wood'}</p>
                  
                  {/* Dynamic Customization Details List (Clean & Professional Display) */}
                  {item.customTextValues && Object.keys(item.customTextValues).length > 0 && (
                    <div className="p-2.5 bg-purple-50/70 rounded-xl text-[11px] space-y-1 mt-2 border border-purple-100 max-w-sm">
                      {Object.entries(item.customTextValues).map(([k, v]) => {
                        if (!v) return null;
                        const isImage = typeof v === 'string' && (v.startsWith('data:image') || v.startsWith('http://') || v.startsWith('https://'));
                        const cleanKey = k
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/[-_]/g, ' ')
                          .replace(/^./, (str) => str.toUpperCase())
                          .trim();

                        if (isImage) {
                          return (
                            <div key={k} className="flex items-center gap-1.5 text-[#160E4B]">
                              <span className="font-bold">{cleanKey}:</span>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-md">✓ Uploaded</span>
                            </div>
                          );
                        }

                        return (
                          <div key={k} className="text-[#160E4B]">
                            <span className="font-bold">{cleanKey}:</span> <span className="font-semibold text-gray-800">{v}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-2 py-1">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="px-2 font-bold text-gray-600 hover:text-black"
                  >
                    -
                  </button>
                  <span className="font-bold text-xs px-2">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="px-2 font-bold text-gray-600 hover:text-black"
                  >
                    +
                  </button>
                </div>

                <span className="font-extrabold text-base text-[#160E4B]">₹{item.itemTotalPrice}</span>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Right Column: Order Summary with Coupon Code Input */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-6">
          <h3 className="font-bold text-base text-[#160E4B]">Order Summary</h3>

          {/* Coupon Code Input & Apply Box */}
          <div className="p-4 bg-pink-50/60 rounded-2xl border border-pink-100 space-y-2">
            <label className="text-xs font-extrabold text-[#160E4B] flex items-center gap-1.5">
              🏷️ Have a Coupon Code?
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter code (e.g. SAVE10)..."
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#F82BA9] font-mono font-bold uppercase"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-4 py-2 bg-[#F82BA9] hover:bg-[#D61B90] text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shrink-0 shadow-xs"
              >
                Apply
              </button>
            </div>
            {couponError && <p className="text-[11px] text-rose-600 font-bold">{couponError}</p>}
            {appliedCoupon && (
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                <span>✓ Code &apos;{appliedCoupon.code}&apos; Applied ({appliedCoupon.discountPercent}% OFF)</span>
                <button onClick={() => setAppliedCoupon(null)} className="text-rose-500 hover:text-rose-700">✕</button>
              </div>
            )}
          </div>

          <div className="space-y-3 text-xs text-gray-600">
            <div className="flex justify-between font-bold">
              <span>Cart Subtotal</span>
              <span className="text-gray-900 font-extrabold">₹{subtotal}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between font-bold text-emerald-600">
                <span>Coupon Discount ({appliedCoupon?.code})</span>
                <span>-₹{discountAmount}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-emerald-600">
              <span>Express Shipping</span>
              <span>FREE</span>
            </div>
            <div className="pt-3 border-t border-gray-200 flex justify-between font-extrabold text-base text-[#160E4B]">
              <span>Grand Total</span>
              <span className="text-[#F82BA9]">₹{finalTotal}</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('checkout')}
            className="w-full py-4 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Proceed to Checkout <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
