---
phase: 6
level: 3
researched_at: 2026-10-25
---

# Phase 6 Research: Grandmaster Card-Aware AI Engine, Hint & Side Eval Bar, and Deck Balance Simulation Matrix

## Questions Investigated
1. **Unified Card-Aware Search Architecture**: How do we unify standard chess moves (`getLegalMoves`) and 36-Playbook empowered card moves (`getEmpoweredMoves`) inside a single Alpha-Beta minimax tree while keeping browser turn/hint response times under `250ms`?
2. **Card Conservation & Proactive Setup ("Pre-Condition Shaping")**: How do we mathematically prevent the AI from burning cards on trivial positional moves while motivating it to maneuver pieces into formations that unlock its own unspent hand cards?
3. **Side Evaluation Bar (`EvalBar.tsx`) & Direct Best-Move Hint Engine**: How should centipawn / forced-mate evaluations map to a visual vertical/horizontal Eval Bar alongside `TabletopArena` and `HistoricalMatchViewer`, and how should the `Hint` button stage/highlight the engine's best move on the board?
4. **30M+ Deck Space Monte Carlo Balance Simulation**: How do we sample the $\binom{36}{8} = 30,260,340$ deck space across multi-threaded Node `worker_threads` to produce statistically significant Trigger Rate, Play Conversion Rate, Centipawn Swing, and Win-Rate Delta metrics for all 36 cards?

---

## Findings

### 1. Unified Action Search & Performance Bottlenecks in `DeckChessEngine.ts` and `DeckChessAI.ts`
**Codebase Audit Findings:**
- Currently, `src/engine/DeckChessAI.ts` only searches `engine.getLegalMoves()` inside `minimax()` and contains obsolete pre-Phase-3 `activateCard()` calls. Meanwhile, `src/hooks/useDeckChessGame.ts` runs a separate 0-ply greedy loop over `engine.getEmpoweredMoves()` before calling `computeBestTurn()`, picking any card move with `gain >= 30cp` without checking the opponent's 1-ply response (causing the AI to waste cards or hang high-value pieces on the reply).
- In `DeckChessEngine.getEmpoweredMoves()`, lines 809 and 879–880 have two performance bottlenecks during tree search:
  1. It loops over `for (const cardId of hand)` without deduplicating identical card IDs (`new Set(hand)`), multiplying work when duplicate copies exist.
  2. It instantiates `new Chess()` on every candidate target solely to validate `previewFen`, even though `sim` already validated the board state.

**Recommendation:**
- Deduplicate `const uniqueHand = Array.from(new Set(hand))` inside `getEmpoweredMoves()` and remove the redundant `new Chess()` instantiation.
- Add a fast-path option `getEmpoweredMoves(square?: string, skipPreviewFen?: boolean)` or lightweight execution inside minimax so search nodes do not serialize FEN strings unnecessarily.
- Unify both `Move` (standard) and `EmpoweredMove` (card) candidates into a single `UnifiedCandidateMove` list inside `DeckChessAI.ts` with MVV-LVA (Most Valuable Victim - Least Valuable Attacker) + tactical card move ordering for maximum Alpha-Beta pruning efficiency.

---

### 2. Mathematical Model for Card Conservation & Proactive "Pre-Condition Shaping"
To make the AI play like a strategic human master—saving cards for high-impact moments while actively maneuvering pieces to unlock its own hand—`evaluateBoard(engine, povColor)` combines three terms:

$$\text{Eval}(S, \text{pov}) = \Delta \text{Material\_PST}(S) + \Delta \text{HandRetention}(S) + \Delta \text{HandSynergy}(S)$$

1. **Card Retention Value (`HandRetention`)**:
   - Every unspent card in a player's hand carries an intrinsic retention value scaled by piece class:
     - Pawn (`P1–P8`): `55 cp`
     - Knight (`N1–N7`) & Bishop (`B1–B7`): `70 cp`
     - Rook (`R1–R6`): `85 cp`
     - Queen (`Q1–Q4`) & King (`K1–K4`): `100 cp`
   - **Effect in Minimax**: When the AI considers playing a card on Ply 1, its hand loses that card's retention value (`-55cp` to `-100cp`). Thus, a card move will *only* outscore a standard chess move if the resulting board state (after the opponent's best counter-response!) improves the AI's position by *more* than the card's retention threshold (e.g., winning material, saving an attacked piece, delivering checkmate, or creating an unstoppable promotion/fork threat).

2. **Proactive Card Setup (`HandSynergy` / Pre-Condition Shaping)**:
   - How does the AI maneuver toward positions where its cards become advantageous *before* playing them?
   - **Mechanism A — Primed Threat Bonus (`+22cp` to `+38cp`)**: For each unique unspent card in `color`'s hand, if at least one friendly anchor piece currently satisfies that card's condition (`evaluateConditions`) and has legal targets, award `+22cp` (`+38cp` if one of the targets captures an enemy piece or spawns a unit).
     - Because a standard move on Ply 1 that moves a piece into condition alignment *keeps the card in hand* (`+70cp`) *and* unlocks the Primed Threat Bonus (`+22cp` to `+38cp`), the AI naturally gravitates toward standard moves that arm its own cards!
   - **Mechanism B — Geometric Pre-Condition Shaping (`+10cp` to `+25cp`)**: Even when a card is 1 step away from triggering, award small shaping bonuses for piece geometries that prime specific cards held in hand:
     - `b6_come_this_way`: `+20cp` when a friendly Bishop occupies `d4, d5, e4, e5` (or `+10cp` when 1 move from center while friendly Pawns exist).
     - `r3_cut_across`: `+18cp` when a friendly Rook sits on a main diagonal (`a1–h8` or `a8–h1`).
     - `r4_move_in_unison`: `+24cp` when two friendly Rooks share an unobstructed rank or file.
     - `r1_make_way` / `r2_ive_got_your_back` / `r5_catapult`: `+16cp` when a Rook shares a file or rank with a friendly Pawn or non-King piece.
     - `r6_garrison`: `+18cp` when a Rook is orthogonally adjacent to the friendly King.
     - `n6_flanking_support`: `+18cp` when a friendly Knight is on file `a` or `h` and a second friendly Knight is alive.
     - `n7_outpost_support` / `p8_call_reserves`: `+20cp` when a Knight or Pawn is in enemy territory (Ranks 5–7) with friendly support.
     - `p3_follow_me` / `p5_get_behind_me` / `p6_tag_out` / `b1_let_me_through`: `+14cp` for friendly piece-Pawn battery adjacency.
     - `q1_royal_summons` / `q4_one_fell_swoop`: `+20cp` for Queen alignment along a shared ray with a friendly Rook/Bishop/Pawn.
     - `k1_conscription` / `k2_royal_knighting` / `k3_royal_execution` / `k4_banish`: `+16cp` for King corner proximity (`K1`), horizontal Pawn adjacency (`K2`), orthogonal ally adjacency (`K3`), or enemy file stack alignment (`K4`).
   - **Symmetric Evaluation**: Because $\Delta \text{HandSynergy} = \text{Synergy}(\text{self}) - \text{Synergy}(\text{opponent})$, the AI simultaneously builds setups for its own hand *and* disrupts piece alignments that prime the opponent's hand!

---

### 3. Live Side Evaluation Bar (`EvalBar.tsx`) & Direct Best-Move Hint System
**Sigmoid Mapping for Centipawns to Bar Percentage:**
- Standard Chess.com / Lichess win-probability mapping converts centipawn advantage $c$ (from White's perspective) into White bar height percentage $P_{\text{white}} \in [3\%, 97\%]$ (or $100\% / 0\%$ on checkmate / forced mate):
  $$P_{\text{white}}(c) = \text{clamp}\left(50 + 50 \cdot \left(\frac{2}{1 + e^{-0.0035 \cdot c}} - 1\right), 3, 97\right)$$
- **Display Label Formatting**:
  - Forced mate: `M1`, `M2`, `-M1` (or `1-0` / `0-1` when game is over).
  - Centipawn score: `+(c / 100).toFixed(1)` (e.g. `+1.4`, `0.0`, `-0.8`), where raw centipawn score adjusts out baseline equal-hand retention so starting position reads `0.0`.
- **Responsive Layout Integration**:
  - In `TabletopArena.tsx`, on desktop (`> 600px`), `.tabletop-board-inscribed` occupies `left: 29.296875%, top: 11.188811%, width: 41.40625%, height: 74.125874%`. An optional `evalBar` slot rendered inside `.tabletop-arena-stage` at `left: 26.2%, top: 11.188811%, width: 2.2%, height: 74.125874%` aligns flush with the top and bottom edges of the inscribed 8×8 board without clipping. On mobile (`<= 600px`), it renders as a sleek horizontal bar directly above the board or slim `14px` vertical bar beside it.
  - Also embedded inside `HistoricalMatchViewer.tsx` next to the replay board so online/historical match reviews show live position evaluation on every turn step.
- **Direct Best-Move Hint (`Hint` Button)**:
  - Exposed in the Offline Match Arena action bar (`DeckBuilderPage.tsx`) and in `HistoricalMatchViewer.tsx`.
  - Clicking **`💡 Hint`** invokes `computeBestTurn(engine, currentTurn, 'tactical')` and stores `hintMove: BestTurnResult | null` in state:
    - Highlights `from` and `to` squares on `DeckChessBoard.tsx` with a distinct cyan/emerald engine recommendation badge (`BEST MOVE: e2 ➔ e4 (+0.4)` or `BEST MOVE: [N1 Adrenaline Jump] c3 ➔ d6 (+3.2)`), and offers a 1-click **"Play Best Move"** or **"Stage Card"** action in the hint banner.
    - Automatically clears when the turn advances or the board state changes.

---

### 4. Multi-Threaded Monte Carlo Deck Balance Simulation (`scripts/simulate-deck-balance.mjs`)
- **Combinatorial Space**: $\binom{36}{8} = 30,260,340$ unique 8-card hands.
- **Stratified / Balanced Block Sampling**:
  - To guarantee low-variance statistics for every single card in the 36-card roster, each simulation batch constructs balanced random pairings where every card $c \in \{1..36\}$ appears an equal number of times across White and Black decks.
  - Using Node.js `worker_threads` across available CPU cores, each worker runs headless `DeckChessEngine` + `DeckChessAI` matches (capped at `80` plies / `40` full moves with material-adjudicated draws/wins if max plies reached, preventing infinite shuffling loops).
- **Per-Card Telemetry Collected**:
  1. `appearances`: Total matches where card was in a player's starting 8-card hand.
  2. `turnsHeld`: Total player turns where card was unspent in hand.
  3. `turnsConditionMet`: Total player turns where `getEmpoweredMoves()` produced $\ge 1$ legal move for this card (**Trigger Rate** = `turnsConditionMet / turnsHeld`).
  4. `timesPlayed`: Total matches where the AI actually executed this card (**Play Conversion Rate** = `timesPlayed / appearances`).
  5. `avgEvalSwingCp`: Average centipawn evaluation gain on the turn the card was played.
  6. `winRateWithCard`: Win rate `(wins + 0.5 * draws) / appearances` and **Win-Rate Delta** vs. the 50.0% population mean.

---

## Technical Architecture & Contracts

### 5-Layer Contract Alignment
| Domain Concept | Storage / Config | Shared TypeScript (`src/types/deckChess.ts`) | Engine / AI Function Signature | Telemetry / CLI Output | UI Component State |
|---|---|---|---|---|---|
| **AI Difficulty Tier** | `localStorage` / Match state | `type AiDifficulty = 'easy' \| 'medium' \| 'tactical' \| 'grandmaster'` | `computeBestTurn(engine, color, difficulty)` | Simulation worker depth config | Difficulty selector & badge in `DeckBuilderPage.tsx` |
| **Unified Engine Decision** | In-memory evaluation | `interface BestTurnResult` (`type: 'standard' \| 'empowered'`, `move?`, `empoweredMove?`, `evalScore`, `whiteEvalCp`, `mateIn?`, `explanation`) | Returned by `computeBestTurn()` & `evaluatePosition()` | Logged in simulation move trace | Drives AI turn, `EvalBar`, and `Hint` overlay |
| **Position Evaluation** | Computed per FEN + hands | `interface PositionEvaluation` (`whiteCp: number`, `whiteWinPct: number`, `displayLabel: string`, `mateIn?: number`) | `evaluatePosition(engine): PositionEvaluation` | Recorded per ply in balance harness | `<EvalBar evaluation={...} orientation={...} />` |
| **Engine Hint State** | Transient React state | `BestTurnResult \| null` | `requestHint(): BestTurnResult \| null` in `useDeckChessGame` | N/A | Highlighted squares + top/bottom hint banner on `DeckChessBoard` |
| **Card Balance Metrics** | `.agent/state/phases/6/BALANCE_REPORT.md` & `.json` | `interface CardBalanceMetric` (`cardId`, `code`, `name`, `appearances`, `triggerRate`, `playRate`, `avgSwingCp`, `winRateDelta`) | Aggregated by `scripts/simulate-deck-balance.mjs` | Markdown leaderboard + JSON artifact | Used for Phase 6 card balance review |

### State Transition Matrix (AI Turn, Eval Bar & Hint Lifecycle)
| Current Arena State | Event: Player Makes Move | Event: Click `💡 Hint` | Event: Click `Apply Hint` | Event: AI Turn Completes | Event: Board Reset / New Game |
|---|---|---|---|---|---|
| `PLAYER_TURN_IDLE` | ➔ `AI_THINKING` (clears hint, updates `EvalBar`) | ➔ `PLAYER_TURN_HINT_SHOWN` (computes `BestTurnResult`, highlights `from ➔ to`) | N/A (No active hint) | N/A | ➔ `PLAYER_TURN_IDLE` (`EvalBar` = `0.0`) |
| `PLAYER_TURN_HINT_SHOWN` | ➔ `AI_THINKING` (clears `hintMove`, updates `EvalBar`) | ➔ `PLAYER_TURN_IDLE` (toggles hint off) | ➔ Executes standard move OR stages `pendingCardMove` (`✓ / ✕`) | N/A | ➔ `PLAYER_TURN_IDLE` (clears `hintMove`) |
| `AI_THINKING` | Ignored (not player's turn) | Disabled during AI turn | Disabled | ➔ `PLAYER_TURN_IDLE` (or `GAME_OVER`), updates `EvalBar` | ➔ `PLAYER_TURN_IDLE` (aborts AI timer) |
| `GAME_OVER_REVIEW` | Ignored (match ended) | Computes analysis for viewed board state | Disabled | N/A | ➔ `PLAYER_TURN_IDLE` (`EvalBar` = `0.0`) |

### Immutable System Invariants
1. **Pure Board Evaluation Relative to Symmetric Hands**: At the starting position (`STARTING_FEN`) with equal-value hands, `evaluatePosition(engine).whiteCp` MUST equal `0` (`0.0` display label, `50%` bar height) with zero first-turn static bias.
   - *Enforcement*: Subtract baseline hand retention symmetry and verify via unit test in `scripts/verify-phase6-ai-and-hints.ts`.
2. **Card Conservation Threshold Invariant**: At `medium`, `tactical`, and `grandmaster` difficulties, the AI MUST NOT play an empowered card move if its multi-ply evaluation score (which accounts for the lost card retention value of `55cp–100cp`) is lower than or equal to the best legal standard chess move's evaluation score.
   - *Enforcement*: Verified by unit test where a card move yields `+0cp` material change on an open board and confirming the AI chooses a standard developing move instead.
3. **Multi-Ply Blunder Prevention on Card Plays**: Every empowered card move candidate evaluated by the AI at depth $\ge 2$ MUST be searched through the opponent's counter-responses inside `minimax()`, never selected via 0-ply static greed.
   - *Enforcement*: Remove the legacy 0-ply greedy card loop from `useDeckChessGame.ts` and delegate 100% of AI move selection to `computeBestTurn()` in `DeckChessAI.ts`. Verified via tactical trap test where a greedy card capture hangs the AI's Queen on the next ply.
4. **King Safety & Legal Move Invariant**: Every move returned by `computeBestTurn()` (for both AI turns and Player Hints) MUST be strictly legal (`makeMove` or `makeEmpoweredMove` returns `success: true` and leaves friendly King out of check).
   - *Enforcement*: Validated by `DeckChessEngine` rollback guards and 1,000+ simulated AI-vs-AI games with 0 illegal move throws.

---

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| **AI Search Architecture** | Unified Alpha-Beta over `getLegalMoves()` + `getEmpoweredMoves()` with MVV-LVA ordering | Evaluates card moves and standard moves in the same search tree so the AI sees opponent counter-replies and multi-ply card setups |
| **Card Conservation & Setup** | Class-weighted Card Retention Value (`55–100cp`) + `evaluateHandSynergy()` (`+14–38cp` for primed/proximate conditions) | Prevents the AI from wasting cards on trivial nudges while rewarding standard moves that position pieces to unlock unspent hand cards |
| **Hint & Analysis UX** | Clean chess-native `Hint` button + `<EvalBar />` (no "Jester's Whisper" branding) | Works identically for Offline Playtest and Online/Historical Game Review |
| **Card Balance Workflow** | Simulation-First (Workflow A) via `worker_threads` CLI harness | Grounds any mechanical retcons (such as `P7` or `N3`) in empirical trigger-rate and win-rate data across thousands of games |

## Patterns to Follow
- **Single Source of Truth for AI & Hints**: `useDeckChessGame.ts` must call `computeBestTurn()` from `DeckChessAI.ts` for both AI turns (`triggerAiTurn`) and player hints (`requestHint`), eliminating duplicate evaluation logic in hooks.
- **Deduplicated Hand Iteration**: Always iterate over `Array.from(new Set(hand))` when checking card conditions or generating `EmpoweredMove` candidates.
- **Non-Intrusive Tabletop Eval Bar**: Render `<EvalBar />` alongside the board inside `<TabletopArena>` and `<HistoricalMatchViewer>` without altering the 8×8 grid's 1:1 aspect ratio.

## Anti-Patterns to Avoid
- **0-Ply Greedy Card Execution**: Never execute a card move based solely on static `evaluateBoard(after) - evaluateBoard(before)` without searching the opponent's reply.
- **Unbounded Search Time in Browser**: Cap synchronous search depth/branching so `computeBestTurn` completes within `< 200ms` on the client thread.

## Dependencies Identified
| Package | Version | Purpose |
|---------|---------|---------|
| `node:worker_threads` | Built-in Node.js | Parallel multi-core execution for `scripts/simulate-deck-balance.mjs` |
| `chess.js` | Existing (`^1.0.0-beta.8`) | Underlying board state & attack ray queries |

## Risks
- **Branching Factor Explosion when Hands Have Many Active Cards**: Mitigated by deduplicating hand card IDs, sorting captures/primed cards first (maximizing Alpha-Beta cutoffs), and using lightweight execution inside inner search plies.
- **Infinite Shuffling in Headless AI-vs-AI Games**: Mitigated in the simulation harness by adjudicating games at 80 plies (40 full moves) with a small random tie-breaker or material-lead adjudication, plus a slight repetition penalty in AI move selection.

## Ready for Planning
- [x] Questions answered
- [x] Contracts and invariants specified
- [x] Approach selected
- [x] Dependencies identified
