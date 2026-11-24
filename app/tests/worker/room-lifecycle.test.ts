import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');
import { RoomDO } from '../../worker/room-do';
import worker from '../../worker/index';
import type { RoomSettings } from '../../shared/game-types';

function createMockDOState() {
  const db = new DatabaseSync(':memory:');
  const webSockets = new Map<string, any[]>();
  let alarmTime: number | null = null;

  return {
    storage: {
      sql: {
        exec(query: string, ...bindings: any[]) {
          if (bindings.length === 0 && !/^\s*SELECT/i.test(query)) {
            db.exec(query);
            return [];
          }
          const stmt = db.prepare(query);
          if (/^\s*SELECT/i.test(query)) {
            return stmt.all(...bindings);
          }
          stmt.run(...bindings);
          return [];
        },
      },
      setAlarm(time: number) {
        alarmTime = time;
      },
      getAlarm() {
        return alarmTime;
      },
    },
    acceptWebSocket(ws: any, tags: string[]) {
      for (const tag of tags) {
        if (!webSockets.has(tag)) webSockets.set(tag, []);
        webSockets.get(tag)!.push(ws);
      }
    },
    getWebSockets(tag: string) {
      return webSockets.get(tag) || [];
    },
  };
}

describe('Worker REST Endpoints & Health Check (P0-024, P0-001)', () => {
  it('returns valid health status and version on GET /api/health', async () => {
    const req = new Request('http://localhost/api/health');
    const res = await worker.fetch(req, {} as any, {} as any);

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe('ok');
    expect(body.version).toBe('3.0.0');
    expect(body.environment).toBe('production-ready');
  });

  it('mints guest session and returns token on POST /api/guest', async () => {
    const req = new Request('http://localhost/api/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'Artisan' }),
    });

    const res = await worker.fetch(req, {} as any, {} as any);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.guestId).toBeDefined();
    expect(body.token).toBeDefined();
    expect(res.headers.get('Set-Cookie')).toContain('doodl_guest=');
  });
});

describe('RoomDO Authoritative Lifecycle & Security (P0-002, P0-004, P0-005, P0-008)', () => {
  let roomDO: RoomDO;
  let mockState: any;
  const roomCode = 'TEST-ROOM';

  const defaultSettings: RoomSettings = {
    visibility: 'private',
    maxPlayers: 2, // Low cap for test
    cyclesPerPlayer: 2,
    drawSeconds: 60,
    gameMode: 'classic',
    wordPack: 'everyday',
    passwordProtected: true,
    password: 'secretPassword',
    language: 'en',
    allowSpectators: false,
  };

  beforeEach(async () => {
    mockState = createMockDOState();
    roomDO = new RoomDO(mockState as any, {} as any);

    // Initialize room with host
    await roomDO.fetch(
      new Request('http://internal/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          settings: defaultSettings,
          hostGuestId: 'guest_host_1',
          hostNickname: 'HostPlayer',
          avatarFace: 0,
          avatarColor: 'coral',
        }),
      })
    );
  });

  it('verifies room initialization with host seat and settings (P0-002)', async () => {
    const snapRes = await roomDO.fetch(new Request('http://internal/snapshot'));
    expect(snapRes.status).toBe(200);
    const snap = (await snapRes.json()) as any;

    expect(snap.roomCode).toBe(roomCode);
    expect(snap.phase).toBe('LOBBY');
    expect(snap.seats).toHaveLength(1);
    expect(snap.seats[0].role).toBe('host');
    expect(snap.seats[0].nickname).toBe('HostPlayer');
  });

  it('rejects joining with wrong password (P0-004)', async () => {
    const joinRes = await roomDO.fetch(
      new Request('http://internal/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: 'guest_player_2',
          nickname: 'SecondPlayer',
          avatarFace: 1,
          avatarColor: 'blue',
          password: 'WRONG_PASSWORD',
        }),
      })
    );

    expect(joinRes.status).toBe(403);
    const err = (await joinRes.json()) as any;
    expect(err.code).toBe('WRONG_PASSWORD');
  });

  it('allows joining with correct password and enforces capacity limit (P0-006)', async () => {
    // Player 2 joins with correct password
    const joinRes2 = await roomDO.fetch(
      new Request('http://internal/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: 'guest_player_2',
          nickname: 'SecondPlayer',
          avatarFace: 1,
          avatarColor: 'blue',
          password: 'secretPassword',
        }),
      })
    );
    expect(joinRes2.status).toBe(200);

    // Room is now at max capacity (maxPlayers: 2). Player 3 tries to join:
    const joinRes3 = await roomDO.fetch(
      new Request('http://internal/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: 'guest_player_3',
          nickname: 'ThirdPlayer',
          avatarFace: 2,
          avatarColor: 'green',
          password: 'secretPassword',
        }),
      })
    );

    expect(joinRes3.status).toBe(409);
    const err = (await joinRes3.json()) as any;
    expect(err.code).toBe('ROOM_FULL');
  });

  it('guarantees word candidate secrecy: candidate words sent ONLY to drawer (P0-008)', async () => {
    // Join player 2
    const joinRes2 = await roomDO.fetch(
      new Request('http://internal/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: 'guest_player_2',
          nickname: 'SecondPlayer',
          avatarFace: 1,
          avatarColor: 'blue',
          password: 'secretPassword',
        }),
      })
    );
    const joinData2 = (await joinRes2.json()) as any;
    const player2SeatId = joinData2.seatId;

    // Get snapshot from perspective of player 2 (guesser)
    const snapRes = await roomDO.fetch(
      new Request(`http://internal/snapshot?seatId=${player2SeatId}`)
    );
    const snap = (await snapRes.json()) as any;

    // Word candidates must NEVER be in guesser snapshot
    expect(snap.candidateWords).toBeUndefined();
    expect(snap.internalSecretWord).toBeUndefined();
    expect(snap.secretWord).toBeUndefined();
  });
});
