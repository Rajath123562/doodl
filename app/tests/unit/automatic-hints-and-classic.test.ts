/**
 * DOODL V4.2 — Phase P3 Classic Gameplay & Automatic Timed Hints Tests
 * Validates C01–C09 acceptance criteria.
 */

import { describe, it, expect } from 'vitest';
import { computeAutomaticHintSchedule, calculateGuesserScore } from '../../shared/rules';

describe('P3: Classic Gameplay & Automatic Timed Hints (C01–C09)', () => {
  it('computes hint budget H = min(3, floor(N/2)) correctly for various word lengths (C05, C06)', () => {
    // 1 letter: N=1 -> H=0
    const one = computeAutomaticHintSchedule('A', 60000);
    expect(one.count).toBe(0);
    expect(one.offsetsMs).toEqual([]);

    // 2-3 letters: N=2,3 -> floor(N/2)=1 -> H=1
    const two = computeAutomaticHintSchedule('GO', 60000);
    expect(two.count).toBe(1);
    expect(two.offsetsMs).toEqual([30000]); // 60 * 1 / 2 = 30s

    const three = computeAutomaticHintSchedule('CAT', 60000);
    expect(three.count).toBe(1);
    expect(three.offsetsMs).toEqual([30000]);

    // 4-5 letters: N=4,5 -> floor(N/2)=2 -> H=2
    const four = computeAutomaticHintSchedule('DOOD', 60000);
    expect(four.count).toBe(2);
    expect(four.offsetsMs).toEqual([20000, 40000]); // 60*1/3=20s, 60*2/3=40s

    // 6+ letters: N>=6 -> H=3 (capped at 3)
    const six = computeAutomaticHintSchedule('BANANA', 60000);
    expect(six.count).toBe(3);
    expect(six.offsetsMs).toEqual([15000, 30000, 45000]); // 60*1/4=15s, 60*2/4=30s, 60*3/4=45s

    const ten = computeAutomaticHintSchedule('ELEPHANTINE', 60000);
    expect(ten.count).toBe(3);
  });

  it('excludes punctuation and hyphens from maskable count N (C06)', () => {
    // "ICE-CREAM" has 8 letters and 1 hyphen. N=8, floor(8/2)=4 -> capped at 3
    const hyphenWord = computeAutomaticHintSchedule('ICE-CREAM', 60000);
    expect(hyphenWord.count).toBe(3);
    // Hyphen at index 3 must NOT be in maskableIndices
    expect(hyphenWord.maskableIndices).not.toContain(3);
    expect(hyphenWord.maskableIndices.length).toBe(8);
  });

  it('guarantees zero hint penalty in V4.2 scoring (C03, C09)', () => {
    const durationMs = 60000;
    const deadlineAtMs = 100000;
    const nowMs = 70000; // 30s remaining -> remaining = 0.5
    const correctRank = 0; // 1st correct

    // In V4.2, guessers receive 0 penalty regardless of revealed hints
    const scoreWithoutHints = calculateGuesserScore(nowMs, deadlineAtMs, durationMs, correctRank, 0);
    expect(scoreWithoutHints.hintPenalty).toBe(0);
    expect(scoreWithoutHints.points).toBe(350); // 100 + 200 + 50
  });
});
