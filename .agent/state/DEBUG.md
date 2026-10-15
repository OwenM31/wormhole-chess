---
status: resolved
trigger: "In deck builder, I am still not sure if each of the moves does exactly what they are supposed to; this is especially true when playing cards during the turn. Can we go through and verify the behaviors with tests, while still keeping the card logic open to changes in the future (the current iterations of the cards may not be around forever, but I'd still like them to be correct for now)"
created: 2026-10-15T12:05:00-05:00
updated: 2026-10-15T12:17:00-05:00
---

# Debug Session: Deck Builder Chess Card & Move Correctness

## Symptom
**When:** Playing cards and executing subsequent chess moves in Deck Builder Chess.
**Expected:**
1. Every card performs exactly what its card description states without producing invalid board states or FEN errors.
2. Pawn positions respect chess rules (pawns must never be placed on rank 1 or rank 8).
3. Board modifiers (barriers, shields) strictly govern move legality:
   - Barriers block all transit through their square (sliding pieces, pawn double-steps, castling rays) and cannot be stepped onto.
   - Shields protect the designated piece from capture and migrate with the piece.
4. Cards cannot leave the active player's King in illegal check without legal escape moves.
5. Card logic is modular, extensible, and open to future iterations (clean handler/strategy architecture instead of monolithic engine switches).
6. Expanded library cards (`queen_aegis`, `pawn_reinforce`, `rook_ironclad`, `knight_outflank`) function with robust implementations.

**Actual:**
1. `knight_escort` and `king_decree` placed pawns on rank 1 (or rank 8), causing `chess.js` to crash with `Invalid FEN: some pawns are on the edge rows` when cloning the engine (breaking AI minimax search, WebSocket multiplayer sync, and dashboard replay).
2. Barriers did not block pawn double-steps (e.g. `e2`->`e4` jumped over a barrier at `e3`) or castling transit.
3. Shields attached to squares rather than tracking pieces, leaving the shield behind on an empty square when the piece moved.
4. `bishop_pierce` ignored active shields on enemy pieces.
5. `bishop_invert` conditions checked diagonal line-of-sight instead of orthogonal step availability.
6. Expanded library cards were missing execution cases in the engine.
7. Monolithic hardcoded `switch(cardId)` statements in `DeckChessEngine.ts` made future card addition/modification brittle.

## Evidence
- tested: `npx tsx scripts/test-escort-clone.ts`
  found: `engine.clone()` threw `Error: Invalid FEN: some pawns are on the edge rows` when passenger pawn was placed on b1.
- tested: `scripts/test-card-mechanics.ts` Test 4
  found: Pawn at `e2` could move to `e4` when barrier was on `e3`.
- checked: `src/engine/DeckChessEngine.ts` lines 846-859
  found: Only `r`, `b`, `q` checked intermediate squares for barriers. `p` double-step and `k` castling were ignored.
- checked: `src/engine/DeckChessEngine.ts` lines 792-802 & lines 817-820
  found: Shields were stored as `{ type: 'shield', square: targetSquare }` without tracking piece movement.
- checked: `src/engine/DeckChessEngine.ts` lines 280-306
  found: `bishop_invert` conditions checked diagonal open squares (`[1, 1]`, `[-1, -1]`), but `getValidTargetsForCard` checked orthogonal steps (`[1, 0]`, `[0, 1]`).

## Hypotheses

| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | `knight_escort` and `king_decree` place pawns on rank 1/8 because target/anchor coordinates are swapped without rank boundary checks. | 100% | CONFIRMED & FIXED |
| 2 | Barrier filtering in `getLegalMoves()` omits pawn double-step path (`rank + dir`) and castling transit squares (`f1`/`g1` or `d1`/`c1`). | 100% | CONFIRMED & FIXED |
| 3 | BoardModifier for shield stores a static square string rather than tracking piece or transferring on piece move. | 100% | CONFIRMED & FIXED |
| 4 | Card logic can be refactored into a declarative, modular CardBehaviorHandler registry so current cards are 100% correct and future cards can be added/altered with zero engine coupling. | 95% | IMPLEMENTED & VERIFIED |

## Resolution
**Root Cause:**
1. `knight_escort` placed passenger pawns on the knight's vacated anchor square (which was on rank 1 for initial knights at `b1`/`g1`), and `king_decree` allowed swapping with pawns from rank 1/8. Pawns on back ranks violate chess invariants and cause `chess.js` to crash on FEN parsing.
2. `getLegalMoves()` barrier filter only checked sliding ray pieces (`r`, `b`, `q`), omitting pawn double-steps and castling transit squares.
3. Shields remained static on their initial square when pieces moved.
4. Monolithic switches in `DeckChessEngine.ts` prevented easy extension and left expanded cards unimplemented.

**Fix:**
1. **Modular Card Architecture (`src/engine/cards/cardRegistry.ts`)**:
   - Defined `CardBehaviorHandler` interface with `evaluateConditions`, `getTargets`, `getSecondaryTargets`, and `execute`.
   - Decoupled card targeting and mutation from `DeckChessEngine.ts`.
   - Any new card or future rule tweak can now be added or modified in the registry without touching core engine code.
2. **Rank Boundary Safety**:
   - Updated `knight_escort` to transport passenger pawns exclusively to legal flank/adjacent squares (ranks 2..7), never leaving pawns on rank 1 or 8.
   - Updated `king_decree` to exclude pawns from swap targets when King is on rank 1 or 8.
   - Added FEN integrity verification (`new Chess(simulation.getFen())`) and active player legal move verification to `activateCard()`.
3. **Barrier Path Enforcement**:
   - Updated `getLegalMoves()` in `DeckChessEngine.ts` to block pawn double-steps through barriers (`rank + dir`) and castling king transit squares (`f1`/`d1` or `f8`/`d8`).
4. **Dynamic Shield Migration**:
   - Updated `makeMove()` in `DeckChessEngine.ts` so that when a shielded piece moves, its active shield migrates with it to the destination square.
   - Enforced `isSquareShielded` check in `bishop_pierce` (Prism Ray).
5. **Expanded Library Support**:
   - Implemented full handlers for `pawn_reinforce` (graveyard resurrection), `knight_outflank` (rim leap), and `rook_ironclad` (battery leap).
6. **Testing & Tooling**:
   - Added `data-card-id` to `TacticalHandBar.tsx`.
   - Created comprehensive 83-assertion automated test suite `scripts/verify-all-cards.ts` and registered `"test": "tsx scripts/verify-all-cards.ts"` in `package.json`.
   - Created Playwright browser test `scripts/verify-browser-card-play.mjs` verifying live card selection, targeting, combat log recording, and countermoves.

**Verified:**
- `npm test`: 83 / 83 unit and engine assertions passed (0 failures).
- `npm run typecheck:all`: Passed cleanly with 0 errors across frontend, Pages Functions, and worker DOs.
- `npm run build`: Production bundle built cleanly in 1.04s.
- `node scripts/verify-browser-card-play.mjs`: Live headless Chrome test verified card execution `e2` -> `e5`, knight move `g1` -> `f3`, and AI countermove with screenshot saved to `.agent/state/artifacts/screenshots/deck_builder_card_play_verified.png`.
