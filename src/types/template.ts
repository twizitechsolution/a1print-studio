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

export interface PhotoSlotConfig {
  id: string;
  label: string;
  shape: FrameCutoutShape | string;
  x: number; // Percentage X (0-100)
  y: number; // Percentage Y (0-100)
  width: number; // Percentage width
  height: number; // Percentage height
  defaultPhotoUrl?: string;
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
  type: 'text' | 'date' | 'time' | 'number' | 'calendar' | 'message';
  isCalendar?: boolean;
  isAIMessage?: boolean;
}

export interface UniversalFrameTemplate {
  id: string;
  productId: string;
  title: string;
  category: string;
  basePrice: number;
  originalPrice: number;
  baseImageUrl: string;
  photoSlots: PhotoSlotConfig[];
  textZones: TextZoneConfig[];
  createdAt: string;
}
