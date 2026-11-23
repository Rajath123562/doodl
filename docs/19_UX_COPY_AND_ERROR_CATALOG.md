# 19 — Exact user-facing language, errors and empty states

Use concise, friendly, consistent text; avoid vague “Something went wrong” when a specific action is known. All strings stored in locale dictionary, text not HTML. No false success messages.

| Context/code | Message | Primary action |
|---|---|---|
| `ROOM_NOT_FOUND` | `We couldn't find that room. Check the invite link.` | Enter code / Home |
| `ROOM_FULL` | `This room is full (12/12).` | Back / Find another game |
| `ROOM_EXPIRED` | `This room has ended. Ask your friend for a new invite.` | Home |
| `WRONG_PASSWORD` | `That room password didn't match.` | Try again |
| `NOT_HOST` | `Only the room host can change that setting.` | OK |
| `NOT_DRAWER` | `It's not your turn to draw.` | Return to guessing |
| `STALE_TURN` | `That round has already ended.` | View current round |
| `ALREADY_GUESSED` | `You got this one already!` | View leaderboard |
| `RATE_LIMIT` | `You're sending that a bit too fast. Try again shortly.` | Wait |
| `GUEST_EXPIRED` | `Your guest session expired. Rejoin the room to continue.` | Rejoin |
| `SESSION_TAKEN_OVER` | `This player is active in another tab.` | Take over securely |
| `SERVICE_UNAVAILABLE` | `The game server is unavailable. We're reconnecting…` | Retry / Home |
| `STORAGE_QUOTA` | `This drawing couldn't be saved. Download it instead.` | Download PNG |
| `REPORT_RATE_LIMIT` | `You’ve sent several reports recently. Try again later.` | Close |
| `UNSUPPORTED_VERSION` | `The game was updated. Refresh to keep playing.` | Reload |

## Shared microcopy

Home subtitle: `Turn silly ideas into unforgettable drawings.` Lobby alone: `You're the first one here — send an invite to start.` Private status: `Only people with your invite link can find this room.` Guess input: `Type your guess…`; muted: `Chat is temporarily unavailable to you.` Correct guess public message: `Sam guessed the word!` (never show actual guess). Drawer: `You're drawing: [SECRET WORD]` visible only to current drawer. Guesser: `Guess the drawing • _ _ _ _ _`; Results: `The word was [ANSWER]` only after reveal. No remote room counter unless real.

## Empty states

Gallery: `Your doodles will appear here after you save one.` Daily completed: `Today's drawing is done. Come back tomorrow for a new one.` Matchmaking: `No open rooms right now. Create one and invite friends.` Disconnected: `Trying to reconnect… Your score is safe while we restore your seat.` If a session cannot actually be resumed, do **not** claim score safe; use `Connection lost. You may need to rejoin.`

## Validation

Nickname: `Use 2–20 characters. Spaces are fine.` Password: `Enter the room password.` Word pack: `Add 1–100 drawable words, 2–40 characters each.` Report: `Choose a reason for your report.` Use `.textContent`/React interpolation; do not embed user-created HTML.

## Localization notes

Never concatenate punctuation/word order from English for translations; dynamic values use named placeholders. Review German/English long strings, Hindi/Kannada font coverage, screen reader announcements and plural forms. Errors should be actionable at 320px without horizontal scrolling.
