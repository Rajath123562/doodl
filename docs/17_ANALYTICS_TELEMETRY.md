# 17 — Observability, user-centric metrics and privacy-safe analytics

## Instrumentation goals

Detect real game failures, bottlenecks, abuse and free-tier exhaustion without secretly collecting word answers, chat contents, precise location or session tokens. Data is for operations and aggregate UX learning; no mandatory tracking SDK.

## Core event metrics (aggregate)

`room_create_total`, `room_join_success_total`, `room_join_fail_total{reason}`, `ws_upgrade_total`, `ws_disconnect_total{codeClass}`, `room_active_gauge`, `match_started_total{mode}`, `match_completed_total{mode}`, `turn_timeout_total`, `game_transition_error_total`, `draw_batches_in_total`, `draw_bytes_in_total`, `guess_correct_total`, `guess_rejected_total{code}`, `report_submitted_total{category}`, `rate_limit_total{eventClass}`, `session_takeover_total`, `reconnect_success_total`, `storage_error_total`, `budget_soft_limit_total`.

## Structured logs

Fields: ISO timestamp, application version/commit, correlation ID, endpoint/event type, sanitized error code, anonymized room hash (not full code), latency duration, state version, resource usage bucket, no PII. Sample high-frequency successful stroke log events; never log every point or guess text. Redact query strings/cookies and authorization headers automatically; test redaction by synthetic secrets. Correlate client error banner ID with server log via request ID.

## Service quality indicators

Game match completion success rate; failed join rate; crash/reconnect attempt rate; p95 end-to-end visible stroke delay measured with synchronized test clients; storage write failures; expired/ghost room count; unauthorized acceptance count (should always be zero); quota burn rate. Define SLO only after real baseline exists. Example beta candidate: >=99% successful room create/join under normal conditions and no known score divergence; do not publish as achieved before measuring.

## Privacy-aware product metrics

Opt-in/aggregated counts for private room vs Quick Play use, successful guest onboarding, first round completion, drawing tool usage, Daily participation, early quits. Do not derive cross-site user tracking or sell data. Public leaderboards are not analytics; require fair identity and anti-cheat.

## Monitoring and alert drills

Trigger synthetic failed WS upgrade, room storage exception, stale-turn rejection, quota warning, API 5xx spike and verify operators receive signal and users see retry/maintenance state. Test dashboard permissions, alert fatigue/cost and data retention. Confirm no secrets/word candidates appear in logs, traces, metrics labels or exported bug reports.
