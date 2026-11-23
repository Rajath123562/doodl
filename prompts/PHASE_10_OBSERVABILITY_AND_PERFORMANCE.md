# Phase 10 — Production engineering and performance hardening

Prerequisite: phase 8 security/load reports and game-mode regression green, or explicitly documented blocking tests.

Implement structured request IDs, rate-limit counters, WS close metrics, server-authoritative game-transition logs without secret words, error-budget metrics and quiet sampling. Configure runtime error alerts and health probes. Build reproducible 2-, 6-, 12-player tests; measure p50/p95 stroke latency, memory, CPU, event budget; optimize drawing batches and DO writes. Run 30-minute soak, disconnect/reconnect cycle, mobile Safari/Android Chrome visual checks. Write cost model using current official plan limits and representative DAU scenarios, plus safe behavior on quota exhaustion. Include privacy-compliant dashboard labels.

**Gate:** proof of performance and cost within defined beta constraints; monitoring tested by injecting known synthetic fault; no leaked secret words; no unexplained significant memory growth; production error states visible.
