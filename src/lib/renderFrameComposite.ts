import {
  UniversalFrameTemplate,
  PhotoSlotConfig,
  TextZoneConfig,
  normalizeTemplateLayerDefaults,
} from '../types/template';
import {
  loadImage,
  drawImageCover,
  applyShapeClip,
  drawCalendarGrid,
  resolvePSDWebFontSpec,
  ensureWebFontsReady,
} from '../utils/templateCompositor';

/**
 * EXACT SINGLE SOURCE OF TRUTH FRAME COMPOSITOR
 * Used everywhere composition happens:
 * 1. Admin Visual Template Editor (StudioInteractiveCanvas & VisualTemplateEditor)
 * 2. Admin "Test Live" Preview
 * 3. Customer-Facing Storefront Live Preview (UniversalFrameCustomizer)
 * 4. High-Res Checkout / Print Exporter (300 DPI)
 *
 * Fixed, non-negotiable draw order:
 * 1. Draw baseImageUrl (or cleanBaseImageUrl) scaled to targetWidth.
 * 2. Merge photoSlots and textZones into one array, sort by zIndex ascending (default 0), draw in that order.
 * 3. For each photo slot: build a clip path for shape at x/y/width/height (with rotation), draw the slot's photo
 *    inside that clip only — this replaces pixels in that region, it never composites on top of the original artwork.
 * 4. For each text zone: set fontFamily/fontSize/color/align (with rotation); if autoShrinkToFit and measured width
 *    exceeds maxWidth, reduce fontSize in a loop (or wrap lines) until it fits; draw at x/y.
 */
export async function renderFrameComposite(
  rawTemplate: UniversalFrameTemplate,
  photoValues: Record<string, string> = {},
  textValues: Record<string, string> = {},
  targetWidth = 1200
): Promise<HTMLCanvasElement> {
  const template = normalizeTemplateLayerDefaults(rawTemplate);

  // 1. Resolve Base Image Source & Canvas Dimensions
  const baseSrc = template.cleanBaseImageUrl || template.baseImageUrl;
  if (!baseSrc) {
    throw new Error('Template baseImageUrl is missing.');
  }

  const baseImg = await loadImage(baseSrc);
  const naturalAspect =
    baseImg.naturalWidth && baseImg.naturalHeight
      ? baseImg.naturalWidth / baseImg.naturalHeight
      : template.documentDimensions?.width && template.documentDimensions?.height
      ? template.documentDimensions.width / template.documentDimensions.height
      : 0.8; // default 4:5 frame poster ratio

  const targetHeight = Math.round(targetWidth / naturalAspect);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context');

  // Clear & Draw Base Image
  ctx.clearRect(0, 0, targetWidth, targetHeight);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  drawImageCover(ctx, baseImg, 0, 0, targetWidth, targetHeight);

  // Ensure fonts are loaded before computing measurements or rendering text
  await ensureWebFontsReady();

  // 2. Merge Photo Slots and Text Zones into one unified layer array
  type CompositeItem =
    | { kind: 'slot'; data: PhotoSlotConfig }
    | { kind: 'zone'; data: TextZoneConfig };

  const mergedLayers: CompositeItem[] = [
    ...(template.photoSlots || []).map((s) => ({ kind: 'slot' as const, data: s })),
    ...(template.textZones || []).map((z) => ({ kind: 'zone' as const, data: z })),
  ];

  // Sort by zIndex ascending (default 0).
  // If pairedWithId matches, ensure shadow draws first so primary sits on top!
  mergedLayers.sort((a, b) => {
    const zA = a.data.zIndex ?? 0;
    const zB = b.data.zIndex ?? 0;
    if (zA !== zB) return zA - zB;

    if (a.kind === 'zone' && b.kind === 'zone') {
      if (a.data.pairedWithId === b.data.id) return -1;
      if (b.data.pairedWithId === a.data.id) return 1;
    }
    return 0;
  });

  // 3. Draw layers sequentially according to zIndex
  for (const item of mergedLayers) {
    if (item.kind === 'slot') {
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

        ctx.save();
        if (rotation) {
          ctx.translate(cx, cy);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(-cx, -cy);
        }

        // Clip strictly inside designated aperture shape
        applyShapeClip(ctx, slot.shape, cx, cy, sw, sh);
        ctx.clip();

        // Draw photo with object-fit: cover inside aperture bounds
        drawImageCover(ctx, photoImg, cx - sw / 2, cy - sh / 2, sw, sh);
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
