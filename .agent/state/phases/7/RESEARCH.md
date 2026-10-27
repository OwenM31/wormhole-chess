# Phase 7 Research: 36-Card Ability Overhaul, Board Preview Arrows & Tournament Re-Simulation

> **Phase**: 7
> **Date**: 2026-10-27
> **Status**: Complete
> **Decision Reference**: `[DECISION-036]`

---

## 1. Architectural Scope & Objectives

Phase 7 overhauls 27 of the 36 cards in the first-release abundance pyramid (`8 Pawn, 7 Knight, 7 Bishop, 6 Rook, 4 Queen, 4 King`) based on empirical findings from the Phase 6 tournament simulation (`.agent/state/phases/6/BALANCE_REPORT.md`) and our piece-by-piece design audit (`[DECISION-036]`).

Every card in the 36-card roster is aligned around two core principles:
1. **Natural Condition**: Triggers organically from how that piece actually plays in chess (or when it encounters its classic chess frustration), with zero reused passive conditions.
2. **High-Value Effect**: Either overcomes the piece's classic limitation or supercharges its signature strength.

Additionally, Phase 7 upgrades the board UI (`DeckChessBoard.tsx` and `useDeckChessGame.ts`) to support:
- **Under-Piece SVG Preview Arrows (`z-[6]` below `z-10` pieces)** for `N3: Trample` (`2x1` vs `1x2` L-paths), `N5: Get to the King` (`Knight -> S1 -> S2` fork path), and `Q2: The Queen's Gambit` (`Queen -> Threatened Ally` sight arrow + `Threatened Ally -> Attacker` arrow).
- **2-Click Fork Staging for `N5: Get to the King`**: Clicking the armed Knight highlights the safe forking square(s) `S1` (`extraSquare`); clicking `S1` then reveals all valid second-hop L-jump squares `S2` (`to`).

---

## 2. Canonical 36-Card Specification Matrix (`[DECISION-036]`)

### 2.1 Pawns (`P1–P8`)

| Code | ID | Name | World | Condition | Effect | Handler / Engine Notes |
| :---: | :--- | :--- | :---: | :--- | :--- | :--- |
| **P1** | `p1_sidestep` | **Sidestep** | 1 | Pawn has any piece (enemy or friendly) directly in front of it (`(file, rank + dir)`). | Step 1 square diagonally forward (`(file ± 1, rank + dir)`) onto an empty square. | Inverts normal Pawn movement (diagonal onto empty when blocked straight ahead). |
| **P2** | `p2_head_on` | **Attack Head On** | 1 | Pawn has an enemy Pawn directly in front of it. | Capture that enemy Pawn straight ahead. | **Unchanged** (`62.5%` play rate). |
| **P3** | `p3_follow_me` | **March Together** | 1 | Two friendly Pawns stand horizontally adjacent (`(file ± 1, rank)`) on the same rank with empty squares directly in front of both. | Advance both friendly Pawns 1 square straight forward together. | Keep `id: 'p3_follow_me'` for profile/catalog compatibility; update `name: 'March Together'`, `minAnchorsRequired: 2`. |
| **P4** | `p4_attack_together` | **Attack Together** | 3 | Pawn can capture an enemy piece diagonally ahead AND has a friendly Pawn in its 8 surrounding squares. | Capture the enemy piece and move that adjacent friendly Pawn into the vacated origin square. | Expanded from rear-diagonal only to all 8 surrounding squares (`chebyshev === 1`, excluding the capturing pawn itself). |
| **P5** | `p5_get_behind_me` | **Get Behind Me** | 4 | Friendly non-Pawn, non-King piece in the 3 forward squares (`(file - 1..file + 1, rank + dir)`) ahead of this Pawn is under standard enemy attack. | Swap places with that attacked friendly piece. | Heroic rescue swap; `to` is the attacked ally's square. |
| **P6** | `p6_tag_out` | **Double Time** | 5 | Pawn is on relative Rank 3, 4, or 5 (`relRank` 2, 3, or 4 in 0-indexed) with 2 empty squares directly in front of it. | Advance this Pawn 2 squares straight forward. | Keep `id: 'p6_tag_out'`, update `name: 'Double Time'`. |
| **P7** | `p7_protect_the_king` | **Protect the King** | 6 | Friendly King is in this Pawn's 8 surrounding squares (`chebyshev === 1`). | Slide this Pawn any number of unobstructed squares along a diagonal to move or capture (like a Bishop). | Replaces rare king-pin condition with King-shield Bishop-slide. |
| **P8** | `p8_call_reserves` | **Call Reserves** | 7 | Pawn is in enemy territory (relative Ranks 5–7, `relRank` 4..6) with at least 1 empty rear-diagonal square (`(file ± 1, rank - dir)`). | Spawn a friendly Pawn onto an empty rear-diagonal square behind this Pawn. | Respects `engine.canSpawnPawn(turn)` (`< 8` pawns). Creates an instant Pawn Chain rather than doubled pawns. |

### 2.2 Knights (`N1–N7`)

| Code | ID | Name | World | Condition | Effect | Handler / Engine Notes |
| :---: | :--- | :--- | :---: | :--- | :--- | :--- |
| **N1** | `n1_adrenaline_jump` | **Adrenaline Jump** | 1 | Knight is under attack. | Jump 3 squares orthogonal and 1 perpendicular (`3x1` jump, move or capture). | **Unchanged** (`+380cp` avg swing). |
| **N2** | `n2_swap_with_me` | **Springboard** | 1 | Friendly piece occupies one of this Knight's `(2,1)` L-jump squares (`S1`). | Bounce off that friendly piece's square `S1` to make a second full `(2,1)` Knight L-jump from `S1` to `S2` (move or capture, `S2 !== anchorSquare`). | Keep `id: 'n2_swap_with_me'`, update `name: 'Springboard'`. Store `extraSquare: S1` (the springboard ally square). |
| **N3** | `n3_trample` | **Trample** | 2 | At least 1 enemy Pawn lies on the 2-square straight leg of either the `2x1` (straight-first) or `1x2` (turn-first) L-jump path to landing square `to` (empty or enemy non-King). | Jump to `to` (move or capture) and destroy any enemy Pawns on the chosen path's 2-square leg. | Check both Path A (`2-then-1`: `(f+sf, r+sr)` and `(f+2*sf, r+2*sr)`) and Path B (`1-then-2`: `(f+tf, r+tr)` followed by 2 straight steps `(f+tf+sf, r+tr+sr)` and `(f+tf+2*sf, r+tr+2*sr)` -> wait: the 2-square straight leg of `1x2` is `(f+tf, r+tr)` and `(f+tf+sf, r+tr+sr)`!). Set `extraSquare` to the first trampled pawn square on that path; include `metadata.arrowPaths` for SVG rendering. |
| **N4** | `n4_pin_swap` | **Square Jump** | 3 | Knight is defended by any friendly piece (a friendly piece could legally/pseudo-legally attack the Knight's square). | Jump 2 squares diagonally (`(±2, ±2)`) in any direction, leaping over any intermediate piece to move or capture. | Keep `id: 'n4_pin_swap'`, update `name: 'Square Jump'`. |
| **N5** | `n5_get_to_the_king` | **Get to the King** | 4 | Knight can make a normal L-jump to square `S1` (empty or enemy non-King capture) such that: (1) from `S1` the Knight attacks the enemy King AND at least 1 other enemy non-King piece (a Royal Fork), and (2) after moving the Knight from `anchorSquare` to `S1`, `S1` is NOT attacked by any standard enemy chess move. | Jump to `S1` (capturing any enemy on `S1`), then immediately make a second L-jump from `S1` to any valid square `S2` (`S2 !== anchorSquare`, empty or enemy non-King capture). | `extraSquare = S1` (forking square), `to = S2` (final square). Marked with `stageExtraSquareFirst: true` so UI highlights `S1` on first click and `S2` on second click. |
| **N6** | `n6_flanking_support` | **Flanking Support** | 3 | Knight is on file `a, b, g, or h` (`file <= 1 || file >= 6`) and another friendly Knight is on the board. | Make a normal Knight jump (move or capture), and teleport the other friendly Knight into the vacated square. | Widened from `a/h` to `a, b, g, h` files. |
| **N7** | `n7_outpost_support` | **Outpost Support** | 7 | Knight is on relative Ranks 5–8 (`relRank >= 4`) with at least 1 empty rear-diagonal square (`(file ± 1, rank - dir)`). | Spawn a friendly Pawn onto an empty rear-diagonal square behind this Knight. | Dropped the "already defended by rear-diagonal Pawn" requirement. |

### 2.3 Bishops (`B1–B7`)

| Code | ID | Name | World | Condition | Effect | Handler / Engine Notes |
| :---: | :--- | :--- | :---: | :--- | :--- | :--- |
| **B1** | `b1_let_me_through` | **Let Me Through** | 1 | Friendly Pawn sits on this Bishop's unobstructed forward diagonal (`dr === dir`). | Slide cleanly *through* that friendly Pawn to any unobstructed square beyond it along the same diagonal (empty or enemy non-King capture). | Friendly Pawn stays in place; Bishop phases through it. |
| **B2** | `b2_pierce` | **Pierce** | 2 | Exactly 1 enemy Pawn sits on an unobstructed diagonal from this Bishop with at least 1 unobstructed square beyond it. | Slide through and destroy that enemy Pawn, landing on any unobstructed empty square **or capturing the first enemy non-King piece** beyond it along that diagonal. | Upgraded to allow capturing an enemy piece behind the pierced Pawn (`extraSquare = piercedPawnSq`). |
| **B3** | `b3_ricochet` | **Ricochet** | 3 | Empty square on `a`-file or `h`-file lies along unobstructed diagonal. | Slide to rim and bounce 90° inward along reflected diagonal (move or capture). | **Unchanged** (`31.3%` play rate). |
| **B4** | `b4_change_color` | **Change Color** | 4 | At least 1 enemy piece is orthogonally adjacent (`N/S/E/W`, distance 1) to this Bishop. | Step 1 square orthogonally (`N/S/E/W`) onto an empty square OR capture an orthogonally adjacent enemy non-King piece, permanently switching square color. | Replaces `a1/h1` corner condition with orthogonal blind-spot ambush. |
| **B5** | `b5_take_my_place` | **Take My Place** | 4 | This Bishop is currently under attack by any enemy piece. | Swap places with any friendly non-King piece along any of this Bishop's unobstructed diagonals. | Broadened from "pinned to King" to "under attack". |
| **B6** | `b6_come_this_way` | **Diagonal Launch** | 4 | Friendly Pawn sits on any of the 3 squares in the rank directly ahead of this Bishop (`(file - 1, rank + dir)`, `(file, rank + dir)`, `(file + 1, rank + dir)`). | Launch that friendly Pawn any number of unobstructed squares along the Pawn's forward diagonals (`df = ±1, dr = dir`) to move or capture, while the Bishop stays in place. | Keep `id: 'b6_come_this_way'`, update `name: 'Diagonal Launch'`. `extraSquare = pawnSq`, `to = destSq`. |
| **B7** | `b7_bishops_blessing` | **Bishop's Blessing** | 7 | Friendly non-Bishop piece is in this Bishop's 8 surrounding squares (`chebyshev === 1`). | Move that adjacent friendly piece any number of unobstructed squares along the diagonals of its current square (move or capture), while the Bishop stays in place. | Expanded from "directly behind Bishop" to all 8 surrounding squares (`extraSquare = allySq`, `to = destSq`). |

### 2.4 Rooks (`R1–R6`)

| Code | ID | Name | World | Condition | Effect | Handler / Engine Notes |
| :---: | :--- | :--- | :---: | :--- | :--- | :--- |
| **R1** | `r1_make_way` | **Make Way** | 1 | Friendly Pawn is orthogonally adjacent and has an empty perpendicular square. | Pawn steps aside perpendicular, and Rook slides to any open square along the opened line. | **Unchanged** (`+178cp` avg swing). |
| **R2** | `r2_ive_got_your_back` | **I've Got Your Back** | 2 | Friendly non-King unit sits on the same rank unobstructed, and the square 1 rank forward (`rank + dir`) of that unit is empty OR occupied by an enemy non-King piece. | Push that friendly unit 1 square straight forward (to move or capture) and slide the Rook into the square the ally vacated. | Upgraded to allow the pushed ally to capture an enemy on `(allyFile, rank + dir)`. |
| **R3** | `r3_cut_across` | **Cut Across** | 2 | Rook sits on either main diagonal (`a1-h8` or `a8-h1`). | Step 1 square diagonally along that main diagonal (move or capture). | **Unchanged** (`+352cp` avg swing). |
| **R4** | `r4_move_in_unison` | **Move in Unison** | 5 | Two friendly Rooks can see each other along an unobstructed rank or file. | Move this Rook any unobstructed distance along its rank or file (move or capture), and move the second friendly Rook into the square this Rook just vacated. | Replaces perpendicular unison slide with tandem follow-into-vacated-square (`extraSquare = otherRookSq`). |
| **R5** | `r5_catapult` | **Catapult** | 5 | Friendly non-King piece is directly orthogonally adjacent (`N/S/E/W`) to this Rook, and an enemy non-King piece lies along the unobstructed ray beyond that friendly piece. | Launch that friendly piece over the open ray to capture that enemy piece (Rook stays in place). | Flipped geometry: friendly piece is at `rook + (df, dr)` (in front of Rook along the ray), and enemy is at `rook + k * (df, dr)` (`k >= 2`) with empty squares `2..k-1`. |
| **R6** | `r6_garrison` | **Garrison** | 6 | Rook is orthogonally adjacent (`N/S/E/W`, `manhattan === 1`) to your friendly King, and the square 1 rank in front of the Rook (`(file, rank + dir)`) is empty. | Spawn 1 friendly Pawn onto the empty square 1 rank in front of the Rook. | Expanded from "King strictly behind Rook" to all 4 orthogonal directions (`N/E/S/W`). |

### 2.5 Queens (`Q1–Q4`)

| Code | ID | Name | World | Condition | Effect | Handler / Engine Notes |
| :---: | :--- | :--- | :---: | :--- | :--- | :--- |
| **Q1** | `q1_royal_summons` | **Royal Summons** | 5 | Any friendly non-King piece lies in the Queen's 8-directional unobstructed line of sight at `distance >= 2`. | Pull that friendly piece along the ray onto the empty square immediately adjacent to the Queen (`queen + (df, dr)`). | Expanded from Pawns on rank/file only to any friendly non-King piece along all 8 rays. |
| **Q2** | `q2_the_queens_gambit` | **The Queen's Gambit** | 6 | Friendly non-King piece in the Queen's 8-directional unobstructed line of sight is under standard enemy attack by an enemy non-King piece. | Sacrifice that friendly piece to the graveyard and move the Queen onto the attacking enemy piece's square to capture it. | Mechanics preserved; attach `metadata.arrows` (`[{ from: anchorSquare, to: allySq, style: 'sight' }, { from: allySq, to: enemySq, style: 'attack' }]`) for board preview SVG rendering. |
| **Q3** | `q3_all_rise` | **Royal Shield** | 6 | Friendly Pawn is 1 square away from the Queen along any of the 8 rays (`pawnSq = queen + (df, dr)`), with at least 1 unobstructed square beyond that Pawn (`k >= 2`, empty or enemy non-King). | Slide the Queen along that ray behind the Pawn: the Pawn lands on target square `T = queen + k * (df, dr)` (moving or capturing), and the Queen lands 1 step behind it on `T - (df, dr)`. | Keep `id: 'q3_all_rise'`, update `name: 'Royal Shield'`. Zero disambiguation needed because the ray `(df, dr)` uniquely identifies `pawnSq = queen + (df, dr)`. |
| **Q4** | `q4_one_fell_swoop` | **One Fell Swoop** | 7 | Queen is supported from behind along a shared ray by a friendly `R/B/Q` (with **any number of empty squares** between the supporter and the Queen) and at least 1 enemy non-King piece ahead along that ray. | Move the Queen along the forward ray to the last valid square (or last enemy square), capturing every enemy non-King piece along the path in a single sweep. | Removed the `distance === 1` restriction between supporter and Queen; scan backward along `(-df, -dr)` through empty squares to find supporting `R/Q` (orthogonal) or `B/Q` (diagonal). |

### 2.6 Kings (`K1–K4`)

| Code | ID | Name | World | Condition | Effect | Handler / Engine Notes |
| :---: | :--- | :--- | :---: | :--- | :--- | :--- |
| **K1** | `k1_conscription` | **Conscription** | 5 | King is anywhere on its home back rank (`Rank 1` for White, `Rank 8` for Black) with at least 1 empty orthogonally adjacent square (`N/E/W`). | Spawn a friendly Pawn onto each empty orthogonally adjacent square around the King (up to 3 Pawns, respecting `canSpawnPawn`). | Expanded from `a1/h1` corners to all 8 squares on the owner's back rank (`relRank === 0`). Valid to block orthogonal checks on Rank 1. |
| **K2** | `k2_royal_knighting` | **Royal Knighting** | 3 | Friendly Pawn is horizontally adjacent (`(file ± 1, rank)`) to the King. | Remove that friendly Pawn to the graveyard and spawn a friendly Knight onto that exact square. | **Unchanged** (`25.0%` play rate, `+96cp` avg swing). |
| **K3** | `k3_royal_execution` | **Royal Execution** | 6 | King has an enemy non-King piece in its 8-directional unobstructed line of sight AND has a friendly non-King piece in the King's 8 surrounding squares (`chebyshev === 1`, excluding an ally that is the only blocker on that ray unless it's the target ray). | Launch that adjacent friendly piece directly onto the enemy piece's square to capture it (`extraSquare = allySq`, `to = enemySq`). | Simplified to a clean "Launch adjacent bodyguard at any enemy in King's sightline" rule. |
| **K4** | `k4_banish` | **Turncoat** | 7 | An enemy Pawn is in your King's 8 surrounding squares (`chebyshev === 1`). | Convert that enemy Pawn in-place into a friendly Pawn under your control (King stays in place). | Keep `id: 'k4_banish'`, update `name: 'Turncoat'`. |

---

## 3. UI & Board Preview Arrow Architecture (`N3`, `N5`, `Q2`)

### 3.1 `BoardArrow` Metadata Contract (`src/types/deckChess.ts`)
Extend `EmpoweredMove` (or `EmpoweredMove.metadata`) with optional structured arrow descriptors:
```ts
export interface BoardPreviewArrow {
  points: string[]; // Ordered list of squares, e.g. ['b1', 'b2', 'b3', 'c3'] for L-path or ['d1', 'd4'] for straight ray
  color?: 'gold' | 'green' | 'red' | 'cyan';
  dashed?: boolean;
}
```
In `DeckChessBoard.tsx`:
- Inside `<div data-testid="chessboard-grid">`, render an `<svg data-testid="board-preview-arrows" viewBox="0 0 800 800" className="absolute inset-0 w-full h-full pointer-events-none z-[6]">` layer.
- Because `z-[6]` sits strictly above square backgrounds (`z-0`) and below piece SVGs (`relative z-10`), **all chess pieces remain 100% visible on top of the arrows**.
- Helper `squareToSvgCoords(sq: string, orientation: PieceColor): { x: number; y: number }`:
  - Converts `sq` (`a1..h8`) to `x = fileDisplayIndex * 100 + 50`, `y = rankDisplayIndex * 100 + 50`.
- When `pendingCardMove`, `disambiguationCandidates`, or `empoweredMoves` (for `n3_trample`, `n5_get_to_the_king`, `q2_the_queens_gambit`) are active:
  - **`N3: Trample`**: Renders `<polyline>` elbow path(s) for the `2x1` and/or `1x2` L-jump path(s) showing exactly which squares are traversed under the pieces.
  - **`N5: Get to the King`**: Renders `<polyline>` for `Origin -> S1` (and `S1 -> S2` once `S1` is chosen or previewed).
  - **`Q2: The Queen's Gambit`**: Renders Arrow 1 (`Queen -> Threatened Ally` in gold/green) and Arrow 2 (`Threatened Ally -> Attacker` in crimson red).

### 3.2 Multi-Step Staging Distinction (`useDeckChessGame.ts`)
Cards with `extraSquare` fall into two distinct interaction patterns:
1. **`extraSquare`-First Staging (`r1_make_way`, `n5_get_to_the_king`)**:
   - The player selects the anchor piece (Rook for `R1`, Knight for `N5`), then clicks `extraSquare` **first** (the Pawn step-aside tile for `R1`, or the safe forking square `S1` for `N5`), which then narrows `empoweredMovesForSelected` to show the final `to` squares (`S2` for `N5`, or Rook destinations for `R1`).
   - Note: For `n5_get_to_the_king`, even when there is only **1** valid forking square `S1` (`extraSquares.length === 1`), selecting the Knight must enter `disambiguationCandidates` first so the player explicitly clicks the forking square `S1` before choosing `S2`.
2. **`to`-First Staging (All other `extraSquare` cards: `p4_attack_together`, `n2_swap_with_me`, `n3_trample`, `n6_flanking_support`, `b2_pierce`, `b6_come_this_way`, `b7_bishops_blessing`, `r4_move_in_unison`, `q2_the_queens_gambit`, `k3_royal_execution`)**:
   - Selecting the anchor piece immediately displays all valid destination squares `m.to` on the board.
   - When the player clicks a destination square `to`:
     - If only **1** candidate move matches `m.to === square`, it immediately enters `pendingCardMove` (`✓ / ✕` confirmation preview)!
     - If **2 or more** candidate moves share `m.to === square` (e.g., two different L-paths in `N3: Trample` both have an enemy Pawn, or two adjacent Pawns can fill the vacated square in `P4`, or two bodyguards can execute in `K3`), it sets `disambiguationCandidates(matchingEmpowered)` so the player clicks which `extraSquare` to use!

---

## 4. Execution Wave Structure

To maintain 100% file ownership isolation within each wave and 2–3 atomic tasks per plan:
- **Wave 1**:
  - **Plan 7.1**: Roster Metadata (`releaseRoster36.ts`, `STORYBOARD.md`, `deckChess.ts`) + Pawn (`P1–P8`) & Bishop (`B1–B7`) Handler Overhaul (`playbook36Handlers.ts` part 1) & TDD Contract Suite (`scripts/verify-phase7-overhaul.ts`).
- **Wave 2**:
  - **Plan 7.2**: Knight (`N1–N7`), Rook (`R1–R6`), Queen (`Q1–Q4`) & King (`K1–K4`) Handler Overhaul (`playbook36Handlers.ts` part 2) & AI Setup Heuristics (`DeckChessAI.ts`).
  - **Plan 7.3**: 2-Click Staging (`useDeckChessGame.ts`) & Under-Piece SVG Board Preview Arrows (`DeckChessBoard.tsx`) for `N3`, `N5`, and `Q2`. *(Disjoint files from Plan 7.2!)*
- **Wave 3**:
  - **Plan 7.4**: Legacy Playbook & Edge-Case Test Suite Alignment (`scripts/verify-36-playbook.ts`, `scripts/verify-36-mechanics-edge-cases.ts`, `scripts/verify-phase7-e2e.mjs`) + Multi-Worker Monte Carlo Tournament Re-Simulation (`.agent/state/phases/7/BALANCE_REPORT.md` & `.agent/state/phases/6/BALANCE_REPORT.md`).
