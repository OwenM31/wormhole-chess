# Phase 8 Research: Search Performance Optimization, Low-Determinism AI & Atomic Balance Harness

> **Phase**: 8  
> **Discovery Level**: Level 2 — Algorithmic & Statistical Architecture  
> **Date**: 2026-10-28

---

## 1. Root-Cause Diagnosis of Phase 7 Engine & Simulation Bottlenecks

### 1.1 Determinism & Opening Monotony (`1. c4 Nc6` 100% of the time)
- **Root Cause**: [`computeBestTurn`](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/src/engine/DeckChessAI.ts#L935-L1116) uses a strict `score > bestScore` comparison with zero randomness, and Tight Alpha-Beta pruning at the root sets `alpha = bestScore` after the first best move is evaluated.
- **Empirical Trace on `1. c4`**:
  - At Depth 2 (`medium`), `Nc6` and `Nf6` both evaluate to exactly **`+10cp`**, while `d5` and `e5` evaluate to **`0cp`** ($\Delta = -10\text{cp}$).
  - At Depth 3 (`tactical`/`grandmaster`), `Nc6` and `Nf6` both evaluate to **`+60cp`**, and `e5` evaluates to **`+50cp`** ($\Delta = -10\text{cp}$).
  - Because `chess.js` generates `b8-c6` before `g8-f6`, `Nc6` sets `alpha = +10` (or `+60`), causing `Nf6` to fail low (`score <= alpha`) and never replace `bestCandidate`.

### 1.2 The "Double-Tax" Card Hoarding Bug (`P3 March Together`: 90.4% Trigger, 0.0% Play)
- In [`evaluateBoard`](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/src/engine/DeckChessAI.ts#L456-L475), every unspent card in `hand` contributes:
  1. **Class Retention Value** in [`evaluateCardScarcityAndHand`](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/src/engine/DeckChessAI.ts#L207-L304): `55cp` (Pawn), `70cp` (Knight/Bishop), `85cp` (Rook), `100cp` (Queen/King), plus `+30%` `spareAnchorBonusPct` when 2+ anchors are alive (`91cp` for Knight/Bishop, `110cp` for Rook).
  2. **Pre-Condition Setup Bonus** in [`evaluateHandSynergy`](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/src/engine/DeckChessAI.ts#L310-L346): `+15cp` to `+35cp` when the card's board pre-condition is satisfied.
- **The Paradox**: The moment the AI *plays* a card, that card is spliced out of `hand`. Consequently, the post-move board evaluation immediately loses **both** the retention value (`55–110cp`) **and** the `evaluateSetup` bonus (`15–35cp`)!
  - Example (`P3: March Together`): Holding `P3` with two horizontally adjacent pawns grants `+55cp` (retention) + `+18cp` (`evaluateSetup`) = `+73cp`. Playing `P3` advances both pawns 1 rank (+20 to +35cp positional gain) but removes `P3` from hand (`-73cp`), resulting in a net evaluation change of **`-40cp` to `-50cp`**. Thus the AI refuses to ever play `P3` (`0.0%` play rate across 90.4% triggered turns).
- **Fix**:
  1. **Game-Phase Retention Decay**: Unspent cards at the end of a game have zero terminal value. Retention value must decay smoothly with game progression (`turnNumber` / ply):
     $$\text{Retention}(\text{card}, \text{ply}) = \text{BaseRetention}(\text{card}) \times \max\!\left(0.25,\; 1 - \frac{\text{ply}}{80}\right)$$
  2. **Per-Card Retention & Post-Play Setup Credit**: Non-destructive tempo/positional cards (`P1`, `P3`, `P6`, `N6`, `B4`, `R2`) should have lower intrinsic retention hurdles (`30–40cp` base) than board-shattering spawn/capture cards (`K1`, `P7`, `B7`, `Q2`), so the AI spends tempo cards in the opening/middlegame instead of hoarding them forever.

### 1.3 Four Zero-Loss Search Bottlenecks in `DeckChessEngine.ts` & `DeckChessAI.ts`
1. **Redundant Legal-Move Regeneration Inside `makeMove` and `makeEmpoweredMove`**:
   - [`makeMove`](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/src/engine/DeckChessEngine.ts#L719) calls `this.getLegalMoves(move.from)` even when the move came directly from `getLegalMoves()` in `minimax`/`quiescence`.
   - Worse, at the end of every move (lines 780–789 and 1089–1098), `makeMove` and `makeEmpoweredMove` call `this.chess.isCheckmate()`, `this.chess.isStalemate()`, and `this.isDraw()`. In `chess.js`, each of those generates **all legal moves for the opponent**—3 full move-generation passes per search node—only for `minimax` to immediately enter the child node and call `getLegalMoves()` a 4th time!
   - **Solution**: Add `fastSearch: boolean = false` parameter to `makeMove(move, fastSearch)` and `makeEmpoweredMove(move, fastSearch)`. When `fastSearch === true`, skip the redundant `getLegalMoves(move.from)` re-validation (when no active barriers affect the square) and skip the end-of-move `isCheckmate()`/`isStalemate()`/`isDraw()` calls because `minimax` and `evaluateBoard(..., fastMode=true)` already handle terminal detection when expanding the child node.
2. **Double 64-Square Board Scan in `evaluateBoard` & `makeEmpoweredMove` King Scan**:
   - [`evaluateBoard`](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/src/engine/DeckChessAI.ts#L394-L442) loops over all 64 squares twice: once to build `whitePieces`/`blackPieces` and `nonPawnMaterial`, and a second time to sum material + PSTs. Only the 2 Kings' PSTs depend on `isEndgame`. Computing all non-king material + PSTs in the first pass eliminates an entire 64-square loop on every leaf evaluation.
   - In [`makeEmpoweredMove`](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/src/engine/DeckChessEngine.ts#L1024-L1036) and `getEmpoweredMoves`, finding the friendly King scans 64 squares calling `coordsToSquare` + `getPiece(s)`. Using `this.chess.board()` directly (or `findKingSquare(color)`) avoids up to 64 string allocations and `chess.get()` parses per card simulation.
3. **Transposition Table (`TTEntry`) Move Ordering & Iterative Deepening ($1 \to D$)**:
   - Storing the best candidate key (`bestMoveKey: string`) in `TTEntry` and running Iterative Deepening from depth `1` to `maxDepth` at the root orders the principal variation move first at every node, dramatically accelerating alpha-beta cutoffs.

---

## 2. Low-Determinism, High-Strength Engine Architecture

### 2.1 Hybrid Strategy: Iterative Deepening + Top-$K$ Windowed Verification + Seeded Clipped Softmax
To make the AI play naturally and creatively without losing strength:
1. **Iterative Deepening ($d = 1 \dots D - 1$)**:
   - Rank all root candidates at shallow depth and populate the Transposition Table.
2. **Exact-Window Contender Evaluation at Depth $D$**:
   - Let `marginCp` be the maximum allowable centipawn concession relative to the best move:
     - `grandmaster`: `marginCp = 15`, `temperature = 10`
     - `tactical`: `marginCp = 22`, `temperature = 14`
     - `medium`: `marginCp = 32`, `temperature = 20`
     - `easy`: `marginCp = 60`, `temperature = 35`
   - At depth $D$, instead of raising root `alpha` to `bestScore`, we set `rootAlpha = bestScore - marginCp`. This guarantees that **every move within `marginCp` of the leader receives an exact minimax evaluation at full depth $D$**, while clearly inferior moves (`< bestScore - marginCp`) still get pruned early via alpha-beta cutoffs!
3. **Seeded Clipped Softmax (Boltzmann Sampling) with Tactical Lock**:
   - Filter root candidates to the contender set:
     $$\mathcal{C} = \left\{\, m_i \;\middle|\; s_i \ge s_{\max} - \text{marginCp} \,\right\}$$
   - **Tactical Lock Guardrails** (force deterministic top-1 choice if any hold):
     - `options?.deterministic === true` (used by UI `Hint` button, `<EvalBar />`, and `HistoricalMatchViewer`), OR
     - $|\mathcal{C}| = 1$ (single clear best move, e.g., obvious recapture or check evasion), OR
     - $s_{\max} \ge 80000$ (forced checkmate found).
   - Otherwise, sample $m_i \in \mathcal{C}$ with Boltzmann weights using a deterministic seeded PRNG (`mulberry32(seed)` if `seed` provided, else `Math.random`):
     $$w_i = \exp\!\left(\frac{s_i - s_{\max}}{T}\right), \qquad P(m_i) = \frac{w_i}{\sum_{j \in \mathcal{C}} w_j}$$

---

## 3. Atomic Resumable Simulation Harness & De-Confounded Metrics

### 3.1 Why the Phase 6/7 Tournament Metrics Were Confounded
1. **Premature 42-Ply Cutoff**: 41.9 average plies meant >95% of matches were adjudicated at Move 21 by static `evaluateBoard` (`±140cp`), measuring static eval bias (including unspent hand retention!) rather than actual game outcomes.
2. **Deck Co-Occurrence Confounding**: Each match pits 8 cards against 8 cards. With $N=16$ appearances, standard error is $\pm 12.5\%$, and a passive card paired with a strong card inherits its win rate.
3. **Un-Paired Color Assignment**: Decks were not tested in color-swapped duplicate pairs, leaking White's first-move advantage into card win rates.
4. **One-Ply Naive Swing**: `evalAfter - evalBefore` measured static eval before the opponent's recapture and subtracted the card's own retention value.

### 3.2 New Atomic Architecture (`scripts/sim-single-match.ts` + `scripts/aggregate-deck-balance.ts`)
- **Atomic Single-Match Function (`playSingleMatch(spec: MatchSpec): MatchRecord`)**:
  - Pure, self-contained execution of 1 match given `{ matchId, blockId, pairId, seed, whiteDeck, blackDeck, maxPlies, difficulty }`.
  - **Higher Natural Ply Cap (`maxPlies = 100`) + Quiescence-Backed Mercy Adjudication**:
    - If $|\text{quiescenceEval}| \ge 650\text{cp}$ (a full Rook + Pawn ahead after all captures settle) for 4 consecutive plies after ply 30, adjudicate early as `mercy_adjudication` to save compute without horizon errors.
    - If a match reaches `maxPlies = 100`, adjudicate via **pure board + quiescence evaluation (excluding unspent card retention!)** at `±150cp`.
  - **Search-Backed Card Lift (`liftCp`)**:
    - Whenever `computeBestTurn` selects an empowered card move, it already computed the root scores of all standard moves and empowered moves! We expose `bestStandardScore` and `bestEmpoweredScore` in `BestTurnResult` so `cardLiftCp = bestEmpoweredScore - bestStandardScore` measures the **true multi-ply search advantage** of playing that card over the best legal standard chess move on that turn.
- **Stratified Color-Swapped Schedule (`schedule.jsonl`) & Per-Worker JSONL Persistence**:
  - Each **Block** consists of **18 matches** (9 deck pairs $\times$ 2 color swaps: Match $2k$ has Deck A as White vs Deck B as Black; Match $2k+1$ has Deck B as White vs Deck A as Black with the same PRNG seed).
  - Every card appears **8 times per 18-match block** (4 times as White, 4 times as Black, facing the exact same opponent deck in both colors).
  - Workers append each completed `MatchRecord` to `.agent/state/phases/8/workers/worker_{id}.jsonl`.
  - **Stoppable & Resumable Anytime**: If interrupted or stopped after any number of games, re-running `simulate-deck-balance.mjs` reads existing `worker_*.jsonl` files, skips completed `matchId`s, and resumes. Running `npx tsx scripts/aggregate-deck-balance.ts` aggregates all completed matches at any point in time.
- **De-Confounded Statistical Metrics in `aggregate-deck-balance.ts`**:
  1. **Color-Swapped Pair Win Rate** (eliminates White/Black tempo bias).
  2. **Ridge-Regularized Marginal Win Credit ($\hat{\beta}_i$)**: Fits a linear/logistic model $y_m = \beta_0 + \sum_{i \in W_m} \beta_i - \sum_{j \in B_m} \beta_j$ with $L_2$ penalty ($\lambda = 8.0$) via closed-form Cholesky/Gauss-Seidel solver to isolate each card's individual win-rate lift controlling for teammate and opponent cards.
  3. **Mean Search-Backed Card Lift (`avgLiftCp`)** alongside `triggerRate` and `playRate`.
  4. **Opening Diversity & Termination Health** (unique 6-ply openings, natural checkmate/mercy rate vs max-ply rate).
