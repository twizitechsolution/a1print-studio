import { PhotoSlotConfig, TextZoneConfig, ArtworkLayer } from '../../../types/template';
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

export function getArtworkBoundingBox(
  art: ArtworkLayer,
  canvasW: number,
  canvasH: number
): BoundingBox {
  const scaleFactor = (art.scale ?? 60) / 100;
  const w = ((art.width ?? 50) / 100) * canvasW * scaleFactor;
  const h = ((art.height ?? 50) / 100) * canvasH * scaleFactor;
  const cx = ((art.x ?? 50) / 100) * canvasW;
  const cy = ((art.y ?? 50) / 100) * canvasH;
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
  const maxW = Math.max(80, ((zone.maxWidth || 80) / 100) * canvasW);
  const estimatedH = Math.max(50, (zone.fontSize || 22) * 2.8); // comfortable bounding box height
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

export function rotatePoint(x: number, y: number, cx: number, cy: number, angleDeg: number): { x: number; y: number } {
  if (!angleDeg) return { x, y };
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - cx;
  const dy = y - cy;
  return {
    x: cx + (dx * cos - dy * sin),
    y: cy + (dx * sin + dy * cos),
  };
}

export function getRotateHandle(box: BoundingBox, rotation = 0): { x: number; y: number } {
  const unrotated = { x: box.centerX, y: box.top - 24 };
  return rotatePoint(unrotated.x, unrotated.y, box.centerX, box.centerY, rotation);
}

export function getHandles(box: BoundingBox, rotation = 0): Record<Exclude<ResizeHandle, 'move'>, { x: number; y: number }> {
  const cx = box.centerX;
  const cy = box.centerY;
  return {
    tl: rotatePoint(box.left, box.top, cx, cy, rotation),
    tc: rotatePoint(box.centerX, box.top, cx, cy, rotation),
    tr: rotatePoint(box.right, box.top, cx, cy, rotation),
    ml: rotatePoint(box.left, box.centerY, cx, cy, rotation),
    mr: rotatePoint(box.right, box.centerY, cx, cy, rotation),
    bl: rotatePoint(box.left, box.bottom, cx, cy, rotation),
    bc: rotatePoint(box.centerX, box.bottom, cx, cy, rotation),
    br: rotatePoint(box.right, box.bottom, cx, cy, rotation),
    rotate: getRotateHandle(box, rotation),
  };
}

export function hitTestHandles(
  mouseX: number,
  mouseY: number,
  box: BoundingBox,
  tolerance = 12,
  rotation = 0
): ResizeHandle | null {
  const handles = getHandles(box, rotation);

  // 1. Check rotate handle first
  if (Math.hypot(mouseX - handles.rotate.x, mouseY - handles.rotate.y) <= tolerance + 2) {
    return 'rotate';
  }

  // 2. Check resize handles
  for (const [key, pos] of Object.entries(handles)) {
    if (key === 'rotate') continue;
    if (Math.abs(mouseX - pos.x) <= tolerance && Math.abs(mouseY - pos.y) <= tolerance) {
      return key as ResizeHandle;
    }
  }

  // 3. Check inside bounding box (considering rotation)
  const unrotated = rotatePoint(mouseX, mouseY, box.centerX, box.centerY, -rotation);
  if (
    unrotated.x >= box.left &&
    unrotated.x <= box.right &&
    unrotated.y >= box.top &&
    unrotated.y <= box.bottom
  ) {
    return 'move';
  }

  return null;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}
