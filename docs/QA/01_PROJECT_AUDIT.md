# DOODL V3 — Phase 0: Baseline Project Discovery & Technical Audit

**Audit Date:** 2026-11-23  
**Auditor:** Principal Enterprise Architect & Senior QA Lead  
**Baseline Git Commit:** `f330a0c`  
**Target Repository:** `c:\Users\RAJATH U\Downloads\doodl\`  

---

## 1. Actual Project Architecture

The application is structured as a modern full-stack real-time web application located entirely under `app/`:

```
app/
├── src/                          # Frontend Application (React 18 + Vite + Tailwind CSS)
│   ├── components/               # UI Components (Avatar, DrawingToolbar, GameHUD, GuessChat,
│   │                             # HostSettingsModal, MatchResultsModal, PlayerSidebar,
│   │                             # WordChoiceOverlay, PlayWithFriendsModal)
│   ├── drawing/                  # Canvas Engine & Tools (renderer.ts, tools.ts)
│   ├── networking/               # API & WebSocket client (api.ts, ws.ts)
│   ├── pages/                    # Views (Home, Lobby, Game, Daily, Gallery, Profile, Rules)
│   └── styles/                   # Design Tokens & Global CSS (tokens.css, globals.css)
├── shared/                       # Isomorphic Types & Rules
│   ├── game-types.ts             # Strict domain models, states, modes, word packs
│   ├── protocol.ts               # ClientIntent & ServerEvent WebSocket wire protocols
│   ├── schemas.ts                # Zod validation schemas for all inputs
│   └── rules.ts                  # Pure scoring algorithms, text normalization, Levenshtein
├── worker/                       # Backend Cloudflare Worker & Durable Objects
│   ├── index.ts                  # REST API Router, session cookie issuer, WS upgrade handler
│   ├── room-do.ts                # SQLite-backed Durable Object state machine & alarm engine
│   ├── word-engine.ts            # Word selection engine (>300 words across 8 packs + custom)
│   └── auth.ts                   # HMAC-SHA256 guest token minting & 60-second join grants
└── tests/                        # Automated Test Suites
    ├── unit/                     # Pure business logic unit tests
    ├── worker/                   # Durable Object lifecycle & game mechanics integration tests
    └── e2e/                      # Playwright multi-browser live network tests
```

---

## 2. Feature Implementation Status

### 2.1 Core Multiplayer Subsystems (VERIFIED)
- **Zero Simulation Multiplayer:** Real WebSockets with Hibernation API (`state.acceptWebSocket()`, attachment serialization, DO alarms for deterministic timer management). Zero bot simulations or hardcoded fake players in production paths.
- **Server Authority:** Player seat assignment, host designation, drawer rotation, word selection, score tallying, round progression, and room timeouts are exclusively server-authoritative.
- **Secret Word Secrecy:** Secret word candidates and revealed word are transmitted *only* to the active drawer. Guessers receive masked strings (`_ _ _ _`) until end-of-turn reveal.
- **Drawing Canvas Vector Sync:** 16-bit integer normalized coordinate space (`0..65535`) guarantees resolution-independent vector rendering across desktop, tablet, and mobile displays. Tools include pencil, eraser, rainbow brush, straight lines, stickers/stamps, undo/redo stacks, and canvas clearing.
- **Guest Identity & Authorization:** Cryptographic HMAC-SHA256 signed guest cookies (`doodl_guest`) and single-use 60-second join grants (`joinGrant`) prevent session hijacking, duplicate seat usurpation, and unauthorized drawing.

### 2.2 Gameplay Modes (VERIFIED)
- **Classic Mode:** Standard 90s turns with multi-cycle rotation and progressive hints.
- **Blitz Mode:** 30s rapid-fire drawing and speed guessing.
- **Drawing Duels:** Two concurrent drawers drawing simultaneously on split vector canvases.
- **Chaos Mode:** Dynamic server modifiers (`inverted_coords`, `mirror_x`, `time_rush`, `palette_limit`, `thick_brush`).
- **Team Battles:** Automatic balanced team division (Team Alpha vs Team Beta) with aggregated scoring.
- **Daily Doodle:** Daily seeded solo challenge with 60s timer, local streak tracking, and PNG export.

### 2.3 UI/UX & Player Features (VERIFIED)
- **Avatar Studio:** 6 hairstyles, 6 color palettes, animated SVG generation.
- **Player Progression & Profile:** Local XP accumulation, level progression, badges/streaks.
- **Art Gallery:** Local canvas gallery storage, full stroke replay player, PNG export.
- **Play with Friends Modal:** One-click launcher from navbar with private party creation and room code entry.

---

## 3. Discrepancies Between Documentation & Implementation

| Topic | Specification / Reference Mention | Actual Implementation Status | Justification / ADR |
|---|---|---|---|
| **Global Ranked Leaderboard** | Mentioned in early design notes | Intentionally excluded from V3 release scope | **ADR-0005:** To prevent fake mock data; Doodl uses server-verified room leaderboards and local XP progression. |
| **Global Persistent Accounts (OAuth/Email)** | Optional future tier | Guest HMAC tokens with local profile persistence | Privacy-first social gaming model; zero forced email collection or third-party tracking. |

---

## 4. Current Automated Test Catalog

| Suite | Category | Files | Test Count | Pass Count |
|---|---|---|---|---|
| **Vitest Unit** | Pure logic | `scoring.test.ts`, `auth-and-words.test.ts` | 19 | 19 |
| **Vitest Integration** | Durable Object & Worker | `room-lifecycle.test.ts`, `game-mechanics.test.ts`, `advanced-modes-and-recovery.test.ts` | 16 | 16 |
| **Playwright E2E** | Multi-browser & Network | `multiplayer-game.spec.ts`, `negative-and-edge-cases.spec.ts` | 6 | 6 |
| **Total Baseline** | | | **41** | **41 (100%)** |

---

## 5. Security & Risk Audit

1. **Information Leakage:** Verified via automated tests that candidate and secret words are filtered at the WebSocket frame serialization boundary.
2. **Cheating & Privilege Escalation:** All incoming client WebSocket envelopes are parsed and validated through Zod schemas; privileged actions (`room.start`, `room.kick`, `room.setSettings`) verify caller `seatId === hostSeatId`.
3. **Transport Security:** Production deployment uses HTTPS and WSS with TLS 1.3 encryption on Cloudflare Edge.
