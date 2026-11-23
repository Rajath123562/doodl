# 30 — Source-code quality rules, APIs and maintainable architecture

## Modular boundaries

- `app/src`: presentation, canvas rendering, typed networking client; browser must never implement authoritative score/secret controls.
- `app/worker`: Worker HTTP/WS session handlers, per-room DO actor, match directory, alarms/storage/migrations; input cannot be trusted.
- `app/shared`: type-safe event contracts, immutable score functions, word normalization, server-agnostic drawing op geometry, Zod validators; never import server private secrets into browser bundle.
- `app/tests`: unit/integration/E2E/security/performance. Keep fixtures test-only and do not expose debug routes in production.

## Coding standards

Strict TypeScript, no uncontrolled `any` in protocol/business paths, well-named functions, predictable immutable reducer transitions, zero suppressed network errors, explicit timeouts/abort, no serializing giant data to React state each pointer movement. Avoid monolithic 3,000-line components and copy-pasted game mode handlers. Separate reducer pure logic from side effects so deterministic tests are possible. Prevent concurrent state mutation races by DO actor/transaction boundary and unique constraints. Exhaustive enum/state tests. Configure lint/format and enforce via CI; keep dependencies minimal, pinned, audited, with lockfile and license inventory.

## Runtime and data invariants

All server changes must be authenticated+authorized by bound seat, match/turn/version checked, idempotent and persisted atomically when business-critical. Client receive state is scoped/redacted; server internal state cannot be JSON serialized accidentally. Guest identity and persistent data retention documented. Every user-visible asynchronous action has pending, resolved, rejected and session-expired UI states. No hidden fake defaults; no swallowed exceptions.

## Merge quality

Every feature PR/phase requires changed paths, new tests, user journey, negative authorization test if new server intent, browser screenshot if UI, schema/migration note if persistent state changed, and release impact. Do not bypass tests via `skip` or mock out the system under test. Check clean build on fresh `npm ci` before release. Do not auto-commit credentials or generated local storage DB files.
