# Verification gates: real multi-client acceptance matrix

A test is **PASS** only when it has actually run against implementation code or a running preview with observed expected result. Mark skipped tests as `SKIPPED/NOT VERIFIED`, not green. Keep logs/artifacts in `test-results/` or CI, and summarize in `IMPLEMENTATION_STATUS.md`.

## Minimum test pyramid

- Unit: word normalization, state transition matrix, scoring formula, time expiry, player order, hint cost, role checks, stroke math, undo stack, protocol parsing and bounds.
- Integration: Worker routes, guest session and invite join, real per-room DO, server authorization, alarm recovery, state snapshots, WS reconnect, persistence and room expiry.
- Browser E2E: **two or more independently isolated browser contexts**; ideally a separate phone on deployed staging before public launch. Use Playwright with deterministic test word pack and clock injection in test environment only.
- Adversarial tests: raw HTTP/WebSocket malicious payloads, limits and secret exposure.
- Visual/performance: desktop/tablet/mobile screen snapshots, long-chat, full room, low bandwidth, high DPR and reduced motion.

## Classic + lobby cases — P0

- QA-001 Create room: returned server-generated nontrivial code, real host seat, stable link; no simulated join.
- QA-002 Join valid private link from independent browser: both see two real participants.
- QA-003 Join nonexistent code: clear error, no blank hang.
- QA-004 Join full room: rejected without corrupting existing count.
- QA-005 Join wrong password: rejected, throttled, no password leak.
- QA-006 Duplicate nickname: distinct seat IDs, deterministic display distinction.
- QA-007 Empty nickname, huge nickname, Unicode nickname, HTML payload: safely handled.
- QA-008 Host-only settings update enforced; nonhost cannot change.
- QA-009 Start blocked at 1 player; allowed at 2 connected eligible players.
- QA-010 Unauthorized host `kick`/`mute`/`start` rejected server-side.
- QA-011 Private room absent from public matchmaking.
- QA-012 12-person full room lifecycle with caps, no ghost participants.
- QA-013 Mid-match join policy works and is visibly explained.
- QA-014 Host disconnect triggers correct host transfer after documented grace.
- QA-015 New host can legitimately administer; old host cannot after removal.
- QA-016 Late room expiry/closed room returns clear structured response.

## Game engine and secrecy — P0

- QA-017 Word candidates visible only to drawer.
- QA-018 Raw snapshot of guesser lacks secret word, candidates and answer hash.
- QA-019 Word selection timeout chooses server-side fallback.
- QA-020 Drawer can never submit eligible guess; guesser cannot choose word.
- QA-021 Correct guess yields precise server-derived score; expected formula unit tested.
- QA-022 Wrong guess doesn't reveal answer or award points.
- QA-023 Duplicate correct guess does not award twice.
- QA-024 First/second correct ranking and speed bonus calculated deterministically.
- QA-025 Hints cost recorded server-side; refresh does not erase penalty.
- QA-026 Client-injected fake score/correct/timer fields rejected.
- QA-027 Late guessed event after deadline is rejected; no race double award.
- QA-028 All correct early round termination once, not twice.
- QA-029 Round timeout reveals word only after timer.
- QA-030 All players get consistent next drawer and rounds.
- QA-031 Final leaderboard/winner and tie-break consistent across browsers.
- QA-032 Drawer disconnect grace/skip rule prevents stalled match.
- QA-033 Duplicate `room.start`, phase transition, or score event remains idempotent.
- QA-034 Return to lobby / Play Again resets match state safely.
- QA-035 Chat never echoes correct answer in room-wide broadcast during DRAWING.
- QA-036 Chat/XSS malicious content rendered as text, not HTML.

## Draw sync and networking — P0

- QA-037 Two real human clients see strokes within measured expected response.
- QA-038 Erase/undo/redo/clear accepted only from drawer; watcher renders updates.
- QA-039 Raw unauthorized WebSocket draw rejected.
- QA-040 Pointer move at high speed makes continuous stroke, no dropped endpoints.
- QA-041 Browser resize/DPR change preserves stroke alignment and hit area.
- QA-042 Touch pen/finger draws and page can still scroll outside canvas.
- QA-043 Reconnect restores same seat and no doubled score.
- QA-044 Reconnect mid-round receives current redacted state and drawing.
- QA-045 Late join receives checkpoint+event tail, no missing/duplicate strokes.
- QA-046 Packet duplicate/reordered/replayed events handled by ID/sequence.
- QA-047 Room continues after host connection is interrupted.
- QA-048 Explicit Leave releases seat or applies documented retention semantics.
- QA-049 Active drawer tool mismatch (line/sticker not enabled) rejected.
- QA-050 Larger-than-max payload and invalid coordinates safely rejected.
- QA-051 DO wake/recovery preserves deadline and state, not timer reset.
- QA-052 DoS-style bursts trigger throttling, not uncontrolled billing/memory.

## UI, accessibility and mobile — P0/P1

- QA-053 Home/lobby/game/results at desktop 1440×900.
- QA-054 Tablet 768×1024, mobile 390×844 and 320×640 no horizontal overflow.
- QA-055 Mobile keyboard on guess input does not occlude submit or canvas permanently.
- QA-056 Tool controls focusable and named for screen readers.
- QA-057 Reduced-motion mode disables ornamental loops while retaining state.
- QA-058 Color contrast and color-blind distinguishability in scoring/chat.
- QA-059 Buttons show loading/disabled/error state where appropriate.
- QA-060 Room disconnect shows genuine reconnection status and recovery path.
- QA-061 Correct guessing visible/announced without relying only on green color.
- QA-062 Images/avatar show text alternatives; no broken images/network font reliance.

## Expanded features — P1/P2

- QA-063 Rainbow/line/sticker tools replay identically on separate clients.
- QA-064 PNG export contains actual current canvas with correct resolution.
- QA-065 Undo/redo after clear, new stroke and turn change has deterministic behavior.
- QA-066 Daily once-per-day XP cannot be farmed by refreshing/sending raw request.
- QA-067 Guest profile XP/level persists according to documented identity policy.
- QA-068 Gallery save is opt-in, delete removes actual storage, shared gallery requires privacy review.
- QA-069 Quick Play matches actual available room or creates truthful empty state.
- QA-070 Replay never leaks word before reveal and can pause/speed/change.
- QA-071 Duels two canvases are synchronized separately and cannot cross-authorize.
- QA-072 Chaos effects deterministic, disclosed and reversible.
- QA-073 Teams scoring and roster rules deterministic across dropouts.
- QA-074 Multiple languages' word normalization validated by speaker-reviewed test examples.
- QA-075 Emoji reaction rate limiting and reduced motion verified.

## Performance & operational acceptance

- Measure P50/P95 *drawing-event end-to-end latency* using two geographically realistic connected clients; define target (e.g. P95 <250ms under noncongested conditions), report actual results and device/network. Never advertise unmeasured <50ms claims.
- Measure React commit frequency while drawing; aim to avoid redraw of unrelated chat/sidebar on every pointer event.
- Full 12-player room on locally simulated jitter/loss; no incorrect scoring and graceful degraded UI.
- 30-minute soak; memory trends, CPU and message count; alarm/hibernation behavior verified.
- Check hosting quotas vs a conservative 100/1,000/10,000 daily active-player model; track worst-case messages per round and storage writes.
- Dependency audit, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build` must all return success for release.
- Deployed staging URL works on distinct networks/devices; rollback instructions tested; errors/uptime observability in place.

## Test evidence format

For every test suite: timestamp, Git commit, environment/browser, command, passed/failed/skipped counts, artifact links/paths, outstanding defect IDs. Include raw screenshots for home, lobby with two real players, live drawing on second client, score result, mobile game, connection failure and advanced mode when applicable.
