import React, { useState } from 'react';
import { UniversalFrameTemplate, PhotoSlotConfig, TextZoneConfig } from '../../types/template';
import { Plus, Trash2, Image as ImageIcon, Type, Save, Eye, CheckCircle2, Sparkles, Layers, Sliders } from 'lucide-react';

interface AdminFrameBuilderProps {
  onSaveTemplate: (template: UniversalFrameTemplate) => void;
}

export const AdminFrameBuilder: React.FC<AdminFrameBuilderProps> = ({ onSaveTemplate }) => {
  const [title, setTitle] = useState('New Custom Photo Frame');
  const [category, setCategory] = useState('baby');
  const [basePrice, setBasePrice] = useState(699);
  const [originalPrice, setOriginalPrice] = useState(999);
  const [baseImageUrl, setBaseImageUrl] = useState('https://lovecraftbyse.com/wp-content/uploads/2025/02/welcome-baby-boy-scaled.webp');

  const [photoSlots, setPhotoSlots] = useState<PhotoSlotConfig[]>([
    {
      id: 'photo-1',
      label: 'Baby Photo',
      shape: 'circle',
      x: 50,
      y: 35,
      width: 32,
      height: 32,
      defaultPhotoUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'photo-2',
      label: 'Parents Photo',
      shape: 'circle',
      x: 82,
      y: 84,
      width: 22,
      height: 22,
      defaultPhotoUrl: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=400',
    },
  ]);

  const [textZones, setTextZones] = useState<TextZoneConfig[]>([
    {
      id: 'text-1',
      label: 'Baby Name',
      defaultValue: 'Arya Sharma',
      x: 50,
      y: 54,
      fontSize: 22,
      fontFamily: 'Playfair Display',
      color: '#0084B4',
      align: 'center',
      type: 'text',
    },
    {
      id: 'text-2',
      label: 'Date of Birth',
      defaultValue: '31 Jan 2025',
      x: 18,
      y: 36,
      fontSize: 12,
      fontFamily: 'Jost',
      color: '#111827',
      align: 'center',
      type: 'date',
    },
    {
      id: 'text-3',
      label: 'Hospital Name',
      defaultValue: 'Duya Hospital',
      x: 50,
      y: 67,
      fontSize: 13,
      fontFamily: 'Jost',
      color: '#111827',
      align: 'center',
      type: 'text',
    },
  ]);

  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [activeTextId, setActiveTextId] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Add Photo Slot
  const handleAddPhotoSlot = () => {
    const newId = `photo-${photoSlots.length + 1}`;
    setPhotoSlots([
      ...photoSlots,
      {
        id: newId,
        label: `Photo ${photoSlots.length + 1}`,
        shape: 'circle',
        x: 50,
        y: 50,
        width: 25,
        height: 25,
        defaultPhotoUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=400',
      },
    ]);
    setActiveSlotId(newId);
  };

  // Add Text Zone
  const handleAddTextZone = () => {
    const newId = `text-${textZones.length + 1}`;
    setTextZones([
      ...textZones,
      {
        id: newId,
        label: `Text Field ${textZones.length + 1}`,
        defaultValue: `Sample Text ${textZones.length + 1}`,
        x: 50,
        y: 60,
        fontSize: 16,
        fontFamily: 'Playfair Display',
        color: '#000000',
        align: 'center',
        type: 'text',
      },
    ]);
    setActiveTextId(newId);
  };

  // Remove Photo Slot
  const handleRemovePhotoSlot = (id: string) => {
    setPhotoSlots(photoSlots.filter((p) => p.id !== id));
    if (activeSlotId === id) setActiveSlotId(null);
  };

  // Remove Text Zone
  const handleRemoveTextZone = (id: string) => {
    setTextZones(textZones.filter((t) => t.id !== id));
    if (activeTextId === id) setActiveTextId(null);
  };

  // Publish Frame Template
  const handleSave = () => {
    const template: UniversalFrameTemplate = {
      id: `tmpl-${Date.now()}`,
      productId: `prod-${Date.now()}`,
      title,
      category,
      basePrice,
      originalPrice,
      baseImageUrl,
      photoSlots,
      textZones,
      createdAt: new Date().toISOString(),
    };

    onSaveTemplate(template);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 font-jost text-white">
      
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#121829] p-6 rounded-2xl border border-[#262E4A] shadow-xl">
        <div>
          <h2 className="font-playfair text-2xl font-extrabold text-white">
            No-Code Visual Frame Template Builder
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Upload any frame artwork, drag & define photo zones & dynamic text fields, and publish to the store in 1-click!
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:from-[#2563EB] hover:to-[#7C3AED] text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Save className="w-4 h-4" /> Publish Frame Template to Store
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Frame Template published successfully! It is now live for buyers on the storefront.</span>
        </div>
      )}

      {/* Main Builder Grid: Left Workspace Canvas & Right Tool Control Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Interactive Visual Canvas Workspace (7 Cols) */}
        <div className="lg:col-span-7 bg-[#121829] p-6 rounded-2xl border border-[#262E4A] shadow-xl flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center justify-between w-full text-xs text-gray-400 font-bold border-b border-[#262E4A] pb-3">
            <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-[#3B82F6]" /> Visual Canvas Editor</span>
            <span>Aspect Ratio: 3:4.4</span>
          </div>

          {/* Interactive Poster Canvas */}
          <div 
            className="relative w-full max-w-[380px] aspect-[3/4.4] rounded-xs border-8 border-black shadow-2xl bg-white overflow-hidden select-none font-serif"
          >
            {/* Base Background Artwork Image */}
            <img
              src={baseImageUrl}
              alt="Base Frame Artwork"
              className="w-full h-full object-cover absolute inset-0 pointer-events-none"
            />

            {/* Rendered Interactive Photo Zones */}
            {photoSlots.map((slot) => (
              <div
                key={slot.id}
                onClick={() => {
                  setActiveSlotId(slot.id);
                  setActiveTextId(null);
                }}
                className={`absolute transition-all cursor-pointer flex items-center justify-center border-2 ${
                  activeSlotId === slot.id
                    ? 'border-[#3B82F6] ring-4 ring-[#3B82F6]/50 z-30'
                    : 'border-dashed border-sky-400/80 hover:border-sky-500 z-20'
                } ${
                  slot.shape === 'circle'
                    ? 'rounded-full'
                    : slot.shape === 'rounded'
                    ? 'rounded-xl'
                    : 'rounded-none'
                }`}
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  width: `${slot.width}%`,
                  height: `${slot.height}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="w-full h-full overflow-hidden flex items-center justify-center rounded-[inherit] bg-sky-500/20 backdrop-blur-2xs">
                  <span className="text-[10px] font-sans font-black text-sky-900 bg-white/80 px-1.5 py-0.5 rounded-md shadow-2xs">
                    📷 {slot.label}
                  </span>
                </div>
              </div>
            ))}

            {/* Rendered Dynamic Text Zones */}
            {textZones.map((zone) => (
              <div
                key={zone.id}
                onClick={() => {
                  setActiveTextId(zone.id);
                  setActiveSlotId(null);
                }}
                className={`absolute cursor-pointer transition-all px-1.5 py-0.5 rounded-md ${
                  activeTextId === zone.id
                    ? 'border-2 border-[#F82BA9] bg-[#F82BA9]/20 z-30'
                    : 'hover:border border-dashed border-gray-400 z-20'
                }`}
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  transform: 'translate(-50%, -50%)',
                  color: zone.color,
                  fontFamily: zone.fontFamily,
                  fontSize: `${zone.fontSize * 0.7}px`,
                  fontWeight: 'bold',
                  textAlign: zone.align,
                }}
              >
                {zone.defaultValue}
              </div>
            ))}

          </div>
        </div>

        {/* Right Column: Settings & Layer Controls Inspector (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Base Frame Settings */}
          <div className="bg-[#121829] p-5 rounded-2xl border border-[#262E4A] shadow-xl space-y-4 text-xs">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#3B82F6]" /> Base Frame Details
            </h3>

            <div className="space-y-1">
              <label className="text-gray-400 font-bold">Frame Title :</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[#1A2035] border border-[#262E4A] text-white rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-gray-400 font-bold">Base Price (₹) :</label>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#1A2035] border border-[#262E4A] text-white rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-bold">Original Price (₹) :</label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#1A2035] border border-[#262E4A] text-white rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-gray-400 font-bold">Base Frame Poster Image URL :</label>
              <input
                type="text"
                value={baseImageUrl}
                onChange={(e) => setBaseImageUrl(e.target.value)}
                className="w-full px-3 py-2 bg-[#1A2035] border border-[#262E4A] text-white rounded-xl"
              />
            </div>
          </div>

          {/* Layer Management Tools (Photo Slots & Text Zones) */}
          <div className="bg-[#121829] p-5 rounded-2xl border border-[#262E4A] shadow-xl space-y-4 text-xs">
            
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Canvas Layer Tools</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddPhotoSlot}
                  className="px-3 py-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Photo Slot
                </button>
                <button
                  type="button"
                  onClick={handleAddTextZone}
                  className="px-3 py-1.5 bg-[#F82BA9] hover:bg-pink-600 text-white font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Text Zone
                </button>
              </div>
            </div>

            {/* Photo Slots Inspector */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-gray-300 text-xs uppercase tracking-wider">Photo Slots ({photoSlots.length})</h4>
              {photoSlots.map((slot) => (
                <div key={slot.id} className="p-3 bg-[#1A2035] rounded-xl border border-[#262E4A] space-y-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={slot.label}
                      onChange={(e) =>
                        setPhotoSlots(photoSlots.map((p) => (p.id === slot.id ? { ...p, label: e.target.value } : p)))
                      }
                      className="font-bold text-white bg-transparent border-b border-gray-600 px-1 text-xs"
                    />
                    <button
                      onClick={() => handleRemovePhotoSlot(slot.id)}
                      className="text-rose-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Positioning Sliders */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400">
                    <div>
                      <span>X Position: {slot.x}%</span>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        value={slot.x}
                        onChange={(e) =>
                          setPhotoSlots(photoSlots.map((p) => (p.id === slot.id ? { ...p, x: Number(e.target.value) } : p)))
                        }
                        className="w-full accent-[#3B82F6]"
                      />
                    </div>

                    <div>
                      <span>Y Position: {slot.y}%</span>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        value={slot.y}
                        onChange={(e) =>
                          setPhotoSlots(photoSlots.map((p) => (p.id === slot.id ? { ...p, y: Number(e.target.value) } : p)))
                        }
                        className="w-full accent-[#3B82F6]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Text Zones Inspector */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-gray-300 text-xs uppercase tracking-wider">Dynamic Text Zones ({textZones.length})</h4>
              {textZones.map((zone) => (
                <div key={zone.id} className="p-3 bg-[#1A2035] rounded-xl border border-[#262E4A] space-y-2">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={zone.label}
                      onChange={(e) =>
                        setTextZones(textZones.map((t) => (t.id === zone.id ? { ...t, label: e.target.value } : t)))
                      }
                      className="font-bold text-white bg-transparent border-b border-gray-600 px-1 text-xs"
                    />
                    <button
                      onClick={() => handleRemoveTextZone(zone.id)}
                      className="text-rose-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400">
                    <div>
                      <span>X Position: {zone.x}%</span>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        value={zone.x}
                        onChange={(e) =>
                          setTextZones(textZones.map((t) => (t.id === zone.id ? { ...t, x: Number(e.target.value) } : t)))
                        }
                        className="w-full accent-[#F82BA9]"
                      />
                    </div>

                    <div>
                      <span>Y Position: {zone.y}%</span>
                      <input
                        type="range"
                        min="5"
                        max="95"
                        value={zone.y}
                        onChange={(e) =>
                          setTextZones(textZones.map((t) => (t.id === zone.id ? { ...t, y: Number(e.target.value) } : t)))
                        }
                    <div>
                      <span>Field Type:</span>
                      <select
                        value={zone.type || 'text'}
                        onChange={(e) =>
                          setTextZones(textZones.map((t) => (t.id === zone.id ? { ...t, type: e.target.value as any } : t)))
                        }
                        className="w-full mt-1 p-1 bg-[#121626] border border-gray-600 rounded-md text-xs text-white"
                      >
                        <option value="text">Normal Text Input</option>
                        <option value="date">Date Dropdown Picker (Day/Month/Year)</option>
                        <option value="time">Time Dropdown Picker (Hour/Min/AM-PM)</option>
                        <option value="number">Number Input</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
