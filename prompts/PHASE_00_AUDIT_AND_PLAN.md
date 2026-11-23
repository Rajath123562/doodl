# Phase 00 — Inspect kit and create an executable plan

Read `prompts/00_MASTER_BUILD_PROMPT.md` and `AGENTS.md`. Run integrity check. Browser-inspect reference. Inventory existing source separately from UI prototype. Confirm current Node, Wrangler, Cloudflare DO compatibility and HTTPS/WSS requirements. Identify external costs and secrets, no commitments without approval.

Create `app/README.md`, `app/IMPLEMENTATION_STATUS.md`, `app/docs/REQUIREMENT_TRACEABILITY.md`, `app/docs/DECISION_LOG.md`, `app/docs/ARCHITECTURE_DECISIONS.md`, `app/docs/DEPLOYMENT_PLAN.md`, `app/docs/BUG_LEDGER.md` and initial project skeleton. Define module boundaries, strong types, data model, security trust boundaries and test architecture. Decide whether guest credentials use cookie-backed session + single-use resume flow and document threat model.

Produce navigable design routes/components map, state machine and protocol sketches, P0/P1/P2 implementation order with critical path, and a smoke-test scaffolding plan. Build real shell where possible rather than only planning.

**Gate:** source/tests structure exists; all requirements mapped; no copied fake backend; official docs links noted; protected secrets plan; cross-referenced critical decisions. `GO` only with actual files, not assertions.
