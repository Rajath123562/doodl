# DOODL V3 — Security & Abuse Resistance Audit

**Date**: 2026-11-23  
**Auditor**: Antigravity Principal Security Engineer  
**Target**: `app/` (Worker + SQLite-backed Durable Objects + React Frontend)  
**Status**: **PASS (0 Critical, 0 High, 0 Medium Unresolved)**

---

## 1. Threat Model & Security Posture

DOODL is a real-time multiplayer drawing and guessing party game running on the public internet. It assumes all client connections, WebSocket messages, room codes, nicknames, chat messages, and custom words are potentially hostile.

### Core Attack Surfaces Analyzed:
1. **Word Secrecy Bypass:** Attempts by guessers to inspect WebSocket frames, snapshots, network responses, or client DOM to retrieve the secret word before turn reveal.
2. **Score & Privilege Injection:** Attempts by clients to send forged score updates, declare themselves drawers, alter timers, or take over host roles.
3. **Session Hijacking & Replay Attacks:** Replaying old join grants, impersonating players across rooms, or using stale connection epochs.
4. **Denial of Service & Flood Attacks:** Sending oversized payloads (>64KB), flooding WebSocket intents, creating endless rooms, or overflowing room capacity.
5. **Content Abuse & XSS:** Malicious HTML in nicknames or chat, profanity in public categories, and custom word pack exploits.

---

## 2. Invariant Audits & Verification Results

### 2.1 Word Secrecy Invariant (P0-008) — PASS
- **Implementation:** [app/worker/room-do.ts](file:///c:/Users/RAJATH%20U/Downloads/doodl/app/worker/room-do.ts#L915-L930)
- **Mechanism:** Word candidates (`candidateWords`) and the selected secret word (`internalSecretWord`) are dispatched exclusively to sockets tagged with the current drawer's seat ID.
- **Snapshot Redaction:** In `getPublicSnapshot(seatId)`, if `seatId` is not in `currentDrawerIds`, the secret word is completely masked (`_ _ _ _`), and `candidateWords` is `undefined`.
- **Chat Redaction:** When a guesser submits the correct word, the server redacts the word completely from the public broadcast (`guess.publicCorrect`), awarding points with zero plaintext exposure.
- **Evidence:** Verified in automated integration test `tests/worker/game-mechanics.test.ts` and 2-browser Playwright E2E test `tests/e2e/multiplayer-game.spec.ts`.

### 2.2 Server-Authoritative State & Permissions (P0-005, P0-013) — PASS
- **Host Controls:** Non-host clients attempting `room.start`, `room.kick`, `room.mute`, `room.transferHost`, or `room.setSettings` receive structured `FORBIDDEN` errors.
- **Role Guards:** Only designated drawers can draw (`stroke.begin`, `stroke.append`, `draw.undo`). Non-drawer draw commands are rejected with `NOT_DRAWER`.
- **Score Calculation:** Scores are never accepted from clients. All points are derived server-side from `deadlineAtMs - now`, rank bonus, and hint penalties via `calculateGuesserScore()`.
- **Drawer Cannot Guess:** Drawers submitting `guess.submit` receive `DRAWER_CANNOT_GUESS`.
- **Evidence:** Verified in `tests/worker/game-mechanics.test.ts`.

### 2.3 Guest Sessions, Grants & Epoch Protection (P0-016) — PASS
- **Guest Identity:** HMAC-SHA256 signed tokens minted via `/api/guest` and stored in `HttpOnly; SameSite=Lax` cookies.
- **Single-Use Join Grants:** WebSocket handshakes require a short-lived (60s) cryptographic grant tied to `(guestId, roomCode, seatId)`.
- **Duplicate Tab Policy:** When a user opens a second tab or reconnects, the DO increments `session.epoch`. The previous WebSocket connection receives `connection.superseded` and is closed with code `1008`. Old sockets sending stale epoch messages are rejected with `STALE_EPOCH`.
- **Evidence:** Verified in `tests/worker/advanced-modes-and-recovery.test.ts`.

### 2.4 Payload Validation & Capacity Guards (P0-004, P0-006, P0-021) — PASS
- **Payload Bound:** Any WebSocket message exceeding 65,536 bytes (64KB) is immediately rejected with `PAYLOAD_TOO_LARGE`.
- **Strict Zod Schemas:** Every message envelope is validated against `ClientEnvelopeSchema`. Unknown or malformed structures trigger `INVALID_ENVELOPE`.
- **Race-Free Capacity Limit:** Seat allocation occurs inside the single-threaded SQLite Durable Object. Capacity checks (`seats.size >= maxPlayers`) prevent race-overfill, rejecting excess joins with `409 ROOM_FULL`.
- **Evidence:** Verified in `tests/e2e/negative-and-edge-cases.spec.ts`.

### 2.5 Input Sanitization & Anti-XSS (P0-001, P0-018) — PASS
- **Nicknames:** Enforced 2–20 graphemes, trimmed, Unicode NFKC normalized, and stripped of control characters.
- **Chat:** HTML angle brackets and tags stripped; family-friendly profanity filter applied. Muted seats are blocked from chat for the host-designated duration.
- **Evidence:** Verified in `tests/unit/auth-and-words.test.ts`.

---

## 3. Vulnerability Register

| ID | Vulnerability | Severity | Mitigation Implemented | Verified In Test |
|---|---|---|---|---|
| VULN-01 | Client-side score forgery | Critical | Scores computed strictly on server | `tests/unit/scoring.test.ts` |
| VULN-02 | Guesser secret word sniffing | Critical | Filtered WebSocket dispatch & snapshot masking | `tests/worker/room-lifecycle.test.ts` |
| VULN-03 | Seat takeover across tabs | High | Session epoch increment & socket eviction (1008) | `tests/worker/advanced-modes-and-recovery.test.ts` |
| VULN-04 | Chat XSS injection | Medium | HTML tag stripping & NFKC normalization | `tests/unit/auth-and-words.test.ts` |
| VULN-05 | Room capacity overflow race | Medium | Single-threaded SQLite DO capacity check | `tests/e2e/negative-and-edge-cases.spec.ts` |

**Conclusion:** All critical and high security vectors are permanently mitigated and locked by automated tests.
