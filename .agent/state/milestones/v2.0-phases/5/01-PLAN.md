---
phase: 5
plan: 1
wave: 1
depends_on: []
---

# Plan 5.1: Types, Taxonomy & Card Catalog Integration

## Objective
Establish the foundational TypeScript types and data structures for the 6×6 Condition-to-Effect grammar matrix, load the 90 canonical cards (Pawn, Knight, Bishop) into the game engine, and define the Unified Action Model ("The Card IS the Move") types.

## Context
- `.agent/state/SPEC.md`
- `.agent/state/DECISIONS.md` (DECISION-019)
- `.agent/state/phases/5/RESEARCH.md`
- `src/types/deckChess.ts`
- `src/engine/cards/cardCatalog90.json`
- `src/engine/cardGraph.ts`

## Tasks

<task type="auto">
  <name>Task 1: Contract-First Specification Tests for 6x6 Taxonomy & 90-Card Catalog</name>
  <files>scripts/verify-all-cards.ts</files>
  <action>
    Author specification contract test assertions in `scripts/verify-all-cards.ts`:
    - Assert that all 90 cards from `src/engine/cards/cardCatalog90.json` load cleanly with required fields (`id`, `name`, `piece`, `anchor`, `energyCost`, `condition_type`, `condition_exact`, `effect_type`, `effect_exact`, `description`, `image_description`).
    - Assert the 12 / 12 / 6 energy cost distribution across each piece: exactly 12 cards at 1⚡, 12 cards at 2⚡, 6 cards at 3⚡ for Pawns, Knights, and Bishops.
    - Assert the condition exclusion invariants: Pawn has 0 Momentum cards, Knight has 0 Lines cards, Bishop has 0 Blocked cards.
    - Assert the unified `EmpoweredMove` contract type representing an atomic chess move augmented by a card.
  </action>
  <verify>npx tsx scripts/verify-all-cards.ts</verify>
  <done>Specification test assertions are authored, establishing the contract for the 90-card catalog and unified move types.</done>
</task>

<task type="auto">
  <name>Task 2: Implement 6x6 Types and Unified Action Models in deckChess.ts & cardGraph.ts</name>
  <files>src/types/deckChess.ts, src/engine/cardGraph.ts</files>
  <action>
    Update TypeScript interfaces and loaders:
    - In `src/types/deckChess.ts`:
      - Define `ConditionGenre` ('Position' | 'Neighbors' | 'Lines' | 'Threat' | 'Blocked' | 'Momentum').
      - Define `EffectGenre` ('New Moves' | 'Jump & Leap' | 'Move Others' | 'Special Captures' | 'Walls & Shields' | 'Spawning').
      - Update `CardDefinition` to include `condition_type: ConditionGenre`, `condition_exact: string`, `effect_type: EffectGenre`, `effect_exact: string`, `image_description?: string`.
      - Define `EmpoweredMove` interface: `{ from: string; to: string; cardId: string; energyCost: number; promotion?: string; actionType: 'move' | 'in_place' | 'ranged_capture' | 'spawn' | 'wall' | 'shield'; metadata?: Record<string, any> }`.
    - In `src/engine/cardGraph.ts`:
      - Import `cardCatalog90.json` as the canonical expanded card library.
      - Update `STARTER_DECK` and `EXPANDED_LIBRARY` references to use the canonical catalog while preserving tournament deck validation rules (8 cards, valid energy costs 1-3, min 1 pawn, min 1 minor piece).
  </action>
  <verify>npm run typecheck:all && npx tsx scripts/verify-all-cards.ts</verify>
  <done>Full-stack typecheck passes cleanly with zero errors, and all 90 cards are accessible via cardGraph.ts.</done>
</task>

## Success Criteria
- [ ] TypeScript types accurately reflect the 6 Condition genres and 6 Effect genres.
- [ ] All 90 cards from `cardCatalog90.json` are loaded and validated in `cardGraph.ts`.
- [ ] Contract test assertions pass cleanly with `npm test`.
