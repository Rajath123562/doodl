# DOODL V3 — Automated Test & QA Evidence Report

**Date**: 2026-11-23  
**QA Lead**: Antigravity Strict QA Specialist  
**Execution Environment**: Node.js v24.18.0, npm 11.16.0, Playwright 1.65.1 (Chromium 159.0.8154.6), Windows 11  
**Total Test Suites**: 7 test files  
**Total Executed Tests**: **40 tests**  
**Passed**: **40** | **Failed**: **0** | **Skipped**: **0** | **Pass Rate**: **100%**

---

## 1. Test Suite Catalog & Breakdown

### 1.1 Unit Test Suites (19 Tests)
- **`tests/unit/scoring.test.ts` (9 tests)**
  - Calculates guesser score at 90s, 45s, and 0s remaining with deterministic formulas.
  - Verifies first-place, second-place, and tenth-place speed bonus reductions.
  - Verifies hint penalty calculations (60 points per hint used).
  - Enforces minimum score floor of 40 points.
  - Calculates drawer rewards based on count of unique correct guessers.
  - Enforces drawer reward cap of 300 points.
  - Deterministic tie-breaking rules based on first-correct counts and join order.
- **`tests/unit/auth-and-words.test.ts` (10 tests)**
  - Nickname validation enforcing 2–20 graphemes, trimming, and rejection of whitespace-only strings.
  - Safe Unicode normalization (NFKC) preserving accents and emojis while stripping control characters.
  - Chat message sanitization and HTML angle-bracket escaping (anti-XSS).
  - HMAC-SHA256 guest token signing and cryptographic verification.
  - Join grant generation and 60-second expiration checks.
  - Curated word packs (>300 entries) coverage across 8 distinct categories.
  - Candidate word selection ensuring 3 distinct words per drawer turn.
  - Secret word masking algorithms (`maskWord`) accurately masking graphemes and revealing hints.
  - Exact guess checking (`CORRECT`, `CLOSE` for 1 edit distance, `WRONG`).

### 1.2 Worker & SQLite Durable Object Integration Tests (16 Tests)
- **`tests/worker/room-lifecycle.test.ts` (6 tests)**
  - `GET /api/health` returns status 200, version 3.0.0, and `production-ready` environment.
  - `POST /api/guest` mints guest ID and signed authentication token.
  - Authoritative room initialization with host seat, room code, and custom settings.
  - Rejection of joins with invalid password returning 403 `WRONG_PASSWORD`.
  - Enforcement of room capacity limits returning 409 `ROOM_FULL`.
  - Absolute secrecy of word candidates and secret word in guesser snapshots.
- **`tests/worker/game-mechanics.test.ts` (3 tests)**
  - Enforces host-only permissions for starting games and settings changes (`FORBIDDEN`).
  - Full turn lifecycle: match start -> word choices -> drawing strokes -> guess feedback -> scoring.
  - Host moderation enforcement: kicking seats and muting seats with real-time events.
- **`tests/worker/advanced-modes-and-recovery.test.ts` (7 tests)**
  - Duplicate tab policy: session epoch increment, old socket eviction with code 1008, stale epoch rejection.
  - Drawer dropout mid-turn: triggers graceful `turn.reveal` with `DRAWER_DISCONNECT` without stalling match.
  - Timed hint reveals: half-time alarm triggers server hint and broadcasts `round.hintRevealed`.
  - Blitz mode with 30-second countdown preset and exact accounting.
  - Chaos mode: random server-seeded modifiers (`mirror_x`, `inverted_coords`, `palette_limit`, `time_rush`, `thick_brush`).
  - Team battles: automated roster balance across teams A and B with manual reassignment support.
  - Drawing duels: two concurrent drawers designated in `currentDrawerIds`.

### 1.3 Playwright Multi-Device E2E Tests (5 Tests)
- **`tests/e2e/multiplayer-game.spec.ts` (1 test)**
  - Two independent browser contexts (Desktop Host `1280x800` + Mobile Guest `390x844`).
  - Host creates room; Guest joins via room code.
  - Both sessions verify real connected roster without generated fake players.
  - Host starts match; receives 3 candidate words; Guest sees none.
  - Host draws vector strokes on canvas; strokes synchronize in real time to Guest.
  - Guest submits incorrect guess (broadcast publicly), then submits correct secret word.
  - Both players receive points, HUD updates, and public announcement is displayed without plaintext word leak.
- **`tests/e2e/negative-and-edge-cases.spec.ts` (4 tests)**
  - Keyboard submission: Enter key submission on nickname input with whitespace trimming.
  - Mobile responsiveness: 375px (iPhone SE) and 768px (iPad) viewports verify zero horizontal overflow (`scrollWidth <= clientWidth`).
  - Password protection: wrong password rejected with 403; correct password joins successfully.
  - Capacity enforcement: 3rd player joining a 2-player capped room is rejected with 409 `ROOM_FULL`.

---

## 2. Evidence Artifacts

- Playwright test runner summary: `5 passed (6.5s)`
- Vitest test runner summary: `35 passed (1.2s)`
- TypeScript strict typecheck: `tsc --noEmit` exited with code 0.
- Vite production build: `vite build` exited with code 0.
