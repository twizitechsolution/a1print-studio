import React, { useState, useEffect } from 'react';
import { ShoppingBag, X } from 'lucide-react';

const RECENT_SALES = [
  { name: 'Neha Saxena', city: 'Lucknow', product: 'Baby Birth Frame', time: '10 minutes ago' },
  { name: 'Ananya S.', city: 'Mumbai', product: 'Custom Birthday Collage Photo Frame', time: '2 minutes ago' },
  { name: 'Priya Sharma', city: 'Delhi', product: 'Welcome Little One Baby Frame', time: '4 minutes ago' },
  { name: 'Megha D.', city: 'Hyderabad', product: 'Personalized Brother Sister Photo Frame', time: '3 minutes ago' },
  { name: 'Rohan Verma', city: 'Bangalore', product: 'Personalized Dad Heartbeat Photo Collage', time: '6 minutes ago' },
  { name: 'Kavita Patel', city: 'Ahmedabad', product: 'Custom Birthday Collage Photo Frame', time: '12 minutes ago' },
  { name: 'Sneha Reddy', city: 'Chennai', product: 'Welcome Little One Baby Frame', time: '8 minutes ago' },
  { name: 'Rahul Joshi', city: 'Pune', product: 'Personalized Dad Heartbeat Photo Collage', time: '15 minutes ago' },
  { name: 'Divya Agarwal', city: 'Jaipur', product: 'Custom Birthday Collage Photo Frame', time: '5 minutes ago' },
];

export const LiveSalesToast: React.FC = () => {
  const [currentSaleIndex, setCurrentSaleIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const scheduleNextPopup = () => {
      // 10 to 15 seconds random interval (10000ms - 15000ms)
      const randomInterval = Math.floor(Math.random() * 5000) + 10000;

      timeoutId = setTimeout(() => {
        setIsVisible(false);

        setTimeout(() => {
          setCurrentSaleIndex((prev) => (prev + 1) % RECENT_SALES.length);
          setIsVisible(true);
          scheduleNextPopup();
        }, 600);
      }, randomInterval);
    };

    scheduleNextPopup();

    return () => clearTimeout(timeoutId);
  }, []);

  if (!isVisible) return null;

  const currentSale = RECENT_SALES[currentSaleIndex];

  return (
    <div className="fixed bottom-6 left-6 z-50 bg-[#F82BA9] text-white p-3.5 px-4 rounded-2xl shadow-2xl flex items-center gap-3 font-jost animate-slideInUp max-w-xs border border-pink-400/30">
      
      {/* Translucent White Pill Icon Box matching media_1787658287227.png */}
      <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-inner">
        <ShoppingBag className="w-5 h-5 text-white" />
      </div>

      {/* 3 White Text Lines matching LovecraftbySE style */}
      <div className="flex-1 min-w-0 text-xs space-y-0.5">
        <p className="font-extrabold text-white truncate leading-tight">
          {currentSale.name} <span className="font-normal text-white/90">from {currentSale.city} purchased</span>
        </p>
        <p className="text-[11px] font-bold text-white truncate leading-tight">
          {currentSale.product}
        </p>
        <p className="text-[10px] text-white/80 font-medium">
          {currentSale.time}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={() => setIsVisible(false)}
        className="text-white/70 hover:text-white p-1 shrink-0 transition-colors cursor-pointer"
        title="Close Notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>

    </div>
  );
};
