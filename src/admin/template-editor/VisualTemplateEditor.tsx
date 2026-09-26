import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  UniversalFrameTemplate,
  ArtworkLayer,
  PhotoSlotConfig,
  TextZoneConfig,
  normalizeTemplateLayerDefaults,
} from '../../types/template';
import { SelectedLayer, ResizeHandle } from '../template-studio/types';
import {
  BoundingBox,
  getSlotBoundingBox,
  getTextZoneBoundingBox,
  getArtworkBoundingBox,
  getHandles,
  hitTestHandles,
  clamp,
} from '../template-studio/utils/canvasTransformMath';
import { renderFrameComposite } from '../../lib/renderFrameComposite';
import { firebaseCloudDb, uploadProductImage, base64ToBlob, uploadCategoryImage } from '../../config/firebase';
import { Product } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import { parsePSDFileBinary } from '../template-studio/utils/psdParser';
import { CanvaSyncModal } from '../../components/admin/CanvaSyncModal';
import {
  Plus,
  Type,
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Save,
  ArrowLeft,
  Upload,
  FileCode,
  Layers,
  Sparkles,
  Sliders,
  Settings2,
  HelpCircle,
  AlertCircle,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Eraser,
  Shapes,
  Move,
  X,
  Hand,
  Palette,
} from 'lucide-react';
import {
  SHAPES_LIBRARY,
  SHAPE_CATEGORIES,
  ShapeThumbnail,
  getShapeById,
  ShapeDefinition,
} from '../../lib/shapeLibrary';

interface VisualTemplateEditorProps {
  initialTemplate?: UniversalFrameTemplate;
  onExit: () => void;
  onSaveSuccess?: (savedTemplate: UniversalFrameTemplate) => void;
}

const AVAILABLE_FONTS = [
  'Playfair Display',
  'Great Vibes',
  'Dancing Script',
  'Jost',
  'Montserrat',
  'Poppins',
  'Caveat',
  'Pacifico',
  'Cinzel',
];

export const VisualTemplateEditor: React.FC<VisualTemplateEditorProps> = ({
  initialTemplate,
  onExit,
  onSaveSuccess,
}) => {
  const { products, addProduct, updateProduct, categories } = useCartStore();

  // 1. Template State with History Stack
  const defaultBaseTemplate: UniversalFrameTemplate = {
    id: `tmpl-${Date.now().toString(36)}`,
    productId: '',
    title: 'New Custom Frame Template',
    category: 'baby-birth-frame',
    basePrice: 699,
    originalPrice: 999,
    baseImageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80',
    cleanBaseImageUrl: '',
    artworkLayers: [
      {
        id: 'art-1',
        imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80',
        zIndex: 0,
        label: 'Base Artwork',
      },
    ],
    photoSlots: [
      {
        id: 'slot-1',
        label: 'Baby Photo Slot',
        shape: 'rectangle',
        x: 50,
        y: 45,
        width: 48,
        height: 48,
        rotation: 0,
        zIndex: 1,
        visibleToCustomer: true,
        required: true,
        defaultPhotoUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600',
      },
    ],
    textZones: [
      {
        id: 'zone-1',
        label: 'Header Title',
        defaultValue: 'Happy Birthday',
        x: 50,
        y: 12,
        maxWidth: 80,
        fontSize: 44,
        fontFamily: 'Great Vibes',
        color: '#FFFFFF',
        align: 'center',
        type: 'text',
        rotation: 0,
        zIndex: 2,
        visibleToCustomer: true,
        required: false,
        autoShrinkToFit: true,
      },
      {
        id: 'zone-2',
        label: 'Baby Name',
        defaultValue: 'Anahitha',
        x: 50,
        y: 88,
        maxWidth: 75,
        fontSize: 38,
        fontFamily: 'Playfair Display',
        color: '#FFFFFF',
        align: 'center',
        type: 'text',
        rotation: 0,
        zIndex: 2,
        visibleToCustomer: true,
        required: true,
        autoShrinkToFit: true,
      },
    ],
    status: 'draft',
    createdAt: new Date().toISOString(),
  };

  const [template, setTemplate] = useState<UniversalFrameTemplate>(() => {
    return normalizeTemplateLayerDefaults(initialTemplate || defaultBaseTemplate);
  });

  // History for Undo/Redo
  const [history, setHistory] = useState<UniversalFrameTemplate[]>([
    normalizeTemplateLayerDefaults(initialTemplate || defaultBaseTemplate),
  ]);
  const [historyIdx, setHistoryIdx] = useState<number>(0);

  // Sync state if initialTemplate prop changes (e.g. user opens different product from catalog)
  useEffect(() => {
    if (initialTemplate) {
      const normalized = normalizeTemplateLayerDefaults(initialTemplate);
      setTemplate(normalized);
      setHistory([normalized]);
      setHistoryIdx(0);
      if (normalized.photoSlots && normalized.photoSlots.length > 0) {
        setSelectedLayer({ type: 'slot', id: normalized.photoSlots[0].id });
      } else if (normalized.textZones && normalized.textZones.length > 0) {
        setSelectedLayer({ type: 'zone', id: normalized.textZones[0].id });
      } else {
        setSelectedLayer(null);
      }
    }
  }, [initialTemplate]);

  const pushHistory = useCallback((nextTemplate: UniversalFrameTemplate) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIdx + 1);
      return [...sliced, nextTemplate];
    });
    setHistoryIdx((prev) => prev + 1);
  }, [historyIdx]);

  const handleUndo = useCallback(() => {
    if (historyIdx > 0) {
      const target = history[historyIdx - 1];
      setHistoryIdx((prev) => prev - 1);
      setTemplate(target);
    }
  }, [history, historyIdx]);

  const handleRedo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      const target = history[historyIdx + 1];
      setHistoryIdx((prev) => prev + 1);
      setTemplate(target);
    }
  }, [history, historyIdx]);

  // 2. Selection & Layer State
  const [selectedLayer, setSelectedLayer] = useState<SelectedLayer | null>({
    type: 'slot',
    id: template.photoSlots[0]?.id || '',
  });

  // Right property panel tab: 'layer' | 'artwork' | 'settings'
  const [rightPanelTab, setRightPanelTab] = useState<'layer' | 'artwork' | 'settings'>('layer');

  // 3. Canvas Display & Navigation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isHandToolActive, setIsHandToolActive] = useState<boolean>(false);

  // Keyboard shortcut listener for Spacebar Hand Tool (Photoshop style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 4. Drag / Resize / Rotate Interaction State
  const [activeDrag, setActiveDrag] = useState<{
    handle: ResizeHandle;
    startX: number;
    startY: number;
    initialSlot?: PhotoSlotConfig;
    initialZone?: TextZoneConfig;
    initialArtwork?: ArtworkLayer;
    centerX: number;
    centerY: number;
  } | null>(null);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isImportingPsd, setIsImportingPsd] = useState<boolean>(false);
  const [isCanvaModalOpen, setIsCanvaModalOpen] = useState<boolean>(false);
  const [isShapeDrawerOpen, setIsShapeDrawerOpen] = useState<boolean>(false);
  const [shapeDrawerCategory, setShapeDrawerCategory] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const additionalLayerInputRef = useRef<HTMLInputElement | null>(null);
  const psdInputRef = useRef<HTMLInputElement | null>(null);

  // Native dimensions of canvas
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 1600,
  });

  // Render loop using single shared renderer
  const renderSeqRef = useRef<number>(0);
  const drawCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const seq = ++renderSeqRef.current;
    try {
      const composed = await renderFrameComposite(template, {}, {}, canvasDimensions.width);
      if (seq !== renderSeqRef.current) return;

      if (canvas.width !== composed.width || canvas.height !== composed.height) {
        canvas.width = composed.width;
        canvas.height = composed.height;
        setCanvasDimensions({ width: composed.width, height: composed.height });
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(composed, 0, 0);

      // Draw thin non-obstructive selection outline on top of canvas
      if (selectedLayer) {
        let box: BoundingBox | null = null;
        let rotation = 0;

        let strokeColor = '#06B6D4';

        if (selectedLayer.type === 'slot') {
          const slot = template.photoSlots.find((s) => s.id === selectedLayer.id);
          if (slot) {
            box = getSlotBoundingBox(slot, canvas.width, canvas.height);
            rotation = slot.rotation || 0;
          }
        } else if (selectedLayer.type === 'zone') {
          const zone = template.textZones.find((z) => z.id === selectedLayer.id);
          if (zone) {
            box = getTextZoneBoundingBox(zone, canvas.width, canvas.height);
            rotation = zone.rotation || 0;
          }
        } else if (selectedLayer.type === 'artwork') {
          const art = template.artworkLayers?.find((a) => a.id === selectedLayer.id);
          if (art) {
            box = getArtworkBoundingBox(art, canvas.width, canvas.height);
            rotation = art.rotation || 0;
            strokeColor = '#A855F7';
          }
        }

        if (box) {
          ctx.save();
          const cx = box.centerX;
          const cy = box.centerY;

          if (rotation) {
            ctx.translate(cx, cy);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-cx, -cy);
          }

          // Thin dashed stroke — NEVER opaque fill over artwork!
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1.8;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(box.left, box.top, box.width, box.height);

          // If shaped slot, also draw vector shape outline inside bounding box
          if (selectedLayer.type === 'slot') {
            const slot = template.photoSlots.find((s) => s.id === selectedLayer.id);
            if (slot?.shapeId) {
              const shapeDef = getShapeById(slot.shapeId);
              if (shapeDef) {
                ctx.save();
                const shapeDim = Math.min(box.width, box.height);
                const offX = box.left + (box.width - shapeDim) / 2;
                const offY = box.top + (box.height - shapeDim) / 2;
                ctx.translate(offX, offY);
                ctx.scale(shapeDim / 100, shapeDim / 100);
                const sp = new Path2D(shapeDef.svgPath);
                ctx.strokeStyle = '#38BDF8';
                ctx.lineWidth = 2.2 / Math.max(shapeDim / 100, 0.01);
                ctx.setLineDash([5, 3]);
                ctx.stroke(sp);
                ctx.restore();
              }
            }
          }

          // Connecting line to rotation handle
          ctx.beginPath();
          ctx.setLineDash([]);
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1.5;
          ctx.moveTo(cx, box.top);
          ctx.lineTo(cx, box.top - 22);
          ctx.stroke();

          // Rotation circular handle
          ctx.fillStyle = strokeColor;
          ctx.beginPath();
          ctx.arc(cx, box.top - 22, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // 8 Bounding box resize handles
          const handles = getHandles(box, 0);
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1.5;

          for (const [key, pos] of Object.entries(handles)) {
            if (key === 'rotate') continue;
            ctx.fillRect(pos.x - 4.5, pos.y - 4.5, 9, 9);
            ctx.strokeRect(pos.x - 4.5, pos.y - 4.5, 9, 9);
          }

          ctx.restore();
        }
      }
    } catch (err) {
      console.warn('Canvas render notice:', err);
    }
  }, [template, selectedLayer, canvasDimensions.width]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Pointer event coordinate translation
  const getCanvasMousePos = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Mouse down for layer selection, move, resize, rotate
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isHandToolActive || isSpacePressed || e.button === 1 || e.altKey) {
      // Pan with Hand tool, Spacebar, middle click or Alt+Drag
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const { x, y } = getCanvasMousePos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Check if hit active selection handles
    if (selectedLayer) {
      let activeBox: BoundingBox | null = null;
      let rot = 0;
      let slot: PhotoSlotConfig | undefined;
      let zone: TextZoneConfig | undefined;
      let art: ArtworkLayer | undefined;

      if (selectedLayer.type === 'slot') {
        slot = template.photoSlots.find((s) => s.id === selectedLayer.id);
        if (slot) {
          activeBox = getSlotBoundingBox(slot, canvas.width, canvas.height);
          rot = slot.rotation || 0;
        }
      } else if (selectedLayer.type === 'zone') {
        zone = template.textZones.find((z) => z.id === selectedLayer.id);
        if (zone) {
          activeBox = getTextZoneBoundingBox(zone, canvas.width, canvas.height);
          rot = zone.rotation || 0;
        }
      } else if (selectedLayer.type === 'artwork') {
        art = template.artworkLayers?.find((a) => a.id === selectedLayer.id);
        if (art) {
          activeBox = getArtworkBoundingBox(art, canvas.width, canvas.height);
          rot = art.rotation || 0;
        }
      }

      if (activeBox) {
        const hitHandle = hitTestHandles(x, y, activeBox, 14, rot);
        if (hitHandle) {
          setActiveDrag({
            handle: hitHandle,
            startX: x,
            startY: y,
            initialSlot: slot ? { ...slot } : undefined,
            initialZone: zone ? { ...zone } : undefined,
            initialArtwork: art ? { ...art } : undefined,
            centerX: activeBox.centerX,
            centerY: activeBox.centerY,
          });
          return;
        }
      }
    }

    // 2. Select clicked layer under cursor (ordered by zIndex descending)
    const sortedSlots = [...template.photoSlots].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
    const sortedZones = [...template.textZones].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

    // Check text zones first
    for (const z of sortedZones) {
      const box = getTextZoneBoundingBox(z, canvas.width, canvas.height);
      const hit = hitTestHandles(x, y, box, 6, z.rotation || 0);
      if (hit) {
        setSelectedLayer({ type: 'zone', id: z.id });
        setRightPanelTab('layer');
        setActiveDrag({
          handle: 'move',
          startX: x,
          startY: y,
          initialZone: { ...z },
          centerX: box.centerX,
          centerY: box.centerY,
        });
        return;
      }
    }

    // Check photo slots
    for (const s of sortedSlots) {
      const box = getSlotBoundingBox(s, canvas.width, canvas.height);
      const hit = hitTestHandles(x, y, box, 6, s.rotation || 0);
      if (hit) {
        setSelectedLayer({ type: 'slot', id: s.id });
        setRightPanelTab('layer');
        setActiveDrag({
          handle: 'move',
          startX: x,
          startY: y,
          initialSlot: { ...s },
          centerX: box.centerX,
          centerY: box.centerY,
        });
        return;
      }
    }

    // Check overlay artwork layers (ordered by zIndex descending, only overlay layers: idx > 0 or has custom transform)
    const overlayArtworks = (template.artworkLayers || [])
      .filter((a, idx) => idx > 0 || a.scale !== undefined || a.x !== undefined || a.y !== undefined)
      .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

    for (const a of overlayArtworks) {
      const box = getArtworkBoundingBox(a, canvas.width, canvas.height);
      const hit = hitTestHandles(x, y, box, 6, a.rotation || 0);
      if (hit) {
        setSelectedLayer({ type: 'artwork', id: a.id });
        setRightPanelTab('artwork');
        setActiveDrag({
          handle: 'move',
          startX: x,
          startY: y,
          initialArtwork: { ...a },
          centerX: box.centerX,
          centerY: box.centerY,
        });
        return;
      }
    }

    // Clicked empty background
    setSelectedLayer(null);
  };

  // Global window listeners for drag & pan so dragging never stops when mouse leaves canvas
  useEffect(() => {
    if (!activeDrag && !isPanning) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
        return;
      }

      if (!activeDrag || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const dx = x - activeDrag.startX;
      const dy = y - activeDrag.startY;
      const dxPct = (dx / canvas.width) * 100;
      const dyPct = (dy / canvas.height) * 100;

      if (activeDrag.handle === 'rotate') {
        const cx = activeDrag.centerX;
        const cy = activeDrag.centerY;
        const rad = Math.atan2(y - cy, x - cx);
        let deg = Math.round((rad * 180) / Math.PI + 90);
        if (deg < 0) deg += 360;
        deg = deg % 360;

        if (activeDrag.initialSlot) {
          setTemplate((prev) => ({
            ...prev,
            photoSlots: prev.photoSlots.map((s) =>
              s.id === activeDrag.initialSlot!.id ? { ...s, rotation: deg } : s
            ),
          }));
        } else if (activeDrag.initialZone) {
          setTemplate((prev) => ({
            ...prev,
            textZones: prev.textZones.map((z) =>
              z.id === activeDrag.initialZone!.id ? { ...z, rotation: deg } : z
            ),
          }));
        } else if (activeDrag.initialArtwork) {
          setTemplate((prev) => ({
            ...prev,
            artworkLayers: (prev.artworkLayers || []).map((art) =>
              art.id === activeDrag.initialArtwork!.id ? { ...art, rotation: deg } : art
            ),
          }));
        }
        return;
      }

      if (activeDrag.handle === 'move') {
        if (activeDrag.initialSlot) {
          const nextX = clamp(Math.round(activeDrag.initialSlot.x + dxPct), 2, 98);
          const nextY = clamp(Math.round(activeDrag.initialSlot.y + dyPct), 2, 98);
          setTemplate((prev) => ({
            ...prev,
            photoSlots: prev.photoSlots.map((s) =>
              s.id === activeDrag.initialSlot!.id ? { ...s, x: nextX, y: nextY } : s
            ),
          }));
        } else if (activeDrag.initialZone) {
          const nextX = clamp(Math.round(activeDrag.initialZone.x + dxPct), 2, 98);
          const nextY = clamp(Math.round(activeDrag.initialZone.y + dyPct), 2, 98);
          setTemplate((prev) => ({
            ...prev,
            textZones: prev.textZones.map((z) =>
              z.id === activeDrag.initialZone!.id ? { ...z, x: nextX, y: nextY } : z
            ),
          }));
        } else if (activeDrag.initialArtwork) {
          const nextX = clamp(Math.round((activeDrag.initialArtwork.x ?? 50) + dxPct), 0, 100);
          const nextY = clamp(Math.round((activeDrag.initialArtwork.y ?? 50) + dyPct), 0, 100);
          setTemplate((prev) => ({
            ...prev,
            artworkLayers: (prev.artworkLayers || []).map((art) =>
              art.id === activeDrag.initialArtwork!.id ? { ...art, x: nextX, y: nextY } : art
            ),
          }));
        }
        return;
      }

      // Handle Resize
      if (activeDrag.initialSlot) {
        let nextW = activeDrag.initialSlot.width;
        let nextH = activeDrag.initialSlot.height;
        let nextX = activeDrag.initialSlot.x;
        let nextY = activeDrag.initialSlot.y;

        const handle = activeDrag.handle;
        if (handle.includes('r')) nextW = clamp(Math.round(activeDrag.initialSlot.width + dxPct), 5, 95);
        if (handle.includes('l')) {
          nextW = clamp(Math.round(activeDrag.initialSlot.width - dxPct), 5, 95);
          nextX = clamp(Math.round(activeDrag.initialSlot.x + dxPct / 2), 2, 98);
        }
        if (handle.includes('b')) nextH = clamp(Math.round(activeDrag.initialSlot.height + dyPct), 5, 95);
        if (handle.includes('t')) {
          nextH = clamp(Math.round(activeDrag.initialSlot.height - dyPct), 5, 95);
          nextY = clamp(Math.round(activeDrag.initialSlot.y + dyPct / 2), 2, 98);
        }

        setTemplate((prev) => ({
          ...prev,
          photoSlots: prev.photoSlots.map((s) =>
            s.id === activeDrag.initialSlot!.id ? { ...s, x: nextX, y: nextY, width: nextW, height: nextH } : s
          ),
        }));
      } else if (activeDrag.initialZone) {
        let nextMaxW = activeDrag.initialZone.maxWidth || 80;
        if (activeDrag.handle.includes('r') || activeDrag.handle.includes('l')) {
          nextMaxW = clamp(Math.round(nextMaxW + (activeDrag.handle.includes('r') ? dxPct * 2 : -dxPct * 2)), 15, 95);
        }
        setTemplate((prev) => ({
          ...prev,
          textZones: prev.textZones.map((z) =>
            z.id === activeDrag.initialZone!.id ? { ...z, maxWidth: nextMaxW } : z
          ),
        }));
      } else if (activeDrag.initialArtwork) {
        const initialScale = activeDrag.initialArtwork.scale ?? 60;
        const scaleDelta = Math.round(dxPct * 1.5);
        const nextScale = clamp(
          initialScale + (activeDrag.handle.includes('r') || activeDrag.handle.includes('b') ? scaleDelta : -scaleDelta),
          10,
          250
        );
        setTemplate((prev) => ({
          ...prev,
          artworkLayers: (prev.artworkLayers || []).map((art) =>
            art.id === activeDrag.initialArtwork!.id ? { ...art, scale: nextScale } : art
          ),
        }));
      }
    };

    const handleWindowMouseUp = () => {
      if (isPanning) {
        setIsPanning(false);
      }
      if (activeDrag) {
        setActiveDrag(null);
        pushHistory(template);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [activeDrag, isPanning, panStart, template, pushHistory]);

  const handleMouseMove = () => {
    // Delegated to window-level listener
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (activeDrag) {
      setActiveDrag(null);
      pushHistory(template);
    }
  };

  // Helper to get ordered list of photo slots and text zones (for Field Order / Layers Stack)
  const getOrderedElements = useCallback(() => {
    const allItems: Array<{
      id: string;
      type: 'slot' | 'zone';
      label: string;
      slot?: PhotoSlotConfig;
      zone?: TextZoneConfig;
      shapeId?: string;
    }> = [
      ...template.photoSlots.map((s) => ({
        id: s.id,
        type: 'slot' as const,
        label: s.label || 'Photo Slot',
        slot: s,
        shapeId: s.shapeId,
      })),
      ...template.textZones.map((z) => ({
        id: z.id,
        type: 'zone' as const,
        label: z.label || 'Text Zone',
        zone: z,
      })),
    ];

    const order = template.fieldOrder || [];
    return allItems.sort((a, b) => {
      const idxA = order.indexOf(a.id);
      const idxB = order.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }, [template.photoSlots, template.textZones, template.fieldOrder]);

  const handleMoveFieldOrder = (id: string, direction: 'up' | 'down') => {
    const current = getOrderedElements();
    const ids = current.map((el) => el.id);
    const idx = ids.indexOf(id);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= ids.length) return;

    const newIds = [...ids];
    const [removed] = newIds.splice(idx, 1);
    newIds.splice(targetIdx, 0, removed);

    const next: UniversalFrameTemplate = {
      ...template,
      fieldOrder: newIds,
    };
    setTemplate(next);
    pushHistory(next);
  };

  // Add Layer Handlers
  const handleAddPhotoSlot = () => {
    const slotCount = template.photoSlots.length + 1;
    const newSlot: PhotoSlotConfig = {
      id: `slot-${Date.now().toString(36)}-${slotCount}`,
      label: `Photo Slot ${slotCount}`,
      shape: 'circle',
      x: 50,
      y: 50,
      width: 28,
      height: 28,
      rotation: 0,
      zIndex: template.photoSlots.length + template.textZones.length + 1,
      visibleToCustomer: true,
      required: true,
      defaultPhotoUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600',
    };

    const newFieldOrder = template.fieldOrder ? [...template.fieldOrder, newSlot.id] : undefined;
    const next: UniversalFrameTemplate = {
      ...template,
      photoSlots: [...template.photoSlots, newSlot],
      ...(newFieldOrder ? { fieldOrder: newFieldOrder } : {}),
    };
    setTemplate(next);
    setSelectedLayer({ type: 'slot', id: newSlot.id });
    setRightPanelTab('layer');
    pushHistory(next);
  };

  const handleApplyShape = (shape: ShapeDefinition) => {
    if (selectedSlot) {
      const next = {
        ...template,
        photoSlots: template.photoSlots.map((s) =>
          s.id === selectedSlot.id ? { ...s, shapeId: shape.id } : s
        ),
      };
      setTemplate(next);
      pushHistory(next);
      setStatusMessage({
        text: `Applied "${shape.name}" shape to slot "${selectedSlot.label}"`,
        type: 'info',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      const slotCount = template.photoSlots.length + 1;
      const newSlot: PhotoSlotConfig = {
        id: `slot-${Date.now().toString(36)}-${slotCount}`,
        label: `${shape.name} Slot ${slotCount}`,
        shapeId: shape.id,
        x: 50,
        y: 50,
        width: 32,
        height: 32,
        rotation: 0,
        photoScale: 1.0,
        photoOffsetX: 0,
        photoOffsetY: 0,
        zIndex: template.photoSlots.length + template.textZones.length + 1,
        visibleToCustomer: true,
        required: true,
        defaultPhotoUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600',
      };
      const newFieldOrder = template.fieldOrder ? [...template.fieldOrder, newSlot.id] : undefined;
      const next: UniversalFrameTemplate = {
        ...template,
        photoSlots: [...template.photoSlots, newSlot],
        ...(newFieldOrder ? { fieldOrder: newFieldOrder } : {}),
      };
      setTemplate(next);
      setSelectedLayer({ type: 'slot', id: newSlot.id });
      setRightPanelTab('layer');
      pushHistory(next);
      setStatusMessage({
        text: `Created new photo slot with "${shape.name}" shape!`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    }
    setIsShapeDrawerOpen(false);
  };

  const handleRemoveShape = () => {
    if (!selectedSlot) return;
    const next = {
      ...template,
      photoSlots: template.photoSlots.map((s) =>
        s.id === selectedSlot.id ? { ...s, shapeId: undefined } : s
      ),
    };
    setTemplate(next);
    pushHistory(next);
    setStatusMessage({
      text: `Removed shape mask from "${selectedSlot.label}" (Plain Rectangle)`,
      type: 'info',
    });
    setTimeout(() => setStatusMessage(null), 3000);
    setIsShapeDrawerOpen(false);
  };

  const handleAddTextZone = () => {
    const zoneCount = template.textZones.length + 1;
    const newZone: TextZoneConfig = {
      id: `zone-${Date.now().toString(36)}-${zoneCount}`,
      label: `Text Zone ${zoneCount}`,
      defaultValue: 'Custom Text',
      x: 50,
      y: 50,
      maxWidth: 75,
      fontSize: 32,
      fontFamily: 'Playfair Display',
      color: '#FFFFFF',
      align: 'center',
      type: 'text',
      rotation: 0,
      zIndex: template.photoSlots.length + template.textZones.length + 1,
      visibleToCustomer: true,
      required: false,
      autoShrinkToFit: true,
    };

    const newFieldOrder = template.fieldOrder ? [...template.fieldOrder, newZone.id] : undefined;
    const next: UniversalFrameTemplate = {
      ...template,
      textZones: [...template.textZones, newZone],
      ...(newFieldOrder ? { fieldOrder: newFieldOrder } : {}),
    };
    setTemplate(next);
    setSelectedLayer({ type: 'zone', id: newZone.id });
    setRightPanelTab('layer');
    pushHistory(next);
  };

  const handleDeleteSelected = () => {
    if (!selectedLayer) return;
    let next: UniversalFrameTemplate = { ...template };
    if (selectedLayer.type === 'slot') {
      next.photoSlots = next.photoSlots.filter((s) => s.id !== selectedLayer.id);
    } else if (selectedLayer.type === 'zone') {
      next.textZones = next.textZones.filter((z) => z.id !== selectedLayer.id);
    } else if (selectedLayer.type === 'artwork') {
      if ((next.artworkLayers || []).length > 1) {
        next.artworkLayers = (next.artworkLayers || []).filter((a) => a.id !== selectedLayer.id);
      }
    }
    if (next.fieldOrder) {
      next.fieldOrder = next.fieldOrder.filter((id) => id !== selectedLayer.id);
    }
    setTemplate(next);
    setSelectedLayer(null);
    pushHistory(next);
  };

  const handleClearElements = () => {
    if (template.photoSlots.length === 0 && template.textZones.length === 0) return;
    if (window.confirm('Clear all photo slots and text zones? Your artwork layers and canvas size will be preserved.')) {
      const next: UniversalFrameTemplate = {
        ...template,
        photoSlots: [],
        textZones: [],
        fieldOrder: [],
      };
      setTemplate(next);
      setSelectedLayer(null);
      pushHistory(next);
      setStatusMessage({ text: 'All photo slots and text zones cleared.', type: 'info' });
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  // Base Artwork Upload (Replaces Z:0 layer and auto-resizes canvas to natural image aspect ratio)
  const handleBaseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage({ text: 'Uploading high-resolution base artwork...', type: 'info' });
    try {
      // 1. Measure natural dimensions from the image file
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = () => resolve(true);
        img.onerror = () => reject(new Error('Failed to load image file for dimension measurement'));
        img.src = objectUrl;
      });
      const naturalWidth = img.naturalWidth || 1200;
      const naturalHeight = img.naturalHeight || 1600;
      URL.revokeObjectURL(objectUrl);

      // 2. Upload high-res artwork to storage
      const uploadedUrl = await uploadCategoryImage(template.category || 'templates', file, `base-${Date.now()}`);
      if (uploadedUrl) {
        const existingLayers = template.artworkLayers && template.artworkLayers.length > 0
          ? template.artworkLayers
          : [{ id: 'art-1', imageUrl: uploadedUrl, zIndex: 0, label: 'Base Artwork' }];

        const updatedLayers = existingLayers.map((art, idx) =>
          idx === 0 ? { ...art, imageUrl: uploadedUrl, label: 'Base Artwork' } : art
        );

        // 3. Auto-adjust canvas aspect ratio
        const aspect = naturalWidth / naturalHeight;
        const newCanvasWidth = 1200;
        const newCanvasHeight = Math.round(1200 / aspect);
        setCanvasDimensions({ width: newCanvasWidth, height: newCanvasHeight });

        const next: UniversalFrameTemplate = {
          ...template,
          baseImageUrl: uploadedUrl,
          cleanBaseImageUrl: uploadedUrl,
          artworkLayers: updatedLayers,
          documentDimensions: {
            width: naturalWidth,
            height: naturalHeight,
          },
        };
        setTemplate(next);
        pushHistory(next);
        setStatusMessage({ text: `Base artwork replaced (${naturalWidth}x${naturalHeight})! Canvas auto-resized.`, type: 'success' });
        setTimeout(() => setStatusMessage(null), 3500);
      }
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Failed to upload base image.', type: 'error' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add Additional Artwork Layer (Overlay PNG with alpha transparency - defaults to highestZ + 1)
  const handleAddArtworkLayer = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage({ text: 'Uploading transparent artwork overlay PNG...', type: 'info' });
    try {
      const uploadedUrl = await uploadCategoryImage(template.category || 'templates', file, `overlay-${Date.now()}`);
      if (uploadedUrl) {
        const existing = template.artworkLayers && template.artworkLayers.length > 0
          ? template.artworkLayers
          : [{ id: 'art-1', imageUrl: template.cleanBaseImageUrl || template.baseImageUrl, zIndex: 0, label: 'Base Artwork' }];

        // Guarantee Z-index defaults to highest layer + 1 across all artwork, photo slots, and text zones
        const allZIndices = [
          0,
          ...existing.map((l) => l.zIndex ?? 0),
          ...(template.photoSlots || []).map((s) => s.zIndex ?? 1),
          ...(template.textZones || []).map((z) => z.zIndex ?? 1),
        ];
        const highestZ = Math.max(...allZIndices);

        const newLayer: ArtworkLayer = {
          id: `art-${Date.now().toString(36)}`,
          imageUrl: uploadedUrl,
          zIndex: highestZ + 1,
          label: `Overlay Layer ${existing.length + 1}`,
          x: 50,
          y: 50,
          scale: 60,
          width: 50,
          height: 50,
          rotation: 0,
        };

        const next: UniversalFrameTemplate = {
          ...template,
          artworkLayers: [...existing, newLayer],
        };
        setTemplate(next);
        pushHistory(next);
        setSelectedLayer({ type: 'artwork', id: newLayer.id });
        setRightPanelTab('artwork');
        setStatusMessage({ text: `Overlay layer "${newLayer.label}" added (Z: ${newLayer.zIndex})!`, type: 'success' });
        setTimeout(() => setStatusMessage(null), 3500);
      }
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Failed to upload artwork layer.', type: 'error' });
    } finally {
      if (additionalLayerInputRef.current) additionalLayerInputRef.current.value = '';
    }
  };

  const handleUpdateArtworkLayer = (updated: ArtworkLayer) => {
    const next = {
      ...template,
      artworkLayers: (template.artworkLayers || []).map((l) => (l.id === updated.id ? updated : l)),
      baseImageUrl: template.artworkLayers?.[0]?.id === updated.id ? updated.imageUrl : template.baseImageUrl,
    };
    setTemplate(next);
    pushHistory(next);
  };

  const handleDeleteArtworkLayer = (id: string) => {
    if ((template.artworkLayers || []).length <= 1) {
      setStatusMessage({ text: 'Cannot delete the only base artwork layer.', type: 'error' });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    const filtered = (template.artworkLayers || []).filter((l) => l.id !== id);
    const next = {
      ...template,
      artworkLayers: filtered,
      baseImageUrl: filtered[0]?.imageUrl || template.baseImageUrl,
    };
    setTemplate(next);
    pushHistory(next);
    setStatusMessage({ text: 'Artwork layer removed.', type: 'info' });
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleMoveArtworkLayer = (index: number, direction: 'up' | 'down') => {
    const layers = [...(template.artworkLayers || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= layers.length) return;

    const tempZ = layers[index].zIndex;
    layers[index] = { ...layers[index], zIndex: layers[targetIndex].zIndex };
    layers[targetIndex] = { ...layers[targetIndex], zIndex: tempZ };

    const temp = layers[index];
    layers[index] = layers[targetIndex];
    layers[targetIndex] = temp;

    const next = {
      ...template,
      artworkLayers: layers,
      baseImageUrl: layers[0]?.imageUrl || template.baseImageUrl,
    };
    setTemplate(next);
    pushHistory(next);
  };

  // Optional PSD/TIFF Pre-Fill
  const handlePsdPreFill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingPsd(true);
    setStatusMessage({ text: 'Reading PSD/TIFF layers and rough bounding boxes...', type: 'info' });

    try {
      const parsed = await parsePSDFileBinary(file);
      if (parsed) {
        const next: UniversalFrameTemplate = {
          ...template,
          baseImageUrl: parsed.cleanBaseImageUrl || parsed.compositePreviewUrl || template.baseImageUrl,
          cleanBaseImageUrl: parsed.cleanBaseImageUrl || parsed.compositePreviewUrl || template.cleanBaseImageUrl,
          photoSlots: parsed.photoSlots.length > 0 ? parsed.photoSlots : template.photoSlots,
          textZones: parsed.textZones.length > 0 ? parsed.textZones : template.textZones,
          documentDimensions: parsed.documentDimensions,
        };
        setTemplate(next);
        pushHistory(next);
        setStatusMessage({
          text: `Suggested ${parsed.photoSlots.length} photo slot(s) and ${parsed.textZones.length} text zone(s) from ${file.name}. Review on canvas!`,
          type: 'success',
        });
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Failed to parse Photoshop file.', type: 'error' });
    } finally {
      setIsImportingPsd(false);
    }
  };

  // Save to Firestore & Product Store
  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage({ text: 'Saving template to cloud database...', type: 'info' });

    try {
      const isNewTemplate = !template.productId;
      const targetProductId =
        template.productId ||
        (template.id.startsWith('tmpl-') ? template.id.replace('tmpl-', 'prod-') : `prod-${Date.now()}`);

      let cleanBase = template.cleanBaseImageUrl || template.baseImageUrl || '';
      let samplePreview = template.baseImageUrl || cleanBase || '';

      // Upload base64 images to Cloudinary CDN if needed to prevent Firestore size quota limits (<1MB)
      if (cleanBase && cleanBase.startsWith('data:image')) {
        try {
          const blob = base64ToBlob(cleanBase);
          const uploadedUrl = await uploadProductImage(targetProductId, blob, `clean_base-${Date.now()}.jpg`);
          if (uploadedUrl) cleanBase = uploadedUrl;
        } catch (uploadErr) {
          console.warn('Could not upload cleanBase to Cloudinary:', uploadErr);
        }
      }

      if (samplePreview && samplePreview.startsWith('data:image')) {
        try {
          const blob = base64ToBlob(samplePreview);
          const uploadedUrl = await uploadProductImage(targetProductId, blob, `sample_preview-${Date.now()}.jpg`);
          if (uploadedUrl) samplePreview = uploadedUrl;
        } catch (uploadErr) {
          console.warn('Could not upload samplePreview to Cloudinary:', uploadErr);
        }
      }

      // Upload base64 artwork layers to Cloudinary CDN if needed
      const sanitizedArtworkLayers = await Promise.all(
        (template.artworkLayers || []).map(async (art, idx) => {
          let url = art.imageUrl;
          if (url && url.startsWith('data:image')) {
            try {
              const blob = base64ToBlob(url);
              const uploadedUrl = await uploadProductImage(targetProductId, blob, `art_layer_${idx}_${Date.now()}.png`);
              if (uploadedUrl) url = uploadedUrl;
            } catch (uploadErr) {
              console.warn('Could not upload artwork layer to Cloudinary:', uploadErr);
            }
          }
          return { ...art, imageUrl: url };
        })
      );

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

      const templateToSave: UniversalFrameTemplate = {
        ...template,
        productId: targetProductId,
        baseImageUrl: sanitizedArtworkLayers[0]?.imageUrl || samplePreview,
        cleanBaseImageUrl: cleanBase,
        artworkLayers: sanitizedArtworkLayers,
        photoSlots: sanitizedPhotoSlots,
        status: template.status || 'published',
        category: template.category || 'all',
        updatedAt: new Date().toISOString(),
      };

      // 1. Save to universal_templates collection in Firestore
      await firebaseCloudDb.setDocument('universal_templates', templateToSave.id, templateToSave);

      // 2. Also save to frame_templates for complete backwards-compatibility
      await firebaseCloudDb.setDocument('frame_templates', templateToSave.id, templateToSave);

      // 3. Sync or create product in store catalog & products collection
      const existingProd = products.find((p) => p.id === targetProductId);
      const primaryImage = samplePreview || cleanBase || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80';
      const basePrice = Number(templateToSave.basePrice) || 699;
      const originalPrice = Number(templateToSave.originalPrice) || 999;
      const discountPct = originalPrice > basePrice ? Math.round(((originalPrice - basePrice) / originalPrice) * 100) : 30;

      const matchedCategory = categories.find((c) => c.id === templateToSave.category || c.slug === templateToSave.category);
      const categoryLabel = matchedCategory ? matchedCategory.name : (templateToSave.category || 'Custom Frame');

      const fullProduct: Product = {
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
        thumbnail: primaryImage,
        baseImageUrl: primaryImage,
        cleanBaseImageUrl: cleanBase,
        artworkLayers: sanitizedArtworkLayers,
        frameTemplate: templateToSave,
        documentDimensions: templateToSave.documentDimensions,
        images: existingProd?.images && existingProd.images.length > 0 ? existingProd.images : [primaryImage],
        bestseller: existingProd?.bestseller ?? false,
        onSale: existingProd?.onSale ?? true,
        description: existingProd?.description || `Personalize this stunning frame with your favorite photos and custom text. Premium acrylic glass with HD print quality.`,
        features: existingProd?.features || [
          'High Definition Photo Print',
          'Premium Matte/Glossy Acrylic Glass',
          'Durable Synthetic Wooden Frame',
          'Ready to Hang & Tabletop Stand Included',
        ],
        sizes: existingProd?.sizes && existingProd.sizes.length > 0 ? existingProd.sizes : [
          {
            id: 'size-m',
            name: 'Medium (9x12 inch)',
            dimensions: '9x12 inch',
            price: basePrice,
            originalPrice: originalPrice,
            discountPercentage: discountPct,
          },
          {
            id: 'size-l',
            name: 'Large (12x18 inch)',
            dimensions: '12x18 inch',
            price: Math.round(basePrice * 1.4),
            originalPrice: Math.round(originalPrice * 1.4),
            discountPercentage: discountPct,
          },
        ],
        frames: existingProd?.frames && existingProd.frames.length > 0 ? existingProd.frames : [
          { id: 'classic-black', name: 'Classic Black', color: '#111827' },
          { id: 'warm-walnut', name: 'Warm Walnut', color: '#593D28' },
          { id: 'pure-white', name: 'Pure White', color: '#FFFFFF' },
        ],
        photoSlots: templateToSave.photoSlots,
        textZones: templateToSave.textZones,
        linkedFrameTemplateId: templateToSave.id,
        stockQuantity: existingProd?.stockQuantity ?? 50,
        updatedAt: new Date().toISOString(),
      };

      if (existingProd) {
        await updateProduct(targetProductId, fullProduct);
      } else {
        await addProduct(fullProduct);
      }

      setTemplate(templateToSave);
      setHistory([templateToSave]);
      setHistoryIdx(0);
      setStatusMessage({
        text: `Template "${templateToSave.title}" saved & published to Shop catalog!`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 4000);
      onSaveSuccess?.(templateToSave);
    } catch (err: any) {
      console.error('Save error:', err);
      setStatusMessage({ text: err?.message || 'Failed to save template.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Active selected layer data
  const selectedSlot =
    selectedLayer?.type === 'slot' ? template.photoSlots.find((s) => s.id === selectedLayer.id) : null;
  const selectedZone =
    selectedLayer?.type === 'zone' ? template.textZones.find((z) => z.id === selectedLayer.id) : null;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] min-h-[700px] bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      {/* 1. Header Toolbar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Exit Editor"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide truncate max-w-xs">
                {template.title || 'Untitled Template'}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  template.status === 'published'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {template.status || 'draft'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              ID: {template.id} {template.productId ? `• Product: ${template.productId}` : ''}
            </div>
          </div>
        </div>

        {/* Status Message Toast */}
        {statusMessage && (
          <div
            className={`px-3 py-1 text-xs rounded-lg font-medium border flex items-center gap-2 animate-in fade-in duration-200 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                : 'bg-blue-950/80 text-blue-300 border-blue-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={historyIdx <= 0}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIdx >= history.length - 1}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Redo"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="h-5 w-[1px] bg-slate-800 mx-1" />

          {/* Canva Studio Integration Button */}
          <button
            type="button"
            onClick={() => setIsCanvaModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-[#7D2AE8] via-[#00C4CC] to-[#0074E4] hover:opacity-95 text-white shadow-md shadow-purple-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Edit artwork directly in Canva"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Edit in Canva</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-800 mx-1" />

          {/* Dual Pill Status Selector */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setTemplate((prev) => ({ ...prev, status: 'draft' }))}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                template.status !== 'published'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Draft
            </button>
            <button
              type="button"
              onClick={() => setTemplate((prev) => ({ ...prev, status: 'published' }))}
              className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                template.status === 'published'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-white" />
              Published
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/20 flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Template'}</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout: Canvas (70%) + Property Panel (30%) */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANE: 70% Interactive Canvas Workspace */}
        <div className="flex-[7] flex flex-col bg-slate-950 relative border-r border-slate-800">
          {/* Canvas Floating Toolbar */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-xl shadow-2xl">
            <button
              onClick={() => setIsShapeDrawerOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-pink-600/20 hover:bg-pink-600/40 text-pink-300 text-xs font-bold flex items-center gap-1.5 border border-pink-500/30 transition-colors cursor-pointer"
              title="Frames & Shapes Library (Canva-style vector shapes for photo slots)"
            >
              <Shapes className="w-3.5 h-3.5 text-pink-400" />
              <span>Frames & Shapes</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-800 mx-1" />

            {/* Replace Base Artwork */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleBaseImageUpload}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              title="Replace Base Artwork (Replaces Z:0 layer & auto-resizes canvas to image ratio)"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Replace Base Artwork</span>
            </button>

            {/* Add Transparent Artwork Overlay Layer (PNG) */}
            <input
              type="file"
              ref={additionalLayerInputRef}
              onChange={handleAddArtworkLayer}
              accept="image/png,image/webp"
              className="hidden"
            />
            <button
              onClick={() => additionalLayerInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs font-bold flex items-center gap-1.5 border border-purple-500/30 transition-colors cursor-pointer"
              title="Add Transparent Artwork Overlay PNG (Always adds new layer, defaults to highest layer + 1)"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>+ Add Overlay Layer</span>
            </button>

            {/* Optional PSD/TIFF Pre-Fill */}
            <input
              type="file"
              ref={psdInputRef}
              onChange={handlePsdPreFill}
              accept=".psd,.tif,.tiff"
              className="hidden"
            />
            <button
              onClick={() => psdInputRef.current?.click()}
              disabled={isImportingPsd}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Pre-fill from PSD/TIFF"
            >
              <FileCode className="w-4 h-4" />
            </button>

            {/* Start Clean / Clear Elements */}
            {(template.photoSlots.length > 0 || template.textZones.length > 0) && (
              <>
                <div className="h-4 w-[1px] bg-slate-800 mx-1" />
                <button
                  onClick={handleClearElements}
                  className="px-2 py-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Clear all photo slots and text zones to start blank (artwork preserved)"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Clear Elements</span>
                </button>
              </>
            )}

            {selectedLayer && (
              <>
                <div className="h-4 w-[1px] bg-slate-800 mx-1" />
                <button
                  onClick={handleDeleteSelected}
                  className="p-1.5 hover:bg-rose-950 text-rose-400 hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
                  title="Delete Selected Layer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Canvas Bottom Zoom & Pan Controls */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-2 py-1 rounded-xl shadow-xl text-xs text-slate-300">
            <button
              type="button"
              onClick={() => setIsHandToolActive(!isHandToolActive)}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                isHandToolActive || isSpacePressed
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Hand Tool (Pan canvas - or hold Spacebar and drag)"
            >
              <Hand className="w-3.5 h-3.5" />
            </button>
            <div className="h-3.5 w-[1px] bg-slate-800 mx-0.5" />
            <button
              type="button"
              onClick={() => setZoom((z) => clamp(Number((z - 0.2).toFixed(2)), 0.2, 5.0))}
              className="p-1 hover:bg-slate-800 rounded cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-12 text-center font-mono font-semibold">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => clamp(Number((z + 0.2).toFixed(2)), 0.2, 5.0))}
              className="p-1 hover:bg-slate-800 rounded cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1.0);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1 hover:bg-slate-800 rounded ml-1 text-slate-400 hover:text-white cursor-pointer"
              title="Reset View (100% & Center)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive Canvas Viewport with Zoom and Pan */}
          <div
            ref={containerRef}
            className={`flex-1 w-full h-full overflow-hidden flex items-center justify-center bg-slate-950/80 ${
              isHandToolActive || isSpacePressed
                ? isPanning
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : 'cursor-default'
            }`}
            onMouseDown={(e) => {
              if (
                e.target === containerRef.current ||
                isHandToolActive ||
                isSpacePressed ||
                e.button === 1 ||
                e.altKey
              ) {
                setIsPanning(true);
                setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
              }
            }}
            onWheel={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setZoom((z) => clamp(Number((z + delta).toFixed(2)), 0.2, 5.0));
              } else if (e.shiftKey) {
                // Shift + wheel pans horizontally
                setPan((p) => ({ ...p, x: p.x - e.deltaY }));
              } else {
                // Normal wheel pans vertically
                setPan((p) => ({ ...p, y: p.y - e.deltaY }));
              }
            }}
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isPanning || activeDrag ? 'none' : 'transform 0.1s ease-out',
              }}
              className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-slate-900"
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className={`block max-h-[82vh] w-auto ${
                  isHandToolActive || isSpacePressed
                    ? isPanning
                      ? 'cursor-grabbing'
                      : 'cursor-grab'
                    : 'cursor-crosshair'
                }`}
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANE: 30% Contextual Property Panel */}
        <div className="flex-[3] max-w-sm w-full bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto">
          {/* Panel Header with Navigation Tabs */}
          <div className="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
            <div className="p-2.5 flex items-center justify-between border-b border-slate-800/60">
              <div className="grid grid-cols-3 gap-1 w-full bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setRightPanelTab('layer')}
                  className={`py-1.5 px-1 rounded-md font-semibold transition-all flex items-center justify-center gap-1 ${
                    rightPanelTab === 'layer'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Layers ({template.photoSlots.length + template.textZones.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab('artwork')}
                  className={`py-1.5 px-1 rounded-md font-semibold transition-all flex items-center justify-center gap-1 ${
                    rightPanelTab === 'artwork'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Artwork ({template.artworkLayers?.length || 1})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab('settings')}
                  className={`py-1.5 px-1 rounded-md font-semibold transition-all flex items-center justify-center gap-1 ${
                    rightPanelTab === 'settings'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
            {rightPanelTab === 'layer' && selectedLayer && (
              <div className="px-3 py-1.5 flex items-center justify-between text-[11px] bg-slate-950/40 border-b border-slate-800/40">
                <span className="text-slate-400 font-medium truncate max-w-[200px]">
                  {selectedSlot ? `Slot: ${selectedSlot.label}` : `Zone: ${selectedZone?.label}`}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedLayer(null)}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer shrink-0"
                >
                  Deselect
                </button>
              </div>
            )}
          </div>

          <div className="p-4 space-y-6 flex-1 text-xs">
            {/* Layers Stack / Field Order Section (Always available in Layers tab) */}
            {rightPanelTab === 'layer' && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Layers Stack ({getOrderedElements().length})</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Storefront order. Use ▲ / ▼ to rearrange sequence.
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleAddPhotoSlot}
                      className="px-2 py-0.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded text-[10px] font-bold border border-indigo-500/40 cursor-pointer transition-colors"
                      title="Add Photo Slot"
                    >
                      + Photo
                    </button>
                    <button
                      type="button"
                      onClick={handleAddTextZone}
                      className="px-2 py-0.5 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 rounded text-[10px] font-bold border border-cyan-500/40 cursor-pointer transition-colors"
                      title="Add Text Zone"
                    >
                      + Text
                    </button>
                  </div>
                </div>

                {getOrderedElements().length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-[11px]">
                    No photo slots or text zones added yet.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                    {getOrderedElements().map((el, index) => {
                      const isSelected = selectedLayer?.id === el.id;
                      const orderedList = getOrderedElements();
                      return (
                        <div
                          key={el.id}
                          className={`flex items-center justify-between p-2 rounded-lg border transition-all text-xs ${
                            isSelected
                              ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500/50 text-white'
                              : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLayer({ type: el.type, id: el.id });
                              setRightPanelTab('layer');
                            }}
                            className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                          >
                            <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            {el.type === 'slot' ? (
                              <ImageIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            ) : (
                              <Type className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            )}
                            <span className="font-semibold truncate text-[11px]">
                              {el.label}
                            </span>
                            {el.type === 'slot' && el.shapeId && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-950 text-pink-400 border border-pink-900 shrink-0">
                                {getShapeById(el.shapeId)?.name || 'Shape'}
                              </span>
                            )}
                          </button>

                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveFieldOrder(el.id, 'up');
                              }}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white cursor-pointer transition-colors"
                              title="Move Up (Shows earlier on product page)"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === orderedList.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveFieldOrder(el.id, 'down');
                              }}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white cursor-pointer transition-colors"
                              title="Move Down (Shows later on product page)"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* When in Layer Tab but no layer is selected */}
            {rightPanelTab === 'layer' && !selectedSlot && !selectedZone && (
              <div className="p-4 text-center text-slate-400 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-2">
                <p className="text-xs">Click any layer in the stack above or on the canvas to configure its position, size, and styling.</p>
              </div>
            )}

            {/* A. PHOTO SLOT PROPERTIES */}
            {rightPanelTab === 'layer' && selectedSlot && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Slot Label */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Slot Label</label>
                  <input
                    type="text"
                    value={selectedSlot.label}
                    onChange={(e) => {
                      const next = {
                        ...template,
                        photoSlots: template.photoSlots.map((s) =>
                          s.id === selectedSlot.id ? { ...s, label: e.target.value } : s
                        ),
                      };
                      setTemplate(next);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium focus:border-cyan-500 outline-none"
                  />
                </div>

                {/* Sample Photo Preview & Replace */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <label className="block text-slate-400 font-semibold text-[11px]">
                    Sample Photo (Customer will upload their photo to replace this)
                  </label>
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedSlot.defaultPhotoUrl || 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600'}
                      alt="Sample"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-800 bg-slate-900 shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <input
                        type="file"
                        id={`slot-file-${selectedSlot.id}`}
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setStatusMessage({ text: 'Uploading sample photo...', type: 'info' });
                            const url = await uploadCategoryImage(template.category || 'slots', file, `slot-${selectedSlot.id}-${Date.now()}`);
                            if (url) {
                              const next = {
                                ...template,
                                photoSlots: template.photoSlots.map((s) =>
                                  s.id === selectedSlot.id ? { ...s, defaultPhotoUrl: url } : s
                                ),
                              };
                              setTemplate(next);
                              pushHistory(next);
                              setStatusMessage({ text: 'Sample photo updated!', type: 'success' });
                              setTimeout(() => setStatusMessage(null), 2500);
                            }
                          } catch (err: any) {
                            setStatusMessage({ text: err?.message || 'Upload failed', type: 'error' });
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById(`slot-file-${selectedSlot.id}`)?.click()}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3 h-3 text-cyan-400" />
                        <span>Change Sample Photo</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Frame Shape Mask Card */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Shapes className="w-3.5 h-3.5 text-pink-400" />
                      <span>Frame Shape Mask</span>
                    </label>
                    {selectedSlot.shapeId ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-pink-950 text-pink-400 border border-pink-800">
                        {getShapeById(selectedSlot.shapeId)?.name || 'Custom Shape'}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-400">
                        Plain Rectangle
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsShapeDrawerOpen(true)}
                      className="flex-1 py-1.5 px-3 bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Shapes className="w-3.5 h-3.5" />
                      <span>{selectedSlot.shapeId ? 'Change Frame Shape' : 'Choose Frame Shape'}</span>
                    </button>

                    {selectedSlot.shapeId && (
                      <button
                        type="button"
                        onClick={handleRemoveShape}
                        className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                        title="Remove Shape Mask (Revert to Plain Rectangle)"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Photo Framing: Pan & Zoom Controls */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Move className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Photo Framing (Pan & Zoom)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const next = {
                          ...template,
                          photoSlots: template.photoSlots.map((s) =>
                            s.id === selectedSlot.id
                              ? { ...s, photoScale: 1.0, photoOffsetX: 0, photoOffsetY: 0 }
                              : s
                          ),
                        };
                        setTemplate(next);
                        pushHistory(next);
                      }}
                      className="text-[10px] text-slate-400 hover:text-cyan-400 font-semibold transition-colors cursor-pointer"
                      title="Reset Framing to defaults"
                    >
                      Reset
                    </button>
                  </div>

                  {/* Zoom Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>Photo Zoom</span>
                      <span className="font-mono text-cyan-400">
                        {Math.round((selectedSlot.photoScale ?? 1.0) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.05"
                      value={selectedSlot.photoScale ?? 1.0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setTemplate((prev) => ({
                          ...prev,
                          photoSlots: prev.photoSlots.map((s) =>
                            s.id === selectedSlot.id ? { ...s, photoScale: val } : s
                          ),
                        }));
                      }}
                      onMouseUp={() => pushHistory(template)}
                      className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  {/* Pan X Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>Horizontal Pan (X)</span>
                      <span className="font-mono text-indigo-400">
                        {selectedSlot.photoOffsetX ?? 0}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="1"
                      value={selectedSlot.photoOffsetX ?? 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setTemplate((prev) => ({
                          ...prev,
                          photoSlots: prev.photoSlots.map((s) =>
                            s.id === selectedSlot.id ? { ...s, photoOffsetX: val } : s
                          ),
                        }));
                      }}
                      onMouseUp={() => pushHistory(template)}
                      className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  {/* Pan Y Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>Vertical Pan (Y)</span>
                      <span className="font-mono text-indigo-400">
                        {selectedSlot.photoOffsetY ?? 0}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      step="1"
                      value={selectedSlot.photoOffsetY ?? 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setTemplate((prev) => ({
                          ...prev,
                          photoSlots: prev.photoSlots.map((s) =>
                            s.id === selectedSlot.id ? { ...s, photoOffsetY: val } : s
                          ),
                        }));
                      }}
                      onMouseUp={() => pushHistory(template)}
                      className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>

                {/* Frame Border Styling (Slider + Color Picker) */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-rose-400" />
                      <span>Border Styling</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        {(selectedSlot.borderWidth || 0) > 0 ? `${selectedSlot.borderWidth}px` : 'No Border'}
                      </span>
                      {(selectedSlot.borderWidth || 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = {
                              ...template,
                              photoSlots: template.photoSlots.map((s) =>
                                s.id === selectedSlot.id ? { ...s, borderWidth: 0 } : s
                              ),
                            };
                            setTemplate(next);
                            pushHistory(next);
                          }}
                          className="text-[10px] text-slate-500 hover:text-rose-400 font-medium cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Border Width / Thickness Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>Border Thickness</span>
                      <span className="font-mono text-rose-400 font-bold">
                        {selectedSlot.borderWidth || 0}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="1"
                      value={selectedSlot.borderWidth || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setTemplate((prev) => ({
                          ...prev,
                          photoSlots: prev.photoSlots.map((s) =>
                            s.id === selectedSlot.id
                              ? {
                                  ...s,
                                  borderWidth: val,
                                  borderColor: s.borderColor || '#EF4444',
                                }
                              : s
                          ),
                        }));
                      }}
                      onMouseUp={() => pushHistory(template)}
                      className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  {/* Border Color (Shown when borderWidth > 0) */}
                  {(selectedSlot.borderWidth || 0) > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800/60 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-medium">Border Color</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={selectedSlot.borderColor || '#EF4444'}
                            onChange={(e) => {
                              const val = e.target.value;
                              const next = {
                                ...template,
                                photoSlots: template.photoSlots.map((s) =>
                                  s.id === selectedSlot.id ? { ...s, borderColor: val } : s
                                ),
                              };
                              setTemplate(next);
                              pushHistory(next);
                            }}
                            className="w-6 h-6 rounded border border-slate-700 cursor-pointer bg-transparent p-0"
                            title="Choose Custom Color"
                          />
                          <input
                            type="text"
                            value={selectedSlot.borderColor || '#EF4444'}
                            onChange={(e) => {
                              const val = e.target.value;
                              const next = {
                                ...template,
                                photoSlots: template.photoSlots.map((s) =>
                                  s.id === selectedSlot.id ? { ...s, borderColor: val } : s
                                ),
                              };
                              setTemplate(next);
                            }}
                            onBlur={() => pushHistory(template)}
                            className="w-20 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-200 font-mono text-[10px]"
                          />
                        </div>
                      </div>

                      {/* Preset Color Swatches */}
                      <div className="flex items-center gap-2 pt-1">
                        {[
                          { color: '#EF4444', name: 'Red' },
                          { color: '#000000', name: 'Black' },
                          { color: '#FFFFFF', name: 'White' },
                          { color: '#F59E0B', name: 'Gold' },
                          { color: '#3B82F6', name: 'Blue' },
                          { color: '#EC4899', name: 'Pink' },
                          { color: '#10B981', name: 'Green' },
                        ].map((swatch) => (
                          <button
                            key={swatch.color}
                            type="button"
                            onClick={() => {
                              const next = {
                                ...template,
                                photoSlots: template.photoSlots.map((s) =>
                                  s.id === selectedSlot.id ? { ...s, borderColor: swatch.color } : s
                                ),
                              };
                              setTemplate(next);
                              pushHistory(next);
                            }}
                            className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                              (selectedSlot.borderColor || '#EF4444').toLowerCase() === swatch.color.toLowerCase()
                                ? 'ring-2 ring-rose-400 scale-110 border-white shadow-xs'
                                : 'border-slate-700 hover:scale-105'
                            }`}
                            style={{ backgroundColor: swatch.color }}
                            title={swatch.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer Controls */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">Visible to Customer</div>
                      <div className="text-[10px] text-slate-500">Allow customer to upload photo for this slot</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedSlot.visibleToCustomer !== false}
                      onChange={(e) => {
                        const next = {
                          ...template,
                          photoSlots: template.photoSlots.map((s) =>
                            s.id === selectedSlot.id ? { ...s, visibleToCustomer: e.target.checked } : s
                          ),
                        };
                        setTemplate(next);
                        pushHistory(next);
                      }}
                      className="w-4 h-4 rounded text-cyan-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <div>
                      <div className="font-semibold text-slate-200">Required Field</div>
                      <div className="text-[10px] text-slate-500">Must upload photo before adding to cart</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedSlot.required === true}
                      onChange={(e) => {
                        const next = {
                          ...template,
                          photoSlots: template.photoSlots.map((s) =>
                            s.id === selectedSlot.id ? { ...s, required: e.target.checked } : s
                          ),
                        };
                        setTemplate(next);
                        pushHistory(next);
                      }}
                      className="w-4 h-4 rounded text-cyan-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Numeric Coordinates (Two-Way Synced) */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Position & Dimensions (%)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500">Center X (%)</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={selectedSlot.x}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTemplate((prev) => ({
                            ...prev,
                            photoSlots: prev.photoSlots.map((s) =>
                              s.id === selectedSlot.id ? { ...s, x: val } : s
                            ),
                          }));
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Center Y (%)</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={selectedSlot.y}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTemplate((prev) => ({
                            ...prev,
                            photoSlots: prev.photoSlots.map((s) =>
                              s.id === selectedSlot.id ? { ...s, y: val } : s
                            ),
                          }));
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Width (%)</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={selectedSlot.width}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTemplate((prev) => ({
                            ...prev,
                            photoSlots: prev.photoSlots.map((s) =>
                              s.id === selectedSlot.id ? { ...s, width: val } : s
                            ),
                          }));
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Height (%)</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={selectedSlot.height}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTemplate((prev) => ({
                            ...prev,
                            photoSlots: prev.photoSlots.map((s) =>
                              s.id === selectedSlot.id ? { ...s, height: val } : s
                            ),
                          }));
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Rotation & zIndex */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">Rotation (0-360°)</span>
                    <input
                      type="number"
                      min={0}
                      max={360}
                      value={selectedSlot.rotation || 0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTemplate((prev) => ({
                          ...prev,
                          photoSlots: prev.photoSlots.map((s) =>
                            s.id === selectedSlot.id ? { ...s, rotation: val } : s
                          ),
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Layer Stack (zIndex)</span>
                    <input
                      type="number"
                      value={selectedSlot.zIndex || 0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTemplate((prev) => ({
                          ...prev,
                          photoSlots: prev.photoSlots.map((s) =>
                            s.id === selectedSlot.id ? { ...s, zIndex: val } : s
                          ),
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* B. TEXT ZONE PROPERTIES */}
            {rightPanelTab === 'layer' && selectedZone && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Zone Label */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Field Heading / Label</label>
                  <input
                    type="text"
                    value={selectedZone.label}
                    onChange={(e) => {
                      const next = {
                        ...template,
                        textZones: template.textZones.map((z) =>
                          z.id === selectedZone.id ? { ...z, label: e.target.value } : z
                        ),
                      };
                      setTemplate(next);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium focus:border-cyan-500 outline-none"
                  />
                </div>

                {/* Default Text Value */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Default Content</label>
                  <input
                    type="text"
                    value={selectedZone.defaultValue}
                    onChange={(e) => {
                      const next = {
                        ...template,
                        textZones: template.textZones.map((z) =>
                          z.id === selectedZone.id ? { ...z, defaultValue: e.target.value } : z
                        ),
                      };
                      setTemplate(next);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium focus:border-cyan-500 outline-none"
                  />
                </div>

                {/* Field Type Selector */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Input Field Type</label>
                  <select
                    value={selectedZone.type}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      const next = {
                        ...template,
                        textZones: template.textZones.map((z) =>
                          z.id === selectedZone.id
                            ? {
                                ...z,
                                type: val,
                                isCalendar: val === 'calendar',
                                multiline: val === 'message',
                              }
                            : z
                        ),
                      };
                      setTemplate(next);
                      pushHistory(next);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium focus:border-cyan-500 outline-none cursor-pointer"
                  >
                    <option value="text">Single Line Text</option>
                    <option value="date">Date Dropdown Picker</option>
                    <option value="time">Time Dropdown Picker</option>
                    <option value="number">Numeric Metric (Weight/Length)</option>
                    <option value="calendar">Interactive Milestone Calendar Grid</option>
                    <option value="message">Multi-line Quote / Message</option>
                    <option value="select">Dropdown Choice (Select)</option>
                  </select>
                </div>

                {/* Select Options Builder (When type === 'select') */}
                {selectedZone.type === 'select' && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <label className="block text-slate-400 font-semibold text-[11px]">Select Options (Comma-Separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1st, 2nd, 3rd, 4th, 5th"
                      value={(selectedZone.selectOptions || []).join(', ')}
                      onChange={(e) => {
                        const opts = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                        setTemplate((prev) => ({
                          ...prev,
                          textZones: prev.textZones.map((z) =>
                            z.id === selectedZone.id ? { ...z, selectOptions: opts } : z
                          ),
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                    />
                  </div>
                )}

                {/* Typography: Font Family & Font Size */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Font Family</label>
                    <select
                      value={selectedZone.fontFamily}
                      onChange={(e) => {
                        const next = {
                          ...template,
                          textZones: template.textZones.map((z) =>
                            z.id === selectedZone.id ? { ...z, fontFamily: e.target.value } : z
                          ),
                        };
                        setTemplate(next);
                        pushHistory(next);
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium focus:border-cyan-500 outline-none cursor-pointer text-xs"
                    >
                      {AVAILABLE_FONTS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Font Size (px)</label>
                    <input
                      type="number"
                      min={10}
                      max={120}
                      value={selectedZone.fontSize}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTemplate((prev) => ({
                          ...prev,
                          textZones: prev.textZones.map((z) =>
                            z.id === selectedZone.id ? { ...z, fontSize: val } : z
                          ),
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Color & Alignment */}
                <div className="grid grid-cols-2 gap-2 items-center">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedZone.color || '#FFFFFF'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTemplate((prev) => ({
                            ...prev,
                            textZones: prev.textZones.map((z) =>
                              z.id === selectedZone.id ? { ...z, color: val } : z
                            ),
                          }));
                        }}
                        className="w-8 h-8 rounded border border-slate-800 bg-transparent cursor-pointer"
                      />
                      <span className="font-mono text-xs text-slate-300 uppercase">{selectedZone.color}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Alignment</label>
                    <div className="flex rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                      {(['left', 'center', 'right'] as const).map((a) => (
                        <button
                          key={a}
                          onClick={() => {
                            setTemplate((prev) => ({
                              ...prev,
                              textZones: prev.textZones.map((z) =>
                                z.id === selectedZone.id ? { ...z, align: a } : z
                              ),
                            }));
                          }}
                          className={`flex-1 py-1.5 text-[10px] font-semibold uppercase capitalize transition-colors ${
                            selectedZone.align === a
                              ? 'bg-cyan-600 text-white'
                              : 'text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Auto Shrink To Fit Switch */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">Auto-Shrink to Fit</div>
                      <div className="text-[10px] text-slate-500">Dynamically reduces font size if text is long</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedZone.autoShrinkToFit !== false}
                      onChange={(e) => {
                        const next = {
                          ...template,
                          textZones: template.textZones.map((z) =>
                            z.id === selectedZone.id ? { ...z, autoShrinkToFit: e.target.checked } : z
                          ),
                        };
                        setTemplate(next);
                        pushHistory(next);
                      }}
                      className="w-4 h-4 rounded text-cyan-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <div>
                      <div className="font-semibold text-slate-200">Visible to Customer</div>
                      <div className="text-[10px] text-slate-500">Show as an input control on storefront</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedZone.visibleToCustomer !== false}
                      onChange={(e) => {
                        const next = {
                          ...template,
                          textZones: template.textZones.map((z) =>
                            z.id === selectedZone.id ? { ...z, visibleToCustomer: e.target.checked } : z
                          ),
                        };
                        setTemplate(next);
                        pushHistory(next);
                      }}
                      className="w-4 h-4 rounded text-cyan-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Position & Max Width (%) */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">X (%)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={selectedZone.x}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTemplate((prev) => ({
                          ...prev,
                          textZones: prev.textZones.map((z) =>
                            z.id === selectedZone.id ? { ...z, x: val } : z
                          ),
                        }));
                      }}
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Y (%)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={selectedZone.y}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTemplate((prev) => ({
                          ...prev,
                          textZones: prev.textZones.map((z) =>
                            z.id === selectedZone.id ? { ...z, y: val } : z
                          ),
                        }));
                      }}
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Max W (%)</span>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={selectedZone.maxWidth || 80}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTemplate((prev) => ({
                          ...prev,
                          textZones: prev.textZones.map((z) =>
                            z.id === selectedZone.id ? { ...z, maxWidth: val } : z
                          ),
                        }));
                      }}
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Rotation & zIndex */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">Rotation (0-360°)</span>
                    <input
                      type="number"
                      min={0}
                      max={360}
                      value={selectedZone.rotation || 0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTemplate((prev) => ({
                          ...prev,
                          textZones: prev.textZones.map((z) =>
                            z.id === selectedZone.id ? { ...z, rotation: val } : z
                          ),
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Stack (zIndex)</span>
                    <input
                      type="number"
                      value={selectedZone.zIndex || 0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTemplate((prev) => ({
                          ...prev,
                          textZones: prev.textZones.map((z) =>
                            z.id === selectedZone.id ? { ...z, zIndex: val } : z
                          ),
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* B2. ARTWORK LAYERS STACK TAB */}
            {rightPanelTab === 'artwork' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Artwork Layers ({template.artworkLayers?.length || 0})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => additionalLayerInputRef.current?.click()}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                    title="Add Transparent Artwork Overlay PNG (Defaults to highest layer + 1)"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Add Overlay Layer</span>
                  </button>
                </div>

                {/* Educational Callout: Real Alpha Cutout Principle */}
                <div className="bg-purple-950/40 p-3 rounded-xl border border-purple-500/30 text-[11px] text-purple-200/90 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-purple-300">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Alpha Transparency Rule</span>
                  </div>
                  <p className="text-[10px] text-purple-300/80 leading-relaxed">
                    Cutouts in PNGs must have 100% transparent pixels (Layer Mask in Photoshop). Set artwork layer Z-Index higher than photo slots (e.g. Z: 10 vs Z: 1) so the PNG frame sits on top of rectangular photos.
                  </p>
                </div>

                {/* List of artwork layers */}
                <div className="space-y-3">
                  {(template.artworkLayers || []).map((art, idx) => (
                    <div
                      key={art.id}
                      onClick={() => {
                        setSelectedLayer({ type: 'artwork', id: art.id });
                      }}
                      className={`bg-slate-950 p-3 rounded-xl border transition-all cursor-pointer space-y-2.5 relative ${
                        selectedLayer?.type === 'artwork' && selectedLayer?.id === art.id
                          ? 'border-purple-500 shadow-md shadow-purple-500/10 ring-1 ring-purple-500'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Checkerboard thumbnail container to visualize transparent cutouts */}
                        <div
                          className="w-14 h-18 rounded-lg border border-slate-800 shrink-0 overflow-hidden relative"
                          style={{
                            backgroundImage:
                              'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                            backgroundSize: '8px 8px',
                            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                            backgroundColor: '#0f172a',
                          }}
                        >
                          <img
                            src={art.imageUrl}
                            alt={art.label || `Layer ${idx + 1}`}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <input
                            type="text"
                            value={art.label || ''}
                            placeholder={`Layer ${idx + 1}`}
                            onChange={(e) =>
                              handleUpdateArtworkLayer({ ...art, label: e.target.value })
                            }
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-xs font-semibold text-white focus:border-purple-500 outline-none"
                          />

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500 font-mono">Z:</span>
                              <input
                                type="number"
                                value={art.zIndex ?? 0}
                                onChange={(e) =>
                                  handleUpdateArtworkLayer({ ...art, zIndex: Number(e.target.value) })
                                }
                                className="w-14 px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-purple-300 text-center"
                              />
                            </div>

                            <span className="text-[10px] text-slate-500">
                              {(art.zIndex ?? 0) <= 0
                                ? 'Background'
                                : (art.zIndex ?? 0) >= 10
                                ? 'Overlay (Top)'
                                : 'Mid-layer'}
                            </span>
                          </div>

                          {idx === 0 && (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer pt-0.5"
                              title="Replace Base Artwork and auto-resize canvas to image ratio"
                            >
                              <Upload className="w-2.5 h-2.5" />
                              <span>Replace Base Artwork</span>
                            </button>
                          )}
                        </div>

                        {/* Layer Actions (Move Up / Down / Delete) */}
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveArtworkLayer(idx, 'up')}
                            className="p-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300 transition-colors cursor-pointer"
                            title="Move Down in Stack"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === (template.artworkLayers || []).length - 1}
                            onClick={() => handleMoveArtworkLayer(idx, 'down')}
                            className="p-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300 transition-colors cursor-pointer"
                            title="Move Up in Stack"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          {(template.artworkLayers || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteArtworkLayer(art.id)}
                              className="p-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded transition-colors cursor-pointer"
                              title="Delete Layer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Sizing & Positioning Control Line for Overlay Layers */}
                      {idx > 0 && (
                        <div
                          className="pt-2 border-t border-slate-900 space-y-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 text-purple-400" />
                              <span>Resize Overlay (Scale):</span>
                            </span>
                            <span className="font-mono font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                              {art.scale ?? 60}%
                            </span>
                          </div>

                          {/* Control line slider */}
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={10}
                              max={200}
                              step={1}
                              value={art.scale ?? 60}
                              onChange={(e) => {
                                const nextScale = Number(e.target.value);
                                handleUpdateArtworkLayer({
                                  ...art,
                                  scale: nextScale,
                                  x: art.x ?? 50,
                                  y: art.y ?? 50,
                                  width: art.width ?? 50,
                                  height: art.height ?? 50,
                                });
                              }}
                              className="w-full accent-purple-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
                              title="Drag this line to increase or decrease overlay size"
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                const curr = art.scale ?? 60;
                                handleUpdateArtworkLayer({ ...art, scale: Math.max(10, curr - 10) });
                              }}
                              className="hover:text-purple-300 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 transition-colors"
                              title="Decrease size by 10%"
                            >
                              -10%
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleUpdateArtworkLayer({ ...art, x: 50, y: 50, scale: 60, rotation: 0 });
                              }}
                              className="hover:text-purple-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] transition-colors"
                              title="Center image in frame"
                            >
                              Center Frame
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleUpdateArtworkLayer({ ...art, scale: 100 });
                              }}
                              className="hover:text-purple-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] transition-colors"
                              title="Full size 100%"
                            >
                              100%
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const curr = art.scale ?? 60;
                                handleUpdateArtworkLayer({ ...art, scale: Math.min(250, curr + 10) });
                              }}
                              className="hover:text-purple-300 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 transition-colors"
                              title="Increase size by 10%"
                            >
                              +10%
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Edit in Canva quick button */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCanvaModalOpen(true)}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#7D2AE8] via-[#00C4CC] to-[#0074E4] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Edit Base Artwork in Canva</span>
                  </button>
                </div>
              </div>
            )}

            {/* C. GENERAL TEMPLATE SETTINGS (When tab is 'settings') */}
            {rightPanelTab === 'settings' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Template Title</label>
                  <input
                    type="text"
                    value={template.title}
                    onChange={(e) => setTemplate((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium focus:border-cyan-500 outline-none text-xs"
                    placeholder="e.g. Baby Birthday Photo Frame"
                  />
                </div>

                {/* Category Dropdown */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Product Category</label>
                  <select
                    value={template.category || 'all'}
                    onChange={(e) => setTemplate((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium focus:border-cyan-500 outline-none text-xs capitalize cursor-pointer"
                  >
                    <option value="all">All Frames / General</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug || cat.id}>
                        {cat.name} ({cat.slug || cat.id})
                      </option>
                    ))}
                    {!categories.some((c) => c.slug === 'baby-birth-frame' || c.id === 'baby-birth-frame') && (
                      <option value="baby-birth-frame">Baby Birth Frame</option>
                    )}
                    {!categories.some((c) => c.slug === 'anniversary-frame' || c.id === 'anniversary-frame') && (
                      <option value="anniversary-frame">Anniversary Frame</option>
                    )}
                    {!categories.some((c) => c.slug === 'birthday-frame' || c.id === 'birthday-frame') && (
                      <option value="birthday-frame">Birthday Frame</option>
                    )}
                  </select>
                </div>

                {/* Publishing Status */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Publishing Status</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setTemplate((prev) => ({ ...prev, status: 'draft' }))}
                      className={`py-1.5 px-3 rounded-md font-semibold text-xs transition-all ${
                        template.status !== 'published'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Draft (Hidden)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplate((prev) => ({ ...prev, status: 'published' }))}
                      className={`py-1.5 px-3 rounded-md font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                        template.status === 'published'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Published (Active)
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {template.status === 'published'
                      ? '✓ Live in Catalog & Shop for customers to personalize.'
                      : 'Hidden from storefront until you are ready to publish.'}
                  </p>
                </div>

                {/* Base & Original Pricing */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Base Price (₹)</label>
                    <input
                      type="number"
                      value={template.basePrice}
                      onChange={(e) => setTemplate((prev) => ({ ...prev, basePrice: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Original Price (₹)</label>
                    <input
                      type="number"
                      value={template.originalPrice}
                      onChange={(e) =>
                        setTemplate((prev) => ({ ...prev, originalPrice: Number(e.target.value) }))
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Frame Artwork Background Preview & Replace */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="block text-slate-400 font-semibold">Frame Artwork Background</label>
                  <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <img
                      src={template.cleanBaseImageUrl || template.baseImageUrl}
                      alt="Artwork"
                      className="w-14 h-18 object-cover rounded-lg border border-slate-800 bg-slate-900 shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="text-[11px] text-slate-300 font-medium truncate">
                        {template.cleanBaseImageUrl ? 'Clean Frame Artwork' : 'Composite Artwork'}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Replace Base Artwork and auto-resize canvas"
                      >
                        <Upload className="w-3 h-3 text-blue-400" />
                        Replace Base Artwork
                      </button>
                    </div>
                  </div>
                </div>

                {/* Layer Hierarchy Overview */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="font-semibold text-slate-300 flex items-center justify-between">
                    <span>Layers Stack ({template.photoSlots.length + template.textZones.length})</span>
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                  </div>

                  <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                    {/* Photo slots list */}
                    {template.photoSlots.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedLayer({ type: 'slot', id: s.id });
                          setRightPanelTab('layer');
                        }}
                        className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="font-medium text-slate-200">{s.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 capitalize">{s.shape}</span>
                      </div>
                    ))}

                    {/* Text zones list */}
                    {template.textZones.map((z) => (
                      <div
                        key={z.id}
                        onClick={() => {
                          setSelectedLayer({ type: 'zone', id: z.id });
                          setRightPanelTab('layer');
                        }}
                        className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Type className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="font-medium text-slate-200 truncate max-w-[130px]">{z.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 capitalize">{z.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Canva Sync Modal */}
      <CanvaSyncModal
        isOpen={isCanvaModalOpen}
        onClose={() => setIsCanvaModalOpen(false)}
        templateId={template.id}
        templateTitle={template.title}
        currentBaseImageUrl={template.baseImageUrl}
        canvaDesignId={template.canvaDesignId}
        canvaLastSyncedAt={template.canvaLastSyncedAt}
        onSyncSuccess={(newBaseImageUrl, canvaLastSyncedAt, newPhotoSlots, newTextZones) => {
          const currentLayers = template.artworkLayers && template.artworkLayers.length > 0
            ? template.artworkLayers
            : [{ id: 'art-1', imageUrl: newBaseImageUrl, zIndex: 0, label: 'Base Artwork' }];

          const updatedLayers = currentLayers.map((l, i) =>
            i === 0 ? { ...l, imageUrl: newBaseImageUrl } : l
          );

          const updated: UniversalFrameTemplate = {
            ...template,
            baseImageUrl: newBaseImageUrl,
            cleanBaseImageUrl: newBaseImageUrl,
            artworkLayers: updatedLayers,
            photoSlots: newPhotoSlots && newPhotoSlots.length > 0 ? newPhotoSlots : template.photoSlots,
            textZones: newTextZones && newTextZones.length > 0 ? newTextZones : template.textZones,
            canvaLastSyncedAt,
            updatedAt: new Date().toISOString(),
          };
          setTemplate(updated);
          pushHistory(updated);
          setStatusMessage({
            text:
              newPhotoSlots || newTextZones
                ? `Artwork & fields successfully synced from Canva! (${updated.photoSlots?.length || 0} photo slots, ${updated.textZones?.length || 0} text zones)`
                : 'Artwork updated from Canva! Please review your slot & zone positions.',
            type: 'success',
          });
          setTimeout(() => setStatusMessage(null), 6000);
        }}
      />

      {/* Canva-Style Frames & Shapes Library Modal */}
      {isShapeDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  <Shapes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <span>Frames & Shapes Library</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 uppercase tracking-wide">
                      Canva Style
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedSlot
                      ? `Select a shape mask to apply to "${selectedSlot.label}"`
                      : 'Choose a shape to insert a new shaped photo slot'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShapeDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="px-5 py-2.5 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setShapeDrawerCategory('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  shapeDrawerCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                All Shapes ({SHAPES_LIBRARY.length})
              </button>
              {SHAPE_CATEGORIES.map((cat) => {
                const count = SHAPES_LIBRARY.filter((s) => s.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setShapeDrawerCategory(cat.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      shapeDrawerCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Shape Grid */}
            <div className="p-5 overflow-y-auto flex-1 max-h-[55vh]">
              {selectedSlot && selectedSlot.shapeId && (
                <div className="mb-4 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-300">
                    Currently applied: <span className="font-bold text-pink-400">{getShapeById(selectedSlot.shapeId)?.name || 'Custom'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveShape}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Remove Shape Mask (Revert to Plain Rectangle)
                  </button>
                </div>
              )}

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {SHAPES_LIBRARY.filter(
                  (s) => shapeDrawerCategory === 'all' || s.category === shapeDrawerCategory
                ).map((shape) => {
                  const isSelected = selectedSlot?.shapeId === shape.id;
                  return (
                    <div
                      key={shape.id}
                      onClick={() => handleApplyShape(shape)}
                      className="cursor-pointer group"
                    >
                      <ShapeThumbnail
                        shape={shape}
                        selected={isSelected}
                        className="w-18 h-18"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
              <span>Vector paths render pin-sharp in both live preview and 300 DPI exports</span>
              <button
                type="button"
                onClick={() => setIsShapeDrawerOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
