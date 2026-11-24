/**
 * DOODL Connected Player Sidebar Component
 */

import React from 'react';
import type { PublicSeat } from '@shared/game-types';
import { Avatar } from './Avatar';

interface PlayerSidebarProps {
  seats: PublicSeat[];
  currentDrawerIds: string[];
  mySeatId: string;
}

export const PlayerSidebar: React.FC<PlayerSidebarProps> = ({
  seats,
  currentDrawerIds,
  mySeatId,
}) => {
  const sorted = [...seats].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white border border-[#e9e7e2] rounded-xl sm:rounded-2xl overflow-hidden shadow-sm flex flex-col h-full min-h-0">
      <div className="h-10 sm:h-12 px-2.5 sm:px-4 border-b border-[#f0eee9] flex items-center justify-between bg-[#faf9f6]">
        <h3 className="font-head font-extrabold text-xs sm:text-sm text-[#1f2330]">
          Players ({seats.length})
        </h3>
        <span className="text-[9px] sm:text-[10px] font-black uppercase text-[#88ba92] bg-[#eaf7ed] px-1.5 sm:px-2 py-0.5 rounded-full">
          LIVE
        </span>
      </div>

      <div className="p-1.5 sm:p-2.5 flex-1 overflow-y-auto space-y-1 sm:space-y-1.5 min-h-0">
        {sorted.map((seat, index) => {
          const isDrawer = currentDrawerIds.includes(seat.id);
          const isMe = seat.id === mySeatId;

          return (
            <div
              key={seat.id}
              className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border transition-all ${
                isDrawer
                  ? 'bg-[#fff3ef] border-[#fbb8a1]'
                  : seat.guessedThisTurn
                  ? 'bg-[#eaf7ed] border-[#c0e8c8]'
                  : 'bg-[#fdfcfb] border-[#eae8e3]'
              }`}
            >
              {/* Rank */}
              <span className="w-4 sm:w-5 text-center font-head font-extrabold text-[10px] sm:text-xs text-[#858793]">
                #{index + 1}
              </span>

              {/* Avatar */}
              <Avatar face={seat.avatarFace} color={seat.avatarColor} size="small" />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[11px] sm:text-xs truncate text-[#1f2330]">
                    {seat.nickname}
                  </span>
                  {isMe && (
                    <span className="text-[8px] sm:text-[9px] font-black bg-[#e9e8e4] text-[#6b6e7a] px-1 py-0.2 rounded">
                      YOU
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-[#9c9da7] font-semibold">
                  {isDrawer ? (
                    <span className="text-[#fd7259] font-black">🎨 Drawing</span>
                  ) : seat.guessedThisTurn ? (
                    <span className="text-[#3bbc77] font-black">✓ Guessed!</span>
                  ) : (
                    <span>Guessing...</span>
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="font-head font-extrabold text-xs text-[#1f2330]">
                {seat.score} <span className="text-[9px] text-[#9c9da7] font-normal">pts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
