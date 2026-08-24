import React from 'react';
import { FrameCutoutShape } from '../types/template';

export function getFrameShapeStyles(shape: FrameCutoutShape | string): React.CSSProperties {
  const shapeLower = (shape || '').toLowerCase();

  switch (shapeLower) {
    case 'circle':
      return { clipPath: 'circle(50% at 50% 50%)', borderRadius: '50%' };

    case 'oval':
      return { clipPath: 'ellipse(50% 50% at 50% 50%)', borderRadius: '50%' };

    case 'heart':
      return {
        clipPath: 'polygon(50% 15%, 65% 0%, 85% 0%, 100% 18%, 100% 40%, 50% 95%, 0% 40%, 0% 18%, 15% 0%, 35% 0%)',
      };

    case 'star':
      return {
        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
      };

    case 'triangle':
      return { clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' };

    case 'diamond':
      return { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };

    case 'hexagon':
      return { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' };

    case 'pentagon':
      return { clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)' };

    case 'arch':
      return { borderRadius: '50% 50% 0 0' };

    case 'shield':
      return { clipPath: 'polygon(50% 0%, 100% 20%, 100% 70%, 50% 100%, 0% 70%, 0% 20%)' };

    case 'cloud':
      return { borderRadius: '2rem 3rem 2rem 3rem' };

    case 'rounded':
      return { borderRadius: '1rem' };

    case 'polaroid':
      return { paddingBottom: '2.5rem', backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' };

    case 'square':
    case 'rectangle':
    default:
      return {};
  }
}
