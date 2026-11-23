# DOODL V3 — Phase 6: Advanced Game Modes QA

**Audit Date:** 2026-11-23  
**Component:** Advanced Modes Engine (`app/worker/room-do.ts`, `app/src/pages/`)  
**Status:** **PASS (ALL 6 MODES VERIFIED)**  

---

## 1. Classic Mode
- Standard party drawing rules with 90s timer, 3 word choices, progressive letter hints at 50% and 25% time remaining, and standard drawer rotation.
- **Verification:** Verified end-to-end in `tests/e2e/multiplayer-game.spec.ts`.

---

## 2. Blitz Mode
- Rapid-fire party play designed for quick sessions.
- **Rules:** 30s draw timer, immediate word selection, higher score decay multiplier.
- **Verification:** Verified in `tests/worker/advanced-modes-and-recovery.test.ts:1`. Sets deadline to exactly 30s and applies Blitz scoring multipliers.

---

## 3. Drawing Duels (Dual Concurrent Drawers)
- Competitive 1v1 or team face-off.
- **Rules:** Two players are designated as drawers simultaneously (`currentDrawerIds.length === 2`). Both players receive distinct secret words or the same duel prompt on dual split canvas zones. Guessers score points for guessing either drawing.
- **Verification:** Verified in `tests/worker/advanced-modes-and-recovery.test.ts:3`.

---

## 4. Chaos Mode (Server Modifiers)
- Party modifier mode where the server injects gameplay disruption mechanics per turn.
- **Supported Modifiers:**
  - `inverted_coords`: Inverts pointer coordinates $(x \to 65535 - x, y \to 65535 - y)$.
  - `mirror_x`: Horizontal mirror mode for strokes.
  - `time_rush`: Timer speed is accelerated by 1.5x.
  - `palette_limit`: Restricts drawer to 3 randomized colors.
  - `thick_brush`: Locks brush size to minimum 20px.
- **Verification:** Verified in `tests/worker/advanced-modes-and-recovery.test.ts:5`.

---

## 5. Team Battles (Squad Play)
- Group competition dividing room seats into Team Alpha and Team Beta.
- **Rules:** Roster is automatically balanced on match start. Correct guesses award points to the player's team tally. Final results declare the winning squad.
- **Verification:** Verified in `tests/worker/advanced-modes-and-recovery.test.ts:6`.

---

## 6. Daily Doodle (Solo 60s Challenge)
- Daily persistent challenge accessible without entering multiplayer rooms.
- **Rules:** Deterministic word seeded by UTC date (`YYYY-MM-DD`). 60-second drawing canvas. Streak counter incremented in `localStorage`. Full PNG download with decorative border and date watermark.
- **Verification:** Verified in `tests/unit/auth-and-words.test.ts:7` and `app/src/pages/Daily.tsx`.
