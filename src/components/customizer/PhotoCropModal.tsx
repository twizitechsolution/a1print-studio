import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, Check, X, Move } from 'lucide-react';

interface PhotoCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  aspectRatio?: number;
  shape?: 'rectangle' | 'circle';
  onCropAndSubmit: (croppedUrl: string) => void;
  onCancel: () => void;
}

export const PhotoCropModal: React.FC<PhotoCropModalProps> = ({
  isOpen,
  imageSrc,
  aspectRatio = 1,
  shape = 'rectangle',
  onCropAndSubmit,
  onCancel,
}) => {
  const [scale, setScale] = useState<number>(1.0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  if (!isOpen || !imageSrc) return null;

  const validRatio = aspectRatio > 0 ? aspectRatio : 1;

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
    // Generate scaled & cropped image using HTML5 Canvas matching slot aspect ratio
    const img = new Image();
    img.onload = () => {
      const targetW = 800;
      const targetH = Math.max(100, Math.round(800 / validRatio));
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return onCropAndSubmit(imageSrc);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetW, targetH);

      const drawW = targetW * scale;
      const drawH = (img.height / img.width) * drawW;
      const drawX = (targetW - drawW) / 2 + position.x * (targetW / 300);
      const drawY = (targetH - drawH) / 2 + position.y * (targetH / 300);

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      const croppedResult = canvas.toDataURL('image/jpeg', 0.90);
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

        {/* Auto-Fitted Crop Window Container matching slot aspect ratio */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          className="relative w-full bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-300 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-inner max-h-[300px]"
          style={{ aspectRatio: `${validRatio}` }}
        >
          <img
            src={imageSrc}
            alt="Crop Preview"
            className="max-w-full max-h-full object-contain pointer-events-none transition-transform duration-75"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            }}
          />

          {/* Cutout Guide Overlay */}
          <div
            className={`absolute inset-3 border-2 border-dashed border-[#F82BA9]/80 pointer-events-none shadow-2xs ${
              shape === 'circle' ? 'rounded-full' : 'rounded-xl'
            }`}
          />
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
