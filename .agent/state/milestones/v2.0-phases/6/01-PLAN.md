---
phase: 6
plan: 1
wave: 1
depends_on: []
---

# Plan 6.1: Major Unit 90-Card Catalog & 180-Card Graph Integration

## Objective
Validate and integrate the 90 canonical Major Unit cards (`Rook`, `Queen`, `King`) from `src/engine/cards/cardCatalogMajor90.json` into `src/engine/cardGraph.ts` to form the complete 180-card library (`CANONICAL_180_CARDS`) while maintaining 100% backwards compatibility with existing Phase 5 contracts.

## Context
- `.agent/state/SPEC.md`
- `.agent/state/DECISIONS.md` (DECISION-019)
- `.agent/state/phases/6/RESEARCH.md`
- `src/engine/cards/cardCatalogMajor90.json`
- `src/engine/cardGraph.ts`
- `scripts/verify-all-cards.ts`

## Tasks

<task type="auto">
  <name>Task 1: Contract-First Specification Tests for Major Unit 90-Card Catalog & 180-Card Library</name>
  <files>scripts/verify-all-cards.ts</files>
  <action>
    Author `Suite 14` specification contract assertions in `scripts/verify-all-cards.ts`:
    - Assert that `CANONICAL_MAJOR_90_CARDS` loads 90 cards from `src/engine/cards/cardCatalogMajor90.json` with required schema fields (`id`, `name`, `piece`, `anchor`, `energyCost`, `condition_type`, `condition_exact`, `effect_type`, `effect_exact`, `description`, `image_description`) and that every `card_name` (or `name`) is <= 21 characters.
    - Assert the 30-cards-per-piece distribution across Major Units: 30 Rook, 30 Queen, 30 King.
    - Assert the 12 / 12 / 6 energy cost curve (`1⚡`, `2⚡`, `3⚡`) for Rook, Queen, and King individually.
    - Assert the Major Units 3-cycle condition exclusions and specializations:
      - Rook: 0 `Position` cards, 10 `Neighbors` cards (5 `Walls & Shields`, 5 `Move Others`).
      - Queen: 0 `Neighbors` cards, 10 `Threat` cards (5 `Special Captures`, 5 `Jump & Leap`).
      - King: 0 `Threat` cards, 10 `Position` cards (5 `Spawning`, 5 `Walls & Shields`).
    - Assert that `CANONICAL_180_CARDS` contains exactly 180 cards with 180 unique IDs and that `getCardById()` resolves any card from the 180-card catalog.
  </action>
  <verify>npx tsx scripts/verify-all-cards.ts</verify>
  <done>Specification test suite (Suite 14) is authored in scripts/verify-all-cards.ts defining the exact structural and taxonomic invariants for the 90 Major Unit cards and 180-card combined catalog.</done>
</task>

<task type="auto">
  <name>Task 2: Integrate cardCatalogMajor90.json and Export CANONICAL_180_CARDS in cardGraph.ts</name>
  <files>src/engine/cardGraph.ts</files>
  <action>
    Update `src/engine/cardGraph.ts`:
    - Import `cardCatalogMajor90 from './cards/cardCatalogMajor90.json'`.
    - Export `CANONICAL_MAJOR_90_CARDS: CardDefinition[]` mapped from `cardCatalogMajor90`.
    - Export `CANONICAL_180_CARDS: CardDefinition[] = [...CANONICAL_90_CARDS, ...CANONICAL_MAJOR_90_CARDS]`.
    - Keep `CANONICAL_90_CARDS` exported intact so all existing Phase 5 tests continue passing.
    - Include `CANONICAL_180_CARDS` in `EXPANDED_LIBRARY` so `getCardById()` and deck validation support all 180 canonical cards.
  </action>
  <verify>npm run typecheck:all && npx tsx scripts/verify-all-cards.ts</verify>
  <done>Typecheck and all card verification suites (including Suite 14) pass with 0 errors.</done>
</task>

## Success Criteria
- [ ] `CANONICAL_MAJOR_90_CARDS` (90 cards) and `CANONICAL_180_CARDS` (180 cards) are exported from `src/engine/cardGraph.ts`.
- [ ] All 90 Major Unit cards satisfy the 30-per-piece, 12/12/6 energy curve, <= 21-char name, and Major 3-cycle exclusion invariants.
- [ ] `npm run typecheck:all` and `npm test` pass 100%.
