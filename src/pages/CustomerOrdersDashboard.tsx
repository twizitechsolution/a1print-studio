import React, { useState } from 'react';
import { Order } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { LiveCustomizedFrameThumbnail } from '../components/customizer/LiveCustomizedFrameThumbnail';
import { Package, Truck, CheckCircle2, ShoppingBag, ArrowRight, Clock, MapPin, CreditCard, User, LogOut, Plus, Trash2, ShieldCheck, Download, MessageCircle, FileText, Settings } from 'lucide-react';

interface CustomerOrdersDashboardProps {
  orders: Order[];
  onNavigate: (page: string) => void;
}

export const CustomerOrdersDashboard: React.FC<CustomerOrdersDashboardProps> = ({
  orders,
  onNavigate,
}) => {
  const { user, isAuthenticated, logoutUser, openAuthModal, addSavedAddress, deleteSavedAddress, setDefaultAddress, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'payments' | 'profile'>('orders');

  // Address Form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrType, setAddrType] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [addrFullName, setAddrFullName] = useState(user?.fullName || '');
  const [addrPhone, setAddrPhone] = useState(user?.phone || '');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPincode, setAddrPincode] = useState('');

  // Profile Form state
  const [profileName, setProfileName] = useState(user?.fullName || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileSaved, setProfileSaved] = useState(false);

  const statusBadgeColors: Record<string, string> = {
    Received: 'bg-amber-50 text-amber-700 border-amber-200',
    Printing: 'bg-blue-50 text-blue-700 border-blue-200',
    Shipped: 'bg-purple-50 text-purple-700 border-purple-200',
    Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const handleAddAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrFullName || !addrPhone || !addrStreet || !addrCity || !addrPincode) return;

    addSavedAddress({
      type: addrType,
      fullName: addrFullName,
      phone: addrPhone,
      address: addrStreet,
      city: addrCity,
      state: addrState || 'Odisha',
      pincode: addrPincode,
      isDefault: (user?.savedAddresses?.length || 0) === 0,
    });

    setShowAddressForm(false);
    setAddrStreet('');
    setAddrCity('');
    setAddrPincode('');
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profileName, profilePhone);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-6 font-jost select-none">
        <div className="p-8 sm:p-12 bg-white rounded-3xl border border-gray-200 shadow-xl space-y-5">
          <div className="w-16 h-16 bg-pink-100 text-[#F82BA9] rounded-full flex items-center justify-center mx-auto">
            <User className="w-8 h-8" />
          </div>
          <h2 className="font-playfair text-3xl font-extrabold text-[#160E4B]">Sign In to View Customer Portal</h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            Please log in or create an account to view your live customized frame orders, delivery progress, and saved shipping addresses.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => openAuthModal('login')}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#160E4B] hover:bg-[#251877] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              Sign In to Account
            </button>
            <button
              onClick={() => openAuthModal('register')}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              Create New Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter orders specifically for the currently logged in customer profile!
  const customerOrders = orders.filter((ord) => {
    if (!user) return false;
    const uPhone = (user.phone || '').trim();
    const uEmail = (user.email || '').trim().toLowerCase();
    const oPhone = (ord.customer?.phone || '').trim();
    const oEmail = (ord.customer?.email || '').trim().toLowerCase();

    if (uPhone && oPhone && uPhone === oPhone) return true;
    if (uEmail && oEmail && uEmail === oEmail) return true;
    if (user.fullName && ord.customer?.fullName && user.fullName.toLowerCase() === ord.customer.fullName.toLowerCase()) return true;

    return false;
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-jost select-none">
      
      {/* Portal Top Header Banner */}
      <div className="bg-[#160E4B] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] bg-pink-500/20 text-pink-300 font-extrabold px-3 py-0.5 rounded-full border border-pink-400/30 uppercase tracking-wider">
              Customer Account Portal
            </span>
            <span className="text-xs text-purple-200">Member since {new Date(user.createdAt).getFullYear()}</span>
          </div>
          <h1 className="font-playfair text-3xl sm:text-4xl font-extrabold">Welcome back, {user.fullName}! 👋</h1>
          <p className="text-xs text-purple-200 pt-1">
            📱 Phone: {user.phone} • ✉️ Email: {user.email}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('catalog')}
            className="px-5 py-3 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" /> Order New Frame
          </button>

          <button
            onClick={logoutUser}
            className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      {/* Multi-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1 overflow-x-auto text-xs sm:text-sm font-extrabold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-3 rounded-t-2xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-white border-t-2 border-[#F82BA9] text-[#F82BA9] shadow-2xs font-black'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Package className="w-4 h-4" /> Order History ({customerOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`px-5 py-3 rounded-t-2xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'addresses'
              ? 'bg-white border-t-2 border-[#F82BA9] text-[#F82BA9] shadow-2xs font-black'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <MapPin className="w-4 h-4" /> Saved Addresses ({user.savedAddresses.length})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-5 py-3 rounded-t-2xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-white border-t-2 border-[#F82BA9] text-[#F82BA9] shadow-2xs font-black'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Payment History
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-3 rounded-t-2xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-white border-t-2 border-[#F82BA9] text-[#F82BA9] shadow-2xs font-black'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4" /> Account Settings
        </button>
      </div>

      {/* TAB 1: ORDER HISTORY & LIVE TRACKING QUEUE */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {customerOrders.length === 0 ? (
            <div className="p-12 bg-white rounded-3xl border border-gray-200 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 bg-pink-50 text-[#F82BA9] rounded-full flex items-center justify-center mx-auto">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="font-playfair text-xl font-bold text-[#160E4B]">No Customer Orders Found</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">You haven&apos;t placed any custom photo frame orders yet. Personalize your favorite memories today!</p>
              <button
                onClick={() => onNavigate('catalog')}
                className="px-6 py-3 bg-[#F82BA9] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Explore Frame Catalog
              </button>
            </div>
          ) : (
            customerOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 space-y-6">
                
                {/* Order Top Bar Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-sm text-[#160E4B] font-mono">Order ID: {order.id}</span>
                      <span className={`px-3 py-1 text-xs font-extrabold rounded-full border flex items-center gap-1 ${statusBadgeColors[order.orderStatus] || 'bg-gray-50 text-gray-700'}`}>
                        <Clock className="w-3 h-3" /> Status: {order.orderStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">Placed on: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-gray-400 font-bold block">Total Amount</span>
                    <span className="font-extrabold text-base text-[#F82BA9]">₹{order.total}.00</span>
                  </div>
                </div>

                {/* Live Delivery Progress Tracker Bar */}
                <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-3">
                  <span className="text-xs font-extrabold text-[#160E4B] block uppercase tracking-wider">Live Printing & Dispatch Progress</span>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-extrabold text-gray-600">
                    <div className="space-y-1">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-xs">✓</div>
                      <span>Order Placed</span>
                    </div>
                    <div className="space-y-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs ${order.orderStatus !== 'Received' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white animate-pulse'}`}>
                        {order.orderStatus !== 'Received' ? '✓' : '2'}
                      </div>
                      <span>Archival Printing</span>
                    </div>
                    <div className="space-y-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs ${order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered' ? '✓' : '3'}
                      </div>
                      <span>Courier Dispatched</span>
                    </div>
                    <div className="space-y-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs ${order.orderStatus === 'Delivered' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {order.orderStatus === 'Delivered' ? '✓' : '4'}
                      </div>
                      <span>Delivered</span>
                    </div>
                  </div>
                </div>

                {/* Order Items List */}
                <div className="space-y-4">
                  {order.items.map((item, idx) => {
                    const textEntries = Object.entries(item.customTextValues || {}).filter(
                      ([k, v]) => !k.startsWith('photo') && v && typeof v === 'string' && !v.startsWith('data:image')
                    );

                    return (
                      <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-24 shrink-0">
                            <LiveCustomizedFrameThumbnail item={item} fontScale={0.22} />
                          </div>

                          <div className="space-y-1 text-xs">
                            <h4 className="font-bold text-sm text-[#160E4B]">{item.product.title}</h4>
                            <p className="text-[#F82BA9] font-bold">Size: {item.selectedSize.name}</p>
                            <p className="text-gray-500">Frame Style: {item.selectedFrame.name}</p>
                            
                            {textEntries.length > 0 && (
                              <div className="p-2 bg-white rounded-lg text-[10px] space-y-0.5 mt-2 font-mono text-gray-700 border border-gray-200">
                                {textEntries.map(([k, v]) => (
                                  <div key={k}><span className="capitalize">{k}</span>: <strong>{v}</strong></div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-right space-y-1">
                          <span className="font-extrabold text-sm text-[#160E4B]">₹{item.itemTotalPrice}</span>
                          <span className="text-[10px] text-emerald-600 font-bold block bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Payment: {order.paymentMethod} ({order.paymentStatus})
                          </span>
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Delivery Address & Actions */}
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="font-bold text-[#160E4B] block">Delivery Shipping Address:</span>
                    <p>{order.customer.fullName} ({order.customer.phone})</p>
                    <p>{order.customer.address}, {order.customer.city}, {order.customer.state} - {order.customer.pincode}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`https://wa.me/919583626786?text=Hi%20A1print%20Studio,%20I%20need%20help%20with%20my%20Order%20${order.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Track on WhatsApp
                    </a>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: SAVED SHIPPING ADDRESSES */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-playfair text-xl font-bold text-[#160E4B]">Saved Shipping Addresses</h3>
            <button
              onClick={() => setShowAddressForm(true)}
              className="px-4 py-2 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Address
            </button>
          </div>

          {/* Add Address Form Modal */}
          {showAddressForm && (
            <form onSubmit={handleAddAddressSubmit} className="p-6 bg-white rounded-3xl border border-pink-200 shadow-md space-y-4 font-jost text-xs">
              <h4 className="font-bold text-sm text-[#160E4B]">Enter Shipping Address Details</h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setAddrType('Home')}
                  className={`py-2 rounded-xl font-bold cursor-pointer border ${addrType === 'Home' ? 'bg-[#160E4B] text-white border-[#160E4B]' : 'bg-gray-50 text-gray-700'}`}
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => setAddrType('Work')}
                  className={`py-2 rounded-xl font-bold cursor-pointer border ${addrType === 'Work' ? 'bg-[#160E4B] text-white border-[#160E4B]' : 'bg-gray-50 text-gray-700'}`}
                >
                  Work / Office
                </button>
                <button
                  type="button"
                  onClick={() => setAddrType('Other')}
                  className={`py-2 rounded-xl font-bold cursor-pointer border ${addrType === 'Other' ? 'bg-[#160E4B] text-white border-[#160E4B]' : 'bg-gray-50 text-gray-700'}`}
                >
                  Other
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={addrFullName}
                  onChange={(e) => setAddrFullName(e.target.value)}
                  className="p-3 bg-gray-50 border border-gray-300 rounded-xl"
                  required
                />
                <input
                  type="tel"
                  placeholder="Mobile Phone Number"
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  className="p-3 bg-gray-50 border border-gray-300 rounded-xl"
                  required
                />
              </div>

              <input
                type="text"
                placeholder="Street Address, House No, Landmark"
                value={addrStreet}
                onChange={(e) => setAddrStreet(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  className="p-3 bg-gray-50 border border-gray-300 rounded-xl"
                  required
                />
                <input
                  type="text"
                  placeholder="State"
                  value={addrState}
                  onChange={(e) => setAddrState(e.target.value)}
                  className="p-3 bg-gray-50 border border-gray-300 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Pincode (6 digits)"
                  value={addrPincode}
                  onChange={(e) => setAddrPincode(e.target.value)}
                  className="p-3 bg-gray-50 border border-gray-300 rounded-xl"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#160E4B] text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  Save Address
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="px-4 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Saved Address Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {user.savedAddresses.map((addr) => (
              <div key={addr.id} className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-purple-50 text-[#3C187B] text-xs font-extrabold rounded-full border border-purple-200">
                    {addr.type} Address
                  </span>
                  {addr.isDefault && (
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                      Default Shipping Address
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-700 space-y-0.5">
                  <h4 className="font-extrabold text-sm text-[#160E4B]">{addr.fullName}</h4>
                  <p>📞 {addr.phone}</p>
                  <p>{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                  {!addr.isDefault && (
                    <button
                      onClick={() => setDefaultAddress(addr.id)}
                      className="text-pink-600 font-bold hover:underline cursor-pointer"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => deleteSavedAddress(addr.id)}
                    className="text-red-500 font-bold hover:text-red-700 flex items-center gap-1 cursor-pointer ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT HISTORY & TRANSACTIONS */}
      {activeTab === 'payments' && (
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <h3 className="font-playfair text-xl font-bold text-[#160E4B]">Payment History & Transactions</h3>

          {orders.length === 0 ? (
            <p className="text-xs text-gray-500">No payment transaction records found.</p>
          ) : (
            <div className="space-y-3 text-xs">
              {orders.map((ord) => (
                <div key={ord.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-extrabold text-[#160E4B] font-mono">Order {ord.id}</span>
                    <p className="text-gray-500">Method: {ord.paymentMethod} • Date: {new Date(ord.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-sm text-[#F82BA9]">₹{ord.total}.00</span>
                    <span className="text-[10px] text-emerald-600 font-bold block bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {ord.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PROFILE & SECURITY SETTINGS */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-4 max-w-lg font-jost text-xs">
          <h3 className="font-playfair text-xl font-bold text-[#160E4B]">Account Profile Settings</h3>

          {profileSaved && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold border border-emerald-200">
              Profile updated successfully!
            </div>
          )}

          <div className="space-y-1">
            <label className="font-bold text-gray-800">Full Name :</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-800">Mobile Phone Number :</label>
            <input
              type="tel"
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-gray-800">Email Address (Read-only) :</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-500 font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#160E4B] hover:bg-[#251877] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
          >
            Save Profile Changes
          </button>
        </form>
      )}

    </div>
  );
};
