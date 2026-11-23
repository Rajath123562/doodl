/**
 * DOODL Home Landing Page
 */

import React, { useState } from 'react';
import { Avatar } from '../components/Avatar';
import type { RoomSettings } from '@shared/game-types';
import { createRoom, joinRoom } from '../networking/api';

interface HomeProps {
  nickname: string;
  avatarFace: number;
  avatarColor: string;
  onNicknameChange: (name: string) => void;
  onAvatarFaceChange: (face: number) => void;
  onAvatarColorChange: (color: string) => void;
  onEnterRoom: (roomCode: string, seatId: string, role: 'host' | 'player' | 'spectator') => void;
  onNavigate: (route: string) => void;
}

export const Home: React.FC<HomeProps> = ({
  nickname,
  avatarFace,
  avatarColor,
  onNicknameChange,
  onAvatarFaceChange,
  onAvatarColorChange,
  onEnterRoom,
  onNavigate,
}) => {
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = async () => {
    setIsCreating(true);
    setErrorMsg('');
    try {
      const defaultSettings: RoomSettings = {
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

      const res = await createRoom(defaultSettings, nickname, avatarFace, avatarColor);
      onEnterRoom(res.roomCode, res.seatId, res.role);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to create room.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;
    setIsJoining(true);
    setErrorMsg('');
    try {
      const res = await joinRoom(code, nickname, avatarFace, avatarColor);
      onEnterRoom(res.roomCode, res.seatId, res.role);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to join room.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-6 sm:py-10">
      {/* Left Copy & Action Box */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#fd7259]">
          <span className="w-5 h-0.5 bg-[#fd7259]" />
          Real Multiplayer Social Game
        </div>

        <h1 className="font-head font-extrabold text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-none text-[#1f2330]">
          Draw, guess, and <span className="text-[#fd7259]">laugh</span> with friends.
        </h1>

        <p className="text-[#707687] text-base sm:text-lg max-w-lg leading-relaxed">
          Connect in real time from phones, tablets, or laptops. No forced accounts or third-party tracking.
          Clean, server-authoritative drawing party gameplay.
        </p>

        {errorMsg && (
          <div className="p-3 bg-[#fff0ed] border border-[#fcc8be] text-[#d85642] text-xs font-bold rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Identity & Room Action Card */}
        <div className="p-5 bg-white rounded-3xl border border-[#eeece7] shadow-[0_12px_48px_rgba(81,77,68,0.06)] max-w-md space-y-4">
          <div className="flex items-center gap-4 border-b border-[#f4f2ee] pb-4">
            <Avatar face={avatarFace} color={avatarColor} size="large" />
            <div className="flex-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-[#6f7380] mb-1">
                Your Nickname
              </label>
              <input
                type="text"
                value={nickname}
                maxLength={20}
                onChange={(e) => onNicknameChange(e.target.value)}
                className="w-full bg-[#f8f7f5] border border-[#e3e3df] rounded-xl px-3.5 py-2 font-bold text-sm text-[#222532] outline-none focus:border-[#fd7259]"
                placeholder="Enter nickname..."
              />
            </div>
          </div>

          {/* Avatar hair & color quick pickers */}
          <div className="flex items-center justify-between text-xs font-bold text-[#707687]">
            <span>Hairstyle:</span>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => onAvatarFaceChange(f)}
                  className={`w-7 h-7 rounded-lg border text-xs font-bold ${
                    avatarFace === f ? 'bg-[#22283a] text-white border-[#22283a]' : 'bg-[#fbfaf8] border-[#e5e3de]'
                  }`}
                >
                  {f + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-[#707687]">
            <span>Theme:</span>
            <div className="flex gap-1.5">
              {['coral', 'blue', 'green', 'pink', 'purple', 'yellow'].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => onAvatarColorChange(col)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    avatarColor === col ? 'border-[#22283a] scale-110 shadow-sm' : 'border-white'
                  }`}
                  style={{
                    backgroundColor:
                      col === 'coral'
                        ? '#ffd8cd'
                        : col === 'blue'
                        ? '#d8e7ff'
                        : col === 'green'
                        ? '#d5f8e4'
                        : col === 'pink'
                        ? '#ffe1eb'
                        : col === 'purple'
                        ? '#e5dcff'
                        : '#fff1bd',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              disabled={isCreating}
              onClick={handleCreate}
              className="w-full bg-[#fd7259] hover:bg-[#e95d45] text-white py-3.5 rounded-2xl font-bold text-sm shadow-[0_4px_0_#dc5b46] active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              {isCreating ? 'Creating Room...' : 'Create Private Room'}
            </button>

            <div className="flex gap-2">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                maxLength={10}
                className="flex-1 bg-[#f8f7f5] border border-[#e3e3df] rounded-2xl px-4 py-2.5 font-mono font-bold text-xs uppercase text-[#222532] outline-none focus:border-[#fd7259]"
              />
              <button
                type="button"
                disabled={isJoining || !joinCodeInput.trim()}
                onClick={handleJoin}
                className="bg-[#232839] hover:bg-[#1a1e2b] text-white px-5 py-2.5 rounded-2xl font-bold text-xs shadow-[0_4px_0_#0f1220] active:translate-y-0.5 transition-all disabled:opacity-50"
              >
                {isJoining ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </div>
        </div>

        {/* Feature Cards navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <button
            type="button"
            onClick={() => onNavigate('daily')}
            className="p-3 bg-white border border-[#eae8e2] rounded-2xl text-left hover:border-[#fd7259] transition-all"
          >
            <span className="text-xl block mb-1">🌞</span>
            <strong className="text-xs font-head font-bold block text-[#1f2330]">Daily Doodle</strong>
            <span className="text-[10px] text-[#8e909d]">Solo 60s challenge</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('gallery')}
            className="p-3 bg-white border border-[#eae8e2] rounded-2xl text-left hover:border-[#fd7259] transition-all"
          >
            <span className="text-xl block mb-1">🎨</span>
            <strong className="text-xs font-head font-bold block text-[#1f2330]">My Gallery</strong>
            <span className="text-[10px] text-[#8e909d]">Export your art</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="p-3 bg-white border border-[#eae8e2] rounded-2xl text-left hover:border-[#fd7259] transition-all"
          >
            <span className="text-xl block mb-1">👑</span>
            <strong className="text-xs font-head font-bold block text-[#1f2330]">Profile & XP</strong>
            <span className="text-[10px] text-[#8e909d]">Badges & streaks</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('rules')}
            className="p-3 bg-white border border-[#eae8e2] rounded-2xl text-left hover:border-[#fd7259] transition-all"
          >
            <span className="text-xl block mb-1">📖</span>
            <strong className="text-xs font-head font-bold block text-[#1f2330]">How to Play</strong>
            <span className="text-[10px] text-[#8e909d]">Rules & scoring</span>
          </button>
        </div>
      </div>

      {/* Right Hero Interactive Visual */}
      <div className="relative flex items-center justify-center min-h-[460px]">
        <div className="absolute inset-4 rounded-[48px] bg-[#e8e1fc] -rotate-3 -z-10" />
        <div className="w-full max-w-lg bg-white rounded-3xl border-8 border-white shadow-2xl p-6 rotate-2 space-y-4">
          <div className="flex justify-between items-center border-b border-[#f1f0ed] pb-3 text-xs font-black text-[#888c93]">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f9b79e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffdf84]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#9de6bc]" />
            </div>
            <span className="tracking-widest">WHAT AM I DRAWING?</span>
            <span className="tracking-widest font-mono text-[#fd7259] font-bold">_ _ _ _ _ _</span>
          </div>

          <div className="h-64 bg-[#faf9f6] rounded-2xl flex flex-col items-center justify-center border border-dashed border-[#e8e5de] relative overflow-hidden">
            <span className="text-6xl mb-3">🎨</span>
            <span className="text-sm font-bold text-[#1f2330]">Real-Time Multiplayer Canvas</span>
            <span className="text-xs text-[#8e909d] mt-1">Strokes sync across browsers deterministically</span>
          </div>
        </div>
      </div>
    </div>
  );
};
