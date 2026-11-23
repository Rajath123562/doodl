import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');
import { RoomDO } from '../../worker/room-do';
import type { RoomSettings } from '../../shared/game-types';

interface MockWs {
  sent: any[];
  attachment: any;
  serializeAttachment(a: any): void;
  deserializeAttachment(): any;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  closedWith?: { code?: number; reason?: string };
}

function createMockWs(seatId: string, guestId: string, epoch: number): MockWs {
  const ws: MockWs = {
    sent: [],
    attachment: { seatId, guestId, epoch },
    serializeAttachment(a: any) {
      this.attachment = a;
    },
    deserializeAttachment() {
      return this.attachment;
    },
    send(data: string) {
      this.sent.push(JSON.parse(data));
    },
    close(code?: number, reason?: string) {
      this.closedWith = { code, reason };
    },
  };
  return ws;
}

function createMockDOState() {
  const db = new DatabaseSync(':memory:');
  const webSockets = new Map<string, MockWs[]>();
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
    acceptWebSocket(ws: MockWs, tags: string[]) {
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

describe('Advanced Game Modes, Recovery & Timing (P0-014, P0-016, P0-017, P1-010, P2-001, P2-002, P2-003)', () => {
  let roomDO: RoomDO;
  let mockState: any;

  beforeEach(() => {
    mockState = createMockDOState();
    roomDO = new RoomDO(mockState as any, {} as any);
  });

  it('handles duplicate tab / session takeover cleanly (P0-016)', async () => {
    const settings: RoomSettings = {
      visibility: 'private',
      maxPlayers: 4,
      cyclesPerPlayer: 1,
      drawSeconds: 60,
      gameMode: 'classic',
      wordPack: 'everyday',
    };

    // 1. Host creates room
    const initRes = await roomDO.fetch(
      new Request('http://internal/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: 'TAKEOVER-ROOM',
          settings,
          hostGuestId: 'user_unique_123',
          hostNickname: 'MultiTabUser',
          avatarFace: 0,
          avatarColor: 'coral',
        }),
      })
    );
    const initData = (await initRes.json()) as any;
    const seatId = initData.seatId;

    // First tab connects
    const tab1Ws = createMockWs(seatId, 'user_unique_123', 1);
    mockState.acceptWebSocket(tab1Ws, [seatId]);

    // Same user opens second tab -> reconnects with same guestId
    const joinRes = await roomDO.fetch(
      new Request('http://internal/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: 'user_unique_123',
          nickname: 'MultiTabUser',
          avatarFace: 0,
          avatarColor: 'coral',
        }),
      })
    );
    expect(joinRes.status).toBe(200);
    const joinData = (await joinRes.json()) as any;
    // Same seat ID reused
    expect(joinData.seatId).toBe(seatId);

    // Tab 1 tries to send intent with old epoch 1 -> Denied with STALE_EPOCH
    await roomDO.webSocketMessage(
      tab1Ws as any,
      JSON.stringify({
        v: 1,
        type: 'sync.request',
        clientEventId: 'evt_sync_001',
        payload: {},
      })
    );
    const staleErr = tab1Ws.sent.find(m => m.payload?.code === 'STALE_EPOCH');
    expect(staleErr).toBeDefined();
  });

  it('handles drawer dropout mid-match without stalling room state (P0-017)', async () => {
    const settings: RoomSettings = {
      visibility: 'private',
      maxPlayers: 4,
      cyclesPerPlayer: 1,
      drawSeconds: 60,
      gameMode: 'classic',
      wordPack: 'everyday',
    };

    const initRes = await roomDO.fetch(
      new Request('http://internal/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: 'DROPOUT-ROOM',
          settings,
          hostGuestId: 'host_g',
          hostNickname: 'HostAlice',
          avatarFace: 0,
          avatarColor: 'coral',
        }),
      })
    );
    const hostData = (await initRes.json()) as any;
    const hostSeatId = hostData.seatId;

    const joinRes = await roomDO.fetch(
      new Request('http://internal/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: 'guest_g',
          nickname: 'GuesserBob',
          avatarFace: 1,
          avatarColor: 'teal',
        }),
      })
    );
    const guestData = (await joinRes.json()) as any;
    const guestSeatId = guestData.seatId;

    const hostWs = createMockWs(hostSeatId, 'host_g', 1);
    const guestWs = createMockWs(guestSeatId, 'guest_g', 1);
    mockState.acceptWebSocket(hostWs, [hostSeatId]);
    mockState.acceptWebSocket(guestWs, [guestSeatId]);
    (roomDO as any).seats.get(hostSeatId).connected = true;
    (roomDO as any).seats.get(guestSeatId).connected = true;

    // Start game
    await roomDO.webSocketMessage(
      hostWs as any,
      JSON.stringify({
        v: 1,
        type: 'room.start',
        clientEventId: 'evt_start_drop',
        payload: {},
      })
    );

    // Host selects word
    const choices = hostWs.sent.find(m => m.type === 'turn.wordChoices');
    await roomDO.webSocketMessage(
      hostWs as any,
      JSON.stringify({
        v: 1,
        type: 'word.select',
        clientEventId: 'evt_word_drop',
        payload: { candidateId: choices.payload.candidates[0].id },
      })
    );

    expect((roomDO as any).phase).toBe('DRAWING');

    // Alice (drawer) disconnects!
    await roomDO.webSocketClose(hostWs as any);

    // Room must NOT stall: phase immediately transitions to REVEAL
    expect((roomDO as any).phase).toBe('REVEAL');
    const revealNotice = guestWs.sent.find(m => m.type === 'turn.reveal');
    expect(revealNotice).toBeDefined();
    expect(revealNotice.payload.reason).toBe('DRAWER_DISCONNECT');
  });

  it('triggers server hints when half of drawing duration elapses (P0-014)', async () => {
    const settings: RoomSettings = {
      visibility: 'private',
      maxPlayers: 4,
      cyclesPerPlayer: 1,
      drawSeconds: 60,
      gameMode: 'classic',
      wordPack: 'everyday',
    };

    const initRes = await roomDO.fetch(
      new Request('http://internal/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: 'HINT-ROOM',
          settings,
          hostGuestId: 'host_h',
          hostNickname: 'HostDrawer',
          avatarFace: 0,
          avatarColor: 'coral',
        }),
      })
    );
    const hostData = (await initRes.json()) as any;
    const hostSeatId = hostData.seatId;

    const joinRes = await roomDO.fetch(
      new Request('http://internal/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: 'guest_h',
          nickname: 'GuesserPlayer',
          avatarFace: 1,
          avatarColor: 'yellow',
        }),
      })
    );
    const guestData = (await joinRes.json()) as any;
    const guestSeatId = guestData.seatId;

    const hostWs = createMockWs(hostSeatId, 'host_h', 1);
    const guestWs = createMockWs(guestSeatId, 'guest_h', 1);
    mockState.acceptWebSocket(hostWs, [hostSeatId]);
    mockState.acceptWebSocket(guestWs, [guestSeatId]);
    (roomDO as any).seats.get(hostSeatId).connected = true;
    (roomDO as any).seats.get(guestSeatId).connected = true;

    // Start game & select word
    await roomDO.webSocketMessage(
      hostWs as any,
      JSON.stringify({
        v: 1,
        type: 'room.start',
        clientEventId: 'evt_start_hint',
        payload: {},
      })
    );
    const choices = hostWs.sent.find(m => m.type === 'turn.wordChoices');
    await roomDO.webSocketMessage(
      hostWs as any,
      JSON.stringify({
        v: 1,
        type: 'word.select',
        clientEventId: 'evt_word_hint',
        payload: { candidateId: choices.payload.candidates[0].id },
      })
    );

    // Fast-forward alarm to hint trigger time
    (roomDO as any).hintAtMs = Date.now() - 1000;
    (roomDO as any).deadlineAtMs = Date.now() + 30000;
    await roomDO.alarm();

    // Verify hint was revealed
    const hintMsg = guestWs.sent.find(m => m.type === 'round.hintRevealed');
    expect(hintMsg).toBeDefined();
    expect(hintMsg.payload.revealedIndex).toBeTypeOf('number');
    expect(hintMsg.payload.maskedWord).toBeDefined();
  });

  it('runs Blitz mode with 30s preset (P1-010)', async () => {
    const settings: RoomSettings = {
      visibility: 'private',
      maxPlayers: 4,
      cyclesPerPlayer: 1,
      drawSeconds: 30, // Blitz 30s
      gameMode: 'blitz',
      wordPack: 'everyday',
    };

    const initRes = await roomDO.fetch(
      new Request('http://internal/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: 'BLITZ-ROOM',
          settings,
          hostGuestId: 'host_b',
          hostNickname: 'BlitzMaster',
          avatarFace: 0,
          avatarColor: 'blue',
        }),
      })
    );
    const hostData = (await initRes.json()) as any;
    expect(hostData.snapshot.gameMode).toBe('blitz');
    expect(hostData.snapshot.settings.drawSeconds).toBe(30);
  });

  it('seeds server modifier in Chaos mode (P2-002)', async () => {
    const settings: RoomSettings = {
      visibility: 'private',
      maxPlayers: 4,
      cyclesPerPlayer: 1,
      drawSeconds: 60,
      gameMode: 'chaos',
      wordPack: 'everyday',
    };

    const initRes = await roomDO.fetch(
      new Request('http://internal/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: 'CHAOS-ROOM',
          settings,
          hostGuestId: 'host_c',
          hostNickname: 'ChaosKing',
          avatarFace: 0,
          avatarColor: 'purple',
        }),
      })
    );
    const hostData = (await initRes.json()) as any;
    const hostSeatId = hostData.seatId;

    const joinRes = await roomDO.fetch(
      new Request('http://internal/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: 'guest_c',
          nickname: 'ChaosPawn',
          avatarFace: 1,
          avatarColor: 'pink',
        }),
      })
    );
    const guestData = (await joinRes.json()) as any;
    const guestSeatId = guestData.seatId;

    const hostWs = createMockWs(hostSeatId, 'host_c', 1);
    const guestWs = createMockWs(guestSeatId, 'guest_c', 1);
    mockState.acceptWebSocket(hostWs, [hostSeatId]);
    mockState.acceptWebSocket(guestWs, [guestSeatId]);
    (roomDO as any).seats.get(hostSeatId).connected = true;
    (roomDO as any).seats.get(guestSeatId).connected = true;

    // Start game
    await roomDO.webSocketMessage(
      hostWs as any,
      JSON.stringify({
        v: 1,
        type: 'room.start',
        clientEventId: 'evt_start_chaos',
        payload: {},
      })
    );
    const choices = hostWs.sent.find(m => m.type === 'turn.wordChoices');
    await roomDO.webSocketMessage(
      hostWs as any,
      JSON.stringify({
        v: 1,
        type: 'word.select',
        clientEventId: 'evt_word_chaos',
        payload: { candidateId: choices.payload.candidates[0].id },
      })
    );

    // Chaos modifier must be chosen by server
    const snapshot = (roomDO as any).getPublicSnapshot(guestSeatId);
    expect(snapshot.chaosModifier).toBeDefined();
    expect(snapshot.chaosModifier.effect).toMatch(
      /^(mirror_x|inverted_coords|palette_limit|time_rush|thick_brush)$/
    );
  });

  it('balances rosters and handles team assignment in Team Battles (P2-003)', async () => {
    const settings: RoomSettings = {
      visibility: 'private',
      maxPlayers: 4,
      cyclesPerPlayer: 1,
      drawSeconds: 60,
      gameMode: 'teams',
      wordPack: 'everyday',
    };

    const initRes = await roomDO.fetch(
      new Request('http://internal/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: 'TEAMS-ROOM',
          settings,
          hostGuestId: 'host_t',
          hostNickname: 'TeamCaptain',
          avatarFace: 0,
          avatarColor: 'blue',
        }),
      })
    );
    const hostData = (await initRes.json()) as any;
    const hostSeatId = hostData.seatId;

    const joinRes = await roomDO.fetch(
      new Request('http://internal/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: 'guest_t',
          nickname: 'RivalPlayer',
          avatarFace: 1,
          avatarColor: 'coral',
        }),
      })
    );
    const guestData = (await joinRes.json()) as any;
    const guestSeatId = guestData.seatId;

    const hostWs = createMockWs(hostSeatId, 'host_t', 1);
    const guestWs = createMockWs(guestSeatId, 'guest_t', 1);
    mockState.acceptWebSocket(hostWs, [hostSeatId]);
    mockState.acceptWebSocket(guestWs, [guestSeatId]);
    (roomDO as any).seats.get(hostSeatId).connected = true;
    (roomDO as any).seats.get(guestSeatId).connected = true;

    // Start match
    await roomDO.webSocketMessage(
      hostWs as any,
      JSON.stringify({
        v: 1,
        type: 'room.start',
        clientEventId: 'evt_start_team',
        payload: {},
      })
    );

    // Verify both seats are assigned to teams
    const hostSeat = (roomDO as any).seats.get(hostSeatId);
    const guestSeat = (roomDO as any).seats.get(guestSeatId);
    expect(hostSeat.team).toBe('A');
    expect(guestSeat.team).toBe('B');

    // Host manually reassigns guest to team A
    await roomDO.webSocketMessage(
      hostWs as any,
      JSON.stringify({
        v: 1,
        type: 'team.assign',
        clientEventId: 'evt_team_assign',
        payload: { seatId: guestSeatId, team: 'A' },
      })
    );
    expect(guestSeat.team).toBe('A');
  });

  it('designates two simultaneous drawers in Drawing Duels (P2-001)', async () => {
    const settings: RoomSettings = {
      visibility: 'private',
      maxPlayers: 4,
      cyclesPerPlayer: 1,
      drawSeconds: 60,
      gameMode: 'duels',
      wordPack: 'everyday',
    };

    const initRes = await roomDO.fetch(
      new Request('http://internal/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: 'DUELS-ROOM',
          settings,
          hostGuestId: 'host_d',
          hostNickname: 'Duelist1',
          avatarFace: 0,
          avatarColor: 'coral',
        }),
      })
    );
    const hostData = (await initRes.json()) as any;
    const hostSeatId = hostData.seatId;

    const joinRes = await roomDO.fetch(
      new Request('http://internal/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: 'guest_d',
          nickname: 'Duelist2',
          avatarFace: 1,
          avatarColor: 'blue',
        }),
      })
    );
    const guestData = (await joinRes.json()) as any;
    const guestSeatId = guestData.seatId;

    const hostWs = createMockWs(hostSeatId, 'host_d', 1);
    const guestWs = createMockWs(guestSeatId, 'guest_d', 1);
    mockState.acceptWebSocket(hostWs, [hostSeatId]);
    mockState.acceptWebSocket(guestWs, [guestSeatId]);
    (roomDO as any).seats.get(hostSeatId).connected = true;
    (roomDO as any).seats.get(guestSeatId).connected = true;

    // Start match
    await roomDO.webSocketMessage(
      hostWs as any,
      JSON.stringify({
        v: 1,
        type: 'room.start',
        clientEventId: 'evt_start_duel',
        payload: {},
      })
    );

    // Both players must be designated drawers in Duels!
    const drawers = (roomDO as any).currentDrawerIds;
    expect(drawers).toHaveLength(2);
    expect(drawers).toContain(hostSeatId);
    expect(drawers).toContain(guestSeatId);
  });
});
