import React from 'react';
import { UniversalFrameTemplate, PhotoSlotConfig, TextZoneConfig, FrameCutoutShape } from '../../../types/template';
import { SelectedLayer } from '../types';
import { Plus, Eye, EyeOff, Lock, Unlock, Trash2, Image as ImageIcon, Type, Calendar, Sparkles } from 'lucide-react';
import { resolveVisibility } from '../utils/templateDefaults';

interface StudioLayerPanelProps {
  template: UniversalFrameTemplate;
  selectedLayer: SelectedLayer | null;
  onSelectLayer: (layer: SelectedLayer | null) => void;
  onAddSlot: (shape?: FrameCutoutShape) => void;
  onAddTextZone: (type?: TextZoneConfig['type']) => void;
  onDeleteLayer: (type: 'slot' | 'zone', id: string) => void;
  onToggleVisibility: (type: 'slot' | 'zone', id: string) => void;
  onToggleLock: (type: 'slot' | 'zone', id: string) => void;
}

export const StudioLayerPanel: React.FC<StudioLayerPanelProps> = ({
  template,
  selectedLayer,
  onSelectLayer,
  onAddSlot,
  onAddTextZone,
  onDeleteLayer,
  onToggleVisibility,
  onToggleLock,
}) => {
  return (
    <div className="w-full lg:w-72 bg-slate-900 border-r border-slate-800 p-4 space-y-6 overflow-y-auto text-white select-none">
      
      {/* SECTION 1: PHOTO SLOTS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-300 uppercase tracking-wider">
            <ImageIcon className="w-4 h-4 text-pink-500" />
            <span>Photo Slots ({template.photoSlots.length})</span>
          </div>

          <button
            onClick={() => onAddSlot('circle')}
            className="px-2 py-1 bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Slot
          </button>
        </div>

        {template.photoSlots.length === 0 ? (
          <div className="p-3 bg-slate-950/40 rounded-xl text-center text-xs text-slate-500 border border-dashed border-slate-800">
            No photo slots added.
          </div>
        ) : (
          <div className="space-y-1.5">
            {template.photoSlots.map((slot) => {
              const isSelected = selectedLayer?.type === 'slot' && selectedLayer.id === slot.id;
              const visibility = resolveVisibility(slot.visibility);

              return (
                <div
                  key={slot.id}
                  onClick={() => onSelectLayer({ type: 'slot', id: slot.id })}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-pink-950/40 border-pink-500 text-white ring-1 ring-pink-500'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate leading-tight">{slot.label || slot.id}</p>
                      <span className="text-[10px] text-slate-400 font-mono capitalize">
                        {slot.shape} • {Math.round(slot.width)}%×{Math.round(slot.height)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* User Visible Eye Toggle */}
                    <button
                      onClick={() => onToggleVisibility('slot', slot.id)}
                      className={`p-1 rounded-md transition-colors ${
                        visibility.userVisible
                          ? 'text-pink-400 hover:text-pink-300'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                      title={visibility.userVisible ? 'Visible to Customer' : 'Hidden from Customer (Admin Only)'}
                    >
                      {visibility.userVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    {/* Lock Toggle */}
                    <button
                      onClick={() => onToggleLock('slot', slot.id)}
                      className={`p-1 rounded-md transition-colors ${
                        slot.locked ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                      }`}
                      title={slot.locked ? 'Locked' : 'Unlocked'}
                    >
                      {slot.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteLayer('slot', slot.id)}
                      className="p-1 text-slate-600 hover:text-rose-400 rounded-md transition-colors"
                      title="Delete Slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: TEXT & CALENDAR ZONES */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-300 uppercase tracking-wider">
            <Type className="w-4 h-4 text-purple-400" />
            <span>Text Zones ({template.textZones.length})</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onAddTextZone('text')}
              className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Text
            </button>
            <button
              onClick={() => onAddTextZone('calendar')}
              className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Calendar className="w-3 h-3" /> Cal
            </button>
          </div>
        </div>

        {template.textZones.length === 0 ? (
          <div className="p-3 bg-slate-950/40 rounded-xl text-center text-xs text-slate-500 border border-dashed border-slate-800">
            No text zones added.
          </div>
        ) : (
          <div className="space-y-1.5">
            {template.textZones.map((zone) => {
              const isSelected = selectedLayer?.type === 'zone' && selectedLayer.id === zone.id;
              const visibility = resolveVisibility(zone.visibility);
              const isCal = zone.type === 'calendar' || zone.isCalendar;

              return (
                <div
                  key={zone.id}
                  onClick={() => onSelectLayer({ type: 'zone', id: zone.id })}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 text-white ring-1 ring-purple-500'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isCal ? 'bg-amber-400' : 'bg-purple-400'}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate leading-tight">{zone.label || zone.id}</p>
                      <span className="text-[10px] text-slate-400 font-mono truncate block">
                        "{zone.defaultValue}"
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* User Visible Eye Toggle */}
                    <button
                      onClick={() => onToggleVisibility('zone', zone.id)}
                      className={`p-1 rounded-md transition-colors ${
                        visibility.userVisible
                          ? 'text-purple-400 hover:text-purple-300'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                      title={visibility.userVisible ? 'Visible to Customer' : 'Hidden from Customer'}
                    >
                      {visibility.userVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    {/* Lock Toggle */}
                    <button
                      onClick={() => onToggleLock('zone', zone.id)}
                      className={`p-1 rounded-md transition-colors ${
                        zone.locked ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                      }`}
                      title={zone.locked ? 'Locked' : 'Unlocked'}
                    >
                      {zone.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteLayer('zone', zone.id)}
                      className="p-1 text-slate-600 hover:text-rose-400 rounded-md transition-colors"
                      title="Delete Zone"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
