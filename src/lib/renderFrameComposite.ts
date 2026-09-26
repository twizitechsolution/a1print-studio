import {
  UniversalFrameTemplate,
  ArtworkLayer,
  PhotoSlotConfig,
  TextZoneConfig,
  normalizeTemplateLayerDefaults,
} from '../types/template';
import {
  loadImage,
  drawImageCover,
  drawCalendarGrid,
  resolvePSDWebFontSpec,
  ensureWebFontsReady,
} from '../utils/templateCompositor';
import { getShapeById } from './shapeLibrary';

/**
 * EXACT SINGLE SOURCE OF TRUTH FRAME COMPOSITOR
 * Used everywhere composition happens:
 * 1. Admin Visual Template Editor (StudioInteractiveCanvas & VisualTemplateEditor)
 * 2. Admin "Test Live" Preview
 * 3. Customer-Facing Storefront Live Preview (UniversalFrameCustomizer)
 * 4. High-Res Checkout / Print Exporter (300 DPI)
 *
 * Core Principle:
 * - Customer photos are ALWAYS plain rectangles at render time.
 * - All visual shape, softness, shadow, and overlap come from the designer's artwork PNG(s),
 *   which are interleaved with photo slots & text zones using real alpha transparency.
 *
 * Fixed draw order:
 * 1. Build unified composite list: artworkLayers, photoSlots, and textZones.
 * 2. Sort by zIndex ascending.
 * 3. Walk sorted list and draw:
 *    - Artwork layer: draw PNG at full canvas size preserving real alpha transparency.
 *    - Photo slot: draw photo as plain filled rectangle (drawImageCover) — ZERO shape clipping.
 *    - Text zone: draw text with font/size/color/align/autoShrinkToFit.
 */
export async function renderFrameComposite(
  rawTemplate: UniversalFrameTemplate,
  photoValues: Record<string, string> = {},
  textValues: Record<string, string> = {},
  targetWidth = 1200
): Promise<HTMLCanvasElement> {
  const template = normalizeTemplateLayerDefaults(rawTemplate);

  // 1. Resolve Primary Image Source & Canvas Dimensions
  const primarySrc =
    template.artworkLayers?.[0]?.imageUrl ||
    template.cleanBaseImageUrl ||
    template.baseImageUrl;

  let naturalAspect = 0.8; // default 4:5 frame poster ratio
  if (primarySrc) {
    try {
      const primaryImg = await loadImage(primarySrc);
      if (primaryImg.naturalWidth && primaryImg.naturalHeight) {
        naturalAspect = primaryImg.naturalWidth / primaryImg.naturalHeight;
      }
    } catch (e) {
      console.warn('Could not measure aspect ratio from primary image, checking dimensions:', e);
    }
  }

  if (template.documentDimensions?.width && template.documentDimensions?.height) {
    naturalAspect = template.documentDimensions.width / template.documentDimensions.height;
  }

  const targetHeight = Math.round(targetWidth / naturalAspect);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context');

  // Clear & fill base canvas with solid white
  ctx.clearRect(0, 0, targetWidth, targetHeight);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Ensure fonts are loaded before computing measurements or rendering text
  await ensureWebFontsReady();

  // 2. Merge Artwork Layers, Photo Slots, and Text Zones into one unified layer array
  type CompositeItem =
    | { kind: 'artwork'; data: ArtworkLayer }
    | { kind: 'slot'; data: PhotoSlotConfig }
    | { kind: 'zone'; data: TextZoneConfig };

  const mergedLayers: CompositeItem[] = [
    ...(template.artworkLayers || []).map((art) => ({ kind: 'artwork' as const, data: art })),
    ...(template.photoSlots || []).map((s) => ({ kind: 'slot' as const, data: s })),
    ...(template.textZones || []).map((z) => ({ kind: 'zone' as const, data: z })),
  ];

  // Sort by zIndex ascending.
  // When zIndex is identical, stable ordering: artwork first (0), slots next (1), zones top (2).
  // If paired text zones (e.g. shadow + primary), shadow draws first.
  mergedLayers.sort((a, b) => {
    const zA = a.data.zIndex ?? 0;
    const zB = b.data.zIndex ?? 0;
    if (zA !== zB) return zA - zB;

    if (a.kind === 'zone' && b.kind === 'zone') {
      if (a.data.pairedWithId === b.data.id) return -1;
      if (b.data.pairedWithId === a.data.id) return 1;
    }

    const kindPriority: Record<string, number> = { artwork: 0, slot: 1, zone: 2 };
    return (kindPriority[a.kind] ?? 0) - (kindPriority[b.kind] ?? 0);
  });

  // 3. Draw layers sequentially according to zIndex
  for (const item of mergedLayers) {
    if (item.kind === 'artwork') {
      const art = item.data;
      if (!art.imageUrl) continue;

      try {
        const artImg = await loadImage(art.imageUrl);
        const naturalW = artImg.naturalWidth || targetWidth;
        const naturalH = artImg.naturalHeight || targetHeight;
        const imgAspect = naturalW / naturalH;

        const isFullBleedBase =
          art.x === undefined &&
          art.y === undefined &&
          art.width === undefined &&
          art.height === undefined &&
          art.scale === undefined &&
          !art.rotation;

        if (isFullBleedBase) {
          // Draw full-canvas PNG preserving native alpha transparency
          drawImageCover(ctx, artImg, 0, 0, targetWidth, targetHeight);
        } else {
          // Scaled and positioned overlay layer (e.g. logos, stickers, custom frame overlays)
          const scaleFactor = (art.scale ?? 60) / 100;

          let sw: number;
          let sh: number;

          if (art.width !== undefined && art.height !== undefined) {
            sw = (art.width / 100) * targetWidth * scaleFactor;
            sh = (art.height / 100) * targetHeight * scaleFactor;
          } else if (art.width !== undefined) {
            sw = (art.width / 100) * targetWidth * scaleFactor;
            sh = sw / imgAspect;
          } else if (art.height !== undefined) {
            sh = (art.height / 100) * targetHeight * scaleFactor;
            sw = sh * imgAspect;
          } else {
            // Default: preserve natural aspect ratio relative to canvas width
            sw = targetWidth * 0.5 * scaleFactor;
            sh = sw / imgAspect;
          }

          const cx = ((art.x ?? 50) / 100) * targetWidth;
          const cy = ((art.y ?? 50) / 100) * targetHeight;
          const rotation = art.rotation || 0;

          ctx.save();
          if (art.opacity !== undefined) {
            ctx.globalAlpha = art.opacity;
          }
          if (rotation) {
            ctx.translate(cx, cy);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-cx, -cy);
          }
          ctx.drawImage(artImg, cx - sw / 2, cy - sh / 2, sw, sh);
          ctx.restore();
        }
      } catch (err) {
        console.warn(`Failed to render artwork layer ${art.id}:`, err);
      }
    } else if (item.kind === 'slot') {
      const slot = item.data;
      const photoSrc = photoValues[slot.id] || slot.defaultPhotoUrl;
      if (!photoSrc) continue;

      try {
        const photoImg = await loadImage(photoSrc);
        const cx = (slot.x / 100) * targetWidth;
        const cy = (slot.y / 100) * targetHeight;
        const sw = (slot.width / 100) * targetWidth;
        const sh = (slot.height / 100) * targetHeight;
        const rotation = slot.rotation || 0;

        const shape = getShapeById(slot.shapeId);

        ctx.save();
        if (rotation) {
          ctx.translate(cx, cy);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(-cx, -cy);
        }

        if (shape) {
          // Vector Shape Masking with Uniform Aspect Ratio (always perfect circle, heart, etc.)
          const shapeDim = Math.min(sw, sh);
          const shapeLeft = cx - shapeDim / 2;
          const shapeTop = cy - shapeDim / 2;

          ctx.save();
          ctx.translate(shapeLeft, shapeTop);
          ctx.scale(shapeDim / 100, shapeDim / 100);
          const path = new Path2D(shape.svgPath);
          ctx.clip(path);
          ctx.scale(100 / shapeDim, 100 / shapeDim);

          // Calculate cover dimensions inside the shape bounding square
          const imgW = photoImg.naturalWidth || shapeDim;
          const imgH = photoImg.naturalHeight || shapeDim;
          const coverScale = Math.max(shapeDim / imgW, shapeDim / imgH);
          const zoom = Math.max(0.2, slot.photoScale ?? 1.0);
          const drawW = imgW * coverScale * zoom;
          const drawH = imgH * coverScale * zoom;

          // Apply pan offsets (% of shape size)
          const offsetX = ((slot.photoOffsetX ?? 0) / 100) * shapeDim;
          const offsetY = ((slot.photoOffsetY ?? 0) / 100) * shapeDim;

          // Draw photo centered in shape square + pan offset
          ctx.drawImage(
            photoImg,
            shapeDim / 2 + offsetX - drawW / 2,
            shapeDim / 2 + offsetY - drawH / 2,
            drawW,
            drawH
          );
          ctx.restore();

          // Draw border around the shape contour if configured
          if (slot.borderWidth && slot.borderWidth > 0) {
            ctx.save();
            ctx.translate(shapeLeft, shapeTop);
            ctx.scale(shapeDim / 100, shapeDim / 100);
            const borderPath = new Path2D(shape.svgPath);
            ctx.strokeStyle = slot.borderColor || '#EF4444';
            ctx.lineWidth = (slot.borderWidth * (targetWidth / 1200)) / (shapeDim / 100);
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.stroke(borderPath);
            ctx.restore();
          }
        } else {
          // Plain Rectangle slot: check if custom framing pan/zoom is set
          const hasFraming =
            (slot.photoScale !== undefined && slot.photoScale !== 1) ||
            Boolean(slot.photoOffsetX) ||
            Boolean(slot.photoOffsetY);

          if (hasFraming) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(cx - sw / 2, cy - sh / 2, sw, sh);
            ctx.clip();

            const imgW = photoImg.naturalWidth || sw;
            const imgH = photoImg.naturalHeight || sh;
            const coverScale = Math.max(sw / imgW, sh / imgH);
            const zoom = Math.max(0.2, slot.photoScale ?? 1.0);
            const drawW = imgW * coverScale * zoom;
            const drawH = imgH * coverScale * zoom;
            const offsetX = ((slot.photoOffsetX ?? 0) / 100) * sw;
            const offsetY = ((slot.photoOffsetY ?? 0) / 100) * sh;

            ctx.drawImage(
              photoImg,
              cx + offsetX - drawW / 2,
              cy + offsetY - drawH / 2,
              drawW,
              drawH
            );
            ctx.restore();
          } else {
            // Draw photo as plain filled rectangle
            drawImageCover(ctx, photoImg, cx - sw / 2, cy - sh / 2, sw, sh);
          }

          // Draw border around the rectangle slot if configured
          if (slot.borderWidth && slot.borderWidth > 0) {
            ctx.save();
            ctx.strokeStyle = slot.borderColor || '#EF4444';
            ctx.lineWidth = slot.borderWidth * (targetWidth / 1200);
            ctx.strokeRect(cx - sw / 2, cy - sh / 2, sw, sh);
            ctx.restore();
          }
        }
        ctx.restore();
      } catch (err) {
        console.warn(`Failed to render photo slot ${slot.id}:`, err);
      }
    } else {
      const zone = item.data;
      const isPairedShadow = Boolean(zone.pairedWithId);

      // Support value lookup directly or from paired primary field
      let rawVal = textValues[zone.id];
      if ((!rawVal || rawVal.trim() === '') && isPairedShadow && zone.pairedWithId) {
        rawVal = textValues[zone.pairedWithId];
      }
      const val = (rawVal !== undefined && rawVal.trim() !== '') ? rawVal : (zone.defaultValue || '');
      if (!val || val.trim() === '' || val.startsWith('data:image')) continue;

      const cx = (zone.x / 100) * targetWidth;
      const cy = (zone.y / 100) * targetHeight;
      const margin = Math.max(16, targetWidth * 0.035);
      const zoneMaxW = ((zone.maxWidth || 80) / 100) * targetWidth;
      const align = (zone.align as CanvasTextAlign) || 'center';

      let maxAllowedW = zoneMaxW;
      if (align === 'center') {
        const distFromLeft = cx - margin;
        const distFromRight = targetWidth - margin - cx;
        const maxSymmetricW = Math.min(distFromLeft, distFromRight) * 2;
        maxAllowedW = Math.min(zoneMaxW, Math.max(40, maxSymmetricW));
      } else if (align === 'left') {
        maxAllowedW = Math.min(zoneMaxW, Math.max(40, targetWidth - margin - cx));
      } else if (align === 'right') {
        maxAllowedW = Math.min(zoneMaxW, Math.max(40, cx - margin));
      }

      const fontSpec = resolvePSDWebFontSpec(zone.fontFamily);
      const isCalendar = zone.type === 'calendar' || zone.isCalendar === true;
      const rotation = zone.rotation || 0;

      ctx.save();
      if (rotation) {
        ctx.translate(cx, cy);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);
      }

      if (isCalendar) {
        drawCalendarGrid(ctx, String(val), cx, cy, maxAllowedW, zone.color || '#160E4B', fontSpec.cssFamily);
      } else {
        const refWidth = 800; // Base reference width for typography scaling
        const scaleRatio = targetWidth / refWidth;
        let baseSize = zone.fontSize || 26;
        let currentFontSize = Math.max(12, Math.round(baseSize * scaleRatio * fontSpec.scaleModifier));

        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = zone.color || '#160E4B';

        const isMultiline =
          zone.multiline === true ||
          zone.type === 'message' ||
          (zone.defaultValue && zone.defaultValue.length > 60);

        if (!isMultiline) {
          // SINGLE-LINE AUTO-FIT: Names, dates, times must never collide or wrap
          ctx.font = `${fontSpec.weight} ${currentFontSize}px ${fontSpec.cssFamily}`;
          let measuredW = ctx.measureText(String(val)).width;

          if (zone.autoShrinkToFit !== false && measuredW > maxAllowedW && maxAllowedW > 30) {
            while (measuredW > maxAllowedW && currentFontSize > 12) {
              currentFontSize = Math.max(12, Math.floor(currentFontSize * 0.94));
              ctx.font = `${fontSpec.weight} ${currentFontSize}px ${fontSpec.cssFamily}`;
              measuredW = ctx.measureText(String(val)).width;
            }
          }

          ctx.fillText(String(val), cx, cy);
        } else {
          // MULTI-LINE WORD WRAPPING
          ctx.font = `${fontSpec.weight} ${currentFontSize}px ${fontSpec.cssFamily}`;
          const words = String(val).split(' ');
          const lines: string[] = [];
          let currentLine = '';

          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxAllowedW && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) lines.push(currentLine);

          const lineHeight = currentFontSize * 1.28;
          const startY = cy - ((lines.length - 1) * lineHeight) / 2;

          lines.forEach((line, idx) => {
            ctx.fillText(line, cx, startY + idx * lineHeight);
          });
        }
      }

      ctx.restore();
    }
  }

  return canvas;
}
