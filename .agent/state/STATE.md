---
updated: 2026-10-27T14:28:15-05:00
---

# Project State

## Current Position

- **Milestone**: v3.0 Parallel World Key Campaign, 36-Card Pyramid & Grandmaster Trials
- **Phase**: Phase 7 — *36-Card Ability Overhaul, Board Preview Arrows & Tournament Re-Simulation*
- **Task**: Phase 7 Planning Complete (`7.1-PLAN.md` – `7.4-PLAN.md` across 3 waves) — Ready for Execution (`@[.agent/workflows/execute.md] 7`)
- **Status**: Paused at 2026-10-27 14:28
- **Roadmap Status**: Phases 1–6 Complete & Verified; Phase 7 Planned; Phases 8–10 Next (Campaign)

## Last Session Summary
1. **Empirical 36-Card Ability Audit & Redesign (`[DECISION-036]` in `.agent/state/DECISIONS.md`)**:
   - Analyzed the 36-card empirical telemetry from `.agent/state/phases/6/BALANCE_REPORT.md` (`Trigger Rate`, `Play Rate`, `Avg Swing`) and reviewed all 36 cards class-by-class (`P1–P8, N1–N7, B1–B7, R1–R6, Q1–Q4, K1–K4`).
   - Kept the 9 top-performing cards (`P2, N1, B3, R1, R3, Q2, K2` + core mechanics) and redesigned/refined the other 27 cards around each piece's natural chess strengths and classic frustrations:
     - **Pawns**: `P1 (Sidestep)` diagonal step onto empty when blocked ahead; `P3 (March Together)` side-by-side phalanx advance; `P4 (Attack Together)` 8-surrounding-square adjacent Pawn fill-in; `P5 (Get Behind Me)` swap with attacked ally ahead; `P6 (Double Time)` 2-square sprint from Ranks 3–5; `P7 (Protect the King)` diagonal Bishop-slide when adjacent to friendly King; `P8 (Call Reserves)` rear-diagonal Pawn Chain spawn on Ranks 5–7.
     - **Knights**: `N2 (Springboard)` bounce off friendly piece on L-jump square for a second full L-jump; `N3 (Trample)` support both `2x1` and `1x2` L-paths + capture on landing + under-piece L-path arrows; `N4 (Square Jump)` `(±2, ±2)` diagonal jump when defended by any friendly piece; `N5 (Get to the King)` 2-click safe Royal Fork check square `S1` -> second L-jump `S2`; `N6 (Flanking Support)` widened to `a, b, g, h` files; `N7 (Outpost Support)` dropped existing-defender requirement on Ranks 5–8.
     - **Bishops**: `B1 (Let Me Through)` phase cleanly through friendly Pawn on forward diagonal; `B2 (Pierce)` destroy enemy Pawn and move to empty OR capture enemy beyond; `B4 (Change Color)` step 1 square orthogonally (move or capture) when enemy is orthogonally adjacent; `B5 (Take My Place)` swap along diagonal when Bishop is under attack; `B6 (Diagonal Launch)` launch friendly Pawn on the 3 squares in the rank ahead of Bishop along the Pawn's forward diagonals; `B7 (Bishop's Blessing)` bless any friendly non-Bishop piece in the Bishop's 8 surrounding squares to slide diagonally.
     - **Rooks**: `R2 (I've Got Your Back)` allow pushed ally on same rank to move OR capture 1 square forward; `R4 (Move in Unison)` connected Rooks move one and pull the second into its vacated square; `R5 (Catapult)` launch friendly piece directly in front of Rook along open ray to capture enemy ahead; `R6 (Garrison)` spawn Pawn 1 rank in front of Rook when orthogonally adjacent (`N/E/S/W`) to King.
     - **Queens**: `Q1 (Royal Summons)` pull any friendly non-King piece in 8-directional sight (`distance >= 2`) adjacent to Queen; `Q2 (The Queen's Gambit)` add sight (`Queen -> Ally`) & attack (`Ally -> Attacker`) arrows under pieces; `Q3 (Royal Shield)` push adjacent friendly Pawn along ray as a shield (`Pawn` lands on `T`, `Queen` lands on `T - dir`); `Q4 (One Fell Swoop)` allow any number of empty squares between supporting `R/B/Q` and Queen.
     - **Kings**: `K1 (Conscription)` work anywhere on Rank 1, spawning Pawns on empty orthogonal squares; `K3 (Royal Execution)` launch any friendly piece in King's 8 surrounding squares onto an enemy in King's 8-directional sightline; `K4 (Turncoat)` convert an enemy Pawn in King's 8 surrounding squares into a friendly Pawn.
2. **Phase 7 Inserted & Planned (`96fbb0f`, `2d7cc22`)**:
   - Executed `@[.agent/workflows/insert-phase.md]`: inserted Phase 7 (*36-Card Ability Overhaul, Board Preview Arrows & Tournament Re-Simulation*) and renumbered Campaign phases to Phases 8–10.
   - Executed `@[.agent/workflows/plan.md] 7`: authored `.agent/state/phases/7/RESEARCH.md` and 4 atomic plans (`7.1-PLAN.md` through `7.4-PLAN.md`) across 3 waves, verified with 0 blockers.

## In-Progress Work

- Files modified: None (working tree 100% clean and committed to git).
- Tests status: Passing 100% green across all existing unit, AI, and E2E suites.

## Blockers

None.

## Context Dump

### Decisions Made
- `[DECISION-036]`: Phase 7 36-Card Ability Overhaul Around Natural Piece Strengths/Weaknesses & Board Preview Arrows (`N3`, `N5`, `Q2`).
- `[DECISION-035]`: Unified Card-Aware AI with Pre-Condition Shaping, Direct Best-Move Hint & Live Side Eval Bar, and Simulation-First Card Tuning.
- `[DECISION-034]`: Complete Engine/UI Energy Purge, Medieval Village Palette, Live Landing Card Showcase, and Batched Copywriting Review.

### Approaches Tried
- Used empirical `Trigger Rate` and `Play Rate` telemetry from `.agent/state/phases/6/BALANCE_REPORT.md` to diagnose `0.0%` dead conditions and counter-productive swaps/shuffles before designing the Campaign puzzles.

### Files of Interest
- `.agent/state/DECISIONS.md`: Contains `[DECISION-036]` with all 36 card specifications.
- `.agent/state/phases/7/RESEARCH.md`: Complete Phase 7 specification matrix, `BoardPreviewArrow` contract, and staging rules.
- `.agent/state/phases/7/7.1-PLAN.md` – `7.4-PLAN.md`: 4 atomic execution plans across 3 waves.
- `src/engine/cards/releaseRoster36.ts` & `src/engine/cards/playbook36Handlers.ts`: Target files for Wave 1 & Wave 2 execution.
- `src/components/DeckChessBoard.tsx` & `src/hooks/useDeckChessGame.ts`: Target files for Wave 2 (`Plan 7.3`) SVG preview arrows & 2-click staging.

## Next Steps

1. Run `@[.agent/workflows/execute.md] 7` to execute Plans 7.1 through 7.4 across Waves 1–3 and generate the updated 36-card `BALANCE_REPORT.md`.
2. Verify Phase 7 (`@[.agent/workflows/verify.md] 7`) and review the new tournament balance metrics.
3. Proceed to Phase 8 (*Campaign Engine, Jester's Shop, Town Tavern Sandbox & World 1 (`The Causeway`)*).
