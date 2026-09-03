import React, { useState } from 'react';
import { CartItem, Order } from '../types';
import { LiveCustomizedFrameThumbnail } from '../components/customizer/LiveCustomizedFrameThumbnail';
import { useAuthStore } from '../store/useAuthStore';
import { launchRazorpayCheckout } from '../services/razorpayService';
import { InstantUPIGatewayModal } from '../components/cart/InstantUPIGatewayModal';
import { ShieldCheck, Truck, CreditCard, Lock, Sparkles, Edit3, Loader2, UserPlus, LogIn, X, CheckCircle2, Zap, QrCode, MapPin } from 'lucide-react';

interface CheckoutPageProps {
  items: CartItem[];
  subtotal: number;
  onPlaceOrder: (orderData: Omit<Order, 'id' | 'createdAt'>) => Order | Promise<Order>;
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
  const { user, isAuthenticated, registerUser, addSavedAddress } = useAuthStore();

  const safeUserFullName = typeof user?.fullName === 'string' ? user.fullName.trim() : '';
  const [firstName, setFirstName] = useState(safeUserFullName ? safeUserFullName.split(' ')[0] : '');
  const [lastName, setLastName] = useState(safeUserFullName && safeUserFullName.split(' ').length > 1 ? safeUserFullName.split(' ').slice(1).join(' ') : '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Odisha');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Razorpay' | 'COD'>('Razorpay');

  // Saved Address selection state
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Account creation popup modal state when unauthenticated
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [regPassword, setRegPassword] = useState('');

  // Fallback / Direct Instant UPI Prepaid Modal State
  const [showUpiModal, setShowUpiModal] = useState(false);

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

  const handleCompletePrepaidOrder = async (paymentId: string, gatewayName: 'Razorpay' | 'UPI Direct' = 'Razorpay') => {
    try {
      const fullAddressStr = `${address}${landmark ? `, Near ${landmark}` : ''}`;
      const customerData = {
        fullName: `${firstName} ${lastName}`.trim(),
        phone,
        email: email || `${phone}@a1printstudio.com`,
        address: fullAddressStr,
        city,
        state,
        pincode,
      };

      // Auto-save address to logged-in user profile
      if (isAuthenticated && addSavedAddress && address && pincode) {
        const alreadyExists = user?.savedAddresses?.some(
          (a) => a.address === fullAddressStr && a.pincode === pincode
        );
        if (!alreadyExists) {
          addSavedAddress({
            type: 'Home',
            fullName: customerData.fullName,
            phone,
            address: fullAddressStr,
            city,
            state,
            pincode,
          });
        }
      }

      const order = await onPlaceOrder({
        customer: customerData,
        items,
        subtotal,
        discount: 0,
        shipping: 0,
        total: subtotal,
        paymentMethod: 'Razorpay',
        paymentStatus: 'Paid',
        orderStatus: 'Received',
        notes: `Verified Prepaid Payment ID: ${paymentId} (${gatewayName})`,
      });

      setIsSubmitting(false);
      setShowUpiModal(false);
      if (onOrderSuccess) {
        onOrderSuccess(order);
      } else {
        onNavigate('order-success');
      }
    } catch (err: any) {
      console.error('Prepaid order saving error:', err);
      setIsSubmitting(false);
      setErrorMsg('Payment verified, but order creation failed. Please contact support.');
    }
  };

  const executeFinalOrderPlacement = () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const fullAddressStr = `${address}${landmark ? `, Near ${landmark}` : ''}`;
    const customerData = {
      fullName: `${firstName} ${lastName}`.trim(),
      phone,
      email: email || `${phone}@a1printstudio.com`,
      address: fullAddressStr,
      city,
      state,
      pincode,
    };

    // Auto-save address to logged-in user profile
    if (isAuthenticated && addSavedAddress && address && pincode) {
      const alreadyExists = user?.savedAddresses?.some(
        (a) => a.address === fullAddressStr && a.pincode === pincode
      );
      if (!alreadyExists) {
        addSavedAddress({
          type: 'Home',
          fullName: customerData.fullName,
          phone,
          address: fullAddressStr,
          city,
          state,
          pincode,
        });
      }
    }

    if (paymentMethod === 'Razorpay') {
      // Launch Official Razorpay Standard Web Checkout Gateway
      launchRazorpayCheckout({
        amountInRupees: subtotal,
        orderTitle: activeItem?.product?.title || 'A1print Custom Photo Frame',
        description: `Order for ${customerData.fullName} (${activeItem?.selectedSize?.name || 'A4 Frame'})`,
        customer: {
          name: customerData.fullName,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
        },
        onSuccess: (razorpayResp) => {
          handleCompletePrepaidOrder(razorpayResp.razorpay_payment_id || `pay_${Date.now()}`, 'Razorpay');
        },
        onFailure: (errMsg) => {
          setIsSubmitting(false);
          setErrorMsg(errMsg || 'Payment failed. You can retry with Razorpay or select Cash on Delivery.');
        },
        onDismiss: () => {
          setIsSubmitting(false);
          setErrorMsg('Payment modal closed. You can retry payment anytime or select Cash on Delivery.');
        },
      });
    } else {
      // Cash on Delivery Flow
      setTimeout(async () => {
        try {
          const order = await onPlaceOrder({
            customer: customerData,
            items,
            subtotal,
            discount: 0,
            shipping: 0,
            total: subtotal,
            paymentMethod: 'COD',
            paymentStatus: 'Pending',
            orderStatus: 'Received',
          });

          setIsSubmitting(false);
          if (onOrderSuccess) {
            onOrderSuccess(order);
          } else {
            onNavigate('order-success');
          }
        } catch (err) {
          console.error('COD order submission error:', err);
          setIsSubmitting(false);
          setErrorMsg('Failed to process order. Please try again!');
        }
      }, 800);
    }
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center justify-between animate-fadeIn">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 font-bold hover:underline">Dismiss</button>
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

          {/* Saved Addresses Selector for Logged-In User */}
          {isAuthenticated && user && user.savedAddresses && user.savedAddresses.length > 0 && (
            <div className="space-y-3 p-4 bg-purple-50/70 border border-purple-200 rounded-2xl font-jost text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-[#160E4B] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#F82BA9]" /> Select Saved Delivery Address
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAddressId('new');
                    setAddress('');
                    setLandmark('');
                    setCity('');
                    setPincode('');
                  }}
                  className="text-[11px] font-extrabold text-[#F82BA9] hover:underline cursor-pointer"
                >
                  + Add New Address
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {user.savedAddresses.map((sa) => (
                  <label
                    key={sa.id}
                    className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                      selectedAddressId === sa.id ? 'border-[#F82BA9] bg-white shadow-xs' : 'border-gray-200 bg-white/70 hover:border-purple-300'
                    }`}
                    onClick={() => {
                      setSelectedAddressId(sa.id);
                      setAddress(sa.address || '');
                      setCity(sa.city || '');
                      setState(sa.state || 'Odisha');
                      setPincode(sa.pincode || '');
                      if (sa.fullName) {
                        const parts = sa.fullName.trim().split(' ');
                        setFirstName(parts[0] || '');
                        setLastName(parts.slice(1).join(' ') || '');
                      }
                      if (sa.phone) setPhone(sa.phone);
                    }}
                  >
                    <input
                      type="radio"
                      name="saved_address_choice"
                      checked={selectedAddressId === sa.id}
                      onChange={() => {}}
                      className="mt-0.5 accent-[#F82BA9]"
                    />
                    <div className="text-xs space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-gray-900">{sa.fullName || user.fullName}</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-md uppercase">
                          {sa.type || 'Saved Address'}
                        </span>
                      </div>
                      <p className="text-gray-600 font-medium">{sa.address}, {sa.city}, {sa.state} - {sa.pincode}</p>
                      <p className="text-gray-500 font-mono text-[11px]">📱 {sa.phone || user.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

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
              
              {/* Option 1: Prepaid (Razorpay Gateway) */}
              <label className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                paymentMethod === 'Razorpay' ? 'border-[#F82BA9] bg-pink-50/40' : 'border-gray-200 hover:border-purple-200'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'Razorpay'}
                    onChange={() => setPaymentMethod('Razorpay')}
                    className="accent-[#F82BA9]"
                  />
                  <div>
                    <span className="font-bold text-xs text-gray-900 block flex items-center gap-1.5">
                      Prepaid Online Payment (Razorpay) <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-extrabold text-[10px] rounded-full">Secure & Fast</span>
                    </span>
                    <span className="text-[11px] text-gray-500 block">UPI, Google Pay, PhonePe, Cards, NetBanking & Wallets</span>
                  </div>
                </div>
                <CreditCard className="w-5 h-5 text-purple-600" />
              </label>

              {/* Option 2: Cash on Delivery (COD) */}
              <label className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                paymentMethod === 'COD' ? 'border-[#F82BA9] bg-pink-50/40' : 'border-gray-200 hover:border-purple-200'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="accent-[#F82BA9]"
                  />
                  <div>
                    <span className="font-bold text-xs text-gray-900 block flex items-center gap-1.5">
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-[11px] text-gray-500 block">Pay cash directly to delivery partner upon order delivery</span>
                  </div>
                </div>
                <Truck className="w-5 h-5 text-emerald-600" />
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
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing Payment...
                </>
              ) : paymentMethod === 'COD' ? (
                'Place COD Order Now'
              ) : (
                'Pay Now with Razorpay'
              )}
            </button>
          </div>

          <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 text-center text-xs text-purple-900 space-y-1">
            <span className="font-bold flex items-center justify-center gap-1">
              <Lock className="w-3.5 h-3.5 text-purple-700" /> 100% Encrypted & Safe Razorpay Payment
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
                <UserPlus className="w-4 h-4" /> Create Account & Proceed to Payment
              </button>
            </form>

          </div>
        </div>
      )}

      {/* Instant Working UPI / QR Gateway Modal */}
      <InstantUPIGatewayModal
        isOpen={showUpiModal}
        onClose={() => setShowUpiModal(false)}
        amount={subtotal}
        customerName={`${firstName} ${lastName}`.trim()}
        customerPhone={phone}
        customerEmail={email}
        orderTitle={activeItem?.product?.title}
        onPaymentSuccess={(paymentId) => handleCompletePrepaidOrder(paymentId, 'UPI Direct')}
      />

    </div>
  );
};


