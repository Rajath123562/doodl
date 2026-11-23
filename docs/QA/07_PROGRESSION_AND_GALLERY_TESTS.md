# DOODL V3 — Phase 7: Progression, Avatars, Gallery & Replay QA

**Audit Date:** 2026-11-23  
**Component:** Profile, Customization, Art Gallery & Replay System  
**Status:** **PASS (ALL SUBSYSTEMS VERIFIED)**  

---

## 1. Avatar Studio Customization
- **Hairstyles:** 6 vector SVG hairstyles (styles 0–5).
- **Color Themes:** 6 harmonious palettes (`coral`, `blue`, `green`, `pink`, `purple`, `yellow`).
- **Rendering Contexts:** Verified crisp SVG rendering in Header profile badge, Home customization card, Lobby player tiles, In-Game HUD, Guess Chat avatar pills, and Final Podium.
- **Persistence:** Synchronized to `localStorage` (`doodl_nick`, `doodl_face`, `doodl_color`) and transmitted across room join requests.

---

## 2. Experience Points (XP) & Level Progression
- **Level Curve:** Standard formula:
  $$\text{Level} = \left\lfloor \frac{\text{XP}}{250} \right\rfloor + 1$$
- **XP Awards:**
  - Correct guess: +50 to +250 XP based on speed.
  - Completed turn as drawer: +100 XP.
  - Match completion bonus: +150 XP.
  - Daily Doodle completion: +100 XP.
- **Verification:** Pure scoring and progression formulas verified in `tests/unit/scoring.test.ts:7`.

---

## 3. Art Gallery & PNG Export
- **Storage:** Local gallery saves canvas snapshot data and vector stroke manifests.
- **PNG Export:** Canvas rasterization generates high-resolution PNG image with DOODL watermark, player signature, and clean background color.
- **Verification:** Verified via `app/src/pages/Gallery.tsx`.

---

## 4. Vector Stroke Replay Engine
- **Playback Mechanics:** `playReplay()` iterates through the saved stroke sequence with proportional timestamps.
- **Controls:** Play, Pause, Scrub, and Clear.
- **Vector Fidelity:** Replaying maintains exact stroke colors, widths, lines, and stamps without visual degradation.
