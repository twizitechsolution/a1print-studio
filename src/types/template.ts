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

export interface PhotoSlotConfig {
  id: string;
  label: string;
  shape: FrameCutoutShape | string;
  x: number; // Percentage X (0-100)
  y: number; // Percentage Y (0-100)
  width: number; // Percentage width
  height: number; // Percentage height
  defaultPhotoUrl?: string;
  rotation?: number;            // NEW — degrees (0-360)
  zIndex?: number;              // NEW — draw order when slots overlap (default 0)
  visibleToCustomer?: boolean;  // NEW — default true
  required?: boolean;           // NEW — default false
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
  baseImageUrl: string;
  cleanBaseImageUrl?: string;
  images?: string[];
  photoSlots: PhotoSlotConfig[];
  textZones: TextZoneConfig[];
  staticLayers?: StaticLayerConfig[];
  createdAt: string;
  updatedAt?: string;           // NEW
  status?: 'draft' | 'published'; // NEW
  importSource?: 'manual' | 'psd' | 'ai-image';
  originalUploadUrl?: string;
  aiDetectionConfidence?: Record<string, number>; // slotId/zoneId -> 0-1 confidence
  documentDimensions?: { width: number; height: number };
  product?: any;
}

export type CustomFrameTemplate = UniversalFrameTemplate;

/**
 * Migration helper: guarantees default values for legacy Firestore documents missing new boolean/numeric fields.
 */
export function normalizeTemplateLayerDefaults(template: UniversalFrameTemplate): UniversalFrameTemplate {
  return {
    ...template,
    status: template.status || 'published',
    photoSlots: (template.photoSlots || []).map((slot) => ({
      ...slot,
      rotation: slot.rotation ?? 0,
      zIndex: slot.zIndex ?? 0,
      visibleToCustomer: slot.visibleToCustomer !== false && (slot.visibility ? slot.visibility.userVisible !== false : true),
      required: slot.required ?? slot.visibility?.required ?? false,
    })),
    textZones: (template.textZones || []).map((zone) => ({
      ...zone,
      rotation: zone.rotation ?? 0,
      zIndex: zone.zIndex ?? 0,
      visibleToCustomer: zone.visibleToCustomer !== false && (zone.visibility ? zone.visibility.userVisible !== false : true),
      required: zone.required ?? zone.visibility?.required ?? false,
      autoShrinkToFit: zone.autoShrinkToFit ?? true,
    })),
  };
}
