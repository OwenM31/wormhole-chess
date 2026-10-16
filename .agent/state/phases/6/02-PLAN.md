---
phase: 6
plan: 2
wave: 2
depends_on: [1]
---

# Plan 6.2: Major Unit Behavior Handlers & Royal Invariant Suite

## Objective
Implement deterministic board-state behavior handlers (`getEmpoweredMoves` and `executeEmpoweredMove`) for Rook, Queen, and King cards in `src/engine/cards/cardRegistry.ts`, enforcing strict King-safety and Pawn Rank 2–7 invariants across all 180 cards.

## Context
- `.agent/state/SPEC.md`
- `.agent/state/phases/6/RESEARCH.md`
- `src/engine/cards/cardRegistry.ts`
- `src/engine/DeckChessEngine.ts`
- `scripts/verify-all-cards.ts`

## Tasks

<task type="auto">
  <name>Task 1: Contract-First Specification Tests for Rook, Queen, and King Empowered Moves & Royal Invariants</name>
  <files>scripts/verify-all-cards.ts</files>
  <action>
    Author `Suite 15` specification contract assertions in `scripts/verify-all-cards.ts`:
    - Assert that all 180 cards in `CANONICAL_180_CARDS` have a registered `CardBehaviorHandler` via `getCardHandler(card.id)`.
    - Test Rook empowered move generation & execution:
      - `rook_railgun_bolt` (`Lines` → `Special Captures`): Ranged capture over 1 friendly blocker along a file/rank without moving the Rook.
      - `rook_turret_traverse` (`Blocked` → `New Moves`): 1-step diagonal shift when orthogonally blocked by friendly pieces.
      - `rook_siege_hurdle` (`Momentum` → `Jump & Leap`): Orthogonal jump over 1 blocker to an empty square.
      - `rook_trench_shift` (`Neighbors` → `Move Others`): Swap places with a horizontally adjacent friendly Pawn.
    - Test Queen empowered move generation & execution:
      - `queen_counter_smite` (`Threat` → `Special Captures`): Ranged strike destroying a threatening minor piece without moving the Queen.
      - `queen_amazon_hop` (`Threat` → `Jump & Leap`): Knight-like L-jump escape to an empty square when under threat.
      - `queen_camel_stride` (`Momentum` → `New Moves`): Extended (3,1) or (1,3) leap to an empty square.
    - Test King empowered move generation & execution:
      - `king_keep_garrison` (`Position` → `Spawning`): Home back-rank King spawns a friendly Pawn on an empty square on the 2nd/7th rank in front of it.
      - `king_sanctuary_hop` (`Blocked` → `Jump & Leap`): King jumps 2 squares over an adjacent friendly blocker to a safe empty square.
      - `king_bodyguard_switch` (`Neighbors` → `Move Others`): King swaps places with an adjacent friendly Rook or Knight.
    - Test Royal & Pawn-Rank Precision Invariants:
      - Assert that King empowered moves (`king_sanctuary_hop`, `king_royal_stride`, `king_bodyguard_switch`) are strictly filtered out if the destination leaves the King in check.
      - Assert that ranged captures (`rook_railgun_bolt`, `queen_apex_skewer`, `king_royal_judgement`) never target an enemy King (`type === 'k'`).
      - Assert that Pawn-spawning and Pawn-moving Major Unit cards never place a Pawn on rank 1 or rank 8.
  </action>
  <verify>npx tsx scripts/verify-all-cards.ts</verify>
  <done>Suite 15 specification tests are authored in scripts/verify-all-cards.ts covering Rook, Queen, and King handlers and royal safety invariants.</done>
</task>

<task type="auto">
  <name>Task 2: Implement Rook, Queen, and King Behavior Handlers in cardRegistry.ts</name>
  <files>src/engine/cards/cardRegistry.ts</files>
  <action>
    Update `src/engine/cards/cardRegistry.ts`:
    - Import `CANONICAL_180_CARDS` from `../cardGraph`.
    - Register dedicated, high-precision `CardBehaviorHandler` implementations for representative Rook (`rook_railgun_bolt`, `rook_counter_battery`, `rook_turret_traverse`, `rook_siege_hurdle`, `rook_trench_shift`), Queen (`queen_counter_smite`, `queen_apex_skewer`, `queen_phase_evasion`, `queen_amazon_hop`, `queen_camel_stride`), and King (`king_keep_garrison`, `king_sanctuary_hop`, `king_royal_stride`, `king_bodyguard_switch`, `king_royal_judgement`) cards.
    - Update `registerRemainingCatalogCards()` to iterate over `CANONICAL_180_CARDS` and provide genre-aware fallback handlers for all remaining Rook, Queen, and King cards, ensuring:
      - `Special Captures` never target an enemy King (`piece.type !== 'k'`).
      - `Spawning` and `Move Others` on Pawns strictly enforce target rank 2–7 (`r >= 1 && r <= 6`).
  </action>
  <verify>npm run typecheck:all && npx tsx scripts/verify-all-cards.ts</verify>
  <done>All 180 cards have registered handlers and all Suites 1–15 in scripts/verify-all-cards.ts pass 100%.</done>
</task>

## Success Criteria
- [ ] All 180 cards in `CANONICAL_180_CARDS` have registered handlers in `src/engine/cards/cardRegistry.ts`.
- [ ] Representative Rook, Queen, and King handlers execute their exact board protocols and pass `Suite 15`.
- [ ] King-safety and Pawn rank 2–7 invariants hold across all Major Unit empowered moves.
