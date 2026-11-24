# DOODL V4.2 — Protocol & Mode Contract Mapping

## 1. Game Mode Registry Mapping

| Legacy Mode ID (V3) | V4.2 Canonical Mode ID | Standalone Creation Allowed? | Behavior in V4.2 |
| :--- | :--- | :--- | :--- |
| `classic` | `classic` | **YES** | Standard Quick Play & Private Room (2–20 players). Automatic hints enabled by default. |
| `blitz` | `party_mix` (internal) | **NO** (Hidden from cards/creation) | Reused as Stage 2 of Party Mix. Direct room creation rejected. |
| `chaos` | `party_mix` (internal) | **NO** (Hidden from cards/creation) | Reused as Stage 3 of Party Mix with server-enforced modifiers. |
| `duels` | N/A | **NO** (Obsolete) | Blocked from new room creation. Existing records readable. |
| `teams` | N/A | **NO** (Obsolete) | Blocked from new room creation. Existing records readable. |
| *(New)* | `telephone` | **YES** | Drawing Telephone (4–16 players). Simultaneous prompt, draw, describe, reveal. |
| *(New)* | `party_mix` | **YES** | Party Mix (4–12 players). 4 sequential stages (Classic → Blitz → Chaos → Telephone). |

---

## 2. Real-Time Protocol Event Changes

| Direction | Event Name | Status | V4.2 Payload & Audience Semantics |
| :--- | :--- | :--- | :--- |
| Client $\to$ Server | `round.hintRequest` | **DEPRECATED / REJECTED** | Returns error `UNSUPPORTED_ACTION`. No points deducted. |
| Server $\to$ Client | `round.hintRevealed` | **UPDATED** | Sent automatically on scheduled timestamps. Contains only newly revealed indices & current public mask. |
| Client $\to$ Server | `chat.send` | **ENHANCED** | Carries `channel?: 'public' | 'solved'`. Unsolved guessers submit guesses. Solved players & drawers chat in `solved` channel. |
| Server $\to$ Client | `chat.message` | **ENHANCED** | Scoped by audience: guessers only see public chat (with answers masked); solved players see both. |
| Client $\to$ Server | `telephone.draft` | **NEW** | Recipient-private draft synchronization for active Telephone step. |
| Client $\to$ Server | `telephone.submit` | **NEW** | Final submission for active step (text or stroke data). |
| Server $\to$ Client | `telephone.assignment` | **NEW** | Sent strictly to the designated recipient with only the immediate prior artifact. |
| Server $\to$ Client | `telephone.reveal` | **NEW** | Broadcast upon complete match finalization containing full chain sequence. |
| Server $\to$ Client | `party.stage.changed` | **NEW** | Broadcast on stage transition with stage index, modifier, and rules. |
| Server $\to$ Client | `party.stage.result` | **NEW** | Broadcast at stage completion with raw scores and normalized rank points. |
