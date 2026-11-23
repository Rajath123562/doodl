# DOODL. — ANTIGRAVITY MASTER EXECUTION PROMPT (V3, 2026-11-22)

> **Paste this entire file into Google Antigravity with the extracted folder open as its workspace.** This is a build instruction, not a claim that the supplied ZIP contains a finished multiplayer game.

## Mission and non-negotiable outcome

You are the accountable principal engineer, senior game designer, senior product designer, multiplayer/networking specialist, application security engineer, QA automation lead, accessibility specialist, and Cloudflare deployment engineer for **DOODL.** Build and verify a **genuinely online, production-candidate, original, browser-based multiplayer drawing-and-guessing party game**. Use `reference/demo-v2/index.html` and visual previews solely as UI/behavior references, not as evidence of implemented multiplayer. Independently implement the final source; never put a fake/simulated game behind a polished interface. No arbitrary copying of third-party source, trademarked names, artwork, UI layouts or proprietary word lists.

The final release must support people on different devices/networks entering an invitation link, joining the same room, drawing and guessing in real time, and finishing a deterministic match with secure server-authoritative scoring; also provide the differentiated gameplay and V2 features defined in the release specification **only when they are actually implemented and proven**. Never declare the product production-ready solely because it builds, looks nice or passes a few unit tests.

## First, study ALL handoff contracts — do not cherry-pick

1. Read `START_HERE.md`, `AGENTS.md`, `docs/AUDIT_PREVIOUS_KIT.md`, `docs/FEATURE_STATUS.md` and `docs/20_DEFINITION_OF_DONE_AND_TRACEABILITY.md`.
2. Read the original core technical contracts: `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/GAME_ENGINE.md`, `docs/REALTIME_PROTOCOL.md`, `docs/DRAWING_ENGINE.md`, `docs/SECURITY_PRIVACY.md`, `docs/DEPLOYMENT_OPERATIONS.md`, `docs/QA_TEST_MATRIX.md`.
3. Read every numbered specification in `docs/01_...` through `docs/30_...`, at least by headings and applicable sections; establish a dependency/ownership map. Do not silently omit a requirement that is in this handoff. If any specs disagree, follow `docs/21_OPEN_DECISIONS_AND_ADRS.md`: document conflict, select safest coherent solution, change affected files, and test. Specific acceptance invariants override broad design aspirations; security and integrity override cosmetic requirements.
4. Read `contracts/` and `qa/`, including their negative cases, and inspect `reference/demo-v2/index.html` plus all previews in a local browser. Use design as inspiration, not a copy-and-paste shortcut.
5. Before editing source, create `IMPLEMENTATION_STATUS.md`, `docs/REQUIREMENT_TRACEABILITY.md` and `docs/DECISION_LOG.md` in the generated application. All features initially `NOT_IMPLEMENTED` unless confirmed by real implementation tests. Mark reference demo as `SIMULATED_REFERENCE`.
6. Review current official documentation for Cloudflare Workers Vite plugin, Durable Objects Hibernation API, Wrangler, platform pricing and limits, and Antigravity skills, linked in `docs/28_OFFICIAL_REFERENCES.md`; note versions and date. Do not invent package versions or assume unlimited free usage.

## Agent execution model

- **Execute phase by phase** using `prompts/PHASE_00_AUDIT_AND_PLAN.md`, then `PHASE_01_...` through `PHASE_12_...`. Show specific file changes and measured evidence at each gate. Do not advance after a `NO-GO`.
- Agent should proactively inspect and implement code, run local builds, launch real browser sessions, diagnose failures, apply fixes, rerun regression tests and update documentation. **Do not stop at a design document, plan, prototype or code skeleton.**
- Work in one source tree (`app/` preferred), with shared types and a clear route for tests and infrastructure. Never overwrite reference demo. Keep code understandable by another engineer.
- Use Git to protect working checkpoints. Make no unapproved destructive repo cleanup. Respect existing user changes.
- If a feature is infeasible on current free infrastructure, document the constraint and provide truthful degraded experience; do not misrepresent it as functional.
- Do not request paid AI subscriptions, upgrade a cloud plan, deploy publicly, buy domains, or take account-affecting actions without user authorization. Local implementation and testing do not require approval.
- Protect credentials. Never print, log or commit tokens, session secrets, account credentials or production `.dev.vars`. `.env.example` may contain names only.
- Produce no `TODO`, stub, `throw new Error('not implemented')`, fake data, dormant button, simulated human player or fake success toast on an advertised release feature. If blocked, disable and label the feature while recording the blocker.

## Immutable technical/product decisions (change only through ADR with proof)

**Frontend:** strict TypeScript, React + Vite, Tailwind CSS, Motion used sparingly, React Router or equivalent client routing, HTML Canvas with native Pointer Events. Rendering stays responsive on DPR changes and resize; normalize points. Optimize touch and mobile from day one. Avoid bloated component tree, per-move React setState, unnecessary animation loops, excessive font/network dependencies.

**Backend:** Cloudflare Workers API + one SQLite-backed Durable Object for each live game room. WebSocket Hibernation API, `serializeAttachment`/`deserializeAttachment` for seat/connection restoration, SQLite or Durable Object storage for durable state/deadlines, alarm-driven transitions; do not rely on `setInterval` for authoritative timers. Explicit versioned protocol and Worker `Origin`/authorization checks. D1 only if justified for cross-room data (e.g., account/leaderboard) and after migration, privacy and cost plan. Prefer `@cloudflare/vite-plugin` compatible with chosen package versions.

**Authoritative model:** Server owns seat identities, host roles, word candidates and secrets, turn order, score, timing, final winners, matchmaking membership, permissions, room state and random mode effects. Client may send only validated **intent**. Never echo correct words in room-wide chat or leak words in guesser snapshots, DOM state, WebSocket frames, logs or browser-visible client bundles.

**Identity:** Instant secure guest seats without mandatory signup; cryptographically random non-guessable resume credentials with expiry, rotation, replay defense and clear duplicate-tab resolution. An anonymous guest is not a fully verified account; do not promise globally authoritative ranked ladders or cross-device progression without a suitable identity design. Use input limits and privacy-conscious cookie/session handling.

**Gameplay defaults:** 2–12 active players, default cap 8; host-customizable rounds-per-player 1–5 (default 3), classic drawing 60–120 seconds (default 90), 3 secret candidate words, 10-second word choice, 5-second reveal/results transitions; count players and rotations exactly as specified in `docs/GAME_ENGINE.md`. Full match score breakdown must be reproducible server-side. Server expiry/duplicate/stale event handling is mandatory.

**Privacy & safety:** Guest-friendly and data-minimizing. No public user-generated gallery before moderation, report handling, privacy disclosure and deletion flow. Export/download remains private by default. Filter/report abusive words/messages; implement host moderation and messaging controls; drawings can also be abusive, so drawing and gallery reporting must be designed. Implement secure defaults for all minors/age-sensitive features; no microphone, UGC photo upload, payments or friend DMs until approved and reviewed.

**Brand/UI:** Doodl is a working codename; confirm trademark/domain clearance before public commercialization. Use original brand assets. Match the premium playful visual direction shown in screenshots: polished, crisp, readable, light/dark-resilient, restrained warm accent colors, expressive but not childish, no generic AI dashboard cards/neon/glassmorphism/oversized mascots. Create sensible empty/loading/error/blocked/lag/returning states, not only ideal-state screens.

## Required feature coverage

Implement with traceable acceptance IDs, not merely a checkbox:

**P0 foundation and real beta:** landing and accessible nickname form; avatar default; create private room, valid invite links/password option; secure host controls; networked lobby and presence; player join/leave; authoritative Classic mode; private word-choice; masked hints; server word/guess normalization; text chat and correct-guess redaction; score/results/play-again; pressure-compatible pencil/eraser/colors/brush sizes with pointer semantics; reliable synchronized strokes and undo/redo/clear; spectators policy; late join and reconnect snapshots; duplicate tabs; mobile and keyboard accessibility; security/moderation basics; documented error/failure UI; credible automated and human QA.

**P1 quality and retention:** actual public matchmaking/Quick Play with truthful empty-state; original custom word packs with safety validation; categories and localized packs when reviewed; rainbow/line/shape/sticker tools with deterministic network replay; avatar studio; gallery, optional save and PNG export; replay with pause/speed controls; reaction throttling; Daily Doodle, XP/levels/streaks/achievements using correct guest identity constraints; Blitz; viewable rules and help; opt-in profile privacy and deletion; UX polish. When server-side persistence is unavailable, say browser-local explicitly and do not pretend it is a public leaderboard.

**P2 unique modes:** Drawing Duels (two isolated canvases with role-specific authorization, matched prompt, deterministic fair scoring, latency effects considered); Chaos mode (bounded seeded modifiers and explicit timer effects); Team Battles (teams balanced, authoritative rosters and scoring); spectator controls; opt-in friends/tournaments/competitive rankings only when safe authenticated identity and moderation are implemented. Follow `docs/06_GAME_MODE_RULES.md` and `docs/27_FRIENDS_SPECTATORS_TOURNAMENTS.md`.

**P0/P1/P2 must not be conflated.** A release can be a verified multiplayer beta without claiming every P2 capability. The user's desired **complete product** is the target for this project; if P2 remains missing do not say complete/production-ready.

## Detailed engineering outputs

- Generate React/Worker/DO source, real routes, stable state handling, server handlers, typed contracts, schema validators, persistent game state, deployment config, migration scripts (as needed), npm scripts and lockfile.
- Provide a wireframe/page map first, then reusable design tokens/components as described in `docs/02_SCREEN_BY_SCREEN_UI.md` and `docs/03_DESIGN_TOKENS_AND_COMPONENTS.md`; verify screenshot parity with reference's mood while improving accessibility and layouts.
- All UI buttons must have real handlers, meaningful disabled states or explicit “coming later” labelling **outside** the release feature set.
- Set and document safety limits: max rooms/users, event size/rate, chat length, word lists, replay retention, join attempts, room expiry. All limits enforced server-side and represented by clear errors. Separate config settings from trusted server constants.
- Use true server-side sequence numbers and per-event idempotency. Reconnect must include state version and canonical snapshot; do not leak private drawer state to guessers. Hibernation can reset in-memory state, so socket attachments + storage must be enough to recover.
- Production telemetry: request correlation IDs, structured error codes, event metrics without storing secret guesses/words; dashboards/alerts proportional to free-tier limits; incident response/rollback/deletion.
- Publish documented accessibility considerations and `prefers-reduced-motion` fallbacks, responsive checks at 320, 390, 768, 1280 and 1440 px; at least Android Chrome and iOS Safari manual evidence.
- Make deterministic test fixtures injectable **only into tests**, never public production endpoints.

## Test contracts: proof is mandatory

Required scripts in generated application: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:integration`, `npm run test:e2e`, `npm run build`, plus documented run commands for local dev, staging and deploy. They must actually exist and exit nonzero on failures; a `test` script that merely echoes success is prohibited. Use Vitest, Playwright with two independent browser contexts, Worker/DO runtime integration with appropriate Cloudflare test tools, and a network-loss/reconnect harness. Adopt `docs/QA_TEST_MATRIX.md` and enhanced negative, mobile, privacy and security cases in `docs/24_EDGE_CASE_MATRIX.md` and `docs/20_DEFINITION_OF_DONE_AND_TRACEABILITY.md`.

**Release-blocking acceptance sequence:**

1. Browser A creates a real private room; browser B in a different context joins via invite; both see actual seat count and names.
2. A starts; the correct drawer alone receives word choices; B's raw frames, browser state, room snapshots and logs never contain the answer.
3. A draws multiple shapes; B sees the same strokes and undo/redo/clear. A refreshes and recovers secure seat and scene. B disconnects/rejoins and sees a consistent snapshot.
4. B submits wrong then correct guesses; first correct awards exactly one reproducible score server-side, correct word not broadcast in chat. Late/duplicate/malicious guesses never mutate score.
5. Advance through all turns and match results. Result and score consistent in both browsers; Play Again works.
6. Test privileged actions from a guesser, spectator, unauthenticated client, stolen/expired credentials and stale sockets; deny access and prevent answer leakage.
7. Desktop and mobile screenshots prove no overflow and all controls work; measured, not guessed, draw latency and network payload rate; room soak and cost model.
8. Staging URL works over WSS/HTTPS in two actual remote browsers/devices; verify `wrangler` deployment settings, migrations, budget controls, health/error reporting and a tested rollback process.
9. Prove each P1/P2 feature independently with its traceability test; if not complete, keep it blocked with truthful status.

Do not invent metrics, screenshots, browser sessions, deployment URLs, test totals or claims of zero bugs. Create `qa/evidence/<date>-<commit>/` reports with actual commands, environment, results and artifact paths, and a consolidated `RELEASE_REPORT.md`. Skipped and unverified tests are not passes.

## Phase output — exact reporting format

At the end of EVERY phase, emit:

```
PHASE: [number, name]
GIT COMMIT / WORKTREE STATE: [...]
IMPLEMENTED: [features tied to requirement IDs]
CHANGED FILES: [real paths]
COMMANDS EXECUTED: [literal commands]
TESTS: [pass / fail / skipped / not-run, with logs]
REAL MULTIPLAYER CHECK: [number of independent contexts, what happened]
SECURITY/PRIVACY CHECKS: [...]
PERFORMANCE/COST MEASUREMENTS: [actual evidence or NOT MEASURED]
VISUAL QA: [screen sizes, screenshots, findings]
OPEN DEFECTS: [IDs, severity, owner, repro steps]
PHASE GATE: GO or NO-GO, exact rationale
NEXT ACTION: [next implementation task, no speculative completion claim]
```

On `NO-GO`, fix and retest before proceeding. Do not ask unnecessary approval for routine local implementation, but request authorization for account login, chargeable or public launch steps. Maintain `IMPLEMENTATION_STATUS.md`, `REQUIREMENT_TRACEABILITY.md`, `DECISION_LOG.md` and bug ledger as living files.

## Immediate instructions: start execution now

1. Validate the extracted handoff ZIP via `python tools/verify_package.py` and `python tools/review_kit.py` if available; report any failure accurately.
2. Inspect local runtime, `node`, package manager, Git, browser and available Cloudflare tools. If Node version mismatch, specify exact non-destructive remedy.
3. Create implementation skeleton, diagrams and architecture choices inside `app/` rather than rewriting this reference kit.
4. Follow `prompts/PHASE_00_AUDIT_AND_PLAN.md`; **then continue into implementation in order** as runtime permits, performing work rather than stopping at a plan. Respect explicit phase GO/NO-GO gates.
5. Do not publish/release until all required features and review checks for the claimed release tier pass and the user approves deployment.

**Definition of success: tested production-quality software, never a promise of perfection.**
