import React from 'react';
import { Order } from '../../types';
import {
  ShoppingCart,
  DollarSign,
  Users,
  Clock,
  Printer,
  Truck,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

interface AdminDarkStatsCardsProps {
  orders: Order[];
  onSelectStatusFilter?: (status: string) => void;
}

export const AdminDarkStatsCards: React.FC<AdminDarkStatsCardsProps> = ({
  orders,
  onSelectStatusFilter,
}) => {
  // Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-08"

  const totalOrders = orders.length;
  const todayOrders = orders.filter((o) => (o.createdAt || '').startsWith(todayStr)).length;
  const pendingOrders = orders.filter((o) => !o.orderStatus || o.orderStatus === 'Received').length;
  const processingOrders = orders.filter((o) => o.orderStatus === 'Printing').length;
  const printedOrders = orders.filter((o) => o.orderStatus === 'Printing').length;
  const shippedOrders = orders.filter((o) => o.orderStatus === 'Shipped').length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === 'Delivered').length;
  const cancelledOrders = orders.filter((o) => o.orderStatus === 'Cancelled').length;

  // Unique customers
  const uniquePhones = new Set(orders.map((o) => o.customer?.phone || o.customer?.fullName));
  const totalCustomers = uniquePhones.size;

  // Sales totals
  const validOrders = orders.filter((o) => o.orderStatus !== 'Cancelled');
  const totalSales = validOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const todaySales = validOrders
    .filter((o) => (o.createdAt || '').startsWith(todayStr))
    .reduce((acc, o) => acc + (o.total || 0), 0);
  const monthSales = validOrders
    .filter((o) => (o.createdAt || '').startsWith(currentMonthStr))
    .reduce((acc, o) => acc + (o.total || 0), 0);

  const cardItems = [
    {
      label: 'Total Orders',
      value: totalOrders.toLocaleString(),
      subtext: '+18% vs last month',
      icon: ShoppingCart,
      color: 'from-blue-600 to-indigo-600',
      badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      onClick: () => onSelectStatusFilter && onSelectStatusFilter('All'),
    },
    {
      label: 'Today Orders',
      value: todayOrders.toLocaleString(),
      subtext: 'Placed today',
      icon: Calendar,
      color: 'from-indigo-600 to-purple-600',
      badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      onClick: () => onSelectStatusFilter && onSelectStatusFilter('Today'),
    },
    {
      label: 'Pending Orders',
      value: pendingOrders.toLocaleString(),
      subtext: 'Needs processing',
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      onClick: () => onSelectStatusFilter && onSelectStatusFilter('Received'),
    },
    {
      label: 'Processing Orders',
      value: processingOrders.toLocaleString(),
      subtext: 'In production queue',
      icon: Layers,
      color: 'from-sky-500 to-blue-500',
      badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      onClick: () => onSelectStatusFilter && onSelectStatusFilter('Printing'),
    },
    {
      label: 'Printed Orders',
      value: printedOrders.toLocaleString(),
      subtext: 'Ready for packing',
      icon: Printer,
      color: 'from-purple-500 to-pink-500',
      badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      onClick: () => onSelectStatusFilter && onSelectStatusFilter('Printing'),
    },
    {
      label: 'Shipped Orders',
      value: shippedOrders.toLocaleString(),
      subtext: 'In transit',
      icon: Truck,
      color: 'from-cyan-500 to-blue-600',
      badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      onClick: () => onSelectStatusFilter && onSelectStatusFilter('Shipped'),
    },
    {
      label: 'Delivered Orders',
      value: deliveredOrders.toLocaleString(),
      subtext: 'Successfully fulfilled',
      icon: CheckCircle,
      color: 'from-emerald-500 to-teal-600',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      onClick: () => onSelectStatusFilter && onSelectStatusFilter('Delivered'),
    },
    {
      label: 'Cancelled Orders',
      value: cancelledOrders.toLocaleString(),
      subtext: 'Refunded / Void',
      icon: XCircle,
      color: 'from-rose-500 to-red-600',
      badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      onClick: () => onSelectStatusFilter && onSelectStatusFilter('Cancelled'),
    },
    {
      label: 'Total Customers',
      value: totalCustomers.toLocaleString(),
      subtext: '+15% New leads',
      icon: Users,
      color: 'from-fuchsia-500 to-pink-600',
      badgeBg: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
    },
    {
      label: 'Total Revenue',
      value: `₹${totalSales.toLocaleString()}`,
      subtext: '+22% Overall growth',
      icon: DollarSign,
      color: 'from-emerald-600 to-green-600',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      label: "Today's Sales",
      value: `₹${todaySales.toLocaleString()}`,
      subtext: 'Revenue recorded today',
      icon: TrendingUp,
      color: 'from-amber-600 to-yellow-500',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      label: "This Month's Sales",
      value: `₹${monthSales.toLocaleString()}`,
      subtext: 'Current month total',
      icon: DollarSign,
      color: 'from-indigo-600 to-blue-600',
      badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
  ];

  return (
    <div className="space-y-4 font-jost">
      <div className="flex items-center justify-between">
        <h3 className="font-playfair text-lg font-bold text-white flex items-center gap-2">
          <span>📊</span> Key Performance Metrics & Status Summary
        </h3>
        <span className="text-xs text-gray-400 font-bold">12 Dashboard KPI Cards</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cardItems.map((card, idx) => {
          const IconComp = card.icon;

          return (
            <div
              key={idx}
              onClick={card.onClick}
              className={`p-5 bg-[#131B2E] rounded-2xl border border-[#1E293B] shadow-xl hover:border-purple-500/40 transition-all cursor-pointer group flex flex-col justify-between space-y-3 ${
                card.onClick ? 'hover:translate-y-[-2px]' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  {card.label}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${card.color} text-white flex items-center justify-center shadow-md shadow-black/40 group-hover:scale-110 transition-transform`}
                >
                  <IconComp className="w-4.5 h-4.5" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-mono font-black text-2xl text-white tracking-tight">
                  {card.value}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] font-bold">
                  <span className={`px-2.5 py-0.5 rounded-lg border ${card.badgeBg}`}>
                    {card.subtext}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
