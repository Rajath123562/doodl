# 01 — Product scope, launch tiers, hard constraints

## Product vision

Doodl is an original, delightful web party game for friends and public players. The selling proposition is **instant play**, **low-latency drawing**, **clear and fair rules**, expressive customizations, creator-friendly drawings/replays and distinctive modes. The original reference is a non-networked prototype; do not rely on its mocked player counts or scoring.

## Explicit target tiers

| Tier | Required minimum | Disallowed claims if incomplete |
|---|---|---|
| P0 — closed multiplayer beta | Secure guest seats; real two-device Classic room, invites, host actions, synchronized canvas, guesses, score, results, reconnect, mobile controls, accessibility basics, abuse prevention, monitoring and smoke tests | “Public matchmaking works”, “Full game complete”, “production-ready for public users” |
| P1 — polished public beta | ALL P0 + Quick Play, category/custom words, avatar studio, replay, opt-in gallery/export, drawing extras, Daily Doodle, XP/streaks/achievements within actual persistence constraints, Blitz, moderation and public-room protections | “Drawing Duels/Chaos/Team Battles complete” if they are not |
| P2 — full aspirational release | ALL P1 + fully functional Drawing Duels, Chaos, Teams, spectator controls; only launch friends/tournaments/ranked if identity/moderation/cheat defenses pass | “100% bug free”, “unlimited free users”, “secure against all attacks” |

## Feature matrix by implementation strategy

**P0:** guest login, nickname validation, standard avatar, create/join private room, private code, optional password, room settings/host/spectators off, chat guess channel, server scoring, round results, scoreboards, responsive drawing with pencil/eraser/colors/brush/clear/undo/redo, deterministic turn order, server alarms, reconnect and expiry, reporting/muting, secure authorization, room closure, help/rules/privacy pages.

**P1:** Quick Play, safe public room directory, category packs, guarded custom words, rainbow, line, shapes and stickers synced cross-client, custom colors, emoji reactions, avatar studio, local-first opt-in gallery/PNG/replay, Daily Doodle, XP/levels/streaks, lightweight achievements, Blitz, accessibility enhancements, localization architecture.

**P2:** Duels, Chaos, Teams, spectator-only seating with delayed revealing, pause/resume only for private host if fairness holds, optional friend codes, opt-in tournaments and leaderboard only after verified persisted identity and moderation. Community/public art feed remains OFF until a full safety plan is operational.

## Out of scope without new explicit request

Real-money winnings, ads, subscriptions, user-to-user private chat, audio chat, video, AI image generation, login via Google, native Android/iOS apps, NFT/token economies, unmoderated public gallery, global ranked ladder for anonymous guests, broad public launch without user approval, unauthorized domain purchases.

## Non-functional guarantees (acceptance targets, not assumed facts)

- Real users, no scripted peers in release; 2 to 12 player room cap, configurable 8 default.
- All authoritative transitions mutually exclusive and reproducible after hibernation.
- 320px mobile layout usable without overflow; text 16px for iOS input; 44px touch targets whenever feasible.
- Target measured P95 visible drawing update <250ms on a specified decent network; degrade gracefully rather than asserting a guarantee.
- Test 12 seats, 30 minutes, peak strokes and reconnect; prove no score divergence, word leakage or unbounded memory.
- No hidden paid provider; no hosting plan upgrade by agent. Budget model must include message traffic and Free quota headroom.

## Definition of “complete”

Every P0/P1/P2 feature in `checklists/FEATURE_ACCEPTANCE.md` is either tested PASS (including negative tests) or explicitly removed from release scope with user-facing labels and user approval. Complete DOES NOT mean zero defects exist. Also require operations, privacy, security and staging signoff in `checklists/PRODUCTION_SIGNOFF.md`.
