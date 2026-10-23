---
phase: 4
plan: 3
wave: 2
depends_on: ["01", "02"]
files_modified:
  - src/hooks/useDeckChessGame.ts
  - src/components/DeckChessBoard.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Clicking a piece on the board only shows standard chess moves; clicking a legal square executes a normal move immediately without forcing a card play"
    - "Applicable cards in the hand highlight when a piece is clicked; tapping a highlighted card arms it and reveals its empowered moves on the board"
    - "Tapping an armed card a second time disarms it and reverts the board to standard chess moves"
    - "Clicking an unrelated piece on the board automatically disarms the active card and selects the new piece"
    - "Multi-step card staging (R1 Make Way) allows selecting the pawn's step-aside tile first, then the Rook's file destination, before showing the outcome preview"
    - "Clicking away or clicking another piece during multi-step staging cleanly cancels staging without committing"
  artifacts:
    - "src/hooks/useDeckChessGame.ts implements the decoupled Card-Armed state machine and multi-step staging"
    - "src/components/DeckChessBoard.tsx renders standard moves cleanly when disarmed and directional markers when staging"
---

# Plan 4.3: Unified Turn Flow, Standard Move Decoupling & Multi-Step Card Staging

<objective>
Implement the Option A turn flow and multi-step card staging:
1. Decouple standard piece moves from card moves so players can always make standard chess moves without being forced to play a card.
2. Allow cards to be armed by tapping them in hand, and disarmed by tapping again.
3. Automatically disarm cards when clicking an unrelated piece.
4. Support multi-step card staging for R1 "Make Way" (select pawn step-aside tile -> select Rook destination -> outcome preview).

Purpose: Deliver frictionless, intuitive chess controls where standard play is effortless and tactical cards are an intentional, staged choice.
Output: Updated `src/hooks/useDeckChessGame.ts` and `src/components/DeckChessBoard.tsx`.
</objective>

<context>
Load for context:
- .agent/state/phases/4/RESEARCH.md
- src/hooks/useDeckChessGame.ts (handleSquareClick, selectCardFromHand, cancelPendingCardMove, activeCardIdsForPiece)
- src/components/DeckChessBoard.tsx (legalMoves, empoweredMoves, disambiguationCandidates, pendingCardMove)
- src/components/TacticalHandBar.tsx (onSelectCard, onHoverCard, activeCardIdsForPiece)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement Card-Armed State Machine & Multi-Step Staging in useDeckChessGame.ts</name>
  <files>src/hooks/useDeckChessGame.ts</files>
  <action>
    1. In `src/hooks/useDeckChessGame.ts`:
       - State machine refactor:
         - When a piece is clicked (`!selectedSquare`):
           - Set `selectedSquare = square`.
           - Set `legalMovesForSelected = engineRef.current.getLegalMoves(square).map(m => m.to)`.
           - Leave `selectedCardId = null` (unless a card was already armed).
           - Set `empoweredMovesForSelected = []` if `selectedCardId === null`.
         - In `handleSquareClick`:
           - If `selectedCardId === null`:
             - If `legalMovesForSelected.includes(square)`: execute `makeMove(selectedSquare, square)` immediately! Standard chess moves are never intercepted.
             - If another friendly piece is clicked: switch selection to that piece, compute its legal moves, and leave card disarmed.
           - If `selectedCardId !== null` (Card is armed!):
             - If clicking another friendly piece that cannot use this card: automatically disarm card (`selectedCardId = null`) and select that piece for standard moves.
             - If in multi-step staging (e.g. `disambiguationCandidates` has candidate `extraSquare` choices for R1):
               - If clicked square matches one of the `extraSquare` options: filter `empoweredMovesForSelected` to only moves matching that chosen `extraSquare`. If remaining candidate moves all have the same Rook destination, transition to `pendingCardMove`. If multiple Rook destinations exist, highlight those Rook destination squares.
             - If clicking an empowered destination square: transition to `pendingCardMove` with `previewFen`.
       - Card Arm / Disarm Toggle:
         - In `selectCardFromHand(cardId: string)`:
           - If `selectedCardId === cardId`: call `cancelPendingCardMove()` to disarm the card and revert to standard moves!
           - If a new card is selected: set `selectedCardId = cardId`, compute empowered moves for this card, and if an anchor piece was already selected, update `empoweredMovesForSelected`.
           - If the card has multi-step staging (e.g. R1 with multiple perpendicular squares), populate `disambiguationCandidates` with step-aside options.
       - Clean Cancellation:
         - Clicking outside or clicking another piece resets pending card staging.
    AVOID: Evaluating `matchingEmpowered` before `legalMovesForSelected` when `selectedCardId === null`.
    AVOID: Trapping the user in a card staging state if they change their mind and click another piece.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>`useDeckChessGame.ts` allows standard moves without cards, supports card arm/disarm toggle, and stages multi-step card moves.</done>
</task>

<task type="auto">
  <name>Task 2: Upgrade DeckChessBoard.tsx for Disarmed Standard Moves & Step-Aside Directional Indicators</name>
  <files>src/components/DeckChessBoard.tsx</files>
  <action>
    1. In `src/components/DeckChessBoard.tsx`:
       - Standard Move Rendering:
         - When `selectedCardId` is null and `hoveredCardId` is null, render standard legal move dots and capture rings for all squares in `legalMoves`. Never suppress standard move dots when card is disarmed.
       - Armed Card Move Rendering:
         - Only render empowered move rings / glowing markers when `selectedCardId !== null` or `hoveredCardId !== null`.
       - Multi-Step Staging Indicators:
         - When `disambiguationCandidates` are active (e.g. R1 pawn step-aside options):
           - Highlight candidate `extraSquare` tiles with a distinct pulsing directional border (`#3FB950` green / `#D4AF37` gold).
           - Display the disambiguation prompt banner (`"Select square for pawn to step aside"`).
       - Live Board Preview & Confirmation:
         - When `pendingCardMove` is active, render board from `pendingCardMove.previewFen`, highlighting `from`, `to`, and `extraSquare`.
         - Render the Bottom Confirmation Bar with Big Green Check (`✓`) and Big Red X (`✕`).
    AVOID: Hiding standard move indicators when `selectedCardId === null`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>`DeckChessBoard.tsx` renders standard moves cleanly when disarmed, displays step-aside indicators during staging, and previews outcome with confirmation bar.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run typecheck:all` exits with code 0
- [ ] `npm test` passes
- [ ] Standard moves execute immediately on click when piece is selected
- [ ] Empowered moves only execute when card is deliberately armed
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
