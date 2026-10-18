---
updated: 2026-10-18T09:43:00-05:00
---

# Project State

## Current Position

- **Milestone**: v3.0 Tactical Campaign, 36-Card Curation & Grandmaster Trials
- **Phase**: 3 — Campaign Storyboard & One-by-One 36-Card Roster Curation (`2,1,1,1,1,0` Matrix) (not started)
- **Task**: Milestone v3.0 pivoted to PvZ-style Campaign & 36-Card Curation (`[DECISION-025]`); ready for Phase 3 storyboarding and card-by-card review
- **Status**: Active (resumed 2026-10-18 09:09)
- **Roadmap Status**: Phases 1–2 Complete; Ready for Phase 3 (`@[.agent/workflows/discuss-phase.md] 3` or `@[.agent/workflows/plan.md] 3`)

## Last Session Summary
Phase 2 executed and verified successfully:
- Wave 1 (Plan 2.1): Authored contract test harness `scripts/verify-phase2-assets.mjs` and generated all 30 Knight vector SVG assets in `public/assets/cards/knight/`.
- Wave 2 (Plans 2.2 & 2.3):
  - Plan 2.2: Authored Staunton Pawn silhouette generator `scripts/generate-pawn-assets.mjs` and generated all 30 Pawn vector SVG assets in `public/assets/cards/pawn/`.
  - Plan 2.3: Authored Staunton Bishop silhouette generator `scripts/generate-bishop-assets.mjs` and generated all 30 Bishop vector SVG assets in `public/assets/cards/bishop/`.
- Wave 3 (Plan 2.4):
  - Integrated `<CardArt />` in `src/components/TacticalHandBar.tsx` (idle 38px card window; reveals 5×4 mini-board on hover/active targeting).
  - Integrated `<CardArt />` in `src/components/DeckBuilderView.tsx` (equipped rack & library grid), strictly maintaining the zero-ellipsis rule.
  - Authored and executed headless Playwright visual UX test suite `scripts/verify-phase2-ux.mjs` across desktop and mobile with zero horizontal overflow.
- Full verification: 90/90 SVG contract tests passing, 236/236 automated unit tests passing, full-stack typecheck clean, production build clean.

## In-Progress Work

None. Milestone v3.0 roadmap pivoted cleanly per `[DECISION-025]`.

## Blockers

None.

## Context Dump

### Decisions Made
- [DECISION-014]: Frontend Visual Craft & Copy Policy (eradicate AI-slop, design page-by-page, require explicit copy confirmation).
- [DECISION-015]: Phase 1 Design Direction: Variant A (Technical Density, 2-column command layout).
- [DECISION-016]: Phase 2 Tactical Arena Architecture & Authentic Wormhole Chess Color System.
- [DECISION-017]: Phase 3 Home Landing & Authentication Architecture: Unified Stage & Restrained Copy.
- [DECISION-018]: Phase 4 3D Wormhole HUD Architecture: Tactical Glass HUD (floating top capsule, floating bottom camera dock, collapsible drawer).
- [DECISION-019]: Phase 5 Deck Builder Card Graph: 6x6 Taxonomy, Symmetrical 3-Cycles, 90-Card Slice & Unified Action Model.
- [DECISION-020]: Phase 7 Global Polish, 3-Column TCG Ruffle Hand Stage, Palette Unification, and Release Scope.
- [DECISION-021]: Brand Title & Dual Icon Architecture ("WormholeChess" PascalCase + dual icon roles).
- [DECISION-022]: Home Copy & Variant Nomenclature Refinement ("Home to your favorite chess variants" + "Wormhole Chess").
- [DECISION-023]: Phase 1 Card Nomenclature, Zero-Ellipsis Rule Constraints & Static Vector Asset Pipeline.
- [DECISION-024]: Phase 2 Minor Unit Vector Artwork Suite Architecture & Design Directives.
- [DECISION-025]: Milestone v3.0 Strategic Pivot: PvZ-Style Campaign Progression, 36-Card `(2, 1, 1, 1, 1, 0)` First-Release Curation & 180-Puzzle Grandmaster Trials:
  - Scope First Release to 6 curated cards per piece ($6 \times 6 = 36$ cards total), adhering to the `(2, 1, 1, 1, 1, 0)` condition distribution (2 Specialty, 1 on each of 4 Secondary, 0 Excluded) and 1 card per Effect Genre.
  - Ensure 100% bespoke engine handlers in `cardRegistry.ts` for all 36 cards (zero generic fallbacks).
  - Unlock each card via a 5-puzzle tactical gauntlet ($36 \times 5 = 180$ puzzles) across 6 Grandmaster Houses ("The Grandmaster Trials"), with narrative extensibility for Tiers II–V seasonal expansions, Cross-House Conclaves, and Rift Anomaly puzzles.

### Files of Interest
- `.agent/state/ROADMAP.md`: Pivoted Milestone v3.0 roadmap (Phases 3–6: Storyboard & 36-Card Curation, Puzzle Engine & UI, Acts I–III 90 Puzzles, Acts IV–VI 90 Puzzles).
- `.agent/state/DECISIONS.md`: Architectural decision ledger including `[DECISION-025]`.
- `src/engine/cards/cardCatalog90.json`: 90 Minor Unit cards (Pawn, Knight, Bishop) with `artId` and zero-ellipsis formulas.
- `src/engine/cards/cardCatalogMajor90.json`: 90 Major Unit cards (Rook, Queen, King) with `artId` and zero-ellipsis formulas.
- `src/engine/cards/cardRegistry.ts`: Modular card behavior handlers (39 bespoke handlers currently; to be audited for the 36 First-Release cards).
- `src/engine/cardGraph.ts`: Canonical card arrays and loadout helpers.
- `scripts/verify-all-cards.ts`: Automated card engine and contract test suite (all 16 suites / 236 tests passing).
- `src/components/TacticalHandBar.tsx`: Left TCG hand stage.
- `src/components/DeckBuilderView.tsx`: Deck builder curator and card library grid.

## Next Steps

1. Proceed to Phase 3: Campaign Storyboard & One-by-One 36-Card Roster Curation (`2,1,1,1,1,0` Matrix).
2. Run `@[.agent/workflows/discuss-phase.md] 3` or `@[.agent/workflows/plan.md] 3` to begin the one-by-one card curation and storyboard lock across the 6 Grandmaster Houses.
