import { PhotoSlotConfig, TextZoneConfig, FrameCutoutShape } from '../../../types/template';
import { DEFAULT_VISIBILITY } from './templateDefaults';

export interface PSDParsedLayer {
  name: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  type: 'photo' | 'text' | 'calendar' | 'background';
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
  detectedLayerCount: number;
  compositePreviewUrl?: string;
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
export async function parsePSDFileBinary(file: File): Promise<PSDImportResult> {
  const arrayBuffer = await file.arrayBuffer();
  const dataView = new DataView(arrayBuffer);

  // 1. Verify PSD Signature ('8BPS' = 0x38425053)
  const signature = String.fromCharCode(
    dataView.getUint8(0),
    dataView.getUint8(1),
    dataView.getUint8(2),
    dataView.getUint8(3)
  );

  if (signature !== '8BPS') {
    throw new Error('Invalid Photoshop file. Header signature must be 8BPS.');
  }

  // Height & Width in Big-Endian
  const docHeight = dataView.getUint32(14, false);
  const docWidth = dataView.getUint32(18, false);

  if (docWidth === 0 || docHeight === 0) {
    throw new Error('Corrupted PSD document dimensions.');
  }

  // 2. Parse Layer records by inspecting UTF-8 layer strings & bounding box structures
  // Fast binary scan for layer record signatures ('8BIM' or layer name chunks)
  const uint8 = new Uint8Array(arrayBuffer);
  const detectedLayers: PSDParsedLayer[] = [];

  let offset = 26; // Skip header

  // Skip Color Mode Data Section
  const colorDataLen = dataView.getUint32(offset, false);
  offset += 4 + colorDataLen;

  // Skip Image Resources Section
  if (offset + 4 <= arrayBuffer.byteLength) {
    const imgResLen = dataView.getUint32(offset, false);
    offset += 4 + imgResLen;
  }

  // Layer and Mask Section
  if (offset + 4 <= arrayBuffer.byteLength) {
    const layerSectionLen = dataView.getUint32(offset, false);
    const layerSectionEnd = offset + 4 + layerSectionLen;
    offset += 4;

    if (layerSectionLen > 0 && offset + 4 <= arrayBuffer.byteLength) {
      // Layer info length
      const layerInfoLen = dataView.getUint32(offset, false);
      offset += 4;
      const layerCount = Math.abs(dataView.getInt16(offset, false));
      offset += 2;

      // Extract each layer bounding box
      let cur = offset;
      for (let i = 0; i < layerCount && cur + 16 < arrayBuffer.byteLength; i++) {
        const top = dataView.getInt32(cur, false);
        const left = dataView.getInt32(cur + 4, false);
        const bottom = dataView.getInt32(cur + 8, false);
        const right = dataView.getInt32(cur + 12, false);
        cur += 16;

        const numChannels = dataView.getUint16(cur, false);
        cur += 2 + numChannels * 6; // Channel info

        // Check for '8BIM' blend mode signature
        if (cur + 4 < arrayBuffer.byteLength) {
          const sig = String.fromCharCode(
            dataView.getUint8(cur),
            dataView.getUint8(cur + 1),
            dataView.getUint8(cur + 2),
            dataView.getUint8(cur + 3)
          );
          if (sig === '8BIM') {
            cur += 12; // Skip blend mode, opacity, clipping, flags
            const extraDataLen = dataView.getUint32(cur, false);
            cur += 4;
            const extraEnd = cur + extraDataLen;

            // Layer mask info length
            if (cur + 4 <= extraEnd) {
              const maskLen = dataView.getUint32(cur, false);
              cur += 4 + maskLen;
            }

            // Layer blending ranges length
            if (cur + 4 <= extraEnd) {
              const blendLen = dataView.getUint32(cur, false);
              cur += 4 + blendLen;
            }

            // Layer name (Pascal string, padded to 4 bytes)
            if (cur < extraEnd) {
              const nameLen = dataView.getUint8(cur);
              cur += 1;
              let name = '';
              for (let n = 0; n < nameLen && cur < extraEnd; n++) {
                name += String.fromCharCode(dataView.getUint8(cur));
                cur++;
              }
              // Padding to multiple of 4
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

  // If binary layer header parsing did not yield discrete layers (e.g. flattened or protected PSD),
  // fallback to structural heuristic extraction based on standard document geometry.
  if (detectedLayers.length === 0) {
    detectedLayers.push(
      {
        name: 'Photo_Slot_1',
        left: Math.round(docWidth * 0.15),
        top: Math.round(docHeight * 0.12),
        right: Math.round(docWidth * 0.85),
        bottom: Math.round(docHeight * 0.58),
        width: Math.round(docWidth * 0.7),
        height: Math.round(docHeight * 0.46),
        type: 'photo',
        shape: 'rounded',
      },
      {
        name: 'Headline_Text_Layer',
        left: Math.round(docWidth * 0.1),
        top: Math.round(docHeight * 0.64),
        right: Math.round(docWidth * 0.9),
        bottom: Math.round(docHeight * 0.72),
        width: Math.round(docWidth * 0.8),
        height: Math.round(docHeight * 0.08),
        type: 'text',
        textValue: 'Personalized Title',
      },
      {
        name: 'Calendar_Date_Layer',
        left: Math.round(docWidth * 0.2),
        top: Math.round(docHeight * 0.74),
        right: Math.round(docWidth * 0.8),
        bottom: Math.round(docHeight * 0.82),
        width: Math.round(docWidth * 0.6),
        height: Math.round(docHeight * 0.08),
        type: 'calendar',
        textValue: '14 Feb 2026',
      }
    );
  }

  // 3. Convert parsed layers to standard Template PhotoSlots & TextZones (percentage coordinates 0-100%)
  const photoSlots: PhotoSlotConfig[] = [];
  const textZones: TextZoneConfig[] = [];

  let slotCounter = 1;
  let textCounter = 1;

  for (const layer of detectedLayers) {
    if (layer.type === 'background') continue;

    // Center percentage coordinates
    const xPct = Math.round((((layer.left + layer.right) / 2) / docWidth) * 100);
    const yPct = Math.round((((layer.top + layer.bottom) / 2) / docHeight) * 100);
    const wPct = Math.min(95, Math.max(10, Math.round((layer.width / docWidth) * 100)));
    const hPct = Math.min(95, Math.max(5, Math.round((layer.height / docHeight) * 100)));

    if (layer.type === 'photo') {
      photoSlots.push({
        id: `slot-psd-${Date.now().toString(36)}-${slotCounter}`,
        label: layer.name || `Photo Slot ${slotCounter}`,
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
      slotCounter++;
    } else {
      // Text or Calendar Zone
      const isCalendar = layer.type === 'calendar';
      textZones.push({
        id: `text-psd-${Date.now().toString(36)}-${textCounter}`,
        label: layer.name || (isCalendar ? `Calendar Zone ${textCounter}` : `Text Zone ${textCounter}`),
        defaultValue: layer.textValue || (isCalendar ? '14 Feb 2026' : 'Custom Text'),
        x: Math.max(10, Math.min(90, xPct)),
        y: Math.max(10, Math.min(90, yPct)),
        maxWidth: Math.min(90, Math.max(40, wPct + 10)),
        fontSize: isCalendar ? 16 : 26,
        fontFamily: isCalendar ? 'Jost' : 'Playfair Display',
        color: '#160E4B',
        align: 'center',
        type: isCalendar ? 'calendar' : 'text',
        isCalendar,
        visibility: {
          ...DEFAULT_VISIBILITY,
          userLabel: isCalendar ? 'Milestone Date (Calendar)' : layer.name.replace(/[_-]/g, ' '),
        },
        sourceLayerName: layer.name,
      });
      textCounter++;
    }
  }

  return {
    documentDimensions: { width: docWidth, height: docHeight },
    photoSlots,
    textZones,
    detectedLayerCount: detectedLayers.length,
  };
}
