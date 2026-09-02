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

  const rawImg =
    (product.baseImageUrl && !product.baseImageUrl.includes('[COMPRESSED_FIRESTORE_PREVIEW]') && product.baseImageUrl.length > 50 ? product.baseImageUrl : null) ||
    (product.images && product.images[0] && product.images[0].length > 50 ? product.images[0] : null) ||
    (product.thumbnail && product.thumbnail.length > 50 ? product.thumbnail : null) ||
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80';

  const masterFrameImgSrc = rawImg;
  const isDarkPoster = product.id.includes('brother-sister') || product.id.includes('dad') || product.id.includes('dark');
  const isLandscape = (product as any)?.orientation === 'landscape';

  return (
    <div
      className={`relative w-full rounded-xs border-4 sm:border-8 border-black shadow-xl overflow-hidden font-serif select-none transition-all ${
        isLandscape ? 'aspect-[4/3]' : 'aspect-[3/4.4]'
      } ${
        isDarkPoster ? 'bg-black text-white' : 'bg-white text-gray-900'
      } ${className}`}
    >
      {/* 1. Master Base Frame Poster Image Background */}
      {masterFrameImgSrc && (
        <img
          src={masterFrameImgSrc}
          alt={product.title}
          className="w-full h-full object-cover absolute inset-0 pointer-events-none"
          onError={(e) => {
            if (product.images && product.images[0] && e.currentTarget.src !== product.images[0]) {
              e.currentTarget.src = product.images[0];
            } else {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80';
            }
          }}
        />
      )}

      {/* 2. Customer Uploaded Photos (or slot cutout placeholders) */}
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

      {/* 3. Dynamic Text Zones Overlay (Renders custom user text OR product default sample text!) */}
      {textZones.map((zone) => {
        const val = customTextValues[zone.id] || zone.defaultValue;
        if (!val) return null;

        const labelLower = (zone.label || '').toLowerCase();
        const idLower = (zone.id || '').toLowerCase();
        const valLower = (zone.defaultValue || '').toLowerCase();

        const isCalendarZone = zone.type === 'calendar' || zone.isCalendar === true;

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
