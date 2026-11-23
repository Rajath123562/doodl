# 05 — Guest identity, room lifecycle and disconnect semantics

## Trust boundaries

`roomCode` is an invite locator, **not** authorization to impersonate any player. `seatId` is an opaque public identifier, not secret; `guestSession` and `resumeCredential` are security-sensitive and must never be put in room URLs, logs, DOM-visible public payloads or analytics. Each WebSocket is bound to a validated seat at handshake, with a server-controlled connection epoch. Host/Drawer roles are derived from server membership, never incoming message fields.

## Suggested guest flow (must be implemented consistently)

1. Worker creates a cryptographically random guest session with an appropriate expiry; session cookie ideally Secure, HttpOnly, SameSite=Lax (or stronger where compatibility allows), `Path=/`, bounded TTL. If cookies unsuitable for a deployment origin, document an alternative with equivalent threat model.
2. `POST /api/rooms` requires session + request validation and creates random non-enumerable room code. Worker resolves DO by code, which creates room record and first host seat transactionally.
3. `POST /api/rooms/:code/join` validates cap/password/kick list and reserves seat atomically in DO. Return minimal seat handle and room view, not session secrets in query strings.
4. WS upgrade at `/api/rooms/:code/socket`; authenticate session and a one-time/tightly scoped room join grant, validate Origin and socket caps; server binds socket to `seatId`, room and `connectionEpoch` in connection attachment.
5. Rejoin after ordinary disconnect: same underlying authorized guest can resume seat within default grace; reattaching invalidates previous socket epoch. Browser tab duplicate must prompt takeover or make older tab read-only according to documented rule.
6. Logout/Leave invalidates room seat and revokes resume grants, updates presence; room data still follows retention policy.

Prefer one secret in an HttpOnly cookie and short-lived join tokens where appropriate. Do not rely on `localStorage` as secure storage for permanent bearer secrets; if used for low-trust guest UX, document XSS exposure and compensate with short scope/expiry. Implement CSRF defense for cookie-backed state-mutating HTTP endpoints (same-site + Origin/check/CSRF as applicable).

## Lifecycle and timeouts (proposed defaults)

| Item | Proposal | Test |
|---|---|---|
| Seat reconnect grace | 20 seconds, unless kicked or explicitly left | refresh preserves score/role |
| Disconnected drawer grace | 10 seconds; if not back, skip turn without reward | round never stalls |
| Disconnected host transfer | after 20 seconds to oldest connected eligible seat | exactly one host |
| Empty lobby | close after 15 minutes idle | old code rejected |
| Completed room | preserve results up to 30 minutes, then expire | no accidental indefinite data |
| Active room hard inactivity | 2 hours without meaningful player activity; end safely | no orphaned alarms |
| Join credential | short TTL; rotate on reconnect | replay/old grant rejected |
| Pending word selection | 10s, auto-select fallback | no indefinite selecting |

Server time is authoritative. Timing options are examples requiring explicit config + tests. If `20_DEFINITION_OF_DONE` disagrees, add ADR and reconcile specs.

## Seat state machine

`NEW -> JOINED_CONNECTED -> TEMP_DISCONNECTED -> RECONNECTED` or `EXPIRED/LEFT/KICKED`. Kicked seats cannot resume with old grants. `LEAVING` cleanup must be idempotent. A player who joins mid-match is **queued for next match** by default and cannot guess or become current drawer until roster reset; show this clearly. Spectators are not counted toward min players or scoring.

## Atomicity and TOCTOU

Every join, host assignment and capacity check must execute in owning room DO with serialized authoritative decision. Don't read a room count from D1 then write separately without CAS. Two simultaneous last-seat attempts result in exactly one success. Host transfer deterministic by joinedAt + stable seat ID. A socket upgrade racing with kick/leave must re-evaluate seat status. Never grant host privileges based on client being “first user” outside the room state.

## Recovering after DO hibernation

Persist canonical match state/deadlines/score/active strokes or compaction checkpoints in DO storage; serialize per-socket seat/epoch metadata. On wake read `deserializeAttachment` and storage; reconstitute version and reconnect mapping. Reconcile expired deadlines via alarms or on-request without double transitions. **Do not trust in-memory `Map`s after hibernation.** Test actual sleep/wake or a close simulation that reloads the DO instance.

## Room password

Never echo raw password or append to invitation URL. Salted and resource-cost-appropriate hash or platform cryptographic equivalent, compare in safe manner and throttle guesses. Host can reset password and revoke old join grants, not necessarily eject current room members unless explicit. Even if room code is long/random, do not treat code + nickname as session authentication.

## Duplicate connections

Allow only one active controlling socket per seat. New valid connection increments server `connectionEpoch`; prior socket receives `SESSION_TAKEN_OVER` and becomes unusable. A stale socket sending a correct guess, canvas clear, host setting or score-affecting action must be denied even if transport still open. Persist epoch or take equivalent durable authority across wake.

## Resilience tests

Simultaneous join; room at capacity; host+drawer disconnect; same user opens 3 tabs; old token replay; reconnect during SELECTING_WORD, DRAWING, REVEAL, and MATCH_RESULTS; late join during match; room expiry while client suspended; clock offset; durable object cold wake; revoked user tries WS direct; server crash between score and acknowledgment; exact threshold boundary `t=deadline`.
