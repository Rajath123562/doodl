# 06 — Complete game-mode mechanics (authoritative)

Every mode must implement a `GameMode` contract describing allowed seats, who may draw/guess, prompt distribution, deadline events, scoring, early termination, dropout, results and reconnection. Keep shared Classic engine separate from mode-specific rules. Source of truth: `GAME_ENGINE.md` for Classic scoring unless an ADR formally changes it.

## 1. Classic (P0)

- Active players 2–12. A configured `cyclesPerPlayer` 1–5 means each eligible player gets exactly that many drawing turns (unless disconnect/forfeit documented), NOT a total number of room-wide turns. Default 3 cycles. Freeze order at match start with a stable list of seat IDs. Rejoin recovers seat/order; leaving seat marks forfeited turns and cannot retroactively change played turns.
- 3 server-selected word candidates sent only to authorized drawer, response deadline 10s. Server auto-chooses if no response. No word goes to observers before reveal except masked letters and server-approved hint progression.
- Drawing timer 60–120s default 90. Clock anchored on server; client timer smooth interpolation. All correctly guessed or server deadline -> reveal once. Waiting players should not be able to ask server for word candidates.
- Guesser normalization: NFKC + case folding with language-aware tests and whitespace/punctuation policy. Emit private feedback `WRONG`, `CLOSE` (carefully defined distance), `CORRECT`, `ALREADY_CORRECT`, `RATE_LIMIT`. Exact input spelling not broadcast publicly after correct guess.
- Score exactly as `docs/GAME_ENGINE.md`: base 100 + floor(400*remaining), speed bonus max(0,50-10*correctRank), hint penalty 60 per hint, floor 40; drawer reward min(300,75*uniqueCorrectGuessers). All rank calculations server-side; reveal breakdown after round.
- A turn canceled due to abuse/game shutdown gets no points and consistent reason; game finish leader ties stable.

## 2. Blitz (P1)

Same Classic architecture, only preset drawDuration=30s (editable only 20/30/45 options) and optional 5s word choice. Use original Classic score normalized against exact duration; no cheating by client changing round timer. Bad network must display degraded warning; never retroactively extend for one player. Fast animations short and not blocking input. No special “global fastest” leaderboard without verified identity.

## 3. Drawing Duels (P2)

- Start only with >=4 connected participants unless a tested 2-player alternative is explicitly defined (two drawers cannot meaningfully guess each other simultaneously). Choose two different drawers who receive the **same** server-picked prompt, and at least two eligible guessers. Drawers cannot guess. Each drawer owns **a separate canvas channel** A or B.
- Display canvases simultaneously; on desktop side-by-side and mobile stacked with persistent label/color/icon. Send strokes on `canvasId` A/B, server authorizes ONLY corresponding assigned drawer. No cross-canvas undo/clear, no mixing op sequence.
- Every guess explicitly targets `canvasId`. Award each guesser first correct per specific canvas, no duplicate awards. Identical prompt can expose the word once guessed for one canvas; decide intentional behavior: after a guesser solves either canvas, prevent that guest from earning twice for the same prompt, and do NOT broadcast plaintext to others. Alternatively use separate prompts; **choose one rule and document/test it before implementation**. Recommended: one guesser reward only per duel turn. Track which drawing triggered first correct.
- Scoring example: each guesser earns the Classic formula once, credited to corresponding drawer; both drawers earn 75 per unique correct guesser credited to their canvas, cap 300; tie -> equal credit or judge-specific tie rule documented. Avoid user voting as sole win condition due to brigading unless rate-limited/reviewed.
- Desync/late join: per-canvas checkpoints, replay streams and separate permissions. Drawer disconnect grace skip only its canvas; preserve fairness of results, avoid ghost scores.

## 4. Chaos Mode (P2)

Server chooses one deterministic, safe modifier per turn from a versioned allowlist based on `seed + turnId`, broadcasts modifier ID and start/end time. Examples: 3-color palette, mirror x-axis, limited brush size, inverted pointer coordinates in drawer view, rotating presentation (never rotate world coordinates after server acceptance), timer rush, erase-disabled. Explain effect BEFORE drawing starts. No modifier is allowed to disable essential accessibility/undo safe controls (unless clearly communicated and user can opt out in private room).

All modes canonicalize strokes in stable canvas coordinates; presentation modifiers must yield consistent remote rendering/replay and work on touch, not just mouse. Revert modifier at turn end; do not retain in next turn. Provide a safe reduced-motion variant and a recovery rule if the effect is unsupported on iOS.

## 5. Team Battles (P2)

- 4–12 players, two teams balanced by deterministic server assignment (or captain picks with timeouts). Each team has distinct icon/text markers in addition to colors, roster locked at match start; host can move teams only before start.
- Drawing rotation across teams avoids >1 consecutive turn per team when roster allows; every eligible member draws same number of turns across match where possible. Teammate guessers gain points for their team; other-team guessers can also guess if chosen rule allows; **default: all non-drawers guess and team score aggregates their individual points**. This emphasizes social competition and has a simple fairness model.
- In each drawing turn, score individual correct guessers by Classic formula; team aggregates points earned by its members plus drawer reward credited to drawer's team. Draw time unchanged. Disconnects affect roster but do not erase earned points; server-tie rule by total team, correct-count, fastest average, then declare tie if still equal.
- In private rooms show team labels and game settings clearly; avoid hidden teammate favoritism if ranks advertised.

## 6. Daily Doodle (P1 solo, see `11`)

One stable daily prompt per UTC calendar date and published category, 60s timer. Practice replays unlimited but official streak/XP once per identity/day; client-local guest claims must say device-only. No server AI scoring; if introducing crowd voting later, requires moderation and privacy review.

## Feature test examples

- Classic 2 players * 3 cycles = 6 turns, 12 players * 5 cycles = 60 turns; no off-by-one round label.
- Blitz 30s timer score formula has no negative under clock drift.
- Duels reject `canvasId=B` from A drawer, reject same user claiming points twice across canvases.
- Chaos modifier seed yields identical renderer behavior from event stream across clients.
- Team scores exactly equal sum of member-awarded points plus properly credited drawer points; no double aggregation.
- Midgame team transfer attempt denied, host permissions remain independent of team leader.
