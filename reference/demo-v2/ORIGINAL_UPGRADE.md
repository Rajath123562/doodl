# Antigravity — Implement doodl. v2 Features in Production

## Objective

Use `index.html` in this package as a **functional interaction reference and original visual design prototype**. Build a real, accessible, production-oriented multiplayer game; do not falsely claim that the prototype's bots, invite links, or matchmaking are already real.

## Preferred baseline

React + TypeScript + Vite, reusable design system and HTML5 canvas renderer; server-authoritative real-time rooms using Cloudflare Workers / Durable Objects (or documented equivalent), durable cross-room data only where needed; appropriate hosting and browser automated tests.

## Implement these features in sequence

1. **Game engine parity**: preserve the prototype's visual layout and user experience, then implement real rooms, WebSocket-based canvas events, server timers, word secrecy, authenticated guest sessions, correct-guess validation, reconnection, host transfer and reliable room state synchronization. No mock scoring.
2. **Advanced drawing**: model pencil, eraser, line, rainbow and stamps as typed stroke events with deterministic replay, undo/redo authorization and input validation. Batch pointer events and test on desktop/touch devices.
3. **Room settings and word packs**: make word selection authoritative and pack-filtered, support private/public rooms, true invitation URL flows and configurable game limits; add appropriate spam/abuse controls.
4. **Hints with scoring tradeoff**: reveal letters only to eligible guessers; track hint usage server-side; adjust scores in server state; do not leak the secret word to guessing clients.
5. **Daily solo challenge**: keep the offline-friendly interface, but implement server-backed daily seeds, once-per-day reward integrity, streaks and eventual verified rankings. Clearly distinguish local-only results from server-verified scores.
6. **XP and achievement badges**: persist player progress and make rewards authoritative; implement guest profiles with reasonable persistence and a migration path to opted-in accounts.
7. **Avatar customization**: save avatar settings, validate available cosmetics and use accessible text alternatives; avoid user-uploaded images until moderation infrastructure is ready.
8. **Gallery and export**: support user-controlled save/delete, capped quotas, PNG downloads, a clear retention policy, privacy controls, and opt-in sharing. Do not save player drawings to servers automatically without consent.
9. **Emoji reactions and effects**: broadcast rate-limited lightweight reaction events, support reduced motion and avoid blocking canvas pointer input.
10. **Blitz and other modes**: fix the round time at 30 seconds for Blitz; keep the gameplay authoritative, handle edge cases (disconnects, timeout, empty lobby) and prevent undesired room-settings carryover.

## Acceptance gates

For each feature, produce documented test results. Mandatory scenarios: two browser clients see synchronized strokes; late joiner receives current canvas snapshot; unauthorized users cannot draw; secret words remain hidden; hint penalty cannot be bypassed; scores persist correctly; Daily reward cannot be farmed by refreshing; gallery save, download and delete work; touch input and viewport layouts work; reconnection after temporary offline status works; security tests pass; Playwright end-to-end tests pass in at least Chromium and mobile emulation.

Do not mark production-ready without actual deployed multi-client verification, security review, load testing, operational logging and rollback procedures. Distinguish implemented, simulated, planned and blocked items explicitly.
