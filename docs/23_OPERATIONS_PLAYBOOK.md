# 23 — Operating a public multiplayer game

## Responsibilities before users arrive

There must be a designated owner for uptime, moderation/report intake, account and billing alerts, deployment approval, release notes, incident communication and privacy requests. An AI agent can create runbooks and code, but cannot become a human on-call operator without a separate, verified arrangement.

## Operations dashboard

Track request totals, DO messages, active rooms, p95 join latency, disconnect/reconnect rate, game transition errors, quota consumption, traffic burst alerts, moderation reports and storage failures. Confirm logs are sampled/redacted. Health endpoint should check basic build version and readiness without dumping secrets. Do not expose per-user room code or private nicknames to public telemetry.

## Incident matrix

| Symptom | First response | Recovery test |
|---|---|---|
| WS upgrade 5xx spike | inspect deployment/event errors, stop public matching if needed | two-client reconnect succeeds |
| Secret words leak | block feature/new rooms, revoke tokens if relevant, remove logging path | raw guesser frames redacted and attack tests green |
| Duplicate scores | suspend affected mode, review idempotency+transaction, rollback | retransmit same correct guess 10x, score once |
| Quota near exhaustion | batch/throttle, disable public matching, inspect paid-upgrade risk | stable private games and notice |
| Abusive public room | report/mute/kick/temporary block, preserve minimal evidence | banned seat denied |
| DO storage corruption | stop new sessions, restore tested backup/revision where possible | score and room migration integrity |
| Broken deploy | rollback to known-good build, apply compatibility/version policy | old/new clients behave predictably |

## Support flows

Help page includes common errors, “room expired”, browser compatibility, reconnect, delete artwork, reporting link and contact. Tickets should include optional redacted requestId, browser/OS and timestamp; never ask users to paste session tokens or secret words. Define SLA according to actual staffing; do not invent 24/7 support.

## Cost guards

Run daily quota review during beta, rate limits, generated reports of messages/room and long-running rooms; set alerts when supported. Do not auto-upgrade. On free-tier exhaustion show service temporarily full/try later, not fake matchmaking. Have a planned pause switch and communication copy. Validate current Cloudflare limits before each major scale launch.

## Backups and deletion

Schedule schema/migration checks, DO state versioning, room expirations, optional D1 backup process, deletion requests fulfillment and evidence retention. Restore drill in staging at least once before release and after major schema changes. Handle privacy/legal request escalation to human operator.
