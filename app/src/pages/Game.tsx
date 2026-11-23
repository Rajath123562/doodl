/**
 * DOODL Active Multiplayer Game Page
 */

import React, { useRef, useEffect, useState } from 'react';
import type {
  PublicRoomSnapshot,
  WordCandidate,
  ChatMessage,
  DrawingTool,
  StrokeCommand,
  MatchPodiumItem,
} from '@shared/game-types';
import { CanvasEngine } from '../drawing/renderer';
import { GameHUD } from '../components/GameHUD';
import { PlayerSidebar } from '../components/PlayerSidebar';
import { GuessChat } from '../components/GuessChat';
import { DrawingToolbar } from '../components/DrawingToolbar';
import { WordChoiceOverlay } from '../components/WordChoiceOverlay';
import { MatchResultsModal } from '../components/MatchResultsModal';

interface GameProps {
  roomCode: string;
  mySeatId: string;
  isHost: boolean;
  snapshot: PublicRoomSnapshot | null;
  drawerCandidates: WordCandidate[];
  drawerSecretWord?: string;
  chatMessages: ChatMessage[];
  podium: MatchPodiumItem[];
  onSelectWord: (candidateId: string) => void;
  onSendStrokeBegin: (stroke: StrokeCommand) => void;
  onSendStrokeAppend: (strokeId: string, points: any[]) => void;
  onSendStrokeEnd: (strokeId: string, point?: any) => void;
  onSendUndo: () => void;
  onSendRedo: () => void;
  onSendClear: () => void;
  onSendGuess: (guess: string) => void;
  onPlayAgain: () => void;
  onLeave: () => void;
  engineRef: React.MutableRefObject<CanvasEngine | null>;
}

export const Game: React.FC<GameProps> = ({
  roomCode,
  mySeatId,
  isHost,
  snapshot,
  drawerCandidates,
  drawerSecretWord,
  chatMessages,
  podium,
  onSelectWord,
  onSendStrokeBegin,
  onSendStrokeAppend,
  onSendStrokeEnd,
  onSendUndo,
  onSendRedo,
  onSendClear,
  onSendGuess,
  onPlayAgain,
  onLeave,
  engineRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>('pencil');
  const [activeColor, setActiveColor] = useState<string>('#202638');
  const [activeSize, setActiveSize] = useState<number>(7);
  const [activeSticker, setActiveSticker] = useState<string>('⭐');

  const phase = snapshot?.phase || 'DRAWING';
  const isDrawer = Boolean(snapshot?.currentDrawerIds.includes(mySeatId));
  const drawerSeat = snapshot?.seats.find((s) => snapshot?.currentDrawerIds.includes(s.id));
  const drawerNickname = drawerSeat?.nickname || 'Drawer';
  const mySeat = snapshot?.seats.find((s) => s.id === mySeatId);
  const hasGuessed = Boolean(mySeat?.guessedThisTurn);

  // Initialize CanvasEngine
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new CanvasEngine(canvasRef.current);
    engineRef.current = engine;

    engine.setCallbacks({
      onStrokeBegin: onSendStrokeBegin,
      onStrokeAppend: onSendStrokeAppend,
      onStrokeEnd: onSendStrokeEnd,
    });

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update interactivity
  useEffect(() => {
    if (!engineRef.current) return;
    const canDraw = isDrawer && phase === 'DRAWING';
    engineRef.current.setInteractive(canDraw);
    engineRef.current.setTool(activeTool);
    engineRef.current.setColor(activeColor);
    engineRef.current.setSize(activeSize);
    engineRef.current.setSticker(activeSticker);
  }, [isDrawer, phase, activeTool, activeColor, activeSize, activeSticker]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto py-4">
      <div className="flex justify-between items-center text-xs font-bold text-[#8e909d]">
        <span>Room: <strong className="font-mono text-[#1f2330]">{roomCode}</strong></span>
      </div>

      {/* HUD Header */}
      <GameHUD
        phase={phase}
        roundNumber={snapshot?.roundNumber || 1}
        totalRounds={snapshot?.totalRounds || 3}
        deadlineAtMs={snapshot?.deadlineAtMs || null}
        maskedWord={isDrawer && drawerSecretWord ? drawerSecretWord : snapshot?.maskedWord || null}
        isDrawer={isDrawer}
        drawerNickname={drawerNickname}
      />

      {/* Main 3-Column Play Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_300px] gap-4 items-start">
        {/* Left: Player Sidebar */}
        <PlayerSidebar
          seats={snapshot?.seats || []}
          currentDrawerIds={snapshot?.currentDrawerIds || []}
          mySeatId={mySeatId}
        />

        {/* Center: Canvas Area & Controls */}
        <div className="space-y-0">
          <div className="relative bg-white border border-[#e9e7e2] rounded-t-2xl overflow-hidden shadow-sm aspect-[16/10] min-h-[420px] flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className={`w-full h-full block touch-none ${
                isDrawer && phase === 'DRAWING' ? 'cursor-crosshair' : 'cursor-default'
              }`}
            />

            {/* Word Choice Overlay */}
            {phase === 'SELECTING_WORD' && isDrawer && drawerCandidates.length > 0 && (
              <WordChoiceOverlay
                candidates={drawerCandidates}
                expiresAtMs={snapshot?.deadlineAtMs || Date.now() + 10000}
                onSelectWord={onSelectWord}
              />
            )}
          </div>

          {/* Toolbar (Drawer Only) */}
          <DrawingToolbar
            activeTool={activeTool}
            activeColor={activeColor}
            activeSize={activeSize}
            activeSticker={activeSticker}
            canUndo={true}
            canRedo={true}
            onSelectTool={setActiveTool}
            onSelectColor={setActiveColor}
            onSelectSize={setActiveSize}
            onSelectSticker={setActiveSticker}
            onUndo={onSendUndo}
            onRedo={onSendRedo}
            onClear={onSendClear}
            disabled={!isDrawer || phase !== 'DRAWING'}
          />
        </div>

        {/* Right: Guess & Chat */}
        <GuessChat
          messages={chatMessages}
          onSendMessage={onSendGuess}
          disabled={phase !== 'DRAWING'}
          hasGuessed={hasGuessed}
          isDrawer={isDrawer}
        />
      </div>

      {/* Match Results Modal */}
      {phase === 'MATCH_RESULTS' && (
        <MatchResultsModal
          podium={podium}
          isHost={isHost}
          onPlayAgain={onPlayAgain}
          onLeave={onLeave}
        />
      )}
    </div>
  );
};
