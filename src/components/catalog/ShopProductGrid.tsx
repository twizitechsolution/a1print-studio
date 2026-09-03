import React, { useState } from 'react';
import { Product } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import { ProductCard } from './ProductCard';
import { ChevronDown, ChevronUp, Filter, Sparkles } from 'lucide-react';

interface ShopProductGridProps {
  onSelectProduct: (product: Product) => void;
  initialCategory?: string;
}

interface SubCategory {
  id: string;
  name: string;
  count: number;
}

interface CategoryGroup {
  id: string;
  name: string;
  count: number;
  subcategories?: SubCategory[];
}

export const ShopProductGrid: React.FC<ShopProductGridProps> = ({
  onSelectProduct,
  initialCategory = 'all',
}) => {
  const { products } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [openAccordionIds, setOpenAccordionIds] = useState<string[]>(['baby', 'customised']);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Accordion Category Hierarchy matching lovecraftbyse.com/shop reference screenshot!
  const categoryGroups: CategoryGroup[] = [
    {
      id: 'customised',
      name: 'Customised Photos',
      count: 217,
      subcategories: [
        { id: 'custom-photo-frames', name: 'Custom Photo Frames', count: 120 },
        { id: 'acrylic-custom', name: 'Acrylic Frames', count: 97 },
      ],
    },
    {
      id: 'baby',
      name: 'Baby Birth Frame',
      count: 85,
      subcategories: [
        { id: 'birth-details', name: 'Birth Details Frames', count: 53 },
        { id: 'first-year', name: 'First Year Photo Frames', count: 24 },
        { id: 'twin-baby', name: 'Twin Baby Frames', count: 10 },
      ],
    },
    {
      id: 'mom-dad',
      name: 'Gifts for Mom & Dad',
      count: 15,
    },
    {
      id: 'marriage',
      name: 'Marriage anniversary Gift',
      count: 40,
    },
    {
      id: 'collage',
      name: 'Photo Collage Frames',
      count: 90,
    },
    {
      id: 'siblings',
      name: 'Gifts for Brother & Sister',
      count: 12,
    },
    {
      id: 'birthday',
      name: 'Birthday Gifts',
      count: 59,
    },
  ];

  const toggleAccordion = (id: string) => {
    setOpenAccordionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredProducts = products.filter((product) => {
    if (!product || product.isDeleted) return false;
    if (selectedCategory === 'all') return true;
    
    // Category or Subcategory match logic
    const catLower = (product.category || '').toLowerCase();
    const catLabelLower = (product.categoryLabel || '').toLowerCase();
    const selLower = selectedCategory.toLowerCase();

    return (
      catLower.includes(selLower) ||
      catLabelLower.includes(selLower) ||
      (selLower === 'baby' && (catLower.includes('baby') || catLower.includes('birth'))) ||
      (selLower === 'birth-details' && (catLower.includes('birth') || catLower.includes('detail'))) ||
      (selLower === 'first-year' && (catLower.includes('first') || catLower.includes('year') || catLower.includes('12 month'))) ||
      (selLower === 'twin-baby' && catLower.includes('twin')) ||
      (selLower === 'birthday' && catLower.includes('birth')) ||
      (selLower === 'collage' && catLower.includes('collage')) ||
      (selLower === 'customised' && catLower.includes('custom'))
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

            {/* Category Groups Accordion */}
            {categoryGroups.map((group) => {
              const isOpen = openAccordionIds.includes(group.id);
              const isGroupSelected = selectedCategory === group.id;

              return (
                <div key={group.id} className="space-y-1">
                  <div
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isGroupSelected
                        ? 'border-[#F82BA9] bg-pink-50/50 text-[#F82BA9] font-extrabold shadow-2xs'
                        : 'border-gray-100 bg-white text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      onClick={() => setSelectedCategory(group.id)}
                      className="flex items-center gap-2.5 flex-1 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isGroupSelected}
                        readOnly
                        className="rounded border-gray-300 text-[#F82BA9] focus:ring-0 cursor-pointer"
                      />
                      <span className="font-bold">{group.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-gray-400 font-bold">{group.count}</span>
                      {group.subcategories && group.subcategories.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAccordion(group.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                        >
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subcategories Accordion Content */}
                  {isOpen && group.subcategories && group.subcategories.length > 0 && (
                    <div className="pl-6 space-y-1 py-1">
                      {group.subcategories.map((sub) => {
                        const isSubSelected = selectedCategory === sub.id;

                        return (
                          <div
                            key={sub.id}
                            onClick={() => setSelectedCategory(sub.id)}
                            className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                              isSubSelected
                                ? 'border-[#F82BA9] bg-pink-50 text-[#F82BA9] font-extrabold'
                                : 'border-transparent text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSubSelected}
                                readOnly
                                className="rounded border-gray-300 text-[#F82BA9] focus:ring-0 cursor-pointer"
                              />
                              <span>{sub.name}</span>
                            </div>
                            <span className="text-[10px] font-mono text-gray-400">{sub.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-8 space-y-2">
              <p className="font-bold text-base text-gray-800">No frames found in this category.</p>
              <p className="text-xs text-gray-500">Select another category or click "All Custom Frames" to view all items!</p>
            </div>
          )}
        </div>

      </div>

    </section>
  );
};
