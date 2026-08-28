import React, { useState } from 'react';
import { CustomFieldConfig } from '../../types/admin';
import { Plus, Trash2, Edit3, Check, Sparkles, Layers } from 'lucide-react';

export const AdminCustomFieldsManager: React.FC = () => {
  const [fields, setFields] = useState<CustomFieldConfig[]>([
    { id: 'f1', label: 'Full Name', fieldType: 'text', required: true, placeholder: 'Enter Name (e.g. Samavedra)', displayOrder: 1 },
    { id: 'f2', label: 'Special Date (Calendar ❤️)', fieldType: 'date', required: true, placeholder: 'Select Special Date', displayOrder: 2 },
    { id: 'f3', label: 'Love Message (🔄)', fieldType: 'textarea', required: false, placeholder: 'Write a birthday wish message...', displayOrder: 3 },
    { id: 'f4', label: 'Customer Photo Upload', fieldType: 'photo', required: true, displayOrder: 4 },
  ]);

  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<CustomFieldConfig['fieldType']>('text');
  const [newRequired, setNewRequired] = useState(true);

  const handleAddField = () => {
    if (!newLabel.trim()) return;
    const newField: CustomFieldConfig = {
      id: `f-${Date.now()}`,
      label: newLabel,
      fieldType: newType,
      required: newRequired,
      placeholder: `Enter ${newLabel}...`,
      displayOrder: fields.length + 1,
    };
    setFields([...fields, newField]);
    setNewLabel('');
  };

  const handleDeleteField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold tracking-tight dark:text-zinc-100 text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500" /> Frame Customization Fields Manager
          </h3>
          <p className="text-xs dark:text-zinc-400 text-slate-500 mt-0.5">Configure inputs, text placeholders, and photo slots available on storefront customizers.</p>
        </div>
      </div>

      {/* Add New Field Form */}
      <div className="p-5 dark:bg-zinc-900/50 bg-white rounded-xl border dark:border-zinc-800 border-slate-200 space-y-4 shadow-xs">
        <h4 className="font-semibold text-sm dark:text-zinc-100 text-slate-900 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-500" /> Add New Frame Input Field
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <input
              type="text"
              placeholder="Field Label (e.g. Baby Date of Birth)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full dark:bg-zinc-950 bg-slate-50 border dark:border-zinc-800 border-slate-200 px-3 py-2 rounded-lg text-xs dark:text-zinc-100 text-slate-900 placeholder:text-zinc-500 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-4">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              className="w-full dark:bg-zinc-950 bg-slate-50 border dark:border-zinc-800 border-slate-200 px-3 py-2 rounded-lg text-xs dark:text-zinc-100 text-slate-900 focus:outline-none"
            >
              <option value="text">Single Line Text</option>
              <option value="textarea">Paragraph / Multi-line Text</option>
              <option value="date">Special Date / Calendar</option>
              <option value="photo">Photo Upload Slot</option>
              <option value="dropdown">Dropdown Choice</option>
            </select>
          </div>
          <div className="sm:col-span-3 flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs dark:text-zinc-300 text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={newRequired}
                onChange={(e) => setNewRequired(e.target.checked)}
                className="rounded dark:bg-zinc-950 bg-slate-100 dark:border-zinc-800 border-slate-200"
              />
              Required
            </label>
            <button
              onClick={handleAddField}
              className="flex-1 py-2 dark:bg-zinc-100 bg-slate-900 dark:hover:bg-zinc-200 hover:bg-slate-800 dark:text-zinc-950 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Add Field
            </button>
          </div>
        </div>
      </div>

      {/* Existing Fields List Table */}
      <div className="p-5 dark:bg-zinc-900/40 bg-white rounded-xl border dark:border-zinc-800 border-slate-200 shadow-xs space-y-3">
        <h4 className="font-semibold text-sm dark:text-zinc-100 text-slate-900">Active Customization Fields ({fields.length})</h4>
        <div className="divide-y dark:divide-zinc-800/60 divide-slate-200">
          {fields.map((f, idx) => (
            <div key={f.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md dark:bg-zinc-950 bg-slate-100 text-blue-500 flex items-center justify-center font-mono font-bold text-[11px] border dark:border-zinc-800 border-slate-200">
                  #{idx + 1}
                </span>
                <div>
                  <h5 className="font-semibold dark:text-zinc-100 text-slate-900 text-xs">{f.label}</h5>
                  <span className="text-[10px] dark:text-zinc-400 text-slate-500 font-mono">Type: {f.fieldType} • {f.required ? 'Required' : 'Optional'}</span>
                </div>
              </div>
              <button
                onClick={() => handleDeleteField(f.id)}
                className="p-1.5 dark:text-red-400 text-red-500 dark:hover:bg-red-950/20 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
