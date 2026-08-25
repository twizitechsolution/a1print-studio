import React, { useState, useEffect } from 'react';
import { Palette, Eye, Image as ImageIcon, Sliders, Check, Save } from 'lucide-react';
import { firebaseCloudDb } from '../../config/firebase';

export interface WatermarkSettings {
  enabled: boolean;
  text: string;
}

export const AdminDesignPreviewManager: React.FC = () => {
  const [watermarkEnabled, setWatermarkEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('a1print_watermark_settings');
    if (saved) {
      try { return JSON.parse(saved).enabled; } catch (e) {}
    }
    return true;
  });

  const [watermarkText, setWatermarkText] = useState<string>(() => {
    const saved = localStorage.getItem('a1print_watermark_settings');
    if (saved) {
      try { return JSON.parse(saved).text || 'A1PRINT STUDIO SAMPLE'; } catch (e) {}
    }
    return 'A1PRINT STUDIO SAMPLE';
  });

  const [defaultBorderColor, setDefaultBorderColor] = useState('#000000');
  const [defaultFontFamily, setDefaultFontFamily] = useState('Playfair Display');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    // Load watermark settings from Firestore on mount if available
    const loadFromCloud = async () => {
      const docs = await firebaseCloudDb.getCollection('store_settings');
      const watermarkDoc = docs.find((d) => d.id === 'watermark');
      if (watermarkDoc) {
        setWatermarkEnabled(watermarkDoc.enabled !== false);
        if (watermarkDoc.text) setWatermarkText(watermarkDoc.text);
      }
    };
    loadFromCloud();
  }, []);

  const handleSaveSettings = async () => {
    const payload = { enabled: watermarkEnabled, text: watermarkText };
    localStorage.setItem('a1print_watermark_settings', JSON.stringify(payload));
    await firebaseCloudDb.setDocument('store_settings', 'watermark', payload);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 font-jost">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-playfair text-xl font-bold text-white flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" /> Live Preview Settings & Anti-Piracy Watermark
          </h3>
          <p className="text-xs text-gray-400">Configure canvas preview watermarks, default background colors, and template font styling defaults.</p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" /> Save Watermark Settings
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>✅ Live Preview Watermark Settings saved successfully to live database!</span>
        </div>
      )}

      {/* Watermark Protection Card */}
      <div className="p-5 bg-[#121829] rounded-2xl border border-[#262E4A] space-y-4 shadow-xl">
        <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <Eye className="w-4 h-4 text-purple-400" /> Live Preview Canvas Watermark Protection
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-8 space-y-3">
            <label className="flex items-center gap-2 text-xs text-gray-300 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={watermarkEnabled}
                onChange={(e) => {
                  setWatermarkEnabled(e.target.checked);
                  localStorage.setItem(
                    'a1print_watermark_settings',
                    JSON.stringify({ enabled: e.target.checked, text: watermarkText })
                  );
                }}
                className="rounded-md bg-[#1A2035] border-[#262E4A]"
              />
              Enable Anti-Piracy Watermark Overlay on Storefront Preview Modals
            </label>
            <div>
              <label className="text-[11px] font-bold text-gray-400 block mb-1">Watermark Overlay Text:</label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => {
                  setWatermarkText(e.target.value);
                  localStorage.setItem(
                    'a1print_watermark_settings',
                    JSON.stringify({ enabled: watermarkEnabled, text: e.target.value })
                  );
                }}
                placeholder="Watermark Text (e.g. A1PRINT STUDIO SAMPLE)"
                className="w-full bg-[#1A2035] border border-[#262E4A] px-3.5 py-2 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>
          <div className="sm:col-span-4 flex items-center justify-center p-4 bg-[#1A2035] rounded-xl border border-[#262E4A] relative overflow-hidden min-h-[100px]">
            <span className="font-bold text-xs text-gray-400">Sample Frame</span>
            {watermarkEnabled && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                <span className="text-[11px] font-extrabold text-pink-400/50 uppercase -rotate-12 select-none px-2 py-1 border border-pink-400/40 rounded-md">
                  {watermarkText}
                </span>
              </div>
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
