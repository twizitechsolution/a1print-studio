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
    <div className="space-y-6 font-jost">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-playfair text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" /> Frame Customization Fields Manager
          </h3>
          <p className="text-xs text-gray-400">Configure inputs, text placeholders, and photo slots available on storefront customizers.</p>
        </div>
      </div>

      {/* Add New Field Form */}
      <div className="p-5 bg-[#121829] rounded-2xl border border-[#262E4A] space-y-4 shadow-xl">
        <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" /> Add New Frame Input Field
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <input
              type="text"
              placeholder="Field Label (e.g. Baby Date of Birth)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3.5 py-2 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-hidden"
            />
          </div>
          <div className="sm:col-span-4">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              className="w-full bg-[#1A2035] border border-[#262E4A] px-3 py-2 rounded-xl text-xs text-white focus:outline-hidden"
            >
              <option value="text">Single Line Text</option>
              <option value="textarea">Paragraph / Multi-line Text</option>
              <option value="date">Special Date / Calendar</option>
              <option value="photo">Photo Upload Slot</option>
              <option value="dropdown">Dropdown Choice</option>
            </select>
          </div>
          <div className="sm:col-span-3 flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-gray-300 font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={newRequired}
                onChange={(e) => setNewRequired(e.target.checked)}
                className="rounded-md bg-[#1A2035] border-[#262E4A]"
              />
              Required Field
            </label>
            <button
              onClick={handleAddField}
              className="flex-1 py-2 bg-[#3B82F6] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Add Field
            </button>
          </div>
        </div>
      </div>

      {/* Existing Fields List Table */}
      <div className="p-5 bg-[#121829] rounded-2xl border border-[#262E4A] shadow-xl space-y-3">
        <h4 className="font-bold text-sm text-white">Active Customization Fields ({fields.length})</h4>
        <div className="divide-y divide-[#262E4A]">
          {fields.map((f, idx) => (
            <div key={f.id} className="py-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-md bg-[#1A2035] text-blue-400 flex items-center justify-center font-mono font-bold text-[11px]">
                  #{idx + 1}
                </span>
                <div>
                  <h5 className="font-bold text-white text-xs">{f.label}</h5>
                  <span className="text-[10px] text-gray-400 font-mono">Type: {f.fieldType} • {f.required ? 'Required' : 'Optional'}</span>
                </div>
              </div>
              <button
                onClick={() => handleDeleteField(f.id)}
                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
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
