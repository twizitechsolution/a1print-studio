import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck, Heart, Clock, Phone, Mail, Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';
import { SocialSettings } from '../admin/AdminStoreSettings';

interface FooterProps {
  onNavigate: (page: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [socials, setSocials] = useState<SocialSettings>({
    facebookUrl: 'https://facebook.com',
    instagramUrl: 'https://instagram.com',
    twitterUrl: 'https://twitter.com',
    linkedinUrl: 'https://linkedin.com',
  });

  useEffect(() => {
    const saved = localStorage.getItem('a1print_social_settings');
    if (saved) {
      try {
        setSocials(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  return (
    <footer className="bg-[#160E4B] text-white font-jost pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* 1. Trust Badges Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-white/10 text-center">
          <div className="flex flex-col items-center space-y-2 p-3 rounded-2xl bg-white/5 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-full bg-[#F82BA9] text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm">Premium Quality</h4>
            <p className="text-[11px] text-gray-300">Archival 300 GSM Matte Paper & Acrylic</p>
          </div>

          <div className="flex flex-col items-center space-y-2 p-3 rounded-2xl bg-white/5 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-full bg-[#F82BA9] text-white flex items-center justify-center shadow-md">
              <Heart className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm">Made with Love</h4>
            <p className="text-[11px] text-gray-300">Handcrafted Personalized Keepsakes</p>
          </div>

          <div className="flex flex-col items-center space-y-2 p-3 rounded-2xl bg-white/5 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-full bg-[#F82BA9] text-white flex items-center justify-center shadow-md">
              <Truck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm">Pan-India Express</h4>
            <p className="text-[11px] text-gray-300">Safe Damage-Proof Bubble Packaging</p>
          </div>

          <div className="flex flex-col items-center space-y-2 p-3 rounded-2xl bg-white/5 backdrop-blur-xs">
            <div className="w-10 h-10 rounded-full bg-[#F82BA9] text-white flex items-center justify-center shadow-md">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm">Fast Dispatch</h4>
            <p className="text-[11px] text-gray-300">24-48 Hours Order Processing</p>
          </div>
        </div>

        {/* 2. Footer Main Links Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#F82BA9] text-white font-black text-lg flex items-center justify-center shadow-md">
                A1
              </div>
              <span className="font-playfair font-black text-2xl tracking-tight text-white">
                A1<span className="text-[#F82BA9]">print</span> Studio
              </span>
            </div>
            <p className="text-gray-300 leading-relaxed">
              India's premier online studio for customized photo printing, milestone birth frames, anniversary art, and high-gloss acrylic wall decor.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#F82BA9] uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-gray-300 font-medium">
              <li><button onClick={() => onNavigate('home')} className="hover:text-white cursor-pointer">Home</button></li>
              <li><button onClick={() => onNavigate('about')} className="hover:text-white cursor-pointer">About Our Studio</button></li>
              <li><button onClick={() => onNavigate('catalog')} className="hover:text-white cursor-pointer">All Custom Products</button></li>
              <li><button onClick={() => onNavigate('contact')} className="hover:text-white cursor-pointer">Customer Support</button></li>
            </ul>
          </div>

          {/* Frame Collections */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-[#F82BA9] uppercase tracking-wider">Frame Collections</h4>
            <ul className="space-y-2 text-gray-300 font-medium">
              <li><button onClick={() => onNavigate('catalog', 'baby')} className="hover:text-white cursor-pointer">Baby Birth Frames</button></li>
              <li><button onClick={() => onNavigate('catalog', 'couple')} className="hover:text-white cursor-pointer">Anniversary & Love Frames</button></li>
              <li><button onClick={() => onNavigate('catalog', 'acrylic')} className="hover:text-white cursor-pointer">High-Gloss Acrylic Wall Frames</button></li>
              <li><button onClick={() => onNavigate('catalog', 'collage')} className="hover:text-white cursor-pointer">Multi-Photo Memory Collages</button></li>
            </ul>
          </div>

          {/* Contact Details & 4 Social Media Icons */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-[#F82BA9] uppercase tracking-wider">Connect & Follow Us</h4>
            
            <div className="space-y-2 text-gray-300">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#F82BA9] shrink-0" />
                <span>+91 95836 26786</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F82BA9] shrink-0" />
                <span>support@a1print.com</span>
              </p>
            </div>

            {/* 4 Social Media Handle Icons */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-gray-400 block mb-2">Follow our official channels:</span>
              <div className="flex items-center gap-3">
                <a
                  href={socials.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#F82BA9] text-white flex items-center justify-center transition-colors shadow-md"
                  title="Facebook Handle"
                >
                  <Facebook className="w-4 h-4" />
                </a>

                <a
                  href={socials.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#F82BA9] text-white flex items-center justify-center transition-colors shadow-md"
                  title="Instagram Handle"
                >
                  <Instagram className="w-4 h-4" />
                </a>

                <a
                  href={socials.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#F82BA9] text-white flex items-center justify-center transition-colors shadow-md"
                  title="Twitter / X Handle"
                >
                  <Twitter className="w-4 h-4" />
                </a>

                <a
                  href={socials.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#F82BA9] text-white flex items-center justify-center transition-colors shadow-md"
                  title="LinkedIn Handle"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* 3. Bottom Copyright Bar */}
        <div className="pt-6 border-t border-white/10 text-center text-xs text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 A1print Studio. All Rights Reserved.</p>
          <p className="text-[11px] text-gray-400">
            Handcrafted with ❤️ for your special memories
          </p>
        </div>

      </div>
    </footer>
  );
};
