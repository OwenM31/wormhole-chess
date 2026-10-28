# Phase 9 Verification Report: In-Game Read-Only Rewind Scrubber & Interactive Move Log

## Phase Goal & Scope
Implement the Chess.com-style horizontal move stream on mobile (< lg), the 2-column move table on desktop (>= lg), cell-by-cell tactical green (`#3FB950`) tracking highlights, piece-colored card tags (`[P1]`–`[K4]`), complete engine snapshot captures, read-only board interaction guards, and 1-click return-to-live navigation.

---

## Must-Haves Verification

### 1. Data Contracts & State Machine Invariants
- [x] **Every move or card play records standard SAN notation, piece-coded card tags (e.g. `[N1]`), and complete `DeckChessEngineState` snapshot** — VERIFIED:
  - `src/hooks/useDeckChessGame.ts` enriches every `RecordedTurn` across `makeMove`, `confirmPendingCardMove`, `triggerAiTurn`, and `applyRemoteTurn`.
  - Evidence: `scripts/verify-phase9-rewind-state.ts` Suite 1, 2, and 3 pass 100% green.
- [x] **Stepping backward/forward (-1 .. totalMoves - 1) restores the exact historical FEN, hands, graveyards, modifiers, and position evaluation** — VERIFIED:
  - `displayedState` useMemo in `useDeckChessGame.ts` dynamically projects `initialStateSnapshotRef` at `index = -1` and `recordedTurns[viewIndex]` at `index >= 0`.
  - Evidence: Verified in `scripts/verify-phase9-rewind-state.ts` Suite 4 (boundary clamping, underflow clamp at -1, auto-live restore at latest move).
- [x] **Card tags display piece frame colors: Pawn `#8A9199`, Knight `#3FB950`, Bishop `#3B82F6`, Rook `#A855F7`, Queen `#EF4444`, King `#D4AF37`** — VERIFIED:
  - Verified across all 36 cards via `getCardTag` in `src/utils/moveNotation.ts`.
  - Evidence: `scripts/verify-phase9-rewind-state.ts` Suite 1 confirms 36/36 valid mappings.

### 2. Viewport UI & Interaction Fidelity
- [x] **`<MoveStreamMobile />` renders directly below the Tactical Hand on mobile with edge fade gradient, single-arrow buttons `[ ‹ ]` and `[ › ]`, and tactical green active pill** — VERIFIED:
  - Rendered in `DeckBuilderPage.tsx` and `PlayRoomPage.tsx` with CSS gradient mask.
  - Evidence: `scripts/verify-phase9-e2e.mjs` Scenario 1 passed in Chromium (`375x667`). Screenshot: `.agent/state/phases/9/phase9_mobile_move_stream.png`.
- [x] **`<MoveTableDesktop />` renders 2-column table with turn numbers, piece-colored card tags, cell-by-cell green highlight moving across White and Black, and bottom transport bar** — VERIFIED:
  - Rendered in Right Column's Moves tab with `Turn | White | Black` layout.
  - Evidence: `scripts/verify-phase9-e2e.mjs` Scenario 2 passed in Chromium (`1280x800`). Screenshot: `.agent/state/phases/9/phase9_desktop_move_table.png`.
- [x] **Zero Page Jumping (`window.scrollY === 0`) on Mobile** — VERIFIED:
  - Container-scoped scrolling (`scrollTo({ left: ..., top: ... })`) prevents unexpected browser window scrolls.
  - Evidence: Playwright asserts `window.scrollY === 0` after moves and stepping.
- [x] **Read-only interaction guard and 1-click return to Live** — VERIFIED:
  - While `isViewingHistory === true`, board clicks and card plays are non-mutating.
  - Top `"⏪ Viewing Past Move — Click to Return Live"` board banner and `[ LIVE ]` bottom table button restore Live mode in 1 click.
  - Evidence: Playwright asserts board clicks do not mutate history, and clicking `[ LIVE ]` restores live state.

---

## Automated Test Evidence

| Test Suite | Command | Result |
|---|---|---|
| Contract & State Machine Suite | `npx tsx scripts/verify-phase9-rewind-state.ts` | **63/63 Passed (100% Green)** |
| Playwright E2E Browser Suite | `node scripts/verify-phase9-e2e.mjs` | **All Scenarios Passed (0 Errors)** |
| Deck Chess Regression Unit Tests | `npm test` | **43/43 Passed (0 Errors)** |
| TypeScript Full Project Typecheck | `npm run typecheck:all` | **0 Errors** |
| Production Build Verification | `npm run build` | **Clean Vite Bundle (1.57s)** |

---

## Verdict

### PASS ✓
All requirements, contracts, UX invariants (`INV-STREAM-01` through `INV-STREAM-05`), and Playwright browser tests passed cleanly with 0 regressions.
