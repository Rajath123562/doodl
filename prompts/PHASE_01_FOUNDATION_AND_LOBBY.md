# Antigravity Phase 1 — Real app foundation and private rooms

Continue the DOODL production build. Read `AGENTS.md`, docs and `IMPLEMENTATION_STATUS.md`. Implement in `app/` with React/TypeScript/Vite, Cloudflare Workers/SQLite-backed DO, the official Cloudflare Vite integration if compatible, Zod strict schemas, Vitest, Playwright and an original UI design system based on `reference/demo-v2`.

## Deliver code, not commentary

- Create real route components: home, create room, join, lobby, and room-not-found states.
- Implement server-generated guest identity and 8+ character unpredictable room code; server-owned host seat and settings, optional private password only if safely validated.
- Wire real POST room creation/join API to backend. Return verified room player list to **two independent browser contexts**; no bot/fake seat data in production.
- Begin robust one-room-one-Durable-Object authority, room membership and lifecycle. Use secure room/seat credentials; never trust guessed `playerId`.
- Lobby: real share URL, copy interaction, seat list, host settings, start button disabled when <2 eligible humans, leave button, clear error/loading/connection states.
- Set up package scripts `dev`, `lint`, `typecheck`, `test`, `test:e2e`, `build` and CI workflow; record exact commands and versions.
- Establish feature flags to hide unfinished P1/P2 controls rather than linking to dead pages.

## Mandatory evidence before GO

1. `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all pass or blockers explained.
2. Playwright opens browser A; creates room; browser B independently joins by real URL; both see each other. Verify server did not seed players.
3. C tries invalid code, full room, nonhost settings update and malicious nickname; outcomes correct.
4. Screenshot desktop/mobile homepage and two-human lobby.
5. Update `IMPLEMENTATION_STATUS.md`; do not report Phase 2 complete.

Stop at this checkpoint and report GO/NO-GO with evidence. If no browser or Cloudflare runtime access, still write code and tests and state what was unverified.
