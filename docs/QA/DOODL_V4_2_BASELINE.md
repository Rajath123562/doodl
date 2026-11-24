# DOODL V4.2 — Baseline Technical Audit (Phase P0)

**Date:** 2026-11-24  
**Audit Author:** Antigravity Engineering Lead  
**Commit Baseline:** `facb3dc` (clean working tree)  
**Package Integrity:** Handoff package verified via `py -3 tools/verify.py` (`PASS: 21 file checksums and inventory verified`).

---

## 1. Repository & Stack Inventory

| Component | Technology | Version | Location / Config |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React + Vite | React 18.3.1, Vite 5.4.10 | `app/` |
| **Language** | TypeScript (Strict) | 5.5.4 | `app/tsconfig.json` |
| **Styling** | Tailwind CSS + Custom CSS Variables | 3.4.14 | `app/src/styles/` |
| **Edge Compute** | Cloudflare Workers & Durable Objects | `@cloudflare/workers-types` 4.20241022.0 | `app/worker/` |
| **Database** | Embedded SQLite in Durable Objects | Workers SQLite Storage API | `this.ctx.storage.sql` in `room-do.ts` |
| **Unit / Worker Testing** | Vitest | 2.1.9 | `app/tests/unit/`, `app/tests/worker/` |
| **E2E Testing** | Playwright (Multi-Browser) | 1.48.2 | `app/tests/e2e/` |
| **Live Production Worker** | Cloudflare Workers Dev | Node / Wrangler 3.114.17 | `https://doodl.rajath-raj2569.workers.dev` |

---

## 2. Test Suite Baseline (Clean Run)

Command: `cd app && npm test && npm run typecheck`
- **Vitest Unit & Integration Suites:** 5 files, 35 passed, 0 failed.
  - `tests/unit/auth-and-words.test.ts` (10 tests) — PASS
  - `tests/unit/scoring.test.ts` (9 tests) — PASS
  - `tests/worker/game-mechanics.test.ts` (3 tests) — PASS
  - `tests/worker/advanced-modes-and-recovery.test.ts` (7 tests) — PASS
  - `tests/worker/room-lifecycle.test.ts` (6 tests) — PASS
- **TypeScript Static Analysis:** 0 errors (`tsc --noEmit` exit code 0).

---

## 3. Discovered Architectural & Behavioral Baseline Issues

### Defect 1: Mobile Vertical Stacking (Violates U01)
- **Current Behavior:** `app/src/pages/Game.tsx` uses a simple `grid-cols-1 lg:grid-cols-[220px_1fr_300px]`. On mobile viewport width (<=850px), `PlayerSidebar` renders at the top above the canvas, pushing the drawing canvas below the fold and forcing GuessChat to the very bottom.
- **Requirement:** Canvas must be full width at the top, followed by Player List (left, ~43%) and Guess/Chat (right, ~57%) side-by-side in one row, with the Composer pinned at the bottom.

### Defect 2: Composer Input Disabled Upon Correct Guess (Violates C10, C11)
- **Current Behavior:** In `app/src/components/GuessChat.tsx` line 91, `<input disabled={disabled || isDrawer || hasGuessed} />` completely disables the text box for players who have already guessed the word.
- **Requirement:** Solved players and drawers must be allowed to chat. Send and Enter must work. Their messages must be routed to a separate authorized solved/drawer channel so the secret answer is never leaked to players still guessing.

### Defect 3: Manual Hint Logic & Incomplete Letter Schedule (Violates C05, C06, C08)
- **Current Behavior:** `room-do.ts` still listens for `round.hintRequest` and only schedules a single midpoint alarm (`drawDuration / 2`).
- **Requirement:** Completely remove manual hint requests and point penalties. Implement the deterministic server schedule: $H = \min(3, \lfloor N / 2 \rfloor)$ with reveals at elapsed $T \times i / (H + 1)$ for $i = 1 \dots H$, persisted across alarms and reconnects.

### Defect 4: Missing Modes: Drawing Telephone & Party Mix (Violates S01, T01–T09, P01–P08)
- **Current Behavior:** `app/shared/game-types.ts` defines `GameMode = 'classic' | 'blitz' | 'duels' | 'chaos' | 'teams'`. Standalone Blitz, Chaos, Duels, and Teams are exposed. Telephone and Party Mix are absent.
- **Requirement:** Exactly 3 standalone modes on the UI (`classic`, `telephone`, `party_mix`). Blitz and Chaos must only exist as internal stages of Party Mix. Direct API and UI creation of obsolete standalone modes must be blocked while preserving legacy match read-compatibility.

---

## 4. Phase P0 Sign-Off: Baseline Verified & Green
Ready to advance to Phase P1 (Mode Registry and Compatibility).
