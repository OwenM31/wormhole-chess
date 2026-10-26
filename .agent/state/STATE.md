---
updated: 2026-10-26T14:37:00-05:00
---

# Project State

## Current Position

- **Milestone**: v3.0 Parallel World Key Campaign, 36-Card Pyramid & Grandmaster Trials
- **Phase**: Phase 7 — *Campaign Engine, Jester's Shop, Town Tavern Sandbox & World 1 (The Causeway)*
- **Task**: Phase 6 V2 Strategic Engine Upgrade, Q2 Ray Bug Fix & HomePage Copy Complete — Ready for Phase 7 (`@[.agent/workflows/discuss-phase.md] 7` or `@[.agent/workflows/plan.md] 7`)
- **Status**: Paused at 2026-10-26 14:37
- **Roadmap Status**: Phases 1–6 Complete & Verified; Phase 7 Next

## Last Session Summary
1. **Phase 6 V2 Strategic AI Engine Upgrade (`src/engine/DeckChessAI.ts`, `src/engine/DeckChessEngine.ts`, `src/engine/cards/playbook36Handlers.ts`)**:
   - **Root Cause Cured (`Ra8-b8-a8-b8` Opening Shuffling & 77.8% Draw Rate)**: Fixed the upside-down Piece-Square Table (`PST`) row indexing bug (`pstRow = color === 'w' ? r : 7 - r`), preserved `positionHistory` across `DeckChessEngine.clone()`, enforced 3-fold repetition draws, and added repetition contempt (`-45cp`).
   - **Non-Linear Piece Scarcity, Card Orphaning & Offensive Anchor Hunting**: Implemented `evaluateCardScarcityAndHand()` with non-linear pawn scarcity, pair-card (`R4`/`N6`/`P4`) `minAnchorsRequired: 2` orphaning, Rank 6/7 pawn promotion & `K2 Royal Knighting` revival valuation, and symmetric opponent anchor hunting.
   - **Full Underpromotion Support (`Q, R, B, N`)**: Added underpromotion support across `DeckChessEngine.ts`, `DeckChessAI.ts`, `useDeckChessGame.ts`, `DeckChessBoard.tsx`, `DeckBuilderPage.tsx`, and `PlayRoomPage.tsx`.
   - **Modular Card Handler Architecture**: Co-located `minAnchorsRequired`, `spawnsPieceType`, and fast zero-clone `evaluateSetup` directly on `CardBehaviorHandler` objects in `playbook36Handlers.ts` (zero hardcoded `cardId` switches in `DeckChessAI.ts`).
   - **Multi-Ply Card Search, Selective Quiescence & Fast Terminal Checks**: Enabled inner-ply card search (`Ply 2` opponent card defense + `Ply 3` 2-turn combo discovery), selective capture quiescence, and eliminated redundant `chess._moves()` calls inside `evaluateBoard` / `minimax`.
   - **Empirical Verification**:
     - `scripts/verify-phase6-ai-engine.ts`: **33/33 assertions PASSED** across 9 Grandmaster suites.
     - `scripts/benchmark-v2-vs-v1.ts`: V2 defeated V1 **9W - 0L - 7D (78.1% score, +221 Elo advantage)** across 16 duplicate-deck games.
     - `scripts/simulate-deck-balance.mjs`: Draw rate dropped from **77.8% down to 11.1%** (88.9% decisive games) in `.agent/state/phases/6/BALANCE_REPORT.md`.
2. **`Q2: The Queen's Gambit` Attack-Ray Bug Fix & 36-Card Handler Audit (`src/engine/cards/playbook36Handlers.ts`, `src/engine/cards/cardRegistry.ts`)**:
   - Fixed `q2_the_queens_gambit` where `ep.type === 'q'` was missing `&& (isDiag || isOrth)` and the ray loop treated walking off the board (`!testSq`) as `clear = true` (which previously allowed Black's Queen to capture White's `d1` Queen on Turn 1 after `1. c4`).
   - Hardened `r4_move_in_unison` (`execute` computes paired Rook origin via exact displacement vector `(df, dr)`) and `CardUtils.getPinRay` (enforces `isOrth || isDiag` geometry).
   - Added Suite 6 to `scripts/verify-36-mechanics-edge-cases.ts` (`44/44 assertions PASSED`) and verified `scripts/verify-36-playbook.ts` (`169/169 PASSED`).
3. **HomePage Copy Update & Cloudflare Pages Deployment (`src/pages/HomePage.tsx`)**:
   - Updated the Deck Builder Chess landing page description to `"Bring 8 cards into your chess match to unleash special attacks on your opponent."`
   - Built (`npm run build`), pushed to `origin/master`, and deployed to Cloudflare Pages (`npm run deploy:pages`).

## In-Progress Work

- Files modified: None (working tree clean, all commits pushed to master).
- Tests status: Passing 100% green across all unit, integration, and E2E suites.

## Blockers

None.

## Context Dump

### Decisions Made
- `[DECISION-035]`: Unified Card-Aware AI with Pre-Condition Shaping, Direct Best-Move Hint & Live Side Eval Bar, and Simulation-First Card Tuning.
- `[DECISION-034]`: Complete Engine/UI Energy Purge, Medieval Village Palette, Live Landing Card Showcase, and Batched Copywriting Review.
- `[DECISION-033]`: Non-Intrusive Game-Over Review & Container-Scoped Scroll.
- `[DECISION-032]`: Pre-Game Deck Randomization with 1 copy per card constraint.
- `[DECISION-031]`: Count-Aware Hand Display & Mobile Horizontal Scroll.
- `[DECISION-030]`: R1 "Make Way" Redesign — perpendicular pawn step-aside.
- `[DECISION-029]`: Turn Flow & Card Arming Decoupling (Option A).

### Approaches Tried
- **Worker Threads vs Child Processes**: Node's native `worker_threads` with `--import tsx/loader.mjs` failed on Windows because of ESM loader hooks for extensionless imports. Successfully migrated to child-process workers executing `tsx` directly, enabling parallel multi-core simulation in under 2.5 minutes.
- **EvalBar Dynamic Readout Invariant**: In offline matches with random decks, players hold asymmetric hands with differing card retention values, creating natural initial opening scores in the balanced `[-2.0..+2.0]` range. Verified that perfectly symmetric hands evaluate to exactly `0.0cp` / `50%`.

### Files of Interest
- `.agent/state/phases/6/VERIFICATION.md`: Phase 6 formal verification report.
- `.agent/state/phases/6/BALANCE_REPORT.md`: 36-card empirical balance metrics and leaderboard.
- `src/engine/DeckChessAI.ts`: Grandmaster unified Alpha-Beta card search and pre-condition shaping engine.
- `src/components/EvalBar.tsx`: Live side evaluation bar component.
- `src/hooks/useDeckChessGame.ts`: Unified AI turn and hint state hook.
- `scripts/simulate-deck-balance.mjs`: Multi-worker deck balance tournament orchestrator.
- `scripts/verify-phase6-e2e.mjs`: Playwright E2E browser verification test suite.

## Next Steps

1. Inspect `.agent/state/phases/6/BALANCE_REPORT.md` with the user to review the 36-card empirical leaderboard.
2. Proceed to Phase 7: Campaign Engine, Jester's Shop, Town Tavern Sandbox & World 1 (`The Causeway`) via `@[.agent/workflows/discuss-phase.md] 7` or `@[.agent/workflows/plan.md] 7`.
