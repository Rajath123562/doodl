# 15 — Deploy, staging, rollout, rollback and ownership

## Environment separation

`local` (Miniflare/workerd/Wrangler dev, test-only data), `staging` (distinct Cloudflare Worker and DO namespace, representative configuration), `production` (independent, approved resources). Different secrets and storage namespaces. Never run test resets/migrations against real production rooms. Verify official current guidance because Wrangler/Vite configuration evolves.

## Exact steps and evidence

1. Pin dependency versions and lockfile; run vulnerability/security scan and actual CI. Validate `wrangler.jsonc` and DO `new_sqlite_classes` migration. Document migration tag & namespace, upstream plugin docs, preview/asset routing `not_found_handling`, environment variables and runtime flags.
2. Human explicitly approves Cloudflare login and staging deployment. Use official `npx wrangler login` with browser authorization, avoid pasting secrets into chat, place env secrets in platform secret manager.
3. Deploy staging with `npm run deploy:staging` or documented equivalent. Record URL; open it from Chrome and mobile browser over independent network.
4. Run full two-user E2E and P0/P1/P2 claimed feature tests. Check WS upgrade, HTTPS/HSTS (where appropriate), CORS/CSP, host controls, Origin, scoreboard after reconnect, report intake, error metrics and resource billing page.
5. Run one documented rollback drill in staging including durable state verification; ensure old client protocol fails gracefully or is compatible.
6. Create `RELEASE_REPORT.md` with scope/version SHA, risk/known issues, test artifacts, screenshots, cost estimate, operator contact, relevant policy pages and list of irreversible changes.
7. Human explicitly approves public production deployment. Deploy by scripted verified command and monitor first hour; do not claim published until URL actually opens and passes smoke.

## Rollback workflow

Record last known-good build and durable schema migration status before every deploy. Code rollback cannot necessarily reverse a new incompatible data schema: design additive migrations and compatible reader versions. If incident, disable Quick Play via server-side feature flag, prevent new public rooms, preserve existing private matches if safe, roll code back or place service in maintenance mode with honest notice. On data corruption use tested restore point where supported; notify impacted users according to actual policy/law.

## Release readiness conditions

- No open Critical or High security/data-loss/score-corruption defects.
- Real P0 two-device end-to-end passed in **staging**. P1/P2 declared included only with passing evidence.
- Role/word secrecy audited by inspecting actual raw frames/state and direct unauthorized requests.
- Verified report intake and moderator workflow for public rooms, published rules/privacy, graceful deletion.
- 12-player and network-loss tests with acceptable measurements and no crash/ghost scoring.
- All target screenshots and manual mobile smoke, login/permission/error states.
- Monitoring, alerting, on-call/contact, budget check and rollback/release notes.
- User authorizes public launch. Failure -> `NO_GO` even if app visually impressive.

## Important cautions

Cloudflare Free plan has limits; reaching free quotas can cause rejected operations. It is the operator's responsibility to watch usage and allow a capacity plan. No guarantee of free hosting for unlimited players. Domain name/trademark verification must be complete if commercial branding is finalized. Agent should not imply legal compliance without an appropriate review.
