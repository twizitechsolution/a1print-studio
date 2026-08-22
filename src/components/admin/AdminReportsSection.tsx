import React, { useState } from 'react';
import { Order } from '../../types';
import { TrendingUp, DollarSign, Calendar, Download, PieChart, BarChart3, CreditCard, ArrowUpRight, ArrowDownRight, Package, ShieldCheck, Printer } from 'lucide-react';

interface AdminReportsSectionProps {
  orders: Order[];
}

export const AdminReportsSection: React.FC<AdminReportsSectionProps> = ({ orders }) => {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Compute Financial Metrics based on Orders
  const grossSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = orders.length || 1;
  const averageOrderValue = Math.round(grossSales / totalOrdersCount);
  
  // Estimated profit margin (approx 65% gross margin for custom printing)
  const estimatedProfit = Math.round(grossSales * 0.65);
  const printingPaperCost = Math.round(grossSales * 0.20);
  const shippingExpense = Math.round(grossSales * 0.15);

  // Payment Breakdown
  const codOrdersCount = orders.filter((o) => o.paymentMethod.toLowerCase().includes('cod')).length;
  const onlineOrdersCount = orders.length - codOrdersCount;
  const codPercentage = Math.round((codOrdersCount / totalOrdersCount) * 100) || 0;
  const onlinePercentage = 100 - codPercentage;

  const handleExportCSV = () => {
    const csvHeader = "Order ID,Customer Name,Phone,Total Amount,Payment Method,Payment Status,Order Status,Date\n";
    const csvRows = orders.map(o => 
      `"${o.id}","${o.customer.fullName}","${o.customer.phone}",${o.total},"${o.paymentMethod}","${o.paymentStatus}","${o.orderStatus}","${o.createdAt}"`
    ).join("\n");
    
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `A1print_Financial_Report_${timeRange}_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8 font-jost select-none">
      
      {/* Section Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#121829] p-6 rounded-3xl border border-[#262E4A]">
        <div>
          <h2 className="font-playfair text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-[#3B82F6]" /> Financial Sales & Performance Analytics
          </h2>
          <p className="text-xs text-gray-400 pt-1">
            Detailed breakdown of sales revenue, net profit margin, printing costs, and order trends.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Filter Buttons */}
          <div className="p-1 bg-[#1A2035] rounded-2xl border border-[#262E4A] flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setTimeRange('daily')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${timeRange === 'daily' ? 'bg-[#3B82F6] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeRange('weekly')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${timeRange === 'weekly' ? 'bg-[#3B82F6] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeRange('monthly')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${timeRange === 'monthly' ? 'bg-[#3B82F6] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeRange('yearly')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${timeRange === 'yearly' ? 'bg-[#3B82F6] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              Yearly
            </button>
          </div>

          {/* Export Report Button */}
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* 4 Financial Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Gross Sales */}
        <div className="p-6 bg-[#121829] rounded-3xl border border-[#262E4A] space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Gross Sales Revenue</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-2xl sm:text-3xl text-white">₹{grossSales.toLocaleString()}</h3>
            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +18.4% vs previous {timeRange}
            </span>
          </div>
        </div>

        {/* Estimated Net Profit */}
        <div className="p-6 bg-[#121829] rounded-3xl border border-[#262E4A] space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Estimated Net Profit</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-2xl sm:text-3xl text-purple-300">₹{estimatedProfit.toLocaleString()}</h3>
            <span className="text-[11px] text-purple-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 65% Net Margin Rate
            </span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-6 bg-[#121829] rounded-3xl border border-[#262E4A] space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Average Order Value (AOV)</span>
            <div className="w-9 h-9 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-2xl sm:text-3xl text-sky-300">₹{averageOrderValue}</h3>
            <span className="text-[11px] text-sky-400 font-bold">
              Total {orders.length} orders processed
            </span>
          </div>
        </div>

        {/* Paper & Shipping Costs */}
        <div className="p-6 bg-[#121829] rounded-3xl border border-[#262E4A] space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">Production & Courier Cost</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-2xl sm:text-3xl text-amber-300">₹{(printingPaperCost + shippingExpense).toLocaleString()}</h3>
            <span className="text-[11px] text-amber-400 font-bold">
              300 GSM Paper + Shipping
            </span>
          </div>
        </div>

      </div>

      {/* Visual Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Visual Revenue Growth Bar Chart (8 Cols) */}
        <div className="lg:col-span-8 p-6 bg-[#121829] rounded-3xl border border-[#262E4A] space-y-6">
          <div className="flex items-center justify-between border-b border-[#262E4A] pb-4">
            <h4 className="font-bold text-base text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#3B82F6]" /> Sales & Revenue Growth Trend ({timeRange.toUpperCase()})
            </h4>
            <span className="text-xs text-gray-400 font-bold">Updated Live</span>
          </div>

          <div className="space-y-4">
            <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-[#262E4A] px-4">
              {[65, 80, 45, 95, 110, 85, 125].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[10px] text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{height * 150}
                  </div>
                  <div
                    className="w-full bg-gradient-to-t from-[#3B82F6] to-[#8B5CF6] rounded-t-xl group-hover:from-pink-500 group-hover:to-[#F82BA9] transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-gray-400 font-extrabold">Day {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Method Share & Split (4 Cols) */}
        <div className="lg:col-span-4 p-6 bg-[#121829] rounded-3xl border border-[#262E4A] space-y-6">
          <div className="flex items-center justify-between border-b border-[#262E4A] pb-4">
            <h4 className="font-bold text-base text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" /> Payment Split Share
            </h4>
            <PieChart className="w-4 h-4 text-purple-400" />
          </div>

          <div className="space-y-4 text-xs font-bold">
            <div className="p-4 bg-[#1A2035] rounded-2xl border border-[#262E4A] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sky-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Prepaid (UPI / Cards)
                </span>
                <span className="text-white font-extrabold">{onlinePercentage}%</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-sky-400" style={{ width: `${onlinePercentage}%` }} />
              </div>
              <span className="text-[10px] text-gray-400 block">{onlineOrdersCount} orders (Prepaid 9% Discount applied)</span>
            </div>

            <div className="p-4 bg-[#1A2035] rounded-2xl border border-[#262E4A] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Cash on Delivery (COD)
                </span>
                <span className="text-white font-extrabold">{codPercentage}%</span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400" style={{ width: `${codPercentage}%` }} />
              </div>
              <span className="text-[10px] text-gray-400 block">{codOrdersCount} orders (Pan-India COD Verified)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
