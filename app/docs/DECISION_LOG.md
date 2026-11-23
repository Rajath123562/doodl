# DOODL Decision Log & Architectural Decision Records (ADRs)

This document tracks all formal architectural and technical decision records.

---

## ADR Index

- [ADR-0001: Cloudflare Workers + Per-Room SQLite Durable Object Topology](#adr-0001)
- [ADR-0002: Guest Identity, HttpOnly Cookie Sessions, and Single-Use Join Grants](#adr-0002)
- [ADR-0003: Deterministic Integer Normalization for Drawing Coordinates (65536x65536)](#adr-0003)
- [ADR-0004: Strict Server-Authoritative Clock, Alarm Deadlines, and Anti-Leak Redaction](#adr-0004)
- [ADR-0005: Game Mode Architecture & Scope Boundary for P2 Ranked/Friends](#adr-0005)
- [ADR-0006: Local-First Guest Progression and Privacy-Respecting Gallery Storage](#adr-0006)

---

## <a id="adr-0001"></a>ADR-0001: Cloudflare Workers + Per-Room SQLite Durable Object Topology

- **Status**: ACCEPTED
- **Date**: 2026-11-22
- **Context**: Real-time multiplayer drawing games require a single point of serialization for room state, stroke sequencing, guessing race conditions, and disconnect grace windows.
- **Decision**: 
  - Each room is backed by exactly one Durable Object instance identified by its unique room code (`durableObjectNamespace.idFromName(roomCode)`).
  - Storage uses DO SQLite storage (`ctx.storage.sql`) for transactional state persistence.
  - WebSockets utilize the Cloudflare Hibernation API (`ctx.acceptWebSocket(ws, tags)`) and store seat metadata via `ws.serializeAttachment()`.
  - Transitions and deadlines rely on server wall-clock timestamps and DO Alarms (`ctx.storage.setAlarm(deadline)`). `setInterval` is forbidden for authoritative game logic.
- **Consequences**: Zero single points of failure across rooms; instant wake from hibernation on message; strict compliance with Workers Free tier limits by avoiding idle polling.

---

## <a id="adr-0002"></a>ADR-0002: Guest Identity, HttpOnly Cookie Sessions, and Single-Use Join Grants

- **Status**: ACCEPTED
- **Date**: 2026-11-22
- **Context**: Players must be able to join with a nickname within 30 seconds without email signup, but session hijacking, seat impersonation, and stale socket reconnect storms must be strictly prevented.
- **Decision**:
  - `POST /api/guest` generates a cryptographically random 256-bit guest session ID returned in a `HttpOnly; Secure; SameSite=Lax; Path=/` session cookie (plus bearer fallback in authorization header for non-cookie clients).
  - Joining a room requires calling `POST /api/rooms/:code/join`, which checks capacity and bans, and reserves a seat.
  - Upgrading to WebSocket requires a short-lived (60s) single-use `joinGrant` minted via `POST /api/rooms/:code/join-grant`.
  - Duplicate connections from the same guest replace the previous connection (`connectionEpoch` incremented; older connection receives `SESSION_TAKEN_OVER` and closes).
- **Consequences**: Guessed `playerId` or leaked URL parameters cannot hijack a room seat. Replay attacks are rejected.

---

## <a id="adr-0003"></a>ADR-0003: Deterministic Integer Normalization for Drawing Coordinates (65536x65536)

- **Status**: ACCEPTED
- **Date**: 2026-11-22
- **Context**: Clients have varying screen sizes, pixel densities (DPR 1x, 2x, 3x), and window aspect ratios (mobile portrait vs desktop widescreen).
- **Decision**:
  - All pointer coordinates are converted from local CSS pixels to a fixed 16-bit unsigned integer coordinate space `(0..65535, 0..65535)` based on a standard 16:9 canvas aspect ratio.
  - Network packets transmit compact integer deltas or points.
  - Strokes are rendered as vector commands (`pencil`, `eraser`, `line`, `rainbow`, `sticker`).
  - Undo and redo operate directly on the server-authoritative command sequence. Redo is invalidated when new strokes arrive.
- **Consequences**: Exact visual parity across devices; compact payload sizes (<64KiB per batch, <10KiB for normal stroke segments); replay and PNG export are completely deterministic.

---

## <a id="adr-0004"></a>ADR-0004: Strict Server-Authoritative Clock, Alarm Deadlines, and Anti-Leak Redaction

- **Status**: ACCEPTED
- **Date**: 2026-11-22
- **Context**: Client tampering must never allow score injection, secret word leakage, or timer freezing.
- **Decision**:
  - Word candidates and selected words are stored solely in DO internal state and sent ONLY to the authenticated drawer's WebSocket.
  - Guesser snapshots, public chat messages, and error responses are strictly filtered to remove candidate words and plaintext answers.
  - Correct guesses are privately confirmed to the guesser with `guess.privateFeedback` (points awarded) and broadcast publicly as `guess.publicCorrect` containing only the player's name/seat ID, NEVER the word.
  - Timers use `deadlineAtMs` set by server time (`Date.now()`). Acceptance of guesses is evaluated at the exact millisecond of receipt on the server before `deadlineAtMs`.
- **Consequences**: 100% immune to devtools inspection, memory scraping, network sniffers, and clock tampering.

---

## <a id="adr-0005"></a>ADR-0005: Game Mode Architecture & Scope Boundary for P2 Ranked/Friends

- **Status**: ACCEPTED
- **Date**: 2026-11-22
- **Context**: The game supports Classic (P0), Blitz (P1), Drawing Duels (P2), Chaos Mode (P2), and Team Battles (P2). P2-005 addresses friends lists and global ranked ladders.
- **Decision**:
  - Classic, Blitz, Duels, Chaos, and Teams are modular rule plugins executing inside the `RoomDO` state engine.
  - Drawing Duels uses two distinct canvas channels (`canvasId: 'A' | 'B'`), matched prompts, and single-reward per guesser.
  - Friends lists, cross-device global MMR ranked ladders, and global spectator tournaments are explicitly declared OUT OF INITIAL RELEASE SCOPE (as authorized by spec `docs/20_DEFINITION_OF_DONE_AND_TRACEABILITY.md` P2-005) until persistent verified account authentication and moderation infrastructure are commissioned.
- **Consequences**: Focuses engineering on rock-solid multiplayer gameplay without creating insecure unauthenticated leaderboards or spam vectors.

---

## <a id="adr-0006"></a>ADR-0006: Local-First Guest Progression and Privacy-Respecting Gallery Storage

- **Status**: ACCEPTED
- **Date**: 2026-11-22
- **Context**: Guests play without login. Storing massive user-generated drawings on server free storage risks quota exhaustion and unmoderated abusive content.
- **Decision**:
  - Avatar preferences, Daily Doodle streaks, and XP progression are stored in browser-local storage and clearly labeled "Saved on this device".
  - Artwork gallery saves and PNG downloads execute client-side from the vector command log onto an off-screen canvas.
  - Cloud gallery synchronization is disabled by default to prevent privacy violations and abusive content distribution without human moderators.
- **Consequences**: Zero storage cost for user drawings on Cloudflare; zero privacy risk for minors; user has 100% control over personal artwork and data deletion.
