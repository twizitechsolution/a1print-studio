import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { PhotoSlotConfig, TextZoneConfig } from '../../types/template';
import { useCartStore } from '../../store/useCartStore';
import { Upload, Sparkles, X, Check, Image as ImageIcon, Loader2, Trash2, Plus, Package } from 'lucide-react';
import { compressImageBase64 } from '../../utils/imageCompressor';

interface AdminProductListingModalProps {
  isOpen: boolean;
  editingProduct?: Product | null;
  onClose: () => void;
  onSaveProduct: (newProduct: Product) => void;
}

export const AdminProductListingModal: React.FC<AdminProductListingModalProps> = ({
  isOpen,
  editingProduct,
  onClose,
  onSaveProduct,
}) => {
  const { categories } = useCartStore();

  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('baby-kids');
  const [price, setPrice] = useState<number>(699);
  const [originalPrice, setOriginalPrice] = useState<number>(999);
  const [stockQuantity, setStockQuantity] = useState<number>(50);
  const [uploadedPosterUrl, setUploadedPosterUrl] = useState<string | null>(null);
  const [angleImages, setAngleImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  const [detectedPhotoSlots, setDetectedPhotoSlots] = useState<PhotoSlotConfig[]>([]);
  const [detectedTextZones, setDetectedTextZones] = useState<TextZoneConfig[]>([]);
  const [allowedPaymentModes, setAllowedPaymentModes] = useState<('Prepaid' | 'COD' | 'GoQuick50')[]>(['Prepaid', 'COD', 'GoQuick50']);

  useEffect(() => {
    if (editingProduct) {
      setTitle(editingProduct.title || '');
      setCategory(editingProduct.category || 'baby-kids');
      setPrice(editingProduct.sizes?.[0]?.price || 699);
      setOriginalPrice(editingProduct.sizes?.[0]?.originalPrice || 999);
      setStockQuantity(editingProduct.stockQuantity !== undefined ? editingProduct.stockQuantity : 50);
      setUploadedPosterUrl(editingProduct.thumbnail || null);
      setAngleImages(editingProduct.images && editingProduct.images.length > 0 ? editingProduct.images : (editingProduct.thumbnail ? [editingProduct.thumbnail] : []));
      setDetectedPhotoSlots(editingProduct.photoSlots || []);
      setDetectedTextZones(editingProduct.textZones || []);
      setAllowedPaymentModes(editingProduct.allowedPaymentModes || ['Prepaid', 'COD', 'GoQuick50']);
    } else {
      setTitle('');
      setCategory(categories[0]?.slug || 'baby-kids');
      setPrice(699);
      setOriginalPrice(999);
      setStockQuantity(50);
      setUploadedPosterUrl(null);
      setAngleImages([]);
      setDetectedPhotoSlots([]);
      setDetectedTextZones([]);
      setAllowedPaymentModes(['Prepaid', 'COD', 'GoQuick50']);
    }
  }, [editingProduct, isOpen, categories]);

  if (!isOpen) return null;

  // Single Main Upload or Add Extra Angle Image
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const rawImgUrl = evt.target?.result as string;
        const compressedUrl = await compressImageBase64(rawImgUrl, 600, 0.75);
        
        if (!uploadedPosterUrl) {
          setUploadedPosterUrl(compressedUrl);
        }
        
        setAngleImages((prev) => [...prev, compressedUrl]);
        setIsCompressing(false);

        if (detectedPhotoSlots.length === 0) {
          setDetectedPhotoSlots([
            {
              id: 'photo-1',
              label: 'Photo Slot 1',
              shape: 'rectangle',
              x: 21,
              y: 30,
              width: 32,
              height: 38,
              defaultPhotoUrl: '',
            },
            {
              id: 'photo-2',
              label: 'Photo Slot 2',
              shape: 'rectangle',
              x: 79,
              y: 30,
              width: 32,
              height: 38,
              defaultPhotoUrl: '',
            },
          ]);

          setDetectedTextZones([
            {
              id: 'text-1',
              label: 'Main Name / Title',
              defaultText: title || 'Rashmiranjan & Nikita',
              fontFamily: 'Playfair Display',
              fontSize: 24,
              color: '#3C187B',
              x: 50,
              y: 12,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAngleImage = (index: number) => {
    const updated = angleImages.filter((_, i) => i !== index);
    setAngleImages(updated);
    if (updated.length > 0) {
      setUploadedPosterUrl(updated[0]);
    } else {
      setUploadedPosterUrl(null);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a product title!');
      return;
    }

    const defaultImg = uploadedPosterUrl || angleImages[0] || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80';
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const selectedCategoryObj = categories.find((c) => c.slug === category);
    const categoryLabel = selectedCategoryObj ? selectedCategoryObj.name : 'Custom Photo Frame';

    const finalImages = angleImages.length > 0 ? angleImages : [defaultImg];

    const newProd: Product = {
      id: editingProduct?.id || `prod-${Date.now()}`,
      slug,
      title: title.trim(),
      subtitle: `${categoryLabel} Gift Frame`,
      category,
      categoryLabel,
      rating: editingProduct?.rating || 4.9,
      reviewsCount: editingProduct?.reviewsCount || 128,
      thumbnail: defaultImg,
      baseImageUrl: defaultImg,
      images: finalImages,
      stockQuantity,
      description: editingProduct?.description || `High resolution custom printed memory frame for ${title}. Includes glossy lamination and premium frame border.`,
      features: editingProduct?.features || [
        'Premium HD Photo Printing',
        'Glossy Scratch-proof Lamination',
        'High-density Synthetic Frame Wood',
        'Pre-fitted Wall Mount Hooks',
      ],
      sizes: [
        {
          id: 'size-a4',
          name: 'A4 Size (8 x 12 in)',
          dimensions: '8 x 12 inches',
          price,
          originalPrice,
          discountPercentage: Math.round(((originalPrice - price) / originalPrice) * 100),
        },
        {
          id: 'size-12x18',
          name: '12 x 18 in Large Frame',
          dimensions: '12 x 18 inches',
          price: price + 300,
          originalPrice: originalPrice + 400,
          discountPercentage: Math.round(((originalPrice - price) / originalPrice) * 100),
        },
      ],
      frames: [
        {
          id: 'frame-black',
          name: 'Classic Matte Black',
          borderStyle: 'solid',
          frameColor: '#000000',
          borderColorClass: 'border-black',
        },
      ],
      photoSlots: detectedPhotoSlots,
      textZones: detectedTextZones,
      allowedPaymentModes,
    };

    onSaveProduct(newProd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs font-sans select-none">
      <div className="relative bg-zinc-950 text-zinc-100 rounded-xl p-6 sm:p-7 max-w-4xl w-full shadow-2xl border border-zinc-800 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
              {editingProduct ? 'Edit Frame Product' : 'Add New Frame Product'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Enter product details, upload multiple angle photos, and set available stock quantity.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Inputs (6 Cols) */}
          <div className="lg:col-span-6 space-y-4 text-xs">
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 block">Product Title :</label>
              <input
                type="text"
                placeholder="e.g. Personalized Dad Heartbeat Photo Collage Frame"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-zinc-500 font-medium transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 block">Category :</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-zinc-500 transition-colors"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.icon || '🏷️'} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-gray-300">Offer Price (₹) :</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-[#1A2035] border border-[#262E4A] rounded-xl text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-300">Original Price (₹) :</label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-[#1A2035] border border-[#262E4A] rounded-xl text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-emerald-400">Stock Quantity :</label>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-[#1A2035] border border-emerald-500/40 rounded-xl text-emerald-400 font-mono"
                />
              </div>
            </div>

            {/* Admin Frame Payment Method CMS Settings */}
            <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 space-y-2">
              <label className="text-xs font-bold text-zinc-200 block">
                💳 Allowed Payment Methods for this Frame Product :
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-medium">
                <label className="flex items-center gap-2 p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={allowedPaymentModes.includes('Prepaid')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAllowedPaymentModes([...allowedPaymentModes, 'Prepaid']);
                      } else {
                        setAllowedPaymentModes(allowedPaymentModes.filter((m) => m !== 'Prepaid'));
                      }
                    }}
                    className="accent-pink-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-zinc-200 font-bold">Online Prepaid</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={allowedPaymentModes.includes('COD')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAllowedPaymentModes([...allowedPaymentModes, 'COD']);
                      } else {
                        setAllowedPaymentModes(allowedPaymentModes.filter((m) => m !== 'COD'));
                      }
                    }}
                    className="accent-pink-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-zinc-200 font-bold">Cash on Delivery (COD)</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={allowedPaymentModes.includes('GoQuick50')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAllowedPaymentModes([...allowedPaymentModes, 'GoQuick50']);
                      } else {
                        setAllowedPaymentModes(allowedPaymentModes.filter((m) => m !== 'GoQuick50'));
                      }
                    }}
                    className="accent-pink-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-purple-400 font-bold">GoQuick ⚡ ₹50 Advance</span>
                </label>
              </div>
            </div>

            {/* Multi-Image Upload & Angle Thumbnails Section */}
            <div className="space-y-2 pt-2 border-t border-[#262E4A]">
              <div className="flex items-center justify-between">
                <label className="text-gray-300 block">Product Angle Photos ({angleImages.length}) :</label>
                <span className="text-[11px] text-pink-400">Upload 4-6 different angles</span>
              </div>

              {/* Upload Button */}
              <label className="w-full py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer">
                {isCompressing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Compressing Image...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Add Photo Angle Image
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
              </label>

              {/* Angle Thumbnails Manager List */}
              {angleImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {angleImages.map((imgUrl, index) => (
                    <div key={index} className="relative group w-full h-16 rounded-xl overflow-hidden border border-[#262E4A] bg-black">
                      <img src={imgUrl} alt={`Angle ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveAngleImage(index)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-[9px] text-white rounded-md font-mono">
                        #{index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Live Poster & Detection Preview (6 Cols) */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-xs font-extrabold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#3B82F6]" /> Active Frame Preview
            </h3>

            <div className="w-full h-64 sm:h-72 rounded-2xl border-2 border-dashed border-[#262E4A] bg-[#1A2035] flex items-center justify-center overflow-hidden relative shadow-inner">
              {uploadedPosterUrl ? (
                <img src={uploadedPosterUrl} alt="Preview" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-6 text-gray-500 space-y-2">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-600" />
                  <p className="text-xs font-bold">No photo uploaded yet</p>
                  <p className="text-[11px]">Upload artwork to generate multi-angle preview</p>
                </div>
              )}
            </div>

            {/* Smart Detection Info */}
            <div className="p-4 bg-[#1A2035] rounded-2xl border border-[#262E4A] space-y-2 text-xs">
              <h4 className="font-extrabold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Frame Customization Setup
              </h4>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Photo slots and text zones are auto-configured. You can customize visual placements inside <strong className="text-purple-400">Visual Workspace</strong> anytime.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#262E4A] pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#1A2035] hover:bg-[#262E4A] text-gray-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#3B82F6] hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" /> Save Frame Product
          </button>
        </div>

      </div>
    </div>
  );
};
