---
phase: 6
plan: 3
wave: 3
depends_on: [1, 2]
---

# Plan 6.3: 180-Card Curator UI & Playwright Empirical Verification

## Objective
Expand the Deck Builder Curator UI (`src/components/DeckBuilderView.tsx`) to display and filter all 180 canonical cards across all 6 chess pieces (`Pawn`, `Knight`, `Bishop`, `Rook`, `Queen`, `King`), and empirically verify the 180-card UI and Major Unit board move interactions using Playwright.

## Context
- `.agent/state/SPEC.md`
- `.agent/state/phases/6/RESEARCH.md`
- `src/components/DeckBuilderView.tsx`
- `scripts/verify-phase5-unified-cards.mjs`

## Tasks

<task type="auto">
  <name>Task 1: Expand DeckBuilderView.tsx to 180 Cards and 7 Piece Filter Tabs</name>
  <files>src/components/DeckBuilderView.tsx</files>
  <action>
    Update `src/components/DeckBuilderView.tsx`:
    - Import `CANONICAL_180_CARDS` from `../engine/cardGraph`.
    - Expand `anchorFilter` state union to `'all' | 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king'`.
    - Render all 7 piece filter buttons (`All (180)`, `Pawn (30)`, `Knight (30)`, `Bishop (30)`, `Rook (30)`, `Queen (30)`, `King (30)`) with `data-testid="filter-${f}"`.
    - Filter `CANONICAL_180_CARDS` in `filteredCatalog` so users can browse and equip cards from all 6 pieces into their 8-card loadout.
  </action>
  <verify>npm run typecheck:all && npm run build</verify>
  <done>DeckBuilderView renders all 180 cards and 7 piece filter tabs cleanly with zero TypeScript or build errors.</done>
</task>

<task type="auto">
  <name>Task 2: Empirical Playwright Verification of 180-Card Curator & Major Unit Empowered Moves</name>
  <files>scripts/verify-phase6-major-units.mjs</files>
  <action>
    Create and execute `scripts/verify-phase6-major-units.mjs` to empirically verify Phase 6 in headless Chromium:
    - Open the Deck Builder Curator view and verify `filter-all` displays 180 cards, and each piece filter (`filter-pawn`, `filter-knight`, `filter-bishop`, `filter-rook`, `filter-queen`, `filter-king`) displays exactly 30 cards.
    - Equip a Major Unit card (e.g., `king_keep_garrison`) into the 8-card loadout and launch a local match.
    - Verify on the live board that selecting the White King on `e1` with `king_keep_garrison` in hand highlights empowered target squares with gold rings after `e2` is vacated.
    - Assert zero console errors and zero uncaught page errors, and save screenshot evidence to `.agent/state/artifacts/screenshots/phase6_major_units.png`.
  </action>
  <verify>node scripts/verify-phase6-major-units.mjs</verify>
  <done>Playwright script passes all assertions with 0 console/page errors and captures visual screenshot proof.</done>
</task>

## Success Criteria
- [ ] Deck Builder Curator displays all 180 canonical cards and filters cleanly across all 6 chess pieces (30 each).
- [ ] Major Unit cards can be equipped in the Deck Builder and triggered directly on the board via gold empowered move rings.
- [ ] Playwright verification passes with 0 console errors and saves `.agent/state/artifacts/screenshots/phase6_major_units.png`.
