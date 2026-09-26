import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, Check, X, Move } from 'lucide-react';
import { getShapeById } from '../../lib/shapeLibrary';

interface PhotoCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  aspectRatio?: number;
  shape?: 'rectangle' | 'circle';
  shapeId?: string;
  borderWidth?: number;
  borderColor?: string;
  onCropAndSubmit: (croppedUrl: string) => void;
  onCancel: () => void;
}

export const PhotoCropModal: React.FC<PhotoCropModalProps> = ({
  isOpen,
  imageSrc,
  aspectRatio = 1,
  shape = 'rectangle',
  shapeId,
  borderWidth = 0,
  borderColor = '#EF4444',
  onCropAndSubmit,
  onCancel,
}) => {
  const shapeDef = getShapeById(shapeId);
  const isShaped = Boolean(shapeDef || shape === 'circle');
  const effectiveRatio = isShaped ? 1.0 : (aspectRatio > 0 ? aspectRatio : 1);

  const [scale, setScale] = useState<number>(1.0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cropBoxRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !imageSrc) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y,
    });
  };

  const handleSubmit = () => {
    const img = new Image();
    img.onload = () => {
      const box = cropBoxRef.current?.getBoundingClientRect();
      const boxW = box?.width || 300;
      const boxH = box?.height || (boxW / effectiveRatio);

      const targetW = 800;
      const targetH = Math.max(100, Math.round(800 / effectiveRatio));
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return onCropAndSubmit(imageSrc);

      ctx.clearRect(0, 0, targetW, targetH);

      const canvasScale = targetW / boxW;
      const imgRatio = (img.naturalWidth || 800) / (img.naturalHeight || 800);
      const boxRatio = boxW / boxH;

      let baseW = boxW;
      let baseH = boxH;
      if (imgRatio >= boxRatio) {
        baseH = boxH;
        baseW = boxH * imgRatio;
      } else {
        baseW = boxW;
        baseH = boxW / imgRatio;
      }

      const renderedW = baseW * scale;
      const renderedH = baseH * scale;
      const renderedX = (boxW - renderedW) / 2 + position.x;
      const renderedY = (boxH - renderedH) / 2 + position.y;

      const drawX = renderedX * canvasScale;
      const drawY = renderedY * canvasScale;
      const drawW = renderedW * canvasScale;
      const drawH = renderedH * canvasScale;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      const croppedResult = canvas.toDataURL('image/jpeg', 0.92);
      onCropAndSubmit(croppedResult);
    };
    img.onerror = () => onCropAndSubmit(imageSrc);
    img.src = imageSrc;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-jost animate-fadeIn select-none">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center border border-gray-200">
        
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h3 className="font-bold text-sm text-[#160E4B] flex items-center gap-1.5">
            <Move className="w-4 h-4 text-[#F82BA9]" /> Crop & Position Photo
          </h3>
          <span className="text-[10px] text-gray-400 font-bold">Drag to position photo</span>
        </div>

        {/* Auto-Fitted Crop Window Container */}
        <div
          ref={cropBoxRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          className="relative w-full bg-slate-900 rounded-2xl overflow-hidden border-2 border-gray-300 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-inner max-h-[300px]"
          style={{ aspectRatio: `${effectiveRatio}` }}
        >
          <img
            src={imageSrc}
            alt="Crop Preview"
            className="pointer-events-none transition-transform duration-75 select-none"
            style={{
              minWidth: '100%',
              minHeight: '100%',
              maxWidth: 'none',
              maxHeight: 'none',
              width: 'auto',
              height: 'auto',
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            }}
          />

          {/* Cutout Guide Overlay */}
          {shapeDef ? (
            <div className="absolute inset-0 pointer-events-none">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full"
              >
                <defs>
                  <mask id={`crop-mask-${shapeDef.id}`}>
                    <rect width="100" height="100" fill="white" />
                    <path d={shapeDef.svgPath} fill="black" />
                  </mask>
                </defs>
                {/* Semi-transparent dark vignette outside the shape */}
                <rect
                  width="100"
                  height="100"
                  fill="rgba(0,0,0,0.58)"
                  mask={`url(#crop-mask-${shapeDef.id})`}
                />
                {/* Border outline: renders styled solid border if configured, else guide outline */}
                {borderWidth > 0 ? (
                  <path
                    d={shapeDef.svgPath}
                    fill="none"
                    stroke={borderColor || '#EF4444'}
                    strokeWidth={Math.max(2.5, borderWidth * 0.7)}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d={shapeDef.svgPath}
                    fill="none"
                    stroke="#F82BA9"
                    strokeWidth="2.2"
                    strokeDasharray="4 3"
                  />
                )}
              </svg>
            </div>
          ) : (
            <div
              className={`absolute inset-3 pointer-events-none ${
                shape === 'circle' ? 'rounded-full' : 'rounded-xl'
              } ${
                borderWidth > 0
                  ? ''
                  : 'border-2 border-dashed border-[#F82BA9]/80 shadow-2xs'
              }`}
              style={
                borderWidth > 0
                  ? {
                      borderWidth: `${Math.max(2, borderWidth * 0.7)}px`,
                      borderColor: borderColor || '#EF4444',
                      borderStyle: 'solid',
                    }
                  : undefined
              }
            />
          )}
        </div>

        {/* Zoom Range Slider Control */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
            <span>ZOOM LEVEL</span>
            <span className="text-[#F82BA9] font-mono">{Math.round(scale * 100)}%</span>
          </div>
          <div className="flex items-center justify-center gap-3 px-1">
            <ZoomOut className="w-4 h-4 text-gray-400" />
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full accent-[#F82BA9] cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Submit & Cancel Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-3 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" /> Crop & Submit
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3 bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
