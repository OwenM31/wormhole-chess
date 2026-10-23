---
phase: 4
plan: 4
wave: 3
depends_on: ["01", "02", "03"]
files_modified:
  - scripts/verify-36-mechanics-edge-cases.ts
  - scripts/verify-phase4-gameplay-fixes.mjs
  - package.json
autonomous: true
user_setup: []

must_haves:
  truths:
    - "Comprehensive TDD suite verifies edge cases for all 36 cards including perpendicular R1 step-aside, check safety, pin safety, rank-8 promotions, and Black symmetry"
    - "Headless Playwright E2E test verifies piece-first standard moves execute without cards, card arm/disarm toggle works, and divert clicks auto-disarm cards"
    - "Headless Playwright E2E test verifies R1 Make Way multi-step staging from pawn step-aside to Rook destination"
    - "Headless Playwright E2E test verifies spent cards shift to the tail of the tactical hand"
    - "Full-stack typecheck, build, and npm test pass 100% green"
  artifacts:
    - "scripts/verify-36-mechanics-edge-cases.ts passes all card edge case assertions"
    - "scripts/verify-phase4-gameplay-fixes.mjs passes Playwright E2E verification and captures proof screenshots"
---

# Plan 4.4: 36-Card Mechanics TDD Test Suite & Playwright E2E Verification

<objective>
Author and execute the definitive validation suites for Phase 4:
1. `scripts/verify-36-mechanics-edge-cases.ts`: Contract-first TDD suite validating edge cases across all 36 cards (perpendicular R1, King safety rejection, Rank 8 promotions, Black symmetry, and Pin guards).
2. `scripts/verify-phase4-gameplay-fixes.mjs`: Playwright E2E browser verification testing standard moves, card arm/disarm toggles, divert clicks, R1 staging, and spent card tail reordering.

Purpose: Provide empirical proof that all four playtest issues are squashed and regression-free before phase sign-off.
Output: `scripts/verify-36-mechanics-edge-cases.ts`, `scripts/verify-phase4-gameplay-fixes.mjs`, updated `package.json`.
</objective>

<context>
Load for context:
- .agent/state/phases/4/RESEARCH.md
- scripts/verify-36-playbook.ts (TDD assertions format)
- scripts/verify-phase3-playtest.mjs (Playwright browser harness)
- src/engine/DeckChessEngine.ts
- src/hooks/useDeckChessGame.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Author 36-Card Mechanics Edge Case TDD Suite</name>
  <files>scripts/verify-36-mechanics-edge-cases.ts, package.json</files>
  <action>
    1. Create `scripts/verify-36-mechanics-edge-cases.ts`:
       - Suite 1: R1 Make Way Edge Cases:
         - Rook at a1, pawn at a2, b2 empty: generates move with `extraSquare: 'b2'`, Rook can slide to `a2, a3, a4, a5`.
         - Rook at a1, pawn at a2, b2 occupied by friendly pawn: 0 moves generated (blocked).
         - Rook at d1, pawn at d2, both c2 and e2 empty: generates 2 sets of moves (one with `extraSquare: 'c2'`, one with `extraSquare: 'e2'`).
         - Execution: executes move, asserts pawn moved to `extraSquare`, Rook moved to `to`, and any enemy captured.
       - Suite 2: King Check Invariant Enforcement:
         - Setup board where King is in check: attempts card move that does not resolve check -> asserts `makeEmpoweredMove` returns `success: false`.
         - Setup board where card move would expose friendly King: asserts `makeEmpoweredMove` returns `success: false`.
       - Suite 3: Pin Safety & Non-King Target Guards:
         - N4 Pin Swap: assert friendly King cannot be targeted or swapped with.
         - B5 Take My Place: assert friendly King cannot be targeted or swapped with.
         - P7 Protect the King: assert enemy King cannot be captured.
       - Suite 4: Universal Rank-8 Pawn Promotion:
         - Test P3 Follow Me pushing pawn to 8th rank -> asserts pawn promotes to Queen.
         - Test R2 I've Got Your Back pushing pawn to 8th rank -> asserts pawn promotes to Queen.
         - Test B1 Let Me Through swapping pawn to 8th rank -> asserts pawn promotes to Queen.
       - Suite 5: Black Player Orientation Symmetry:
         - Test P1, P2, P3, R1, B1 with `turn === 'b'`, verifying moves advance downwards (ranks decreasing) correctly.
    2. Wire `scripts/verify-36-mechanics-edge-cases.ts` into `package.json` `"test"` script.
  </action>
  <verify>npx tsx scripts/verify-36-mechanics-edge-cases.ts</verify>
  <done>All edge case assertions pass 100% green.</done>
</task>

<task type="auto">
  <name>Task 2: Playwright E2E Browser Verification Suite</name>
  <files>scripts/verify-phase4-gameplay-fixes.mjs</files>
  <action>
    1. Create `scripts/verify-phase4-gameplay-fixes.mjs`:
       - Spin up Vite dev server or use existing port.
       - Test 1 (Piece-First Standard Move):
         - Open offline match vs AI.
         - Click Pawn on e2 -> Click e3 -> Assert e2-e3 executes as normal chess move, no card is spent, no confirm bar.
       - Test 2 (Card Arming & Re-tap Disarm):
         - Click a piece with applicable cards in hand -> verify card highlights.
         - Click the highlighted card -> verify card is armed and board shows empowered rings.
         - Re-tap the same card -> verify card disarms and board reverts to normal move dots.
       - Test 3 (Divert Click):
         - Arm a card -> Click another friendly piece -> verify card auto-disarms and the new piece's standard moves appear.
       - Test 4 (Spent Card Reordering):
         - Play an empowered card move -> Click Green Check (`✓`) -> Assert the played card shifts to the end of the hand with grayed-out styling.
       - Test 5 (Mobile 375px Horizontal Scroll):
         - Set viewport to 375x812 -> Assert Tactical Hand Bar does not compress cards (<88px), and has `scrollWidth > clientWidth`.
       - Capture screenshots to `.agent/state/artifacts/screenshots/phase4_gameplay_standard_move.png`, `phase4_gameplay_card_armed.png`, `phase4_gameplay_spent_reorder.png`.
  </action>
  <verify>node scripts/verify-phase4-gameplay-fixes.mjs</verify>
  <done>Playwright E2E tests pass with 0 errors and proof screenshots captured.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm test` passes all test suites
- [ ] `npm run typecheck:all` passes with 0 errors
- [ ] `npm run build` succeeds
- [ ] `node scripts/verify-phase4-gameplay-fixes.mjs` exits with code 0
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
