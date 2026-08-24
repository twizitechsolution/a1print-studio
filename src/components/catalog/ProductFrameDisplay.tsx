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

const DEFAULT_SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80',
];

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

  // Determine base background image safely (only use valid non-base64, non-single-bg URLs)
  const baseImgSrc =
    product.baseImageUrl ||
    (product.thumbnail && !product.thumbnail.startsWith('data:') && !product.thumbnail.includes('single-bg')
      ? product.thumbnail
      : null) ||
    (product.image && !product.image.startsWith('data:') && !product.image.includes('single-bg')
      ? product.image
      : null);

  const isDarkPoster = product.id.includes('brother-sister') || product.id.includes('dad') || product.id.includes('dark');

  return (
    <div
      className={`relative w-full aspect-[3/4.4] rounded-xs border-4 sm:border-8 border-black shadow-xl overflow-hidden font-serif select-none ${
        isDarkPoster ? 'bg-black text-white' : 'bg-white text-gray-900'
      } ${className}`}
    >
      {/* Base Frame Poster Image Artwork if valid image exists */}
      {baseImgSrc && (
        <img
          src={baseImgSrc}
          alt={product.title}
          className="w-full h-full object-cover absolute inset-0 pointer-events-none"
          onError={(e: any) => {
            e.target.style.display = 'none';
          }}
        />
      )}

      {/* Render Photo Slots with Cutout Shapes (Falls back to default sample photos so frame is NEVER empty!) */}
      {photoSlots.map((slot, idx) => {
        const photoSrc =
          customPhotoValues[slot.id] ||
          slot.defaultPhotoUrl ||
          DEFAULT_SAMPLE_PHOTOS[idx % DEFAULT_SAMPLE_PHOTOS.length];

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
              onError={(e: any) => {
                e.target.src = DEFAULT_SAMPLE_PHOTOS[idx % DEFAULT_SAMPLE_PHOTOS.length];
              }}
            />
          </div>
        );
      })}

      {/* Render Dynamic Text Zones Overlay */}
      {textZones.map((zone) => {
        const val = customTextValues[zone.id] || zone.defaultValue;
        if (!val) return null;

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
                dateString={val}
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
            {val}
          </div>
        );
      })}
    </div>
  );
};
