import { PhotoSlotConfig, TextZoneConfig } from '../../../types/template';
import { ResizeHandle } from '../types';

export interface BoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

export const HANDLE_SIZE = 10; // in canvas pixels

export function getSlotBoundingBox(
  slot: PhotoSlotConfig,
  canvasW: number,
  canvasH: number
): BoundingBox {
  const w = (slot.width / 100) * canvasW;
  const h = (slot.height / 100) * canvasH;
  const cx = (slot.x / 100) * canvasW;
  const cy = (slot.y / 100) * canvasH;
  const l = cx - w / 2;
  const t = cy - h / 2;

  return {
    left: l,
    top: t,
    width: w,
    height: h,
    right: l + w,
    bottom: t + h,
    centerX: cx,
    centerY: cy,
  };
}

export function getTextZoneBoundingBox(
  zone: TextZoneConfig,
  canvasW: number,
  canvasH: number
): BoundingBox {
  const maxW = ((zone.maxWidth || 80) / 100) * canvasW;
  const estimatedH = (zone.fontSize * 2.5); // approximate bounding box height
  const cx = (zone.x / 100) * canvasW;
  const cy = (zone.y / 100) * canvasH;
  const l = cx - maxW / 2;
  const t = cy - estimatedH / 2;

  return {
    left: l,
    top: t,
    width: maxW,
    height: estimatedH,
    right: l + maxW,
    bottom: t + estimatedH,
    centerX: cx,
    centerY: cy,
  };
}

export function getHandles(box: BoundingBox): Record<Exclude<ResizeHandle, 'move'>, { x: number; y: number }> {
  return {
    tl: { x: box.left, y: box.top },
    tc: { x: box.centerX, y: box.top },
    tr: { x: box.right, y: box.top },
    ml: { x: box.left, y: box.centerY },
    mr: { x: box.right, y: box.centerY },
    bl: { x: box.left, y: box.bottom },
    bc: { x: box.centerX, y: box.bottom },
    br: { x: box.right, y: box.bottom },
  };
}

export function hitTestHandles(
  mouseX: number,
  mouseY: number,
  box: BoundingBox,
  tolerance = 12
): ResizeHandle | null {
  const handles = getHandles(box);

  for (const [key, pos] of Object.entries(handles)) {
    if (Math.abs(mouseX - pos.x) <= tolerance && Math.abs(mouseY - pos.y) <= tolerance) {
      return key as ResizeHandle;
    }
  }

  // Inside bounding box -> move handle
  if (
    mouseX >= box.left &&
    mouseX <= box.right &&
    mouseY >= box.top &&
    mouseY <= box.bottom
  ) {
    return 'move';
  }

  return null;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}
