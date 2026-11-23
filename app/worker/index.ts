/**
 * DOODL Cloudflare Worker Entrypoint & HTTP API Router
 */

import { RoomDO, Env } from './room-do';
import {
  generateRandomId,
  signGuestToken,
  verifyGuestToken,
  mintJoinGrant,
  verifyJoinGrant,
  sanitizeNickname,
} from './auth';
import { CreateRoomSchema } from '../shared/schemas';

export { RoomDO };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Guest-Token',
};

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...headers,
    },
  });
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      list[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
    }
  });
  return list;
}

async function getOrMintGuest(request: Request, env: Env): Promise<{ guestId: string; cookieToSet?: string }> {
  const secret = env.SECRET_KEY || 'doodl_dev_secret_key_change_in_production_32bytes_min';
  const cookies = parseCookies(request.headers.get('Cookie'));
  const authHeader = request.headers.get('Authorization') || request.headers.get('X-Guest-Token');

  let token = cookies['doodl_guest'];
  if (!token && authHeader) {
    token = authHeader.replace(/^Bearer\s+/i, '');
  }

  if (token) {
    const verified = await verifyGuestToken(token, secret);
    if (verified.valid) {
      return { guestId: verified.guestId };
    }
  }

  // Mint new guest
  const guestId = generateRandomId('guest');
  const newToken = await signGuestToken(guestId, secret);
  const cookieToSet = `doodl_guest=${encodeURIComponent(newToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`;
  return { guestId, cookieToSet };
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Health endpoint
    if (path === '/api/health') {
      return jsonResponse({
        status: 'ok',
        version: '3.0.0',
        timestamp: Date.now(),
        environment: 'production-ready',
      });
    }

    // 2. Guest Session endpoint
    if (path === '/api/guest' && request.method === 'POST') {
      try {
        await request.json();
      } catch {
        // empty body ok
      }

      const { guestId, cookieToSet } = await getOrMintGuest(request, env);
      const secret = env.SECRET_KEY || 'doodl_dev_secret_key_change_in_production_32bytes_min';
      const token = await signGuestToken(guestId, secret);

      const headers: Record<string, string> = {};
      if (cookieToSet) {
        headers['Set-Cookie'] = cookieToSet;
      }

      return jsonResponse({ guestId, token }, 200, headers);
    }

    // 3. Create Room endpoint
    if (path === '/api/rooms' && request.method === 'POST') {
      const { guestId, cookieToSet } = await getOrMintGuest(request, env);
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ code: 'INVALID_JSON', message: 'Malformed JSON payload.' }, 400);
      }

      const parsed = CreateRoomSchema.safeParse(body);
      if (!parsed.success) {
        return jsonResponse({ code: 'INVALID_SETTINGS', message: parsed.error.issues[0]?.message || 'Invalid settings.' }, 400);
      }

      const roomCode = generateRandomId('room').slice(5, 13).toUpperCase(); // 8 char unique code
      const doId = env.ROOM_DO.idFromName(roomCode);
      const roomStub = env.ROOM_DO.get(doId);

      // Initialize room in Durable Object
      const initResp = await roomStub.fetch('http://internal/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          settings: parsed.data.settings,
          hostGuestId: guestId,
          hostNickname: parsed.data.hostNickname || 'Host',
          avatarFace: parsed.data.avatarFace ?? 0,
          avatarColor: parsed.data.avatarColor || 'coral',
        }),
      });

      const initData = await initResp.json();
      const headers: Record<string, string> = {};
      if (cookieToSet) headers['Set-Cookie'] = cookieToSet;

      return jsonResponse({ roomCode, ...initData as object }, 201, headers);
    }

    // Match /api/rooms/:code endpoints
    const roomMatch = path.match(/^\/api\/rooms\/([A-Za-z0-9_-]+)(.*)$/);
    if (roomMatch) {
      const roomCode = roomMatch[1].toUpperCase();
      const subPath = roomMatch[2];
      const doId = env.ROOM_DO.idFromName(roomCode);
      const roomStub = env.ROOM_DO.get(doId);

      // GET /api/rooms/:code -> Room preview snapshot
      if (subPath === '' && request.method === 'GET') {
        const snapResp = await roomStub.fetch('http://internal/snapshot');
        if (snapResp.status !== 200) {
          return jsonResponse({ code: 'ROOM_NOT_FOUND', message: 'Room not found or expired.' }, 404);
        }
        const data = await snapResp.json();
        return jsonResponse(data);
      }

      // POST /api/rooms/:code/join -> Join room and reserve seat
      if (subPath === '/join' && request.method === 'POST') {
        const { guestId, cookieToSet } = await getOrMintGuest(request, env);
        let body: { nickname?: string; avatarFace?: number; avatarColor?: string; password?: string } = {};
        try {
          body = await request.json();
        } catch {
          // empty body ok
        }

        const nickname = sanitizeNickname(body.nickname || 'Guest');
        const joinResp = await roomStub.fetch('http://internal/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestId,
            nickname,
            avatarFace: body.avatarFace || 0,
            avatarColor: body.avatarColor || 'blue',
            password: body.password,
          }),
        });

        const joinData = await joinResp.json();
        const headers: Record<string, string> = {};
        if (cookieToSet) headers['Set-Cookie'] = cookieToSet;

        return jsonResponse(joinData, joinResp.status, headers);
      }

      // POST /api/rooms/:code/join-grant -> Mint one-time WS grant
      if (subPath === '/join-grant' && request.method === 'POST') {
        const { guestId } = await getOrMintGuest(request, env);
        let body: { seatId?: string } = {};
        try {
          body = await request.json();
        } catch {
          // ignore
        }

        if (!body.seatId) {
          return jsonResponse({ code: 'MISSING_SEAT_ID', message: 'seatId is required.' }, 400);
        }

        const secret = env.SECRET_KEY || 'doodl_dev_secret_key_change_in_production_32bytes_min';
        const grant = await mintJoinGrant(guestId, roomCode, body.seatId, secret);
        return jsonResponse({ grant, expiresAtMs: Date.now() + 60000 });
      }

      // GET /api/rooms/:code/socket -> Upgrade WebSocket
      if (subPath === '/socket') {
        const grant = url.searchParams.get('grant') || '';
        const secret = env.SECRET_KEY || 'doodl_dev_secret_key_change_in_production_32bytes_min';
        const verified = await verifyJoinGrant(grant, roomCode, secret);

        if (!verified.valid) {
          return new Response('Unauthorized: invalid or expired join grant', { status: 403 });
        }

        // Forward upgrade to Durable Object
        const doUrl = new URL(request.url);
        doUrl.pathname = '/socket';
        doUrl.searchParams.set('guestId', verified.guestId);
        doUrl.searchParams.set('seatId', verified.seatId);

        return roomStub.fetch(doUrl.toString(), request);
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
