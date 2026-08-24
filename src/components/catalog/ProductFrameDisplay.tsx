import React from 'react';
import { Product } from '../../types';
import { PhotoSlotConfig, TextZoneConfig } from '../../types/template';
import { getFrameShapeStyles } from '../../utils/shapeStyles';
import { InteractiveCalendarZone } from '../customizer/InteractiveCalendarZone';

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
  if (!product) return null;
  const photoSlots: PhotoSlotConfig[] = product.photoSlots || [];
  const textZones: TextZoneConfig[] = product.textZones || [];

  // Always resolve the exact master frame poster artwork image URL matching the Individual Product Page!
  const masterFrameImgSrc =
    product.baseImageUrl ||
    (product.thumbnail && !product.thumbnail.startsWith('data:') && !product.thumbnail.includes('single-bg')
      ? product.thumbnail
      : null) ||
    (product.image && !product.image.startsWith('data:') && !product.image.includes('single-bg')
      ? product.image
      : null) ||
    (product.images && product.images[0] && !product.images[0].startsWith('data:') ? product.images[0] : null);

  const isDarkPoster = product.id.includes('brother-sister') || product.id.includes('dad') || product.id.includes('dark');

  return (
    <div
      className={`relative w-full aspect-[3/4.4] rounded-xs border-4 sm:border-8 border-black shadow-xl overflow-hidden font-serif select-none ${
        isDarkPoster ? 'bg-black text-white' : 'bg-white text-gray-900'
      } ${className}`}
    >
      {/* 1. Exact Master Frame Poster Image Artwork (Matching Individual Product Page 100%!) */}
      {masterFrameImgSrc && (
        <img
          src={masterFrameImgSrc}
          alt={product.title}
          className="w-full h-full object-cover absolute inset-0 pointer-events-none"
        />
      )}

      {/* 2. Customer Uploaded Photos ONLY (Transparent by default until user uploads custom photo!) */}
      {photoSlots.map((slot) => {
        const photoSrc = customPhotoValues[slot.id] || slot.defaultPhotoUrl;
        if (!photoSrc) return null; // Transparent layer: Lets master frame artwork show through 100%!

        const shapeStyles = getFrameShapeStyles(slot.shape);

        return (
          <div
            key={slot.id}
            className="absolute overflow-hidden p-0 border-0 bg-transparent"
            style={{
              left: `${slot.x}%`,
              top: `${slot.y}%`,
              width: `${slot.width}%`,
              height: `${slot.height}%`,
              transform: 'translate(-50%, -50%)',
              ...shapeStyles,
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

      {/* 3. Dynamic Text Zones Overlay (Only renders if custom text is provided, otherwise lets master frame text show through!) */}
      {textZones.map((zone) => {
        const customVal = customTextValues[zone.id];
        if (!customVal) return null; // Lets master frame artwork text show through!

        const labelLower = (zone.label || '').toLowerCase();
        const idLower = (zone.id || '').toLowerCase();
        const valLower = (zone.defaultValue || '').toLowerCase();

        const isCalendarZone =
          zone.isCalendar ||
          zone.type === 'calendar' ||
          labelLower.includes('calendar') ||
          labelLower.includes('date') ||
          labelLower.includes('dob') ||
          idLower.includes('calendar') ||
          idLower.includes('date') ||
          valLower.includes('february') ||
          valLower.includes('january');

        if (isCalendarZone) {
          return (
            <div
              key={zone.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
              }}
            >
              <InteractiveCalendarZone
                dateString={customVal}
                color={zone.color || (isDarkPoster ? '#FFFFFF' : '#160E4B')}
                fontFamily={zone.fontFamily}
                scale={fontScale}
              />
            </div>
          );
        }

        return (
          <div
            key={zone.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 whitespace-pre-wrap break-words leading-tight"
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: zone.maxWidth ? `${zone.maxWidth}%` : '85%',
              maxWidth: zone.maxWidth ? `${zone.maxWidth}%` : '85%',
              color: zone.color || (isDarkPoster ? '#FFFFFF' : '#160E4B'),
              fontFamily: zone.fontFamily || 'Jost',
              fontSize: `${Math.max(3.5, (zone.fontSize || 12) * fontScale)}px`,
              fontWeight: 'bold',
              textAlign: zone.align || 'center',
            }}
          >
            {customVal}
          </div>
        );
      })}
    </div>
  );
};
