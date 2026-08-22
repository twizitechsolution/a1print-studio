import React from 'react';
import { CartItem } from '../../types';
import { PhotoSlotConfig, TextZoneConfig } from '../../types/template';

interface LiveCustomizedFrameThumbnailProps {
  item: CartItem;
  className?: string;
  fontScale?: number;
}

export const LiveCustomizedFrameThumbnail: React.FC<LiveCustomizedFrameThumbnailProps> = ({
  item,
  className = '',
  fontScale,
}) => {
  const product = item.product;

  const photoSlots: PhotoSlotConfig[] = product.photoSlots || [];
  const textZones: TextZoneConfig[] = product.textZones || [];
  const customText = item.customTextValues || {};

  // Auto-calculate fontScale if not explicitly passed
  // If container is small (w-20, w-16, w-24, max-w-[80px]), use 0.22 fontScale
  const effectiveFontScale = fontScale ?? (
    className.includes('w-20') || className.includes('w-16') || className.includes('w-24') || className.includes('max-w-[80px]')
      ? 0.22
      : className.includes('max-w-[260px]')
      ? 0.55
      : 0.25
  );

  return (
    <div
      className={`relative w-full aspect-[3/4.4] rounded-xs border-4 sm:border-8 border-black shadow-xl bg-white overflow-hidden font-serif select-none ${className}`}
    >
      {/* Base Poster Background Image */}
      <img
        src={product.thumbnail}
        alt={product.title}
        className="w-full h-full object-cover absolute inset-0 pointer-events-none"
      />

      {/* Render Customer Uploaded Photos */}
      {photoSlots.map((slot) => {
        const photoSrc = customText[slot.id] || (slot.id === 'photo-1' || slot.id === 'babyPhoto' ? item.uploadedPhotoUrl : '');
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

      {/* Render Customer Custom Text Details with Proportional Font Scaling */}
      {textZones.map((zone) => {
        const val = customText[zone.id] || zone.defaultValue;
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
              fontSize: `${Math.max(2, zone.fontSize * effectiveFontScale)}px`,
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
