/**
 * Strict Zod Validation Schemas for DOODL
 */

import { z } from 'zod';

export const ClientIntentEnum = z.enum([
  'room.setSettings',
  'room.start',
  'room.kick',
  'room.mute',
  'room.transferHost',
  'room.playAgain',
  'room.leave',
  'word.select',
  'stroke.begin',
  'stroke.append',
  'stroke.end',
  'draw.undo',
  'draw.redo',
  'draw.clear',
  'guess.submit',
  'chat.send',
  'reaction.send',
  'round.hintRequest',
  'sync.request',
  'duel.guess',
  'team.assign',
]);

export type ClientIntent = z.infer<typeof ClientIntentEnum>;

export const GameModeEnum = z.enum(['classic', 'blitz', 'duels', 'chaos', 'teams']);
export const WordPackEnum = z.enum([
  'everyday',
  'animals',
  'food',
  'places',
  'objects',
  'nature',
  'sports',
  'science',
  'custom',
]);

export const RoomSettingsSchema = z.object({
  visibility: z.enum(['private', 'public']),
  maxPlayers: z.number().int().min(2).max(12),
  cyclesPerPlayer: z.number().int().min(1).max(5),
  drawSeconds: z.number().int(),
  gameMode: GameModeEnum,
  wordPack: WordPackEnum,
  customWords: z.array(z.string().min(1).max(40)).max(200).optional(),
  passwordProtected: z.boolean().default(false),
  password: z.string().max(64).optional(),
  language: z.enum(['en', 'hi', 'kn']).default('en'),
  allowSpectators: z.boolean().default(false),
}).refine((data) => {
  if (data.gameMode === 'blitz') {
    return [20, 30, 45].includes(data.drawSeconds);
  }
  return [60, 75, 90, 120].includes(data.drawSeconds);
}, {
  message: "Invalid drawSeconds for selected gameMode",
  path: ["drawSeconds"],
}).refine((data) => {
  if (data.visibility === 'public') {
    return data.wordPack !== 'custom';
  }
  return true;
}, {
  message: "Public rooms cannot use custom word packs",
  path: ["wordPack"],
});

export const NormalizedPointSchema = z.object({
  x: z.number().int().min(0).max(65535),
  y: z.number().int().min(0).max(65535),
  dtMs: z.number().int().min(0).max(120000).optional(),
  pressure: z.number().min(0).max(1).optional(),
});

export const DrawingToolEnum = z.enum(['pencil', 'eraser', 'line', 'rainbow', 'sticker', 'shape']);

export const StrokeCommandSchema = z.object({
  strokeId: z.string().min(1).max(64),
  turnId: z.string().min(1).max(64),
  canvasId: z.string().min(1).max(32).default('main'),
  tool: DrawingToolEnum,
  color: z.string().min(1).max(32),
  size: z.number().min(1).max(32),
  points: z.array(NormalizedPointSchema).max(200),
  stickerId: z.string().max(32).optional(),
});

export const GuestSessionSchema = z.object({
  nickname: z.string().trim().min(2).max(20),
  avatarFace: z.number().int().min(0).max(5).default(0),
  avatarColor: z.enum(['coral', 'blue', 'green', 'pink', 'purple', 'yellow']).default('coral'),
});

export const CreateRoomSchema = z.object({
  settings: RoomSettingsSchema,
  hostNickname: z.string().trim().min(2).max(20).optional(),
  avatarFace: z.number().int().min(0).max(5).optional(),
  avatarColor: z.string().optional(),
});

export const JoinRoomSchema = z.object({
  password: z.string().optional(),
});

// Envelope validator
export const ClientEnvelopeSchema = z.object({
  v: z.literal(1),
  type: ClientIntentEnum,
  clientEventId: z.string().min(8).max(96).regex(/^[A-Za-z0-9_-]+$/),
  matchId: z.string().min(1).max(96).optional(),
  turnId: z.string().min(1).max(96).optional(),
  payload: z.record(z.unknown()),
});

// Intent Payloads
export const StrokeBeginPayloadSchema = z.object({
  strokeId: z.string().min(1).max(64),
  canvasId: z.string().min(1).max(32).default('main'),
  tool: DrawingToolEnum,
  color: z.string().min(1).max(32),
  size: z.number().min(1).max(32),
  point: NormalizedPointSchema,
  stickerId: z.string().max(32).optional(),
});

export const StrokeAppendPayloadSchema = z.object({
  strokeId: z.string().min(1).max(64),
  canvasId: z.string().min(1).max(32).default('main'),
  points: z.array(NormalizedPointSchema).min(1).max(200),
});

export const StrokeEndPayloadSchema = z.object({
  strokeId: z.string().min(1).max(64),
  canvasId: z.string().min(1).max(32).default('main'),
  point: NormalizedPointSchema.optional(),
});

export const DrawUndoPayloadSchema = z.object({
  canvasId: z.string().min(1).max(32).default('main'),
  knownSeq: z.number().int().optional(),
});

export const DrawClearPayloadSchema = z.object({
  canvasId: z.string().min(1).max(32).default('main'),
});

export const WordSelectPayloadSchema = z.object({
  candidateId: z.string().min(1).max(64),
});

export const GuessSubmitPayloadSchema = z.object({
  guess: z.string().trim().min(1).max(100),
});

export const ChatSendPayloadSchema = z.object({
  text: z.string().trim().min(1).max(300),
});

export const ReactionSendPayloadSchema = z.object({
  emojiId: z.string().min(1).max(16),
});

export const RoomKickPayloadSchema = z.object({
  targetSeatId: z.string().min(1).max(64),
});

export const RoomMutePayloadSchema = z.object({
  targetSeatId: z.string().min(1).max(64),
  durationSeconds: z.number().int().min(1).max(3600),
});

export const RoomTransferHostPayloadSchema = z.object({
  targetSeatId: z.string().min(1).max(64),
});

export const DuelGuessPayloadSchema = z.object({
  guess: z.string().trim().min(1).max(100),
  canvasId: z.enum(['A', 'B']),
});
