import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  UniversalFrameTemplate,
  PhotoSlotConfig,
  TextZoneConfig,
  FrameCutoutShape,
  normalizeTemplateLayerDefaults,
} from '../../types/template';
import { SelectedLayer, ResizeHandle } from '../template-studio/types';
import {
  BoundingBox,
  getSlotBoundingBox,
  getTextZoneBoundingBox,
  getHandles,
  hitTestHandles,
  clamp,
} from '../template-studio/utils/canvasTransformMath';
import { renderFrameComposite } from '../../lib/renderFrameComposite';
import { firebaseCloudDb, uploadProductImage, base64ToBlob } from '../../config/firebase';
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
  ChevronDown,
} from 'lucide-react';

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

const AVAILABLE_SHAPES: { shape: FrameCutoutShape; label: string }[] = [
  { shape: 'rectangle', label: 'Rectangle' },
  { shape: 'circle', label: 'Circle' },
  { shape: 'rounded', label: 'Rounded' },
  { shape: 'oval', label: 'Oval' },
  { shape: 'heart', label: 'Heart' },
  { shape: 'arch', label: 'Arch' },
  { shape: 'star', label: 'Star' },
  { shape: 'diamond', label: 'Diamond' },
  { shape: 'hexagon', label: 'Hexagon' },
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
    photoSlots: [
      {
        id: 'slot-1',
        label: 'Baby Photo Slot',
        shape: 'circle',
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

  // Right property panel tab: 'layer' | 'settings'
  const [rightPanelTab, setRightPanelTab] = useState<'layer' | 'settings'>('layer');

  // 3. Canvas Display & Navigation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 4. Drag / Resize / Rotate Interaction State
  const [activeDrag, setActiveDrag] = useState<{
    handle: ResizeHandle;
    startX: number;
    startY: number;
    initialSlot?: PhotoSlotConfig;
    initialZone?: TextZoneConfig;
    centerX: number;
    centerY: number;
  } | null>(null);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isImportingPsd, setIsImportingPsd] = useState<boolean>(false);
  const [isCanvaModalOpen, setIsCanvaModalOpen] = useState<boolean>(false);
  const [isPresetsMenuOpen, setIsPresetsMenuOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

        if (selectedLayer.type === 'slot') {
          const slot = template.photoSlots.find((s) => s.id === selectedLayer.id);
          if (slot) {
            box = getSlotBoundingBox(slot, canvas.width, canvas.height);
            rotation = slot.rotation || 0;
          }
        } else {
          const zone = template.textZones.find((z) => z.id === selectedLayer.id);
          if (zone) {
            box = getTextZoneBoundingBox(zone, canvas.width, canvas.height);
            rotation = zone.rotation || 0;
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

          // Thin dashed cyan stroke — NEVER opaque fill over artwork!
          ctx.strokeStyle = '#06B6D4';
          ctx.lineWidth = 1.8;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(box.left, box.top, box.width, box.height);

          // Connecting line to rotation handle
          ctx.beginPath();
          ctx.setLineDash([]);
          ctx.strokeStyle = '#06B6D4';
          ctx.lineWidth = 1.5;
          ctx.moveTo(cx, box.top);
          ctx.lineTo(cx, box.top - 22);
          ctx.stroke();

          // Rotation circular handle
          ctx.fillStyle = '#06B6D4';
          ctx.beginPath();
          ctx.arc(cx, box.top - 22, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // 8 Bounding box resize handles
          const handles = getHandles(box, 0);
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#06B6D4';
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
    if (e.button === 1 || e.altKey) {
      // Pan with middle click or Alt+Drag
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

      if (selectedLayer.type === 'slot') {
        slot = template.photoSlots.find((s) => s.id === selectedLayer.id);
        if (slot) {
          activeBox = getSlotBoundingBox(slot, canvas.width, canvas.height);
          rot = slot.rotation || 0;
        }
      } else {
        zone = template.textZones.find((z) => z.id === selectedLayer.id);
        if (zone) {
          activeBox = getTextZoneBoundingBox(zone, canvas.width, canvas.height);
          rot = zone.rotation || 0;
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

    // Clicked empty background
    setSelectedLayer(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (!activeDrag) return;
    const { x, y } = getCanvasMousePos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dx = x - activeDrag.startX;
    const dy = y - activeDrag.startY;
    const dxPct = (dx / canvas.width) * 100;
    const dyPct = (dy / canvas.height) * 100;

    if (activeDrag.handle === 'rotate') {
      // Compute angle between center and current mouse pointer
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
    }
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

    const next = {
      ...template,
      photoSlots: [...template.photoSlots, newSlot],
    };
    setTemplate(next);
    setSelectedLayer({ type: 'slot', id: newSlot.id });
    setRightPanelTab('layer');
    pushHistory(next);
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

    const next = {
      ...template,
      textZones: [...template.textZones, newZone],
    };
    setTemplate(next);
    setSelectedLayer({ type: 'zone', id: newZone.id });
    setRightPanelTab('layer');
    pushHistory(next);
  };

  // 1-Click Auto-Layout Presets (Baby Birth Frame, Couple Anniversary, etc.)
  const handleApplyLayoutPreset = (presetType: 'baby-birth' | 'couple-anniversary' | 'single-hero') => {
    let generatedSlots: PhotoSlotConfig[] = [];
    let generatedZones: TextZoneConfig[] = [];

    if (presetType === 'baby-birth') {
      // 1. Top Hero Circle Photo Slot
      generatedSlots.push({
        id: `slot-baby-hero-${Date.now().toString(36)}`,
        label: 'Baby Main Photo',
        shape: 'circle',
        x: 50,
        y: 31,
        width: 36,
        height: 27,
        rotation: 0,
        zIndex: 1,
        visibleToCustomer: true,
        required: true,
        defaultPhotoUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600',
      });

      // 2. Bottom Circle Photo Slot
      generatedSlots.push({
        id: `slot-baby-sec-${Date.now().toString(36)}`,
        label: 'Baby Second Photo',
        shape: 'circle',
        x: 35,
        y: 84,
        width: 25,
        height: 19,
        rotation: 0,
        zIndex: 2,
        visibleToCustomer: true,
        required: true,
        defaultPhotoUrl: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&q=80&w=600',
      });

      // 3. Baby Full Name
      generatedZones.push({
        id: `zone-baby-name-${Date.now().toString(36)}`,
        label: 'Baby Full Name',
        defaultValue: 'Baby Name',
        x: 50,
        y: 13,
        maxWidth: 75,
        fontSize: 34,
        fontFamily: 'Playfair Display',
        color: '#111827',
        align: 'center',
        type: 'text',
        rotation: 0,
        zIndex: 10,
        visibleToCustomer: true,
        required: true,
        autoShrinkToFit: true,
      });

      // 4. Born In (Date)
      generatedZones.push({
        id: `zone-born-in-${Date.now().toString(36)}`,
        label: 'Born In (Date / Place)',
        defaultValue: '22 Oct 2024',
        x: 38,
        y: 50,
        maxWidth: 28,
        fontSize: 18,
        fontFamily: 'Poppins',
        color: '#1e293b',
        align: 'center',
        type: 'date',
        rotation: 0,
        zIndex: 11,
        visibleToCustomer: true,
        required: false,
        autoShrinkToFit: true,
      });

      // 5. Born At (Time)
      generatedZones.push({
        id: `zone-born-at-${Date.now().toString(36)}`,
        label: 'Born At (Time)',
        defaultValue: '10:45 AM',
        x: 62,
        y: 50,
        maxWidth: 28,
        fontSize: 18,
        fontFamily: 'Poppins',
        color: '#1e293b',
        align: 'center',
        type: 'time',
        rotation: 0,
        zIndex: 12,
        visibleToCustomer: true,
        required: false,
        autoShrinkToFit: true,
      });

      // 6. Birth Weight
      generatedZones.push({
        id: `zone-weight-${Date.now().toString(36)}`,
        label: 'Birth Weight',
        defaultValue: '3.2 Kg',
        x: 38,
        y: 73,
        maxWidth: 24,
        fontSize: 18,
        fontFamily: 'Poppins',
        color: '#1e293b',
        align: 'center',
        type: 'text',
        rotation: 0,
        zIndex: 13,
        visibleToCustomer: true,
        required: false,
        autoShrinkToFit: true,
      });

      // 7. Hospital
      generatedZones.push({
        id: `zone-hospital-${Date.now().toString(36)}`,
        label: 'Hospital Name',
        defaultValue: 'City Hospital',
        x: 50,
        y: 73,
        maxWidth: 24,
        fontSize: 18,
        fontFamily: 'Poppins',
        color: '#1e293b',
        align: 'center',
        type: 'text',
        rotation: 0,
        zIndex: 14,
        visibleToCustomer: true,
        required: false,
        autoShrinkToFit: true,
      });

      // 8. Blood Group
      generatedZones.push({
        id: `zone-blood-grp-${Date.now().toString(36)}`,
        label: 'Blood Group',
        defaultValue: 'O+',
        x: 62,
        y: 73,
        maxWidth: 24,
        fontSize: 18,
        fontFamily: 'Poppins',
        color: '#1e293b',
        align: 'center',
        type: 'text',
        rotation: 0,
        zIndex: 15,
        visibleToCustomer: true,
        required: false,
        autoShrinkToFit: true,
      });

      // 9. Dad & Mom
      generatedZones.push({
        id: `zone-parents-${Date.now().toString(36)}`,
        label: 'Dad & Mom Names',
        defaultValue: 'Parents Names',
        x: 65,
        y: 84,
        maxWidth: 42,
        fontSize: 19,
        fontFamily: 'Poppins',
        color: '#1e293b',
        align: 'center',
        type: 'text',
        rotation: 0,
        zIndex: 16,
        visibleToCustomer: true,
        required: false,
        autoShrinkToFit: true,
      });
    } else if (presetType === 'couple-anniversary') {
      generatedSlots.push({
        id: `slot-couple-1-${Date.now().toString(36)}`,
        label: 'Partner 1 Photo',
        shape: 'heart',
        x: 35,
        y: 42,
        width: 32,
        height: 32,
        rotation: 0,
        zIndex: 1,
        visibleToCustomer: true,
        required: true,
      });
      generatedSlots.push({
        id: `slot-couple-2-${Date.now().toString(36)}`,
        label: 'Partner 2 Photo',
        shape: 'heart',
        x: 65,
        y: 42,
        width: 32,
        height: 32,
        rotation: 0,
        zIndex: 2,
        visibleToCustomer: true,
        required: true,
      });
      generatedZones.push({
        id: `zone-couple-names-${Date.now().toString(36)}`,
        label: 'Couple Names',
        defaultValue: 'Raj & Simran',
        x: 50,
        y: 16,
        maxWidth: 80,
        fontSize: 36,
        fontFamily: 'Great Vibes',
        color: '#111827',
        align: 'center',
        type: 'text',
        zIndex: 10,
        visibleToCustomer: true,
        required: true,
      });
      generatedZones.push({
        id: `zone-anni-date-${Date.now().toString(36)}`,
        label: 'Anniversary Date',
        defaultValue: '14 February 2024',
        x: 50,
        y: 72,
        maxWidth: 60,
        fontSize: 20,
        fontFamily: 'Poppins',
        color: '#475569',
        align: 'center',
        type: 'date',
        zIndex: 11,
        visibleToCustomer: true,
      });
    } else if (presetType === 'single-hero') {
      generatedSlots.push({
        id: `slot-hero-${Date.now().toString(36)}`,
        label: 'Center Photo',
        shape: 'rounded',
        x: 50,
        y: 45,
        width: 60,
        height: 50,
        rotation: 0,
        zIndex: 1,
        visibleToCustomer: true,
        required: true,
      });
      generatedZones.push({
        id: `zone-title-${Date.now().toString(36)}`,
        label: 'Title Text',
        defaultValue: 'Cherished Memories',
        x: 50,
        y: 12,
        maxWidth: 80,
        fontSize: 34,
        fontFamily: 'Playfair Display',
        color: '#111827',
        align: 'center',
        type: 'text',
        zIndex: 10,
        visibleToCustomer: true,
        required: true,
      });
    }

    const next: UniversalFrameTemplate = {
      ...template,
      photoSlots: generatedSlots,
      textZones: generatedZones,
    };

    setTemplate(next);
    if (generatedSlots.length > 0) {
      setSelectedLayer({ type: 'slot', id: generatedSlots[0].id });
    } else if (generatedZones.length > 0) {
      setSelectedLayer({ type: 'zone', id: generatedZones[0].id });
    }
    setRightPanelTab('layer');
    pushHistory(next);
    setStatusMessage({
      text: `✨ Applied ${
        presetType === 'baby-birth' ? 'Baby Birth Frame' : 'Layout'
      } preset! (${generatedSlots.length} Photo Slots, ${generatedZones.length} Text Zones). Drag to nudge or click Save Template.`,
      type: 'success',
    });
    setTimeout(() => setStatusMessage(null), 6000);
  };

  const handleDeleteSelected = () => {
    if (!selectedLayer) return;
    let next = { ...template };
    if (selectedLayer.type === 'slot') {
      next.photoSlots = next.photoSlots.filter((s) => s.id !== selectedLayer.id);
    } else {
      next.textZones = next.textZones.filter((z) => z.id !== selectedLayer.id);
    }
    setTemplate(next);
    setSelectedLayer(null);
    pushHistory(next);
  };

  // Base Artwork Upload
  const handleBaseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage({ text: 'Uploading high-resolution base artwork...', type: 'info' });
    try {
      const uploadedUrl = await uploadCategoryImage(template.category || 'templates', file, `base-${Date.now()}`);
      if (uploadedUrl) {
        const next: UniversalFrameTemplate = {
          ...template,
          baseImageUrl: uploadedUrl,
          cleanBaseImageUrl: uploadedUrl,
        };
        setTemplate(next);
        pushHistory(next);
        setStatusMessage({ text: 'Base artwork updated successfully!', type: 'success' });
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Failed to upload base image.', type: 'error' });
    }
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
        baseImageUrl: samplePreview,
        cleanBaseImageUrl: cleanBase,
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
              onClick={handleAddPhotoSlot}
              className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 text-xs font-bold flex items-center gap-1.5 border border-indigo-500/30 transition-colors"
              title="Add Photo Slot"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Photo Slot</span>
            </button>

            <button
              onClick={handleAddTextZone}
              className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 text-xs font-bold flex items-center gap-1.5 border border-cyan-500/30 transition-colors"
              title="Add Text Zone"
            >
              <Type className="w-3.5 h-3.5" />
              <span>Add Text Zone</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-800 mx-1" />

            {/* 1-Click Auto-Layout Presets */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPresetsMenuOpen(!isPresetsMenuOpen)}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#F82BA9]/20 to-purple-600/20 hover:from-[#F82BA9]/30 hover:to-purple-600/30 text-pink-300 text-xs font-bold flex items-center gap-1.5 border border-pink-500/40 shadow-xs transition-all cursor-pointer"
                title="1-Click Auto-Layout Presets"
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>Auto-Layout Presets</span>
                <ChevronDown className="w-3 h-3 text-pink-400" />
              </button>

              {isPresetsMenuOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-30 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      handleApplyLayoutPreset('baby-birth');
                      setIsPresetsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-start gap-2.5 transition-colors cursor-pointer"
                  >
                    <span className="text-base">🍼</span>
                    <div>
                      <p className="font-bold text-pink-400">Baby Birth Frame</p>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        2 Photo Circles + 7 Details (Name, Born In, Born At, Weight, Hospital, Blood, Parents)
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleApplyLayoutPreset('couple-anniversary');
                      setIsPresetsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-start gap-2.5 transition-colors cursor-pointer"
                  >
                    <span className="text-base">💍</span>
                    <div>
                      <p className="font-bold text-purple-400">Couple & Anniversary</p>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        2 Heart Cutouts + Names + Date + Quote
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleApplyLayoutPreset('single-hero');
                      setIsPresetsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-start gap-2.5 transition-colors cursor-pointer"
                  >
                    <span className="text-base">🖼️</span>
                    <div>
                      <p className="font-bold text-blue-400">Single Hero Frame</p>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        1 Center Photo + Title + Subtitle
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <div className="h-4 w-[1px] bg-slate-800 mx-1" />

            {/* Upload Base Artwork */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleBaseImageUpload}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Upload Base Artwork"
            >
              <Upload className="w-4 h-4" />
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

            {selectedLayer && (
              <>
                <div className="h-4 w-[1px] bg-slate-800 mx-1" />
                <button
                  onClick={handleDeleteSelected}
                  className="p-1.5 hover:bg-rose-950 text-rose-400 hover:text-rose-300 rounded-lg transition-colors"
                  title="Delete Selected Layer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Canvas Bottom Zoom Controls */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-2 py-1 rounded-xl shadow-xl text-xs text-slate-300">
            <button
              onClick={() => setZoom((z) => Math.max(0.25, Number((z - 0.1).toFixed(2))))}
              className="p-1 hover:bg-slate-800 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-12 text-center font-mono font-semibold">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.1).toFixed(2))))}
              className="p-1 hover:bg-slate-800 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1.0);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1 hover:bg-slate-800 rounded ml-1"
              title="Reset View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive Canvas Viewport with Zoom and Pan */}
          <div
            ref={containerRef}
            className="flex-1 w-full h-full overflow-hidden flex items-center justify-center cursor-default bg-slate-950/80"
            onWheel={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.05 : 0.05;
                setZoom((z) => clamp(Number((z + delta).toFixed(2)), 0.25, 3.0));
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
                onMouseLeave={handleMouseUp}
                className="block max-h-[82vh] w-auto cursor-crosshair"
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANE: 30% Contextual Property Panel */}
        <div className="flex-[3] max-w-sm w-full bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto">
          {/* Panel Header with Navigation Tabs */}
          <div className="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
            <div className="p-2.5 flex items-center justify-between border-b border-slate-800/60">
              <div className="grid grid-cols-2 gap-1 w-full bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setRightPanelTab('layer')}
                  className={`py-1.5 px-2 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    rightPanelTab === 'layer'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Layer Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab('settings')}
                  className={`py-1.5 px-2 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    rightPanelTab === 'settings'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Template & Shop</span>
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
            {/* When in Layer Tab but no layer is selected */}
            {rightPanelTab === 'layer' && !selectedSlot && !selectedZone && (
              <div className="p-6 text-center text-slate-400 space-y-3">
                <Sliders className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">No layer selected. Click any photo cutout or text zone on the canvas to edit its properties.</p>
                <button
                  type="button"
                  onClick={() => setRightPanelTab('settings')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold cursor-pointer border border-slate-700"
                >
                  Edit Template & Shop Settings →
                </button>
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

                {/* Shape Picker */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1.5">Cutout Shape Mask</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {AVAILABLE_SHAPES.map((item) => (
                      <button
                        key={item.shape}
                        onClick={() => {
                          const next = {
                            ...template,
                            photoSlots: template.photoSlots.map((s) =>
                              s.id === selectedSlot.id ? { ...s, shape: item.shape } : s
                            ),
                          };
                          setTemplate(next);
                          pushHistory(next);
                        }}
                        className={`px-2 py-1.5 rounded-lg border text-center font-semibold text-[11px] capitalize transition-colors ${
                          selectedSlot.shape === item.shape
                            ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
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

            {/* C. GENERAL TEMPLATE SETTINGS (When tab is 'settings' or nothing is selected) */}
            {(rightPanelTab === 'settings' || (!selectedSlot && !selectedZone)) && (
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
                      >
                        <Upload className="w-3 h-3" />
                        Replace Image
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
          const updated: UniversalFrameTemplate = {
            ...template,
            baseImageUrl: newBaseImageUrl,
            cleanBaseImageUrl: newBaseImageUrl,
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
    </div>
  );
};
