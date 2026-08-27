import React, { useState } from 'react';
import { Product, StockLogItem } from '../../types';
import { Package, ArrowUpRight, ArrowDownRight, Plus, RefreshCw, X, History, CheckCircle2 } from 'lucide-react';

interface AdminStockAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onUpdateStock: (productId: string, addedQuantity: number, reason: string) => void;
}

export const AdminStockAuditModal: React.FC<AdminStockAuditModalProps> = ({
  isOpen,
  onClose,
  product,
  onUpdateStock,
}) => {
  const [restockQty, setRestockQty] = useState<number>(20);
  const [reason, setReason] = useState<string>('Admin Stock Replenishment');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const currentStock = product.stockQuantity !== undefined ? product.stockQuantity : 50;
  const logs: StockLogItem[] = product.stockLogs || [];

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockQty || restockQty <= 0) return;

    onUpdateStock(product.id, restockQty, reason || 'Admin Restock');
    setSuccessMsg(`Added +${restockQty} units to live inventory stock!`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-jost animate-fadeIn select-none">
      <div className="relative bg-[#121829] text-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-[#262E4A] space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262E4A] pb-4">
          <div className="flex items-center gap-3">
            <img src={product.thumbnail} alt={product.title} className="w-12 h-12 object-cover rounded-2xl border border-[#262E4A]" />
            <div>
              <h3 className="font-playfair text-xl font-bold text-white flex items-center gap-2">
                Stock Inventory & Audit Report
              </h3>
              <p className="text-xs text-gray-400 font-bold">{product.title} ({product.categoryLabel || product.category})</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-[#1A2035] transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Stock Banner */}
        <div className="p-5 bg-gradient-to-r from-[#1A2035] to-[#160E4B] rounded-2xl border border-[#262E4A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-gray-400 font-bold block">Current Available Stock</span>
              <span className={`text-2xl font-extrabold ${currentStock > 10 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currentStock} Units Available
              </span>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            currentStock > 10 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          }`}>
            {currentStock > 10 ? 'In Stock' : 'Low Stock Warning'}
          </span>
        </div>

        {successMsg && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {successMsg}
          </div>
        )}

        {/* Restock Form */}
        <form onSubmit={handleRestockSubmit} className="p-5 bg-[#1A2035] rounded-2xl border border-[#262E4A] space-y-4">
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" /> Restock Stock Quantity (Credit)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
            <div className="space-y-1">
              <label className="text-gray-300">Quantity to Add (+)</label>
              <input
                type="number"
                min="1"
                required
                value={restockQty}
                onChange={(e) => setRestockQty(Number(e.target.value))}
                className="w-full bg-[#121829] border border-[#262E4A] px-4 py-2.5 rounded-xl text-white font-mono focus:outline-hidden focus:border-[#F82BA9]"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-gray-300">Restock Reason / Supplier Notes</label>
              <input
                type="text"
                placeholder="e.g. Received new shipment batch of 50 units"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#121829] border border-[#262E4A] px-4 py-2.5 rounded-xl text-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Credit Stock Balance
            </button>
          </div>
        </form>

        {/* Audit Log Table */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" /> Stock Debit & Credit Audit Logs ({logs.length})
          </h4>

          {logs.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500 bg-[#1A2035] rounded-2xl border border-[#262E4A]">
              No stock transaction history recorded for this product yet.
            </div>
          ) : (
            <div className="bg-[#1A2035] rounded-2xl border border-[#262E4A] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121829] text-gray-400 font-bold border-b border-[#262E4A]">
                  <tr>
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5 text-center">Qty Change</th>
                    <th className="p-3.5 text-center">Stock Balance</th>
                    <th className="p-3.5">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262E4A] text-gray-300 font-medium">
                  {logs.slice().reverse().map((log) => (
                    <tr key={log.id} className="hover:bg-[#121829]/50 transition-colors">
                      <td className="p-3.5 text-[11px] text-gray-400">
                        {new Date(log.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 w-fit ${
                          log.type === 'credit' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {log.type === 'credit' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {log.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold font-mono">
                        <span className={log.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}>
                          {log.type === 'credit' ? `+${log.quantity}` : `-${log.quantity}`}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono text-gray-300">
                        {log.previousStock} ➔ <strong className="text-white">{log.newStock}</strong>
                      </td>
                      <td className="p-3.5 text-gray-300 text-xs">{log.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
