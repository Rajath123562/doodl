# Product requirements (PRD) — DOODL.

## Positioning

An original, browser-based multiplayer drawing-and-guessing party game. No mandatory signup to play with friends. Strong visual polish, precise real-time interaction, compelling short rounds, creator-friendly replays and later competitive modes. Draw inspiration from the game genre, not any competitor's copyrighted assets or proprietary implementation.

## Product principles

- **Play within 30 seconds of arriving:** create or enter a room without a form or mandatory email.
- **A drawing-first interface:** the canvas is central; guessing/chat never covers it.
- **Unambiguous game state:** who draws, whose turn, whether a guess is accepted, how points were earned, why a connection dropped.
- **Real humans, real network:** never silently simulate multiplayer participation in the production application.
- **Privacy by default:** anonymous guest nicknames, minimal collection, opt-in artwork saving and share controls.
- **Distinctive visual identity:** warm neutrals, coral accent, subtle mint/lilac/yellow, original playful avatar style; refined product typography.

## Target personas and journeys

**Friends in a room (P0):** A opens site, picks name, clicks Create Private Room, gets `https://<origin>/room/<code>`, sends to B. B joins from a different device. A starts; B sees A draw; B guesses; both see points and final result; they can play again. Changing devices should not silently impersonate another person.

**Public game (P1):** C selects Quick Play, server places them into an eligible public room with an appropriate player limit and current phase. No fake player counters. Empty directory returns a clear “Create public room” action.

**Creator (P1):** D draws, uses rainbow/line/stamps/undo, optionally saves/export PNG or a replay, confirms whether anything becomes public. Deleting removes server copies where stored, not merely UI cards.

**Mobile player (P0):** E opens invite on Android/iOS, enters nickname, draws with finger, scrolls chat without accidental canvas strokes, submits a guess via mobile keyboard and rejoins after an interrupted connection.

## Prioritized features

### P0 — multiplayer beta

- Guest nickname/character identity, private room creation/join, link copying, room passwords optional, host settings, 2–12 players, spectators off by default.
- Classic game: 3 word choices, 90-second drawing rounds, 3 rounds per player by default (configurable 1–5), simple clear score rules.
- Canvas pencil/eraser/brush sizes/color, undo/redo, reset, real-time other-player rendering, late-join snapshot.
- Word pack “Everyday” with verified original/appropriately licensed words, profanity/ambiguity filter, no confidential or inappropriate words.
- Guesses with server validation, color-coded feedback (“close”, “correct”), score and winners, scoreboard; room chat with rate limiting and player moderation.
- Room lifecycle: disconnect/reconnect, expired invite, full room, host transfer, drawer disconnect, duplicate-tab resolution, invalid state rejection.
- Responsive desktop and mobile layouts and basic accessibility.
- Honest persistent status, test suite and observable production errors.

### P1 — full feature product

- Public rooms/Quick Play with privacy protections; custom word/category packs with filtering; no unmoderated default global room listings.
- Rainbow brush, line/shape tools, sticker stamps, replay, downloadable PNG and opt-in gallery.
- Avatar customization, local or server-verified XP, achievement badges, daily solo challenges, word category packs, Blitz mode, reactions, optional spectator.
- Language architecture (English pack first; Hindi/Kannada after native-speaker review of word normalization, word packs and font layout).
- Shareable round highlights; no public user-generated gallery without reporting and moderation.

### P2 — signature modes and engagement

- Drawing Duels: two real canvases, two drawers, fair scoring and independent validation.
- Chaos Mode: bounded, reversible server-selected modifiers, clearly advertised per round.
- Team Battles: team roster, shared scoring and turn fairness.
- Competitive ladders only after identity, cheating and abuse controls are credible.

## UI routes / destinations

- `/` home and nickname
- `/play` public matching queue (P1)
- `/room/:roomCode` real lobby / game / match results
- `/daily` daily solo challenge (P1)
- `/gallery` personal opt-in art (P1)
- `/profile` avatar/profile cosmetics (P1)
- `/rules` gameplay rules / safety / reporting

## Out of scope unless explicitly authorized

- Payments, ads, purchasing, tokens, forced accounts, user-generated voice/video streams, arbitrary file uploads, generative-AI drawing scores, mobile native app, unattended mass-scale public launch.

## Room defaults and hard ceilings

Defaults: 8 seats, 90s draw, 3 rounds per player, 3 candidate words. Hard ceiling: 12 active players (until verified load testing supports more), maximum 4 spectators initially (P1), 60–120s supported classic timers, 20–45s Blitz (default 30s). Server must validate every setting rather than trusting client-supplied caps.

## Success criteria

The MVP is successful when **two real browser sessions** can join and complete a match with consistent drawings, guesses, word secrecy, server timestamps/scores and reconnection; it also passes the required malicious-input and mobile tests. A release is not successful if only the UI, static HTML, or automated unit tests exist.
