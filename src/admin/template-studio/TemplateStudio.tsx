import React, { useState, useCallback, useEffect } from 'react';
import { UniversalFrameTemplate, PhotoSlotConfig, TextZoneConfig, FrameCutoutShape } from '../../types/template';
import { SelectedLayer } from './types';
import { StudioHeader } from './components/StudioHeader';
import { StudioLayerPanel } from './components/StudioLayerPanel';
import { StudioInteractiveCanvas } from './components/StudioInteractiveCanvas';
import { StudioPropertiesPanel } from './components/StudioPropertiesPanel';
import { StudioAIImportModal } from './components/StudioAIImportModal';
import { StudioPSDImportModal } from './components/StudioPSDImportModal';
import { createNewTemplate, createDefaultSlot, createDefaultTextZone, resolveVisibility } from './utils/templateDefaults';
import { firebaseCloudDb } from '../../config/firebase';
import { useCartStore } from '../../store/useCartStore';
import { UniversalFrameCustomizer } from '../../components/customizer/UniversalFrameCustomizer';
import { CheckCircle2, AlertCircle, Link2, X } from 'lucide-react';

interface TemplateStudioProps {
  initialTemplate?: UniversalFrameTemplate;
  onSaveSuccess?: (savedTemplate: UniversalFrameTemplate) => void;
  onExit?: () => void;
}

export const TemplateStudio: React.FC<TemplateStudioProps> = ({
  initialTemplate,
  onSaveSuccess,
  onExit,
}) => {
  // Store products for 2-way sync
  const { products = [], updateProduct: updateStoreProduct } = useCartStore();

  // Main Draft State
  const [template, setTemplate] = useState<UniversalFrameTemplate>(() => {
    const base = initialTemplate || createNewTemplate();
    return {
      ...base,
      photoSlots: base.photoSlots || [],
      textZones: base.textZones || [],
    };
  });

  // Selection
  const [selectedLayer, setSelectedLayer] = useState<SelectedLayer | null>(null);

  // Preview Mode: 'cutout' (clean transparent aperture guides) or 'sample' (mock preview photos)
  const [previewMode, setPreviewMode] = useState<'cutout' | 'sample'>('cutout');

  // Live Customer Test Modal
  const [isLiveTestOpen, setIsLiveTestOpen] = useState<boolean>(false);

  // Undo / Redo History
  const [history, setHistory] = useState<UniversalFrameTemplate[]>([]);
  const [future, setFuture] = useState<UniversalFrameTemplate[]>([]);

  // Viewport Zoom
  const [zoom, setZoom] = useState<number>(0.9);

  // Status banners
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Import Modals
  const [isAIImportOpen, setIsAIImportOpen] = useState<boolean>(false);
  const [isPSDImportOpen, setIsPSDImportOpen] = useState<boolean>(false);

  // Record history snapshot helper
  const pushHistory = useCallback((current: UniversalFrameTemplate) => {
    setHistory((prev) => [...prev.slice(-15), current]);
    setFuture([]);
  }, []);

  // Update initial template if passed prop changes
  useEffect(() => {
    if (initialTemplate) {
      setTemplate(initialTemplate);
    }
  }, [initialTemplate]);

  const handleApplyAICandidates = ({
    baseImageUrl,
    photoSlots,
    textZones,
    originalUploadUrl,
    aiConfidenceRecord,
  }: {
    baseImageUrl: string;
    photoSlots: PhotoSlotConfig[];
    textZones: TextZoneConfig[];
    originalUploadUrl?: string;
    aiConfidenceRecord: Record<string, number>;
  }) => {
    pushHistory(template);
    setTemplate((prev) => ({
      ...prev,
      baseImageUrl,
      originalUploadUrl,
      importSource: 'ai-image',
      photoSlots,
      textZones,
      aiDetectionConfidence: aiConfidenceRecord,
    }));
    setSelectedLayer(photoSlots.length > 0 ? { type: 'slot', id: photoSlots[0].id } : null);
    setSaveMessage({
      text: `AI successfully analyzed image & loaded ${photoSlots.length} photo slot(s) and ${textZones.length} text zone(s)!`,
      type: 'success',
    });
    setTimeout(() => setSaveMessage(null), 5000);
  };

  const handleApplyPSDLayers = ({
    photoSlots,
    textZones,
    baseImageUrl,
    originalUploadUrl,
  }: {
    photoSlots: PhotoSlotConfig[];
    textZones: TextZoneConfig[];
    baseImageUrl?: string;
    originalUploadUrl?: string;
  }) => {
    pushHistory(template);
    setTemplate((prev) => ({
      ...prev,
      ...(baseImageUrl ? { baseImageUrl } : {}),
      originalUploadUrl: originalUploadUrl || prev.originalUploadUrl,
      importSource: 'psd',
      photoSlots,
      textZones,
    }));
    setSelectedLayer(photoSlots.length > 0 ? { type: 'slot', id: photoSlots[0].id } : null);
    setSaveMessage({
      text: `PSD successfully imported ${photoSlots.length} photo slot(s) and ${textZones.length} text zone(s)!`,
      type: 'success',
    });
    setTimeout(() => setSaveMessage(null), 5000);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setFuture((prev) => [template, ...prev]);
    setTemplate(previous);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setHistory((prev) => [...prev, template]);
    setTemplate(next);
  };

  // Update Template Meta
  const handleUpdateTemplateMeta = (updates: Partial<UniversalFrameTemplate>) => {
    pushHistory(template);
    setTemplate((prev) => ({ ...prev, ...updates }));
  };

  // Product linking handler
  const handleProductSelect = (productId: string) => {
    if (!productId) {
      setTemplate((prev) => ({ ...prev, productId: undefined }));
      return;
    }
    const matched = (products || []).find((p) => p.id === productId);
    if (!matched) return;

    pushHistory(template);
    setTemplate((prev) => ({
      ...prev,
      productId: matched.id,
      title: prev.title === 'Untitled Frame Template' ? matched.title : prev.title,
      category: matched.category || prev.category,
      baseImageUrl: prev.baseImageUrl || matched.baseImageUrl || matched.thumbnail || prev.baseImageUrl,
      basePrice: matched.sizes?.[0]?.price || prev.basePrice,
      originalPrice: matched.sizes?.[0]?.originalPrice || prev.originalPrice,
    }));
  };

  // Add Photo Slot
  const handleAddSlot = (shape: FrameCutoutShape = 'rounded') => {
    pushHistory(template);
    const newSlot = createDefaultSlot(`Slot #${template.photoSlots.length + 1}`, shape);
    setTemplate((prev) => ({
      ...prev,
      photoSlots: [...prev.photoSlots, newSlot],
    }));
    setSelectedLayer({ type: 'slot', id: newSlot.id });
  };

  // Add Text Zone
  const handleAddTextZone = (type: TextZoneConfig['type'] = 'text') => {
    pushHistory(template);
    const newZone = createDefaultTextZone(`Text Zone #${template.textZones.length + 1}`, type);
    setTemplate((prev) => ({
      ...prev,
      textZones: [...prev.textZones, newZone],
    }));
    setSelectedLayer({ type: 'zone', id: newZone.id });
  };

  // Update Slot
  const handleUpdateSlot = (updatedSlot: PhotoSlotConfig) => {
    setTemplate((prev) => ({
      ...prev,
      photoSlots: prev.photoSlots.map((s) => (s.id === updatedSlot.id ? updatedSlot : s)),
    }));
  };

  // Update Text Zone
  const handleUpdateZone = (updatedZone: TextZoneConfig) => {
    setTemplate((prev) => ({
      ...prev,
      textZones: prev.textZones.map((z) => (z.id === updatedZone.id ? updatedZone : z)),
    }));
  };

  // Delete Layer
  const handleDeleteLayer = (type: 'slot' | 'zone', id: string) => {
    pushHistory(template);
    if (type === 'slot') {
      setTemplate((prev) => ({
        ...prev,
        photoSlots: prev.photoSlots.filter((s) => s.id !== id),
      }));
    } else {
      setTemplate((prev) => ({
        ...prev,
        textZones: prev.textZones.filter((z) => z.id !== id),
      }));
    }
    if (selectedLayer?.id === id) {
      setSelectedLayer(null);
    }
  };

  // Toggle Visibility
  const handleToggleVisibility = (type: 'slot' | 'zone', id: string) => {
    if (type === 'slot') {
      setTemplate((prev) => ({
        ...prev,
        photoSlots: prev.photoSlots.map((s) => {
          if (s.id === id) {
            const currentVis = resolveVisibility(s.visibility);
            return {
              ...s,
              visibility: {
                ...currentVis,
                userVisible: !currentVis.userVisible,
                userEditable: !currentVis.userVisible,
              },
            };
          }
          return s;
        }),
      }));
    } else {
      setTemplate((prev) => ({
        ...prev,
        textZones: prev.textZones.map((z) => {
          if (z.id === id) {
            const currentVis = resolveVisibility(z.visibility);
            return {
              ...z,
              visibility: {
                ...currentVis,
                userVisible: !currentVis.userVisible,
                userEditable: !currentVis.userVisible,
              },
            };
          }
          return z;
        }),
      }));
    }
  };

  // Toggle Lock
  const handleToggleLock = (type: 'slot' | 'zone', id: string) => {
    if (type === 'slot') {
      setTemplate((prev) => ({
        ...prev,
        photoSlots: prev.photoSlots.map((s) => (s.id === id ? { ...s, locked: !s.locked } : s)),
      }));
    } else {
      setTemplate((prev) => ({
        ...prev,
        textZones: prev.textZones.map((z) => (z.id === id ? { ...z, locked: !z.locked } : z)),
      }));
    }
  };

  // Save Template to Firestore & Sync with Linked Product
  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const templateToSave: UniversalFrameTemplate = {
        ...template,
        createdAt: template.createdAt || new Date().toISOString(),
      };

      // 1. Save to universal_templates collection
      await firebaseCloudDb.setDocument('universal_templates', templateToSave.id, templateToSave);

      // 2. If linked to a product, sync to products collection and store
      if (templateToSave.productId) {
        const productUpdate = {
          baseImageUrl: templateToSave.baseImageUrl,
          photoSlots: templateToSave.photoSlots,
          textZones: templateToSave.textZones,
          templateConfig: templateToSave,
        };

        try {
          await firebaseCloudDb.setDocument('products', templateToSave.productId, productUpdate);
          updateStoreProduct(templateToSave.productId, productUpdate);
        } catch (prodErr) {
          console.warn('Product sync warning:', prodErr);
        }
      }

      setSaveMessage({
        text: `Template "${templateToSave.title}" saved successfully to Cloud Firestore!${
          templateToSave.productId ? ' Linked product updated.' : ''
        }`,
        type: 'success',
      });

      onSaveSuccess?.(templateToSave);
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to save template:', err);
      setSaveMessage({
        text: err?.message || 'Failed to save template to Cloud Firestore. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Find active selected layer objects
  const activeSlot = selectedLayer?.type === 'slot' ? template.photoSlots.find((s) => s.id === selectedLayer.id) || null : null;
  const activeZone = selectedLayer?.type === 'zone' ? template.textZones.find((z) => z.id === selectedLayer.id) || null : null;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] min-h-[680px] bg-slate-950 font-jost text-white overflow-hidden select-none">
      
      {/* Top Header */}
      <StudioHeader
        template={template}
        onUpdateTemplateMeta={handleUpdateTemplateMeta}
        onSave={handleSave}
        isSaving={isSaving}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={setZoom}
        onExit={onExit}
        onOpenAIImport={() => setIsAIImportOpen(true)}
        onOpenPSDImport={() => setIsPSDImportOpen(true)}
        previewMode={previewMode}
        onTogglePreviewMode={() => setPreviewMode((prev) => (prev === 'cutout' ? 'sample' : 'cutout'))}
        onTestCustomizer={() => setIsLiveTestOpen(true)}
      />

      {/* Sub-Header: Linked Product Sync Bar */}
      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Link2 className="w-3.5 h-3.5 text-pink-400" />
          <span className="text-slate-400 font-bold">Linked Catalog Product:</span>
          <select
            value={template.productId || ''}
            onChange={(e) => handleProductSelect(e.target.value)}
            className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white font-semibold text-xs focus:outline-none focus:border-pink-500"
          >
            <option value="">None (Standalone Template)</option>
            {(products || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.categoryLabel || p.category})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span>Slots: <strong className="text-cyan-400">{template.photoSlots.length}</strong></span>
          <span>Text Zones: <strong className="text-purple-400">{template.textZones.length}</strong></span>
          <span>View: <strong className={previewMode === 'cutout' ? 'text-cyan-300' : 'text-pink-400'}>{previewMode === 'cutout' ? 'Clean Cutouts' : 'Sample Photos'}</strong></span>
        </div>
      </div>

      {/* Save feedback banner */}
      {saveMessage && (
        <div
          className={`px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-2 animate-fadeIn ${
            saveMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {saveMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* 3-Column Studio Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        
        {/* Left: Layers Stack */}
        <StudioLayerPanel
          template={template}
          selectedLayer={selectedLayer}
          onSelectLayer={setSelectedLayer}
          onAddSlot={handleAddSlot}
          onAddTextZone={handleAddTextZone}
          onDeleteLayer={handleDeleteLayer}
          onToggleVisibility={handleToggleVisibility}
          onToggleLock={handleToggleLock}
        />

        {/* Center: Live Interactive Canvas Workspace */}
        <StudioInteractiveCanvas
          template={template}
          selectedLayer={selectedLayer}
          onSelectLayer={setSelectedLayer}
          onUpdateSlot={handleUpdateSlot}
          onUpdateZone={handleUpdateZone}
          zoom={zoom}
          previewMode={previewMode}
        />

        {/* Right: Properties & Visibility Inspector */}
        <StudioPropertiesPanel
          selectedLayer={selectedLayer}
          slot={activeSlot}
          zone={activeZone}
          onUpdateSlot={handleUpdateSlot}
          onUpdateZone={handleUpdateZone}
        />

      </div>

      {/* AI Import Modal */}
      <StudioAIImportModal
        isOpen={isAIImportOpen}
        onClose={() => setIsAIImportOpen(false)}
        category={template.category}
        onApplyCandidates={handleApplyAICandidates}
      />

      {/* PSD Import Modal */}
      <StudioPSDImportModal
        isOpen={isPSDImportOpen}
        onClose={() => setIsPSDImportOpen(false)}
        category={template.category}
        onApplyPSDLayers={handleApplyPSDLayers}
      />

      {/* Live Storefront Customizer Testing Modal */}
      {isLiveTestOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                Customer Storefront Customizer Live Test
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Full Customer Flow
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Upload customer photos into apertures, type custom names and dates, and verify the high-res print export.
              </p>
            </div>
            <button
              onClick={() => setIsLiveTestOpen(false)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-w-6xl mx-auto w-full flex-1">
            <UniversalFrameCustomizer
              template={template}
              onProceedToCheckout={(photos, texts, size, compiledUrl) => {
                alert(`Storefront Verification Passed!\n• Uploaded Photos: ${Object.keys(photos).length}\n• Custom Text Fields: ${Object.keys(texts).length}\n• Size: ${size}\n• High-Res Canvas Ready: ${Boolean(compiledUrl)}`);
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
};
