import React from 'react';
import { Product } from '../../types';
import { Trash2, RotateCcw, X, AlertTriangle, Package, CheckCircle2 } from 'lucide-react';

interface AdminRecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedProducts: Product[];
  onRestoreProduct: (productId: string) => void;
  onPermanentDeleteProduct: (productId: string) => void;
}

export const AdminRecycleBinModal: React.FC<AdminRecycleBinModalProps> = ({
  isOpen,
  onClose,
  deletedProducts,
  onRestoreProduct,
  onPermanentDeleteProduct,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-jost animate-fadeIn select-none">
      <div className="relative bg-[#121829] text-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-[#262E4A] space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262E4A] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-playfair text-xl font-bold text-white flex items-center gap-2">
                Products Recycle Bin Desk
              </h3>
              <p className="text-xs text-gray-400">Restore accidentally deleted frame products or purge them permanently.</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-[#1A2035] transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {deletedProducts.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-[#1A2035] rounded-2xl border border-[#262E4A]">
            <Package className="w-12 h-12 text-gray-500 mx-auto" />
            <h4 className="font-bold text-sm text-gray-300">Recycle Bin is Empty</h4>
            <p className="text-xs text-gray-500">No deleted frame products found in the recycle bin archive.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Items in Recycle Bin are soft-deleted and hidden from storefront. Click "Restore" to bring a product back live.</span>
            </div>

            <div className="bg-[#1A2035] rounded-2xl border border-[#262E4A] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121829] text-gray-400 font-bold border-b border-[#262E4A]">
                  <tr>
                    <th className="p-3.5">Product Frame</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Deleted Date</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262E4A] text-gray-300 font-medium">
                  {deletedProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-[#121829]/50 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img src={p.thumbnail} alt={p.title} className="w-10 h-10 object-cover rounded-xl border border-[#262E4A]" />
                          <div>
                            <span className="font-bold text-white block">{p.title}</span>
                            <span className="text-[11px] text-gray-400 block">{p.subtitle || `₹${p.sizes?.[0]?.price || 699}`}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-pink-500/10 text-[#F82BA9] border border-pink-500/20">
                          {p.categoryLabel || p.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-400 text-[11px]">
                        {p.deletedAt ? new Date(p.deletedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently Deleted'}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onRestoreProduct(p.id)}
                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Restore Product"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Restore Live
                          </button>

                          <button
                            onClick={() => onPermanentDeleteProduct(p.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                            title="Permanent Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
