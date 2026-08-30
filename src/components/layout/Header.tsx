import React, { useState } from 'react';
import { ShoppingBag, Search, Menu, X, Phone, ShieldCheck, User, LogIn, ChevronDown, Package, MapPin, CreditCard, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onNavigate: (page: string, param?: string) => void;
  currentPage: string;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  onNavigate,
  currentPage,
}) => {
  const { user, isAuthenticated, openAuthModal, logoutUser } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About Us' },
    { id: 'catalog', label: 'Shop' },
    { id: 'contact', label: 'Contact Us' },
    { id: 'my-order', label: 'My Order 📦' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white font-jost shadow-xs border-b border-gray-100">
      
      {/* 1. Infinite Marquee Announcement Bar */}
      <div className="bg-[#160E4B] text-white text-xs py-2.5 px-4 overflow-hidden border-b border-pink-500/20 select-none">
        <div className="flex animate-marquee whitespace-nowrap gap-12 font-bold tracking-wide">
          <span>💵 Cash on Delivery Available</span>
          <span>🚚 Free Delivery Pan India</span>
          <span>🎁 33% OFF on Custom Photo Frames</span>
          <span>🛒 Shop Now & Save Big!</span>
          <span>⚡ Express Courier 3-5 Days</span>
          <span>💵 Cash on Delivery Available</span>
          <span>🚚 Free Delivery Pan India</span>
          <span>🎁 33% OFF on Custom Photo Frames</span>
          <span>🛒 Shop Now & Save Big!</span>
          <span>⚡ Express Courier 3-5 Days</span>
        </div>
      </div>

      {/* 2. Main Navigation Header (Expanded Width max-w-[1400px]) */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-6 select-none">
        
        {/* Logo: LovecraftbySE / A1print Studio Style */}
        <div 
          onClick={() => onNavigate('home')}
          className="cursor-pointer flex items-center gap-3 shrink-0"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-r from-[#F82BA9] to-[#D61B90] text-white font-black text-2xl flex items-center justify-center shadow-md">
            A1
          </div>
          <div className="flex flex-col">
            <span className="font-playfair font-black text-2xl sm:text-3xl tracking-tight text-[#160E4B] leading-none">
              A1<span className="text-[#F82BA9]">print</span>
            </span>
            <span className="text-[10px] tracking-widest uppercase text-gray-500 font-extrabold mt-0.5">
              A1print Studio
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links (LovecraftbySE Style) */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-10 text-base font-extrabold text-[#160E4B]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`transition-colors hover:text-[#F82BA9] cursor-pointer ${
                currentPage === item.id ? 'text-[#F82BA9] font-black border-b-2 border-[#F82BA9] pb-0.5' : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Search, Auth & Cart Actions */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          
          {/* Search Input Box */}
          <div className="relative hidden sm:block w-44 lg:w-56">
            <input
              type="text"
              placeholder="Search gifts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  onNavigate('catalog', searchQuery);
                }
              }}
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-100 border border-gray-200 rounded-full focus:outline-hidden focus:border-[#F82BA9] focus:bg-white transition-all font-semibold"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>

          {/* User Account / Auth Dropdown */}
          <div className="relative">
            {isAuthenticated && user ? (
              (() => {
                const displayName = (typeof user.fullName === 'string' && user.fullName.trim()) 
                  ? user.fullName.trim() 
                  : (user.email ? user.email.split('@')[0] : 'Customer');
                const initialChar = (displayName[0] || 'C').toUpperCase();
                const firstName = displayName.split(' ')[0] || 'Customer';

                return (
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#160E4B] rounded-full border border-purple-200 text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#F82BA9] text-white flex items-center justify-center text-[10px] font-black">
                      {initialChar}
                    </div>
                    <span className="max-w-[100px] truncate hidden sm:inline">{firstName}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                );
              })()
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-2 bg-[#160E4B] hover:bg-[#251877] text-white text-xs font-extrabold rounded-full transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </button>
            )}

            {/* Dropdown Menu when logged in */}
            {isUserDropdownOpen && isAuthenticated && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 text-xs font-bold font-jost animate-fadeIn">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-gray-900 font-extrabold truncate">{user?.fullName}</p>
                  <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
                </div>

                <button
                  onClick={() => {
                    onNavigate('my-order');
                    setIsUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-pink-50 hover:text-[#F82BA9] flex items-center gap-2"
                >
                  <Package className="w-4 h-4" /> My Orders History
                </button>

                <button
                  onClick={() => {
                    onNavigate('my-order');
                    setIsUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-pink-50 hover:text-[#F82BA9] flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" /> Saved Addresses
                </button>

                <button
                  onClick={() => {
                    onNavigate('my-order');
                    setIsUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-pink-50 hover:text-[#F82BA9] flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4" /> Payment History
                </button>

                <div className="border-t border-gray-100 my-1" />

                <button
                  onClick={() => {
                    logoutUser();
                    setIsUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>

          {/* Cart Button with Pink Circle Count Badge */}
          <button
            onClick={onOpenCart}
            className="relative p-2 text-gray-700 hover:text-[#F82BA9] transition-colors rounded-full hover:bg-pink-50 cursor-pointer"
            aria-label="Shopping Cart"
          >
            <div className="w-9 h-9 rounded-full bg-[#F82BA9] text-white flex items-center justify-center shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#160E4B] text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 rounded-xl hover:bg-gray-100 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-6 space-y-3 font-bold select-none">
          <div className="pt-2 pb-3">
            <input
              type="text"
              placeholder="Search custom frames..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  onNavigate('catalog', searchQuery);
                  setIsMobileMenuOpen(false);
                }
              }}
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-100 border border-gray-200 rounded-xl focus:outline-hidden focus:border-[#F82BA9]"
            />
          </div>

          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`block w-full text-left py-2.5 text-sm transition-colors border-b border-gray-100 ${
                currentPage === item.id ? 'text-[#F82BA9] font-extrabold' : 'text-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

    </header>
  );
};
