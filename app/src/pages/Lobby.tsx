/**
 * DOODL Connected Multiplayer Lobby Page
 */

import React, { useState } from 'react';
import type { PublicRoomSnapshot, RoomSettings, PublicSeat } from '@shared/game-types';
import { MODE_CONFIG } from '@shared/rules';
import { Avatar } from '../components/Avatar';
import { HostSettingsModal } from '../components/HostSettingsModal';

interface LobbyProps {
  roomCode: string;
  mySeatId: string;
  isHost: boolean;
  snapshot: PublicRoomSnapshot | null;
  onStartGame: () => void;
  onUpdateSettings: (settings: RoomSettings) => void;
  onKickSeat: (targetSeatId: string) => void;
  onLeaveRoom: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  roomCode,
  mySeatId,
  isHost,
  snapshot,
  onStartGame,
  onUpdateSettings,
  onKickSeat,
  onLeaveRoom,
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const seats: PublicSeat[] = snapshot?.seats || [];
  const settings: RoomSettings = snapshot?.settings || {
    visibility: 'private',
    maxPlayers: 8,
    cyclesPerPlayer: 3,
    drawSeconds: 90,
    gameMode: 'classic',
    wordPack: 'everyday',
    passwordProtected: false,
    language: 'en',
    allowSpectators: false,
  };

  const inviteUrl = `${window.location.origin}/?join=${roomCode}`;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const activePlayers = seats.filter((s) => s.connected && s.role !== 'spectator');
  const modeMeta = MODE_CONFIG[settings.gameMode] || MODE_CONFIG.classic;
  const minRequired = modeMeta.minPlayers;
  const canStart = isHost && activePlayers.length >= minRequired && activePlayers.length <= modeMeta.maxPlayers;

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e8e5de] pb-6">
        <div>
          <button
            type="button"
            onClick={onLeaveRoom}
            className="text-xs font-bold text-[#707687] hover:text-[#1f2330] flex items-center gap-1 mb-2"
          >
            ← Leave Room
          </button>
          <h1 className="font-head font-extrabold text-4xl text-[#1f2330] tracking-tight">
            Game Lobby
          </h1>
          <p className="text-xs text-[#707687] mt-1">
            Mode: <strong className="uppercase text-[#1f2330]">{settings.gameMode}</strong> ·{' '}
            {settings.cyclesPerPlayer} rounds per player · {settings.drawSeconds}s timer · Category:{' '}
            <strong className="capitalize text-[#1f2330]">{settings.wordPack}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="bg-white border border-[#e5e3de] hover:border-[#fd7259] text-[#1f2330] px-4 py-2.5 rounded-2xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              ⚙️ Settings
            </button>
          )}
          <button
            type="button"
            onClick={handleCopyInvite}
            className="bg-[#24293a] text-white px-5 py-2.5 rounded-2xl font-bold text-xs shadow-[0_3px_0_#0f1220] active:translate-y-0.5 transition-all flex items-center gap-2"
          >
            {copiedInvite ? '✓ Copied!' : 'Copy Invite Link'}
          </button>
        </div>
      </div>

      {/* Main Grid: Seats & Room Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Seats Grid */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-[#eae8e2] p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-[#f0eee9] pb-3">
            <h2 className="font-head font-extrabold text-lg text-[#1f2330]">
              Connected Players ({seats.length} / {settings.maxPlayers})
            </h2>
            <span className="text-xs text-[#707687] font-bold">
              Min {minRequired} players required {activePlayers.length < minRequired ? `(Need ${minRequired - activePlayers.length} more)` : '✓ Ready'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {seats.map((seat) => (
              <div
                key={seat.id}
                className="bg-[#fbfaf8] border border-[#e8e5de] rounded-2xl p-4 text-center relative space-y-2"
              >
                {seat.role === 'host' && (
                  <span className="absolute top-2.5 right-2.5 text-[9px] font-black uppercase tracking-wider bg-[#fff0c5] text-[#956c12] px-2 py-0.5 rounded-full">
                    HOST
                  </span>
                )}
                {isHost && seat.id !== mySeatId && (
                  <button
                    type="button"
                    onClick={() => onKickSeat(seat.id)}
                    title="Kick Player"
                    className="absolute top-2.5 left-2.5 text-[10px] text-[#dc5b46] hover:bg-[#fff0ed] p-1 rounded-md"
                  >
                    ✕
                  </button>
                )}

                <Avatar face={seat.avatarFace} color={seat.avatarColor} size="large" className="mx-auto" />

                <div>
                  <strong className="block text-xs font-bold text-[#1f2330] truncate">
                    {seat.nickname}
                  </strong>
                  <span className="text-[10px] text-[#3bbc77] font-semibold">
                    {seat.connected ? '● Ready' : '○ Offline'}
                  </span>
                </div>
              </div>
            ))}

            {/* Empty Seat placeholders */}
            {Array.from({ length: Math.max(0, settings.maxPlayers - seats.length) }).map((_, idx) => (
              <div
                key={`empty_${idx}`}
                className="border-2 border-dashed border-[#e8e5de] rounded-2xl p-4 flex flex-col items-center justify-center min-h-[130px] text-[#b4b7c2]"
              >
                <span className="text-2xl font-light mb-1">+</span>
                <span className="text-[11px] font-bold">Waiting...</span>
              </div>
            ))}
          </div>

          {/* Start Game Action */}
          <div className="pt-4 border-t border-[#f0eee9] flex items-center justify-between">
            <div className="text-xs text-[#707687]">
              {canStart ? (
                <span className="text-[#31775a] font-bold">✓ Ready to play {modeMeta.name}!</span>
              ) : isHost ? (
                <span>Need at least {minRequired} connected players to start {modeMeta.name}.</span>
              ) : (
                <span>Waiting for the host to start the game...</span>
              )}
            </div>

            {isHost && (
              <button
                type="button"
                disabled={!canStart}
                onClick={onStartGame}
                className="bg-[#fd7259] hover:bg-[#e95d45] text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-[0_4px_0_#dc5b46] active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Start Game ▶
              </button>
            )}
          </div>
        </div>

        {/* Room Info & Invite Card */}
        <div className="space-y-4">
          <div className="bg-[#272b3d] text-white rounded-3xl p-6 space-y-3 shadow-lg">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#fbb8a1]">
              ROOM CODE
            </div>
            <div className="font-head font-extrabold text-4xl tracking-wider text-white">
              {roomCode}
            </div>
            <p className="text-xs text-[#adb1bd] leading-relaxed">
              Share this code or invitation link with friends to play together on any browser.
            </p>
            <button
              type="button"
              onClick={handleCopyInvite}
              className="w-full bg-white text-[#1f2330] py-3 rounded-xl font-bold text-xs hover:bg-[#f4f2ee] transition-all"
            >
              {copiedInvite ? '✓ Link Copied to Clipboard' : 'Copy Invitation Link'}
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-[#eae8e2] p-5 space-y-3 text-xs text-[#707687]">
            <h3 className="font-bold text-[#1f2330] text-sm">Rules & Fair Play</h3>
            <p>1. When drawing, do not write letters, numbers, or words.</p>
            <p>2. Keep guesses and chat family-friendly.</p>
            <p>3. Faster correct guesses earn more speed bonus points.</p>
          </div>
        </div>
      </div>

      {showSettingsModal && (
        <HostSettingsModal
          initialSettings={settings}
          onSave={onUpdateSettings}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
};
