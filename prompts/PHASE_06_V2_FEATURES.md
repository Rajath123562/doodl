# Antigravity Phase 6 — Convert V2 reference features into real, tested features

Read `docs/FEATURE_STATUS.md`, `docs/PRODUCT_SPEC.md`, `docs/DRAWING_ENGINE.md` and `docs/SECURITY_PRIVACY.md`. Add feature-rich functionality without breaking the verified Classic game.

Implement in staged slices and verify each:

1. New vector tools: rainbow, line, sticker allowlist and custom colors. Sync as validated commands across live clients with deterministic undo/redo/replay.
2. Personalized avatars with accessible UI, server-verified cosmetic choices, persistence policy.
3. P1 word packs, room customization and real public matchmaking with accurate occupancy and private-room exclusion.
4. Blitz mode with server-owned 30s countdown/expiry and actual round results.
5. Daily Solo Doodle: daily seeded prompt, honest completion logic and **server-backed once-per-day XP rewards only if account/guest integrity supports it**. Do NOT claim the art is semantically assessed if no real scoring algorithm exists.
6. XP, levels, earned badges and clear progression rule; no refresh-farmable points.
7. Gallery: local opt-in save, PNG export and delete; if adding cloud storage, document consent, quotas, retention, moderation and privacy, and test deletion end-to-end.
8. Emoji reactions rate limited, motion-reduced and hidden from drawer pointer events.
9. Replay player with controls and exact accepted strokes plus timestamps; no secret word before reveal.

## Acceptance

- Separate-client rainbow/line/sticker drawings match, including undo/redo and late join.
- True public matchmaking returns accurate real seats; no fake active player count.
- Daily XP cannot be collected again on reload/duplicate API request; if not provable, keep local-only and label it.
- Export/save/delete actually work; no silent public upload.
- Mobile touch tests, security checks and all Classic regressions pass.

Report individual feature status and test evidence; a partial Phase 6 must remain PARTIAL, not PASS.
