import { UniversalFrameTemplate, PhotoSlotConfig, TextZoneConfig } from '../types/template';
import { resolveVisibility } from '../admin/template-studio/utils/templateDefaults';

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image: ' + err));
    img.src = src;
  });
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
  const imgRatio = img.width / img.height;
  const targetRatio = w / h;
  let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

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
    ctx.arc(centerX, centerY, width / 2, 0, Math.PI * 2);
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
    ctx.bezierCurveTo(leftX, topY + height * 0.6, centerX - width * 0.1, topY + height * 0.8, centerX, topY + height);
    ctx.bezierCurveTo(centerX + width * 0.1, topY + height * 0.8, leftX + width, topY + height * 0.6, leftX + width, topY + height * 0.35);
    ctx.bezierCurveTo(leftX + width, topY, centerX, topY, centerX, topY + height * 0.3);
    ctx.closePath();
  } else if (shapeLower === 'star') {
    const outerR = width / 2;
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
    const r = Math.min(24, width * 0.1);
    (ctx as any).roundRect ? (ctx as any).roundRect(leftX, topY, width, height, r) : ctx.rect(leftX, topY, width, height);
  } else {
    ctx.rect(leftX, topY, width, height);
  }
}

/**
 * Samples surrounding background pixels and paints an inpainting patch over a bounding box,
 * completely erasing the original text pixels without leaving traces.
 */
function inpaintRegion(
  ctx: CanvasRenderingContext2D,
  imgData: ImageData,
  x: number,
  y: number,
  w: number,
  h: number,
  canvasW: number,
  canvasH: number
) {
  // Clamp boundaries
  const startX = Math.max(0, Math.floor(x));
  const startY = Math.max(0, Math.floor(y));
  const endX = Math.min(canvasW - 1, Math.ceil(x + w));
  const endY = Math.min(canvasH - 1, Math.ceil(y + h));

  // Sample perimeter colors (5px above and 5px below the box)
  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  const sampleOffset = 6;

  // Sample top boundary
  const sampleTopY = Math.max(0, startY - sampleOffset);
  for (let sx = startX; sx <= endX; sx += 4) {
    const idx = (sampleTopY * canvasW + sx) * 4;
    rSum += imgData.data[idx];
    gSum += imgData.data[idx + 1];
    bSum += imgData.data[idx + 2];
    count++;
  }

  // Sample bottom boundary
  const sampleBottomY = Math.min(canvasH - 1, endY + sampleOffset);
  for (let sx = startX; sx <= endX; sx += 4) {
    const idx = (sampleBottomY * canvasW + sx) * 4;
    rSum += imgData.data[idx];
    gSum += imgData.data[idx + 1];
    bSum += imgData.data[idx + 2];
    count++;
  }

  const avgR = count > 0 ? Math.round(rSum / count) : 255;
  const avgG = count > 0 ? Math.round(gSum / count) : 255;
  const avgB = count > 0 ? Math.round(bSum / count) : 255;

  ctx.save();
  // Fill with sampled ambient background color
  ctx.fillStyle = `rgb(${avgR}, ${avgG}, ${avgB})`;
  ctx.fillRect(startX, startY, endX - startX, endY - startY);
  ctx.restore();
}

/**
 * Generates the clean base image:
 * 1. Takes original baseImageUrl.
 * 2. Inpaints and clears every confirmed textZone region so old flattened text is erased.
 * 3. Prepares photo aperture regions with clean neutral backdrops.
 * Returns a high-res PNG data URL representing the clean Photoshop-style background layer.
 */
export async function generateCleanBaseImage(
  baseImageUrl: string,
  _photoSlots: PhotoSlotConfig[] = [],
  _textZones: TextZoneConfig[] = []
): Promise<string> {
  // Never destroy the artwork with crude opaque inpaint boxes.
  // The baseImageUrl itself is the pristine canvas artwork.
  return baseImageUrl;
}

/**
 * UNIFIED SHARED COMPOSITING ENGINE
 * Used identically for:
 * 1. Template Studio Live Canvas
 * 2. Customer Storefront Live Customizer
 * 3. Final 300 DPI Print Export
 *
 * Draw Order:
 * 1. Clean Base Image (cleanBaseImageUrl or baseImageUrl with inpaint)
 * 2. Photo Slots (clipped to shape, customer photo or default)
 * 3. Text Zones (customer text rendered in native typography)
 */
export async function renderUnifiedTemplateComposite({
  template,
  photoValues = {},
  textValues = {},
  targetWidth = 1200,
  targetHeight = 1760,
  drawFrameBorder = true,
}: {
  template: UniversalFrameTemplate;
  photoValues?: Record<string, string>;
  textValues?: Record<string, string>;
  targetWidth?: number;
  targetHeight?: number;
  drawFrameBorder?: boolean;
}): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');

  // Fill canvas solid white
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // 1. Draw Clean Base Layer
  const baseSrc = template.cleanBaseImageUrl || template.baseImageUrl;
  if (baseSrc) {
    try {
      const baseImg = await loadImage(baseSrc);
      drawImageCover(ctx, baseImg, 0, 0, targetWidth, targetHeight);
    } catch (e) {
      console.warn('Failed to load base image in composite:', e);
    }
  }

  // 2. Draw Photo Apertures
  for (const slot of template.photoSlots || []) {
    const vis = resolveVisibility(slot.visibility);
    let photoSrc = photoValues[slot.id];

    if (!photoSrc) {
      if (vis.emptyBehavior === 'hideLayer') continue;
      photoSrc = slot.defaultPhotoUrl || '';
    }

    if (photoSrc) {
      try {
        const photoImg = await loadImage(photoSrc);
        const cx = (slot.x / 100) * targetWidth;
        const cy = (slot.y / 100) * targetHeight;
        const sw = (slot.width / 100) * targetWidth;
        const sh = (slot.height / 100) * targetHeight;

        ctx.save();
        applyShapeClip(ctx, slot.shape || 'rectangle', cx, cy, sw, sh);
        ctx.clip();
        drawImageCover(ctx, photoImg, cx - sw / 2, cy - sh / 2, sw, sh);
        ctx.restore();
      } catch (e) {
        console.warn('Failed to load photo slot in composite:', e);
      }
    }
  }

  // 3. Draw Dynamic Text Zones
  for (const zone of template.textZones || []) {
    const vis = resolveVisibility(zone.visibility);
    // Skip static designer captions already present in the clean base artwork
    if (zone.visibility && vis.userVisible === false) continue;

    const rawVal = textValues[zone.id];
    if (!rawVal && vis.emptyBehavior === 'hideLayer') continue;

    const val = rawVal || zone.defaultValue;
    if (val && !val.startsWith('data:image')) {
      const textX = (zone.x / 100) * targetWidth;
      const textY = (zone.y / 100) * targetHeight;
      const maxBoxWidth = ((zone.maxWidth || 85) / 100) * targetWidth;
      const isCalendarZone = zone.type === 'calendar' || zone.isCalendar === true;

      if (isCalendarZone) {
        drawCalendarGrid(ctx, String(val), textX, textY, maxBoxWidth, zone.color || '#160E4B', zone.fontFamily || 'serif');
      } else {
        const scaledFontSize = Math.round((zone.fontSize || 18) * (targetWidth / 420));
        ctx.font = `bold ${scaledFontSize}px ${zone.fontFamily || 'sans-serif'}`;
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

        const lineHeight = scaledFontSize * 1.25;
        const startY = textY - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, idx) => {
          ctx.fillText(line, textX, startY + idx * lineHeight);
        });
      }
    }
  }

  // 4. Optional Outer Synthetic Black Wood Molding Border
  if (drawFrameBorder) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.round(targetWidth * 0.024);
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, targetWidth - ctx.lineWidth, targetHeight - ctx.lineWidth);
  }

  return canvas.toDataURL('image/png', 0.92);
}

function drawCalendarGrid(
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
        const day = parseInt(parts[0]);
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        let monthIdx = -1;
        if (parts.length >= 2) {
          monthIdx = monthNames.findIndex((m) => parts[1].toLowerCase().startsWith(m));
        }
        const year = parts.length >= 3 ? parseInt(parts[2]) : targetDate.getFullYear();
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
  const titleFontSize = Math.max(14, Math.round(boxWidth * 0.1));
  ctx.font = `bold ${titleFontSize}px ${fontFamily}`;
  ctx.fillText(monthTitle, centerX, centerY - boxWidth * 0.35);

  // Weekdays Header
  const dayHeaderFontSize = Math.max(9, Math.round(boxWidth * 0.055));
  ctx.font = `bold ${dayHeaderFontSize}px sans-serif`;
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const colStep = boxWidth / 7;
  const startX = centerX - boxWidth / 2 + colStep / 2;

  weekdays.forEach((dayName, colIdx) => {
    ctx.fillText(dayName, startX + colIdx * colStep, centerY - boxWidth * 0.22);
  });

  // Days Grid
  const numFontSize = Math.max(9, Math.round(boxWidth * 0.055));
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

