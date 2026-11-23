# Real-time WebSocket protocol — definitive v1 contract

> **Canonical:** This file, `docs/08_API_AND_WS_ENDPOINT_CONTRACT.md` and `contracts/client-event-envelope.schema.json` use exactly the same client envelope and intent names. V2's obsolete `{id,roomCode,data}` protocol is invalid and must not be implemented. All client actions are non-authoritative *intents*.

## Client envelope and example

```json
{
  "v": 1,
  "type": "guess.submit",
  "clientEventId": "fe7aab0e-1c83-4ea4-92a4-844afde67de2",
  "matchId": "m_102",
  "turnId": "t_013",
  "payload": { "guess": "pizza" }
}
```

Mandatory: `v`, `type`, `clientEventId`, `payload`. Optional `matchId`,`turnId` for non-turn intents; mandatory for turn-specific action at per-type schema. NO `seatId`,`roomCode`,`score`,`role`,`isHost`,`isDrawer`,`deadlineAt` fields trusted from client. Server binds user/room to authenticated socket/session/route. Enforce max serialized WS frame size 64KiB *before* JSON parsing, per-event strict Zod, per-session/seat rate limits, phase/role/canvas authorization and idempotency.

## Server message pattern

```json
{
  "v": 1,
  "type": "guess.privateFeedback",
  "seq": 183,
  "stateVersion": 55,
  "serverTimeMs": 1795366320000,
  "matchId": "m_102",
  "turnId": "t_013",
  "payload": { "status": "CORRECT", "awardedPoints": 350 }
}
```

`seq` monotonically increases per room, `stateVersion` after committed mutation; `serverTimeMs` only from server. Event ack/retransmit rules defined per type. Public correct event has player display ID/name **without the secret word**. Error contains `code`, `message`, `retryable`, correlation ID, never stack/credentials.

## Client intents and payload restrictions

| Type | Payload | Authorized role, phase, behavior |
|---|---|---|
| `room.setSettings` | validated settings object | host only, lobby |
| `room.start` | empty | host and ≥2 connected eligible seats, lobby |
| `room.kick` | `{targetSeatId}` | host, target not self unless Leave |
| `room.mute` | `{targetSeatId,durationSeconds}` | host, bounded |
| `room.transferHost` | `{targetSeatId}` | host, eligible target |
| `room.playAgain` | empty | host, MATCH_RESULTS |
| `room.leave` | empty | joined seat, idempotent |
| `word.select` | `{candidateId}` | current drawer, SELECTING_WORD, bound turn |
| `stroke.begin` | `{strokeId,canvasId,tool,color,size,point}` | authorized drawer/canvas, DRAWING |
| `stroke.append` | `{strokeId,points[]}` | authorized drawer/canvas/stroke; <=200 points |
| `stroke.end` | `{strokeId,point?}` | authorized drawer/current stroke |
| `draw.undo` | `{canvasId,knownSeq}` | current drawer, undoable own op |
| `draw.redo` | `{canvasId,knownSeq}` | current drawer, valid redo stack |
| `draw.clear` | `{canvasId}` | drawer, explicit ack/revision |
| `guess.submit` | `{guess}` | eligible non-drawer, not yet correct, DRAWING |
| `chat.send` | `{text}` | joined, not muted, bounded, no answer leak |
| `reaction.send` | `{emojiId}` | allowlisted, rate controlled |
| `round.hintRequest` | `{kind}` | eligible guesser, capped cost |
| `sync.request` | `{lastSeq,stateVersion}` | joined, scope redacted |
| `duel.guess` | `{guess,canvasId}` | Duel guesser and one award/word rule |
| `team.assign` | `{assignments}` | host before start, bounded roster |

Additional client actions must be designed, added to schema, unit/integration/negative tested and versioned; not silently interpreted with permissive `any`.

## Server events

`room.snapshot` (per-role redacted), `room.memberJoined/Left/Updated`, `room.settingsChanged`, `room.hostChanged`, `match.start`, `turn.wordChoices` (**drawer only**), `turn.started`, `turn.hint`, `turn.timerSync`, `drawing.ops`, `guess.privateFeedback`, `guess.publicCorrect` (NO plaintext word), `chat.message`, `reaction.broadcast`, `turn.reveal` (word only AFTER end), `round.results`, `match.results`, `room.restarting`, `error`, `connection.superseded`, `room.closed`.

**Important:** Protect all outputs. Before reveal, only current drawer receives secret candidates/answer. Correct guess privately acknowledged to guesser; room sees generic player success event. Do not include answer hashes or full internal state in public payloads.

## Snapshot and reconnect

Guesser snapshot includes public phase, roster, scores, `mySeatId`, `matchId`, `turnId`, server deadline, masked word, hint indexes, redacted chat (bounded), drawing checkpoints and sequenced tail. Drawer snapshot may include candidate/selected answer only to that authenticated drawer; spectator snapshot is additionally redacted. On reconnect client compares `stateVersion`,`seq`, discards old-turn pending packets, merges checkpoint+tail in server order and verifies no duplicate score/draw. Hibernation restores socket attachments and persisted canonical state; no in-memory-map assumption.

## HTTP minimum

`GET /api/health`; `POST /api/guest`; `POST /api/rooms`; `GET /api/rooms/:code`; `POST /api/rooms/:code/join`; `POST /api/rooms/:code/join-grant`; `GET /api/rooms/:code/socket` (WS upgrade); `POST /api/rooms/:code/leave`; optional P1 matching/profile/daily/report/gallery as detailed in `08`. No client may infer secret through HTTP.

## Bounds and error handling

- Coordinates integers 0..65535, pointer pressure 0..1, size 1..32, `canvasId` allowlisted by mode.
- Batch target 20–30Hz max per active drawer; max 200 points per appending batch, 64KiB payload, a bounded number of strokes per turn and compact snapshots.
- Chat <=300 Unicode graphemes; nicknames <=20 graphemes; validate accepted words and categories server-side.
- Events with duplicate clientEventId, old connection epoch, incorrect turn/match, wrong role, outside deadline or unknown version rejected. Return structured codes; do not silently ignore security-relevant attempts.
- Rate limits are per event class and per seat/IP/room defense in depth. Responses must not echo raw abusive content/secret word.

## Example complete flow

`POST /api/guest` -> `POST /api/rooms` -> B `POST /api/rooms/:code/join` -> both `join-grant` -> WS 101 -> redacted `room.snapshot` -> host `room.start` -> private `turn.wordChoices` -> drawer `word.select` -> public `turn.started` -> authorized `stroke.begin/append/end` -> `drawing.ops` -> guesser `guess.submit` -> private `guess.privateFeedback`, public `guess.publicCorrect` -> `turn.reveal` -> `round.results` -> next turn -> `match.results` -> host `room.playAgain`. Every step has auth, phase transition and negative test.
