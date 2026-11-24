# DOODL — mandatory coding agent operating contract

Read `START_HERE.md` and `prompts/00_MASTER_BUILD_PROMPT.md` before editing. Read topic docs as each subsystem is implemented. All generated source lives in `app/`, preserve the `reference/` directory unchanged.

**Scope:** Production-oriented real multiplayer gameplay with a professional original UI and verified P0, P1, P2 requirements. The original HTML reference simulates players and is *not* live multiplayer.

## Always

1. Be honest: distinguish `NOT_IMPLEMENTED`, `SIMULATED_REFERENCE`, `IMPLEMENTED_UNVERIFIED`, `VERIFIED`, `BLOCKED`, `REGRESSION`.
2. Give every requirement a traceable ID, owner, implementation location, automated/manual test, result and evidence path.
3. Server authorize every action: player seat, host, drawer, word, score, timestamp, room lifecycle. Never accept privilege fields from client.
4. Treat WebSocket messages, text, room codes, names, custom word packs and graphical actions as hostile until parsed and validated.
5. Keep secret word private to authorized drawer until reveal, including snapshots/telemetry/analytics/errors.
6. Use durable timing, alarms, `serializeAttachment` and persistent state; test cold-start and WebSocket hibernation recovery.
7. Run real multi-context E2E and negative tests; screenshots and numbers must be authentic. No fake test results or hollow test scripts.
8. Preserve mobile/responsive/accessibility and design quality after every layout change; visual-test with reference.
9. Keep cost/persistence/rate limits within documented Cloudflare constraints; no unexpected paid resources or API calls.
10. No publish, external sharing, new paid account or destructive action without user approval.
11. For production, implement a privacy policy and operational procedures matching *actual* data processing, including reporting and deletion.
12. Update docs and changelogs with code, keep decisions explicit; use versioned protocol and migrations.
13. Apply the `unslop` design standard (quiet chrome, 4px grid, no purple/blue gradients or glowing blobs, sentence case, one bright element) to every UI and UX component.

## On every phase completion

Report: files changed; actual commands; pass/fail/skip counts; real 2-browser evidence; user journeys; security findings; performance data or `NOT MEASURED`; bugs with severity; GO/NO-GO; next phase. If NO-GO, fix before advancing.

## Non-negotiable quality bars

- No blackhole error catches, fake users, simulated online room count, fake global leaderboard, stub or placeholder in claimed release features.
- No unverified 'production ready', '100% secure', '0 bugs', 'unlimited scale', or 'free forever' claims.
- No external copyrighted avatars, word lists or logos without an appropriate license and attribution.
- No source file larger than necessary and no giant untestable monolith; prefer domain modules and typed boundaries.
- Don't cram all design content into a single massive prompt response; read relevant workspace docs and implement in bounded steps.
