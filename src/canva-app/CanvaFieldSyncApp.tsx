import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Image as ImageIcon,
  Type,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Send,
  Eye,
  Info,
  ExternalLink,
  Sparkles,
  CheckSquare,
  Square,
  Sliders,
  ChevronDown,
} from 'lucide-react';

interface TemplateOption {
  id: string;
  title: string;
  category?: string;
  baseImageUrl?: string;
  canvaDesignId?: string;
}

interface DetectedField {
  fieldId: string;
  label: string;
  type: 'photo' | 'text';
  left: number;
  top: number;
  width: number;
  height?: number;
  centerX?: number;
  centerY?: number;
  shape?: 'circle' | 'rounded' | 'rectangle' | 'heart';
  rotation?: number;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  align?: 'center' | 'left' | 'right';
  defaultValue?: string;
  originalTransparency?: number;
  elementRef?: any;
  selected: boolean;
}

const DEFAULT_PRESET_TEMPLATES: TemplateOption[] = [
  {
    id: 'tmpl-prod-1788932131885',
    title: 'Baby Frames (Current Product)',
    canvaDesignId: 'active-canva-design',
  },
  {
    id: 'tmpl-prod-1788931892471',
    title: 'Baby Birth Frame',
    canvaDesignId: 'active-canva-design',
  },
];

export const CanvaFieldSyncApp: React.FC = () => {
  const [isCanvaEnvironment, setIsCanvaEnvironment] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [designId, setDesignId] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('tmpl-prod-1788932131885');
  const [templatesList, setTemplatesList] = useState<TemplateOption[]>(DEFAULT_PRESET_TEMPLATES);
  const [isCustomTemplateInput, setIsCustomTemplateInput] = useState<boolean>(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(false);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 1600,
  });

  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
  const [lastSyncedStats, setLastSyncedStats] = useState<{
    photoCount: number;
    textCount: number;
    syncedAt: string;
  } | null>(null);

  // Fetch recent templates from backend for 1-click selection
  const fetchRecentTemplates = useCallback(async (currentTId?: string) => {
    setIsLoadingTemplates(true);
    try {
      const apiBase =
        window.location.origin.includes('vercel.app') || window.location.origin.includes('localhost')
          ? ''
          : 'https://a1print-studio.vercel.app';
      const res = await fetch(`${apiBase}/api/canva?action=recent-templates`);
      if (res.ok) {
        const data = await res.json();
        if (data.templates && Array.isArray(data.templates) && data.templates.length > 0) {
          // Merge API templates with default presets
          const combined = [
            ...data.templates,
            ...DEFAULT_PRESET_TEMPLATES.filter((p) => !data.templates.some((t: any) => t.id === p.id)),
          ];
          setTemplatesList(combined);
          if (!currentTId && !templateId) {
            setTemplateId(combined[0].id);
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch templates list:', err);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [templateId]);

  // Read URL query parameters (?templateId=... or ?designId=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tId = params.get('templateId') || params.get('template') || '';
    const dId = params.get('designId') || params.get('design_id') || '';
    if (tId) setTemplateId(tId);
    if (dId) setDesignId(dId);

    // Detect if running inside Canva's iframe
    const inIframe = window.self !== window.top;
    setIsCanvaEnvironment(inIframe);

    // Initial scan and template list load
    fetchRecentTemplates(tId);
    scanDesignElements();
  }, []);

  // Format clean label from token or raw text
  const formatLabel = (raw: string): string => {
    if (!raw) return 'Field';
    const clean = raw.replace(/^\{\{|\}\}$/g, '').trim();
    if (clean.length > 30) return clean.slice(0, 27) + '...';
    return clean
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  // Universal Canva Element Scanner
  const scanDesignElements = useCallback(async () => {
    setIsScanning(true);
    setErrorMessage('');
    setSyncStatus('idle');

    try {
      let canvaDesignSdk: any = null;
      try {
        canvaDesignSdk = await (Function('return import("@canva/design")')().catch(() => null));
      } catch {
        canvaDesignSdk = null;
      }

      if (canvaDesignSdk && typeof canvaDesignSdk.openDesign === 'function') {
        // -------------------------------------------------------------------
        // 1. LIVE CANVA RUNTIME: Universal Element Scan
        // -------------------------------------------------------------------
        await canvaDesignSdk.openDesign({ type: 'current_page' }, async (session: any) => {
          const page = session?.page;
          const elements = page?.elements || [];
          const dims = page?.dimensions || { width: 1200, height: 1600 };
          setPageDimensions({ width: dims.width, height: dims.height });

          if (canvaDesignSdk.getDesignToken) {
            try {
              const token = await canvaDesignSdk.getDesignToken();
              if (token && !designId) setDesignId('active-canva-design');
            } catch {}
          }

          const scanned: DetectedField[] = [];
          let photoIndex = 1;
          let textIndex = 1;

          for (const el of elements) {
            const width = el.width ?? 100;
            const height = el.height ?? 100;

            // Skip background cover image if it spans almost 100% of the entire page
            const isFullBackground =
              width >= dims.width * 0.95 && height >= dims.height * 0.95 && el.left <= 10 && el.top <= 10;
            if (isFullBackground) {
              continue;
            }

            // A. TEXT ELEMENT: Any text box in Canva
            if (el.type === 'text' && el.text) {
              let textContent = '';
              if (typeof el.text.readPlaintext === 'function') {
                textContent = await el.text.readPlaintext();
              } else if (typeof el.text === 'string') {
                textContent = el.text;
              }

              textContent = textContent.trim();
              if (!textContent) continue;

              const tokenMatch = textContent.match(/\{\{\s*([\w\s-]+?)\s*\}\}/);
              const fieldId = tokenMatch
                ? tokenMatch[1].trim().toUpperCase().replace(/\s+/g, '_')
                : `text-${textIndex++}`;

              const left = el.left ?? 0;
              const top = el.top ?? 0;
              const centerX = left + width / 2;
              const centerY = top + height / 2;

              scanned.push({
                fieldId,
                label: formatLabel(textContent),
                defaultValue: textContent,
                type: 'text',
                left,
                top,
                width,
                height,
                centerX,
                centerY,
                rotation: el.rotation ?? 0,
                color: el.color || '#111827',
                fontSize: el.fontSize || 24,
                fontFamily: el.fontFamily || 'Inter',
                align: el.textAlign || 'center',
                originalTransparency: el.transparency ?? 0,
                elementRef: el,
                selected: true,
              });
              continue;
            }

            // B. PHOTO / FRAME / SHAPE ELEMENT: Any visual frame or image
            const isVisualElement =
              el.type === 'image' ||
              el.type === 'rect' ||
              el.type === 'shape' ||
              el.type === 'frame' ||
              el.type === 'grid' ||
              Boolean(el.image);

            if (isVisualElement && width >= 40 && height >= 40) {
              const slotId = `photo-${photoIndex++}`;
              const left = el.left ?? 0;
              const top = el.top ?? 0;
              const centerX = left + width / 2;
              const centerY = top + height / 2;
              const aspect = width / height;
              const shape: 'circle' | 'rounded' | 'rectangle' | 'heart' =
                el.shapeType === 'circle' || (aspect >= 0.82 && aspect <= 1.22) ? 'circle' : 'rounded';

              scanned.push({
                fieldId: slotId,
                label: `Photo Slot ${photoIndex - 1}`,
                type: 'photo',
                shape,
                left,
                top,
                width,
                height,
                centerX,
                centerY,
                rotation: el.rotation ?? 0,
                originalTransparency: el.transparency ?? 0,
                elementRef: el,
                selected: true,
              });
            }
          }

          setDetectedFields(scanned);
        });
      } else {
        // -------------------------------------------------------------------
        // 2. STANDALONE PREVIEW / SIMULATOR (Browser testing)
        // -------------------------------------------------------------------
        await new Promise((r) => setTimeout(r, 400));

        const sampleFields: DetectedField[] = [
          {
            fieldId: 'photo-1',
            label: 'Photo Slot 1 (Top Left)',
            type: 'photo',
            left: 80,
            top: 380,
            width: 320,
            height: 320,
            rotation: 0,
            originalTransparency: 0,
            selected: true,
          },
          {
            fieldId: 'photo-2',
            label: 'Photo Slot 2 (Top Center)',
            type: 'photo',
            left: 440,
            top: 380,
            width: 320,
            height: 320,
            rotation: 0,
            originalTransparency: 0,
            selected: true,
          },
          {
            fieldId: 'photo-3',
            label: 'Photo Slot 3 (Center Star Frame)',
            type: 'photo',
            left: 400,
            top: 750,
            width: 400,
            height: 400,
            rotation: 0,
            originalTransparency: 0,
            selected: true,
          },
          {
            fieldId: 'subheading-1',
            label: 'Add a Subheading',
            defaultValue: 'Add a subheading',
            type: 'text',
            left: 200,
            top: 240,
            width: 800,
            rotation: 0,
            color: '#1e293b',
            fontSize: 34,
            align: 'center',
            originalTransparency: 0,
            selected: true,
          },
          {
            fieldId: 'message-bottom',
            label: 'Celebrating One Year of Joy!',
            defaultValue: 'Celebrating One Year of Joy!',
            type: 'text',
            left: 150,
            top: 1220,
            width: 900,
            rotation: 0,
            color: '#334155',
            fontSize: 26,
            align: 'center',
            originalTransparency: 0,
            selected: true,
          },
        ];

        setDetectedFields(sampleFields);
      }
    } catch (err: any) {
      console.error('Universal scan error:', err);
      setErrorMessage(err.message || 'Failed to scan design elements');
    } finally {
      setIsScanning(false);
    }
  }, [designId]);

  // Toggle selection for a field
  const toggleFieldSelection = (fieldId: string) => {
    setDetectedFields((prev) =>
      prev.map((f) => (f.fieldId === fieldId ? { ...f, selected: !f.selected } : f))
    );
  };

  // Toggle all
  const toggleSelectAll = (select: boolean) => {
    setDetectedFields((prev) => prev.map((f) => ({ ...f, selected: select })));
  };

  // Execute clean export & field sync
  const handleSyncToA1Print = async () => {
    const selectedFields = detectedFields.filter((f) => f.selected);
    if (selectedFields.length === 0) {
      setErrorMessage('Please select at least one Photo Slot or Text Zone to sync.');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('syncing');
    setErrorMessage('');
    setStatusMessage('Hiding dummy photos & texts to export clean base artwork...');

    const markerElementsWithOriginals: Array<{ element: any; origTransparency: number }> = [];

    try {
      // 1. In Canva runtime: Hide selected customer elements so exported PNG has clean background
      let canvaDesignSdk: any = null;
      try {
        canvaDesignSdk = await (Function('return import("@canva/design")')().catch(() => null));
      } catch {}

      if (canvaDesignSdk && typeof canvaDesignSdk.openDesign === 'function') {
        await canvaDesignSdk.openDesign({ type: 'current_page' }, async (session: any) => {
          for (const item of selectedFields) {
            if (item.elementRef) {
              const orig = item.originalTransparency ?? 0;
              markerElementsWithOriginals.push({ element: item.elementRef, origTransparency: orig });
              item.elementRef.transparency = 1; // Temporarily invisible
            }
          }
          await session.sync();
        });
      }

      setStatusMessage('Exporting clean artwork & updating template layers in A1Print...');

      // 2. Prepare payload
      const payload = {
        canvaDesignId: designId || undefined,
        templateId: templateId || undefined,
        pageWidth: pageDimensions.width,
        pageHeight: pageDimensions.height,
        fields: selectedFields.map((f) => ({
          fieldId: f.fieldId,
          type: f.type,
          shape: f.shape,
          left: f.left,
          top: f.top,
          centerX: f.centerX,
          centerY: f.centerY,
          width: f.width,
          height: f.height,
          rotation: f.rotation,
          color: f.color,
          fontSize: f.fontSize,
          fontFamily: f.fontFamily,
          align: f.align,
          defaultValue: f.defaultValue,
        })),
      };

      const apiBase =
        window.location.origin.includes('vercel.app') || window.location.origin.includes('localhost')
          ? ''
          : 'https://a1print-studio.vercel.app';

      const res = await fetch(`${apiBase}/api/canva?action=field-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Field sync failed with HTTP ${res.status}`);
      }

      setSyncStatus('success');
      setLastSyncedStats({
        photoCount: data.photoSlotsCount ?? selectedFields.filter((f) => f.type === 'photo').length,
        textCount: data.textZonesCount ?? selectedFields.filter((f) => f.type === 'text').length,
        syncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      setStatusMessage('Template successfully updated! All layers are now active.');
    } catch (err: any) {
      console.error('Field sync error:', err);
      setSyncStatus('error');
      setErrorMessage(err.message || 'Failed to sync fields to A1Print');
    } finally {
      // 3. Always restore original element visibility in Canva so designer sees everything
      try {
        let canvaDesignSdk: any = null;
        try {
          canvaDesignSdk = await (Function('return import("@canva/design")')().catch(() => null));
        } catch {}

        if (canvaDesignSdk && markerElementsWithOriginals.length > 0) {
          await canvaDesignSdk.openDesign({ type: 'current_page' }, async (session: any) => {
            for (const { element, origTransparency } of markerElementsWithOriginals) {
              element.transparency = origTransparency;
            }
            await session.sync();
          });
        }
      } catch (restoreErr) {
        console.warn('Could not restore element visibility:', restoreErr);
      }

      setIsSyncing(false);
    }
  };

  const selectedCount = detectedFields.filter((f) => f.selected).length;
  const photoFields = detectedFields.filter((f) => f.type === 'photo');
  const textFields = detectedFields.filter((f) => f.type === 'text');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-purple-500 selection:text-white pb-6">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-purple-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
              A1Print Layer Sync
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Automatic Field Detection</p>
          </div>
        </div>
        <button
          onClick={() => scanDesignElements()}
          disabled={isScanning || isSyncing}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          title="Rescan Design Elements"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin text-purple-600' : ''}`} />
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 px-4 py-3 space-y-3 max-w-md mx-auto w-full">
        {/* Environment Alert */}
        {!isCanvaEnvironment && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-semibold">Browser Preview:</span> Displaying simulated layers.
              Inside Canva, this app automatically reads every photo and text box you add!
            </div>
          </div>
        )}

        {/* Template Connection Bar */}
        <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              Target Template
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-mono">
              {pageDimensions.width} × {pageDimensions.height} px
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-[10px] text-slate-500 font-medium">Select A1Print Template</label>
                {isLoadingTemplates && <span className="text-[9px] text-purple-600 animate-pulse">Loading templates...</span>}
              </div>
              {templatesList.length > 0 ? (
                <div className="relative">
                  <select
                    value={templateId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setTemplateId(selectedId);
                      const matched = templatesList.find((t) => t.id === selectedId);
                      if (matched?.canvaDesignId && !designId) {
                        setDesignId(matched.canvaDesignId);
                      }
                    }}
                    className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-xs appearance-none pr-7 cursor-pointer"
                  >
                    {templatesList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.id.replace(/^tmpl-/, '')})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              ) : (
                <input
                  type="text"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  placeholder="tmpl-prod-..."
                  className="w-full text-xs font-mono px-2 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <span>Target ID: <code className="font-mono text-purple-600">{templateId || 'None'}</code></span>
              {designId && <span>Canva: <code className="font-mono text-slate-400">{designId.slice(0, 10)}...</code></span>}
            </div>
          </div>
        </div>

        {/* How It Works Card */}
        <div className="bg-purple-50/70 rounded-xl p-3 border border-purple-100 text-xs text-purple-900 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5 text-purple-800">
            <Sliders className="w-3.5 h-3.5" />
            Automatic Layer Conversion
          </p>
          <p className="text-[11px] text-purple-800/80 leading-relaxed">
            All photos and text boxes you place in Canva are detected below. Check the layers that customers should customize on the shop page.
          </p>
        </div>

        {/* Detected Layers List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Detected Elements ({detectedFields.length})
            </span>
            <div className="flex items-center gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => toggleSelectAll(selectedCount !== detectedFields.length)}
                className="text-purple-600 hover:text-purple-700 font-semibold cursor-pointer underline"
              >
                {selectedCount === detectedFields.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {detectedFields.length === 0 ? (
              <div className="py-8 text-center px-4 space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700">No elements detected on canvas</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Add photos, frames, or text boxes in Canva, then click the Rescan button above.
                </p>
              </div>
            ) : (
              detectedFields.map((field) => (
                <div
                  key={field.fieldId}
                  onClick={() => toggleFieldSelection(field.fieldId)}
                  className={`px-3 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    !field.selected ? 'opacity-40 bg-slate-50/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      className="text-purple-600 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFieldSelection(field.fieldId);
                      }}
                    >
                      {field.selected ? (
                        <CheckSquare className="w-4 h-4 text-purple-600 fill-purple-50" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {field.type === 'photo' ? (
                      <div className="w-6 h-6 rounded bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Type className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 truncate">{field.label}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        {field.fieldId} • {Math.round(field.left)}, {Math.round(field.top)} ({Math.round(field.width)}×
                        {Math.round(field.height || field.width)})
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize shrink-0 ${
                      field.type === 'photo'
                        ? 'bg-pink-50 text-pink-700 border border-pink-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {field.type === 'photo' ? 'Photo Slot' : 'Text Zone'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncStatus === 'syncing' && (
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-center gap-3 text-xs text-purple-900">
            <RefreshCw className="w-4 h-4 animate-spin text-purple-600 shrink-0" />
            <div>
              <p className="font-bold">Syncing in progress...</p>
              <p className="text-[11px] text-purple-700">{statusMessage}</p>
            </div>
          </div>
        )}

        {syncStatus === 'success' && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">Successfully Synced to A1Print!</p>
              <p className="text-[11px] text-emerald-700">
                Created {lastSyncedStats?.photoCount} photo slots & {lastSyncedStats?.textCount} text zones at{' '}
                {lastSyncedStats?.syncedAt}. Clean background exported.
              </p>
            </div>
          </div>
        )}

        {syncStatus === 'error' && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Sync Failed</p>
              <p className="text-[11px] text-rose-700">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Primary Action Button */}
        <button
          onClick={handleSyncToA1Print}
          disabled={isSyncing || selectedCount === 0}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:from-purple-800 active:to-indigo-800 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Syncing with A1Print...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Sync {selectedCount} Layers to A1Print</span>
            </>
          )}
        </button>

        {/* Footer info */}
        <p className="text-center text-[10px] text-slate-400 font-medium">
          A1Print Studio • Universal Canva Layer Engine
        </p>
      </main>
    </div>
  );
};
