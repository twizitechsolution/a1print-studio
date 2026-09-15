import React, { useRef } from 'react';
import { PhotoSlotConfig, TextZoneConfig, FrameCutoutShape } from '../../../types/template';
import { SelectedLayer } from '../types';
import { StudioVisibilityInspector } from './StudioVisibilityInspector';
import { Sliders, Shapes, Type, Palette, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon, Upload } from 'lucide-react';
import { uploadCategoryImage } from '../../../config/firebase';

interface StudioPropertiesPanelProps {
  selectedLayer: SelectedLayer | null;
  slot: PhotoSlotConfig | null;
  zone: TextZoneConfig | null;
  onUpdateSlot: (slot: PhotoSlotConfig) => void;
  onUpdateZone: (zone: TextZoneConfig) => void;
}

const SHAPES: { value: FrameCutoutShape; label: string; icon: string }[] = [
  { value: 'circle', label: 'Circle', icon: '⭕' },
  { value: 'rounded', label: 'Rounded', icon: '🔲' },
  { value: 'rectangle', label: 'Rectangle', icon: '▭' },
  { value: 'square', label: 'Square', icon: '⏹' },
  { value: 'oval', label: 'Oval', icon: '⬭' },
  { value: 'heart', label: 'Heart', icon: '❤️' },
  { value: 'arch', label: 'Arch Window', icon: '🚪' },
  { value: 'star', label: 'Star', icon: '⭐' },
  { value: 'shield', label: 'Shield', icon: '🛡️' },
  { value: 'diamond', label: 'Diamond', icon: '🔷' },
  { value: 'hexagon', label: 'Hexagon', icon: '⬡' },
  { value: 'cloud', label: 'Cloud', icon: '☁️' },
  { value: 'polaroid', label: 'Polaroid', icon: '📷' },
];

const FONTS = [
  'Playfair Display',
  'Jost',
  'Montserrat',
  'Great Vibes',
  'Cinzel',
  'Dancing Script',
  'Georgia',
  'Arial',
];

export const StudioPropertiesPanel: React.FC<StudioPropertiesPanelProps> = ({
  selectedLayer,
  slot,
  zone,
  onUpdateSlot,
  onUpdateZone,
}) => {
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  if (!selectedLayer || (!slot && !zone)) {
    return (
      <div className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 p-6 flex flex-col items-center justify-center text-center space-y-3 text-slate-400 select-none">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-pink-400">
          <Sliders className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-sm text-slate-200">No Layer Selected</h4>
        <p className="text-xs text-slate-500 max-w-xs">
          Click any photo slot or text layer on the canvas or layer list to configure coordinates, styling & customer visibility.
        </p>
      </div>
    );
  }

  // PHOTO SLOT INSPECTOR
  if (selectedLayer.type === 'slot' && slot) {
    return (
      <div className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 p-4 space-y-5 overflow-y-auto text-white select-none text-xs">
        
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-pink-500" />
            <h3 className="font-bold text-sm text-slate-100 truncate max-w-[170px]">{slot.label || slot.id}</h3>
          </div>
          <span className="text-[10px] font-mono text-pink-400 font-bold bg-pink-950/40 px-2 py-0.5 rounded-md border border-pink-500/30">
            PHOTO
          </span>
        </div>

        {/* Slot Label */}
        <div className="space-y-1">
          <label className="font-bold text-slate-300">Internal Admin Label:</label>
          <input
            type="text"
            value={slot.label}
            onChange={(e) => onUpdateSlot({ ...slot, label: e.target.value })}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-pink-500 focus:outline-hidden"
          />
        </div>

        {/* Shape Mask Selector */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-300 flex items-center gap-1.5">
            <Shapes className="w-3.5 h-3.5 text-pink-400" /> Cutout Shape Mask:
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {SHAPES.map((s) => (
              <button
                key={s.value}
                onClick={() => onUpdateSlot({ ...slot, shape: s.value })}
                className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  slot.shape === s.value
                    ? 'bg-pink-600/30 border-pink-500 text-white'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <span className="text-base">{s.icon}</span>
                <span className="truncate w-full text-center">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Geometric Coordinates (X, Y, Width, Height) */}
        <div className="space-y-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
          <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-400 block">
            Canvas Geometry (% Percentages)
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] text-slate-400 font-bold">X Center ({slot.x}%)</label>
              <input
                type="number"
                value={slot.x}
                min={0}
                max={100}
                step={0.5}
                onChange={(e) => onUpdateSlot({ ...slot, x: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold">Y Center ({slot.y}%)</label>
              <input
                type="number"
                value={slot.y}
                min={0}
                max={100}
                step={0.5}
                onChange={(e) => onUpdateSlot({ ...slot, y: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold">Width ({slot.width}%)</label>
              <input
                type="number"
                value={slot.width}
                min={5}
                max={100}
                step={0.5}
                onChange={(e) => onUpdateSlot({ ...slot, width: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold">Height ({slot.height}%)</label>
              <input
                type="number"
                value={slot.height}
                min={5}
                max={100}
                step={0.5}
                onChange={(e) => onUpdateSlot({ ...slot, height: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Default Sample Photo */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-300">Default Sample Photo URL:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={slot.defaultPhotoUrl || ''}
              onChange={(e) => onUpdateSlot({ ...slot, defaultPhotoUrl: e.target.value })}
              placeholder="https://..."
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-pink-500 focus:outline-hidden font-mono text-[11px]"
            />
            <input
              type="file"
              ref={photoInputRef}
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    const url = await uploadCategoryImage('slots', file, `slot-${slot.id}`);
                    onUpdateSlot({ ...slot, defaultPhotoUrl: url });
                  } catch (err) {
                    const r = new FileReader();
                    r.onload = () => onUpdateSlot({ ...slot, defaultPhotoUrl: r.result as string });
                    r.readAsDataURL(file);
                  }
                }
              }}
            />
            <button
              onClick={() => photoInputRef.current?.click()}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer"
              title="Upload Sample Photo"
            >
              <Upload className="w-4 h-4 text-pink-400" />
            </button>
          </div>
        </div>

        {/* Customer Visibility Inspector */}
        <StudioVisibilityInspector
          layerName={slot.label || slot.id}
          visibility={slot.visibility}
          onChange={(newVis) => onUpdateSlot({ ...slot, visibility: newVis })}
        />

      </div>
    );
  }

  // TEXT ZONE INSPECTOR
  if (selectedLayer.type === 'zone' && zone) {
    const isCal = zone.type === 'calendar' || zone.isCalendar;

    return (
      <div className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 p-4 space-y-5 overflow-y-auto text-white select-none text-xs">
        
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-slate-100 truncate max-w-[170px]">{zone.label || zone.id}</h3>
          </div>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
            isCal ? 'bg-amber-950/40 text-amber-300 border-amber-500/30' : 'bg-purple-950/40 text-purple-300 border-purple-500/30'
          }`}>
            {isCal ? 'CALENDAR' : 'TEXT'}
          </span>
        </div>

        {/* Text Zone Type */}
        <div className="space-y-1">
          <label className="font-bold text-slate-300">Zone Type:</label>
          <select
            value={zone.type}
            onChange={(e) => {
              const newType = e.target.value as any;
              onUpdateZone({
                ...zone,
                type: newType,
                isCalendar: newType === 'calendar',
              });
            }}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-purple-500 focus:outline-hidden font-bold cursor-pointer"
          >
            <option value="text">General Text</option>
            <option value="date">Date (e.g. 14 Feb 2026)</option>
            <option value="time">Time (e.g. 10:45 AM)</option>
            <option value="number">Numeric / Weight / Metric</option>
            <option value="calendar">🗓️ Interactive Calendar Grid</option>
            <option value="message">Personal Message / Wishes</option>
          </select>
        </div>

        {/* Default Text Value */}
        <div className="space-y-1">
          <label className="font-bold text-slate-300">Default Value / Sample:</label>
          <input
            type="text"
            value={zone.defaultValue}
            onChange={(e) => onUpdateZone({ ...zone, defaultValue: e.target.value })}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl focus:border-purple-500 focus:outline-hidden font-medium"
          />
        </div>

        {/* Typography: Font Family & Size */}
        <div className="space-y-2.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
          <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-400 block">
            Typography & Styling
          </span>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold">Font Family:</label>
            <select
              value={zone.fontFamily}
              onChange={(e) => onUpdateZone({ ...zone, fontFamily: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-bold cursor-pointer"
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 font-bold">Font Size ({zone.fontSize}px)</label>
              <input
                type="number"
                value={zone.fontSize}
                min={8}
                max={72}
                onChange={(e) => onUpdateZone({ ...zone, fontSize: Number(e.target.value) })}
                className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold">Text Color</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={zone.color || '#160E4B'}
                  onChange={(e) => onUpdateZone({ ...zone, color: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={zone.color || '#160E4B'}
                  onChange={(e) => onUpdateZone({ ...zone, color: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Alignment */}
          <div className="space-y-1 pt-1">
            <label className="text-[10px] text-slate-400 font-bold">Alignment:</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => onUpdateZone({ ...zone, align })}
                  className={`py-1.5 rounded-lg border text-xs font-bold flex items-center justify-center capitalize cursor-pointer transition-colors ${
                    zone.align === align
                      ? 'bg-purple-600/30 border-purple-500 text-white'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  {align === 'left' && <AlignLeft className="w-3.5 h-3.5 mr-1" />}
                  {align === 'center' && <AlignCenter className="w-3.5 h-3.5 mr-1" />}
                  {align === 'right' && <AlignRight className="w-3.5 h-3.5 mr-1" />}
                  {align}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
          <div>
            <label className="text-[10px] text-slate-400 font-bold">X Position ({zone.x}%)</label>
            <input
              type="number"
              value={zone.x}
              min={0}
              max={100}
              step={0.5}
              onChange={(e) => onUpdateZone({ ...zone, x: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-bold">Y Position ({zone.y}%)</label>
            <input
              type="number"
              value={zone.y}
              min={0}
              max={100}
              step={0.5}
              onChange={(e) => onUpdateZone({ ...zone, y: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
            />
          </div>
        </div>

        {/* Customer Visibility Inspector */}
        <StudioVisibilityInspector
          layerName={zone.label || zone.id}
          visibility={zone.visibility}
          onChange={(newVis) => onUpdateZone({ ...zone, visibility: newVis })}
        />

      </div>
    );
  }

  return null;
};
