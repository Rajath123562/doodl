import { describe, it, expect } from 'vitest';
import {
  generateRandomId,
  signGuestToken,
  verifyGuestToken,
  mintJoinGrant,
  verifyJoinGrant,
  sanitizeNickname,
  sanitizeChatMessage,
} from '../../worker/auth';
import {
  selectCandidateWords,
  checkGuess,
  getHintIndices,
  WORD_BANKS,
} from '../../worker/word-engine';

describe('Authentication & Token Security (P0-016)', () => {
  it('generates random ids with prefixes', () => {
    const id = generateRandomId('test');
    expect(id.startsWith('test_')).toBe(true);
    expect(id.length).toBeGreaterThan(20);
  });

  it('signs and verifies a valid guest session token', async () => {
    const guestId = 'guest_12345';
    const token = await signGuestToken(guestId);
    const result = await verifyGuestToken(token);

    expect(result.valid).toBe(true);
    expect(result.guestId).toBe(guestId);
  });

  it('rejects tampered or malformed guest tokens', async () => {
    const token = await signGuestToken('guest_valid');
    const tampered = token.slice(0, -4) + 'abcd';
    const result = await verifyGuestToken(tampered);

    expect(result.valid).toBe(false);
    expect((await verifyGuestToken('invalid.token')).valid).toBe(false);
  });

  it('mints and verifies single-use WebSocket join grants with strict room binding', async () => {
    const guestId = 'guest_abc';
    const roomCode = 'INK-7KQ4';
    const seatId = 'seat_1';

    const grant = await mintJoinGrant(guestId, roomCode, seatId);
    const verified = await verifyJoinGrant(grant, roomCode);

    expect(verified.valid).toBe(true);
    expect(verified.guestId).toBe(guestId);
    expect(verified.seatId).toBe(seatId);

    // Rejects grant presented to the wrong room
    const wrongRoom = await verifyJoinGrant(grant, 'WRONG-ROOM');
    expect(wrongRoom.valid).toBe(false);
  });

  it('sanitizes nicknames safely and enforces bounds (P0-001)', () => {
    expect(sanitizeNickname('   ')).toBe('Player');
    expect(sanitizeNickname('A')).toBe('Player'); // under 2 graphemes
    expect(sanitizeNickname('  CoolArtist  ')).toBe('CoolArtist');
    expect(sanitizeNickname('ThisIsAVeryLongNicknameThatExceedsTwentyChars')).toHaveLength(20);
    expect(sanitizeNickname('Evil\u0000Nick\u001Fname')).toBe('EvilNickname');
  });

  it('sanitizes chat messages and enforces maximum length', () => {
    expect(sanitizeChatMessage('  Hello world!  ')).toBe('Hello world!');
    const longMsg = 'a'.repeat(400);
    expect(sanitizeChatMessage(longMsg)).toHaveLength(300);
  });
});

describe('Word Engine & Candidate Selection (P0-008, P1-002)', () => {
  it('selects 3 distinct candidate words from the requested category', () => {
    const candidates = selectCandidateWords('animals', 3);
    expect(candidates).toHaveLength(3);
    const words = candidates.map(c => c.word);
    const unique = new Set(words);
    expect(unique.size).toBe(3);

    for (const w of words) {
      expect(WORD_BANKS.animals).toContain(w);
    }
  });

  it('supports custom words when custom pack is requested', () => {
    const custom = ['Quantum', 'Tachyon', 'Singularity'];
    const candidates = selectCandidateWords('custom', 3, custom);
    expect(candidates).toHaveLength(3);
    for (const c of candidates) {
      expect(custom).toContain(c.word);
    }
  });

  it('evaluates guesses with correct, close, and wrong classifications (P0-012)', () => {
    expect(checkGuess('Sunflower', 'sunflower')).toBe('CORRECT');
    expect(checkGuess('Sunflower', 'sunflowe')).toBe('CLOSE');
    expect(checkGuess('Sunflower', 'pineapple')).toBe('WRONG');
  });

  it('generates hint indices deterministically (P0-014)', () => {
    expect(getHintIndices('Cat', 1)).toHaveLength(1);
    expect(getHintIndices('Pineapple', 1)).toHaveLength(1);
    expect(getHintIndices('Pineapple', 2)).toHaveLength(2);
  });
});
