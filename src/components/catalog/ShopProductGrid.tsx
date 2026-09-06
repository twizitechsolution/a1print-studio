import React, { useState } from 'react';
import { Product } from '../../types';
import { useCartStore, DEFAULT_CATEGORIES } from '../../store/useCartStore';
import { ProductCard } from './ProductCard';
import { NoProductsFound } from '../common/NoProductsFound';
import { ChevronDown, Filter } from 'lucide-react';

interface ShopProductGridProps {
  onSelectProduct: (product: Product) => void;
  initialCategory?: string;
}

export const ShopProductGrid: React.FC<ShopProductGridProps> = ({
  onSelectProduct,
  initialCategory = 'all',
}) => {
  const { products, categories } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const activeCategories = (categories && categories.length > 0) ? categories : DEFAULT_CATEGORIES;

  // Calculate dynamic real-time product counts for each category
  const getCategoryCount = (categorySlug: string, categoryName: string) => {
    return products.filter((p) => {
      if (!p || p.isDeleted) return false;
      const catLower = (p.category || '').toLowerCase();
      const labelLower = (p.categoryLabel || '').toLowerCase();
      const slugLower = categorySlug.toLowerCase();
      const nameLower = categoryName.toLowerCase();
      return (
        catLower === slugLower ||
        labelLower === nameLower ||
        catLower.includes(slugLower) ||
        (slugLower.includes('baby') && catLower.includes('baby'))
      );
    }).length;
  };

  const filteredProducts = products.filter((product) => {
    if (!product || product.isDeleted) return false;
    if (selectedCategory === 'all') return true;
    
    // Category match logic
    const catLower = (product.category || '').toLowerCase();
    const catLabelLower = (product.categoryLabel || '').toLowerCase();
    const selLower = selectedCategory.toLowerCase();

    return (
      catLower === selLower ||
      catLabelLower === selLower ||
      catLower.includes(selLower) ||
      catLabelLower.includes(selLower) ||
      (selLower.includes('baby') && (catLower.includes('baby') || catLower.includes('birth'))) ||
      (selLower.includes('birthday') && (catLower.includes('birth') || catLower.includes('birthday'))) ||
      (selLower.includes('anniversary') && (catLower.includes('marriage') || catLower.includes('anniversary'))) ||
      (selLower.includes('collage') && catLower.includes('collage')) ||
      (selLower.includes('family') && catLower.includes('family')) ||
      (selLower.includes('brother') && (catLower.includes('brother') || catLower.includes('sister')))
    );
  });

  return (
    <section id="shop-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans select-none">
      
      {/* Mobile Filter Toggle Bar */}
      <div className="md:hidden flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
        <button
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          className="flex items-center gap-2 text-xs font-bold text-[#160E4B] cursor-pointer"
        >
          <Filter className="w-4 h-4 text-[#F82BA9]" />
          <span>Filter Categories ({selectedCategory === 'all' ? 'All' : selectedCategory})</span>
        </button>
        <ChevronDown className={`w-4 h-4 transition-transform ${mobileFilterOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* 2-Column Side-by-Side Desktop Grid Layout matching LovecraftbySE reference screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start w-full">
        
        {/* Left Sidebar Category & Subcategory Filter (3 Cols on Desktop, Pinned Left Side) */}
        <div className={`md:col-span-4 lg:col-span-3 bg-white p-5 rounded-3xl border border-gray-200 shadow-xs space-y-4 md:sticky md:top-24 ${mobileFilterOpen ? 'block' : 'hidden md:block'}`}>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-playfair font-black text-xl text-[#160E4B] flex items-center gap-2">
              Categories
            </h3>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-xs font-bold text-[#F82BA9] hover:underline cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="space-y-2">
            {/* Show All Products Option */}
            <div
              onClick={() => setSelectedCategory('all')}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedCategory === 'all'
                  ? 'border-[#F82BA9] bg-pink-50/50 text-[#F82BA9] font-extrabold'
                  : 'border-gray-100 bg-white text-gray-800 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={selectedCategory === 'all'}
                  readOnly
                  className="rounded border-gray-300 text-[#F82BA9] focus:ring-0 cursor-pointer"
                />
                <span>All Custom Frames</span>
              </div>
              <span className="text-[11px] font-mono text-gray-400 font-bold">{products.length}</span>
            </div>

            {/* Dynamic Active Categories List */}
            {activeCategories.map((cat) => {
              const count = getCategoryCount(cat.slug, cat.name);
              const isSelected = selectedCategory === cat.slug || selectedCategory === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-[#F82BA9] bg-pink-50/60 text-[#F82BA9] font-extrabold shadow-2xs'
                      : 'border-gray-100 bg-white text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 text-xs">
                    <span className="text-base leading-none">{cat.icon || '🏷️'}</span>
                    <span className={isSelected ? 'font-black' : 'font-medium'}>{cat.name}</span>
                  </div>

                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-[#F82BA9] text-white'
                        : count > 0
                        ? 'bg-pink-50 text-[#F82BA9]'
                        : 'text-gray-400 bg-gray-100'
                    }`}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Product Cards Grid Side-by-Side (9 Cols on Desktop) */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">
              Showing <span className="font-extrabold text-[#160E4B]">{filteredProducts.length}</span> Custom Frame Products
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <NoProductsFound />
          )}
        </div>

      </div>

    </section>
  );
};
