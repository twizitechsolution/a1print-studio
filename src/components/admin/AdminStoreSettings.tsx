import React, { useState, useEffect } from 'react';
import { Settings, Tag, Truck, Sparkles, Plus, Trash2, CheckCircle2, Save, Share2, Globe } from 'lucide-react';
import { firebaseCloudDb } from '../../config/firebase';

export interface SocialSettings {
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
}

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
  
  // Social Media Profile Links State
  const [facebookUrl, setFacebookUrl] = useState<string>(() => {
    const saved = localStorage.getItem('a1print_social_settings');
    if (saved) { try { return JSON.parse(saved).facebookUrl || 'https://facebook.com'; } catch (e) {} }
    return 'https://facebook.com';
  });
  const [instagramUrl, setInstagramUrl] = useState<string>(() => {
    const saved = localStorage.getItem('a1print_social_settings');
    if (saved) { try { return JSON.parse(saved).instagramUrl || 'https://instagram.com'; } catch (e) {} }
    return 'https://instagram.com';
  });
  const [twitterUrl, setTwitterUrl] = useState<string>(() => {
    const saved = localStorage.getItem('a1print_social_settings');
    if (saved) { try { return JSON.parse(saved).twitterUrl || 'https://twitter.com'; } catch (e) {} }
    return 'https://twitter.com';
  });
  const [linkedinUrl, setLinkedinUrl] = useState<string>(() => {
    const saved = localStorage.getItem('a1print_social_settings');
    if (saved) { try { return JSON.parse(saved).linkedinUrl || 'https://linkedin.com'; } catch (e) {} }
    return 'https://linkedin.com';
  });

  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    // Load social settings from Firestore on mount
    const loadFromCloud = async () => {
      const docs = await firebaseCloudDb.getCollection('store_settings');
      const socialDoc = docs.find((d) => d.id === 'social');
      if (socialDoc) {
        if (socialDoc.facebookUrl) setFacebookUrl(socialDoc.facebookUrl);
        if (socialDoc.instagramUrl) setInstagramUrl(socialDoc.instagramUrl);
        if (socialDoc.twitterUrl) setTwitterUrl(socialDoc.twitterUrl);
        if (socialDoc.linkedinUrl) setLinkedinUrl(socialDoc.linkedinUrl);
      }
    };
    loadFromCloud();
  }, []);

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newDiscount) return;
    setCoupons([...coupons, { id: `c-${Date.now()}`, code: newCode.toUpperCase(), discount: newDiscount, minOrder: 499, type: 'Promotional' }]);
    setNewCode('');
    setNewDiscount('');
  };

  const handleSaveSettings = async () => {
    const socialPayload = { facebookUrl, instagramUrl, twitterUrl, linkedinUrl };
    localStorage.setItem('a1print_social_settings', JSON.stringify(socialPayload));
    await firebaseCloudDb.setDocument('store_settings', 'social', socialPayload);

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
            Manage promo discount coupons, free shipping rules, social media links, and announcement ticker text.
          </p>
        </div>

        {savedMsg && (
          <span className="px-4 py-2 bg-emerald-500/20 text-emerald-300 font-extrabold text-xs rounded-xl border border-emerald-500/30 flex items-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" /> Settings Saved!
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Promo Coupon Manager & Social Media Settings (7 Cols) */}
        <div className="lg:col-span-7 bg-[#121829] p-6 rounded-3xl border border-[#262E4A] space-y-6">
          
          {/* Social Media Link Manager */}
          <div className="space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2 border-b border-[#262E4A] pb-3">
              <Share2 className="w-4 h-4 text-purple-400" /> Storefront Social Media Handles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-300">Facebook URL :</label>
                <input
                  type="text"
                  placeholder="https://facebook.com/a1print"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  className="w-full p-2.5 bg-[#1A2035] border border-[#262E4A] rounded-xl text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">Instagram Profile URL :</label>
                <input
                  type="text"
                  placeholder="https://instagram.com/a1print"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="w-full p-2.5 bg-[#1A2035] border border-[#262E4A] rounded-xl text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">Twitter / X URL :</label>
                <input
                  type="text"
                  placeholder="https://twitter.com/a1print"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  className="w-full p-2.5 bg-[#1A2035] border border-[#262E4A] rounded-xl text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">LinkedIn Company URL :</label>
                <input
                  type="text"
                  placeholder="https://linkedin.com/company/a1print"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full p-2.5 bg-[#1A2035] border border-[#262E4A] rounded-xl text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[#262E4A] pt-4 space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#F82BA9]" /> Active Promo Discount Coupons
            </h3>

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
            <Save className="w-4 h-4" /> Save All Store Settings
          </button>

        </div>

      </div>

    </div>
  );
};
