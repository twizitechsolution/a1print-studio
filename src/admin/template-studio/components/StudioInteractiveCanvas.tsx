import React, { useRef, useEffect, useState, useCallback } from 'react';
import { UniversalFrameTemplate, PhotoSlotConfig, TextZoneConfig } from '../../types/template';
import { SelectedLayer, ResizeHandle } from '../types';
import { getSlotBoundingBox, getTextZoneBoundingBox, hitTestHandles, clamp } from '../utils/canvasTransformMath';

interface StudioInteractiveCanvasProps {
  template: UniversalFrameTemplate;
  selectedLayer: SelectedLayer | null;
  onSelectLayer: (layer: SelectedLayer | null) => void;
  onUpdateSlot: (updatedSlot: PhotoSlotConfig) => void;
  onUpdateZone: (updatedZone: TextZoneConfig) => void;
  zoom: number;
}

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1760;

// Helper to draw shape clip paths on 2D context
function clipShapePath(ctx: CanvasRenderingContext2D, shape: string, leftX: number, topY: number, slotW: number, slotH: number) {
  const centerX = leftX + slotW / 2;
  const centerY = topY + slotH / 2;
  const shapeLower = (shape || 'rectangle').toLowerCase();

  ctx.beginPath();
  if (shapeLower === 'circle') {
    ctx.arc(centerX, centerY, Math.min(slotW, slotH) / 2, 0, Math.PI * 2);
  } else if (shapeLower === 'rounded') {
    const r = Math.min(slotW, slotH) * 0.15;
    ctx.roundRect(leftX, topY, slotW, slotH, r);
  } else if (shapeLower === 'oval') {
    ctx.ellipse(centerX, centerY, slotW / 2, slotH / 2, 0, 0, Math.PI * 2);
  } else if (shapeLower === 'heart') {
    const topCurveH = slotH * 0.3;
    ctx.moveTo(centerX, topY + topCurveH);
    ctx.bezierCurveTo(centerX, topY, leftX, topY, leftX, topY + topCurveH);
    ctx.bezierCurveTo(leftX, topY + (slotH + topCurveH) / 2, centerX, topY + (slotH + topCurveH) / 1.5, centerX, topY + slotH);
    ctx.bezierCurveTo(centerX, topY + (slotH + topCurveH) / 1.5, leftX + slotW, topY + (slotH + topCurveH) / 2, leftX + slotW, topY + topCurveH);
    ctx.bezierCurveTo(leftX + slotW, topY, centerX, topY, centerX, topY + topCurveH);
  } else if (shapeLower === 'arch') {
    const r = slotW / 2;
    ctx.moveTo(leftX, topY + slotH);
    ctx.lineTo(leftX, topY + r);
    ctx.arc(centerX, topY + r, r, Math.PI, 0, false);
    ctx.lineTo(leftX + slotW, topY + slotH);
    ctx.closePath();
  } else if (shapeLower === 'star') {
    const outerR = Math.min(slotW, slotH) / 2;
    const innerR = outerR / 2.2;
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / 5;
    ctx.moveTo(centerX, centerY - outerR);
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(centerX + Math.cos(rot) * outerR, centerY + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(centerX + Math.cos(rot) * innerR, centerY + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.closePath();
  } else {
    ctx.rect(leftX, topY, slotW, slotH);
  }
}

export const StudioInteractiveCanvas: React.FC<StudioInteractiveCanvasProps> = ({
  template,
  selectedLayer,
  onSelectLayer,
  onUpdateSlot,
  onUpdateZone,
  zoom,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Cached images map
  const [cachedImages, setCachedImages] = useState<Record<string, HTMLImageElement>>({});

  // Interaction State
  const [activeDrag, setActiveDrag] = useState<{
    handle: ResizeHandle;
    startX: number;
    startY: number;
    initialLayer: PhotoSlotConfig | TextZoneConfig;
  } | null>(null);

  const [cursor, setCursor] = useState<string>('default');

  // Pre-load images into state
  useEffect(() => {
    const urlsToLoad = [
      template.baseImageUrl,
      ...template.photoSlots.map((s) => s.defaultPhotoUrl).filter(Boolean) as string[],
    ];

    urlsToLoad.forEach((url) => {
      if (!url || cachedImages[url]) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setCachedImages((prev) => ({ ...prev, [url]: img }));
      };
      img.src = url;
    });
  }, [template.baseImageUrl, template.photoSlots, cachedImages]);

  // Main Render Loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Background Fill
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Draw Base Poster Artwork
    const baseImg = cachedImages[template.baseImageUrl];
    if (baseImg) {
      ctx.drawImage(baseImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Placeholder base
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Loading Base Artwork Poster...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    // 3. Draw Photo Slots
    template.photoSlots.forEach((slot) => {
      const box = getSlotBoundingBox(slot, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.save();
      clipShapePath(ctx, slot.shape, box.left, box.top, box.width, box.height);
      ctx.clip();

      const sampleImg = slot.defaultPhotoUrl ? cachedImages[slot.defaultPhotoUrl] : null;
      if (sampleImg) {
        ctx.drawImage(sampleImg, box.left, box.top, box.width, box.height);
      } else {
        ctx.fillStyle = '#CBD5E1';
        ctx.fillRect(box.left, box.top, box.width, box.height);
      }
      ctx.restore();

      // Subtle slot border outline
      ctx.save();
      clipShapePath(ctx, slot.shape, box.left, box.top, box.width, box.height);
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    });

    // 4. Draw Text Zones
    template.textZones.forEach((zone) => {
      const cx = (zone.x / 100) * CANVAS_WIDTH;
      const cy = (zone.y / 100) * CANVAS_HEIGHT;
      const scaledSize = Math.round((zone.fontSize || 20) * 2.8);

      ctx.save();
      ctx.fillStyle = zone.color || '#160E4B';
      ctx.font = `bold ${scaledSize}px ${zone.fontFamily || 'serif'}, sans-serif`;
      ctx.textAlign = (zone.align as CanvasTextAlign) || 'center';
      ctx.textBaseline = 'middle';

      if (zone.type === 'calendar' || zone.isCalendar) {
        ctx.fillText(`🗓️ [Calendar: ${zone.defaultValue}]`, cx, cy);
      } else {
        ctx.fillText(zone.defaultValue || zone.label, cx, cy);
      }
      ctx.restore();
    });

    // 5. Draw Active Selection Gizmo & Handles
    if (selectedLayer) {
      let box: any = null;
      if (selectedLayer.type === 'slot') {
        const slot = template.photoSlots.find((s) => s.id === selectedLayer.id);
        if (slot) box = getSlotBoundingBox(slot, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        const zone = template.textZones.find((z) => z.id === selectedLayer.id);
        if (zone) box = getTextZoneBoundingBox(zone, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      if (box) {
        // Selection bounding rectangle
        ctx.save();
        ctx.strokeStyle = '#F82BA9'; // Signature A1print magenta
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(box.left, box.top, box.width, box.height);
        ctx.restore();

        // 8 Resize Handles
        const handles = [
          { x: box.left, y: box.top },
          { x: box.centerX, y: box.top },
          { x: box.right, y: box.top },
          { x: box.left, y: box.centerY },
          { x: box.right, y: box.centerY },
          { x: box.left, y: box.bottom },
          { x: box.centerX, y: box.bottom },
          { x: box.right, y: box.bottom },
        ];

        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#F82BA9';
        ctx.lineWidth = 3;
        const hSize = 14;

        handles.forEach((h) => {
          ctx.fillRect(h.x - hSize / 2, h.y - hSize / 2, hSize, hSize);
          ctx.strokeRect(h.x - hSize / 2, h.y - hSize / 2, hSize, hSize);
        });

        // Layer ID badge
        ctx.fillStyle = '#160E4B';
        ctx.font = 'bold 18px sans-serif';
        const labelText = `📍 ${selectedLayer.id}`;
        const textMetrics = ctx.measureText(labelText);
        ctx.fillRect(box.left, box.top - 32, textMetrics.width + 16, 26);
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText, box.left + 8, box.top - 19);
      }
    }

    // Outer Frame Border Overlay (indicates physical print edge)
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 24;
    ctx.strokeRect(12, 12, CANVAS_WIDTH - 24, CANVAS_HEIGHT - 24);
  }, [template, selectedLayer, cachedImages]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Convert Pointer event to Canvas Coordinates
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    // 1. Check if clicking on an active handle of current selection
    if (selectedLayer) {
      let box: any = null;
      let layerObj: any = null;

      if (selectedLayer.type === 'slot') {
        layerObj = template.photoSlots.find((s) => s.id === selectedLayer.id);
        if (layerObj) box = getSlotBoundingBox(layerObj, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        layerObj = template.textZones.find((z) => z.id === selectedLayer.id);
        if (layerObj) box = getTextZoneBoundingBox(layerObj, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      if (box && layerObj && !layerObj.locked) {
        const handle = hitTestHandles(x, y, box, 24);
        if (handle) {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          setActiveDrag({
            handle,
            startX: x,
            startY: y,
            initialLayer: { ...layerObj },
          });
          return;
        }
      }
    }

    // 2. Hit test photo slots from top to bottom
    for (let i = template.photoSlots.length - 1; i >= 0; i--) {
      const slot = template.photoSlots[i];
      const box = getSlotBoundingBox(slot, CANVAS_WIDTH, CANVAS_HEIGHT);
      if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
        onSelectLayer({ type: 'slot', id: slot.id });
        if (!slot.locked) {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          setActiveDrag({
            handle: 'move',
            startX: x,
            startY: y,
            initialLayer: { ...slot },
          });
        }
        return;
      }
    }

    // 3. Hit test text zones
    for (let i = template.textZones.length - 1; i >= 0; i--) {
      const zone = template.textZones[i];
      const box = getTextZoneBoundingBox(zone, CANVAS_WIDTH, CANVAS_HEIGHT);
      if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
        onSelectLayer({ type: 'zone', id: zone.id });
        if (!zone.locked) {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          setActiveDrag({
            handle: 'move',
            startX: x,
            startY: y,
            initialLayer: { ...zone },
          });
        }
        return;
      }
    }

    // Clicked empty area -> Deselect
    onSelectLayer(null);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    // If actively dragging or resizing
    if (activeDrag) {
      const deltaX = x - activeDrag.startX;
      const deltaY = y - activeDrag.startY;

      const deltaXPercent = (deltaX / CANVAS_WIDTH) * 100;
      const deltaYPercent = (deltaY / CANVAS_HEIGHT) * 100;

      const initial = activeDrag.initialLayer;

      if (activeDrag.handle === 'move') {
        const newX = clamp(initial.x + deltaXPercent, 0, 100);
        const newY = clamp(initial.y + deltaYPercent, 0, 100);

        if ('shape' in initial) {
          onUpdateSlot({ ...initial, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 });
        } else {
          onUpdateZone({ ...initial, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 });
        }
      } else if ('shape' in initial) {
        // Resizing a photo slot
        let newW = initial.width;
        let newH = initial.height;
        let newX = initial.x;
        let newY = initial.y;

        const h = activeDrag.handle;
        if (h === 'br' || h === 'mr') newW = clamp(initial.width + deltaXPercent * 2, 5, 95);
        if (h === 'bl' || h === 'ml') newW = clamp(initial.width - deltaXPercent * 2, 5, 95);
        if (h === 'br' || h === 'bc') newH = clamp(initial.height + deltaYPercent * 2, 5, 95);
        if (h === 'tr' || h === 'tc') newH = clamp(initial.height - deltaYPercent * 2, 5, 95);

        onUpdateSlot({
          ...initial,
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: Math.round(newW * 10) / 10,
          height: Math.round(newH * 10) / 10,
        });
      }
      return;
    }

    // Hover Cursor Detection
    if (selectedLayer) {
      let box: any = null;
      if (selectedLayer.type === 'slot') {
        const slot = template.photoSlots.find((s) => s.id === selectedLayer.id);
        if (slot) box = getSlotBoundingBox(slot, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        const zone = template.textZones.find((z) => z.id === selectedLayer.id);
        if (zone) box = getTextZoneBoundingBox(zone, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      if (box) {
        const handle = hitTestHandles(x, y, box, 24);
        if (handle === 'tl' || handle === 'br') setCursor('nwse-resize');
        else if (handle === 'tr' || handle === 'bl') setCursor('nesw-resize');
        else if (handle === 'tc' || handle === 'bc') setCursor('ns-resize');
        else if (handle === 'ml' || handle === 'mr') setCursor('ew-resize');
        else if (handle === 'move') setCursor('move');
        else setCursor('default');
        return;
      }
    }
    setCursor('default');
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeDrag) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
      setActiveDrag(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center p-6 overflow-hidden select-none bg-slate-950/60 rounded-3xl border border-slate-800 shadow-2xl"
    >
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease-out',
        }}
        className="relative shadow-2xl rounded-xs overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ cursor }}
          className="w-[340px] sm:w-[420px] md:w-[480px] lg:w-[520px] aspect-[3/4.4] block bg-white"
        />
      </div>
    </div>
  );
};
