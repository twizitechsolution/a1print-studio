import React, { useState } from 'react';
import { Coupon } from '../../types/admin';
import { Tag, Plus, Trash2, CheckCircle, XCircle, Percent, DollarSign, Gift } from 'lucide-react';

export const AdminCouponManager: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([
    {
      id: 'c1',
      code: 'WELCOME10',
      type: 'percentage',
      discountValue: 10,
      minOrderValue: 499,
      maxDiscountAmount: 200,
      usageLimit: 500,
      timesUsed: 42,
      validFrom: '2026-08-01',
      validUntil: '2026-12-31',
      active: true,
    },
    {
      id: 'c2',
      code: 'FLAT100',
      type: 'flat',
      discountValue: 100,
      minOrderValue: 999,
      usageLimit: 200,
      timesUsed: 18,
      validFrom: '2026-08-15',
      validUntil: '2026-10-31',
      active: true,
    },
    {
      id: 'c3',
      code: 'FREESHIP',
      type: 'free_shipping',
      discountValue: 50,
      minOrderValue: 699,
      usageLimit: 1000,
      timesUsed: 124,
      validFrom: '2026-08-01',
      validUntil: '2026-12-31',
      active: true,
    },
  ]);

  const [code, setCode] = useState('');
  const [type, setType] = useState<Coupon['type']>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrder, setMinOrder] = useState<number>(499);

  const handleAddCoupon = () => {
    if (!code.trim()) return;
    const newCoupon: Coupon = {
      id: `c-${Date.now()}`,
      code: code.toUpperCase().trim(),
      type,
      discountValue,
      minOrderValue: minOrder,
      usageLimit: 500,
      timesUsed: 0,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: '2026-12-31',
      active: true,
    };
    setCoupons([...coupons, newCoupon]);
    setCode('');
  };

  const toggleActive = (id: string) => {
    setCoupons(
      coupons.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
  };

  const handleDelete = (id: string) => {
    setCoupons(coupons.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6 font-jost">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-playfair text-xl font-bold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-400" /> Coupons & Discount Manager
          </h3>
          <p className="text-xs text-gray-400">Create promotional discount codes, flat discounts, and free shipping rules.</p>
        </div>
      </div>

      {/* Add New Coupon Card */}
      <div className="p-5 bg-[#121829] rounded-2xl border border-[#262E4A] space-y-4 shadow-xl">
        <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" /> Create New Promo Code
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-3">
            <input
              type="text"
              placeholder="Coupon Code (e.g. FESTIVE20)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3.5 py-2 rounded-xl text-xs text-white uppercase font-mono placeholder-gray-500 focus:outline-hidden"
            />
          </div>
          <div className="sm:col-span-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3 py-2 rounded-xl text-xs text-white focus:outline-hidden"
            >
              <option value="percentage">Percentage Discount (%)</option>
              <option value="flat">Flat Amount Discount (₹)</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <input
              type="number"
              placeholder="Discount Value"
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3 py-2 rounded-xl text-xs text-white focus:outline-hidden"
            />
          </div>
          <div className="sm:col-span-2">
            <input
              type="number"
              placeholder="Min Order (₹)"
              value={minOrder}
              onChange={(e) => setMinOrder(Number(e.target.value))}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3 py-2 rounded-xl text-xs text-white focus:outline-hidden"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              onClick={handleAddCoupon}
              className="w-full py-2 bg-[#F82BA9] hover:bg-pink-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Save Coupon
            </button>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="p-5 bg-[#121829] rounded-2xl border border-[#262E4A] shadow-xl space-y-3">
        <h4 className="font-bold text-sm text-white">Active Store Coupons ({coupons.length})</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-jost">
            <thead className="bg-[#1A2035] text-gray-400 text-[10px] font-extrabold uppercase border-b border-[#262E4A]">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Type & Value</th>
                <th className="py-3 px-4">Min Order</th>
                <th className="py-3 px-4">Usage Stats</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262E4A] font-bold text-gray-200">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-[#1A2035]/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-extrabold text-white text-sm">
                    <span className="px-2.5 py-1 bg-pink-500/10 text-[#F82BA9] border border-pink-500/20 rounded-md">
                      {c.code}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {c.type === 'percentage'
                      ? `${c.discountValue}% OFF`
                      : c.type === 'flat'
                      ? `₹${c.discountValue} FLAT OFF`
                      : 'FREE SHIPPING'}
                  </td>
                  <td className="py-3 px-4 text-emerald-400">₹{c.minOrderValue}</td>
                  <td className="py-3 px-4 font-mono text-gray-400">
                    {c.timesUsed} / {c.usageLimit} uses
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleActive(c.id)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer border ${
                        c.active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}
                    >
                      {c.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
