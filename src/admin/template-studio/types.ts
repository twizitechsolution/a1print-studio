import { PhotoSlotConfig, TextZoneConfig, UniversalFrameTemplate } from '../../types/template';

export type LayerType = 'slot' | 'zone' | 'artwork';

export interface SelectedLayer {
  type: LayerType;
  id: string;
}

export type ResizeHandle = 'tl' | 'tc' | 'tr' | 'ml' | 'mr' | 'bl' | 'bc' | 'br' | 'move' | 'rotate';

export interface StudioCanvasState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface StudioHistoryState {
  past: UniversalFrameTemplate[];
  present: UniversalFrameTemplate;
  future: UniversalFrameTemplate[];
}
