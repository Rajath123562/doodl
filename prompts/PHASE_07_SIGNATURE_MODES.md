# Antigravity Phase 7 — Real signature multiplayer modes

Do NOT start until Classic gameplay and P0 security tests have passed. Read `docs/GAME_ENGINE.md` and `docs/UI_UX_SPEC.md`. Implement independent, typed server-authoritative game mode policies; preserve shared room and networking primitives.

## Drawing Duels

- Two concurrent server-designated drawers; two independent canvases; same word initially for fairness; target-lane-specific validated guesses; distinct server-reported score/round summaries.
- Desktop side-by-side; mobile explicitly toggle/tabs with clear lane indicators. No client-authored drawer flags or word leakage.

## Chaos Mode

- Bounded, user-visible modifier sequence chosen by room server from allowlist. Start with limited palette, speed round, mirrored canvas and time-based stroke constraints; avoid inaccessible/unfair mandatory shaking UI.
- Server authorizes allowed tools, canvas transforms and deadlines. Modifier transitions leave snapshots and replays reproducible.

## Team Battles

- Server-assigned team roster with configurable balance; scoring and drawer rotation fairness, clear team results, disconnect handling, friendly lobby previews.

## Acceptance

- 4 distinct browser contexts complete an actual Duel without cross-canvas corruption.
- A malicious client cannot draw on another drawer's canvas or submit a guess to award both lanes.
- Chaos server rejects invalid tool, stale effect and manipulated timer; same event stream replays identically on two devices.
- Team roster, score, duplicate guesses, dropout rules thoroughly tested.
- Add visual screenshots and regression tests for all modes. List any deferred modes honestly.
