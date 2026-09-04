import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UniversalFrameTemplate } from '../../types/template';
import { PhotoCropModal } from './PhotoCropModal';
import { generateHighResPrintFile } from '../../utils/printExporter';
import { Eye, ArrowRight, Image as ImageIcon, Sparkles, Loader2, X, ShieldCheck, Truck, CreditCard, RefreshCw, Star, Tag, Clock, Flame, Wand2 } from 'lucide-react';
import { InteractiveCalendarZone } from './InteractiveCalendarZone';
import { getRandomBirthdayMessage } from '../../data/messageBank';
import { DeliveryPincodeChecker } from '../cart/DeliveryPincodeChecker';
import { getFrameShapeStyles } from '../../utils/shapeStyles';

interface UniversalFrameCustomizerProps {
  template: UniversalFrameTemplate;
  onProceedToCheckout: (
    photoValues: Record<string, string>,
    textValues: Record<string, string>,
    selectedSize: string,
    compiledFrameDataUrl?: string
  ) => void;
}

// 🗓️ LovecraftbySE Style Date Dropdown Picker Component
const DatePickerControl: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
}> = ({ label, value, onChange }) => {
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => String(currentYear - i));

  // Parse existing formatted date string (e.g. "20 Nov 2023")
  const parts = (value || '').trim().split(/\s+/);
  const selectedDay = parts[0] || '';
  const selectedMonth = parts[1] || '';
  const selectedYear = parts[2] || '';

  const updateDate = (day: string, month: string, year: string) => {
    if (!day && !month && !year) {
      onChange('');
      return;
    }
    const d = day || '01';
    const m = month || 'Jan';
    const y = year || String(currentYear);
    onChange(`${d} ${m} ${y}`);
  };

  return (
    <div className="space-y-1.5 col-span-full">
      <label className="text-xs font-bold text-gray-800">{label} :</label>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={selectedDay}
          onChange={(e) => updateDate(e.target.value, selectedMonth, selectedYear)}
          className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9] font-bold text-gray-800 cursor-pointer"
        >
          <option value="">Day</option>
          {days.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          value={selectedMonth}
          onChange={(e) => updateDate(selectedDay, e.target.value, selectedYear)}
          className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9] font-bold text-gray-800 cursor-pointer"
        >
          <option value="">Month</option>
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => updateDate(selectedDay, selectedMonth, e.target.value)}
          className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9] font-bold text-gray-800 cursor-pointer"
        >
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

// ⏰ LovecraftbySE Style Time Dropdown Picker Component (Hour, Minute & AM/PM Pills)
const TimePickerControl: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
}> = ({ label, value, onChange }) => {
  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  // Parse existing formatted time string (e.g. "08:20 PM")
  const match = (value || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  const selectedHour = match ? match[1].padStart(2, '0') : '';
  const selectedMinute = match ? match[2] : '';
  const selectedPeriod = match ? match[3].toUpperCase() : 'AM';

  const updateTime = (hour: string, minute: string, period: string) => {
    if (!hour && !minute) {
      onChange('');
      return;
    }
    const h = hour || '12';
    const m = minute || '00';
    const p = period || 'AM';
    onChange(`${h}:${m} ${p}`);
  };

  return (
    <div className="space-y-1.5 col-span-full">
      <label className="text-xs font-bold text-gray-800">{label} :</label>
      <div className="flex items-center gap-2">
        <select
          value={selectedHour}
          onChange={(e) => updateTime(e.target.value, selectedMinute, selectedPeriod)}
          className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9] font-bold text-gray-800 cursor-pointer"
        >
          <option value="">Hour</option>
          {hours.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>

        <span className="font-extrabold text-gray-500 text-sm">:</span>

        <select
          value={selectedMinute}
          onChange={(e) => updateTime(selectedHour, e.target.value, selectedPeriod)}
          className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9] font-bold text-gray-800 cursor-pointer"
        >
          <option value="">Minute</option>
          {minutes.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <div className="flex items-center rounded-xl border border-gray-300 overflow-hidden bg-white shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={() => updateTime(selectedHour, selectedMinute, 'AM')}
            className={`px-3 py-2 text-xs font-black cursor-pointer transition-colors ${
              selectedPeriod === 'AM'
                ? 'bg-[#160E4B] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => updateTime(selectedHour, selectedMinute, 'PM')}
            className={`px-3 py-2 text-xs font-black cursor-pointer transition-colors ${
              selectedPeriod === 'PM'
                ? 'bg-[#F82BA9] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
};

export const UniversalFrameCustomizer: React.FC<UniversalFrameCustomizerProps> = ({
  template,
  onProceedToCheckout,
}) => {
  const [photoValues, setPhotoValues] = useState<Record<string, string>>({});
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [fontValues, setFontValues] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('A4 (8x12 in)');

  const FONT_OPTIONS = [
    'Playfair Display',
    'Poppins',
    'Dancing Script',
    'Cinzel',
    'Bebas Neue',
    'Great Vibes',
    'Pacifico',
    'Lobster',
    'Caveat',
    'Montserrat',
    'Raleway',
    'Lora',
    'Cormorant Garamond',
    'Baloo 2',
    'Jost',
  ];
  const [activeSlotForCrop, setActiveSlotForCrop] = useState<any | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

  // Active Angle Image state for multi-angle photo gallery switching
  const [activeAngleImage, setActiveAngleImage] = useState<string | null>(null);

  const baseImg = template.baseImageUrl || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80';
  const rawAngleImages = 
    (template as any).images || 
    (template as any).angleImages || 
    (template as any).product?.images || 
    (template as any).product?.angleImages || 
    [];
  
  // Uploader 1 (baseImg) MUST ALWAYS be Position 1 (Default Main View), followed by Uploader 2 gallery photos!
  const availableAngleImages: string[] = Array.from(
    new Set([baseImg, ...(Array.isArray(rawAngleImages) ? rawAngleImages.filter(Boolean) : [])])
  );
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [compiledPreviewUrl, setCompiledPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [isExportingCanvas, setIsExportingCanvas] = useState<boolean>(false);
  const [liveViewers, setLiveViewers] = useState<number>(360);
  const [generatedZones, setGeneratedZones] = useState<Record<string, boolean>>({});

  const [watermarkSettings, setWatermarkSettings] = useState<{ enabled: boolean; text: string }>(() => {
    const saved = localStorage.getItem('a1print_watermark_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { enabled: false, text: '' };
  });

  const handleOpenPreviewModal = async () => {
    setIsLoadingPreview(true);
    setIsPreviewModalOpen(true);
    try {
      const compiled = await Promise.race([
        generateHighResPrintFile(template, photoValues, textValues, 1200, 1760),
        new Promise<string>((res) => setTimeout(() => res(''), 2500)),
      ]);
      if (compiled) {
        setCompiledPreviewUrl(compiled);
      }
    } catch (e) {
      console.warn('Preview compilation fallback:', e);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // ⚡ Auto-Snap Back to Uploader 1 Main Frame Image as soon as customer starts editing!
  useEffect(() => {
    if (activeAngleImage !== null) {
      const hasPhotoEdit = Object.values(photoValues).some(Boolean);
      const hasTextEdit = Object.values(textValues).some(Boolean);
      if (hasPhotoEdit || hasTextEdit) {
        setActiveAngleImage(null); // Instantly clears angle selection and snaps to Uploader 1 main frame!
      }
    }
  }, [photoValues, textValues]);

  useEffect(() => {
    const loadWatermark = () => {
      const saved = localStorage.getItem('a1print_watermark_settings');
      if (saved) {
        try { setWatermarkSettings(JSON.parse(saved)); } catch (e) {}
      }
    };
    loadWatermark();
  }, [isPreviewModalOpen]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const scheduleNextViewerUpdate = () => {
      const randomInterval = Math.floor(Math.random() * 5000) + 10000;

      timeoutId = setTimeout(() => {
        const delta = Math.floor(Math.random() * 15) - 7;
        setLiveViewers((prev) => Math.min(380, Math.max(305, prev + delta)));
        scheduleNextViewerUpdate();
      }, randomInterval);
    };

    scheduleNextViewerUpdate();

    return () => clearTimeout(timeoutId);
  }, []);

  // Crop Modal state
  const [cropModalOpen, setCropModalOpen] = useState<boolean>(false);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [tempUploadedImage, setTempUploadedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const photoSlots = template.photoSlots || [];
  const textZones = template.textZones || [];

  // Handle Photo Select -> Opens Crop Modal
  const handleOpenCropModal = (slotId: string) => {
    setActiveSlotId(slotId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const rawBase64 = reader.result as string;
        setTempUploadedImage(rawBase64);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Crop Confirmation
  const handleCropAndSubmit = (croppedDataUrl: string) => {
    if (activeSlotId) {
      setPhotoValues((prev) => ({
        ...prev,
        [activeSlotId]: croppedDataUrl,
      }));
    }
    setCropModalOpen(false);
    setTempUploadedImage(null);
    setActiveSlotId(null);
  };

  // Proceed with High-Res Export -> Checkout (Strict Mandatory Field Validation!)
  const handleProceedWithExport = async () => {
    // 1. Mandatory Text Fields Validation
    const missingText = (template.textZones || []).filter((z) => !textValues[z.id] || textValues[z.id].trim() === '');
    if (missingText.length > 0) {
      setValidationError(`⚠️ All customization fields are required! Please complete: ${missingText.map(t => t.label).join(', ')}`);
      return;
    }

    // 2. Mandatory Photo Slots Validation
    const missingPhotos = (template.photoSlots || []).filter((s) => !photoValues[s.id]);
    if (missingPhotos.length > 0) {
      setValidationError(`⚠️ All photo slots are required! Please upload photos for: ${missingPhotos.map(p => p.label).join(', ')}`);
      return;
    }

    setValidationError(null);
    setIsExportingCanvas(true);
    try {
      let compiled = compiledPreviewUrl;
      if (!compiled) {
        compiled = await Promise.race([
          generateHighResPrintFile(template, photoValues, textValues, 1200, 1760),
          new Promise<string>((res) => setTimeout(() => res(''), 2500)),
        ]);
      }
      setIsExportingCanvas(false);
      onProceedToCheckout(photoValues, textValues, selectedSize, compiled || template.baseImageUrl);
    } catch (err) {
      console.warn('Canvas export fallback:', err);
      setIsExportingCanvas(false);
      onProceedToCheckout(photoValues, textValues, selectedSize, compiledPreviewUrl || template.baseImageUrl);
    }
  };

  // Detect if customer has started customization (entered text or uploaded photo)
  const hasStartedCustomization = useMemo(() => {
    const safeText = textValues || {};
    const safePhoto = photoValues || {};
    const hasTextValues = Object.values(safeText).some((v) => v && String(v).trim().length > 0);
    const hasPhotoValues = Object.values(safePhoto).some((v) => v && String(v).length > 0);
    return Boolean(hasTextValues || hasPhotoValues);
  }, [textValues, photoValues]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-jost select-none">
      
      {/* Left Column: Sticky Live Frame Visualizer (5 Cols) */}
      <div className="lg:col-span-5 lg:sticky lg:top-24 flex flex-col items-center space-y-4">
        
        <div 
          className="relative w-full min-h-[480px] sm:min-h-[540px] rounded-3xl overflow-hidden p-4 sm:p-6 flex items-center justify-center shadow-xl border border-gray-200"
          style={{
            backgroundImage: "url('https://lovecraftbyse.com/wp-content/uploads/2025/06/single-bg.webp')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Top-Left Promotional Badges (LovecraftbySE Style) */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <span className="px-3 py-1 bg-[#F82BA9] text-white font-extrabold text-[11px] rounded-md shadow-md uppercase tracking-wider">
              33% Off
            </span>
            <span className="px-3 py-1 bg-sky-500 text-white font-extrabold text-[11px] rounded-md shadow-md uppercase tracking-wider">
              COD Available
            </span>
          </div>

          {/* Main Showcase Viewer: Only Main Poster Template (Index 0) gets synthetic frame border + photo slots + text zone overlays! */}
          {activeAngleImage && activeAngleImage !== baseImg && activeAngleImage !== availableAngleImages[0] ? (
            /* Clean Showcase Viewer for Secondary Gallery Angle Photos (No Frame Border, No Overlays, No Cropping) */
            <div className="relative w-full max-w-[440px] aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-white flex items-center justify-center p-3 border border-gray-200">
              <img
                src={activeAngleImage}
                alt={`${template.title} Gallery Angle`}
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>
          ) : (
            /* Interactive Main Frame Template Canvas (Synthetic Black Wood Frame + Photo Slots + Text Zones Overlay) */
            <div 
              id="live-frame-canvas"
              className={`relative w-full rounded-xs border-[12px] sm:border-[16px] border-black shadow-[0_25px_60px_rgba(0,0,0,0.6)] bg-white overflow-hidden font-serif select-none transition-all ${
                ((template.product as any)?.orientation || (template as any).orientation) === 'landscape'
                  ? 'max-w-[480px] aspect-[4/3]'
                  : 'max-w-[340px] aspect-[3/4.4]'
              }`}
            >
              {/* Base Frame Poster Image with Bulletproof Fallback & onError Guard */}
              <img
                src={baseImg}
                alt={template.title}
                className="w-full h-full object-cover absolute inset-0 pointer-events-none"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80';
                }}
              />

              {/* Dynamic Photo Slot Cutouts Overlay - Transparent by default until customer uploads photo! */}
              {photoSlots.map((slot) => {
                const photoSrc = photoValues[slot.id];
                if (!photoSrc) return null; // Transparent layer: Allows base poster sample artwork to show through!

                const shapeStyles = getFrameShapeStyles(slot.shape);

                return (
                  <div
                    key={slot.id}
                    className="absolute overflow-hidden p-0 border-0 shadow-xs bg-transparent"
                    style={{
                      left: `${slot.x}%`,
                      top: `${slot.y}%`,
                      width: `${slot.width}%`,
                      height: `${slot.height}%`,
                      transform: 'translate(-50%, -50%)',
                      ...shapeStyles,
                    }}
                  >
                    <img src={photoSrc} alt={slot.label} className="w-full h-full object-cover rounded-[inherit]" />
                  </div>
                );
              })}

              {/* Dynamic Text Zones Overlay using Saved Coordinates */}
              {textZones.map((zone) => {
                const val = textValues[zone.id] || zone.defaultValue;

                const labelLower = (zone.label || '').toLowerCase();
                const idLower = (zone.id || '').toLowerCase();
                const valLower = (zone.defaultValue || '').toLowerCase();

                const isCalendarZone = zone.type === 'calendar' || zone.isCalendar === true;

                // Render Interactive Calendar Grid with Red Heart Highlight if zone is calendar or date type
                if (isCalendarZone) {
                  return (
                    <div
                      key={zone.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${zone.x}%`,
                        top: `${zone.y}%`,
                      }}
                    >
                      <InteractiveCalendarZone
                        dateString={val}
                        color={zone.color}
                        fontFamily={zone.fontFamily}
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={zone.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 whitespace-pre-wrap break-words leading-tight"
                    style={{
                      left: `${zone.x}%`,
                      top: `${zone.y}%`,
                      width: zone.maxWidth ? `${zone.maxWidth}%` : '85%',
                      maxWidth: zone.maxWidth ? `${zone.maxWidth}%` : '85%',
                      color: zone.color,
                      fontFamily: zone.fontFamily,
                      fontSize: `${zone.fontSize * 0.75}px`,
                      fontWeight: 'bold',
                      textAlign: zone.align || 'center',
                    }}
                  >
                    {val}
                  </div>
                );
              })}

            </div>
          )}
        </div>

        {/* Dedicated Standalone Multi-Angle Photo Selection Carousel (Matching giftingstudio.in OUTSIDE showcase box) */}
        {!hasStartedCustomization && availableAngleImages.length > 1 && (
          <div className="w-full bg-white p-4 rounded-3xl border border-gray-200 shadow-xs text-center space-y-2">
            <span className="text-xs font-extrabold text-gray-800 block">Select Frame Angle View:</span>
            <div className="flex items-center justify-center gap-3 overflow-x-auto py-1 px-2">
              {availableAngleImages.map((imgUrl: string, idx: number) => {
                const isActive = (activeAngleImage || template.baseImageUrl) === imgUrl;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveAngleImage(imgUrl)}
                    className={`relative w-16 sm:w-20 h-20 sm:h-24 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 shadow-xs ${
                      isActive ? 'border-[#F82BA9] ring-4 ring-[#F82BA9]/20 scale-105 shadow-md' : 'border-gray-300 hover:border-pink-300 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Right Column: LovecraftbySE Product Header & Form Controls (7 Cols) */}
      <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs space-y-5">
        
        {/* Product Title Header */}
        <div className="space-y-2">
          <h1 className="font-playfair text-2xl sm:text-3xl font-extrabold text-[#160E4B] leading-tight">
            {template.title}
          </h1>

          {/* Price Range & Ratings Bar (LovecraftbySE Style) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-xl sm:text-2xl text-[#F82BA9]">
                Rs.699.00 – Rs.999.00
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-pink-100/70 text-[#F82BA9] px-3 py-1 rounded-full text-xs font-extrabold border border-pink-200">
              <Star className="w-3.5 h-3.5 fill-[#F82BA9] text-[#F82BA9]" />
              <span>4.3 3 Reviews</span>
            </div>
          </div>
        </div>

        {/* Green Raksha Bandhan Offer Banner */}
        <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-md text-xs sm:text-sm font-bold flex items-center gap-2">
          <span className="text-base">🎁</span>
          <span>🔥 Raksha Bandhan Discount, Order Today & Get 9% OFF on Prepaid Orders!! 🎁</span>
        </div>

        {/* Urgency & Trending Badges Row */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <div className="px-3.5 py-1.5 bg-[#160E4B] text-white rounded-xl flex items-center gap-1.5 shadow-xs">
            <Tag className="w-3.5 h-3.5 text-pink-400" />
            <span>Hurry up ! Prices may increase soon</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-[#F82BA9] text-white rounded-xl flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> Trending
            </span>

            <span className="px-3 py-1.5 bg-pink-100 text-pink-900 rounded-xl border border-pink-200 flex items-center gap-1.5 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-[#F82BA9]" />
              <span>
                {(() => {
                  const currentHourSeed = Math.floor(Date.now() / (1000 * 60 * 60));
                  const idHash = (template.productId || 'prod-1').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                  const dynamicOrderCount = 25 + ((idHash * 37 + currentHourSeed * 13) % 38);
                  return dynamicOrderCount;
                })()} orders Placed in last 24 hours.
              </span>
            </span>
          </div>
        </div>

        {/* Size Selection Cards (LovecraftbySE Style) */}
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-extrabold text-gray-800">
            Size (Select frame size)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => setSelectedSize('A3')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedSize === 'A3'
                  ? 'border-[#F82BA9] bg-[#F82BA9]/5 ring-2 ring-[#F82BA9]'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <h4 className="font-extrabold text-sm text-[#160E4B]">A3 (12x18 Inch)</h4>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-extrabold text-sm text-gray-900">Rs.999.00</span>
                <span className="text-xs text-gray-400 line-through">Rs.1,499.00</span>
              </div>
            </div>

            <div
              onClick={() => setSelectedSize('A4')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedSize === 'A4'
                  ? 'border-[#F82BA9] bg-[#F82BA9]/5 ring-2 ring-[#F82BA9]'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <h4 className="font-extrabold text-sm text-[#160E4B]">A4 (8x12 Inch)</h4>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-extrabold text-sm text-[#F82BA9]">Rs.699.00</span>
                <span className="text-xs text-gray-400 line-through">Rs.999.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Customization Box (Contains Photo Uploads & Text Inputs cleanly!) */}
        {(photoSlots.length > 0 || textZones.length > 0) && (
          <div className="p-4 sm:p-5 bg-purple-50/40 rounded-2xl border border-purple-100 max-h-[420px] overflow-y-auto space-y-5 scrollbar-thin">
            
            {/* Dynamic Photo Slot Upload Buttons - Renders ONLY IF photoSlots exist! */}
            {photoSlots.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-extrabold text-xs text-[#160E4B] uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#F82BA9]" /> Photo Uploads
                </h4>
                
                {/* Validation Error Alert Banner */}
                {validationError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs font-bold flex items-center justify-between shadow-xs">
                    <span>{validationError}</span>
                    <button onClick={() => setValidationError(null)} className="text-rose-600 hover:text-rose-900 font-extrabold text-sm ml-2 cursor-pointer">✕</button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {photoSlots.map((slot) => (
                    <div key={slot.id} className="p-3 bg-white rounded-xl border border-purple-100 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-gray-900 block">{slot.label}</span>
                        <span className="text-[10px] text-gray-400">Shape: {slot.shape}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {photoValues[slot.id] && (
                          <div className="w-10 h-10 rounded-lg border border-gray-300 overflow-hidden shrink-0">
                            <img src={photoValues[slot.id]} alt={slot.label} className="w-full h-full object-cover" />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenCropModal(slot.id)}
                          className="px-2.5 py-1.5 bg-[#F82BA9] hover:bg-[#D61B90] text-white text-[11px] font-extrabold rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <ImageIcon className="w-3 h-3" /> {photoValues[slot.id] ? 'Change' : 'Upload'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Text Input Fields & Dropdown Date/Time Pickers */}
            {textZones.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-purple-100">
                <h4 className="font-extrabold text-xs text-[#160E4B] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#F82BA9]" /> Custom Text Details
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {!textZones.some((z) => {
                    const l = (z.label || '').toLowerCase();
                    const i = (z.id || '').toLowerCase();
                    return z.isCalendar || z.type === 'calendar' || z.type === 'date' || l.includes('date') || l.includes('dob') || i.includes('date');
                  }) && (
                    <DatePickerControl
                      label="Special Birthday Date (Calendar ❤️)"
                      value={textValues['specialDate'] || '14 Feb 2026'}
                      onChange={(val) => setTextValues({ ...textValues, specialDate: val })}
                    />
                  )}

                  {textZones.map((zone) => {
                    const labelLower = (zone.label || '').toLowerCase();
                    const idLower = (zone.id || '').toLowerCase();
                    
                    const isDateField = zone.isCalendar || zone.type === 'calendar' || zone.type === 'date' || labelLower.includes('date') || labelLower.includes('dob') || idLower.includes('date');
                    const isTimeField = zone.type === 'time' || labelLower.includes('time') || idLower.includes('time');
                    const isMessageField = zone.type === 'message' || zone.isAIMessage === true;

                    if (isDateField) {
                      return (
                        <DatePickerControl
                          key={zone.id}
                          label={zone.label}
                          value={textValues[zone.id] || ''}
                          onChange={(val) => setTextValues({ ...textValues, [zone.id]: val })}
                        />
                      );
                    }

                    if (isTimeField) {
                      return (
                        <TimePickerControl
                          key={zone.id}
                          label={zone.label}
                          value={textValues[zone.id] || ''}
                          onChange={(val) => setTextValues({ ...textValues, [zone.id]: val })}
                        />
                      );
                    }

                    if (isMessageField) {
                      const hasBeenGenerated = generatedZones[zone.id];
                      return (
                        <div key={zone.id} className="space-y-1.5 sm:col-span-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-800">{zone.label} :</label>
                            <button
                              type="button"
                              onClick={() => {
                                const newMsg = getRandomBirthdayMessage(textValues[zone.id] || zone.defaultValue);
                                setTextValues({ ...textValues, [zone.id]: newMsg });
                                setGeneratedZones((prev) => ({ ...prev, [zone.id]: true }));
                              }}
                              className="text-[11px] font-extrabold text-[#F82BA9] hover:text-pink-700 bg-pink-50 hover:bg-pink-100 px-3 py-1 rounded-xl border border-pink-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Click to generate or regenerate custom message"
                            >
                              {hasBeenGenerated ? '🔄 Regenerate' : '✨ Generate'}
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={textValues[zone.id] || ''}
                            onChange={(e) => setTextValues({ ...textValues, [zone.id]: e.target.value })}
                            className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9] font-medium"
                            placeholder="Type custom message or click Generate Message button..."
                          />
                        </div>
                      );
                    }

                    return (
                      <div key={zone.id} className="space-y-1 sm:col-span-1">
                        <label className="text-xs font-bold text-gray-800 block">{zone.label} :</label>
                        <input
                          type="text"
                          value={textValues[zone.id] || ''}
                          onChange={(e) => setTextValues({ ...textValues, [zone.id]: e.target.value })}
                          className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9] font-medium"
                          placeholder={`Enter ${zone.label}...`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* E-Commerce Trust Badges (LovecraftbySE Style) */}
        <div className="grid grid-cols-2 gap-3 py-2 text-[11px] text-gray-700 font-bold border-y border-gray-100">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Free Delivery Pan India</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Cash on Delivery Available</span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Express 3-5 Days Courier</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-pink-600 shrink-0" />
            <span>300 GSM Archival Quality</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-1">
          {template.product?.isSampleData && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-extrabold rounded-2xl flex items-center gap-2">
              <span>⚠️</span>
              <span>This is a <strong>Demo / Sample Product</strong> for preview purposes only and cannot be purchased.</span>
            </div>
          )}

          <button
            type="button"
            disabled={isExportingCanvas || Boolean(template.product?.isSampleData)}
            onClick={handleProceedWithExport}
            className={`w-full py-4 text-white font-extrabold text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 ${
              template.product?.isSampleData
                ? 'bg-gray-400 cursor-not-allowed opacity-70'
                : 'bg-[#3C187B] hover:bg-[#2A1058] cursor-pointer'
            }`}
          >
            {isExportingCanvas ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Customized Frame Image...
              </>
            ) : template.product?.isSampleData ? (
              <>
                Demo Product — Purchase Disabled
              </>
            ) : (
              <>
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* 👁️ Preview High-Res Customized Frame Button (Moved under Proceed to Checkout) */}
          <button
            type="button"
            onClick={handleOpenPreviewModal}
            className="w-full py-3.5 bg-[#F82BA9]/10 hover:bg-[#F82BA9]/20 text-[#F82BA9] font-extrabold text-xs rounded-2xl border border-[#F82BA9]/30 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <Eye className="w-4 h-4" /> 👁️ Preview High-Res Customized Frame
          </button>

          {/* Live Customers Viewing Counter Ticker (LovecraftbySE Urgency Ticker) */}
          <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-orange-50/80 border border-orange-200 rounded-2xl text-xs font-extrabold text-orange-900 shadow-2xs">
            <span className="text-base animate-pulse">👁️</span>
            <span>
              <strong className="text-orange-600 font-black text-sm">{liveViewers}</strong> customers are viewing this product
            </span>
          </div>

          {/* Delivery Pincode Checker & Cash on Delivery Available Section */}
          <DeliveryPincodeChecker className="pt-2" />
        </div>

      </div>

      {/* Crop Modal Popup */}
      <PhotoCropModal
        isOpen={cropModalOpen}
        imageSrc={tempUploadedImage}
        onCropAndSubmit={handleCropAndSubmit}
        onCancel={() => {
          setCropModalOpen(false);
          setTempUploadedImage(null);
        }}
      />

      {/* High-Res Customized Frame Preview Modal Popup */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-jost animate-fadeIn">
          <div className="relative bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col items-center space-y-4">
            
            <div className="flex items-center justify-between w-full border-b border-gray-200 pb-3">
              <h3 className="font-bold text-base text-[#160E4B] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#F82BA9]" /> High-Res Customized Frame Preview
              </h3>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-Res Canvas Container */}
            <div 
              className="relative w-full max-w-[340px] aspect-[3/4.4] rounded-xs border-8 border-black shadow-2xl bg-white overflow-hidden select-none font-serif flex items-center justify-center"
            >
              {isLoadingPreview ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-3">
                  <Loader2 className="w-8 h-8 text-[#F82BA9] animate-spin" />
                  <p className="text-xs font-bold text-gray-700">Compiling 300 DPI High-Res Preview...</p>
                </div>
              ) : compiledPreviewUrl ? (
                <img
                  src={compiledPreviewUrl}
                  alt={template.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <img
                    src={template.baseImageUrl}
                    alt={template.title}
                    className="w-full h-full object-cover absolute inset-0 pointer-events-none"
                  />

                  {photoSlots.map((slot) => {
                    const photoSrc = photoValues[slot.id];
                    if (!photoSrc) return null;
                    const shapeStyles = getFrameShapeStyles(slot.shape);

                    return (
                      <div
                        key={slot.id}
                        className="absolute overflow-hidden p-0 border-0 bg-transparent"
                        style={{
                          left: `${slot.x}%`,
                          top: `${slot.y}%`,
                          width: `${slot.width}%`,
                          height: `${slot.height}%`,
                          transform: 'translate(-50%, -50%)',
                          ...shapeStyles,
                        }}
                      >
                        <img src={photoSrc} alt={slot.label} className="w-full h-full object-cover rounded-[inherit]" />
                      </div>
                    );
                  })}

                  {textZones.map((zone) => {
                    const val = textValues[zone.id] || zone.defaultValue;

                    const labelLower = (zone.label || '').toLowerCase();
                    const idLower = (zone.id || '').toLowerCase();
                    const valLower = (zone.defaultValue || '').toLowerCase();

                    const isCalendarZone = zone.type === 'calendar' || zone.isCalendar === true;

                    if (isCalendarZone) {
                      return (
                        <div
                          key={zone.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2"
                          style={{
                            left: `${zone.x}%`,
                            top: `${zone.y}%`,
                          }}
                        >
                          <InteractiveCalendarZone
                            dateString={val}
                            color={zone.color}
                            fontFamily={zone.fontFamily}
                          />
                        </div>
                      );
                    }

                    return (
                      <div
                        key={zone.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 whitespace-pre-wrap break-words leading-tight"
                        style={{
                          left: `${zone.x}%`,
                          top: `${zone.y}%`,
                          width: zone.maxWidth ? `${zone.maxWidth}%` : '85%',
                          maxWidth: zone.maxWidth ? `${zone.maxWidth}%` : '85%',
                          color: zone.color,
                          fontFamily: zone.fontFamily,
                          fontSize: `${zone.fontSize * 0.7}px`,
                          fontWeight: 'bold',
                          textAlign: zone.align || 'center',
                        }}
                      >
                        {val}
                      </div>
                    );
                  })}
                </>
              )}

              {/* Anti-Piracy Protection Watermark Overlay */}
              {watermarkSettings.enabled && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-30">
                  <div className="text-pink-500/40 font-extrabold text-2xl sm:text-3xl uppercase tracking-widest -rotate-45 select-none text-center px-6 py-3 border-4 border-pink-500/40 rounded-2xl backdrop-blur-[0.5px]">
                    {watermarkSettings.text || 'A1PRINT STUDIO SAMPLE'}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Hidden Native File Input Element (Guarantees 100% Cross-Browser & Mobile Compatibility!) */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

    </div>
  );
};
