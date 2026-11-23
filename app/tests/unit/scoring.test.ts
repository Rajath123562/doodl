import { describe, it, expect } from 'vitest';
import {
  calculateGuesserScore,
  calculateDrawerReward,
  normalizeGuess,
  isCloseGuess,
  maskWord,
} from '../../shared/rules';
import { RoomSettingsSchema, ClientEnvelopeSchema } from '../../shared/schemas';

describe('Deterministic Scoring Engine (P0-013)', () => {
  it('calculates maximum score for immediate first correct guess without hints', () => {
    const durationMs = 90000;
    const deadlineAtMs = 100000;
    const nowMs = 10000; // 90,000ms remaining -> remaining = 1.0
    const correctRank = 0; // 1st correct
    const hintsUsed = 0;

    const result = calculateGuesserScore(nowMs, deadlineAtMs, durationMs, correctRank, hintsUsed);
    // base = 100 + floor(400 * 1) = 500
    // speedBonus = max(0, 50 - 10 * 0) = 50
    // hintPenalty = 0
    // points = 550
    expect(result.base).toBe(500);
    expect(result.speedBonus).toBe(50);
    expect(result.hintPenalty).toBe(0);
    expect(result.points).toBe(550);
  });

  it('calculates intermediate score with speed rank decay and hint penalty', () => {
    const durationMs = 90000;
    const deadlineAtMs = 100000;
    const nowMs = 55000; // 45,000ms remaining -> remaining = 0.5
    const correctRank = 2; // 3rd correct
    const hintsUsed = 1;

    const result = calculateGuesserScore(nowMs, deadlineAtMs, durationMs, correctRank, hintsUsed);
    // base = 100 + floor(400 * 0.5) = 300
    // speedBonus = max(0, 50 - 10 * 2) = 30
    // hintPenalty = 60 * 1 = 60
    // points = max(40, 300 + 30 - 60) = 270
    expect(result.base).toBe(300);
    expect(result.speedBonus).toBe(30);
    expect(result.hintPenalty).toBe(60);
    expect(result.points).toBe(270);
  });

  it('enforces floor of 40 points when hints exceed remaining time', () => {
    const durationMs = 90000;
    const deadlineAtMs = 100000;
    const nowMs = 99000; // 1,000ms remaining -> remaining = 0.0111
    const correctRank = 5; // 6th correct -> speedBonus = 0
    const hintsUsed = 2; // penalty = 120

    const result = calculateGuesserScore(nowMs, deadlineAtMs, durationMs, correctRank, hintsUsed);
    // base = 100 + floor(400 * 1000/90000) = 100 + 4 = 104
    // speedBonus = 0
    // hintPenalty = 120
    // 104 + 0 - 120 = -16 -> clamped to floor 40
    expect(result.points).toBe(40);
  });

  it('calculates drawer reward correctly up to 300 cap', () => {
    expect(calculateDrawerReward(0)).toBe(0);
    expect(calculateDrawerReward(1)).toBe(75);
    expect(calculateDrawerReward(2)).toBe(150);
    expect(calculateDrawerReward(3)).toBe(225);
    expect(calculateDrawerReward(4)).toBe(300);
    expect(calculateDrawerReward(8)).toBe(300); // capped at 300
  });
});

describe('Word Normalization & Guess Matching (P0-012)', () => {
  it('normalizes case, whitespace, and punctuation', () => {
    expect(normalizeGuess('  PiZZa! ')).toBe('pizza');
    expect(normalizeGuess('ice-cream')).toBe('icecream');
    expect(normalizeGuess('Héllo   Wörld')).toBe('hello world'.normalize('NFKC').toLowerCase());
  });

  it('identifies close guesses using Levenshtein distance', () => {
    expect(isCloseGuess('banana', 'banan')).toBe(true); // distance 1, len 6
    expect(isCloseGuess('elephant', 'elephan')).toBe(true); // distance 1, len 8
    expect(isCloseGuess('elephant', 'elephnt')).toBe(true); // distance 1
    expect(isCloseGuess('cat', 'car')).toBe(false); // short words (<4) don't trigger close
    expect(isCloseGuess('banana', 'banana')).toBe(false); // exact match is not "close"
  });

  it('generates masked representation properly with hints (P0-014)', () => {
    expect(maskWord('cat')).toBe('_ _ _');
    expect(maskWord('ice cream')).toBe('_ _ _   _ _ _ _ _');
    expect(maskWord('cat', [1])).toBe('_ A _');
    expect(maskWord('cat', [0, 2])).toBe('C _ T');
  });
});

describe('Schema & Security Contracts (P0-004, P0-021)', () => {
  it('validates legitimate room settings and rejects invalid combinations', () => {
    const validClassic = {
      visibility: 'private' as const,
      maxPlayers: 8,
      cyclesPerPlayer: 3,
      drawSeconds: 90,
      gameMode: 'classic' as const,
      wordPack: 'everyday' as const,
    };
    expect(RoomSettingsSchema.safeParse(validClassic).success).toBe(true);

    const invalidBlitzTime = {
      ...validClassic,
      gameMode: 'blitz' as const,
      drawSeconds: 90, // Blitz only allows 20, 30, 45
    };
    expect(RoomSettingsSchema.safeParse(invalidBlitzTime).success).toBe(false);

    const invalidPublicCustom = {
      ...validClassic,
      visibility: 'public' as const,
      wordPack: 'custom' as const, // Public cannot use custom words
    };
    expect(RoomSettingsSchema.safeParse(invalidPublicCustom).success).toBe(false);
  });

  it('validates client envelope and blocks extra arbitrary fields', () => {
    const validEnvelope = {
      v: 1,
      type: 'guess.submit',
      clientEventId: 'evt_12345678',
      payload: { guess: 'sunflower' },
    };
    expect(ClientEnvelopeSchema.safeParse(validEnvelope).success).toBe(true);

    const invalidEnvelopeUnknownType = {
      ...validEnvelope,
      type: 'malicious.hack',
    };
    expect(ClientEnvelopeSchema.safeParse(invalidEnvelopeUnknownType).success).toBe(false);
  });
});
