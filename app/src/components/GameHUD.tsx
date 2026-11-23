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
}

export const GameHUD: React.FC<GameHUDProps> = ({
  phase,
  roundNumber,
  totalRounds,
  deadlineAtMs,
  maskedWord,
  isDrawer,
  drawerNickname,
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

  return (
    <div className="space-y-3">
      {/* Top Meta Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-wider text-[#8e929e]">
            ROUND <b className="text-[#fd7259]">{roundNumber}</b> OF {totalRounds}
          </div>
          <div className="font-head font-extrabold text-xl text-[#1f2330]">
            {phase === 'SELECTING_WORD' && `${drawerNickname} is choosing a word...`}
            {phase === 'DRAWING' && (isDrawer ? 'You are drawing!' : `${drawerNickname} is drawing`)}
            {phase === 'REVEAL' && 'Word Revealed!'}
            {phase === 'ROUND_RESULTS' && 'Round Results'}
            {phase === 'MATCH_RESULTS' && 'Match Complete!'}
          </div>
        </div>

        {/* Circular Countdown Timer */}
        <div className="flex items-center gap-3 bg-white border border-[#e9e6e0] px-4 py-2 rounded-2xl shadow-sm">
          <div className="relative w-10 h-10 rounded-full flex items-center justify-center font-head font-extrabold text-base bg-[#fbfaf8] border-2 border-[#fd7259]">
            {timeLeft}
          </div>
          <div className="text-xs font-bold text-[#989aa4]">
            SECONDS<br />
            <strong className="text-[#292d3b]">REMAINING</strong>
          </div>
        </div>
      </div>

      {/* Dark Word Bar */}
      <div className="h-16 bg-[#24293a] text-white rounded-t-2xl px-6 flex items-center justify-between shadow-md select-none">
        <div className="text-xs font-bold tracking-wider text-[#adb1bd]">
          {isDrawer ? 'YOUR SECRET WORD:' : 'WHAT AM I DRAWING?'}
        </div>

        <div className="font-head font-extrabold text-2xl tracking-[0.25em] text-[#fff] font-mono">
          {maskedWord || '...'}
        </div>

        <div className="text-xs font-bold bg-[#3c4253] text-[#dfe0e9] px-3 py-1.5 rounded-full">
          {phase === 'DRAWING' ? 'HINTS 1/2' : phase}
        </div>
      </div>
    </div>
  );
};
