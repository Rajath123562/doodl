# DOODL Deployment, Infrastructure & Operations Plan

## 1. Environments

- **Local Development**:
  - Vite dev server for React frontend (HMR).
  - Cloudflare Worker dev environment with local Durable Objects emulation.
  - Proxy routes `/api` and `/api/rooms/:code/socket` (WSS) to the worker runtime.
- **Staging**:
  - Cloudflare Worker staging environment (`doodl-staging`).
  - Isolated staging Durable Objects namespace.
  - Automated smoke tests and multi-device manual validation.
- **Production**:
  - Cloudflare Worker production environment (`doodl`).
  - Durable Objects namespace with SQLite storage enabled.
  - Custom domain routing with SSL/TLS termination at edge.

## 2. Resource & Budget Safeguards (Cloudflare Workers Free Tier)

| Metric | Free Tier Quota | DOODL Invariant & Mitigation |
|---|---|---|
| **Worker Requests** | 100,000 requests / day | REST API calls minimized to session mint and room join; all gameplay on single persistent WebSocket connection. |
| **Durable Object Requests** | Free tier inclusion for SQLite DOs | WebSockets use Hibernation API; idle connections consume 0 CPU; events batched at 20-30Hz. |
| **Storage Reads / Writes** | Quota-controlled | Ephemeral strokes cached in memory and flushed periodically as compaction checkpoints; chat not stored permanently. |
| **Bandwidth** | Unmetered standard | 64KiB frame limits; compact integer coordinates (0..65535). |
| **Room Lifecycle Expiry** | Auto-clean | Idle lobbies expire after 15 min; completed matches expire after 30 min; hard cap 2 hours. |

## 3. Rollback & Emergency Procedures

1. **Deployment Rollback**:
   - `wrangler rollback` reverts instantly to the previous known good deployment ID without downtime.
2. **Room Kill-Switch**:
   - If a room encounters a corrupt state, the host or operational admin can close the room via `POST /api/rooms/:code/terminate` with admin token.
3. **Public Matchmaking Kill-Switch**:
   - Quick Play can be disabled instantly via environmental flag `ENABLE_QUICK_PLAY=false` to route users exclusively to private rooms.
