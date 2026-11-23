/**
 * DOODL Real-time WebSocket Protocol v1
 */

import type {
  ClientIntent,
  PublicSeat,
  PublicRoomSnapshot,
  StrokeCommand,
  TurnResult,
  MatchPodiumItem,
  ChaosModifier,
} from './game-types';

export interface ClientEnvelope<T = unknown> {
  v: 1;
  type: ClientIntent;
  clientEventId: string;
  matchId?: string;
  turnId?: string;
  payload: T;
}

export type ServerEventType =
  | 'room.snapshot'
  | 'room.memberJoined'
  | 'room.memberLeft'
  | 'room.memberUpdated'
  | 'room.settingsChanged'
  | 'room.hostChanged'
  | 'match.start'
  | 'turn.wordChoices'
  | 'turn.started'
  | 'turn.hint'
  | 'turn.timerSync'
  | 'drawing.ops'
  | 'draw.cleared'
  | 'guess.privateFeedback'
  | 'guess.publicCorrect'
  | 'chat.message'
  | 'reaction.broadcast'
  | 'turn.reveal'
  | 'round.results'
  | 'match.results'
  | 'room.restarting'
  | 'error'
  | 'connection.superseded'
  | 'room.closed';

export interface ServerEnvelope<T = unknown> {
  v: 1;
  type: ServerEventType;
  seq: number;
  stateVersion: number;
  serverTimeMs: number;
  matchId?: string | null;
  turnId?: string | null;
  payload: T;
}

// Server Event Payloads
export interface ServerSnapshotPayload {
  snapshot: PublicRoomSnapshot;
  drawerData?: {
    candidateWords?: { id: string; word: string }[];
    secretWord?: string;
  };
}

export interface MemberJoinedPayload {
  seat: PublicSeat;
}

export interface MemberLeftPayload {
  seatId: string;
  reason?: string;
}

export interface WordChoicesPayload {
  candidates: { id: string; word: string }[];
  expiresAtMs: number;
}

export interface TurnStartedPayload {
  turnId: string;
  roundNumber: number;
  totalRounds: number;
  drawerIds: string[];
  maskedWord: string;
  wordLength: number;
  deadlineAtMs: number;
  canvasId: string;
  chaosModifier?: ChaosModifier | null;
}

export interface TurnHintPayload {
  turnId: string;
  revealedIndices: number[];
  maskedWord: string;
  hintCostPoints: number;
}

export interface DrawingOpsPayload {
  canvasId: string;
  ops: StrokeCommand[];
  revision: number;
}

export interface DrawClearedPayload {
  canvasId: string;
  revision: number;
}

export interface GuessPrivateFeedbackPayload {
  status: 'CORRECT' | 'CLOSE' | 'WRONG' | 'ALREADY_GUESSED' | 'RATE_LIMITED';
  awardedPoints: number;
  rank?: number;
}

export interface GuessPublicCorrectPayload {
  seatId: string;
  nickname: string;
  rank: number;
  awardedPoints: number;
}

export interface ReactionBroadcastPayload {
  seatId: string;
  emojiId: string;
}

export interface TurnRevealPayload {
  turnId: string;
  secretWord: string;
  result: TurnResult;
}

export interface RoundResultsPayload {
  turnResult: TurnResult;
  updatedSeats: PublicSeat[];
  nextTurnInMs: number;
}

export interface MatchResultsPayload {
  podium: MatchPodiumItem[];
  allSeats: PublicSeat[];
}

export interface ServerErrorPayload {
  code: string;
  message: string;
  retryable: boolean;
  requestId?: string;
}
