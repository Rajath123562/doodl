# Antigravity Phase 8 — Security, abuse resistance, stress tests and zero-regression audit

Review entire implementation as if it will be attacked by real public users. Read `docs/SECURITY_PRIVACY.md`, `docs/QA_TEST_MATRIX.md` and `docs/DEPLOYMENT_OPERATIONS.md`.

- Execute adversarial raw HTTP/WS tests against nickname/chat/custom words, host permission bypass, guessed role claims, correct-word leakage, duplicated scores, replay attacks, stale turn events, oversized input, event flooding and invite enumeration.
- Run real 2, 6, 12-player scenarios; test host/drawer/guesser leaving at critical state transitions. Simulate network interruptions, reconnect, mobile keyboard and slow connections.
- Run 30-minute soak where possible, capture CPU, memory, WS message rate, snapshot growth and p50/p95 observed drawing latency. Do NOT invent measurement results.
- Dependency audit and lockfile review; CI with typecheck, lint, unit, integration, E2E, build. No skipped security tests dressed as pass.
- Inspect guest token and WebSocket origin, CSRF/cookie semantics, input limits, storage TTL, free-tier operation consumption and secrets logging.
- Verify gallery privacy, user report/moderation UI and removal behavior; publish honest retention policy for actual data collected.

## Release decision

Produce `SECURITY_AUDIT.md`, `TEST_REPORT.md`, `PERFORMANCE_REPORT.md` with exact commands, environment, pass/fail/skip, reproduction notes, fixes committed and unresolved severity. If high/critical issues or Classic regressions remain, mark **NO-GO** and fix them before proceeding. No artificial '100% quality' score.
