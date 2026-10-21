---
phase: 3
plan: 1
wave: 1
depends_on: []
files_modified:
  - src/types/deckChess.ts
  - src/engine/cards/releaseRoster36.ts
  - src/engine/cardGraph.ts
  - src/engine/DeckChessEngine.ts
autonomous: true
user_setup: []

must_haves:
  truths:
    - "All 36 cards (P1–P8, N1–N7, B1–B7, R1–R6, Q1–Q4, K1–K4) are defined in releaseRoster36.ts with exact STORYBOARD.md titles, conditions, effects, and Pokémon piece-class color themes (Gray, Green, Blue, Purple, Red, Gold)"
    - "DeckChessEngine operates without active Energy gates (1 card per turn + board condition satisfied)"
    - "Rank 1 Pawns (a1–h1 for White, a8–h8 for Black) load cleanly via { skipValidation: true } and can step 1 square forward"
    - "Any Pawn reaching its promotion rank (Rank 8 for White, Rank 1 for Black) via any primary or secondary card effect immediately promotes to a Queen"
    - "getEmpoweredMoves attaches simulated previewFen and extraSquare disambiguation support to every EmpoweredMove"
  artifacts:
    - "src/engine/cards/releaseRoster36.ts exists and exports CANONICAL_36_CARDS"
    - "src/engine/DeckChessEngine.ts supports Rank 1 Pawns, global promotion sweep, limitPawnsTo8 flag, and previewFen simulation"
---

# Plan 3.1: Canonical 36-Card Playbook Roster, Piece-Color Themes & Global Engine Refactoring

<objective>
Establish the canonical 36-Card Playbook (`P1–P8, N1–N7, B1–B7, R1–R6, Q1–Q4, K1–K4`) with Pokémon-style piece-class visual themes and refactor `DeckChessEngine.ts` to enforce all Phase 3 global engine invariants (zero Energy gates, Rank 1 Pawn legalization, global Rank 8 promotion sweep, `extraSquare` disambiguation, and `previewFen` outcome simulation).

Purpose: Both the 36 bespoke card handlers (Plan 3.2) and the Main Menu / Multiplayer Playtest UI (Plans 3.3 & 3.4) depend on these foundational types, card definitions, and engine capabilities.
Output: `src/types/deckChess.ts`, `src/engine/cards/releaseRoster36.ts`, `src/engine/cardGraph.ts`, and refactored `src/engine/DeckChessEngine.ts`.
</objective>

<context>
Load for context:
- .agent/state/STORYBOARD.md
- .agent/state/DECISIONS.md
- .agent/state/phases/3/RESEARCH.md
- src/types/deckChess.ts
- src/engine/cardGraph.ts
- src/engine/DeckChessEngine.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Define the 36-Card Playbook Roster and Pokémon Piece-Color Themes</name>
  <files>src/types/deckChess.ts, src/engine/cards/releaseRoster36.ts, src/engine/cardGraph.ts</files>
  <action>
    1. In `src/types/deckChess.ts`:
       - Add `code?: string` (e.g. `'P1'`, `'N1'`, ..., `'K4'`), `world?: number`, `conditionText?: string`, and `effectText?: string` to `CardDefinition`.
       - Extend `EmpoweredMove` with `extraSquare?: string`, `previewFen?: string`, and `disambiguationPrompt?: string`.
       - Add `PlayerProfile` and `ProfileGear` interfaces for the multi-profile system (`id`, `name`, `level`, `gold`, `unlockedCards`, `copyLimits`, `playtestAll36`, `handSize`, `equippedHand`, `gear`).
    2. Create `src/engine/cards/releaseRoster36.ts` exporting `CANONICAL_36_CARDS: CardDefinition[]` and `PIECE_COLOR_THEMES` with the exact Pokémon-style piece-class colors from `[DECISION-027]`:
       - `pawn`: Gray (`#8A9199`, badge `♟`)
       - `knight`: Green (`#3FB950`, badge `♞`)
       - `bishop`: Blue (`#3B82F6`, badge `♝`)
       - `rook`: Purple (`#A855F7`, badge `♜`)
       - `queen`: Red (`#EF4444`, badge `♛`)
       - `king`: Gold (`#D4AF37`, badge `♚`)
       Define all 36 cards (`p1_sidestep` through `k4_banish`) matching Section 6 of `.agent/state/STORYBOARD.md` with `energyCost: 0` and concise zero-ellipsis descriptions.
    3. Update `src/engine/cardGraph.ts` so `getCardById()` resolves all 36 Playbook cards first (while retaining legacy lookup fallback so existing tests do not break), and update `STARTER_DECK` to use the first 8 Playbook cards (`p1_sidestep`, `p2_head_on`, `p3_follow_me`, `n1_adrenaline_jump`, `b1_let_me_through`, `n2_swap_with_me`, `r1_make_way`, `n3_trample`).
    AVOID: Truncating any card title or description with `...` (Zero-Ellipsis Rule).
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>All 36 cards are exported from `releaseRoster36.ts` and `cardGraph.ts` with exact piece-color themes and zero TypeScript errors.</done>
</task>

<task type="auto">
  <name>Task 2: Refactor DeckChessEngine for Zero-Energy, Rank 1 Pawns, Global Promotion Sweep & Outcome Simulation</name>
  <files>src/engine/DeckChessEngine.ts</files>
  <action>
    Update `src/engine/DeckChessEngine.ts`:
    1. **FEN Loading with Rank 1 Pawns**:
       - In the constructor and in `makeEmpoweredMove()` / `loadFen()`, always initialize `new Chess()` and call `this.chess.load(fen, { skipValidation: true })` so FEN strings containing Pawns on Rank 1 (`a1–h1` for White or `a8–h8` for Black) never throw validation errors.
       - Ensure `getLegalMoves()` and `makeMove()` allow a friendly Pawn on its home back rank (`Rank 1` for White, `Rank 8` for Black) to step 1 square straight forward onto an empty square if `chess.js` omits it or verify `chess.js` generates it with `{ skipValidation: true }`.
    2. **Energy Backburnered**:
       - Remove energy cost rejection gates in `getEmpoweredMoves()`, `makeEmpoweredMove()`, and `executeCardAction()` so card plays are governed strictly by "1 card per turn" (`!this.cardPlayedThisTurn`), card presence in hand, and board condition satisfaction.
    3. **Global Promotion Rank Sweep (`sweepPromotions()`)**:
       - Create helper `public sweepPromotions(): void` that scans `a8–h8` for White Pawns (`type === 'p' && color === 'w'`) and `a1–h1` for Black Pawns (`type === 'p' && color === 'b'`) and immediately promotes them to Queens (`type: 'q'`), leaving White Pawns on `a1–h1` and Black Pawns on `a8–h8` unpromoted as legal home-rank Pawns.
       - Call `sweepPromotions()` inside both the simulation in `getEmpoweredMoves()` and live execution in `makeEmpoweredMove()`.
    4. **Pawn Spawning Limit Toggle (`limitPawnsTo8: boolean`)**:
       - Add `public limitPawnsTo8: boolean = false` option to `DeckChessEngine` and helper `public canSpawnPawn(color: PieceColor): boolean` (returns `true` if `!this.limitPawnsTo8`, or counts friendly pawns on board `< 8`).
    5. **Disambiguation (`extraSquare`) & `previewFen` Attachment**:
       - Support card handlers returning targets either as `string[]` or `Array<{ to: string; extraSquare?: string; disambiguationPrompt?: string }>`.
       - In `getEmpoweredMoves()`, run `simHandler.execute(sim, sq, target, extraSquare)`, call `sim.sweepPromotions()`, advance `sim` turn in FEN with `{ skipValidation: true }`, and attach `previewFen: sim.getFen()` and `extraSquare` to each returned `EmpoweredMove`.
       - Update `makeEmpoweredMove(move: EmpoweredMove)` to pass `move.extraSquare` into `handler.execute(this, move.from, move.to, move.extraSquare)`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>`DeckChessEngine.ts` compiles cleanly with `{ skipValidation: true }`, `sweepPromotions()`, `canSpawnPawn()`, `extraSquare`, and `previewFen` support.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npx tsc --noEmit` exits with code 0
- [ ] All 36 cards exist in `src/engine/cards/releaseRoster36.ts` with piece colors (`Gray, Green, Blue, Purple, Red, Gold`)
- [ ] `DeckChessEngine` loads Rank 1 Pawn FENs without throwing and attaches `previewFen` to `EmpoweredMove` objects
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
