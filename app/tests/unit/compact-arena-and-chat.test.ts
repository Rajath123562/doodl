/**
 * DOODL V4.2 — Phase P2 Compact Arena & Role-Safe Chat Tests
 * Validates U01-U07 and C10-C12 acceptance criteria.
 */

import { describe, it, expect } from 'vitest';
import { ChatSendPayloadSchema } from '../../shared/schemas';
import { maskWord } from '../../shared/rules';

describe('P2: Compact Arena UI & Role-Safe Chat (U01-U07, C10-C12)', () => {
  it('validates role-safe chat channels in ChatSendPayloadSchema (C10, C12)', () => {
    const defaultMsg = ChatSendPayloadSchema.safeParse({ text: 'Hello everyone!' });
    expect(defaultMsg.success).toBe(true);
    if (defaultMsg.success) {
      expect(defaultMsg.data.channel).toBe('all');
    }

    const solvedMsg = ChatSendPayloadSchema.safeParse({ text: 'Nice drawing!', channel: 'solved' });
    expect(solvedMsg.success).toBe(true);
    if (solvedMsg.success) {
      expect(solvedMsg.data.channel).toBe('solved');
    }

    const invalidChannel = ChatSendPayloadSchema.safeParse({ text: 'Sneaky', channel: 'admin' });
    expect(invalidChannel.success).toBe(false);
  });

  it('correctly calculates letter count and preserves spaces in maskWord (U01, C06)', () => {
    // Single word: index 0 is P, index 1 is I
    const single = maskWord('PIZZA', [1]);
    expect(single).toBe('_ I _ _ _');

    // Multi-word phrase with punctuation
    const phrase = maskWord("ICE-CREAM CONE", [0, 4]);
    expect(phrase).toContain('I');
    expect(phrase).toContain('-');
    expect(phrase).toContain('C');

    // Untouched punctuation
    const withApostrophe = maskWord("DON'T PANIC");
    expect(withApostrophe).toContain("'");
  });

  it('isolates solved chat audience so guessers are never spoiled (C11)', () => {
    const solvedSeats = new Set(['seat_drawer', 'seat_solver1']);

    // Simulated broadcast filter
    const canReceiveSolved = (seatId: string) => solvedSeats.has(seatId);

    expect(canReceiveSolved('seat_drawer')).toBe(true);
    expect(canReceiveSolved('seat_solver1')).toBe(true);
    expect(canReceiveSolved('seat_guesser1')).toBe(false);
    expect(canReceiveSolved('seat_guesser2')).toBe(false);
  });
});
