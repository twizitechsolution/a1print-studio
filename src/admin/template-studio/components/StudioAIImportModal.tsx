import React, { useState, useRef } from 'react';
import { Sparkles, Upload, Check, AlertCircle, Eye, Loader2, X, RefreshCw, Layers } from 'lucide-react';
import { runAIDetectionOnImage, AIDetectionResult } from '../utils/aiDetectionPipeline';
import { uploadCategoryImage } from '../../../config/firebase';
import { PhotoSlotConfig, TextZoneConfig } from '../../../types/template';

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

export const StudioAIImportModal: React.FC<StudioAIImportModalProps> = ({
  isOpen,
  onClose,
  category,
  onApplyCandidates,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [detectionResult, setDetectionResult] = useState<AIDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSelectedFile(file);
    setDetectionResult(null);

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
      await new Promise((r) => setTimeout(r, 400));

      setScanStep('2/3 Detecting photo cutout frames & aspect ratios...');
      await new Promise((r) => setTimeout(r, 400));

      setScanStep('3/3 Recognizing text baselines & calendar structures...');
      const result = await runAIDetectionOnImage(imagePreviewUrl, category);

      setDetectionResult(result);
    } catch (err: any) {
      console.error('AI Scan error:', err);
      setError(err?.message || 'Failed to scan image. Please try another image.');
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
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

  const handleApplyToStudio = async () => {
    if (!detectionResult || !imagePreviewUrl) return;

    setIsUploading(true);
    let finalBaseUrl = imagePreviewUrl;

    try {
      if (selectedFile) {
        // Upload to Cloudinary CDN for persistent base image
        finalBaseUrl = await uploadCategoryImage(
          category || 'ai-imports',
          selectedFile,
          `ai-base-${Date.now()}`
        );
      }
    } catch (uploadErr) {
      console.warn('Cloudinary upload warning, using local preview data URL:', uploadErr);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#F82BA9]/20 to-purple-600/20 border border-pink-500/30 text-pink-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                AI Template Detection Engine
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 uppercase tracking-wider">
                  Phase 2
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Upload a flat sample poster (JPG/PNG). AI scans apertures, dates, calendars, and text baselines.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Area */}
          {!imagePreviewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-pink-500 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-950/30 hover:bg-pink-500/5 group"
            >
              <div className="p-4 rounded-full bg-slate-800 group-hover:bg-pink-500/20 text-slate-300 group-hover:text-pink-400 transition-colors mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-sm text-slate-200 mb-1">
                Drop template image here or click to browse
              </h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Supports JPG, PNG, WEBP of sample or finished frames. AI will infer photo apertures and text lines.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Preview & Action Topbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <img
                    src={imagePreviewUrl}
                    alt="Upload preview"
                    className="w-16 h-20 object-cover rounded-lg border border-slate-700"
                  />
                  <div>
                    <h5 className="text-sm font-bold text-slate-200">
                      {selectedFile ? selectedFile.name : 'Selected Template Image'}
                    </h5>
                    <p className="text-xs text-slate-400">
                      Category Context: <span className="text-pink-400 font-semibold">{category}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setImagePreviewUrl('');
                      setSelectedFile(null);
                      setDetectionResult(null);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    Change Image
                  </button>

                  <button
                    onClick={handleStartScan}
                    disabled={isScanning}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#F82BA9] to-purple-600 hover:brightness-110 text-white transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        {detectionResult ? 'Re-scan with AI' : 'Run AI Scan'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Progress indicator */}
              {isScanning && (
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-pink-400 mx-auto" />
                  <p className="text-xs font-semibold text-pink-200">{scanStep}</p>
                </div>
              )}

              {/* Candidates Review */}
              {detectionResult && (
                <div className="space-y-6">
                  
                  {/* Photo Slots Candidates */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-pink-400" />
                        Detected Photo Apertures ({detectionResult.photoSlots.length})
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Check to accept into template
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {detectionResult.photoSlots.map((slot) => (
                        <div
                          key={slot.id}
                          onClick={() => handleToggleSlot(slot.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                            slot.selected
                              ? 'bg-pink-950/20 border-pink-500/60 text-white'
                              : 'bg-slate-950/40 border-slate-800 text-slate-400 opacity-60'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-100">{slot.label}</span>
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                {slot.shape}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                {Math.round(slot.confidence * 100)}% Match
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">{slot.detectedReason}</p>
                            <p className="text-[10px] font-mono text-slate-500">
                              Pos: X={slot.x}%, Y={slot.y}% | Size: {slot.width}% × {slot.height}%
                            </p>
                          </div>

                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 mt-0.5 ${
                              slot.selected
                                ? 'bg-[#F82BA9] border-[#F82BA9] text-white'
                                : 'border-slate-600 bg-slate-800'
                            }`}
                          >
                            {slot.selected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Text Zones Candidates */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        Detected Text & Calendar Zones ({detectionResult.textZones.length})
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Check to accept into template
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {detectionResult.textZones.map((zone) => (
                        <div
                          key={zone.id}
                          onClick={() => handleToggleZone(zone.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                            zone.selected
                              ? 'bg-purple-950/20 border-purple-500/60 text-white'
                              : 'bg-slate-950/40 border-slate-800 text-slate-400 opacity-60'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-100">{zone.label}</span>
                              <span
                                className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                                  zone.isCalendar
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {zone.type}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                {Math.round(zone.confidence * 100)}% Match
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 font-serif italic">
                              "{zone.defaultValue}"
                            </p>
                            <p className="text-[11px] text-slate-400">{zone.detectedReason}</p>
                            <p className="text-[10px] font-mono text-slate-500">
                              Pos: Y={zone.y}%, Font: {zone.fontFamily} {zone.fontSize}px
                            </p>
                          </div>

                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 mt-0.5 ${
                              zone.selected
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'border-slate-600 bg-slate-800'
                            }`}
                          >
                            {zone.selected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {detectionResult && (
            <button
              onClick={handleApplyToStudio}
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#F82BA9] to-purple-600 hover:brightness-110 text-white transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving & Initializing Studio...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Accept Candidates & Load into Studio
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
