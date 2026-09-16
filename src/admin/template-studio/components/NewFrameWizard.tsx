import React, { useState, useRef } from 'react';
import { PhotoSlotConfig, TextZoneConfig, StaticLayerConfig } from '../../../types/template';
import { parsePSDFileBinary } from '../utils/psdParser';
import { uploadCategoryImage, uploadProductImage, base64ToBlob } from '../../../config/firebase';
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, Layers } from 'lucide-react';

interface NewFrameWizardProps {
  onBack: () => void;
  onComplete: (data: {
    title: string;
    category: string;
    photoSlots: PhotoSlotConfig[];
    textZones: TextZoneConfig[];
    staticLayers?: StaticLayerConfig[];
    baseImageUrl: string;
    originalUploadUrl?: string;
    documentDimensions?: { width: number; height: number };
  }) => void;
  onOpenAdvancedImageImport?: () => void;
  categoryList?: { id: string; name: string }[];
}

const DEFAULT_CATEGORIES = [
  { id: 'baby-birth-frame', name: 'Baby Milestone & Birth Frame' },
  { id: 'wedding-anniversary', name: 'Wedding & Anniversary Frame' },
  { id: 'birthday-special', name: 'Birthday Celebration Frame' },
  { id: 'love-couple', name: 'Love & Couple Frame' },
  { id: 'family-collage', name: 'Family Multi-Photo Collage' },
  { id: 'minimal-single', name: 'Minimal Single Photo Frame' },
];

export const NewFrameWizard: React.FC<NewFrameWizardProps> = ({
  onBack,
  onComplete,
  onOpenAdvancedImageImport,
  categoryList = DEFAULT_CATEGORIES,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [frameName, setFrameName] = useState('');
  const [category, setCategory] = useState(categoryList[0]?.id || 'baby-birth-frame');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Parsing & progress state
  const [isParsing, setIsParsing] = useState(false);
  const [parseStep, setParseStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.psd')) {
      setError('Please select an Adobe Photoshop (.psd) file.');
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    if (!frameName.trim()) {
      // Clean default title from filename
      const cleanName = file.name.replace(/\.psd$/i, '').replace(/[_-]/g, ' ');
      setFrameName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.psd')) {
      setError('Please select an Adobe Photoshop (.psd) file.');
      return;
    }

    setError(null);
    setSelectedFile(file);
    if (!frameName.trim()) {
      const cleanName = file.name.replace(/\.psd$/i, '').replace(/[_-]/g, ' ');
      setFrameName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleProceed = async () => {
    if (!frameName.trim() || !category || !selectedFile) {
      setError('Please provide a Frame Name, Category, and select a .psd file.');
      return;
    }

    setIsParsing(true);
    setError(null);
    setParseStep('Reading PSD binary layer tree...');

    try {
      // 1. Parse PSD binary structure
      const parsedResult = await parsePSDFileBinary(selectedFile);
      setParseStep(`Found ${parsedResult.detectedLayerCount} layer(s). Preparing base canvas...`);

      // 2. Upload high-resolution composite preview to Cloudinary CDN
      let baseImageUrl = parsedResult.compositePreviewUrl || '';
      let originalUploadUrl: string | undefined = undefined;

      if (parsedResult.compositePreviewUrl && parsedResult.compositePreviewUrl.startsWith('data:image')) {
        try {
          setParseStep('Uploading high-resolution poster artwork to Cloudinary CDN...');
          const posterBlob = base64ToBlob(parsedResult.compositePreviewUrl);
          const uploadedPosterUrl = await uploadProductImage(
            `frame-${Date.now()}`,
            posterBlob,
            'poster.jpg'
          );
          if (uploadedPosterUrl) {
            baseImageUrl = uploadedPosterUrl;
          }
        } catch (uploadPosterErr) {
          console.warn('Poster Cloudinary upload warning, using local preview in editor:', uploadPosterErr);
        }
      }

      // 3. Upload PSD asset to Cloudinary storage (non-blocking)
      try {
        setParseStep('Uploading PSD asset to Cloudinary storage...');
        originalUploadUrl = await uploadCategoryImage(category, selectedFile, `psd-${Date.now()}`);
      } catch (uploadErr) {
        console.warn('PSD cloud upload warning, proceeding with parsed layers:', uploadErr);
      }

      // If no composite preview was generated from the parser, use a clean placeholder base
      if (!baseImageUrl) {
        const dummyCanvas = document.createElement('canvas');
        dummyCanvas.width = parsedResult.documentDimensions.width || 1200;
        dummyCanvas.height = parsedResult.documentDimensions.height || 1760;
        const ctx = dummyCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0F172A';
          ctx.fillRect(0, 0, dummyCanvas.width, dummyCanvas.height);
          // Subtle border
          ctx.strokeStyle = '#1E293B';
          ctx.lineWidth = 12;
          ctx.strokeRect(6, 6, dummyCanvas.width - 12, dummyCanvas.height - 12);
        }
        baseImageUrl = dummyCanvas.toDataURL('image/png', 0.9);
      }

      setParseStep('Opening Frame Editor...');

      // Go straight to editor!
      onComplete({
        title: frameName.trim(),
        category,
        photoSlots: parsedResult.photoSlots,
        textZones: parsedResult.textZones,
        staticLayers: parsedResult.staticLayers || [],
        baseImageUrl,
        originalUploadUrl,
        documentDimensions: parsedResult.documentDimensions,
      });
    } catch (err: any) {
      console.error('PSD parsing failure:', err);
      setError(err?.message || 'Failed to parse PSD file. Please verify the Photoshop file is not corrupted.');
      setIsParsing(false);
    }
  };

  const isReady = Boolean(frameName.trim() && category && selectedFile && !isParsing);

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-slate-950 font-jost text-white p-6 select-none">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <button
          onClick={onBack}
          disabled={isParsing}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Frame Library</span>
        </button>

        <div className="text-xs text-slate-500 font-mono">
          Linear Wizard • Step 2 of 4
        </div>
      </div>

      {/* Main Wizard Form Card */}
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          <div className="space-y-1 text-center">
            <div className="inline-flex p-3 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 mb-2">
              <Layers className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Create New Frame Template</h2>
            <p className="text-xs text-slate-400">
              Upload your Adobe Photoshop (.PSD) file. All layers will automatically be imported as editable photo and text zones.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* 1. Frame Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Frame Name <span className="text-pink-400">*</span>
              </label>
              <input
                type="text"
                value={frameName}
                onChange={(e) => setFrameName(e.target.value)}
                disabled={isParsing}
                placeholder="e.g. Royal Golden Baby Milestone Poster"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>

            {/* 2. Category Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Category <span className="text-pink-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isParsing}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500 transition-colors"
              >
                {categoryList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. PSD File Upload Zone */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Photoshop File (.PSD) <span className="text-pink-400">*</span>
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept=".psd"
                className="hidden"
                onChange={handleFileChange}
              />

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => !isParsing && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  selectedFile
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-slate-800 hover:border-pink-500/40 bg-slate-950/60 hover:bg-slate-950'
                } ${isParsing ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    <div>
                      <p className="text-sm font-bold text-white">{selectedFile.name}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to Parse
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-[11px] text-slate-400 hover:text-red-400 underline mt-1"
                    >
                      Choose a different file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-pink-400">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">
                        Drag & drop your <strong className="text-pink-400 font-bold">.psd</strong> file here, or click to browse
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Supports live text layers, shapes, and photo cutouts
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Indicator when parsing */}
          {isParsing && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-pink-400" />
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-white">{parseStep}</p>
                <p className="text-slate-400 text-[11px]">Preparing template layers without manual drawing...</p>
              </div>
            </div>
          )}

          {/* Proceed Button */}
          <button
            type="button"
            onClick={handleProceed}
            disabled={!isReady}
            className="w-full py-3.5 bg-gradient-to-r from-[#F82BA9] to-[#D61B90] hover:brightness-110 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isParsing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Parsing PSD...</span>
              </>
            ) : (
              <span>Proceed to Editor →</span>
            )}
          </button>

          {/* Advanced Image Import Fallback Link */}
          {onOpenAdvancedImageImport && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onOpenAdvancedImageImport}
                disabled={isParsing}
                className="text-[11px] text-slate-500 hover:text-pink-400 transition-colors cursor-pointer"
              >
                Don't have a PSD? <span className="underline font-medium">Import from Flat Image (Beta)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
