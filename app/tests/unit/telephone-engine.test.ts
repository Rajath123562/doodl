/**
 * DOODL V4.2 — Phase P4 Drawing Telephone Engine Tests
 * Validates T01–T09 acceptance criteria.
 */

import { describe, it, expect } from 'vitest';
import { TelephoneEngine } from '../../worker/telephone-engine';
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

describe('P4: Drawing Telephone Engine (T01–T09)', () => {
  it('enforces minimum 4 players for telephone mode (T01)', () => {
    const engine = new TelephoneEngine('match_tel_1');
    const threeSeats = [
      createMockSeat('s1', 'Alice'),
      createMockSeat('s2', 'Bob'),
      createMockSeat('s3', 'Charlie'),
    ];

    expect(() => engine.initMatch(threeSeats)).toThrow(/at least 4 players/);
  });

  it('initializes N independent chains with length L = min(N, requestedLength) (T01, T02)', () => {
    const engine = new TelephoneEngine('match_tel_2');
    const fourSeats = [
      createMockSeat('s1', 'Alice'),
      createMockSeat('s2', 'Bob'),
      createMockSeat('s3', 'Charlie'),
      createMockSeat('s4', 'Dana'),
    ];

    const res = engine.initMatch(fourSeats, 4);
    expect(res.totalSteps).toBe(4);
    expect(engine.getAllChains().length).toBe(4);
  });

  it('correctly implements (c + s) % N permutation routing across all steps (T03)', () => {
    const engine = new TelephoneEngine('match_tel_3');
    const seats = [
      createMockSeat('s0', 'Alice'),
      createMockSeat('s1', 'Bob'),
      createMockSeat('s2', 'Charlie'),
      createMockSeat('s3', 'Dana'),
    ];
    const N = seats.length;
    engine.initMatch(seats, 4);

    // Step 0: prompt. Chain c assigned to (c + 0) % 4 = c
    const step0 = engine.startStep(0);
    expect(step0.stepType).toBe('prompt');
    for (let c = 0; c < N; c++) {
      const assignment = step0.assignments.get(seats[c].id);
      expect(assignment).toBeDefined();
      expect(assignment?.stepIndex).toBe(0);
      expect(assignment?.previousArtifact).toBeUndefined();
    }

    // Submit step 0 prompts
    engine.submitArtifact('s0', 0, 'A happy robot');
    engine.submitArtifact('s1', 0, 'A ninja cat');
    engine.submitArtifact('s2', 0, 'A giant mushroom');
    const submit0 = engine.submitArtifact('s3', 0, 'A spaceship landing');
    expect(submit0.allSubmitted).toBe(true);

    // Step 1: draw. Chain c assigned to (c + 1) % 4
    // Chain 0 ('A happy robot') -> assigned to seat (0 + 1) % 4 = seat 1 ('Bob')
    const step1 = engine.startStep(1);
    expect(step1.stepType).toBe('draw');
    const bobAssignment = step1.assignments.get('s1');
    expect(bobAssignment?.previousArtifact?.text).toBe('A happy robot');
    expect(bobAssignment?.previousArtifact?.stepType).toBe('prompt');

    // Chain 3 ('A spaceship landing') -> assigned to seat (3 + 1) % 4 = seat 0 ('Alice')
    const aliceAssignment = step1.assignments.get('s0');
    expect(aliceAssignment?.previousArtifact?.text).toBe('A spaceship landing');
  });

  it('auto-finalizes missing submissions on timeout with placeholder (T05)', () => {
    const engine = new TelephoneEngine('match_tel_4');
    const seats = [
      createMockSeat('s0', 'Alice'),
      createMockSeat('s1', 'Bob'),
      createMockSeat('s2', 'Charlie'),
      createMockSeat('s3', 'Dana'),
    ];
    engine.initMatch(seats, 4);
    engine.startStep(0);

    // Only Alice and Bob submit prompt
    engine.submitArtifact('s0', 0, 'Flying toaster');
    engine.submitArtifact('s1', 0, 'Dancing taco');

    // Timeout occurs -> auto finalize step 0
    engine.autoFinalizeStep(0);

    const chains = engine.getAllChains();
    // Chains 2 and 3 should have auto-finalized artifacts marked isMissing: true
    expect(chains[2].artifacts[0].isMissing).toBe(true);
    expect(chains[3].artifacts[0].isMissing).toBe(true);
    expect(chains[0].artifacts[0].isMissing).toBe(false);
  });
});
