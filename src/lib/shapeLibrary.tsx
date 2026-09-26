import React from 'react';

export type ShapeCategory = 'basic' | 'hearts' | 'blobs' | 'retro' | 'nature';

export interface ShapeDefinition {
  id: string;
  name: string;
  category: ShapeCategory;
  svgPath: string;
  viewBox?: string; // default: "0 0 100 100"
}

export const SHAPE_CATEGORIES: { id: ShapeCategory; label: string }[] = [
  { id: 'basic', label: 'Basic Shapes' },
  { id: 'hearts', label: 'Hearts' },
  { id: 'blobs', label: 'Organic & Blobs' },
  { id: 'retro', label: 'Retro & Frames' },
  { id: 'nature', label: 'Flowers & Nature' },
];

export const SHAPES_LIBRARY: ShapeDefinition[] = [
  // ==========================================
  // 1. BASIC GEOMETRIC SHAPES
  // ==========================================
  {
    id: 'circle',
    name: 'Circle',
    category: 'basic',
    svgPath: 'M 50, 0 A 50, 50 0 1, 0 50, 100 A 50, 50 0 1, 0 50, 0 Z',
  },
  {
    id: 'oval',
    name: 'Oval',
    category: 'basic',
    svgPath: 'M 50, 3 C 76, 3 97, 24 97, 50 C 97, 76 76, 97 50, 97 C 24, 97 3, 76 3, 50 C 3, 24 24, 3 50, 3 Z',
  },
  {
    id: 'rounded-rect',
    name: 'Rounded Rectangle',
    category: 'basic',
    svgPath: 'M 18, 2 H 82 A 16, 16 0 0 1 98, 18 V 82 A 16, 16 0 0 1 82, 98 H 18 A 16, 16 0 0 1 2, 82 V 18 A 16, 16 0 0 1 18, 2 Z',
  },
  {
    id: 'arch',
    name: 'Roman Arch',
    category: 'basic',
    svgPath: 'M 2, 98 V 48 A 48, 48 0 0 1 98, 48 V 98 H 2 Z',
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    category: 'basic',
    svgPath: 'M 50, 2 L 95, 26 L 95, 74 L 50, 98 L 5, 74 L 5, 26 Z',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    category: 'basic',
    svgPath: 'M 50, 2 L 98, 50 L 50, 98 L 2, 50 Z',
  },
  {
    id: 'star-5',
    name: '5-Point Star',
    category: 'basic',
    svgPath: 'M 50, 2 L 63, 34 L 98, 36 L 71, 59 L 80, 94 L 50, 74 L 20, 94 L 29, 59 L 2, 36 L 37, 34 Z',
  },
  {
    id: 'octagon',
    name: 'Octagon',
    category: 'basic',
    svgPath: 'M 30, 2 L 70, 2 L 98, 30 L 98, 70 L 70, 98 L 30, 98 L 2, 70 L 2, 30 Z',
  },

  // ==========================================
  // 2. HEARTS
  // ==========================================
  {
    id: 'classic-heart',
    name: 'Classic Heart',
    category: 'hearts',
    svgPath: 'M 50, 88 C 20, 68 2, 50 2, 30 C 2, 14 14, 2 30, 2 C 40, 2 46, 8 50, 15 C 54, 8 60, 2 70, 2 C 86, 2 98, 14 98, 30 C 98, 50 80, 68 50, 88 Z',
  },
  {
    id: 'soft-heart',
    name: 'Chubby Heart',
    category: 'hearts',
    svgPath: 'M 50, 94 C 18, 72 4, 54 4, 32 C 4, 16 16, 4 32, 4 C 42, 4 47, 10 50, 16 C 53, 10 58, 4 68, 4 C 84, 4 96, 16 96, 32 C 96, 54 82, 72 50, 94 Z',
  },
  {
    id: 'romantic-heart',
    name: 'Romantic Heart',
    category: 'hearts',
    svgPath: 'M 50, 84 C 28, 65 6, 48 6, 28 C 6, 12 18, 4 32, 4 C 41, 4 47, 9 50, 14 C 53, 9 59, 4 68, 4 C 82, 4 94, 12 94, 28 C 94, 48 72, 65 50, 84 Z',
  },

  // ==========================================
  // 3. ORGANIC BLOBS
  // ==========================================
  {
    id: 'blob-1',
    name: 'Liquid Blob',
    category: 'blobs',
    svgPath: 'M 32, 8 C 50, 2 78, 8 88, 26 C 98, 44 88, 72 74, 86 C 60, 100 32, 96 16, 84 C 0, 72 2, 42 12, 24 C 18, 12 22, 10 32, 8 Z',
  },
  {
    id: 'blob-2',
    name: 'Wavy Blob',
    category: 'blobs',
    svgPath: 'M 25, 12 C 45, -2 75, 5 88, 25 C 100, 45 88, 78 70, 90 C 50, 102 18, 92 8, 72 C -2, 52 5, 26 25, 12 Z',
  },
  {
    id: 'blob-3',
    name: 'Pebble Stone',
    category: 'blobs',
    svgPath: 'M 28, 10 C 60, 4 92, 18 94, 48 C 96, 78 76, 94 48, 94 C 20, 94 6, 78 6, 52 C 6, 26 14, 12 28, 10 Z',
  },
  {
    id: 'blob-4',
    name: 'Organic Droplet',
    category: 'blobs',
    svgPath: 'M 50, 4 C 74, 4 94, 24 94, 48 C 94, 76 74, 96 48, 96 C 22, 96 6, 74 6, 48 C 6, 24 26, 4 50, 4 Z',
  },

  // ==========================================
  // 4. RETRO & ORNATE FRAMES
  // ==========================================
  {
    id: 'scallop-circle',
    name: 'Scalloped Stamp',
    category: 'retro',
    svgPath: 'M 50, 4 C 55, 4 58, 8 62, 9 C 67, 10 71, 7 75, 9 C 79, 12 80, 17 84, 20 C 87, 24 92, 25 94, 29 C 96, 34 94, 38 95, 43 C 96, 48 99, 52 98, 57 C 97, 62 93, 65 91, 70 C 90, 75 91, 80 88, 84 C 84, 87 79, 87 75, 90 C 71, 92 68, 96 63, 97 C 58, 98 55, 94 50, 94 C 45, 94 42, 98 37, 97 C 32, 96 29, 92 25, 90 C 21, 87 16, 87 12, 84 C 9, 80 10, 75 9, 70 C 7, 65 3, 62 2, 57 C 1, 52 4, 48 5, 43 C 6, 38 4, 34 6, 29 C 8, 25 13, 24 16, 20 C 20, 17 21, 12 25, 9 C 29, 7 33, 10 38, 9 C 42, 8 45, 4 50, 4 Z',
  },
  {
    id: 'ornate-bracket',
    name: 'Vintage Plaque',
    category: 'retro',
    svgPath: 'M 20, 4 C 30, 4 35, 10 50, 10 C 65, 10 70, 4 80, 4 C 92, 4 96, 12 96, 25 C 96, 38 90, 44 90, 50 C 90, 56 96, 62 96, 75 C 96, 88 92, 96 80, 96 C 70, 96 65, 90 50, 90 C 35, 90 30, 96 20, 96 C 8, 96 4, 88 4, 75 C 4, 62 10, 56 10, 50 C 10, 44 4, 38 4, 25 C 4, 12 8, 4 20, 4 Z',
  },
  {
    id: 'stamp-rect',
    name: 'Postage Stamp',
    category: 'retro',
    svgPath: 'M 8, 4 A 4, 4 0 0 0 16, 4 A 4, 4 0 0 0 24, 4 A 4, 4 0 0 0 32, 4 A 4, 4 0 0 0 40, 4 A 4, 4 0 0 0 48, 4 A 4, 4 0 0 0 56, 4 A 4, 4 0 0 0 64, 4 A 4, 4 0 0 0 72, 4 A 4, 4 0 0 0 80, 4 A 4, 4 0 0 0 88, 4 A 4, 4 0 0 0 96, 4 L 96, 12 A 4, 4 0 0 0 96, 20 A 4, 4 0 0 0 96, 28 A 4, 4 0 0 0 96, 36 A 4, 4 0 0 0 96, 44 A 4, 4 0 0 0 96, 52 A 4, 4 0 0 0 96, 60 A 4, 4 0 0 0 96, 68 A 4, 4 0 0 0 96, 76 A 4, 4 0 0 0 96, 84 A 4, 4 0 0 0 96, 92 L 96, 96 L 88, 96 A 4, 4 0 0 0 80, 96 A 4, 4 0 0 0 72, 96 A 4, 4 0 0 0 64, 96 A 4, 4 0 0 0 56, 96 A 4, 4 0 0 0 48, 96 A 4, 4 0 0 0 40, 96 A 4, 4 0 0 0 32, 96 A 4, 4 0 0 0 24, 96 A 4, 4 0 0 0 16, 96 A 4, 4 0 0 0 8, 96 L 4, 96 L 4, 88 A 4, 4 0 0 0 4, 80 A 4, 4 0 0 0 4, 72 A 4, 4 0 0 0 4, 64 A 4, 4 0 0 0 4, 56 A 4, 4 0 0 0 4, 48 A 4, 4 0 0 0 4, 40 A 4, 4 0 0 0 4, 32 A 4, 4 0 0 0 4, 24 A 4, 4 0 0 0 4, 16 A 4, 4 0 0 0 4, 8 L 4, 4 Z',
  },

  // ==========================================
  // 5. FLOWERS & NATURE
  // ==========================================
  {
    id: 'flower-8',
    name: 'Daisy Flower',
    category: 'nature',
    svgPath: 'M 50, 30 C 50, 10 50, 4 50, 2 C 54, 4 56, 12 58, 22 C 68, 12 76, 8 78, 10 C 80, 12 76, 20 68, 30 C 78, 22 86, 20 88, 22 C 90, 24 86, 32 76, 42 C 86, 44 94, 46 96, 50 C 94, 54 86, 56 76, 58 C 86, 68 90, 76 88, 78 C 86, 80 78, 78 68, 70 C 76, 80 80, 88 78, 90 C 76, 92 68, 88 58, 78 C 56, 88 54, 96 50, 98 C 46, 96 44, 88 42, 78 C 32, 88 24, 92 22, 90 C 20, 88 24, 80 32, 70 C 22, 78 14, 80 12, 78 C 10, 76 14, 68 24, 58 C 14, 56 6, 54 4, 50 C 6, 46 14, 44 24, 42 C 14, 32 10, 24 12, 22 C 14, 20 22, 22 32, 30 C 24, 20 20, 12 22, 10 C 24, 8 32, 12 42, 22 C 44, 12 46, 4 50, 2 Z',
  },
  {
    id: 'cloud',
    name: 'Fluffy Cloud',
    category: 'nature',
    svgPath: 'M 24, 80 C 14, 80 6, 72 6, 62 C 6, 53 13, 46 21, 44 C 23, 30 35, 20 50, 20 C 62, 20 73, 27 77, 38 C 83, 38 90, 44 92, 51 C 96, 56 96, 63 92, 69 C 89, 76 82, 80 74, 80 Z',
  },
  {
    id: 'leaf-drop',
    name: 'Teardrop / Leaf',
    category: 'nature',
    svgPath: 'M 50, 2 C 50, 2 92, 44 92, 68 C 92, 85 74, 98 50, 98 C 26, 98 8, 85 8, 68 C 8, 44 50, 2 50, 2 Z',
  },
];

/**
 * Lookup a shape definition by ID.
 * Returns undefined if id is missing or not found.
 */
export function getShapeById(id?: string): ShapeDefinition | undefined {
  if (!id) return undefined;
  return SHAPES_LIBRARY.find((s) => s.id === id);
}

/**
 * Canva-Style Miniature Landscape Preview Thumbnail for Frame Shapes.
 * Displays the iconic blue sky, fluffy cloud, bright sun, and rolling green hills
 * clipped inside the shape mask so it is instantly recognizable as a photo frame!
 */
export const ShapeThumbnail: React.FC<{
  shape: ShapeDefinition;
  className?: string;
  selected?: boolean;
}> = ({ shape, className = 'w-16 h-16', selected = false }) => {
  const clipId = `shape-thumb-clip-${shape.id}`;

  return (
    <div
      className={`relative rounded-xl p-1.5 transition-all flex flex-col items-center justify-center ${
        selected
          ? 'bg-blue-600/30 border-2 border-blue-500 shadow-md shadow-blue-500/20'
          : 'bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/60 hover:border-slate-500'
      }`}
    >
      <svg
        viewBox="0 0 100 100"
        className={`${className} transition-transform group-hover:scale-105 drop-shadow-sm`}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={shape.svgPath} />
          </clipPath>
        </defs>

        {/* Canva-Style Landscape Interior */}
        <g clipPath={`url(#${clipId})`}>
          {/* Blue Sky */}
          <rect width="100" height="100" fill="#78C2F5" />
          {/* Radiant Sun */}
          <circle cx="80" cy="24" r="14" fill="#FFD15C" />
          {/* Soft White Cloud */}
          <path
            d="M 15,30 Q 22,20 30,28 Q 38,20 46,28 Q 50,35 44,38 Q 18,38 15,30 Z"
            fill="#FFFFFF"
            opacity="0.9"
          />
          {/* Rolling Back Hill */}
          <path d="M -10,105 Q 30,55 70,80 Q 95,95 110,105 Z" fill="#71BF43" />
          {/* Rolling Front Hill */}
          <path d="M 20,105 Q 60,65 110,80 L 110,105 Z" fill="#4B9E2B" />
        </g>

        {/* Crisp Shape Outline */}
        <path
          d={shape.svgPath}
          fill="none"
          stroke={selected ? '#3B82F6' : '#94A3B8'}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[10px] font-medium text-slate-300 mt-1 truncate max-w-full text-center px-1">
        {shape.name}
      </span>
    </div>
  );
};
