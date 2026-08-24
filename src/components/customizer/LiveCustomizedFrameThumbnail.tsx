import React from 'react';
import { CartItem } from '../../types';
import { PhotoSlotConfig, TextZoneConfig } from '../../types/template';
import { getFrameShapeStyles } from '../../utils/shapeStyles';
import { InteractiveCalendarZone } from './InteractiveCalendarZone';

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

  const previewSrc =
    item.customizedFramePreviewUrl ||
    (product?.thumbnail && product.thumbnail.startsWith('data:image') ? product.thumbnail : null) ||
    (product?.image && product.image.startsWith('data:image') ? product.image : null);

  // IF A COMPILED CUSTOMIZED FRAME IMAGE EXISTS, ALWAYS RENDER IT 100% DIRECTLY!
  if (previewSrc) {
    return (
      <div
        className={`relative w-full aspect-[3/4.4] rounded-xs border-2 sm:border-4 border-black shadow-lg bg-white overflow-hidden ${className}`}
      >
        <img
          src={previewSrc}
          alt={product.title || 'Customized Frame'}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const photoSlots: PhotoSlotConfig[] = product.photoSlots || [];
  const textZones: TextZoneConfig[] = product.textZones || [];
  const customText = item.customTextValues || {};

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
        src={product.thumbnail || product.image}
        alt={product.title}
        className="w-full h-full object-cover absolute inset-0 pointer-events-none"
      />

      {/* Render Customer Uploaded Photos */}
      {photoSlots.map((slot) => {
        const photoSrc = customText[slot.id] || (slot.id === 'photo-1' || slot.id === 'babyPhoto' ? item.uploadedPhotoUrl : '');
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

      {/* Render Customer Custom Text Details */}
      {textZones.map((zone) => {
        const val = customText[zone.id] || zone.defaultValue;
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
                scale={effectiveFontScale}
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
              color: zone.color,
              fontFamily: zone.fontFamily,
              fontSize: `${Math.max(3, zone.fontSize * effectiveFontScale)}px`,
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
