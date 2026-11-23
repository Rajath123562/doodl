# Antigravity Phase 5 — Premium product UI/UX and mobile polish

Keep all passing real multiplayer tests. Recreate/improve DOODL reference visual identity in reusable, cohesive React components. Read `docs/UI_UX_SPEC.md`, inspect `reference/demo-v2/index.html` and screenshots, and use browser to test actual interactions.

Design standards: premium friendly playful, clean professional hierarchy, elegant typography, restrained motion, warm neutral surfaces and thoughtful coral/mint/lilac accents. No generic AI dashboard visuals, neon, gratuitous glass/card nests, giant useless padding or unexplained empty surfaces. All visible controls must work or be clearly disabled.

- Rework home, create/join, lobby, live game (player ranking/canvas/chat/tool row), word selection, results, help/settings, error and reconnection states.
- Desktop: prominent canvas, player sidebar left, guess/chat right. Mobile: canvas-first layout, reachable toolbar, guess sheet/input without keyboard occlusion, scrollable chat, pointer-safe drawing.
- Original small avatar illustrations/icons; optimize and document attribution/licenses; no competitor branding.
- Accessible colors/labels/focus, pointer targets >=44px, keyboard paths and `prefers-reduced-motion`.
- Test layouts 1440×900, 1280×720, 768×1024, 390×844, 320×640, plus one landscape mobile.

## Acceptance

- Playwright screenshots for home, 2-player lobby, drawing, guess, final results and disconnected state on desktop/mobile.
- No clipped canvas/controls or page-level horizontal overflow; no accidental canvas drawing while scrolling mobile chat.
- UI screenshot visual regression reviewed intentionally, not merely approved by script.
- Full prior functional/unit/E2E tests still pass. Provide before/after examples and rationale for every major change.
