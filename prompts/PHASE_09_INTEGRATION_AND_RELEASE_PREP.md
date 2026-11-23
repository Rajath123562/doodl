# Antigravity Phase 09 — Integrate all features and prepare for release (NOT public deployment)

Prerequisite: Classic, P1 and all claimed P2 mode tests verified, Phase 8 security findings resolved or explicitly blocked. Read master, `docs/20_DEFINITION_OF_DONE_AND_TRACEABILITY.md`, `checklists/FEATURE_ACCEPTANCE.md` and `docs/15_DEPLOY_RELEASE_ROLLBACK.md`.

1. Audit every visible button/route/control. Replace no-op stubs, fake friends, fake leaderboard, fake Quick Play and simulated socket with real feature or disable feature truthfully with release-scope update. Inspect bundle/source for static players/guesses and suspicious debug bypasses.
2. Integrate route navigation, guest profile, invites, all role-specific toolbars, Chat vs Guess channels, word secrecy, scoreboard, mobile keyboard and reconnect. Test end-to-end with 2/6/12 actual simulated load sockets (not screenshot-only).
3. Review DO/Worker state versioning, protocol schema, type imports and build config for compatibility. Validate SQLite migrations, hibernation recovery, timed alarms, old-client update handling, source maps and rate caps.
4. Ensure actual scripts: lint, typecheck, unit, integration, E2E, build, deploy staging and production with dry-run/approval guard. Document exact command use in README.
5. Finalize original asset inventory, external library license obligations, English word bank safety, accessibility audit, privacy/community/help pages and report intake.
6. Create `app/docs/REQUIREMENT_TRACEABILITY.md`, `IMPLEMENTATION_STATUS.md`, `RELEASE_REPORT.md` draft, bug ledger and operator docs; no unverified checked boxes.
7. Run full regression and record current release tier. **Do not deploy staging until Phase 11 authorization**; **do not publish until Phase 12 signoff/user approval**.

**Gate:** no Critical/High unresolved code defect, no misleading advertised feature, all claimed P0/P1/P2 requirements mapped to runnable tests and evidence, pipeline reproducible, privacy and reports verified, architecture docs updated. Report GO/NO-GO honestly.
