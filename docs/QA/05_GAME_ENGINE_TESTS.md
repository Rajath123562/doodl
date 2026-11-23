# DOODL V3 — Phase 5: Game Logic & Scoring Engine QA

**Audit Date:** 2026-11-23  
**Component:** Server-Authoritative Game Engine (`app/worker/room-do.ts`, `app/shared/rules.ts`)  
**Status:** **PASS (DETERMINISTIC VERIFICATION WITH TIME CLOCKS)**  

---

## 1. Game State Machine Transitions

The room state machine transitions strictly through authorized phases:

```
[ LOBBY ] ──(host starts match)──> [ STARTING ] ──> [ CHOOSING_WORD ]
                                                            │
                                                     (word selected)
                                                            ▼
[ FINISHED ] <──(all rounds complete)── [ ROUND_RESULTS ] <── [ DRAWING ]
                                                │                    │
                                                └──(next turn)───────┘
```

- **Invalid State Guards:** Any client intent arriving out-of-phase (e.g. `guess.submit` while in `LOBBY` or `ROUND_RESULTS`, or `stroke.append` while guessing) is rejected by the server and logged as a no-op violation.

---

## 2. Word Selection & Secrecy Audit

- **Candidacy Generation:** Evaluated in `tests/unit/auth-and-words.test.ts`. For each turn, the engine selects 3 candidate words with varying difficulty levels (easy, medium, hard).
- **Zero-Leak Guarantee:** The candidates and the selected `secretWord` are transmitted solely to the active drawer seat inside `TurnStartedPayload.drawerSecretWord`. Non-drawing guessers receive `maskedWord` (e.g. `_ _ _ _ _`).
- **Default Timeout Fallback:** If the drawer fails to select a word before the 15-second selection deadline expires, the server automatically assigns candidate #1 and starts the turn immediately.

---

## 3. Guess Validation & Diacritic Normalization

- **Normalization:** Evaluated in `tests/unit/scoring.test.ts`. `normalizeGuess()` strips leading/trailing whitespace, converts to lowercase, and flattens Unicode diacritics (`café` -> `cafe`, `résumé` -> `resume`).
- **Levenshtein Distance Close Guess Check:** When a guess is within 1 edit distance of the secret word (e.g., `appl` for `apple`), the engine broadcasts a private `SYSTEM_HINT` to that player ("You're close!") without awarding points or leaking the exact word to public chat.
- **Drawer Guess Rejection:** Active drawers cannot submit guesses for their own drawings.
- **Duplicate Guess Prevention:** Once a player has correctly guessed the word in a turn, subsequent submissions from that seat are ignored for points.

---

## 4. Scoring Algorithm Verification

Scoring is computed by pure server functions in `app/shared/rules.ts`:

1. **Guesser Score:**
   $$\text{Points} = \text{round}\left(100 + \frac{\text{remainingSeconds}}{\text{totalSeconds}} \times 400\right)$$
   - Minimum correct guess: 100 points (at expiration).
   - Maximum instantaneous guess: 500 points (at start).
2. **Drawer Bonus:**
   - The drawer receives 50 bonus points per correct guesser (up to max 250 bonus points).
3. **Deterministic Boundary Checks:** Verified across timer intervals (90s, 45s, 10s, 0s) in `scoring.test.ts` (9 tests passing).
