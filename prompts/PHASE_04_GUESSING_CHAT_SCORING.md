# Antigravity Phase 4 — Finish real Classic end-to-end gameplay

Implement the actual full game on top of Phase 1–3: guess submission/validation, scoring, chat, server time, word secrecy, round and match results. Follow `docs/GAME_ENGINE.md` exactly unless you document and justify a necessary spec correction.

- Normalize guesses safely. Accept only valid guessing seats and only first correct guess per player/turn.
- Prevent premature answer disclosure in chat, snapshots, events and logger. Correct guesses turn into redacted system notices.
- Server computes score/time/rank/hint penalty and drawer points. No client can supply score, answer, timer, word, correct state or arbitrary ranks.
- Implement server-owned partial hints with bounded count and penalty; wrong/near guesses don't leak answer.
- Game completes automatically, with result screen, per-round score deltas and final fair ranking; Play Again enters clean lobby.
- Chat length/typing rate limit, mute/kick host moderation and character escaping.

## Acceptance

- Two real human/browser clients complete a 2-player, multi-round game; photos/screenshots from both match the server score ledger.
- Unit tests calculate exact scores at 90s/45s/0s, first/second correct and hint-use cases, ties and timeouts.
- Raw WebSocket attempts to inject 100000 points, replay guessed answer, change word, emit guessed after deadline all safely fail.
- WebSocket inspector demonstrates no word leakage to non-drawer pre-reveal.
- No permanent room hang when a player leaves; duplicate guesses never double award.

Provide real screenshots of selection, drawing on two clients, guessed banner, round result and final winner. Update status and stop if the classic game isn't complete — do not mask failure by advancing to animations.
