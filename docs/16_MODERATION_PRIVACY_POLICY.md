# 16 — Community safety, reporting, privacy and policy decisions

## Community safety coverage

Users create text, drawings, nicknames, avatars from presets and optional custom word prompts; each can be used to abuse or harass. Private invite rooms reduce but do not eliminate risk. Public matchmaking increases risk and needs accountable reporting + moderation. Drawing replay/gallery can amplify harm if released without checks.

## Before public rooms

Implement report by category (harassment, hate, sexual content, threats, spam, impersonation, other), report ID and human-readable receipt; room host mute/kick, server-enforced restrictions with expiry, spam cooldowns and separate per-guest/IP safeguards; block unmoderated custom packs for public games. Ensure safe nickname/word filtering and rendering; avoid storing chat longer than necessary. Have a documented operator response process and abuse contact. Host actions must be audited minimally and not expose reporters to room peers.

## Moderation workflow

Report submission -> bounded evidence collection -> queue with risk/severity (protect confidential evidence) -> review -> mute/ban/takedown if policy warrants -> notify without leaking reporter -> expiry/delete evidence. Report evidence can contain dangerous content; access-control it. Avoid “AI moderation guarantees safety” claims. If staff moderation capacity not available, restrict public matching/UGC sharing until it exists.

## Player privacy defaults

No required email or phone. Guest sessions expire, avoid persisting raw IP and unnecessary device fingerprinting, no public nicknames outside rooms by default. Private invite codes not indexed/listed. Chat limited to room/session with bounded retention; art and replay never uploaded indefinitely by default. Explicit opt-in and scope label for save/share, delete actual stored copies. No microphone/camera access. Analytics should use aggregates; keep secret words/guesses/tokens out of logs.

## Children and sensitive audiences

Define intended age audience and product safety posture before public launch. If children may access, review applicable child data and online safety requirements in intended jurisdictions; do not collect birthdates unnecessarily unless legally required. Public rooms, profiles, public gallery, friend/DM features may need age-appropriate defaults and moderation. Avoid sensitive personal data in telemetry. Provide plain-language controls and report route.

## Policy pages to create

`/privacy`: categories collected, legal basis/consent as applicable, retention, hosting provider, data rights, contact. `/community`: prohibited behavior and enforcement/report/appeal. `/terms`: user conduct, content and eligibility limitations; review for jurisdiction. `/help`: how to play, reconnect, remove drawings/profile data, reach support, report security issues. No false legal compliance claim or made-up address/contact; use placeholders only until user supplies operator contact and public pages are reviewed.

## Data deletion tests

Private gallery Save -> Delete -> refresh -> absent on chosen storage. Clear guest profile -> local profile/XP and optional server profile erased according to promise; revoke guest session. Room expiration -> chat/strokes and seat details removed. Verify report evidence preservation and deletion according to published policy; cannot simply erase moderation evidence if legal retention applies, so disclose exception accurately.

## Abuse prevention checks

XSS in usernames/word packs/chat/reports; mute can't be bypassed via raw WS; kicked player cannot reconnect with old token; report endpoint cannot be used for mass spam; private gallery not public by guessed IDs; ejection/host transfer auditable; bot storms degraded safely; complaint submission accessible via keyboard/mobile and not displayed to everyone.
