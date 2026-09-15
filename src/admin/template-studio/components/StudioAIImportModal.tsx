import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  X,
  Layers,
  MousePointer,
  Plus,
  Trash2,
  Key,
  Sliders,
  Baby,
  Heart,
  Image as ImageIcon
} from 'lucide-react';
import { runAIDetectionOnImage, AIDetectionResult } from '../utils/aiDetectionPipeline';
import { uploadCategoryImage } from '../../../config/firebase';
import { PhotoSlotConfig, TextZoneConfig, FrameCutoutShape } from '../../../types/template';

interface StudioAIImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  onApplyCandidates: (params: {
    baseImageUrl: string;
    photoSlots: PhotoSlotConfig[];
    textZones: TextZoneConfig[];
    originalUploadUrl?: string;
    aiConfidenceRecord: Record<string, number>;
  }) => void;
}

const SHAPES: { value: FrameCutoutShape; label: string; icon: string }[] = [
  { value: 'circle', label: 'Circle', icon: '⭕' },
  { value: 'arch', label: 'Arch Window', icon: '🚪' },
  { value: 'rounded', label: 'Rounded Rect', icon: '🔲' },
  { value: 'rectangle', label: 'Sharp Rect', icon: '▭' },
  { value: 'oval', label: 'Oval', icon: '⬭' },
  { value: 'heart', label: 'Heart', icon: '❤️' },
];

export const StudioAIImportModal: React.FC<StudioAIImportModalProps> = ({
  isOpen,
  onClose,
  category,
  onApplyCandidates,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<AIDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Interaction tool
  const [activeTool, setActiveTool] = useState<'select' | 'draw-slot' | 'draw-text'>('select');
  const [selectedItem, setSelectedItem] = useState<{ type: 'slot' | 'zone'; id: string } | null>(null);

  // Manual Drag-to-Draw State
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ xPct: number; yPct: number } | null>(null);
  const [currentDraw, setCurrentDraw] = useState<{ xPct: number; yPct: number } | null>(null);

  // Optional Gemini API Key
  const [apiKey, setApiKey] = useState<string>(() => {
    const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
    if (typeof window !== 'undefined') {
      return localStorage.getItem('A1PRINT_GEMINI_API_KEY') || envKey;
    }
    return envKey;
  });
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && apiKey) {
      localStorage.setItem('A1PRINT_GEMINI_API_KEY', apiKey);
    }
  }, [apiKey]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSelectedFile(file);
    setDetectionResult(null);
    setSelectedItem(null);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImagePreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // 1-Click Smart Layout Presets (Works instantly even without any API key!)
  const applyPreset = (presetType: 'baby' | 'couple' | 'single') => {
    if (presetType === 'baby') {
      const babySlots: PhotoSlotConfig[] = [
        {
          id: `slot-baby-${Date.now().toString(36)}-1`,
          label: 'Baby Portrait Photo',
          shape: 'circle',
          x: 50,
          y: 43,
          width: 44,
          height: 33,
          confidence: 1.0,
          visibility: {
            userVisible: true,
            userEditable: true,
            required: true,
            emptyBehavior: 'keepDefault',
            userLabel: 'Upload Baby Photo',
          },
        },
      ];

      const babyZones: TextZoneConfig[] = [
        {
          id: `text-baby-${Date.now().toString(36)}-1`,
          label: 'Baby Name',
          defaultValue: 'Mithunan',
          x: 50,
          y: 20,
          maxWidth: 70,
          fontSize: 32,
          fontFamily: 'Playfair Display',
          color: '#160E4B',
          align: 'center',
          type: 'text',
          confidence: 1.0,
          visibility: { userVisible: true, userEditable: true, required: true, emptyBehavior: 'keepDefault', userLabel: 'Baby Name' },
        },
        {
          id: `text-baby-${Date.now().toString(36)}-2`,
          label: 'Birth Date',
          defaultValue: '29 Jan, 2025',
          x: 27,
          y: 39,
          maxWidth: 30,
          fontSize: 18,
          fontFamily: 'Jost',
          color: '#3B3663',
          align: 'center',
          type: 'text',
          confidence: 1.0,
          visibility: { userVisible: true, userEditable: true, required: true, emptyBehavior: 'keepDefault', userLabel: 'Birth Date' },
        },
        {
          id: `text-baby-${Date.now().toString(36)}-3`,
          label: 'Birth Time',
          defaultValue: '06:21 AM',
          x: 73,
          y: 39,
          maxWidth: 30,
          fontSize: 18,
          fontFamily: 'Jost',
          color: '#3B3663',
          align: 'center',
          type: 'text',
          confidence: 1.0,
          visibility: { userVisible: true, userEditable: true, required: true, emptyBehavior: 'keepDefault', userLabel: 'Birth Time' },
        },
        {
          id: `text-baby-${Date.now().toString(36)}-4`,
          label: 'Birth Weight',
          defaultValue: '2.7 Kg',
          x: 28,
          y: 73,
          maxWidth: 25,
          fontSize: 18,
          fontFamily: 'Jost',
          color: '#3B3663',
          align: 'center',
          type: 'text',
          confidence: 1.0,
          visibility: { userVisible: true, userEditable: true, required: false, emptyBehavior: 'keepDefault', userLabel: 'Birth Weight' },
        },
        {
          id: `text-baby-${Date.now().toString(36)}-5`,
          label: 'Parents / Hospital Name',
          defaultValue: 'Proud Parents: Parthipan & Sakthi',
          x: 58,
          y: 75,
          maxWidth: 55,
          fontSize: 16,
          fontFamily: 'Playfair Display',
          color: '#160E4B',
          align: 'center',
          type: 'text',
          confidence: 1.0,
          visibility: { userVisible: true, userEditable: true, required: false, emptyBehavior: 'keepDefault', userLabel: 'Parents / Hospital Details' },
        },
      ];

      setDetectionResult({
        photoSlots: babySlots.map((s) => ({ ...s, detectedReason: 'Baby Milestone Layout Preset', selected: true })),
        textZones: babyZones.map((z) => ({ ...z, detectedReason: 'Baby Milestone Typography Preset', selected: true })),
        detectedDimensions: { width: 1200, height: 1600 },
        engineUsed: 'canvas-cv',
      });
      setSelectedItem({ type: 'slot', id: babySlots[0].id });
    } else if (presetType === 'couple') {
      const coupleSlots: PhotoSlotConfig[] = [
        {
          id: `slot-couple-${Date.now().toString(36)}-1`,
          label: 'Couple Centerpiece Photo',
          shape: 'arch',
          x: 50,
          y: 40,
          width: 55,
          height: 48,
          confidence: 1.0,
          visibility: { userVisible: true, userEditable: true, required: true, emptyBehavior: 'keepDefault', userLabel: 'Upload Couple Photo' },
        },
      ];
      const coupleZones: TextZoneConfig[] = [
        {
          id: `text-couple-${Date.now().toString(36)}-1`,
          label: 'Couple Names',
          defaultValue: 'Rahul & Priya',
          x: 50,
          y: 70,
          maxWidth: 80,
          fontSize: 32,
          fontFamily: 'Playfair Display',
          color: '#160E4B',
          align: 'center',
          type: 'text',
          confidence: 1.0,
          visibility: { userVisible: true, userEditable: true, required: true, emptyBehavior: 'keepDefault', userLabel: 'Couple Names' },
        },
        {
          id: `text-couple-${Date.now().toString(36)}-2`,
          label: 'Wedding / Anniversary Date',
          defaultValue: '14 August 2024',
          x: 50,
          y: 78,
          maxWidth: 70,
          fontSize: 18,
          fontFamily: 'Jost',
          color: '#3B82F6',
          align: 'center',
          type: 'calendar',
          isCalendar: true,
          confidence: 1.0,
          visibility: { userVisible: true, userEditable: true, required: true, emptyBehavior: 'keepDefault', userLabel: 'Special Date' },
        },
      ];
      setDetectionResult({
        photoSlots: coupleSlots.map((s) => ({ ...s, detectedReason: 'Couple Layout Preset', selected: true })),
        textZones: coupleZones.map((z) => ({ ...z, detectedReason: 'Couple Typography Preset', selected: true })),
        detectedDimensions: { width: 1200, height: 1600 },
        engineUsed: 'canvas-cv',
      });
      setSelectedItem({ type: 'slot', id: coupleSlots[0].id });
    } else {
      const singleSlots: PhotoSlotConfig[] = [
        {
          id: `slot-single-${Date.now().toString(36)}-1`,
          label: 'Main Photo Frame',
          shape: 'rounded',
          x: 50,
          y: 42,
          width: 65,
          height: 52,
          confidence: 1.0,
          visibility: { userVisible: true, userEditable: true, required: true, emptyBehavior: 'keepDefault', userLabel: 'Upload Your Photo' },
        },
      ];
      const singleZones: TextZoneConfig[] = [
        {
          id: `text-single-${Date.now().toString(36)}-1`,
          label: 'Personalized Title',
          defaultValue: 'Cherished Memories',
          x: 50,
          y: 74,
          maxWidth: 80,
          fontSize: 28,
          fontFamily: 'Playfair Display',
          color: '#160E4B',
          align: 'center',
          type: 'text',
          confidence: 1.0,
          visibility: { userVisible: true, userEditable: true, required: true, emptyBehavior: 'keepDefault', userLabel: 'Personalized Title' },
        },
      ];
      setDetectionResult({
        photoSlots: singleSlots.map((s) => ({ ...s, detectedReason: 'Single Photo Preset', selected: true })),
        textZones: singleZones.map((z) => ({ ...z, detectedReason: 'Single Typography Preset', selected: true })),
        detectedDimensions: { width: 1200, height: 1600 },
        engineUsed: 'canvas-cv',
      });
      setSelectedItem({ type: 'slot', id: singleSlots[0].id });
    }
  };

  const handleStartScan = async () => {
    if (!imagePreviewUrl) return;

    setIsScanning(true);
    setError(null);
    try {
      const result = await runAIDetectionOnImage(imagePreviewUrl, category, apiKey);
      setDetectionResult(result);
      if (result.photoSlots.length > 0) {
        setSelectedItem({ type: 'slot', id: result.photoSlots[0].id });
      } else if (result.textZones.length > 0) {
        setSelectedItem({ type: 'zone', id: result.textZones[0].id });
      }
    } catch (err: any) {
      console.error('AI Scan error:', err);
      setError(err?.message || 'Failed to scan image. Try clicking a Smart Preset or use manual placement.');
    } finally {
      setIsScanning(false);
    }
  };

  const getContainerPct = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = imageContainerRef.current?.getBoundingClientRect();
    if (!rect) return { xPct: 50, yPct: 50 };
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    return {
      xPct: Math.round((x / rect.width) * 100),
      yPct: Math.round((y / rect.height) * 100),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'select') return;
    const { xPct, yPct } = getContainerPct(e);
    setIsDrawing(true);
    setDrawStart({ xPct, yPct });
    setCurrentDraw({ xPct, yPct });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing) return;
    const { xPct, yPct } = getContainerPct(e);
    setCurrentDraw({ xPct, yPct });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !drawStart || !currentDraw) {
      setIsDrawing(false);
      return;
    }

    const minX = Math.min(drawStart.xPct, currentDraw.xPct);
    const maxX = Math.max(drawStart.xPct, currentDraw.xPct);
    const minY = Math.min(drawStart.yPct, currentDraw.yPct);
    const maxY = Math.max(drawStart.yPct, currentDraw.yPct);

    const width = Math.max(8, maxX - minX);
    const height = Math.max(8, maxY - minY);
    const centerX = Math.round(minX + width / 2);
    const centerY = Math.round(minY + height / 2);

    if (activeTool === 'draw-slot') {
      const newSlot: PhotoSlotConfig & { confidence: number; detectedReason: string; selected: boolean } = {
        id: `slot-manual-${Date.now().toString(36)}`,
        label: `Photo Slot #${(detectionResult?.photoSlots.length || 0) + 1}`,
        shape: 'circle',
        x: centerX,
        y: centerY,
        width,
        height,
        confidence: 1.0,
        detectedReason: 'Manually drawn aperture',
        selected: true,
        visibility: {
          userVisible: true,
          userEditable: true,
          required: true,
          emptyBehavior: 'keepDefault',
          userLabel: 'Upload Photo',
        },
      };

      setDetectionResult((prev) => ({
        photoSlots: [...(prev?.photoSlots || []), newSlot],
        textZones: prev?.textZones || [],
        detectedDimensions: prev?.detectedDimensions || { width: 1200, height: 1600 },
        engineUsed: prev?.engineUsed || 'canvas-cv',
      }));
      setSelectedItem({ type: 'slot', id: newSlot.id });
    } else if (activeTool === 'draw-text') {
      const newZone: TextZoneConfig & { confidence: number; detectedReason: string; selected: boolean } = {
        id: `text-manual-${Date.now().toString(36)}`,
        label: `Text Zone #${(detectionResult?.textZones.length || 0) + 1}`,
        defaultValue: 'Custom Text',
        x: centerX,
        y: centerY,
        maxWidth: width,
        fontSize: 24,
        fontFamily: 'Playfair Display',
        color: '#160E4B',
        align: 'center',
        type: 'text',
        confidence: 1.0,
        detectedReason: 'Manually placed text line',
        selected: true,
        visibility: {
          userVisible: true,
          userEditable: true,
          required: true,
          emptyBehavior: 'keepDefault',
          userLabel: 'Enter Text',
        },
      };

      setDetectionResult((prev) => ({
        photoSlots: prev?.photoSlots || [],
        textZones: [...(prev?.textZones || []), newZone],
        detectedDimensions: prev?.detectedDimensions || { width: 1200, height: 1600 },
        engineUsed: prev?.engineUsed || 'canvas-cv',
      }));
      setSelectedItem({ type: 'zone', id: newZone.id });
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentDraw(null);
    setActiveTool('select');
  };

  const handleUpdateSlotShape = (id: string, shape: FrameCutoutShape) => {
    if (!detectionResult) return;
    setDetectionResult({
      ...detectionResult,
      photoSlots: detectionResult.photoSlots.map((s) => (s.id === id ? { ...s, shape } : s)),
    });
  };

  const handleDeleteItem = (type: 'slot' | 'zone', id: string) => {
    if (!detectionResult) return;
    if (type === 'slot') {
      setDetectionResult({
        ...detectionResult,
        photoSlots: detectionResult.photoSlots.filter((s) => s.id !== id),
      });
    } else {
      setDetectionResult({
        ...detectionResult,
        textZones: detectionResult.textZones.filter((z) => z.id !== id),
      });
    }
    if (selectedItem?.id === id) setSelectedItem(null);
  };

  const handleApplyToStudio = async () => {
    if (!detectionResult || !imagePreviewUrl) return;

    setIsUploading(true);
    setError(null);

    let finalBaseUrl = imagePreviewUrl;
    try {
      if (selectedFile) {
        finalBaseUrl = await uploadCategoryImage(category || 'templates', selectedFile, `base-${Date.now()}`);
      }
    } catch (uploadErr) {
      console.warn('Cloudinary upload warning; proceeding with preview data url:', uploadErr);
    } finally {
      setIsUploading(false);
    }

    const approvedSlots = detectionResult.photoSlots.filter((s) => s.selected);
    const approvedZones = detectionResult.textZones.filter((z) => z.selected);

    const confidenceMap: Record<string, number> = {};
    approvedSlots.forEach((s) => (confidenceMap[s.id] = s.confidence));
    approvedZones.forEach((z) => (confidenceMap[z.id] = z.confidence));

    onApplyCandidates({
      baseImageUrl: finalBaseUrl,
      photoSlots: approvedSlots.map(({ confidence, detectedReason, selected, ...rest }) => rest),
      textZones: approvedZones.map(({ confidence, detectedReason, selected, ...rest }) => rest),
      originalUploadUrl: finalBaseUrl,
      aiConfidenceRecord: confidenceMap,
    });

    onClose();
  };

  const activeSelectedSlot = selectedItem?.type === 'slot'
    ? detectionResult?.photoSlots.find((s) => s.id === selectedItem.id)
    : null;
  const activeSelectedZone = selectedItem?.type === 'zone'
    ? detectionResult?.textZones.find((z) => z.id === selectedItem.id)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl max-h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-pink-500/20 border border-pink-500/30 text-pink-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                Frame Layer Setup & AI Detection
              </h3>
              <p className="text-xs text-slate-400">
                Upload your frame poster. AI or 1-Click presets will organize it into Background, Photo, and Text layers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                apiKey
                  ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title="Google Gemini Vision API Key (100% Free)"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{apiKey ? 'Gemini AI Active' : 'API Key (Optional)'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Gemini API Key Drawer */}
        {showKeyInput && (
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-center gap-3 text-xs">
            <input
              type="password"
              placeholder="Paste free Gemini API key (AIzaSy...) for deep semantic AI scanning"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 font-mono"
            />
            <span className="text-[11px] text-slate-400 shrink-0">
              Free from Google AI Studio. Stored securely in your browser.
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {!imagePreviewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-pink-500 rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-950/30 hover:bg-pink-500/5 group min-h-[350px]"
            >
              <div className="p-5 rounded-3xl bg-slate-800 group-hover:bg-pink-500/20 text-slate-300 group-hover:text-pink-400 transition-colors mb-4">
                <Upload className="w-10 h-10" />
              </div>
              <h4 className="font-extrabold text-base text-slate-200 mb-1">
                Upload your frame artwork poster (JPG, PNG, WEBP)
              </h4>
              <p className="text-xs text-slate-400 max-w-md mb-4">
                Your artwork will be loaded as Layer 1 (Background), and you can instantly add photo apertures & text fields.
              </p>
              <span className="px-5 py-2.5 bg-gradient-to-r from-[#F82BA9] to-purple-600 text-white font-extrabold text-xs rounded-xl shadow-md">
                Browse Files
              </span>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Top Quick Bar: Presets & Tools */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 mr-1">1-Click Presets:</span>
                  <button
                    onClick={() => applyPreset('baby')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="1-Click: Central Circular Baby Photo + Name, Date, Time, Weight, Parents"
                  >
                    <Baby className="w-3.5 h-3.5" />
                    <span>👶 Baby Milestone</span>
                  </button>

                  <button
                    onClick={() => applyPreset('couple')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="1-Click: Arch Couple Photo + Names & Date"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>💕 Couple Frame</span>
                  </button>

                  <button
                    onClick={() => applyPreset('single')}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="1-Click: Full Single Photo + Title"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>🖼️ Single Photo</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTool(activeTool === 'draw-slot' ? 'select' : 'draw-slot')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      activeTool === 'draw-slot'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                    title="Drag on image to create a new photo slot"
                  >
                    <Plus className="w-3.5 h-3.5" /> Draw Slot
                  </button>

                  <button
                    onClick={handleStartScan}
                    disabled={isScanning}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#F82BA9] to-purple-600 hover:brightness-110 text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{detectionResult ? 'Re-scan with AI' : 'Auto-Scan AI'}</span>
                  </button>
                </div>
              </div>

              {/* Center Canvas Workspace */}
              <div className="flex flex-col lg:flex-row gap-4 items-start">
                
                {/* Visual Image Preview with Overlays */}
                <div
                  ref={imageContainerRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className={`relative flex-1 w-full max-h-[480px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center select-none shadow-inner ${
                    activeTool !== 'select' ? 'cursor-crosshair' : 'cursor-default'
                  }`}
                >
                  <img
                    src={imagePreviewUrl}
                    alt="Frame artwork"
                    className="w-full h-auto max-h-[480px] object-contain pointer-events-none block"
                  />

                  {/* Render Photo Slots on Image */}
                  {detectionResult?.photoSlots.map((slot, idx) => {
                    const isSelected = selectedItem?.type === 'slot' && selectedItem.id === slot.id;
                    const left = slot.x - slot.width / 2;
                    const top = slot.y - slot.height / 2;

                    return (
                      <div
                        key={slot.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem({ type: 'slot', id: slot.id });
                        }}
                        style={{
                          left: `${left}%`,
                          top: `${top}%`,
                          width: `${slot.width}%`,
                          height: `${slot.height}%`,
                          borderRadius: slot.shape === 'circle' ? '50%' : slot.shape === 'rounded' ? '16px' : '4px',
                        }}
                        className={`absolute border-2 transition-all cursor-pointer flex items-center justify-center p-1 ${
                          isSelected
                            ? 'border-pink-500 bg-pink-500/25 ring-2 ring-pink-400'
                            : 'border-cyan-400 bg-cyan-500/15 hover:bg-cyan-500/25'
                        }`}
                      >
                        <div className="px-2 py-0.5 rounded-full bg-slate-950/85 text-[10px] font-extrabold text-cyan-300 border border-cyan-500/40 shadow-xs truncate max-w-full">
                          📷 #{idx + 1} ({slot.shape})
                        </div>
                      </div>
                    );
                  })}

                  {/* Render Text Zones on Image */}
                  {detectionResult?.textZones.map((zone) => {
                    const isSelected = selectedItem?.type === 'zone' && selectedItem.id === zone.id;
                    const left = zone.x - zone.maxWidth / 2;
                    const top = zone.y - 3;

                    return (
                      <div
                        key={zone.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem({ type: 'zone', id: zone.id });
                        }}
                        style={{
                          left: `${left}%`,
                          top: `${top}%`,
                          width: `${zone.maxWidth}%`,
                        }}
                        className={`absolute border-2 border-dashed py-0.5 px-2 transition-all cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? 'border-purple-400 bg-purple-500/35 ring-2 ring-purple-300'
                            : 'border-purple-500/60 bg-purple-500/15 hover:bg-purple-500/25'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-purple-200 truncate max-w-full">
                          ✏️ {zone.defaultValue || zone.label}
                        </span>
                      </div>
                    );
                  })}

                  {/* Drag-to-Draw Ghost Box */}
                  {isDrawing && drawStart && currentDraw && (
                    <div
                      style={{
                        left: `${Math.min(drawStart.xPct, currentDraw.xPct)}%`,
                        top: `${Math.min(drawStart.yPct, currentDraw.yPct)}%`,
                        width: `${Math.abs(currentDraw.xPct - drawStart.xPct)}%`,
                        height: `${Math.abs(currentDraw.yPct - drawStart.yPct)}%`,
                      }}
                      className="absolute border-2 border-dashed border-emerald-400 bg-emerald-500/20 pointer-events-none"
                    />
                  )}
                </div>

                {/* Right Side: Simple Inspector & Layer List */}
                <div className="w-full lg:w-72 space-y-3 shrink-0">
                  {activeSelectedSlot && (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-300">Selected Photo Slot</span>
                        <button
                          onClick={() => handleDeleteItem('slot', activeSelectedSlot.id)}
                          className="p-1 text-rose-400 hover:text-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-1">
                        {SHAPES.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => handleUpdateSlotShape(activeSelectedSlot.id, s.value)}
                            className={`p-1.5 rounded-lg text-[10px] font-bold border transition-all flex flex-col items-center gap-0.5 ${
                              activeSelectedSlot.shape === s.value
                                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span>{s.icon}</span>
                            <span className="truncate">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Layers Summary List */}
                  {detectionResult && (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 max-h-[300px] overflow-y-auto">
                      <div className="text-xs font-extrabold text-slate-300 flex items-center justify-between">
                        <span>Extracted Layers</span>
                        <span className="text-[10px] text-pink-400">
                          {detectionResult.photoSlots.length} Slots • {detectionResult.textZones.length} Texts
                        </span>
                      </div>

                      {detectionResult.photoSlots.map((slot) => (
                        <div
                          key={slot.id}
                          onClick={() => setSelectedItem({ type: 'slot', id: slot.id })}
                          className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer ${
                            selectedItem?.id === slot.id
                              ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                              : 'border-slate-800 bg-slate-900 text-slate-300'
                          }`}
                        >
                          <span className="truncate">📷 {slot.label} ({slot.shape})</span>
                        </div>
                      ))}

                      {detectionResult.textZones.map((zone) => (
                        <div
                          key={zone.id}
                          onClick={() => setSelectedItem({ type: 'zone', id: zone.id })}
                          className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between cursor-pointer ${
                            selectedItem?.id === zone.id
                              ? 'border-purple-400 bg-purple-950/40 text-purple-200'
                              : 'border-slate-800 bg-slate-900 text-slate-300'
                          }`}
                        >
                          <span className="truncate">✏️ {zone.defaultValue || zone.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {imagePreviewUrl && (
              <button
                onClick={() => {
                  setImagePreviewUrl('');
                  setSelectedFile(null);
                  setDetectionResult(null);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:text-white"
              >
                Change Image
              </button>
            )}

            <button
              onClick={handleApplyToStudio}
              disabled={isUploading || isScanning || !detectionResult}
              className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#F82BA9] to-purple-600 hover:brightness-110 text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading into Studio...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Load Layers into Studio
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
