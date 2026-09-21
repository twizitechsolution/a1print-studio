import React, { useState, useCallback, useEffect } from 'react';
import { UniversalFrameTemplate, PhotoSlotConfig, TextZoneConfig, FrameCutoutShape, StaticLayerConfig } from '../../types/template';
import { FrameLibraryView } from './components/FrameLibraryView';
import { NewFrameWizard } from './components/NewFrameWizard';
import { SelectedLayer } from './types';
import { StudioHeader } from './components/StudioHeader';
import { StudioLayerPanel } from './components/StudioLayerPanel';
import { StudioInteractiveCanvas } from './components/StudioInteractiveCanvas';
import { StudioPropertiesPanel } from './components/StudioPropertiesPanel';
import { StudioAIImportModal } from './components/StudioAIImportModal';
import { StudioPSDImportModal } from './components/StudioPSDImportModal';
import { createNewTemplate, createDefaultSlot, createDefaultTextZone, resolveVisibility } from './utils/templateDefaults';
import { generateCleanBaseImage } from '../../utils/cleanBaseGenerator';
import { firebaseCloudDb, base64ToBlob, uploadProductImage } from '../../config/firebase';
import { useCartStore } from '../../store/useCartStore';
import { UniversalFrameCustomizer } from '../../components/customizer/UniversalFrameCustomizer';
import { CheckCircle2, AlertCircle, Link2, X, Grid } from 'lucide-react';

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
  const { products = [], addProduct: addStoreProduct, updateProduct: updateStoreProduct, categories = [] } = useCartStore();

  // Linear Wizard Navigation: Library -> New Frame Wizard -> Editor
  const [currentView, setCurrentView] = useState<'library' | 'wizard' | 'editor'>(
    initialTemplate ? 'editor' : 'library'
  );

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

  // Preview Mode: 'sample' (live sample photos & typography) or 'cutout' (clean cutouts)
  const [previewMode, setPreviewMode] = useState<'cutout' | 'sample'>('sample');

  // Debug wireframe toggle (defaults to false / clean Photoshop view)
  const [showWireframes, setShowWireframes] = useState<boolean>(false);
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);

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

  const handleApplyAICandidates = async ({
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
    let cleanBase = baseImageUrl;
    try {
      cleanBase = await generateCleanBaseImage(baseImageUrl, photoSlots, textZones);
    } catch (e) {
      console.warn('Failed to generate clean base image:', e);
    }
    setTemplate((prev) => ({
      ...prev,
      baseImageUrl,
      cleanBaseImageUrl: cleanBase,
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
    cleanBaseImageUrl,
    originalUploadUrl,
  }: {
    photoSlots: PhotoSlotConfig[];
    textZones: TextZoneConfig[];
    baseImageUrl?: string;
    cleanBaseImageUrl?: string;
    originalUploadUrl?: string;
  }) => {
    pushHistory(template);
    setTemplate((prev) => ({
      ...prev,
      ...(baseImageUrl ? { baseImageUrl } : {}),
      ...(cleanBaseImageUrl ? { cleanBaseImageUrl } : {}),
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
  const handleDeleteLayer = (type: 'slot' | 'zone' | 'static', id: string) => {
    pushHistory(template);
    if (type === 'slot') {
      setTemplate((prev) => ({
        ...prev,
        photoSlots: prev.photoSlots.filter((s) => s.id !== id),
      }));
    } else if (type === 'zone') {
      setTemplate((prev) => ({
        ...prev,
        textZones: prev.textZones.filter((z) => z.id !== id),
      }));
    } else {
      setTemplate((prev) => ({
        ...prev,
        staticLayers: (prev.staticLayers || []).filter((s) => s.id !== id),
      }));
    }
    if (selectedLayer?.id === id) {
      setSelectedLayer(null);
    }
  };

  // Promote static art layer to customer photo slot (1-click override)
  const handlePromoteToSlot = (staticLayerId: string) => {
    const staticLayer = (template.staticLayers || []).find((s) => s.id === staticLayerId);
    if (!staticLayer) return;

    pushHistory(template);
    const promotedSlot: PhotoSlotConfig = {
      id: `slot-${Date.now().toString(36)}`,
      label: staticLayer.label.replace(/^Decorative Art/i, 'Photo Slot'),
      shape: 'rounded',
      x: staticLayer.x,
      y: staticLayer.y,
      width: staticLayer.width,
      height: staticLayer.height,
      defaultPhotoUrl: staticLayer.defaultPhotoUrl || 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600',
      visibility: {
        ...DEFAULT_VISIBILITY,
        userLabel: `Upload ${staticLayer.label}`,
      },
      sourceLayerName: staticLayer.sourceLayerName,
    };

    setTemplate((prev) => ({
      ...prev,
      photoSlots: [...prev.photoSlots, promotedSlot],
      staticLayers: (prev.staticLayers || []).filter((s) => s.id !== staticLayerId),
    }));
    setSelectedLayer({ type: 'slot', id: promotedSlot.id });
  };

  // Demote photo slot to static art layer (1-click override)
  const handleDemoteToStatic = (slotId: string) => {
    const slot = template.photoSlots.find((s) => s.id === slotId);
    if (!slot) return;

    pushHistory(template);
    const demotedStatic: StaticLayerConfig = {
      id: `static-${Date.now().toString(36)}`,
      label: slot.label.replace(/^Photo Slot/i, 'Decorative Art'),
      sourceLayerName: slot.sourceLayerName,
      x: slot.x,
      y: slot.y,
      width: slot.width,
      height: slot.height,
      defaultPhotoUrl: slot.defaultPhotoUrl,
      locked: true,
    };

    setTemplate((prev) => ({
      ...prev,
      photoSlots: prev.photoSlots.filter((s) => s.id !== slotId),
      staticLayers: [...(prev.staticLayers || []), demotedStatic],
    }));
    if (selectedLayer?.id === slotId) {
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
      let cleanBase = template.cleanBaseImageUrl || template.baseImageUrl || '';
      let samplePreview = template.baseImageUrl || cleanBase || '';

      // Upload clean artwork background to Cloudinary if needed
      if (cleanBase && cleanBase.startsWith('data:image')) {
        setSaveMessage({
          text: 'Uploading clean poster background to Cloudinary CDN...',
          type: 'info',
        });
        try {
          const blob = base64ToBlob(cleanBase);
          const uploadedUrl = await uploadProductImage(
            template.id,
            blob,
            `clean_base-${Date.now()}.jpg`
          );
          if (uploadedUrl) {
            cleanBase = uploadedUrl;
          }
        } catch (uploadErr) {
          console.error('Failed to upload clean base image to Cloudinary during save:', uploadErr);
        }
      }

      // Upload sample composite preview to Cloudinary if needed
      if (samplePreview && samplePreview.startsWith('data:image')) {
        try {
          const blob = base64ToBlob(samplePreview);
          const uploadedUrl = await uploadProductImage(
            template.id,
            blob,
            `sample_preview-${Date.now()}.jpg`
          );
          if (uploadedUrl) {
            samplePreview = uploadedUrl;
          }
        } catch (uploadErr) {
          console.error('Failed to upload sample preview to Cloudinary during save:', uploadErr);
        }
      }

      setTemplate((prev) => ({
        ...prev,
        baseImageUrl: samplePreview,
        cleanBaseImageUrl: cleanBase,
      }));

      // Safeguard slot thumbnails so they never exceed Firestore quota (< 100KB)
      const sanitizedPhotoSlots = (template.photoSlots || []).map((slot) => {
        if (slot.defaultPhotoUrl && slot.defaultPhotoUrl.startsWith('data:image') && slot.defaultPhotoUrl.length > 100000) {
          return {
            ...slot,
            defaultPhotoUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600',
          };
        }
        return slot;
      });

      const targetProductId =
        template.productId ||
        (template.id.startsWith('tmpl-') ? template.id.replace('tmpl-', 'prod-') : `prod-${Date.now()}`);

      const templateToSave: UniversalFrameTemplate = {
        ...template,
        productId: targetProductId,
        baseImageUrl: samplePreview,
        cleanBaseImageUrl: cleanBase,
        photoSlots: sanitizedPhotoSlots,
        status: template.status || 'published',
        category: template.category || 'baby-birth-frame',
        createdAt: template.createdAt || new Date().toISOString(),
      };

      // 1. Save to universal_templates and frame_templates collections
      await firebaseCloudDb.setDocument('universal_templates', templateToSave.id, templateToSave);
      await firebaseCloudDb.setDocument('frame_templates', templateToSave.id, templateToSave);

      // 2. Sync with products collection and store
      const existingProd = products.find((p) => p.id === targetProductId);
      const basePrice = Number(templateToSave.basePrice) || 699;
      const originalPrice = Number(templateToSave.originalPrice) || 999;
      const discountPct = originalPrice > basePrice ? Math.round(((originalPrice - basePrice) / originalPrice) * 100) : 30;

      const matchedCategory = categories.find((c) => c.id === templateToSave.category || c.slug === templateToSave.category);
      const categoryLabel = matchedCategory ? matchedCategory.name : (templateToSave.category || 'Custom Frame');

      const fullProduct: any = {
        ...(existingProd || {}),
        id: targetProductId,
        productId: targetProductId,
        title: templateToSave.title || 'Custom Photo Frame',
        subtitle: existingProd?.subtitle || 'Personalized Designer Photo Frame',
        slug: existingProd?.slug || (templateToSave.title || 'custom-frame').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        category: templateToSave.category || 'all',
        categoryLabel: categoryLabel,
        rating: existingProd?.rating || 4.9,
        reviewsCount: existingProd?.reviewsCount || 128,
        thumbnail: samplePreview || cleanBase,
        baseImageUrl: samplePreview || cleanBase,
        image: samplePreview || cleanBase,
        images: existingProd?.images && existingProd.images.length > 0 ? existingProd.images : [samplePreview || cleanBase],
        photoSlots: templateToSave.photoSlots,
        textZones: templateToSave.textZones,
        linkedFrameTemplateId: templateToSave.id,
        sizes: existingProd?.sizes && existingProd.sizes.length > 0 ? existingProd.sizes : [
          {
            id: 'size-m',
            name: 'Medium (9x12 inch)',
            dimensions: '9x12 inch',
            price: basePrice,
            originalPrice: originalPrice,
            discountPercentage: discountPct,
          },
        ],
        frames: existingProd?.frames && existingProd.frames.length > 0 ? existingProd.frames : [
          { id: 'classic-black', name: 'Classic Black', color: '#111827' },
        ],
        version: ((existingProd?.version || 1) + 1),
        updatedAt: new Date().toISOString(),
      };

      try {
        if (existingProd) {
          await firebaseCloudDb.setDocument('products', targetProductId, fullProduct);
          updateStoreProduct(targetProductId, fullProduct);
        } else {
          await addStoreProduct(fullProduct);
        }
      } catch (prodErr) {
        console.warn('Product sync warning in TemplateStudio:', prodErr);
      }

      setSaveMessage({
        text: `Template "${templateToSave.title}" saved successfully (ID: ${templateToSave.id})! Redirecting to Frame Library...`,
        type: 'success',
      });

      onSaveSuccess?.(templateToSave);
      setTimeout(() => {
        setSaveMessage(null);
        setCurrentView('library');
      }, 1500);
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

  const handleTogglePreviewMode = () => {
    setPreviewMode((prev) => (prev === 'cutout' ? 'sample' : 'cutout'));
  };

  // STEP 1: FRAME LIBRARY VIEW
  if (currentView === 'library') {
    return (
      <div className="relative">
        <FrameLibraryView
          onNewFrame={() => setCurrentView('wizard')}
          onEditTemplate={(selectedTmpl) => {
            setTemplate(selectedTmpl);
            if (selectedTmpl.photoSlots?.length > 0) {
              setSelectedLayer({ type: 'slot', id: selectedTmpl.photoSlots[0].id });
            } else if (selectedTmpl.textZones?.length > 0) {
              setSelectedLayer({ type: 'zone', id: selectedTmpl.textZones[0].id });
            } else {
              setSelectedLayer(null);
            }
            setCurrentView('editor');
          }}
          onOpenAdvancedImageImport={() => setIsAIImportOpen(true)}
        />

        {isAIImportOpen && (
          <StudioAIImportModal
            isOpen={isAIImportOpen}
            onClose={() => setIsAIImportOpen(false)}
            category={template.category}
            onApplyCandidates={(candidates) => {
              handleApplyAICandidates(candidates);
              setCurrentView('editor');
              setIsAIImportOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  // STEP 2 & 3: NEW FRAME PSD WIZARD
  if (currentView === 'wizard') {
    return (
      <div className="relative">
        <NewFrameWizard
          onBack={() => setCurrentView('library')}
          categoryList={categories.length > 0 ? categories.map((c) => ({ id: c.slug, name: c.name })) : undefined}
          onComplete={async ({ title, category, photoSlots, textZones, staticLayers, baseImageUrl, cleanBaseImageUrl, originalUploadUrl, documentDimensions }) => {
            const uniqueId = `tmpl-${Date.now()}`;
            // For PSD templates, preserve the pure, crystal-clear artwork directly from Photoshop!
            const newTemplate: UniversalFrameTemplate = {
              id: uniqueId,
              productId: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
              title,
              category,
              basePrice: 699,
              originalPrice: 999,
              baseImageUrl,
              cleanBaseImageUrl: cleanBaseImageUrl || baseImageUrl,
              originalUploadUrl,
              photoSlots,
              textZones,
              staticLayers: staticLayers || [],
              createdAt: new Date().toISOString(),
              status: 'draft',
              importSource: 'psd',
              documentDimensions,
            };

            setTemplate(newTemplate);
            if (photoSlots.length > 0) {
              setSelectedLayer({ type: 'slot', id: photoSlots[0].id });
            } else if (textZones.length > 0) {
              setSelectedLayer({ type: 'zone', id: textZones[0].id });
            } else {
              setSelectedLayer(null);
            }
            setCurrentView('editor');
          }}
          onOpenAdvancedImageImport={() => setIsAIImportOpen(true)}
        />

        {isAIImportOpen && (
          <StudioAIImportModal
            isOpen={isAIImportOpen}
            onClose={() => setIsAIImportOpen(false)}
            category={template.category}
            onApplyCandidates={(candidates) => {
              handleApplyAICandidates(candidates);
              setCurrentView('editor');
              setIsAIImportOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  // STEP 4: EDITOR VIEW
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
        onExit={() => setCurrentView('library')}
        onOpenAIImport={() => setIsAIImportOpen(true)}
        onOpenPSDImport={() => setIsPSDImportOpen(true)}
        previewMode={previewMode}
        onTogglePreviewMode={handleTogglePreviewMode}
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
          {template.staticLayers && template.staticLayers.length > 0 && (
            <span>Static Art: <strong className="text-emerald-400">{template.staticLayers.length}</strong></span>
          )}
          <span>View: <strong className={previewMode === 'cutout' ? 'text-cyan-300' : 'text-pink-400'}>{previewMode === 'cutout' ? 'Clean Cutouts' : 'Sample Photos'}</strong></span>

          {/* Wireframes Debug Toggle (Off by default for pristine clean canvas) */}
          <button
            onClick={() => setShowWireframes(!showWireframes)}
            className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
              showWireframes
                ? 'bg-pink-600/30 border-pink-500 text-pink-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Toggle faint outlines for all regions (Unfilled debug lines only)"
          >
            <Grid className="w-3 h-3" />
            <span>Wireframes: {showWireframes ? 'ON' : 'OFF'}</span>
          </button>
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
          onPromoteToSlot={handlePromoteToSlot}
          onDemoteToStatic={handleDemoteToStatic}
          hoveredLayerId={hoveredLayerId}
          onHoverLayer={setHoveredLayerId}
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
          showWireframes={showWireframes}
          hoveredLayerId={hoveredLayerId}
          onHoverLayer={setHoveredLayerId}
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
