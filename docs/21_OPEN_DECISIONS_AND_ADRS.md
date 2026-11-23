# 21 — Controlled architecture decisions, assumptions and conflict resolution

## ADR format

Create a decision record in `app/docs/adr/NNNN-short-name.md` with: Status, Date, Context, Options, Decision, Security/Cost/UX consequences, Alternatives rejected, Test plan, Rollback and References. Changing server authority, game scoring or user privacy requires an ADR and regression tests; changing aesthetic color may not.

## Explicit baseline decisions

1. Server-authoritative one-room-per-DO; SQLite storage and Hibernation API; online drawing broadcast via bounded batch.
2. Guest first, email account optional future. Invite room code is not a credential; secure session+grant required.
3. 2–12 active players default 8, 3 cycles per player default, 90s classic, server timers.
4. Private room is default. Public queue requires honest human roster and reporting/moderation.
5. English curated words at initial launch; other locales only if reviewed.
6. Gallery locally private/opt-in; public sharing disabled until moderation reviewed.
7. Daily/XP labelled device-local when not backed by server proof; ranking requires authenticated identity.
8. No commercial assets/domains/payments/ads without user approval.

## Questions agent must resolve rather than silently guessing

- Best cookie + WS join-grant flow consistent with chosen SPA origin and Cloudflare routing. Provide threat model and test on iOS Safari.
- Durable Object storage/schema design for checkpoint+tail without write amplification. Show replay correctness under hibernation.
- Whether private room “spectator” is enabled in beta or hidden until P2. Do not half ship it.
- Public matchmaking queue implementation and cost limit; control stale registrations.
- Duel scoring from same prompt: one reward per guesser across both canvases recommended. Make rule explicit before coding.
- How public gallery moderation/staff process is funded; default disabled.
- AI-free scoring for Daily Doodle: avoid model dependency; participation/completion awards only.
- What is a safe UX when browser `localStorage` denied/full: error+PNG fallback.
- Whether persistent profiles are stored in D1 or browser-local; clearly label scope.

## Conflict resolution procedure

Do not attempt to satisfy contradictory text literally. Write conflict description, evaluate security/gameplay/user impact, select one invariant and patch all impacted specs + tests. Preserve original requirements in audit trail. Report user-facing changes in phase gate. Escalate if decision requires payment, identity collection, an irreversible data change or public release; otherwise continue with defensible documented choice.
