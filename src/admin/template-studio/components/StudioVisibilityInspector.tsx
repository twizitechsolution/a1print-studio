import React from 'react';
import { LayerVisibility } from '../../../types/template';
import { Eye, ShieldAlert, CheckCircle2, Sliders, Info } from 'lucide-react';
import { resolveVisibility } from '../utils/templateDefaults';

interface StudioVisibilityInspectorProps {
  layerName: string;
  visibility?: LayerVisibility;
  onChange: (updatedVisibility: LayerVisibility) => void;
}

export const StudioVisibilityInspector: React.FC<StudioVisibilityInspectorProps> = ({
  layerName,
  visibility,
  onChange,
}) => {
  const current = resolveVisibility(visibility);

  const updateField = <K extends keyof LayerVisibility>(key: K, value: LayerVisibility[K]) => {
    onChange({
      ...current,
      [key]: value,
    });
  };

  return (
    <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 text-white text-xs select-none">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-pink-400" />
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-200">
            Customer Visibility & Rules
          </h4>
        </div>
        <span className="px-2 py-0.5 bg-pink-950/60 text-pink-300 font-mono text-[10px] rounded-md border border-pink-500/30">
          {layerName}
        </span>
      </div>

      {/* Info note */}
      <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start gap-2 text-[11px] text-slate-400">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          A layer hidden from customers is <strong>NOT removed from print</strong>. It will still render into the final 300 DPI print file using default artwork.
        </span>
      </div>

      {/* Toggle 1: User Visible */}
      <label className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
        <div className="space-y-0.5">
          <span className="font-bold block text-slate-200">Expose to Customer</span>
          <span className="text-[10px] text-slate-500">Show upload/input widget on storefront</span>
        </div>
        <input
          type="checkbox"
          checked={current.userVisible}
          onChange={(e) => {
            const checked = e.target.checked;
            onChange({
              ...current,
              userVisible: checked,
              userEditable: checked ? current.userEditable : false,
            });
          }}
          className="w-4 h-4 rounded-xs border-slate-600 accent-pink-500 cursor-pointer"
        />
      </label>

      {/* Toggle 2: User Editable (only if userVisible) */}
      {current.userVisible && (
        <label className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
          <div className="space-y-0.5">
            <span className="font-bold block text-slate-200">Customer Editable</span>
            <span className="text-[10px] text-slate-500">Allow customer to upload or modify value</span>
          </div>
          <input
            type="checkbox"
            checked={current.userEditable}
            onChange={(e) => updateField('userEditable', e.target.checked)}
            className="w-4 h-4 rounded-xs border-slate-600 accent-pink-500 cursor-pointer"
          />
        </label>
      )}

      {/* Toggle 3: Required Validation */}
      {current.userVisible && (
        <label className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
          <div className="space-y-0.5">
            <span className="font-bold block text-slate-200">Mandatory / Required</span>
            <span className="text-[10px] text-slate-500">Customer must fill prior to checkout</span>
          </div>
          <input
            type="checkbox"
            checked={current.required}
            onChange={(e) => updateField('required', e.target.checked)}
            className="w-4 h-4 rounded-xs border-slate-600 accent-pink-500 cursor-pointer"
          />
        </label>
      )}

      {/* User Label Override */}
      {current.userVisible && (
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300 block">
            Customer-Facing Label Override:
          </label>
          <input
            type="text"
            value={current.userLabel || ''}
            onChange={(e) => updateField('userLabel', e.target.value)}
            placeholder="e.g. Baby First Picture, Full Baby Name..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:border-pink-500 focus:outline-hidden"
          />
        </div>
      )}

      {/* Empty Behavior (when !required) */}
      {!current.required && current.userVisible && (
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300 block">
            When Left Empty by Customer:
          </label>
          <select
            value={current.emptyBehavior || 'keepDefault'}
            onChange={(e) => updateField('emptyBehavior', e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:border-pink-500 focus:outline-hidden cursor-pointer"
          >
            <option value="keepDefault">Keep Default Sample (Print Artwork)</option>
            <option value="hideLayer">Hide Layer from Final Output</option>
            <option value="showPlaceholder">Show Blank White Placeholder</option>
          </select>
        </div>
      )}

    </div>
  );
};
