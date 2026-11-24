/**
 * DOODL Game HUD (Header Status, Timer, Word Bar)
 */

import React from 'react';
import type { RoomPhase } from '@shared/game-types';

interface GameHUDProps {
  phase: RoomPhase;
  roundNumber: number;
  totalRounds: number;
  deadlineAtMs: number | null;
  maskedWord: string | null;
  isDrawer: boolean;
  drawerNickname: string;
  gameMode?: string;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  phase,
  roundNumber,
  totalRounds,
  deadlineAtMs,
  maskedWord,
  isDrawer,
  drawerNickname,
  gameMode = 'Classic',
}) => {
  const [timeLeft, setTimeLeft] = React.useState<number>(0);

  React.useEffect(() => {
    if (!deadlineAtMs) {
      setTimeLeft(0);
      return;
    }

    const update = () => {
      const remaining = Math.max(0, Math.ceil((deadlineAtMs - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    update();
    const interval = setInterval(update, 200);
    return () => clearInterval(interval);
  }, [deadlineAtMs]);

  const letterCount = maskedWord
    ? maskedWord.replace(/[^A-Za-z0-9_]/g, '').length
    : 0;

  return (
    <div className="space-y-2">
      {/* Dark Round Status Bar */}
      <div className="bg-[#24293a] text-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-md select-none">
        {/* Left: Turn / Round & Mode */}
        <div className="min-w-[70px] sm:min-w-[120px]">
          <div className="text-[10px] sm:text-xs font-bold text-[#adb1bd] uppercase tracking-wider">
            ROUND <b className="text-[#fd7259]">{roundNumber}</b> OF {totalRounds}
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-[#dfe0e9] capitalize">
            {gameMode.replace('_', ' ')}
          </div>
        </div>

        {/* Center: Masked Word & Category / Letters */}
        <div className="text-center px-2 flex-1 min-w-0">
          <div className="text-[9px] sm:text-[10px] font-bold tracking-widest text-[#9ea3b4] uppercase">
            {phase === 'DRAWING'
              ? isDrawer
                ? 'YOUR SECRET WORD:'
                : 'WHAT AM I DRAWING?'
              : phase === 'SELECTING_WORD'
              ? `${drawerNickname} is choosing a word...`
              : phase === 'REVEAL'
              ? 'WORD REVEALED!'
              : phase.replace('_', ' ')}
          </div>
          <div className="font-head font-extrabold text-lg sm:text-2xl tracking-[0.2em] sm:tracking-[0.25em] text-[#fff] font-mono truncate">
            {maskedWord || '...'}
          </div>
          {letterCount > 0 && phase === 'DRAWING' && !isDrawer && (
            <div className="text-[10px] text-[#f8d3a0] font-bold">
              {letterCount} letters · Auto reveals enabled
            </div>
          )}
        </div>

        {/* Right: Countdown Clock */}
        <div className="min-w-[65px] sm:min-w-[100px] flex items-center justify-end gap-2">
          <div className="flex flex-col items-end">
            <span className="font-head font-black text-xl sm:text-2xl text-white font-mono leading-none">
              {timeLeft}
            </span>
            <span className="text-[8px] sm:text-[9px] font-bold text-[#989aa4] uppercase">
              sec left
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
