import React, { useState } from 'react';
import { Settings, Tag, Truck, Sparkles, Plus, Trash2, CheckCircle2, Save } from 'lucide-react';

export const AdminStoreSettings: React.FC = () => {
  const [coupons, setCoupons] = useState([
    { id: 'c1', code: 'RAKSHA9', discount: '9% OFF', minOrder: 699, type: 'Prepaid' },
    { id: 'c2', code: 'WELCOME33', discount: '33% OFF', minOrder: 499, type: 'All Orders' },
  ]);

  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  
  const [freeShippingMin, setFreeShippingMin] = useState('699');
  const [codExtraCharge, setCodExtraCharge] = useState('0');
  
  const [announcementMsg, setAnnouncementMsg] = useState(
    '💵 Cash on Delivery Available • 🚚 Free Delivery Pan India • 🎁 33% OFF on Custom Photo Frames • 🛒 Shop Now & Save Big!'
  );
  const [savedMsg, setSavedMsg] = useState(false);

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newDiscount) return;
    setCoupons([...coupons, { id: `c-${Date.now()}`, code: newCode.toUpperCase(), discount: newDiscount, minOrder: 499, type: 'Promotional' }]);
    setNewCode('');
    setNewDiscount('');
  };

  const handleSaveSettings = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <div className="space-y-8 font-jost select-none">
      
      {/* Top Header */}
      <div className="flex items-center justify-between bg-[#121829] p-6 rounded-3xl border border-[#262E4A]">
        <div>
          <h2 className="font-playfair text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-purple-400" /> Store Configuration & Promo Manager
          </h2>
          <p className="text-xs text-gray-400 pt-1">
            Manage promo discount coupons, free shipping rules, and announcement ticker text.
          </p>
        </div>

        {savedMsg && (
          <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 font-extrabold text-xs rounded-xl border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Settings Saved!
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Promo Coupon Manager (7 Cols) */}
        <div className="lg:col-span-7 bg-[#121829] p-6 rounded-3xl border border-[#262E4A] space-y-6">
          <div className="flex items-center justify-between border-b border-[#262E4A] pb-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#F82BA9]" /> Active Promo Discount Coupons
            </h3>
          </div>

          {/* Add Coupon Form */}
          <form onSubmit={handleAddCoupon} className="p-4 bg-[#1A2035] rounded-2xl border border-[#262E4A] space-y-3 text-xs">
            <span className="font-bold text-gray-300 block">Create New Discount Coupon</span>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Coupon Code (e.g. FESTIVE10)"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="p-2.5 bg-[#121829] border border-gray-600 rounded-xl text-white font-mono uppercase"
              />
              <input
                type="text"
                placeholder="Discount (e.g. 10% OFF)"
                value={newDiscount}
                onChange={(e) => setNewDiscount(e.target.value)}
                className="p-2.5 bg-[#121829] border border-gray-600 rounded-xl text-white font-bold"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#F82BA9] text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Coupon
            </button>
          </form>

          {/* Coupons List */}
          <div className="space-y-2 text-xs">
            {coupons.map((c) => (
              <div key={c.id} className="p-3.5 bg-[#1A2035] rounded-xl border border-[#262E4A] flex items-center justify-between gap-3 font-bold">
                <div className="space-y-0.5">
                  <span className="text-pink-400 font-mono text-sm">{c.code}</span>
                  <span className="text-gray-400 block text-[11px]">Type: {c.type} • Min Order: ₹{c.minOrder}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 text-xs">
                    {c.discount}
                  </span>
                  <button
                    onClick={() => setCoupons(coupons.filter((cp) => cp.id !== c.id))}
                    className="text-rose-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Announcement Bar Editor (5 Cols) */}
        <div className="lg:col-span-5 bg-[#121829] p-6 rounded-3xl border border-[#262E4A] space-y-6">
          
          {/* Shipping Settings */}
          <div className="space-y-3">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-400" /> Shipping & COD Rules
            </h3>

            <div className="space-y-2 text-xs font-bold">
              <div>
                <span className="text-gray-400 block">Free Shipping Threshold (₹) :</span>
                <input
                  type="number"
                  value={freeShippingMin}
                  onChange={(e) => setFreeShippingMin(e.target.value)}
                  className="w-full p-2.5 bg-[#1A2035] border border-gray-600 rounded-xl text-white font-mono mt-1"
                />
              </div>

              <div>
                <span className="text-gray-400 block">Cash On Delivery Charge (₹) :</span>
                <input
                  type="number"
                  value={codExtraCharge}
                  onChange={(e) => setCodExtraCharge(e.target.value)}
                  className="w-full p-2.5 bg-[#1A2035] border border-gray-600 rounded-xl text-white font-mono mt-1"
                />
              </div>
            </div>
          </div>

          {/* Announcement Bar Message Editor */}
          <div className="space-y-3 pt-4 border-t border-[#262E4A]">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Header Announcement Marquee Text
            </h3>

            <textarea
              rows={3}
              value={announcementMsg}
              onChange={(e) => setAnnouncementMsg(e.target.value)}
              className="w-full p-3 bg-[#1A2035] border border-gray-600 rounded-xl text-xs text-white leading-relaxed focus:outline-hidden"
            />
          </div>

          <button
            onClick={handleSaveSettings}
            className="w-full py-3.5 bg-[#3B82F6] hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" /> Save Store Settings
          </button>

        </div>

      </div>

    </div>
  );
};
