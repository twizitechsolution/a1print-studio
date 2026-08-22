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

  // Check if customer has actively provided custom text or photos
  const hasCustomText = Object.keys(customTextValues).length > 0;
  const hasCustomPhotos = Object.keys(customPhotoValues).length > 0;

  return (
    <div
      className={`relative w-full aspect-[3/4.4] rounded-xs border-8 border-black shadow-xl bg-white overflow-hidden font-serif select-none ${className}`}
    >
      {/* Base Frame Poster Image (Contains complete high-res sample artwork!) */}
      <img
        src={product.thumbnail}
        alt={product.title}
        className="w-full h-full object-cover absolute inset-0 pointer-events-none"
      />

      {/* Render Customer Uploaded Photos (Only if customer uploaded custom photos) */}
      {hasCustomPhotos &&
        photoSlots.map((slot) => {
          const photoSrc = customPhotoValues[slot.id];
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

      {/* Render Custom Text Overlays (Only if customer has provided customized text values!) */}
      {hasCustomText &&
        textZones.map((zone) => {
          const val = customTextValues[zone.id];
          if (!val) return null;

          return (
            <div
              key={zone.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap leading-none"
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
