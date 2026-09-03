import React, { useState } from 'react';
import { Product } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  onSelectProduct: (product: Product) => void;
  initialCategory?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  onSelectProduct,
  initialCategory = 'all',
}) => {
  const { products } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  const categories = [
    { id: 'all', label: 'All Custom Frames' },
    { id: 'baby', label: 'Baby Birth Frames' },
    { id: 'couple', label: 'Couple & Anniversary' },
    { id: 'acrylic', label: 'Acrylic Glass' },
    { id: 'collage', label: 'Photo Collages' },
  ];

  const filteredProducts = products.filter((product) => {
    if (!product || product.isDeleted) return false;
    if (selectedCategory === 'all') return true;
    return (
      (product.category || '').toLowerCase().includes(selectedCategory.toLowerCase()) ||
      (product.categoryLabel || '').toLowerCase().includes(selectedCategory.toLowerCase())
    );
  });

  return (
    <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans select-none">
      
      {/* Category Filter Pills (LovecraftbySE Style Horizontal Buttons for Homepage) */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 font-jost text-xs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-5 py-2.5 rounded-full font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-[#F82BA9] text-white shadow-md scale-105'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-2xs'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Full-Width Products Grid (4 Columns on Desktop for Homepage) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onSelectProduct={onSelectProduct}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-2">
          <p className="font-bold text-base text-gray-800">No frames found in this category.</p>
          <p className="text-xs text-gray-500">Select another category or click "All Custom Frames" to view all items!</p>
        </div>
      )}

    </section>
  );
};
