# 20 — Release definition of done, traceability contract and non-negotiable proofs

## How to track a requirement

For each requirement below, Antigravity must add a row to `app/docs/REQUIREMENT_TRACEABILITY.md` with: ID, priority/tier, UI route, server function, type/schema, automated test ID, manual verification, current status, evidence (path/test log), test date and exact Git commit. A feature is `VERIFIED` ONLY when full end-to-end behavioral test and safety failure path were actually executed. Screen presence alone is insufficient.

## Formal acceptance register

| ID | Tier | Implementation and exact PASS condition |
|---|---|---|
| P0-001 | P0 | Nickname form validates 2–20 graphemes, trim, safe text rendering, supports Enter and mobile input |
| P0-002 | P0 | Create room returns unpredictable unique code, server seat, real host and room data; duplicate submit idempotent |
| P0-003 | P0 | Two independent browser sessions join same invite, both see actual connected seats, no generated fake players |
| P0-004 | P0 | Private/password/full/expired room states all protected and return clear structured errors |
| P0-005 | P0 | Host settings/start/kick/mute/transfer enforced by server; nonhost raw commands denied |
| P0-006 | P0 | At least 2 real active players required to start; 2–12 cap cannot race-overfill |
| P0-007 | P0 | Server state machine transitions once; no timer reset from refresh/hibernation |
| P0-008 | P0 | Only drawer receives word candidate and selected word, never guesser raw frames/state/logs |
| P0-009 | P0 | Authoritative Classic turn order and correct rounds-per-player counts for 2,6,12 seats |
| P0-010 | P0 | Canvas pencil/eraser/colors/brush size, draw via pen/touch/mouse, local pointer lag acceptable |
| P0-011 | P0 | Stroke/undo/redo/clear sync across real separate users, late join snapshot and resize accuracy |
| P0-012 | P0 | Wrong/close/correct guess responses, secret redacted from public chat, rate limited |
| P0-013 | P0 | First correct score formula and drawer reward match deterministic vectors, exactly-once even on retry |
| P0-014 | P0 | Hints, masked graphemes and timeouts server-controlled; reveal only when turn is over |
| P0-015 | P0 | Round summary, match winner, ties, play again consistent across all clients |
| P0-016 | P0 | Guest session/grants/connection epochs prevent impersonation; duplicate tab policy and reconnect work |
| P0-017 | P0 | Host/drawer disconnect and mid-match joins cannot stall/corrupt game |
| P0-018 | P0 | Chat anti-XSS, profanity/safety basics, mute/kick/report actionable and enforced |
| P0-019 | P0 | Full mobile and desktop layouts usable, no horizontal overflow, accurate pointer/timer after rotation |
| P0-020 | P0 | Keyboard-accessible forms/buttons/modals, contrast audit, aria status and reduced motion |
| P0-021 | P0 | Bound events/rate/canvas size, raw WS attack tests, no secret/score injection |
| P0-022 | P0 | Local and staging two-context E2E, test commands and honest test logs; no skipped critical cases |
| P0-023 | P0 | Privacy/rules/support pages, data lifecycle and room expiry reflect implementation |
| P0-024 | P0 | Service health, error logs without secrets, quota model, staging rollout/rollback signoff |
| P1-001 | P1 | Quick Play connects real users to eligible public rooms or truthful empty lobby |
| P1-002 | P1 | Original curated safe English categories and private custom words with normalization/tests |
| P1-003 | P1 | Rainbow, line, shapes, custom colors, sticker tools networked + replay deterministic |
| P1-004 | P1 | Avatar Studio customizes, saves and broadcasts correct representation safely |
| P1-005 | P1 | Gallery saves opt-in art, persists per declared device/server scope, deletes actual copy |
| P1-006 | P1 | PNG export is correct with high DPI, orientation, canvas background and no stale strokes |
| P1-007 | P1 | Replay rebuilds strokes in order with play/pause/speed/seek if advertised, word leak denied |
| P1-008 | P1 | Daily 60s prompt and UTC date, one official completion per actual identity scope, practice separately |
| P1-009 | P1 | XP/levels/streaks/achievements correct and honestly described as guest-local vs verified |
| P1-010 | P1 | Blitz 20/30/45 preset rounds, same authoritative engine, exact score accounting |
| P1-011 | P1 | Reactions visible, bounded and respectful of reduced-motion setting |
| P1-012 | P1 | Language architecture and any released translations/word packs human reviewed |
| P1-013 | P1 | Enhanced visual polish across all promised views including empty/error/loading states |
| P2-001 | P2 | Duels two authorized drawers/canvases, >=4 players, correct guess routing, no double points |
| P2-002 | P2 | Chaos seeded server modifier, consistent canvas ops, touch/reduced-motion accessible |
| P2-003 | P2 | Team Battles balanced rosters, deterministic turn distribution and exact team score |
| P2-004 | P2 | Spectator mode, eligibility restrictions, redacted snapshots and capped room size |
| P2-005 | P2 | Friends/tournaments/ranked only if intentionally shipped with secure identity/moderation, otherwise disabled with explicit out-of-scope acknowledgement |
| REL-001 | Release | No Critical/High blockers; actual scripts lint/typecheck/unit/integration/E2E/build all green |
| REL-002 | Release | 30min soak, 12-player room, network loss, iOS+Android manual checks evidenced |
| REL-003 | Release | Staging URL verified from independent networks/devices, cost/secret redaction/privacy approved |
| REL-004 | Release | Rollback drill, monitoring/alert drill, moderation operator and public support contact |
| REL-005 | Release | Public deployment only after user authorizes; feature list claims only VERIFIED rows |

## One-liner rule for production claims

A product with only `P0-*` verified is **a closed multiplayer beta**, not the full Doodl release. Full production-ready claim requires all required P0 + P1 + P2 rows, release operations and signoff; P2-005 may be out of scope only if explicitly agreed. Any unrun release test => NO-GO for the corresponding tier.

## Required evidence artifacts

Each gate report contains: literal CLI command, timestamp, host OS, server mode (local vs staging), browser versions, Git SHA, test counts pass/fail/skipped, actual screenshots/trace where applicable, inspected raw WebSocket snippets redacted, performance p50/p95 with setup, known defects and owner. If Antigravity lacks a capability, document `BLOCKED` and maintain requirement as unverified, never fabricate.
