# 26 — Engineering dependencies and sequence constraints

```text
Package audit / architecture / CI / original design system
  ├─ Guest identity + room authority + HTTP/WS schemas
  │    ├─ Private room lobby/presence/host permissions
  │    │    ├─ Deterministic Classic state machine/secret words/timer
  │    │    │    ├─ Guess/chat/score/results/play-again
  │    │    │    └─ Mode extension hooks ──> Blitz ──> Duels/Chaos/Teams
  │    │    └─ Room directory ──> honest Quick Play
  │    └─ Session/reconnect/hibernation ──> reliability gates
  ├─ Pointer/Canvas engine ──> events/snapshot/late join
  │    ├─ Undo/redo/eraser ──> replay ──> gallery/PNG
  │    └─ Rainbow/line/shapes/stickers ──> Duels/Chaos
  ├─ Original asset library ──> avatar builder/emoji/word packs
  └─ Privacy/moderation/metrics/release pipeline (must run throughout)
                    └─ Staging / public release gate
```

Do NOT implement Duels before proving two-person synchronized classic. Do NOT publish public gallery before content-report intake + privacy delete. Do NOT claim ranked ladders before persistent nontrivial identity and anti-cheat. Do NOT introduce D1 until cross-room persistence requirement and migration tested. Do NOT open public Quick Play before server-origin safeguards and abuse moderation exist. Do NOT deploy after changing protocol without old-client compatibility plan.

## Source module boundaries

- `shared/`: immutable event types, score/word/canvas invariants and runtime validators.
- `worker/`: HTTP, session, match directory and Durable Object state transitions.
- `src/game/`: canvas input/rendering without business authority; WebSocket client and sync reducer.
- `src/ui/`: reusable components and styles; no direct authoritative score mutations.
- `src/routes/`: pages and error boundaries; route data handling.
- `tests/`: unit, Worker integration, browser E2E, load, security, visual.

## Risk-first milestones

1. Two isolated seats actually drawing one line visible remotely.
2. Secret word and score server verified under raw attacker frames.
3. Complete 2-player match + reconnect with no double score.
4. Full capacity and mobile quality and abuse controls.
5. Only then polish, persistence, public queue, replays, modes.
6. Staging, independent review and a supported release decision.
