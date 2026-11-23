/**
 * DOODL Drawing Toolbar Component
 */

import React from 'react';
import type { DrawingTool } from '@shared/game-types';
import { DRAWING_TOOLS, COLOR_PALETTE, BRUSH_SIZES, STICKERS } from '../drawing/tools';

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  activeColor: string;
  activeSize: number;
  activeSticker: string;
  canUndo: boolean;
  canRedo: boolean;
  onSelectTool: (tool: DrawingTool) => void;
  onSelectColor: (color: string) => void;
  onSelectSize: (size: number) => void;
  onSelectSticker: (sticker: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  activeColor,
  activeSize,
  activeSticker,
  canUndo,
  canRedo,
  onSelectTool,
  onSelectColor,
  onSelectSize,
  onSelectSticker,
  onUndo,
  onRedo,
  onClear,
  disabled = false,
}) => {
  return (
    <div className="bg-white border border-[#e9e7e2] border-t-0 rounded-b-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm select-none">
      {/* Tools group */}
      <div className="flex items-center gap-1.5">
        {DRAWING_TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectTool(t.id)}
            title={t.label}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-all ${
              activeTool === t.id
                ? 'bg-[#22283a] text-white border-[#22283a] shadow-sm'
                : 'bg-white text-[#6e707d] border-[#e9e8e4] hover:border-[#fd7259]'
            } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
          >
            {t.icon}
          </button>
        ))}

        {activeTool === 'sticker' && (
          <div className="flex items-center gap-1 bg-[#fbfaf8] border border-[#e8e5de] rounded-xl px-2 py-1">
            {STICKERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSelectSticker(s)}
                className={`text-lg p-1 rounded-lg transition-transform ${
                  activeSticker === s ? 'scale-125 bg-white shadow-sm' : 'hover:scale-110'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Colors group */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {COLOR_PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            disabled={disabled || activeTool === 'eraser' || activeTool === 'rainbow'}
            onClick={() => onSelectColor(c)}
            style={{ backgroundColor: c }}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${
              activeColor === c && activeTool !== 'eraser' && activeTool !== 'rainbow'
                ? 'border-[#22283a] scale-110 shadow-md ring-2 ring-[#22283a]/20'
                : 'border-white hover:scale-105'
            } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          />
        ))}
      </div>

      {/* Sizes and Actions group */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-[#f8f7f4] border border-[#e9e7e2] rounded-xl p-1">
          {BRUSH_SIZES.map((b) => (
            <button
              key={b.size}
              type="button"
              disabled={disabled}
              onClick={() => onSelectSize(b.size)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                activeSize === b.size
                  ? 'bg-white text-[#1f2330] shadow-sm'
                  : 'text-[#8c8e98] hover:text-[#1f2330]'
              }`}
            >
              <span
                className="rounded-full bg-current block"
                style={{ width: Math.min(16, b.size), height: Math.min(16, b.size) }}
              />
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-[#e5e2dd]" />

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={disabled || !canUndo}
            onClick={onUndo}
            title="Undo (Ctrl+Z)"
            className="w-9 h-9 rounded-xl border border-[#e9e8e4] bg-white flex items-center justify-center text-sm font-bold text-[#6e707d] hover:border-[#fd7259] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            ↩
          </button>
          <button
            type="button"
            disabled={disabled || !canRedo}
            onClick={onRedo}
            title="Redo"
            className="w-9 h-9 rounded-xl border border-[#e9e8e4] bg-white flex items-center justify-center text-sm font-bold text-[#6e707d] hover:border-[#fd7259] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            ↪
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onClear}
            title="Clear Canvas"
            className="w-9 h-9 rounded-xl border border-[#e9e8e4] bg-white flex items-center justify-center text-sm font-bold text-[#e95d45] hover:bg-[#fff3ef] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};
