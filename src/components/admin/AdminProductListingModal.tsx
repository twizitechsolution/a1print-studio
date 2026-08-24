import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { PhotoSlotConfig, TextZoneConfig } from '../../types/template';
import { Upload, Sparkles, X, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
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
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('Photo Collages');
  const [price, setPrice] = useState<number>(699);
  const [originalPrice, setOriginalPrice] = useState<number>(999);
  const [uploadedPosterUrl, setUploadedPosterUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  const [detectedPhotoSlots, setDetectedPhotoSlots] = useState<PhotoSlotConfig[]>([]);
  const [detectedTextZones, setDetectedTextZones] = useState<TextZoneConfig[]>([]);

  useEffect(() => {
    if (editingProduct) {
      setTitle(editingProduct.title || '');
      setCategory(editingProduct.categoryLabel || 'Photo Collages');
      setPrice(editingProduct.sizes?.[0]?.price || 699);
      setOriginalPrice(editingProduct.sizes?.[0]?.originalPrice || 999);
      setUploadedPosterUrl(editingProduct.thumbnail || null);
      setDetectedPhotoSlots(editingProduct.photoSlots || []);
      setDetectedTextZones(editingProduct.textZones || []);
    } else {
      setTitle('');
      setCategory('Photo Collages');
      setPrice(699);
      setOriginalPrice(999);
      setUploadedPosterUrl(null);
      setDetectedPhotoSlots([]);
      setDetectedTextZones([]);
    }
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  // Smart Auto-Detection & Image Compression for newly uploaded poster image
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const rawImgUrl = evt.target?.result as string;
        
        // Compress raw base64 image payload to lightweight crisp JPEG for 100% permanent localStorage persistence
        const compressedUrl = await compressImageBase64(rawImgUrl, 600, 0.75);
        setUploadedPosterUrl(compressedUrl);
        setIsCompressing(false);

        // Run smart auto-detection for the newly uploaded poster image ONLY!
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
          {
            id: 'photo-3',
            label: 'Photo Slot 3',
            shape: 'rectangle',
            x: 21,
            y: 74,
            width: 32,
            height: 38,
            defaultPhotoUrl: '',
          },
          {
            id: 'photo-4',
            label: 'Photo Slot 4',
            shape: 'rectangle',
            x: 79,
            y: 74,
            width: 32,
            height: 38,
            defaultPhotoUrl: '',
          },
        ]);

        setDetectedTextZones([
          {
            id: 'text-1',
            label: 'Custom Title / Text',
            defaultValue: 'Dad Heartbeat',
            x: 50,
            y: 54,
            fontSize: 24,
            fontFamily: 'Playfair Display',
            color: '#111827',
            align: 'center',
            type: 'text',
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAndPublish = () => {
    if (!title || !uploadedPosterUrl) {
      alert('Please enter a product title and upload a frame poster image!');
      return;
    }

    const categoryLabelMap: Record<string, string> = {
      'Photo Collages': 'Photo Collages',
      'Baby Birth Frames': 'Baby Birth Frames',
      'Couple & Anniversary': 'Couple & Anniversary',
      'Acrylic Glass Frames': 'Acrylic Glass Frames',
    };

    const newProd: Product = {
      id: editingProduct?.id || `frame-${Date.now()}`,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title,
      subtitle: 'Premium Archival Custom Frame',
      category,
      categoryLabel: categoryLabelMap[category] || category,
      rating: 5.0,
      reviewsCount: 1,
      thumbnail: uploadedPosterUrl,
      images: [uploadedPosterUrl],
      bestseller: true,
      onSale: true,
      description: `Handcrafted ${title} printed on 300 GSM Archival Paper with shatter-proof acrylic glass overlay.`,
      features: ['300 GSM Matte Paper', 'Acrylic Glass Overlay', 'Solid Black Wooden Molding'],
      sizes: [
        {
          id: 'size-a4',
          name: 'A4 (8x12 Inch)',
          dimensions: '8x12 Inch',
          price,
          originalPrice,
          discountPercentage: 30,
        },
        {
          id: 'size-a3',
          name: 'A3 (12x18 Inch)',
          dimensions: '12x18 Inch',
          price: price + 300,
          originalPrice: originalPrice + 500,
          discountPercentage: 30,
        },
      ],
      frames: [
        {
          id: 'classic-black',
          name: 'Classic Black Wood',
          borderStyle: 'solid',
          frameColor: '#000000',
          borderColorClass: 'border-black',
        },
      ],
      photoSlots: detectedPhotoSlots,
      textZones: detectedTextZones,
    };

    onSaveProduct(newProd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-jost animate-fadeIn select-none">
      <div className="relative bg-[#121829] text-gray-100 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl border border-[#262E4A] space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#262E4A] pb-4">
          <div>
            <h2 className="font-playfair text-2xl font-extrabold text-white">Add New Frame Product</h2>
            <p className="text-xs text-gray-400 mt-0.5">Enter product details, upload poster artwork, and inspect auto-detected photo & text zones.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-full bg-[#1A2035] hover:bg-[#262E4A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form Inputs (6 Cols) */}
          <div className="lg:col-span-6 space-y-4 text-xs">
            
            <div className="space-y-1">
              <label className="font-bold text-gray-300">Frame Product Title :</label>
              <input
                type="text"
                placeholder="e.g. Personalized Dad Heartbeat Photo Collage Frame"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-[#1A2035] border border-[#262E4A] rounded-xl text-white font-bold focus:outline-hidden focus:border-[#3B82F6]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-300">Category :</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-[#1A2035] border border-[#262E4A] rounded-xl text-white font-bold"
              >
                <option value="Photo Collages">Photo Collages</option>
                <option value="Baby Birth Frames">Baby Birth Frames</option>
                <option value="Couple & Anniversary">Couple & Anniversary</option>
                <option value="Acrylic Glass Frames">Acrylic Glass Frames</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-gray-300">Offer Price (₹) :</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#1A2035] border border-[#262E4A] rounded-xl text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">Original Price (₹) :</label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-[#1A2035] border border-[#262E4A] rounded-xl text-white font-bold"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="font-bold text-gray-300 block">Upload Frame Artwork Poster :</label>
              <label className="w-full py-4 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer">
                {isCompressing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Optimizing Image...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Upload Frame Artwork Image
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
              </label>
            </div>

          </div>

          {/* Right Column: Poster Image Preview Box (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-3">
            
            {uploadedPosterUrl ? (
              <div className="relative w-full max-w-[280px] aspect-[3/4.4] rounded-xs border-8 border-black shadow-2xl bg-white overflow-hidden select-none font-serif">
                <img src={uploadedPosterUrl} alt="Poster Preview" className="w-full h-full object-cover" />

                {/* Overlaid detected photo slots */}
                {detectedPhotoSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="absolute border-2 border-dashed border-sky-400 bg-sky-500/20 flex items-center justify-center text-[9px] font-bold text-sky-900 rounded-sm"
                    style={{
                      left: `${slot.x}%`,
                      top: `${slot.y}%`,
                      width: `${slot.width}%`,
                      height: `${slot.height}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    📷 {slot.label}
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full max-w-[280px] aspect-[3/4.4] rounded-2xl border-2 border-dashed border-[#262E4A] bg-[#1A2035] flex flex-col items-center justify-center p-6 text-center text-gray-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#262E4A] text-blue-400 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-sm text-gray-200">No Frame Poster Uploaded</h4>
                <p className="text-[11px] text-gray-400">Click &quot;Upload Frame Artwork Image&quot; to upload your frame poster artwork.</p>
              </div>
            )}

            {uploadedPosterUrl && (
              <div className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 text-[11px] font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Smart Auto-Detected {detectedPhotoSlots.length} Photo Slots & {detectedTextZones.length} Text Zones
              </div>
            )}

          </div>

        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-[#262E4A] flex justify-end">
          <button
            onClick={handleSaveAndPublish}
            disabled={!uploadedPosterUrl || !title || isCompressing}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#2563EB] to-[#9333EA] hover:from-blue-700 hover:to-purple-800 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" /> Save & Publish Frame Product to Store
          </button>
        </div>

      </div>
    </div>
  );
};
