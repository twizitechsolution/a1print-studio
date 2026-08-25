import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, CheckCircle2 } from 'lucide-react';

interface PurchaseNotification {
  id: string;
  customerName: string;
  city: string;
  productName: string;
  timeAgo: string;
}

const SAMPLE_NOTIFICATIONS: PurchaseNotification[] = [
  { id: '1', customerName: 'Neha Saxena', city: 'Lucknow', productName: 'Baby Birth Detail Frame', timeAgo: '10 minutes ago' },
  { id: '2', customerName: 'Ananya S.', city: 'Mumbai', productName: 'Custom Birthday Collage Photo Frame', timeAgo: '2 minutes ago' },
  { id: '3', customerName: 'Priyanka R.', city: 'Bangalore', productName: 'Welcome Little One Baby Frame', timeAgo: '4 minutes ago' },
  { id: '4', customerName: 'Rahul & Neha', city: 'Delhi NCR', productName: 'Personalized Dad Heartbeat Photo Frame', timeAgo: '1 minute ago' },
  { id: '5', customerName: 'Sourav K.', city: 'Bhubaneswar', productName: 'Custom Birthday Collage Photo Frame', timeAgo: '6 minutes ago' },
  { id: '6', customerName: 'Megha D.', city: 'Hyderabad', productName: 'Personalized Brother Sister Photo Frame', timeAgo: '3 minutes ago' },
  { id: '7', customerName: 'Vikram & Pooja', city: 'Kolkata', productName: 'Personalized Sibling Photo Collage Frame', timeAgo: '5 minutes ago' },
  { id: '8', customerName: 'Sneha Reddy', city: 'Chennai', productName: 'Welcome Little One Baby Frame', timeAgo: '8 minutes ago' },
  { id: '9', customerName: 'Rahul Joshi', city: 'Pune', productName: 'Personalized Dad Heartbeat Photo Collage', timeAgo: '15 minutes ago' },
  { id: '10', customerName: 'Divya Agarwal', city: 'Jaipur', productName: 'Custom Birthday Collage Photo Frame', timeAgo: '7 minutes ago' },
];

export const RecentPurchaseToast: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Show initial toast after 3 seconds
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
      scheduleNextPopup();
    }, 3000);

    const scheduleNextPopup = () => {
      // 10 to 15 seconds random interval (10000ms - 15000ms)
      const randomInterval = Math.floor(Math.random() * 5000) + 10000;

      timeoutId = setTimeout(() => {
        setIsVisible(false);

        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % SAMPLE_NOTIFICATIONS.length);
          setIsVisible(true);
          scheduleNextPopup();
        }, 600);
      }, randomInterval);
    };

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(timeoutId);
    };
  }, []);

  if (!isVisible) return null;

  const currentToast = SAMPLE_NOTIFICATIONS[currentIndex];

  return (
    <div className="fixed bottom-6 left-6 z-50 bg-[#F82BA9] text-white p-3.5 px-4 rounded-2xl shadow-2xl flex items-center gap-3 font-jost animate-slideInUp max-w-xs sm:max-w-sm border border-pink-400/30">
      
      {/* Translucent White Pill Icon Box matching reference image media_1787658287227.png */}
      <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 shadow-inner">
        <ShoppingBag className="w-5.5 h-5.5 text-white" />
      </div>

      {/* 3 White Text Lines matching LovecraftbySE reference style */}
      <div className="flex-1 min-w-0 text-xs space-y-0.5">
        <p className="font-extrabold text-white truncate leading-tight">
          {currentToast.customerName} <span className="font-normal text-white/90">from {currentToast.city} purchased</span>
        </p>
        <p className="text-[11px] font-bold text-white truncate leading-tight">
          {currentToast.productName}
        </p>
        <p className="text-[10px] text-white/80 font-medium flex items-center gap-1.5 pt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />
          <span>Verified Purchase • {currentToast.timeAgo}</span>
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
