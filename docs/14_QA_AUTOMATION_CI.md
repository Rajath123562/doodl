# 14 — Testing strategy, CI, code quality and evidence

## Expected repository scripts (must not be echo-only)

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:e2e
npm run build
```

If package manager changes, document lockfile and equivalent commands. `npm ci` is preferred in CI after `package-lock.json` exists. CI checks should fail on failing required tests, new critical lint errors, TypeScript errors, unsafe artifacts and secret scanning findings; no blanket `--force`/skip.

## Test pyramid

**Unit (Vitest):** state transition table, timeout boundaries, choice and turn order, no response after close, score formula vector, first correct, hint penalties, exact tie rule, Unicode mask, normalized matching, XP thresholds, streak dates, tool geometry, server validation limits and unauthorized role checks.

**Integration (real Workers-like runtime):** Cloudflare Worker route and session + DO under supported test environment; room create/join/auth, DO alarm and storage durability, websocket upgrades, snapshot redaction, cookie/Origin checks, password, idempotency, storage migration, disconnect/reconnect, room delete and TTL. Stub cloud services only if transparent and supplemented by staging verification; no test that accidentally exercises mocked game instead of Worker handlers.

**Browser E2E (Playwright):** 2 truly isolated contexts sharing real running backend; host joins/starts, drawer word secrecy, real strokes, guesses, scoreboard, replay, refresh/reconnect, role denial. Browser contexts must not share cookies/local storage unless testing same guest intentionally. Record screenshot, trace/video for failures, console errors, network frames when investigating security.

**Adversarial:** create malicious raw WS client; unauthorized `room.start`, `word.select`, `draw.clear`, high score injection, stale turn, wrong session, massive WS frames, chat XSS, brute force room password, custom word spam and profile/identity spoof. Test expected structured rejection and invariant unchanged.

**Visual/accessibility:** screenshot compare at 320/390/768/1280/1440, high DPI, keyboard-only, NVDA/VoiceOver manual spot check, reduced motion, mobile safari smoke, long/duplicate/RTL/Unicode names, virtual keyboard and status banners.

**Performance:** 2/6/12 seat load, measurable RTT, p50/p95 stroke latency, memory, CPU, quota model and 30 minute soak. Use local seeded test data and accurate distinct-socket harness rather than screenshot-only bot.

## Sample browser test pseudocode

```ts
// Example spec: do not copy verbatim until selectors/API exist
const host = await browser.newContext();
const guest = await browser.newContext();
const hostPage = await host.newPage();
const guestPage = await guest.newPage();
await hostPage.goto(baseURL);
await hostPage.getByRole('button', { name: /create private room/i }).click();
const invite = await hostPage.getByTestId('invite-url').inputValue();
await guestPage.goto(invite);
// Join as distinct guest, assert actual shared roster and networked drawing.
// Inspect received socket frames for any answer leak before REVEAL.
```

## Traceability and evidence

One spreadsheet-like Markdown matrix under `app/docs/REQUIREMENT_TRACEABILITY.md`: requirement ID, tier, route/component, backend handler, tests, test command, PASS/FAIL/NOT_RUN, evidence path, date, commit, owner. One unrun test is NOT PASS. Record defects with severity, reproduction, expected vs actual, screenshot/log, fix commit and regression test. `qa/evidence/<date>-<sha>/` may contain screenshots/log excerpts (redacted secrets).

## Branch and release workflow

- `main` protected after setup, feature branches per phase, review diff (agent acting as strict reviewer when no peer) and commits only after tests pass.
- Minimum CI: install, lint, typecheck, units, Worker integration, browser E2E, build, dependency/secret scan and artifact archive.
- P0 gate: all P0 acceptance tests passed and independent staging smoke; P1 and P2 independently gated. Do not block progress on intentionally later-tier tests during P0 implementation but never claim “complete game” while later tiers missing.
- Re-run full regression after game-engine, WS protocol, rendering pipeline or schema migration.

## Flakiness management

Never hide flaky tests via broad retries. Identify timing race, isolate real server time or use deterministic injected test clock, add explicit assertions and bounded waits. If test skipped due to browser/platform limitation, keep NOT VERIFIED with manual follow-up. A green CI badge is only one input to release review.
