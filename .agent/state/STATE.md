---
updated: 2026-10-28T10:22:45-05:00
---

# Project State

## Current Position

- **Milestone**: v3.0 Parallel World Key Campaign, 36-Card Pyramid & Grandmaster Trials
- **Phase**: Phase 8 — *Search Performance Optimization, Low-Determinism AI & Atomic Balance Harness*
- **Task**: Phase 8 Inserted & Planned (`8.1-PLAN.md` – `8.3-PLAN.md` across 3 waves + `RESEARCH.md`) — Ready for Execution (`@[.agent/workflows/execute.md] 8`)
- **Status**: Active (resumed 2026-10-28 10:22)
- **Roadmap Status**: Phases 1–7 Complete & Verified; Phase 8 Planned & Ready (`8.1`–`8.3`); Phases 9–11 Next (Campaign, Jester Shop & World Keys)

## Last Session Summary
1. **Diagnosed Phase 7 Simulation & Engine Determinism**:
   - Audited the Top 10 Strongest and Bottom 10 Weakest cards from `.agent/state/phases/7/BALANCE_REPORT.md` and traced why the AI always played `1. c4 Nc6` (`computeBestTurn` used strict `score > bestScore` tie-breaking with tight root alpha pruning; `Nc6` and `Nf6` tied at `+10cp` at depth 2 and `+60cp` at depth 3, while `e5` was at `-10cp`).
   - Uncovered the **"Double-Tax" Card Hoarding Bug** explaining why `P3 (March Together)` had a `90.4%` trigger rate and `0.0%` play rate: holding a card granted both `retentionByClass` (`55cp–100cp`) in `evaluateCardScarcityAndHand` AND `+15cp–35cp` in `evaluateHandSynergy`, and playing the card immediately removed *both* bonuses (`-73cp` to `-135cp` penalty).
   - Identified 4 zero-loss search bottlenecks in `DeckChessEngine.ts` and `DeckChessAI.ts` (redundant `getLegalMoves` + triple `isCheckmate`/`isStalemate`/`isDraw` move-gen inside every `makeMove` and `makeEmpoweredMove` call in the search tree, double 64-square loop in `evaluateBoard`, 64-square string loops for King safety, and discarded Transposition Table move ordering).
   - Identified 4 statistical flaws in the Phase 6/7 tournament harness (42-ply premature cutoff adjudicating >95% of games by static eval including unspent hand retention, 8-card teammate confounding, un-paired color assignment, and one-ply naive swing).
2. **Inserted Phase 8 (`ed1acde`) & Authored Phase 8 Plans (`5f67005`)**:
   - Inserted **Phase 8: Search Performance Optimization, Low-Determinism AI & Atomic Balance Harness** into `ROADMAP.md` (renumbering Campaign Phases 8–10 to Phases 9–11).
   - Authored `.agent/state/phases/8/RESEARCH.md` and 3 execution plans across 3 waves:
     - `8.1-PLAN.md` (Wave 1): Zero-Loss Search Speedup (`fastSearch` execution path, single-pass `evaluateBoard`, Iterative Deepening + TT move ordering), Low-Determinism Clipped Softmax AI (`mulberry32` seeded PRNG over `bestScore - marginCp` exact-window contenders with tactical lock guardrails), and Game-Phase Decaying Card Retention fixing the `evaluateHandSynergy` double-tax.
     - `8.2-PLAN.md` (Wave 2): Atomic Single-Match Runner (`scripts/sim-single-match.ts` with `maxPlies=100`, quiescence mercy adjudication, and Search-Backed Card Lift `cardLiftCp`), 18-match Color-Swapped Stratified Blocks with stoppable/resumable per-worker JSONL persistence, and De-Confounded Ridge Regression Aggregator (`scripts/aggregate-deck-balance.ts`).
     - `8.3-PLAN.md` (Wave 3): Head-to-Head Engine Benchmark, High-Sample Color-Swapped Tournament Simulation, and Outlier Card Calibration.

## In-Progress Work

- Files modified: None (working tree 100% clean and committed to git).
- Tests status: Passing 100% green; Phase 8 TDD contract suite (`scripts/verify-phase8-engine-and-harness.ts`) ready to be authored in Plan 8.1 Task 1.

## Blockers

None.

## Context Dump

### Decisions Made
- **Hybrid Low-Determinism AI**: Combine Iterative Deepening ($1 \to D$) + Exact-Window Contender Evaluation (`bestScore - marginCp`) + Seeded Clipped Softmax (`mulberry32`) with tactical lock guardrails (keeping UI `Hint` and `<EvalBar />` 100% deterministic).
- **Decaying Card Retention & Double-Tax Fix**: Decay card retention smoothly with `turnNumber` and prevent `evaluateHandSynergy` from penalizing card execution.
- **Atomic Resumable JSONL Simulation Harness**: Separate single-game execution (`playSingleMatch(spec) -> MatchRecord`) from multi-worker orchestration (`worker_*.jsonl` append-per-game) and statistical aggregation (`aggregate-deck-balance.ts` with Ridge-Regularized Marginal Win Credit and Search-Backed Card Lift).

### Approaches Tried
- Verified exact root scores for all 20 Black replies to `1. c4` at Depth 2 and Depth 3, confirming `Nc6` and `Nf6` were tied and `e5`/`d5` were within `10cp`.

### Files of Interest
- `.agent/state/phases/8/RESEARCH.md`: Complete algorithmic and statistical specification for Phase 8.
- `.agent/state/phases/8/8.1-PLAN.md`: Wave 1 plan (Search speedup, Low-Determinism Softmax AI, Decaying Card Retention).
- `.agent/state/phases/8/8.2-PLAN.md`: Wave 2 plan (Atomic `sim-single-match.ts`, resumable JSONL workers, `aggregate-deck-balance.ts`).
- `.agent/state/phases/8/8.3-PLAN.md`: Wave 3 plan (High-sample tournament, head-to-head benchmark, outlier calibration).
- `src/engine/DeckChessEngine.ts` & `src/engine/DeckChessAI.ts`: Target engine files for Wave 1 optimization.

## Next Steps

1. Resume session (`@[.agent/workflows/resume.md]`).
2. Run `@[.agent/workflows/execute.md] 8` to execute Plans `8.1`, `8.2`, and `8.3`.
3. Inspect the new de-confounded Top 10 Strongest / Weakest card rankings in `.agent/state/phases/8/BALANCE_REPORT.md`, then proceed to Phase 9 (`@[.agent/workflows/plan.md] 9`).
