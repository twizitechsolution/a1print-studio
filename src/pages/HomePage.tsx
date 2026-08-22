import React, { useState } from 'react';
import { Product } from '../types';
import { useCartStore } from '../store/useCartStore';
import { ProductCard } from '../components/catalog/ProductCard';
import { ProductGrid } from '../components/catalog/ProductGrid';
import { ProductFrameDisplay } from '../components/catalog/ProductFrameDisplay';
import { Sparkles, ArrowRight, ShieldCheck, Heart, Truck, Star, Award, CheckCircle2, ChevronDown, HelpCircle, PackageCheck, Layers, Gift } from 'lucide-react';

interface HomePageProps {
  onSelectProduct: (product: Product) => void;
  onNavigate: (page: string, param?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectProduct, onNavigate }) => {
  const { products } = useCartStore();
  const featuredProducts = products.slice(0, 3);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const categoriesList = [
    {
      id: 'baby',
      title: 'Baby Birth Frame',
      price: 'Rs. 699',
      itemsCount: '85 items',
      icon: '👶',
      product: products[0],
      image: 'https://lovecraftbyse.com/wp-content/uploads/2025/02/welcome-baby-boy-scaled.webp',
    },
    {
      id: 'birthday',
      title: 'Birthday Gifts',
      price: 'Rs. 699',
      itemsCount: '59 items',
      icon: '🎂',
      product: products[1],
      image: 'https://lovecraftbyse.com/wp-content/uploads/2026/03/custom-birthday-collage-photo-frame-personalized-name-date-1.jpg',
    },
    {
      id: 'firstyear',
      title: 'First Year Photo Frames',
      price: 'Rs. 699',
      itemsCount: '24 items',
      icon: '👶',
      product: products[1],
      image: 'https://lovecraftbyse.com/wp-content/uploads/2026/03/custom-birthday-collage-photo-frame-personalized-name-date-1.jpg',
    },
    {
      id: 'family',
      title: 'Family Frame',
      price: 'Rs. 699',
      itemsCount: '19 items',
      icon: '🎁',
      product: products[2],
      image: 'https://lovecraftbyse.com/wp-content/uploads/2026/02/personalized-dad-heartbeat-frame-multiple-photos.webp-scaled.webp',
    },
  ];

  const faqs = [
    {
      q: 'Can I preview my customized frame live before placing an order?',
      a: 'Yes! Our website features a real-time interactive visualizer. Simply select your frame, upload your photos, enter custom details, and watch your frame render live on screen before checkout.',
    },
    {
      q: 'What is the printing paper quality and frame material?',
      a: 'We print exclusively on 300 GSM Archival Premium Matte Paper using museum-grade fade-proof inks. Each frame comes with a shatterproof acrylic glass overlay and solid synthetic black wood molding.',
    },
    {
      q: 'Is Cash on Delivery (COD) available across India?',
      a: 'Yes, Cash on Delivery is available for all pin codes across India! We also offer an extra 9% discount on prepaid orders via PhonePe, UPI, or Credit Cards.',
    },
    {
      q: 'How long does delivery take?',
      a: 'Orders are printed and dispatched within 24-48 hours. Express courier shipping typically takes 3 to 5 business days to deliver to your doorstep anywhere in India.',
    },
    {
      q: 'What if my frame arrives damaged during transit?',
      a: 'We pack every order in 100% damage-proof 5-layer bubble wrap. If your order is damaged in transit, simply send us a photo on WhatsApp (+91 95836 26786) and we will send a 100% free replacement immediately!',
    },
  ];

  return (
    <div className="space-y-16 pb-16 font-sans select-none">
      
      {/* 1. LovecraftbySE Style Soft Pastel Hero Banner (media_1787427720363.png) */}
      <section className="relative bg-gradient-to-r from-[#FFF0F5] via-[#FFF5F8] to-[#FDF2F8] py-16 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden font-jost border-b border-pink-100">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Text & CTA Content */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="space-y-2">
              <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#160E4B] leading-tight">
                Turn Your Memories <br />
                <span className="text-[#F82BA9] font-black italic relative inline-block">
                  Into Beautiful Gifts
                  <span className="absolute -bottom-2 left-0 right-0 h-1.5 bg-[#F82BA9]/20 rounded-full" />
                </span>
              </h1>

              <p className="text-sm sm:text-base text-gray-600 max-w-lg mx-auto lg:mx-0 leading-relaxed pt-2">
                At A1print Studio, we make special gifts to make your moments truly memorable, with love and care.
              </p>
            </div>

            {/* CTA Button (LovecraftbySE Style) */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => onNavigate('catalog')}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#3C187B] to-[#F82BA9] hover:from-[#2A1058] hover:to-[#D61B90] text-white font-extrabold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                Shop Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 3 White Pill Badges (LovecraftbySE Style) */}
            <div className="grid grid-cols-3 gap-3 pt-6 max-w-lg mx-auto lg:mx-0 text-center text-xs font-extrabold text-[#160E4B]">
              <div className="p-3.5 rounded-2xl bg-white border border-pink-200 shadow-xs flex items-center justify-center gap-2">
                <Award className="w-4 h-4 text-[#F82BA9] shrink-0" />
                <span>Premium Quality</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-pink-200 shadow-xs flex items-center justify-center gap-2">
                <Heart className="w-4 h-4 text-[#F82BA9] shrink-0" />
                <span>Make with Love</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-pink-200 shadow-xs flex items-center justify-center gap-2">
                <Truck className="w-4 h-4 text-[#F82BA9] shrink-0" />
                <span>Fast Delivery</span>
              </div>
            </div>

          </div>

          {/* Right Side Trio 3-Frame Showcase (LovecraftbySE Style) */}
          <div className="lg:col-span-6 relative flex items-center justify-center pt-4 lg:pt-0">
            <div className="relative w-full max-w-lg flex items-center justify-center gap-2 sm:gap-4">
              
              {/* Left Secondary Frame */}
              <div className="w-1/3 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                {products[1] && <ProductFrameDisplay product={products[1]} fontScale={0.5} />}
              </div>

              {/* Center Main Featured Frame (Elevated) */}
              <div 
                onClick={() => products[0] && onSelectProduct(products[0])}
                className="w-1/2 relative transform hover:scale-105 transition-all duration-300 cursor-pointer group z-20"
              >
                {products[0] && <ProductFrameDisplay product={products[0]} fontScale={0.65} className="shadow-[0_25px_60px_rgba(0,0,0,0.5)] border-8 sm:border-[12px]" />}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 rounded-xs">
                  <span className="px-4 py-2 bg-[#F82BA9] text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5">
                    Customize Live <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Right Secondary Frame */}
              <div className="w-1/3 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                {products[2] && <ProductFrameDisplay product={products[2]} fontScale={0.5} />}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 2. 100% LovecraftbySE EXPLORE TOP CATEGORIES Section (media_1787433369276.png) */}
      <section className="bg-gradient-to-b from-[#FFF5F8] via-[#FDF2F8] to-white py-16 px-4 sm:px-6 lg:px-8 font-jost border-y border-pink-100/60">
        <div className="max-w-[1400px] mx-auto space-y-10">
          
          <div className="text-center space-y-2">
            <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold text-[#F82BA9] uppercase tracking-wider">
              EXPLORE TOP CATEGORIES
            </h2>
            <div className="flex items-center justify-center gap-2 text-pink-300">
              <span className="h-px w-8 bg-pink-300" />
              <span className="text-xs">💖</span>
              <span className="h-px w-8 bg-pink-300" />
            </div>
            <p className="text-sm font-semibold text-gray-700">
              Find the perfect gift for every occasion
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoriesList.map((cat) => (
              <div
                key={cat.id}
                onClick={() => onNavigate('catalog')}
                className="bg-white rounded-3xl border border-pink-100 shadow-md hover:shadow-xl transition-all duration-300 p-4 group cursor-pointer space-y-4 flex flex-col justify-between"
              >
                {/* Card Top Image & Badges Container */}
                <div className="relative w-full aspect-3/4 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center p-2">
                  
                  {/* Top-Left Starts at Rs. 699 Badge */}
                  <div className="absolute top-3 left-3 z-20">
                    <span className="px-3 py-1 bg-[#F82BA9] text-white text-[11px] font-extrabold rounded-full shadow-md uppercase tracking-wider">
                      Starts at {cat.price}
                    </span>
                  </div>

                  {/* Top-Right Circle Icon */}
                  <div className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-gradient-to-r from-[#160E4B] to-[#3C187B] text-white flex items-center justify-center text-sm shadow-md">
                    {cat.icon}
                  </div>

                  {/* Frame Display Image */}
                  <div className="w-full h-full relative rounded-xl overflow-hidden">
                    {cat.product ? (
                      <ProductFrameDisplay product={cat.product} fontScale={0.5} />
                    ) : (
                      <img
                        src={cat.image}
                        alt={cat.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                  </div>
                </div>

                {/* Card Title & Heart divider */}
                <div className="text-center space-y-1">
                  <h3 className="font-playfair text-lg font-extrabold text-[#160E4B] group-hover:text-[#F82BA9] transition-colors">
                    {cat.title}
                  </h3>
                  <div className="text-[10px] text-pink-400 font-bold flex items-center justify-center gap-1">
                    <span>•</span> <span>💖</span> <span>•</span>
                  </div>
                </div>

                {/* Card Footer Pills */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                  <span className="px-3 py-1.5 bg-pink-50 text-[#F82BA9] font-extrabold rounded-full border border-pink-200 text-[11px]">
                    {cat.itemsCount}
                  </span>

                  <button
                    type="button"
                    className="px-4 py-2 bg-gradient-to-r from-[#3C187B] to-[#F82BA9] text-white font-extrabold text-xs rounded-xl shadow-xs hover:from-[#2A1058] hover:to-[#D61B90] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Shop Now <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 3. How It Works - 3 Easy Customization Steps Banner */}
      <section className="bg-purple-50/60 border-y border-purple-100 py-12 px-4 sm:px-6 lg:px-8 font-jost">
        <div className="max-w-[1400px] mx-auto space-y-8 text-center">
          <div className="space-y-2">
            <span className="text-xs font-extrabold text-[#F82BA9] uppercase tracking-widest">Simple & Fast</span>
            <h2 className="font-playfair text-3xl font-extrabold text-[#160E4B]">
              How Live Customization Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs space-y-3 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-[#F82BA9] font-extrabold text-xl flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-base text-[#160E4B]">Pick a Frame Template</h3>
              <p className="text-xs text-gray-500">Choose from Baby Birth, Anniversary Story, or Dad Collage designs.</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs space-y-3 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-[#F82BA9] font-extrabold text-xl flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-base text-[#160E4B]">Upload Photos & Text</h3>
              <p className="text-xs text-gray-500">Crop your favorite photos and enter personalized names, dates, or quotes.</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs space-y-3 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-[#F82BA9] font-extrabold text-xl flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-base text-[#160E4B]">Live Preview & Fast Delivery</h3>
              <p className="text-xs text-gray-500">Inspect the live high-res frame preview and get express 3-5 days delivery!</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Featured Bestselling Products */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 font-jost">
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold text-[#F82BA9] uppercase tracking-widest">Bestselling Collection</span>
          <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold text-[#160E4B]">
            Most Popular Photo Frames
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      </section>

      {/* 5. Complete Product Grid */}
      <ProductGrid onSelectProduct={onSelectProduct} />

      {/* 6. Material & Quality Showcase Section */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 font-jost">
        <div className="bg-[#160E4B] text-white p-8 sm:p-12 rounded-3xl shadow-xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold text-pink-400 uppercase tracking-widest">Uncompromising Quality</span>
            <h2 className="font-playfair text-3xl sm:text-4xl font-extrabold">Crafted With Museum-Grade Materials</h2>
            <p className="text-xs text-purple-200">We take pride in delivering archival keepsakes that last a lifetime.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 bg-white/10 rounded-2xl border border-white/10 space-y-2 text-center">
              <Award className="w-8 h-8 text-[#F82BA9] mx-auto" />
              <h4 className="font-bold text-sm">300 GSM Matte Paper</h4>
              <p className="text-xs text-purple-200">Heavyweight archival paper with rich color depth.</p>
            </div>

            <div className="p-5 bg-white/10 rounded-2xl border border-white/10 space-y-2 text-center">
              <ShieldCheck className="w-8 h-8 text-[#F82BA9] mx-auto" />
              <h4 className="font-bold text-sm">Acrylic Glass Overlay</h4>
              <p className="text-xs text-purple-200">High-gloss shatterproof acrylic overlay protection.</p>
            </div>

            <div className="p-5 bg-white/10 rounded-2xl border border-white/10 space-y-2 text-center">
              <PackageCheck className="w-8 h-8 text-[#F82BA9] mx-auto" />
              <h4 className="font-bold text-sm">Damage-Proof Packaging</h4>
              <p className="text-xs text-purple-200">5-layer bubble wrap packaging for 100% safe transit.</p>
            </div>

            <div className="p-5 bg-white/10 rounded-2xl border border-white/10 space-y-2 text-center">
              <Truck className="w-8 h-8 text-[#F82BA9] mx-auto" />
              <h4 className="font-bold text-sm">Express Pan-India Shipping</h4>
              <p className="text-xs text-purple-200">Delivered to your doorstep in 3 to 5 business days.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ Accordion Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 font-jost">
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold text-[#F82BA9] uppercase tracking-widest">Help Center</span>
          <h2 className="font-playfair text-3xl font-extrabold text-[#160E4B]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-sm text-[#160E4B] flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#F82BA9] shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-[#F82BA9]' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};
