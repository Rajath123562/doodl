# Phase 11 — External staging / real user acceptance

Prerequisite: complete P0/P1/P2 claims independently verified locally, no P0/P1 bugs, migrations/backups documented. Obtain **user authorization** before Cloudflare login/deploy/account action.

Deploy staging with isolated namespace/resource bindings and a non-production domain. Run 2+ human/browser clients on distinct networks. Test actual drawing, scoring, word secrecy, reports, guest reconnect, mobile soft keyboard, screenshot layouts and failover. Confirm release health monitoring, logs, quotas, CSP/cookie settings, robots/metadata and privacy/community pages. Conduct manual smoke QA by real players and record notes. Run rollback drill (or safe equivalent in staging) and recover state. Do not silently migrate production data.

**Gate:** staging URL recorded and actually opened by two independent clients; test artifacts exist; security/account approvals documented; no unresolved release blockers; `RELEASE_REPORT.md` prepared with precise release-tier caveats.
