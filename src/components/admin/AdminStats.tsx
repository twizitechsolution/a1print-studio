import React from 'react';
import { Order } from '../../types';
import { DollarSign, Package, Printer, Truck, CheckCircle2 } from 'lucide-react';

interface AdminStatsProps {
  orders: Order[];
}

export const AdminStats: React.FC<AdminStatsProps> = ({ orders }) => {
  const activeOrders = (orders || []).filter((o) => o && !o.isDeleted);
  const totalRevenue = activeOrders.reduce((acc, o) => acc + o.total, 0);
  const totalOrders = activeOrders.length;
  const pendingPrints = activeOrders.filter((o) => o.orderStatus === 'Received' || o.orderStatus === 'Printing').length;
  const shippedOrders = activeOrders.filter((o) => o.orderStatus === 'Shipped' || o.orderStatus === 'Delivered').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-jost">
      
      {/* 1. Total Sales Revenue */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <DollarSign className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-bold text-gray-500 block uppercase">Total Revenue</span>
          <span className="font-extrabold text-2xl text-[#160E4B]">₹{totalRevenue}</span>
        </div>
      </div>

      {/* 2. Total Orders Count */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#3C187B] flex items-center justify-center shrink-0">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-bold text-gray-500 block uppercase">Total Orders</span>
          <span className="font-extrabold text-2xl text-[#160E4B]">{totalOrders}</span>
        </div>
      </div>

      {/* 3. Pending Print Queue */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-pink-100 text-[#F82BA9] flex items-center justify-center shrink-0">
          <Printer className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-bold text-gray-500 block uppercase">Pending Print Queue</span>
          <span className="font-extrabold text-2xl text-[#F82BA9]">{pendingPrints}</span>
        </div>
      </div>

      {/* 4. Shipped Orders */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
          <Truck className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-bold text-gray-500 block uppercase">Shipped & Delivered</span>
          <span className="font-extrabold text-2xl text-[#160E4B]">{shippedOrders}</span>
        </div>
      </div>

    </div>
  );
};
