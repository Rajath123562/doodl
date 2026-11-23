/**
 * REFERENCE TYPES, NOT THE IMPLEMENTATION. Agents must implement strict Zod
 * runtime validators for individual event types and authorize based on the
 * server-bound WebSocket guest/seat, never client fields.
 */
export type RoomPhase =
  | 'LOBBY' | 'SELECTING_WORD' | 'DRAWING'
  | 'REVEAL' | 'ROUND_RESULTS' | 'MATCH_RESULTS' | 'CLOSED';
export type GameMode = 'classic' | 'blitz' | 'duels' | 'chaos' | 'teams';
export type PublicRole = 'host' | 'player' | 'spectator';
export type DrawingTool = 'pencil' | 'eraser' | 'line' | 'rainbow' | 'sticker' | 'shape';
export type ClientIntent =
  | 'room.setSettings' | 'room.start' | 'room.kick' | 'room.mute'
  | 'room.transferHost' | 'room.playAgain' | 'room.leave'
  | 'word.select' | 'stroke.begin' | 'stroke.append' | 'stroke.end'
  | 'draw.undo' | 'draw.redo' | 'draw.clear' | 'guess.submit'
  | 'chat.send' | 'reaction.send' | 'round.hintRequest'
  | 'sync.request' | 'duel.guess' | 'team.assign';
export interface ClientEnvelope<T = unknown> {
  v: 1;
  type: ClientIntent;
  clientEventId: string;
  matchId?: string;
  turnId?: string;
  payload: T;
}
export interface PublicSeat {
  id: string;
  nickname: string;
  avatarId: string;
  connected: boolean;
  score: number;
  guessedThisTurn: boolean;
  role: PublicRole;
}
export interface PublicRoomSnapshot {
  v: 1;
  stateVersion: number;
  roomCode: string;
  mySeatId: string;
  phase: RoomPhase;
  gameMode: GameMode;
  matchId: string | null;
  turnId: string | null;
  deadlineAtMs: number | null;
  currentDrawerIds: string[];
  maskedWord: string | null;
  seats: PublicSeat[];
  canvasSeq: Record<string, number>;
}
export interface PrivateDrawerWord {
  secretWord: string; // NEVER broadcast to guessers until REVEAL
  candidateWords?: { id: string; word: string }[];
}
export type NormalizedPoint = {
  x: number;  // integer 0..65535
  y: number;  // integer 0..65535
  dtMs?: number;
  pressure?: number; // float 0..1, bounded
};
export interface StrokeCommand {
  strokeId: string;
  turnId: string;
  canvasId: string; // Classic 'main'; Duel 'A'/'B'
  tool: DrawingTool;
  color: string; // validated palette token or #RRGGBB
  size: number; // 1..32
  points: NormalizedPoint[];
  stickerId?: string;
}
export interface ServerRoomState {
  /** Never serialize directly; construct role-filtered snapshots. */
  internalSecretWord: string | null;
  candidateWords: { id: string; word: string }[];
  phase: RoomPhase;
  deadlineAtMs: number | null;
  stateVersion: number;
  currentTurnId: string | null;
  currentDrawerIds: string[];
  seatCredentialHashes: Record<string, string>;
  processedEventIds: Set<string>;
}
