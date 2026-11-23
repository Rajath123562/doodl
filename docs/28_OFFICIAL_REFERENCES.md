# 28 — Official documentation and recency verification

These references were reviewed for the handoff as of 2026-11-22; Antigravity must open official pages again immediately before selecting versions or deploying because external APIs, pricing and platform features can change.

- [Cloudflare Workers + Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/) — current framework integration.
- [React + Vite + Workers guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/) — Worker API and SPA routing; verify `not_found_handling: single-page-application` and Worker-first API routing.
- [Durable Objects WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/) — use WebSocket Hibernation API and socket attachment restoration. In-memory state resets upon hibernation.
- [DO SQLite storage API](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) — SQLite-backed namespace and storage constraints.
- [DO platform pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) — free-tier included usage and quota exhaustion behavior. Workers Free supports SQLite-backed DO namespaces; no unlimited free capacity.
- [DO platform limits](https://developers.cloudflare.com/durable-objects/platform/limits/) — current service limits.
- [Workers platform limits](https://developers.cloudflare.com/workers/platform/limits/) — CPU/request limits and plan details.
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) — Worker-level costs and paid plan mechanics.
- [Antigravity Skills documentation](https://antigravity.google/docs/skills) — workspace skills in `.agents/skills/<folder>/SKILL.md`.
- [Google Antigravity coding agents codelab](https://codelabs.developers.google.com/autonomous-ai-developer-pipelines-antigravity) — workspace agent instructions and implementation flow.

**Engineering note:** Documentation is a starting point, not proof any specific version or deployment will work. Verify installed versions, lockfile, Wrangler configuration and runtime with actual local/staging tests. Do not embed hardcoded volatile prices as guaranteed.
