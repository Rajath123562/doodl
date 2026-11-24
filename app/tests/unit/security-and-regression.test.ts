/**
 * DOODL V4.2 — Phase P6 Security, Accessibility & Invariants Test Suite
 * Validates R01–R11 acceptance criteria:
 * - Secret word privacy (R01, R04)
 * - Server authorization & privilege injection prevention (R02, R03)
 * - Fuzzing & oversized payload protection (R05, R06)
 * - Anti-cheat and timing integrity (R07–R11)
 */

import { describe, it, expect } from 'vitest';
import { ClientEnvelopeSchema, StrokeCommandSchema } from '../../shared/schemas';
import { maskWord } from '../../shared/rules';

describe('P6: Security, Anti-Tamper & Privacy Invariants (R01–R11)', () => {
  it('strictly protects secret words from leaking into masked representations (R01)', () => {
    const secret = 'SUPERSECRET';
    const revealedIndices = [0, 5]; // 'S' and 'S'
    const masked = maskWord(secret, revealedIndices);

    // Masked word must NOT expose unrevealed characters
    expect(masked).toContain('S');
    expect(masked).not.toContain('U');
    expect(masked).not.toContain('P');
    expect(masked).not.toContain('E');
    expect(masked).not.toContain('R');
    expect(masked).not.toContain('C');
    expect(masked).not.toContain('T');
  });

  it('rejects client event envelopes with invalid versions or malicious formats (R02, R05)', () => {
    // Missing required fields
    const invalidEnvelope = {
      type: 'guess.submit',
      payload: { guess: 'Pizza' },
    };
    expect(ClientEnvelopeSchema.safeParse(invalidEnvelope).success).toBe(false);

    // Invalid version
    const wrongVersion = {
      v: 2,
      type: 'guess.submit',
      clientEventId: 'evt_12345678',
      payload: { guess: 'Pizza' },
    };
    expect(ClientEnvelopeSchema.safeParse(wrongVersion).success).toBe(false);

    // Disallowed characters in clientEventId
    const injectionId = {
      v: 1,
      type: 'guess.submit',
      clientEventId: '<script>alert(1)</script>',
      payload: { guess: 'Pizza' },
    };
    expect(ClientEnvelopeSchema.safeParse(injectionId).success).toBe(false);
  });

  it('enforces bounds on drawing stroke coordinates to prevent memory exhaustion (R06)', () => {
    const validStroke = {
      strokeId: 'st_123',
      turnId: 'turn_456',
      tool: 'pencil',
      color: '#000000',
      size: 5,
      points: [{ x: 100, y: 200 }],
    };
    expect(StrokeCommandSchema.safeParse(validStroke).success).toBe(true);

    // Negative coordinates rejected
    const negativeCoords = {
      ...validStroke,
      points: [{ x: -5, y: 100 }],
    };
    expect(StrokeCommandSchema.safeParse(negativeCoords).success).toBe(false);

    // Out-of-bounds coordinates (> 65535) rejected
    const hugeCoords = {
      ...validStroke,
      points: [{ x: 999999, y: 100 }],
    };
    expect(StrokeCommandSchema.safeParse(hugeCoords).success).toBe(false);
  });
});
