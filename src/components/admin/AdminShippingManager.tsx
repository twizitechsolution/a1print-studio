import React, { useState } from 'react';
import { ShippingRule } from '../../types/admin';
import { Truck, Plus, Trash2, MapPin, CheckCircle, ShieldCheck } from 'lucide-react';

export const AdminShippingManager: React.FC = () => {
  const [rules, setRules] = useState<ShippingRule[]>([
    {
      id: 's1',
      regionType: 'pan_india',
      regionName: 'Pan India Standard Express',
      shippingCharge: 0,
      freeShippingThreshold: 0,
      estimatedDays: '3-5 Days',
      courierPartner: 'BlueDart / Delhivery / XpressBees',
      active: true,
    },
    {
      id: 's2',
      regionType: 'city',
      regionName: 'Metro Cities Express (Mumbai, Delhi, Bangalore)',
      shippingCharge: 0,
      freeShippingThreshold: 499,
      estimatedDays: '2-3 Days',
      courierPartner: 'BlueDart Express',
      active: true,
    },
    {
      id: 's3',
      regionType: 'pincode',
      regionName: 'Remote / NE Pin Codes',
      shippingCharge: 99,
      freeShippingThreshold: 1499,
      estimatedDays: '5-7 Days',
      courierPartner: 'India Post Speed Post',
      active: true,
    },
  ]);

  const [regionName, setRegionName] = useState('');
  const [charge, setCharge] = useState<number>(0);
  const [courier, setCourier] = useState('Delhivery');

  const handleAddRule = () => {
    if (!regionName.trim()) return;
    const newRule: ShippingRule = {
      id: `s-${Date.now()}`,
      regionType: 'city',
      regionName,
      shippingCharge: charge,
      freeShippingThreshold: 699,
      estimatedDays: '3-4 Days',
      courierPartner: courier,
      active: true,
    };
    setRules([...rules, newRule]);
    setRegionName('');
  };

  const handleDelete = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6 font-jost">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-playfair text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" /> Shipping & Delivery Rules Manager
          </h3>
          <p className="text-xs text-gray-400">Manage delivery partners, shipping charges by pincode/city, and free shipping thresholds.</p>
        </div>
      </div>

      {/* Add New Rule Card */}
      <div className="p-5 bg-[#121829] rounded-2xl border border-[#262E4A] space-y-4 shadow-xl">
        <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" /> Add Shipping Zone Rule
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <input
              type="text"
              placeholder="Zone / City / Pincode Name (e.g. Hyderabad Local)"
              value={regionName}
              onChange={(e) => setRegionName(e.target.value)}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3.5 py-2 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-hidden"
            />
          </div>
          <div className="sm:col-span-3">
            <input
              type="number"
              placeholder="Shipping Charge (₹)"
              value={charge}
              onChange={(e) => setCharge(Number(e.target.value))}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3 py-2 rounded-xl text-xs text-white focus:outline-hidden"
            />
          </div>
          <div className="sm:col-span-2">
            <select
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3 py-2 rounded-xl text-xs text-white focus:outline-hidden"
            >
              <option value="Delhivery">Delhivery</option>
              <option value="BlueDart">BlueDart</option>
              <option value="XpressBees">XpressBees</option>
              <option value="DTDC">DTDC</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              onClick={handleAddRule}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Add Zone Rule
            </button>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="p-5 bg-[#121829] rounded-2xl border border-[#262E4A] shadow-xl space-y-3">
        <h4 className="font-bold text-sm text-white">Active Delivery Zones ({rules.length})</h4>
        <div className="divide-y divide-[#262E4A]">
          {rules.map((r) => (
            <div key={r.id} className="py-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-white text-xs">{r.regionName}</h5>
                  <span className="text-[10px] text-gray-400 font-mono">
                    Courier: {r.courierPartner} • SLA: {r.estimatedDays}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-extrabold text-emerald-400">
                  {r.shippingCharge === 0 ? 'FREE Shipping' : `₹${r.shippingCharge}`}
                </span>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
