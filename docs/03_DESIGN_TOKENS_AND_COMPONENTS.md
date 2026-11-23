# 03 — Design system tokens and component specifications

**Visual direction:** playful premium social game; senior product designer level. Elegant typography, distinctive doodle accents, friendly avatars, central canvas, restrained warm palettes. Avoid random gradients, neon glows, glassmorphism, excessive 3D, over-nested cards and generic stats dashboards. Use actual previews as moodboard only.

## Suggested tokens (baseline; check color contrast before adoption)

```css
:root {
  --page: #F8F7F3; --surface: #FFFFFF; --surface-subtle: #F1F0EC;
  --ink: #252630; --muted: #656773; --border: #E4E2DB;
  --coral: #F36F60; --coral-strong: #B53D34;
  --mint: #C7EEDB; --lilac: #DCD3F7; --sun: #FFE1A1;
  --success: #23754E; --warning: #8D5917; --danger: #A53236;
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 20px;
  --space-1: 4px; --space-2: 8px; --space-3: 12px;
  --space-4: 16px; --space-5: 20px; --space-6: 24px;
  --space-8: 32px; --space-12: 48px;
  --shadow-1: 0 2px 12px rgba(30,30,40,.055);
}
```

Do not use `--coral` as a text color on white until WCAG contrast is checked; dark `--coral-strong` for interactive text. Choose exact accessible secondary tones after automated contrast tests. Support dark theme optionally; never invert the white drawing canvas unless game mode explicitly changes canvas background. Use clear outlines for selected color, not color alone.

## Typography and density

Pick a legal commercial-use font; ideally system UI stack with one optional distinctive brand display font licensed for distribution. Headline 40–58 desktop / 28–38 mobile (responsive clamp), body 15–17px, small text 13–14px only when accessible; inputs minimum 16px for iOS. Numeric timer tabular figures; names and scores line-clamped with full title available. Consistent line-height 1.25 headers, 1.4 body. Font weights 400/500/600/700; no random nine weight values. Avoid font loading blocking play.

## Layout grids and breakpoints

- 320–599px: single-column, canvas first, fixed aspects without page horizontal overflow. Tool strip wraps or locally scrolls, chat modal/segmented tabs.
- 600–899px: two-column when safe, collapsible player info.
- 900–1199px: canvas center with chat dock; player rank as compact column.
- 1200px+: full three-panel game grid; max width 1600 and 16–32px edge spacing.
- Safe-area insets for mobile notches, on-screen keyboard avoid occlusion via visual viewport observation (feature-detect), avoid hardcoded viewport heights.

## Component inventory with states

| Component | States to implement | Accessibility contract |
|---|---|---|
| Button | default/hover/pressed/focus/disabled/loading/danger | native `<button>`, accessible name, ≥44px touch |
| Nickname input | empty/valid/invalid/saving | label, description, error role, Enter submit |
| Room seat | player/drawer/host/spectator/disconnected/muted | text roles, no color-only signal |
| Share invite | copy available/fallback/success/error | status announcement and selectable link |
| Countdown | selecting/drawing/paused/reveal/expired | tabular figures, interval announcement restrained |
| Word mask | choice/hidden/hints/revealed | no aria leakage of secret word |
| Canvas | drawing/read-only/disconnected/disabled | labelled region, keyboard alternatives for non-drawing UI |
| Tool | selected/unselected/unavailable | aria-pressed and text label |
| Chat | idle/sending/sent/rejected/muted | `aria-live` curated; avoid screen reader spam |
| Dialog | open/close/loading/confirm | focus trap, return focus, ESC if non-destructive |
| Toast | success/info/error | not sole indication of important error |
| Network banner | online/reconnecting/expired | role alert only on state change |
| Tabs | active/inactive | native controls and keyboard arrow handling |

## Motion

Small hover/press (<120ms), modal transitions 160–240ms, results 250–350ms max; avoid constant background movement, shake effects or animation during precision drawing. `prefers-reduced-motion: reduce` disables decorative motion and ensures functionality still readable. No animation blocking input or claiming state earlier than server confirmation.

## Canvas visuals

White drawing surface with subtle inset boundary, ratio 16:10 default, adaptable dimensions. Pointer markers/highlights may draw on separate overlay canvas to prevent stroke corruption. Show tool preview locally without sending as a committed stroke. Maintain crisp rendering on high DPR but cap backing resolution to protect mobile memory.

## Asset policy

Original SVG avatars/icons/doodles only. Track license/provenance in `18_GAME_ASSETS_WORD_BANK.md`; no remote image hotlink or copying competitor art. Sprite optimization for performance, size budgets by route. Design tokens centralized in source and Storybook/component demo optional, not a blocker if UI tests exist.

## Screenshot acceptance

At 1440×900, 1280×800, 768×1024, 390×844, 320×640: ensure no clipping, form submit visible, readable typography, canvas dominant, no unintentional overlays. Screenshot Home, Lobby, Drawing, Guessing, Results, Daily, Avatar, Gallery, Duels, team and invalid/error states. Run automated visual diffs with intentional review, not blind baselines.
