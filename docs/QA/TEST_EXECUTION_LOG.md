# DOODL V3 — Complete Automated Test Execution Log

**Audit Timestamp:** 2026-11-23T15:25:32+05:30  
**Test Runner:** Vitest v2.1.9 & Playwright Test v1.49.1  
**Total Executed Tests:** 41  
**Passed:** 41  
**Failed:** 0  
**Skipped:** 0  

---

## 1. Vitest Suite Execution (35 Tests Passing)

### 1.1 `tests/unit/auth-and-words.test.ts` (10 tests)
```text
✓ Auth & Session Tokens > generates a valid guest token with HMAC signature
✓ Auth & Session Tokens > rejects tampered guest token signature
✓ Auth & Session Tokens > rejects expired guest token
✓ Auth & Session Tokens > creates and validates join grants bound to room and seat
✓ Auth & Session Tokens > rejects join grant with wrong roomCode or seatId
✓ Word Engine > loads words from the everyday pack
✓ Word Engine > loads words from other packs (animals, food, popculture, hard)
✓ Word Engine > returns 3 random candidates with difficulty levels
✓ Word Engine > filters words by language
✓ Word Engine > generates deterministic daily doodle word based on UTC date
```

### 1.2 `tests/unit/scoring.test.ts` (9 tests)
```text
✓ Scoring Rules > calculates maximum points for instant correct guess
✓ Scoring Rules > calculates decay points based on remaining time
✓ Scoring Rules > awards minimum base points at timer expiration
✓ Scoring Rules > awards drawer bonus based on correct guess count
✓ Scoring Rules > normalizes guess strings by trimming, lowercasing, and stripping diacritics
✓ Scoring Rules > detects close guess using Levenshtein distance
✓ Scoring Rules > calculates XP and level progression
✓ Scoring Rules > calculates Blitz mode rapid score multipliers
✓ Scoring Rules > scores Team Battles and aggregates squad points
```

### 1.3 `tests/worker/room-lifecycle.test.ts` (6 tests)
```text
✓ RoomDO Lifecycle & Persistence > creates room with valid settings and host seat
✓ RoomDO Lifecycle & Persistence > player joins room and receives seat
✓ RoomDO Lifecycle & Persistence > rejects join if password is required and incorrect
✓ RoomDO Lifecycle & Persistence > handles player leave and cleans up seat
✓ RoomDO Lifecycle & Persistence > migrates host when host player leaves
✓ RoomDO Lifecycle & Persistence > serializes state to storage on shutdown and restores on wake
```

### 1.4 `tests/worker/game-mechanics.test.ts` (3 tests)
```text
✓ Game Mechanics & Canvas Sync > stroke operations append and synchronize to room state
✓ Game Mechanics & Canvas Sync > progressive hints reveal letters at timer intervals
✓ Game Mechanics & Canvas Sync > correct guess triggers point award and turn finish check
```

### 1.5 `tests/worker/advanced-modes-and-recovery.test.ts` (7 tests)
```text
✓ Advanced Modes & Resilience > Blitz mode configures 30s timers and fast round transitions
✓ Advanced Modes & Resilience > Drawing Duels assigns two simultaneous drawers
✓ Advanced Modes & Resilience > Chaos mode applies server-side active drawing modifiers
✓ Advanced Modes & Resilience > Team Battles balances rosters and tracks team scores
✓ Advanced Modes & Resilience > Reconnection restores seat and authoritative state
✓ Advanced Modes & Resilience > Session takeover closes previous socket when same seat reconnects
✓ Advanced Modes & Resilience > Match completion calculates podium winners and awards final stats
```

---

## 2. Playwright E2E Suite Execution (6 Tests Passing)

### 2.1 `tests/e2e/multiplayer-game.spec.ts` (1 test)
```text
✓ Real 2-Browser Multiplayer Match Verification (P0-001, P0-002, P0-003, P0-008, P0-010, P0-011, P0-012, P0-013, P0-019)
  › two independent browser sessions join same invite, draw and guess in real time (2.3s)
    - Browser 1 (Host desktop): Creates room CB51B039, joins as AliceHost.
    - Browser 2 (Guest mobile iPhone SE): Visits /?join=CB51B039, joins as BobGuest.
    - Host starts match, picks word 'SUN'.
    - Guest receives masked word '_ _ _'.
    - Host draws vector stroke on canvas.
    - Guest canvas receives drawing op in real time.
    - Guest types 'sun' in chat.
    - Server awards 480 points to Guest, drawer bonus to Host.
    - Score updates live on both player screens.
```

### 2.2 `tests/e2e/negative-and-edge-cases.spec.ts` (5 tests)
```text
✓ Negative & Security Edge Cases > keyboard submission on nickname form and validation limits (P0-001, P0-020) (580ms)
✓ Negative & Security Edge Cases > mobile viewport responsiveness with zero horizontal overflow (P0-019) (580ms)
✓ Negative & Security Edge Cases > password protected room behavior (P0-004) (353ms)
✓ Negative & Security Edge Cases > capacity limit rejection when room reaches maximum players (P0-006) (531ms)
✓ Negative & Security Edge Cases > play with friends navigation modal opens, switches tabs, and creates party (P0-001, P0-002) (1.0s)
```
