# Technical architecture and reliability contract

## Chosen topology

```text
Browser (React/Vite, canvas + WS client)
  ├── GET / and SPA assets ──────────> Workers static assets
  ├── POST /api/rooms ───────────────> Cloudflare Worker API
  ├── POST /api/rooms/:code/join ────> Worker → per-room Durable Object
  ├── GET /api/rooms/:code ──────────> Worker → per-room Durable Object (redacted)
  └── WSS /api/rooms/:code/socket ───────> Worker → per-room Durable Object
                                        ├── session and role validation
                                        ├── room state machine
                                        ├── game loop / deadlines
                                        ├── stroke sequence & snapshots
                                        ├── server scoring and guessing
                                        └── bounded durable state / alarms
  Optional P1 cross-room profile & public directory → D1, purpose-limited schema
```

**Why:** a Durable Object is a single coordination point for a named room and can accept WebSockets; SQLite-backed DOs are eligible for Workers Free subject to quota. Use the Hibernation API and **do not rely on JS `setInterval` continuing while a DO hibernates**. Server-authoritative timestamps plus alarms and event-triggered deadline checks govern transitions.

## Proposed repository layout (Antigravity creates code)

```text
app/
  src/
    pages/{Home,Room,Lobby,Game,MatchResults,Daily,Gallery,Profile}.tsx
    components/{GameHUD,PlayerSidebar,GuessChat,DrawingToolbar,Avatar,ConnectionBanner}/
    drawing/{CanvasSurface,renderer,normalize,commands,replay,tools}.ts(x)
    networking/{ws-client,room-api,reconnect,protocol}.ts
    state/{session-store,game-view}.ts
    styles/{tokens,globals}.css
    test/
  worker/
    index.ts            # routes, auth, throttles, asset forwarding
    room-object.ts      # room Durable Object, game state actor
    auth.ts
    storage.ts
    word-packs.ts
  shared/
    protocol.ts
    game-types.ts
    schemas.ts
    rules.ts
  tests/
    game-engine/
    protocol/
    worker/
    e2e/
  wrangler.jsonc
  vite.config.ts
  package.json
  .env.example
```

Antigravity may adapt module names, but must preserve separation of renderer, protocol, authoritative engine and page UI.

## Data and trust boundaries

- **Web browser is untrusted.** Every incoming event must have a bounded byte size, validated schema, authenticated room seat, valid sender role, rate allowance and valid state transition.
- Guest identity is server-generated, random and bound to signed or opaque session capability. Nickname/avatar are display preferences, not authority.
- Room join capabilities use high-entropy, unpredictable codes; `roomCode` alone is not sufficient to impersonate an existing player. For private links, possession grants invite access only, not game admin rights.
- Host actions require an authoritative seat role and server-side recheck, and are logged without PII.
- Room DO state contains only what that room needs; build separate `serverSnapshot` and `clientView`, with `clientViewForPlayer` redaction before serialization.
- Drawer sees selected secret word and tools; guessers see only masked pattern, non-secret hints and shared strokes; spectator sees no secret word before reveal.
- Storage records persistent room phase, room expiry, start/deadline timestamp, scores, membership recovery metadata and bounded stroke log/checkpoint; ephemeral UI states are in memory or reconstructable.

## Persistence / hibernation rules

- Hibernation may reconstruct the object's JS instance; rehydrate from SQLite/attachments on wake.
- Use server wall-clock deadlines (`deadlineAt`) and idempotent transitions keyed by `roundId`/`turnId`/`phaseVersion`, never increment timer by client messages.
- Use DO alarms for needed round transitions (verify API restrictions); on wake/get, process all expired deadlines safely before answering.
- Keep an authoritative monotonic `stateVersion` and per-canvas `revision` for snapshots, event ordering and reconnects.
- Reconnect by resume capability + last accepted event revision. Server decides whether to delta replay or deliver a full redacted room snapshot and canvas checkpoint.
- Storage includes TTL/cleanup strategy: idle private lobbies expire after a configured period, finished rooms after retention window, and delete stale rooms/canvas logs; don't retain arbitrary chat forever.
- Avoid persisting raw unbounded pointer-move events per draw; compact to bounded strokes and periodic checkpoints.

## WebSocket lifecycle

1. Client gets/refreshes guest session from API with appropriate secure cookie/token design.
2. Client calls `join`, obtaining a seat credential bound to room and guest session; transport uses secure `wss://` in production.
3. Client upgrades WebSocket. Worker routes into the room object; DO validates credentials **before accepting/authorizing messages**.
4. Server sends `room.snapshot` with role-specific redaction, current authoritative phase and versions; client acknowledges.
5. Client sends event intents with IDs, sequence/revision hints and no trusted scores/roles/words.
6. Server validates and broadcasts authoritative events, each with room version/turn ID and ordering.
7. Connection drops: seat remains reserved for bounded grace period; UI shows reconnect; resume token restores same seat if valid. Stale/double connections are invalidated or explicitly handled.
8. Room expires: sockets get clear structured closing notice; server cleans stored state per retention policy.

## Room discovery vs private room semantics

Private rooms are never returned in public matchmaking. Public directory can be small and optionally backed by D1 but needs reliable stale-room cleanup and per-room seat validation. **Don't use an eventually-consistent directory as the authority for actual seat counts.** The DO remains the source of truth.

## Resilience cases

- Host departure: transfer to longest-present eligible player; if none, expire room. Host transfer must never transfer the secret word or old permissions to a guesser.
- Drawer disconnect: apply a clear grace period; if not back, end/skip turn without awarding a false guess score. Avoid infinite paused sessions.
- Last guesser leaves: pause or gracefully end after a short bounded grace period per rules, preserving result integrity.
- Duplicate browser tabs: existing seat wins or newer authenticated resume wins, with explicit old-socket revocation; never create duplicate seats for same player unless intentionally joining as another guest.
- DoS and flood: bounded message size and per-event rate limits; free quotas and traffic controls; graceful 429/close.

## Free plan constraints

Do not claim 'unlimited free'. Cloudflare Workers/Durable Objects Free limits include request and storage caps which evolve. Verify pricing/quotas at deployment. High-frequency strokes can exhaust quotas; use batching/quantization and measure actual per-match event rates. Offer an honest limitation/upgrade plan when traffic grows.

## Official current docs (links for Antigravity to verify)

- https://developers.cloudflare.com/durable-objects/
- https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/platform/limits/
- https://developers.cloudflare.com/workers/vite-plugin/
- https://developers.cloudflare.com/workers/static-assets/
