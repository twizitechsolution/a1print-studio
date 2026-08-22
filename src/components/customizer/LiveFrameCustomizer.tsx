import React, { useState, useRef } from 'react';
import { Product, FrameSize, FrameOption, CartItem } from '../../types';
import { Upload, X, ZoomIn, ZoomOut, RotateCw, Move, Check, Sparkles, AlertCircle, ShoppingBag, Eye } from 'lucide-react';

interface LiveFrameCustomizerProps {
  product: Product;
  onAddToCart: (cartItem: Omit<CartItem, 'id'>) => void;
  onDirectCheckout: (cartItem: Omit<CartItem, 'id'>) => void;
}

export const LiveFrameCustomizer: React.FC<LiveFrameCustomizerProps> = ({
  product,
  onAddToCart,
  onDirectCheckout,
}) => {
  const [selectedSize, setSelectedSize] = useState<FrameSize>(
    product.sizes.find((s) => s.isPopular) || product.sizes[0]
  );
  const [selectedFrame, setSelectedFrame] = useState<FrameOption>(
    product.frameOptions[0]
  );

  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [photoScale, setPhotoScale] = useState<number>(1);
  const [photoRotation, setPhotoRotation] = useState<number>(0);
  const [photoPosition, setPhotoPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [customTextValues, setCustomTextValues] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        setValidationError('File size exceeds 25MB limit. Please select a smaller photo.');
        return;
      }
      setValidationError(null);
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedPhoto(event.target?.result as string);
        setPhotoScale(1);
        setPhotoRotation(0);
        setPhotoPosition({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setUploadedPhoto(null);
    setUploadedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTextChange = (key: string, value: string) => {
    setCustomTextValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!uploadedPhoto) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - photoPosition.x, y: e.clientY - photoPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPhotoPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const buildCartItem = (): Omit<CartItem, 'id'> | null => {
    if (!uploadedPhoto) {
      setValidationError('Please upload a photo to customize your frame!');
      return null;
    }
    setValidationError(null);

    return {
      product,
      selectedSize,
      selectedFrame,
      uploadedPhotoUrl: uploadedPhoto,
      uploadedFileName,
      customTextValues,
      quantity: 1,
      photoScale,
      photoPosition,
      photoRotation,
      itemTotalPrice: selectedSize.price,
    };
  };

  const handleAddToCartClick = () => {
    const item = buildCartItem();
    if (item) {
      onAddToCart(item);
    }
  };

  const handleBuyNowClick = () => {
    const item = buildCartItem();
    if (item) {
      onDirectCheckout(item);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-6">
      
      {/* Left Column: Interactive Live Frame Canvas & Controls (7 Cols) */}
      <div className="lg:col-span-7 bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-inner">
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F82BA9]/10 text-[#F82BA9]">
            <Eye className="w-3.5 h-3.5" /> LIVE REAL-TIME PREVIEW
          </span>
          <span className="text-xs text-gray-500 font-medium">
            300 DPI Archival Print Export
          </span>
        </div>

        {/* Frame Canvas Wrapper */}
        <div 
          className="relative mx-auto max-w-md aspect-3/4 flex items-center justify-center p-4 rounded-xl transition-all duration-300 select-none overflow-hidden"
          style={{ background: 'url("https://lovecraftbyse.com/wp-content/uploads/2025/06/single-bg.webp") center/cover' }}
        >
          {/* Outer Selected Frame Container */}
          <div 
            className={`relative w-full h-full rounded-md transition-all duration-300 flex items-center justify-center overflow-hidden bg-white ${selectedFrame.borderStyle}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {uploadedPhoto ? (
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing">
                
                {/* User Uploaded Photo with transform controls */}
                <img
                  src={uploadedPhoto}
                  alt="Customer Uploaded Customization"
                  className="max-w-none transition-transform duration-75 object-contain"
                  style={{
                    transform: `translate(${photoPosition.x}px, ${photoPosition.y}px) scale(${photoScale}) rotate(${photoRotation}deg)`,
                  }}
                />

                {/* Overlaid Custom Text (For Baby / Couple / Name templates) */}
                {product.requiresCustomText && (
                  <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-xs p-3 rounded-lg text-center shadow-md border border-white/40 pointer-events-none">
                    {customTextValues.babyName && (
                      <h3 className="font-playfair font-bold text-lg text-[#160E4B] leading-tight">
                        {customTextValues.babyName}
                      </h3>
                    )}
                    {customTextValues.coupleNames && (
                      <h3 className="font-dancing font-bold text-xl text-[#F82BA9] leading-tight">
                        {customTextValues.coupleNames}
                      </h3>
                    )}
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-[11px] text-gray-700 font-medium mt-1">
                      {customTextValues.birthDate && <span>📅 {customTextValues.birthDate}</span>}
                      {customTextValues.birthTime && <span>⏰ {customTextValues.birthTime}</span>}
                      {customTextValues.weightHeight && <span>⚖️ {customTextValues.weightHeight}</span>}
                      {customTextValues.specialDate && <span>❤️ {customTextValues.specialDate}</span>}
                    </div>
                    {customTextValues.customMessage && (
                      <p className="font-caveat text-sm text-[#3C187B] mt-1 italic">
                        "{customTextValues.customMessage}"
                      </p>
                    )}
                  </div>
                )}

                {/* Remove Photo Red 'X' Button */}
                <button
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 z-20"
                  title="Remove uploaded image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Dashed Upload Dropzone when no photo uploaded */
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer border-2 border-dashed border-[#F82BA9]/40 hover:border-[#F82BA9] bg-white/70 hover:bg-white transition-all rounded-lg group"
              >
                <div className="w-14 h-14 rounded-full bg-[#F82BA9]/10 text-[#F82BA9] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="font-jost font-bold text-sm text-[#160E4B]">
                  Click or Drag Photo Here
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Supports JPG, PNG, WEBP (High Resolution Recommended)
                </p>
                <span className="mt-3 px-4 py-1.5 text-xs font-bold text-white bg-[#F82BA9] rounded-md shadow-xs">
                  Upload Photo
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />

        {/* Image Adjustment Control Bar (When photo is uploaded) */}
        {uploadedPhoto && (
          <div className="mt-4 p-3 bg-white rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 flex items-center gap-1">
                <Move className="w-3.5 h-3.5 text-[#F82BA9]" /> Drag to Reposition
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <ZoomOut className="w-3.5 h-3.5 text-gray-500" />
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={photoScale}
                onChange={(e) => setPhotoScale(parseFloat(e.target.value))}
                className="w-24 accent-[#F82BA9] cursor-pointer"
              />
              <ZoomIn className="w-3.5 h-3.5 text-gray-500" />
              <span className="w-8 font-mono">{Math.round(photoScale * 100)}%</span>
            </div>

            {/* Rotation Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPhotoRotation((prev) => (prev + 90) % 360)}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-medium flex items-center gap-1 transition-colors"
                title="Rotate 90 Degrees"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#F82BA9]" /> Rotate ({photoRotation}°)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Customization Options & Order Form (5 Cols) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Validation Warning Alert */}
        {validationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* 1. Frame Size Selector Cards (Matching reference radio buttons) */}
        <div>
          <label className="block text-sm font-bold text-[#160E4B] mb-2 font-jost">
            1. Select Frame Size <span className="text-[#F82BA9]">*</span>
          </label>

          <div className="space-y-2.5">
            {product.sizes.map((size) => {
              const isChecked = selectedSize.id === size.id;
              return (
                <div
                  key={size.id}
                  onClick={() => setSelectedSize(size)}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    isChecked
                      ? 'border-[#F82BA9] bg-[#F82BA9] text-white shadow-md'
                      : 'border-gray-200 bg-white hover:border-[#F82BA9]/50 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isChecked ? 'border-white bg-white' : 'border-gray-400'
                      }`}
                    >
                      {isChecked && <div className="w-2 h-2 rounded-full bg-[#F82BA9]" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm font-jost ${isChecked ? 'text-white' : 'text-gray-900'}`}>
                          {size.name}
                        </span>
                        {size.isPopular && (
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                              isChecked ? 'bg-white text-[#F82BA9]' : 'bg-[#F82BA9] text-white'
                            }`}
                          >
                            Bestseller
                          </span>
                        )}
                      </div>
                      <span className={`text-xs ${isChecked ? 'text-pink-100' : 'text-gray-500'}`}>
                        {size.dimensions}
                      </span>
                    </div>
                  </div>

                  {/* Price Tags matching ins/del from lovecraftbyse */}
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className={`font-extrabold text-base ${isChecked ? 'text-white' : 'text-[#F82BA9]'}`}>
                        ₹{size.price}
                      </span>
                      <span className={`text-xs line-through ${isChecked ? 'text-pink-200' : 'text-gray-400'}`}>
                        ₹{size.originalPrice}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${
                        isChecked ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {size.discountPercentage}% OFF
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Frame Border Style Selector */}
        <div>
          <label className="block text-sm font-bold text-[#160E4B] mb-2 font-jost">
            2. Choose Frame Material & Finish
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {product.frameOptions.map((frame) => {
              const isSelected = selectedFrame.id === frame.id;
              return (
                <button
                  key={frame.id}
                  type="button"
                  onClick={() => setSelectedFrame(frame)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex flex-col items-center gap-1.5 ${
                    isSelected
                      ? 'border-[#F82BA9] bg-[#F82BA9]/5 text-[#F82BA9] ring-2 ring-[#F82BA9]'
                      : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-md border shadow-xs"
                    style={{ backgroundColor: frame.frameColor }}
                  />
                  <span className="text-center leading-tight">{frame.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Custom Text Details Form (If applicable to baby/couple frame) */}
        {product.requiresCustomText && product.customTextInputs && (
          <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#3C187B]">
              ✨ 3. Personalize Details (Text on Frame)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {product.customTextInputs.map((input) => (
                <div key={input.key} className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">
                    {input.label}
                  </label>
                  <input
                    type={input.type || 'text'}
                    placeholder={input.placeholder}
                    value={customTextValues[input.key] || ''}
                    onChange={(e) => handleTextChange(input.key, e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-purple-200 rounded-lg focus:outline-hidden focus:border-[#F82BA9] focus:ring-1 focus:ring-[#F82BA9]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price & Action Buttons Container */}
        <div className="pt-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 font-medium">Total Payable Price:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#160E4B] font-jost">
                  ₹{selectedSize.price}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  ₹{selectedSize.originalPrice}
                </span>
                <span className="text-xs font-bold text-[#F82BA9]">
                  (Inclusive of Taxes & FREE Delivery)
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleAddToCartClick}
              className="w-full py-3.5 px-4 bg-white border-2 border-[#F82BA9] text-[#F82BA9] hover:bg-[#F82BA9]/5 font-bold font-jost text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" /> Add to Cart
            </button>

            <button
              onClick={handleBuyNowClick}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#F82BA9] to-[#D61B90] hover:from-[#D61B90] hover:to-[#F82BA9] text-white font-bold font-jost text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group"
            >
              <Sparkles className="w-4 h-4 animate-spin" /> Buy Now (Instant Order)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
