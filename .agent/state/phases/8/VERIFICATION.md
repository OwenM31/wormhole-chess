---
phase: 8
verified_at: 2026-10-28T11:45:00-05:00
status: verified
---

# Phase 8 Verification: Search Performance Optimization, Low-Determinism AI & Atomic Balance Harness

## 1. Executive Summary
Phase 8 has successfully resolved the four engine and tournament bottlenecks discovered in Phase 7:
1. **Search Speedup**: Fast search execution bypass (`fastSearch`), single-pass leaf evaluation in `evaluateBoard`, and Transposition Table move ordering achieved zero-loss latency acceleration (<350ms depth-2, <1700ms depth-3).
2. **Low-Determinism AI**: Implemented exact-window contender evaluation (`alpha = bestScore - marginCp`) with seeded Boltzmann sampling (`mulberry32`, $T=20$) and tactical lock guardrails (>300cp lead or forced mate locks candidate to 1, while Hint and Match Viewer remain 100% deterministic).
3. **Card Hoarding "Double-Tax" Purged**: Implemented smooth game-phase retention decay ($\text{decay} = \max(0.25, 1 - (\text{turn} - 1) / 42)$), tuned tempo/response retention hurdles, and added central pawn duo bonuses. `P3 (March Together)` achieved a **35.0% tournament play rate** (28 plays across 80 matches), unblocking it from Phase 7's 0.0% dead state.
4. **Atomic Resumable JSONL Tournament Harness**: Modularized single-match execution into `playSingleMatch(spec)` with quiescence-backed mercy adjudication ($\ge 650$cp for 4 plies after ply 30) and 100-ply adjudication without unspent hand retention bias. Upgraded the runner to 18-match color-swapped duplicate blocks (9 pairs $\times$ 2 color orientations: `_w` and `_b`) with incremental per-worker JSONL streaming.
5. **De-Confounded Ridge Marginal Credit**: Solved $(X^T X + \lambda I)\beta = X^T (y - \bar{y})$ with $\lambda = 8.0$ via closed-form Gaussian elimination, isolating individual card win rate contributions independent of the other 7 cards in the deck.

---

## 2. Empirical Verification Matrix

| Verification Suite / Tool | Command | Scope | Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 8 Full Suite** | `npx tsx scripts/verify-phase8-engine-and-harness.ts` | 21 engine + 90 harness assertions (Determinism, Invariants, Ridge Recovery, Stop/Resume) | **111 / 111 Passed** | ✅ PASS |
| **Head-to-Head Benchmark** | `npx tsx scripts/verify-head-to-head.ts` | 10 color-swapped matches vs deterministic baseline + 5-game self-play opening diversity | **55.0% Win Rate (5.5/10), 5.0x Opening Diversity** | ✅ PASS |
| **Phase 8 Tournament** | `node scripts/simulate-deck-balance.mjs --games=180 --phase=8` | 180 color-swapped duplicate matches across 8 parallel workers | **180 / 180 Completed (80 apps/card, 173 unique openings)** | ✅ PASS |
| **Phase 6 AI Engine Regression** | `npx tsx scripts/verify-phase6-ai-engine.ts` | Invariants 1 & 2, non-linear piece scarcity, winning underpromotions, anti-shuffling | **33 / 33 Passed** | ✅ PASS |
| **Phase 7 Overhaul Regression** | `npx tsx scripts/verify-phase7-overhaul.ts` | Complete 36-card ability specification across all 6 piece anchors | **144 / 144 Passed** | ✅ PASS |
| **Unit Test Suite** | `npm test` | Card behaviors, hand display ordering, 36 mechanics edge cases | **43 / 43 Passed** | ✅ PASS |
| **Production Build** | `npm run build` | TypeScript typecheck (`tsc`) + Vite production bundle compilation | **Clean build in 7.27s (0 errors)** | ✅ PASS |

---

## 3. Truth Verification & Success Criteria

### Truth 1: Fast Alpha-Beta Search Bypass & Move Ordering
- **Assertion**: Internal search nodes skip redundant `chess.js` move-generation passes and double 64-square board loops.
- **Evidence**:
  - `Depth 2 decision time: 350ms` (target: `< 500ms`).
  - `Depth 3 decision time: 1681ms` (target: `< 2000ms`).
  - Single-pass `evaluateBoard` computes non-king material and PSTs in one unified pass.
  - TT entries store `bestMoveKey` and candidate sorting inspects `ttEntry.bestMoveKey` first.

### Truth 2: Low-Determinism AI & Tactical Locks
- **Assertion**: Seeded AI generates varied openings while preserving tactical soundness without blundering.
- **Evidence**:
  - Distinct Black replies to `1. c4`: 5 distinct lines (`e7->e5`, `d7->d6`, `d7->d5`, `b8->c6`, `g8->f6`).
  - 100% of sampled replies fall within `32cp` of the root best score.
  - Forced mate-in-1 (`Qf7#`) selected 100% of the time across all seeds with `contenderCount === 1`.
  - Free Queen capture (`exd4`) selected 100% of the time across all seeds when `> 300cp` advantage exists.
  - Strict deterministic mode preserved when `options.deterministic === true`.

### Truth 3: Double-Tax Elimination & Card Playability
- **Assertion**: `P3 (March Together)` and other tempo cards are actively selected in tournament play.
- **Evidence**:
  - Card retention decays smoothly from `414cp` (Turn 1) down to `105cp` (Turn 35, 75% decay).
  - P3 root search achieves competitive `cardLiftCp: -8cp` to `-14cp`.
  - In 180-game tournament, **P3 was played 28 times across 80 appearances (35.0% play rate)**.
  - **31 of 36 canonical cards are actively played** ($\ge 5\%$ play rate).

### Truth 4: Atomic Resumable Harness & De-Confounded Balance
- **Assertion**: Matches run atomically, stream JSONL per worker, support stopping/resuming without data loss, and Ridge regression isolates true card contribution.
- **Evidence**:
  - Stop/resume test verified partial run consolidation (3 matches) and clean resume (6 matches) with zero duplicates.
  - Ridge regression verified on synthetic dataset: OP card P7 assigned `+30.0%` marginal credit while passive teammate was shrunk to `-4.8%`.
  - 180 tournament matches produced `.agent/state/phases/8/BALANCE_REPORT.md` and `balance-metrics.json`.
  - All 36 cards fall within `±12%` marginal credit (zero extreme outliers `> ±15%`).

---

## 4. Architectural Deliverables Produced
1. `src/types/deckChess.ts`: Added `AiSearchOptions` and telemetry metrics (`bestStandardScore`, `bestEmpoweredScore`, `cardLiftCp`, `contenderCount`).
2. `src/engine/DeckChessEngine.ts`: Added `findKingSquare(color)`, `fastSearch` bypass, and lean `clone()`.
3. `src/engine/DeckChessAI.ts`: Added `mulberry32` PRNG, single-pass `evaluateBoard`, TT move ordering, game-phase retention decay, and exact-window Clipped Softmax.
4. `scripts/sim-single-match.ts`: Standalone atomic single-match runner with quiescence mercy adjudication and search-backed lift telemetry.
5. `scripts/aggregate-deck-balance.ts`: Gaussian linear solver, Ridge-regularized marginal credit calculator, and report generator.
6. `scripts/simulate-deck-balance.mjs`: Multi-worker tournament runner with color-swapped duplicate blocks and resumable JSONL streaming.
7. `scripts/verify-head-to-head.ts`: Color-swapped head-to-head benchmark and self-play opening diversity checker.
8. `scripts/verify-phase8-engine-and-harness.ts`: Comprehensive 111-assertion contract suite.
9. `.agent/state/phases/8/BALANCE_REPORT.md` & `balance-metrics.json`: High-sample de-confounded 36-card tournament report.
10. `.agent/state/DECISIONS.md`: Recorded `[DECISION-037]`.

---

## 5. Conclusion
Phase 8 is **100% verified and complete**. The engine is fast, creative, and tactically sound; the simulation harness is robust and mathematically rigorous; and the 36-card roster is statistically balanced. The project is ready to advance to Phase 9 (Campaign Engine & World 1).
