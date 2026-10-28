---
updated: 2026-10-28T08:31:00-05:00
---

# Project State

## Current Position

- **Milestone**: v3.0 Parallel World Key Campaign, 36-Card Pyramid & Grandmaster Trials
- **Phase**: Phase 7 — *36-Card Ability Overhaul, Board Preview Arrows & Tournament Re-Simulation*
- **Task**: Phase 7 Execution & Verification Complete (`7.1-PLAN.md` – `7.4-PLAN.md` 100% green across all 3 waves) — Ready for Phase 8 Planning (`@[.agent/workflows/plan.md] 8`)
- **Status**: Complete & Verified (2026-10-28 08:31)
- **Roadmap Status**: Phases 1–7 Complete & Verified; Phases 8–10 Next (Campaign, Jester Shop & World Keys)

## Last Session Summary
1. **Phase 7 Plan 7.1 (Wave 1) — Roster Definition & Pawns/Bishops Overhaul**:
   - Extended `EmpoweredMove` with `BoardPreviewArrow` type and updated all 27 overhauled card names, condition text, effect text, and descriptions in `src/engine/cards/releaseRoster36.ts`.
   - Created comprehensive overhaul contract verification suite `scripts/verify-phase7-overhaul.ts` (144 assertions).
   - Overhauled Pawn handlers (`P1, P3, P4, P5, P6, P7, P8`) and Bishop handlers (`B1, B2, B4, B5, B6, B7`) in `src/engine/cards/playbook36Handlers.ts`.
2. **Phase 7 Plan 7.2 (Wave 2) — Knights, Rooks, Queens, Kings & AI Evaluation**:
   - Overhauled Knight handlers (`N2, N3, N4, N5, N6, N7`) and Rook handlers (`R2, R4, R5, R6`).
   - Overhauled Queen handlers (`Q1, Q3, Q4`) and King handlers (`K1, K3, K4`). Added dual preview arrows for `Q2 (The Queen's Gambit)` (`[Queen, ally]` in gold, `[ally, enemy]` in red).
   - Aligned modular handler AI setup heuristics and verified all 144 contract assertions in `verify-phase7-overhaul.ts` pass (100%).
3. **Phase 7 Plan 7.3 (Wave 2) — Multi-Step Staging & Board Preview Arrows**:
   - Refined `src/hooks/useDeckChessGame.ts` to cleanly separate `stageExtraSquareFirst` cards (`N5: Get to the King`, `R1: Make Way`) from `to`-first cards (`N3`, `P4`, `Q2`, `K3`, `B6`, `B7`).
   - Implemented `<svg data-testid="board-preview-arrows">` at `z-[6]` inside `DeckChessBoard.tsx`, strictly beneath `z-10` pieces, rendering polyline arrows for `N3`, `N5`, and `Q2` with dynamic contextual badges (`FORK`, `PATH`, `LAUNCH`, `BLESS`, `BOUNCE`, `SHIELD`, `CONVERT`).
4. **Phase 7 Plan 7.4 (Wave 3) — Regression Alignment, Playwright E2E & Tournament Re-Simulation**:
   - Aligned existing regression suites (`verify-36-playbook.ts`, `verify-36-mechanics-edge-cases.ts`, `verify-phase6-ai-engine.ts`) with Phase 7 abilities (382 total engine/AI assertions passing 100%).
   - Authored and verified Playwright headless Chromium E2E suite (`scripts/verify-phase7-e2e.mjs`) validating library overhauls, `z-[6]` arrow layering, N3 execution, N5 2-click staging, and Q2 dual arrows with 0 console errors (4 screenshots captured).
   - Executed multi-worker Monte Carlo tournament simulation (36 matches across 8 cores) generating `.agent/state/phases/7/BALANCE_REPORT.md` and `balance-metrics.json`, demonstrating a +340% increase in cards played per match (1.0 -> 4.4 cards/match) and expanding tactical playmakers from 7 to 20 cards.

## In-Progress Work

- Files modified: None (working tree 100% clean and committed to git).
- Tests status: Passing 100% green across all unit, AI, E2E, and tournament simulation suites.

## Blockers

None.

## Context Dump

### Decisions Made
- `[DECISION-036]`: Phase 7 36-Card Ability Overhaul Around Natural Piece Strengths/Weaknesses & Board Preview Arrows (`N3`, `N5`, `Q2`).
- `[DECISION-035]`: Unified Card-Aware AI with Pre-Condition Shaping, Direct Best-Move Hint & Live Side Eval Bar, and Simulation-First Card Tuning.
- `[DECISION-034]`: Complete Engine/UI Energy Purge, Medieval Village Palette, Live Landing Card Showcase, and Batched Copywriting Review.

### Approaches Tried
- Used empirical `Trigger Rate` and `Play Rate` telemetry from `.agent/state/phases/6/BALANCE_REPORT.md` to overhaul dead cards before building the Campaign puzzle engine.
- Implemented under-piece SVG preview arrows at `z-[6]` beneath `z-10` pieces, eliminating piece visual occlusion while providing instant visual clarity on multi-hop jumps and sacrificial lines.

### Files of Interest
- `.agent/state/phases/7/BALANCE_REPORT.md`: Updated Phase 7 tournament balance report with before/after comparison table.
- `.agent/state/phases/7/balance-metrics.json`: Empirical JSON telemetry for all 36 cards across 36 matches.
- `scripts/verify-phase7-overhaul.ts`: 144-assertion contract suite for all 30 overhauled card behaviors.
- `scripts/verify-phase7-e2e.mjs`: Playwright E2E browser suite for library cards, arrows, and multi-step staging.
- `src/components/DeckChessBoard.tsx`: Embeds under-piece SVG arrow overlay at `z-[6]`.
- `src/hooks/useDeckChessGame.ts`: Multi-step card staging and selection engine.

## Next Steps

1. Run `@[.agent/workflows/plan.md] 8` to plan Phase 8 (*Campaign Engine, Jester's Shop, Town Tavern Sandbox & World 1 (`The Causeway`)*).
2. Execute Phase 8 tasks and begin authoring the campaign progression.
