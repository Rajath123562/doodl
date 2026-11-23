/**
 * DOODL Original Avatar SVG Component
 * Implements 6 distinct hairstyles and 6 color themes.
 */

import React from 'react';

interface AvatarProps {
  face?: number; // 0..5
  color?: string; // 'coral' | 'blue' | 'green' | 'pink' | 'purple' | 'yellow'
  size?: 'small' | 'medium' | 'large' | 'huge';
  className?: string;
}

const HAIRSTYLES = [
  '<path d="M12 16c1-12 29-15 40-1l-3 16-8-11-12 4-10-4-5 12Z" fill="#533b39"/>',
  '<path d="M12 20C7 2 50 0 53 21l-6-5-5 6-5-10-7 10-5-8-7 9Z" fill="#27354b"/>',
  '<path d="M10 26C4 1 49-4 53 24L45 15 35 22 23 15 12 28Z" fill="#75485c"/>',
  '<path d="M9 26c-3-19 33-26 43-8l-7 6-6-14-10 10-10-5-8 16Z" fill="#383d37"/>',
  '<path d="M11 20C10 5 41-5 52 22l-11-5-6-9-10 12-12-1Z" fill="#594d7a"/>',
  '<path d="M11 21C14 3 49 2 51 22l-8-8-10 4-8-6-11 12Z" fill="#835632"/>',
];

const COLOR_MAP: Record<string, { base: string; face: string }> = {
  coral: { base: '#ffd8cd', face: '#f6c6a1' },
  blue: { base: '#d8e7ff', face: '#f2b994' },
  green: { base: '#d5f8e4', face: '#ecb891' },
  pink: { base: '#ffe1eb', face: '#f4c9aa' },
  purple: { base: '#e5dcff', face: '#e0ab86' },
  yellow: { base: '#fff1bd', face: '#dfad89' },
};

const SIZE_CLASSES = {
  small: 'w-7 h-7',
  medium: 'w-10 h-10',
  large: 'w-14 h-14',
  huge: 'w-20 h-20',
};

export const Avatar: React.FC<AvatarProps> = ({
  face = 0,
  color = 'coral',
  size = 'medium',
  className = '',
}) => {
  const safeFace = Math.max(0, Math.min(5, Math.floor(face)));
  const theme = COLOR_MAP[color] || COLOR_MAP.coral;
  const hair = HAIRSTYLES[safeFace];

  const svgInner = `
    <circle cx="32" cy="44" r="29" fill="${theme.face}"/>
    ${hair}
    <ellipse cx="24" cy="35" rx="2.7" ry="3.5" fill="#292f38"/>
    <ellipse cx="41" cy="35" rx="2.7" ry="3.5" fill="#292f38"/>
    <path d="M27 45q5 5 10 0" stroke="#8f5152" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <circle cx="16" cy="41" r="4" fill="#ee9299" opacity=".4"/>
    <circle cx="49" cy="41" r="4" fill="#ee9299" opacity=".4"/>
  `;

  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden border-2 border-white shadow-[0_0_0_1px_#ebe8e1] flex-none select-none ${SIZE_CLASSES[size]} ${className}`}
      style={{ backgroundColor: theme.base }}
    >
      <svg
        viewBox="0 0 64 64"
        className="w-full h-full block"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: svgInner }}
      />
    </span>
  );
};
