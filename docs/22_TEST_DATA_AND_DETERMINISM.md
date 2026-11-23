# 22 — Deterministic fixtures, property tests and test-only controls

## Seed fixture (must never be a public API)

Test-only environment may inject seed `20261122`, fixture words `bicycle`, `pizza`, `elephant`, `tree house`, room code `E2E-ROOM-1` only in worker test environment. Production always uses cryptographically unpredictable room codes and appropriate non-predictable word selections. Don't expose `/api/debug/word` or production override of clock/seed.

## Score vector examples (Classic)

Assume draw duration 90s. CorrectRank starts 0. Points `max(40,100+floor(400*remaining)+max(0,50-10*rank)-60*hintsUsed)`.

| remaining | correctRank | hintsUsed | expected points |
|---:|---:|---:|---:|
| 1.0 | 0 | 0 | 550 |
| 0.5 | 0 | 0 | 350 |
| 0.25 | 1 | 1 | 180 |
| 0 | 5 | 9 | 40 (floor) |

Drawer reward 0 correct -> 0; 1 -> 75; 3 -> 225; 4+ -> 300. Score never depends on browser wall clock. Same event replay cannot award twice.

## Timeline boundary vectors

- DRAWING started at server `t0`, deadline `t0+90000`; guess received `deadline-1ms` eligible; `deadline` ineligible.
- Two valid guesses in serialized DO order get ranks 0,1; two copies of same correct guess get one award.
- Turn `t_4` event arrives after `t_5` started -> `STALE_TURN`, no state change.
- Word-choice timer 10s expires -> fallback candidate chosen once; drawer's late selection denied.
- Refresh between score durable write and ack -> dedupe prevents second score.
- Six-player, three-cycle match exactly 18 drawing turns (barring recorded forfeitures).

## Random tests / property invariants

Use property-based input generation to check all room transitions stay within legal state enums; scores never negative, over cap from single guess; only one host, only authorized drawer per canvas; no two turns simultaneously active; sequence monotonic; reconnect doesn't increase active seat count; 12 max seats always; serialization/restoration of 1,000 mixed draw ops preserves result; message parser rejects NaN, infinity, negative lengths, malformed Unicode and unknown event types. Random long nickname/words must not cause crash.

## Browser multi-client separation

Create A/B/C as independent Playwright contexts with distinct cookies/storage. Use local server and actual WebSocket. Have A create private room, B join by invite, C malicious unjoined; test B guesses correctly while C cannot read word or draw. Add A2 tab same guest to test session takeover. Record server and browser console logs, screenshots and actual frame snapshots with secrets redacted in saved artifacts.

## Quality checks on fixtures

Never ship QA fixture words/codes or developer admin routes in production bundle. Build test exposes deterministic clock only when cryptographically safe test flag set by environment at build/runtime and cannot be toggled by public query parameter. CI asserts absence of debug endpoints in deployed staging/production.
