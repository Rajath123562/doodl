# 04 — User journey contracts and transition-level UX

## Journey J1: Friend invites friend (release-blocking)

1. User A opens `/` with no session, chooses an allowed nickname and can choose standard avatar.
2. Clicks Create private room; form shows defaults and clear starting conditions. Server returns unique private code and credentials; navigates to `/room/:code`.
3. User A copies an invitation link (room code only; never resume credentials/password). On clipboard permission failure offer select/copy text.
4. User B on a different device opens invite, sees appropriate room name and joins with a **separate** guest seat; wrong password and full room are clearly actionable.
5. Both see two actual players. A (host) adjusts rounds/time; B sees updated server state in real time. B cannot change settings via raw frames.
6. A presses Start; UI waits for server acknowledgment; transitions to authorized word-choice then drawing. B never gets plaintext word before reveal.
7. B sees strokes and guesses correctly; both get authoritative response/score. Refresh A or B and rejoin same seat; verify one score only.
8. Match ends and both see same scores. A hits Play Again, both return to lobby; no ghost participants.

**Failures:** network offline, 429, room expired, code invalid, host disconnect, duplicate join, browser back button, no clipboard API, 409 already started, tab suspended, room storage write error. Each must show a specific next action.

## Journey J2: Public Quick Play

Click Quick Play → real server queue/directory with a truthful `Searching` state and cancel. Match available compatible public lobby atomically, or offer Create Public Room. Never create fake spectators/online figures. Avoid revealing private rooms in directory. If queue times out show retry or leave. On lost response or duplicate join, client resumes existing seat rather than joining two public rooms.

## Journey J3: Drawer and guesser

Drawer role prompt has 10-second server deadline; accidental navigating away must not leak candidates via browser URL/local storage. Tools respond to touch/pen/mouse. Guessers see read-only canvas and a separate input for guesses; correct guess remains privately acknowledged and a generic public “X guessed correctly!” event appears. Chat profanity and near-guess hints are server controlled. At reveal, role and toolbar state reset before showing answer.

## Journey J4: Returning disconnected player

Socket closes → status banner and disabled send/draw controls → bounded exponential reconnect with jitter; reauth using credential attached safely → server revokes competing stale connection and restores seat. Server sends canonical snapshot with state version and checksum/op tail. Client discards old buffered turn events and reconciles. If expired, clear error and offer fresh join; never silently create a second identity and double count.

## Journey J5: Private drawing saved into gallery

User finishes or pauses eligible drawing, presses Save, sees scope `Only this device` by default. If cloud save implemented, user must opt in to cloud storage and understand deletion. Save includes replay metadata only when safe. Reload Gallery, inspect preview, download PNG, delete with confirmation and verify underlying storage removal. If local storage unavailable, export still works or show clear notice; do not say Saved when it failed.

## Journey J6: Daily challenge

Enter Daily, see word category/tools/duration before start; one official attempt per UTC day per actual identity; no fake universal streak. Mobile background suspension correctly resumes/expends elapsed wall time. Practice mode separate. After result, show completion and available device-local reward or verified server reward; no browser refresh XP duplications.

## Journey J7: Report/host moderation

A player sends spam/hateful chat/drawings. Other player uses Report Player/Content with category + optional note and receives receipt ID; host may mute/kick. Mute enforced server-side. Evidence includes minimal necessary context, redacted/private and retention-controlled; no default public display. Report queue must have an operator path before public launch. False-positive handling and appeal/support path clear.

## Journey J8: Mobile game

Touch canvas uses `touch-action:none` only inside drawing surface; page can scroll elsewhere. Safe areas; keyboard opening retains guess input/send controls; landscape canvas adjusts without stroke coordinate corruption. No hover-only affordance. iOS Safari resume and audio autoplay policies do not block core play.

## Edge-case decision grid

| State | Expected client response | Server invariant |
|---|---|---|
| Room full | Room full; go back/other room | Capacity not exceeded even simultaneous joins |
| Only one player | “Invite a friend”; Start disabled | Start denied |
| Guest removed | Kick notice and leave action | Kicked credential cannot rejoin immediately |
| Drawer disconnect | Grace countdown then turn skip/rotate | No phantom reward or timer reset |
| Host disconnect | Transfer after 20s grace to oldest eligible seat | One host at any moment |
| All leave | Room expires after TTL and cleanup | no endless live alarms/connections |
| Client older protocol | Update required + refresh | No applying stale incompatible events |
| Outage | Reconnect with backoff, accessible banner | No fake success/duplicated awards |
| Infinite custom guesses | 429 + cooldown | No uncontrolled work or leaderboards |
| Multilingual long input | Clamp and show preview safely | No oversized/invalid frames |
| Draw on inactive round | Local tool disabled | Server refuses stale turn |
| Private mode screen-sharing | Warn on copying/saving if appropriate | No forced public artwork exposure |
