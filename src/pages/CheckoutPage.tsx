import React, { useState } from 'react';
import { CartItem, Order } from '../types';
import { LiveCustomizedFrameThumbnail } from '../components/customizer/LiveCustomizedFrameThumbnail';
import { useAuthStore } from '../store/useAuthStore';
import { ShieldCheck, Truck, CreditCard, Lock, Sparkles, Edit3, Loader2, UserPlus, LogIn, X, CheckCircle2 } from 'lucide-react';

interface CheckoutPageProps {
  items: CartItem[];
  subtotal: number;
  onPlaceOrder: (orderData: Omit<Order, 'id' | 'createdAt'>) => Order;
  onOrderSuccess?: (order: Order) => void;
  onNavigate: (page: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  subtotal,
  onPlaceOrder,
  onOrderSuccess,
  onNavigate,
}) => {
  const { user, isAuthenticated, registerUser, loginUser } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.fullName ? user.fullName.split(' ')[0] : '');
  const [lastName, setLastName] = useState(user?.fullName && user.fullName.split(' ').length > 1 ? user.fullName.split(' ').slice(1).join(' ') : '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Odisha');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'PhonePe' | 'GPay' | 'COD'>('PhonePe');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Account creation popup modal state when unauthenticated
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [regPassword, setRegPassword] = useState('');

  const activeItem = items[0];

  const handleInitialFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !address || !city || !pincode || !phone) {
      setErrorMsg('Please fill in all required billing & shipping details!');
      return;
    }

    setErrorMsg(null);

    // If customer is NOT logged in, require account creation / sign-in first!
    if (!isAuthenticated) {
      setShowAuthPopup(true);
      return;
    }

    // Customer is already logged in, proceed directly with order placement
    executeFinalOrderPlacement();
  };

  const handleAccountRegisterAndOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${firstName} ${lastName}`.trim();
    const userEmail = email || `${phone}@a1printstudio.com`;

    // Create customer account
    registerUser(fullName, userEmail, phone, regPassword || '123456');
    setShowAuthPopup(false);

    // Execute final order placement
    executeFinalOrderPlacement();
  };

  const executeFinalOrderPlacement = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      try {
        const order = onPlaceOrder({
          customer: {
            fullName: `${firstName} ${lastName}`.trim(),
            phone,
            email: email || `${phone}@a1printstudio.com`,
            address: `${address}${landmark ? `, Near ${landmark}` : ''}`,
            city,
            state,
            pincode,
          },
          items,
          subtotal,
          discount: 0,
          shipping: 0,
          total: subtotal,
          paymentMethod,
          paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
          orderStatus: 'Received',
        });

        setIsSubmitting(false);
        if (onOrderSuccess) {
          onOrderSuccess(order);
        } else {
          onNavigate('order-success');
        }
      } catch (err) {
        console.error('Order submission error:', err);
        setIsSubmitting(false);
        setErrorMsg('Failed to process order. Please try again!');
      }
    }, 1000);
  };

  if (!items || items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4 font-jost">
        <div className="p-8 bg-white rounded-3xl border border-purple-100 shadow-xl space-y-4">
          <h2 className="font-playfair text-2xl font-bold text-[#160E4B]">Your Shopping Cart is Empty</h2>
          <p className="text-xs text-gray-500">Customize a photo frame product to proceed to checkout.</p>
          <button
            onClick={() => onNavigate('home')}
            className="px-6 py-3 bg-[#F82BA9] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
          >
            Browse Custom Frames
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans select-none relative">
      
      {/* Top Checkout Header Banner */}
      <div className="bg-[#3C187B] text-white p-8 rounded-3xl text-center shadow-xl">
        <h1 className="font-playfair text-4xl font-extrabold tracking-tight">CHECKOUT</h1>
        <p className="text-xs text-purple-200 mt-1">Complete your shipping address & review your customized photo gift.</p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleInitialFormSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Billing & Shipping Details Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-purple-200 shadow-xs space-y-6">
          <div className="bg-[#3C187B] text-white p-3.5 rounded-xl font-jost font-bold text-sm flex items-center justify-between">
            <span>Billing & Shipping details</span>
            {isAuthenticated && user && (
              <span className="text-xs font-normal text-pink-300">
                Logged in as <strong className="text-white">{user.fullName.split(' ')[0]}</strong>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-jost text-xs">
            <div className="space-y-1">
              <label className="font-bold text-gray-700">
                First name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold focus:outline-hidden focus:border-[#F82BA9]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">Last name</label>
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="space-y-1 font-jost text-xs">
            <label className="font-bold text-gray-700">
              Street address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="House / Flat No., Building, Street Name/Village Name etc."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold"
            />
          </div>

          <div className="space-y-1 font-jost text-xs">
            <label className="font-bold text-gray-700">Landmark</label>
            <input
              type="text"
              placeholder="e.g. Near Bus Stand / Bank of India"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-jost text-xs">
            <div className="space-y-1">
              <label className="font-bold text-gray-700">
                Town / City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Village / City Name"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-jost text-xs">
            <div className="space-y-1">
              <label className="font-bold text-gray-700">
                Pincode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="6-Digit Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="10-Digit Mobile Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="space-y-1 font-jost text-xs">
            <label className="font-bold text-gray-700">Email address (optional)</label>
            <input
              type="email"
              placeholder="For order receipt updates"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold"
            />
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3 pt-2 font-jost">
            <label className="font-bold text-xs text-gray-900 block">Payment Method</label>
            <div className="space-y-2">
              
              <label className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                paymentMethod === 'PhonePe' ? 'border-[#F82BA9] bg-pink-50/40' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'PhonePe'}
                    onChange={() => setPaymentMethod('PhonePe')}
                    className="accent-[#F82BA9]"
                  />
                  <span className="font-bold text-xs text-gray-900">PhonePe / UPI / GPay (Instant Prepaid 9% OFF Discount)</span>
                </div>
                <CreditCard className="w-4 h-4 text-purple-600" />
              </label>

              <label className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                paymentMethod === 'COD' ? 'border-[#F82BA9] bg-pink-50/40' : 'border-gray-200'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="accent-[#F82BA9]"
                  />
                  <span className="font-bold text-xs text-gray-900">Cash on Delivery (COD Available)</span>
                </div>
                <Truck className="w-4 h-4 text-emerald-600" />
              </label>

            </div>
          </div>

        </div>

        {/* Right Column: Order Summary & Customized Frame Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-6 font-jost">
          
          <div className="bg-white p-6 rounded-3xl border border-purple-200 shadow-xs space-y-6">
            <div className="bg-[#3C187B] text-white p-3.5 rounded-xl font-bold text-sm text-center">
              View/Edit photo details
            </div>

            {/* Live Customized Frame Thumbnail Render */}
            {activeItem && (
              <div className="space-y-4">
                <div className="w-full max-w-[260px] mx-auto">
                  <LiveCustomizedFrameThumbnail item={activeItem} fontScale={0.55} />
                </div>

                <div className="text-center space-y-1 border-b border-gray-100 pb-3">
                  <h3 className="font-bold text-sm text-[#160E4B]">{activeItem.product?.title || 'Custom Photo Frame'}</h3>
                  <span className="text-xs text-gray-500">{activeItem.selectedSize?.name || 'A4 (8x12 Inch)'} x {activeItem.quantity || 1}</span>
                  <div className="font-extrabold text-sm text-[#F82BA9]">Rs.{activeItem.itemTotalPrice}.00</div>
                </div>
              </div>
            )}

            {/* Submit Order Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing Order...
                </>
              ) : (
                'Place Order Now'
              )}
            </button>
          </div>

          <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 text-center text-xs text-purple-900 space-y-1">
            <span className="font-bold flex items-center justify-center gap-1">
              <Lock className="w-3.5 h-3.5 text-purple-700" /> 100% Encrypted & Safe Order Checkout
            </span>
            <p className="text-[11px] text-gray-500">Your custom poster file is saved securely for A1print high-res printing.</p>
          </div>

        </div>

      </form>

      {/* MANDATORY CHECKOUT ACCOUNT CREATION & SIGN-IN MODAL */}
      {showAuthPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-jost animate-fadeIn">
          <div className="relative bg-white text-gray-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-pink-200 space-y-6">
            
            <button
              onClick={() => setShowAuthPopup(false)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-[#F82BA9] flex items-center justify-center mx-auto mb-1">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="font-playfair text-2xl font-extrabold text-[#160E4B]">
                Create Account to Complete Order
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Create your customer account to complete payment & track your order status in <strong className="text-[#F82BA9]">My Order 🚚</strong> anytime!
              </p>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-xs space-y-1 font-bold">
              <div className="text-[#160E4B]">Customer Name: <span className="text-purple-700">{firstName} {lastName}</span></div>
              <div className="text-[#160E4B]">Mobile Phone: <span className="text-purple-700">{phone}</span></div>
            </div>

            <form onSubmit={handleAccountRegisterAndOrder} className="space-y-4">
              <div className="space-y-1 text-xs font-bold">
                <label className="text-gray-800">Set Account Password (Optional) :</label>
                <input
                  type="password"
                  placeholder="Create a 6-digit password (Default: 123456)"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Create Account & Complete Order
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
