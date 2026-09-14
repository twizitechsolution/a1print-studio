import React, { useState, useCallback } from 'react';
import { UniversalFrameTemplate, PhotoSlotConfig, TextZoneConfig, FrameCutoutShape } from '../../types/template';
import { SelectedLayer } from './types';
import { StudioHeader } from './components/StudioHeader';
import { StudioLayerPanel } from './components/StudioLayerPanel';
import { StudioInteractiveCanvas } from './components/StudioInteractiveCanvas';
import { StudioPropertiesPanel } from './components/StudioPropertiesPanel';
import { StudioAIImportModal } from './components/StudioAIImportModal';
import { createNewTemplate, createDefaultSlot, createDefaultTextZone, resolveVisibility } from './utils/templateDefaults';
import { firebaseCloudDb } from '../../config/firebase';
import { CheckCircle2, AlertCircle } from 'lucide-react';

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
  // Main Draft State
  const [template, setTemplate] = useState<UniversalFrameTemplate>(() => initialTemplate || createNewTemplate());

  // Selection
  const [selectedLayer, setSelectedLayer] = useState<SelectedLayer | null>(null);

  // Undo / Redo History
  const [history, setHistory] = useState<UniversalFrameTemplate[]>([]);
  const [future, setFuture] = useState<UniversalFrameTemplate[]>([]);

  // Viewport Zoom
  const [zoom, setZoom] = useState<number>(0.9);

  // Status banners
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // AI Import Modal
  const [isAIImportOpen, setIsAIImportOpen] = useState<boolean>(false);

  // Record history snapshot helper
  const pushHistory = useCallback((current: UniversalFrameTemplate) => {
    setHistory((prev) => [...prev.slice(-15), current]);
    setFuture([]);
  }, []);

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
      text: `AI successfully detected & loaded ${photoSlots.length} photo slot(s) and ${textZones.length} text/calendar zone(s)!`,
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

  // Add Photo Slot
  const handleAddSlot = (shape: FrameCutoutShape = 'rounded') => {
    pushHistory(template);
    const newSlot = createDefaultSlot(template.photoSlots.length + 1, shape);
    setTemplate((prev) => ({
      ...prev,
      photoSlots: [...prev.photoSlots, newSlot],
    }));
    setSelectedLayer({ type: 'slot', id: newSlot.id });
  };

  // Add Text Zone
  const handleAddTextZone = (type: TextZoneConfig['type'] = 'text') => {
    pushHistory(template);
    const newZone = createDefaultTextZone(template.textZones.length + 1, type);
    setTemplate((prev) => ({
      ...prev,
      textZones: [...prev.textZones, newZone],
    }));
    setSelectedLayer({ type: 'zone', id: newZone.id });
  };

  // Update a single Photo Slot
  const handleUpdateSlot = (updatedSlot: PhotoSlotConfig) => {
    setTemplate((prev) => ({
      ...prev,
      photoSlots: prev.photoSlots.map((s) => (s.id === updatedSlot.id ? updatedSlot : s)),
    }));
  };

  // Update a single Text Zone
  const handleUpdateZone = (updatedZone: TextZoneConfig) => {
    setTemplate((prev) => ({
      ...prev,
      textZones: prev.textZones.map((z) => (z.id === updatedZone.id ? updatedZone : z)),
    }));
  };

  // Delete layer
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
    if (selectedLayer?.id === id) setSelectedLayer(null);
  };

  // Toggle Visibility
  const handleToggleVisibility = (type: 'slot' | 'zone', id: string) => {
    pushHistory(template);
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

  // Save Template to Firestore
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

      setSaveMessage({
        text: `Template "${templateToSave.title}" saved successfully to Cloud Firestore!`,
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
      />

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
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-950/80">
          <StudioInteractiveCanvas
            template={template}
            selectedLayer={selectedLayer}
            onSelectLayer={setSelectedLayer}
            onUpdateSlot={handleUpdateSlot}
            onUpdateZone={handleUpdateZone}
            zoom={zoom}
          />
        </div>

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

    </div>
  );
};
