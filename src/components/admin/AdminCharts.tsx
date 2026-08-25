import React, { useState } from 'react';
import { Order } from '../../types';
import {
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  PieChart,
  Award,
  Clock,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

interface AdminChartsProps {
  orders: Order[];
  onNavigateOrders?: (filterStatus?: string) => void;
}

export const AdminCharts: React.FC<AdminChartsProps> = ({
  orders,
  onNavigateOrders,
}) => {
  const [salesTimeframe, setSalesTimeframe] = useState<'daily' | 'monthly' | 'yearly'>('monthly');

  // Urgent Pending Orders (Received or Printing)
  const pendingOrders = orders.filter(
    (o) => !o.orderStatus || o.orderStatus === 'Received' || o.orderStatus === 'Printing'
  );

  // Status counts for Donut Chart
  const pendingCount = orders.filter((o) => !o.orderStatus || o.orderStatus === 'Received').length;
  const processingCount = orders.filter((o) => o.orderStatus === 'Printing').length;
  const shippedCount = orders.filter((o) => o.orderStatus === 'Shipped').length;
  const deliveredCount = orders.filter((o) => o.orderStatus === 'Delivered').length;
  const cancelledCount = orders.filter((o) => o.orderStatus === 'Cancelled').length;
  const totalCount = orders.length || 1;

  // Percentage calculations
  const pendingPct = Math.round((pendingCount / totalCount) * 100);
  const processingPct = Math.round((processingCount / totalCount) * 100);
  const shippedPct = Math.round((shippedCount / totalCount) * 100);
  const deliveredPct = Math.round((deliveredCount / totalCount) * 100);
  const cancelledPct = Math.round((cancelledCount / totalCount) * 100);

  // Top Selling Frames count aggregation
  const frameSalesMap: Record<string, { title: string; count: number; revenue: number; thumbnail?: string }> = {};

  orders.forEach((ord) => {
    ord.items?.forEach((item) => {
      const title = item.product?.title || 'Birthday Frame';
      const thumb = item.product?.thumbnail || '';
      const price = item.itemTotalPrice || 699;

      if (!frameSalesMap[title]) {
        frameSalesMap[title] = { title, count: 0, revenue: 0, thumbnail: thumb };
      }
      frameSalesMap[title].count += item.quantity || 1;
      frameSalesMap[title].revenue += price;
    });
  });

  const topSellingFrames = Object.values(frameSalesMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Recent 5 orders
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6 font-jost">
      
      {/* 1. Urgent Pending Orders Alert Banner */}
      {pendingOrders.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-amber-500/20 rounded-2xl border border-amber-500/40 text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/30 rounded-xl shrink-0 text-amber-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white">
                🚨 Urgent Attention: {pendingOrders.length} Pending Orders in Queue!
              </h4>
              <p className="text-xs text-amber-300/80 font-bold">
                Orders waiting to be printed and packaged. Click below to inspect print files and update status.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateOrders && onNavigateOrders('Received')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            Manage Print Queue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Charts Dual Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales Overview Graph (8 Cols) */}
        <div className="lg:col-span-8 bg-[#121829] p-6 rounded-2xl border border-[#262E4A] shadow-xl text-white space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">
                  Sales & Revenue Growth Overview
                </span>
              </div>
              <h3 className="font-playfair text-2xl font-extrabold text-white mt-1">
                {salesTimeframe === 'daily'
                  ? 'Daily Revenue Trajectory'
                  : salesTimeframe === 'monthly'
                  ? 'Monthly Revenue Trajectory'
                  : 'Yearly Revenue Trajectory'}
              </h3>
            </div>

            {/* Timeframe Selector Tabs */}
            <div className="flex items-center bg-[#1A2035] p-1 rounded-xl border border-[#262E4A] text-xs font-bold">
              <button
                onClick={() => setSalesTimeframe('daily')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  salesTimeframe === 'daily' ? 'bg-[#3B82F6] text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setSalesTimeframe('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  salesTimeframe === 'monthly' ? 'bg-[#3B82F6] text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSalesTimeframe('yearly')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  salesTimeframe === 'yearly' ? 'bg-[#3B82F6] text-white shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>

          {/* Smooth Bezier Line & Gradient SVG Area Graph */}
          <div className="w-full h-64 pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 180">
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              {[30, 70, 110, 150].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="500"
                  y2={y}
                  stroke="#262E4A"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Area Gradient Path */}
              <path
                d="M 0 160 Q 60 70 120 120 T 240 50 T 360 80 T 500 25 L 500 180 L 0 180 Z"
                fill="url(#revenueGrad)"
              />

              {/* Smooth Bezier Stroke Path */}
              <path
                d="M 0 160 Q 60 70 120 120 T 240 50 T 360 80 T 500 25"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Data Points */}
              <circle cx="120" cy="120" r="5" fill="#3B82F6" stroke="#ffffff" strokeWidth="2" />
              <circle cx="240" cy="50" r="5" fill="#3B82F6" stroke="#ffffff" strokeWidth="2" />
              <circle cx="360" cy="80" r="5" fill="#3B82F6" stroke="#ffffff" strokeWidth="2" />
              <circle cx="500" cy="25" r="5" fill="#8B5CF6" stroke="#ffffff" strokeWidth="2" />
            </svg>

            <div className="flex justify-between text-[10px] text-gray-400 font-semibold pt-2">
              {salesTimeframe === 'daily'
                ? ['01 Aug', '06 Aug', '11 Aug', '16 Aug', '21 Aug', '26 Aug', '31 Aug'].map((d) => (
                    <span key={d}>{d}</span>
                  ))
                : salesTimeframe === 'monthly'
                ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
                    <span key={m}>{m}</span>
                  ))
                : ['2023', '2024', '2025', '2026'].map((y) => <span key={y}>{y}</span>)}
            </div>
          </div>
        </div>

        {/* Order Status Donut Breakdown Chart (4 Cols) */}
        <div className="lg:col-span-4 bg-[#121829] p-6 rounded-2xl border border-[#262E4A] shadow-xl text-white space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-400" />
              <h3 className="font-extrabold text-sm text-white">Order Status Chart</h3>
            </div>
            <span className="text-[11px] text-gray-400 font-bold">{orders.length} Total Orders</span>
          </div>

          {/* Donut Chart Canvas Indicator */}
          <div className="flex items-center justify-center my-2 relative">
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" stroke="#1A2035" strokeWidth="12" fill="none" />
              <circle
                cx="50"
                cy="50"
                r="38"
                stroke="#F59E0B"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${pendingPct * 2.38} 238`}
              />
              <circle
                cx="50"
                cy="50"
                r="38"
                stroke="#3B82F6"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${processingPct * 2.38} 238`}
                strokeDashoffset={`-${pendingPct * 2.38}`}
              />
              <circle
                cx="50"
                cy="50"
                r="38"
                stroke="#10B981"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${deliveredPct * 2.38} 238`}
                strokeDashoffset={`-${(pendingPct + processingPct) * 2.38}`}
              />
            </svg>
            <div className="absolute text-center">
              <span className="font-playfair font-extrabold text-xl text-white block">{deliveredPct}%</span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase">Fulfilled</span>
            </div>
          </div>

          {/* Status Breakdown Legend */}
          <div className="space-y-2 text-xs font-bold pt-2 border-t border-[#262E4A]">
            <div className="flex items-center justify-between text-gray-300">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pending ({pendingCount})
              </span>
              <span>{pendingPct}%</span>
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Processing ({processingCount})
              </span>
              <span>{processingPct}%</span>
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Shipped ({shippedCount})
              </span>
              <span>{shippedPct}%</span>
            </div>
            <div className="flex items-center justify-between text-gray-300">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Delivered ({deliveredCount})
              </span>
              <span>{deliveredPct}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Top Selling Frames & Recent Orders Dual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Selling Frames Card (5 Cols) */}
        <div className="lg:col-span-5 bg-[#121829] p-6 rounded-2xl border border-[#262E4A] shadow-xl text-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="font-extrabold text-sm text-white">Top Selling Frames Leaderboard</h3>
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase">Best Sellers</span>
          </div>

          <div className="divide-y divide-[#262E4A]">
            {topSellingFrames.length > 0 ? (
              topSellingFrames.map((frame, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#1A2035] border border-[#262E4A] overflow-hidden shrink-0 flex items-center justify-center font-extrabold text-xs text-blue-400">
                      {frame.thumbnail ? (
                        <img src={frame.thumbnail} alt={frame.title} className="w-full h-full object-cover" />
                      ) : (
                        `#${idx + 1}`
                      )}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-bold text-white text-xs truncate">{frame.title}</h5>
                      <span className="text-[10px] text-emerald-400 font-bold block">₹{frame.revenue.toLocaleString()} revenue</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-xs font-mono font-extrabold shrink-0">
                    {frame.count} sold
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 font-bold text-center py-4">No frame sales recorded yet.</p>
            )}
          </div>
        </div>

        {/* Recent Orders Quick Action Table (7 Cols) */}
        <div className="lg:col-span-7 bg-[#121829] p-6 rounded-2xl border border-[#262E4A] shadow-xl text-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h3 className="font-extrabold text-sm text-white">Recent Customer Orders</h3>
            </div>
            <button
              onClick={() => onNavigateOrders && onNavigateOrders('All')}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
            >
              View All Orders ➔
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-jost">
              <thead className="bg-[#1A2035] text-gray-400 text-[10px] font-extrabold uppercase border-b border-[#262E4A]">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262E4A] font-bold text-gray-200">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#1A2035]/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-white font-extrabold">{ord.id}</td>
                    <td className="py-2.5 px-3">{ord.customer?.fullName || 'Customer'}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-extrabold">₹{ord.total}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {ord.orderStatus || 'Received'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
