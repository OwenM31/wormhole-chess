---
phase: 4
plan: 1
wave: 1
depends_on: []
files_modified:
  - src/engine/cards/releaseRoster36.ts
  - src/engine/cards/playbook36Handlers.ts
  - src/engine/DeckChessEngine.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - "R1 'Make Way' requires friendly Pawn to step aside perpendicularly to an empty square, allowing the Rook to slide to any unobstructed square along the newly opened file"
    - "R1 'Make Way' is unplayable if all perpendicular squares adjacent to the pawn are occupied or blocked"
    - "When both perpendicular squares are open for R1, candidate moves are generated for both step-aside options with extraSquare and disambiguationPrompt"
    - "No card move can leave the acting player's own King in check; makeEmpoweredMove enforces own-king check rejection at the engine level"
    - "Pinned-piece card abilities (N4, B5, P7) reject friendly King as swap/interaction partner"
    - "sweepPromotions promotes any friendly pawn arriving on the last rank (Rank 8 for White, Rank 1 for Black) to Queen across all card actions"
  artifacts:
    - "src/engine/cards/playbook36Handlers.ts contains redesigned r1_make_way handler and king-safety guards across N4/B5/P7"
    - "src/engine/DeckChessEngine.ts asserts king safety in makeEmpoweredMove"
    - "src/engine/cards/releaseRoster36.ts reflects accurate text for R1 Make Way"
---

# Plan 4.1: Engine Mechanics Audit, Check Safety, Promotion Sweep & R1 Redesign

<objective>
Audit and fix core card mechanics and engine-level invariants:
1. Redesign R1 "Make Way" so the blocking friendly pawn steps aside perpendicular to the Rook's ray, opening the file for the Rook to move to any legal square along that line.
2. Enforce engine-level King safety in `makeEmpoweredMove` to ensure no card move can leave the friendly King in check.
3. Guard pin-swap cards (N4, B5, P7) against swapping with or targeting the friendly King.
4. Verify global `sweepPromotions` handles Rank 8 (White) and Rank 1 (Black) promotions cleanly.

Purpose: Eliminate rule bugs and invariant breaches at the foundation engine level before wiring UI layers.
Output: Updated `releaseRoster36.ts`, `playbook36Handlers.ts`, and `DeckChessEngine.ts`.
</objective>

<context>
Load for context:
- .agent/state/phases/4/RESEARCH.md
- src/engine/cards/releaseRoster36.ts (R1 description, conditionText, effectText)
- src/engine/cards/playbook36Handlers.ts (r1_make_way, n4_pin_swap, b5_take_my_place, p7_protect_the_king)
- src/engine/DeckChessEngine.ts (makeEmpoweredMove, getEmpoweredMoves, sweepPromotions)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Redesign R1 'Make Way' in releaseRoster36.ts and playbook36Handlers.ts</name>
  <files>src/engine/cards/releaseRoster36.ts, src/engine/cards/playbook36Handlers.ts</files>
  <action>
    1. In `src/engine/cards/releaseRoster36.ts`:
       - Update `r1_make_way`:
         - `conditionText`: 'Friendly Pawn is orthogonally adjacent and has an empty square perpendicular to your line.'
         - `effectText`: 'Pawn steps aside perpendicular to an empty square, and Rook slides to any open square along the opened line.'
         - `description`: 'Adjacent ally Pawn steps aside to empty square, clearing file for Rook to charge.'
    2. In `src/engine/cards/playbook36Handlers.ts`:
       - Rewrite `r1_make_way`:
         - In `getTargets(engine, anchorSquare)`:
           - For each orthogonal direction `[df, dr]` from `anchorSquare`:
             - Check `pawnSq = CardUtils.getSquare(file + df, rank + dr)`.
             - If piece at `pawnSq` is friendly Pawn:
               - Calculate perpendicular vectors: for `[df, dr]`, the perpendiculars are `[-dr, df]` and `[dr, -df]`.
               - Check candidate step-aside squares: `pawnDest = CardUtils.getSquare(pawnCoords.file + pDf, pawnCoords.rank + pDr)`.
               - Filter only `pawnDest` that exist, are empty, and are not blocked by barriers.
               - If at least one `pawnDest` is valid:
                 - Trace ray along `[df, dr]` starting from `pawnSq` to find all unobstructed Rook destination squares:
                   - `pawnSq` itself (now vacated once pawn steps aside).
                   - Subsequent squares along ray until edge or obstacle (if enemy piece, can capture; if friendly piece or barrier, ray terminates).
                 - For each valid Rook destination and each valid `pawnDest`:
                   - Push `{ to: rookDest, extraSquare: pawnDest, disambiguationPrompt: 'Choose which square the pawn steps aside to' }`.
         - In `execute(engine, anchorSquare, targetSquare, extraSquare)`:
           - Validate Rook is at `anchorSquare`, targetSquare is specified, and extraSquare (the pawn's chosen landing tile) is specified.
           - Identify the friendly pawn between `anchorSquare` and `targetSquare` (or adjacent to `anchorSquare`).
           - Remove enemy piece at `targetSquare` if present (send to graveyard).
           - Move pawn from its origin square to `extraSquare`.
           - Move Rook from `anchorSquare` to `targetSquare`.
           - Return `{ success: true }`.
    AVOID: Pushing the pawn along the Rook ray (`df * 2, dr * 2`) — perpendicular movement is required.
    AVOID: Limiting the Rook to only moving into the pawn's vacated square — the Rook can slide to ANY open square along the file.
  </action>
  <verify>npm run test:playbook</verify>
  <done>R1 Make Way generates perpendicular step-aside targets with ray destinations; typecheck clean.</done>
</task>

<task type="auto">
  <name>Task 2: King Check Invariant Enforcement & Pin Safety Guards</name>
  <files>src/engine/DeckChessEngine.ts, src/engine/cards/playbook36Handlers.ts</files>
  <action>
    1. In `src/engine/DeckChessEngine.ts`:
       - In `makeEmpoweredMove(move: EmpoweredMove)`:
         - After `handler.execute()` and `this.sweepPromotions()`:
           - Locate the friendly King (`type === 'k' && color === currentTurn`).
           - Assert `!this.chess.isAttacked(kingSq as Square, oppColor)`.
           - If friendly King IS attacked, fail with `{ success: false, error: 'Illegal Card Move: Leaves friendly King in check' }` (and revert mutation using rollback clone).
    2. In `src/engine/cards/playbook36Handlers.ts`:
       - Audit `n4_pin_swap`: guard `targetPiece.type !== 'k'` so the pinned Knight cannot swap with its own King.
       - Audit `b5_take_my_place`: guard `targetPiece.type !== 'k'` so the pinned Bishop cannot swap with its own King.
       - Audit `p7_protect_the_king`: verify capture target `enemyPiece.type !== 'k'`.
       - Audit `k4_banish`: ensure pushed stack does not wrap around board edges or crash when reaching rank 8.
  </action>
  <verify>npm run test:playbook</verify>
  <done>makeEmpoweredMove rejects any move leaving friendly King in check; pin cards cannot target friendly King; test suite passes green.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run test:playbook` passes green
- [ ] `npm run typecheck:all` exits with code 0
- [ ] `git diff` confirms R1 perpendicular movement and King safety guards
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
