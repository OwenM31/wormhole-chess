---
phase: 4
level: 2
researched_at: 2026-10-14T22:21:00-05:00
---

# Phase 4 Research — Deck Builder Chess (2D Variant) & AI Opponent

## Questions Investigated

1. **Chess Engine & Rule Validation**: How should `chess.js` be integrated with modern TypeScript/Vite, and how should it handle legal move generation, board inspection, and check/checkmate detection?
2. **Card Resolver & Board Modifiers**: How should tactical cards (teleport, barrier, swap, freeze, shield, double move) interact with chess state without corrupting the underlying `chess.js` board or FEN?
3. **Turn Economy & Fixed Tactical Hand**: How should the 3-energy economy and 6-card fixed starting hand be managed to ensure zero "deck fail" and deterministic tactical gameplay?
4. **Heuristic AI Bot & Minimax Search**: What evaluation model (Material + Simplified Piece-Square Tables + Card Utility) and search depth (alpha-beta pruning) should be used to guarantee <50ms decision times in the browser?
5. **UI & Rendering Architecture**: How should the 2D SVG/CSS chessboard, card hand bar, energy meter, and dual game mode launcher (Solo AI vs Online) be structured for responsive desktop and mobile devices?

---

## Findings

### 1. Chess Engine Integration (`chess.js`)

`chess.js` (latest 1.x) is fully typed with native TypeScript definitions and runs seamlessly in both browser and Cloudflare Workers runtimes with zero external dependencies (~30KB bundle size).

Key APIs:
- `const chess = new Chess(fen?)`: Initializes board state.
- `chess.moves({ verbose: true })`: Generates legal moves with `from`, `to`, `piece`, `captured`, and `san`.
- `chess.move({ from, to, promotion })`: Executes a move and updates turn, en passant, castling, and clocks.
- `chess.inCheck()`, `chess.isCheckmate()`, `chess.isDraw()`, `chess.isStalemate()`, `chess.isGameOver()`: Standard game end conditions.
- `chess.put({ type, color }, square)` and `chess.remove(square)`: Granular board manipulation.
- `chess.fen()`: Exports canonical FEN string.

**Recommendation:** Install `chess.js` as a production dependency and encapsulate it inside a `DeckChessEngine` class. The wrapper coordinates standard chess moves, tracks active board modifiers (traps, barriers), and manages player energy and card usage.

### 2. Compositional Card Graph Architecture & Engine Invariants

Following user alignment, cards are not hardcoded one-off scripts. The card engine is an **Entity-Component-System Compositional Multi-Partite Graph**:
`[Piece Anchor] ──(Energy Cost & Friction)──> [Condition Node(s)] ──> [Reward Node(s)] ──> [Optional Gambit Tradeoff] ──> [Global Guardrail Validator]`

#### Global Engine Invariants:
1. **Execution Window (`PRE_MOVE_WINDOW`)**: In each player's turn, after the opponent's move resolves and before the player commits their standard chess move, the player may play **at most 1 card** (unless `TEMPO_CONCESSION`, which consumes the chess move).
2. **The Graveyard Conservation Law**: No card effect may spawn, revive, or convert/recruit a piece onto the board unless the player currently holds the corresponding piece in their captured/graveyard pool. Total material can never exceed standard starting counts.
3. **The No-Direct-Mate Law**: A card effect cannot resolve into an immediate, unavoidable checkmate during the card-resolution step itself, nor can a card directly capture the enemy King.
4. **Deck Construction**: Standard battle loadout is **8 cards**, selected before the match.

#### Piece Class Motifs & Visual Color Identity:
Every card is anchored to one of the 6 chess piece classes with dedicated color styling and visual sigil:
- **Pawn (Amber `#d29922`)**: Formations, infantry advances, tactical sacrifices (`EXTEND_RANGE`, `SCUTTLE`, `VECTOR_GRAFT`).
- **Knight (Emerald `#3fb950`)**: Cavalry escort, dislocation swaps (`CARRY_PASSENGER`, `COORDINATE_SWAP`).
- **Bishop (Violet `#bc8cff`)**: Diagonal piercing, color-shift geometry (`PIERCE_CAPTURE`, `VECTOR_GRAFT`).
- **Rook (Cobalt `#58a6ff`)**: Fortification, terrain barriers, displacement (`DEPLOY_OBSTACLE`, `DRAG_OR_PUSH`).
- **Queen (Rose `#f778ba`)**: High command, devastating swaps, tactical momentum (`COORDINATE_SWAP`, `AURA_COMMAND`).
- **King (Solar Gold `#e3b341`)**: Entrenchment, retinue formation, royal decrees (`TANDEM_SHIFT`, `SPAWN_FROM_GRAVEYARD`).

*(Note: Unintuitive temporal and pacify effects such as `CARD_SILENCE`, `PACIFY_PIECE`, and `LINE_QUARANTINE` are explicitly excluded in favor of kinetic, spatial, and positional chess moves).*

#### The 8-Card Starter Pool for Phase 4:
1. **Vanguard Advance (Pawn | Cost: 1 | Amber)**: `UNMOVED` -> `EXTEND_RANGE(1)` (Pawn can advance 3 squares from home, or 2 squares when already advanced).
2. **Abandon Ship / Scuttle (Pawn | Cost: 1 | Amber)**: `UNDER_FIRE` -> `SCUTTLE` (Voluntarily sacrifice pawn into graveyard to clear lines of sight without consuming your normal chess move).
3. **Cavalry Escort (Knight | Cost: 2 | Emerald)**: `FRIENDLY_ADJACENCY` -> `CARRY_PASSENGER` (When Knight leaps, adjacent ally is carried to the vacated square).
4. **Dislocation Swap (Knight | Cost: 2 | Emerald)**: `IN_TERRITORY(ENEMY_HALF)` -> `COORDINATE_SWAP` (Swap deep Knight and another friendly piece).
5. **Prism Ray (Bishop | Cost: 3 | Violet)**: `LINE_OF_SIGHT_ALIGNMENT` -> `PIERCE_CAPTURE(maxTargets: 2)` (Capture target and continue along ray to capture a second non-king target).
6. **Color Inversion (Bishop | Cost: 2 | Violet)**: Active Bishop -> `VECTOR_GRAFT(orthogonal)` (Bishop takes 1 orthogonal step to invert its square color complex).
7. **Rampart Deploy (Rook | Cost: 2 | Cobalt)**: `OPEN_LINE` -> `DEPLOY_OBSTACLE(duration: 2 turns)` (Place an impassable energy barrier on an empty square along Rook's line of sight).
8. **Royal Decree (King | Cost: 2 | Gold)**: `FRIENDLY_ADJACENCY` -> `TANDEM_SHIFT` (Move King and an adjacent bodyguard 1 square in the same direction simultaneously).

### 3. Turn Economy & Fixed Tactical Hand (No Deck Fail)

Following user alignment in `/discuss-phase 4`:
- Players start each turn with **3 Energy**.
- Energy does not accumulate across turns (resets to 3 each turn).
- Players start the match with a **Fixed Tactical Hand of 6 Cards** (selected from the card catalog).
- **No Card Drawing / No Deck Exhaustion**: Cards are single-use per match (consumed upon activation). This eliminates RNG "deck fail" or dead draws, turning card play into a high-stakes tactical timing puzzle.
- The Deck Builder UI allows players to configure which 6 cards they bring into combat from the available library.

### 4. Heuristic AI Bot (Minimax with Alpha-Beta Pruning)

For solo testing (REQ-10), the bot must play legally, make reasonable tactical moves, use ability cards intelligently, and execute in <50ms without lagging the main thread.

#### Evaluation Model:
$$\text{Score} = \text{Material Balance} + \text{Piece-Square Tables (PST)} + \text{Card Advantage}$$

1. **Material Values**:
   - Pawn: 100
   - Knight: 320
   - Bishop: 330
   - Rook: 500
   - Queen: 900
   - King: 20000

2. **Simplified Piece-Square Tables (PST)**:
   - Uses Tomasz Michniewski's standard PSTs for Pawns, Knights, Bishops, Rooks, Queens, and King.
   - Rewards center control, pawn advancement, piece development, and king safety in the castled corners.

3. **Card Utility Evaluation**:
   - The bot evaluates playing high-utility cards when conditions match (e.g. Freezing a threatened queen/rook, Shielding an attacked piece, or Teleporting a piece into an offensive outpost).

4. **Search Depth & Pruning**:
   - Depth 2 or 3 with Alpha-Beta pruning produces instant responses (~10–30ms in JS) while avoiding blunders and capturing loose opponent pieces.

### 5. UI Architecture & Game Modes

1. **Board Component (`DeckChessBoard.tsx`)**:
   - Clean 8x8 SVG grid with dark-sci-fi theme (`#161b22`, `#21262d`, `#0d1117`).
   - SVG piece icons with distinct White / Black styling.
   - Click-to-select and click-to-move square highlights (`#388bfd33` for selection, `#238636` for legal destinations, `#f85149` for capture targets).
   - Visual badges on squares for active modifiers (holographic cyan shield for Barriers, icy cyan frost for Freeze, golden hex for Shields).
2. **Card Hand & Energy Bar (`TacticalHandBar.tsx`)**:
   - 3-cell glowing energy counter: `⚡ 3 / 3 Energy`.
   - 6 tactical cards displayed with cost badge, icon, description, and status (`Ready`, `Active`, `Consumed`).
   - Interactive targeting mode: when a card is selected (e.g. Teleport or Barrier), valid target squares highlight on the board.
   - Action controls: "End Turn", "Cancel Card", "Reset".
3. **Dual Mode Launcher (`DeckBuilderPage.tsx` / `PlayRoomPage.tsx`)**:
   - **Solo AI Mode**: Runs directly in the browser with configurable bot difficulty (Easy: depth 1, Tactical: depth 2-3).
   - **Online Multiplayer Mode**: Uses the existing `useGameRoom` hook to sync turns, card actions, and clocks over Hibernatable WebSockets to `GameRoomDO`.
4. **Deck Customization Modal (`DeckCustomizer.tsx`)**:
   - Allows selecting 6 cards from the 8-card library.
   - Saves loadout to `localStorage` for guests, and sends to `/api/decks` (or D1 `custom_decks`) for authenticated users.

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Chess Engine | `chess.js` (latest 1.x) | Lightweight (~30KB), zero dependencies, complete move/check/checkmate coverage. |
| Card Resolver | Two-Phase `DeckChessEngine` | Preserves standard chess rules while cleanly intercepting barriers, swaps, and freezes. |
| Card Pool | Fixed 6-Card Hand (No Draw) | Prevents "deck fail" RNG; emphasizes chess-like tactical mastery and ability timing. |
| Energy Model | 3 Energy per turn | Encourages card combos (e.g. 2-cost + 1-cost) without allowing overwhelming spam. |
| AI Architecture | Minimax Depth 2-3 + PST + Heuristic Cards | Sub-50ms execution in JS; plays solid tactical chess without server overhead. |
| Game Modes | Solo AI (Local) + Online Room (DO) | Instant practice for testing alongside real-time competitive multiplayer. |

---

## Patterns to Follow

- **State Immutability**: Return new game state objects on every move/card action to support clean React render cycles and time-travel/undo during AI search.
- **Strict Turn Validation**: Never permit a chess move if the player has an unconfirmed targeted card pending. The UI guides the player: Select Card -> Pick Target -> Confirm -> Make Chess Move.
- **Decoupled Engine**: Keep `DeckChessEngine` pure TypeScript without React hooks or DOM dependencies so it can be tested with unit tests and run inside web workers if needed.

## Anti-Patterns to Avoid

- **Direct DOM Manipulation for Chess Squares**: Avoid manual element manipulation; use React declarative square rendering with memoization.
- **RNG Draw Decks in Tactical Chess**: Avoid drawing random cards from a 30-card deck that can brick players; keep the 6-card fixed loadout deterministic.
- **Blocking AI Loops**: Keep minimax depth capped at 2-3 to prevent locking the browser UI thread.

---

## Dependencies Identified

| Package | Version | Purpose |
|---------|---------|---------|
| `chess.js` | `^1.0.0-beta.6` | 8x8 chess legal move generation, FEN handling, and checkmate detection |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Card effects (teleport, swap) breaking king safety / putting own king in check | Check `chess.inCheck()` after applying virtual card mutations; reject card activation if it leaves friendly king in check. |
| AI search taking too long on high-branching positions with card actions | Pre-filter card plays using tactical heuristics before minimax move search, searching at depth 2-3 with alpha-beta pruning. |
| Desynchronization between online players in multiplayer mode | Transmit the full turn payload (`cardPlayed`, `chessMove`, `fen`, `modifiers`) in the `play_turn` WebSocket message, matching server-authoritative DO turn advancement. |

---

## Ready for Planning

- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
- [x] Card mechanics and AI heuristics modeled
