import { PhotoSlotConfig, TextZoneConfig, UniversalFrameTemplate, LayerVisibility, FrameCutoutShape } from '../../../types/template';

export const DEFAULT_VISIBILITY: LayerVisibility = {
  userVisible: true,
  userEditable: true,
  required: true,
  emptyBehavior: 'keepDefault',
};

export function resolveVisibility(visibility?: LayerVisibility): LayerVisibility {
  return {
    userVisible: visibility?.userVisible ?? true,
    userEditable: visibility?.userEditable ?? true,
    required: visibility?.required ?? true,
    userLabel: visibility?.userLabel || '',
    emptyBehavior: visibility?.emptyBehavior || 'keepDefault',
  };
}

export function createDefaultSlot(slotIndex: number, shape: FrameCutoutShape = 'rounded'): PhotoSlotConfig {
  return {
    id: `photo-${Date.now().toString(36).slice(-4)}-${slotIndex}`,
    label: `Photo Slot ${slotIndex}`,
    shape,
    x: 50,
    y: 40 + (slotIndex % 3) * 10,
    width: 30,
    height: 30,
    defaultPhotoUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600',
    visibility: { ...DEFAULT_VISIBILITY, userLabel: `Upload Photo ${slotIndex}` },
    locked: false,
  };
}

export function createDefaultTextZone(zoneIndex: number, type: TextZoneConfig['type'] = 'text'): TextZoneConfig {
  const isCalendar = type === 'calendar';
  return {
    id: `text-${Date.now().toString(36).slice(-4)}-${zoneIndex}`,
    label: isCalendar ? `Calendar Zone ${zoneIndex}` : `Text Zone ${zoneIndex}`,
    defaultValue: isCalendar ? '14 Feb 2026' : (type === 'date' ? '25 Dec 2025' : 'Personalized Name'),
    x: 50,
    y: 70 + (zoneIndex % 3) * 8,
    maxWidth: 85,
    fontSize: isCalendar ? 16 : 24,
    fontFamily: isCalendar ? 'Jost' : 'Playfair Display',
    color: '#160E4B',
    align: 'center',
    type,
    isCalendar,
    visibility: { ...DEFAULT_VISIBILITY, userLabel: isCalendar ? 'Special Date (Calendar)' : `Text ${zoneIndex}` },
    locked: false,
  };
}

export function createNewTemplate(): UniversalFrameTemplate {
  const uniqueId = `tmpl-${Date.now()}`;
  return {
    id: uniqueId,
    productId: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
    title: 'New Custom Photo Frame',
    category: 'baby-birth-frame',
    basePrice: 699,
    originalPrice: 999,
    baseImageUrl: 'https://lovecraftbyse.com/wp-content/uploads/2025/02/welcome-baby-boy-scaled.webp',
    photoSlots: [createDefaultSlot(1, 'circle')],
    textZones: [
      createDefaultTextZone(1, 'text'),
      createDefaultTextZone(2, 'date'),
    ],
    createdAt: new Date().toISOString(),
    importSource: 'manual',
  };
}
