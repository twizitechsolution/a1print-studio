import React from 'react';
import { Product } from '../../types';
import { ProductFrameDisplay } from './ProductFrameDisplay';
import { Star, Sparkles, ArrowRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
}) => {
  if (!product) return null;
  const defaultSize = (product.sizes && product.sizes[0]) || { price: 699, originalPrice: 999 };

  return (
    <div 
      onClick={() => onSelectProduct(product)}
      className="group bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer font-jost"
    >
      {/* Product Image Container matching reference website lovecraftbyse.com/shop/ */}
      <div 
        className={`relative w-full overflow-hidden p-3 flex items-center justify-center bg-gray-100 transition-all ${
          (product as any)?.orientation === 'landscape' ? 'aspect-4/3' : 'aspect-3/4'
        }`}
        style={{
          backgroundImage: "url('https://lovecraftbyse.com/wp-content/uploads/2025/06/single-bg.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Badges Top Bar */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          {product.bestseller ? (
            <span className="px-2.5 py-1 bg-[#3B82F6] text-white text-[10px] font-extrabold rounded-md shadow-xs flex items-center gap-1">
              Bestseller
            </span>
          ) : (
            <span />
          )}

          <span className="px-2.5 py-1 bg-[#F82BA9] text-white text-[10px] font-extrabold rounded-md shadow-xs">
            33% Off
          </span>
        </div>

        {/* Full Frame Poster with Populated Sample Data Overlay */}
        <div className="w-full h-full group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
          <ProductFrameDisplay product={product} fontScale={0.42} />
        </div>

        {/* Rating Badge Bottom Right */}
        <div className="absolute bottom-3 right-3 bg-emerald-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-sm flex items-center gap-1 shadow-md z-10">
          <span>4.9</span>
          <Star className="w-3 h-3 fill-white text-white" />
        </div>
      </div>

      {/* Product Details & Price Footer */}
      <div className="p-5 space-y-3 bg-white flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold text-[#F82BA9] uppercase tracking-wider block">
            {product.categoryLabel}
          </span>
          <h3 className="font-playfair text-base font-bold text-gray-900 group-hover:text-[#F82BA9] transition-colors line-clamp-1">
            {product.title}
          </h3>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold">Starts from</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-base text-[#160E4B]">Rs.{defaultSize.price}.00</span>
              <span className="text-xs text-gray-400 line-through">Rs.{defaultSize.originalPrice}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectProduct(product);
            }}
            className="px-4 py-2 bg-[#3C187B] hover:bg-[#251877] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            Start Design <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
