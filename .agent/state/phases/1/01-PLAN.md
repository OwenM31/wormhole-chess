---
phase: 1
plan: 1
wave: 1
depends_on: []
files_modified:
  - src/types/deckChess.ts
  - src/engine/cardGraph.ts
  - scripts/verify-all-cards.ts
autonomous: true
must_haves:
  truths:
    - CardDefinition interface includes artId property
    - CANONICAL_90_CARDS and CANONICAL_MAJOR_90_CARDS map artId cleanly
    - scripts/verify-all-cards.ts contains Suite 16 contract tests checking title length <= 21, description <= 120, zero ellipses, artId presence, and 12/12/6 cost curve
  artifacts:
    - src/types/deckChess.ts
    - src/engine/cardGraph.ts
    - scripts/verify-all-cards.ts
---

# Plan 1.1: Schema Definition, TypeScript Contracts & Contract Test Harness

<objective>
Update shared TypeScript types to include `artId` in `CardDefinition`, update `cardGraph.ts` mapping to supply `artId`, and author contract test suite `Suite 16` in `scripts/verify-all-cards.ts` to strictly validate all 180 canonical cards against schema, character length, typography, and zero-ellipsis constraints.

Purpose: Establishes the contract-first test harness so subsequent catalog editing waves (Plans 1.2 and 1.3) can be empirically validated against strict acceptance criteria.
Output: Updated `deckChess.ts`, `cardGraph.ts`, and new test suite `Suite 16` in `verify-all-cards.ts`.
</objective>

<context>
- `.agent/state/SPEC.md`
- `.agent/rules/STYLE.md`
- `.agent/state/DECISIONS.md` (DECISION-023)
- `.agent/state/phases/1/RESEARCH.md`
- `src/types/deckChess.ts`
- `src/engine/cardGraph.ts`
- `scripts/verify-all-cards.ts`
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add artId to CardDefinition and update cardGraph.ts mapping</name>
  <files>src/types/deckChess.ts, src/engine/cardGraph.ts</files>
  <action>
    1. In `src/types/deckChess.ts`:
       - Add `artId?: string;` to `CardDefinition` interface.
       - Preserve all existing fields and optional compatibility fields (`card_name`, `card_description`).
    2. In `src/engine/cardGraph.ts`:
       - Update `CANONICAL_90_CARDS` mapping: assign `artId: raw.artId || raw.id`.
       - Update `CANONICAL_MAJOR_90_CARDS` mapping: assign `artId: raw.artId || raw.id`.
       - Preserve `EXPANDED_LIBRARY`, `STARTER_DECK`, and `LEGACY_EXTRA_CARDS`.
    AVOID: Modifying `card.id` or changing existing behavior handler imports.
  </action>
  <verify>npm run typecheck:all</verify>
  <done>src/types/deckChess.ts and src/engine/cardGraph.ts compile cleanly with 0 TypeScript errors.</done>
</task>

<task type="auto">
  <name>Task 2: Author Suite 16 Contract Test Suite in scripts/verify-all-cards.ts</name>
  <files>scripts/verify-all-cards.ts</files>
  <action>
    Add `Suite 16: Phase 1 Schema, Length & Zero-Ellipsis Contract Verification` to `scripts/verify-all-cards.ts`:
    1. Assert exactly 180 cards across `CANONICAL_180_CARDS` (90 in `cardCatalog90` + 90 in `cardCatalogMajor90`).
    2. Assert every card has non-empty `id`, `name`, `anchor`, `energyCost`, `condition_type`, `condition_exact`, `effect_type`, `effect_exact`, `description`, `image_description`, and `artId`.
    3. Assert `artId` matches `card.id`.
    4. Assert `card.name.length <= 21` across all 180 cards.
    5. Assert `card.description.length <= 120` across all 180 cards (ready for Plans 1.2 & 1.3).
    6. Assert `!card.description.includes('...')` and `!card.name.includes('...')` (Zero-Ellipsis Rule).
    7. Assert 30 cards per piece anchor (`pawn`, `knight`, `bishop`, `rook`, `queen`, `king`).
    8. Assert 12 / 12 / 6 energy cost curve per piece (12 at 1⚡, 12 at 2⚡, 6 at 3⚡).
    9. Assert condition exclusion rules per piece (Pawn excl. Momentum, Knight excl. Lines, Bishop excl. Blocked, Rook excl. Position, Queen excl. Neighbors, King excl. Threat).
    10. Assert clean typography: no curly quotes (`'`, `"`, `"`), no double spaces (`  `), and no trailing whitespace in names or descriptions.
    AVOID: Weakening assertions or skipping cards.
  </action>
  <verify>npx ts-node scripts/verify-all-cards.ts</verify>
  <done>Suite 16 test harness runs and executes all contract assertions.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run typecheck:all` exits 0 with 0 errors.
- [ ] `Suite 16` executes within `scripts/verify-all-cards.ts`.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
