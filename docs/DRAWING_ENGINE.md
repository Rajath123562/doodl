# Canvas drawing engine: accuracy, sync, replay and accessibility

## Core renderer

- Use HTML Canvas 2D for active strokes; `devicePixelRatio`-aware internal canvas, CSS layout independent of coordinate system. Normalize all pointer input to a stable logical canvas (e.g. 1280×720 aspect ratio), then encode bounded uint16 points.
- Support `PointerEvent` down/move/up/cancel, `setPointerCapture` when appropriate; mobile `touch-action: none` **only over active canvas**; the rest of the page remains scrollable.
- Distinguish drawing from guessing role. A guesser must see the canvas but cannot accidentally draw or emit draw events.
- Support low-motion preferences; never rely on color alone to indicate correctness. Make toolbar controls keyboard-focusable with labels/tooltips.
- Keep active strokes on a lightweight layer or overlay and redraw completed immutable strokes when revision changes. Do not rerender full React tree for every pointer move.

## Event representation

```ts
type Point = { x: number; y: number; dtMs?: number; pressure?: number };
type Stroke = {
  strokeId: string;
  turnId: string;
  canvasId: string;
  tool: 'pencil'|'eraser'|'line'|'rainbow'|'sticker';
  color: string;
  size: number;
  points: Point[];
  stickerId?: string;
  createdAtServerMs?: number;
};
```

For replay/save, server should stamp a monotonic sequence number and accepted time offset. Client event timestamps are hints only. Eraser semantics must be deterministic; prefer compositor-based erase as a draw command, not erase-only-local pixels that cannot replay. Rainbow brush must derive its color sequence consistently from stroke offset, or include bounded color path data. Line tool has explicit start/end points; sticker tool uses curated static glyph IDs from an allowlist, not arbitrary downloaded images.

## Network batching strategy

- Render own pointer stream immediately for perceived responsiveness (optimistic local view), send compact batches at roughly 20–30Hz or when the stroke ends.
- Server rejects invalid role, color, tool, coordinates, point count, byte size, time window and event rate. On rejection, reconcile local optimistic stroke against authoritative state.
- Broadcast accepted strokes with global canvas revision and monotonically increasing sequence. Deduplicate by `{seatId, clientEventId}`.
- Late join and reconnect: fetch bounded checkpoint followed by tail of accepted events. Verify checksum/revision; full-sync if gap/CRC invalid.
- Limit stroke count, undo depth, concurrent replay work, image export pixel dimensions and gallery storage.

## Undo/redo/clear

- A single authoritative ordered command log defines visible canvas output. `undo` targets the current drawer's last eligible action and is itself a server-authored revision; redo stack invalidated by new ink after an undo.
- No guesser/spectator/previous drawer undo privileges. Prevent stale undo during phase transition. A canvas clear is an authorized undoable command only if explicitly designed and tested.
- Drawing clear when a new word begins is a distinct server event and revision reset/new canvas ID; late join should never see remnants of a previous word.

## Replays and exports

- Replay reuses the same pure renderer and accepted command log, using recorded monotonic relative times. Provide controls for play/pause/restart/speed and reduced motion; avoid exposing secret choices prior to result reveal.
- PNG export is local. Optional server gallery storage should be opt-in with explicit retention and deletion, thumbnail bounds, moderation/reporting for public sharing and no auto-upload.

## Visual correctness checklist

- DPI scaling, window resize, landscape/portrait mobile, canvas CSS scaling, browser zoom, touch scroll, stylus hover, pointer cancellation, network jitter.
- Single-point tap draws a dot; straight lines and large fast movements preserve endpoints; undo/redo deterministic for all tools; two clients render the same command list identically within tolerance.
- Empty canvas and layers render cleanly; screenshot test for Safari/WebKit and Chromium.
