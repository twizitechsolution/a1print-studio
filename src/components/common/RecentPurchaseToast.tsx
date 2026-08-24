import React, { useState, useEffect } from 'react';
import { ShoppingBag, X, CheckCircle2 } from 'lucide-react';

interface PurchaseNotification {
  id: string;
  customerName: string;
  city: string;
  productName: string;
  productImage: string;
  timeAgo: string;
}

const SAMPLE_NOTIFICATIONS: PurchaseNotification[] = [
  {
    id: '1',
    customerName: 'Ananya S.',
    city: 'Mumbai',
    productName: 'Custom Birthday Collage Photo Frame',
    productImage: 'https://lovecraftbyse.com/wp-content/uploads/2026/03/custom-birthday-collage-photo-frame-personalized-name-date-1.jpg',
    timeAgo: '2 minutes ago',
  },
  {
    id: '2',
    customerName: 'Priyanka R.',
    city: 'Bangalore',
    productName: 'Welcome Baby Birth Detail Frame',
    productImage: 'https://lovecraftbyse.com/wp-content/uploads/2025/02/welcome-baby-boy-scaled.webp',
    timeAgo: '4 minutes ago',
  },
  {
    id: '3',
    customerName: 'Rahul & Neha',
    city: 'Delhi NCR',
    productName: 'Personalized Dad Heartbeat Photo Frame',
    productImage: 'https://lovecraftbyse.com/wp-content/uploads/2026/02/personalized-dad-heartbeat-frame-multiple-photos.webp-scaled.webp',
    timeAgo: '1 minute ago',
  },
  {
    id: '4',
    customerName: 'Sourav K.',
    city: 'Bhubaneswar',
    productName: 'Custom Birthday Collage Photo Frame',
    productImage: 'https://lovecraftbyse.com/wp-content/uploads/2026/03/custom-birthday-collage-photo-frame-personalized-name-date-1.jpg',
    timeAgo: '6 minutes ago',
  },
  {
    id: '5',
    customerName: 'Megha D.',
    city: 'Hyderabad',
    productName: 'Welcome Baby Birth Detail Frame',
    productImage: 'https://lovecraftbyse.com/wp-content/uploads/2025/02/welcome-baby-boy-scaled.webp',
    timeAgo: '3 minutes ago',
  },
  {
    id: '6',
    customerName: 'Vikram & Pooja',
    city: 'Kolkata',
    productName: 'Personalized Sibling Photo Collage Frame',
    productImage: 'https://lovecraftbyse.com/wp-content/uploads/2026/03/custom-birthday-collage-photo-frame-personalized-name-date-1.jpg',
    timeAgo: '5 minutes ago',
  },
];

export const RecentPurchaseToast: React.FC = () => {
  const [currentToast, setCurrentToast] = useState<PurchaseNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show first toast after 4 seconds
    const initialTimer = setTimeout(() => {
      triggerRandomToast();
    }, 4000);

    // Loop interval every 12 seconds
    const interval = setInterval(() => {
      triggerRandomToast();
    }, 12000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  const triggerRandomToast = () => {
    const randomItem = SAMPLE_NOTIFICATIONS[Math.floor(Math.random() * SAMPLE_NOTIFICATIONS.length)];
    setCurrentToast(randomItem);
    setIsVisible(true);

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 4500);
  };

  if (!currentToast || !isVisible) return null;

  return (
    <div className="fixed bottom-5 left-4 z-50 max-w-xs sm:max-w-sm bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-purple-200 shadow-2xl transition-all transform animate-bounce-short flex items-center gap-3 font-sans">
      <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border border-gray-200 shadow-xs">
        <img src={currentToast.productImage} alt={currentToast.productName} className="w-full h-full object-cover" />
        <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-0.5 rounded-tl-md">
          <CheckCircle2 className="w-3 h-3" />
        </div>
      </div>

      <div className="flex-1 min-w-0 text-xs">
        <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#160E4B]">
          <ShoppingBag className="w-3 h-3 text-[#F82BA9]" />
          <span className="truncate">{currentToast.customerName}</span>
          <span className="text-gray-400 font-normal">from</span>
          <span className="font-bold text-purple-700">{currentToast.city}</span>
        </div>
        <p className="text-[11px] font-bold text-gray-800 truncate mt-0.5">
          Purchased {currentToast.productName}
        </p>
        <p className="text-[10px] text-gray-400 font-semibold mt-0.5 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
          <span>Verified Purchase • {currentToast.timeAgo}</span>
        </p>
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
