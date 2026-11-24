/**
 * DOODL V4.2 — Phase P1 Mode Registry & Compatibility Tests
 * Validates S01, S02, S04 acceptance criteria.
 */

import { describe, it, expect } from 'vitest';
import { CreateRoomSchema, RoomSettingsSchema } from '../../shared/schemas';
import {
  MODE_CONFIG,
  STANDALONE_MODES,
  calculateNormalizedPartyPoints,
  computeAutomaticHintSchedule,
} from '../../shared/rules';

describe('P1: Mode Registry & Whitelist (S01, S04)', () => {
  it('whitelists exactly 3 standalone modes: classic, telephone, party_mix', () => {
    expect(STANDALONE_MODES).toEqual(['classic', 'telephone', 'party_mix']);
    expect(STANDALONE_MODES.length).toBe(3);

    expect(MODE_CONFIG.classic.isStandalone).toBe(true);
    expect(MODE_CONFIG.telephone.isStandalone).toBe(true);
    expect(MODE_CONFIG.party_mix.isStandalone).toBe(true);
  });

  it('marks legacy modes (blitz, chaos, duels, teams) as non-standalone', () => {
    expect(MODE_CONFIG.blitz.isStandalone).toBe(false);
    expect(MODE_CONFIG.chaos.isStandalone).toBe(false);
    expect(MODE_CONFIG.duels.isStandalone).toBe(false);
    expect(MODE_CONFIG.teams.isStandalone).toBe(false);
  });

  it('enforces exact min and max player constraints per mode (S04)', () => {
    // Classic: 2..20
    expect(MODE_CONFIG.classic.minPlayers).toBe(2);
    expect(MODE_CONFIG.classic.maxPlayers).toBe(20);

    // Telephone: 4..16
    expect(MODE_CONFIG.telephone.minPlayers).toBe(4);
    expect(MODE_CONFIG.telephone.maxPlayers).toBe(16);

    // Party Mix: 4..12
    expect(MODE_CONFIG.party_mix.minPlayers).toBe(4);
    expect(MODE_CONFIG.party_mix.maxPlayers).toBe(12);
  });

  it('allows new room creation only with standalone modes (S01)', () => {
    const validClassic = {
      settings: {
        visibility: 'private',
        maxPlayers: 8,
        cyclesPerPlayer: 3,
        drawSeconds: 60,
        gameMode: 'classic',
        wordPack: 'everyday',
      },
    };
    expect(CreateRoomSchema.safeParse(validClassic).success).toBe(true);

    const validTelephone = {
      settings: {
        visibility: 'private',
        maxPlayers: 8,
        cyclesPerPlayer: 3,
        drawSeconds: 60,
        gameMode: 'telephone',
        wordPack: 'everyday',
      },
    };
    expect(CreateRoomSchema.safeParse(validTelephone).success).toBe(true);

    const validParty = {
      settings: {
        visibility: 'private',
        maxPlayers: 8,
        cyclesPerPlayer: 3,
        drawSeconds: 45,
        gameMode: 'party_mix',
        wordPack: 'everyday',
      },
    };
    expect(CreateRoomSchema.safeParse(validParty).success).toBe(true);
  });

  it('rejects standalone creation of legacy modes: blitz, chaos, duels, teams (S01)', () => {
    const blockedModes = ['blitz', 'chaos', 'duels', 'teams'];

    for (const mode of blockedModes) {
      const payload = {
        settings: {
          visibility: 'private',
          maxPlayers: 8,
          cyclesPerPlayer: 3,
          drawSeconds: 60,
          gameMode: mode,
          wordPack: 'everyday',
        },
      };

      const result = CreateRoomSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const hasModeError = result.error.issues.some(i =>
          i.message.includes('Only Classic, Drawing Telephone, and Party Mix') ||
          i.message.includes('Invalid drawSeconds')
        );
        expect(hasModeError).toBe(true);
      }
    }
  });

  it('preserves backward-compatible parsing for existing legacy sessions (S02)', () => {
    // Legacy room settings schema still parses legacy modes so existing records are not destroyed
    const legacySession = {
      visibility: 'private',
      maxPlayers: 8,
      cyclesPerPlayer: 3,
      drawSeconds: 30,
      gameMode: 'blitz',
      wordPack: 'everyday',
    };
    const parsed = RoomSettingsSchema.safeParse(legacySession);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.gameMode).toBe('blitz');
    }
  });
});

describe('P1: Math and Scoring Invariants (C06, P04)', () => {
  it('calculates normalized party points according to spec 05', () => {
    // 4 players (M = 4):
    // rank 1: round(100 * (4 - 1) / 3) = 100
    expect(calculateNormalizedPartyPoints(4, 1, 250)).toBe(100);

    // rank 2: round(100 * (4 - 2) / 3) = round(66.67) = 67
    expect(calculateNormalizedPartyPoints(4, 2, 180)).toBe(67);

    // rank 3: round(100 * (4 - 3) / 3) = round(33.33) = 33
    expect(calculateNormalizedPartyPoints(4, 3, 90)).toBe(33);

    // rank 4: round(100 * (4 - 4) / 3) = 0
    expect(calculateNormalizedPartyPoints(4, 4, 40)).toBe(0);

    // zero raw score gets zero normalized points, even on ties
    expect(calculateNormalizedPartyPoints(4, 1, 0)).toBe(0);
    expect(calculateNormalizedPartyPoints(4, 4, 0)).toBe(0);

    // M < 2 returns 0
    expect(calculateNormalizedPartyPoints(1, 1, 100)).toBe(0);
  });

  it('computes automatic hint schedules according to spec 03', () => {
    // "CAT" (3 letters, 60s):
    // N = 3, H = min(3, floor(3/2)) = 1
    // offsets: 60 * 1 / (1 + 1) = 30s (30000ms)
    const catHint = computeAutomaticHintSchedule('cat', 60000);
    expect(catHint.count).toBe(1);
    expect(catHint.offsetsMs).toEqual([30000]);

    // "TELEVISION" (10 letters, 60s):
    // N = 10, H = min(3, floor(10/2)) = 3
    // offsets: 15s, 30s, 45s (15000, 30000, 45000)
    const tvHint = computeAutomaticHintSchedule('television', 60000);
    expect(tvHint.count).toBe(3);
    expect(tvHint.offsetsMs).toEqual([15000, 30000, 45000]);

    // "A" (1 letter): 0 hints
    const singleLetter = computeAutomaticHintSchedule('a', 60000);
    expect(singleLetter.count).toBe(0);
    expect(singleLetter.offsetsMs).toEqual([]);

    // "ICE CREAM" (8 letters): 3 hints
    const iceCreamHint = computeAutomaticHintSchedule('ice cream', 60000);
    expect(iceCreamHint.count).toBe(3);
    expect(iceCreamHint.maskableIndices.length).toBe(8); // space is not maskable
  });
});
