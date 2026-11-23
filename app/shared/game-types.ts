/**
 * DOODL Shared Domain Models & Types
 */

export type ClientIntent =
  | 'room.setSettings'
  | 'room.start'
  | 'room.kick'
  | 'room.mute'
  | 'room.transferHost'
  | 'room.playAgain'
  | 'room.leave'
  | 'word.select'
  | 'stroke.begin'
  | 'stroke.append'
  | 'stroke.end'
  | 'draw.undo'
  | 'draw.redo'
  | 'draw.clear'
  | 'guess.submit'
  | 'chat.send'
  | 'reaction.send'
  | 'round.hintRequest'
  | 'sync.request'
  | 'duel.guess'
  | 'team.assign';

export type RoomPhase =
  | 'LOBBY'
  | 'SELECTING_WORD'
  | 'DRAWING'
  | 'REVEAL'
  | 'ROUND_RESULTS'
  | 'MATCH_RESULTS'
  | 'CLOSED';

export type GameMode = 'classic' | 'blitz' | 'duels' | 'chaos' | 'teams';

export type PublicRole = 'host' | 'player' | 'spectator';

export type DrawingTool = 'pencil' | 'eraser' | 'line' | 'rainbow' | 'sticker' | 'shape';

export type WordPackId =
  | 'everyday'
  | 'animals'
  | 'food'
  | 'places'
  | 'objects'
  | 'nature'
  | 'sports'
  | 'science'
  | 'custom';

export type LanguageCode = 'en' | 'hi' | 'kn';

export interface RoomSettings {
  visibility: 'private' | 'public';
  maxPlayers: number; // 2..12
  cyclesPerPlayer: number; // 1..5, default 3
  drawSeconds: number; // 20, 30, 45 (Blitz) or 60, 75, 90, 120 (Classic/Duels/Chaos/Teams)
  gameMode: GameMode;
  wordPack: WordPackId;
  customWords?: string[];
  passwordProtected?: boolean;
  password?: string;
  language?: LanguageCode;
  allowSpectators?: boolean;
}

export interface PublicSeat {
  id: string; // seatId
  nickname: string;
  avatarFace: number; // 0..5
  avatarColor: string; // 'coral' | 'blue' | 'green' | 'pink' | 'purple' | 'yellow'
  connected: boolean;
  score: number;
  guessedThisTurn: boolean;
  role: PublicRole;
  team?: 'A' | 'B';
  joinedAt: number;
}

export interface PublicRoomSnapshot {
  v: 1;
  stateVersion: number;
  roomCode: string;
  mySeatId: string;
  phase: RoomPhase;
  gameMode: GameMode;
  settings: RoomSettings;
  matchId: string | null;
  turnId: string | null;
  roundNumber: number;
  totalRounds: number;
  deadlineAtMs: number | null;
  currentDrawerIds: string[];
  maskedWord: string | null;
  revealedHintIndices: number[];
  seats: PublicSeat[];
  canvasSeq: Record<string, number>;
  chaosModifier?: ChaosModifier | null;
}

export interface WordCandidate {
  id: string;
  word: string;
}

export interface PrivateDrawerState {
  candidateWords?: WordCandidate[];
  secretWord?: string;
}

export type NormalizedPoint = {
  x: number; // integer 0..65535
  y: number; // integer 0..65535
  dtMs?: number;
  pressure?: number; // float 0..1
};

export interface StrokeCommand {
  strokeId: string;
  turnId: string;
  canvasId: string; // 'main' or 'A' / 'B' for Duels
  tool: DrawingTool;
  color: string; // hex or palette id
  size: number; // 1..32
  points: NormalizedPoint[];
  stickerId?: string;
  seq?: number;
  createdAtServerMs?: number;
}

export interface CanvasCheckpoint {
  canvasId: string;
  revision: number;
  commands: StrokeCommand[];
}

export interface ChatMessage {
  id: string;
  seatId: string;
  nickname: string;
  text: string;
  isSystem?: boolean;
  isCorrect?: boolean;
  isClose?: boolean;
  timestampMs: number;
}

export interface RoundScoreRecord {
  seatId: string;
  nickname: string;
  basePoints: number;
  speedBonus: number;
  hintPenalty: number;
  totalAwarded: number;
  rank: number;
}

export interface TurnResult {
  turnId: string;
  secretWord: string;
  drawerId: string;
  drawerReward: number;
  guesserScores: RoundScoreRecord[];
}

export interface MatchPodiumItem {
  seatId: string;
  nickname: string;
  avatarFace: number;
  avatarColor: string;
  finalScore: number;
  rank: number;
  firstCorrectCount: number;
}

export interface ChaosModifier {
  id: string;
  name: string;
  description: string;
  effect: 'palette_limit' | 'mirror_x' | 'inverted_coords' | 'time_rush' | 'thick_brush';
}
