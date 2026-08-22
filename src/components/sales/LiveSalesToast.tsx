import React, { useState, useEffect } from 'react';
import { ShoppingBag, X } from 'lucide-react';

const RECENT_SALES = [
  { name: 'Neha Saxena', city: 'Lucknow', product: 'Baby Birth Frame', time: '10 minutes ago' },
  { name: 'Priya Sharma', city: 'Delhi', product: 'Happy Anniversary Frame', time: '4 minutes ago' },
  { name: 'Amit Patel', city: 'Ahmedabad', product: 'Acrylic Photo Glass Print', time: '15 minutes ago' },
  { name: 'Rohan Verma', city: 'Bangalore', product: 'Custom Birth Frame', time: '2 minutes ago' },
];

export const LiveSalesToast: React.FC = () => {
  const [currentSaleIndex, setCurrentSaleIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentSaleIndex((prev) => (prev + 1) % RECENT_SALES.length);
        setIsVisible(true);
      }, 500);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  const currentSale = RECENT_SALES[currentSaleIndex];

  return (
    <div className="fixed bottom-6 left-6 z-40 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-pink-200 shadow-2xl flex items-center gap-3 font-jost animate-slideInUp max-w-xs">
      <div className="w-9 h-9 rounded-full bg-[#F82BA9] text-white flex items-center justify-center shrink-0">
        <ShoppingBag className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0 text-xs">
        <p className="font-bold text-[#160E4B] truncate">
          {currentSale.name} <span className="text-gray-400 font-normal">from {currentSale.city}</span>
        </p>
        <p className="text-[11px] text-[#F82BA9] font-medium truncate">
          purchased {currentSale.product}
        </p>
        <span className="text-[9px] text-gray-400 font-mono">{currentSale.time}</span>
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="text-gray-400 hover:text-gray-600 p-1 shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
