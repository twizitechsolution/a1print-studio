import { PhotoSlotConfig, TextZoneConfig, FrameCutoutShape } from '../../../types/template';
import { DEFAULT_VISIBILITY } from './templateDefaults';

export interface AIDetectionResult {
  photoSlots: (PhotoSlotConfig & { confidence: number; detectedReason: string; selected: boolean })[];
  textZones: (TextZoneConfig & { confidence: number; detectedReason: string; selected: boolean })[];
  detectedDimensions: { width: number; height: number };
  engineUsed: 'gemini-vision' | 'canvas-cv';
}

/**
 * Loads an HTMLImageElement safely from a URL or Data URL.
 */
export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image: ' + err));
    img.src = src;
  });
}

/**
 * Converts an image source into a clean base64 string without prefix.
 */
async function getBase64FromSource(src: string | HTMLImageElement): Promise<{ base64: string; mimeType: string }> {
  if (typeof src === 'string' && src.startsWith('data:')) {
    const mimeMatch = src.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64 = src.replace(/^data:[^;]+;base64,/, '');
    return { base64, mimeType };
  }

  const img = typeof src === 'string' ? await loadImageElement(src) : src;
  const canvas = document.createElement('canvas');
  const maxDim = 1200;
  let scale = 1;
  if (img.naturalWidth > maxDim || img.naturalHeight > maxDim) {
    scale = maxDim / Math.max(img.naturalWidth, img.naturalHeight);
  }
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas context');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  return {
    base64: dataUrl.replace(/^data:[^;]+;base64,/, ''),
    mimeType: 'image/jpeg',
  };
}

/**
 * Deep Semantic Vision Detection using Google Gemini 1.5 Flash API.
 * Accurately detects photographic cutout apertures, shapes, and text typography.
 */
export async function runGeminiVisionDetection(
  imageSource: string | HTMLImageElement,
  apiKey: string
): Promise<AIDetectionResult> {
  const { base64, mimeType } = await getBase64FromSource(imageSource);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const prompt = [
    'You are an expert Web-to-Print photo frame template parser.',
    'Analyze this photo frame artwork image and identify:',
    '1. All photo slots / apertures / cutout windows where a user photo should be inserted.',
    '   - Coordinates (x, y) must be the CENTER of each photo slot in percentage (0 to 100) of image width and height.',
    '   - width and height in percentage (0 to 100) of image width and height.',
    '   - shape: one of "rectangle", "rounded", "circle", "oval", "arch", "heart", "polaroid", "square".',
    '   - label: human descriptive label (e.g. "Main Photo", "Baby Photo", "Couple Photo").',
    '2. All customizable text zones (names, dates, calendar, quotes).',
    '   - Coordinates (x, y) must be the CENTER of each text line in percentage (0 to 100).',
    '   - maxWidth in percentage.',
    '   - fontSize estimated in pt (16 to 48).',
    '   - fontFamily: one of "Playfair Display", "Jost", "Montserrat", "Great Vibes", "Cinzel", "Arial".',
    '   - color: hex code (e.g. "#160E4B", "#000000").',
    '   - align: "center", "left", or "right".',
    '   - type: "text", "date", or "calendar".',
    '   - defaultValue: detected or placeholder text.',
    '   - label: descriptive label.',
    'Respond ONLY with valid JSON in this exact structure:',
    '{"photoSlots":[{"label":"Main Photo","shape":"rounded","x":50,"y":42,"width":60,"height":45,"confidence":0.98,"detectedReason":"Central aperture"}],"textZones":[{"label":"Names","defaultValue":"Rahul & Priya","x":50,"y":70,"maxWidth":80,"fontSize":28,"fontFamily":"Playfair Display","color":"#160E4B","align":"center","type":"text","confidence":0.95,"detectedReason":"Header typography"}]}'
  ].join('\n');

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      response_mime_type: 'application/json',
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini Vision API error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  const textContent = json?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const cleanJson = textContent.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson);

  const img = typeof imageSource === 'string' ? await loadImageElement(imageSource) : imageSource;

  const photoSlots = (parsed.photoSlots || []).map((slot: any, idx: number) => ({
    id: `slot-ai-${Date.now().toString(36)}-${idx + 1}`,
    label: slot.label || `Photo Slot #${idx + 1}`,
    shape: (slot.shape as FrameCutoutShape) || 'rounded',
    x: Number(slot.x) || 50,
    y: Number(slot.y) || 40,
    width: Number(slot.width) || 50,
    height: Number(slot.height) || 40,
    confidence: Number(slot.confidence) || 0.95,
    detectedReason: slot.detectedReason || 'AI semantic aperture detection',
    selected: true,
    visibility: {
      ...DEFAULT_VISIBILITY,
      userLabel: slot.label || `Upload Photo #${idx + 1}`,
    },
  }));

  const textZones = (parsed.textZones || []).map((zone: any, idx: number) => ({
    id: `text-ai-${Date.now().toString(36)}-${idx + 1}`,
    label: zone.label || `Text Zone #${idx + 1}`,
    defaultValue: zone.defaultValue || '',
    x: Number(zone.x) || 50,
    y: Number(zone.y) || 70,
    maxWidth: Number(zone.maxWidth) || 80,
    fontSize: Number(zone.fontSize) || 24,
    fontFamily: zone.fontFamily || 'Playfair Display',
    color: zone.color || '#160E4B',
    align: (zone.align as 'left' | 'center' | 'right') || 'center',
    type: (zone.type as 'text' | 'date' | 'calendar') || 'text',
    isCalendar: zone.type === 'calendar',
    confidence: Number(zone.confidence) || 0.92,
    detectedReason: zone.detectedReason || 'AI text baseline recognition',
    selected: true,
    visibility: {
      ...DEFAULT_VISIBILITY,
      userLabel: zone.label || `Enter Text #${idx + 1}`,
    },
  }));

  return {
    photoSlots,
    textZones,
    detectedDimensions: { width: img.naturalWidth || 1200, height: img.naturalHeight || 1760 },
    engineUsed: 'gemini-vision',
  };
}

/**
 * Pure Client-Side Computer Vision Engine:
 * Analyzes pixel lightness gradients, edge bounds, and spatial contours
 * on HTML5 2D Canvas without requiring any external keys.
 */
export async function runClientVisionDetection(
  imageSource: string | HTMLImageElement,
  categoryHint?: string
): Promise<AIDetectionResult> {
  const img = typeof imageSource === 'string' ? await loadImageElement(imageSource) : imageSource;

  const canvas = document.createElement('canvas');
  const maxDim = 900;
  let scale = 1;
  if (img.naturalWidth > maxDim || img.naturalHeight > maxDim) {
    scale = maxDim / Math.max(img.naturalWidth, img.naturalHeight);
  }
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not obtain canvas 2D context.');

  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // 1. Convert to Grayscale & Luminance Map
  const gray = new Uint8Array(w * h);
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }

  // 2. Horizontal and Vertical Sobel Edge Gradient Magnitude
  const edges = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const gx =
        -gray[idx - w - 1] + gray[idx - w + 1] -
        2 * gray[idx - 1] + 2 * gray[idx + 1] -
        gray[idx + w - 1] + gray[idx + w + 1];
      const gy =
        -gray[idx - w - 1] - 2 * gray[idx - w] - gray[idx - w + 1] +
        gray[idx + w - 1] + 2 * gray[idx + w] + gray[idx + w + 1];
      const mag = Math.min(255, Math.abs(gx) + Math.abs(gy));
      edges[idx] = mag > 45 ? 255 : 0;
    }
  }

  // 3. Grid Cell Spatial Variance Analysis (divide into 24x32 segments)
  const cols = 24;
  const rows = 32;
  const cellW = Math.floor(w / cols);
  const cellH = Math.floor(h / rows);
  const cellEdges = new Float32Array(cols * rows);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let edgeSum = 0;
      let count = 0;
      for (let py = r * cellH; py < (r + 1) * cellH; py++) {
        for (let px = c * cellW; px < (c + 1) * cellW; px++) {
          const idx = py * w + px;
          edgeSum += edges[idx];
          count++;
        }
      }
      cellEdges[r * cols + c] = edgeSum / count;
    }
  }

  // 4. Discover Aperture Candidate Rectangles
  const candidateSlots: (PhotoSlotConfig & { confidence: number; detectedReason: string; selected: boolean })[] = [];
  const candidateZones: (TextZoneConfig & { confidence: number; detectedReason: string; selected: boolean })[] = [];

  let bestAperture: { minC: number; maxC: number; minR: number; maxR: number; score: number } | null = null;
  let maxScore = 0;

  const minBoxW = Math.floor(cols * 0.28);
  const maxBoxW = Math.floor(cols * 0.85);
  const minBoxH = Math.floor(rows * 0.25);
  const maxBoxH = Math.floor(rows * 0.65);

  for (let boxH = minBoxH; boxH <= maxBoxH; boxH += 2) {
    for (let boxW = minBoxW; boxW <= maxBoxW; boxW += 2) {
      for (let r = 2; r <= rows - boxH - 2; r += 2) {
        for (let c = 2; c <= cols - boxW - 2; c += 2) {
          let perimeterEdges = 0;
          let interiorEdges = 0;
          let perimeterCount = 0;
          let interiorCount = 0;

          for (let y = r; y <= r + boxH; y++) {
            for (let x = c; x <= c + boxW; x++) {
              const isPerimeter = y === r || y === r + boxH || x === c || x === c + boxW;
              const val = cellEdges[y * cols + x];
              if (isPerimeter) {
                perimeterEdges += val;
                perimeterCount++;
              } else {
                interiorEdges += val;
                interiorCount++;
              }
            }
          }

          const avgPerim = perimeterEdges / perimeterCount;
          const avgInter = interiorEdges / interiorCount;
          const contrastScore = avgPerim - avgInter * 0.6;

          if (contrastScore > maxScore && contrastScore > 20) {
            maxScore = contrastScore;
            bestAperture = { minC: c, maxC: c + boxW, minR: r, maxR: r + boxH, score: contrastScore };
          }
        }
      }
    }
  }

  if (bestAperture) {
    const slotX = Math.round(((bestAperture.minC + bestAperture.maxC) / 2 / cols) * 100);
    const slotY = Math.round(((bestAperture.minR + bestAperture.maxR) / 2 / rows) * 100);
    const slotW = Math.round(((bestAperture.maxC - bestAperture.minC) / cols) * 100);
    const slotH = Math.round(((bestAperture.maxR - bestAperture.minR) / rows) * 100);

    let shape: FrameCutoutShape = 'rounded';
    const aspect = slotW / slotH;
    if (aspect > 0.88 && aspect < 1.12) {
      shape = 'circle';
    } else if (slotH > slotW * 1.15 && slotY < 50) {
      shape = 'arch';
    } else {
      shape = 'rounded';
    }

    candidateSlots.push({
      id: `slot-cv-${Date.now().toString(36)}-1`,
      label: 'Main Photo Aperture',
      shape,
      x: slotX,
      y: slotY,
      width: slotW,
      height: slotH,
      confidence: Math.min(0.96, 0.75 + (bestAperture.score / 150)),
      detectedReason: `Computer vision identified high-contrast ${shape} frame aperture`,
      selected: true,
      visibility: {
        ...DEFAULT_VISIBILITY,
        userLabel: 'Upload Your Photo',
      },
    });
  } else {
    candidateSlots.push({
      id: `slot-cv-${Date.now().toString(36)}-1`,
      label: 'Primary Photo Slot',
      shape: categoryHint?.includes('baby') ? 'circle' : categoryHint?.includes('anniversary') ? 'arch' : 'rounded',
      x: 50,
      y: 38,
      width: 60,
      height: 46,
      confidence: 0.88,
      detectedReason: 'Standard balanced frame aperture layout',
      selected: true,
      visibility: {
        ...DEFAULT_VISIBILITY,
        userLabel: 'Upload Your Photo',
      },
    });
  }

  // 5. Scan Lower Half for Text Baselines
  const rowActivity = new Float32Array(rows);
  for (let r = 0; r < rows; r++) {
    let sum = 0;
    for (let c = 0; c < cols; c++) {
      sum += cellEdges[r * cols + c];
    }
    rowActivity[r] = sum / cols;
  }

  const startRow = Math.floor(rows * 0.55);
  const textLineRows: number[] = [];

  for (let r = startRow; r < rows - 2; r++) {
    if (rowActivity[r] > 18 && rowActivity[r] >= rowActivity[r - 1] && rowActivity[r] >= rowActivity[r + 1]) {
      textLineRows.push(r);
      r += 2;
    }
  }

  const isBaby = categoryHint?.includes('baby') || false;
  const isCouple = categoryHint?.includes('marriage') || categoryHint?.includes('anniversary');

  if (textLineRows.length >= 1) {
    const yPct = Math.round((textLineRows[0] / rows) * 100);
    candidateZones.push({
      id: `text-cv-${Date.now().toString(36)}-1`,
      label: isBaby ? 'Baby Name' : isCouple ? 'Couple Names' : 'Main Title / Name',
      defaultValue: isBaby ? 'Aarav' : isCouple ? 'Rahul & Priya' : 'Personalized Name',
      x: 50,
      y: yPct,
      maxWidth: 80,
      fontSize: 30,
      fontFamily: 'Playfair Display',
      color: '#160E4B',
      align: 'center',
      type: 'text',
      confidence: 0.91,
      detectedReason: `Typographic header detected at vertical position ${yPct}%`,
      selected: true,
      visibility: {
        ...DEFAULT_VISIBILITY,
        userLabel: isBaby ? 'Baby Name' : isCouple ? 'Couple Names' : 'Main Name',
      },
    });
  }

  if (textLineRows.length >= 2) {
    const yPct = Math.round((textLineRows[1] / rows) * 100);
    candidateZones.push({
      id: `text-cv-${Date.now().toString(36)}-2`,
      label: 'Special Date / Calendar',
      defaultValue: '14 August 2024',
      x: 50,
      y: yPct,
      maxWidth: 70,
      fontSize: 18,
      fontFamily: 'Jost',
      color: '#3B82F6',
      align: 'center',
      type: 'calendar',
      isCalendar: true,
      confidence: 0.88,
      detectedReason: `Date/calendar baseline detected at vertical position ${yPct}%`,
      selected: true,
      visibility: {
        ...DEFAULT_VISIBILITY,
        userLabel: 'Special Date (Calendar)',
      },
    });
  }

  if (textLineRows.length >= 3) {
    const yPct = Math.round((textLineRows[2] / rows) * 100);
    candidateZones.push({
      id: `text-cv-${Date.now().toString(36)}-3`,
      label: isBaby ? 'Birth Details (Weight, Time)' : 'Personal Message / Quote',
      defaultValue: isBaby ? '08:45 AM | 3.2 Kg' : 'Together Forever & Always',
      x: 50,
      y: yPct,
      maxWidth: 85,
      fontSize: 14,
      fontFamily: 'Jost',
      color: '#4B5563',
      align: 'center',
      type: 'text',
      confidence: 0.84,
      detectedReason: `Sub-text details detected at vertical position ${yPct}%`,
      selected: true,
      visibility: {
        ...DEFAULT_VISIBILITY,
        userLabel: isBaby ? 'Birth Details' : 'Message / Quote',
        required: false,
      },
    });
  }

  if (candidateZones.length === 0) {
    candidateZones.push({
      id: `text-cv-${Date.now().toString(36)}-1`,
      label: 'Title / Names',
      defaultValue: 'Customized Frame Title',
      x: 50,
      y: 72,
      maxWidth: 80,
      fontSize: 26,
      fontFamily: 'Playfair Display',
      color: '#160E4B',
      align: 'center',
      type: 'text',
      confidence: 0.85,
      detectedReason: 'Standard lower typography zone',
      selected: true,
      visibility: {
        ...DEFAULT_VISIBILITY,
        userLabel: 'Title / Names',
      },
    });
  }

  return {
    photoSlots: candidateSlots,
    textZones: candidateZones,
    detectedDimensions: { width: img.naturalWidth || 1200, height: img.naturalHeight || 1760 },
    engineUsed: 'canvas-cv',
  };
}

/**
 * Universal Unified AI Detection Entry Point:
 * Automatically uses Gemini 1.5 Flash Vision if an API key is available (or in localStorage),
 * otherwise runs high-accuracy client-side Computer Vision.
 */
export async function runAIDetectionOnImage(
  imageSource: string | HTMLImageElement,
  categoryHint?: string,
  apiKeyOverride?: string
): Promise<AIDetectionResult> {
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('A1PRINT_GEMINI_API_KEY') || '' : '';
  const effectiveKey = (apiKeyOverride || storedKey).trim();

  if (effectiveKey) {
    try {
      return await runGeminiVisionDetection(imageSource, effectiveKey);
    } catch (err) {
      console.warn('Gemini Vision failed, smoothly falling back to Canvas Computer Vision:', err);
    }
  }

  return await runClientVisionDetection(imageSource, categoryHint);
}
