import React from 'react';
import { MessageCircle } from 'lucide-react';

export const FloatingWhatsApp: React.FC = () => {
  const handleWhatsAppClick = () => {
    const message = encodeURIComponent("Hi LoveCraft.A1, I need help ordering a custom photo frame!");
    window.open(`https://wa.me/919583626786?text=${message}`, '_blank');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 bg-[#02AB02] text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
      aria-label="Chat on WhatsApp"
      title="Chat with Us on WhatsApp (+91 95836 26786)"
    >
      <MessageCircle className="w-7 h-7 fill-current" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap text-xs font-bold pl-0 group-hover:pl-2 font-jost">
        Chat with Us
      </span>
    </button>
  );
};
