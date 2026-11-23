# DOODL. V3 — Production Multiplayer Drawing Game

DOODL is an original, production-candidate, browser-based multiplayer drawing-and-guessing party game built with strict server-authoritative architecture on Cloudflare Workers and Durable Objects.

## Architecture Highlights

- **Frontend**: Strict TypeScript, React 19, Tailwind CSS, Motion (conservative micro-animations), HTML5 Canvas with native Pointer Events, responsive DPR scaling, normalized integer coordinates (0..65535).
- **Backend**: Cloudflare Workers API + per-room SQLite-backed Durable Object actors.
- **Networking**: Real-time WebSockets with WebSocket Hibernation API (`serializeAttachment`/`deserializeAttachment`), monotonic sequence numbering (`seq`), state versioning (`stateVersion`), and room alarm-driven deadlines.
- **Game Engine**: Completely server-authoritative state machine, word selection secrecy (guesser frames never contain candidate or selected words), deterministic score formulas, room lifecycle management, and reconnect recovery.
- **Modes Supported**: Classic (P0), Blitz (P1), Drawing Duels (P2), Chaos Mode (P2), Team Battles (P2), and Daily Doodle solo challenge (P1).

## Repository Structure

```text
app/
  src/                  # React client application (pages, components, canvas engine, networking)
    pages/              # Route views: Home, Lobby, Game, Results, Daily, Gallery, Profile, Rules
    components/         # Reusable UI tokens: GameHUD, PlayerSidebar, GuessChat, DrawingToolbar, Avatar
    drawing/            # Canvas renderer, normalization, command log, tools, replay
    networking/         # WebSocket client, API client, reconnection manager, protocol parser
    state/              # Client session, game view state machine, local store
    styles/             # Design tokens, typography, CSS variables
  worker/               # Cloudflare Workers API & Durable Object
    index.ts            # HTTP router, guest session minting, room creation & routing, health checks
    room-do.ts          # SQLite-backed Room Durable Object, game loops, alarms, WS hibernation
    auth.ts             # Guest token signing, join grant verification, role guards
    scoring.ts          # Deterministic score calculator, speed bonus, hint penalties
    word-engine.ts      # Curated word banks, candidate selector, normalization, guess matcher
    storage.ts          # Durable Object SQLite schema, snapshot serializer, stroke compaction
  shared/               # Universal typed contracts and schemas
    protocol.ts         # WebSocket v1 intent/event types and payload definitions
    schemas.ts          # Zod validation schemas for every client intent and room setting
    game-types.ts       # Shared domain models (phases, roles, tools, modes, scores)
    rules.ts            # Pure game constants and validation helpers
  tests/                # Comprehensive automated verification suite
    unit/               # Vitest pure logic tests (scoring, word normalization, state transitions)
    worker/             # Cloudflare Worker & Durable Object integration tests
    e2e/                # Playwright 2-browser multi-context multiplayer tests
  docs/                 # Architecture, decisions, traceability, and operations
    REQUIREMENT_TRACEABILITY.md
    DECISION_LOG.md
    ARCHITECTURE_DECISIONS.md
    DEPLOYMENT_PLAN.md
    BUG_LEDGER.md
  wrangler.jsonc        # Cloudflare Workers & Durable Objects configuration
  package.json          # Pinned dependencies & scripts
  tsconfig.json         # Strict TypeScript compiler configuration
  vite.config.ts        # Vite build & development configuration
```

## Available Scripts

- `npm run dev`: Starts local development environment (Vite frontend with Worker API & WebSocket proxy).
- `npm run build`: Typechecks and bundles frontend and worker code for production.
- `npm run lint`: Runs ESLint across all TypeScript source files.
- `npm run typecheck`: Runs `tsc --noEmit` to verify type safety across client, worker, and shared modules.
- `npm run test`: Runs unit tests with Vitest.
- `npm run test:integration`: Runs Cloudflare Worker and Durable Object integration tests.
- `npm run test:e2e`: Runs multi-context Playwright tests across independent browser sessions.

## Traceability & Status

See:
- [IMPLEMENTATION_STATUS.md](file:///c:/Users/RAJATH%20U/Downloads/doodl/app/IMPLEMENTATION_STATUS.md)
- [docs/REQUIREMENT_TRACEABILITY.md](file:///c:/Users/RAJATH%20U/Downloads/doodl/app/docs/REQUIREMENT_TRACEABILITY.md)
- [docs/DECISION_LOG.md](file:///c:/Users/RAJATH%20U/Downloads/doodl/app/docs/DECISION_LOG.md)
