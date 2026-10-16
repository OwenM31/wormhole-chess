# Phase 6 Research: Major Unit Card Graph & Royal Power Taxonomy (Rook, Queen, King)

## 1. Domain & Architectural Context

Phase 6 completes the 180-card canonical library (`[DECISION-019]`) by implementing the **Major & Royal Units 3-Cycle** (`Rook → King → Queen → Rook`):
- **♜ Rook (30 Cards)**:
  - **Good At (`Neighbors`)**: 5 scenarios × 2 Effect outcomes = 10 cards (`Walls & Shields` (A) + `Move Others` (B)).
  - **Excludes (`Position`)**: 0 cards.
  - **Secondary Conditions (20 Cards)**:
    - `Lines` → `Special Captures` (5 cards)
    - `Blocked` → `New Moves` (5 cards)
    - `Momentum` → `Jump & Leap` (5 cards)
    - `Threat` → `Spawning` (5 cards)
- **♛ Queen (30 Cards)**:
  - **Good At (`Threat`)**: 5 scenarios × 2 Effect outcomes = 10 cards (`Special Captures` (A) + `Jump & Leap` (B)).
  - **Excludes (`Neighbors`)**: 0 cards.
  - **Secondary Conditions (20 Cards)**:
    - `Lines` → `Walls & Shields` (5 cards)
    - `Position` → `Spawning` (5 cards)
    - `Blocked` → `Move Others` (5 cards)
    - `Momentum` → `New Moves` (5 cards)
- **♚ King (30 Cards)**:
  - **Good At (`Position`)**: 5 scenarios × 2 Effect outcomes = 10 cards (`Spawning` (A) + `Walls & Shields` (B)).
  - **Excludes (`Threat`)**: 0 cards.
  - **Secondary Conditions (20 Cards)**:
    - `Neighbors` → `Move Others` (5 cards)
    - `Blocked` → `Jump & Leap` (5 cards)
    - `Lines` → `Special Captures` (5 cards)
    - `Momentum` → `New Moves` (5 cards)

Each of the 3 pieces adheres to the **12 / 12 / 6 Energy Cost Curve**:
- 12 cards at `score: 1` (`energyCost: 1`)
- 12 cards at `score: 2` (`energyCost: 2`)
- 6 cards at `score: 3` (`energyCost: 3`)

---

## 2. Canonical Catalog & Backwards Compatibility (`src/engine/cardGraph.ts`)

- The 90 Major Unit cards are stored in [`src/engine/cards/cardCatalogMajor90.json`](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/src/engine/cards/cardCatalogMajor90.json).
- To preserve 100% backwards compatibility with existing Phase 5 tests (`Suite 12` in `scripts/verify-all-cards.ts`), [`src/engine/cardGraph.ts`](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/src/engine/cardGraph.ts) must:
  1. Keep `CANONICAL_90_CARDS` exported unchanged (Minor Units: Pawn, Knight, Bishop).
  2. Export `CANONICAL_MAJOR_90_CARDS` mapped from `cardCatalogMajor90.json`.
  3. Export `CANONICAL_180_CARDS = [...CANONICAL_90_CARDS, ...CANONICAL_MAJOR_90_CARDS]`.
  4. Merge `CANONICAL_MAJOR_90_CARDS` into `EXPANDED_LIBRARY` so `getCardById()` resolves all 180 canonical cards plus legacy compatibility cards.

---

## 3. Unified Action Model & Representative Major Unit Handlers (`src/engine/cards/cardRegistry.ts`)

[`src/engine/DeckChessEngine.ts`](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/src/engine/DeckChessEngine.ts) already maps `'rook'`, `'queen'`, and `'king'` piece anchors in `getEmpoweredMoves(square)` and `makeEmpoweredMove(empoweredMove)`.
In [`src/engine/cards/cardRegistry.ts`](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/src/engine/cards/cardRegistry.ts):
1. **Explicit Representative Handlers**:
   - **Rook**:
     - `rook_railgun_bolt` (`Lines` → `Special Captures`): Ranged capture on an enemy piece aligned on the same rank/file with exactly 1 friendly blocker between them.
     - `rook_counter_battery` (`Lines` → `Special Captures`): Ranged capture of an aligned enemy Rook.
     - `rook_turret_traverse` (`Blocked` → `New Moves`): Step 1 square diagonally when orthogonally blocked by friendly pieces.
     - `rook_siege_hurdle` (`Momentum` → `Jump & Leap`): Leap orthogonally over 1 blocking piece up to 4 squares to an empty square.
     - `rook_trench_shift` (`Neighbors` → `Move Others`): In-place swap with an horizontally adjacent friendly Pawn.
   - **Queen**:
     - `queen_counter_smite` (`Threat` → `Special Captures`): Ranged strike against a minor piece currently threatening the Queen.
     - `queen_apex_skewer` (`Threat` → `Special Captures`): Ranged capture of a lined-up enemy piece behind 1 blocker while threatened.
     - `queen_phase_evasion` (`Threat` → `Jump & Leap`): Jump over 1 adjacent piece along any line to an empty square 2–3 squares away when threatened.
     - `queen_amazon_hop` (`Threat` → `Jump & Leap`): Knight L-jump to an empty square when threatened.
     - `queen_camel_stride` (`Momentum` → `New Moves`): Extended (3,1) or (1,3) leap to an empty square.
   - **King**:
     - `king_keep_garrison` (`Position` → `Spawning`): Spawn a friendly Pawn on an empty square on the 2nd/7th rank directly in front when on the home back rank.
     - `king_sanctuary_hop` (`Blocked` → `Jump & Leap`): Jump 2 squares orthogonally or diagonally over an adjacent friendly blocker to an empty square.
     - `king_royal_stride` (`Momentum` → `New Moves`): Step 2 squares orthogonally along an open file/rank to an empty square.
     - `king_bodyguard_switch` (`Neighbors` → `Move Others`): Swap places with an orthogonally adjacent friendly Knight or Rook.
     - `king_royal_judgement` (`Lines` → `Special Captures`): Ranged strike on the nearest enemy piece 2–3 squares away along an open rank/file.
2. **Fallback Coverage for All Remaining Major Cards**:
   - Extend `registerRemainingCatalogCards()` to iterate over `CANONICAL_180_CARDS` so every single Rook, Queen, and King card in `cardCatalogMajor90.json` has a deterministic, King-safe `CardBehaviorHandler`.

---

## 4. Royal & Board Precision Invariants

1. **King Safety Invariant**:
   - No `EmpoweredMove` (including King leaps, swaps, ranged captures, or spawns) may leave the active player's King in check (`DeckChessEngine.getEmpoweredMoves` simulates every candidate move and filters out any move where `sim.getInternalChess().isAttacked(kingSq, oppColor)` is true).
   - No `ranged_capture` or `Special Captures` move may ever target an enemy King (`targetPiece.type !== 'k'`).
2. **Pawn Rank 2–7 Invariant**:
   - All `Spawning` and `Move Others` (push/pull/swap) effects involving Pawns must strictly enforce target ranks `2` through `7` (`r >= 1 && r <= 6` in 0-indexed row coordinates) so no unpromoted Pawn is ever placed on rank 1 or rank 8.

---

## 5. UI Integration (`src/components/DeckBuilderView.tsx`)

- Update [`src/components/DeckBuilderView.tsx`](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/src/components/DeckBuilderView.tsx) to import `CANONICAL_180_CARDS` instead of `CANONICAL_90_CARDS`.
- Expand the piece filter tabs from 4 tabs (`all`, `pawn`, `knight`, `bishop`) to all 7 tabs:
  - `All (180)`
  - `Pawn (30)`
  - `Knight (30)`
  - `Bishop (30)`
  - `Rook (30)`
  - `Queen (30)`
  - `King (30)`
