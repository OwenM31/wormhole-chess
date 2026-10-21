---
phase: 3
plan: 4
wave: 3
depends_on: ["02", "03"]
files_modified:
  - src/hooks/useDeckChessGame.ts
  - src/components/TacticalHandBar.tsx
  - src/components/DeckChessBoard.tsx
  - src/pages/DeckBuilderPage.tsx
  - src/pages/PlayRoomPage.tsx
  - scripts/verify-phase3-playtest.mjs
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Standard chess moves execute immediately on click without a confirmation prompt"
    - "100% of card moves display a live Board Outcome Preview (previewFen) once all parameters are selected and show the Big Green Check (✓) and Big Red X (✕) confirmation bar at the bottom of the board"
    - "Bidirectional selection works: clicking a piece on the board shows its standard moves AND pops out playable cards for that piece in the hand (dimming non-matching cards); clicking a card in the hand emphasizes eligible friendly piece(s) on the board"
    - "Hovering a playable card in the hand previews its eligible pieces/targets on the main chessboard"
    - "When a card move has multiple candidate allies/paths (extraSquare), the board prompts the player to click their chosen disambiguation square before transitioning to the ✓ / ✕ confirmation preview"
    - "Card-Aware AI opponent can evaluate and play cards from the 36-Card Playbook during Offline Matches"
  artifacts:
    - "src/components/DeckChessBoard.tsx renders the live outcome preview and bottom Green Check (✓) / Red X (✕) confirmation bar"
    - "src/components/TacticalHandBar.tsx renders Pokémon piece-colored frames, pops out matching cards when a piece is selected, and triggers hover board previews"
    - "scripts/verify-phase3-playtest.mjs passes headless Playwright E2E verification across Main Menu, Multiplayer Stage, and Arena Card Confirmation"
---

# Plan 3.4: Bidirectional Board Selection, Hover Preview, Disambiguation & Outcome Confirmation (`✓` / `✕`) + Full Integration

<objective>
Wire the complete bidirectional card/piece interaction flow (`Piece-First` & `Card-First`), Card Hover Board Preview, multi-path disambiguation (`extraSquare`), and mandatory **Board Outcome Preview + Bottom Confirmation Bar (`Big Green Check ✓` / `Big Red X ✕`)** into `useDeckChessGame.ts`, `TacticalHandBar.tsx`, `DeckChessBoard.tsx`, `DeckBuilderPage.tsx`, and `PlayRoomPage.tsx`, and empirically verify with Playwright (`scripts/verify-phase3-playtest.mjs`).

Purpose: Completes the Phase 3 Multiplayer & AI Playtest Prototype so the user can smoothly playtest all 36 cards with mistake-proof outcome previews and AI opponents.
Output: Updated `useDeckChessGame.ts`, `TacticalHandBar.tsx`, `DeckChessBoard.tsx`, `DeckBuilderPage.tsx`, `PlayRoomPage.tsx`, and `scripts/verify-phase3-playtest.mjs`.
</objective>

<context>
Load for context:
- .agent/state/DECISIONS.md ([DECISION-027])
- .agent/state/phases/3/RESEARCH.md
- src/hooks/useDeckChessGame.ts
- src/components/TacticalHandBar.tsx
- src/components/DeckChessBoard.tsx
- src/pages/DeckBuilderPage.tsx
- src/pages/PlayRoomPage.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Upgrade useDeckChessGame & TacticalHandBar for Bidirectional Selection, Hover Preview & Pending Card Confirmation</name>
  <files>src/hooks/useDeckChessGame.ts, src/components/TacticalHandBar.tsx</files>
  <action>
    1. In `src/hooks/useDeckChessGame.ts`:
       - Replace Energy-gated logic with the new 36-Card Playbook rules.
       - Add state for the bidirectional & confirmation state machine defined in `RESEARCH.md`:
         - `selectedSquare: string | null` (when a piece is clicked first)
         - `selectedCardId: string | null` (when a card in hand is clicked first)
         - `hoveredCardId: string | null` (when hovering a card in hand to preview on the board)
         - `disambiguationCandidates: EmpoweredMove[] | null` (when >1 `EmpoweredMove` shares the same `(from, to)` and requires clicking `extraSquare`)
         - `pendingCardMove: EmpoweredMove | null` (holds the chosen `EmpoweredMove` with `previewFen` while waiting for the player to click the **Big Green Check `✓`** or **Big Red X `✕`**)
       - Implement handlers:
         - `selectCardFromHand(cardId: string)`:
           - Finds all `EmpoweredMove`s for `cardId`.
           - If there is only 1 unique move (e.g. `Q3 All Rise` or `K1 Conscription` when only 1 outcome exists), transitions directly to `pendingCardMove = moves[0]`!
           - Otherwise sets `selectedCardId = cardId` (and if only 1 friendly piece on the board can play `cardId`, auto-selects `selectedSquare = thatPieceSquare` so its target squares immediately light up!).
         - `confirmPendingCardMove()`: Executes `engine.makeEmpoweredMove(pendingCardMove)`, logs the move, clears `pendingCardMove`, and triggers AI / opponent turn.
         - `cancelPendingCardMove()`: Clears `pendingCardMove`, `disambiguationCandidates`, `selectedCardId`, and `selectedSquare`.
       - Ensure the AI opponent (`mode === 'ai'`) evaluates both standard moves and `engine.getEmpoweredMoves()` (using simulated material + positional evaluation on `previewFen`) so the AI actively plays cards from its hand!
    2. In `src/components/TacticalHandBar.tsx`:
       - Style every card with its **Pokémon-style Piece-Colored Frame** (`Pawn: #8A9199 Gray`, `Knight: #3FB950 Green`, `Bishop: #3B82F6 Blue`, `Rook: #A855F7 Purple`, `Queen: #EF4444 Red`, `King: #D4AF37 Gold`), clean placeholder art window (with piece emblem + mini-board schematic on hover), and zero Energy pips.
       - When a piece is selected on the board (`selectedSquare`), **emphasize (pop out / elevate with bright border) all playable cards for that piece** while dimming non-applicable cards (`opacity: 0.42`).
       - Wire `onMouseEnter={() => onHoverCard(card.id)}`, `onMouseLeave={() => onHoverCard(null)}`, and `onClick={() => onSelectCard(card.id)}`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>`useDeckChessGame.ts` and `TacticalHandBar.tsx` support bidirectional selection, card hover previews, disambiguation, and `pendingCardMove` confirmation.</done>
</task>

<task type="auto">
  <name>Task 2: Upgrade DeckChessBoard with Disambiguation Prompts, Live Outcome Preview (previewFen) & Bottom Confirmation Bar (✓ / ✕)</name>
  <files>src/components/DeckChessBoard.tsx</files>
  <action>
    Update `src/components/DeckChessBoard.tsx`:
    1. **Standard Chess Moves**:
       - Clicking a standard move dot/capture ring executes `onMakeStandardMove` immediately (instant, no confirmation bar).
    2. **Card Hover Preview & Card-First Eligible Piece Emphasis**:
       - When `hoveredCardId` or `selectedCardId` is active, highlight the eligible friendly anchor piece(s) and their candidate target squares on the board using the card's piece-class color.
    3. **Disambiguation Step (`disambiguationCandidates`)**:
       - When a clicked card target has multiple `extraSquare` candidates (e.g. 2 defending Pawns for `P4 Attack Together` or 2 adjacent allies for `K3 Royal Execution`), display a clear prompt banner at the top/bottom of the board (`"Select which ally participates"`) and highlight the candidate `extraSquare` tiles with pulsing rings. Clicking an `extraSquare` tile sets `pendingCardMove`.
    4. **Live Board Outcome Preview & Bottom Confirmation Bar (`Big Green Check ✓` / `Big Red X ✕`)**:
       - When `pendingCardMove` is non-null, render the board pieces using `pendingCardMove.previewFen` so the player sees the exact resulting board position (moved pieces, pushed stacks, spawned Pawns, promotions)!
       - Highlight `pendingCardMove.from`, `pendingCardMove.to`, and `pendingCardMove.extraSquare` so the change is unmistakable.
       - Render the **Confirmation Bar directly at the bottom of the board** (`data-testid="card-confirm-bar"`) featuring:
         - Card title badge (`e.g. P1 · Sidestep — Confirm Card Move?`)
         - **Big Green Check Button (`✓ Confirm`, `data-testid="confirm-card-move-btn"`, `#3FB950` / `#4C5C4C` green)**
         - **Big Red X Button (`✕ Cancel`, `data-testid="cancel-card-move-btn"`, `#AA4A44` / `#EF4444` red)**
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>`DeckChessBoard.tsx` renders the live `previewFen` board state and the bottom `✓` / `✕` confirmation bar for all card moves.</done>
</task>

<task type="auto">
  <name>Task 3: Wire Main Menu Hub, Multiplayer Stage & Arena in DeckBuilderPage.tsx & PlayRoomPage.tsx + Playwright Verification</name>
  <files>src/pages/DeckBuilderPage.tsx, src/pages/PlayRoomPage.tsx, scripts/verify-phase3-playtest.mjs</files>
  <action>
    1. In `src/pages/DeckBuilderPage.tsx`:
       - Manage top-level screen state: `'menu'` (default — renders `<DeckBuilderMainMenu />`), `'multiplayer'` (renders `<MultiplayerCharacterStage />`), and `'arena'` (renders the 3-Column TCG Hand + 512×512 Board + Moves/Chat Arena).
       - Add a clean `← Multiplayer` / `← Main Menu` navigation button in the Arena header so the player can return to the Multiplayer Stage or Main Menu Hub anytime.
       - Connect `usePlayerProfiles()` so the active profile's `equippedHand` and `handSize` feed directly into `useDeckChessGame()`.
    2. In `src/pages/PlayRoomPage.tsx`:
       - Ensure Private Match rooms (`/play/:code`) use the updated `DeckChessBoard` and `TacticalHandBar` props (including `pendingCardMove`, `confirmPendingCardMove`, `cancelPendingCardMove`, and the 36-Card Playbook).
    3. Create and run `scripts/verify-phase3-playtest.mjs` using headless Chromium Playwright:
       - Verify `/deck-builder` opens on the **Fluid 11-Column Main Menu Hub** (`Campaign`, `Multiplayer`, `My Profile`, `Switch Profile`, and Right Companion Card with `Character Canvas` & `Gear & Cosmetics`), asserting zero hardcoded pixel column widths and zero horizontal overflow.
       - Click `Switch Profile` and verify the multi-profile modal opens.
       - Click `Multiplayer` and verify the **Full-Screen Multiplayer Character Stage** opens with `Offline Match`, `Search for Opponent`, `Private Match`, the 8-Card Hand, Pokémon piece-colored cards, and the 5-Dot Copy Stack (`[data-testid="copy-dot-stack"]`).
       - Start an `Offline Match` vs AI, test both **Piece-First** (clicking a piece pops out its playable cards in hand) and **Card-First** selection, trigger a card move (e.g. after setting up or selecting an eligible card), verify the **Bottom Confirmation Bar (`[data-testid="card-confirm-bar"]`)** with the Big Green Check (`✓`) and Red X (`✕`) appears, click `✓` to execute, and capture verification screenshots in `.agent/state/artifacts/screenshots/`.
  </action>
  <verify>npm run typecheck:all && npm run build && node scripts/verify-phase3-playtest.mjs</verify>
  <done>Full-stack typecheck, production build, and Playwright E2E verification (`scripts/verify-phase3-playtest.mjs`) pass with 0 errors.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm test` passes 100% green
- [ ] `npm run typecheck:all` exits with code 0
- [ ] `npm run build` succeeds
- [ ] `node scripts/verify-phase3-playtest.mjs` passes all assertions and captures visual proof screenshots
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
