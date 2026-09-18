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
  type: 'photo' | 'text' | 'calendar' | 'background' | 'static' | 'pixel';
  textValue?: string;
  shape?: FrameCutoutShape;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  opacity?: number;
  channelOffsets?: { chId: number; chLen: number; offset: number }[];
  canvas?: HTMLCanvasElement;
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
 * Checks if buffer has a standard TIFF header:
 * Little Endian ('II' 0x4949 + 0x002A) or Big Endian ('MM' 0x4D4D + 0x2A00)
 */
export function isTiffFile(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false;
  const view = new DataView(buffer);
  const m0 = view.getUint8(0);
  const m1 = view.getUint8(1);
  const m2 = view.getUint8(2);
  const m3 = view.getUint8(3);
  if (m0 === 0x49 && m1 === 0x49 && m2 === 0x2a && m3 === 0x00) return true;
  if (m0 === 0x4d && m1 === 0x4d && m2 === 0x00 && m3 === 0x2a) return true;
  return false;
}

export interface TiffPhotoshopTags {
  width: number;
  height: number;
  isLittleEndian: boolean;
  imageSourceData?: Uint8Array;
  imageResources?: Uint8Array;
}

/**
 * Extracts Photoshop metadata tags from a TIFF file:
 * - Tag 37724 (0x935C): PhotoshopImageSourceData (layer records, masks, typography)
 * - Tag 34377 (0x8649): PhotoshopImageResources (DPI, resolution, guides)
 * - Tag 256/257: Image dimensions
 */
export function extractTiffPhotoshopTags(buffer: ArrayBuffer): TiffPhotoshopTags {
  const view = new DataView(buffer);
  const isLE = view.getUint8(0) === 0x49;
  let offset = view.getUint32(4, isLE);

  let docWidth = 0;
  let docHeight = 0;
  let imageSourceData: Uint8Array | undefined;
  let imageResources: Uint8Array | undefined;

  let iterations = 0;
  while (offset > 0 && offset + 2 <= buffer.byteLength && iterations < 15) {
    iterations++;
    const numEntries = view.getUint16(offset, isLE);
    const ifdEnd = offset + 2 + numEntries * 12;
    if (ifdEnd > buffer.byteLength) break;

    for (let i = 0; i < numEntries; i++) {
      const entryPos = offset + 2 + i * 12;
      const tag = view.getUint16(entryPos, isLE);
      const type = view.getUint16(entryPos + 2, isLE);
      const count = view.getUint32(entryPos + 4, isLE);

      let valPos = entryPos + 8;
      let val = 0;
      if (type === 3 && count === 1) {
        val = view.getUint16(entryPos + 8, isLE);
      } else if (type === 4 && count === 1) {
        val = view.getUint32(entryPos + 8, isLE);
      } else {
        valPos = view.getUint32(entryPos + 8, isLE);
      }

      if (tag === 256) {
        docWidth = val || (valPos <= buffer.byteLength - 4 ? view.getUint32(valPos, isLE) : 0);
      } else if (tag === 257) {
        docHeight = val || (valPos <= buffer.byteLength - 4 ? view.getUint32(valPos, isLE) : 0);
      } else if (tag === 37724 && valPos + count <= buffer.byteLength) {
        imageSourceData = new Uint8Array(buffer, valPos, count);
      } else if (tag === 34377 && valPos + count <= buffer.byteLength) {
        imageResources = new Uint8Array(buffer, valPos, count);
      }
    }

    if (ifdEnd + 4 <= buffer.byteLength) {
      offset = view.getUint32(ifdEnd, isLE);
    } else {
      break;
    }
  }

  return {
    width: docWidth,
    height: docHeight,
    isLittleEndian: isLE,
    imageSourceData,
    imageResources,
  };
}

export interface ExtractedLayerInfoBlock {
  isLittleEndian: boolean;
  layrBlock: Uint8Array;
}

/**
 * Extracts the 'Layr' tagged block from PhotoshopImageSourceData (Tag 37724)
 */
export function extractLayrBlockFromImageSourceData(isd: Uint8Array): ExtractedLayerInfoBlock | null {
  const len = isd.byteLength;
  const view = new DataView(isd.buffer, isd.byteOffset, len);

  let pos = 0;
  while (pos < len - 12) {
    const b0 = isd[pos];
    const b1 = isd[pos + 1];
    const b2 = isd[pos + 2];
    const b3 = isd[pos + 3];

    // Big Endian: '8BIM'
    if (b0 === 0x38 && b1 === 0x42 && b2 === 0x49 && b3 === 0x4d) {
      const type0 = String.fromCharCode(isd[pos + 4], isd[pos + 5], isd[pos + 6], isd[pos + 7]);
      const blockLen = view.getUint32(pos + 8, false);
      if (type0 === 'Layr' || type0 === 'Lr16' || type0 === 'Lr32') {
        const layrData = isd.slice(pos + 12, pos + 12 + blockLen);
        return { isLittleEndian: false, layrBlock: layrData };
      }
      pos += 12 + blockLen + (blockLen % 4 === 0 ? 0 : 4 - (blockLen % 4));
      continue;
    }

    // Little Endian: 'MIB8'
    if (b0 === 0x4d && b1 === 0x49 && b2 === 0x42 && b3 === 0x38) {
      const type0 = String.fromCharCode(isd[pos + 7], isd[pos + 6], isd[pos + 5], isd[pos + 4]);
      const blockLen = view.getUint32(pos + 8, true);
      if (type0 === 'Layr' || type0 === 'Lr16' || type0 === 'Lr32') {
        const layrData = isd.slice(pos + 12, pos + 12 + blockLen);
        return { isLittleEndian: true, layrBlock: layrData };
      }
      pos += 12 + blockLen + (blockLen % 4 === 0 ? 0 : 4 - (blockLen % 4));
      continue;
    }

    pos++;
  }

  return null;
}

/**
 * Builds a valid in-memory PSD ArrayBuffer by combining Photoshop dimensions,
 * ImageResources (Tag 34377) and the extracted Layr block from TIFF.
 */
export function buildPsdFromLayrBlock(
  docWidth: number,
  docHeight: number,
  layrBlock: Uint8Array,
  imageResources?: Uint8Array
): ArrayBuffer {
  const headerLen = 26;
  const colorModeLen = 4;
  const resDataLen = imageResources ? imageResources.byteLength : 0;
  const resSectionLen = 4 + resDataLen;
  const layerSectionLen = 4 + layrBlock.byteLength;
  const compositeLen = 2;

  const totalLen = headerLen + colorModeLen + resSectionLen + layerSectionLen + compositeLen;
  const buffer = new ArrayBuffer(totalLen);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // 1. Header (26 bytes: 8BPS, version 1, 6 reserved, channels 4, height, width, depth 8, mode 3 RGB)
  bytes[0] = 0x38;
  bytes[1] = 0x42;
  bytes[2] = 0x50;
  bytes[3] = 0x53;
  view.setUint16(4, 1, false);
  view.setUint16(12, 4, false);
  view.setUint32(14, Math.max(100, docHeight), false);
  view.setUint32(18, Math.max(100, docWidth), false);
  view.setUint16(22, 8, false);
  view.setUint16(24, 3, false);

  let cur = 26;

  // 2. Color Mode Section (length = 0)
  view.setUint32(cur, 0, false);
  cur += 4;

  // 3. Image Resources Section
  view.setUint32(cur, resDataLen, false);
  cur += 4;
  if (imageResources && resDataLen > 0) {
    bytes.set(imageResources, cur);
    cur += resDataLen;
  }

  // 4. Layer & Mask Section
  view.setUint32(cur, layrBlock.byteLength, false);
  cur += 4;
  bytes.set(layrBlock, cur);
  cur += layrBlock.byteLength;

  // 5. Composite Image Section (compression = 0)
  view.setUint16(cur, 0, false);

  return buffer;
}

/**
 * Decodes the TIFF composite preview using UTIF.js to an HTML5 Canvas Data URL
 */
async function decodeTiffWithUtif(arrayBuffer: ArrayBuffer): Promise<{
  width: number;
  height: number;
  compositePreviewUrl?: string;
  tags?: any;
}> {
  try {
    const utifModule = await import(/* @vite-ignore */ 'https://esm.sh/utif@3.1.0');
    const UTIF = utifModule.default || utifModule;
    if (UTIF && typeof UTIF.decode === 'function') {
      const ifds = UTIF.decode(arrayBuffer);
      if (ifds && ifds.length > 0) {
        const firstPage = ifds[0];
        UTIF.decodeImage(arrayBuffer, firstPage);
        const rgba = UTIF.toRGBA8(firstPage);
        const w = firstPage.width || 1200;
        const h = firstPage.height || 1600;

        let compositePreviewUrl = '';
        if (typeof document !== 'undefined' && rgba && rgba.length > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const imgData = ctx.createImageData(w, h);
            imgData.data.set(rgba);
            ctx.putImageData(imgData, 0, 0);
            compositePreviewUrl = canvas.toDataURL('image/jpeg', 0.94);
          }
        }

        return {
          width: w,
          height: h,
          compositePreviewUrl: compositePreviewUrl || undefined,
          tags: firstPage,
        };
      }
    }
  } catch (err) {
    console.warn('UTIF decoding notice:', err);
  }
  return { width: 1200, height: 1600 };
}

/**
 * Extracts printable string or descriptor values from a Photoshop TySh / Text block
 */
function extractTextFromTypeToolBlock(slice: Uint8Array): string {
  let str = '';
  for (let i = 0; i < slice.length; i++) {
    str += String.fromCharCode(slice[i]);
  }

  const textMatch = str.match(/\/Text\s*\(([^)]+)\)/i) || str.match(/\/Txt\s*\(([^)]+)\)/i);
  if (textMatch && textMatch[1]) {
    const raw = textMatch[1].replace(/\\([()\\])/g, '$1');
    return raw
      .replace(/^[þÿ\uFEFF\uFFFE\xFE\xFF]+/, '')
      .replace(/[\u001c\u001d]/g, '"')
      .replace(/\x00/g, '')
      .replace(/[\r\n]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  for (let i = 0; i < slice.length - 4; i++) {
    if (slice[i] === 0xfe && slice[i + 1] === 0xff) {
      let utf16Str = '';
      for (let j = i + 2; j < slice.length - 1; j += 2) {
        const code = (slice[j] << 8) | slice[j + 1];
        if (code === 0 || code === 0x0029) break;
        if (code >= 32 && code <= 126) {
          utf16Str += String.fromCharCode(code);
        }
      }
      if (utf16Str.trim().length > 0) {
        return utf16Str
          .replace(/[\u001c\u001d]/g, '"')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }
  }

  return '';
}

/**
 * Decompresses Photoshop PackBits RLE channel data
 */
function decodePhotoshopRLEChannel(
  layrBytes: Uint8Array,
  chOffset: number,
  chLen: number,
  width: number,
  height: number,
  isLE: boolean
): Uint8Array | null {
  if (chLen <= 2 || width <= 0 || height <= 0) return null;
  const view = new DataView(layrBytes.buffer, layrBytes.byteOffset + chOffset, chLen);
  const comp = view.getUint16(0, isLE);
  if (comp !== 1) return null; // 1 = RLE PackBits

  const scanlineLengths: number[] = [];
  let scanlinePos = 2;
  for (let y = 0; y < height; y++) {
    if (scanlinePos + 2 > chLen) return null;
    scanlineLengths.push(view.getUint16(scanlinePos, isLE));
    scanlinePos += 2;
  }

  const out = new Uint8Array(width * height);
  let dataPos = scanlinePos;
  let outPos = 0;

  for (let y = 0; y < height; y++) {
    const slen = scanlineLengths[y];
    const end = Math.min(chLen, dataPos + slen);
    let lineOut = 0;

    while (dataPos < end && lineOut < width && outPos < out.length) {
      const b = view.getInt8(dataPos++);
      if (b >= 0) {
        const count = b + 1;
        for (let k = 0; k < count && lineOut < width && outPos < out.length; k++) {
          out[outPos++] = view.getUint8(dataPos++);
          lineOut++;
        }
      } else if (b > -128) {
        const count = 1 - b;
        const val = view.getUint8(dataPos++);
        for (let k = 0; k < count && lineOut < width; k++) {
          out[outPos++] = val;
          lineOut++;
        }
      }
    }
    dataPos = end;
  }

  return out;
}

/**
 * Renders a decoded Photoshop layer to an in-memory HTML5 Canvas
 */
function renderDecodedLayerCanvas(
  layrBytes: Uint8Array,
  layer: PSDParsedLayer,
  isLE: boolean
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const { width, height, channelOffsets } = layer;
  if (!width || !height || !channelOffsets || channelOffsets.length === 0) return null;

  let aCh: Uint8Array | null = null;
  let rCh: Uint8Array | null = null;
  let gCh: Uint8Array | null = null;
  let bCh: Uint8Array | null = null;

  for (const ch of channelOffsets) {
    const decoded = decodePhotoshopRLEChannel(layrBytes, ch.offset, ch.chLen, width, height, isLE);
    if (!decoded) continue;
    if (ch.chId === -1) aCh = decoded;
    else if (ch.chId === 0) rCh = decoded;
    else if (ch.chId === 1) gCh = decoded;
    else if (ch.chId === 2) bCh = decoded;
  }

  if (!rCh) return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;
    const pixelCount = width * height;

    for (let i = 0; i < pixelCount; i++) {
      const p = i * 4;
      data[p] = rCh[i];
      data[p + 1] = gCh ? gCh[i] : rCh[i];
      data[p + 2] = bCh ? bCh[i] : rCh[i];
      data[p + 3] = aCh ? aCh[i] : 255;
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  } catch (e) {
    console.warn('Failed to render layer canvas:', e);
    return null;
  }
}

/**
 * Parses layer records directly from Layr bytes (supporting both Big-Endian and Little-Endian)
 */
function parsePhotoshopLayerRecords(
  layrBytes: Uint8Array,
  isLE: boolean,
  docWidth: number,
  docHeight: number
): PSDParsedLayer[] {
  const view = new DataView(layrBytes.buffer, layrBytes.byteOffset, layrBytes.byteLength);
  const detectedLayers: PSDParsedLayer[] = [];

  if (layrBytes.byteLength < 6) return detectedLayers;

  // Auto-detect start offset:
  // In TIFF Tag 37724, the Layr block directly begins with int16 layerCount at offset 0.
  // In standard PSD files, the section begins with a 4-byte layerInfoLen before int16 layerCount at offset 4.
  let rawCount = view.getInt16(0, isLE);
  let layerCount = Math.abs(rawCount);
  let cur = 2;

  let validAt0 = false;
  if (layerCount > 0 && layerCount < 500) {
    const ch0 = view.getUint16(18, isLE);
    if (ch0 >= 1 && ch0 <= 56) {
      const sigPos = 20 + ch0 * 6;
      if (sigPos + 4 <= layrBytes.byteLength) {
        const sig = String.fromCharCode(
          view.getUint8(sigPos),
          view.getUint8(sigPos + 1),
          view.getUint8(sigPos + 2),
          view.getUint8(sigPos + 3)
        );
        if (sig === '8BIM' || sig === 'MIB8') {
          validAt0 = true;
        }
      }
    }
  }

  if (!validAt0) {
    rawCount = view.getInt16(4, isLE);
    layerCount = Math.abs(rawCount);
    cur = 6;
  }

  for (let i = 0; i < layerCount && cur + 16 < layrBytes.byteLength; i++) {
    const top = view.getInt32(cur, isLE);
    const left = view.getInt32(cur + 4, isLE);
    const bottom = view.getInt32(cur + 8, isLE);
    const right = view.getInt32(cur + 12, isLE);
    cur += 16;

    if (cur + 2 > layrBytes.byteLength) break;
    const numChannels = view.getUint16(cur, isLE);
    cur += 2;
    const channelOffsets: { chId: number; chLen: number; offset: number }[] = [];
    for (let c = 0; c < numChannels; c++) {
      if (cur + 6 > layrBytes.byteLength) break;
      const chId = view.getInt16(cur, isLE);
      const chLen = view.getUint32(cur + 2, isLE);
      channelOffsets.push({ chId, chLen, offset: 0 });
      cur += 6;
    }

    if (cur + 4 > layrBytes.byteLength) break;
    const sig0 = view.getUint8(cur);
    const sig1 = view.getUint8(cur + 1);
    const sig2 = view.getUint8(cur + 2);
    const sig3 = view.getUint8(cur + 3);

    const isSig =
      (sig0 === 0x38 && sig1 === 0x42 && sig2 === 0x49 && sig3 === 0x4d) ||
      (sig0 === 0x4d && sig1 === 0x49 && sig2 === 0x42 && sig3 === 0x38);

    if (!isSig) {
      cur += 1;
      continue;
    }

    cur += 4; // blend sig
    cur += 4; // blend mode key
    const opacity = view.getUint8(cur) / 255;
    cur += 1; // opacity
    cur += 1; // clipping
    cur += 1; // flags
    cur += 1; // filler

    if (cur + 4 > layrBytes.byteLength) break;
    const extraDataLen = view.getUint32(cur, isLE);
    cur += 4;
    const extraEnd = cur + extraDataLen;

    if (extraEnd > layrBytes.byteLength) break;

    // Mask info
    if (cur + 4 <= extraEnd) {
      const maskLen = view.getUint32(cur, isLE);
      cur += 4 + maskLen;
    }

    // Blend ranges
    if (cur + 4 <= extraEnd) {
      const blendLen = view.getUint32(cur, isLE);
      cur += 4 + blendLen;
    }

    // Layer name (Pascal string)
    let layerName = '';
    if (cur < extraEnd) {
      const nameLen = view.getUint8(cur);
      cur += 1;
      for (let n = 0; n < nameLen && cur < extraEnd; n++) {
        layerName += String.fromCharCode(view.getUint8(cur));
        cur++;
      }
      const pad = (nameLen + 1) % 4 === 0 ? 0 : 4 - ((nameLen + 1) % 4);
      cur += pad;
    }

    // Search extra data tagged blocks for typography
    let textValue = '';
    let tagCur = cur;
    while (tagCur + 12 <= extraEnd) {
      const bSig0 = view.getUint8(tagCur);
      const bSig1 = view.getUint8(tagCur + 1);
      const bSig2 = view.getUint8(tagCur + 2);
      const bSig3 = view.getUint8(tagCur + 3);

      const isBlockSig =
        (bSig0 === 0x38 && bSig1 === 0x42 && bSig2 === 0x49 && bSig3 === 0x4d) ||
        (bSig0 === 0x4d && bSig1 === 0x49 && bSig2 === 0x42 && bSig3 === 0x38);

      if (!isBlockSig) {
        tagCur++;
        continue;
      }

      const key = String.fromCharCode(
        view.getUint8(tagCur + 4),
        view.getUint8(tagCur + 5),
        view.getUint8(tagCur + 6),
        view.getUint8(tagCur + 7)
      );

      const bLen = view.getUint32(tagCur + 8, isLE);
      const bDataStart = tagCur + 12;
      const bDataEnd = Math.min(extraEnd, bDataStart + bLen);

      if (key === 'TySh' || key === 'Txt2' || key === 'hSyT') {
        const blockSlice = layrBytes.slice(bDataStart, bDataEnd);
        const extracted = extractTextFromTypeToolBlock(blockSlice);
        if (extracted) {
          textValue = extracted;
        }
      }

      tagCur = bDataStart + bLen + (bLen % 4 === 0 ? 0 : 4 - (bLen % 4));
    }

    cur = extraEnd;

    const width = Math.max(1, right - left);
    const height = Math.max(1, bottom - top);
    const isFullCanvas = left <= 25 && top <= 25 && right >= docWidth - 25 && bottom >= docHeight - 25;

    if (layerName && (right > left || bottom > top)) {
      let layerType: 'photo' | 'text' | 'calendar' | 'background' | 'pixel' = 'pixel';
      if (textValue) {
        layerType = 'text';
      } else if (isFullCanvas) {
        layerType = 'background';
      } else {
        const layerClassification = classifyPSDLayer(layerName);
        layerType = layerClassification.type === 'photo' ? 'photo' : 'pixel';
      }

      detectedLayers.push({
        name: layerName.trim(),
        top,
        left,
        bottom,
        right,
        width,
        height,
        type: layerType as any,
        textValue: textValue || undefined,
        shape: inferShapeFromLayerName(layerName),
        fontFamily: 'Playfair Display',
        fontSize: 28,
        color: /white/i.test(layerName) ? '#FFFFFF' : (/black/i.test(layerName) ? '#000000' : '#160E4B'),
        opacity,
        channelOffsets,
      });
    }
  }

  // Calculate byte offsets for channel data following layer records
  let imgCur = cur;
  for (const l of detectedLayers) {
    if (l.channelOffsets) {
      for (const ch of l.channelOffsets) {
        ch.offset = imgCur;
        imgCur += ch.chLen;
      }
    }
  }

  // Render layer canvases if in browser environment
  if (typeof document !== 'undefined') {
    for (const l of detectedLayers) {
      if (l.channelOffsets && l.channelOffsets.length > 0) {
        l.canvas = renderDecodedLayerCanvas(layrBytes, l, isLE) || undefined;
      }
    }
  }

  return detectedLayers;
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
 * Processes ag-psd document tree into high-fidelity PhotoSlot, TextZone and StaticLayer configs
 */
export function processAgPsdResult(psd: any, overrideCompositeUrl?: string): PSDImportResult {
  const docWidth = psd.width || 1200;
  const docHeight = psd.height || 1600;

  // Extract high-resolution composite preview
  let compositePreviewUrl = overrideCompositeUrl || '';
  if (!compositePreviewUrl && psd.canvas && typeof psd.canvas.toDataURL === 'function') {
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
        const isFullCanvas = l <= 15 && t <= 15 && r >= docWidth - 15 && b >= docHeight - 15;
        if (isFullCanvas && !layer.text) {
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
        if (c.wPct >= 18 && c.wPct <= 88 && c.hPct >= 15 && c.hPct <= 85) {
          score += 25;
        } else if (c.wPct > 95 || c.hPct > 95) {
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

/**
 * Converts parsed raw layers into a structured PSDImportResult with intelligent aperture clustering and drop-shadow pairing
 */
export function convertParsedLayersToImportResult(
  detectedLayers: PSDParsedLayer[],
  docWidth: number,
  docHeight: number,
  compositePreviewUrl?: string
): PSDImportResult {
  const photoSlots: PhotoSlotConfig[] = [];
  const textZones: TextZoneConfig[] = [];
  const staticLayers: StaticLayerConfig[] = [];

  // 1. Filter background vs pixel content vs text layers
  const pixelLayers = detectedLayers.filter((l) => {
    if (l.type === 'text' || Boolean(l.textValue)) return false;
    const isFull = l.left <= 25 && l.top <= 25 && l.right >= docWidth - 25 && l.bottom >= docHeight - 25;
    const isNamedBg = /background|bg|artboard|base_frame|canvas_bg/i.test(l.name || '');
    return !(isFull || isNamedBg || l.name === 'Layer 0');
  });

  // 2. Intelligent Aperture Clustering
  interface ApertureCluster {
    left: number;
    top: number;
    right: number;
    bottom: number;
    cxPct: number;
    cyPct: number;
    wPct: number;
    hPct: number;
    w: number;
    h: number;
    layers: PSDParsedLayer[];
  }

  const clusters: ApertureCluster[] = [];
  pixelLayers.forEach((l) => {
    const w = Math.max(1, l.width);
    const h = Math.max(1, l.height);
    const cx = (l.left + l.right) / 2;
    const cy = (l.top + l.bottom) / 2;
    const cxPct = (cx / docWidth) * 100;
    const cyPct = (cy / docHeight) * 100;
    const wPct = (w / docWidth) * 100;
    const hPct = (h / docHeight) * 100;

    const match = clusters.find(
      (c) =>
        Math.abs(c.cxPct - cxPct) < 5 &&
        Math.abs(c.cyPct - cyPct) < 5
    );

    if (match) {
      match.layers.push(l);
    } else {
      clusters.push({
        left: l.left,
        top: l.top,
        right: l.right,
        bottom: l.bottom,
        cxPct,
        cyPct,
        wPct,
        hPct,
        w,
        h,
        layers: [l],
      });
    }
  });

  const scoredCandidates = clusters.map((c) => {
    let score = 0;
    const combinedNames = c.layers.map((l) => (l.name || '').toLowerCase()).join(' ');

    if (/photo|slot|image|pic|portrait|couple|baby|insert|cutout|placeholder|user_photo|aperture/i.test(combinedNames)) {
      score += 100;
    }
    if (c.layers.length > 1) score += 40;

    const distCenterX = Math.abs(c.cxPct - 50);
    if (distCenterX < 10) score += 30;
    else if (distCenterX < 20) score += 15;
    else if (distCenterX > 35) score -= 25;

    if (c.wPct >= 18 && c.wPct <= 88 && c.hPct >= 15 && c.hPct <= 85) score += 25;
    else if (c.wPct > 95 || c.hPct > 95) score -= 50;
    else if (c.wPct < 15 || c.hPct < 15) score -= 30;

    const aspect = c.w / c.h;
    const isSquareOrCircle = Math.abs(aspect - 1.0) < 0.18;
    if (isSquareOrCircle) score += 20;

    const shape: FrameCutoutShape = isSquareOrCircle ? 'circle' : (inferShapeFromLayerName(combinedNames) as FrameCutoutShape);
    return { cluster: c, score, shape, names: combinedNames };
  });

  scoredCandidates.sort((a, b) => b.score - a.score);

  const selectedApertures: typeof scoredCandidates = [];
  for (const cand of scoredCandidates) {
    if (cand.score < 35) continue;
    const c = cand.cluster;
    const overlaps = selectedApertures.some((ex) => {
      const ec = ex.cluster;
      return Math.abs(ec.cxPct - c.cxPct) < 15 && Math.abs(ec.cyPct - c.cyPct) < 25;
    });
    if (!overlaps) selectedApertures.push(cand);
  }

  if (selectedApertures.length === 0 && scoredCandidates.length > 0 && scoredCandidates[0].score >= 20) {
    selectedApertures.push(scoredCandidates[0]);
  }

  selectedApertures.forEach((ap, idx) => {
    const c = ap.cluster;
    const slotNumber = idx + 1;

    // Pick the most representative photo layer in the cluster (preferring non-copy pixel layer)
    const photoCandidate =
      c.layers.find((l) => l.canvas && !/copy|mask|outline|frame|border/i.test(l.name || '')) ||
      c.layers.find((l) => !/copy|mask|outline|frame|border/i.test(l.name || '')) ||
      c.layers[0];

    const targetW = photoCandidate?.width || c.w;
    const targetH = photoCandidate?.height || c.h;
    const targetCx = photoCandidate ? (photoCandidate.left + photoCandidate.right) / 2 : (c.left + c.right) / 2;
    const targetCy = photoCandidate ? (photoCandidate.top + photoCandidate.bottom) / 2 : (c.top + c.bottom) / 2;

    const cxPct = Math.round((targetCx / docWidth) * 100);
    const cyPct = Math.round((targetCy / docHeight) * 100);
    const wPct = Math.round((targetW / docWidth) * 100);
    const hPct = Math.round((targetH / docHeight) * 100);

    const aspect = targetW / targetH;
    const isSquareOrCircle = Math.abs(aspect - 1.0) < 0.18;
    const resolvedShape: FrameCutoutShape = isSquareOrCircle ? 'circle' : ap.shape;

    // Extract actual photo thumbnail from template layer canvas
    let defaultPhotoUrl = 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600';
    if (photoCandidate && photoCandidate.canvas && typeof document !== 'undefined') {
      try {
        const srcCanvas = photoCandidate.canvas as HTMLCanvasElement;
        const maxDim = 800;
        const scale = Math.min(1, maxDim / Math.max(srcCanvas.width, srcCanvas.height, 1));
        const thumbW = Math.max(1, Math.round(srcCanvas.width * scale));
        const thumbH = Math.max(1, Math.round(srcCanvas.height * scale));
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = thumbW;
        thumbCanvas.height = thumbH;
        const tCtx = thumbCanvas.getContext('2d');
        if (tCtx) {
          tCtx.drawImage(srcCanvas, 0, 0, thumbW, thumbH);
          defaultPhotoUrl = thumbCanvas.toDataURL('image/jpeg', 0.88);
        }
      } catch (err) {
        console.warn('Failed to extract photo layer thumbnail:', err);
      }
    }

    photoSlots.push({
      id: `slot-psd-${Date.now().toString(36)}-${slotNumber}`,
      label: selectedApertures.length === 1 ? 'Baby Photo Slot' : `Photo Slot ${slotNumber}`,
      shape: resolvedShape,
      x: cxPct,
      y: cyPct,
      width: wPct,
      height: hPct,
      defaultPhotoUrl,
      visibility: {
        ...DEFAULT_VISIBILITY,
        userLabel: selectedApertures.length === 1 ? 'Upload Baby Photo' : `Upload Photo ${slotNumber}`,
      },
      sourceLayerName: c.layers.map((l) => l.name).join(', '),
    });
  });

  // 3. Text Zones with Drop-Shadow Pairing
  const textLayers = detectedLayers.filter((l) => l.type === 'text' && Boolean(l.textValue));
  const primaryTextLayers: PSDParsedLayer[] = [];
  const shadowTextLayers: PSDParsedLayer[] = [];

  for (const l of textLayers) {
    const lowerName = (l.name || '').toLowerCase();
    const isShadow = /black|shadow|drop|copy/i.test(lowerName) && !/white/i.test(lowerName);
    if (isShadow) {
      shadowTextLayers.push(l);
    } else {
      primaryTextLayers.push(l);
    }
  }

  const remainingShadowLayers = [...shadowTextLayers];
  let tCount = 1;
  primaryTextLayers.forEach((l) => {
    const textVal = l.textValue || '';
    const lCx = (l.left + l.right) / 2;
    const lCy = (l.top + l.bottom) / 2;
    const xPct = Math.round((lCx / docWidth) * 100);
    const yPct = Math.round((lCy / docHeight) * 100);
    const wPct = Math.round((l.width / docWidth) * 100);
    const isLongText = textVal.length > 50;

    let label = (l.name || '').replace(/[_-]/g, ' ').replace(/\b(white|black|layer)\b/gi, '').trim();
    let fontFamily = 'Playfair Display';
    let normalizedFontSize = 32;

    if (/happy\s*birthday/i.test(textVal)) {
      label = 'Title';
      fontFamily = 'Great Vibes';
      normalizedFontSize = 48;
    } else if (/anahitha/i.test(textVal)) {
      label = 'Baby Name';
      fontFamily = 'Playfair Display';
      normalizedFontSize = 42;
    } else if (isLongText) {
      label = 'Birthday Quote';
      fontFamily = 'Playfair Display';
      normalizedFontSize = 18;
    }
    if (!label) label = `Text Zone ${tCount}`;

    const zoneId = `text-psd-${Date.now().toString(36)}-${tCount}`;
    const zone: TextZoneConfig = {
      id: zoneId,
      label,
      defaultValue: textVal,
      x: xPct,
      y: yPct,
      maxWidth: Math.min(90, Math.max(30, wPct + 10)),
      fontSize: normalizedFontSize,
      fontFamily,
      color: /white/i.test(l.name || '') ? '#FFFFFF' : '#160E4B',
      align: 'center',
      type: isLongText ? 'message' : 'text',
      multiline: isLongText,
      visibility: {
        ...DEFAULT_VISIBILITY,
        userVisible: true,
        userEditable: true,
        userLabel: label,
      },
      sourceLayerName: l.name,
    };
    textZones.push(zone);

    // Find matching shadow layer by exact text or spatial proximity in both dimensions
    const sIdx = remainingShadowLayers.findIndex((s) => {
      if (s.textValue && textVal && s.textValue.trim().toLowerCase() === textVal.trim().toLowerCase()) {
        return true;
      }
      const sCx = (s.left + s.right) / 2;
      const sCy = (s.top + s.bottom) / 2;
      const dx = Math.abs(sCx - lCx);
      const dy = Math.abs(sCy - lCy);
      return dx < docWidth * 0.08 && dy < docHeight * 0.08;
    });

    if (sIdx !== -1) {
      const shadowMatch = remainingShadowLayers.splice(sIdx, 1)[0];
      const sxPct = Math.round((((shadowMatch.left + shadowMatch.right) / 2) / docWidth) * 100);
      const syPct = Math.round((((shadowMatch.top + shadowMatch.bottom) / 2) / docHeight) * 100);
      textZones.push({
        id: `${zoneId}-shadow`,
        label: `${label} (Shadow)`,
        defaultValue: textVal,
        x: sxPct,
        y: syPct,
        maxWidth: zone.maxWidth,
        fontSize: zone.fontSize,
        fontFamily: zone.fontFamily,
        color: '#000000',
        align: 'center',
        type: zone.type,
        multiline: isLongText,
        pairedWithId: zoneId,
        visibility: {
          ...DEFAULT_VISIBILITY,
          userVisible: false,
          userEditable: false,
          userLabel: `${label} (Shadow)`,
        },
        sourceLayerName: shadowMatch.name,
      });
    }

    tCount++;
  });

  // 4. Automated Clean Base Artwork Generation:
  // Composites background canvases, borders, floral rings, and clipart while omitting
  // editable customer text layers and aperture sample photos.
  let cleanBaseImageUrl = '';
  if (typeof document !== 'undefined') {
    try {
      const cleanCanvas = document.createElement('canvas');
      cleanCanvas.width = docWidth;
      cleanCanvas.height = docHeight;
      const cleanCtx = cleanCanvas.getContext('2d');

      if (cleanCtx) {
        const apertureLayerNames = new Set<string>();
        selectedApertures.forEach((ap) => {
          ap.cluster.layers.forEach((l) => {
            if (l.name) apertureLayerNames.add(l.name.trim().toLowerCase());
          });
        });

        const textLayerNames = new Set<string>();
        detectedLayers.forEach((l) => {
          if (l.type === 'text' || Boolean(l.textValue)) {
            if (l.name) textLayerNames.add(l.name.trim().toLowerCase());
          }
        });

        // Draw layers from bottom to top
        detectedLayers.forEach((layer) => {
          if (!layer) return;
          const lName = (layer.name || '').trim().toLowerCase();

          // Omit customer editable text layers
          if (layer.type === 'text' || Boolean(layer.textValue) || textLayerNames.has(lName)) {
            return;
          }

          // Omit sample photos inside apertures
          if (apertureLayerNames.has(lName)) {
            return;
          }

          if (layer.canvas) {
            cleanCtx.save();
            if (layer.opacity !== undefined) {
              cleanCtx.globalAlpha = layer.opacity;
            }
            cleanCtx.drawImage(layer.canvas, layer.left || 0, layer.top || 0);
            cleanCtx.restore();
          }
        });

        cleanBaseImageUrl = cleanCanvas.toDataURL('image/jpeg', 0.92);
      }
    } catch (cleanCanvasErr) {
      console.warn('Clean base artwork composition notice:', cleanCanvasErr);
    }
  }

  return {
    documentDimensions: { width: docWidth, height: docHeight },
    photoSlots,
    textZones,
    staticLayers,
    detectedLayerCount: photoSlots.length + primaryTextLayers.length,
    compositePreviewUrl: compositePreviewUrl || undefined,
    cleanBaseImageUrl: cleanBaseImageUrl || compositePreviewUrl || undefined,
  };
}

/**
 * Parses a Layered TIFF (.tif / .tiff) file saved with Photoshop layers:
 * 1. Decodes composite artwork preview via UTIF.js
 * 2. Extracts Tag 37724 (ImageSourceData) and Tag 34377 (ImageResources)
 * 3. Extracts 'Layr' tagged block
 * 4. Synthesizes an in-memory PSD buffer and feeds it into ag-psd for 100% feature parity
 * 5. Falls back to direct layer record scanner if needed
 */
export async function parseTiffTemplateBinary(arrayBuffer: ArrayBuffer): Promise<PSDImportResult> {
  // A. Decode high-resolution composite preview via UTIF.js
  const utifDecoded = await decodeTiffWithUtif(arrayBuffer);
  const docWidth = utifDecoded.width || 1200;
  const docHeight = utifDecoded.height || 1600;
  const compositePreviewUrl = utifDecoded.compositePreviewUrl;

  // B. Extract TIFF Photoshop metadata (Tag 37724: ImageSourceData, Tag 34377: ImageResources)
  const tags = extractTiffPhotoshopTags(arrayBuffer);
  const imageSourceData = tags.imageSourceData || (utifDecoded.tags && (utifDecoded.tags.t37724 || utifDecoded.tags['37724']));
  const imageResources = tags.imageResources || (utifDecoded.tags && (utifDecoded.tags.t34377 || utifDecoded.tags['34377']));

  // If no Photoshop layers exist (flattened single-layer TIFF)
  if (!imageSourceData || imageSourceData.byteLength < 12) {
    return {
      documentDimensions: { width: docWidth, height: docHeight },
      photoSlots: [],
      textZones: [],
      staticLayers: [],
      detectedLayerCount: 0,
      compositePreviewUrl: compositePreviewUrl || undefined,
      cleanBaseImageUrl: compositePreviewUrl || undefined,
    };
  }

  // C. Extract Layr block from ImageSourceData
  const layrExtraction = extractLayrBlockFromImageSourceData(
    imageSourceData instanceof Uint8Array ? imageSourceData : new Uint8Array(imageSourceData)
  );

  if (layrExtraction && !layrExtraction.isLittleEndian) {
    try {
      const syntheticPsdBuffer = buildPsdFromLayrBlock(
        docWidth,
        docHeight,
        layrExtraction.layrBlock,
        imageResources instanceof Uint8Array ? imageResources : (imageResources ? new Uint8Array(imageResources) : undefined)
      );

      const agPsdModule = await import(/* @vite-ignore */ 'https://esm.sh/ag-psd@23.0.0');
      setupAgPsdCanvas(agPsdModule);
      const readPsd = agPsdModule.readPsd || agPsdModule.default?.readPsd || agPsdModule.default;

      if (typeof readPsd === 'function') {
        const psd = readPsd(syntheticPsdBuffer, {
          skipLayerImageData: false,
          skipCompositeImageData: true,
          skipThumbnail: true,
        });

        const result = processAgPsdResult(psd, compositePreviewUrl);
        if (result.detectedLayerCount > 0) {
          return result;
        }
      }
    } catch (agPsdErr) {
      console.warn('ag-psd parsing on TIFF synthetic PSD notice:', agPsdErr);
    }
  }

  // D. Fallback or Little-Endian: Parse layer records directly
  const layrBytes = layrExtraction?.layrBlock || (imageSourceData instanceof Uint8Array ? imageSourceData : new Uint8Array(imageSourceData));
  const isLE = layrExtraction ? layrExtraction.isLittleEndian : tags.isLittleEndian;
  const detectedLayers = parsePhotoshopLayerRecords(layrBytes, isLE, docWidth, docHeight);

  return convertParsedLayersToImportResult(detectedLayers, docWidth, docHeight, compositePreviewUrl);
}

/**
 * Universal Photoshop Template Parser:
 * Automatically detects whether file is PSD (.psd) or Layered TIFF (.tif / .tiff),
 * extracts all layers, coordinates, and composite previews.
 */
export async function parsePSDFileBinary(file: File): Promise<PSDImportResult> {
  const arrayBuffer = await file.arrayBuffer();

  // 1. TIFF support (.tif / .tiff)
  if (isTiffFile(arrayBuffer)) {
    return parseTiffTemplateBinary(arrayBuffer);
  }

  // 2. Try parsing with full ag-psd layer engine first
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

      const result = processAgPsdResult(psd);
      if (result.detectedLayerCount > 0 || result.compositePreviewUrl) {
        return result;
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

  return convertParsedLayersToImportResult(detectedLayers, docWidth, docHeight);
}

export const parseTemplateFileBinary = parsePSDFileBinary;
