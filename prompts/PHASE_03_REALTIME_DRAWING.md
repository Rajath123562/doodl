# Antigravity Phase 3 — Genuine real-time drawing + reconnection

Read `docs/DRAWING_ENGINE.md`, `docs/REALTIME_PROTOCOL.md`, `docs/SECURITY_PRIVACY.md` and `docs/UI_UX_SPEC.md`. Build Canvas drawing engine with deterministic vector commands, own-pencil optimistic feedback and role-aware input. Use the already implemented real room WS pipeline.

- Mouse, stylus and touch Pointer Events; normalized coordinates; DPI-aware responsive canvas; pencil/eraser, palette and width options; clear, undo, redo.
- Target <=30 compact transport batches/sec from active drawer; validate bytes, points, color, tool, role, rate, current turn/canvas and event IDs server-side.
- Server assigns accepted order/revision; viewers replay exact accepted command stream; new viewer gets checkpoint+tail.
- Reconnect with credential, same seat, current redacted state, command resync and clear notice; handle double-tab and stale events.
- No full React page rerender for every stroke. Mobile must not disable page scroll outside canvas.

## Acceptance

1. Browser A draws a multicolored house; browser B sees it while A draws. Compare visually with screenshots.
2. C joins after A has drawn: receives complete current drawing, without old-turn artifacts.
3. Disconnect/reload B, rejoin and verify same room/score/canvas, no ghost seat. Turn changes reset valid canvas.
4. Send forged draw/erase/clear as guesser; all rejected and tested.
5. Test actual canvas pointer events at 390px mobile emulator, high DPI, resize and quick stroke endpoints.
6. Record measured event message count, sync latency and known weaknesses; do not fabricate benchmarks.

Stop and report actual PASS/FAIL/GO. Do not call a local-only draw successful multiplayer.
