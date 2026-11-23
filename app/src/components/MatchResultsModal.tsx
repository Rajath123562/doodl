/**
 * DOODL Match Results Podium Modal
 */

import React from 'react';
import type { MatchPodiumItem } from '@shared/game-types';
import { Avatar } from './Avatar';

interface MatchResultsModalProps {
  podium: MatchPodiumItem[];
  isHost: boolean;
  onPlayAgain: () => void;
  onLeave: () => void;
}

export const MatchResultsModal: React.FC<MatchResultsModalProps> = ({
  podium,
  isHost,
  onPlayAgain,
  onLeave,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-[#eee9e2] shadow-2xl p-8 max-w-lg w-full text-center space-y-6">
        <div className="w-20 h-20 bg-[#fff0ba] rounded-full mx-auto flex items-center justify-center text-4xl shadow-inner">
          🏆
        </div>

        <div>
          <h2 className="font-head font-extrabold text-4xl tracking-tight text-[#1f2330]">
            Match Finished!
          </h2>
          <p className="text-xs text-[#8e909d] mt-1">
            Congratulations to all artists and guessers!
          </p>
        </div>

        {/* Podium list */}
        <div className="space-y-2">
          {podium.map((p) => (
            <div
              key={p.seatId}
              className={`flex items-center gap-3 p-3 rounded-2xl border ${
                p.rank === 1
                  ? 'bg-[#fffaf0] border-[#fcd34d] shadow-sm'
                  : 'bg-[#faf9f6] border-[#eae8e3]'
              }`}
            >
              <span className="font-head font-black text-base w-7 text-center text-[#8e909d]">
                {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`}
              </span>

              <Avatar face={p.avatarFace} color={p.avatarColor} size="medium" />

              <div className="flex-1 text-left min-w-0">
                <span className="font-bold text-sm text-[#1f2330] block truncate">
                  {p.nickname}
                </span>
              </div>

              <div className="font-head font-black text-lg text-[#2f7e56]">
                {p.finalScore} <span className="text-xs text-[#8e909d]">pts</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          {isHost ? (
            <button
              type="button"
              onClick={onPlayAgain}
              className="flex-1 bg-[#fd7259] hover:bg-[#e95d45] text-white py-3.5 rounded-2xl font-bold text-sm shadow-[0_4px_0_#dc5b46] active:translate-y-0.5 transition-all"
            >
              Play Again ↺
            </button>
          ) : (
            <div className="flex-1 py-3 text-xs font-bold text-[#8e909d] bg-[#f8f7f5] rounded-2xl">
              Waiting for host to play again...
            </div>
          )}
          <button
            type="button"
            onClick={onLeave}
            className="px-6 bg-[#f4f2ee] hover:bg-[#eae8e3] text-[#252835] py-3.5 rounded-2xl font-bold text-sm transition-all"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};
