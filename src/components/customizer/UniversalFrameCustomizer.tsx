import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UniversalFrameTemplate } from '../../types/template';
import { PhotoCropModal } from './PhotoCropModal';
import { generateHighResPrintFile } from '../../utils/printExporter';
import { Eye, ArrowRight, Image as ImageIcon, Sparkles, Loader2, X, ShieldCheck, Truck, CreditCard, RefreshCw, Star, Tag, Clock, Flame, Wand2 } from 'lucide-react';
import { InteractiveCalendarZone } from './InteractiveCalendarZone';
import { getRandomBirthdayMessage } from '../../data/messageBank';
import { DeliveryPincodeChecker } from '../cart/DeliveryPincodeChecker';
import { getFrameShapeStyles } from '../../utils/shapeStyles';
import { resolveVisibility } from '../../admin/template-studio/utils/templateDefaults';
import { renderTemplateComposite } from '../../utils/templateCompositor';
import { useCustomizerSessionStore } from '../../store/useCustomizerSessionStore';

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

  // Parse existing formatted date string (e.g. "20 Nov 2023" or "16/10/2023")
  let selectedDay = '';
  let selectedMonth = '';
  let selectedYear = '';

  if (value) {
    const slashMatch = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (slashMatch) {
      selectedDay = slashMatch[1].padStart(2, '0');
      const mNum = parseInt(slashMatch[2], 10);
      selectedMonth = months[mNum - 1] || '';
      selectedYear = slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3];
    } else {
      const parts = value.trim().split(/\s+/);
      selectedDay = parts[0]?.padStart(2, '0') || '';
      selectedMonth = parts[1] || '';
      selectedYear = parts[2] || '';
    }
  }

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

  // Parse existing formatted time string (e.g. "08:20 PM" or "04:35.p.m" or "04:35")
  const match = (value || '').match(/(\d{1,2})[:.](\d{2})\s*(?:([ap]\.?m\.?)|([ap]m))?/i);
  const selectedHour = match ? match[1].padStart(2, '0') : '';
  const selectedMinute = match ? match[2] : '';
  let selectedPeriod = 'AM';
  if (match && (match[3] || match[4])) {
    const rawP = (match[3] || match[4]).toLowerCase();
    selectedPeriod = rawP.includes('p') ? 'PM' : 'AM';
  }

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
  const {
    photoValues,
    textValues,
    setTextValue,
    setPhotoValue,
    uploadCustomerPhoto,
    selectedSize,
    setSelectedSize,
    initSession,
  } = useCustomizerSessionStore();

  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fontValues, setFontValues] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [missingSlotIds, setMissingSlotIds] = useState<Set<string>>(new Set());
  const [missingZoneIds, setMissingZoneIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    initSession(template);
  }, [template.id]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (liveCanvasRef.current && active) {
        renderTemplateComposite({
          canvas: liveCanvasRef.current,
          template,
          customerInputs: { photoValues, textValues },
          targetWidth: 800,
          targetHeight: 1000,
          drawFrameBorder: false,
        }).catch((err) => {
          if (active) console.warn('Live canvas render error:', err);
        });
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [template, photoValues, textValues]);

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

  // Helper to map PSD embedded font names to available Google Fonts with cursive/serif fallbacks
  const resolvePSDWebFont = (fontFamily?: string) => {
    if (!fontFamily) return "'Jost', sans-serif";
    const f = fontFamily.toLowerCase();
    if (f.includes('floryfic') || f.includes('cinderella') || f.includes('script') || f.includes('great vibes') || f.includes('dancing') || f.includes('cursive') || f.includes('calligraph')) {
      return "'Great Vibes', 'Dancing Script', cursive";
    }
    if (f.includes('clarendon') || f.includes('times') || f.includes('georgia') || f.includes('serif')) {
      return "'Playfair Display', serif";
    }
    if (f.includes('cinzel')) {
      return "'Cinzel', serif";
    }
    if (f.includes('montserrat')) {
      return "'Montserrat', sans-serif";
    }
    if (f.includes('poppins')) {
      return "'Poppins', sans-serif";
    }
    return `'${fontFamily}', 'Jost', sans-serif`;
  };

  // Responsive font size calculation based on container width query
  const resolveResponsiveFontSize = (zone: TextZoneConfig) => {
    const baseSize = zone.fontSize || 24;
    if (baseSize >= 50) {
      return 'clamp(12px, 4.2cqw, 18px)';
    }
    if (baseSize >= 25) {
      return 'clamp(11px, 3.2cqw, 15px)';
    }
    return 'clamp(9px, 2.6cqw, 12px)';
  };

  const [activeSlotForCrop, setActiveSlotForCrop] = useState<any | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);

  // Active Angle Image state for multi-angle photo gallery switching
  const [activeAngleImage, setActiveAngleImage] = useState<string | null>(null);

  const samplePreviewImg =
    template.baseImageUrl ||
    template.cleanBaseImageUrl ||
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80';

  const cleanArtworkImg =
    template.cleanBaseImageUrl ||
    template.baseImageUrl ||
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80';

  const hasCustomPhotos = Object.values(photoValues).some((v) => Boolean(v && v.trim() !== ''));
  const hasCustomTexts = Object.values(textValues).some((v) => Boolean(v && v.trim() !== ''));
  const isCustomized = hasCustomPhotos || hasCustomTexts;

  const baseImg = isCustomized ? cleanArtworkImg : samplePreviewImg;
  const rawAngleImages = 
    (template as any).images || 
    (template as any).angleImages || 
    (template as any).product?.images || 
    (template as any).product?.angleImages || 
    [];
  
  // Uploader 1 (samplePreviewImg) MUST ALWAYS be Position 1 (Default Main View), followed by Uploader 2 gallery photos!
  const availableAngleImages: string[] = Array.from(
    new Set([samplePreviewImg, ...(Array.isArray(rawAngleImages) ? rawAngleImages.filter(Boolean) : [])])
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

  // ⚡ Auto-Snap Back to Uploader 1 Main Frame Image only when customer actively makes a new edit
  const prevCustomInputsRef = useRef({ photoValues, textValues });
  useEffect(() => {
    const prev = prevCustomInputsRef.current;
    const photoChanged = JSON.stringify(prev.photoValues) !== JSON.stringify(photoValues);
    const textChanged = JSON.stringify(prev.textValues) !== JSON.stringify(textValues);
    prevCustomInputsRef.current = { photoValues, textValues };

    if ((photoChanged || textChanged) && activeAngleImage !== null && activeAngleImage !== baseImg) {
      setActiveAngleImage(null); // Switch back to main frame only when customer makes an actual edit!
    }
  }, [photoValues, textValues, activeAngleImage, baseImg]);

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
  const rawPhotoSlots = photoSlots;
  const rawTextZones = textZones;

  // Phase 4: Enforce LayerVisibility & visibleToCustomer
  // Layers with visibleToCustomer === false or userVisible === false are hidden from the customer's customization controls
  const visiblePhotoSlots = useMemo(
    () => rawPhotoSlots.filter((slot) => slot.visibleToCustomer !== false && resolveVisibility(slot.visibility).userVisible),
    [rawPhotoSlots]
  );

  const visibleTextZones = useMemo(
    () => rawTextZones.filter((zone) => zone.visibleToCustomer !== false && resolveVisibility(zone.visibility).userVisible),
    [rawTextZones]
  );

  // Handle Photo Select -> Opens Crop Modal
  const handleOpenCropModal = (slotId: string) => {
    const slot = rawPhotoSlots.find((s) => s.id === slotId);
    if (slot && !resolveVisibility(slot.visibility).userEditable) {
      return; // Non-editable slot
    }
    setActiveSlotId(slotId);
    setActiveSlotForCrop(slot || null);
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
      setPhotoValue(activeSlotId, croppedDataUrl);
      if (missingSlotIds.has(activeSlotId)) {
        setMissingSlotIds((prev) => {
          const next = new Set(prev);
          next.delete(activeSlotId);
          return next;
        });
      }
      uploadCustomerPhoto(activeSlotId, croppedDataUrl).catch((err) => {
        console.warn('Background upload of customer photo to Cloudinary:', err);
      });
    }
    setCropModalOpen(false);
    setTempUploadedImage(null);
    setActiveSlotId(null);
    setActiveSlotForCrop(null);
  };

  // Proceed with High-Res Export -> Checkout (Strict Validation on REQUIRED Visible Fields Only!)
  const handleProceedWithExport = async () => {
    // 1. Mandatory Text Fields Validation (only for visible & required text zones)
    const missingText = visibleTextZones.filter((z) => {
      const isReq = z.required || resolveVisibility(z.visibility).required;
      if (!isReq) return false;
      return !textValues[z.id] || textValues[z.id].trim() === '';
    });

    // 2. Mandatory Photo Slots Validation (only for visible & required photo slots)
    const missingPhotos = visiblePhotoSlots.filter((s) => {
      const isReq = s.required || resolveVisibility(s.visibility).required;
      if (!isReq) return false;
      return !photoValues[s.id];
    });

    if (missingText.length > 0 || missingPhotos.length > 0) {
      setMissingZoneIds(new Set(missingText.map((z) => z.id)));
      setMissingSlotIds(new Set(missingPhotos.map((s) => s.id)));

      const missingLabels = [
        ...missingPhotos.map((p) => resolveVisibility(p.visibility).userLabel || p.label),
        ...missingText.map((t) => resolveVisibility(t.visibility).userLabel || t.label),
      ].join(', ');

      setValidationError(`⚠️ Required customization field(s) missing! Please complete: ${missingLabels}`);
      return;
    }

    setMissingZoneIds(new Set());
    setMissingSlotIds(new Set());
    setValidationError(null);
    setIsExportingCanvas(true);
    try {
      const compiled = await generateHighResPrintFile(template, photoValues, textValues, 2400, 3520);
      setIsExportingCanvas(false);
      onProceedToCheckout(photoValues, textValues, selectedSize, compiled || template.cleanBaseImageUrl || template.baseImageUrl);
    } catch (err) {
      console.warn('Canvas export fallback:', err);
      setIsExportingCanvas(false);
      onProceedToCheckout(photoValues, textValues, selectedSize, template.cleanBaseImageUrl || template.baseImageUrl);
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
        
        {/* Gallery View: Full-width edge-to-edge image display with ZERO side gaps (matching giftingstudio.in) */}
        {activeAngleImage && activeAngleImage !== baseImg && activeAngleImage !== availableAngleImages[0] ? (
          <div className="relative w-full aspect-square sm:aspect-[4/5] rounded-3xl overflow-hidden bg-white border border-gray-200 shadow-md flex items-center justify-center">
            <img
              src={activeAngleImage}
              alt={`${template.title} Gallery Photo`}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {/* Subtle Floating Photo Badge */}
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white font-extrabold text-[11px] rounded-full shadow-md uppercase tracking-wider">
                Gallery View
              </span>
            </div>
          </div>
        ) : (
          /* Main Product Image inside Frame with Frame Border & Room Background visible behind it */
          <div 
            className="relative w-full aspect-square sm:aspect-[4/5] rounded-3xl overflow-hidden p-4 sm:p-6 flex items-center justify-center shadow-md border border-gray-200"
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

            {/* Interactive Main Frame Template Canvas (Synthetic Black Wood Frame + Shared HTML5 Canvas Compositor) */}
            <div 
              className="relative w-full rounded-xs border-[12px] sm:border-[16px] border-black shadow-[0_25px_60px_rgba(0,0,0,0.6)] bg-white overflow-hidden font-serif select-none transition-all max-w-[360px]"
              style={{
                aspectRatio: template.documentDimensions?.width && template.documentDimensions?.height
                  ? `${template.documentDimensions.width} / ${template.documentDimensions.height}`
                  : ((template.product as any)?.orientation || (template as any).orientation) === 'landscape' ? '4 / 3' : '4 / 5',
              }}
            >
              <canvas
                id="live-frame-canvas"
                ref={liveCanvasRef}
                className="w-full h-full block object-contain"
              />
            </div>
          </div>
        )}

        {/* Sleek Multi-Photo Thumbnail Row (Matching giftingstudio.in style) */}
        {availableAngleImages.length > 1 && (
          <div className="w-full pt-1">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {availableAngleImages.map((imgUrl: string, idx: number) => {
                const isMainThumbnail = idx === 0 || imgUrl === baseImg;
                const isActive = isMainThumbnail
                  ? (!activeAngleImage || activeAngleImage === baseImg)
                  : activeAngleImage === imgUrl;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveAngleImage(isMainThumbnail ? baseImg : imgUrl)}
                    className={`relative w-16 sm:w-20 aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      isActive
                        ? 'border-[#F82BA9] ring-2 ring-[#F82BA9]/30 shadow-md scale-105'
                        : 'border-gray-200 hover:border-pink-300 opacity-80 hover:opacity-100 hover:scale-102'
                    }`}
                  >
                    <img src={imgUrl} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                    {isMainThumbnail && (
                      <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[8px] sm:text-[9px] font-extrabold py-0.5 uppercase tracking-wider text-center">
                        Frame
                      </span>
                    )}
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
        {(visiblePhotoSlots.length > 0 || visibleTextZones.length > 0) && (
          <div className="p-4 sm:p-5 bg-purple-50/40 rounded-2xl border border-purple-100 max-h-[420px] overflow-y-auto space-y-5 scrollbar-thin">
            
            {/* Dynamic Photo Slot Upload Buttons - Renders ONLY IF visiblePhotoSlots exist! */}
            {visiblePhotoSlots.length > 0 && (
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
                  {visiblePhotoSlots.map((slot) => {
                    const vis = resolveVisibility(slot.visibility);
                    const displayLabel = vis.userLabel || slot.label;
                    const isEditable = vis.userEditable;
                    const isRequired = slot.required || vis.required;
                    const isMissing = missingSlotIds.has(slot.id);

                    return (
                      <div
                        key={slot.id}
                        className={`p-3 bg-white rounded-xl border ${
                          isMissing ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-purple-100'
                        } flex items-center justify-between gap-3 shadow-2xs transition-all`}
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-gray-900 block flex items-center gap-1">
                            {displayLabel}
                            {isRequired && <span className="text-rose-500 font-extrabold">*</span>}
                          </span>
                          <span className="text-[10px] text-gray-400">Shape: {slot.shape || 'rectangle'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {(photoValues[slot.id] || slot.defaultPhotoUrl) && (
                            <div className="w-10 h-10 rounded-lg border border-gray-300 overflow-hidden shrink-0">
                              <img src={photoValues[slot.id] || slot.defaultPhotoUrl} alt={displayLabel} className="w-full h-full object-cover" />
                            </div>
                          )}

                          {isEditable ? (
                            <button
                              type="button"
                              onClick={() => handleOpenCropModal(slot.id)}
                              className="px-2.5 py-1.5 bg-[#F82BA9] hover:bg-[#D61B90] text-white text-[11px] font-extrabold rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <ImageIcon className="w-3 h-3" /> {(photoValues[slot.id] || slot.defaultPhotoUrl) ? 'Change' : 'Upload'}
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                              Fixed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dynamic Text Input Fields & Dropdown Date/Time Pickers */}
            {visibleTextZones.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-purple-100">
                <h4 className="font-extrabold text-xs text-[#160E4B] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#F82BA9]" /> Custom Text Details
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visibleTextZones.map((zone) => {
                    const vis = resolveVisibility(zone.visibility);
                    const displayLabel = vis.userLabel || zone.label;
                    const isEditable = vis.userEditable;
                    const isRequired = zone.required || vis.required;
                    const isMissing = missingZoneIds.has(zone.id);

                    const labelLower = (zone.label || '').toLowerCase();
                    const idLower = (zone.id || '').toLowerCase();
                    
                    const isArabicDate = labelLower.includes('arabic') || labelLower.includes('islamic') || idLower.includes('arabic') || idLower.includes('islamic');
                    const isDateField = !isArabicDate && (zone.isCalendar || zone.type === 'calendar' || zone.type === 'date' || labelLower.includes('date') || labelLower.includes('dob') || idLower.includes('date'));
                    const isTimeField = zone.type === 'time' || labelLower.includes('time') || idLower.includes('time');
                    const isMessageField = zone.type === 'message' || zone.isAIMessage === true;
                    const isSelectField = zone.type === 'select' || (Array.isArray(zone.selectOptions) && zone.selectOptions.length > 0);

                    const handleTextChange = (val: string) => {
                      if (!isEditable) return;
                      setTextValue(zone.id, val);
                      if (missingZoneIds.has(zone.id)) {
                        setMissingZoneIds((prev) => {
                          const next = new Set(prev);
                          next.delete(zone.id);
                          return next;
                        });
                      }
                    };

                    if (isSelectField) {
                      return (
                        <div key={zone.id} className="space-y-1 sm:col-span-1">
                          <label className="text-xs font-bold text-gray-800 block">
                            {displayLabel} {isRequired && <span className="text-rose-500 font-extrabold">*</span>} :
                          </label>
                          <select
                            disabled={!isEditable}
                            value={textValues[zone.id] !== undefined ? textValues[zone.id] : (zone.defaultValue || zone.selectOptions?.[0] || '')}
                            onChange={(e) => handleTextChange(e.target.value)}
                            className={`w-full px-3 py-2 text-xs bg-white border ${
                              isMissing ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-gray-300'
                            } rounded-xl focus:outline-hidden focus:border-[#F82BA9] font-medium disabled:bg-slate-100 cursor-pointer`}
                          >
                            {(zone.selectOptions || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    }

                    if (isDateField) {
                      return (
                        <div key={zone.id} className={`${!isEditable ? 'pointer-events-none opacity-80' : ''} ${isMissing ? 'p-1 rounded-xl bg-rose-50 border border-rose-400' : ''}`}>
                          <DatePickerControl
                            label={`${displayLabel}${isRequired ? ' *' : ''}`}
                            value={textValues[zone.id] !== undefined ? textValues[zone.id] : (zone.defaultValue || '')}
                            onChange={handleTextChange}
                          />
                        </div>
                      );
                    }

                    if (isTimeField) {
                      return (
                        <div key={zone.id} className={`${!isEditable ? 'pointer-events-none opacity-80' : ''} ${isMissing ? 'p-1 rounded-xl bg-rose-50 border border-rose-400' : ''}`}>
                          <TimePickerControl
                            label={`${displayLabel}${isRequired ? ' *' : ''}`}
                            value={textValues[zone.id] !== undefined ? textValues[zone.id] : (zone.defaultValue || '')}
                            onChange={handleTextChange}
                          />
                        </div>
                      );
                    }

                    if (isMessageField) {
                      const hasBeenGenerated = generatedZones[zone.id];
                      return (
                        <div key={zone.id} className="space-y-1.5 sm:col-span-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-800">
                              {displayLabel} {isRequired && <span className="text-rose-500 font-extrabold">*</span>} :
                            </label>
                            {isEditable && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newMsg = getRandomBirthdayMessage(textValues[zone.id] || zone.defaultValue);
                                  handleTextChange(newMsg);
                                  setGeneratedZones((prev) => ({ ...prev, [zone.id]: true }));
                                }}
                                className="text-[11px] font-extrabold text-[#F82BA9] hover:text-pink-700 bg-pink-50 hover:bg-pink-100 px-3 py-1 rounded-xl border border-pink-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                title="Click to generate or regenerate custom message"
                              >
                                {hasBeenGenerated ? '🔄 Regenerate' : '✨ Generate'}
                              </button>
                            )}
                          </div>
                          <textarea
                            rows={2}
                            disabled={!isEditable}
                            value={textValues[zone.id] || ''}
                            onChange={(e) => handleTextChange(e.target.value)}
                            className={`w-full px-3 py-2 text-xs bg-white border ${
                              isMissing ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-gray-300'
                            } rounded-xl focus:outline-hidden focus:border-[#F82BA9] font-medium disabled:bg-slate-100`}
                            placeholder={isEditable ? (zone.defaultValue ? `e.g. ${zone.defaultValue}` : `Type ${displayLabel}...`) : zone.defaultValue}
                          />
                        </div>
                      );
                    }

                    const samplePlaceholder = zone.defaultValue ? `e.g. ${zone.defaultValue}` : `Enter ${displayLabel}...`;

                    return (
                      <div key={zone.id} className="space-y-1 sm:col-span-1">
                        <label className="text-xs font-bold text-gray-800 block">
                          {displayLabel} {isRequired && <span className="text-rose-500 font-extrabold">*</span>} :
                        </label>
                        <input
                          type="text"
                          disabled={!isEditable}
                          value={textValues[zone.id] || ''}
                          onChange={(e) => handleTextChange(e.target.value)}
                          className={`w-full px-3 py-2 text-xs bg-white border ${
                            isMissing ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-gray-300'
                          } rounded-xl focus:outline-hidden focus:border-[#F82BA9] font-medium disabled:bg-slate-100`}
                          placeholder={isEditable ? samplePlaceholder : zone.defaultValue}
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

      {/* Crop Modal Popup locked to slot aspect ratio & shape */}
      <PhotoCropModal
        isOpen={cropModalOpen}
        imageSrc={tempUploadedImage}
        aspectRatio={activeSlotForCrop?.width && activeSlotForCrop?.height ? activeSlotForCrop.width / activeSlotForCrop.height : 1}
        shape={activeSlotForCrop?.shape || 'rectangle'}
        onCropAndSubmit={handleCropAndSubmit}
        onCancel={() => {
          setCropModalOpen(false);
          setTempUploadedImage(null);
          setActiveSlotForCrop(null);
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
              className="relative w-full max-w-[360px] rounded-xs border-8 border-black shadow-2xl bg-white overflow-hidden select-none font-serif flex items-center justify-center"
              style={{
                aspectRatio: template.documentDimensions?.width && template.documentDimensions?.height
                  ? `${template.documentDimensions.width} / ${template.documentDimensions.height}`
                  : ((template.product as any)?.orientation || (template as any).orientation) === 'landscape' ? '4 / 3' : '4 / 5',
                containerType: 'inline-size',
              }}
            >
              {isLoadingPreview ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-3">
                  <Loader2 className="w-8 h-8 text-[#F82BA9] animate-spin" />
                  <p className="text-xs font-bold text-gray-700">Compiling 300 DPI High-Res Preview...</p>
                </div>
              ) : (
                <img
                  src={compiledPreviewUrl || baseImg}
                  alt={template.title}
                  className="w-full h-full object-contain"
                />
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
