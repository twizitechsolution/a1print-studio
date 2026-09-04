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

  // Filter active non-deleted orders
  const activeOrders = (orders || []).filter((o) => o && !o.isDeleted);

  // Urgent Pending Orders (Received or Printing)
  const pendingOrders = activeOrders.filter(
    (o) => !o.orderStatus || o.orderStatus === 'Received' || o.orderStatus === 'Printing'
  );

  // Status counts for Donut Chart
  const pendingCount = activeOrders.filter((o) => !o.orderStatus || o.orderStatus === 'Received').length;
  const processingCount = activeOrders.filter((o) => o.orderStatus === 'Printing').length;
  const shippedCount = activeOrders.filter((o) => o.orderStatus === 'Shipped').length;
  const deliveredCount = activeOrders.filter((o) => o.orderStatus === 'Delivered').length;
  const cancelledCount = activeOrders.filter((o) => o.orderStatus === 'Cancelled').length;
  const totalCount = activeOrders.length || 1;

  // Percentage calculations
  const pendingPct = Math.round((pendingCount / totalCount) * 100);
  const processingPct = Math.round((processingCount / totalCount) * 100);
  const shippedPct = Math.round((shippedCount / totalCount) * 100);
  const deliveredPct = Math.round((deliveredCount / totalCount) * 100);
  const cancelledPct = Math.round((cancelledCount / totalCount) * 100);

  // Top Selling Frames count aggregation (from active orders & real products only)
  const frameSalesMap: Record<string, { title: string; count: number; revenue: number; thumbnail?: string }> = {};

  activeOrders.forEach((ord) => {
    ord.items?.forEach((item) => {
      if (item && item.product && !item.product.isSampleData && item.product.title) {
        const title = item.product.title;
        const thumb = item.product.thumbnail || item.product.baseImageUrl || '';
        const price = item.itemTotalPrice || item.product.price || 0;

        if (!frameSalesMap[title]) {
          frameSalesMap[title] = { title, count: 0, revenue: 0, thumbnail: thumb };
        }
        frameSalesMap[title].count += item.quantity || 1;
        frameSalesMap[title].revenue += price;
      }
    });
  });

  const topSellingFrames = Object.values(frameSalesMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Recent 5 active non-deleted orders
  const recentOrders = activeOrders.slice(0, 5);

  return (
    <div className="space-y-6 font-sans">
      
      {/* 1. Urgent Pending Orders Alert Banner */}
      {pendingOrders.length > 0 && (
        <div className="p-4 dark:bg-amber-950/30 bg-amber-50 rounded-xl border dark:border-amber-800/40 border-amber-200 text-amber-600 dark:text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 dark:bg-amber-900/40 bg-amber-100 rounded-lg shrink-0 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm dark:text-zinc-100 text-slate-900">
                🚨 Urgent Attention: {pendingOrders.length} Pending Orders in Queue!
              </h4>
              <p className="text-xs dark:text-amber-400 text-amber-800 font-medium">
                Orders waiting to be printed and packaged. Click below to inspect print files and update status.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateOrders && onNavigateOrders('Received')}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            Manage Print Queue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Charts Dual Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales Overview Graph (8 Cols) */}
        <div className="lg:col-span-8 dark:bg-zinc-900/50 bg-white p-5 rounded-xl border dark:border-zinc-800 border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-xs dark:text-zinc-400 text-slate-500 font-medium uppercase tracking-wider block">
                  Sales & Revenue Growth Overview
                </span>
              </div>
              <h3 className="text-xl font-bold tracking-tight dark:text-zinc-100 text-slate-900 mt-0.5">
                {salesTimeframe === 'daily'
                  ? 'Daily Revenue Trajectory'
                  : salesTimeframe === 'monthly'
                  ? 'Monthly Revenue Trajectory'
                  : 'Yearly Revenue Trajectory'}
              </h3>
            </div>

            {/* Timeframe Selector Tabs */}
            <div className="flex items-center dark:bg-zinc-950 bg-slate-100 p-1 rounded-lg border dark:border-zinc-800 border-slate-200 text-xs font-medium">
              <button
                onClick={() => setSalesTimeframe('daily')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  salesTimeframe === 'daily' ? 'dark:bg-zinc-800 bg-white dark:text-zinc-100 text-slate-900 font-semibold shadow-xs' : 'dark:text-zinc-400 text-slate-600 hover:text-slate-900'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setSalesTimeframe('monthly')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  salesTimeframe === 'monthly' ? 'dark:bg-zinc-800 bg-white dark:text-zinc-100 text-slate-900 font-semibold shadow-xs' : 'dark:text-zinc-400 text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setSalesTimeframe('yearly')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  salesTimeframe === 'yearly' ? 'dark:bg-zinc-800 bg-white dark:text-zinc-100 text-slate-900 font-semibold shadow-xs' : 'dark:text-zinc-400 text-slate-600 hover:text-slate-900'
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
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
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
                  stroke="currentColor"
                  className="text-slate-200 dark:text-zinc-800"
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
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data Points */}
              <circle cx="120" cy="120" r="5" fill="#3B82F6" stroke="#ffffff" strokeWidth="2" />
              <circle cx="240" cy="50" r="5" fill="#3B82F6" stroke="#ffffff" strokeWidth="2" />
              <circle cx="360" cy="80" r="5" fill="#3B82F6" stroke="#ffffff" strokeWidth="2" />
              <circle cx="500" cy="25" r="5" fill="#8B5CF6" stroke="#ffffff" strokeWidth="2" />
            </svg>

            <div className="flex justify-between text-[10px] dark:text-zinc-500 text-slate-400 font-medium pt-2">
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
        <div className="lg:col-span-4 dark:bg-zinc-900/50 bg-white p-5 rounded-xl border dark:border-zinc-800 border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-500" />
              <h3 className="font-bold text-sm dark:text-zinc-100 text-slate-900">Order Status Breakdown</h3>
            </div>
            <span className="text-[11px] dark:text-zinc-400 text-slate-500 font-medium">{orders.length} Orders</span>
          </div>

          {/* Donut Chart Canvas Indicator */}
          <div className="flex items-center justify-center my-2 relative">
            <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" className="text-slate-100 dark:text-zinc-800" stroke="currentColor" strokeWidth="12" fill="none" />
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
              <span className="font-bold text-xl dark:text-zinc-100 text-slate-900 block">{deliveredPct}%</span>
              <span className="text-[10px] text-emerald-500 font-medium uppercase">Fulfilled</span>
            </div>
          </div>

          {/* Status Breakdown Legend */}
          <div className="space-y-2 text-xs font-medium pt-2 border-t dark:border-zinc-800 border-slate-200">
            <div className="flex items-center justify-between dark:text-zinc-300 text-slate-700">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pending ({pendingCount})
              </span>
              <span className="font-mono">{pendingPct}%</span>
            </div>
            <div className="flex items-center justify-between dark:text-zinc-300 text-slate-700">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Processing ({processingCount})
              </span>
              <span className="font-mono">{processingPct}%</span>
            </div>
            <div className="flex items-center justify-between dark:text-zinc-300 text-slate-700">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Shipped ({shippedCount})
              </span>
              <span className="font-mono">{shippedPct}%</span>
            </div>
            <div className="flex items-center justify-between dark:text-zinc-300 text-slate-700">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Delivered ({deliveredCount})
              </span>
              <span className="font-mono">{deliveredPct}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Top Selling Frames & Recent Orders Dual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Selling Frames Card (5 Cols) */}
        <div className="lg:col-span-5 dark:bg-zinc-900/50 bg-white p-5 rounded-xl border dark:border-zinc-800 border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm dark:text-zinc-100 text-slate-900">Top Selling Frames Leaderboard</h3>
            </div>
            <span className="text-[10px] dark:text-zinc-400 text-slate-500 font-medium uppercase">Best Sellers</span>
          </div>

          <div className="divide-y dark:divide-zinc-800/60 divide-slate-200">
            {topSellingFrames.length > 0 ? (
              topSellingFrames.map((frame, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md dark:bg-zinc-950 bg-slate-100 border dark:border-zinc-800 border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs text-blue-500">
                      {frame.thumbnail ? (
                        <img src={frame.thumbnail} alt={frame.title} className="w-full h-full object-cover" />
                      ) : (
                        `#${idx + 1}`
                      )}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-medium dark:text-zinc-100 text-slate-900 text-xs truncate">{frame.title}</h5>
                      <span className="text-[10px] text-emerald-500 font-mono block">₹{frame.revenue.toLocaleString()} revenue</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 dark:bg-zinc-950 bg-slate-100 dark:text-zinc-300 text-slate-700 border dark:border-zinc-800 border-slate-200 rounded-md text-xs font-mono font-medium shrink-0">
                    {frame.count} sold
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs dark:text-zinc-400 text-slate-500 font-medium text-center py-4">No frame sales recorded yet.</p>
            )}
          </div>
        </div>

        {/* Recent Orders Quick Action Table (7 Cols) */}
        <div className="lg:col-span-7 dark:bg-zinc-900/50 bg-white p-5 rounded-xl border dark:border-zinc-800 border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-sm dark:text-zinc-100 text-slate-900">Recent Customer Orders</h3>
            </div>
            <button
              onClick={() => onNavigateOrders && onNavigateOrders('All')}
              className="text-xs text-blue-500 hover:text-blue-600 font-medium cursor-pointer"
            >
              View All Orders ➔
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="dark:bg-zinc-900 bg-slate-100 dark:text-zinc-400 text-slate-600 text-[11px] font-medium uppercase border-b dark:border-zinc-800 border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-zinc-800/60 divide-slate-200 font-medium dark:text-zinc-200 text-slate-800">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="dark:hover:bg-zinc-900/60 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono dark:text-zinc-100 text-slate-900 font-bold">{ord.id}</td>
                    <td className="py-2.5 px-3">{ord.customer?.fullName || 'Customer'}</td>
                    <td className="py-2.5 px-3 text-emerald-500 font-bold">₹{ord.total}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border dark:bg-zinc-950 bg-slate-100 dark:border-zinc-800 border-slate-200">
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
