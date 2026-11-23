# 08 — Versioned API and WebSocket contract

All endpoints run over HTTPS in production and return JSON with consistent `requestId`, `code`, `message`, `retryable` for errors. Explicitly validate `Content-Type`, body limit, Origin on mutations/WS, session and seat auth, host role, and per-session rate. Correct words must not appear in guesser-visible error or debug responses.

## Suggested HTTP routes (exact methods must be implemented, documented and tested)

| Method and path | Access | Behavior | Success / error |
|---|---|---|---|
| `GET /api/health` | public limited | readiness/version; no secrets | `200 {status:'ok',version}` |
| `POST /api/guest` | anonymous + Origin | mint or validate bounded guest | cookie+200; 429 |
| `POST /api/rooms` | guest | create private/public with settings | `201 {roomCode,roomView}`; 400/429 |
| `GET /api/rooms/:code` | appropriately authorized | safe lobby preview (private data redacted) | 200/404/410 |
| `POST /api/rooms/:code/join` | guest | reserve seat/password, cap and ban checks | `200 {seat,roomView}`; 403/409/410 |
| `POST /api/rooms/:code/leave` | joined seat | revoke seat; idempotent | `204` |
| `POST /api/rooms/:code/join-grant` | joined seat | short-lived WS grant | `200 {grant,expiresAt}` |
| `GET /api/rooms/:code/socket` | joined + grant | WebSocket 101 upgrade; bound seat | 101/401/403/410 |
| `POST /api/matchmaking/quick` | guest | atomic real queue placement | 200 room or 202 search state |
| `DELETE /api/matchmaking/quick` | queued | cancel queue without ghost entries | 204 |
| `GET /api/daily` | guest | today challenge config (no hidden answers) | 200 |
| `POST /api/daily/complete` | guest | once-only verified completion | 200/409; no client XP trust |
| `GET /api/profile` | guest | minimal current profile | 200 |
| `PATCH /api/profile` | guest | avatar/nickname prefs validated | 200 |
| `POST /api/reports` | guest / room member | abuse report with bounded evidence | 202 receipt ID |
| `DELETE /api/gallery/:id` | owner only | delete optional cloud save | 204 |

For room code URL joins, don't expose full private roster until member authorization; use safe preview. Document HTTP idempotency keys for create/join to avoid accidental duplicate room or seat under retry.

## WebSocket envelope

```json
{
  "v": 1,
  "type": "guess.submit",
  "clientEventId": "fe7aab0e-1c83-4ea4-92a4-844afde67de2",
  "matchId": "m_102",
  "turnId": "t_013",
  "payload": {"guess":"bicycle"}
}
```

Server broadcasts `seq` monotonic and `stateVersion`, binds identity to actual socket, and accepts **no** `seatId`, `score`, `correct`, `deadlineAt`, `isHost`, `isDrawer` authority field from client. Type-specific zod strict schemas, max frame size and bounded nested arrays required.

## Core client -> server intents

`room.setSettings`, `room.start`, `room.kick`, `room.mute`, `room.transferHost`, `word.select`, `stroke.begin`, `stroke.append`, `stroke.end`, `draw.undo`, `draw.redo`, `draw.clear`, `guess.submit`, `chat.send`, `reaction.send`, `round.hintRequest`, `sync.request`, `room.playAgain`, `room.leave`, `duel.guess`, `team.assign` (lobby host only). Never accept authoritative transition/scoring events from client.

## Core server -> client events

`room.snapshot` (role-redacted), `room.memberJoined`, `room.memberLeft`, `room.memberUpdated`, `room.settingsChanged`, `room.hostChanged`, `match.start`, `turn.wordChoices` (drawer only), `turn.started` (public masked info), `turn.hint`, `turn.timerSync`, `drawing.ops` (verified ops with seq/canvasId), `guess.privateFeedback`, `guess.publicCorrect` (no word), `chat.message` (safely filtered), `reaction.broadcast`, `turn.reveal` (public only after turn), `round.results`, `match.results`, `room.restarting`, `error`, `connection.superseded`, `room.closed`.

## Ordering, idempotency, protocol version

- Every accepted event gets room-authoritative seq. Clients ack highest applied seq (optional) and request `sync.request` with last seq/version. Server can send full `room.snapshot` and stroke checkpoint with tail.
- `clientEventId` cryptographically random UUID-style and deduplicated on `(seat, turn)`. Stale match/turn rejected; exact deadline boundary deterministic.
- Unknown `v` gets `UPGRADE_REQUIRED` with server-supported version; never attempt to parse unsafe ambiguous fields.
- Max frame JSON 64KiB; chat 300 Unicode graphemes; nickname 20 graphemes; custom word cap/count separately; strokes points per batch <=200, max batch <=64KiB and rate capped.
- Idle ping/keepalive policy does not prevent hibernation unnecessarily. Prefer Hibernation API and managed auto-reply where supported.

## Secrets and redacted snapshots

A guesser snapshot can include `phase`, `round`, `turnId`, `maskedWord`, `revealedHintIndexes`, `players`, `mySeat`, `scoreboard`, `timer/deadline`, `drawingCheckpoint`, `lastSeq`, `rateLimitInfo`, `mode`, but **no** `secretWord`, `candidateWords`, `answerHash`, `correctAnswer`, chat unredacted correct guesses, drawer credentials or private reports. Drawer snapshot additionally includes only its authorized candidate words/selected word. Spectator may get further redaction and safe reveal delay.

## Error catalog codes

`INVALID_INPUT`, `ROOM_NOT_FOUND`, `ROOM_EXPIRED`, `ROOM_FULL`, `WRONG_PASSWORD`, `NOT_IN_ROOM`, `NOT_HOST`, `NOT_DRAWER`, `ALREADY_GUESSED`, `STALE_TURN`, `RATE_LIMIT`, `GUEST_EXPIRED`, `SESSION_TAKEN_OVER`, `SESSION_REVOKED`, `UNSUPPORTED_VERSION`, `MATCH_ALREADY_RUNNING`, `SERVICE_UNAVAILABLE`, `STORAGE_QUOTA`, `REPORT_RATE_LIMIT`. Client must map code to clear localized message (see `19`).

## Exact error example

```json
{"v":1,"type":"error","code":"STALE_TURN","message":"That round has ended.","retryable":false,"requestId":"r_9c","stateVersion":104}
```

Never leak stack traces, secrets or hidden answers in errors. Do not rely only on error text for client branching.
