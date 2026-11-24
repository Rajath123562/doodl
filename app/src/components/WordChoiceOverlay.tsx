/**
 * DOODL Word Choice Modal Overlay (For Drawer)
 */

import React, { useState, useEffect } from 'react';
import type { WordCandidate } from '@shared/game-types';

interface WordChoiceOverlayProps {
  candidates: WordCandidate[];
  expiresAtMs: number;
  onSelectWord: (candidateId: string) => void;
}

export const WordChoiceOverlay: React.FC<WordChoiceOverlayProps> = ({
  candidates,
  expiresAtMs,
  onSelectWord,
}) => {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const update = () => {
      const remaining = Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
      setCountdown(remaining);
    };
    update();
    const interval = setInterval(update, 200);
    return () => clearInterval(interval);
  }, [expiresAtMs]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eee9e2] shadow-2xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full text-center space-y-3 sm:space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#fd7259]">
          YOUR TURN TO DRAW
        </div>
        <h2 className="font-head font-extrabold text-xl sm:text-2xl tracking-tight text-[#1f2330]">
          Choose Your Word!
        </h2>
        <p className="text-[11px] sm:text-xs text-[#8e909d]">
          Pick one of the three candidate words below. Auto-select in{' '}
          <strong className="text-[#fd7259] font-head text-sm sm:text-base">{countdown}s</strong>
        </p>

        {/* 3 Candidate Words: Side-by-side on all screens so all 3 words are 100% visible */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1 sm:pt-2">
          {candidates.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectWord(c.id)}
              className="py-3 px-2 sm:py-4 sm:px-3 rounded-xl sm:rounded-2xl bg-[#faf9f6] border-2 border-[#ebe7e3] font-bold text-xs sm:text-sm text-[#1f2330] hover:bg-[#fff1ed] hover:border-[#fd7259] active:scale-95 transition-all shadow-sm flex flex-col items-center justify-center text-center break-words min-h-[52px] sm:min-h-[64px]"
            >
              <span className="capitalize">{c.word.toLowerCase()}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
