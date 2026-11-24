/**
 * DOODL Room Durable Object (SQLite-backed Authoritative Actor)
 * Manages room lifecycle, presence, host controls, and state transitions.
 */

import { DurableObject } from 'cloudflare:workers';
import type {
  RoomPhase,
  RoomSettings,
  PublicSeat,
  PublicRoomSnapshot,
  PublicRole,
  ChatMessage,
  StrokeCommand,
  TurnResult,
  ChaosModifier,
  TelephoneChain,
} from '../shared/game-types';
import type { ServerEnvelope } from '../shared/protocol';
import {
  ClientEnvelopeSchema,
  RoomSettingsSchema,
  WordSelectPayloadSchema,
  GuessSubmitPayloadSchema,
  ChatSendPayloadSchema,
  ReactionSendPayloadSchema,
  RoomKickPayloadSchema,
  RoomMutePayloadSchema,
  RoomTransferHostPayloadSchema,
  StrokeBeginPayloadSchema,
  StrokeAppendPayloadSchema,
  StrokeEndPayloadSchema,
  DrawUndoPayloadSchema,
  DrawClearPayloadSchema,
  TelephoneSubmitPayloadSchema,
  TelephoneDraftPayloadSchema,
} from '../shared/schemas';
import {
  calculateGuesserScore,
  calculateDrawerReward,
  maskWord,
  computeAutomaticHintSchedule,
  MODE_CONFIG,
  STANDALONE_MODES,
} from '../shared/rules';
import { selectCandidateWords, checkGuess } from './word-engine';
import { sanitizeNickname, sanitizeChatMessage, generateRandomId } from './auth';
import { TelephoneEngine } from './telephone-engine';
import { PartyMixEngine } from './party-engine';

export interface Env {
  ROOM_DO: DurableObjectNamespace<RoomDO>;
  SECRET_KEY?: string;
}

interface SocketAttachment {
  seatId: string;
  guestId: string;
  epoch: number;
}

export class RoomDO extends DurableObject<Env> {
  // In-memory runtime state (hydrated from SQLite on cold wake)
  private roomCode = '';
  private phase: RoomPhase = 'LOBBY';
  private settings: RoomSettings = {
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

  private seq = 0;
  private stateVersion = 0;
  private matchId: string | null = null;
  private turnId: string | null = null;
  private roundNumber = 0;
  private totalRounds = 0;
  private deadlineAtMs: number | null = null;

  private currentDrawerIds: string[] = [];
  private internalSecretWord: string | null = null;
  private candidateWords: { id: string; word: string }[] = [];
  private revealedHintIndices: number[] = [];
  private correctGuesserIds: string[] = [];
  private drawerIndex = 0;
  private eligibleDrawerIds: string[] = [];
  private chaosModifier: ChaosModifier | null = null;
  private hintAtMs: number | null = null;
  private hintScheduleMs: number[] = [];
  private hintIndicesToReveal: number[] = [];
  private telephoneEngine: TelephoneEngine | null = null;
  private telephoneChains: TelephoneChain[] = [];
  private partyEngine: PartyMixEngine | null = null;

  private seats = new Map<string, PublicSeat>();
  private seatSessions = new Map<string, { guestId: string; epoch: number }>();
  private mutedSeats = new Map<string, number>(); // seatId -> unmuteAtMs

  private commandLog: StrokeCommand[] = [];
  private redoStack: StrokeCommand[] = [];
  private chatHistory: ChatMessage[] = [];

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.initDatabase();
    this.hydrateFromStorage();
  }

  private initDatabase() {
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      CREATE TABLE IF NOT EXISTS seats (
        id TEXT PRIMARY KEY,
        guestId TEXT,
        nickname TEXT,
        avatarFace INTEGER,
        avatarColor TEXT,
        role TEXT,
        connected INTEGER,
        score INTEGER,
        guessedThisTurn INTEGER,
        team TEXT,
        joinedAt INTEGER,
        epoch INTEGER
      );
      CREATE TABLE IF NOT EXISTS command_log (
        seq INTEGER PRIMARY KEY,
        strokeId TEXT,
        turnId TEXT,
        canvasId TEXT,
        tool TEXT,
        color TEXT,
        size REAL,
        points TEXT,
        stickerId TEXT,
        createdAt INTEGER
      );
    `);
  }

  private hydrateFromStorage() {
    const metaCursor = this.ctx.storage.sql.exec(`SELECT key, value FROM meta`);
    for (const row of metaCursor) {
      const key = row.key as string;
      const value = row.value as string;
      if (key === 'roomCode') this.roomCode = value;
      else if (key === 'phase') this.phase = value as RoomPhase;
      else if (key === 'settings') this.settings = JSON.parse(value);
      else if (key === 'seq') this.seq = parseInt(value, 10);
      else if (key === 'stateVersion') this.stateVersion = parseInt(value, 10);
      else if (key === 'matchId') this.matchId = value;
      else if (key === 'turnId') this.turnId = value;
      else if (key === 'roundNumber') this.roundNumber = parseInt(value, 10);
      else if (key === 'totalRounds') this.totalRounds = parseInt(value, 10);
      else if (key === 'deadlineAtMs') this.deadlineAtMs = value ? parseInt(value, 10) : null;
      else if (key === 'internalSecretWord') this.internalSecretWord = value;
      else if (key === 'currentDrawerIds') this.currentDrawerIds = JSON.parse(value);
      else if (key === 'candidateWords') this.candidateWords = JSON.parse(value);
      else if (key === 'revealedHintIndices') this.revealedHintIndices = JSON.parse(value);
      else if (key === 'correctGuesserIds') this.correctGuesserIds = JSON.parse(value);
      else if (key === 'eligibleDrawerIds') this.eligibleDrawerIds = JSON.parse(value);
      else if (key === 'drawerIndex') this.drawerIndex = parseInt(value, 10);
    }

    const seatsCursor = this.ctx.storage.sql.exec(`SELECT * FROM seats`);
    for (const row of seatsCursor) {
      const seat: PublicSeat = {
        id: row.id as string,
        nickname: row.nickname as string,
        avatarFace: Number(row.avatarFace),
        avatarColor: row.avatarColor as string,
        role: row.role as PublicRole,
        connected: Boolean(row.connected),
        score: Number(row.score),
        guessedThisTurn: Boolean(row.guessedThisTurn),
        team: row.team ? (row.team as 'A' | 'B') : undefined,
        joinedAt: Number(row.joinedAt),
      };
      this.seats.set(seat.id, seat);
      this.seatSessions.set(seat.id, {
        guestId: row.guestId as string,
        epoch: Number(row.epoch),
      });
    }
  }

  private saveMeta(key: string, value: string) {
    this.ctx.storage.sql.exec(`INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)`, key, value);
  }

  private saveSeat(seat: PublicSeat, guestId: string, epoch: number) {
    this.ctx.storage.sql.exec(`
      INSERT OR REPLACE INTO seats (id, guestId, nickname, avatarFace, avatarColor, role, connected, score, guessedThisTurn, team, joinedAt, epoch)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      seat.id, guestId, seat.nickname, seat.avatarFace, seat.avatarColor,
      seat.role, seat.connected ? 1 : 0, seat.score, seat.guessedThisTurn ? 1 : 0,
      seat.team || null, seat.joinedAt, epoch
    );
  }

  private deleteSeat(seatId: string) {
    this.ctx.storage.sql.exec(`DELETE FROM seats WHERE id = ?`, seatId);
    this.seats.delete(seatId);
    this.seatSessions.delete(seatId);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'POST' && path.endsWith('/init')) {
      const body = await request.json() as { roomCode: string; settings: RoomSettings; hostGuestId: string; hostNickname: string; avatarFace: number; avatarColor: string };
      return this.handleInit(body);
    }

    if (request.method === 'POST' && path.endsWith('/join')) {
      const body = await request.json() as { guestId: string; nickname: string; avatarFace: number; avatarColor: string; password?: string };
      return this.handleJoin(body);
    }

    if (request.method === 'GET' && path.endsWith('/snapshot')) {
      const seatId = url.searchParams.get('seatId') || '';
      return new Response(JSON.stringify(this.getPublicSnapshot(seatId)), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'GET' && path.endsWith('/socket')) {
      const guestId = url.searchParams.get('guestId') || '';
      const seatId = url.searchParams.get('seatId') || '';
      return this.handleWebSocketUpgrade(request, guestId, seatId);
    }

    return new Response('Not Found', { status: 404 });
  }

  private handleInit(body: { roomCode: string; settings: RoomSettings; hostGuestId: string; hostNickname: string; avatarFace: number; avatarColor: string }): Response {
    this.roomCode = body.roomCode;
    this.settings = body.settings;
    this.phase = 'LOBBY';
    this.saveMeta('roomCode', this.roomCode);
    this.saveMeta('settings', JSON.stringify(this.settings));
    this.saveMeta('phase', this.phase);

    // Create host seat
    const hostSeatId = generateRandomId('seat');
    const hostSeat: PublicSeat = {
      id: hostSeatId,
      nickname: sanitizeNickname(body.hostNickname),
      avatarFace: body.avatarFace || 0,
      avatarColor: body.avatarColor || 'coral',
      role: 'host',
      connected: false,
      score: 0,
      guessedThisTurn: false,
      joinedAt: Date.now(),
    };

    this.seats.set(hostSeatId, hostSeat);
    this.seatSessions.set(hostSeatId, { guestId: body.hostGuestId, epoch: 1 });
    this.saveSeat(hostSeat, body.hostGuestId, 1);

    return new Response(JSON.stringify({
      roomCode: this.roomCode,
      seatId: hostSeatId,
      role: 'host',
      snapshot: this.getPublicSnapshot(hostSeatId),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  private handleJoin(body: { guestId: string; nickname: string; avatarFace: number; avatarColor: string; password?: string }): Response {
    if (this.phase === 'CLOSED') {
      return new Response(JSON.stringify({ code: 'ROOM_CLOSED', message: 'Room is closed.' }), { status: 410 });
    }

    // Password verification
    if (this.settings.passwordProtected && this.settings.password) {
      if (body.password !== this.settings.password) {
        return new Response(JSON.stringify({ code: 'WRONG_PASSWORD', message: 'Incorrect room password.' }), { status: 403 });
      }
    }

    // Check if guest already has an active seat in this room (reconnection)
    for (const [seatId, session] of this.seatSessions.entries()) {
      if (session.guestId === body.guestId) {
        const existingSeat = this.seats.get(seatId);
        if (existingSeat) {
          // Increment epoch
          session.epoch += 1;
          this.saveSeat(existingSeat, session.guestId, session.epoch);
          return new Response(JSON.stringify({
            roomCode: this.roomCode,
            seatId,
            role: existingSeat.role,
            snapshot: this.getPublicSnapshot(seatId),
          }), { headers: { 'Content-Type': 'application/json' } });
        }
      }
    }

    // Capacity check
    if (this.seats.size >= this.settings.maxPlayers) {
      return new Response(JSON.stringify({ code: 'ROOM_FULL', message: 'Room has reached player capacity.' }), { status: 409 });
    }

    // Assign role
    const isFirst = this.seats.size === 0;
    const role: PublicRole = isFirst ? 'host' : 'player';
    const seatId = generateRandomId('seat');

    const newSeat: PublicSeat = {
      id: seatId,
      nickname: sanitizeNickname(body.nickname),
      avatarFace: body.avatarFace || 0,
      avatarColor: body.avatarColor || 'blue',
      role,
      connected: false,
      score: 0,
      guessedThisTurn: false,
      joinedAt: Date.now(),
    };

    this.seats.set(seatId, newSeat);
    this.seatSessions.set(seatId, { guestId: body.guestId, epoch: 1 });
    this.saveSeat(newSeat, body.guestId, 1);

    this.stateVersion += 1;
    this.saveMeta('stateVersion', String(this.stateVersion));

    return new Response(JSON.stringify({
      roomCode: this.roomCode,
      seatId,
      role,
      snapshot: this.getPublicSnapshot(seatId),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  private handleWebSocketUpgrade(request: Request, guestId: string, seatId: string): Response {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const session = this.seatSessions.get(seatId);
    if (!session || session.guestId !== guestId) {
      return new Response(JSON.stringify({ code: 'UNAUTHORIZED_SEAT', message: 'Invalid seat or guest credentials.' }), { status: 403 });
    }

    const seat = this.seats.get(seatId);
    if (!seat) {
      return new Response(JSON.stringify({ code: 'SEAT_NOT_FOUND', message: 'Seat not found.' }), { status: 404 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Evict any existing socket for this seat by tagging
    const existingSockets = this.ctx.getWebSockets(seatId);
    for (const oldWs of existingSockets) {
      try {
        oldWs.send(JSON.stringify({
          v: 1,
          type: 'connection.superseded',
          seq: ++this.seq,
          stateVersion: this.stateVersion,
          serverTimeMs: Date.now(),
          payload: { message: 'Session taken over by another tab/window.' },
        }));
        oldWs.close(1008, 'Session superseded');
      } catch {
        // ignore close error
      }
    }

    session.epoch += 1;
    seat.connected = true;
    this.saveSeat(seat, session.guestId, session.epoch);

    const attachment: SocketAttachment = {
      seatId,
      guestId,
      epoch: session.epoch,
    };

    this.ctx.acceptWebSocket(server, [seatId]);
    server.serializeAttachment(attachment);

    // Broadcast member update
    this.broadcast({
      v: 1,
      type: 'room.memberJoined',
      seq: ++this.seq,
      stateVersion: ++this.stateVersion,
      serverTimeMs: Date.now(),
      payload: { seat },
    });

    // Send initial snapshot to joining client
    this.sendSnapshot(server, seatId);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== 'string') return;
    if (message.length > 65536) {
      this.sendError(ws, 'PAYLOAD_TOO_LARGE', 'Message exceeds 64KB limit.', false);
      return;
    }

    let rawJson: unknown;
    try {
      rawJson = JSON.parse(message);
    } catch {
      this.sendError(ws, 'INVALID_JSON', 'Malformed JSON payload.', false);
      return;
    }

    const parsedEnvelope = ClientEnvelopeSchema.safeParse(rawJson);
    if (!parsedEnvelope.success) {
      this.sendError(ws, 'INVALID_ENVELOPE', 'Invalid client event envelope.', false);
      return;
    }

    const envelope = parsedEnvelope.data;
    const attachment = ws.deserializeAttachment() as SocketAttachment | null;
    if (!attachment) {
      ws.close(1008, 'Missing session attachment');
      return;
    }

    const session = this.seatSessions.get(attachment.seatId);
    if (!session || session.epoch !== attachment.epoch) {
      this.sendError(ws, 'STALE_EPOCH', 'Connection epoch has been superseded.', false);
      ws.close(1008, 'Stale connection');
      return;
    }

    const seat = this.seats.get(attachment.seatId);
    if (!seat) {
      this.sendError(ws, 'SEAT_NOT_FOUND', 'Player seat not found.', false);
      return;
    }

    await this.processIntent(ws, seat, envelope.type, envelope.payload, envelope.matchId, envelope.turnId);
  }

  async webSocketClose(ws: WebSocket) {
    const attachment = ws.deserializeAttachment() as SocketAttachment | null;
    if (!attachment) return;

    const seat = this.seats.get(attachment.seatId);
    if (!seat) return;

    const session = this.seatSessions.get(attachment.seatId);
    if (session && session.epoch === attachment.epoch) {
      seat.connected = false;
      this.saveSeat(seat, session.guestId, session.epoch);

      this.broadcast({
        v: 1,
        type: 'room.memberLeft',
        seq: ++this.seq,
        stateVersion: ++this.stateVersion,
        serverTimeMs: Date.now(),
        payload: { seatId: seat.id, reason: 'DISCONNECTED' },
      });

      this.handlePlayerDropout(seat);
    }
  }

  async webSocketError(ws: WebSocket, _error: unknown) {
    this.webSocketClose(ws);
  }

  async alarm() {
    const now = Date.now();

    // Drawing Telephone alarm lifecycle (T05)
    if (this.settings.gameMode === 'telephone' && this.telephoneEngine) {
      if (!this.deadlineAtMs || now < this.deadlineAtMs) return;
      this.telephoneEngine.autoFinalizeStep(this.telephoneEngine.getCurrentStepIndex());
      this.advanceTelephone();
      return;
    }

    if (this.phase === 'SELECTING_WORD') {
      if (!this.deadlineAtMs || now < this.deadlineAtMs) return;
      // Word selection timeout -> auto select first candidate
      const autoWord = this.candidateWords[0]?.word || 'Pizza';
      this.startDrawing(autoWord);
    } else if (this.phase === 'DRAWING') {
      // Reveal scheduled hints (or fast-forwarded hintAtMs in tests)
      let revealedAny = false;
      while (this.hintScheduleMs.length > 0 && now >= this.hintScheduleMs[0]) {
        this.hintScheduleMs.shift();
        this.revealNextScheduledHint();
        revealedAny = true;
      }
      if (!revealedAny && this.hintAtMs && now >= this.hintAtMs) {
        this.revealNextScheduledHint();
        this.hintAtMs = null;
      }

      if (this.hintScheduleMs.length > 0) {
        this.ctx.storage.setAlarm(this.hintScheduleMs[0]);
      } else if (this.deadlineAtMs && now < this.deadlineAtMs) {
        this.ctx.storage.setAlarm(this.deadlineAtMs);
        return;
      }

      if (!this.deadlineAtMs || now < this.deadlineAtMs) return;
      // Drawing round timeout -> reveal
      this.endDrawingTurn('TIMEOUT');
    } else if (this.phase === 'REVEAL') {
      if (!this.deadlineAtMs || now < this.deadlineAtMs) return;
      // 5s reveal timeout -> advance to round results or next turn
      this.advanceAfterReveal();
    } else if (this.phase === 'ROUND_RESULTS') {
      if (!this.deadlineAtMs || now < this.deadlineAtMs) return;
      // 5s round results timeout -> next drawer or match results
      this.advanceTurn();
    }
  }

  private async processIntent(
    ws: WebSocket,
    seat: PublicSeat,
    type: string,
    payload: unknown,
    _matchId?: string,
    _turnId?: string
  ) {
    switch (type) {
      case 'room.start': {
        if (seat.role !== 'host') {
          return this.sendError(ws, 'FORBIDDEN', 'Only the host can start the game.', false);
        }
        if (this.phase !== 'LOBBY' && this.phase !== 'MATCH_RESULTS') {
          return this.sendError(ws, 'INVALID_PHASE', 'Game cannot be started in current phase.', false);
        }
        const activeCount = Array.from(this.seats.values()).filter(s => s.connected && s.role !== 'spectator').length;
        const modeMeta = MODE_CONFIG[this.settings.gameMode] || MODE_CONFIG.classic;
        if (activeCount < modeMeta.minPlayers) {
          return this.sendError(ws, 'NOT_ENOUGH_PLAYERS', `${modeMeta.name} requires at least ${modeMeta.minPlayers} connected players to start.`, false);
        }
        if (activeCount > modeMeta.maxPlayers) {
          return this.sendError(ws, 'TOO_MANY_PLAYERS', `${modeMeta.name} supports at most ${modeMeta.maxPlayers} players.`, false);
        }
        this.startMatch();
        break;
      }

      case 'room.setSettings': {
        if (seat.role !== 'host') {
          return this.sendError(ws, 'FORBIDDEN', 'Only host can change room settings.', false);
        }
        if (this.phase !== 'LOBBY') {
          return this.sendError(ws, 'INVALID_PHASE', 'Settings can only be changed in lobby.', false);
        }
        const parsed = RoomSettingsSchema.safeParse(payload);
        if (!parsed.success) {
          return this.sendError(ws, 'INVALID_SETTINGS', parsed.error.issues[0]?.message || 'Invalid settings.', false);
        }
        if (!STANDALONE_MODES.includes(parsed.data.gameMode as any)) {
          return this.sendError(ws, 'UNSUPPORTED_MODE', 'Only Classic, Drawing Telephone, and Party Mix are standalone game modes.', false);
        }
        this.settings = parsed.data;
        this.saveMeta('settings', JSON.stringify(this.settings));
        this.broadcast({
          v: 1,
          type: 'room.settingsChanged',
          seq: ++this.seq,
          stateVersion: ++this.stateVersion,
          serverTimeMs: Date.now(),
          payload: { settings: this.settings },
        });
        break;
      }

      case 'room.kick': {
        if (seat.role !== 'host') {
          return this.sendError(ws, 'FORBIDDEN', 'Only host can kick players.', false);
        }
        const parsed = RoomKickPayloadSchema.safeParse(payload);
        if (!parsed.success) return;
        const targetId = parsed.data.targetSeatId;
        if (targetId === seat.id) return;
        this.kickSeat(targetId);
        break;
      }

      case 'room.mute': {
        if (seat.role !== 'host') {
          return this.sendError(ws, 'FORBIDDEN', 'Only host can mute players.', false);
        }
        const parsed = RoomMutePayloadSchema.safeParse(payload);
        if (!parsed.success) return;
        this.mutedSeats.set(parsed.data.targetSeatId, Date.now() + parsed.data.durationSeconds * 1000);
        break;
      }

      case 'room.transferHost': {
        if (seat.role !== 'host') {
          return this.sendError(ws, 'FORBIDDEN', 'Only host can transfer host role.', false);
        }
        const parsed = RoomTransferHostPayloadSchema.safeParse(payload);
        if (!parsed.success) return;
        this.transferHost(parsed.data.targetSeatId);
        break;
      }

      case 'word.select': {
        if (this.phase !== 'SELECTING_WORD' || !this.currentDrawerIds.includes(seat.id)) {
          return this.sendError(ws, 'NOT_DRAWER', 'You are not the designated drawer for this turn.', false);
        }
        const parsed = WordSelectPayloadSchema.safeParse(payload);
        if (!parsed.success) return;
        const candidate = this.candidateWords.find(c => c.id === parsed.data.candidateId);
        const chosen = candidate?.word || this.candidateWords[0]?.word || 'Pizza';
        this.startDrawing(chosen);
        break;
      }

      case 'stroke.begin': {
        if (this.phase !== 'DRAWING' || !this.currentDrawerIds.includes(seat.id)) {
          return this.sendError(ws, 'NOT_DRAWER', 'Only active drawers can draw.', false);
        }
        const parsed = StrokeBeginPayloadSchema.safeParse(payload);
        if (!parsed.success) return;
        const cmd: StrokeCommand = {
          strokeId: parsed.data.strokeId,
          turnId: this.turnId || '',
          canvasId: parsed.data.canvasId,
          tool: parsed.data.tool,
          color: parsed.data.color,
          size: parsed.data.size,
          points: [parsed.data.point],
          stickerId: parsed.data.stickerId,
          seq: ++this.seq,
          createdAtServerMs: Date.now(),
        };
        this.commandLog.push(cmd);
        this.redoStack = []; // Invalidate redo on new ink
        this.broadcast({
          v: 1,
          type: 'drawing.ops',
          seq: this.seq,
          stateVersion: this.stateVersion,
          serverTimeMs: Date.now(),
          payload: { canvasId: cmd.canvasId, ops: [cmd], revision: this.commandLog.length },
        });
        break;
      }

      case 'stroke.append': {
        if (this.phase !== 'DRAWING' || !this.currentDrawerIds.includes(seat.id)) return;
        const parsed = StrokeAppendPayloadSchema.safeParse(payload);
        if (!parsed.success) return;
        const existing = this.commandLog.find(c => c.strokeId === parsed.data.strokeId);
        if (existing) {
          existing.points.push(...parsed.data.points);
          this.broadcast({
            v: 1,
            type: 'drawing.ops',
            seq: ++this.seq,
            stateVersion: this.stateVersion,
            serverTimeMs: Date.now(),
            payload: { canvasId: parsed.data.canvasId, ops: [{ ...existing, points: parsed.data.points }], revision: this.commandLog.length },
          });
        }
        break;
      }

      case 'stroke.end': {
        if (this.phase !== 'DRAWING' || !this.currentDrawerIds.includes(seat.id)) return;
        const parsed = StrokeEndPayloadSchema.safeParse(payload);
        if (!parsed.success) return;
        if (parsed.data.point) {
          const existing = this.commandLog.find(c => c.strokeId === parsed.data.strokeId);
          if (existing) existing.points.push(parsed.data.point);
        }
        break;
      }

      case 'draw.undo': {
        if (this.phase !== 'DRAWING' || !this.currentDrawerIds.includes(seat.id)) return;
        const parsed = DrawUndoPayloadSchema.safeParse(payload);
        if (!parsed.success) return;
        if (this.commandLog.length > 0) {
          const removed = this.commandLog.pop()!;
          this.redoStack.push(removed);
          this.broadcast({
            v: 1,
            type: 'draw.cleared',
            seq: ++this.seq,
            stateVersion: ++this.stateVersion,
            serverTimeMs: Date.now(),
            payload: { canvasId: parsed.data.canvasId, revision: this.commandLog.length },
          });
          // Rebroadcast remaining active ops
          if (this.commandLog.length > 0) {
            this.broadcast({
              v: 1,
              type: 'drawing.ops',
              seq: ++this.seq,
              stateVersion: this.stateVersion,
              serverTimeMs: Date.now(),
              payload: { canvasId: parsed.data.canvasId, ops: this.commandLog, revision: this.commandLog.length },
            });
          }
        }
        break;
      }

      case 'draw.redo': {
        if (this.phase !== 'DRAWING' || !this.currentDrawerIds.includes(seat.id)) return;
        const parsed = DrawUndoPayloadSchema.safeParse(payload);
        if (!parsed.success) return;
        if (this.redoStack.length > 0) {
          const restored = this.redoStack.pop()!;
          restored.seq = ++this.seq;
          this.commandLog.push(restored);
          this.broadcast({
            v: 1,
            type: 'drawing.ops',
            seq: this.seq,
            stateVersion: ++this.stateVersion,
            serverTimeMs: Date.now(),
            payload: { canvasId: parsed.data.canvasId, ops: [restored], revision: this.commandLog.length },
          });
        }
        break;
      }

      case 'draw.clear': {
        if (this.phase !== 'DRAWING' || !this.currentDrawerIds.includes(seat.id)) return;
        const parsed = DrawClearPayloadSchema.safeParse(payload);
        if (!parsed.success) return;
        this.commandLog = [];
        this.redoStack = [];
        this.broadcast({
          v: 1,
          type: 'draw.cleared',
          seq: ++this.seq,
          stateVersion: ++this.stateVersion,
          serverTimeMs: Date.now(),
          payload: { canvasId: parsed.data.canvasId, revision: 0 },
        });
        break;
      }

      case 'guess.submit': {
        if (this.phase !== 'DRAWING') {
          return this.sendError(ws, 'NOT_DRAWING_PHASE', 'Guesses only accepted during drawing phase.', false);
        }
        if (this.currentDrawerIds.includes(seat.id)) {
          return this.sendError(ws, 'DRAWER_CANNOT_GUESS', 'Drawer cannot submit guesses.', false);
        }
        if (seat.guessedThisTurn) {
          return this.sendPrivateGuessFeedback(ws, 'ALREADY_GUESSED', 0);
        }

        const parsed = GuessSubmitPayloadSchema.safeParse(payload);
        if (!parsed.success) return;

        const guessText = parsed.data.guess;
        const result = checkGuess(this.internalSecretWord || '', guessText);

        if (result === 'CORRECT') {
          seat.guessedThisTurn = true;
          this.correctGuesserIds.push(seat.id);

          const rank = this.correctGuesserIds.length - 1; // 0 for 1st
          const duration = this.settings.drawSeconds * 1000;
          const scoreCalc = calculateGuesserScore(
            Date.now(),
            this.deadlineAtMs || Date.now(),
            duration,
            rank,
            0 // V4.2: zero hint penalty
          );

          seat.score += scoreCalc.points;
          this.saveSeat(seat, this.seatSessions.get(seat.id)!.guestId, this.seatSessions.get(seat.id)!.epoch);
          if (this.partyEngine) {
            this.partyEngine.recordRawScore(seat.id, scoreCalc.points);
          }

          // Private feedback to guesser
          this.sendPrivateGuessFeedback(ws, 'CORRECT', scoreCalc.points, rank);

          // Public announcement with NO plaintext word
          this.broadcast({
            v: 1,
            type: 'guess.publicCorrect',
            seq: ++this.seq,
            stateVersion: ++this.stateVersion,
            serverTimeMs: Date.now(),
            payload: { seatId: seat.id, nickname: seat.nickname, rank: rank + 1, awardedPoints: scoreCalc.points },
          });

          // Check if all eligible non-drawer players have guessed correctly
          const eligibleGuessers = Array.from(this.seats.values()).filter(
            s => s.connected && !this.currentDrawerIds.includes(s.id) && s.role !== 'spectator'
          );

          if (eligibleGuessers.length > 0 && this.correctGuesserIds.length >= eligibleGuessers.length) {
            // End turn early because everyone guessed it!
            this.endDrawingTurn('ALL_GUESSED');
          }
        } else if (result === 'CLOSE') {
          this.sendPrivateGuessFeedback(ws, 'CLOSE', 0);
          this.broadcastChat(seat, guessText, false, true);
        } else {
          this.sendPrivateGuessFeedback(ws, 'WRONG', 0);
          this.broadcastChat(seat, guessText, false, false);
        }
        break;
      }

      case 'chat.send': {
        const parsed = ChatSendPayloadSchema.safeParse(payload);
        if (!parsed.success) return;
        const unmuteTime = this.mutedSeats.get(seat.id);
        if (unmuteTime && Date.now() < unmuteTime) {
          return this.sendError(ws, 'MUTED', 'You are currently muted by the host.', false);
        }
        const isDrawer = this.currentDrawerIds.includes(seat.id);
        const hasGuessed = Boolean(seat.guessedThisTurn);
        const audience = (this.phase === 'DRAWING' && (isDrawer || hasGuessed)) ? 'solved' : 'all';
        this.broadcastChat(seat, sanitizeChatMessage(parsed.data.text), false, false, audience);
        break;
      }

      case 'reaction.send': {
        const parsed = ReactionSendPayloadSchema.safeParse(payload);
        if (!parsed.success) return;
        this.broadcast({
          v: 1,
          type: 'reaction.broadcast',
          seq: ++this.seq,
          stateVersion: this.stateVersion,
          serverTimeMs: Date.now(),
          payload: { seatId: seat.id, emojiId: parsed.data.emojiId },
        });
        break;
      }

      case 'sync.request': {
        this.sendSnapshot(ws, seat.id);
        break;
      }

      case 'team.assign': {
        const p = payload as { seatId: string; team: 'A' | 'B' };
        if (p && p.seatId && (p.team === 'A' || p.team === 'B')) {
          const targetSeat = this.seats.get(p.seatId);
          if (targetSeat && (seat.role === 'host' || seat.id === targetSeat.id)) {
            targetSeat.team = p.team;
            this.saveSeat(targetSeat, this.seatSessions.get(targetSeat.id)!.guestId, this.seatSessions.get(targetSeat.id)!.epoch);
            this.broadcast({
              v: 1,
              type: 'room.memberJoined',
              seq: ++this.seq,
              stateVersion: ++this.stateVersion,
              serverTimeMs: Date.now(),
              payload: { seat: targetSeat },
            });
          }
        }
        break;
      }

      case 'round.hintRequest': {
        return this.sendError(ws, 'UNSUPPORTED_ACTION', 'Manual hints are removed in V4.2. Hints are automatic and timed.', false);
      }

      case 'telephone.submit': {
        if (!this.telephoneEngine) return;
        const parsed = TelephoneSubmitPayloadSchema.safeParse(payload);
        if (!parsed.success) return;
        try {
          const { allSubmitted } = this.telephoneEngine.submitArtifact(
            seat.id,
            parsed.data.stepIndex,
            parsed.data.text,
            parsed.data.strokes
          );
          if (allSubmitted) {
            this.advanceTelephone();
          }
        } catch (err: any) {
          this.sendError(ws, 'TELEPHONE_SUBMIT_ERROR', err?.message || 'Failed to submit artifact.', false);
        }
        break;
      }

      case 'telephone.draft': {
        if (!this.telephoneEngine) return;
        const parsed = TelephoneDraftPayloadSchema.safeParse(payload);
        if (!parsed.success) return;
        this.telephoneEngine.saveDraft(
          seat.id,
          parsed.data.stepIndex,
          parsed.data.text,
          parsed.data.strokes
        );
        break;
      }

      case 'room.playAgain': {
        if (seat.role !== 'host') return;
        if (this.phase !== 'MATCH_RESULTS') return;
        this.phase = 'LOBBY';
        this.saveMeta('phase', this.phase);
        // Reset scores
        for (const s of this.seats.values()) {
          s.score = 0;
          s.guessedThisTurn = false;
        }
        this.commandLog = [];
        this.redoStack = [];
        this.broadcast({
          v: 1,
          type: 'room.restarting',
          seq: ++this.seq,
          stateVersion: ++this.stateVersion,
          serverTimeMs: Date.now(),
          payload: { snapshot: this.getPublicSnapshot(seat.id) },
        });
        break;
      }
    }
  }

  private startMatch() {
    this.matchId = generateRandomId('match');

    // Drawing Telephone Branch (T01–T09)
    if (this.settings.gameMode === 'telephone') {
      this.phase = 'DRAWING';
      this.telephoneEngine = new TelephoneEngine(this.matchId);
      this.telephoneEngine.initMatch(Array.from(this.seats.values()), this.settings.telephoneChainLength);
      this.saveMeta('matchId', this.matchId);
      this.saveMeta('phase', this.phase);

      this.broadcast({
        v: 1,
        type: 'match.start',
        seq: ++this.seq,
        stateVersion: ++this.stateVersion,
        serverTimeMs: Date.now(),
        payload: { matchId: this.matchId, totalRounds: this.telephoneEngine.getTotalSteps() },
      });

      this.startTelephoneStep(0);
      return;
    }

    // Party Mix Branch (P01–P08)
    if (this.settings.gameMode === 'party_mix') {
      this.partyEngine = new PartyMixEngine(this.matchId, this.settings.partyPreset);
      this.partyEngine.initMatch(Array.from(this.seats.values()));
      const stageConfig = this.partyEngine.getCurrentStageConfig();
      this.settings.drawSeconds = stageConfig.drawSeconds;
      this.broadcast({
        v: 1,
        type: 'party.stageStarted',
        seq: ++this.seq,
        stateVersion: ++this.stateVersion,
        serverTimeMs: Date.now(),
        payload: { stageConfig },
      });
    }

    this.phase = 'SELECTING_WORD';
    this.roundNumber = 1;
    this.drawerIndex = 0;

    // Eligible players (all connected non-spectators)
    this.eligibleDrawerIds = Array.from(this.seats.values())
      .filter(s => s.connected && s.role !== 'spectator')
      .map(s => s.id);

    this.totalRounds = this.eligibleDrawerIds.length * this.settings.cyclesPerPlayer;

    // Reset scores
    for (const s of this.seats.values()) {
      s.score = 0;
      s.guessedThisTurn = false;
      this.saveSeat(s, this.seatSessions.get(s.id)!.guestId, this.seatSessions.get(s.id)!.epoch);
    }

    this.saveMeta('matchId', this.matchId);
    this.saveMeta('roundNumber', String(this.roundNumber));
    this.saveMeta('totalRounds', String(this.totalRounds));
    this.saveMeta('eligibleDrawerIds', JSON.stringify(this.eligibleDrawerIds));
    this.saveMeta('drawerIndex', String(this.drawerIndex));
    this.saveMeta('phase', this.phase);

    this.broadcast({
      v: 1,
      type: 'match.start',
      seq: ++this.seq,
      stateVersion: ++this.stateVersion,
      serverTimeMs: Date.now(),
      payload: { matchId: this.matchId, totalRounds: this.totalRounds },
    });

    this.startWordSelection();
  }

  private startTelephoneStep(stepIndex: number) {
    if (!this.telephoneEngine) return;
    const { assignments, deadlineAtMs, stepType } = this.telephoneEngine.startStep(stepIndex);
    this.deadlineAtMs = deadlineAtMs;
    this.saveMeta('deadlineAtMs', String(deadlineAtMs));
    this.ctx.storage.setAlarm(deadlineAtMs);

    // Private routing delivery: each player receives exclusively their assigned chain step (T03)
    for (const [seatId, assignment] of assignments.entries()) {
      const sockets = this.ctx.getWebSockets(seatId);
      for (const ws of sockets) {
        try {
          ws.send(JSON.stringify({
            v: 1,
            type: 'telephone.assignment',
            seq: ++this.seq,
            stateVersion: this.stateVersion,
            serverTimeMs: Date.now(),
            payload: { assignment },
          }));
        } catch {}
      }
    }

    this.broadcast({
      v: 1,
      type: 'telephone.stepStarted',
      seq: ++this.seq,
      stateVersion: ++this.stateVersion,
      serverTimeMs: Date.now(),
      payload: {
        stepIndex,
        totalSteps: this.telephoneEngine.getTotalSteps(),
        stepType,
        deadlineAtMs,
      },
    });
  }

  private advanceTelephone() {
    if (!this.telephoneEngine) return;
    const current = this.telephoneEngine.getCurrentStepIndex();
    if (this.telephoneEngine.isComplete()) {
      this.phase = 'MATCH_RESULTS';
      this.telephoneChains = this.telephoneEngine.getAllChains();
      this.saveMeta('phase', this.phase);

      this.broadcast({
        v: 1,
        type: 'telephone.reveal',
        seq: ++this.seq,
        stateVersion: ++this.stateVersion,
        serverTimeMs: Date.now(),
        payload: { chains: this.telephoneChains },
      });
    } else {
      this.startTelephoneStep(current + 1);
    }
  }

  private startWordSelection() {
    this.phase = 'SELECTING_WORD';
    this.turnId = generateRandomId('turn');
    this.commandLog = [];
    this.redoStack = [];
    this.revealedHintIndices = [];
    this.correctGuesserIds = [];
    this.internalSecretWord = null;

    // Reset guessedThisTurn
    for (const s of this.seats.values()) {
      s.guessedThisTurn = false;
    }

    if (this.settings.gameMode === 'teams') {
      let idx = 0;
      for (const s of this.seats.values()) {
        if (!s.team) {
          s.team = idx % 2 === 0 ? 'A' : 'B';
          this.saveSeat(s, this.seatSessions.get(s.id)!.guestId, this.seatSessions.get(s.id)!.epoch);
        }
        idx++;
      }
    }

    if (this.settings.gameMode === 'duels' && this.eligibleDrawerIds.length >= 2) {
      const d1 = this.eligibleDrawerIds[this.drawerIndex % this.eligibleDrawerIds.length];
      const d2 = this.eligibleDrawerIds[(this.drawerIndex + 1) % this.eligibleDrawerIds.length];
      this.currentDrawerIds = [d1, d2];
    } else {
      const drawerId = this.eligibleDrawerIds[this.drawerIndex % this.eligibleDrawerIds.length];
      this.currentDrawerIds = [drawerId];
    }

    this.candidateWords = selectCandidateWords(this.settings.wordPack, 3, this.settings.customWords);

    const selectionDeadline = Date.now() + 10000; // 10s selection window
    this.deadlineAtMs = selectionDeadline;

    this.saveMeta('turnId', this.turnId);
    this.saveMeta('phase', this.phase);
    this.saveMeta('currentDrawerIds', JSON.stringify(this.currentDrawerIds));
    this.saveMeta('candidateWords', JSON.stringify(this.candidateWords));
    this.saveMeta('deadlineAtMs', String(this.deadlineAtMs));

    this.ctx.storage.setAlarm(selectionDeadline);

    // Broadcast turn announcement to everyone
    this.broadcast({
      v: 1,
      type: 'turn.started',
      seq: ++this.seq,
      stateVersion: ++this.stateVersion,
      serverTimeMs: Date.now(),
      payload: {
        phase: this.phase,
        turnId: this.turnId,
        roundNumber: this.roundNumber,
        totalRounds: this.totalRounds,
        drawerIds: this.currentDrawerIds,
        maskedWord: '???',
        wordLength: 0,
        deadlineAtMs: selectionDeadline,
        canvasId: 'main',
        chaosModifier: this.chaosModifier,
      },
    });

    // Send word candidates EXCLUSIVELY to drawer(s)
    for (const drawerId of this.currentDrawerIds) {
      const drawerSockets = this.ctx.getWebSockets(drawerId);
      for (const ws of drawerSockets) {
        ws.send(JSON.stringify({
          v: 1,
          type: 'turn.wordChoices',
          seq: ++this.seq,
          stateVersion: this.stateVersion,
          serverTimeMs: Date.now(),
          payload: {
            candidates: this.candidateWords,
            expiresAtMs: selectionDeadline,
          },
        }));
      }
    }
  }

  private startDrawing(word: string) {
    this.phase = 'DRAWING';
    this.internalSecretWord = word;
    this.candidateWords = [];
    this.revealedHintIndices = [];
    this.correctGuesserIds = [];

    if (this.settings.gameMode === 'chaos') {
      const modifiers: ChaosModifier[] = [
        { id: 'mirror_x', name: 'Mirror Horizon', description: 'Horizontal drawing is mirrored!', effect: 'mirror_x' },
        { id: 'inverted_coords', name: 'Upside Down', description: 'Vertical controls are reversed!', effect: 'inverted_coords' },
        { id: 'palette_limit', name: 'Monochrome Blitz', description: 'Only black and white ink allowed!', effect: 'palette_limit' },
        { id: 'time_rush', name: 'Speed Rush', description: 'Clock ticks at double speed!', effect: 'time_rush' },
        { id: 'thick_brush', name: 'Chunky Brush', description: 'Minimum brush thickness is 16px!', effect: 'thick_brush' },
      ];
      this.chaosModifier = modifiers[Math.floor(Math.random() * modifiers.length)];
    } else {
      this.chaosModifier = null;
    }

    const drawDuration = this.settings.drawSeconds * 1000;
    const now = Date.now();
    const deadline = now + drawDuration;
    this.deadlineAtMs = deadline;

    // Automatic Hint Schedule (C05, C06, C07)
    const hintPlan = computeAutomaticHintSchedule(this.internalSecretWord, drawDuration);
    this.hintScheduleMs = hintPlan.offsetsMs.map((offset: number) => now + offset);
    
    // Deterministically shuffle maskable indices
    const shuffled = [...hintPlan.maskableIndices];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    this.hintIndicesToReveal = shuffled.slice(0, hintPlan.count);

    this.saveMeta('phase', this.phase);
    this.saveMeta('internalSecretWord', this.internalSecretWord);
    this.saveMeta('deadlineAtMs', String(this.deadlineAtMs));

    const nextAlarm = this.hintScheduleMs.length > 0 ? this.hintScheduleMs[0] : deadline;
    this.ctx.storage.setAlarm(nextAlarm);

    const masked = maskWord(this.internalSecretWord, []);

    // Broadcast drawing phase to everyone with masked word
    this.broadcast({
      v: 1,
      type: 'turn.started',
      seq: ++this.seq,
      stateVersion: ++this.stateVersion,
      serverTimeMs: Date.now(),
      payload: {
        phase: this.phase,
        turnId: this.turnId,
        roundNumber: this.roundNumber,
        totalRounds: this.totalRounds,
        drawerIds: this.currentDrawerIds,
        maskedWord: masked,
        wordLength: this.internalSecretWord.length,
        deadlineAtMs: deadline,
        canvasId: 'main',
        chaosModifier: this.chaosModifier,
      },
    });

    // Send secret word EXCLUSIVELY to the drawer(s)
    for (const drawerId of this.currentDrawerIds) {
      const drawerSockets = this.ctx.getWebSockets(drawerId);
      for (const ws of drawerSockets) {
        ws.send(JSON.stringify({
          v: 1,
          type: 'turn.wordChoices',
          seq: ++this.seq,
          stateVersion: this.stateVersion,
          serverTimeMs: Date.now(),
          payload: {
            secretWord: this.internalSecretWord,
            expiresAtMs: deadline,
          },
        }));
      }
    }
  }

  private revealNextScheduledHint() {
    if (!this.internalSecretWord) return;
    if (this.hintIndicesToReveal.length === 0) {
      for (let i = 0; i < this.internalSecretWord.length; i++) {
        if (/\p{L}|\p{N}/u.test(this.internalSecretWord[i]) && !this.revealedHintIndices.includes(i)) {
          this.hintIndicesToReveal.push(i);
        }
      }
    }
    if (this.hintIndicesToReveal.length === 0) return;
    const nextIdx = this.hintIndicesToReveal.shift();
    if (nextIdx === undefined || this.revealedHintIndices.includes(nextIdx)) return;

    this.revealedHintIndices.push(nextIdx);
    const masked = maskWord(this.internalSecretWord, this.revealedHintIndices);
    this.broadcast({
      v: 1,
      type: 'round.hintRevealed',
      seq: ++this.seq,
      stateVersion: ++this.stateVersion,
      serverTimeMs: Date.now(),
      payload: {
        revealedIndex: nextIdx,
        maskedWord: masked,
        revealedHintIndices: this.revealedHintIndices,
      },
    });
  }

  private endDrawingTurn(reason: 'TIMEOUT' | 'ALL_GUESSED' | 'DRAWER_DISCONNECT') {
    this.phase = 'REVEAL';
    const revealDeadline = Date.now() + 5000; // 5s reveal countdown
    this.deadlineAtMs = revealDeadline;

    // Calculate drawer reward
    const uniqueCorrect = this.correctGuesserIds.length;
    const drawerReward = calculateDrawerReward(uniqueCorrect);

    if (drawerReward > 0 && this.currentDrawerIds.length > 0) {
      const drawerSeat = this.seats.get(this.currentDrawerIds[0]);
      if (drawerSeat) {
        drawerSeat.score += drawerReward;
        this.saveSeat(drawerSeat, this.seatSessions.get(drawerSeat.id)!.guestId, this.seatSessions.get(drawerSeat.id)!.epoch);
        if (this.partyEngine && this.currentDrawerIds[0]) {
          this.partyEngine.recordRawScore(this.currentDrawerIds[0], drawerReward);
        }
      }
    }

    const turnResult: TurnResult = {
      turnId: this.turnId || '',
      secretWord: this.internalSecretWord || '',
      drawerId: this.currentDrawerIds[0] || '',
      drawerReward,
      guesserScores: this.correctGuesserIds.map((id, index) => {
        const s = this.seats.get(id);
        return {
          seatId: id,
          nickname: s?.nickname || 'Guesser',
          basePoints: 100,
          speedBonus: Math.max(0, 50 - 10 * index),
          hintPenalty: 0,
          totalAwarded: 100 + Math.max(0, 50 - 10 * index),
          rank: index + 1,
        };
      }),
    };

    this.saveMeta('phase', this.phase);
    this.saveMeta('deadlineAtMs', String(this.deadlineAtMs));

    this.ctx.storage.setAlarm(revealDeadline);

    // Broadcast reveal with PLAINTEXT WORD (now legal after turn is complete)
    this.broadcast({
      v: 1,
      type: 'turn.reveal',
      seq: ++this.seq,
      stateVersion: ++this.stateVersion,
      serverTimeMs: Date.now(),
      payload: {
        turnId: this.turnId,
        secretWord: this.internalSecretWord,
        result: turnResult,
        reason,
      },
    });
  }

  private advanceAfterReveal() {
    this.phase = 'ROUND_RESULTS';
    const roundResultsDeadline = Date.now() + 5000;
    this.deadlineAtMs = roundResultsDeadline;
    this.saveMeta('phase', this.phase);
    this.saveMeta('deadlineAtMs', String(this.deadlineAtMs));

    this.ctx.storage.setAlarm(roundResultsDeadline);

    this.broadcast({
      v: 1,
      type: 'round.results',
      seq: ++this.seq,
      stateVersion: ++this.stateVersion,
      serverTimeMs: Date.now(),
      payload: {
        updatedSeats: Array.from(this.seats.values()),
        nextTurnInMs: 5000,
      },
    });
  }

  private advanceTurn() {
    this.drawerIndex += 1;
    this.roundNumber += 1;
    this.saveMeta('drawerIndex', String(this.drawerIndex));
    this.saveMeta('roundNumber', String(this.roundNumber));

    if (this.roundNumber > this.totalRounds) {
      this.finishMatch();
    } else {
      this.startWordSelection();
    }
  }

  private finishMatch() {
    this.phase = 'MATCH_RESULTS';
    this.deadlineAtMs = null;
    this.saveMeta('phase', this.phase);
    this.saveMeta('deadlineAtMs', '');

    let podium: any[];
    if (this.settings.gameMode === 'party_mix' && this.partyEngine) {
      const leaderboard = this.partyEngine.getFinalLeaderboard();
      podium = leaderboard.map((item) => {
        const s = this.seats.get(item.seatId);
        return {
          seatId: item.seatId,
          nickname: item.nickname,
          avatarFace: s?.avatarFace || 0,
          avatarColor: s?.avatarColor || 'coral',
          finalScore: item.totalPoints,
          rank: item.rank,
          firstCorrectCount: 0,
        };
      });
    } else {
      const rankedSeats = Array.from(this.seats.values())
        .filter(s => s.role !== 'spectator')
        .sort((a, b) => b.score - a.score);

      podium = rankedSeats.map((s, idx) => ({
        seatId: s.id,
        nickname: s.nickname,
        avatarFace: s.avatarFace,
        avatarColor: s.avatarColor,
        finalScore: s.score,
        rank: idx + 1,
        firstCorrectCount: 0,
      }));
    }

    this.broadcast({
      v: 1,
      type: 'match.results',
      seq: ++this.seq,
      stateVersion: ++this.stateVersion,
      serverTimeMs: Date.now(),
      payload: { podium, allSeats: Array.from(this.seats.values()) },
    });
  }

  private handlePlayerDropout(droppedSeat: PublicSeat) {
    if (this.phase === 'LOBBY') {
      if (droppedSeat.role === 'host') {
        this.electNewHost();
      }
    } else if (this.phase === 'DRAWING' && this.currentDrawerIds.includes(droppedSeat.id)) {
      // Current drawer disconnected during drawing -> skip turn
      this.endDrawingTurn('DRAWER_DISCONNECT');
    }
  }

  private electNewHost() {
    const candidates = Array.from(this.seats.values())
      .filter(s => s.connected)
      .sort((a, b) => a.joinedAt - b.joinedAt);

    if (candidates.length > 0) {
      const newHost = candidates[0];
      newHost.role = 'host';
      this.saveSeat(newHost, this.seatSessions.get(newHost.id)!.guestId, this.seatSessions.get(newHost.id)!.epoch);
      this.broadcast({
        v: 1,
        type: 'room.hostChanged',
        seq: ++this.seq,
        stateVersion: ++this.stateVersion,
        serverTimeMs: Date.now(),
        payload: { hostSeatId: newHost.id },
      });
    }
  }

  private kickSeat(targetSeatId: string) {
    const seat = this.seats.get(targetSeatId);
    if (!seat) return;

    const sockets = this.ctx.getWebSockets(targetSeatId);
    for (const ws of sockets) {
      ws.close(1008, 'Kicked by host');
    }

    this.deleteSeat(targetSeatId);

    this.broadcast({
      v: 1,
      type: 'room.memberLeft',
      seq: ++this.seq,
      stateVersion: ++this.stateVersion,
      serverTimeMs: Date.now(),
      payload: { seatId: targetSeatId, reason: 'KICKED' },
    });
  }

  private transferHost(newHostSeatId: string) {
    const target = this.seats.get(newHostSeatId);
    if (!target) return;

    for (const s of this.seats.values()) {
      if (s.role === 'host') {
        s.role = 'player';
        this.saveSeat(s, this.seatSessions.get(s.id)!.guestId, this.seatSessions.get(s.id)!.epoch);
      }
    }

    target.role = 'host';
    this.saveSeat(target, this.seatSessions.get(target.id)!.guestId, this.seatSessions.get(target.id)!.epoch);

    this.broadcast({
      v: 1,
      type: 'room.hostChanged',
      seq: ++this.seq,
      stateVersion: ++this.stateVersion,
      serverTimeMs: Date.now(),
      payload: { hostSeatId: target.id },
    });
  }

  private broadcast(event: ServerEnvelope, filter?: (seatId: string) => boolean) {
    const json = JSON.stringify(event);
    for (const seat of this.seats.values()) {
      if (filter && !filter(seat.id)) continue;
      const sockets = this.ctx.getWebSockets(seat.id);
      for (const ws of sockets) {
        try {
          ws.send(json);
        } catch {
          // ignore send error on closing socket
        }
      }
    }
  }

  private broadcastChat(seat: PublicSeat, text: string, isCorrect = false, isClose = false, targetAudience: 'all' | 'solved' = 'all') {
    const isSolved = targetAudience === 'solved';
    const msg: ChatMessage = {
      id: generateRandomId('msg'),
      seatId: seat.id,
      nickname: seat.nickname,
      text,
      isCorrect,
      isClose,
      channel: isSolved ? 'solved' : undefined,
      timestampMs: Date.now(),
    };
    this.chatHistory.push(msg);
    if (this.chatHistory.length > 100) this.chatHistory.shift();

    const event = {
      v: 1 as const,
      type: 'chat.message' as const,
      seq: ++this.seq,
      stateVersion: this.stateVersion,
      serverTimeMs: Date.now(),
      payload: { message: msg },
    };

    if (isSolved) {
      const solvedSeatIds = new Set<string>([
        ...this.currentDrawerIds,
        ...Array.from(this.seats.values()).filter(s => s.guessedThisTurn).map(s => s.id)
      ]);
      this.broadcast(event, (seatId) => solvedSeatIds.has(seatId));
    } else {
      this.broadcast(event);
    }
  }

  private sendPrivateGuessFeedback(ws: WebSocket, status: 'CORRECT' | 'CLOSE' | 'WRONG' | 'ALREADY_GUESSED' | 'RATE_LIMITED', awardedPoints: number, rank?: number) {
    try {
      ws.send(JSON.stringify({
        v: 1,
        type: 'guess.privateFeedback',
        seq: ++this.seq,
        stateVersion: this.stateVersion,
        serverTimeMs: Date.now(),
        payload: { status, awardedPoints, rank },
      }));
    } catch {
      // ignore
    }
  }

  private sendError(ws: WebSocket, code: string, message: string, retryable = false) {
    try {
      ws.send(JSON.stringify({
        v: 1,
        type: 'error',
        seq: ++this.seq,
        stateVersion: this.stateVersion,
        serverTimeMs: Date.now(),
        payload: { code, message, retryable },
      }));
    } catch {
      // ignore
    }
  }

  private getPublicSnapshot(forSeatId: string): PublicRoomSnapshot {
    const isDrawer = this.currentDrawerIds.includes(forSeatId);
    let masked: string | null = null;

    if (this.phase === 'DRAWING') {
      if (isDrawer) {
        masked = this.internalSecretWord;
      } else {
        masked = maskWord(this.internalSecretWord || '', this.revealedHintIndices);
      }
    } else if (this.phase === 'REVEAL' || this.phase === 'ROUND_RESULTS' || this.phase === 'MATCH_RESULTS') {
      masked = this.internalSecretWord;
    }

    return {
      v: 1,
      stateVersion: this.stateVersion,
      roomCode: this.roomCode,
      mySeatId: forSeatId,
      phase: this.phase,
      gameMode: this.settings.gameMode,
      settings: this.settings,
      matchId: this.matchId,
      turnId: this.turnId,
      roundNumber: this.roundNumber,
      totalRounds: this.totalRounds,
      deadlineAtMs: this.deadlineAtMs,
      currentDrawerIds: this.currentDrawerIds,
      maskedWord: masked,
      revealedHintIndices: this.revealedHintIndices,
      seats: Array.from(this.seats.values()),
      canvasSeq: { main: this.commandLog.length },
      chaosModifier: this.chaosModifier,
    };
  }

  private sendSnapshot(ws: WebSocket, seatId: string) {
    const isDrawer = this.currentDrawerIds.includes(seatId);
    const snapshot = this.getPublicSnapshot(seatId);

    const payload: {
      snapshot: PublicRoomSnapshot;
      drawerData?: { candidateWords?: { id: string; word: string }[]; secretWord?: string };
      activeDrawingOps?: StrokeCommand[];
    } = { snapshot };

    if (isDrawer) {
      payload.drawerData = {
        candidateWords: this.candidateWords,
        secretWord: this.internalSecretWord || undefined,
      };
    }

    if (this.commandLog.length > 0) {
      payload.activeDrawingOps = this.commandLog;
    }

    try {
      ws.send(JSON.stringify({
        v: 1,
        type: 'room.snapshot',
        seq: ++this.seq,
        stateVersion: this.stateVersion,
        serverTimeMs: Date.now(),
        payload,
      }));
    } catch {
      // ignore
    }
  }
}
