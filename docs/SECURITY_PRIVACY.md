# Security, moderation and privacy contract

## Threat model

Hostile users can alter browser JS, issue raw WebSocket requests, forge payloads, spam events, brute-force join codes, exploit reconnect, inject HTML, stalk via room directory, flood storage/CPU and exploit game timing. The browser is not trusted, even if a UI hides a control.

## Must-have protections

1. **Server identity and auth**: cryptographically random guest session IDs or signed short-lived seat capability, least-privilege scopes, secure `HttpOnly; Secure; SameSite` cookie design where appropriate; avoid bearer tokens in persistent URLs/logs. New browser session must not hijack an existing seat by submitting nickname/playerId.
2. **Join code security**: unpredictable server-generated private codes (~40 bits or stronger) plus joining throttles, with room visibility controls and optional password hashing. Rate-limit invalid codes, avoid enumeration through API responses.
3. **Message validation**: Zod strict objects/allowlisted types, max payload bytes before JSON parse, max field lengths, valid numbers (no NaN/Infinity), rate limits per IP+session+seat, avoid event amplification.
4. **Roles**: ensure only server-designated drawer can draw/choose word; only host can modify settings/kick/mute/start; only eligible guessers can guess; authorized seat checks **on every action**.
5. **Word secrecy**: never send `secretWord`, candidates, raw answer or easy answer hash to guessers before reveal. Correct-guess chat must be redacted. Never place answer in public route, DOM data attribute, traces, analytics or user-facing logs.
6. **Scoring**: clients cannot submit scores, start/stop clock, advance rounds, send right/wrong status, create XP awards or replay old messages for duplicated points.
7. **Text and XSS**: render nicknames/chat/custom words as text, never unchecked `innerHTML`; robust Unicode validation and content filters; escape outputs even if inputs were validated.
8. **Moderation**: mute/kick/report, host permissions, message spam throttles, report codes, optional safer-word pack defaults, profanity and hateful content filtering, blocklist for public rooms. No arbitrary avatar/image uploads until moderation exists.
9. **Sensitive data**: minimize IP storage, never expose full IPs in room responses, keep audit retention limited, do not log session tokens or profanity words unnecessarily. Set a published privacy/retention policy before release.
10. **Art ownership/privacy**: default browser-local artwork, opt-in cloud save, explicit private/public gallery controls, deletion path, no automatic publication of drawings or recordings, clear minors/community safety position.
11. **Cost abuse**: size/canvas/bandwidth caps and quotas, Cloudflare security controls, no expensive per-stroke persistent SQL writes, error budgets, alerts and account spending limits.
12. **Transport**: HTTPS/WSS in production, origin verification, CSRF protections for cookie-authenticated mutation APIs, CORS not wildcard with credentials, no secrets in Git.

## Required adversarial tests

- Join with guessed/fake `playerId` cannot hijack another user or become host.
- Send draw, clear, choose word, kick, game start from guesser/spectator gets rejected.
- Replay a correct guess with new or duplicated event IDs never doubles awards.
- Guess with `points:100000`, `correct:true`, `secretWord:"..."` gets rejected/ignored with validated schema.
- Hijack/reuse a stale resume token: safely denied or replaced without duplicate seat.
- Send 2MB draw event and 1000 events/s from one attacker; server throttles without corrupting game.
- HTML/script in nickname/custom word/chat always rendered as text and moderated.
- Request room snapshot as outsider; never includes private secret or credentials.
- Disconnect exactly during score award; no duplicate credit or desync.
- Send events after deadline or for old `turnId`; no effect.

## Data inventory (to make explicit before public launch)

| Data | Necessary? | Default retention | User control |
|---|---|---|---|
| Guest opaque session | Yes for reconnect | Expiry-limited | Leave/reset where feasible |
| Nickname/avatar | Yes | Current room/optional browser preference | Edit |
| Room membership/scores | Yes | Active match + brief retention | Room expiration |
| Word/draw events | Yes temporarily | Match duration + short replay TTL | End/expire, opt-in save |
| Chat | Optional | Bounded recent history, not indefinite | Moderation/report |
| Saved art/replay | No | None server-side by default | Explicit opt-in save/delete/export |
| Performance/abuse logs | Limited | Short operational policy | Privacy disclosure |

These are suggested policies; the shipping game needs a final published policy aligned with actual implementation and applicable rules.
