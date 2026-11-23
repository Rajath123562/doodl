# doodl. v2 — Interactive Drawing Game Concept

A **single-file, offline-capable frontend prototype** of an original browser drawing-and-guessing party game inspired by the general gameplay genre of Skribbl.io. It is not a deployed multiplayer game.

## Run it

Open `index.html` in a recent version of Chrome, Edge, or Firefox. No dependencies, account, installation, or internet connection are required. The prototype also supports touch drawing on phones and tablets.

If browser settings prevent `localStorage` when opening a local file, serve the folder with a local static server (`python -m http.server 8000` from the package folder, then visit `http://localhost:8000`). The browser's storage policies control whether saved artwork and XP persist. You can always export your artwork as PNG.

## Newly implemented interactive features

| Feature | How to try it | What really works |
| --- | --- | --- |
| Daily Doodle | Home → Daily Doodle | A predictable prompt that changes with local calendar day, a 60-second timer, once-per-day +100 XP, a daily streak recorded in browser storage. |
| Art Gallery | Draw → Save art → My gallery | Creates an image preview, keeps up to 8 saved images in local browser storage, allows download and deletion. |
| Avatar Studio | Click your avatar at top right | Change among six faces and six colors; preferences saved locally. |
| Rainbow Brush | Start a drawing round → 🌈 | Multicolor stroke segments on canvas; included in replay and export. |
| Line Tool | Drawing round → ╱ | Drag to create a straight line, supports undo and redo. |
| Sticker Stamps | Drawing round → ⭐ | Pick and place emoji stamps, included in export. |
| Custom Colors | Drawing round → color square | Pick custom browser color and draw. |
| Quick Reactions | Game → emojis below canvas | Floating emoji reactions and local reaction count. |
| Hints with penalty | Game → Try guessing → 💡 Hint | Reveals letters of the demo word PIZZA, reduces awarded points by 60 per hint. |
| XP and Levels | Complete Daily Doodle or guess pizza | Stores local XP; level increments every 250 XP; achievement badges in Avatar Studio. |
| Blitz Mode | Home → Blitz → Start | Fixed 30-second drawing round. |
| Word Packs | Lobby → Word pack | Changes actual word choices for drawing turns (Everyday, Animals, Movies & memes). |
| PNG Export | Start drawing → ↧ PNG | Downloads actual current canvas as an image. |

Existing V1 functions preserved: room/lobby flow with **simulated** players, classic/chaos/duels prototype modes, interactive guessing, drawing with pencil and eraser, undo/redo, result view, and stroke replay.

## What this prototype does **not** include

There is **no real multiplayer server, real public matchmaking, real invite-code joining, shared drawing synchronization, online accounts, permanent cloud gallery, or online moderation**. The room participants and opponent actions are simulations; the word in the guessing demo is PIZZA. Gallery and XP exist only on this browser, and can be cleared along with site data. The daily challenge is a solo browser feature, not a verified global competition. The interface is a visual and interaction reference for a full production implementation.

## Design

Light, playful product aesthetic; original vector characters; accessible labels; touch canvas; responsive mobile layout; reduced-motion styles. Screenshot previews are in `previews/`.

## QA smoke checks performed

A headless Chromium run completed the following without JavaScript runtime errors:

- Home and features navigation, avatar selection.
- Daily prompt, actual pointer drawing, rainbow strokes, line tool and stamps.
- Reaction counter, canvas save and PNG download.
- Daily result and XP award, gallery preview.
- Lobby word pack selection and 30-second Blitz mode.
- Switching to guessing, hint reveal and reduced score on correct PIZZA answer.
- Narrow-screen rendering at 390px width (no horizontal overflow).

The browser test environment blocked navigation to local/localhost URLs, so the test loaded HTML directly into the page and used an in-memory localStorage shim to exercise persistence code. Real browser file-origin persistence and true online networking are **not** verified by this test.
