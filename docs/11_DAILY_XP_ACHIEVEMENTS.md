# 11 — Daily Doodle, experience, achievements and streak integrity

## Concept and identity honesty

Daily Doodle is a 60-second solo drawing challenge; XP/levels and streaks encourage return play. With guest-only browser-local identity, awards/streaks are **device-local convenience**; they do not prove achievements across multiple devices or resist deliberately manipulated browsers. Only call scores/achievements server-verified when the completion and identity checks actually are.

## Daily challenge generation

- Use explicit UTC date `YYYY-MM-DD` as global daily key, display user's local next-refresh time. Use backend-known secret mapping from an original licensed/curated word list, not deterministic client code exposing future prompts where competitive integrity matters.
- Fixed daily prompt/canvas restrictions for all people on same date (unless localized category requires separate key). Avoid offensive/identifying prompts and ambiguity.
- A “practice again” control may reuse prompt but must not grant additional daily award or modify official attempt.
- If no account backend, server may only prevent duplicate per guest token; client should tell players not to treat results as globally fair rankings.

## XP algorithm (versioned proposed baseline)

- First eligible daily completion: +100 XP once per date/identity; valid Classic match completion: +25 XP; correct guess: +10 XP, capped e.g. 150 XP per day for casual anti-farming (tune). No XP if match aborted for abuse or only simulated opponents.
- Level based on threshold `cumulativeNeeded(level) = 100 * level * (level + 1) / 2` for level >=1, with initial level 1. Implement identical shared function and vector tests. Store XP as non-negative safe bounded integer; derive level from XP server-side for verified profiles.
- Streak increments only if previous UTC date had qualified completion; otherwise resets to 1. Same-day duplicate does not increment; missing day resets. Optional freeze tokens imply monetization/game economy, so out of scope.
- Achievements: First Draw (completed match), Sharp Eye (first guess), Social Sketcher (5 different private matches), Rainbow Artist (rainbow tool used validly), Daily Habit (7-day streak), Duelist (first verified duel). Avoid exploitable cross-guest global bragging.

## Abuse and privacy

Server must ignore client-provided XP, level, streak, badge/unlock IDs and completion timestamps. Idempotency key `(identityId,date,achievementType)` with unique constraint; exact one award per valid event. Record minimum necessary evidence (match ID/turn ID/completion ID and timestamp) without raw guesses/drawings. Two tabs simultaneously claiming daily reward: one succeeds, other gets already-completed response and same authoritative balance.

## UI requirements

Home small XP indicator and streak (only when real local/server state exists); Daily route prompt/clock/canvas/results; Profile shows progress, earned vs locked badges and provenance `Saved on this device` or `Synced to account`. Refresh and offline handling correct; challenge countdown must not reset by minimize/restore. No fake competitive leaderboard. Provide reset/delete for guest profile data and explain loss on browser clearing.

## Test vectors

- XP 0 => Level 1, XP 100 => Level 2 if defined threshold from L1; boundary tests and no integer overflow.
- Challenges same day twice -> exactly +100 once; two simultaneous contexts -> one official award.
- Two consecutive UTC dates increments streak; one missed date resets to 1.
- Offline device has no server claim: display as local-only, no fake global rank.
- Browser closed during daily challenge: timer resumes/aborts per explicit server deadline, never permits unlimited additional official attempts.
