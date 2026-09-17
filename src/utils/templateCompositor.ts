import { UniversalFrameTemplate, PhotoSlotConfig, TextZoneConfig } from '../types/template';
import { resolveVisibility } from '../admin/template-studio/utils/templateDefaults';

// In-memory image cache to prevent flicker and redundant network downloads during keystrokes
const imageMemoryCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  if (!src) {
    return Promise.reject(new Error('Empty image src provided'));
  }
  if (imageMemoryCache.has(src)) {
    const cached = imageMemoryCache.get(src)!;
    if (cached.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }
  }
  if (loadingPromises.has(src)) {
    return loadingPromises.get(src)!;
  }

  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageMemoryCache.set(src, img);
      loadingPromises.delete(src);
      resolve(img);
    };
    img.onerror = (err) => {
      loadingPromises.delete(src);
      reject(new Error(`Failed to load image at: ${src.slice(0, 80)}... Error: ${err}`));
    };
    img.src = src;
  });

  loadingPromises.set(src, p);
  return p;
}

/**
 * Maps PSD embedded font names to available Google Fonts with cursive/serif fallbacks.
 */
export function resolvePSDWebFont(fontFamily?: string): string {
  if (!fontFamily) return "'Jost', sans-serif";
  const f = fontFamily.toLowerCase();
  if (
    f.includes('floryfic') ||
    f.includes('cinderella') ||
    f.includes('script') ||
    f.includes('great vibes') ||
    f.includes('dancing') ||
    f.includes('cursive') ||
    f.includes('calligraph')
  ) {
    return "'Great Vibes', 'Dancing Script', cursive";
  }
  if (
    f.includes('clarendon') ||
    f.includes('times') ||
    f.includes('georgia') ||
    f.includes('playfair') ||
    f.includes('serif')
  ) {
    return "'Playfair Display', serif";
  }
  if (f.includes('cinzel')) {
    return "'Cinzel', serif";
  }
  if (f.includes('montserrat')) {
    return "'Montserrat', sans-serif";
  }
  if (f.includes('poppins')) {
    return "'Poppins', sans-serif";
  }
  if (f.includes('caveat')) {
    return "'Caveat', cursive";
  }
  if (f.includes('pacifico')) {
    return "'Pacifico', cursive";
  }
  return `'${fontFamily}', 'Jost', sans-serif`;
}

/**
 * Draws an image with object-fit: cover inside a destination rect.
 */
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  if (!img || img.width <= 0 || img.height <= 0 || w <= 0 || h <= 0) return;
  const imgRatio = img.width / img.height;
  const targetRatio = w / h;
  let sx = 0,
    sy = 0,
    sWidth = img.width,
    sHeight = img.height;

  if (imgRatio > targetRatio) {
    sWidth = img.height * targetRatio;
    sx = (img.width - sWidth) / 2;
  } else {
    sHeight = img.width / targetRatio;
    sy = (img.height - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
}

/**
 * Clips canvas context to the designated shape path.
 */
export function applyShapeClip(
  ctx: CanvasRenderingContext2D,
  shape: string,
  centerX: number,
  centerY: number,
  width: number,
  height: number
) {
  const leftX = centerX - width / 2;
  const topY = centerY - height / 2;
  const shapeLower = (shape || '').toLowerCase();

  ctx.beginPath();
  if (shapeLower === 'circle') {
    ctx.arc(centerX, centerY, Math.min(width, height) / 2, 0, Math.PI * 2);
  } else if (shapeLower === 'oval') {
    ctx.ellipse(centerX, centerY, width / 2, height / 2, 0, 0, Math.PI * 2);
  } else if (shapeLower === 'arch') {
    const radius = width / 2;
    ctx.moveTo(leftX, topY + height);
    ctx.lineTo(leftX, topY + radius);
    ctx.arc(centerX, topY + radius, radius, Math.PI, 0);
    ctx.lineTo(leftX + width, topY + height);
    ctx.closePath();
  } else if (shapeLower === 'heart') {
    ctx.moveTo(centerX, topY + height * 0.3);
    ctx.bezierCurveTo(centerX, topY, leftX, topY, leftX, topY + height * 0.35);
    ctx.bezierCurveTo(
      leftX,
      topY + height * 0.6,
      centerX - width * 0.1,
      topY + height * 0.8,
      centerX,
      topY + height
    );
    ctx.bezierCurveTo(
      centerX + width * 0.1,
      topY + height * 0.8,
      leftX + width,
      topY + height * 0.6,
      leftX + width,
      topY + height * 0.35
    );
    ctx.bezierCurveTo(leftX + width, topY, centerX, topY, centerX, topY + height * 0.3);
    ctx.closePath();
  } else if (shapeLower === 'star') {
    const outerR = Math.min(width, height) / 2;
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
  } else if (shapeLower === 'diamond') {
    ctx.moveTo(centerX, topY);
    ctx.lineTo(leftX + width, centerY);
    ctx.lineTo(centerX, topY + height);
    ctx.lineTo(leftX, centerY);
    ctx.closePath();
  } else if (shapeLower === 'hexagon') {
    ctx.moveTo(leftX + width * 0.25, topY);
    ctx.lineTo(leftX + width * 0.75, topY);
    ctx.lineTo(leftX + width, centerY);
    ctx.lineTo(leftX + width * 0.75, topY + height);
    ctx.lineTo(leftX + width * 0.25, topY + height);
    ctx.lineTo(leftX, centerY);
    ctx.closePath();
  } else if (shapeLower === 'rounded') {
    const r = Math.min(width, height) * 0.14;
    if ((ctx as any).roundRect) {
      (ctx as any).roundRect(leftX, topY, width, height, r);
    } else {
      ctx.rect(leftX, topY, width, height);
    }
  } else {
    ctx.rect(leftX, topY, width, height);
  }
}

/**
 * Draws an interactive calendar grid directly onto the canvas context.
 */
export function drawCalendarGrid(
  ctx: CanvasRenderingContext2D,
  dateString: string,
  centerX: number,
  centerY: number,
  boxWidth: number,
  color: string,
  fontFamily: string
) {
  let targetDate = new Date();
  if (dateString) {
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
      targetDate = parsed;
    } else {
      const parts = dateString.split(' ');
      if (parts.length >= 1) {
        const day = parseInt(parts[0], 10);
        const monthNames = [
          'jan', 'feb', 'mar', 'apr', 'may', 'jun',
          'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
        ];
        let monthIdx = -1;
        if (parts.length >= 2) {
          monthIdx = monthNames.findIndex((m) => parts[1].toLowerCase().startsWith(m));
        }
        const year = parts.length >= 3 ? parseInt(parts[2], 10) : targetDate.getFullYear();
        if (!isNaN(day)) {
          targetDate = new Date(year, monthIdx !== -1 ? monthIdx : targetDate.getMonth(), day);
        }
      }
    }
  }

  const selectedYear = targetDate.getFullYear();
  const selectedMonthIdx = targetDate.getMonth();
  const selectedDayNum = targetDate.getDate();

  const monthNamesTitle = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthTitle = monthNamesTitle[selectedMonthIdx] || 'February';

  const firstDayOfWeek = new Date(selectedYear, selectedMonthIdx, 1).getDay();
  const daysInMonth = new Date(selectedYear, selectedMonthIdx + 1, 0).getDate();

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;

  // Month Header
  const titleFontSize = Math.max(12, Math.round(boxWidth * 0.095));
  ctx.font = `bold ${titleFontSize}px ${fontFamily}, serif`;
  ctx.fillText(monthTitle, centerX, centerY - boxWidth * 0.35);

  // Weekdays Header
  const dayHeaderFontSize = Math.max(8, Math.round(boxWidth * 0.05));
  ctx.font = `bold ${dayHeaderFontSize}px sans-serif`;
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const colStep = boxWidth / 7;
  const startX = centerX - boxWidth / 2 + colStep / 2;

  weekdays.forEach((dayName, colIdx) => {
    ctx.fillText(dayName, startX + colIdx * colStep, centerY - boxWidth * 0.22);
  });

  // Days Grid
  const numFontSize = Math.max(8, Math.round(boxWidth * 0.05));
  ctx.font = `bold ${numFontSize}px sans-serif`;

  const rowStep = boxWidth * 0.09;
  const gridStartY = centerY - boxWidth * 0.12;

  for (let d = 1; d <= daysInMonth; d++) {
    const cellIdx = firstDayOfWeek + d - 1;
    const colIdx = cellIdx % 7;
    const rowIdx = Math.floor(cellIdx / 7);

    const cellX = startX + colIdx * colStep;
    const cellY = gridStartY + rowIdx * rowStep;

    if (d === selectedDayNum) {
      ctx.fillStyle = '#EF4444';
      ctx.fillText('❤️', cellX, cellY);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.round(numFontSize * 0.85)}px sans-serif`;
      ctx.fillText(d.toString(), cellX, cellY);
      ctx.fillStyle = color;
      ctx.font = `bold ${numFontSize}px sans-serif`;
    } else {
      ctx.fillText(d.toString(), cellX, cellY);
    }
  }

  ctx.restore();
}

export interface RenderTemplateCompositeOptions {
  template: UniversalFrameTemplate;
  customerInputs?:
    | {
        photoValues?: Record<string, string>;
        textValues?: Record<string, string>;
      }
    | Record<string, string>;
  targetWidth?: number;
  targetHeight?: number;
  drawFrameBorder?: boolean;
  watermarkText?: string;
  canvas?: HTMLCanvasElement | null;
  mode?: 'auto' | 'sample' | 'customized' | 'cutout';
}

/**
 * EXACT SINGLE SOURCE OF TRUTH COMPOSITOR FUNCTION
 * Used identically across:
 * 1. Admin Template Studio Preview (StudioInteractiveCanvas)
 * 2. Admin "Test Live" mode (UniversalFrameCustomizer)
 * 3. Customer-Facing Storefront Customizer Live Preview (UniversalFrameCustomizer)
 * 4. Final 300 DPI High-Res Checkout Print Export (printExporter)
 *
 * Implements "Replace-Not-Overlay":
 * - When customer types a value, it renders in place of that layer's default content.
 * - When customer uploads a photo, it renders inside that aperture.
 * - Clean background is drawn underneath so zero double-text or artifacts appear.
 */
export async function renderTemplateComposite({
  template,
  customerInputs = {},
  targetWidth = 1200,
  targetHeight = 1760,
  drawFrameBorder = true,
  watermarkText = '',
  canvas: targetCanvas = null,
  mode = 'auto',
}: RenderTemplateCompositeOptions): Promise<string> {
  // 1. Normalize Customer Inputs
  let photoMap: Record<string, string> = {};
  let textMap: Record<string, string> = {};

  if (customerInputs) {
    if ('photoValues' in customerInputs || 'textValues' in customerInputs) {
      photoMap = (customerInputs as any).photoValues || {};
      textMap = (customerInputs as any).textValues || {};
    } else {
      photoMap = customerInputs as Record<string, string>;
      textMap = customerInputs as Record<string, string>;
    }
  }

  const hasCustomPhotos = Object.values(photoMap).some((v) => Boolean(v && v.trim() !== ''));
  const hasCustomTexts = Object.values(textMap).some((v) => Boolean(v && v.trim() !== ''));

  // 2. Resolve Dynamic Canvas Dimensions
  let finalWidth = targetWidth;
  let finalHeight = targetHeight;

  if (template.documentDimensions?.width && template.documentDimensions?.height) {
    const docAspect = template.documentDimensions.width / template.documentDimensions.height;
    if (finalWidth && !finalHeight) {
      finalHeight = Math.round(finalWidth / docAspect);
    } else if (finalHeight && !finalWidth) {
      finalWidth = Math.round(finalHeight * docAspect);
    }
  }

  const canvas = targetCanvas || document.createElement('canvas');
  if (canvas.width !== finalWidth || canvas.height !== finalHeight) {
    canvas.width = finalWidth;
    canvas.height = finalHeight;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create 2D canvas context');

  // Clear canvas
  ctx.clearRect(0, 0, finalWidth, finalHeight);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, finalWidth, finalHeight);

  // 3. Determine Background Image Source & Render Strategy
  const sampleCompositeUrl = template.baseImageUrl || template.cleanBaseImageUrl;
  const cleanBaseUrl = template.cleanBaseImageUrl || template.baseImageUrl;

  let baseSrc = sampleCompositeUrl;
  let shouldRenderLayers = false;

  if (mode === 'cutout') {
    baseSrc = cleanBaseUrl;
    shouldRenderLayers = false;
  } else if (mode === 'sample') {
    baseSrc = cleanBaseUrl;
    shouldRenderLayers = true;
  } else if (mode === 'customized') {
    baseSrc = cleanBaseUrl;
    shouldRenderLayers = true;
  } else {
    // mode === 'auto'
    const isCustomized = hasCustomPhotos || hasCustomTexts;
    if (isCustomized) {
      baseSrc = cleanBaseUrl;
      shouldRenderLayers = true;
    } else {
      baseSrc = sampleCompositeUrl;
      shouldRenderLayers = !template.baseImageUrl || template.baseImageUrl === template.cleanBaseImageUrl;
    }
  }

  if (baseSrc) {
    try {
      const baseImg = await loadImage(baseSrc);
      drawImageCover(ctx, baseImg, 0, 0, finalWidth, finalHeight);
    } catch (e) {
      console.warn('Failed to load base image in compositor:', e);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, finalWidth, finalHeight);
    }
  }



  if (shouldRenderLayers) {
    // A. Draw Photo Apertures (Replace-Not-Overlay)
    for (const slot of template.photoSlots || []) {
      const vis = resolveVisibility(slot.visibility);
      if (slot.visibility && vis.userVisible === false) continue;

      let photoSrc = photoMap[slot.id];
      if (!photoSrc) {
        if (vis.emptyBehavior === 'hideLayer') continue;
        photoSrc = slot.defaultPhotoUrl || '';
      }

      if (photoSrc) {
        try {
          const photoImg = await loadImage(photoSrc);
          const cx = (slot.x / 100) * finalWidth;
          const cy = (slot.y / 100) * finalHeight;
          const sw = (slot.width / 100) * finalWidth;
          const sh = (slot.height / 100) * finalHeight;

          ctx.save();
          applyShapeClip(ctx, slot.shape, cx, cy, sw, sh);
          ctx.clip();
          drawImageCover(ctx, photoImg, cx - sw / 2, cy - sh / 2, sw, sh);
          ctx.restore();
        } catch (e) {
          console.warn('Failed to load photo slot in compositor:', e);
        }
      }
    }

    // B. Draw Dynamic Text Zones (Replace-Not-Overlay)
    for (const zone of template.textZones || []) {
      const vis = resolveVisibility(zone.visibility);
      if (zone.visibility && vis.userVisible === false) continue;

      const rawVal = textMap[zone.id];
      if (!rawVal && vis.emptyBehavior === 'hideLayer') continue;

      const val = (rawVal !== undefined && rawVal.trim() !== '') ? rawVal : (zone.defaultValue || '');
      if (!val || val.trim() === '' || val.startsWith('data:image')) continue;

      const textX = (zone.x / 100) * finalWidth;
      const textY = (zone.y / 100) * finalHeight;
      const maxBoxWidth = ((zone.maxWidth || 85) / 100) * finalWidth;
      const isCalendarZone = zone.type === 'calendar_grid' || zone.type === 'calendar' || zone.isCalendar === true;

      const resolvedFontFamily = resolvePSDWebFont(zone.fontFamily);

      if (isCalendarZone) {
        drawCalendarGrid(ctx, String(val), textX, textY, maxBoxWidth, zone.color || '#160E4B', resolvedFontFamily);
      } else {
        // Compute responsive font size based on target width
        const basePt = zone.fontSize || 24;
        const scaledFontSize = Math.max(10, Math.round(basePt * (finalWidth / 600)));

        ctx.save();
        ctx.font = `bold ${scaledFontSize}px ${resolvedFontFamily}`;
        ctx.fillStyle = zone.color || '#160E4B';
        ctx.textAlign = (zone.align as CanvasTextAlign) || 'center';
        ctx.textBaseline = 'middle';

        const words = String(val).split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxBoxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);

        const lineHeight = scaledFontSize * 1.22;
        const startY = textY - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, idx) => {
          ctx.fillText(line, textX, startY + idx * lineHeight);
        });

        ctx.restore();
      }
    }
  }

  // 5. Outer Synthetic Black Wood Molding Border (Optional)
  if (drawFrameBorder) {
    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(6, Math.round(finalWidth * 0.025));
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, finalWidth - ctx.lineWidth, finalHeight - ctx.lineWidth);
    ctx.restore();
  }

  // 6. Watermark Overlay (If specified)
  if (watermarkText) {
    ctx.save();
    ctx.translate(finalWidth / 2, finalHeight / 2);
    ctx.rotate(-Math.PI / 4);
    ctx.font = `bold ${Math.round(finalWidth * 0.045)}px sans-serif`;
    ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(watermarkText.toUpperCase(), 0, 0);
    ctx.restore();
  }

  return canvas.toDataURL('image/png', 0.95);
}
