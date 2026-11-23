# 09 — Security threat model and preventive controls

## Assets and attacker capabilities

Assets: room privacy, seat identity, secret word, score integrity, published art, human safety, billing quotas, private guest/session credentials, moderation evidence. Attacker may open browser devtools, edit JavaScript, automate HTTP/WS, send malformed JSON, join multiple seats, guess brute-force, replay old events, forge host/drawer role, steal leaked invite URL or abuse chat/drawings. Network/Cloudflare and end-user devices may be unreliable. Public room code should not enable account takeover.

## Security controls mapped to threats

| Threat | Required controls | Automated attack test |
|---|---|---|
| Client awards score | server-only calculation, strict schema | inject `points:999999`, verify no award |
| Secret word leaked | role redaction, no logging, no client bundle encoding | inspect guesser snapshot, all frames, logs |
| Guest hijack | signed/opaque session, WS handshake grant, epoch, expiry | fake seat ID/expired grant/stale socket |
| Host privilege spoof | room state permission derived from seat | guesser sends `room.start` or kick |
| WS origin/session CSRF | allowlist origin, CSRF protection, secure cookies | malicious Origin handshake denied |
| Message flooding/cost DoS | per-session/IP/room adaptive rate + size caps | burst 1000 msg/s, 2MB frame rejected |
| XSS | React text rendering, sanitize custom words, CSP | `<img onerror=...>` in nickname/chat |
| Password probing | slow hash with salt or robust equivalent, throttle, no URL credentials | brute force/collision abuse |
| Score replay | idempotency store, per-turn once, atomic writes | duplicate clientEventId/new ID after correct |
| Drawing vandalism | drawer-only event authorization and per-canvas ownership | spectator/guesser draw.clear |
| Room enumeration | random high entropy code, no public private index, auth | sequential/random probing rate limited |
| Storage/amplification attack | max size/caps, checkpoint compaction, expiry, quotas | huge draw batch and >12 seats |
| Leaderboard farming | verified identity/signed completion/abuse heuristics | refresh/multi-tab challenge XP |
| Harassment | report/mute/kick, message filters and moderator runbook | muted seat sends chat/draws |
| Dependency compromise | lockfile, vulnerability scan, minimal deps, CI | audit dependencies before release |

## Secure event validation pipeline

`upgrade + Origin/session verification -> bound seat and connection epoch -> protocol version -> strict schema parse -> limits/rate -> check membership/role/phase/match/turn -> idempotency -> authoritative apply (transaction) -> sanitized response -> broadcast only to authorized scopes`.

No client-provided `playerId` is ever trusted as authority, even when allowed as an informational ID. Reject unknown fields for sensitive commands. Numeric values must be finite and within bounds; arrays bounded; use constant-memory parsing and max JSON frame before JSON.parse to avoid high allocations. Chat/word Unicode grapheme length validation and normalization handled consistently.

## Defenses in depth

- HTTPS, WSS, security headers, strict CSP adapted to actual assets, appropriate `Permissions-Policy`, Referrer-Policy, no open CORS + credentials. XSS tests on custom emoji/stickers, markdown and interpolation.
- Requests per IP alone not enough behind NAT or mobile network; combine session/room/proof-of-work only if warranted. Rate-limit per event class (guess max 2/s and burst 5, chat max 1/s burst 4, stroke batch max 30/s, joins max 5/min per session as initial tunable ceilings). Test effects on genuine fast artists.
- Store only hashed tokens in durable storage where feasible; redact logs. Rotate credentials and invalidate on kick/logout. Do not put bearer token in URL fragment/query during normal operation.
- No third-party analytics SDK capturing chat text or raw canvas events. No remote unreviewed script injecting into game page.
- Prevent secret word leakage via React query caches, hydration payload, browser prefetch, WebSocket replay, server error, analytics, data export and spectator snapshots.
- Secret word is not safe as a plain hash because dictionary brute force is trivial. Redact entirely until reveal.
- In public rooms disallow arbitrary custom words by default or enforce reviewed list. Disallow public gallery/DMs before user-safety infrastructure exists.

## Incident response and vulnerability intake

Define security contact, reproducible report channel, severity matrix, response owner, immediate kill switch for public matchmaking, token invalidation and forced protocol upgrade. Track time to mitigation and rollback. If secret words or session tokens are logged, treat as incident: stop logging, revoke affected secrets, delete logs where possible, and investigate exposure. No public “secure” guarantee absent expert review.

## Required check

Use external browser/WS script to send 30 adversarial payloads across roles, including wrong origin, expired credential, oversized JSON and stale turn. Show actual response codes and DB score invariants. Run after every protocol/game-engine change. See `QA_TEST_MATRIX.md` and `24_EDGE_CASE_MATRIX.md`.
