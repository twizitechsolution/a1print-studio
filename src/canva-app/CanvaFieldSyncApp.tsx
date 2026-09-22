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
} from 'lucide-react';

interface DetectedField {
  fieldId: string;
  type: 'photo' | 'text';
  left: number;
  top: number;
  width: number;
  height?: number;
  rotation?: number;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  align?: 'center' | 'left' | 'right';
  originalTransparency?: number;
  elementRef?: any;
}

export const CanvaFieldSyncApp: React.FC = () => {
  const [isCanvaEnvironment, setIsCanvaEnvironment] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [designId, setDesignId] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 1600,
  });

  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
  const [duplicateTokens, setDuplicateTokens] = useState<string[]>([]);
  const [lastSyncedStats, setLastSyncedStats] = useState<{
    photoCount: number;
    textCount: number;
    syncedAt: string;
  } | null>(null);

  // Read URL query parameters (e.g. ?templateId=... or ?designId=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tId = params.get('templateId') || params.get('template') || '';
    const dId = params.get('designId') || params.get('design_id') || '';
    if (tId) setTemplateId(tId);
    if (dId) setDesignId(dId);

    // Detect if loaded inside an iframe (like Canva's side panel)
    const inIframe = window.self !== window.top;
    setIsCanvaEnvironment(inIframe);

    // Initialize scan
    scanDesignElements(tId, dId);
  }, []);

  // Helper: check if a color is the reserved pure magenta (#ff00ff)
  const isPureMagenta = (colorStr: string | undefined): boolean => {
    if (!colorStr) return false;
    const clean = colorStr.trim().toLowerCase().replace(/\s+/g, '');
    return (
      clean === '#ff00ff' ||
      clean === '#f0f' ||
      clean === 'rgb(255,0,255)' ||
      clean === 'rgba(255,0,255,1)' ||
      clean === 'magenta'
    );
  };

  // Helper: format field token to clean label
  const toHumanLabel = (token: string): string => {
    if (!token) return 'Field';
    return token
      .replace(/^\{\{|\}\}$/g, '')
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  // Scan design elements (using Canva Design Editing API if available, or simulator)
  const scanDesignElements = useCallback(async (customTId?: string, customDId?: string) => {
    setIsScanning(true);
    setErrorMessage('');
    setSyncStatus('idle');

    try {
      let canvaDesignSdk: any = null;
      try {
        // Attempt dynamic load of Canva Design SDK if inside Canva environment
        canvaDesignSdk = await (Function('return import("@canva/design")')().catch(() => null));
      } catch {
        canvaDesignSdk = null;
      }

      if (canvaDesignSdk && typeof canvaDesignSdk.openDesign === 'function') {
        // -------------------------------------------------------------------
        // Real Canva Environment: Run Design Editing API
        // -------------------------------------------------------------------
        await canvaDesignSdk.openDesign({ type: 'current_page' }, async (session: any) => {
          const page = session?.page;
          const elements = page?.elements || [];
          const dims = page?.dimensions || { width: 1200, height: 1600 };
          setPageDimensions({ width: dims.width, height: dims.height });

          if (canvaDesignSdk.getDesignToken) {
            try {
              const token = await canvaDesignSdk.getDesignToken();
              if (token && !designId) setDesignId('canva-active-design');
            } catch {}
          }

          const scanned: DetectedField[] = [];
          const tokenSet = new Set<string>();
          const duplicates: string[] = [];
          let photoIndex = 1;

          for (const el of elements) {
            // 1. Text elements: Check for {{TOKEN}} pattern
            if (el.type === 'text' && el.text) {
              let textContent = '';
              if (typeof el.text.readPlaintext === 'function') {
                textContent = await el.text.readPlaintext();
              } else if (typeof el.text === 'string') {
                textContent = el.text;
              }

              const match = textContent.match(/\{\{\s*([\w\s-]+?)\s*\}\}/);
              if (match && match[1]) {
                const tokenId = match[1].trim().toUpperCase().replace(/\s+/g, '_');
                if (tokenSet.has(tokenId)) {
                  duplicates.push(tokenId);
                } else {
                  tokenSet.add(tokenId);
                }

                scanned.push({
                  fieldId: tokenId,
                  type: 'text',
                  left: el.left ?? 0,
                  top: el.top ?? 0,
                  width: el.width ?? 200,
                  rotation: el.rotation ?? 0,
                  color: el.color || '#111827',
                  fontSize: el.fontSize || 24,
                  fontFamily: el.fontFamily || 'Inter',
                  align: el.textAlign || 'center',
                  originalTransparency: el.transparency ?? 0,
                  elementRef: el,
                });
              }
            }

            // 2. Rectangle elements: Check for solid magenta fill (#ff00ff)
            if (el.type === 'rect' || el.type === 'shape') {
              const fill = el.fill;
              const fillColor =
                fill?.colorContainer?.ref?.color ||
                fill?.color ||
                fill?.hex ||
                el.fillColor;

              if (isPureMagenta(fillColor)) {
                const slotId = `photo-${photoIndex++}`;
                scanned.push({
                  fieldId: slotId,
                  type: 'photo',
                  left: el.left ?? 0,
                  top: el.top ?? 0,
                  width: el.width ?? 300,
                  height: el.height ?? 300,
                  rotation: el.rotation ?? 0,
                  originalTransparency: el.transparency ?? 0,
                  elementRef: el,
                });
              }
            }
          }

          setDetectedFields(scanned);
          setDuplicateTokens(duplicates);
        });
      } else {
        // -------------------------------------------------------------------
        // Standalone Preview Mode (Outside Canva or during dev testing)
        // -------------------------------------------------------------------
        await new Promise((r) => setTimeout(r, 600));

        // Sample initial fields for testing in the preview UI
        const sampleFields: DetectedField[] = [
          {
            fieldId: 'BABY_NAME',
            type: 'text',
            left: 200,
            top: 250,
            width: 800,
            rotation: 0,
            color: '#1e293b',
            fontSize: 32,
            align: 'center',
            originalTransparency: 0,
          },
          {
            fieldId: 'photo-1',
            type: 'photo',
            left: 150,
            top: 400,
            width: 900,
            height: 700,
            rotation: 0,
            originalTransparency: 0,
          },
          {
            fieldId: 'BIRTH_DATE',
            type: 'text',
            left: 200,
            top: 1180,
            width: 800,
            rotation: 0,
            color: '#475569',
            fontSize: 22,
            align: 'center',
            originalTransparency: 0,
          },
        ];

        setDetectedFields(sampleFields);
        setDuplicateTokens([]);
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(err.message || 'Failed to scan design elements');
    } finally {
      setIsScanning(false);
    }
  }, [designId]);

  // Execute clean export & field sync
  const handleSyncToA1Print = async () => {
    if (detectedFields.length === 0) {
      setErrorMessage('No valid field markers found. Add at least one {{TOKEN}} or magenta rectangle.');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('syncing');
    setErrorMessage('');
    setStatusMessage('Hiding marker elements on canvas...');

    const markerElementsWithOriginals: Array<{ element: any; origTransparency: number }> = [];

    try {
      // Phase 3: Hide markers momentarily by setting transparency = 1
      let canvaDesignSdk: any = null;
      try {
        canvaDesignSdk = await (Function('return import("@canva/design")')().catch(() => null));
      } catch {}

      if (canvaDesignSdk && typeof canvaDesignSdk.openDesign === 'function') {
        await canvaDesignSdk.openDesign({ type: 'current_page' }, async (session: any) => {
          for (const item of detectedFields) {
            if (item.elementRef) {
              const orig = item.originalTransparency ?? 0;
              markerElementsWithOriginals.push({ element: item.elementRef, origTransparency: orig });
              item.elementRef.transparency = 1; // Full transparency (invisible)
            }
          }
          await session.sync();
        });
      }

      setStatusMessage('Exporting clean artwork & syncing fields with A1Print...');

      // Phase 4: Send payload to A1Print backend endpoint
      const payload = {
        canvaDesignId: designId || undefined,
        templateId: templateId || undefined,
        pageWidth: pageDimensions.width,
        pageHeight: pageDimensions.height,
        fields: detectedFields.map((f) => ({
          fieldId: f.fieldId,
          type: f.type,
          left: f.left,
          top: f.top,
          width: f.width,
          height: f.height,
          rotation: f.rotation,
          color: f.color,
          fontSize: f.fontSize,
          fontFamily: f.fontFamily,
          align: f.align,
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
        photoCount: data.photoSlotsCount ?? detectedFields.filter((f) => f.type === 'photo').length,
        textCount: data.textZonesCount ?? detectedFields.filter((f) => f.type === 'text').length,
        syncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      setStatusMessage('Template successfully updated in A1Print!');
    } catch (err: any) {
      console.error('Field sync error:', err);
      setSyncStatus('error');
      setErrorMessage(err.message || 'Failed to sync fields to A1Print');
    } finally {
      // Phase 3 Step 4: Always restore transparency so admin view is unchanged
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
        console.warn('Could not restore marker transparency:', restoreErr);
      }

      setIsSyncing(false);
    }
  };

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
              A1Print Field Sync
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Automatic Template Sync</p>
          </div>
        </div>
        <button
          onClick={() => scanDesignElements()}
          disabled={isScanning || isSyncing}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-50"
          title="Rescan Design Elements"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin text-purple-600' : ''}`} />
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 px-4 py-3 space-y-3.5 max-w-md mx-auto w-full">
        {/* Environment Alert if tested in regular browser */}
        {!isCanvaEnvironment && (
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-semibold">Browser Preview Mode:</span> Running outside Canva.
              Showing simulated markers. Inside Canva, this docks in the editor sidebar!
            </div>
          </div>
        )}

        {/* Template & Design Link Bar */}
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

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-500 font-medium block mb-0.5">Template ID</label>
              <input
                type="text"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                placeholder="tmpl-prod-..."
                className="w-full text-xs font-mono px-2 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-medium block mb-0.5">Canva Design ID</label>
              <input
                type="text"
                value={designId}
                onChange={(e) => setDesignId(e.target.value)}
                placeholder="Auto-detected"
                className="w-full text-xs font-mono px-2 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Convention Guide Accordion */}
        <div className="bg-purple-50/60 rounded-xl p-3 border border-purple-100 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-purple-900 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-purple-700" />
              Canva Marker Conventions
            </span>
            <span className="text-[10px] text-purple-600 font-medium">Automatic</span>
          </div>
          <div className="space-y-1.5 text-[11px] text-purple-950">
            <div className="flex items-center gap-2 bg-white/80 p-2 rounded-lg border border-purple-100">
              <span className="w-3 h-3 rounded-full bg-[#ff00ff] shrink-0 border border-slate-300" />
              <div>
                <span className="font-semibold">Photo Slots:</span> Draw rectangle with fill{' '}
                <code className="font-mono bg-purple-100 px-1 py-0.2 rounded text-[10px]">#ff00ff</code> (pure magenta)
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/80 p-2 rounded-lg border border-purple-100">
              <Type className="w-3 h-3 text-purple-600 shrink-0" />
              <div>
                <span className="font-semibold">Text Fields:</span> Wrap text in braces, e.g.{' '}
                <code className="font-mono bg-purple-100 px-1 py-0.2 rounded text-[10px]">{`{{BABY_NAME}}`}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Duplicate Warning */}
        {duplicateTokens.length > 0 && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <div>
              <span className="font-semibold">Duplicate Field Token:</span> Multiple text elements use{' '}
              {duplicateTokens.map((t) => (
                <code key={t} className="bg-red-100 font-mono px-1 rounded mx-0.5 text-[11px]">
                  {`{{${t}}}`}
                </code>
              ))}
              . Please make each token unique.
            </div>
          </div>
        )}

        {/* Detected Elements Summary */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Detected Elements
            </span>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold">
              <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                {photoFields.length} Photos
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {textFields.length} Texts
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto p-1">
            {detectedFields.length === 0 ? (
              <div className="py-8 text-center px-4 space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-slate-700">No field markers detected yet</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Add text with <code className="font-mono text-purple-600">{`{{NAME}}`}</code> or a rectangle
                  filled with <code className="font-mono text-pink-600">#ff00ff</code>, then click Rescan.
                </p>
              </div>
            ) : (
              detectedFields.map((field) => (
                <div key={field.fieldId} className="px-3 py-2 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-2.5 min-w-0">
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
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {toHumanLabel(field.fieldId)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        {field.fieldId} • {Math.round(field.left)}, {Math.round(field.top)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize shrink-0 ${
                      field.type === 'photo'
                        ? 'bg-pink-50 text-pink-700 border border-pink-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {field.type}
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
                Updated {lastSyncedStats?.photoCount} photo slots & {lastSyncedStats?.textCount} text fields at{' '}
                {lastSyncedStats?.syncedAt}. Clean print artwork exported.
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
          disabled={isSyncing || detectedFields.length === 0}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:from-purple-800 active:to-indigo-800 text-white font-bold text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Syncing with A1Print...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Sync to A1Print ({detectedFields.length} fields)</span>
            </>
          )}
        </button>

        {/* Footer info */}
        <p className="text-center text-[10px] text-slate-400 font-medium">
          A1Print Studio • Canva Design Editing API v1
        </p>
      </main>
    </div>
  );
};
