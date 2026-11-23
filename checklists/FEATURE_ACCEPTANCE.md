# DOODL feature acceptance checklist — agent MUST fill with real evidence

No check mark is pre-checked. Antigravity must replace boxes only after actually implemented and proven with test link, date, commit and environment in `app/docs/REQUIREMENT_TRACEABILITY.md`. This is an expectation checklist, not evidence of a complete application. See exact IDs and proofs in `docs/20_DEFINITION_OF_DONE_AND_TRACEABILITY.md`.

## P0 — multiplayer closed beta

- [ ] P0-001 — Nickname entry, safe Unicode and honest validation
- [ ] P0-002 — Secure room creation & idempotency
- [ ] P0-003 — Real two-browser joined seats and live roster
- [ ] P0-004 — Private/password/full/expired room behavior
- [ ] P0-005 — Host-only settings/start/kick/mute/transfer
- [ ] P0-006 — 2-player start and 12 seat cap under race
- [ ] P0-007 — Authoritative phase machine/DO deadline recovery
- [ ] P0-008 — Drawer-only secret candidates, no guesser leaks
- [ ] P0-009 — Correct Classic cycles and turn rotation
- [ ] P0-010 — Smooth pencil/eraser/colors/width on mouse/touch/pen
- [ ] P0-011 — Network draw, undo, redo, clear, late join/reconnect
- [ ] P0-012 — Guess correctness and word-safe chat
- [ ] P0-013 — Exactly-once authoritative score and drawer reward
- [ ] P0-014 — Server hints/mask and reveal timing
- [ ] P0-015 — Round/match results and Play Again
- [ ] P0-016 — Secure guest/reconnect/duplicate-tab handling
- [ ] P0-017 — No stuck state on dropout/midmatch join
- [ ] P0-018 — XSS prevention, basic host moderation/report
- [ ] P0-019 — Desktop/mobile responsiveness and pointer accuracy
- [ ] P0-020 — Accessible keyboard/dialogs/motion/contrast
- [ ] P0-021 — WS validation, throttle, bounded payload
- [ ] P0-022 — Real local/staging 2-browser E2E and test logs
- [ ] P0-023 — Privacy, rules, retention, support pages reflect code
- [ ] P0-024 — Metrics, quotas, rollback and safe staging

## P1 — complete polished V2 feature set

- [ ] P1-001 — Real Quick Play or truthful no players
- [ ] P1-002 — Original categories/private custom words and safe normalization
- [ ] P1-003 — Rainbow, line, shapes, stickers and custom colors synced/replayed
- [ ] P1-004 — Avatar Studio with actual saving/sharing
- [ ] P1-005 — Art gallery private opt-in save/delete
- [ ] P1-006 — Correct PNG export
- [ ] P1-007 — Correct drawing replay controls
- [ ] P1-008 — Daily Doodle 60 second UTC prompt/attempt policy
- [ ] P1-009 — XP, levels, achievements and streaks with honest persistence
- [ ] P1-010 — Blitz mode authoritative server timer and scores
- [ ] P1-011 — Emoji reactions rate and reduced-motion tested
- [ ] P1-012 — Locales architecture and released word packs human reviewed
- [ ] P1-013 — Senior-level UI/UX quality across states and routes

## P2 — unique modes

- [ ] P2-001 — Drawing Duels dual authorized canvases and fair scoring
- [ ] P2-002 — Chaos Mode bounded server-seeded modifiers
- [ ] P2-003 — Team Battles balanced roster & authoritative scoring
- [ ] P2-004 — Spectator mode securely redacted and capacity bound
- [ ] P2-005 — Any advertised friend/tournament/ranked feature secure, or explicitly excluded from release scope

## Release operations

- [ ] REL-001 — Required tests/scripts all passing, no Critical/High issues
- [ ] REL-002 — 12-player load, 30min soak, iOS+Android and network loss evidence
- [ ] REL-003 — Staging with two true independent users/networks and quota controls
- [ ] REL-004 — Rollback/alerts/moderation/privacy/support active
- [ ] REL-005 — User approved public deploy; all release claims evidence-backed

**Completion summary:** [ ] P0 verified  [ ] P1 verified  [ ] P2 verified  [ ] Full operations signed off. All initially unchecked by design.
