import React, { useState } from 'react';
import { Product } from '../../types';
import { Tag, Plus, Edit2, Trash2, Flame, Sliders, Download, Cloud } from 'lucide-react';
import { firebaseCloudDb } from '../../config/firebase';

interface AdminCatalogManagerProps {
  onOpenTemplateEditor?: (product: Product) => void;
  onOpenVisualEditor?: (product: Product) => void;
  products?: Product[];
}

export const AdminCatalogManager: React.FC<AdminCatalogManagerProps> = ({
  onOpenTemplateEditor,
  onOpenVisualEditor,
}) => {
  const { products, addProduct, updateProduct, deleteProduct } = useCartStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (product: Product) => {
    const exists = products.some((p) => p.id === product.id);
    if (exists) {
      updateProduct(product.id, product);
    } else {
      addProduct(product);
    }
  };

  const handleVisualWorkspaceClick = (product: Product) => {
    if (onOpenVisualEditor) {
      onOpenVisualEditor(product);
    } else if (onOpenTemplateEditor) {
      onOpenTemplateEditor(product);
    }
  };

  const toggleBestseller = (id: string, currentVal?: boolean) => {
    updateProduct(id, { bestseller: !currentVal });
  };

  const toggleOnSale = (id: string, currentVal?: boolean) => {
    updateProduct(id, { onSale: !currentVal });
  };

  const [syncStatus, setSyncStatus] = useState<string>('');

  const handleSyncToCloud = async () => {
    setSyncStatus('Syncing all frames to Cloud Firebase...');
    try {
      for (const prod of products) {
        await firebaseCloudDb.setDocument('products', prod.id, prod);
      }
      setSyncStatus(`✔ Successfully pushed ${products.length} frames to Cloud Firebase!`);
      setTimeout(() => setSyncStatus(''), 5000);
    } catch (e) {
      setSyncStatus('Sync error. Please try again.');
    }
  };

  const handleExportCatalogCode = () => {
    const fileContent = `import { Product } from '../types';\n\nexport const PRODUCTS: Product[] = ${JSON.stringify(products, null, 2)};\n`;
    const blob = new Blob([fileContent], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-jost text-white select-none">
      
      {/* Sync Status Banner */}
      {syncStatus && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl flex items-center justify-between animate-fade-in">
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Header & Add New Frame Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#121829] p-5 rounded-2xl border border-[#262E4A] shadow-xl">
        <div>
          <h3 className="font-bold text-base text-white">
            Store Product & Frame Catalog ({products.length} Products)
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Add new frame products, edit prices, update poster artwork, and configure visual canvas template slots.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleSyncToCloud}
            className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Upload all local frames to live Firebase Cloud Database"
          >
            <Cloud className="w-4 h-4" /> Push All Frames to Firebase Cloud
          </button>

          <button
            onClick={handleExportCatalogCode}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Download products.ts code to commit to GitHub"
          >
            <Download className="w-4 h-4" /> Download Master products.ts Code
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-[#3B82F6] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + Add New Frame Product
          </button>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-[#121829] rounded-2xl border border-[#262E4A] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1A2035] border-b border-[#262E4A] text-gray-400 font-bold uppercase tracking-wider">
                <th className="p-4">Product Image & Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Base Price</th>
                <th className="p-4">Bestseller Badge</th>
                <th className="p-4">50% Sale Badge</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262E4A] font-medium text-gray-300">
              {products.map((product) => {
                const defaultSize = product.sizes[0] || { price: 699, originalPrice: 999 };
                return (
                  <tr key={product.id} className="hover:bg-[#1A2035]/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="w-12 h-16 object-cover rounded-lg border border-[#262E4A] shrink-0"
                        />
                        <div>
                          <h4 className="font-bold text-sm text-white">{product.title}</h4>
                          <span className="text-[10px] text-gray-400 font-mono">{product.slug}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-[#3B82F6] font-bold border border-blue-500/20">
                        {product.categoryLabel}
                      </span>
                    </td>

                    <td className="p-4 font-mono font-bold text-sm text-white">
                      ₹{defaultSize.price} <span className="text-xs text-gray-400 line-through">₹{defaultSize.originalPrice}</span>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => toggleBestseller(product.id, product.bestseller)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                          product.bestseller
                            ? 'bg-[#3B82F6] text-white'
                            : 'bg-[#1A2035] text-gray-400 hover:text-white border border-[#262E4A]'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5" />
                        {product.bestseller ? 'Bestseller (ON)' : 'Bestseller (OFF)'}
                      </button>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => toggleOnSale(product.id, product.onSale)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                          product.onSale
                            ? 'bg-[#F82BA9] text-white'
                            : 'bg-[#1A2035] text-gray-400 hover:text-white border border-[#262E4A]'
                        }`}
                      >
                        <Tag className="w-3.5 h-3.5" />
                        {product.onSale ? '50% Sale (ON)' : '50% Sale (OFF)'}
                      </button>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Configure Template Full Page Button */}
                        <button
                          onClick={() => handleVisualWorkspaceClick(product)}
                          className="px-3.5 py-2 bg-[#9333EA] hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5" /> Visual Workspace
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="px-3.5 py-2 bg-[#1A2035] hover:bg-[#262E4A] text-white font-extrabold text-xs rounded-xl border border-[#262E4A] transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#3B82F6]" /> Edit Details
                        </button>

                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                          title="Delete Frame Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Frame Product Modal */}
      <AdminProductListingModal
        isOpen={isModalOpen}
        editingProduct={editingProduct}
        onClose={() => setIsModalOpen(false)}
        onSaveProduct={handleSaveProduct}
      />

    </div>
  );
};
