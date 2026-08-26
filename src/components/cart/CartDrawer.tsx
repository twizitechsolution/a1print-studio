import React from 'react';
import { CartItem } from '../../types';
import { LiveCustomizedFrameThumbnail } from '../customizer/LiveCustomizedFrameThumbnail';
import { X, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  subtotal: number;
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onNavigate: (page: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  subtotal,
  onRemoveItem,
  onUpdateQuantity,
  onNavigate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-jost select-none animate-fadeIn">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-2xs transition-opacity"
      />

      {/* Slide-Over Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between z-10">
        
        {/* Drawer Header */}
        <div className="p-5 bg-[#3C187B] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-pink-300" />
            <h3 className="font-bold text-base">Your Cart ({items.length})</h3>
          </div>
          <button onClick={onClose} className="p-1 text-purple-200 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Items Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3 text-gray-500">
              <p className="font-bold text-sm text-gray-800">Your cart is empty</p>
              <button
                onClick={() => {
                  onClose();
                  onNavigate('catalog');
                }}
                className="px-6 py-2.5 bg-[#F82BA9] text-white font-bold text-xs rounded-xl shadow-md"
              >
                Browse Custom Frames
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center gap-3">
                {/* Bulletproof Live Frame Thumbnail Component */}
                <div className="w-16 h-20 shrink-0">
                  <LiveCustomizedFrameThumbnail item={item} />
                </div>

                <div className="flex-1 space-y-1 text-xs">
                  <h4 className="font-bold text-gray-900 line-clamp-1">{item.product?.title || 'Custom Photo Frame'}</h4>
                  <span className="text-[#F82BA9] font-bold block">{item.selectedSize?.name || 'A4 (8x12 Inch)'}</span>
                  <span className="font-extrabold text-sm text-gray-900 block">₹{item.itemTotalPrice}</span>
                </div>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-5 bg-gray-50 border-t border-gray-200 space-y-4">
            <div className="flex justify-between items-baseline font-bold text-sm">
              <span className="text-gray-700">Subtotal:</span>
              <span className="font-extrabold text-base text-[#F82BA9]">₹{subtotal}.00</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onClose();
                  onNavigate('cart');
                }}
                className="py-3 bg-white border border-gray-300 text-gray-800 font-bold text-xs rounded-xl hover:bg-gray-100"
              >
                View Cart
              </button>

              <button
                onClick={() => {
                  onClose();
                  onNavigate('checkout');
                }}
                className="py-3 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
              >
                Checkout <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
