# DOODL V3 — Phase 8: Database & Data Integrity QA

**Audit Date:** 2026-11-23  
**Component:** Durable Object SQLite Persistence (`app/worker/room-do.ts`, `app/wrangler.jsonc`)  
**Status:** **PASS (ZERO LEAKAGE, CONCURRENT TRANSACTION SAFETY)**  

---

## 1. Storage Topology & Cloudflare SQLite DO Architecture

In accordance with **ADR-0001**, DOODL does not use a shared bottleneck SQL server for live ephemeral rooms:
- Each active game room is backed by a dedicated **SQLite-backed Durable Object instance (`RoomDO`)**.
- The database migration is declared in `wrangler.jsonc`:
  ```json
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["RoomDO"]
    }
  ]
  ```
- All room state mutations (seat assignments, scores, active strokes, settings) are serialized transactionally via SQLite key-value operations (`this.ctx.storage.put()` and `this.ctx.storage.get()`).

---

## 2. Tested Persistence Scenarios

| Test # | Scenario | Mechanism | Verification Result | Status |
|---|---|---|---|---|
| **1** | Cold-Start Room Restoration | `storage.get("room_state")` | Sockets re-subscribe to restored state | **PASS** |
| **2** | Mid-Match Node Hibernation | WebSocket Hibernation API | Alarm wakes DO without dropping sockets | **PASS** |
| **3** | Atomic Score Updates | Synchronous DO execution | Zero race conditions or double-scoring | **PASS** |
| **4** | Clean Room Destruction | `storage.deleteAll()` on close | Zero orphaned data or lingering locks | **PASS** |
| **5** | Sensitive Word Protection | SQLite storage exclusion | Secret words stored only in volatile memory | **PASS** |

---

## 3. Data Privacy & Retention Guarantee

1. No personally identifiable information (PII) such as passwords, real names, or email addresses is written to database storage.
2. Room records are automatically evicted and reclaimed when the match terminates or when all players disconnect.
