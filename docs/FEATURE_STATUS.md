# Feature status: current files vs desired production game

As of initial handoff, **nothing in the reference demo is proof of real multiplayer**. All implementation statuses below refer to this ZIP; Antigravity must update a new `IMPLEMENTATION_STATUS.md` as it writes and verifies actual production code.

| Feature | Reference demo? | Real online implementation at handoff? | Build priority |
|---|---|---|---|
| Home, nickname, design system | Interactive mock | No | P0 |
| Avatars | Browser-local customization | No persistent shared identity | P0/P1 |
| Drawing pencil/colors/eraser/undo | Browser-local | No synchronization | P0 |
| Rainbow brush, line, stickers | Browser-local | No synchronization | P1 |
| Create/join/invite rooms | Simulated lobby | No | P0 |
| Two human players in same round | No | No | P0 (critical) |
| Public matchmaking | Simulated flow | No | P1 |
| Word selection and server secrecy | Simulated, hard-coded example | No | P0 (critical) |
| Guesses, chat and scoring | Simulated | No | P0 (critical) |
| Host permissions/kick/mute | Visual concept only | No | P0/P1 |
| Real disconnect/reconnect state | No | No | P0 (critical) |
| Mobile layout | Demonstrated | Not verified with backend | P0 |
| Drawing replays | Browser-local concept | Not shared/verified | P1 |
| Daily doodle, local XP and streaks | Browser-local | No online integrity | P1 |
| Gallery/save/export | Browser-local storage + PNG | No opt-in cloud gallery | P1 |
| Drawing Duels | Visual/gameplay mock | No | P2 |
| Chaos Mode | Visual/gameplay mock | No | P2 |
| Team Battles | Planned | No | P2 |
| Secure abuse reporting | No real backend | No | P0/P1 |
| Verified deployment and observability | No | No | Release gate |

**Classification:** P0 = necessary for an honest multiplayer beta; P1 = strong launch enhancements; P2 = differentiated expansion. A phase may claim only completed, verified items.
