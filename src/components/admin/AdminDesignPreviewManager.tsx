import React, { useState } from 'react';
import { Palette, Eye, Image as ImageIcon, Sliders, Check } from 'lucide-react';

export const AdminDesignPreviewManager: React.FC = () => {
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [watermarkText, setWatermarkText] = useState('A1PRINT STUDIO SAMPLE');
  const [defaultBorderColor, setDefaultBorderColor] = useState('#000000');
  const [defaultFontFamily, setDefaultFontFamily] = useState('Playfair Display');

  return (
    <div className="space-y-6 font-jost">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-playfair text-xl font-bold text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" /> Design & Live Preview Engine Settings
          </h3>
          <p className="text-xs text-gray-400">Configure canvas preview watermarks, default background colors, and template font styling defaults.</p>
        </div>
      </div>

      {/* Watermark Protection Card */}
      <div className="p-5 bg-[#121829] rounded-2xl border border-[#262E4A] space-y-4 shadow-xl">
        <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <Eye className="w-4 h-4 text-purple-400" /> Preview Canvas Watermark Protection
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-8 space-y-2">
            <label className="flex items-center gap-2 text-xs text-gray-300 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={watermarkEnabled}
                onChange={(e) => setWatermarkEnabled(e.target.checked)}
                className="rounded-md bg-[#1A2035] border-[#262E4A]"
              />
              Enable Anti-Piracy Watermark on Unsaved Preview Modals
            </label>
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="Watermark Text"
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3.5 py-2 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-hidden font-mono"
            />
          </div>
          <div className="sm:col-span-4 flex items-center justify-center p-4 bg-[#1A2035] rounded-xl border border-[#262E4A] relative overflow-hidden">
            <span className="font-bold text-xs text-gray-400">Sample Frame</span>
            {watermarkEnabled && (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-white/20 uppercase rotate-12 select-none">
                {watermarkText}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Default Canvas Defaults */}
      <div className="p-5 bg-[#121829] rounded-2xl border border-[#262E4A] space-y-4 shadow-xl">
        <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" /> Global Canvas Defaults
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-bold block">Default Frame Molding Border Color:</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={defaultBorderColor}
                onChange={(e) => setDefaultBorderColor(e.target.value)}
                className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
              />
              <span className="font-mono text-xs text-white font-extrabold">{defaultBorderColor}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-bold block">Default Header Font Family:</label>
            <select
              value={defaultFontFamily}
              onChange={(e) => setDefaultFontFamily(e.target.value)}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3.5 py-2 rounded-xl text-xs text-white font-bold focus:outline-hidden"
            >
              <option value="Playfair Display">Playfair Display (Elegant Serif)</option>
              <option value="Great Vibes">Great Vibes (Script Cursive)</option>
              <option value="Poppins">Poppins (Clean Sans)</option>
              <option value="Cinzel">Cinzel (Luxury Roman)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
