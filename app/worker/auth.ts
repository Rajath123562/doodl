/**
 * DOODL Cryptographic Authentication & Security Guards
 * Uses standard Web Crypto API (supported across Workers, Node 18+, browsers).
 */

const DEFAULT_SECRET = 'doodl_dev_secret_key_change_in_production_32bytes_min';

/**
 * Generates an opaque, cryptographically random ID.
 */
export function generateRandomId(prefix = 'id'): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${hex}`;
}

/**
 * Creates HMAC-SHA256 signature for data string.
 */
async function hmacSha256(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret || DEFAULT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(sig), b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Signs a guest session token: `${guestId}.${expiresAt}.${signature}`
 */
export async function signGuestToken(guestId: string, secret = DEFAULT_SECRET, ttlMs = 7 * 24 * 3600 * 1000): Promise<string> {
  const expiresAt = Date.now() + ttlMs;
  const payload = `${guestId}.${expiresAt}`;
  const sig = await hmacSha256(payload, secret);
  return `${payload}.${sig}`;
}

/**
 * Verifies and decodes a guest session token.
 */
export async function verifyGuestToken(token: string, secret = DEFAULT_SECRET): Promise<{ guestId: string; valid: boolean }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { guestId: '', valid: false };
    const [guestId, expiresAtStr, providedSig] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { guestId: '', valid: false };
    }
    const expectedSig = await hmacSha256(`${guestId}.${expiresAtStr}`, secret);
    if (expectedSig !== providedSig) {
      return { guestId: '', valid: false };
    }
    return { guestId, valid: true };
  } catch {
    return { guestId: '', valid: false };
  }
}

/**
 * Mints a short-lived (60 seconds) single-use WebSocket join grant.
 * Payload: `${grantId}.${guestId}.${roomCode}.${seatId}.${expiresAt}.${sig}`
 */
export async function mintJoinGrant(
  guestId: string,
  roomCode: string,
  seatId: string,
  secret = DEFAULT_SECRET,
  ttlMs = 60000
): Promise<string> {
  const grantId = generateRandomId('gnt');
  const expiresAt = Date.now() + ttlMs;
  const data = `${grantId}.${guestId}.${roomCode}.${seatId}.${expiresAt}`;
  const sig = await hmacSha256(data, secret);
  return `${data}.${sig}`;
}

/**
 * Verifies a WebSocket join grant against the target roomCode.
 */
export async function verifyJoinGrant(
  grant: string,
  roomCode: string,
  secret = DEFAULT_SECRET
): Promise<{ valid: boolean; guestId: string; seatId: string; grantId: string }> {
  try {
    const parts = grant.split('.');
    if (parts.length !== 6) return { valid: false, guestId: '', seatId: '', grantId: '' };
    const [grantId, guestId, targetRoomCode, seatId, expiresAtStr, providedSig] = parts;

    if (targetRoomCode.toUpperCase() !== roomCode.toUpperCase()) {
      return { valid: false, guestId: '', seatId: '', grantId: '' };
    }

    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false, guestId: '', seatId: '', grantId: '' };
    }

    const expectedData = `${grantId}.${guestId}.${targetRoomCode}.${seatId}.${expiresAtStr}`;
    const expectedSig = await hmacSha256(expectedData, secret);
    if (expectedSig !== providedSig) {
      return { valid: false, guestId: '', seatId: '', grantId: '' };
    }

    return { valid: true, guestId, seatId, grantId };
  } catch {
    return { valid: false, guestId: '', seatId: '', grantId: '' };
  }
}

/**
 * Validates and sanitizes a player nickname.
 * 2–20 graphemes, no control characters, safe text representation.
 */
export function sanitizeNickname(input: unknown): string {
  if (typeof input !== 'string') return 'Player';
  const trimmed = input.trim();
  const graphemes = Array.from(trimmed);
  if (graphemes.length < 2) return 'Player';
  return graphemes.slice(0, 20).join('').replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
}

/**
 * Sanitizes chat messages to prevent control codes and excessive length.
 */
export function sanitizeChatMessage(input: unknown): string {
  if (typeof input !== 'string') return '';
  const trimmed = input.trim();
  const graphemes = Array.from(trimmed);
  return graphemes.slice(0, 300).join('').replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
}
