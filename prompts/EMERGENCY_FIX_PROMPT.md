# Antigravity repair prompt — fix all *verified* defects, no regressions

Stop feature work. Audit working tree and `IMPLEMENTATION_STATUS.md` against `docs/QA_TEST_MATRIX.md`. Reproduce the reported failure in the actual running app; capture exact console/server errors and the relevant WebSocket payloads (sanitizing secrets). Write a failing regression test first, fix the root cause, and rerun the smallest related test suite followed by all unit/integration/E2E suites. Do not paper over the error with fake state, mock data, disabled validation, suppressed logs, removed tests, or arbitrary timeouts.

For every defect, provide: defect ID, exact reproduction, actual vs expected, root cause, files changed, test added, test command/output, whether affected flows passed in two real browser contexts, and remaining risk. Stop and mark NO-GO if you cannot verify repair. Preserve working user data and Git checkpoint; no silent destructive resets.
