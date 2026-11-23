# DOODL V3 — Central Defect Register & Remediation Ledger

**Audit Date:** 2026-11-23  
**Status:** **ALL KNOWN DEFECTS RESOLVED & VERIFIED (0 OPEN DEFECTS)**  

---

## Defect Summary

| Defect ID | Severity | Feature Affected | Root Cause | Status | Resolution Commit |
|---|---|---|---|---|---|
| **DEF-001** | **P1 (High)** | Navbar "Play with Friends" | Button called `setCurrentRoute('home')` when not in room (no-op) | **CLOSED** | `f330a0c` |
| **DEF-002** | **P1 (High)** | Turn Word Selection UI | `App.tsx` forced `phase: 'DRAWING'` on `turn.started`, hiding overlay | **CLOSED** | `ac9cec6` |
| **DEF-003** | **P2 (Med)** | Protocol Type Safety | Missing `'round.hintRevealed'` in `ServerEventType` union | **CLOSED** | `ef4b62b` |
| **DEF-004** | **P2 (Med)** | Room Host Nickname | `/api/rooms` ignored `hostNickname` in POST body, defaulting to `'Host'` | **CLOSED** | `fd620d7` |
| **DEF-005** | **P2 (Med)** | Capacity Test Cookie Reuse | Shared browser context sent identical cookie, triggering reconnect | **CLOSED** | `ac9cec6` |

---

## Detailed Defect Records

### DEF-001: Navbar "Play with Friends" No-Op When Not in Active Room
- **Severity:** P1 (High)
- **Feature Affected:** Global Navigation Bar & Party Launcher
- **Reproduction Steps:**
  1. Open homepage `http://127.0.0.1:8787/`.
  2. Click **"Play with Friends"** in the top navigation bar.
- **Expected Result:** Opens a party launcher to create or join a room, or highlights the room creation flow.
- **Actual Result:** Route was set to `'home'`, which was already active. Button did not highlight or trigger any UI change.
- **Root Cause:** In `App.tsx`, `onClick` checked `if (roomCode) setCurrentRoute('lobby'); else setCurrentRoute('home');`. Since `roomCode` was null, it executed a no-op route transition.
- **Fix Description:** Implemented `PlayWithFriendsModal.tsx` and wired `showPlayWithFriendsModal` state into `App.tsx`.
- **Regression Test:** `tests/e2e/negative-and-edge-cases.spec.ts:6` (`play with friends navigation modal opens, switches tabs, and creates party`).
- **Verification Evidence:** Playwright E2E test passed (1.0s).
- **Status:** **CLOSED (VERIFIED)**

---

### DEF-002: Word Choice Overlay Hidden During Selection Phase
- **Severity:** P1 (High)
- **Feature Affected:** In-Game Turn Progression & Word Selection
- **Reproduction Steps:**
  1. Start match with 2 players.
  2. Host receives candidate words.
- **Expected Result:** Host sees overlay with 3 word buttons to pick from.
- **Actual Result:** Overlay disappeared immediately because game phase jumped to `DRAWING`.
- **Root Cause:** In `App.tsx`, `turn.started` handler hardcoded `phase: 'DRAWING'`.
- **Fix Description:** Updated server payload to include `phase: this.phase`, and client checks whether `maskedWord === '???'` to render `SELECTING_WORD`.
- **Regression Test:** `tests/e2e/multiplayer-game.spec.ts:1`.
- **Verification Evidence:** Host successfully clicks word candidate button and starts drawing phase.
- **Status:** **CLOSED (VERIFIED)**

---

### DEF-003: Missing ServerEventType Protocol Literal
- **Severity:** P2 (Medium)
- **Feature Affected:** TypeScript Typecheck
- **Reproduction Steps:** Run `npm run typecheck`.
- **Expected Result:** Compiles with 0 errors.
- **Actual Result:** TS2322 error: `'round.hintRevealed'` not assignable to `ServerEventType`.
- **Root Cause:** Protocol union in `app/shared/protocol.ts` lacked `'round.hintRevealed'`.
- **Fix Description:** Added `'round.hintRevealed'` to `ServerEventType` union.
- **Regression Test:** `npm run typecheck`.
- **Verification Evidence:** `tsc --noEmit` exits with code 0.
- **Status:** **CLOSED (VERIFIED)**

---

### DEF-004: Host Nickname Ignored on Room Creation
- **Severity:** P2 (Medium)
- **Feature Affected:** Room Creation API (`POST /api/rooms`)
- **Reproduction Steps:** Create room with `hostNickname: "AliceHost"`.
- **Expected Result:** Host seat has nickname `"AliceHost"`.
- **Actual Result:** Host seat was named `"Host"`.
- **Root Cause:** `CreateRoomSchema` ignored incoming nickname fields.
- **Fix Description:** Extended `CreateRoomSchema` to validate `hostNickname`, `avatarFace`, and `avatarColor`, passing them to DO initialization.
- **Regression Test:** `tests/e2e/multiplayer-game.spec.ts:1`.
- **Verification Evidence:** Host seat correctly displays `"AliceHost"` in lobby and in-game HUD.
- **Status:** **CLOSED (VERIFIED)**

---

### DEF-005: Room Capacity Rejection Test False Success Due to Cookie Sharing
- **Severity:** P2 (Medium)
- **Feature Affected:** E2E Automated Test Suite
- **Reproduction Steps:** Run capacity 409 test reusing Playwright `page.request`.
- **Expected Result:** Third player receives 409 `ROOM_FULL`.
- **Actual Result:** Server returned 200 OK because the same `doodl_guest` cookie was re-sent, reconnecting Player 2.
- **Root Cause:** Playwright test contexts shared cookie storage.
- **Fix Description:** Created isolated browser contexts (`p2Context`, `p3Context`) with distinct cookies.
- **Regression Test:** `tests/e2e/negative-and-edge-cases.spec.ts:5`.
- **Verification Evidence:** 3rd distinct player correctly receives HTTP 409 with `{"code":"ROOM_FULL"}`.
- **Status:** **CLOSED (VERIFIED)**
