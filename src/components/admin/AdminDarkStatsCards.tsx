import React from 'react';
import { Order } from '../../types';
import {
  ShoppingCart,
  DollarSign,
  Users,
  Clock,
  Printer,
  Truck,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
  Layers,
  AlertTriangle,
  PackageCheck,
  CreditCard,
  RotateCcw,
  Navigation,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
  PackageX,
} from 'lucide-react';

interface AdminDarkStatsCardsProps {
  orders: Order[];
  onSelectStatusFilter?: (status: string) => void;
}

export const AdminDarkStatsCards: React.FC<AdminDarkStatsCardsProps> = ({
  orders,
  onSelectStatusFilter,
}) => {
  // Real-time Date Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-08"

  // Real-time Order Counts
  const totalOrders = orders.length;
  const todayOrders = orders.filter((o) => (o.createdAt || '').startsWith(todayStr)).length;
  const pendingOrders = orders.filter((o) => !o.orderStatus || o.orderStatus === 'Received').length;
  const processingOrders = orders.filter((o) => o.orderStatus === 'Printing').length;
  const printedOrders = orders.filter((o) => o.orderStatus === 'Printing' || o.orderStatus === 'Packed').length;
  const shippedOrders = orders.filter((o) => o.orderStatus === 'Shipped').length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === 'Delivered').length;
  const cancelledOrders = orders.filter((o) => o.orderStatus === 'Cancelled').length;

  // Real-time Section 1: Operational Action Desk Counts
  const printingPendingCount = orders.filter((o) => !o.orderStatus || o.orderStatus === 'Received').length;
  const designPendingCount = orders.filter((o) => o.items?.some((i) => !i.compiledFrameDataUrl && (!i.customPhotoValues || Object.keys(i.customPhotoValues).length === 0))).length;
  const packingPendingCount = orders.filter((o) => o.orderStatus === 'Printing').length;
  const shippingPendingCount = orders.filter((o) => o.orderStatus === 'Printing' || o.orderStatus === 'Packed').length;
  const paymentPendingCount = orders.filter((o) => o.paymentMethod === 'COD' && o.orderStatus !== 'Delivered').length;
  const reprintRequiredCount = orders.filter((o) => o.orderStatus === 'Reprint' || (o.notes || '').toLowerCase().includes('reprint')).length;

  // Real-time Section 2: Shipping Overview Logistics Velocity Counts
  const readyToShipCount = orders.filter((o) => o.orderStatus === 'Printing' || o.orderStatus === 'Packed').length;
  const shippedCount = orders.filter((o) => o.orderStatus === 'Shipped').length;
  const inTransitCount = orders.filter((o) => o.orderStatus === 'Shipped' && (o.trackingNumber || '').length > 0).length;
  const deliveredCount = orders.filter((o) => o.orderStatus === 'Delivered').length;
  const rtoCount = orders.filter((o) => o.orderStatus === 'RTO' || (o.notes || '').toLowerCase().includes('rto')).length;

  // Unique customers count
  const uniquePhones = new Set(orders.map((o) => o.customer?.phone || o.customer?.fullName).filter(Boolean));
  const totalCustomers = uniquePhones.size || 1;

  // Real-time Financial Sales Totals (excluding Cancelled orders)
  const validOrders = orders.filter((o) => o.orderStatus !== 'Cancelled');
  const totalSales = validOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const todaySales = validOrders
    .filter((o) => (o.createdAt || '').startsWith(todayStr))
    .reduce((acc, o) => acc + (o.total || 0), 0);
  const monthSales = validOrders
    .filter((o) => (o.createdAt || '').startsWith(currentMonthStr))
    .reduce((acc, o) => acc + (o.total || 0), 0);

  // Section 1: Operational Action Items (6 Cards)
  const operationalDeskItems = [
    {
      label: 'Printing Pending',
      value: printingPendingCount,
      subtext: 'Awaiting print file run',
      icon: Printer,
      color: 'from-amber-500 to-orange-600',
      badgeBg: 'dark:bg-amber-950/40 bg-amber-50 dark:text-amber-300 text-amber-800 dark:border-amber-800/40 border-amber-200',
      statusFilter: 'Received',
    },
    {
      label: 'Design Pending',
      value: designPendingCount,
      subtext: 'Photo/Text check needed',
      icon: FileSpreadsheet,
      color: 'from-purple-500 to-indigo-600',
      badgeBg: 'dark:bg-purple-950/40 bg-purple-50 dark:text-purple-300 text-purple-800 dark:border-purple-800/40 border-purple-200',
      statusFilter: 'Received',
    },
    {
      label: 'Packing Pending',
      value: packingPendingCount,
      subtext: 'Ready for 5-layer wrap',
      icon: PackageCheck,
      color: 'from-blue-500 to-cyan-600',
      badgeBg: 'dark:bg-blue-950/40 bg-blue-50 dark:text-blue-300 text-blue-800 dark:border-blue-800/40 border-blue-200',
      statusFilter: 'Printing',
    },
    {
      label: 'Shipping Pending',
      value: shippingPendingCount,
      subtext: 'Awaiting courier pickup',
      icon: Truck,
      color: 'from-sky-500 to-blue-600',
      badgeBg: 'dark:bg-sky-950/40 bg-sky-50 dark:text-sky-300 text-sky-800 dark:border-sky-800/40 border-sky-200',
      statusFilter: 'Printing',
    },
    {
      label: 'Payment Pending',
      value: paymentPendingCount,
      subtext: 'COD / Unpaid Verification',
      icon: CreditCard,
      color: 'from-pink-500 to-rose-600',
      badgeBg: 'dark:bg-pink-950/40 bg-pink-50 dark:text-pink-300 text-pink-800 dark:border-pink-800/40 border-pink-200',
      statusFilter: 'Received',
    },
    {
      label: 'Reprint Required',
      value: reprintRequiredCount,
      subtext: 'Damage / Quality re-run',
      icon: RotateCcw,
      color: 'from-red-500 to-rose-700',
      badgeBg: 'dark:bg-rose-950/40 bg-rose-50 dark:text-rose-300 text-rose-800 dark:border-rose-800/40 border-rose-200',
      statusFilter: 'Reprint',
    },
  ];

  // Section 2: Shipping Overview Items (5 Cards)
  const shippingOverviewItems = [
    {
      label: 'Ready to Ship',
      value: readyToShipCount,
      icon: PackageCheck,
      color: 'text-blue-500',
      bgColor: 'dark:bg-blue-950/30 bg-blue-50 dark:border-blue-800/30 border-blue-200',
      statusFilter: 'Printing',
    },
    {
      label: 'Shipped',
      value: shippedCount,
      icon: Truck,
      color: 'text-purple-500',
      bgColor: 'dark:bg-purple-950/30 bg-purple-50 dark:border-purple-800/30 border-purple-200',
      statusFilter: 'Shipped',
    },
    {
      label: 'In Transit',
      value: inTransitCount,
      icon: Navigation,
      color: 'text-sky-500',
      bgColor: 'dark:bg-sky-950/30 bg-sky-50 dark:border-sky-800/30 border-sky-200',
      statusFilter: 'Shipped',
    },
    {
      label: 'Delivered',
      value: deliveredCount,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'dark:bg-emerald-950/30 bg-emerald-50 dark:border-emerald-800/30 border-emerald-200',
      statusFilter: 'Delivered',
    },
    {
      label: 'RTO (Return)',
      value: rtoCount,
      icon: PackageX,
      color: 'text-rose-500',
      bgColor: 'dark:bg-rose-950/30 bg-rose-50 dark:border-rose-800/30 border-rose-200',
      statusFilter: 'RTO',
    },
  ];

  // Section 3: 12 Top Core Business Metrics Cards
  const core12Metrics = [
    {
      label: 'Total Orders',
      value: totalOrders.toLocaleString(),
      subtext: 'All-time orders',
      icon: ShoppingCart,
      color: 'text-blue-500',
      statusFilter: 'All',
    },
    {
      label: 'Today’s Orders',
      value: todayOrders.toLocaleString(),
      subtext: 'Received today',
      icon: Calendar,
      color: 'text-indigo-500',
      statusFilter: 'Today',
    },
    {
      label: 'Pending Orders',
      value: pendingOrders.toLocaleString(),
      subtext: 'Needs processing',
      icon: Clock,
      color: 'text-amber-500',
      statusFilter: 'Received',
    },
    {
      label: 'Processing Orders',
      value: processingOrders.toLocaleString(),
      subtext: 'In production queue',
      icon: Layers,
      color: 'text-sky-500',
      statusFilter: 'Printing',
    },
    {
      label: 'Printed Orders',
      value: printedOrders.toLocaleString(),
      subtext: 'Ready for packing',
      icon: Printer,
      color: 'text-purple-500',
      statusFilter: 'Printing',
    },
    {
      label: 'Shipped Orders',
      value: shippedOrders.toLocaleString(),
      subtext: 'In courier transit',
      icon: Truck,
      color: 'text-cyan-500',
      statusFilter: 'Shipped',
    },
    {
      label: 'Delivered Orders',
      value: deliveredOrders.toLocaleString(),
      subtext: 'Successfully fulfilled',
      icon: CheckCircle2,
      color: 'text-emerald-500',
      statusFilter: 'Delivered',
    },
    {
      label: 'Cancelled Orders',
      value: cancelledOrders.toLocaleString(),
      subtext: 'Cancelled or refunded',
      icon: XCircle,
      color: 'text-rose-500',
      statusFilter: 'Cancelled',
    },
    {
      label: 'Total Customers',
      value: totalCustomers.toLocaleString(),
      subtext: 'Registered database',
      icon: Users,
      color: 'text-pink-500',
      statusFilter: 'customers',
    },
    {
      label: 'Total Revenue',
      value: `₹${totalSales.toLocaleString()}`,
      subtext: 'Gross revenue',
      icon: DollarSign,
      color: 'text-emerald-500',
      statusFilter: 'reports',
    },
    {
      label: 'Today’s Sales',
      value: `₹${todaySales.toLocaleString()}`,
      subtext: 'Gross sales today',
      icon: TrendingUp,
      color: 'text-emerald-500',
      statusFilter: 'reports',
    },
    {
      label: 'This Month’s Sales',
      value: `₹${monthSales.toLocaleString()}`,
      subtext: 'Monthly sales total',
      icon: Calendar,
      color: 'text-emerald-500',
      statusFilter: 'reports',
    },
  ];

  return (
    <div className="space-y-8 font-sans">
      
      {/* Quick Action Shipping & Product ID Toolbar Banner */}
      <div className="p-4 bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-slate-900/80 border border-purple-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>📦 Order Bulk Selection & Shipping Export Hub</span>
            <span className="px-2 py-0.5 bg-purple-500/30 text-purple-200 font-mono text-[10px] rounded-full border border-purple-400/40">NEW</span>
          </h3>
          <p className="text-xs text-zinc-300 mt-0.5">
            Export all order details for logistics couriers in 1-click or select specific orders with checkboxes in the Orders desk.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              if (!orders || orders.length === 0) {
                alert('No orders available to export!');
                return;
              }
              const headers = [
                'Order ID',
                'Order Date',
                'Customer Name',
                'Mobile Number',
                'Email Address',
                'Delivery Address',
                'City',
                'State',
                'Pincode',
                'Ordered Product(s)',
                'Product ID(s)',
                'Selected Size(s)',
                'Selected Frame(s)',
                'Payment Method',
                'Payment Status',
                'Order Status',
                'Total Amount (INR)',
                'Admin Remarks',
              ];

              const sanitizeCell = (text: any) => {
                if (text === null || text === undefined) return '""';
                const str = String(text).replace(/"/g, '""');
                return `"${str}"`;
              };

              const rows = orders.map((ord) => {
                const cust = ord.customer || ({} as any);
                const dateStr = ord.createdAt ? new Date(ord.createdAt).toLocaleString('en-IN') : 'N/A';
                const productTitles = ord.items.map((i) => `${i.product?.title || 'Custom Frame'} (Qty: ${i.quantity || 1})`).join(' | ');
                const productIds = ord.items.map((i) => i.product?.productId || (i.product?.id ? `PRD-${i.product.id.slice(-4)}` : 'PRD-1001')).join(' | ');
                const sizes = ord.items.map((i) => i.selectedSize?.name || 'A4 Size').join(' | ');
                const frames = ord.items.map((i) => i.selectedFrame?.name || 'Black Wood').join(' | ');
                const fullAddress = `${cust.address || ''}${cust.address ? ', ' : ''}${cust.landmark || ''}`.trim();

                return [
                  sanitizeCell(ord.id),
                  sanitizeCell(dateStr),
                  sanitizeCell(cust.fullName || 'Customer'),
                  sanitizeCell(cust.phone || 'N/A'),
                  sanitizeCell(cust.email || 'N/A'),
                  sanitizeCell(fullAddress),
                  sanitizeCell(cust.city || ''),
                  sanitizeCell(cust.state || ''),
                  sanitizeCell(cust.pincode || ''),
                  sanitizeCell(productTitles),
                  sanitizeCell(productIds),
                  sanitizeCell(sizes),
                  sanitizeCell(frames),
                  sanitizeCell(ord.paymentMethod || 'Prepaid'),
                  sanitizeCell(ord.paymentStatus || 'Paid'),
                  sanitizeCell(ord.orderStatus || 'Received'),
                  sanitizeCell(ord.total || ord.subtotal || 0),
                  sanitizeCell(ord.adminRemark || ''),
                ].join(',');
              });

              const csvContent = '\uFEFF' + [headers.map(sanitizeCell).join(','), ...rows].join('\r\n');
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              const timestamp = new Date().toISOString().split('T')[0];
              link.href = url;
              link.setAttribute('download', `A1Print_Shipping_Orders_EXPORT_${timestamp}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" /> 📥 Export All Orders (Excel / CSV)
          </button>

          <button
            onClick={() => onSelectStatusFilter && onSelectStatusFilter('orders')}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> Select Orders & Checkboxes
          </button>

          <button
            onClick={() => onSelectStatusFilter && onSelectStatusFilter('catalog')}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" /> Frame Product IDs
          </button>
        </div>
      </div>

      {/* SECTION 1: 🚨 Operational Action Desk (Dashboard khulte hi sabse important pending kaam) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold dark:text-zinc-100 text-slate-900 tracking-tight">
              Operational Action Desk (Immediate Attention Required)
            </h3>
          </div>
          <span className="text-xs dark:text-zinc-400 text-slate-500 font-medium font-mono">Real-time Live Sync</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {operationalDeskItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => onSelectStatusFilter && onSelectStatusFilter(item.statusFilter)}
                className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs hover:shadow-md space-y-3 ${item.badgeBg}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono tracking-wide">{item.label}</span>
                  <div className="p-2 rounded-lg bg-white/40 dark:bg-black/20 text-current">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-2xl font-black font-mono tracking-tight">{item.value}</div>
                  <p className="text-[10px] opacity-80 font-medium">{item.subtext}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: 🚚 Shipping & Logistics Velocity Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-bold dark:text-zinc-100 text-slate-900 tracking-tight">
              Shipping & Logistics Velocity Overview
            </h3>
          </div>
          <span className="text-xs dark:text-zinc-400 text-slate-500 font-medium">Pan-India Dispatch Trajectory</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {shippingOverviewItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => onSelectStatusFilter && onSelectStatusFilter(item.statusFilter)}
                className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs hover:shadow-md space-y-2 ${item.bgColor}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold dark:text-zinc-300 text-slate-700">{item.label}</span>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="text-2xl font-bold font-mono dark:text-zinc-100 text-slate-900">{item.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: 📊 Top Core Metrics — 12 KPI Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold dark:text-zinc-100 text-slate-900 tracking-tight">
              Top Core Business Metrics (12 Real-Time KPI Cards)
            </h3>
          </div>
          <span className="text-xs dark:text-zinc-400 text-slate-500 font-medium">Updated Live</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {core12Metrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => onSelectStatusFilter && onSelectStatusFilter(item.statusFilter)}
                className="p-4 rounded-xl dark:bg-zinc-900/50 bg-white border dark:border-zinc-800 border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 dark:hover:border-zinc-700 hover:border-slate-300"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs dark:text-zinc-400 text-slate-500 font-medium">{item.label}</span>
                  <div className="p-2 rounded-lg dark:bg-zinc-950 bg-slate-100 border dark:border-zinc-800 border-slate-200">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-2xl font-bold font-mono tracking-tight dark:text-zinc-100 text-slate-900">
                    {item.value}
                  </div>
                  <p className="text-[11px] dark:text-zinc-500 text-slate-400 font-medium">{item.subtext}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
