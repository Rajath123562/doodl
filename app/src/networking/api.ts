/**
 * DOODL REST API Client
 */

import type { RoomSettings, PublicRoomSnapshot } from '@shared/game-types';

export interface RoomInitResponse {
  roomCode: string;
  seatId: string;
  role: 'host' | 'player' | 'spectator';
  snapshot: PublicRoomSnapshot;
}

export interface JoinGrantResponse {
  grant: string;
  expiresAtMs: number;
}

export async function ensureGuestSession(nickname?: string): Promise<{ guestId: string; token: string }> {
  const resp = await fetch('/api/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });
  if (!resp.ok) {
    throw new Error(`Failed to initialize guest session: ${resp.status}`);
  }
  return resp.json();
}

export async function createRoom(
  settings: RoomSettings,
  hostNickname = 'Host',
  avatarFace = 0,
  avatarColor = 'coral'
): Promise<RoomInitResponse> {
  const resp = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings, hostNickname, avatarFace, avatarColor }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({})) as any;
    throw new Error(err.message || `Failed to create room: ${resp.status}`);
  }
  return resp.json();
}

export async function fetchRoomSnapshot(roomCode: string): Promise<PublicRoomSnapshot> {
  const resp = await fetch(`/api/rooms/${roomCode}`);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({})) as any;
    throw new Error(err.message || `Room not found or closed (${resp.status})`);
  }
  return resp.json();
}

export async function joinRoom(
  roomCode: string,
  nickname: string,
  avatarFace = 0,
  avatarColor = 'blue',
  password?: string
): Promise<RoomInitResponse> {
  const resp = await fetch(`/api/rooms/${roomCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, avatarFace, avatarColor, password }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({})) as any;
    throw new Error(err.message || `Failed to join room: ${resp.status}`);
  }
  return resp.json();
}

export async function requestJoinGrant(roomCode: string, seatId: string): Promise<JoinGrantResponse> {
  const resp = await fetch(`/api/rooms/${roomCode}/join-grant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatId }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({})) as any;
    throw new Error(err.message || `Failed to mint join grant: ${resp.status}`);
  }
  return resp.json();
}
