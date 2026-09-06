import React, { useState, useRef } from 'react';
import { Category, Product } from '../../types';
import { uploadCategoryImage } from '../../config/firebase';
import {
  FolderPlus,
  Layers,
  PackageCheck,
  Trash2,
  Plus,
  CheckCircle2,
  Sparkles,
  X,
  Tag,
  Upload,
  Image as ImageIcon,
  Edit2,
  Loader2,
  Save,
  ExternalLink,
} from 'lucide-react';

interface AdminCategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  products: Product[];
  onAddCategory: (category: Omit<Category, 'id' | 'createdAt'>) => void;
  onUpdateCategory?: (id: string, updates: Partial<Category>) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export const AdminCategoryManager: React.FC<AdminCategoryManagerProps> = ({
  isOpen,
  onClose,
  categories,
  products,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('👶');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit State
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [isEditUploading, setIsEditUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Calculate Product count per category
  const getProductCountForCategory = (categorySlug: string, categoryName: string) => {
    return products.filter((p) => {
      if (!p || p.isDeleted) return false;
      const catLower = (p.category || '').toLowerCase();
      const labelLower = (p.categoryLabel || '').toLowerCase();
      const slugLower = categorySlug.toLowerCase();
      const nameLower = categoryName.toLowerCase();
      return (
        catLower === slugLower ||
        labelLower === nameLower ||
        catLower.includes(slugLower) ||
        (slugLower.includes('baby') && catLower.includes('baby'))
      );
    }).length;
  };

  const handleFileUpload = async (file: File, isEdit: boolean = false) => {
    try {
      if (isEdit) {
        setIsEditUploading(true);
      } else {
        setIsUploading(true);
      }
      setUploadError(null);

      const tempSlug = (isEdit ? editName : name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'category';

      const uploadedUrl = await uploadCategoryImage(tempSlug, file, file.name);

      if (isEdit) {
        setEditImageUrl(uploadedUrl);
      } else {
        setImageUrl(uploadedUrl);
      }
    } catch (err: any) {
      console.error('Failed to upload category image to Cloudinary:', err);
      setUploadError(err.message || 'Image upload failed. Please try again or paste image URL.');
    } finally {
      if (isEdit) {
        setIsEditUploading(false);
      } else {
        setIsUploading(false);
      }
    }
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
      imageUrl: imageUrl.trim() || undefined,
    });

    setName('');
    setDescription('');
    setImageUrl('');
    setSuccessMsg(`Category "${name}" created successfully!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const startEdit = (cat: Category) => {
    setEditingCat(cat);
    setEditName(cat.name);
    setEditDescription(cat.description || '');
    setEditIcon(cat.icon || '🎁');
    setEditImageUrl(cat.imageUrl || '');
  };

  const saveEdit = () => {
    if (!editingCat || !onUpdateCategory) return;
    onUpdateCategory(editingCat.id, {
      name: editName.trim(),
      description: editDescription.trim(),
      icon: editIcon,
      imageUrl: editImageUrl.trim() || undefined,
    });
    setSuccessMsg(`Category "${editName}" updated successfully!`);
    setTimeout(() => setSuccessMsg(null), 3000);
    setEditingCat(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-jost animate-fadeIn select-none">
      <div className="relative bg-[#121829] text-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl border border-[#262E4A] space-y-6 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262E4A] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-500/10 text-[#F82BA9] rounded-2xl border border-pink-500/20">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-playfair text-xl font-bold text-white flex items-center gap-2">
                Category & Thumbnail Image Studio
              </h3>
              <p className="text-xs text-gray-400">Manage categories, icons, and hero thumbnail images rendered on homepage cards.</p>
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
              <span className="text-xs text-gray-400 block font-bold">Total Categories</span>
              <span className="text-2xl font-extrabold text-white">{categories.length} Categories</span>
            </div>
          </div>

          <div className="p-4 bg-[#1A2035] rounded-2xl border border-[#262E4A] flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-gray-400 block font-bold">Active Listed Products</span>
              <span className="text-2xl font-extrabold text-emerald-400">{products.filter((p) => !p.isDeleted).length} Products</span>
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {successMsg}
          </div>
        )}

        {uploadError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-400 flex items-center gap-2">
            <X className="w-4 h-4" /> {uploadError}
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
                <option value="👶">👶 Baby & Kids</option>
                <option value="🎂">🎂 Birthday</option>
                <option value="💕">💕 Couples / Anniversary</option>
                <option value="🎁">🎁 Family / Gifts</option>
                <option value="🖼️">🖼️ Photo Collage</option>
                <option value="❤️">❤️ Brother & Sister / Love</option>
                <option value="📅">📅 Calendar Frame</option>
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

          {/* Category Image Upload & URL */}
          <div className="space-y-2 text-xs font-bold">
            <label className="text-gray-300 flex items-center justify-between">
              <span>Category Display Image (Displayed on Homepage Card)</span>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-rose-400 hover:underline cursor-pointer"
                >
                  Clear Image
                </button>
              )}
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full flex items-center gap-2">
                <input
                  type="url"
                  placeholder="Paste direct image URL or upload from device"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1 bg-[#121829] border border-[#262E4A] px-4 py-2 rounded-xl text-white focus:outline-hidden text-xs"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, false);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-3.5 py-2 bg-[#262E4A] hover:bg-[#343F64] text-white font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-400" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-pink-400" />
                      <span>Upload Image</span>
                    </>
                  )}
                </button>
              </div>

              {imageUrl && (
                <div className="w-12 h-12 rounded-xl border border-pink-500/40 overflow-hidden bg-black shrink-0 relative">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
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
          <h4 className="font-bold text-sm text-white">All Active Categories ({categories.length})</h4>
          <div className="bg-[#1A2035] rounded-2xl border border-[#262E4A] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121829] text-gray-400 font-bold border-b border-[#262E4A]">
                <tr>
                  <th className="p-3.5">Image</th>
                  <th className="p-3.5">Category Name</th>
                  <th className="p-3.5">Slug</th>
                  <th className="p-3.5 text-center">Products</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262E4A] text-gray-300 font-medium">
                {categories.map((cat) => {
                  const count = getProductCountForCategory(cat.slug, cat.name);
                  return (
                    <tr key={cat.id} className="hover:bg-[#121829]/50 transition-colors">
                      <td className="p-3.5">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-900 border border-[#262E4A] flex items-center justify-center relative">
                          {cat.imageUrl ? (
                            <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-gray-600" />
                          )}
                          <span className="absolute bottom-0.5 right-0.5 text-[10px] bg-black/60 rounded-full px-1">
                            {cat.icon || '🏷️'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div>
                          <span className="font-bold text-white block">{cat.name}</span>
                          {cat.description && (
                            <span className="text-[11px] text-gray-400 block line-clamp-1">{cat.description}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-gray-400">{cat.slug}</td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            count > 0
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-gray-500/10 text-gray-400'
                          }`}
                        >
                          {count} {count === 1 ? 'Product' : 'Products'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startEdit(cat)}
                            className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all cursor-pointer"
                            title="Edit Category & Change Image"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteCategory(cat.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Category Modal */}
        {editingCat && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-jost animate-fadeIn">
            <div className="bg-[#1A2035] text-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-pink-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-[#262E4A] pb-3">
                <h4 className="font-bold text-base text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-pink-400" /> Edit Category & Thumbnail
                </h4>
                <button
                  onClick={() => setEditingCat(null)}
                  className="p-1 text-gray-400 hover:text-white rounded-full cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs font-bold">
                <div className="space-y-1">
                  <label className="text-gray-300">Category Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#121829] border border-[#262E4A] px-4 py-2.5 rounded-xl text-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300">Category Icon Emoji</label>
                  <select
                    value={editIcon}
                    onChange={(e) => setEditIcon(e.target.value)}
                    className="w-full bg-[#121829] border border-[#262E4A] px-3 py-2.5 rounded-xl text-white focus:outline-hidden"
                  >
                    <option value="👶">👶 Baby & Kids</option>
                    <option value="🎂">🎂 Birthday</option>
                    <option value="💕">💕 Couples / Anniversary</option>
                    <option value="🎁">🎁 Family / Gifts</option>
                    <option value="🖼️">🖼️ Photo Collage</option>
                    <option value="❤️">❤️ Brother & Sister / Love</option>
                    <option value="📅">📅 Calendar Frame</option>
                    <option value="💼">💼 Corporate Office</option>
                    <option value="✨">✨ Special Edition</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-300">Short Description</label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-[#121829] border border-[#262E4A] px-4 py-2 rounded-xl text-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-gray-300 flex items-center justify-between">
                    <span>Category Thumbnail Image</span>
                    {editImageUrl && (
                      <button
                        type="button"
                        onClick={() => setEditImageUrl('')}
                        className="text-rose-400 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </label>

                  <div className="flex items-center gap-3">
                    <input
                      type="url"
                      placeholder="Paste Image URL or upload"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      className="flex-1 bg-[#121829] border border-[#262E4A] px-4 py-2 rounded-xl text-white focus:outline-hidden text-xs"
                    />
                    <input
                      type="file"
                      ref={editFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, true);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      disabled={isEditUploading}
                      className="px-3 py-2 bg-[#262E4A] hover:bg-[#343F64] text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {isEditUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-400" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-pink-400" />
                      )}
                      <span>Upload</span>
                    </button>
                  </div>

                  {editImageUrl && (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-pink-500/40 bg-black mx-auto mt-2">
                      <img src={editImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#262E4A]">
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="px-4 py-2 bg-[#262E4A] hover:bg-[#343F64] text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  className="px-5 py-2 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
