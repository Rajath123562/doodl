# 24 — Adversarial and cross-feature edge-case matrix

Extend `QA_TEST_MATRIX.md`. Each row must be mapped to a concrete automated/manual test and code path; no unverified green claims.

| ID | Case | Required invariant |
|---|---|---|
| EDGE-01 | Two simultaneous final-seat joins | exactly one accepted, cap maintained |
| EDGE-02 | Host presses Start 5x + raw WS duplicates | exactly one match starts |
| EDGE-03 | WS disconnect immediately after durable scoring | reconnect sees one and only one award |
| EDGE-04 | Old socket sends events after newer tab takeover | rejected by connection epoch |
| EDGE-05 | Drawer closes tab during SELECTING_WORD | fallback after timeout or safe next drawer |
| EDGE-06 | Host and drawer disconnected together | deterministic transfer/turn skip, no stuck state |
| EDGE-07 | All players leave while alarm scheduled | room expires; no ghost counters |
| EDGE-08 | Join once room MATCH_RESULTS active | wait/next match, no retroactive rank |
| EDGE-09 | Rejoin after kicked or room expired | no privilege/session reuse |
| EDGE-10 | Guess received exactly at server deadline | rejected (strict `< deadline`) |
| EDGE-11 | Guessers collude by sending `correct:true` | no score gain |
| EDGE-12 | Attacker reads guesser WebSocket handshake/snapshot | no secret, candidates, easily brute-forced answer hashes |
| EDGE-13 | Reconnect after DO hibernation | state/score/turn deadline restored |
| EDGE-14 | Clear then undo then redo 100 strokes | identical state across all clients |
| EDGE-15 | Duplicate/reordered drawing batch | final raster consistent, no phantom line |
| EDGE-16 | High DPI phone rotates mid-draw | normalized strokes remain aligned |
| EDGE-17 | Touch goes outside canvas then pointercancel | closes stroke, no jump to origin |
| EDGE-18 | Malformed WS JSON, nested huge arrays, 2MB frame | cheap reject, server survives |
| EDGE-19 | Custom word injected HTML/emoji zero-width | safe and normalized per locale |
| EDGE-20 | Correct word appears in chat | redacted/blocked before broadcast |
| EDGE-21 | Private room appears in public queue | must NEVER happen |
| EDGE-22 | Two players Quick Play same remaining seat | atomic assignment/no overfill |
| EDGE-23 | Public empty queue and client offline | truthful, actionable states |
| EDGE-24 | Daily reward from two tabs simultaneously | once-only or honestly device-local |
| EDGE-25 | Avatar/mute/report persistence across reconnect | consistent server session |
| EDGE-26 | Gallery storage denied/quota exceeded | error+download, no false saved toast |
| EDGE-27 | Public gallery content report | must be moderated or feature disabled |
| EDGE-28 | Duel A sends canvas B clear | denied; canvas B unchanged |
| EDGE-29 | Duel user guesses both same prompt | one reward policy enforced |
| EDGE-30 | Chaos modifier under reduced-motion | static equivalent / playable |
| EDGE-31 | Team roster disconnect and role transfer | scores preserved, team invariant stable |
| EDGE-32 | Hindi/Kannada grapheme/diacritics | masking/matching not UTF-16 naive |
| EDGE-33 | iOS soft keyboard opens while guessing | input and submit still usable |
| EDGE-34 | Third-party Origin sends WS upgrade | rejected |
| EDGE-35 | 12-player 30min soak and 429 response | bounded CPU/memory and clear errors |
| EDGE-36 | Old client after protocol deployment | explicit upgrade/recovery; no corrupted scores |
| EDGE-37 | User revokes consent/deletes gallery | persisted copy removed per policy |
| EDGE-38 | User asks why lobby shows 4 players with 1 real | no bots; count accurate |
| EDGE-39 | Reader keyboard navigates all dialogs | focus trapped/restored, no stuck controls |
| EDGE-40 | 320px landscape/portrait and long nicknames | no horizontal page overflow |

**Evidence standard:** IDs, raw command, test environment, expected+actual, screenshot/log path, SHA and PASS/FAIL/NOT_RUN. Security tests must prove *invariant unchanged*, not just HTTP 403 displayed.
