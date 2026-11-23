# 10 — Public matching and discoverability without fake online state

## Principles

Quick Play is a genuine queue/service, not “join fake bots”. Public rooms only, no private URL/code listed in directory. No guarantee of immediate opponent when server has no players; honest empty lobby and invite action are preferred to fabricated population. Rate-limited matching cannot be used to enumerate other players' private rooms.

## Architecture

One coordinating MatchDirectory Durable Object (or equally consistent single-owner queue) handles public room registration, eligibility and short-lived leases; it is NOT the authority for gameplay. Individual Room Durable Objects own actual seats, caps and authoritative join. Directory indexes a safe subset: `roomId`, region/locale, status, mode, max seats, current available seats (estimate), lastHeartbeat, `public:true`. Do not publish usernames/room secrets in directory. Leases expire automatically; dead rooms must not remain listed. For free-tier economy, avoid an alarm per user/poll and keep updates event-driven/batched.

## Atomic algorithm

1. User `POST /api/matchmaking/quick` with guest session, desired mode, language and optional category filters.
2. Worker or directory returns a candidate reservation reference with TTL; room DO **atomically** validates room still public, lobby open, capacity and guest eligibility.
3. If candidate rejected due to race/full room, retry bounded N times; no infinite spin or duplicate active seat.
4. If none found, offer: create public lobby automatically with explicit notice or show “No matching games yet; create a room” — user-configurable policy. If auto-create, be clear user is alone until other humans arrive.
5. On confirmation, enter normal room socket workflow; cancel queue and discard other candidate leases.

## Matching policies

For first launch, avoid skill-based matchmaking (insufficient populations). Prioritize mode compatibility, language, open seats, latency/region estimated from client (do not expose precise location), and recency. Matchmaking SHOULD NOT split low population by too many categories. Private codes never appear in public listings. Never allow matching a permanently muted/banned seat or evading report/kick trivially.

## Reliability

Dual simultaneous Quick Play clicks -> idempotent one queue membership. User cancel/close tab -> lease expiration. Directory wake from hibernation -> persisted safe state. Stale lobby/full -> fallback and explicit error. User receives a human-readable progress state with cancel. If two matching rooms are available, server chooses deterministically or random among valid candidates without risking ghost joins. Start game eligibility remains 2 real players.

## Capacity and abuse

Limit public room creations/user/day, heartbeat rate and directory rows. Rate-limit repeated join/leave harassment. Provide report button and easy exit; protect younger audiences by restricting public room chat/UGC until moderation plan active. Do not reveal room passwords, private codes, user IPs, full identities or secret words in directory payload.

## E2E acceptance

Three separate browser contexts: A makes public room, B Quick Plays and actually joins, C Quick Plays and actually joins same room if space; private D never appears or matches; full room rejects extra seat atomically; host begins game and room delists; A/B/C agree on members; cancellation removes queued seat; backend reports no fake player or permanently stale public count.
