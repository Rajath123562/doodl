# 02 — Screen-by-screen UX and concrete UI behavior

Use original reference images in `reference/demo-v2/previews/`, but improve information hierarchy and accessibility. Build actual desktop/tablet/mobile responsive compositions; do not use static canvases for functional app screens.

## Site navigation

`/` Home; `/play` Quick Play; `/room/:code` Lobby/Game/Result based on authoritative room state; `/profile` Avatar Studio and limited profile; `/daily` Daily Doodle; `/gallery` Saved art; `/leaderboard` only with honest scope (guest/local versus verified global); `/rules`, `/privacy`, `/community`, `/help`; unknown path: branded 404 with Home action.

## Home (first 5 seconds)

1. Original Doodl wordmark and navigational items with visible focus states; mobile compact header.
2. Large legible headline communicating “Draw, guess, laugh together” and concise secondary line. Avoid 5 contradictory primary CTAs.
3. Prominent nickname input, 2–20 visible grapheme limit, trimmed safe Unicode; show validation near field, submit on Enter.
4. Primary CTA **Play with friends** opens create room; secondary **Quick Play** with real availability; tertiary **Join a room** opens room code/input.
5. Brief illustrated game-mode tiles, distinguish Available vs Coming Soon from actual feature flags. Daily challenge and gallery cards must link to real working routes.
6. Footer links rules, safety, privacy, report issue. Never claim number of players online without server measurement.

**States:** saving nickname, form error, network offline, service unavailable, invalid invite, remembered guest preferences; neither hero nor CTA may overlap at 320px.

## Create room dialog/form

Room name optional, audience Private default; cap 2–12 (default 8), rounds per player 1–5, draw time 60/75/90/120 seconds, categories Everyday default, optional protected room, custom word editor (P1), permit spectators (P2), chat moderation toggle. Explain meaning of “rounds per player” vs “turns”; do not ambiguously display “3 rounds” when game has 6+ turns. Create uses server API; loading disables duplicate submissions. Handle failed creation and token expiry.

## Lobby

Top: room name, privacy indicator, share-invite link/button, code (do not show secret password in URL). Center: 2–12 actual participant seat cards with avatars, nicknames, host badge, connected/disconnected indicator, ready status (if implemented) and a clearly separated spectator row. Right/bottom settings: controlled by host, visibly read-only for other players. Bottom action: **Start game** enabled only for authorized host and minimum 2 connected active participants; other players see `Waiting for host`. Host controls: start, kick, mute, transfer host with confirmation, lock room. Join/leave toast and error banner. Copy link must use real clipboard or fallback selectable URL. Invite may be copied or shared through OS Share API only after click.

**Edge states:** first player alone; room full; password wrong; invalid/expired code; host leaves; network reconnect; friend joins during match; participant was kicked; guest session revoked; unsaved settings; duplicate tab.

## Classic game page

**Desktop grid:** top 64–80px game bar (mode/round/turn, masked word, timer and connection). Left player leaderboard 220–260px, dominant center drawing canvas, right chat 280–330px. On 1280px center drawing available ≥600px wide; adapt to viewport rather than fixed columns. Under canvas compact accessible tool strip. On narrower devices collapse secondary panes; chat/leaderboard available via tabs/panels; input must never cover canvas controls. No UI-induced accidental pointer strokes.

**Drawing role:** choose 1 of 3 word cards in a protected modal; only drawer sees candidates and answer. Drawer toolbar: brush size and pressure, color swatches, pencil, eraser, rainbow, line, shapes, stamps, undo, redo, clear confirmation, save locally/export after round. Drawer cannot guess, but may use general chat if secrecy preserved; display clear `You're drawing` label.

**Guessing role:** rendered read-only canvas, masked word with revealed hints, guess input and send button, correct-state banner/safe chat event, point estimate only if the scoring design allows (server confirmation controls actual value). Chat (not guesses) separated semantically to prevent correct answers appearing in room.

**Visual feedback:** live network badge, drawer profile chip, correct guess animation under reduced-motion guard, handoff animation 150–250ms, disabled actions with reason, near-correct notification private to player, player-muted message, timer warning at 15s/5s with non-color labels.

## Round reveal and scoreboard

Stop drawing and guessing first; show actual answer, canvas snapshot, correct guessers with score breakdown, drawer reward, total standings and Next Round countdown. Display explicit “No one guessed it” when appropriate. Reduced motion users see immediate static results. Do not reveal hidden candidates for other prompts. Give download save option only with privacy confirmation.

## Match results

Ranked top 3 with distinct but restrained celebratory treatment, full leaderboard/ties, stat summaries derived from server (not placeholder values), **Play Again** host action, **Back to lobby**, **Share invite**, view gallery/export own drawing. Copy results text safe and optional. If disconnected at end, show recoverable outcome and retry.

## Daily Doodle

Daily prompt based on explicit timezone convention (UTC date for global challenge; display next refresh time in local timezone), 60-second solo canvas, timer, tool restrictions, submitted result and streak. If no server verified identity, label completion/XP as “saved on this device.” Prevent accidental loss on navigation. Include one-click Retry only for non-competitive practice; disallow farming the official daily attempt.

## Avatar Studio

Preview updates instantly on same screen. Controlled style presets (skin, eyes, mouth, hair/headwear, body palette and accessories) from ORIGINAL SVG vector assets; no external uploads. Large enough hit targets, keyboard selectable color descriptions, undo/reset randomize with accessible label; save locally/guest profile according to actual persistence. No false paid cosmetics.

## Gallery

First-use empty state, sort by saved time, private/offline label, opt-in save with consent, detail view/replay, Download PNG, Delete with confirmation and actual persistence removal. No public share unless server moderation and link-security contract delivered. Gallery must work under storage-quota and private-browsing exceptions.

## Duels/Chaos/Teams

Duels: split canvases (stack on mobile), independent winner indicators, same prompt only to corresponding drawers, guesses directed to specific drawing. Chaos: announce modifier and accessible effect, show remaining duration and reset at turn end. Teams: roster and score UI with color + text labels, balanced assignment and disconnect state.

## Global details

Page transitions short, purposeful and cancellable. One active focus location after route changes; skeletons only for real loading; inline form errors; all alerts actionable. Every claimed route has loading/empty/error/disabled/mobile states; no dead buttons. See `19_UX_COPY_AND_ERROR_CATALOG.md`.
