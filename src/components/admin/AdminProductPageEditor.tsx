import React, { useState } from 'react';
import { Product, PhotoSlot, TextZone, SizeOption, FrameOption } from '../../types';
import { ArrowLeft, Save, Plus, Trash2, Upload, Image as ImageIcon, Sparkles, Star, CheckCircle2, ShieldCheck, CreditCard, DollarSign, Layers, Eye, RefreshCw } from 'lucide-react';

interface AdminProductPageEditorProps {
  product: Product | null;
  categories: { id: string; name: string }[];
  onSave: (product: Product) => void;
  onBack: () => void;
}

export const AdminProductPageEditor: React.FC<AdminProductPageEditorProps> = ({
  product,
  categories,
  onSave,
  onBack,
}) => {
  const isEditing = Boolean(product && product.id);

  // 1. Basic Info
  const [id, setId] = useState<string>(product?.id || `prod-${Date.now()}`);
  const [slug, setSlug] = useState<string>(product?.slug || '');
  const [title, setTitle] = useState<string>(product?.title || '');
  const [subtitle, setSubtitle] = useState<string>(product?.subtitle || '');
  const [category, setCategory] = useState<string>(product?.category || 'birthday');
  const [categoryLabel, setCategoryLabel] = useState<string>(product?.categoryLabel || 'Photo Collages');
  const [allowedPaymentMethods, setAllowedPaymentMethods] = useState<'both' | 'prepaid_only' | 'cod_only'>(
    (product as any)?.allowedPaymentMethods || 'both'
  );
  const [bestseller, setBestseller] = useState<boolean>(product?.bestseller ?? true);
  const [onSale, setOnSale] = useState<boolean>(product?.onSale ?? true);

  // 2. Dual Image Uploader
  const [baseImageUrl, setBaseImageUrl] = useState<string>(product?.baseImageUrl || product?.thumbnail || '');
  const [images, setImages] = useState<string[]>(product?.images || (product?.thumbnail ? [product.thumbnail] : []));

  // 3. Orientation & Canvas Bounds
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>((product as any)?.orientation || 'portrait');

  // 4. Multi-Size Variant Matrix Pricing
  const defaultA4 = product?.sizes?.find((s) => s.id.includes('a4')) || {
    id: 'size-a4',
    name: 'A4 (8x12 Inch)',
    dimensions: '8 x 12 inches',
    price: 699,
    originalPrice: 999,
    discountPercentage: 30,
  };
  const defaultA3 = product?.sizes?.find((s) => s.id.includes('a3')) || {
    id: 'size-a3',
    name: 'A3 (12x18 Inch)',
    dimensions: '12 x 18 inches',
    price: 999,
    originalPrice: 1499,
    discountPercentage: 33,
  };

  const [a4Price, setA4Price] = useState<number>(defaultA4.price);
  const [a4OriginalPrice, setA4OriginalPrice] = useState<number>(defaultA4.originalPrice);
  const [a3Price, setA3Price] = useState<number>(defaultA3.price);
  const [a3OriginalPrice, setA3OriginalPrice] = useState<number>(defaultA3.originalPrice);

  // 5. Photo Slots & Text Zones
  const [photoSlots, setPhotoSlots] = useState<PhotoSlot[]>(
    product?.photoSlots || [
      { id: 'photo-1', label: 'Main Photo', shape: 'rounded', x: 50, y: 35, width: 60, height: 35 },
    ]
  );
  const [textZones, setTextZones] = useState<TextZone[]>(
    product?.textZones || [
      { id: 'titleText', label: 'Header Title', defaultValue: 'Happy Birthday', x: 50, y: 10, color: '#160E4B', fontFamily: 'Playfair Display', fontSize: 20, align: 'center', type: 'text' },
    ]
  );

  // 6. Description, Features & Customer Reviews
  const [description, setDescription] = useState<string>(product?.description || '');
  const [features, setFeatures] = useState<string[]>(
    product?.features || [
      'Archival 300 GSM Premium Matte Paper',
      'Unbreakable acrylic glass overlay protection',
      'Solid synthetic black wood frame molding',
    ]
  );
  const [reviews, setReviews] = useState<any[]>(
    (product as any)?.reviews || [
      { id: 'rev-1', author: 'Neha Saxena', rating: 5, date: '2 days ago', comment: 'Absolutely loved the print quality and frame finish! Delivered super fast.', verified: true },
    ]
  );

  // Helper: Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  };

  // Helper: Compress uploaded images using HTML5 Canvas to prevent Firestore payload quota rejects
  const compressImageFile = (file: File, maxDim = 1200, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const isPng = file.type.includes('png') || file.name.toLowerCase().endsWith('.png') || file.type.includes('webp');
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // CRITICAL: PNG/WEBP files must be exported as image/png to retain 100% alpha transparency!
            const format = isPng ? 'image/png' : 'image/jpeg';
            resolve(canvas.toDataURL(format, quality));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Helper: File Upload Handler for Base Poster Frame Overlay (Uploader 1)
  const handleBaseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImageFile(file, 1200, 0.85);
      setBaseImageUrl(compressed);
    }
  };

  // Helper: Multi-File Upload Handler for Angle Showcase Gallery (Uploader 2)
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const compressed = await compressImageFile(file, 1000, 0.82);
      setImages((prev) => [...prev, compressed]);
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Features list manager
  const handleAddFeature = () => {
    setFeatures((prev) => [...prev, 'New Premium Feature Bullet Point']);
  };
  const handleUpdateFeature = (index: number, val: string) => {
    setFeatures((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };
  const handleRemoveFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Reviews manager
  const handleAddReview = () => {
    setReviews((prev) => [
      ...prev,
      { id: `rev-${Date.now()}`, author: 'Verified Buyer', rating: 5, date: 'Just now', comment: 'Stunning customized photo frame! Highly recommended.', verified: true },
    ]);
  };
  const handleUpdateReview = (index: number, field: string, val: any) => {
    setReviews((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };
  const handleRemoveReview = (index: number) => {
    setReviews((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Final Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a product title!');
      return;
    }

    const updatedSizes: SizeOption[] = [
      {
        id: 'size-a4',
        name: 'A4 (8x12 Inch)',
        dimensions: orientation === 'landscape' ? '12 x 8 inches' : '8 x 12 inches',
        price: Number(a4Price),
        originalPrice: Number(a4OriginalPrice),
        discountPercentage: Math.round(((a4OriginalPrice - a4Price) / a4OriginalPrice) * 100),
      },
      {
        id: 'size-a3',
        name: 'A3 (12x18 Inch)',
        dimensions: orientation === 'landscape' ? '18 x 12 inches' : '12 x 18 inches',
        price: Number(a3Price),
        originalPrice: Number(a3OriginalPrice),
        discountPercentage: Math.round(((a3OriginalPrice - a3Price) / a3OriginalPrice) * 100),
      },
    ];

    const updatedFrames: FrameOption[] = product?.frames || [
      {
        id: 'frame-black',
        name: 'Classic Black Wood',
        borderStyle: 'border-8 border-black shadow-2xl',
        frameColor: '#000000',
        borderColorClass: 'border-black',
      },
    ];

    const fullProduct: Product = {
      id: id.trim() || `prod-${Date.now()}`,
      slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: title.trim(),
      subtitle: subtitle.trim(),
      category: category.trim(),
      categoryLabel: categoryLabel.trim() || 'Photo Collages',
      rating: product?.rating || 5.0,
      reviewsCount: reviews.length || 25,
      thumbnail: baseImageUrl || images[0] || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
      baseImageUrl: baseImageUrl || images[0] || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
      images: images.length > 0 ? images : [baseImageUrl],
      bestseller,
      onSale,
      description: description.trim(),
      features,
      photoSlots,
      textZones,
      sizes: updatedSizes,
      frames: updatedFrames,
      isDeleted: false,
      stockQuantity: product?.stockQuantity !== undefined ? product.stockQuantity : 50,
      stockLogs: product?.stockLogs || [],
      allowedPaymentMethods,
      orientation,
      reviews,
    } as any;

    onSave(fullProduct);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-jost select-none">
      
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-purple-100 shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all cursor-pointer"
            title="Back to Catalog"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-extrabold text-[#F82BA9] uppercase tracking-wider block">
              {isEditing ? 'Edit Frame Product' : 'Add New Frame Product'}
            </span>
            <h1 className="font-playfair text-2xl font-extrabold text-[#160E4B]">
              {title || 'Untitled Custom Frame Product'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 sm:flex-initial px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-2xl transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="flex-1 sm:flex-initial px-8 py-3 bg-gradient-to-r from-[#3C187B] to-[#F82BA9] hover:from-[#2A1058] hover:to-[#D61B90] text-white font-extrabold text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Product
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Product Information & Media (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Card 1: Basic Information */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-md space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-pink-100 text-[#F82BA9] flex items-center justify-center font-extrabold text-sm">
                1
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-[#160E4B]">Basic Product Information</h3>
                <p className="text-xs text-gray-500">Configure title, subtitle, ID, and category</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-gray-700">Product ID (Auto-Generated)</label>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-mono text-gray-700 focus:outline-hidden focus:border-[#F82BA9]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-700">Product Slug (URL Identifier)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-mono text-gray-700 focus:outline-hidden focus:border-[#F82BA9]"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs font-bold">
              <label className="text-gray-700">Product Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Custom Birthday Collage Photo Frame – Personalized Name & Date"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-extrabold text-sm focus:outline-hidden focus:border-[#F82BA9]"
              />
            </div>

            <div className="space-y-1 text-xs font-bold">
              <label className="text-gray-700">Subtitle / Highlight Summary</label>
              <input
                type="text"
                placeholder="e.g. Surprise your loved ones with a stunning multi-photo birthday collage frame"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-700 focus:outline-hidden focus:border-[#F82BA9]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
              <div className="space-y-1">
                <label className="text-gray-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => {
                    const catId = e.target.value;
                    setCategory(catId);
                    const found = categories.find((c) => c.id === catId);
                    if (found) setCategoryLabel(found.name);
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-hidden focus:border-[#F82BA9] cursor-pointer"
                >
                  <option value="birthday">Birthday Gifts</option>
                  <option value="baby">Baby Birth Frames</option>
                  <option value="couple">Couple & Anniversary</option>
                  <option value="family">Family Frame</option>
                  <option value="acrylic">Acrylic Glass</option>
                  <option value="collage">Photo Collages</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-700">Category Display Badge</label>
                <input
                  type="text"
                  value={categoryLabel}
                  onChange={(e) => setCategoryLabel(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-700 focus:outline-hidden focus:border-[#F82BA9]"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Frame Orientation & Auto-Aspect Adjustment (Moved Above Uploaders) */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-md space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-pink-100 text-[#F82BA9] flex items-center justify-center font-extrabold text-sm">
                2
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-[#160E4B]">Step 1: Select Frame Orientation</h3>
                <p className="text-xs text-gray-500">Choosing orientation automatically adjusts upload preview boxes and live visualizer aspect ratio</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 font-bold text-xs">
              <div
                onClick={() => setOrientation('portrait')}
                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                  orientation === 'portrait'
                    ? 'border-[#F82BA9] bg-pink-50/60 text-[#F82BA9] shadow-md'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-14 border-2 border-current rounded-lg flex items-center justify-center font-black text-xs">
                  3:4
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">Portrait Orientation</h4>
                  <span className="text-[11px] text-gray-500 block">Vertical frame aspect ratio (8x12 / 12x18 Inch)</span>
                </div>
              </div>

              <div
                onClick={() => setOrientation('landscape')}
                className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                  orientation === 'landscape'
                    ? 'border-[#F82BA9] bg-pink-50/60 text-[#F82BA9] shadow-md'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="w-14 h-10 border-2 border-current rounded-lg flex items-center justify-center font-black text-xs">
                  4:3
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900">Landscape Orientation</h4>
                  <span className="text-[11px] text-gray-500 block">Horizontal frame aspect ratio (12x8 / 18x12 Inch)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Dual Frame Image Uploader System (Dynamically Resizes by Selected Orientation) */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-md space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-pink-100 text-[#F82BA9] flex items-center justify-center font-extrabold text-sm">
                3
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-[#160E4B]">Step 2: Dual Frame Image Uploader System</h3>
                <p className="text-xs text-gray-500">Upload primary main frame and secondary angle showcase photos matching {orientation.toUpperCase()} ratio</p>
              </div>
            </div>

            {/* Uploader 1: Main Product Frame Image */}
            <div className="p-5 bg-pink-50/50 rounded-3xl border border-pink-200 space-y-4 font-bold text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[#F82BA9] uppercase tracking-wider block">Uploader 1: Main Product Frame Image ({orientation.toUpperCase()})</span>
                  <p className="text-gray-500 text-[11px]">Main frame shown across Shop & Cart. All live customizations render directly on this frame!</p>
                </div>
                <label className="px-4 py-2 bg-[#F82BA9] hover:bg-[#D61B90] text-white rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" /> Upload Main Frame
                  <input type="file" accept="image/*" onChange={handleBaseImageUpload} className="hidden" />
                </label>
              </div>

              {baseImageUrl ? (
                <div className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-pink-200">
                  <div className={`shrink-0 rounded-xl bg-gray-100 p-1 flex items-center justify-center overflow-hidden border border-gray-200 transition-all ${
                    orientation === 'portrait' ? 'w-24 h-32' : 'w-36 h-24'
                  }`}>
                    <img
                      src={baseImageUrl}
                      alt="Main Frame Image"
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-extrabold block">Main Frame Image Ready</span>
                      <span className="px-2 py-0.5 bg-pink-100 text-[#F82BA9] text-[10px] font-extrabold rounded-md uppercase">
                        {orientation} ({orientation === 'portrait' ? '3:4' : '4:3'})
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono block truncate max-w-md">{baseImageUrl.substring(0, 60)}...</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-pink-200 rounded-2xl bg-white text-gray-400">
                  No main frame image uploaded yet.
                </div>
              )}

              {/* Direct Image URL input option */}
              <div className="space-y-1 pt-1 border-t border-pink-100">
                <label className="text-gray-700 text-[11px] font-bold block">Or Paste Direct Web Image URL:</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... or https://your-server.com/frame.png"
                  value={baseImageUrl.startsWith('data:') ? '' : baseImageUrl}
                  onChange={(e) => setBaseImageUrl(e.target.value.trim())}
                  className="w-full px-3 py-2 bg-white border border-pink-200 rounded-xl text-gray-800 text-xs font-mono focus:outline-hidden focus:border-[#F82BA9]"
                />
              </div>
            </div>

            {/* Uploader 2: Real-World Showcase & Angle View Gallery */}
            <div className="p-5 bg-purple-50/50 rounded-3xl border border-purple-200 space-y-4 font-bold text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[#3C187B] uppercase tracking-wider block">Uploader 2: Showcase Angles & Lifestyle Gallery ({orientation.toUpperCase()})</span>
                  <p className="text-gray-500 text-[11px]">Secondary real-world angle photos displayed in product gallery thumbnails</p>
                </div>
                <label className="px-4 py-2 bg-[#3C187B] hover:bg-[#251877] text-white rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Gallery Photos
                  <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div key={idx} className={`relative group rounded-2xl overflow-hidden border border-purple-200 bg-white transition-all ${
                    orientation === 'portrait' ? 'aspect-3/4' : 'aspect-4/3'
                  }`}>
                    <img src={img} alt={`Gallery Angle ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryImage(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                      title="Remove Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 4: Description, Features & Customer Reviews */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-md space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-pink-100 text-[#F82BA9] flex items-center justify-center font-extrabold text-sm">
                4
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-[#160E4B]">Description, Features & Customer Reviews</h3>
                <p className="text-xs text-gray-500">Manage detailed product content and social proof reviews</p>
              </div>
            </div>

            <div className="space-y-1 text-xs font-bold">
              <label className="text-gray-700">Full Product Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write rich product description explaining paper quality, inks, frame molding..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-800 focus:outline-hidden focus:border-[#F82BA9]"
              />
            </div>

            {/* Bullet Point Features List */}
            <div className="space-y-3 font-bold text-xs">
              <div className="flex items-center justify-between">
                <label className="text-gray-700">Bullet Point Features ({features.length})</label>
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-[#3C187B] rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Feature
                </button>
              </div>

              <div className="space-y-2">
                {features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={feat}
                      onChange={(e) => handleUpdateFeature(idx, e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Manager */}
            <div className="space-y-3 font-bold text-xs pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <label className="text-gray-700">Customer Reviews Manager ({reviews.length})</label>
                <button
                  type="button"
                  onClick={handleAddReview}
                  className="px-3 py-1 bg-pink-100 hover:bg-pink-200 text-[#F82BA9] rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Customer Review
                </button>
              </div>

              <div className="space-y-3">
                {reviews.map((rev, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Author Name"
                        value={rev.author}
                        onChange={(e) => handleUpdateReview(idx, 'author', e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-xl"
                      />
                      <select
                        value={rev.rating}
                        onChange={(e) => handleUpdateReview(idx, 'rating', Number(e.target.value))}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-xl"
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                        <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Date (e.g. 2 days ago)"
                        value={rev.date}
                        onChange={(e) => handleUpdateReview(idx, 'date', e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-xl"
                      />
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Review Comment..."
                      value={rev.comment}
                      onChange={(e) => handleUpdateReview(idx, 'comment', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl"
                    />

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveReview(idx)}
                        className="text-red-600 hover:text-red-800 text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Pricing Matrix & E-Commerce Settings (4 Cols) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Multi-Size Variant Matrix Pricing Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-md space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-pink-100 text-[#F82BA9] flex items-center justify-center font-extrabold text-sm">
                💰
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-[#160E4B]">Multi-Size Pricing Matrix</h3>
                <p className="text-xs text-gray-500">Configure separate prices for A4 & A3 frame variants</p>
              </div>
            </div>

            {/* A4 Pricing */}
            <div className="p-4 bg-pink-50/50 rounded-2xl border border-pink-200 space-y-3 font-bold text-xs">
              <span className="text-[#F82BA9] uppercase tracking-wider block">A4 Variant (8x12 Inch)</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-700">Sale Price (₹)</label>
                  <input
                    type="number"
                    value={a4Price}
                    onChange={(e) => setA4Price(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-extrabold text-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-700">Original Price (₹)</label>
                  <input
                    type="number"
                    value={a4OriginalPrice}
                    onChange={(e) => setA4OriginalPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-extrabold text-gray-500 line-through"
                  />
                </div>
              </div>
            </div>

            {/* A3 Pricing */}
            <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-3 font-bold text-xs">
              <span className="text-[#3C187B] uppercase tracking-wider block">A3 Variant (12x18 Inch)</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-700">Sale Price (₹)</label>
                  <input
                    type="number"
                    value={a3Price}
                    onChange={(e) => setA3Price(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-extrabold text-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-700">Original Price (₹)</label>
                  <input
                    type="number"
                    value={a3OriginalPrice}
                    onChange={(e) => setA3OriginalPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-extrabold text-gray-500 line-through"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Restrictions & Store Badges Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-md space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-pink-100 text-[#F82BA9] flex items-center justify-center font-extrabold text-sm">
                🛡️
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-[#160E4B]">Payment Methods & Toggles</h3>
                <p className="text-xs text-gray-500">Control allowed payment gateways and promotional badges</p>
              </div>
            </div>

            <div className="space-y-2 font-bold text-xs">
              <label className="text-gray-700">Allowed Payment Gateways for This Product</label>
              <select
                value={allowedPaymentMethods}
                onChange={(e) => setAllowedPaymentMethods(e.target.value as any)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-hidden focus:border-[#F82BA9] cursor-pointer"
              >
                <option value="both">Both Prepaid (UPI/Razorpay) & Cash on Delivery</option>
                <option value="prepaid_only">Prepaid Only (Disable COD for high-customization items)</option>
                <option value="cod_only">COD Only</option>
              </select>
            </div>

            <div className="space-y-3 font-bold text-xs pt-2">
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-2xl border border-gray-200">
                <input
                  type="checkbox"
                  checked={bestseller}
                  onChange={(e) => setBestseller(e.target.checked)}
                  className="w-4 h-4 text-[#F82BA9] rounded-sm focus:ring-0 cursor-pointer"
                />
                <span>Display Bestseller Badge</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-2xl border border-gray-200">
                <input
                  type="checkbox"
                  checked={onSale}
                  onChange={(e) => setOnSale(e.target.checked)}
                  className="w-4 h-4 text-[#F82BA9] rounded-sm focus:ring-0 cursor-pointer"
                />
                <span>Display On Sale Discount Tag</span>
              </label>
            </div>
          </div>

        </div>

      </form>
    </div>
  );
};
