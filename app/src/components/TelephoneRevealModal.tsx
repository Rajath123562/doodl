/**
 * DOODL V4.2 — Drawing Telephone Reveal Album Component
 * Implements T07–T09 acceptance criteria:
 * - Full chain storybook browser
 * - Stepping through Prompt -> Draw -> Describe -> Draw -> Final
 * - Clean responsive UI compliant with the Unslop design standard
 */

import React, { useState } from 'react';
import type { TelephoneChain } from '@shared/game-types';

interface TelephoneRevealModalProps {
  chains: TelephoneChain[];
  onPlayAgain: () => void;
  onLeave: () => void;
  isHost: boolean;
}

export const TelephoneRevealModal: React.FC<TelephoneRevealModalProps> = ({
  chains,
  onPlayAgain,
  onLeave,
  isHost,
}) => {
  const [selectedChainIndex, setSelectedChainIndex] = useState(0);
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);

  if (!chains || chains.length === 0) return null;

  const activeChain = chains[selectedChainIndex] || chains[0];
  const activeArtifact = activeChain.artifacts[selectedStepIndex] || activeChain.artifacts[0];

  return (
    <div className="fixed inset-0 z-50 bg-[#1f2330]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white border border-[#e9e7e2] rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#f0eee9] flex items-center justify-between bg-[#faf9f6]">
          <div>
            <div className="text-[10px] font-black uppercase text-[#fd7259] tracking-wider">
              TELEPHONE STORYBOOK ALBUM
            </div>
            <h2 className="font-head font-extrabold text-lg sm:text-xl text-[#1f2330]">
              Chain {selectedChainIndex + 1} of {chains.length}: Started by {activeChain.originNickname}
            </h2>
          </div>

          {/* Chain Switcher Pills */}
          <div className="flex gap-1 overflow-x-auto max-w-[200px] py-1">
            {chains.map((c, i) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedChainIndex(i);
                  setSelectedStepIndex(0);
                }}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  selectedChainIndex === i
                    ? 'bg-[#fd7259] text-white shadow-sm'
                    : 'bg-[#f0eee9] text-[#555966] hover:bg-[#e4e2db]'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Step Progression Timeline */}
        <div className="px-4 py-2 border-b border-[#f0eee9] flex items-center gap-1.5 overflow-x-auto bg-[#fcfbfa]">
          {activeChain.artifacts.map((art, idx) => (
            <button
              key={art.id}
              onClick={() => setSelectedStepIndex(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedStepIndex === idx
                  ? 'bg-[#24293a] text-white shadow-sm'
                  : 'bg-white border border-[#e9e7e2] text-[#6b6e7a] hover:bg-[#f5f4f0]'
              }`}
            >
              <span>{art.stepType === 'prompt' ? '💬' : art.stepType === 'draw' ? '🎨' : '📝'}</span>
              <span>
                {art.stepType.toUpperCase()} ({art.authorNickname})
              </span>
            </button>
          ))}
        </div>

        {/* Active Artifact Display */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center min-h-[300px] text-center">
          {activeArtifact ? (
            <div className="w-full space-y-4">
              <div className="text-xs font-bold text-[#8e909d]">
                Step {selectedStepIndex + 1} by <strong className="text-[#1f2330]">{activeArtifact.authorNickname}</strong>
              </div>

              {activeArtifact.stepType === 'draw' ? (
                <div className="bg-[#fcfbfa] border border-[#e9e7e2] rounded-2xl p-4 max-w-md mx-auto aspect-[16/10] flex items-center justify-center shadow-inner">
                  {activeArtifact.strokes && activeArtifact.strokes.length > 0 ? (
                    <div className="text-xs font-bold text-[#2a2e3d]">
                      🎨 Drawing with {activeArtifact.strokes.length} strokes
                    </div>
                  ) : (
                    <div className="text-xs text-[#989aa4] italic">
                      Empty drawing (timed out)
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#fff3ef] border border-[#fbb8a1] rounded-2xl p-6 max-w-lg mx-auto shadow-sm">
                  <div className="text-lg sm:text-xl font-extrabold text-[#1f2330] italic font-serif">
                    "{activeArtifact.text || '...'}"
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-[#989aa4]">No artifacts in this chain.</div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-[#f0eee9] flex items-center justify-between bg-[#faf9f6]">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={selectedStepIndex === 0}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-[#e9e7e2] bg-white text-[#1f2330] hover:bg-[#f5f4f0] disabled:opacity-40"
            >
              ← Previous Step
            </button>
            <button
              onClick={() => setSelectedStepIndex((prev) => Math.min(activeChain.artifacts.length - 1, prev + 1))}
              disabled={selectedStepIndex >= activeChain.artifacts.length - 1}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-[#e9e7e2] bg-white text-[#1f2330] hover:bg-[#f5f4f0] disabled:opacity-40"
            >
              Next Step →
            </button>
          </div>

          <div className="flex gap-2">
            {isHost && (
              <button
                onClick={onPlayAgain}
                className="bg-[#fd7259] hover:bg-[#e95d45] text-white px-4 py-2 rounded-xl font-bold text-xs shadow-[0_2px_0_#dc5b46]"
              >
                Play Again
              </button>
            )}
            <button
              onClick={onLeave}
              className="bg-[#24293a] hover:bg-[#1a1e2b] text-white px-4 py-2 rounded-xl font-bold text-xs"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
