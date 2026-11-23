# Using the supplied V2 demo responsibly

Open `reference/demo-v2/index.html` in Chrome or Edge, or serve it from a local HTTP server for its browser-local persistence to work consistently. This is the **existing interactive design prototype**, not the production app.

## What to inspect visually and reimplement cleanly

- `previews/home.png`: warmth, primary actions, mode cards, avatar and brand balance.
- `previews/playing-with-new-tools.png`: actual in-game canvas and palette/hud hierarchy.
- `previews/results.png`: score celebration, round result density and CTA placements.
- `previews/avatar-studio.png`: friendly customizable avatars, modal behavior and controls.
- `previews/art-gallery.png`: drawing thumbnails and save/download/delete layout.
- `previews/mobile-daily.png`: responsive/mobile design choices.

You may use reference assets locally as placeholders if their provenance is original from this project, but prefer rendering new vector illustrations/components rather than embedding entire screenshots. Do not copy a screenshot as an image background and claim the screen is implemented.

## Correct migration approach

1. Audit the demo interactions with devtools. Record all controls, states and mobile issues in `docs/reference-audit.md`.
2. Recreate a reusable React design system; no wholesale wrapping the existing static page inside an iframe.
3. Wire the redesigned lobby to real room/seat endpoints and the gameplay UI to genuine WebSocket events.
4. Replace simulated chat, word choice, scoring and players with server-trusted data; use seeded test fixtures **only** inside test/dev mode with clear labels.
5. Keep a screenshot regression set to compare meaningful visual hierarchy, not exact pixel identity.
6. Preserve original assets/licenses and explain any intentional divergences.

## Explicit prototype-only behavior to remove

Simulated multiplayer participants, fixed 'pizza' answer as general logic, fake/placeholder joining, fake global player counts and unverified XP awards. Their existence in the demo is not a production implementation shortcut.
