---
phase: 4
plan: 1
wave: 1
depends_on: []
files_modified:
  - package.json
  - src/types/deckChess.ts
  - src/engine/cardGraph.ts
  - src/engine/DeckChessEngine.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - chess.js is installed in package.json and provides standard 8x8 chess legal moves, FEN import/export, and check/checkmate detection
    - The Compositional Card Graph data schema models PieceAnchors, ConditionPrimitives, EffectPrimitives, and GambitTradeoffs with piece color themes
    - DeckChessEngine manages the 3-energy economy, PRE_MOVE_WINDOW (at most 1 card per turn), and enforces engine invariants (Graveyard Conservation, No-Direct-Mate)
    - All 8 starter cards can be evaluated and executed against standard chess positions with verified state mutations
  artifacts:
    - src/types/deckChess.ts
    - src/engine/cardGraph.ts
    - src/engine/DeckChessEngine.ts
---

# Plan 4.1: Core Chess Engine & Compositional Card Graph

<objective>
Establish the foundational game engine for 2D Deck Builder Chess. Install `chess.js`, define the strongly-typed Compositional Card Graph architecture, implement the 8-card starter pool with piece-class color identities, and build `DeckChessEngine` to coordinate 8x8 chess moves, 3-energy per turn economy, and tactical board mutations.

Purpose: Form the rock-solid, decoupled engine that powers both solo AI play and online multiplayer without rule glitches.
Output: Core TypeScript types (`deckChess.ts`), card graph definitions (`cardGraph.ts`), and `DeckChessEngine.ts`.
</objective>

<context>
Load for context:
- .agent/state/SPEC.md
- .agent/state/DECISIONS.md (DECISION-004, DECISION-007)
- .agent/state/phases/4/RESEARCH.md
- package.json
</context>

<tasks>

<task type="auto">
  <name>Install chess.js and define Compositional Card Graph types</name>
  <files>package.json, src/types/deckChess.ts</files>
  <action>
    1. Install `chess.js` (`npm install chess.js`).
    2. Create `src/types/deckChess.ts` containing:
       - `PieceAnchor`: `'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king'`.
       - `PieceColor`: `'w' | 'b'`.
       - `Square`: e.g. `'a1' | 'a2' ... | 'h8'`.
       - `ConditionPrimitive`: Spatial (`IN_CORNER`, `IN_CENTER`, `ON_RIM`, `IN_TERRITORY`, `ON_SPECIFIC_RANK`), Relational (`OPPOSING_FACEOFF`, `FRIENDLY_ADJACENCY`, `BATTERY_ALIGNMENT`, `LINE_OF_SIGHT_ALIGNMENT`), Tactical (`ACTIVE_FORK`, `UNDER_FIRE`, `OPEN_LINE`, `BLOCKADED`), Status (`UNMOVED`, `PINNED`, `GRAVEYARD_COUNT`).
       - `EffectPrimitive`: Movement (`EXTEND_RANGE`, `VECTOR_GRAFT`, `PHASE_THROUGH`, `CARRY_PASSENGER`, `TANDEM_SHIFT`, `COORDINATE_SWAP`, `DRAG_OR_PUSH`), Transformation (`PIERCE_CAPTURE`, `HIT_AND_RUN`), Spawning/Board (`SPAWN_FROM_GRAVEYARD`, `RECRUIT_DEFECTOR`, `SCUTTLE`, `DEPLOY_OBSTACLE`).
       - `GambitTradeoff`: `RECOIL`, `EXHAUST`, `GRAVEYARD_BURN`, `TEMPO_CONCESSION`.
       - `BoardModifier`: `{ id: string; type: 'barrier' | 'shield'; square: string; ownerColor: PieceColor; turnsRemaining: number }`.
       - `CardDefinition`: `{ id: string; name: string; anchor: PieceAnchor; energyCost: number; conditions: CardCondition[]; effects: CardEffect[]; tradeoff?: GambitTradeoff; description: string; visualTheme: { color: string; hex: string; badgeIcon: string } }`.
       - `Graveyard`: Record of captured pieces per player color (`{ p: number; n: number; b: number; r: number; q: number }`).
       - `DeckChessTurnPayload`: Serializable payload containing card played (if any), chess move (`from`, `to`, `promotion`), resultant FEN, and active modifiers for network transport.
    AVOID: Including deprecated temporal/silence primitives (`CARD_SILENCE`, `PACIFY_PIECE`) as they violate clean chess intuition.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>package.json has chess.js installed and src/types/deckChess.ts exports all card graph, modifier, and state interfaces cleanly without TS errors.</done>
</task>

<task type="auto">
  <name>Author card catalog with 8 starter cards and visual color identities</name>
  <files>src/engine/cardGraph.ts</files>
  <action>
    Create `src/engine/cardGraph.ts` exporting:
    1. `PIECE_COLOR_THEMES`: Mapping piece anchors to their agreed color motifs:
       - Pawn: Amber (`#d29922`)
       - Knight: Emerald (`#3fb950`)
       - Bishop: Violet (`#bc8cff`)
       - Rook: Cobalt (`#58a6ff`)
       - Queen: Rose (`#f778ba`)
       - King: Solar Gold (`#e3b341`)
    2. `STARTER_DECK`: The 8 curated starter cards:
       - `pawn_vanguard`: Vanguard Advance (Pawn, 1 Energy, Amber) -> `UNMOVED` -> `EXTEND_RANGE(1)`
       - `pawn_scuttle`: Abandon Ship (Pawn, 1 Energy, Amber) -> `UNDER_FIRE` or `BLOCKADED` -> `SCUTTLE`
       - `knight_escort`: Cavalry Escort (Knight, 2 Energy, Emerald) -> `FRIENDLY_ADJACENCY` -> `CARRY_PASSENGER`
       - `knight_swap`: Dislocation Swap (Knight, 2 Energy, Emerald) -> `IN_TERRITORY(ENEMY_HALF)` -> `COORDINATE_SWAP`
       - `bishop_pierce`: Prism Ray (Bishop, 3 Energy, Violet) -> `LINE_OF_SIGHT_ALIGNMENT` -> `PIERCE_CAPTURE(maxTargets: 2)`
       - `bishop_invert`: Color Inversion (Bishop, 2 Energy, Violet) -> Active Bishop -> `VECTOR_GRAFT(orthogonal)`
       - `rook_rampart`: Rampart Deploy (Rook, 2 Energy, Cobalt) -> `OPEN_LINE` -> `DEPLOY_OBSTACLE(duration: 2)`
       - `king_decree`: Royal Decree (King, 2 Energy, Gold) -> `FRIENDLY_ADJACENCY` -> `TANDEM_SHIFT`
    3. `EXPANDED_LIBRARY`: Additional extensible cards for future deck customization (e.g. Queen's Command, Kinetic Shield).
    4. Helper functions to validate card costs (1-3) and look up cards by ID.
    AVOID: Hardcoding effect execution inside card definitions; keep definitions pure declarative data objects.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>src/engine/cardGraph.ts exports PIECE_COLOR_THEMES, STARTER_DECK, and EXPANDED_LIBRARY conforming strictly to CardDefinition[].</done>
</task>

<task type="auto">
  <name>Implement DeckChessEngine with rule validation, energy economy, and effect resolver</name>
  <files>src/engine/DeckChessEngine.ts</files>
  <action>
    Create `src/engine/DeckChessEngine.ts` encapsulating an instance of `Chess` from `chess.js`:
    1. Board & Turn State:
       - Holds current FEN, active turn (`'w' | 'b'`), turn number, energy (`3` max per turn, resets on turn change), graveyard (`white` and `black`), and active `BoardModifier[]`.
       - Tracks `cardPlayedThisTurn: boolean` to enforce the `PRE_MOVE_WINDOW` (at most 1 card play per turn before normal move).
       - Tracks player hands (8 cards per player, single-use per match).
    2. Condition Evaluator:
       - Evaluates whether a card can be activated given current board state and selected anchor piece (`evaluateConditions(card, anchorSquare): boolean`).
    3. Effect Mutator & Invariants:
       - `activateCard(cardId, anchorSquare, targetSquare?, extraSquare?)`:
         * Verifies energy cost <= available energy, card in hand, and conditions met.
         * Enforces Graveyard Conservation Law (cannot spawn/convert without available graveyard piece).
         * Enforces No-Direct-Mate Law (simulates mutation; rejects if opponent king would be in unavoidable mate during card phase or if king captured).
         * Mutates `chess` instance or attaches modifiers (e.g. `DEPLOY_OBSTACLE` places barrier, `SCUTTLE` removes piece to graveyard, `COORDINATE_SWAP` swaps squares via `chess.remove` + `chess.put`, `VECTOR_GRAFT` moves piece).
         * Deducts energy and marks `cardPlayedThisTurn = true`.
    4. Chess Move Validation:
       - `getLegalMoves(square?)`: Calls `chess.moves({ verbose: true })`, filtering out destinations blocked by active barrier modifiers.
       - `makeMove(move: { from: string; to: string; promotion?: string })`: Executes chess move, checks for shield preservation/consumption, decrements modifier `turnsRemaining`, resets energy to 3 for next player, and switches turn.
    5. Game End Detection:
       - Reports `isGameOver()`, `isCheckmate()`, `isDraw()`, `isStalemate()`, and `inCheck()`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>DeckChessEngine initializes standard chess boards, validates conditions for starter cards, executes card mutations and legal chess moves, and cleanly detects game state.</done>
</task>

</tasks>

## Success Criteria
- [ ] `chess.js` is installed and functional in Vite/TS build.
- [ ] Compositional Card Graph types (`PieceAnchor`, `ConditionPrimitive`, `EffectPrimitive`, `CardDefinition`) compile cleanly with zero errors.
- [ ] 8-card starter deck is defined with dedicated piece-class color aesthetics (`#d29922`, `#3fb950`, `#bc8cff`, `#58a6ff`, `#f778ba`, `#e3b341`).
- [ ] `DeckChessEngine` enforces 3 Energy per turn, at most 1 card per `PRE_MOVE_WINDOW`, Graveyard Conservation, and No-Direct-Mate laws.
- [ ] Production build typecheck passes (`npx tsc --noEmit`).
