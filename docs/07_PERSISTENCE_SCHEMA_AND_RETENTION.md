# 07 — Durable state, data model, retention and deletion

Avoid writing one row per pointer move; these are transient high-frequency operations. Design event compaction, bounded snapshots, privacy and quota limits. DO SQLite is the canonical active-room authority; D1 is optional for cross-room features only when required and cost/identity/retention model approved.

## Suggested Room DO tables (conceptual SQL; validate exact syntax in deployed runtime)

```sql
CREATE TABLE IF NOT EXISTS rooms (
  room_id TEXT PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  settings_json TEXT NOT NULL,
  host_seat_id TEXT,
  game_mode TEXT NOT NULL,
  state_version INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS seats (
  seat_id TEXT PRIMARY KEY,
  guest_session_hash TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar_json TEXT NOT NULL,
  role TEXT NOT NULL,
  connected INTEGER NOT NULL,
  connection_epoch INTEGER NOT NULL DEFAULT 0,
  joined_at INTEGER NOT NULL,
  disconnected_at INTEGER,
  muted_until INTEGER,
  kicked_at INTEGER
);
CREATE TABLE IF NOT EXISTS matches (
  match_id TEXT PRIMARY KEY,
  phase TEXT NOT NULL,
  mode TEXT NOT NULL,
  roster_json TEXT NOT NULL,
  turn_order_json TEXT NOT NULL,
  active_turn_id TEXT,
  deadline_at INTEGER,
  state_version INTEGER NOT NULL,
  started_at INTEGER,
  finished_at INTEGER
);
CREATE TABLE IF NOT EXISTS turns (
  turn_id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  drawer_ids_json TEXT NOT NULL,
  prompt_secret TEXT NOT NULL,
  started_at INTEGER,
  deadline_at INTEGER,
  revealed_at INTEGER,
  status TEXT NOT NULL,
  public_mask_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS scores (
  match_id TEXT NOT NULL,
  seat_id TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  first_correct_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(match_id, seat_id)
);
CREATE TABLE IF NOT EXISTS processed_events (
  seat_id TEXT NOT NULL,
  client_event_id TEXT NOT NULL,
  turn_id TEXT,
  applied_at INTEGER NOT NULL,
  PRIMARY KEY(seat_id,client_event_id)
);
CREATE TABLE IF NOT EXISTS drawing_checkpoints (
  turn_id TEXT NOT NULL,
  canvas_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  compressed_ops BLOB NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(turn_id,canvas_id)
);
```

D1 (optional): accounts/guest-scoped preference, challenge completions, achievements, report queue, aggregated public metrics. Define referential access and secure deletions; never store raw guest tokens. Server should store only salted hashes or equivalent credential check material where feasible.

## Turn transaction model

Correct guess handler: authenticate seat, validate active phase/deadline, idempotency key, guess and hint count; in a single serialized room mutation apply `processed_events`, `scores`, `guesses` records, increment state_version and emit confirmation only after durable commit. On retry, return previous result without duplicate award. If room state changes concurrently, re-read authoritative state. Never accept points or guessed correctness from client.

## Drawing event persistence

Maintain in-memory bounded recent op stream for fast fan-out, checkpoint+tail for late join; persist checkpoint at safe intervals (e.g. every 100 accepted logical operations or 3–5 seconds, tune by measurement), not every cursor movement. Cap per-turn operations/points and compaction time. `CLEAR`/`UNDO`/`REDO` explicit validated operations with monotonically increasing server seq. On cold restart, replay checkpoint+tail idempotently. Test snapshots for 100+ strokes, multiple erasures, high DPI and change of active turn.

## Retention defaults to validate and publish

| Data | Default candidate | Deletion/expiry |
|---|---|---|
| Active room/seats/scores | 15min empty lobby / 30min completed | DO expiration alarm + cleanup |
| Private chat | 100 bounded recent messages, expire with room | remove on room expiration; minimal abuse evidence separately |
| Raw strokes/current turn | current match + max 30 min post-match | expiry + compaction |
| Client event IDs | up to room expiry with cap; preserve recent TTL | prune without replay vulnerability |
| Guest cookie | bounded session e.g. 7 days | logout/reset and server expiry |
| Gallery local | user-controlled browser storage | Delete and clear-data UX |
| Cloud art, if added | explicit opt-in with expiry choices | prompt deletion path tested |
| Abuse report evidence | documented limited policy | operator review then bounded deletion |
| Error/traffic metrics | aggregate with short TTL | no raw secret words/guesses/tokens |

**These are proposals, not a legal privacy policy.** Actual release policy must reflect code and applicable jurisdiction and avoid retaining children's data unnecessarily.

## Migration and recovery

Use versioned, additive DO migrations and backups/checkpoint snapshots where possible. New deployments must handle old `stateVersion` or explicitly close old rooms safely. Test worker upgrade during match and DO cold wake. Never deploy destructive schema change without migration test and rollback. Log migration ID, affected namespaces, staging dry run and reversible/irreversible steps.

## Profile/XP honesty

Guest-local XP cannot be authoritative across devices. If maintaining a leaderboard, define account identity, restore/delete flows, fraud resistance, privacy and consent. D1 permanent leaderboard by guest cookie alone is not robust enough to call competitive ranking. Do not collect email until a feature genuinely requires it.
