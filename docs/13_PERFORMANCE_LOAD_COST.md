# 13 — Performance, load modeling and Cloudflare free-tier economics

## Performance budget (target, not verified result)

| Metric | Target / measurement policy |
|---|---|
| Visible stroke propagation P95 | <250ms on defined stable network; report actual region/network/n |
| Local input-to-draw | <16ms median on mid-tier desktop, <32ms median mobile under reasonable load |
| API create/join latency P95 | <800ms in intended launch region (measure; not guarantee) |
| 12-seat room | no memory blowup, no score divergence, no dropped completed strokes |
| Soak | 30 minutes at representative drawing/chat bursts, bounded growth |
| Payload | <=64KiB client WS message; <=200 points per batch; typical batches much smaller |
| Sender batching | target 20–30Hz under pointer movement, adaptively capped; do not send per pixel |
| Client CPU/battery | avoid per-frame React component re-render and animated backdrop |
| Bundle loading | measure desktop/mobile LCP and TTI; budget per-route JS and image size |

## Drawing traffic example — *illustrative mathematics, not prediction*

One active drawer sends 25 batch events per second × 90 second turn = **2,250 inbound WS messages**. Six players × 3 turns each = 18 turns, or **40,500 inbound drawing messages in one match**, before guesses/acks/reactions/joins. Server additionally broadcasts each batch to up to 5 recipients, so there may be ~202,500 outbound sends in this simplified six-seat example. At 12 players and 3 cycles: 36 turns × 90s × 25Hz = **81,000 inbound drawing messages** in a full match; broad fanout can multiply outbound traffic. Verify which messages count for current Cloudflare billing and measure actual event rates; do not equate simple events with plan requests without reading current docs.

**Consequences:** unoptimized strokes can exhaust free-tier event quotas quickly. Prefer adaptive batching with segment compression, bounded time/point caps, event fanout and checkpoint compaction. Set `Max drawing fps` dynamically based on network conditions and preserve responsiveness. Use hibernation for idle rooms, not indefinite active timers. Store snapshots at intervals, not SQL writes per point.

## Test scenarios

1. 2-player baseline, 90-second turn, normal drawing, different tabs.
2. 6-player active room, two simulated networks with 50ms RTT + 1% loss (WS traffic may be delayed, not lost), bursty 80 pointer samples/s condensed to 25 batches/s.
3. 12 player full room, 36 turns; assert score equality and bounded memory; separate smoke from lengthy soak.
4. 30min soak with peak stroke event rates, chat spam guard and reconnect cycles.
5. Worst-case malicious input: 2MB event, 1000 events/s, malformed stroke batches; server caps before parsing expensive data.
6. Mobile battery/CPU: long draw with pen, keyboard open, orientation change and background tab return.
7. DO hibernation/cold-wake test and alarm transitions across sleep: no idle bill shock.

## Capacity model template

For DAU estimates 100 / 1,000 / 10,000, compute per-player average matches/day (M), average seats/room (P), turns per match (`P*cycles`), seconds/turn (S), batches/s (B), and event amplification (F). Estimate inbound batches/day `DAU * M/P * P*cycles*S*B`, plus HTTP/API/other WS and outgoing fanout separately, then compare **CURRENT** Cloudflare requests/CPU/duration/storage limits and measured numbers. Include peak concurrency not just DAU. Default to conservative 50% free-tier headroom.

## Cost and safety

Check official sources: Workers pricing, DO pricing/limits, D1 and static assets before deployment. Cloudflare's Free plan can reject operations once quotas are exceeded; it is NOT unlimited and using more features may require paid plans. Agent must not opt into paid upgrades. Use usage alerts/dashboards if available, quota exhaustion fallback, public matchmaking kill-switch and per-room rate limits. Do not use an expensive paid Realtime/AI SaaS as hidden dependency.

## Optimization order

(1) profile bottleneck; (2) batch drawing events; (3) redraw canvas without React tree updates; (4) coalesce pointer moves; (5) avoid compressing every event inefficiently; (6) checkpoint and sequence; (7) throttle reactions/chat; (8) measure real plan usage. Never sacrifice authoritative correctness or erase paid bill risk in docs to hit vanity benchmark.
