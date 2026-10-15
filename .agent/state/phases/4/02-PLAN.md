---
phase: 4
plan: 2
wave: 2
depends_on:
  - "01"
files_modified:
  - src/engine/DeckChessAI.ts
  - src/hooks/useDeckChessGame.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - DeckChessAI evaluates board states using Material + Simplified Piece-Square Tables (PST) + tactical card utility heuristics
    - AI decision loop searches at depth 2-3 with alpha-beta pruning, executing decisions in under 100ms in the browser
    - AI can make a standard chess move and optionally activate an affordable tactical card from its 8-card hand
    - useDeckChessGame hook provides unified state management for turn flow, card targeting, energy consumption, and AI turn triggers
  artifacts:
    - src/engine/DeckChessAI.ts
    - src/hooks/useDeckChessGame.ts
---

# Plan 4.2: Heuristic AI Bot & Solo Play Coordinator

<objective>
Develop a responsive, client-side heuristic Minimax AI bot for solo testing (`DeckChessAI.ts`) and create a unified game coordination hook (`useDeckChessGame.ts`) that orchestrates the turn loop (Card Window -> Chess Move), card targeting flow, and AI execution.

Purpose: Deliver full-flow solo testing against a tactical AI bot without network latency (REQ-10), while providing the unified state engine for online multiplayer.
Output: Heuristic bot engine (`DeckChessAI.ts`) and game coordinator hook (`useDeckChessGame.ts`).
</objective>

<context>
Load for context:
- .agent/state/SPEC.md
- .agent/state/phases/4/RESEARCH.md
- .agent/state/phases/4/01-PLAN.md
- src/types/deckChess.ts
- src/engine/cardGraph.ts
- src/engine/DeckChessEngine.ts
</context>

<tasks>

<task type="auto">
  <name>Implement DeckChessAI with PST evaluation, card utility, and alpha-beta minimax</name>
  <files>src/engine/DeckChessAI.ts</files>
  <action>
    Create `src/engine/DeckChessAI.ts`:
    1. Static Board Evaluation:
       - Base material weights: Pawn (100), Knight (320), Bishop (330), Rook (500), Queen (900), King (20000).
       - Simplified Piece-Square Tables (PSTs) from Tomasz Michniewski for all 6 piece types, incentivizing center control, development, and king flank safety.
       - Position score calculation: `evaluateBoard(engine, aiColor): number` summing material and PST for AI minus opponent.
    2. Tactical Card Play Evaluation:
       - AI checks available cards in hand and current energy (3).
       - Evaluates candidate card plays (e.g. `pawn_vanguard` if pawn can advance, `knight_swap` if knight is deep in enemy territory, `rook_rampart` if open line threatens royal attack).
       - Scores the positional gain after card activation.
    3. Minimax Search with Alpha-Beta Pruning:
       - Search depth: Configurable (default depth 2 for instant response, depth 3 for tactical mode).
       - `minimax(engine, depth, alpha, beta, isMaximizing, aiColor)`: Explores legal chess moves, prunes branches, and returns the highest-scoring move.
    4. Top-level Decision Function:
       - `computeBestTurn(engine, aiColor, difficulty = 'medium')`: Returns `{ cardToPlay?: { cardId: string; anchorSquare: string; targetSquare?: string }; move: { from: string; to: string; promotion?: string } }`.
       - Operates synchronously in <50ms without UI thread freeze.
    AVOID: Deep searches (>3 ply) or unbounded recursion that can block browser rendering.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>DeckChessAI exports computeBestTurn and successfully calculates legal chess moves and tactical card plays given a DeckChessEngine instance.</done>
</task>

<task type="auto">
  <name>Build useDeckChessGame hook coordinating player interaction, card targeting, and AI triggers</name>
  <files>src/hooks/useDeckChessGame.ts</files>
  <action>
    Create `src/hooks/useDeckChessGame.ts`:
    1. State Management:
       - Initializes and retains a `DeckChessEngine` instance.
       - Exposes reactive state: `fen`, `turn`, `turnNumber`, `energy`, `whiteHand`, `blackHand`, `graveyard`, `activeModifiers`, `isGameOver`, `winner`, `finishReason`, `inCheck`.
       - Mode support: `mode: 'ai' | 'multiplayer'`, `playerColor: 'w' | 'b'`, `aiDifficulty: 'easy' | 'medium'`.
    2. Card Targeting & Activation Flow:
       - `selectedCard`: Tracks currently chosen card from hand.
       - `targetingStage`: `'none' | 'pick_anchor' | 'pick_target' | 'pick_secondary'`.
       - `validTargetSquares`: Computes squares that satisfy card conditions or effect targets (e.g. for `COORDINATE_SWAP` or `DEPLOY_OBSTACLE`).
       - `activateSelectedCard(anchor, target?, extra?)`: Calls `engine.activateCard`, deducts energy, updates state, and resets targeting stage.
       - `cancelCardSelection()`: Deselects active card without penalty.
    3. Chess Move Execution:
       - `selectedSquare`: Tracks clicked piece.
       - `legalMovesForSelected`: Valid destination squares from `engine.getLegalMoves(selectedSquare)`.
       - `makeMove(from, to, promotion?)`: Executes move on engine, advances turn, and if playing against AI, triggers the AI turn after a short realistic delay (300ms).
    4. AI Turn Pipeline:
       - When `mode === 'ai'` and `turn !== playerColor`, dispatches `computeBestTurn` via `setTimeout(..., 350)`.
       - Applies AI card action (if selected by bot) followed by the AI chess move, updating reactive state.
    5. Network Sync Adapter:
       - Provides `applyRemoteTurn(payload: DeckChessTurnPayload)` to seamlessly apply incoming opponent turns from WebSockets when in multiplayer mode.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>useDeckChessGame hook cleanly manages turn progression, card targeting states, legal moves, and AI triggers with zero TypeScript errors.</done>
</task>

</tasks>

## Success Criteria
- [ ] `DeckChessAI.ts` implements PST tables and alpha-beta minimax search evaluating positions in <100ms.
- [ ] AI bot chooses legal chess moves and evaluates tactical card opportunities from its 8-card hand.
- [ ] `useDeckChessGame.ts` hook provides full game loop lifecycle (card selection, target validation, move execution, AI auto-play).
- [ ] Remote turn application function is ready to plug into `GameRoomDO` multiplayer rooms.
- [ ] Production build typecheck passes (`npx tsc --noEmit`).
