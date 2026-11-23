# Formal release signoff — MUST NOT be filled by imagination

**Candidate version:** ____  **Git commit:** ____  **Staging URL:** ____
**Release claim:** [ ] P0 private beta [ ] P1 public beta [ ] P2 full product
**Reviewer/operator:** ____  **Review date/time:** ____

## Architecture and gameplay
- [ ] Two independent humans can join and finish Classic match, play again and verify exact scores.
- [ ] Raw guesser frames/snapshots/logs contain no secret before REVEAL.
- [ ] Unauthorized frames cannot mutate room/score/draw/word/settings.
- [ ] Drawer and host disconnections, hibernation and duplicate clients recover predictably.
- [ ] Every advertised P1/P2 mode actually passes its mode-specific tests.

## Technical quality
- [ ] CI lint/typecheck/unit/integration/E2E/build green on release commit, counts attached.
- [ ] Browser desktop/mobile screenshots, keyboard navigation, reduced motion, Safari/Android evidence attached.
- [ ] 2/6/12 seat load with measured p50/p95 latency; 30min soak without severe leak.
- [ ] Dependency audit, CSP/cookie/CSRF/Origin/WS size/rate checks completed.
- [ ] No Critical/High unresolved issues, bugs listed and release decision explained.

## Operations and safety
- [ ] Report/mute/kick mechanism and actual moderation owner confirmed.
- [ ] Privacy/community/help/terms reviewed; retention and deletion tested.
- [ ] Cloudflare pricing and free-tier safety budget freshly reviewed; no unauthorized paid resources.
- [ ] Staging URL smoke from independent networks, monitoring/alert drill and rollback drill passed.
- [ ] Secret scanning passed; no session secrets or answer words in telemetry.
- [ ] Versioned migration, logs, feature flags, public matchmaking kill switch documented.
- [ ] Trademark/brand/domain and asset licensing checked before commercial release.
- [ ] User explicitly authorized deployment.

**Decision:** [ ] GO_PRIVATE_BETA [ ] GO_PUBLIC_BETA [ ] GO_FULL_RELEASE [ ] NO_GO
**Reason and evidence paths:** ____

If any critical item unchecked or not run, outcome MUST be `NO_GO` for the claimed tier. A green website build alone is insufficient.
