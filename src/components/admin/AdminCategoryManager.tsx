import React, { useState } from 'react';
import { Category, Product } from '../../types';
import { FolderPlus, Layers, PackageCheck, Trash2, Plus, CheckCircle2, Sparkles, X, Tag } from 'lucide-react';

interface AdminCategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  products: Product[];
  onAddCategory: (category: Omit<Category, 'id' | 'createdAt'>) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export const AdminCategoryManager: React.FC<AdminCategoryManagerProps> = ({
  isOpen,
  onClose,
  categories,
  products,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎁');
  const [color, setColor] = useState('bg-pink-500');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate Product count per category
  const getProductCountForCategory = (categorySlug: string) => {
    return products.filter((p) => !p.isDeleted && (p.category === categorySlug || p.categoryLabel.toLowerCase() === categorySlug.toLowerCase())).length;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    onAddCategory({
      name: name.trim(),
      slug,
      description: description.trim(),
      icon,
      color,
    });

    setName('');
    setDescription('');
    setSuccessMsg(`Category "${name}" created successfully!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-jost animate-fadeIn select-none">
      <div className="relative bg-[#121829] text-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl border border-[#262E4A] space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262E4A] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-500/10 text-[#F82BA9] rounded-2xl border border-pink-500/20">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-playfair text-xl font-bold text-white flex items-center gap-2">
                Frame Category Creation Desk
              </h3>
              <p className="text-xs text-gray-400">Create & manage distinct product categories for photo frames.</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-[#1A2035] transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Stats Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-[#1A2035] rounded-2xl border border-[#262E4A] flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-gray-400 block font-bold">Total Available Categories</span>
              <span className="text-2xl font-extrabold text-white">{categories.length} Categories</span>
            </div>
          </div>

          <div className="p-4 bg-[#1A2035] rounded-2xl border border-[#262E4A] flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-gray-400 block font-bold">Active Listed Products</span>
              <span className="text-2xl font-extrabold text-emerald-400">{products.filter(p => !p.isDeleted).length} Products</span>
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {successMsg}
          </div>
        )}

        {/* Create Category Form */}
        <form onSubmit={handleSubmit} className="p-5 bg-[#1A2035] rounded-2xl border border-[#262E4A] space-y-4">
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-pink-400" /> Add New Distinct Category
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-gray-300">Category Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Baby Shower Frames, Birthday Gifts, Office Frames"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#121829] border border-[#262E4A] px-4 py-2.5 rounded-xl text-white focus:outline-hidden focus:border-[#F82BA9]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-300">Category Icon Emoji</label>
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full bg-[#121829] border border-[#262E4A] px-3 py-2.5 rounded-xl text-white focus:outline-hidden"
              >
                <option value="🎁">🎁 Gift Box</option>
                <option value="👶">👶 Baby & Kids</option>
                <option value="💑">💑 Couples / Wedding</option>
                <option value="🎂">🎂 Birthday</option>
                <option value="📅">📅 Calendar Frame</option>
                <option value="🖼️">🖼️ Photo Collage</option>
                <option value="💼">💼 Corporate Office</option>
                <option value="✨">✨ Special Edition</option>
              </select>
            </div>
          </div>

          <div className="space-y-1 text-xs font-bold">
            <label className="text-gray-300">Category Short Description</label>
            <input
              type="text"
              placeholder="e.g. Beautiful customized memory frames for newborns and toddlers"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#121829] border border-[#262E4A] px-4 py-2 rounded-xl text-white focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Category
            </button>
          </div>
        </form>

        {/* Existing Categories Table */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-white">All Existing Categories ({categories.length})</h4>
          <div className="bg-[#1A2035] rounded-2xl border border-[#262E4A] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121829] text-gray-400 font-bold border-b border-[#262E4A]">
                <tr>
                  <th className="p-3.5">Category Name</th>
                  <th className="p-3.5">Slug</th>
                  <th className="p-3.5 text-center">Products Count</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262E4A] text-gray-300 font-medium">
                {categories.map((cat) => {
                  const count = getProductCountForCategory(cat.slug);
                  return (
                    <tr key={cat.id} className="hover:bg-[#121829]/50 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{cat.icon || '🏷️'}</span>
                          <div>
                            <span className="font-bold text-white block">{cat.name}</span>
                            {cat.description && <span className="text-[11px] text-gray-400 block">{cat.description}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-gray-400">{cat.slug}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          count > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400'
                        }`}>
                          {count} Products
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => onDeleteCategory(cat.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
