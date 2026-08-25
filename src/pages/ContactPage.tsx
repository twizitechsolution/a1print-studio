import React, { useState, useEffect } from 'react';
import { Mail, Phone, Send, CheckCircle2, Share2, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import { SocialSettings } from '../components/admin/AdminStoreSettings';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 font-sans select-none">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="px-3 py-1 bg-[#F82BA9]/10 text-[#F82BA9] font-bold text-xs rounded-full uppercase tracking-wider font-jost">
          GET IN TOUCH
        </span>
        <h1 className="font-playfair text-4xl font-extrabold text-[#160E4B]">
          Contact A1print Studio Support
        </h1>
        <p className="text-xs text-gray-600">
          Have questions about your custom order or need assistance with live customization?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Info Cards (5 Cols) */}
        <div className="md:col-span-5 space-y-4 font-jost">
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#F82BA9] flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#160E4B]">Customer Support Phone</h4>
              <p className="text-xs text-gray-600">+91 95836 26786 (10 AM - 7 PM)</p>
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#F82BA9] flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#160E4B]">Email Support</h4>
              <p className="text-xs text-gray-600">support@a1print.com</p>
            </div>
          </div>

          {/* Social Media Links Card */}
          <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#F82BA9] flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#160E4B]">Official Social Media Handles</h4>
                <p className="text-[11px] text-gray-500">Connect with us on official channels</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={socials.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-[#F82BA9] text-gray-700 hover:text-white flex items-center justify-center transition-colors shadow-2xs"
                title="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>

              <a
                href={socials.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-[#F82BA9] text-gray-700 hover:text-white flex items-center justify-center transition-colors shadow-2xs"
                title="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>

              <a
                href={socials.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-[#F82BA9] text-gray-700 hover:text-white flex items-center justify-center transition-colors shadow-2xs"
                title="Twitter / X"
              >
                <Twitter className="w-5 h-5" />
              </a>

              <a
                href={socials.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-[#F82BA9] text-gray-700 hover:text-white flex items-center justify-center transition-colors shadow-2xs"
                title="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Contact Form (7 Cols) */}
        <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          {submitted ? (
            <div className="p-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="font-jost font-bold text-lg text-[#160E4B]">Message Sent Successfully!</h3>
              <p className="text-xs text-gray-600">
                Our support team will get back to you within 2-4 business hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-jost font-bold text-lg text-[#160E4B] mb-4">Send Us a Message</h3>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-hidden focus:border-[#F82BA9]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Mobile Phone / Email</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9583626786 or email@domain.com"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-hidden focus:border-[#F82BA9]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">How can we help you?</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Ask a question about frame customization, order tracking, or delivery..."
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-hidden focus:border-[#F82BA9]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" /> Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
