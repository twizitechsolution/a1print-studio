import React, { useRef, useState } from 'react';
import { UniversalFrameTemplate } from '../../../types/template';
import { Save, ZoomIn, ZoomOut, RotateCcw, Upload, Image as ImageIcon, Loader2, Check, ArrowLeft, Sparkles, FileCode, Eye, Play } from 'lucide-react';
import { uploadCategoryImage } from '../../../config/firebase';

interface StudioHeaderProps {
  template: UniversalFrameTemplate;
  onUpdateTemplateMeta: (updates: Partial<UniversalFrameTemplate>) => void;
  onSave: () => void;
  isSaving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onExit?: () => void;
  onOpenAIImport?: () => void;
  onOpenPSDImport?: () => void;
  previewMode?: 'cutout' | 'sample';
  onTogglePreviewMode?: () => void;
  onTestCustomizer?: () => void;
  onOpenCanva?: () => void;
}

const CATEGORIES = [
  { slug: 'baby-birth-frame', name: 'Baby Birth Frame' },
  { slug: 'birthday-gift', name: 'Birthday Gift' },
  { slug: 'first-year-photo-frames', name: 'First Year Photo Frames' },
  { slug: 'family-frame', name: 'Family Frame' },
  { slug: 'marriage-anniversary-gift', name: 'Marriage Anniversary Gift' },
  { slug: 'photo-collage-frames', name: 'Photo Collage Frames' },
  { slug: 'twin-baby-frames', name: 'Twin Baby Frames' },
  { slug: 'gifts-for-bother-sister', name: 'Gifts For Brother & Sister' },
];

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  template,
  onUpdateTemplateMeta,
  onSave,
  isSaving,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onExit,
  onOpenAIImport,
  onOpenPSDImport,
  previewMode = 'cutout',
  onTogglePreviewMode,
  onTestCustomizer,
  onOpenCanva,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingBase, setIsUploadingBase] = useState(false);

  const handleBaseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBase(true);
    try {
      // Direct Cloudinary upload
      const uploadedUrl = await uploadCategoryImage(template.category || 'templates', file, `base-${Date.now()}`);
      onUpdateTemplateMeta({ baseImageUrl: uploadedUrl });
    } catch (err) {
      console.warn('Base poster upload error, fallback to data url:', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onUpdateTemplateMeta({ baseImageUrl: reader.result });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingBase(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 bg-slate-900 border-b border-slate-800 text-white select-none">
      
      {/* Left: Back button + Template Title & Category */}
      <div className="flex items-center gap-3 w-full lg:w-auto">
        {onExit && (
          <button
            onClick={onExit}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors cursor-pointer"
            title="Exit Template Studio"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="space-y-1 flex-1 min-w-0">
          <input
            type="text"
            value={template.title}
            onChange={(e) => onUpdateTemplateMeta({ title: e.target.value })}
            placeholder="Template Title..."
            className="font-playfair text-lg sm:text-xl font-extrabold bg-transparent hover:bg-slate-800/80 focus:bg-slate-800 px-2 py-0.5 rounded-lg border border-transparent focus:border-pink-500 focus:outline-hidden transition-all text-white w-full max-w-sm"
          />

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={template.category}
              onChange={(e) => onUpdateTemplateMeta({ category: e.target.value })}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 border border-slate-700 text-slate-200 focus:outline-hidden focus:border-pink-500 cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              value={template.status || 'published'}
              onChange={(e) => onUpdateTemplateMeta({ status: e.target.value as 'draft' | 'published' })}
              className={`px-2.5 py-1 text-xs font-extrabold rounded-lg border cursor-pointer ${
                (template.status || 'published') === 'published'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
              }`}
            >
              <option value="published">🟢 Published</option>
              <option value="draft">🟡 Draft</option>
            </select>

            <span className="text-[11px] text-slate-400 font-mono">
              ID: {template.id}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Zoom Controls & Undo / Redo */}
      <div className="flex items-center gap-2 self-center bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
          title="Undo"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
          title="Redo"
        >
          <RotateCcw className="w-4 h-4 -scale-x-100" />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        <button
          onClick={() => onZoomChange(Math.max(0.4, Math.round((zoom - 0.1) * 10) / 10))}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-xs font-mono font-bold text-slate-300 w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => onZoomChange(Math.min(1.6, Math.round((zoom + 0.1) * 10) / 10))}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {onTogglePreviewMode && (
          <>
            <div className="h-4 w-px bg-slate-800 mx-1" />
            <button
              onClick={onTogglePreviewMode}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                previewMode === 'cutout'
                  ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/40'
                  : 'bg-pink-950/40 border-pink-500/50 text-pink-300 hover:bg-pink-900/40'
              }`}
              title={previewMode === 'cutout' ? 'Switch to Sample Photo Preview' : 'Switch to Clean Cutout Guide Mode'}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{previewMode === 'cutout' ? 'Cutouts (Clear)' : 'Sample Photos'}</span>
            </button>
          </>
        )}
      </div>

      {/* Right: AI Import + PSD Import + Base Poster Uploader + Save Button */}
      <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
        {onOpenCanva && (
          <button
            onClick={onOpenCanva}
            className="px-3 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#7D2AE8] via-[#00C4CC] to-[#0074E4] hover:opacity-95 text-white border border-purple-400/40 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            title="Edit artwork directly in Canva"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Edit in Canva</span>
          </button>
        )}

        {onOpenAIImport && (
          <button
            onClick={onOpenAIImport}
            className="px-3 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600/90 to-pink-600/90 hover:from-purple-500 hover:to-pink-500 text-white border border-pink-400/40 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            title="Automatically detect photo slots and text zones from JPG/PNG image"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-200" />
            <span>AI Import</span>
          </button>
        )}

        {onOpenPSDImport && (
          <button
            onClick={onOpenPSDImport}
            className="px-3 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/40 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            title="Extract photo apertures and text layers directly from Photoshop .PSD or .TIF file"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-200" />
            <span>PSD / TIF Import</span>
          </button>
        )}

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleBaseImageUpload}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingBase}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isUploadingBase ? (
            <Loader2 className="w-4 h-4 animate-spin text-pink-500" />
          ) : (
            <Upload className="w-4 h-4 text-pink-400" />
          )}
          <span>{isUploadingBase ? 'Uploading Poster...' : 'Upload Base Artwork'}</span>
        </button>

        {onTestCustomizer && (
          <button
            onClick={onTestCustomizer}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            title="Test this template in the customer-facing live visualizer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Test Live</span>
          </button>
        )}

        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-5 py-2 bg-gradient-to-r from-[#F82BA9] to-[#D61B90] hover:brightness-110 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Template
            </>
          )}
        </button>
      </div>

    </header>
  );
};
