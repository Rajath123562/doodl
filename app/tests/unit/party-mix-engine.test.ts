/**
 * DOODL V4.2 — Phase P5 Party Mix Multi-Stage Engine Tests
 * Validates P01–P08 acceptance criteria.
 */

import { describe, it, expect } from 'vitest';
import { PartyMixEngine } from '../../worker/party-engine';
import type { PublicSeat } from '../../shared/game-types';

function createMockSeat(id: string, nickname: string): PublicSeat {
  return {
    id,
    nickname,
    avatarFace: 0,
    avatarColor: 'coral',
    connected: true,
    score: 0,
    guessedThisTurn: false,
    role: 'player',
    joinedAt: Date.now(),
  };
}

describe('P5: Party Mix Multi-Stage Engine (P01–P08)', () => {
  it('enforces minimum 4 players for Party Mix (P01)', () => {
    const engine = new PartyMixEngine('match_party_1');
    const threeSeats = [
      createMockSeat('s1', 'Alice'),
      createMockSeat('s2', 'Bob'),
      createMockSeat('s3', 'Charlie'),
    ];
    expect(() => engine.initMatch(threeSeats)).toThrow(/at least 4 players/);
  });

  it('cycles through exact 4-stage sequence: Classic -> Blitz -> Chaos -> Telephone (P02)', () => {
    const engine = new PartyMixEngine('match_party_2', 'standard');
    const seats = [
      createMockSeat('s1', 'Alice'),
      createMockSeat('s2', 'Bob'),
      createMockSeat('s3', 'Charlie'),
      createMockSeat('s4', 'Dana'),
    ];
    engine.initMatch(seats);

    // Stage 0: Classic
    const s0 = engine.getCurrentStageConfig();
    expect(s0.stageId).toBe('classic');
    expect(s0.drawSeconds).toBe(45);
    engine.advanceStage();

    // Stage 1: Blitz
    const s1 = engine.getCurrentStageConfig();
    expect(s1.stageId).toBe('blitz');
    expect(s1.drawSeconds).toBe(30);
    engine.advanceStage();

    // Stage 2: Chaos
    const s2 = engine.getCurrentStageConfig();
    expect(s2.stageId).toBe('chaos');
    expect(s2.drawSeconds).toBe(40);
    expect(s2.chaosModifier).toBeDefined();
    expect(['monochrome', 'three_color', 'no_eraser', 'giant_brush']).toContain(s2.chaosModifier);
    engine.advanceStage();

    // Stage 3: Telephone
    const s3 = engine.getCurrentStageConfig();
    expect(s3.stageId).toBe('telephone');
  });

  it('honors short preset durations (30s / 20s / 25s) (P02, P03)', () => {
    const engine = new PartyMixEngine('match_party_short', 'short');
    const seats = [
      createMockSeat('s1', 'Alice'),
      createMockSeat('s2', 'Bob'),
      createMockSeat('s3', 'Charlie'),
      createMockSeat('s4', 'Dana'),
    ];
    engine.initMatch(seats);

    expect(engine.getCurrentStageConfig().drawSeconds).toBe(30); // Classic short
    engine.advanceStage();
    expect(engine.getCurrentStageConfig().drawSeconds).toBe(20); // Blitz short
    engine.advanceStage();
    expect(engine.getCurrentStageConfig().drawSeconds).toBe(25); // Chaos short
  });

  it('calculates unified normalized rank scoring with max 100 per competitive stage and max 300 total (P04, P05)', () => {
    const engine = new PartyMixEngine('match_party_scoring', 'standard');
    const seats = [
      createMockSeat('s1', 'Alice'),
      createMockSeat('s2', 'Bob'),
      createMockSeat('s3', 'Charlie'),
      createMockSeat('s4', 'Dana'),
    ];
    engine.initMatch(seats);

    // Stage 0 (Classic):
    // Alice = 500 (rank 1), Bob = 300 (rank 2), Charlie = 100 (rank 3), Dana = 0 (rank 4)
    engine.recordRawScore('s1', 500);
    engine.recordRawScore('s2', 300);
    engine.recordRawScore('s3', 100);
    engine.recordRawScore('s4', 0);

    const res0 = engine.completeCurrentStage();
    // 4 players (M=4):
    // Rank 1: round(100 * (4 - 1) / 3) = 100
    // Rank 2: round(100 * (4 - 2) / 3) = 67
    // Rank 3: round(100 * (4 - 3) / 3) = 33
    // Rank 4: zero raw score -> 0
    expect(res0.rankings.find((r) => r.seatId === 's1')?.normalizedPoints).toBe(100);
    expect(res0.rankings.find((r) => r.seatId === 's2')?.normalizedPoints).toBe(67);
    expect(res0.rankings.find((r) => r.seatId === 's3')?.normalizedPoints).toBe(33);
    expect(res0.rankings.find((r) => r.seatId === 's4')?.normalizedPoints).toBe(0);

    expect(engine.getCumulativePoints('s1')).toBe(100);
    expect(engine.getCumulativePoints('s2')).toBe(67);

    // Advance to Blitz (Stage 1)
    engine.advanceStage();
    // Alice wins again with 400 pts
    engine.recordRawScore('s1', 400);
    engine.completeCurrentStage();
    expect(engine.getCumulativePoints('s1')).toBe(200);

    // Advance to Chaos (Stage 2)
    engine.advanceStage();
    engine.recordRawScore('s1', 400);
    engine.completeCurrentStage();
    expect(engine.getCumulativePoints('s1')).toBe(300); // 300 max!

    // Advance to Telephone (Stage 3)
    engine.advanceStage();
    const res3 = engine.completeCurrentStage();
    // Telephone awards 0 party points
    for (const r of res3.rankings) {
      expect(r.normalizedPoints).toBe(0);
    }
    expect(engine.getCumulativePoints('s1')).toBe(300); // still 300 max
  });
});
