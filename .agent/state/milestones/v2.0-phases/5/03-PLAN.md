---
phase: 5
plan: 3
wave: 3
depends_on:
  - 5.1
  - 5.2
---

# Plan 5.3: Interactive UI Board & Loadout Curator Integration

## Objective
Wire the unified "Card IS the Move" interaction on the 2D chessboard (illuminating glowing gold empowered move rings alongside standard moves), update the tactical hand bar, enhance the Deck Builder loadout curator to browse and filter the 90-card catalog, and verify end-to-end playability.

## Context
- `.agent/state/phases/5/01-PLAN.md`
- `.agent/state/phases/5/02-PLAN.md`
- `.agent/state/phases/5/RESEARCH.md`
- `src/components/DeckChessBoard.tsx`
- `src/components/TacticalHandBar.tsx`
- `src/hooks/useDeckChessGame.ts`
- `src/components/DeckBuilderView.tsx`

## Tasks

<task type="auto">
  <name>Task 1: Wire Unified Move Highlighting & Execution on DeckChessBoard & HandBar</name>
  <files>src/components/DeckChessBoard.tsx, src/components/TacticalHandBar.tsx, src/hooks/useDeckChessGame.ts</files>
  <action>
    Wire the unified action model on the interactive board:
    - In `src/hooks/useDeckChessGame.ts`:
      - Expose `empoweredMoves: EmpoweredMove[]` computed for the currently selected square.
      - Add `makeEmpoweredMove(move: EmpoweredMove)` handler that calls `engine.makeEmpoweredMove(move)` and updates state.
    - In `src/components/DeckChessBoard.tsx`:
      - When a piece is selected, render standard legal moves with subtle indicators (`0⚡`).
      - Render empowered card destinations with glowing gold rings (`border-2 border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.7)] animate-pulse`).
      - On hover over an empowered tile, show a micro-tooltip with card name, energy cost icon, and short effect description.
      - Clicking an empowered tile triggers `makeEmpoweredMove`, executing the move and completing the turn in one fluid gesture.
    - In `src/components/TacticalHandBar.tsx`:
      - Highlight cards in hand that are currently active/usable for the selected piece.
      - Display current energy cells (1-3) with glowing warm gold styling.
  </action>
  <verify>npm run build && npm run typecheck:all</verify>
  <done>DeckChessBoard renders both standard moves and glowing gold empowered moves, allowing one-click execution.</done>
</task>

<task type="auto">
  <name>Task 2: Expand DeckBuilderView Catalog & Automated Playwright Verification</name>
  <files>src/components/DeckBuilderView.tsx, scripts/verify-phase5-taxonomy.mjs</files>
  <action>
    Integrate the 90-card catalog into the loadout curator and verify in headless browser:
    - In `src/components/DeckBuilderView.tsx`:
      - Update card catalog grid to load all 90 cards from `cardCatalog90.json`.
      - Add filter tabs by piece anchor: `All (90)`, `Pawn (30)`, `Knight (30)`, `Bishop (30)`.
      - Display condition genre and effect genre badges on each card item.
      - Maintain 8-card loadout equipping, slot counters, and tournament validation.
    - Create automated Playwright verification suite `scripts/verify-phase5-taxonomy.mjs`:
      - Navigate to `/deck-builder`.
      - Verify that the card catalog loads 90 cards and filters accurately across Pawn, Knight, and Bishop tabs.
      - Select a piece on the board and verify that standard move indicators and glowing gold empowered move rings render properly.
      - Execute an empowered move (e.g. Camel leap or Bayonet charge) and verify that energy deducts and the card is consumed.
      - Capture proof screenshot at `.agent/state/artifacts/screenshots/phase5_empowered_moves.png`.
  </action>
  <verify>node scripts/verify-phase5-taxonomy.mjs</verify>
  <done>DeckBuilderView displays all 90 cards with responsive filtering, and automated Playwright test verifies board interaction with exit code 0.</done>
</task>

## Success Criteria
- [ ] Selecting a piece on the 2D board renders both standard legal moves and glowing gold empowered card destinations.
- [ ] Clicking an empowered tile executes the move and consumes the card atomically.
- [ ] `DeckBuilderView` allows filtering and browsing all 90 cards across Pawn, Knight, and Bishop.
- [ ] Headless Chrome Playwright verification suite passes with 0 errors and captures proof screenshot.
