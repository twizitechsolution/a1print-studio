import React, { useState } from 'react';
import { Product } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import { Tag, Plus, Edit2, Trash2, Flame, Sliders, FolderPlus, History, RotateCcw, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminProductListingModal } from './AdminProductListingModal';
import { AdminCategoryManager } from './AdminCategoryManager';
import { AdminRecycleBinModal } from './AdminRecycleBinModal';
import { AdminStockAuditModal } from './AdminStockAuditModal';

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
  const {
    products,
    categories,
    addCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    softDeleteProduct,
    restoreProduct,
    permanentDeleteProduct,
    updateStockQuantity,
  } = useCartStore();

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Active Live Products vs Soft-Deleted Recycle Bin Products
  const activeProducts = products.filter((p) => !p.isDeleted);
  const deletedProducts = products.filter((p) => p.isDeleted);

  // 10-Item Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(activeProducts.length / pageSize));
  const paginatedProducts = activeProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#121829] p-6 rounded-3xl border border-[#262E4A] shadow-xl">
        <div>
          <h2 className="font-playfair text-2xl font-bold text-white flex items-center gap-2">
            Frame Product Catalog ({activeProducts.length})
          </h2>
          <p className="text-xs text-gray-400">Manage frame catalog products, categories, stock inventory, and recycle bin (10 per page)</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Desk Button */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-4 py-2.5 bg-pink-500/10 hover:bg-pink-500/20 text-[#F82BA9] font-extrabold text-xs rounded-xl border border-pink-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" /> Category Manager ({categories.length})
          </button>

      {/* Frame Catalog Header & Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">
            Frame Product Catalog
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage photo frame products, stock inventory, categories, and multi-angle galleries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Manager Button */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-xs rounded-lg border border-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" /> Categories ({categories.length})
          </button>

          {/* Recycle Bin Button */}
          <button
            onClick={() => setIsRecycleBinOpen(true)}
            className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-xs rounded-lg border border-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-zinc-400" /> Recycle Bin ({deletedProducts.length})
          </button>

          {/* Add Product Button */}
          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Product
          </button>
        </div>
      </div>

      {/* Frame Catalog Table */}
      <div className="bg-zinc-900/40 rounded-xl border border-zinc-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900 text-zinc-400 text-[11px] font-medium uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="p-3.5">Poster</th>
                <th className="p-3.5">Product Title & Details</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Price</th>
                <th className="p-3.5">Inventory Stock</th>
                <th className="p-3.5">Bestseller</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {paginatedProducts.map((product) => {
                const posterSrc = product.baseImageUrl || product.thumbnail || product.images?.[0];
                const priceVal = (product as any).price || (product.sizes && product.sizes[0] ? product.sizes[0].price : 699);
                const catName = product.categoryLabel || product.category || 'Custom Frame';
                const stockQty = product.stockQuantity !== undefined ? product.stockQuantity : 50;

                return (
                  <tr key={product.id} className="hover:bg-zinc-900/60 transition-colors text-zinc-200">
                    <td className="p-3.5">
                      <div className="w-10 h-14 rounded-md overflow-hidden border border-zinc-800 bg-zinc-950 shrink-0">
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

                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <h4 className="font-semibold text-zinc-100 text-xs">{product.title}</h4>
                        <span className="text-zinc-500 font-mono text-[10px] block">ID: {product.id}</span>
                        {product.images && product.images.length > 1 && (
                          <span className="text-[10px] text-zinc-400 block font-normal">📸 {product.images.length} Angle Photos</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-950 text-zinc-300 font-medium text-[11px] border border-zinc-800 inline-block">
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

                    {/* Stock Inventory & Log Column */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          stockQty > 10 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {stockQty} Units
                        </span>

                        <button
                          onClick={() => setSelectedStockProduct(product)}
                          className="p-1.5 bg-[#1A2035] hover:bg-[#262E4A] text-purple-400 rounded-lg border border-[#262E4A] transition-colors cursor-pointer"
                          title="View Stock Audit Log & Restock"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                          onClick={() => softDeleteProduct(product.id)}
                          className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                          title="Move to Recycle Bin"
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
        isOpen={isProductModalOpen}
        editingProduct={editingProduct}
        onClose={() => setIsProductModalOpen(false)}
        onSaveProduct={handleSaveProduct}
      />

      {/* Category Manager Desk Modal */}
      <AdminCategoryManager
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        products={products}
        onAddCategory={addCategory}
        onDeleteCategory={deleteCategory}
      />

      {/* Recycle Bin Modal */}
      <AdminRecycleBinModal
        isOpen={isRecycleBinOpen}
        onClose={() => setIsRecycleBinOpen(false)}
        deletedProducts={deletedProducts}
        onRestoreProduct={restoreProduct}
        onPermanentDeleteProduct={permanentDeleteProduct}
      />

      {/* Stock Audit & Restock Report Modal */}
      <AdminStockAuditModal
        isOpen={!!selectedStockProduct}
        onClose={() => setSelectedStockProduct(null)}
        product={selectedStockProduct}
        onUpdateStock={updateStockQuantity}
      />

    </div>
  );
};
