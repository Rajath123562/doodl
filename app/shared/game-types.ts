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
  | 'round.hintRequest' // Deprecated: Rejected by server with UNSUPPORTED_ACTION
  | 'sync.request'
  | 'duel.guess'
  | 'team.assign'
  | 'telephone.draft'
  | 'telephone.submit'
  | 'telephone.vote'
  | 'party.nextStage';

export type RoomPhase =
  | 'LOBBY'
  | 'SELECTING_WORD'
  | 'DRAWING'
  | 'REVEAL'
  | 'ROUND_RESULTS'
  | 'MATCH_RESULTS'
  | 'CLOSED'
  // Telephone specific phases
  | 'TELEPHONE_PROMPT'
  | 'TELEPHONE_DRAW'
  | 'TELEPHONE_DESCRIBE'
  | 'TELEPHONE_REVEAL'
  // Party Mix specific phases
  | 'PARTY_STAGE_INTRO'
  | 'PARTY_STAGE_RESULTS';

export type StandaloneGameMode = 'classic' | 'telephone' | 'party_mix';
export type LegacyGameMode = 'blitz' | 'duels' | 'chaos' | 'teams';
export type GameMode = StandaloneGameMode | LegacyGameMode;

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
  maxPlayers: number; // 2..20
  cyclesPerPlayer: number; // 1..5, default 3
  drawSeconds: number; // 20, 30, 45, 60, 75, 90, 120
  gameMode: GameMode;
  wordPack: WordPackId;
  customWords?: string[];
  passwordProtected?: boolean;
  password?: string;
  language?: LanguageCode;
  allowSpectators?: boolean;
  autoHintsEnabled?: boolean; // V4.2: automatic time-based hints (default: true)
  partyPreset?: 'standard' | 'short'; // V4.2: Party Mix duration preset
  telephoneChainLength?: number; // V4.2: Telephone custom chain length L in [4..N]
}

// Drawing Telephone Domain Models
export type TelephoneStepType = 'prompt' | 'draw' | 'describe' | 'reveal';

export interface TelephoneArtifact {
  id: string;
  chainId: string;
  stepIndex: number;
  stepType: TelephoneStepType;
  authorSeatId: string;
  authorNickname: string;
  text?: string;
  strokes?: StrokeCommand[];
  isMissing?: boolean;
  missingReason?: string;
  timestampMs: number;
}

export interface TelephoneChain {
  id: string; // chainId
  originSeatId: string;
  originNickname: string;
  artifacts: TelephoneArtifact[];
}

export interface TelephoneAssignment {
  matchId: string;
  stepIndex: number;
  totalSteps: number;
  chainId: string;
  stepType: TelephoneStepType;
  previousArtifact?: {
    stepType: TelephoneStepType;
    text?: string;
    strokes?: StrokeCommand[];
    authorNickname?: string;
    isMissing?: boolean;
  };
  deadlineAtMs: number;
}

// Party Mix Domain Models
export type PartyStageId = 'classic' | 'blitz' | 'chaos' | 'telephone';

export type ChaosModifierId = 'monochrome' | 'three_color' | 'no_eraser' | 'giant_brush';

export interface PartyStageConfig {
  stageId: PartyStageId;
  stageIndex: number; // 0..3
  totalStages: number;
  name: string;
  drawSeconds: number;
  chaosModifier?: ChaosModifierId | ChaosModifier;
}

export interface PartyStageRankingItem {
  seatId: string;
  nickname: string;
  rank: number;
  rawScore: number;
  normalizedPoints: number;
}

export interface PartyStageResult {
  stageId: PartyStageId;
  stageIndex: number;
  stageName: string;
  rankings: PartyStageRankingItem[];
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
  telephoneSubmitted?: boolean;
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
  solvedSeatIds?: string[];
  // Telephone active state
  telephoneState?: {
    stepIndex: number;
    totalSteps: number;
    stepType: TelephoneStepType;
    submittedCount: number;
    totalParticipants: number;
    chains?: TelephoneChain[];
  };
  // Party Mix active state
  partyState?: {
    currentStageIndex: number;
    totalStages: number;
    currentStageId: PartyStageId;
    stageName: string;
    chaosModifier?: ChaosModifier | null;
    cumulativePoints: Record<string, number>;
    stageResults: PartyStageResult[];
  };
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
  channel?: 'all' | 'solved' | 'public';
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
