---
phase: 7
plan: 2
wave: 2
depends_on: [1]
---

# Plan 7.2: 3-Column TCG Ruffle Hand Stage, Full 512×512 Center Board & Audio Polish

## Objective
Implement the approved **Variant D (Refined)** architecture on `DeckBuilderPage.tsx` and `TacticalHandBar.tsx`: transform the player's hand into a dedicated **Left TCG Ruffle Hand Stage** (`356px` width on desktop) featuring only the `⚡ ENERGY` bar (`3/3`) and **2 rows of 4 portrait TCG playing cards (`5:7` aspect ratio)** with ruffle overlap, smooth hover pop-out reveal, and an embedded 5×4 mini-board visual explainer inside the card art window; expand the Center Stage to a full **`512×512px` square Chessboard** without any bottom card strip; add **`Moves` | `Chat`** segmented tabs to the Right Panel; and wire complete procedural audio triggers in `useDeckChessGame.ts`.

## Context
- `.agent/rules/STYLE.md` (Section 5: Deck Builder 3-Column TCG Ruffle Hand Stage)
- `.agent/state/DESIGN_STATE.md` (Phase 7 Variant D Refined)
- `.agent/state/artifacts/design/phase_7_refined.png`
- `.agent/state/DECISIONS.md` (DECISION-020)
- `src/components/TacticalHandBar.tsx`
- `src/pages/DeckBuilderPage.tsx`
- `src/hooks/useDeckChessGame.ts`

## Tasks

<task type="auto">
  <name>Task 1: Refactor TacticalHandBar.tsx into the Portrait TCG Ruffle Hand Stage with Mini-Board Visual Explainer</name>
  <files>src/components/TacticalHandBar.tsx</files>
  <action>
    Refactor `src/components/TacticalHandBar.tsx` to match the locked **Variant D (Refined)** Left TCG Hand Stage specification in `.agent/rules/STYLE.md` and `.agent/state/artifacts/design/phase_7_refined.png`:
    1. **Pure Top Energy Bar**:
       - Render the `⚡ ENERGY` bar with 3 gold pips and `{energy}/3` numeric readout in a `#24272A` header box.
       - Remove the legacy `'?'` rules tooltip button, remove `"7/8 IN HAND"`, and do not render any bottom instructional text notes (`"Hover any card..."`).
       - When `selectedCard` is actively targeting on the board, show the compact `Cancel` button inline in the energy header.
    2. **2×4 Portrait TCG Ruffle Spread (or 1×5 in 5-card mode)**:
       - Partition `initialDeck` into 2 rows of 4 cards (or 1 row if `initialDeck.length <= 5`).
       - Each card (`data-card-id={cardId}`, class `tcg-card`) has portrait TCG dimensions (`w-[92px] h-[132px] sm:w-[112px] sm:h-[160px]`, `rounded-[7px]`) with horizontal ruffle overlap (`-ml-5 sm:-ml-6` for cards 2..4 in each row, `ml-0` for card 1) and subtle fan rotation (`-rotate-3`, `-rotate-1`, `rotate-1`, `rotate-3`).
       - On hover, selection (`isSelected`), or active piece highlight (`isActiveForPiece`), smoothly pop out the card (`hover:-translate-y-4 hover:scale-[1.22] hover:rotate-0 hover:z-30 hover:border-[#D4AF37]`).
    3. **3-Part Pokémon/TCG Card Anatomy**:
       - **Top Header**: Piece glyph + Card Name (`card.name`) on the left, Energy Cost badge (`⚡{card.energyCost}` or `USED` if `!isAvailable`) on the right.
       - **Center Art / Mini-Board Visual Explainer Window**:
         - By default, renders the piece class icon (`theme.badgeIcon`) centered in a `#141618` framed viewport.
         - When hovered, selected, or active (`isActiveForPiece`), renders a 5×4 mini-board schematic inside the art window showing the anchor piece at the base and 2 glowing gold target rings (`border-[#D4AF37] bg-[#D4AF37]/35`) illustrating the card's tactical effect!
       - **Bottom Rules Box**: Displays the compact taxonomy line (`{conditionLabel} ➔ {effectLabel}`) in `#D4AF37` uppercase micro-type above `card.description`.
  </action>
  <verify>npm run typecheck:all</verify>
  <done>TacticalHandBar.tsx renders the pure Energy header and 2x4 Portrait TCG Ruffle Hand with hover pop-out and mini-board visual explainer, compiling with 0 TypeScript errors.</done>
</task>

<task type="auto">
  <name>Task 2: Refactor DeckBuilderPage.tsx into the 3-Column Stage (Full 512px Board + Right Moves/Chat Tabs) & Wire Complete Audio in useDeckChessGame.ts</name>
  <files>src/pages/DeckBuilderPage.tsx, src/hooks/useDeckChessGame.ts</files>
  <action>
    1. In `src/pages/DeckBuilderPage.tsx`:
       - Remove the secondary full-width `<header>` bar and remove the redundant desktop `<aside>` route icon rail.
       - Add state for the Right Panel tab: `const [rightTab, setRightTab] = useState<'moves' | 'chat'>('moves')`, plus local chat state (`chatMessages`, `chatInput`, `handleSendChat`) so players can switch between `Moves` and `Chat`.
       - Structure the main arena (`activeTab === 'arena'`) as a 3-column desktop stage (`w-full flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-5`):
         - **Left Column (`w-full max-w-[512px] lg:w-[356px] lg:h-[596px] order-2 lg:order-1`)**: Renders `<TacticalHandBar ... />` filling the `#1C1E20` Left Hand Stage card.
         - **Center Column (`w-full max-w-[512px] lg:h-[596px] flex flex-col justify-between order-1 lg:order-2`)**:
           - Opponent Status Bar (`36px` height)
           - Full **`512×512px` square `DeckChessBoard`** (`w-full max-w-[512px] aspect-square`) with Game Over modal overlay
           - Player Status Bar (`36px` height)
           - Zero bottom card bar underneath the board!
         - **Right Column (`w-full max-w-[512px] lg:w-[280px] lg:h-[596px] order-3`)**:
           - Top Header: Segmented **`Moves` | `Chat`** tabs on the left (`rightTab`), `Turn {game.turnNumber}` on the right.
           - When `rightTab === 'moves'`: AI Difficulty selector + scrollable algebraic move & card log.
           - When `rightTab === 'chat'`: Scrollable chat message list + bottom input form (`Send message...` + `Send` button).
           - Bottom Action Footer: `Resign` · `New Game` · `My Deck` (clicking `My Deck` switches `activeTab` to `'forge'`).
    2. In `src/hooks/useDeckChessGame.ts`:
       - Import `playVictorySound` and `playDefeatSound` from `../utils/soundEffects`.
       - In `makeMove`, `makeEmpoweredMove`, and `triggerAiTurn`, check `if (engineRef.current.isGameOver())`: play `playVictorySound()` if the human player won (or draw in solo), or `playDefeatSound()` if the AI won.
       - In `makeEmpoweredMove`, if the target square had an enemy piece (or capture occurred), trigger `playCaptureSound()` alongside `playCardSound()`.
  </action>
  <verify>npm run typecheck:all && npm test</verify>
  <done>DeckBuilderPage.tsx implements the 3-column Variant D Refined layout (Left 356px TCG Ruffle Hand + Center 512x512 Board + Right 280px Moves/Chat Panel) and useDeckChessGame.ts triggers complete victory/defeat/capture audio.</done>
</task>

## Success Criteria
- [ ] `DeckBuilderPage.tsx` has no secondary sub-header, no left route icon rail, and no bottom card strip under the board.
- [ ] Left Hand Stage (`356px` on desktop) displays only the `⚡ ENERGY` bar and the 2×4 Portrait TCG Ruffle Hand (`data-card-id`) with hover pop-out and mini-board visual explainer.
- [ ] Center Chessboard renders at `512×512px` on desktop viewports.
- [ ] Right Panel includes functional `Moves` and `Chat` tabs plus `Resign`, `New Game`, and `My Deck` actions.
- [ ] `npm run typecheck:all` and `npm test` (203 card tests) pass 100%.
