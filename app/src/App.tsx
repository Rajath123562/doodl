/**
 * DOODL Main Application Root Component
 */

import { useState, useEffect, useRef } from 'react';
import type {
  PublicRoomSnapshot,
  RoomSettings,
  WordCandidate,
  ChatMessage,
  MatchPodiumItem,
  StrokeCommand,
} from '@shared/game-types';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { Game } from './pages/Game';
import { Daily } from './pages/Daily';
import { Gallery } from './pages/Gallery';
import { Profile } from './pages/Profile';
import { Rules } from './pages/Rules';
import { Avatar } from './components/Avatar';
import { DoodlWebSocket } from './networking/ws';
import { requestJoinGrant } from './networking/api';
import { CanvasEngine } from './drawing/renderer';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'home' | 'lobby' | 'game' | 'daily' | 'gallery' | 'profile' | 'rules'>('home');

  // Player identity
  const [nickname, setNickname] = useState<string>(() => localStorage.getItem('doodl_nick') || 'Player');
  const [avatarFace, setAvatarFace] = useState<number>(() => Number(localStorage.getItem('doodl_face')) || 0);
  const [avatarColor, setAvatarColor] = useState<string>(() => localStorage.getItem('doodl_color') || 'coral');

  // Room & WebSocket state
  const [roomCode, setRoomCode] = useState<string>('');
  const [mySeatId, setMySeatId] = useState<string>('');
  const [myRole, setMyRole] = useState<'host' | 'player' | 'spectator'>('player');
  const [snapshot, setSnapshot] = useState<PublicRoomSnapshot | null>(null);

  const [drawerCandidates, setDrawerCandidates] = useState<WordCandidate[]>([]);
  const [drawerSecretWord, setDrawerSecretWord] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [podium, setPodium] = useState<MatchPodiumItem[]>([]);

  const wsRef = useRef<DoodlWebSocket | null>(null);
  const engineRef = useRef<CanvasEngine | null>(null);

  // Sync identity to localStorage
  useEffect(() => {
    localStorage.setItem('doodl_nick', nickname);
    localStorage.setItem('doodl_face', String(avatarFace));
    localStorage.setItem('doodl_color', avatarColor);
  }, [nickname, avatarFace, avatarColor]);

  // Connect WebSocket when entering room
  const handleEnterRoom = async (code: string, seatId: string, role: 'host' | 'player' | 'spectator') => {
    setRoomCode(code);
    setMySeatId(seatId);
    setMyRole(role);
    setChatMessages([]);

    try {
      const grantResp = await requestJoinGrant(code, seatId);
      const ws = new DoodlWebSocket(code, seatId, grantResp.grant);
      wsRef.current = ws;

      ws.on('room.snapshot', (data: any) => {
        setSnapshot(data.snapshot);
        if (data.drawerData?.candidateWords) {
          setDrawerCandidates(data.drawerData.candidateWords);
        }
        if (data.drawerData?.secretWord) {
          setDrawerSecretWord(data.drawerData.secretWord);
        }
        if (data.activeDrawingOps && engineRef.current) {
          engineRef.current.applyRemoteOps(data.activeDrawingOps);
        }
        if (data.snapshot.phase === 'LOBBY') {
          setCurrentRoute('lobby');
        } else {
          setCurrentRoute('game');
        }
      });

      ws.on('room.memberJoined', (data: any) => {
        setSnapshot((prev) => {
          if (!prev) return null;
          const seats = [...prev.seats.filter((s) => s.id !== data.seat.id), data.seat];
          return { ...prev, seats };
        });
      });

      ws.on('room.memberLeft', (data: any) => {
        setSnapshot((prev) => {
          if (!prev) return null;
          const seats = prev.seats.filter((s) => s.id !== data.seatId);
          return { ...prev, seats };
        });
      });

      ws.on('room.settingsChanged', (data: any) => {
        setSnapshot((prev) => (prev ? { ...prev, settings: data.settings } : null));
      });

      ws.on('room.hostChanged', (data: any) => {
        setSnapshot((prev) => {
          if (!prev) return null;
          const seats = prev.seats.map((s) => ({
            ...s,
            role: (s.id === data.hostSeatId ? 'host' : 'player') as any,
          }));
          return { ...prev, seats };
        });
        if (data.hostSeatId === seatId) setMyRole('host');
      });

      ws.on('match.start', () => {
        setPodium([]);
        setCurrentRoute('game');
      });

      ws.on('turn.wordChoices', (data: any) => {
        if (data.candidates) setDrawerCandidates(data.candidates);
        if (data.secretWord) setDrawerSecretWord(data.secretWord);
      });

      ws.on('turn.started', (data: any) => {
        setSnapshot((prev) =>
          prev
            ? {
                ...prev,
                phase: data.phase || (data.maskedWord === '???' ? 'SELECTING_WORD' : 'DRAWING'),
                turnId: data.turnId,
                roundNumber: data.roundNumber,
                totalRounds: data.totalRounds,
                currentDrawerIds: data.drawerIds,
                maskedWord: data.maskedWord,
                deadlineAtMs: data.deadlineAtMs,
              }
            : null
        );
        engineRef.current?.clear();
      });

      ws.on('drawing.ops', (data: any) => {
        engineRef.current?.applyRemoteOps(data.ops);
      });

      ws.on('draw.cleared', () => {
        engineRef.current?.clear();
      });

      ws.on('chat.message', (data: any) => {
        setChatMessages((prev) => [...prev, data.message]);
      });

      ws.on('guess.publicCorrect', (data: any) => {
        const sysMsg: ChatMessage = {
          id: `sys_${Date.now()}_${Math.random()}`,
          seatId: 'system',
          nickname: 'DOODL',
          text: `🎉 ${data.nickname} guessed the word! (+${data.awardedPoints} pts)`,
          isSystem: true,
          timestampMs: Date.now(),
        };
        setChatMessages((prev) => [...prev, sysMsg]);
        setSnapshot((prev) => {
          if (!prev) return null;
          const seats = prev.seats.map((s) =>
            s.id === data.seatId ? { ...s, score: s.score + data.awardedPoints, guessedThisTurn: true } : s
          );
          return { ...prev, seats };
        });
      });

      ws.on('turn.reveal', (data: any) => {
        setSnapshot((prev) =>
          prev
            ? {
                ...prev,
                phase: 'REVEAL',
                maskedWord: data.secretWord,
              }
            : null
        );
        const revealMsg: ChatMessage = {
          id: `sys_rev_${Date.now()}`,
          seatId: 'system',
          nickname: 'DOODL',
          text: `The word was: ${data.secretWord.toUpperCase()}!`,
          isSystem: true,
          timestampMs: Date.now(),
        };
        setChatMessages((prev) => [...prev, revealMsg]);
      });

      ws.on('round.results', (data: any) => {
        setSnapshot((prev) =>
          prev
            ? {
                ...prev,
                phase: 'ROUND_RESULTS',
                seats: data.updatedSeats,
              }
            : null
        );
      });

      ws.on('match.results', (data: any) => {
        setPodium(data.podium);
        setSnapshot((prev) => (prev ? { ...prev, phase: 'MATCH_RESULTS', seats: data.allSeats } : null));
      });

      ws.on('room.restarting', (data: any) => {
        setSnapshot(data.snapshot);
        engineRef.current?.clear();
        setCurrentRoute('lobby');
      });

      ws.connect();
      setCurrentRoute('lobby');
    } catch (e: any) {
      alert(e.message || 'Error entering room');
    }
  };

  const handleLeaveRoom = () => {
    wsRef.current?.close();
    wsRef.current = null;
    setRoomCode('');
    setSnapshot(null);
    setCurrentRoute('home');
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#1f2330]">
      {/* Topbar Navigation */}
      <header className="h-[88px] max-w-[1440px] mx-auto px-6 flex items-center justify-between border-b border-[#e8e5de]">
        <button
          type="button"
          onClick={() => {
            if (currentRoute !== 'game') setCurrentRoute('home');
          }}
          className="flex items-center gap-3 select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-[#202436] text-white flex items-center justify-center -rotate-6 font-black text-2xl shadow-[0_4px_0_#ffc0af]">
            ✳
          </div>
          <span className="font-head font-black text-3xl tracking-tighter text-[#1f2330]">
            doodl.
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-1 p-1 bg-[#fefdfb] border border-[#e8e5de] rounded-full">
          <button
            onClick={() => setCurrentRoute('home')}
            className={`px-4 py-2 rounded-full font-bold text-xs transition-colors ${
              currentRoute === 'home'
                ? 'bg-white text-[#252a34] shadow-sm'
                : 'text-[#7a7d86] hover:text-[#252a34]'
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => {
              if (roomCode) setCurrentRoute(snapshot?.phase === 'LOBBY' ? 'lobby' : 'game');
              else setCurrentRoute('home');
            }}
            className={`px-4 py-2 rounded-full font-bold text-xs transition-colors ${
              currentRoute === 'lobby' || currentRoute === 'game'
                ? 'bg-white text-[#252a34] shadow-sm'
                : 'text-[#7a7d86] hover:text-[#252a34]'
            }`}
          >
            {roomCode ? `Room: ${roomCode}` : 'Play with Friends'}
          </button>
          <button
            onClick={() => setCurrentRoute('daily')}
            className={`px-4 py-2 rounded-full font-bold text-xs transition-colors ${
              currentRoute === 'daily'
                ? 'bg-white text-[#252a34] shadow-sm'
                : 'text-[#7a7d86] hover:text-[#252a34]'
            }`}
          >
            Daily Doodle
          </button>
          <button
            onClick={() => setCurrentRoute('gallery')}
            className={`px-4 py-2 rounded-full font-bold text-xs transition-colors ${
              currentRoute === 'gallery'
                ? 'bg-white text-[#252a34] shadow-sm'
                : 'text-[#7a7d86] hover:text-[#252a34]'
            }`}
          >
            My Gallery
          </button>
          <button
            onClick={() => setCurrentRoute('rules')}
            className={`px-4 py-2 rounded-full font-bold text-xs transition-colors ${
              currentRoute === 'rules'
                ? 'bg-white text-[#252a34] shadow-sm'
                : 'text-[#7a7d86] hover:text-[#252a34]'
            }`}
          >
            How to Play
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#e6f7eb] text-[#31775a] font-bold text-xs rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#3bbc77] shadow-[0_0_0_2px_#c3f2d2]" />
            ONLINE V3
          </span>

          <button
            type="button"
            onClick={() => setCurrentRoute('profile')}
            className="flex items-center gap-2 p-1.5 pr-3 bg-white border border-[#e8e5de] rounded-full hover:border-[#fd7259] transition-all"
          >
            <Avatar face={avatarFace} color={avatarColor} size="small" />
            <span className="text-xs font-bold text-[#1f2330] hidden sm:inline">
              {nickname}
            </span>
          </button>
        </div>
      </header>

      {/* Main View Router */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
        {currentRoute === 'home' && (
          <Home
            nickname={nickname}
            avatarFace={avatarFace}
            avatarColor={avatarColor}
            onNicknameChange={setNickname}
            onAvatarFaceChange={setAvatarFace}
            onAvatarColorChange={setAvatarColor}
            onEnterRoom={handleEnterRoom}
            onNavigate={(r) => setCurrentRoute(r as any)}
          />
        )}

        {currentRoute === 'lobby' && (
          <Lobby
            roomCode={roomCode}
            mySeatId={mySeatId}
            isHost={myRole === 'host'}
            snapshot={snapshot}
            onStartGame={() => wsRef.current?.sendIntent('room.start')}
            onUpdateSettings={(settings: RoomSettings) =>
              wsRef.current?.sendIntent('room.setSettings', settings as any)
            }
            onKickSeat={(targetId: string) =>
              wsRef.current?.sendIntent('room.kick', { targetSeatId: targetId })
            }
            onLeaveRoom={handleLeaveRoom}
          />
        )}

        {currentRoute === 'game' && (
          <Game
            roomCode={roomCode}
            mySeatId={mySeatId}
            isHost={myRole === 'host'}
            snapshot={snapshot}
            drawerCandidates={drawerCandidates}
            drawerSecretWord={drawerSecretWord}
            chatMessages={chatMessages}
            podium={podium}
            onSelectWord={(candidateId: string) =>
              wsRef.current?.sendIntent('word.select', { candidateId })
            }
            onSendStrokeBegin={(stroke: StrokeCommand) =>
              wsRef.current?.sendIntent('stroke.begin', {
                strokeId: stroke.strokeId,
                canvasId: stroke.canvasId,
                tool: stroke.tool,
                color: stroke.color,
                size: stroke.size,
                point: stroke.points[0],
                stickerId: stroke.stickerId,
              })
            }
            onSendStrokeAppend={(strokeId: string, points: any[]) =>
              wsRef.current?.sendIntent('stroke.append', { strokeId, canvasId: 'main', points })
            }
            onSendStrokeEnd={(strokeId: string, point?: any) =>
              wsRef.current?.sendIntent('stroke.end', { strokeId, canvasId: 'main', point })
            }
            onSendUndo={() => wsRef.current?.sendIntent('draw.undo', { canvasId: 'main' })}
            onSendRedo={() => wsRef.current?.sendIntent('draw.redo', { canvasId: 'main' })}
            onSendClear={() => wsRef.current?.sendIntent('draw.clear', { canvasId: 'main' })}
            onSendGuess={(guess: string) => wsRef.current?.sendIntent('guess.submit', { guess })}
            onPlayAgain={() => wsRef.current?.sendIntent('room.playAgain')}
            onLeave={handleLeaveRoom}
            engineRef={engineRef}
          />
        )}

        {currentRoute === 'daily' && <Daily onNavigate={(r) => setCurrentRoute(r as any)} />}
        {currentRoute === 'gallery' && <Gallery onNavigate={(r) => setCurrentRoute(r as any)} />}
        {currentRoute === 'profile' && (
          <Profile
            nickname={nickname}
            avatarFace={avatarFace}
            avatarColor={avatarColor}
            onNicknameChange={setNickname}
            onAvatarFaceChange={setAvatarFace}
            onAvatarColorChange={setAvatarColor}
            onNavigate={(r) => setCurrentRoute(r as any)}
          />
        )}
        {currentRoute === 'rules' && <Rules onNavigate={(r) => setCurrentRoute(r as any)} />}
      </main>
    </div>
  );
}
