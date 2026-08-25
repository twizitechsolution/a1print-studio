import React, { useState } from 'react';
import { Order } from '../../types';
import { BarChart3, Download, Calendar, Filter, FileSpreadsheet } from 'lucide-react';

interface AdminAdvancedReportsProps {
  orders: Order[];
}

export const AdminAdvancedReports: React.FC<AdminAdvancedReportsProps> = ({ orders }) => {
  const [reportType, setReportType] = useState<'sales' | 'orders' | 'customers' | 'frames'>('sales');

  const exportToCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'orders') {
      csvContent += 'Order ID,Customer Name,Phone,City,Total Amount,Payment Method,Status,Date\n';
      orders.forEach((o) => {
        csvContent += `"${o.id}","${o.customer?.fullName}","${o.customer?.phone}","${o.customer?.city}",${o.total},"${o.paymentMethod}","${o.orderStatus}","${o.createdAt}"\n`;
      });
    } else {
      csvContent += 'Date,Total Orders,Gross Revenue,Average Order Value\n';
      csvContent += `"2026-08-25",${orders.length},${orders.reduce((a, b) => a + b.total, 0)},${
        orders.length ? Math.round(orders.reduce((a, b) => a + b.total, 0) / orders.length) : 0
      }\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `A1PRINT-${reportType.toUpperCase()}-REPORT.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-jost">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-playfair text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" /> Advanced Business Reports & Data Export
          </h3>
          <p className="text-xs text-gray-400">Generate financial sales reports, order velocity logs, customer summaries, and export CSV spreadsheets.</p>
        </div>

        <button
          onClick={exportToCSV}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" /> Download CSV Report
        </button>
      </div>

      {/* Report Type Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#121829] rounded-2xl border border-[#262E4A]">
        {[
          { id: 'sales', label: 'Sales & Revenue Report' },
          { id: 'orders', label: 'Order Status Log' },
          { id: 'customers', label: 'Customer Directory Report' },
          { id: 'frames', label: 'Popular Frames Report' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setReportType(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              reportType === t.id
                ? 'bg-[#3B82F6] text-white shadow-md'
                : 'text-gray-400 hover:bg-[#1A2035] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="p-5 bg-[#121829] rounded-2xl border border-[#262E4A] shadow-xl space-y-3">
        <h4 className="font-bold text-sm text-white capitalize">{reportType} Breakdown ({orders.length} Entries)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-jost">
            <thead className="bg-[#1A2035] text-gray-400 text-[10px] font-extrabold uppercase border-b border-[#262E4A]">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Total Paid</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262E4A] font-bold text-gray-200">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-[#1A2035]/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-extrabold text-white">{o.id}</td>
                  <td className="py-3 px-4">{o.customer?.fullName}</td>
                  <td className="py-3 px-4 font-mono">{o.customer?.phone}</td>
                  <td className="py-3 px-4">{o.customer?.city}</td>
                  <td className="py-3 px-4 text-emerald-400 font-extrabold">₹{o.total}</td>
                  <td className="py-3 px-4">{o.paymentMethod}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {o.orderStatus || 'Received'}
                    </span>
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
