# Antigravity Phase 2 — Server-authoritative Classic game engine

Build on Phase 1 verified real room backend. Read `docs/GAME_ENGINE.md`, `docs/REALTIME_PROTOCOL.md` and `docs/ARCHITECTURE.md`. Implement legal transitions `LOBBY → SELECTING_WORD → DRAWING → REVEAL → ROUND_RESULTS → MATCH_RESULTS` with explicit enum and server event guards.

- Server selects a valid drawer and 3 candidate words, sends candidates **only** to that seat, handles word-choice timeout.
- Server sets deadlines and controls phase/timer using Durable Object persistence+alarms/on-demand expiry; no logic that breaks when DO hibernates.
- Eligible player rotation is fair over configurable cycles; 2-player and full-capacity matches work.
- Host-only start, server-built scoreboard, immutable match/turn IDs and event IDs; configure no untrusted client data into authority.
- Late join policy, lobby/game/match results state redaction, host/drawer disconnection handling with grace windows.
- Add game engine unit/integration test matrix and mock clock *for tests only*.

## Acceptance

1. Two actual clients join, host starts, one sees three candidate words, other does not. Raw B snapshot, browser devtools network payload, server response all free from secret words.
2. Server time deadline advances even after DO instance eviction/restart or equivalent hibernation test.
3. Drawer disconnect no permanent hang. Duplicated start/turn-change doesn't duplicate transitions.
4. Tests cover 2 and 12 seats, 1 and multiple cycles, eligible turn rotation, invalid permissions and stale IDs.
5. Update status and show logs/screenshots/commands and GO/NO-GO.

Do not implement game scoring via client-chosen values or skip server word secrecy.
