---
updated: 2026-10-29T09:36:50-05:00
---

# Project State

## Current Position

- **Milestone**: v3.0 Parallel World Key Campaign, 36-Card Pyramid & Grandmaster Trials
- **Phase**: Phase 10 — *Gameplay Ergonomics, Card Tag Previews, R1 Ray Distance & Move Animation Engine*
- **Task**: Phase 10 inserted; Ready for Phase 10 Planning (`@[.agent/workflows/plan.md] 10` or `@[.agent/workflows/discuss-phase.md] 10`)
- **Status**: Active (resumed 2026-10-29 09:36)
- **Roadmap Status**: Phases 1–9 Complete & Verified; Phase 10 Next (Ergonomics, Card Tags & Animations); Phases 11–13 (Campaign Engine, Castle Wings & Throne Room)

## Last Session Summary

1. **Inserted Phase 10**:
   - Inserted new Phase 10 for Gameplay Ergonomics, Card Tag Previews, R1 Ray Distance & Move Animation Engine.
   - Renumbered old Phases 10–12 to Phases 11–13 (Campaign Engine, Castle Wings, and Throne Room).
2. **B7 (`Bishop's Blessing`) vs B6 (`Diagonal Launch`) Differentiation (`c522554`)**:
   - Identified that `B7: Bishop's Blessing` (all 8 surrounding squares, any non-Bishop piece, all 4 diagonals, move or capture) was a strict mathematical superset of `B6: Diagonal Launch` (3 front squares, Pawns only, 2 forward diagonals, move or capture).
   - Updated `B7: Bishop's Blessing` in `src/engine/cards/releaseRoster36.ts` and `src/engine/cards/playbook36Handlers.ts` so blessed allies slide diagonally **onto an empty square only (cannot capture)**, giving `B7` a universal positional-repositioning identity while keeping `B6: Diagonal Launch` as the offensive Pawn diagonal-capture launcher.
   - Added empty-square-only and non-capture assertions to `scripts/verify-phase7-overhaul.ts` (146/146 passing) and `scripts/verify-36-playbook.ts` (170/170 passing), verified `scripts/verify-36-mechanics-edge-cases.ts` (43/43 passing) and `npm test`, and synced `STORYBOARD.md` and `DECISIONS.md`.

## In-Progress Work

- Files modified: `.agent/state/ROADMAP.md`, `.agent/state/STATE.md`.
- Tests status: All existing regression suites passing 100% green (`verify-phase7-overhaul.ts`, `verify-36-playbook.ts`, `verify-36-mechanics-edge-cases.ts`, `npm test`).

## Blockers

- None.

## Context Dump

### Decisions Made
- `[DECISION-039]`: Inserted Phase 10 for Gameplay Ergonomics, Card Tag Previews, R1 Ray Distance & Move Animation Engine before Campaign Engine (now Phase 11).
- `B7: Bishop's Blessing` (`b7_bishops_blessing`) is now **empty-square only (no capture)** (`[DECISION-036]` updated in `DECISIONS.md`), cleanly distinguishing it from `B6: Diagonal Launch` (`b6_come_this_way`).
- `[DECISION-038]` in `DECISIONS.md`: Chess.com-Style Horizontal Move Stream on Mobile, 2-Column Table on Desktop & Piece-Colored Card Tags.

### Files of Interest
- `src/engine/cards/releaseRoster36.ts`: Canonical 36-card roster metadata.
- `src/engine/cards/playbook36Handlers.ts`: Card behavior handlers for all 36 cards.
- `src/hooks/useDeckChessGame.ts`: Game coordinator, card arm/disarm, and move execution state machine.
- `src/components/MoveStreamMobile.tsx`: Mobile horizontal tape move scrubber.
- `src/components/MoveTableDesktop.tsx`: Desktop 2-column move table.
- `src/components/DeckChessBoard.tsx`: Chessboard rendering & move visualizer.
- `.agent/state/STORYBOARD.md`: Canonical 7-World Campaign & 36-Card specification.

## Next Steps

1. Plan Phase 10: Gameplay Ergonomics, Card Tag Previews, R1 Ray Distance & Move Animation Engine (`@[.agent/workflows/plan.md] 10`)
2. Execute Phase 10 (`@[.agent/workflows/execute.md] 10`)
3. Verify Phase 10 (`@[.agent/workflows/verify.md] 10`)
