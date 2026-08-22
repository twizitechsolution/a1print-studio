import React from 'react';
import { Heart, Award, ShieldCheck, Truck, Sparkles } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="px-3 py-1 bg-[#F82BA9]/10 text-[#F82BA9] font-bold text-xs rounded-full uppercase tracking-wider font-jost">
          ABOUT LOVECRAFT.A1
        </span>
        <h1 className="font-playfair text-4xl font-extrabold text-[#160E4B]">
          Making Your Moments Truly Memorable
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed font-sans">
          At Lovecraft.A1, we believe every memory deserves to be celebrated. From baby birth statistics to wedding anniversary milestones, we craft premium personalized photo gifts with love and care.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-jost">
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-2 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F82BA9]/10 text-[#F82BA9] flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-[#160E4B]">Archival Print Studio</h3>
          <p className="text-xs text-gray-500">
            We use 300+ DPI high-definition ultra-vivid inks and anti-fade photo paper guaranteed to last a lifetime.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-2 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F82BA9]/10 text-[#F82BA9] flex items-center justify-center mx-auto mb-3">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <h3 className="font-bold text-base text-[#160E4B]">Made with Love & Care</h3>
          <p className="text-xs text-gray-500">
            Each frame is handcrafted, inspected for perfection, and carefully wrapped to protect against transit damage.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-2 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F82BA9]/10 text-[#F82BA9] flex items-center justify-center mx-auto mb-3">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-[#160E4B]">Free Pan-India Delivery</h3>
          <p className="text-xs text-gray-500">
            We deliver to over 26,000+ Indian pincodes with live SMS tracking and Cash on Delivery options.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="p-8 bg-gradient-to-r from-[#160E4B] to-[#3C187B] text-white rounded-3xl text-center space-y-4 shadow-xl">
        <h2 className="font-playfair text-2xl font-bold">Ready to Create Your Custom Gift?</h2>
        <p className="text-xs text-gray-300 max-w-md mx-auto">
          Explore our collection of baby frames, couple anniversary gifts, acrylic glass prints, and photo collages.
        </p>
        <button
          onClick={() => onNavigate('catalog')}
          className="px-8 py-3.5 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-bold font-jost text-sm rounded-xl shadow-md transition-all"
        >
          Explore Gift Shop
        </button>
      </div>
    </div>
  );
};
