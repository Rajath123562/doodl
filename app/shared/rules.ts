/**
 * Pure Game Rules & Deterministic Scoring Formulas
 */

/**
 * Normalizes words and guesses:
 * - Unicode NFD to strip diacritics for flexible English matching
 * - Unicode NFKC normalization
 * - Lowercase / case fold
 * - Collapses whitespace
 * - Strips trailing/leading punctuation
 */
export function normalizeGuess(input: string): string {
  if (!input) return '';
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics (e.g. café -> cafe)
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, '') // remove safe non-alphanumeric punctuation
    .replace(/\s+/g, ' ');
}

/**
 * Evaluates match similarity for "close" guesses:
 * Uses Levenshtein distance: if distance is 1 (for words length >= 4) or 2 (length >= 7), consider CLOSE.
 */
export function isCloseGuess(target: string, guess: string): boolean {
  const normTarget = normalizeGuess(target);
  const normGuess = normalizeGuess(guess);
  if (normTarget === normGuess) return false; // exact match, not merely close

  const len = normTarget.length;
  if (len < 4) return false;

  const dist = levenshteinDistance(normTarget, normGuess);
  if (len >= 7 && dist <= 2) return true;
  if (len >= 4 && dist === 1) return true;
  return false;
}

function levenshteinDistance(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[][] = [];
  for (let i = 0; i <= bn; ++i) matrix[i] = [i];
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;
  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Server-authoritative guesser score formula:
 * remaining = clamp((deadlineAt - now) / durationMs, 0, 1)
 * base = 100 + floor(400 * remaining)
 * speedBonus = max(0, 50 - 10 * correctRank) // correctRank: 0 for 1st, 1 for 2nd...
 * hintPenalty = 60 * hintsUsed
 * points = max(40, base + speedBonus - hintPenalty)
 */
export function calculateGuesserScore(
  nowMs: number,
  deadlineAtMs: number,
  durationMs: number,
  correctRank: number,
  hintsUsed: number
): { points: number; base: number; speedBonus: number; hintPenalty: number } {
  const remaining = Math.max(0, Math.min(1, (deadlineAtMs - nowMs) / durationMs));
  const base = 100 + Math.floor(400 * remaining);
  const speedBonus = Math.max(0, 50 - 10 * correctRank);
  const hintPenalty = 60 * hintsUsed;
  const points = Math.max(40, base + speedBonus - hintPenalty);

  return { points, base, speedBonus, hintPenalty };
}

/**
 * Server-authoritative drawer reward formula:
 * min(300, 75 * uniqueCorrectGuessers)
 */
export function calculateDrawerReward(uniqueCorrectGuessers: number): number {
  if (uniqueCorrectGuessers <= 0) return 0;
  return Math.min(300, 75 * uniqueCorrectGuessers);
}

/**
 * Creates masked word representation for guessers:
 * E.g. "ICE CREAM" -> "_ _ _   _ _ _ _ _"
 * Characters within words are separated by single space.
 * Words are separated by 3 spaces.
 * Revealed indices are shown in uppercase.
 * Uses grapheme-cluster-safe splitting.
 */
export function maskWord(word: string, revealedIndices: number[] = []): string {
  if (!word) return '';
  const revealedSet = new Set(revealedIndices);
  const words = word.split(' ');
  let globalIdx = 0;

  return words
    .map((w) => {
      const graphemes = Array.from(w);
      const masked = graphemes.map((char) => {
        const currentIdx = globalIdx++;
        if (char === '-' || char === "'" || !/\p{L}|\p{N}/u.test(char)) {
          return char;
        }
        if (revealedSet.has(currentIdx)) return char.toUpperCase();
        return '_';
      });
      globalIdx++; // account for space between words
      return masked.join(' ');
    })
    .join('   ');
}

import type { GameMode, StandaloneGameMode } from './game-types';

export const STANDALONE_MODES: readonly StandaloneGameMode[] = ['classic', 'telephone', 'party_mix'] as const;

export interface ModeMetadata {
  id: GameMode;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  isStandalone: boolean;
  description: string;
}

export const MODE_CONFIG: Record<GameMode, ModeMetadata> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    minPlayers: 2,
    maxPlayers: 20,
    isStandalone: true,
    description: 'Standard drawing and guessing with automatic timed letter reveals.',
  },
  telephone: {
    id: 'telephone',
    name: 'Drawing Telephone',
    minPlayers: 4,
    maxPlayers: 16,
    isStandalone: true,
    description: 'Simultaneous prompt, draw, and describe chain reactions.',
  },
  party_mix: {
    id: 'party_mix',
    name: 'Party Mix',
    minPlayers: 4,
    maxPlayers: 12,
    isStandalone: true,
    description: 'Multi-stage variety tournament: Classic -> Blitz -> Chaos -> Telephone.',
  },
  blitz: {
    id: 'blitz',
    name: 'Blitz',
    minPlayers: 2,
    maxPlayers: 20,
    isStandalone: false,
    description: 'Rapid drawing rounds (internal Party Mix stage).',
  },
  chaos: {
    id: 'chaos',
    name: 'Chaos',
    minPlayers: 2,
    maxPlayers: 20,
    isStandalone: false,
    description: 'Drawing with restricted tools/colors (internal Party Mix stage).',
  },
  duels: {
    id: 'duels',
    name: 'Duels',
    minPlayers: 2,
    maxPlayers: 2,
    isStandalone: false,
    description: 'Legacy mode (read only).',
  },
  teams: {
    id: 'teams',
    name: 'Teams',
    minPlayers: 2,
    maxPlayers: 20,
    isStandalone: false,
    description: 'Legacy mode (read only).',
  },
};

/**
 * Computes deterministic automatic hint schedule:
 * H = min(3, floor(N / 2)), where N is count of maskable letters/numbers.
 * If N <= 1, H = 0.
 * At elapsed T * i / (H + 1) for i = 1..H reveal one new position.
 */
export function computeAutomaticHintSchedule(word: string, durationMs: number): {
  count: number;
  offsetsMs: number[];
  maskableIndices: number[];
} {
  const graphemes = Array.from(word);
  const maskableIndices: number[] = [];
  for (let i = 0; i < graphemes.length; i++) {
    const g = graphemes[i];
    if (/\p{L}|\p{N}/u.test(g)) {
      maskableIndices.push(i);
    }
  }
  const N = maskableIndices.length;
  if (N <= 1) {
    return { count: 0, offsetsMs: [], maskableIndices };
  }
  const count = Math.min(3, Math.floor(N / 2));
  const offsetsMs: number[] = [];
  for (let i = 1; i <= count; i++) {
    offsetsMs.push(Math.ceil((durationMs * i) / (count + 1)));
  }
  return { count, offsetsMs, maskableIndices };
}

/**
 * Normalized party points formula:
 * With M eligible roster size and competition rank r (1, 2, 2, 4):
 * award round(100 * (M - r) / (M - 1)) for M >= 2.
 * Zero raw score gets zero normalized points.
 */
export function calculateNormalizedPartyPoints(M: number, rank: number, rawScore: number): number {
  if (M < 2 || rawScore <= 0) return 0;
  return Math.round((100 * (M - rank)) / (M - 1));
}
