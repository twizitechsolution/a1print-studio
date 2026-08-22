import React, { useState } from 'react';
import { Product } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import { ProductCard } from './ProductCard';
import { Sparkles } from 'lucide-react';

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
    if (selectedCategory === 'all') return true;
    return product.category === selectedCategory;
  });

  return (
    <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans">
      
      {/* Category Filter Pills */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 font-jost text-xs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-[#F82BA9] text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-2xs'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Products Grid */}
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
        <div className="text-center py-16 text-gray-500 font-jost space-y-2">
          <p className="font-bold text-base text-gray-800">No frames found in this category.</p>
          <p className="text-xs">Add a new frame product from the Admin Frame Catalog!</p>
        </div>
      )}

    </section>
  );
};
