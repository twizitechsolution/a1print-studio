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

  // Determine base background image URL safely
  const baseImgSrc =
    product.baseImageUrl ||
    (product.thumbnail && !product.thumbnail.startsWith('data:image') ? product.thumbnail : null) ||
    (product.image && !product.image.startsWith('data:image') ? product.image : null) ||
    'https://lovecraftbyse.com/wp-content/uploads/2025/06/single-bg.webp';

  return (
    <div
      className={`relative w-full aspect-[3/4.4] rounded-xs border-4 sm:border-8 border-black shadow-xl bg-white overflow-hidden font-serif select-none ${className}`}
    >
      {/* Base Frame Poster Image Artwork */}
      <img
        src={baseImgSrc}
        alt={product.title}
        className="w-full h-full object-cover absolute inset-0 pointer-events-none"
      />

      {/* Render Photo Slots with Cutout Shapes */}
      {photoSlots.map((slot) => {
        const photoSrc = customPhotoValues[slot.id] || slot.defaultPhotoUrl;
        if (!photoSrc) return null;
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
                color={zone.color}
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
              color: zone.color || '#FFFFFF',
              fontFamily: zone.fontFamily || 'Jost',
              fontSize: `${Math.max(3, (zone.fontSize || 12) * fontScale)}px`,
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
