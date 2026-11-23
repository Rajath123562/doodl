# 12 — Mobile, accessibility, cross-browser and localization

## Accessibility baseline

Follow WCAG 2.2 AA as the intended standard where applicable; document any inherently difficult real-time drawing interaction and provide accessible instructions/alternatives. All semantic actions are focusable with keyboard, visible focus ring, correct name/role/value. Native form controls, `aria-pressed` on tool toggles, labelled dialogs with focus containment, roving tab index only when needed. Chat/score updates shouldn't flood `aria-live`; announce impactful state changes (new drawer, your correct guess, results). Timers use visual and text, not pure color. Provide reduced-motion mode with no loss of functionality. Color palette choices show labels and selection marks in addition to swatch color.

## Screen targets

Test widths/heights at 320×640, 360×740, 390×844, 430×932, 768×1024, 1024×768, 1280×800, 1440×900 and a high-DPR Android handset. No document horizontal overflow, tap target approx 44×44px, no text clipping, no button behind bottom browser chrome/safe areas. Tablet portrait may use alternate sidebar layout. Do not assume browser screen dimensions equal viewport after keyboard appears.

## Canvas/pointer contract

- Use Pointer Events (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `lostpointercapture`), `setPointerCapture` where supported; unify mouse/touch/pen; only initiate stroke on active authorized drawer and inside canvas.
- Set `touch-action:none` on canvas only, not the full page; scrolling/lobby still works. Use `getCoalescedEvents` when available to improve pen quality; feature-detect pressure (default sensible 0.5) and clamp values.
- Normalize coordinates from CSS pixel bounds to integer 0..65535; save logical paths and redraw after resizing/high DPR. Use `ResizeObserver`, clamp DPR/backing surface memory, render smoother Catmull-Rom or quadratic segments without changing authoritative point semantics.
- On multitouch, handle second finger as pan/ignored safely; do not create a line between touch points. On cancel/lost capture, end stroke safely and reconcile with server. Avoid accidental page zoom during play while maintaining pinch zoom accessibility outside drawing region.
- Mobile guesses must retain focus/send after on-screen keyboard opening. No `autofocus` that automatically opens keyboard on entry. Floating chat overlay cannot block essential drawing interactions.

## Browser support

Current stable Chrome, Edge, Firefox, iOS Safari, Android Chrome. WebSocket, PointerEvent and Canvas expected; optional share/clipboard/storage/pressure have progressive fallbacks. Safari private-mode storage failures must not crash game. When tab is backgrounded or browser suspends, timer uses server timestamp and syncs on return, not local intervals.

## Internationalization

Use message IDs and locale data, not concatenated English strings; test RTL layout readiness but only officially publish reviewed languages. English is P0. Hindi (Devanagari) and Kannada require **human-validated** word packs, font coverage, inflection/spelling rules, normalization unit tests, and accessible form validation. `NFKC` must not silently erase legitimate distinctions. Non-Latin word masks should count grapheme clusters, not JavaScript UTF-16 code units. Store Unicode safely, cap by grapheme count and bytes. No machine-translated slurs/hate terms without review. Chat profanity handling is locale-aware and never guaranteed complete.

## Sound and effects

SFX optional and OFF or quiet by default according to preference; controls to mute; obey autoplay restrictions by initiating audio only after user gesture. Do not rely on sound for correctness; captions and visible state essential. Respect reduced motion and reduced data preferences; no forced ads/cookies banners blocking gameplay.

## Verification checklist

VoiceOver/NVDA basic navigation; Chrome keyboard-only route and lobby controls; 320px screenshot; iPhone Safari actual drawing; Android Chrome scrolling; orientation change mid-stroke; DPR 1/2/3; simulated slow network; Hindi/Kannada long text and emoji grapheme counting; color vision deficiency review; prefers-reduced-motion screenshot.
