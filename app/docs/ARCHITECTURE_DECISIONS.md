# DOODL Architecture Decisions & System Design

## 1. High-Level System Architecture

```text
+-----------------------------------------------------------------------------------+
|                                 CLIENT (Browser)                                  |
|                                                                                   |
|   +--------------------+  +----------------------+  +-------------------------+   |
|   |   React Router     |  |    Canvas Engine     |  |   WebSocket Client      |   |
|   |  - Home / Lobby    |  |  - Pointer Events    |  |  - Auto-reconnect       |   |
|   |  - Classic / Blitz |  |  - Normalized Coord  |  |  - Monotonic seq ack    |   |
|   |  - Duels / Chaos   |  |  - Optimistic Pencil |  |  - State sync           |   |
|   |  - Daily / Profile |  |  - Vector Command Log|  |  - Connection Epoch    |   |
|   +--------------------+  +----------------------+  +-------------------------+   |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / WSS
                                           v
+-----------------------------------------------------------------------------------+
|                             CLOUDFLARE WORKERS API                                |
|                                                                                   |
|   +--------------------+  +----------------------+  +-------------------------+   |
|   |   Guest Session    |  |     Room Router      |  |     Health & Telemetry  |   |
|   |  - Cryptographic   |  |  - Unpredictable code|  |  - Redacted error logs  |   |
|   |    cookie / token  |  |  - Capacity check    |  |  - Rate limit counters  |   |
|   |  - Scope check     |  |  - Join Grant mint   |  |  - Quota monitoring    |   |
|   +--------------------+  +----------------------+  +-------------------------+   |
+------------------------------------------+----------------------------------------+
                                           | Durable Object Binding
                                           v
+-----------------------------------------------------------------------------------+
|                      ROOM DURABLE OBJECT (1 DO Per Live Room)                     |
|                                                                                   |
|   +--------------------+  +----------------------+  +-------------------------+   |
|   |   State Machine    |  |   Drawing Broker     |  |    Scoring & Words      |   |
|   |  - LOBBY           |  |  - Stroke ordering   |  |  - Word bank selector   |   |
|   |  - SELECTING_WORD  |  |  - Undo/redo stack   |  |  - Secret drawer-only   |   |
|   |  - DRAWING         |  |  - Checkpoints       |  |  - NFKC guess matcher   |   |
|   |  - REVEAL          |  |  - Replay broadcast  |  |  - Deterministic score  |   |
|   |  - ROUND_RESULTS   |  |  - Throttled batches |  |  - Correct redaction    |   |
|   |  - MATCH_RESULTS   |  +----------------------+  +-------------------------+   |
|   +--------------------+                         |                                |
|             |                                    |                                |
|             v                                    v                                |
|   +---------------------------------------------------------------------------+   |
|   |                     SQLite Storage & Hibernation API                      |   |
|   |  - Durable room state, deadlines, player seats, accepted command log      |   |
|   |  - Alarms for phase deadlines and disconnect grace timeouts               |   |
|   |  - Attachment serialization for instant seat resume upon wake             |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

## 2. Threat Model & Security Boundaries

1. **Client is Untrusted**:
   - Scores, roles, drawer identity, turn transitions, candidate words, and timers are calculated strictly on the server.
   - Any message from a client containing authoritative fields (`score`, `correct`, `isHost`, `isDrawer`, `deadlineAt`) is immediately rejected.
2. **Word Secrecy Invariant**:
   - Secret candidate words and chosen words are dispatched exclusively to the current drawer.
   - The snapshot broadcast to guessers contains only `maskedWord` (e.g. `_ _ _ _ _`) and revealed hint indices.
   - Plaintext words never appear in chat frames, error payloads, traces, or client-side bundles.
3. **Connection Hijacking & Spoofing Defense**:
   - Every WebSocket handshake requires a cryptographically validated `joinGrant` bound to the guest session.
   - Sockets hold a `connectionEpoch`. When a duplicate connection opens for the same seat, the older socket receives `SESSION_TAKEN_OVER` and is terminated.
4. **Input Sanitization & Abuse Defense**:
   - Nicknames and chat text are validated for length, Unicode safety, and XSS risks (rendered strictly as text nodes).
   - WebSocket frame size is capped at 64 KiB before JSON parsing.
   - Drawing stroke points are capped at 200 points per batch and 30 batches/second.

## 3. Room Lifecycle & State Machine

```text
[ NEW ROOM CREATED ]
         |
         v
     +-------+
     | LOBBY | <-----------------------------------------+
     +-------+                                           |
         | Host starts (>= 2 players)                    |
         v                                               |
+------------------+                                     |
|  SELECTING_WORD  | (Drawer picks or 10s auto-picks)    |
+------------------+                                     |
         |                                               |
         v                                               |
    +---------+                                          |
    | DRAWING | (Draw timer 20-120s or all guess correct)|
    +---------+                                          |
         |                                               |
         v                                               |
    +--------+                                           |
    | REVEAL | (5s: reveals word, scores earned)         |
    +--------+                                           |
         |                                               |
         v                                               |
 +---------------+                                       |
 | ROUND_RESULTS | (5s: scoreboard snapshot)             |
 +---------------+                                       |
         |                                               |
         +--> Next drawer / cycle: [ SELECTING_WORD ]   |
         |                                               |
         +--> All cycles completed:                      |
                     |                                   |
                     v                                   |
             +---------------+                           |
             | MATCH_RESULTS | (Podium & final ranks)    |
             +---------------+                           |
                     |                                   |
                     +-- Host clicks Play Again ---------+
                     |
                     +-- 30 min idle / leave --> [ CLOSED ]
```
