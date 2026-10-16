---
phase: 5
plan: 2
wave: 2
depends_on:
  - 5.1
---

# Plan 5.2: Card Behavior Handlers & Unified Move Generation

## Objective
Implement modular behavior handlers for the canonical cards in `src/engine/cards/cardRegistry.ts`, build unified empowered move generation in `DeckChessEngine.ts` that calculates special card-augmented moves alongside standard chess moves, and enforce all chess invariants.

## Context
- `.agent/state/phases/5/01-PLAN.md`
- `.agent/state/phases/5/RESEARCH.md`
- `.agent/state/DECISIONS.md` (DECISION-019)
- `src/engine/DeckChessEngine.ts`
- `src/engine/cards/cardRegistry.ts`
- `scripts/verify-all-cards.ts`

## Tasks

<task type="auto">
  <name>Task 1: Specification Test Suite for Unified Move Generation & Invariants</name>
  <files>scripts/verify-all-cards.ts</files>
  <action>
    Author specification tests in `scripts/verify-all-cards.ts`:
    - Test unified move generation: calling `getEmpoweredMoves(square, hand, energy)` returns valid `EmpoweredMove` objects with correct energy deductions and destination squares.
    - Test Fairy vectors:
      - Camel leap `(3,1)` for Knight from starting square (`knight_cavalry_charge`).
      - Zebra leap `(3,2)` for dormant Knight (`knight_spring_vault`).
      - Dabbaba straight jump `(2,0)` for Knight (`knight_straight_lance`).
    - Test Special Captures:
      - Bayonet forward pawn capture (`pawn_bayonet_charge`).
      - Prism Ray piercing slide through pawn (`bishop_piercing_ray`).
      - In-place diagonal capture under pin (`pawn_hold_the_line`).
    - Test New Moves & Transpositions:
      - Bishop orthogonal step color inversion (`bishop_aisle_step`, `bishop_color_shift`).
      - Knight jump color flip (`bishop_heretics_gambit`).
      - Pawn sideways bypass step (`pawn_sidestep`).
    - Test Invariants:
      - FEN rank boundary safety: No pawn can ever be spawned or landed on rank 1 or 8 without queen promotion.
      - King safety: Pinned pieces can only move along the pin ray (e.g., `pawn_close_the_gap`, `knight_ray_intercept`).
  </action>
  <verify>npx tsx scripts/verify-all-cards.ts</verify>
  <done>Specification test suite is authored covering unified move generation, fairy vectors, and chess invariants.</done>
</task>

<task type="auto">
  <name>Task 2: Implement Behavior Handlers & Unified Move Calculator in Engine</name>
  <files>src/engine/cards/cardRegistry.ts, src/engine/DeckChessEngine.ts</files>
  <action>
    Implement card behavior handlers and engine integration:
    - In `src/engine/cards/cardRegistry.ts`:
      - Implement handlers for the canonical cards using the `CardBehaviorHandler` interface.
      - Ensure all movements and spawns strictly enforce `isValidPawnSquare` (ranks 2-7).
      - Implement composite actions (e.g., step-then-slide, leap-and-carry, hit-and-run recoil).
    - In `src/engine/DeckChessEngine.ts`:
      - Add `getEmpoweredMoves(square: string): EmpoweredMove[]`:
        - Checks player hand and current available energy.
        - Evaluates card conditions for the piece on `square`.
        - Returns list of empowered destination squares with `cardId`, `energyCost`, and `actionType`.
      - Update `makeEmpoweredMove(move: EmpoweredMove)`:
        - Executes the atomic card-augmented move.
        - Deducts the card energy cost (`this.energy -= move.energyCost`).
        - Consumes the card from hand.
        - Updates board modifiers (barriers, shields) and advances the turn.
        - Enforces standard 8th-rank promotion if a pawn lands on rank 8.
  </action>
  <verify>npm test && npm run typecheck:all</verify>
  <done>All automated card engine tests pass green (0 failures) and full-stack typecheck is clean.</done>
</task>

## Success Criteria
- [ ] `getEmpoweredMoves` calculates valid empowered moves for any selected piece based on cards in hand and board conditions.
- [ ] `makeEmpoweredMove` executes moves atomically, deducts energy, consumes the card, and advances the turn.
- [ ] All 83+ automated test assertions pass cleanly with `npm test`.
