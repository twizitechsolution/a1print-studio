import { PhotoSlotConfig, TextZoneConfig, FrameCutoutShape, StaticLayerConfig } from '../../../types/template';
import { DEFAULT_VISIBILITY } from './templateDefaults';

export interface PSDParsedLayer {
  name: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  type: 'photo' | 'text' | 'calendar' | 'background' | 'static';
  textValue?: string;
  shape?: FrameCutoutShape;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
}

export interface PSDImportResult {
  documentDimensions: { width: number; height: number };
  photoSlots: PhotoSlotConfig[];
  textZones: TextZoneConfig[];
  staticLayers: StaticLayerConfig[];
  detectedLayerCount: number;
  compositePreviewUrl?: string;
  cleanBaseImageUrl?: string;
}

/**
 * Heuristically infers the cutout shape from PSD layer naming conventions
 * e.g., "Photo_Arch_1", "Heart Photo", "Circle Cutout", "Baby Slot 1"
 */
export function inferShapeFromLayerName(name: string): FrameCutoutShape {
  const lower = name.toLowerCase();
  if (lower.includes('circle') || lower.includes('round_cutout')) return 'circle';
  if (lower.includes('heart')) return 'heart';
  if (lower.includes('arch')) return 'arch';
  if (lower.includes('oval') || lower.includes('ellipse')) return 'oval';
  if (lower.includes('star')) return 'star';
  if (lower.includes('polaroid')) return 'polaroid';
  if (lower.includes('square')) return 'square';
  if (lower.includes('rounded')) return 'rounded';
  return 'rounded';
}

/**
 * Classifies a PSD layer by its name, metadata or content
 */
export function classifyPSDLayer(layerName: string): {
  type: 'photo' | 'text' | 'calendar' | 'background';
  label: string;
} {
  const lower = layerName.trim().toLowerCase();

  // Background / Base
  if (
    lower.includes('background') ||
    lower.includes('bg') ||
    lower.includes('frame_border') ||
    lower.includes('base')
  ) {
    return { type: 'background', label: layerName };
  }

  // Calendar
  if (
    lower.includes('calendar') ||
    lower.includes('calender') ||
    lower.includes('date_grid') ||
    lower.includes('month')
  ) {
    return { type: 'calendar', label: layerName };
  }

  // Photo / Slot / Image Smart Object
  if (
    lower.includes('photo') ||
    lower.includes('image') ||
    lower.includes('picture') ||
    lower.includes('slot') ||
    lower.includes('portrait') ||
    lower.includes('pic') ||
    lower.includes('couple') ||
    lower.includes('baby_img') ||
    lower.includes('smart_object')
  ) {
    return { type: 'photo', label: layerName };
  }

  // Default to text zone if likely typographical
  return { type: 'text', label: layerName };
}

/**
 * Reads binary Photoshop file header to extract Document Dimensions & Layer Records.
 * Photoshop File Format (.PSD) Spec:
 * - Bytes 0-3: 8BPS (Signature)
 * - Bytes 4-5: Version (1 for PSD, 2 for PSB)
 * - Bytes 14-17: Height (uint32)
 * - Bytes 18-21: Width (uint32)
 * - Bytes 22-23: Depth
 * - Bytes 24-25: Color Mode (RGB = 3)
 */
/**
 * Helper to initialize HTML5 Canvas factory for ag-psd in browser environments
 */
function setupAgPsdCanvas(agPsd: any) {
  if (typeof document !== 'undefined' && agPsd && typeof agPsd.initializeCanvas === 'function') {
    try {
      agPsd.initializeCanvas(
        (width: number, height: number) => {
          const c = document.createElement('canvas');
          c.width = width;
          c.height = height;
          return c;
        },
        (width: number, height: number, data: Uint8Array | Uint8ClampedArray) => {
          const c = document.createElement('canvas');
          c.width = width;
          c.height = height;
          const ctx = c.getContext('2d');
          if (ctx) {
            const imgData = ctx.createImageData(width, height);
            imgData.data.set(data);
            ctx.putImageData(imgData, 0, 0);
          }
          return c;
        },
        (width: number, height: number) => {
          const c = document.createElement('canvas');
          const ctx = c.getContext('2d');
          return ctx?.createImageData(width, height) || new ImageData(width, height);
        }
      );
    } catch (e) {
      console.warn('ag-psd initializeCanvas notice:', e);
    }
  }
}

/**
 * Recursively extracts all discrete layers from a PSD children tree
 */
function flattenPsdChildren(children: any[]): any[] {
  const flattened: any[] = [];
  for (const child of children) {
    if (!child) continue;
    if (child.children && Array.isArray(child.children) && child.children.length > 0) {
      flattened.push(...flattenPsdChildren(child.children));
    } else {
      flattened.push(child);
    }
  }
  return flattened;
}

/**
 * Converts RGB color object to hex string
 */
function rgbToHex(color: any): string {
  if (!color) return '#160E4B';
  const r = Math.round(color.r ?? color.red ?? 22);
  const g = Math.round(color.g ?? color.green ?? 14);
  const b = Math.round(color.b ?? color.blue ?? 75);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

interface ClassifiedPsdText {
  label: string;
  userLabel: string;
  type: 'text' | 'date' | 'time' | 'number' | 'calendar' | 'message';
  isCalendar: boolean;
  userVisible: boolean;
  defaultValue: string;
}

/**
 * Intelligently classifies PSD text layers into human-friendly Field Headings
 * (e.g. Birth Timing, Birth Weight, Date of Birth, Hospital Name, Baby Name, Parents Name)
 * and distinguishes between editable customer fields vs. fixed decorative poster captions.
 */
function classifyPsdTextLayer(cleanText: string, layerName: string): ClassifiedPsdText {
  const text = cleanText.trim();
  const lowerText = text.toLowerCase();
  const lowerName = (layerName || '').toLowerCase();
  const combined = `${lowerText} ${lowerName}`;

  // 1. Calendar Grid Table / Matrix
  if (/calendar_grid|calendar_table|date_grid|month_grid/i.test(combined)) {
    return {
      label: 'Calendar Grid',
      userLabel: 'Milestone Calendar',
      type: 'calendar',
      isCalendar: true,
      userVisible: true,
      defaultValue: text,
    };
  }

  // 2. Pure Decorative Caption / Section Titles (Printed statically on poster, not customer inputs)
  // e.g. The literal words "Baby Name", "Parants Name", "Blood Group", "Arabic Date", "Date of Birth"
  if (
    /^(baby\s*name|name|parants?\s*name|parents?\s*name|father\s*(&|and)?\s*mother|blood\s*group|arabic\s*date|born\s*on|time\s*of\s*birth)$/i.test(text) ||
    /^(baby\s*name|parants?\s*name|parents?\s*name|blood\s*group|arabic\s*date)$/i.test(lowerName)
  ) {
    if (
      /^(baby\s*name|name|parants?\s*name|parents?\s*name|blood\s*group|arabic\s*date)$/i.test(lowerText)
    ) {
      return {
        label: `${text} (Caption)`,
        userLabel: text,
        type: 'text',
        isCalendar: false,
        userVisible: false, // Hidden from storefront customer inputs because it's a fixed poster caption
        defaultValue: text,
      };
    }
  }

  // 3. Time of Birth (e.g. 04:35 PM, 04:35.p.m, 10:30 am, etc.)
  if (
    /\b\d{1,2}[:.]\d{2}\s*(am|pm|a\.m|p\.m)?\b/i.test(text) ||
    /time|timing|birth_time|born_at/i.test(lowerName)
  ) {
    let formattedTime = text;
    const timeMatch = text.match(/(\d{1,2})[:.](\d{2})\s*(am|pm|a\.m|p\.m)?/i);
    if (timeMatch) {
      const hh = timeMatch[1].padStart(2, '0');
      const mm = timeMatch[2];
      const meridiem = (timeMatch[3] || 'PM').toUpperCase().replace(/\./g, '');
      formattedTime = `${hh}:${mm} ${meridiem}`;
    }
    return {
      label: 'Birth Timing',
      userLabel: 'Birth Timing',
      type: 'time',
      isCalendar: false,
      userVisible: true,
      defaultValue: formattedTime,
    };
  }

  // 4. Weight / Metric (e.g. 2.6 Kg, 3.2 kg, 7 lbs, etc.)
  if (
    /\b\d+(\.\d+)?\s*(kg|kgs|lbs|pounds|gm|g|grams)\b/i.test(text) ||
    /weight|birth_weight/i.test(lowerName)
  ) {
    return {
      label: 'Birth Weight',
      userLabel: 'Birth Weight',
      type: 'number',
      isCalendar: false,
      userVisible: true,
      defaultValue: text,
    };
  }

  // 5. Hospital / Clinic Name
  if (/hospital|clinic|nursing|maternity|healthcare|born\s+at/i.test(combined)) {
    return {
      label: 'Hospital Name',
      userLabel: 'Hospital Name',
      type: 'text',
      isCalendar: false,
      userVisible: true,
      defaultValue: text,
    };
  }

  // 6. Blood Group (e.g. B+, O+, A-, AB+, etc.)
  if (/^(A|B|AB|O)[+-]$/i.test(text) || /blood\s*group/i.test(lowerName)) {
    return {
      label: 'Blood Group',
      userLabel: 'Blood Group',
      type: 'text',
      isCalendar: false,
      userVisible: true,
      defaultValue: text,
    };
  }

  // 7. Gregorian Date of Birth (e.g. 16/10/2023, 16-10-2023, 16.10.2023, 20 Nov 2023)
  if (
    /\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/.test(text) ||
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/i.test(text) ||
    /\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\b/i.test(text) ||
    /dob|date_of_birth|birth_date|arrival_date/i.test(lowerName)
  ) {
    return {
      label: 'Date of Birth',
      userLabel: 'Date of Birth',
      type: 'date',
      isCalendar: false,
      userVisible: true,
      defaultValue: text,
    };
  }

  // 8. Islamic / Arabic Date (e.g. Rabial-Awwal 19, Ramadan 14, 19 Shawwal)
  if (/rabial|awwal|ramadan|muharram|safar|shawwal|zulhijjah|hijri/i.test(combined)) {
    return {
      label: 'Islamic / Arabic Date',
      userLabel: 'Islamic / Arabic Date',
      type: 'text',
      isCalendar: false,
      userVisible: true,
      defaultValue: text,
    };
  }

  // 9. Parents / Couple Names (e.g. Salman & Ahamed, Priya & Rohit)
  if (/(&|\band\b|\bw\/o\b)/i.test(text) || /parents?|father|mother|couple/i.test(lowerName)) {
    return {
      label: 'Parents Name',
      userLabel: 'Parents Name',
      type: 'text',
      isCalendar: false,
      userVisible: true,
      defaultValue: text,
    };
  }

  // 10. Baby Name / Single Person Name (e.g. Noor Aysha, Baby Aarav)
  if (/baby\s*name/i.test(lowerName) || /^(baby|master|miss)\b/i.test(text)) {
    return {
      label: 'Baby Name',
      userLabel: 'Baby Name',
      type: 'text',
      isCalendar: false,
      userVisible: true,
      defaultValue: text,
    };
  }

  // 11. Generic fallback: If layerName has a friendly name, use it; otherwise use text
  const cleanLabel = (layerName && !layerName.startsWith('Layer ')) 
    ? layerName.replace(/[_-]/g, ' ') 
    : text.substring(0, 24);

  return {
    label: cleanLabel,
    userLabel: cleanLabel,
    type: 'text',
    isCalendar: false,
    userVisible: true,
    defaultValue: text,
  };
}

/**
 * Parses a Photoshop (.PSD) file using ag-psd engine to extract:
 * 1. Pixel-perfect composite artwork preview (`baseImageUrl`)
 * 2. Real text strings and styles from text layers (`defaultValue`, `fontFamily`, `fontSize`, `color`)
 * 3. Real photo layers with thumbnail previews (`PhotoSlotConfig`)
 * 
 * Falls back to fast binary scanning if ag-psd fails or is unavailable.
 */
export async function parsePSDFileBinary(file: File): Promise<PSDImportResult> {
  const arrayBuffer = await file.arrayBuffer();

  // Try parsing with full ag-psd layer engine first
  try {
    const agPsdModule = await import(/* @vite-ignore */ 'https://esm.sh/ag-psd@23.0.0');
    setupAgPsdCanvas(agPsdModule);

    const readPsd = agPsdModule.readPsd || agPsdModule.default?.readPsd || agPsdModule.default;
    if (typeof readPsd === 'function') {
      const psd = readPsd(arrayBuffer, {
        skipLayerImageData: false,
        skipCompositeImageData: false,
        skipThumbnail: false,
      });

      const docWidth = psd.width || 1200;
      const docHeight = psd.height || 1600;

      // Extract high-resolution composite preview
      let compositePreviewUrl = '';
      if (psd.canvas && typeof psd.canvas.toDataURL === 'function') {
        try {
          compositePreviewUrl = psd.canvas.toDataURL('image/jpeg', 0.94);
        } catch (canvasErr) {
          console.warn('PSD composite canvas export notice:', canvasErr);
        }
      }

      // Collect all layers recursively
      const allLayers = psd.children ? flattenPsdChildren(psd.children) : [];
      const photoSlots: PhotoSlotConfig[] = [];
      const textZones: TextZoneConfig[] = [];
      const staticLayers: StaticLayerConfig[] = [];

      let slotCounter = 1;
      let textCounter = 1;
      let staticCounter = 1;

      for (let i = 0; i < allLayers.length; i++) {
        const layer = allLayers[i];
        if (!layer || layer.hidden) continue;

        const layerName = (layer.name || `Layer ${i + 1}`).trim();
        const l = typeof layer.left === 'number' ? layer.left : 0;
        const t = typeof layer.top === 'number' ? layer.top : 0;
        const r = typeof layer.right === 'number' ? layer.right : docWidth;
        const b = typeof layer.bottom === 'number' ? layer.bottom : docHeight;
        const layerWidth = Math.max(1, r - l);
        const layerHeight = Math.max(1, b - t);

        // Check if layer is full-bleed background
        const isFullCanvas = l <= 5 && t <= 5 && r >= docWidth - 5 && b >= docHeight - 5;
        const isNamedBackground = /background|bg|artboard|base_frame|canvas_bg/i.test(layerName);
        if (isFullCanvas && (isNamedBackground || i === 0)) {
          // Keep as base artwork background, do not turn into an editable cutout
          continue;
        }

        // Percentage Coordinates (0 - 100%)
        const xPct = Math.max(5, Math.min(95, Math.round((((l + r) / 2) / docWidth) * 100)));
        const yPct = Math.max(5, Math.min(95, Math.round((((t + b) / 2) / docHeight) * 100)));
        const wPct = Math.max(5, Math.min(95, Math.round((layerWidth / docWidth) * 100)));
        const hPct = Math.max(4, Math.min(95, Math.round((layerHeight / docHeight) * 100)));

        // 1. Text Layer
        if (layer.text && typeof layer.text.text === 'string' && layer.text.text.trim()) {
          const rawText = layer.text.text.trim();
          const cleanText = rawText.replace(/\r?\n/g, ' ');

          // Extract styling if available
          const textStyle = layer.text.style || {};
          const rawFontSize = textStyle.fontSize ? Math.round(textStyle.fontSize) : 28;
          const fontFamily = textStyle.font?.name || 'Playfair Display';
          const color = textStyle.fillColor ? rgbToHex(textStyle.fillColor) : '#160E4B';

          const classified = classifyPsdTextLayer(cleanText, layerName);

          // Normalize font size to 1200px reference canvas width
          const normalizedFontSize = docWidth > 0 
            ? Math.min(52, Math.max(14, Math.round((rawFontSize / docWidth) * 1200)))
            : Math.min(52, Math.max(14, rawFontSize));

          // Blood Group on blood drop should be crisp white (#FFFFFF)
          const isBloodDropVal = classified.label.toLowerCase().includes('blood') || /^(A|B|AB|O)[+-]$/i.test(cleanText);
          const resolvedColor = isBloodDropVal ? '#FFFFFF' : color;

          textZones.push({
            id: `text-psd-${Date.now().toString(36)}-${textCounter}`,
            label: classified.label,
            defaultValue: classified.defaultValue,
            x: xPct,
            y: yPct,
            maxWidth: Math.min(90, Math.max(30, wPct + 10)),
            fontSize: normalizedFontSize,
            fontFamily,
            color: resolvedColor,
            align: 'center',
            type: classified.type,
            isCalendar: classified.isCalendar,
            visibility: {
              ...DEFAULT_VISIBILITY,
              userVisible: classified.userVisible,
              userEditable: classified.userVisible,
              userLabel: classified.userLabel,
            },
            sourceLayerName: layerName,
          });
          textCounter++;
        }
        // 2. Pixel / Image Layer
        else if (layer.canvas || (!layer.text && layerWidth >= 15 && layerHeight >= 15)) {
          let defaultPhotoUrl = 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600';
          if (layer.canvas && typeof layer.canvas.toDataURL === 'function') {
            try {
              defaultPhotoUrl = layer.canvas.toDataURL('image/png');
            } catch (layerCanvasErr) {
              console.warn('PSD layer canvas export notice:', layerCanvasErr);
            }
          }

          staticLayers.push({
            id: `static-psd-${Date.now().toString(36)}-${staticCounter}`,
            label: layerName || `Decorative Art ${staticCounter}`,
            sourceLayerName: layerName,
            x: xPct,
            y: yPct,
            width: wPct,
            height: hPct,
            defaultPhotoUrl,
            locked: true,
          });
          staticCounter++;
        }
      }

      // Helper to crop an aperture region from the composite PSD canvas
      const cropApertureThumbnail = (l: number, t: number, w: number, h: number): string => {
        if (!psd.canvas || typeof document === 'undefined') return '';
        try {
          const maxDim = 200;
          const scale = Math.min(1, maxDim / Math.max(w, h, 1));
          const targetW = Math.max(1, Math.round(w * scale));
          const targetH = Math.max(1, Math.round(h * scale));

          const c = document.createElement('canvas');
          c.width = targetW;
          c.height = targetH;
          const cCtx = c.getContext('2d');
          if (cCtx) {
            cCtx.drawImage(
              psd.canvas,
              Math.max(0, Math.round(l)),
              Math.max(0, Math.round(t)),
              Math.max(1, Math.round(w)),
              Math.max(1, Math.round(h)),
              0,
              0,
              targetW,
              targetH
            );
            return c.toDataURL('image/jpeg', 0.75);
          }
        } catch (cropErr) {
          console.warn('Aperture crop notice:', cropErr);
        }
        return '';
      };

      // INTELLIGENT PHOTO APERTURE DETECTION ENGINE:
      // Group non-text content layers into spatial clusters to find true photo slots vs. decorative clipart.
      const pixelContentLayers = allLayers.filter((l) => {
        if (!l || l.hidden || l.text) return false;
        const lLeft = typeof l.left === 'number' ? l.left : 0;
        const lTop = typeof l.top === 'number' ? l.top : 0;
        const lRight = typeof l.right === 'number' ? l.right : docWidth;
        const lBottom = typeof l.bottom === 'number' ? l.bottom : docHeight;
        const w = lRight - lLeft;
        const h = lBottom - lTop;
        if (w <= 10 || h <= 10) return false;
        const isFull = lLeft <= 10 && lTop <= 10 && lRight >= docWidth - 10 && lBottom >= docHeight - 10;
        const isBg = /background|bg|artboard|base_frame|canvas_bg/i.test(l.name || '');
        return !(isFull && isBg);
      });

      interface ApertureCluster {
        left: number;
        top: number;
        right: number;
        bottom: number;
        cx: number;
        cy: number;
        w: number;
        h: number;
        cxPct: number;
        cyPct: number;
        wPct: number;
        hPct: number;
        layers: any[];
        hasMask: boolean;
        hasClipping: boolean;
      }

      const clusters: ApertureCluster[] = [];
      pixelContentLayers.forEach((l) => {
        const lLeft = typeof l.left === 'number' ? l.left : 0;
        const lTop = typeof l.top === 'number' ? l.top : 0;
        const lRight = typeof l.right === 'number' ? l.right : docWidth;
        const lBottom = typeof l.bottom === 'number' ? l.bottom : docHeight;
        const w = Math.max(1, lRight - lLeft);
        const h = Math.max(1, lBottom - lTop);
        const cx = (lLeft + lRight) / 2;
        const cy = (lTop + lBottom) / 2;
        const cxPct = (cx / docWidth) * 100;
        const cyPct = (cy / docHeight) * 100;
        const wPct = (w / docWidth) * 100;
        const hPct = (h / docHeight) * 100;

        const match = clusters.find(
          (c) =>
            Math.abs(c.cx - cx) < docWidth * 0.03 &&
            Math.abs(c.cy - cy) < docHeight * 0.03 &&
            Math.abs(c.w - w) < docWidth * 0.03 &&
            Math.abs(c.h - h) < docHeight * 0.03
        );

        if (match) {
          match.layers.push(l);
          if (l.mask) match.hasMask = true;
          if (l.clipping) match.hasClipping = true;
        } else {
          clusters.push({
            left: lLeft,
            top: lTop,
            right: lRight,
            bottom: lBottom,
            cx,
            cy,
            w,
            h,
            cxPct,
            cyPct,
            wPct,
            hPct,
            layers: [l],
            hasMask: Boolean(l.mask),
            hasClipping: Boolean(l.clipping),
          });
        }
      });

      // Score each cluster
      const scoredCandidates = clusters.map((c) => {
        let score = 0;
        const combinedNames = c.layers.map((l) => (l.name || '').toLowerCase()).join(' ');

        // 1. Explicit aperture keyword in layer name
        if (
          /photo|slot|image|pic|portrait|couple|baby|insert|cutout|placeholder|avatar|upload|frame_photo|box_photo|img|pic_here|user_photo|aperture|picture|face|subject|person/i.test(
            combinedNames
          )
        ) {
          score += 100;
        }

        // 2. Paired layers sharing same bounding box (e.g., photo + circular frame mask)
        if (c.layers.length > 1) {
          score += 40;
        }

        // 3. Layer mask or Photoshop clipping container
        if (c.hasMask || c.hasClipping) {
          score += 35;
        }

        // 4. Horizontal centrality (central frame layout)
        const distCenterX = Math.abs(c.cxPct - 50);
        if (distCenterX < 10) score += 30;
        else if (distCenterX < 20) score += 15;
        else if (distCenterX > 35) score -= 25; // Peripheral corner icons

        // 5. Proportional aperture dimensions
        if (c.wPct >= 18 && c.wPct <= 75 && c.hPct >= 15 && c.hPct <= 70) {
          score += 25;
        } else if (c.wPct > 85 || c.hPct > 85) {
          score -= 50; // Full-bleed canvas element
        } else if (c.wPct < 15 || c.hPct < 15) {
          score -= 30; // Small icons/stickers
        }

        // 6. Photo aspect ratios (1:1 square/circle, 3:4, 4:3, 2:3)
        const aspect = c.w / c.h;
        const isSquareOrCircle = Math.abs(aspect - 1.0) < 0.15;
        if (isSquareOrCircle) {
          score += 20;
        } else if (
          Math.abs(aspect - 0.75) < 0.15 ||
          Math.abs(aspect - 1.33) < 0.15 ||
          Math.abs(aspect - 0.67) < 0.15 ||
          Math.abs(aspect - 1.5) < 0.15
        ) {
          score += 15;
        }

        // Deduce shape: 1:1 aspect ratio in photo frames is almost always 'circle'
        let shape: FrameCutoutShape = 'rounded';
        if (isSquareOrCircle) {
          shape = 'circle';
        } else {
          shape = inferShapeFromLayerName(combinedNames);
        }

        return {
          cluster: c,
          score,
          shape,
          names: combinedNames,
        };
      });

      // Sort by score descending
      scoredCandidates.sort((a, b) => b.score - a.score);

      // Non-maximum suppression: filter out candidates that overlap with higher-scoring apertures
      const selectedApertures: typeof scoredCandidates = [];
      for (const candidate of scoredCandidates) {
        if (candidate.score < 45) continue;
        const c = candidate.cluster;

        const overlaps = selectedApertures.some((existing) => {
          const ec = existing.cluster;
          const xDist = Math.abs(ec.cxPct - c.cxPct);
          const yDist = Math.abs(ec.cyPct - c.cyPct);
          return xDist < 15 && yDist < 25;
        });

        if (!overlaps) {
          selectedApertures.push(candidate);
        }
      }

      // If no candidate scored >= 45, fall back to the highest scoring candidate if >= 20
      if (selectedApertures.length === 0 && scoredCandidates.length > 0 && scoredCandidates[0].score >= 20) {
        selectedApertures.push(scoredCandidates[0]);
      }

      // Sort top-to-bottom for natural photo slot numbering
      selectedApertures.sort((a, b) => a.cluster.cyPct - b.cluster.cyPct);

      // Convert selected apertures to PhotoSlotConfig
      selectedApertures.forEach((aperture, idx) => {
        const c = aperture.cluster;
        const slotNumber = idx + 1;
        const isTop = c.cyPct < 50;
        const friendlyName = isTop ? 'Baby Photo Slot' : 'Parents Photo Slot';
        const label = selectedApertures.length === 2 ? friendlyName : `Photo Slot ${slotNumber}`;

        const croppedThumbnail = cropApertureThumbnail(c.left, c.top, c.w, c.h);
        const fallbackUrl = 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600';

        photoSlots.push({
          id: `slot-psd-${Date.now().toString(36)}-${slotCounter}`,
          label,
          shape: aperture.shape,
          x: Math.round(c.cxPct),
          y: Math.round(c.cyPct),
          width: Math.round(c.wPct),
          height: Math.round(c.hPct),
          defaultPhotoUrl: croppedThumbnail || fallbackUrl,
          visibility: {
            ...DEFAULT_VISIBILITY,
            userLabel: `Upload ${label}`,
          },
          sourceLayerName: c.layers.map((l) => l.name).join(', '),
        });
        slotCounter++;

        // Remove the layers comprising this aperture from staticLayers to prevent duplicates
        const layerNamesSet = new Set(c.layers.map((l) => (l.name || '').trim().toLowerCase()));
        for (let sIdx = staticLayers.length - 1; sIdx >= 0; sIdx--) {
          const sName = (staticLayers[sIdx].sourceLayerName || '').trim().toLowerCase();
          const sX = staticLayers[sIdx].x;
          const sY = staticLayers[sIdx].y;
          if (
            layerNamesSet.has(sName) ||
            (Math.abs(sX - c.cxPct) < 5 && Math.abs(sY - c.cyPct) < 5)
          ) {
            staticLayers.splice(sIdx, 1);
          }
        }
      });

      // ⚡ AUTOMATED CLEAN BASE ARTWORK GENERATOR:
      // Decomposes PSD layers to render backgrounds, clipart cartoons, borders, and static caption titles,
      // while completely omitting editable customer text layers and aperture sample photos.
      let cleanBaseImageUrl = '';
      if (typeof document !== 'undefined') {
        try {
          const cleanCanvas = document.createElement('canvas');
          cleanCanvas.width = docWidth;
          cleanCanvas.height = docHeight;
          const cleanCtx = cleanCanvas.getContext('2d');

          if (cleanCtx) {
            // Collect names/labels of layers to skip
            const skipTextLayerNames = new Set<string>();
            textZones.forEach((z) => {
              const vis = z.visibility;
              if (!vis || vis.userVisible !== false) {
                if (z.sourceLayerName) skipTextLayerNames.add(z.sourceLayerName.trim().toLowerCase());
                if (z.defaultValue) skipTextLayerNames.add(z.defaultValue.trim().toLowerCase());
              }
            });

            // Identify sample photos in photo apertures
            const aperturePhotoLayerNames = new Set<string>();
            selectedApertures.forEach((aperture) => {
              const clusterLayers = aperture.cluster?.layers || [];
              let largestImgLayer: any = null;
              let maxPixelCount = 0;
              clusterLayers.forEach((l: any) => {
                const w = (l.right || 0) - (l.left || 0);
                const h = (l.bottom || 0) - (l.top || 0);
                const area = w * h;
                const lName = (l.name || '').toLowerCase();
                const isLikelyPhoto = /photo|image|picture|pic|layer\s*1[78]/i.test(lName) || l.mask || l.clipping;
                if (isLikelyPhoto || area > maxPixelCount) {
                  maxPixelCount = area;
                  largestImgLayer = l;
                }
              });
              if (largestImgLayer && largestImgLayer.name) {
                aperturePhotoLayerNames.add(largestImgLayer.name.trim().toLowerCase());
              }
            });

            // Draw all layers from bottom to top
            allLayers.forEach((layer) => {
              if (!layer || layer.hidden) return;
              const lName = (layer.name || '').trim().toLowerCase();

              // Skip editable customer text layers
              if (layer.text && skipTextLayerNames.has(lName)) return;
              if (layer.text && textZones.some((z) => (z.sourceLayerName || '').toLowerCase() === lName && (!z.visibility || z.visibility.userVisible !== false))) {
                return;
              }

              // Skip sample photos inside apertures
              if (aperturePhotoLayerNames.has(lName)) return;

              if (layer.canvas) {
                cleanCtx.save();
                if (layer.opacity !== undefined) {
                  cleanCtx.globalAlpha = layer.opacity;
                }
                if (layer.blendMode && layer.blendMode !== 'normal') {
                  const modeMap: Record<string, GlobalCompositeOperation> = {
                    'screen': 'screen',
                    'multiply': 'multiply',
                    'overlay': 'overlay',
                    'darken': 'darken',
                    'lighten': 'lighten',
                    'color-dodge': 'color-dodge',
                    'color-burn': 'color-burn',
                    'hard-light': 'hard-light',
                    'soft-light': 'soft-light',
                    'difference': 'difference',
                    'exclusion': 'exclusion',
                  };
                  if (modeMap[layer.blendMode]) {
                    cleanCtx.globalCompositeOperation = modeMap[layer.blendMode];
                  }
                }
                cleanCtx.drawImage(layer.canvas, layer.left || 0, layer.top || 0);
                cleanCtx.restore();
              }
            });

            cleanBaseImageUrl = cleanCanvas.toDataURL('image/jpeg', 0.94);
          }
        } catch (cleanCanvasErr) {
          console.warn('Automated clean base generation notice:', cleanCanvasErr);
        }
      }

      // If at least some discrete zones or composite were extracted, return parsed result!
      if (photoSlots.length > 0 || textZones.length > 0 || staticLayers.length > 0 || compositePreviewUrl) {
        return {
          documentDimensions: { width: docWidth, height: docHeight },
          photoSlots,
          textZones,
          staticLayers,
          detectedLayerCount: photoSlots.length + textZones.length + staticLayers.length,
          compositePreviewUrl: compositePreviewUrl || undefined,
          cleanBaseImageUrl: cleanBaseImageUrl || compositePreviewUrl || undefined,
        };
      }
    }
  } catch (agPsdErr) {
    console.warn('ag-psd parsing threw an error, falling back to binary scan:', agPsdErr);
  }

  // FALLBACK: Fast Binary Header Scanner if ag-psd is unavailable
  const dataView = new DataView(arrayBuffer);

  const signature = String.fromCharCode(
    dataView.getUint8(0),
    dataView.getUint8(1),
    dataView.getUint8(2),
    dataView.getUint8(3)
  );

  if (signature !== '8BPS') {
    throw new Error('Invalid Photoshop file. Header signature must be 8BPS.');
  }

  const docHeight = dataView.getUint32(14, false);
  const docWidth = dataView.getUint32(18, false);

  if (docWidth === 0 || docHeight === 0) {
    throw new Error('Corrupted PSD document dimensions.');
  }

  const detectedLayers: PSDParsedLayer[] = [];
  let offset = 26;

  const colorDataLen = dataView.getUint32(offset, false);
  offset += 4 + colorDataLen;

  if (offset + 4 <= arrayBuffer.byteLength) {
    const imgResLen = dataView.getUint32(offset, false);
    offset += 4 + imgResLen;
  }

  if (offset + 4 <= arrayBuffer.byteLength) {
    const layerSectionLen = dataView.getUint32(offset, false);
    offset += 4;

    if (layerSectionLen > 0 && offset + 4 <= arrayBuffer.byteLength) {
      offset += 4; // layerInfoLen
      const layerCount = Math.abs(dataView.getInt16(offset, false));
      offset += 2;

      let cur = offset;
      for (let i = 0; i < layerCount && cur + 16 < arrayBuffer.byteLength; i++) {
        const top = dataView.getInt32(cur, false);
        const left = dataView.getInt32(cur + 4, false);
        const bottom = dataView.getInt32(cur + 8, false);
        const right = dataView.getInt32(cur + 12, false);
        cur += 16;

        const numChannels = dataView.getUint16(cur, false);
        cur += 2 + numChannels * 6;

        if (cur + 4 < arrayBuffer.byteLength) {
          const sig = String.fromCharCode(
            dataView.getUint8(cur),
            dataView.getUint8(cur + 1),
            dataView.getUint8(cur + 2),
            dataView.getUint8(cur + 3)
          );
          if (sig === '8BIM') {
            cur += 12;
            const extraDataLen = dataView.getUint32(cur, false);
            cur += 4;
            const extraEnd = cur + extraDataLen;

            if (cur + 4 <= extraEnd) {
              const maskLen = dataView.getUint32(cur, false);
              cur += 4 + maskLen;
            }

            if (cur + 4 <= extraEnd) {
              const blendLen = dataView.getUint32(cur, false);
              cur += 4 + blendLen;
            }

            if (cur < extraEnd) {
              const nameLen = dataView.getUint8(cur);
              cur += 1;
              let name = '';
              for (let n = 0; n < nameLen && cur < extraEnd; n++) {
                name += String.fromCharCode(dataView.getUint8(cur));
                cur++;
              }
              const pad = (nameLen + 1) % 4 === 0 ? 0 : 4 - ((nameLen + 1) % 4);
              cur += pad;

              if (name && (right > left || bottom > top)) {
                const layerClassification = classifyPSDLayer(name);
                detectedLayers.push({
                  name,
                  top,
                  left,
                  bottom,
                  right,
                  width: Math.max(10, right - left),
                  height: Math.max(10, bottom - top),
                  type: layerClassification.type,
                  shape: inferShapeFromLayerName(name),
                });
              }
            }
            cur = extraEnd;
          }
        }
      }
    }
  }

  const fallbackPhotoSlots: PhotoSlotConfig[] = [];
  const fallbackTextZones: TextZoneConfig[] = [];

  let sCount = 1;
  let tCount = 1;

  for (const layer of detectedLayers) {
    if (layer.type === 'background') continue;

    const xPct = Math.round((((layer.left + layer.right) / 2) / docWidth) * 100);
    const yPct = Math.round((((layer.top + layer.bottom) / 2) / docHeight) * 100);
    const wPct = Math.min(95, Math.max(10, Math.round((layer.width / docWidth) * 100)));
    const hPct = Math.min(95, Math.max(5, Math.round((layer.height / docHeight) * 100)));

    if (layer.type === 'photo') {
      fallbackPhotoSlots.push({
        id: `slot-psd-${Date.now().toString(36)}-${sCount}`,
        label: layer.name || `Photo Slot ${sCount}`,
        shape: layer.shape || inferShapeFromLayerName(layer.name),
        x: Math.max(10, Math.min(90, xPct)),
        y: Math.max(10, Math.min(90, yPct)),
        width: wPct,
        height: hPct,
        defaultPhotoUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600',
        visibility: {
          ...DEFAULT_VISIBILITY,
          userLabel: `Upload ${layer.name.replace(/[_-]/g, ' ')}`,
        },
        sourceLayerName: layer.name,
      });
      sCount++;
    } else {
      const classified = classifyPsdTextLayer(layer.textValue || 'Custom Text', layer.name || '');
      fallbackTextZones.push({
        id: `text-psd-${Date.now().toString(36)}-${tCount}`,
        label: classified.label,
        defaultValue: classified.defaultValue,
        x: Math.max(10, Math.min(90, xPct)),
        y: Math.max(10, Math.min(90, yPct)),
        maxWidth: Math.min(90, Math.max(40, wPct + 10)),
        fontSize: layer.type === 'calendar' ? 16 : 26,
        fontFamily: layer.type === 'calendar' ? 'Jost' : 'Playfair Display',
        color: '#160E4B',
        align: 'center',
        type: classified.type,
        isCalendar: classified.isCalendar,
        visibility: {
          ...DEFAULT_VISIBILITY,
          userVisible: classified.userVisible,
          userEditable: classified.userVisible,
          userLabel: classified.userLabel,
        },
        sourceLayerName: layer.name,
      });
      tCount++;
    }
  }

  return {
    documentDimensions: { width: docWidth, height: docHeight },
    photoSlots: fallbackPhotoSlots,
    textZones: fallbackTextZones,
    staticLayers: [],
    detectedLayerCount: fallbackPhotoSlots.length + fallbackTextZones.length,
  };
}
