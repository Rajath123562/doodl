# 29 — Long-running Antigravity development, context recovery and task ledger

This is a multi-phase build too large to trust to one unconstrained AI response. Antigravity may run out of context, lose tool state, or be interrupted. It must leave durable, machine-readable progress in the repository rather than rely on remembering a chat. After EVERY tested implementation slice, update `app/IMPLEMENTATION_STATUS.md` and `app/docs/REQUIREMENT_TRACEABILITY.md`, `BUG_LEDGER`, decision log, latest phase report and Git checkpoint. Store exact commands, timestamps, commit, test results and next incomplete ID. Never save secrets in any log.

## At start of each new agent session

Read root `AGENTS.md`, master, status, traceability and last phase report; verify Git status; run minimal smoke/test. Pick next unmet requirement by priority/critical path, not most visually exciting feature. Use `prompts/CONTINUE_AFTER_CONTEXT_RESET.md` as recovery. Never rewrite already verified files wholesale merely because chat memory is gone.

## Scope changes

Any addition, removal or significant interpretation of a requirement must get a documented ADR, updated acceptance ID and test plan. If a feature is blocked by Cloudflare Free capacity, report exact measured/sourced constraint; don't substitute simulated result. If public deployment is blocked by missing human approval, continue local/staging-safe testing and leave an exact checklist of action requiring approval.

## Practical completion report

At any interruption: what was implemented this session, actual files and commands, what was tested and passed, what failed/unverified, known regressions, next exact acceptance ID and expected tests, session resume command. This prevents “half-built but reported finished” outcomes.
