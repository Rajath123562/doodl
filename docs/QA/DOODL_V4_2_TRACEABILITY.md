# DOODL V4.2 — Requirements Traceability Matrix (53 Acceptance Criteria)

| ID | Category | Requirement Summary | Implementation Target | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **S01** | Scope | Exactly 3 standalone mode cards (`classic`, `telephone`, `party_mix`); server whitelist | `app/shared/game-types.ts`, `app/worker/room-do.ts`, `app/src/pages/Home.tsx` | Unit + API Bypass Test | IN_PROGRESS |
| **S02** | Scope | Legacy active sessions preserved safely; historical match data readable | `app/worker/room-do.ts` legacy adapter | Migration Unit Test | PENDING |
| **S03** | Scope | Guest nickname/avatar/invite/private/public queue retained; no fake bots in empty queues | `app/src/pages/Lobby.tsx`, `app/worker/room-do.ts` | E2E Browser Test | PENDING |
| **S04** | Scope | Mode min/max player counts strictly enforced (Classic 2–20, Telephone 4–16, Party 4–12) | `app/shared/rules.ts`, `app/worker/room-do.ts` | Unit + Integration Test | PENDING |
| **S05** | Scope | "Play again" in same room resets round state with fresh match ID; no bleed | `app/worker/room-do.ts` | E2E Rematch Test | PENDING |
| **S06** | Scope | Feature flags and version skew safe; non-destructive DB schema migrations | `app/worker/room-do.ts` | Schema Migration Test | PENDING |
| **U01** | UI/UX | Mobile layout: canvas top, players left (~43%) & chat right (~57%) side-by-side; bottom composer | `app/src/pages/Game.tsx`, CSS Grid | Visual Inspection + Viewport Test | PENDING |
| **U02** | UI/UX | Desktop layout: 3 columns (players ~195px, center dominant canvas, chat ~285px) | `app/src/pages/Game.tsx`, `app/src/styles/globals.css` | Desktop Screenshot Test | PENDING |
| **U03** | UI/UX | Fluid responsiveness across 320px–1920px widths; mobile keyboard accommodation | Responsive CSS, dynamic viewport units | Multi-resolution E2E | PENDING |
| **U04** | UI/UX | Drawer-only toolbar; coordinate scaling with `object-fit: contain`; resize preservation | `app/src/components/DrawingToolbar.tsx`, `renderer.ts` | Touch/Pointer Test | PENDING |
| **U05** | UI/UX | Turn/match results overlay canvas without page scroll; local replay does not pause clock | `app/src/pages/Game.tsx`, overlay modal | E2E Overlay Test | PENDING |
| **U06** | UI/UX | Accessibility: minimum touch targets (>=44px), WCAG contrast, screen reader aria-live | `app/src/components/` | Axe-core Accessibility Test | PENDING |
| **U07** | UI/UX | Doodl visual identity: unslop styling, no purple gradient slop, sentence case | Design token CSS | Visual Audit | PENDING |
| **C01** | Classic | Full Classic multiplayer match cycle (2, 6, 20 players supported) | `app/worker/room-do.ts`, `app/src/pages/Game.tsx` | Multi-context E2E Test | PENDING |
| **C02** | Classic | Server-authoritative roles, timers, word selection; zero secret leakage to guessers | `app/worker/room-do.ts`, `word-engine.ts` | WS Packet Inspection Test | PENDING |
| **C03** | Classic | Correct/close/alias guess boundaries; single award per player per turn | `app/worker/room-do.ts`, `app/shared/rules.ts` | Unit + Scoring Test | PENDING |
| **C04** | Classic | Turn rotation with departure skip, early finish when all guess, min-player pause | `app/worker/room-do.ts` | Lifecycle Integration Test | PENDING |
| **C05** | Classic | Complete removal of manual hint button, hotkey, counter, request API, point penalty | `app/src/components/`, `app/worker/room-do.ts` | API Negative Test | PENDING |
| **C06** | Classic | Automatic hints: $H = \min(3, \lfloor N/2 \rfloor)$ at intervals $T \times i / (H+1)$ | `app/worker/room-do.ts` | Unit Hint Math Test | PENDING |
| **C07** | Classic | Grapheme-safe masks via Intl.Segmenter; punctuation/spaces preserved | `app/worker/room-do.ts`, `app/shared/rules.ts` | Unicode Grapheme Unit Test | PENDING |
| **C08** | Classic | Synchronized mask broadcast; reconnecting guessers receive identical revealed mask | `app/worker/room-do.ts` | WS Reconnect Test | PENDING |
| **C09** | Classic | Hint timers reset cleanly on next turn or rematch; zero score penalty | `app/worker/room-do.ts` | Integration Turn Reset Test | PENDING |
| **C10** | Classic | Send button and Enter work during guessing, after correct guess, and between rounds | `app/src/components/GuessChat.tsx` | Browser E2E Form Test | PENDING |
| **C11** | Classic | Solved & drawer players use private chat channel; secret never leaked to guessers | `app/worker/room-do.ts`, `GuessChat.tsx` | Channel Isolation WS Test | PENDING |
| **C12** | Classic | Chat draft preservation, rate limits, stale guess rejection, abuse filtering | `app/src/components/GuessChat.tsx`, `room-do.ts` | Rate Limit & Draft Test | PENDING |
| **T01** | Telephone | Deterministic seat routing permutation: seat $(c+s) \pmod N$, exactly 1 assignment/step | `app/worker/telephone-engine.ts` | Property Routing Test | PENDING |
| **T02** | Telephone | 4–16 players write prompt, draw, describe, and reveal correctly | `app/worker/telephone-engine.ts`, `app/src/` | 4-Player E2E Match Test | PENDING |
| **T03** | Telephone | Only immediate prior artifact sent to assignee; no cross-chain leaks | `app/worker/telephone-engine.ts` | WS Privacy Inspection | PENDING |
| **T04** | Telephone | Draft auto-finalization, duplicate submit rejection, deadline advance once | `app/worker/telephone-engine.ts` | Idempotency Integration Test | PENDING |
| **T05** | Telephone | Missing / skipped assignments explicitly handled; no invented human work | `app/worker/telephone-engine.ts` | Missing Artifact Test | PENDING |
| **T06** | Telephone | Disconnect recovery restores own assignment/draft; host departure safe | `app/worker/telephone-engine.ts` | Fault Injection Reconnect | PENDING |
| **T07** | Telephone | Reveal timeline shows full chain in sequence with author tags | `app/src/components/TelephoneReveal.tsx` | Browser Timeline Test | PENDING |
| **T08** | Telephone | Chat and hints disabled during hidden assignment phase; restored on reveal | `app/src/pages/Game.tsx` | Mode Boundary Test | PENDING |
| **T09** | Telephone | Bounded stroke data, plain text UTF-8 sanitization, moderation reporting | `app/worker/telephone-engine.ts` | Security & Payload Test | PENDING |
| **P01** | Party Mix | 4-stage sequential match: Classic → Blitz → Chaos → Drawing Telephone in one room | `app/worker/party-engine.ts` | Full Multi-Stage E2E | PENDING |
| **P02** | Party Mix | Blitz stage duration preset (20s/30s) with automatic hints adapting | `app/worker/party-engine.ts` | Blitz Timer Test | PENDING |
| **P03** | Party Mix | Chaos stage modifiers (monochrome, 3-color palette, no eraser, giant brush) | `app/worker/party-engine.ts`, `room-do.ts` | Modifier Validation Test | PENDING |
| **P04** | Party Mix | Normalized stage scoring: $\text{round}(100 \times (M-r) / (M-1))$, max 300 points | `app/shared/rules.ts` | Formula Unit Test | PENDING |
| **P05** | Party Mix | Parent match score and XP awarded once; child stale events rejected | `app/worker/party-engine.ts` | Event Idempotency Test | PENDING |
| **P06** | Party Mix | 4, 8, 12 player matches with stage transition reconnects & host migration | `app/worker/party-engine.ts` | Multi-Client E2E Test | PENDING |
| **P07** | Party Mix | Party Telephone shortened chains (min(4, N)); skip if <4 players | `app/worker/party-engine.ts` | Short Chain Test | PENDING |
| **P08** | Party Mix | Standard / short match presets, stage banner indicator, final podium | `app/src/components/PartyHUD.tsx` | Visual UI Test | PENDING |
| **R01** | Realtime | Multi-client drawing parity, undo/redo/clear synchronization, snapshot catch-up | `app/src/drawing/`, `room-do.ts` | 2-Browser Canvas Sync Test | PENDING |
| **R02** | Security | Malformed/oversized payloads, role forgery rejection, XSS prevention, origin check | `app/worker/room-do.ts`, `auth.ts` | Security Fuzz Suite | PENDING |
| **R03** | Reliability | Idempotent commands, 150ms simulated network latency resilience, reconnection | `app/worker/room-do.ts` | Fault Injection Suite | PENDING |
| **R04** | Regression | Retained features (gallery, avatars, replays, XP, daily challenges) unaffected | `app/src/pages/` | Regression Suite | PENDING |
| **R05** | Performance | Sub-200ms drawing broadcast latency, nominal 60fps canvas rendering | Performance harness | Benchmark Telemetry | PENDING |
| **R06** | Soak | 30-minute room stability, memory bound verification, socket cleanup | Worker Soak Harness | Soak Test Run | PENDING |
| **R07** | Quality | Clean typecheck, build, unit, integration, and E2E test runs with zero warnings | `npm test`, `npm run build` | CI Test Runner | PENDING |
| **R08** | Platform | Cross-browser verification (Chromium, Firefox, WebKit) and mobile viewports | Playwright Multi-Project | Multi-Browser Test | PENDING |
| **R09** | Deployment | Staging verification, backward-compatible migrations, zero-cost architecture | Wrangler staging | Staging Smoke Test | PENDING |
| **R10** | UAT | Verification against interactive reference `doodl_live_demo_v4_2.html` | Visual & behavioral audit | UAT Report | PENDING |
| **R11** | Release | Clean final commit with zero known release defects and signoff | Release checklist | Final Certification | PENDING |
