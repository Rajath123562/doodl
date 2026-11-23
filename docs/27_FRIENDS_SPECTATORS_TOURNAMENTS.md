# 27 — Friends, spectators, tournaments and ranked competitions

These features are optional **late P2 enhancements** and should not block Classic/Blitz/Duels/Teams if not required by a user-approved launch scope. Avoid building a shallow “friend list” that cannot safely verify identity.

## Friend system (if enabled)

Requires persistent opt-in account or equivalent verifiable, recoverable identity — guest nickname is insufficient. Friend request/invite with accept/decline/block/report, discoverability OFF by default, privacy controls, age-appropriate settings, abuse/spam throttles. No open DMs by default. Show online status only with consent and accurate server presence. Test blocked person cannot spam invites or infer private room code.

## Spectator mode

Spectator has distinct seat type (cap 4 initially), never included in score/minimum players, no drawer/hints/word candidates until reveal and optional spoiler delay. Cannot submit guesses, draw, change settings or vote unless specific safe feature supported. Spectator chat opt-in or read-only. On mobile indicate spectating clearly. Rejoin snapshot must apply spectator redaction, not player state accidentally.

## Tournaments

Bracket/lobby creation, deterministic seeding/check-in/waiting/pairing, anti-no-show handling, timeout and disputes, actual verified rounds, operator tooling and storage/history. Public tournament requires anti-cheat, account/identity, moderation, reporting and integrity replay. Never call a mocked scoreboard “ranked” without durable match evidence and identity. Avoid rewards with monetary value or regulated contests without review.

## Ranking integrity

Server-only scoring is necessary but insufficient: guests can create fake accounts/rooms to farm. If ranking launched, model identity confidence, eligible mode/match/player constraints, abuse flags and appeals, privacy/deletion. A casual local leaderboard can exist with `This room only` or `Saved on this device` label. Do not claim “global” from browser-local storage.

## Test cases

Spectator cannot draw/guess/see answers; blocked user cannot send invites; friend sharing doesn't leak private session; tournament bracket and disconnect deterministic; ranked leaderboard excludes offline guest-local scores; operator can revoke fraudulent awards and audit decisions.
