import React from 'react';
import { Order } from '../../types';
import { ShoppingCart, DollarSign, CreditCard, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AdminDarkStatsCardsProps {
  orders: Order[];
}

export const AdminDarkStatsCards: React.FC<AdminDarkStatsCardsProps> = ({ orders }) => {
  const totalIncome = orders.reduce((acc, o) => acc + o.total, 0);
  const totalOrders = orders.length > 0 ? orders.length : 34567;
  const pendingPrints = orders.filter((o) => o.orderStatus === 'Received' || o.orderStatus === 'Printing').length;
  const customersCount = orders.length > 0 ? orders.length : 34567;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-jost">
      
      {/* 1. New Orders Card matching reference image */}
      <div className="bg-[#121829] p-5 rounded-2xl border border-[#262E4A] shadow-xl text-white flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-bold text-gray-400 block">New Orders</span>
          <h3 className="font-extrabold text-2xl text-white">{totalOrders.toLocaleString()}</h3>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+2.00% (30 days)</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 text-[#8B5CF6] flex items-center justify-center shrink-0 shadow-lg">
          <ShoppingCart className="w-6 h-6" />
        </div>
      </div>

      {/* 2. Total Income Card matching reference image */}
      <div className="bg-[#121829] p-5 rounded-2xl border border-[#262E4A] shadow-xl text-white flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-bold text-gray-400 block">Total Income</span>
          <h3 className="font-extrabold text-2xl text-white">₹{totalIncome ? totalIncome.toLocaleString() : '74,567'}</h3>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+5.45% Increased</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg">
          <DollarSign className="w-6 h-6" />
        </div>
      </div>

      {/* 3. Total Expense / Pending Prints Card matching reference image */}
      <div className="bg-[#121829] p-5 rounded-2xl border border-[#262E4A] shadow-xl text-white flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-bold text-gray-400 block">Pending Print Queue</span>
          <h3 className="font-extrabold text-2xl text-white">{pendingPrints || '12'}</h3>
          <div className="flex items-center gap-1 text-[11px] font-bold text-rose-400">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>-2.00% Queue</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-[#3B82F6] flex items-center justify-center shrink-0 shadow-lg">
          <CreditCard className="w-6 h-6" />
        </div>
      </div>

      {/* 4. New User / Customers Card matching reference image */}
      <div className="bg-[#121829] p-5 rounded-2xl border border-[#262E4A] shadow-xl text-white flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-bold text-gray-400 block">New User</span>
          <h3 className="font-extrabold text-2xl text-white">{customersCount.toLocaleString()}</h3>
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+12.00% Growth</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-lg">
          <Users className="w-6 h-6" />
        </div>
      </div>

    </div>
  );
};
