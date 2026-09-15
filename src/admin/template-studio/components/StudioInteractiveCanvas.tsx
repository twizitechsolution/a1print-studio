import React, { useRef, useEffect, useState, useCallback } from 'react';
import { UniversalFrameTemplate, PhotoSlotConfig, TextZoneConfig } from '../../../types/template';
import { SelectedLayer, ResizeHandle } from '../types';
import { getSlotBoundingBox, getTextZoneBoundingBox, hitTestHandles, clamp } from '../utils/canvasTransformMath';

interface StudioInteractiveCanvasProps {
  template: UniversalFrameTemplate;
  selectedLayer: SelectedLayer | null;
  onSelectLayer: (layer: SelectedLayer | null) => void;
  onUpdateSlot: (updatedSlot: PhotoSlotConfig) => void;
  onUpdateZone: (updatedZone: TextZoneConfig) => void;
  zoom: number;
  previewMode?: 'cutout' | 'sample';
}

// Helper to draw shape clip paths on 2D context
function clipShapePath(ctx: CanvasRenderingContext2D, shape: string, leftX: number, topY: number, slotW: number, slotH: number) {
  const centerX = leftX + slotW / 2;
  const centerY = topY + slotH / 2;
  const shapeLower = (shape || 'rectangle').toLowerCase();

  ctx.beginPath();
  if (shapeLower === 'circle') {
    ctx.arc(centerX, centerY, Math.min(slotW, slotH) / 2, 0, Math.PI * 2);
  } else if (shapeLower === 'rounded') {
    const r = Math.min(slotW, slotH) * 0.14;
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
  } else if (shapeLower === 'polaroid') {
    const border = Math.min(slotW, slotH) * 0.08;
    const bottomBorder = border * 3.2;
    ctx.rect(leftX + border, topY + border, slotW - border * 2, slotH - border - bottomBorder);
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
  previewMode = 'cutout',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Cached images map
  const [cachedImages, setCachedImages] = useState<Record<string, HTMLImageElement>>({});

  // Dynamic canvas dimensions based on base image aspect ratio
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 1200, height: 1600 });

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
    const activeBase = template.cleanBaseImageUrl || template.baseImageUrl;
    const urlsToLoad = [
      activeBase,
      template.baseImageUrl,
      ...template.photoSlots.map((s) => s.defaultPhotoUrl).filter(Boolean) as string[],
    ].filter(Boolean);

    urlsToLoad.forEach((url) => {
      if (!url || cachedImages[url]) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setCachedImages((prev) => ({ ...prev, [url]: img }));
        if ((url === activeBase || url === template.baseImageUrl) && img.naturalWidth && img.naturalHeight) {
          const aspect = img.naturalWidth / img.naturalHeight;
          const targetHeight = 1600;
          const targetWidth = Math.round(targetHeight * aspect);
          setCanvasDimensions({ width: targetWidth, height: targetHeight });
        }
      };
      img.src = url;
    });
  }, [template.cleanBaseImageUrl, template.baseImageUrl, template.photoSlots, cachedImages]);

  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = canvasDimensions;

  // Main Render Loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Background Fill
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Draw Base Poster Artwork
    const activeBaseUrl = template.cleanBaseImageUrl || template.baseImageUrl;
    const baseImg = cachedImages[activeBaseUrl] || cachedImages[template.baseImageUrl];
    if (baseImg) {
      ctx.drawImage(baseImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Sleek placeholder base
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Artwork Poster Preview', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    // 3. Draw Photo Slots
    template.photoSlots.forEach((slot, idx) => {
      const box = getSlotBoundingBox(slot, CANVAS_WIDTH, CANVAS_HEIGHT);
      const isSelected = selectedLayer?.type === 'slot' && selectedLayer.id === slot.id;

      if (previewMode === 'sample') {
        // Sample photo preview mode
        ctx.save();
        clipShapePath(ctx, slot.shape, box.left, box.top, box.width, box.height);
        ctx.clip();

        const sampleImg = slot.defaultPhotoUrl ? cachedImages[slot.defaultPhotoUrl] : null;
        if (sampleImg) {
          ctx.drawImage(sampleImg, box.left, box.top, box.width, box.height);
        } else {
          ctx.fillStyle = 'rgba(248, 43, 169, 0.25)';
          ctx.fillRect(box.left, box.top, box.width, box.height);
        }
        ctx.restore();
      } else {
        // Cutout Guide Mode: Translucent glass tint so base poster artwork remains clearly visible!
        ctx.save();
        clipShapePath(ctx, slot.shape, box.left, box.top, box.width, box.height);
        ctx.fillStyle = isSelected ? 'rgba(248, 43, 169, 0.18)' : 'rgba(6, 182, 212, 0.12)';
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#F82BA9' : '#06B6D4';
        ctx.lineWidth = isSelected ? 3.5 : 2;
        ctx.setLineDash(isSelected ? [8, 6] : [6, 4]);
        ctx.stroke();
        ctx.restore();

        // Centered Aperture Badge
        ctx.save();
        const badgeText = `📷 #${idx + 1} ${slot.label || 'Photo'}`;
        ctx.font = 'bold 18px sans-serif';
        const textMetrics = ctx.measureText(badgeText);
        const badgeW = textMetrics.width + 24;
        const badgeH = 34;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.beginPath();
        ctx.roundRect(box.centerX - badgeW / 2, box.centerY - badgeH / 2, badgeW, badgeH, 17);
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#F82BA9' : 'rgba(6, 182, 212, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
        ctx.stroke();

        ctx.fillStyle = isSelected ? '#FFFFFF' : '#67E8F9';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, box.centerX, box.centerY);
        ctx.restore();
      }
    });

    // 4. Draw Text Zones
    template.textZones.forEach((zone) => {
      const cx = (zone.x / 100) * CANVAS_WIDTH;
      const cy = (zone.y / 100) * CANVAS_HEIGHT;
      const scaledSize = Math.round((zone.fontSize || 22) * 2.4);
      const isSelected = selectedLayer?.type === 'zone' && selectedLayer.id === zone.id;

      ctx.save();
      ctx.fillStyle = zone.color || '#160E4B';
      ctx.font = `bold ${scaledSize}px ${zone.fontFamily || 'serif'}, sans-serif`;
      ctx.textAlign = (zone.align as CanvasTextAlign) || 'center';
      ctx.textBaseline = 'middle';

      const displayText = zone.type === 'calendar' || zone.isCalendar
        ? `🗓️ [${zone.defaultValue || '14 Aug 2024'}]`
        : zone.defaultValue || zone.label;

      ctx.fillText(displayText, cx, cy);

      if (isSelected) {
        const textMetrics = ctx.measureText(displayText);
        const pad = 12;
        const left = zone.align === 'center' ? cx - textMetrics.width / 2 - pad : cx - pad;
        const width = textMetrics.width + pad * 2;
        const height = scaledSize + pad * 1.5;
        const top = cy - height / 2;

        ctx.strokeStyle = '#A855F7';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(left, top, width, height);
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
        ctx.strokeStyle = '#F82BA9';
        ctx.lineWidth = 2.5;
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
        ctx.lineWidth = 2.5;
        const hSize = 14;

        handles.forEach((h) => {
          ctx.fillRect(h.x - hSize / 2, h.y - hSize / 2, hSize, hSize);
          ctx.strokeRect(h.x - hSize / 2, h.y - hSize / 2, hSize, hSize);
        });
      }
    }
  }, [template, selectedLayer, cachedImages, CANVAS_WIDTH, CANVAS_HEIGHT, previewMode]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Coordinate Conversion Helper (Screen to Canvas Space)
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
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

  // Mouse Down Event
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e);

    if (selectedLayer) {
      let box: any = null;
      let activeItem: PhotoSlotConfig | TextZoneConfig | null = null;

      if (selectedLayer.type === 'slot') {
        const slot = template.photoSlots.find((s) => s.id === selectedLayer.id);
        if (slot) {
          box = getSlotBoundingBox(slot, CANVAS_WIDTH, CANVAS_HEIGHT);
          activeItem = slot;
        }
      } else {
        const zone = template.textZones.find((z) => z.id === selectedLayer.id);
        if (zone) {
          box = getTextZoneBoundingBox(zone, CANVAS_WIDTH, CANVAS_HEIGHT);
          activeItem = zone;
        }
      }

      if (box && activeItem && !activeItem.locked) {
        const hitHandle = hitTestHandles(x, y, box, 18);
        if (hitHandle) {
          setActiveDrag({
            handle: hitHandle,
            startX: x,
            startY: y,
            initialLayer: { ...activeItem },
          });
          return;
        }
      }
    }

    // Hit-test photo slots (reverse order for top-most)
    for (let i = template.photoSlots.length - 1; i >= 0; i--) {
      const slot = template.photoSlots[i];
      const box = getSlotBoundingBox(slot, CANVAS_WIDTH, CANVAS_HEIGHT);
      if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
        onSelectLayer({ type: 'slot', id: slot.id });
        if (!slot.locked) {
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

    // Hit-test text zones
    for (let i = template.textZones.length - 1; i >= 0; i--) {
      const zone = template.textZones[i];
      const box = getTextZoneBoundingBox(zone, CANVAS_WIDTH, CANVAS_HEIGHT);
      if (x >= box.left && x <= box.right && y >= box.top && y <= box.bottom) {
        onSelectLayer({ type: 'zone', id: zone.id });
        if (!zone.locked) {
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

    // Deselect if clicked empty background
    onSelectLayer(null);
  };

  // Mouse Move Event
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e);

    if (activeDrag && selectedLayer) {
      const dx = x - activeDrag.startX;
      const dy = y - activeDrag.startY;
      const dxPct = (dx / CANVAS_WIDTH) * 100;
      const dyPct = (dy / CANVAS_HEIGHT) * 100;

      if (selectedLayer.type === 'slot') {
        const initial = activeDrag.initialLayer as PhotoSlotConfig;
        if (activeDrag.handle === 'move') {
          onUpdateSlot({
            ...initial,
            x: clamp(Math.round(initial.x + dxPct), 5, 95),
            y: clamp(Math.round(initial.y + dyPct), 5, 95),
          });
        } else {
          let newW = initial.width;
          let newH = initial.height;
          let newX = initial.x;
          let newY = initial.y;

          if (activeDrag.handle.includes('e')) {
            newW = Math.max(5, initial.width + dxPct);
            newX = initial.x + dxPct / 2;
          }
          if (activeDrag.handle.includes('w')) {
            newW = Math.max(5, initial.width - dxPct);
            newX = initial.x + dxPct / 2;
          }
          if (activeDrag.handle.includes('s')) {
            newH = Math.max(5, initial.height + dyPct);
            newY = initial.y + dyPct / 2;
          }
          if (activeDrag.handle.includes('n')) {
            newH = Math.max(5, initial.height - dyPct);
            newY = initial.y + dyPct / 2;
          }

          onUpdateSlot({
            ...initial,
            x: clamp(Math.round(newX), 5, 95),
            y: clamp(Math.round(newY), 5, 95),
            width: clamp(Math.round(newW), 5, 95),
            height: clamp(Math.round(newH), 5, 95),
          });
        }
      } else {
        const initial = activeDrag.initialLayer as TextZoneConfig;
        if (activeDrag.handle === 'move') {
          onUpdateZone({
            ...initial,
            x: clamp(Math.round(initial.x + dxPct), 5, 95),
            y: clamp(Math.round(initial.y + dyPct), 5, 95),
          });
        } else if (activeDrag.handle === 'e' || activeDrag.handle === 'w') {
          const newMaxW = Math.max(10, initial.maxWidth + Math.abs(dxPct));
          onUpdateZone({
            ...initial,
            maxWidth: clamp(Math.round(newMaxW), 10, 95),
          });
        }
      }
      return;
    }

    // Hover Cursor Management
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
        const handle = hitTestHandles(x, y, box, 18);
        if (handle) {
          switch (handle) {
            case 'nw':
            case 'se':
              setCursor('nwse-resize');
              return;
            case 'ne':
            case 'sw':
              setCursor('nesw-resize');
              return;
            case 'n':
            case 's':
              setCursor('ns-resize');
              return;
            case 'w':
            case 'e':
              setCursor('ew-resize');
              return;
            case 'move':
              setCursor('move');
              return;
          }
        }
      }
    }

    setCursor('default');
  };

  const handleMouseUp = () => {
    setActiveDrag(null);
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-slate-950/70 overflow-auto relative select-none"
    >
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: activeDrag ? 'none' : 'transform 0.15s ease-out',
        }}
        className="shadow-2xl rounded-2xl overflow-hidden border-2 border-slate-800 shrink-0"
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            width: `${CANVAS_WIDTH * 0.46}px`,
            height: `${CANVAS_HEIGHT * 0.46}px`,
            cursor,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="block bg-slate-900 shadow-inner"
        />
      </div>
    </div>
  );
};
