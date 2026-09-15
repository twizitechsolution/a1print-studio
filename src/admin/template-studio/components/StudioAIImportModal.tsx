import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  Check,
  AlertCircle,
  Eye,
  Loader2,
  X,
  RefreshCw,
  Layers,
  MousePointer,
  Plus,
  Trash2,
  Shapes,
  Key,
  Sliders,
  Maximize2
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
  { value: 'rounded', label: 'Rounded Rect', icon: '🔲' },
  { value: 'rectangle', label: 'Sharp Rect', icon: '▭' },
  { value: 'circle', label: 'Circle', icon: '⭕' },
  { value: 'arch', label: 'Arch Window', icon: '🚪' },
  { value: 'oval', label: 'Oval', icon: '⬭' },
  { value: 'heart', label: 'Heart', icon: '❤️' },
  { value: 'square', label: 'Square', icon: '⏹' },
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
  const [scanStep, setScanStep] = useState<string>('');
  const [detectionResult, setDetectionResult] = useState<AIDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Interaction tool: 'select' | 'draw-slot' | 'draw-text'
  const [activeTool, setActiveTool] = useState<'select' | 'draw-slot' | 'draw-text'>('select');
  const [selectedItem, setSelectedItem] = useState<{ type: 'slot' | 'zone'; id: string } | null>(null);

  // Manual Drag-to-Draw State
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ xPct: number; yPct: number } | null>(null);
  const [currentDraw, setCurrentDraw] = useState<{ xPct: number; yPct: number } | null>(null);

  // Optional Gemini API Key
  const [apiKey, setApiKey] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('A1PRINT_GEMINI_API_KEY') || '' : '';
  });
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
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

  const handleStartScan = async () => {
    if (!imagePreviewUrl) return;

    setIsScanning(true);
    setError(null);
    try {
      setScanStep('1/3 Analyzing visual density & contours...');
      await new Promise((r) => setTimeout(r, 250));

      setScanStep('2/3 Identifying photo cutout apertures & boundaries...');
      await new Promise((r) => setTimeout(r, 250));

      setScanStep('3/3 Extracting typography baselines & dates...');
      const result = await runAIDetectionOnImage(imagePreviewUrl, category, apiKey);

      setDetectionResult(result);
      if (result.photoSlots.length > 0) {
        setSelectedItem({ type: 'slot', id: result.photoSlots[0].id });
      } else if (result.textZones.length > 0) {
        setSelectedItem({ type: 'zone', id: result.textZones[0].id });
      }
    } catch (err: any) {
      console.error('AI Scan error:', err);
      setError(err?.message || 'Failed to scan image. Please try another image.');
    } finally {
      setIsScanning(false);
      setScanStep('');
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
        shape: 'rounded',
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
        detectedDimensions: prev?.detectedDimensions || { width: 1200, height: 1760 },
        engineUsed: prev?.engineUsed || 'canvas-cv',
      }));
      setSelectedItem({ type: 'slot', id: newSlot.id });
    } else if (activeTool === 'draw-text') {
      const newZone: TextZoneConfig & { confidence: number; detectedReason: string; selected: boolean } = {
        id: `text-manual-${Date.now().toString(36)}`,
        label: `Text Zone #${(detectionResult?.textZones.length || 0) + 1}`,
        defaultValue: 'Personalized Text',
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
        detectedDimensions: prev?.detectedDimensions || { width: 1200, height: 1760 },
        engineUsed: prev?.engineUsed || 'canvas-cv',
      }));
      setSelectedItem({ type: 'zone', id: newZone.id });
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentDraw(null);
    setActiveTool('select');
  };

  const handleToggleSlot = (id: string) => {
    if (!detectionResult) return;
    setDetectionResult({
      ...detectionResult,
      photoSlots: detectionResult.photoSlots.map((slot) =>
        slot.id === id ? { ...slot, selected: !slot.selected } : slot
      ),
    });
  };

  const handleToggleZone = (id: string) => {
    if (!detectionResult) return;
    setDetectionResult({
      ...detectionResult,
      textZones: detectionResult.textZones.map((zone) =>
        zone.id === id ? { ...zone, selected: !zone.selected } : zone
      ),
    });
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

  const getShapeClipPath = (shape: string) => {
    switch (shape) {
      case 'circle':
        return 'circle(50% at 50% 50%)';
      case 'oval':
        return 'ellipse(50% 50% at 50% 50%)';
      case 'arch':
        return 'polygon(0% 100%, 0% 40%, 50% 0%, 100% 40%, 100% 100%)';
      default:
        return 'none';
    }
  };

  const activeSelectedSlot = selectedItem?.type === 'slot'
    ? detectionResult?.photoSlots.find((s) => s.id === selectedItem.id)
    : null;
  const activeSelectedZone = selectedItem?.type === 'zone'
    ? detectionResult?.textZones.find((z) => z.id === selectedItem.id)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-6xl max-h-[95vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#F82BA9]/20 to-purple-600/20 border border-pink-500/30 text-pink-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                Smart Template AI & Computer Vision Studio
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
                  Canva-Grade
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Upload your frame artwork. AI & Computer Vision will scan apertures, shapes, and typography.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className={`p-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                apiKey
                  ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title="Configure free Google Gemini API Key for millimeter-precise Deep AI scan"
            >
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">{apiKey ? 'Deep AI Active' : 'Gemini Key (Opt)'}</span>
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
          <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-col sm:flex-row items-center gap-3 animate-in slide-in-from-top-2 duration-150">
            <div className="flex-1 w-full">
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Optional: Google Gemini API Key (100% Free from Google AI Studio)
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 font-mono"
              />
            </div>
            <div className="text-[11px] text-slate-400 shrink-0 self-end sm:self-center">
              Keys are saved locally in your browser. Without key, Canvas Computer Vision engine runs automatically.
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Area */}
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
                Our vision engine will examine every pixel to discover photo cutouts (circles, arches, rounded windows) and text baselines.
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
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              
              {/* LEFT COLUMN: Interactive Visual Image Workspace */}
              <div className="w-full lg:w-3/5 space-y-3">
                
                {/* Visual Workspace Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveTool('select')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTool === 'select'
                          ? 'bg-pink-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                      title="Select & Inspect Boxes"
                    >
                      <MousePointer className="w-3.5 h-3.5" />
                      <span>Select</span>
                    </button>

                    <button
                      onClick={() => setActiveTool('draw-slot')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTool === 'draw-slot'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                      title="Click and drag on image to create a new photo cutout"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>➕ Draw Slot</span>
                    </button>

                    <button
                      onClick={() => setActiveTool('draw-text')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTool === 'draw-text'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                      title="Click and drag on image to create a new text zone"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>➕ Draw Text</span>
                    </button>
                  </div>

                  <button
                    onClick={handleStartScan}
                    disabled={isScanning}
                    className="px-4 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#F82BA9] to-purple-600 hover:brightness-110 text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        {detectionResult ? 'Re-scan with AI' : 'Run Smart AI Scan'}
                      </>
                    )}
                  </button>
                </div>

                {/* Main Interactive Canvas Area */}
                <div
                  ref={imageContainerRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className={`relative w-full max-h-[520px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center select-none shadow-inner ${
                    activeTool !== 'select' ? 'cursor-crosshair' : 'cursor-default'
                  }`}
                >
                  <img
                    src={imagePreviewUrl}
                    alt="Frame artwork"
                    className="w-full h-auto max-h-[520px] object-contain pointer-events-none block"
                  />

                  {/* Render Detected Photo Slots on Image */}
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
                          borderRadius: slot.shape === 'circle' ? '50%' : slot.shape === 'rounded' ? '14px' : '4px',
                          clipPath: getShapeClipPath(slot.shape),
                        }}
                        className={`absolute border-2 transition-all cursor-pointer flex flex-col items-center justify-center p-1 ${
                          slot.selected
                            ? isSelected
                              ? 'border-pink-500 bg-pink-500/25 ring-2 ring-pink-400 shadow-lg'
                              : 'border-cyan-400 bg-cyan-500/15 hover:bg-cyan-500/25'
                            : 'border-slate-500/40 bg-black/40 opacity-40 hover:opacity-75'
                        }`}
                      >
                        <div className="px-2 py-0.5 rounded-full bg-slate-950/80 text-[10px] font-extrabold text-cyan-300 border border-cyan-500/40 shadow-xs flex items-center gap-1 truncate max-w-full">
                          <span>📷 #{idx + 1}</span>
                          <span className="capitalize opacity-80">({slot.shape})</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Render Detected Text Zones on Image */}
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
                        className={`absolute border-2 border-dashed py-1 px-2 transition-all cursor-pointer flex items-center justify-center ${
                          zone.selected
                            ? isSelected
                              ? 'border-purple-400 bg-purple-500/30 ring-2 ring-purple-300 shadow-md'
                              : 'border-purple-500/70 bg-purple-500/10 hover:bg-purple-500/20'
                            : 'border-slate-500/40 bg-black/40 opacity-40 hover:opacity-75'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-purple-200 truncate max-w-full">
                          ✏️ {zone.defaultValue || zone.label}
                        </span>
                      </div>
                    );
                  })}

                  {/* Drag-to-Draw Ghost Preview Box */}
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

                  {/* Scanning Overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
                      <div className="relative">
                        <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
                        <Sparkles className="w-5 h-5 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
                      </div>
                      <p className="text-sm font-bold text-white">{scanStep}</p>
                      <p className="text-xs text-slate-400 max-w-xs">
                        Scanning shapes, geometry, and personalized typography.
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>💡 Tip: Click any box to inspect/edit. Use ➕ Draw Slot to add cutouts manually.</span>
                  {detectionResult && (
                    <span className="font-semibold text-pink-400">
                      Engine: {detectionResult.engineUsed === 'gemini-vision' ? '✨ Deep Gemini Vision' : '⚡ Canvas Computer Vision'}
                    </span>
                  )}
                </p>
              </div>

              {/* RIGHT COLUMN: Inspector & Candidates List */}
              <div className="w-full lg:w-2/5 space-y-4">
                
                {/* Active Selected Item Properties */}
                {activeSelectedSlot && (
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-extrabold text-cyan-300 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4" /> Selected Photo Slot #{detectionResult?.photoSlots.findIndex((s) => s.id === activeSelectedSlot.id)! + 1}
                      </h5>
                      <button
                        onClick={() => handleDeleteItem('slot', activeSelectedSlot.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                        title="Delete slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Shape Selector Buttons */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1.5">Aperture Shape</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {SHAPES.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => handleUpdateSlotShape(activeSelectedSlot.id, s.value)}
                            className={`p-1.5 rounded-lg text-[11px] font-bold border transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                              activeSelectedSlot.shape === s.value
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span>{s.icon}</span>
                            <span className="truncate">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Label Input */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Customer Upload Label</label>
                      <input
                        type="text"
                        value={activeSelectedSlot.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDetectionResult((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  photoSlots: prev.photoSlots.map((s) =>
                                    s.id === activeSelectedSlot.id ? { ...s, label: val } : s
                                  ),
                                }
                              : null
                          );
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                {activeSelectedZone && (
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-purple-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-extrabold text-purple-300 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4" /> Selected Text Zone
                      </h5>
                      <button
                        onClick={() => handleDeleteItem('zone', activeSelectedZone.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                        title="Delete text zone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Text Value / Placeholder</label>
                      <input
                        type="text"
                        value={activeSelectedZone.defaultValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDetectionResult((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  textZones: prev.textZones.map((z) =>
                                    z.id === activeSelectedZone.id ? { ...z, defaultValue: val } : z
                                  ),
                                }
                              : null
                          );
                        }}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-300 font-bold flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeSelectedZone.isCalendar || activeSelectedZone.type === 'calendar'}
                          onChange={(e) => {
                            const isCal = e.target.checked;
                            setDetectionResult((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    textZones: prev.textZones.map((z) =>
                                      z.id === activeSelectedZone.id
                                        ? { ...z, isCalendar: isCal, type: isCal ? 'calendar' : 'text' }
                                        : z
                                    ),
                                  }
                                : null
                            );
                          }}
                          className="rounded text-pink-500 focus:ring-pink-500"
                        />
                        <span>Is Date / Interactive Calendar Zone</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Candidate Checklist Summary */}
                {detectionResult ? (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    
                    {/* Photo Slots List */}
                    <div className="space-y-2">
                      <h6 className="text-xs font-extrabold text-slate-300 flex items-center justify-between">
                        <span>Photo Apertures ({detectionResult.photoSlots.length})</span>
                        <span className="text-[10px] text-slate-500">Toggle inclusion</span>
                      </h6>
                      {detectionResult.photoSlots.map((slot) => (
                        <div
                          key={slot.id}
                          onClick={() => setSelectedItem({ type: 'slot', id: slot.id })}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            selectedItem?.id === slot.id
                              ? 'border-cyan-400 bg-cyan-950/30'
                              : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-sm">📷</span>
                            <span className="text-xs font-bold text-slate-200 truncate">{slot.label}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {slot.shape}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSlot(slot.id);
                            }}
                            className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                              slot.selected
                                ? 'bg-[#F82BA9] border-[#F82BA9] text-white'
                                : 'border-slate-600 bg-slate-800'
                            }`}
                          >
                            {slot.selected && <Check className="w-3 h-3" />}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Text Zones List */}
                    <div className="space-y-2">
                      <h6 className="text-xs font-extrabold text-slate-300 flex items-center justify-between">
                        <span>Text Zones ({detectionResult.textZones.length})</span>
                        <span className="text-[10px] text-slate-500">Toggle inclusion</span>
                      </h6>
                      {detectionResult.textZones.map((zone) => (
                        <div
                          key={zone.id}
                          onClick={() => setSelectedItem({ type: 'zone', id: zone.id })}
                          className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                            selectedItem?.id === zone.id
                              ? 'border-purple-400 bg-purple-950/30'
                              : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-sm">✏️</span>
                            <span className="text-xs font-bold text-slate-200 truncate">{zone.defaultValue || zone.label}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleZone(zone.id);
                            }}
                            className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                              zone.selected
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'border-slate-600 bg-slate-800'
                            }`}
                          >
                            {zone.selected && <Check className="w-3 h-3" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-950/50 border border-slate-800 text-center space-y-2">
                    <Sparkles className="w-8 h-8 text-pink-400/60 mx-auto" />
                    <p className="text-xs font-bold text-slate-300">Click "Run Smart AI Scan" to begin</p>
                    <p className="text-[11px] text-slate-400">
                      Or select ➕ Draw Slot to sketch photo apertures directly on the preview image!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="w-full sm:w-auto flex items-center justify-end gap-3">
            {imagePreviewUrl && (
              <button
                onClick={() => {
                  setImagePreviewUrl('');
                  setSelectedFile(null);
                  setDetectionResult(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Change Artwork
              </button>
            )}

            <button
              onClick={handleApplyToStudio}
              disabled={isUploading || isScanning || !detectionResult}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#F82BA9] to-purple-600 hover:brightness-110 text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Applying to Studio...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Apply Layers to Smart Studio
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
