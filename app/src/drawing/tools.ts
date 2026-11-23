/**
 * DOODL Drawing Tool Definitions & Palette
 */

import type { DrawingTool } from '@shared/game-types';

export interface ToolConfig {
  id: DrawingTool;
  label: string;
  icon: string;
}

export const DRAWING_TOOLS: ToolConfig[] = [
  { id: 'pencil', label: 'Pencil', icon: '✏️' },
  { id: 'eraser', label: 'Eraser', icon: '🧹' },
  { id: 'line', label: 'Line', icon: '📏' },
  { id: 'rainbow', label: 'Rainbow', icon: '🌈' },
  { id: 'sticker', label: 'Stickers', icon: '⭐' },
];

export const COLOR_PALETTE = [
  '#202638', // Dark Ink
  '#fc735d', // Coral Accent
  '#ffb347', // Warm Orange
  '#f4d953', // Yellow
  '#56bf84', // Mint Green
  '#48b9ca', // Teal
  '#6798ef', // Sky Blue
  '#976de0', // Purple
  '#e97cb6', // Pink
  '#9c745d', // Earth Brown
  '#ffffff', // White
  '#8e929e', // Soft Slate
];

export const BRUSH_SIZES = [
  { label: 'Fine', size: 3 },
  { label: 'Medium', size: 7 },
  { label: 'Thick', size: 14 },
  { label: 'Broad', size: 24 },
];

export const STICKERS = ['⭐', '❤️', '🔥', '✨', '👑', '🎉', '💡', '🚀'];
