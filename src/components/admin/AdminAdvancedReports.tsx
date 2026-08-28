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
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight dark:text-zinc-100 text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" /> Advanced Business Reports & Data Export
          </h3>
          <p className="text-xs dark:text-zinc-400 text-slate-500 mt-0.5">Generate financial sales reports, order velocity logs, customer summaries, and export CSV spreadsheets.</p>
        </div>

        <button
          onClick={exportToCSV}
          className="px-3.5 py-2 dark:bg-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer shrink-0 shadow-xs"
        >
          <FileSpreadsheet className="w-4 h-4" /> Download CSV Report
        </button>
      </div>

      {/* Report Type Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 dark:bg-zinc-900/60 bg-white rounded-xl border dark:border-zinc-800 border-slate-200 shadow-xs">
        {[
          { id: 'sales', label: 'Sales & Revenue Report' },
          { id: 'orders', label: 'Order Status Log' },
          { id: 'customers', label: 'Customer Directory Report' },
          { id: 'frames', label: 'Popular Frames Report' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setReportType(t.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              reportType === t.id
                ? 'dark:bg-zinc-100 bg-slate-900 dark:text-zinc-950 text-white font-semibold shadow-xs'
                : 'dark:text-zinc-400 text-slate-600 dark:hover:bg-zinc-800 hover:bg-slate-100 dark:hover:text-zinc-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="p-5 dark:bg-zinc-900/40 bg-white rounded-xl border dark:border-zinc-800 border-slate-200 shadow-xs space-y-3">
        <h4 className="font-semibold text-sm dark:text-zinc-100 text-slate-900 capitalize">{reportType} Breakdown ({orders.length} Entries)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="dark:bg-zinc-900 bg-slate-100 dark:text-zinc-400 text-slate-600 text-[11px] font-medium uppercase tracking-wider border-b dark:border-zinc-800 border-slate-200">
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
            <tbody className="divide-y dark:divide-zinc-800/60 divide-slate-200 font-medium dark:text-zinc-200 text-slate-800">
              {orders.map((o) => (
                <tr key={o.id} className="dark:hover:bg-zinc-900/60 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold dark:text-zinc-100 text-slate-900">{o.id}</td>
                  <td className="py-3 px-4">{o.customer?.fullName}</td>
                  <td className="py-3 px-4 font-mono">{o.customer?.phone}</td>
                  <td className="py-3 px-4">{o.customer?.city}</td>
                  <td className="py-3 px-4 text-emerald-500 font-bold">₹{o.total}</td>
                  <td className="py-3 px-4">{o.paymentMethod}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium border dark:bg-zinc-950 bg-slate-100 dark:border-zinc-800 border-slate-200">
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
