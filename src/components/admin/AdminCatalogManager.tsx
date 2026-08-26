import React, { useState } from 'react';
import { Product } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import { Tag, Plus, Edit2, Trash2, Flame, Sliders, Download, Cloud, ChevronLeft, ChevronRight } from 'lucide-react';
import { firebaseCloudDb } from '../../config/firebase';
import { AdminProductListingModal } from './AdminProductListingModal';

interface AdminCatalogManagerProps {
  onOpenTemplateEditor?: (product: Product) => void;
  onOpenVisualEditor?: (product: Product) => void;
  onEditTemplate?: (product: Product) => void;
  products?: Product[];
}

export const AdminCatalogManager: React.FC<AdminCatalogManagerProps> = ({
  onOpenTemplateEditor,
  onOpenVisualEditor,
  onEditTemplate,
}) => {
  const { products, addProduct, updateProduct, deleteProduct } = useCartStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // 10-Item Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const paginatedProducts = products.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
    if (onEditTemplate) {
      onEditTemplate(product);
    } else if (onOpenTemplateEditor) {
      onOpenTemplateEditor(product);
    } else if (onOpenVisualEditor) {
      onOpenVisualEditor(product);
    }
  };

  const toggleBestseller = (id: string, currentVal?: boolean) => {
    updateProduct(id, { bestseller: !currentVal });
  };

  const toggleOnSale = (id: string, currentVal?: boolean) => {
    updateProduct(id, { onSale: !currentVal });
  };

  return (
    <div className="space-y-6 font-jost select-none">
      
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#121829] p-6 rounded-3xl border border-[#262E4A] shadow-xl">
        <div>
          <h2 className="font-playfair text-2xl font-bold text-white flex items-center gap-2">
            Frame Product Catalog ({products.length})
          </h2>
          <p className="text-xs text-gray-400">Manage frame catalog products, prices, templates, and badges (10 per page)</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-3 bg-[#3B82F6] hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add New Frame Product
          </button>
        </div>
      </div>

      {/* Frame Catalog Table */}
      <div className="bg-[#121829] rounded-3xl border border-[#262E4A] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1A2035] text-gray-400 text-[11px] font-extrabold uppercase border-b border-[#262E4A]">
              <tr>
                <th className="p-4">Product Poster</th>
                <th className="p-4">Frame Title & Details</th>
                <th className="p-4">Category</th>
                <th className="p-4">Starting Price</th>
                <th className="p-4">Bestseller Status</th>
                <th className="p-4">Discount Badge</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262E4A] font-bold">
              {paginatedProducts.map((product) => {
                const posterSrc = product.baseImageUrl || product.thumbnail || product.image;
                const priceVal = (product as any).price || (product.sizes && product.sizes[0] ? product.sizes[0].price : 699);
                const origVal = product.sizes && product.sizes[0] ? product.sizes[0].originalPrice : null;
                const catName = product.categoryLabel || product.category || 'Custom Photo Frame';

                return (
                  <tr key={product.id} className="hover:bg-[#1A2035]/50 transition-colors text-gray-200">
                    <td className="p-4">
                      <div className="w-12 h-16 rounded-lg overflow-hidden border border-[#262E4A] bg-gray-900 shrink-0">
                        <img
                          src={posterSrc}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-white text-sm">{product.title}</h4>
                        <span className="text-gray-400 font-mono text-[10px] block">ID: {product.id}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-[#3B82F6] font-extrabold text-[11px] border border-blue-500/20 inline-block">
                        {catName}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="font-extrabold text-emerald-400 text-sm">
                        ₹{priceVal}.00
                      </div>
                      {origVal && (
                        <div className="text-[10px] text-gray-400 line-through font-mono">
                          ₹{origVal}.00
                        </div>
                      )}
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

      {/* 10-Item Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 bg-[#121829] rounded-2xl border border-[#262E4A] flex items-center justify-between gap-4 font-bold text-xs text-gray-300">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="px-4 py-2 bg-[#1A2035] hover:bg-[#262E4A] rounded-xl border border-[#262E4A] transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <span className="text-gray-400">
            Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            className="px-4 py-2 bg-[#1A2035] hover:bg-[#262E4A] rounded-xl border border-[#262E4A] transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

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
