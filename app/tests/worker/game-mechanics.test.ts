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
    close() {},
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

describe('Full Authoritative Game Mechanics & Safety (P0-005, P0-008, P0-011, P0-012, P0-013, P0-014, P0-018)', () => {
  let roomDO: RoomDO;
  let mockState: any;
  const roomCode = 'GAME-TEST';

  let hostWs: MockWs;
  let guesserWs: MockWs;
  let hostSeatId: string;
  let guesserSeatId: string;

  const defaultSettings: RoomSettings = {
    visibility: 'private',
    maxPlayers: 6,
    cyclesPerPlayer: 1,
    drawSeconds: 60,
    gameMode: 'classic',
    wordPack: 'everyday',
    passwordProtected: false,
    language: 'en',
    allowSpectators: false,
  };

  beforeEach(async () => {
    mockState = createMockDOState();
    roomDO = new RoomDO(mockState as any, {} as any);

    // 1. Init Room with Host
    const initRes = await roomDO.fetch(
      new Request('http://internal/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          settings: defaultSettings,
          hostGuestId: 'host_guest_id',
          hostNickname: 'AliceHost',
          avatarFace: 0,
          avatarColor: 'coral',
        }),
      })
    );
    const initData = (await initRes.json()) as any;
    hostSeatId = initData.seatId;

    // 2. Player 2 joins
    const joinRes = await roomDO.fetch(
      new Request('http://internal/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: 'guesser_guest_id',
          nickname: 'BobGuesser',
          avatarFace: 1,
          avatarColor: 'teal',
        }),
      })
    );
    const joinData = (await joinRes.json()) as any;
    guesserSeatId = joinData.seatId;

    // 3. Connect mock WebSockets for both seats
    hostWs = createMockWs(hostSeatId, 'host_guest_id', 1);
    guesserWs = createMockWs(guesserSeatId, 'guesser_guest_id', 1);

    mockState.acceptWebSocket(hostWs, [hostSeatId]);
    mockState.acceptWebSocket(guesserWs, [guesserSeatId]);

    // Mark seats as connected
    (roomDO as any).seats.get(hostSeatId).connected = true;
    (roomDO as any).seats.get(guesserSeatId).connected = true;
  });

  it('enforces host-only permissions for starting game (P0-005, P0-006)', async () => {
    // Guesser attempts to start the game
    await roomDO.webSocketMessage(
      guesserWs as any,
      JSON.stringify({
        v: 1,
        type: 'room.start',
        clientEventId: 'evt_start_001',
        payload: {},
      })
    );

    const errorMsg = guesserWs.sent.find(m => m.type === 'error');
    expect(errorMsg).toBeDefined();
    expect(errorMsg.payload.code).toBe('FORBIDDEN');
  });

  it('runs complete turn lifecycle: start -> word choice -> drawing -> guess -> scoring (P0-008, P0-011, P0-012, P0-013)', async () => {
    // 1. Host starts the game
    await roomDO.webSocketMessage(
      hostWs as any,
      JSON.stringify({
        v: 1,
        type: 'room.start',
        clientEventId: 'evt_start_002',
        payload: {},
      })
    );

    // Host (Alice) is the first drawer. Verify drawer gets word choices
    const wordChoicesMsg = hostWs.sent.find(m => m.type === 'turn.wordChoices');
    expect(wordChoicesMsg).toBeDefined();
    expect(wordChoicesMsg.payload.candidates).toHaveLength(3);
    const chosenCandidate = wordChoicesMsg.payload.candidates[0];

    // Verify Bob (guesser) did NOT receive word choices
    const guesserLeak = guesserWs.sent.find(m => m.type === 'turn.wordChoices');
    expect(guesserLeak).toBeUndefined();

    // 2. Guesser attempts to select word -> Rejected
    await roomDO.webSocketMessage(
      guesserWs as any,
      JSON.stringify({
        v: 1,
        type: 'word.select',
        clientEventId: 'evt_select_001',
        payload: { candidateId: chosenCandidate.id },
      })
    );
    const notDrawerErr = guesserWs.sent.find(m => m.payload?.code === 'NOT_DRAWER');
    expect(notDrawerErr).toBeDefined();

    // 3. Drawer selects the word
    await roomDO.webSocketMessage(
      hostWs as any,
      JSON.stringify({
        v: 1,
        type: 'word.select',
        clientEventId: 'evt_select_002',
        payload: { candidateId: chosenCandidate.id },
      })
    );

    // Drawer gets secretWord payload
    const drawerSecretMsg = hostWs.sent.find(
      m => m.type === 'turn.wordChoices' && m.payload.secretWord === chosenCandidate.word
    );
    expect(drawerSecretMsg).toBeDefined();

    // Guesser gets maskedWord (e.g. "_ _ _ _")
    const guesserTurnStart = guesserWs.sent.find(
      m => m.type === 'turn.started' && m.payload.maskedWord && m.payload.maskedWord !== '???'
    );
    expect(guesserTurnStart).toBeDefined();
    expect(guesserTurnStart.payload.maskedWord).not.toBe(chosenCandidate.word);

    // 4. Drawing operations & stroke synchronization
    // Non-drawer attempts to draw -> Rejected
    await roomDO.webSocketMessage(
      guesserWs as any,
      JSON.stringify({
        v: 1,
        type: 'stroke.begin',
        clientEventId: 'evt_draw_001',
        payload: {
          strokeId: 'stk_1',
          canvasId: 'main',
          tool: 'pencil',
          color: '#1a1a1a',
          size: 4,
          point: { x: 10000, y: 10000 },
        },
      })
    );
    const drawReject = guesserWs.sent.find(m => m.payload?.code === 'NOT_DRAWER');
    expect(drawReject).toBeDefined();

    // Drawer draws stroke
    await roomDO.webSocketMessage(
      hostWs as any,
      JSON.stringify({
        v: 1,
        type: 'stroke.begin',
        clientEventId: 'evt_draw_002',
        payload: {
          strokeId: 'stk_1',
          canvasId: 'main',
          tool: 'pencil',
          color: '#1a1a1a',
          size: 4,
          point: { x: 10000, y: 10000 },
        },
      })
    );

    // Guesser receives drawing op
    const guesserDrawingOp = guesserWs.sent.find(m => m.type === 'drawing.ops');
    expect(guesserDrawingOp).toBeDefined();
    expect(guesserDrawingOp.payload.ops[0].strokeId).toBe('stk_1');

    // 5. Guessing & Scoring
    // Drawer attempts to guess own word -> Rejected
    await roomDO.webSocketMessage(
      hostWs as any,
      JSON.stringify({
        v: 1,
        type: 'guess.submit',
        clientEventId: 'evt_guess_001',
        payload: { guess: chosenCandidate.word },
      })
    );
    const drawerGuessErr = hostWs.sent.find(m => m.payload?.code === 'DRAWER_CANNOT_GUESS');
    expect(drawerGuessErr).toBeDefined();

    // Guesser submits wrong guess
    await roomDO.webSocketMessage(
      guesserWs as any,
      JSON.stringify({
        v: 1,
        type: 'guess.submit',
        clientEventId: 'evt_guess_002',
        payload: { guess: 'TotallyWrongGuess123' },
      })
    );
    const wrongFeedback = guesserWs.sent.find(
      m => m.type === 'guess.privateFeedback' && m.payload.status === 'WRONG'
    );
    expect(wrongFeedback).toBeDefined();

    // Guesser submits correct guess!
    await roomDO.webSocketMessage(
      guesserWs as any,
      JSON.stringify({
        v: 1,
        type: 'guess.submit',
        clientEventId: 'evt_guess_003',
        payload: { guess: chosenCandidate.word },
      })
    );

    // Private feedback confirms correct and awards points
    const correctFeedback = guesserWs.sent.find(
      m => m.type === 'guess.privateFeedback' && m.payload.status === 'CORRECT'
    );
    expect(correctFeedback).toBeDefined();
    expect(correctFeedback.payload.awardedPoints).toBeGreaterThan(0);

    // Public announcement reveals points and rank, but NO plaintext word
    const publicCorrect = hostWs.sent.find(m => m.type === 'guess.publicCorrect');
    expect(publicCorrect).toBeDefined();
    expect(publicCorrect.payload.seatId).toBe(guesserSeatId);
    expect(publicCorrect.payload.word).toBeUndefined();

    // Because Bob was the only guesser and guessed correctly, ALL_GUESSED triggers turn end!
    // Turn end awards drawer reward points to Alice (host)
    const hostSeat = (roomDO as any).seats.get(hostSeatId);
    expect(hostSeat.score).toBeGreaterThan(0);

    // Guesser seat score updated
    const guesserSeat = (roomDO as any).seats.get(guesserSeatId);
    expect(guesserSeat.score).toBeGreaterThan(0);
  });

  it('enforces host moderation: kick and mute (P0-018)', async () => {
    // Host mutes guesser for 60 seconds
    await roomDO.webSocketMessage(
      hostWs as any,
      JSON.stringify({
        v: 1,
        type: 'room.mute',
        clientEventId: 'evt_mute_001',
        payload: { targetSeatId: guesserSeatId, durationSeconds: 60 },
      })
    );

    // Guesser tries to send chat while muted -> Denied
    await roomDO.webSocketMessage(
      guesserWs as any,
      JSON.stringify({
        v: 1,
        type: 'chat.send',
        clientEventId: 'evt_chat_001',
        payload: { text: 'Hello everyone!' },
      })
    );

    const mutedErr = guesserWs.sent.find(m => m.payload?.code === 'MUTED');
    expect(mutedErr).toBeDefined();

    // Host kicks guesser
    await roomDO.webSocketMessage(
      hostWs as any,
      JSON.stringify({
        v: 1,
        type: 'room.kick',
        clientEventId: 'evt_kick_001',
        payload: { targetSeatId: guesserSeatId },
      })
    );

    // Guesser seat is removed from seats map
    expect((roomDO as any).seats.has(guesserSeatId)).toBe(false);

    // Member left event broadcast to host
    const kickNotice = hostWs.sent.find(
      m => m.type === 'room.memberLeft' && m.payload.reason === 'KICKED'
    );
    expect(kickNotice).toBeDefined();
  });
});
