export type FrameCutoutShape =
  | 'circle'
  | 'square'
  | 'rectangle'
  | 'rounded'
  | 'oval'
  | 'heart'
  | 'star'
  | 'triangle'
  | 'diamond'
  | 'hexagon'
  | 'pentagon'
  | 'arch'
  | 'shield'
  | 'cloud'
  | 'polaroid';

export interface LayerVisibility {
  userVisible: boolean;     // Rendered as an interactive customization control for the end customer
  userEditable: boolean;    // Can customer edit/upload value (usually mirrors userVisible)
  required: boolean;        // Validation: Must be filled/uploaded prior to Add to Cart
  userLabel?: string;       // Customer-facing label override (falls back to internal label)
  emptyBehavior?: 'keepDefault' | 'hideLayer' | 'showPlaceholder'; // When !required & left empty
}

export interface ArtworkLayer {
  id: string;
  imageUrl: string;       // PNG with real alpha transparency where needed
  zIndex: number;         // draw order, interleaved with photoSlots/textZones
  label?: string;         // e.g. "Base Artwork", "Frame Overlay"
  // Transform & Sizing for overlay elements (stickers, logos, cutout frames)
  x?: number;             // Percentage X (0-100, center; default: 50)
  y?: number;             // Percentage Y (0-100, center; default: 50)
  width?: number;         // Percentage width (0-100)
  height?: number;        // Percentage height (0-100)
  scale?: number;         // Scale percentage (e.g. 100 = 100%, 60 = 60%; default: 100)
  rotation?: number;      // degrees (0-360, default: 0)
  opacity?: number;       // 0-1
}

export interface PhotoSlotConfig {
  id: string;
  label: string;
  x: number; // Percentage X (0-100)
  y: number; // Percentage Y (0-100)
  width: number; // Percentage width
  height: number; // Percentage height
  defaultPhotoUrl?: string;
  rotation?: number;            // degrees (0-360)
  zIndex?: number;              // draw order when layers overlap (determines interleaving with artworkLayers)
  visibleToCustomer?: boolean;  // default true
  required?: boolean;           // default false
  /** @deprecated shape is no longer used by the renderer; kept only so old records don't break on load */
  shape?: FrameCutoutShape | string;
  /** Canva-style vector shape ID from shapeLibrary (e.g. 'circle', 'classic-heart', 'blob-1'). If undefined, renders as plain rectangle. */
  shapeId?: string;
  /** Pan offset X in percentage of slot width (-50 to +50, default: 0) */
  photoOffsetX?: number;
  /** Pan offset Y in percentage of slot height (-50 to +50, default: 0) */
  photoOffsetY?: number;
  /** Zoom scale factor (1.0 to 3.0, default: 1.0) */
  photoScale?: number;
  /** Border thickness in pixels (0 for no border) */
  borderWidth?: number;
  /** Border color hex string (e.g. '#EF4444' or '#000000') */
  borderColor?: string;
  visibility?: LayerVisibility; // Backward-compatible visibility metadata
  locked?: boolean;             // Admin-only: locks position/scale in Studio
  sourceLayerName?: string;     // PSD layer name / AI detection reference
}

export interface TextZoneConfig {
  id: string;
  label: string;
  defaultValue: string;
  x: number; // Percentage X (0-100)
  y: number; // Percentage Y (0-100)
  maxWidth?: number; // Percentage max width of text bounding box (0-100, default 80%)
  fontSize: number; // font size in px
  fontFamily: string;
  color: string;
  align: 'center' | 'left' | 'right';
  type: 'text' | 'date' | 'time' | 'number' | 'calendar' | 'message' | 'select'; // NEW: 'select'
  isCalendar?: boolean;
  isAIMessage?: boolean;
  multiline?: boolean;
  pairedWithId?: string;
  rotation?: number;            // NEW — degrees (0-360)
  zIndex?: number;              // NEW — draw order when zones overlap (default 0)
  visibleToCustomer?: boolean;  // NEW — default true
  required?: boolean;           // NEW — default false
  selectOptions?: string[];     // NEW — e.g. ["1st", "2nd", "3rd"]
  autoShrinkToFit?: boolean;    // NEW — auto reduce font size to fit maxWidth
  visibility?: LayerVisibility; // Backward-compatible visibility metadata
  locked?: boolean;             // Admin-only: locks position/scale in Studio
  sourceLayerName?: string;     // PSD layer name / AI detection reference
}

export interface StaticLayerConfig {
  id: string;
  label: string;
  sourceLayerName?: string;
  x: number; // Percentage X (0-100)
  y: number; // Percentage Y (0-100)
  width: number; // Percentage width
  height: number; // Percentage height
  defaultPhotoUrl?: string;
  locked?: boolean;
}

export interface UniversalFrameTemplate {
  id: string;
  productId: string;
  title: string;
  category: string;
  basePrice: number;
  originalPrice: number;
  artworkLayers?: ArtworkLayer[]; // Source of truth for artwork stack
  baseImageUrl: string;            // Mirrors artworkLayers[0].imageUrl for backward compatibility
  cleanBaseImageUrl?: string;
  images?: string[];
  photoSlots: PhotoSlotConfig[];
  textZones: TextZoneConfig[];
  staticLayers?: StaticLayerConfig[];
  /** Custom display ordering of layers/fields in admin stack and customer customizer form */
  fieldOrder?: string[];
  createdAt: string;
  updatedAt?: string;
  status?: 'draft' | 'published';
  importSource?: 'manual' | 'psd' | 'ai-image';
  originalUploadUrl?: string;
  aiDetectionConfidence?: Record<string, number>; // slotId/zoneId -> 0-1 confidence
  documentDimensions?: { width: number; height: number };
  canvaDesignId?: string;
  canvaLastSyncedAt?: string;
  product?: any;
}

export type CustomFrameTemplate = UniversalFrameTemplate;

/**
 * Migration helper: guarantees default values for legacy Firestore documents missing new boolean/numeric fields.
 * Synthesizes artworkLayers from baseImageUrl/cleanBaseImageUrl if missing, ensuring 100% backward compatibility.
 */
export function normalizeTemplateLayerDefaults(template: UniversalFrameTemplate): UniversalFrameTemplate {
  const baseSrc = template.cleanBaseImageUrl || template.baseImageUrl || '';
  const rawLayers = template.artworkLayers && template.artworkLayers.length > 0
    ? template.artworkLayers
    : (baseSrc ? [{ id: 'legacy-base', imageUrl: baseSrc, zIndex: 0, label: 'Base Artwork' }] : []);

  const artworkLayers: ArtworkLayer[] = rawLayers.map((art, idx) => ({
    ...art,
    id: art.id || `art-${idx + 1}`,
    zIndex: art.zIndex ?? (idx === 0 ? 0 : 10),
    label: art.label || (idx === 0 ? 'Base Artwork' : `Overlay Layer ${idx + 1}`),
  }));

  const primaryBase = artworkLayers[0]?.imageUrl || baseSrc;

  return {
    ...template,
    status: template.status || 'published',
    artworkLayers,
    baseImageUrl: primaryBase,
    photoSlots: (template.photoSlots || []).map((slot) => ({
      ...slot,
      rotation: slot.rotation ?? 0,
      zIndex: slot.zIndex ?? 1,
      visibleToCustomer: slot.visibleToCustomer !== false && (slot.visibility ? slot.visibility.userVisible !== false : true),
      required: slot.required ?? slot.visibility?.required ?? false,
    })),
    textZones: (template.textZones || []).map((zone) => ({
      ...zone,
      rotation: zone.rotation ?? 0,
      zIndex: zone.zIndex ?? 2,
      visibleToCustomer: zone.visibleToCustomer !== false && (zone.visibility ? zone.visibility.userVisible !== false : true),
      required: zone.required ?? zone.visibility?.required ?? false,
      autoShrinkToFit: zone.autoShrinkToFit ?? true,
    })),
  };
}
