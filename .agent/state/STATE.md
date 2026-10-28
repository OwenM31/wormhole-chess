---
updated: 2026-10-28T11:46:00-05:00
---

# Project State

## Current Position

- **Milestone**: v3.0 Parallel World Key Campaign, 36-Card Pyramid & Grandmaster Trials
- **Phase**: Phase 8 Complete & Verified (`VERIFICATION.md`) — Next: Phase 9 (*Campaign Engine, Jester's Shop, Town Tavern Sandbox & World 1 The Causeway*)
- **Status**: Ready for Phase 9 Planning (`@[.agent/workflows/plan.md] 9`)
- **Roadmap Status**: Phases 1–8 Complete & Verified; Phases 9–11 Next (Campaign, Jester Shop & World Keys)

## Last Session Summary
1. **Plan 8.1 (Search Speedup, Low-Determinism AI & Retention Decay)**:
   - Added `AiSearchOptions` and telemetry metrics (`bestStandardScore`, `bestEmpoweredScore`, `cardLiftCp`, `contenderCount`) to `src/types/deckChess.ts`.
   - Optimized `DeckChessEngine.ts` with `fastSearch` bypass skipping 3 redundant move-gen passes per search node, `findKingSquare(color)`, and lean `clone()`.
   - Implemented `mulberry32` PRNG, single-pass `evaluateBoard`, TT move ordering with `bestMoveKey`, and game-phase retention decay ($\text{decay} = \max(0.25, 1 - (\text{turnNumber} - 1) / 42)$) in `src/engine/DeckChessAI.ts`.
   - Implemented exact-window contender evaluation at root depth with seeded Clipped Softmax move selection ($T=20$) and tactical lock guardrails (>300cp lead or forced mate locks candidate to 1, while Hint and Match Viewer remain 100% deterministic).
   - Solved the card hoarding double-tax bug, reducing tempo retention hurdles and adding central pawn duo bonus (`+28cp`), restoring `P3 (March Together)` playability (`cardLiftCp: -14cp`).
2. **Plan 8.2 (Atomic Resumable JSONL Harness & De-Confounded Ridge Aggregator)**:
   - Created `scripts/sim-single-match.ts` with pure board quiescence mercy adjudication ($\ge 650$cp for 4 plies after ply 30) and 100-ply terminal cap without hand retention bias.
   - Upgraded `scripts/simulate-deck-balance.mjs` and `scripts/deck-balance-worker.ts` to 18-match color-swapped duplicate blocks (9 pairs $\times$ 2 color orientations: `_w` and `_b`) with incremental per-worker JSONL streaming (`workers/worker_{id}.jsonl`).
   - Created `scripts/aggregate-deck-balance.ts` with closed-form Gaussian elimination linear solver, Ridge-regularized marginal win credit ($(X^T X + \lambda I)\beta = X^T \tilde{y}$ with $\lambda = 8.0$), color-cancelled paired deltas, and markdown report generator.
   - Extended `scripts/verify-phase8-engine-and-harness.ts` with 90-assertion harness test suite verifying determinism, color-swapped schedule balance, Ridge marginal credit recovery on synthetic data, and stop/resume idempotency.
3. **Plan 8.3 (High-Sample Tournament, Benchmark & Outlier Calibration)**:
   - Authored `scripts/verify-head-to-head.ts`: Low-Determinism AI scored 55.0% (5.5/10) against deterministic baseline with 5.0x opening diversity (5 unique lines vs 1 monotonous line in self-play).
   - Ran 180-game tournament across 8 parallel worker processes (10 blocks $\times$ 18 matches, 90 twin pairs, 80 appearances per card, 64.5 avg plies).
   - Produced `.agent/state/phases/8/BALANCE_REPORT.md` and `balance-metrics.json`: 31/36 cards actively played ($\ge 5\%$), `P3` achieved 35.0% play rate (28 plays / 80 apps), and all 36 cards fall within $\pm 12\%$ marginal credit.
   - Calibrated outlier cards (`P5`, `B5`, `N5`, `Q1`, `Q4`) in `DeckChessAI.ts` and `playbook36Handlers.ts`.
   - Recorded `[DECISION-037]` in `.agent/state/DECISIONS.md`.
   - Authored `.agent/state/phases/8/VERIFICATION.md`. All unit tests (`npm test`), Phase 6 (33/33), Phase 7 (144/144), Phase 8 (111/111), and production build (`npm run build`) passed 100% green.

## In-Progress Work

- None. Phase 8 is 100% complete, verified, and committed.

## Blockers

- None.

## Next Steps

1. Run `@[.agent/workflows/plan.md] 9` to plan Phase 9 (*Campaign Engine, Jester's Shop, Town Tavern Sandbox & World 1 The Causeway*).
