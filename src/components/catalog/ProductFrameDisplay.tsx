import React from 'react';
import { Product } from '../../types';
import { PhotoSlotConfig, TextZoneConfig } from '../../types/template';

interface ProductFrameDisplayProps {
  product: Product;
  customTextValues?: Record<string, string>;
  customPhotoValues?: Record<string, string>;
  className?: string;
  fontScale?: number;
}

export const ProductFrameDisplay: React.FC<ProductFrameDisplayProps> = ({
  product,
  customTextValues = {},
  customPhotoValues = {},
  className = '',
  fontScale = 0.75,
}) => {
  const photoSlots: PhotoSlotConfig[] = product.photoSlots || [];
  const textZones: TextZoneConfig[] = product.textZones || [];

  return (
    <div
      className={`relative w-full aspect-[3/4.4] rounded-xs border-8 border-black shadow-xl bg-white overflow-hidden font-serif select-none ${className}`}
    >
      {/* Base Frame Poster Image */}
      <img
        src={product.thumbnail}
        alt={product.title}
        className="w-full h-full object-cover absolute inset-0 pointer-events-none"
      />

      {/* Render Photo Slot Overlay (Customer photo or transparent layer) */}
      {photoSlots.map((slot) => {
        const photoSrc = customPhotoValues[slot.id];
        if (!photoSrc) return null; // Transparent layer: Allows base poster sample artwork to show through!

        return (
          <div
            key={slot.id}
            className={`absolute overflow-hidden p-0 border-0 shadow-xs bg-transparent ${
              slot.shape === 'circle'
                ? 'rounded-full'
                : slot.shape === 'rounded'
                ? 'rounded-xl'
                : 'rounded-none'
            }`}
            style={{
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              width: `${slot.width}%`,
              height: `${slot.height}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <img
              src={photoSrc}
              alt={slot.label}
              className="w-full h-full object-cover rounded-[inherit]"
            />
          </div>
        );
      })}

      {/* Render Dynamic Text Zones Overlay (Renders customText OR default sample text data!) */}
      {textZones.map((zone) => {
        const val = customTextValues[zone.id] || zone.defaultValue;
        if (!val) return null;

        return (
          <div
            key={zone.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              color: zone.color,
              fontFamily: zone.fontFamily,
              fontSize: `${zone.fontSize * fontScale}px`,
              fontWeight: 'bold',
              textAlign: zone.align,
            }}
          >
            {val}
          </div>
        );
      })}
    </div>
  );
};
