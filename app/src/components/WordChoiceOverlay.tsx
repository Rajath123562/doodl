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
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-[#eee9e2] shadow-2xl p-8 max-w-md w-full text-center space-y-4">
        <div className="text-xs font-black uppercase tracking-widest text-[#fd7259]">
          YOUR TURN TO DRAW
        </div>
        <h2 className="font-head font-extrabold text-3xl tracking-tight text-[#1f2330]">
          Choose Your Word!
        </h2>
        <p className="text-xs text-[#8e909d]">
          Pick one of the three candidate words below. Auto-select in{' '}
          <strong className="text-[#fd7259] font-head text-sm">{countdown}s</strong>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
          {candidates.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectWord(c.id)}
              className="p-4 rounded-2xl bg-[#faf9f6] border border-[#ebe7e3] font-bold text-sm text-[#1f2330] hover:bg-[#fff1ed] hover:border-[#fd7259] hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-sm"
            >
              {c.word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
