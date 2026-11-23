# DOODL — final independent production-readiness audit

Act as a skeptical external principal engineer + security auditor + game QA lead. **Previous implementation reports are claims until independently reproduced.** Review every requirement from `docs/20_DEFINITION_OF_DONE_AND_TRACEABILITY.md`, `checklists/FEATURE_ACCEPTANCE.md` and the code; confirm user-visible features match real runtime evidence. This prompt belongs at the end of Phase 12 before any public release.

## Required audit execution

1. Check `app/IMPLEMENTATION_STATUS.md` and traceability; inspect every advertised route/button/UI control for actual backend/API/data path, and list simulated or incomplete features.
2. Run literal `npm ci`, lint, typecheck, unit, Worker/DO integration, multi-browser E2E and build; inspect all failures/skips. Do not replace actual test commands with echo stubs. Record environment/version/time/commit.
3. Two isolated browser contexts independently create/join, select word, draw, receive drawing, guess, score, complete match and restart. Inspect **raw guesser WS traffic** for hidden answer/candidates/hashes before reveal. Probe HTTP routes and server errors for leaks. Reload drawer and guesser while playing and compare scores/drawing/room state.
4. Send malicious WS/HTTP inputs from nonhost, nondrawer, nonmember, spectator, stale session, expired grant, oversized frame, repeated correct guess and old turn. Assert server refuses and state doesn't mutate. Validate Origin/CSRF/cookie/cap/rate limits.
5. Reproduce 2/6/12-player match cases, host+drawer dropout, multi-tab takeover, DO alarm wake, capacity race, scene checkpoint+tail and timer boundary. Run at least 30min soak and report measured CPU/memory, message counts and p50/p95 latencies with test conditions.
6. Inspect images/screens 320/390/768/1280/1440 including mobile chat keyboard, screen reader basics, reduced motion, safe area and landscape. Run manual Android Chrome and iOS Safari checks. Inspect word-pack Unicode matching with human-reviewed translations when shipped.
7. Verify P1 avatar/gallery/replay/PNG/Daily/XP/Blitz/QuickPlay and P2 Duels/Chaos/Teams/spectator independently, including cheating/abuse and deletion. Incomplete P2 must remain clearly labelled, not concealed by marketing.
8. Verify privacy/Terms/community/support links and policy accuracy, moderation inbox owner, asset licensing/trademark checks, telemetry secrecy, cost/quotas, deployment approvals, alerts/rollback and staging release logs.
9. Verify staging URL by actually opening on independent networks; no invented URLs. Execute rollback drill or record BLOCKED. Ensure user approved any public deploy/paid resource.
10. For ALL 47 acceptance IDs, report `PASS`, `FAIL`, `NOT_RUN`, or `OUT_OF_SCOPE_APPROVED` with evidence reference and severity. No skipped security test counts as PASS.

## Deliverables

`SECURITY_AUDIT.md`, `PERFORMANCE_REPORT.md`, `TEST_REPORT.md`, `VISUAL_QA_REPORT.md`, `RELEASE_REPORT.md`, updated feature ledger/traceability and defects by severity. Each lists actual commands and screenshots/traces, no fabricated evidence.

## Decision

Return only one accurate verdict for the claimed scope:

- `GO_P0_PRIVATE_BETA` — all P0 and release requirements for closed beta passed; P1/P2 not claimed.
- `GO_P1_PUBLIC_BETA` — all P0/P1 and public-safety/operations gates passed; P2 not claimed.
- `GO_P2_FULL_RELEASE` — all required P0/P1/P2 plus operations and explicit user launch approval passed.
- `NO_GO` — unresolved critical/high issue, unverifiable required proof, security/privacy gap, missing authorization or broken user workflow.

**Never say 100% bug-free, perfectly secure, unlimited-free or complete production application without verifiable feature and operational signoff.**
