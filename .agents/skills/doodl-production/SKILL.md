---
name: doodl-production
description: Build, audit, test, harden, or ship the Doodl realtime multiplayer drawing game using the project's authoritative engineering and quality documents.
---

# DOODL production build skill

Read `AGENTS.md`, `prompts/00_MASTER_BUILD_PROMPT.md` and `docs/20_DEFINITION_OF_DONE_AND_TRACEABILITY.md` first. This is a handoff kit, not pre-existing production source. Implement under `app/`, do not ship the simulated `reference/demo-v2/` as a real network application.

For any requested feature: map to requirement ID, check server trust boundary, implement UI and backend end-to-end, write tests with isolated clients, run tests, update status and record truthful evidence. Before completing a phase, evaluate its gate and write GO/NO-GO. Never bypass security or source-control safeguards to force a green report. For deployment require approval and current Cloudflare docs verification. Read the relevant numbered topic spec instead of assuming all instructions fit in this file.
