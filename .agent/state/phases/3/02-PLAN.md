---
phase: 3
plan: 2
wave: 2
depends_on: ["01"]
files_modified:
  - src/engine/cards/cardRegistry.ts
  - scripts/verify-36-playbook.ts
  - package.json
autonomous: true
user_setup: []

must_haves:
  truths:
    - "All 36 cards (P1–P8, N1–N7, B1–B7, R1–R6, Q1–Q4, K1–K4) have 100% bespoke, exact CardBehaviorHandler implementations in src/engine/cards/cardRegistry.ts"
    - "Multi-ally disambiguation (extraSquare) works for P4 (Attack Together), N6 (Flanking Support), Q2 (The Queen's Gambit), and K3 (Royal Execution)"
    - "Complex board mutations (B3 Ricochet, B7 Bishop's Blessing, R4 Move in Unison, Q3 All Rise top-down pawn advance, Q4 One Fell Swoop multi-capture, K1 Conscription Rank 1 Pawn spawn, K4 Banish contiguous stack push) execute accurately"
    - "Automated TDD verification suite scripts/verify-36-playbook.ts passes 100% of assertions across all 36 cards"
  artifacts:
    - "src/engine/cards/cardRegistry.ts contains registered bespoke handlers for all 36 Playbook card IDs"
    - "scripts/verify-36-playbook.ts exists and passes via npm test"
---

# Plan 3.2: 36 Bespoke Card Handlers (`P1–K4`) & Comprehensive TDD Verification Suite

<objective>
Implement 100% bespoke, exact `CardBehaviorHandler` functions in `src/engine/cards/cardRegistry.ts` for all 36 cards in the Playbook (`P1–P8, N1–N7, B1–B7, R1–R6, Q1–Q4, K1–K4`) and verify every single card with an automated TDD test suite (`scripts/verify-36-playbook.ts`).

Purpose: Delivers the complete mechanical heart of the 36-Card Playbook with zero generic fallback handlers so the user can playtest every card against friends and AI.
Output: Updated `src/engine/cards/cardRegistry.ts` and `scripts/verify-36-playbook.ts`.
</objective>

<context>
Load for context:
- .agent/state/STORYBOARD.md
- .agent/state/DECISIONS.md
- .agent/state/phases/3/RESEARCH.md
- src/engine/cards/releaseRoster36.ts
- src/engine/cards/cardRegistry.ts
- src/engine/DeckChessEngine.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement Bespoke Minor Unit Handlers (8 Pawns P1–P8, 7 Knights N1–N7, 7 Bishops B1–B7)</name>
  <files>src/engine/cards/cardRegistry.ts</files>
  <action>
    In `src/engine/cards/cardRegistry.ts`, update `CardBehaviorHandler` so `getTargets` may return `Array<string | { to: string; extraSquare?: string; disambiguationPrompt?: string }>` and `execute` accepts `(engine, anchorSquare, targetSquare, extraSquare)`, then implement exact handlers for all 22 Minor Unit cards per `STORYBOARD.md`:
    - **Pawns (`P1–P8`)**:
      - `p1_sidestep`: Enemy directly in front (1 square forward) → step 1 square left or right onto an empty square.
      - `p2_head_on`: Enemy non-King Pawn (`type === 'p'`) directly in front → capture it straight ahead.
      - `p3_follow_me`: Friendly piece directly behind Pawn & square 1 step in front empty → move both 1 square straight forward.
      - `p4_attack_together`: Defended by at least 1 friendly Pawn on rear-diagonal → capture enemy non-King unit diagonally and move the defending friendly Pawn into the vacated square (if 2 friendly Pawns defend, emit both `extraSquare` options so the player chooses which defending Pawn advances).
      - `p5_get_behind_me`: Friendly piece on rear-diagonal behind Pawn & square directly behind Pawn is empty → move that ally 1 square horizontally into the square directly behind this Pawn (`targetSquare` = ally's starting rear-diagonal square or destination behind Pawn).
      - `p6_tag_out`: Friendly piece directly in front of Pawn → swap places with it (unless swapping puts a Pawn on Rank 1 or triggers illegal king check; if Pawn lands on Rank 8, `sweepPromotions()` promotes it).
      - `p7_protect_the_king`: While this Pawn is pinned to your King (`isPinnedToKing`) → destroy an enemy non-King piece on a forward-diagonal capture square in-place without moving this Pawn.
      - `p8_call_reserves`: Pawn in enemy territory (White Ranks 5–7, Black Ranks 4–2), friendly piece horizontally adjacent, empty square directly behind, and `engine.canSpawnPawn(turn)` → spawn a friendly Pawn on the empty square directly behind this Pawn.
    - **Knights (`N1–N7`)**:
      - `n1_adrenaline_jump`: Knight is under attack → jump `3×1` (`(|df|===3 && |dr|===1) || (|df|===1 && |dr|===3)`) onto an empty square or enemy non-King piece.
      - `n2_swap_with_me`: Friendly piece on a `(2,1)` Knight jump square → swap places with that friendly piece (disallow swapping a friendly Pawn onto its own Rank 1 back-rank unless allowed, and `sweepPromotions()` handles Rank 8).
      - `n3_trample`: Normal `(2,1)` jump onto an empty square where the 2-square straight leg (`(df=±2, dr=0)` or `(df=0, dr=±2)` from origin) has at least 1 enemy Pawn → move Knight to landing square and destroy any enemy Pawns on the 2 squares of that straight leg.
      - `n4_pin_swap`: While this Knight is pinned to your King → swap places with any friendly piece in the 8 surrounding squares.
      - `n5_get_to_the_king`: Your King is currently in check → jump this Knight from anywhere on the board to an empty square adjacent to your King that blocks/resolves the check (verified automatically by engine King-safety simulation).
      - `n6_flanking_support`: Knight on `a`-file or `h`-file and another friendly Knight exists on the board → make a normal `(2,1)` Knight move/capture and move the other friendly Knight into the vacated square (with `extraSquare` disambiguation if >1 other friendly Knight exists).
      - `n7_outpost_support`: Knight in enemy territory (White Ranks 5–8, Black Ranks 4–1), defended by a friendly Pawn on one rear-diagonal, other rear-diagonal square is empty, and `engine.canSpawnPawn(turn)` → spawn a friendly Pawn on that empty rear-diagonal square.
    - **Bishops (`B1–B7`)**:
      - `b1_let_me_through`: Friendly Pawn 1 square diagonally in front of Bishop → swap places with that Pawn.
      - `b2_pierce`: Unobstructed diagonal ray has 1 enemy Pawn followed by $\ge 1$ unobstructed empty squares beyond it → slide through that enemy Pawn, destroying it and landing on any unobstructed empty square beyond it.
      - `b3_ricochet`: Slide along an unobstructed diagonal to an empty square on the `a`-file or `h`-file and bounce 90° inward along the reflected diagonal any number of unobstructed squares (onto an empty square or enemy non-King unit; include `extraSquare` = bounce square if 2 different edge bounces reach the same `targetSquare`).
      - `b4_change_color`: Bishop on home corner square (`a1` or `h1` for White; `a8` or `h8` for Black) → step 1 square orthogonally onto an empty adjacent square.
      - `b5_take_my_place`: While this Bishop is pinned to your King → swap places with a friendly piece along any of this Bishop's unobstructed diagonals.
      - `b6_come_this_way`: Bishop on `d4, d5, e4, e5` and a friendly Pawn lies along an unobstructed diagonal at distance $\ge 2$ → pull that friendly Pawn along the diagonal to the square 1 tile diagonally adjacent to this Bishop (`targetSquare` = the Pawn's starting square so clicking the Pawn pulls it in).
      - `b7_bishops_blessing`: Friendly piece (including your King) is directly behind (1 square South for White, 1 square North for Black) this Bishop → move that friendly piece any number of unobstructed squares along the diagonals of its current square color (move or capture enemy non-King), while this Bishop stays in place (`targetSquare` = destination square of that blessed ally).
    AVOID: Allowing any card to capture an enemy King (`targetPiece.type === 'k'`).
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>All 22 Minor Unit handlers (`P1–P8, N1–N7, B1–B7`) are registered and compile cleanly.</done>
</task>

<task type="auto">
  <name>Task 2: Implement Bespoke Major Unit Handlers (6 Rooks R1–R6, 4 Queens Q1–Q4, 4 Kings K1–K4)</name>
  <files>src/engine/cards/cardRegistry.ts</files>
  <action>
    In `src/engine/cards/cardRegistry.ts`, implement exact handlers for all 14 Major Unit cards per `STORYBOARD.md`:
    - **Rooks (`R1–R6`)**:
      - `r1_make_way`: Friendly Pawn orthogonally adjacent to Rook and the square 1 step beyond that Pawn along the same ray is empty → push that Pawn 1 square away along that ray and move this Rook into the square the Pawn vacated.
      - `r2_ive_got_your_back`: Friendly unit on the same rank as Rook (with no pieces between them) and the square 1 rank straight ahead of that friendly unit is empty → push that friendly unit 1 square straight forward and slide this Rook horizontally into the square it vacated.
      - `r3_cut_across`: Rook sits on one of the two 8-square main diagonals (`a1–h8` where `file === rank`, or `a8–h1` where `file + rank === 7`) → step 1 square diagonally along that main diagonal (onto an empty square or enemy non-King unit).
      - `r4_move_in_unison`: Two friendly Rooks share the same rank or file with no pieces between them → slide both Rooks the exact same number of unobstructed squares $k \ge 1$ in the same perpendicular direction (each landing on an empty square or capturing an enemy non-King unit).
      - `r5_catapult`: Friendly non-King piece is directly behind/orthogonally adjacent to Rook at `(-df, -dr)`, and an enemy non-King unit lies along the opposite unobstructed orthogonal ray `(df, dr)` in front → launch that friendly piece over this Rook to land on and capture that enemy unit (Rook stays in place).
      - `r6_garrison`: Friendly King is directly behind (1 square South for White, 1 square North for Black) this Rook, the square 1 step directly in front of this Rook is empty, and `engine.canSpawnPawn(turn)` → spawn 1 friendly Pawn onto the empty square directly in front of this Rook.
    - **Queens (`Q1–Q4`)**:
      - `q1_royal_summons`: Friendly Pawn lies on this Queen's unobstructed rank or file at distance $\ge 2$ → pull that Pawn along the line onto the empty square orthogonally adjacent to this Queen (`targetSquare` = the Pawn's starting square or adjacent landing square; support clicking the Pawn to summon it).
      - `q2_the_queens_gambit`: Friendly non-King unit in this Queen's unobstructed 8-direction line of sight is under pseudo-legal attack by at least one enemy non-King unit → remove that friendly unit to your graveyard and move this Queen directly onto the attacking enemy unit's square, capturing it (`targetSquare` = attacking enemy's square; `extraSquare` = sacrificed friendly unit's square when >1 friendly unit in LoS is attacked by that same enemy).
      - `q3_all_rise`: Queen is on relative Ranks 2–8 and at least one friendly Pawn on a strictly lower relative rank (`pawnRelRank < queenRelRank`) has an empty square 1 step straight forward → evaluating from highest rank down to lowest rank, advance every friendly Pawn on a strictly lower rank 1 square straight forward if unobstructed (`targetSquare` = `anchorSquare` so selecting the card/Queen previews the entire Pawn wave immediately).
      - `q4_one_fell_swoop`: Supported from behind by a directly adjacent friendly Rook, Bishop, or second Queen at `(-df, -dr)` whose attack geometry matches the ray `(df, dr)` (orthogonal for Rook/Queen, diagonal for Bishop/Queen), where the forward ray `(df, dr)` contains $\ge 1$ enemy non-King unit, $0$ friendly units, and terminates at the board edge or the square immediately before the enemy King → move this Queen to the end of that ray (`targetSquare`), capturing every enemy unit along the ray into the graveyard.
    - **Kings (`K1–K4`)**:
      - `k1_conscription`: Your King is on a home corner square (`a1` or `h1` for White; `a8` or `h8` for Black) with at least 1 empty orthogonally adjacent square and `engine.canSpawnPawn(turn)` → spawn a friendly Pawn onto each empty orthogonally adjacent square (up to 2 Pawns; respects `limitPawnsTo8` if enabled).
      - `k2_royal_knighting`: Friendly Pawn is horizontally adjacent (1 square left or right on the same rank) to your King → remove that friendly Pawn to your graveyard and spawn a friendly Knight onto that exact square (`targetSquare` = that Pawn's square).
      - `k3_royal_execution`: Friendly non-King unit is orthogonally adjacent to your King, and an enemy non-King unit at `targetSquare` could be legally captured by that ally if that ally were standing on your King's square (ignoring both the King and the ally's current square for line-of-sight) → move that friendly unit directly onto `targetSquare`, capturing the enemy (`extraSquare` = the orthogonally adjacent ally's square).
      - `k4_banish`: Along the same file and in front of your King, the first unit encountered is an enemy non-King unit on relative Ranks 1–4, every unit in the contiguous vertical stack $S$ of enemy non-King units extending backward from it is also on relative Ranks 1–4, and the square immediately behind the topmost unit of $S$ is empty → push the entire contiguous stack $S$ backward along the file toward relative Rank 8 as a rigid block until the topmost unit reaches relative Rank 8 or stops immediately before another piece (at relative Rank $\ge 5$).
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>All 14 Major Unit handlers (`R1–R6, Q1–Q4, K1–K4`) are registered in `cardRegistry.ts` and compile with 0 errors.</done>
</task>

<task type="auto">
  <name>Task 3: Author & Run Comprehensive 36-Card Playbook TDD Suite (scripts/verify-36-playbook.ts)</name>
  <files>scripts/verify-36-playbook.ts, package.json</files>
  <action>
    1. Create `scripts/verify-36-playbook.ts` testing:
       - Roster integrity: Exactly 36 cards (`8P, 7N, 7B, 6R, 4Q, 4K`) with codes `P1..K4`, zero ellipses, and piece-class color themes (`Gray, Green, Blue, Purple, Red, Gold`).
       - Individual board tests for all 36 cards (`P1–P8, N1–N7, B1–B7, R1–R6, Q1–Q4, K1–K4`):
         - Verifies condition check fails when board setup does not match, and passes when met.
         - Verifies `getEmpoweredMoves()` returns expected `to`, `extraSquare` (when disambiguated), and `previewFen`.
         - Verifies `makeEmpoweredMove()` mutates the board accurately, updates graveyards, consumes the card from hand without requiring Energy, and advances turn.
       - Global Invariant tests:
         - Rank 1 Pawn spawned by `K1 Conscription` (e.g. White Pawn on `b1`) loads without error and can step 1 square forward (`b1 -> b2`), and from `b2` can step 1 or 2 squares (`b2 -> b3` or `b2 -> b4`).
         - Rank 8 Instant Promotion sweep works when a secondary Pawn is pushed onto Rank 8 (`P3 Follow Me`, `R1 Make Way`, `R2 I've Got Your Back`, `Q3 All Rise`).
         - `limitPawnsTo8` toggle prevents spawning a 9th Pawn when enabled and allows it when disabled.
    2. Update `package.json` `"test"` script to run `npx tsx scripts/verify-36-playbook.ts` (and keep existing tests runnable).
    AVOID: Modifying test assertions to weaken any of the 36 card rules in `STORYBOARD.md`.
  </action>
  <verify>npm test</verify>
  <done>`npm test` executes `scripts/verify-36-playbook.ts` and passes 100% of assertions across all 36 cards and global invariants.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm test` passes 100% green across all 36 cards (`P1–K4`) and global engine invariants
- [ ] `npx tsc --noEmit` exits with code 0
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
