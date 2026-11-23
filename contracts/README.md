# Versioned reference contracts

`client-event-envelope.schema.json` and `game-types.reference.ts` now use one canonical client envelope: `{v,type,clientEventId,matchId?,turnId?,payload}`. Do NOT copy previous V2 sample format `{id,roomCode,data}`. Sender identity and room code are derived from the authenticated socket/route, not trusted from client event body. Type-specific schemas must reject unknown privileged fields and validate payloads with Zod.

`room-settings.schema.json` now uses `cyclesPerPlayer` and correct mode-dependent timing: Classic/Duels/Chaos/Teams 60/75/90/120; Blitz 20/30/45. Host controls only valid in appropriate phase, changes are committed by Room DO, never direct client score.

These contracts are **examples/requirements** not generated runnable server code; Antigravity must create production validators and tests including every negative path. Use `docs/08_API_AND_WS_ENDPOINT_CONTRACT.md` as canonical API message vocabulary and update all docs if an ADR changes it.
