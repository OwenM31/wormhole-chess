---
phase: 2
plan: "02"
wave: 2
depends_on: ["01"]
must_haves:
  - "TacticalHandBar.tsx constrained strictly to 470px width flush with the chessboard"
  - "Accordion/carousel hover expand effect implemented on TacticalHandBar cards revealing name and effect rules without expanding total container width"
  - "DeckBuilderView.tsx updated to Wormhole color palette with streamlined copy and equipped 8-card loadout rack"
  - "All 83 automated card engine tests (npm test) and full-stack typechecks pass cleanly"
---

# Plan 2.2: Tactical Hand Bar & Deck Curator Redesign

## Objective
Refactor `TacticalHandBar.tsx` to match the exact 470px width of the chessboard and implement the approved accordion/carousel hover expand effect. Refactor `DeckBuilderView.tsx` ("My Deck") with authentic Wormhole Chess design tokens, clean restrained copy, and responsive 8-card loadout curation. Ensure zero gameplay or test regressions across all 83 automated card engine tests.

## Context
- `.agent/rules/STYLE.md` — Wormhole authentic palette and approved copy
- `.agent/state/DESIGN_STATE.md` — Variant A Refined directives and continuity rules
- `.agent/state/phases/2/RESEARCH.md` — Component architecture and token specs
- `.agent/state/phases/2/01-PLAN.md` — Wave 1 dependencies
- `src/components/TacticalHandBar.tsx` — Current tactical hand component
- `src/components/DeckBuilderView.tsx` — Current deck customizer component
- `src/engine/cardGraph.ts` — Card definitions and piece themes

## Tasks

<task type="auto">
  <name>Task 1: Refactor TacticalHandBar with flush 470px framing and accordion hover expand effect</name>
  <files>src/components/TacticalHandBar.tsx</files>
  <action>
    Update `src/components/TacticalHandBar.tsx` to implement the approved Variant A Refined hand dock:
    1. Container Framing:
       - Set container width strictly to 470px (`w-full max-w-[470px]`) flush with `DeckChessBoard`.
       - Background `#24272A`, border `1px solid rgba(139, 126, 116, 0.25)`, 6px radius (`rounded-md`).
    2. Header Bar:
       - Left: `⚡ ENERGY [■][■][■] 3/3` with warm gold cells (`#D4AF37`) and tabular numbers in `font-mono`.
       - Right: `(?)` rules popover trigger button (with accessible tooltip explaining the pre-move card window).
       - Remove verbose status banner text that crowded the header.
    3. Accordion / Carousel Card Rack (`cards-accordion`):
       - Render the 8 cards in a flex container (`flex gap-[5px] h-[72px] w-full overflow-visible`).
       - Base resting state: `flex-1 min-w-[42px] bg-[#1C1E20] border border-[rgba(139,126,116,0.2)] rounded p-[6px_5px] flex flex-col justify-between items-center transition-all duration-200`. Displays piece icon, cost badge (`2⚡`), and compact title.
       - Hover state: `flex-[2.6] bg-[#282B2E] border-[#D4AF37] -translate-y-1 shadow-lg z-10`. Expands horizontally to display full title and 2-line effect rules (`text-[10px] text-warmWhite line-clamp-2`), while neighboring cards gently compress to keep the rack strictly within 470px.
       - Selected state: Border `#D4AF37` / `#A855F7` with subtle glow aura.
       - Consumed / used state: `opacity-25 border-dashed cursor-not-allowed`.
    4. Preserve all props (`hand`, `initialDeck`, `energy`, `hasPlayedCardThisTurn`, `isMyTurn`, `selectedCard`, `targetingStage`, `onSelectCard`, `onCancelTargeting`) and card click handlers.
  </action>
  <verify>npm run typecheck:all</verify>
  <done>TacticalHandBar renders within flush 470px width, displays 3-cell energy meter, and executes smooth accordion hover expansion without horizontal overflow.</done>
</task>

<task type="auto">
  <name>Task 2: Refactor DeckBuilderView with Wormhole tokens, clean copy, and loadout rack</name>
  <files>src/components/DeckBuilderView.tsx</files>
  <action>
    Update `src/components/DeckBuilderView.tsx` to align with the Wormhole design system and approved copy:
    1. Top Banner & Actions:
       - Title: "Deck Loadout" (text-2xl font-bold text-warmWhite `#FAF9F6`).
       - Remove verbose explanatory paragraph as directed by user.
       - Actions: "Back to Arena", "Reset Starter", "Save Loadout" (primary `#4C5C4C` loden green button).
       - Background `#24272A`, border `1px solid rgba(139, 126, 116, 0.25)`, 6px radius.
    2. Equipped Loadout Rack:
       - Header: "Equipped Loadout (Click to remove)" with status pill "8/8 Cards Equipped" (`#D4AF37` gold when valid).
       - 8 slots rendered in a responsive grid (`grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5`).
       - Card cards styled with `#1C1E20` surface, piece theme colored borders, energy cost pill, and hover-to-remove badge.
    3. Card Library Catalog:
       - Header: "Card Library" with filter tabs: "All", "Pawn", "Knight", "Bishop", "Rook", "Queen", "King".
       - Filter button active state: `#D4AF37` gold background with `#141618` dark text.
       - Catalog cards styled with `#24272A` surface, `#FAF9F6` text, piece icon badge, cost pill, description, and "Equip" / "Remove" toggle button.
    4. Preserve all cloud synchronization (`/api/decks`) and guest fallback logic intact.
  </action>
  <verify>npm run typecheck:all &amp;&amp; npm test</verify>
  <done>DeckBuilderView compiles cleanly, displays approved copy, renders 8-card loadout rack and library with Wormhole tokens, and all 83 card engine tests pass cleanly.</done>
</task>

## Success Criteria
- [ ] `TacticalHandBar.tsx` strictly occupies 470px width flush with the chessboard and supports accordion hover expansion.
- [ ] `DeckBuilderView.tsx` displays approved "Deck Loadout" copy and Wormhole design tokens.
- [ ] All 83 automated card engine tests (`npm test`) pass cleanly with 0 failures.
- [ ] Full-stack typecheck (`npm run typecheck:all`) and production build (`npm run build`) pass cleanly.
