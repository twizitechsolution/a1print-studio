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
  fontScale = 0.42,
}) => {
  const photoSlots: PhotoSlotConfig[] = product.photoSlots || [];
  const textZones: TextZoneConfig[] = product.textZones || [];

  return (
    <div
      className={`relative w-full aspect-[3/4.4] rounded-xs border-8 border-black shadow-xl bg-white overflow-hidden font-serif select-none ${className}`}
    >
      {/* Base Frame Poster Image Artwork */}
      <img
        src={product.thumbnail}
        alt={product.title}
        className="w-full h-full object-cover absolute inset-0 pointer-events-none"
      />

      {/* Render Customer Uploaded Photos ONLY (No default photo overlay to protect base poster artwork!) */}
      {photoSlots.map((slot) => {
        const photoSrc = customPhotoValues[slot.id] || slot.defaultPhotoUrl;
        if (!photoSrc) return null;

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
            className="absolute transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap leading-none font-bold"
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              color: zone.color || '#0369A1',
              fontFamily: zone.fontFamily || 'Jost',
              fontSize: `${(zone.fontSize || 12) * fontScale}px`,
              textAlign: zone.align || 'center',
            }}
          >
            {val}
          </div>
        );
      })}
    </div>
  );
};
