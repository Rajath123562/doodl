# Authoritative game-engine specification

## Classic room state machine

```text
LOBBY --host starts, >=2 players--> SELECTING_WORD
SELECTING_WORD --drawer picks OR 10s expires--> DRAWING
DRAWING --timer expires OR all eligible guesses correct--> REVEAL
REVEAL --5s or server action--> ROUND_RESULTS
ROUND_RESULTS --5s--> SELECTING_WORD (next drawer) OR MATCH_RESULTS
MATCH_RESULTS --host play again--> LOBBY
ANY --room expires / everyone leaves--> CLOSED
```

Use explicit enums and legal transition guards. The '2 player minimum' applies to starting; if an opponent disconnects, apply a documented reconnection grace period then safely end/advance. Ignore/reject duplicated transition intents. The server owns round counters and timers.

## Seat and role rules

- Roles: `HOST`, `PLAYER`, `SPECTATOR` (P1); separate **dynamic** `isCurrentDrawer` flag; roles and drawer designation are never client-trusted.
- Players in the lobby are eligible for the next game; join mid-match as spectator or queue-for-next-match (choose and document). No retroactive guessing/points.
- At 2–12 players, each eligible player draws exactly once per cycle; configured `cyclesPerPlayer` default 3. The server freezes drawer order per cycle or documents rotation on dropout. Player names may duplicate, IDs must not.
- Drawer cannot guess or collect guesser points. Correct guessers cannot keep sending guesses; their chat remains in an appropriate channel and must not expose the answer.
- Secret word selected from candidate words in an approved pack. Candidates go **only to drawer**; guessers receive masked length/punctuation structure and public reveal/hints.

## Word choice

- Default three server-generated candidates; drawer has 10 seconds to choose, else server selects. Avoid personally identifying, hateful, hateful slur or explicit word packs; filter user custom packs, restrict sizes and disable unsafe room search by default.
- Avoid excessive hints on very short words. Hint choice and reveal timing are owned by server; show same masked word progression to eligible guessers unless a paid? no — avoid pay-to-win.
- Normalize guesses on server: Unicode NFKC, locale-aware casefold where available, trim/collapse whitespace, optionally remove safe punctuation; preserve diacritics in languages where semantic. Never blindly strip all Unicode or create false matches. Unit-test Hindi/Kannada separately when added.
- Never echo correct guess verbatim into public chat; instead emit `guess.correct` to requester and a public redacted success event. Close guesses when drawer answer is revealed.

## Default scoring formula (implement server-side)

At `now` before deadline, `remaining = clamp((deadlineAt - now) / durationMs, 0, 1)`.

**Guesser score** (first correct guess per player per turn):
`base = 100 + floor(400 * remaining)`; `speedBonus = max(0, 50 - 10 * correctRank)`; `hintPenalty = 60 * hintsUsed`.
`points = max(40, base + speedBonus - hintPenalty)`.

`correctRank` is 0 for first correct guess, 1 for second, etc. Reveal exact breakdown after turn.

**Drawer reward:** at end of turn, `min(300, 75 * uniqueCorrectGuessers)` if at least one player was eligible. No drawer reward for disconnected/skipped turns or turns canceled for abuse. Allow server settings for tuning only through validated presets, not client-provided arithmetic.

**Tie breaker:** total points, then number of first-correct answers, then lowest average correct-guess delay, then stable player join order. Make equality explicit; no random unannounced winners.

## Timing, reconnect and idempotence

- Default draw time 90,000ms, Blitz 30,000ms. Draw deadline created by server, broadcast as an epoch timestamp. Client countdown is decorative; accepted guess is based on server receipt before deadline.
- Every round carries `matchId`, `turnId`, and version so stale messages cannot award points. Duplicate `clientEventId` must not apply twice.
- Guess actions carry no `points`, `correct` or `word` authoritative fields. If present, reject event rather than trusting them.
- Correct answer persists in server state; never included in guesses' redacted snapshot until REVEAL.
- On room recovery, all timers and turn transitions must still be consistent; use DO alarms or check-on-request, never a wake-dependent `setInterval`.

## Result display

Round result: revealed word, drawer, correct players, individual earned points, total score, `ROUND_RESULTS` countdown. Match result: ranked list, personal summary, replay/share (if enabled), play again, leave. Results are derived from server events, not client recomputation.

## Advanced modes as independent rules modules

- **Duels:** two assigned drawers, two separate server-tracked canvases, two explicit word assignments (same word for fairness in initial design); each guess must specify canvas/target lane; no cross-lane secret leaks; score rules documented before implementation.
- **Chaos:** effect chosen by server from allowlist, effect ID/version sent to all, applies to designated roles/tools/time window, reflected in renderer and server validation.
- **Teams:** server-owned team membership, team score and turn assignment; no score inflation by teammates sending duplicate correct guesses.

## Invalid-event examples

Non-drawer draws; drawer submits guess; spectator chooses word; user sends `score=999999`; old turn guess; guesses after timeout; copy of same event ID; message from kicked seat; undo someone else's stroke; client attempts to become host. Each must be rejected and exercised in tests.
