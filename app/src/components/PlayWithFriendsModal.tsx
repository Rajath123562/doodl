/**
 * DOODL Play with Friends Modal Component
 * Quick launcher to Create or Join a multiplayer room from anywhere in the app.
 */

import React, { useState } from 'react';
import { Avatar } from './Avatar';
import type { StandaloneGameMode, RoomSettings, WordPackId } from '@shared/game-types';
import { createRoom, joinRoom } from '../networking/api';

interface PlayWithFriendsModalProps {
  nickname: string;
  avatarFace: number;
  avatarColor: string;
  onNicknameChange: (name: string) => void;
  onAvatarFaceChange: (face: number) => void;
  onAvatarColorChange: (color: string) => void;
  onEnterRoom: (roomCode: string, seatId: string, role: 'host' | 'player' | 'spectator') => void;
  onClose: () => void;
}

const GAME_MODES: Array<{
  id: StandaloneGameMode;
  name: string;
  icon: string;
  tag: string;
  desc: string;
  players: string;
  accent: string;
}> = [
  {
    id: 'classic',
    name: 'Classic',
    icon: '✏️',
    tag: '2–20 PLAYERS',
    desc: 'Take turns drawing secret words with automatic timed hints & live chat scoring.',
    players: '2–20 Players',
    accent: '#fd7259',
  },
  {
    id: 'telephone',
    name: 'Drawing Telephone',
    icon: '📞',
    tag: '4–16 PLAYERS',
    desc: 'Simultaneous prompt, draw, and describe chain reactions with big reveals.',
    players: '4–16 Players',
    accent: '#8b5cf6',
  },
  {
    id: 'party_mix',
    name: 'Party Mix',
    icon: '🎉',
    tag: '4–12 PLAYERS',
    desc: '4-stage variety tournament: Classic -> Blitz -> Chaos -> Telephone.',
    players: '4–12 Players',
    accent: '#ec4899',
  },
];

export const PlayWithFriendsModal: React.FC<PlayWithFriendsModalProps> = ({
  nickname,
  avatarFace,
  avatarColor,
  onNicknameChange,
  onAvatarFaceChange,
  onAvatarColorChange,
  onEnterRoom,
  onClose,
}) => {
  const initialJoinParam = new URLSearchParams(window.location.search).get('join') || '';
  const [tab, setTab] = useState<'create' | 'join'>(initialJoinParam ? 'join' : 'create');

  // Create Room state
  const [selectedMode, setSelectedMode] = useState<StandaloneGameMode>('classic');
  const [selectedPack, setSelectedPack] = useState<WordPackId>('everyday');
  const [maxPlayers, setMaxPlayers] = useState<number>(8);
  const [drawSeconds, setDrawSeconds] = useState<number>(60);
  const [cyclesPerPlayer, setCyclesPerPlayer] = useState<number>(3);

  // Join Room state
  const [joinCode, setJoinCode] = useState<string>(initialJoinParam.toUpperCase());
  const [joinPassword, setJoinPassword] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const settings: RoomSettings = {
        visibility: 'private',
        maxPlayers,
        cyclesPerPlayer,
        drawSeconds,
        gameMode: selectedMode,
        wordPack: selectedPack,
        passwordProtected: false,
        language: 'en',
        allowSpectators: false,
      };

      const res = await createRoom(settings, nickname || 'Host', avatarFace, avatarColor);
      onEnterRoom(res.roomCode, res.seatId, res.role);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Please enter an 8-character room code.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await joinRoom(
        cleanCode,
        nickname || 'Player',
        avatarFace,
        avatarColor,
        joinPassword.trim() || undefined
      );
      onEnterRoom(res.roomCode, res.seatId, res.role);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to join room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl border border-[#eae6df] shadow-2xl p-6 sm:p-8 max-w-lg w-full space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0eee9] pb-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-[#fff0ed] flex items-center justify-center text-xl">
              🎉
            </span>
            <div>
              <h2 className="font-head font-extrabold text-2xl text-[#1f2330]">
                Play with Friends
              </h2>
              <p className="text-xs text-[#707687]">
                Create a private party or enter a room code to join
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f4f2ee] flex items-center justify-center text-[#707687] hover:bg-[#e9e8e4] transition-all font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Identity preview strip */}
        <div className="flex items-center gap-3 bg-[#fbfaf8] border border-[#e8e5de] p-3 rounded-2xl">
          <Avatar face={avatarFace} color={avatarColor} size="medium" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#707687]">
                Playing As
              </label>
              <div className="flex items-center gap-1.5">
                {/* Hair styles */}
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4, 5].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => onAvatarFaceChange(f)}
                      className={`w-5 h-5 rounded text-[10px] font-bold ${
                        avatarFace === f ? 'bg-[#22283a] text-white' : 'bg-white border text-[#707687]'
                      }`}
                    >
                      {f + 1}
                    </button>
                  ))}
                </div>
                {/* Theme colors */}
                <div className="flex gap-0.5 pl-1 border-l border-[#e2e0dc]">
                  {['coral', 'blue', 'green', 'pink', 'purple', 'yellow'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => onAvatarColorChange(col)}
                      className={`w-4 h-4 rounded-full border ${
                        avatarColor === col ? 'border-[#22283a] scale-110' : 'border-white'
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
            </div>
            <input
              type="text"
              value={nickname}
              maxLength={20}
              onChange={(e) => onNicknameChange(e.target.value)}
              className="w-full bg-white border border-[#e2e0dc] rounded-lg px-2.5 py-1 text-xs font-bold text-[#1f2330] outline-none focus:border-[#fd7259]"
              placeholder="Your nickname..."
            />
          </div>
        </div>

        {/* Tabs: Create vs Join */}
        <div className="flex p-1 bg-[#f4f2ee] rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => {
              setTab('create');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              tab === 'create'
                ? 'bg-white text-[#1f2330] shadow-sm'
                : 'text-[#707687] hover:text-[#1f2330]'
            }`}
          >
            ✨ Create Private Party
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('join');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              tab === 'join'
                ? 'bg-white text-[#1f2330] shadow-sm'
                : 'text-[#707687] hover:text-[#1f2330]'
            }`}
          >
            🔑 Join with Code
          </button>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div className="p-3 bg-[#fff0ed] border border-[#fcc8be] text-[#d85642] text-xs font-bold rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: Create Room */}
        {tab === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-[#1f2330] mb-2">
                Select Game Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {GAME_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMode(m.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedMode === m.id
                        ? 'border-[#fd7259] bg-[#fffaf9] shadow-sm ring-1 ring-[#fd7259]'
                        : 'border-[#eae8e2] bg-white hover:border-[#d4d1c9]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">{m.icon}</span>
                      <span
                        className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${m.accent}15`,
                          color: m.accent,
                        }}
                      >
                        {m.tag}
                      </span>
                    </div>
                    <strong className="block text-xs font-head font-bold text-[#1f2330]">
                      {m.name}
                    </strong>
                    <span className="block text-[10px] text-[#707687] leading-tight mt-0.5">
                      {m.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-[#1f2330] mb-1">
                  Word Pack
                </label>
                <select
                  value={selectedPack}
                  onChange={(e) => setSelectedPack(e.target.value as WordPackId)}
                  className="w-full bg-[#fbfaf8] border border-[#e5e3de] rounded-xl px-2.5 py-2 text-xs font-bold text-[#1f2330] outline-none"
                >
                  <option value="everyday">Everyday Objects (300+)</option>
                  <option value="animals">Animals & Nature</option>
                  <option value="food">Food & Cooking</option>
                  <option value="popculture">Pop Culture & Gaming</option>
                  <option value="hard">Hard & Abstract</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1f2330] mb-1">
                  Max Players
                </label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full bg-[#fbfaf8] border border-[#e5e3de] rounded-xl px-2.5 py-2 text-xs font-bold text-[#1f2330] outline-none"
                >
                  {selectedMode === 'classic' && (
                    <>
                      <option value={2}>2 Players</option>
                      <option value={4}>4 Players</option>
                      <option value={6}>6 Players</option>
                      <option value={8}>8 Players (Default)</option>
                      <option value={12}>12 Players</option>
                      <option value={16}>16 Players</option>
                      <option value={20}>20 Players (Max)</option>
                    </>
                  )}
                  {selectedMode === 'telephone' && (
                    <>
                      <option value={4}>4 Players (Min)</option>
                      <option value={6}>6 Players</option>
                      <option value={8}>8 Players (Default)</option>
                      <option value={12}>12 Players</option>
                      <option value={16}>16 Players (Max)</option>
                    </>
                  )}
                  {selectedMode === 'party_mix' && (
                    <>
                      <option value={4}>4 Players (Min)</option>
                      <option value={6}>6 Players</option>
                      <option value={8}>8 Players (Default)</option>
                      <option value={10}>10 Players</option>
                      <option value={12}>12 Players (Max)</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-[#1f2330] mb-1">
                  Draw Timer
                </label>
                <select
                  value={drawSeconds}
                  onChange={(e) => setDrawSeconds(Number(e.target.value))}
                  className="w-full bg-[#fbfaf8] border border-[#e5e3de] rounded-xl px-2.5 py-2 text-xs font-bold text-[#1f2330] outline-none"
                >
                  <option value={60}>60 Seconds</option>
                  <option value={75}>75 Seconds</option>
                  <option value={90}>90 Seconds (Default)</option>
                  <option value={120}>120 Seconds</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1f2330] mb-1">
                  Rounds per Player
                </label>
                <select
                  value={cyclesPerPlayer}
                  onChange={(e) => setCyclesPerPlayer(Number(e.target.value))}
                  className="w-full bg-[#fbfaf8] border border-[#e5e3de] rounded-xl px-2.5 py-2 text-xs font-bold text-[#1f2330] outline-none"
                >
                  <option value={1}>1 Turn Each</option>
                  <option value={2}>2 Turns Each</option>
                  <option value={3}>3 Turns Each (Default)</option>
                  <option value={5}>5 Turns Each</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#fd7259] hover:bg-[#e95d45] text-white py-3.5 rounded-2xl font-bold text-sm shadow-[0_4px_0_#dc5b46] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? 'Creating Room...' : 'Create Room & Get Invite Link 🚀'}
            </button>
          </form>
        )}

        {/* Tab 2: Join with Code */}
        {tab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-[#1f2330] mb-1.5">
                Enter 8-Character Room Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. 868A50B4"
                maxLength={10}
                autoFocus
                className="w-full bg-[#fbfaf8] border-2 border-[#e3e0d8] focus:border-[#fd7259] rounded-2xl px-4 py-3.5 font-mono text-center text-xl font-black uppercase text-[#1f2330] tracking-widest outline-none transition-all"
              />
              <p className="text-[11px] text-[#707687] mt-1 text-center">
                Ask your host friend for their room code or invite link.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#707687] mb-1">
                Room Password (Optional)
              </label>
              <input
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder="Leave blank if none"
                className="w-full bg-[#fbfaf8] border border-[#e3e0d8] focus:border-[#fd7259] rounded-xl px-3.5 py-2 text-xs font-bold text-[#1f2330] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !joinCode.trim()}
              className="w-full bg-[#24293a] hover:bg-[#1b202e] text-white py-3.5 rounded-2xl font-bold text-sm shadow-[0_4px_0_#0f1220] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Join Game Room ➔'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
