---
status: resolved
trigger: "right now, when trying to make the first move in deck builder, it just says 'illegal move'"
created: 2026-10-15T03:45:00-05:00
updated: 2026-10-15T03:52:00-05:00
---

## Current Focus
hypothesis: In DeckChessEngine.ts line 868, matchingMove required `(!move.promotion || m.promotion === move.promotion)`. In useDeckChessGame.ts, makeMove defaulted `promotion: string = 'q'`. For any normal non-promoting move (such as e2 to e4, g1 to f3), m.promotion is undefined in chess.js. Because move.promotion was truthy ('q'), `!move.promotion` was false and `m.promotion === move.promotion` was `undefined === 'q'` (false). This caused EVERY normal chess move to fail and return `{ success: false, error: 'Illegal chess move' }`.
test: Run test in node/tsx with `{ from: 'e2', to: 'e4', promotion: 'q' }` vs `{ from: 'e2', to: 'e4' }`.
expecting: `{ from: 'e2', to: 'e4', promotion: 'q' }` returns `{ success: false, error: 'Illegal chess move' }`, while `{ from: 'e2', to: 'e4' }` returns `{ success: true }`.
next_action: Fix applied, deployed, and verified.

## Symptoms
expected: Clicking a friendly piece on DeckChessBoard highlights legal move dots, and clicking a legal destination square executes the chess move and passes the turn.
actual: Clicking a legal destination square results in combat log saying "Illegal move: {from} to {to}", no move is made on the board.
errors: Combat log: "Illegal move: e2 to e4". Engine return: `{ success: false, error: 'Illegal chess move' }`.

## Eliminated
- hypothesis: chess.js rejects moves with promotion property
  evidence: Tested `new Chess().move({ from: 'e2', to: 'e4', promotion: 'q' })` in node. chess.js accepts and executes the move successfully (`san: 'e4'`). The rejection happened before `this.chess.move()` was ever reached, in DeckChessEngine's legal move filter.

## Evidence
- checked: `src/hooks/useDeckChessGame.ts` line 306
  found: `const makeMove = useCallback((from: string, to: string, promotion: string = 'q') => {`
  implication: Every user move sends `promotion: 'q'` to the engine.
- checked: `src/engine/DeckChessEngine.ts` line 867-873
  found: `const matchingMove = legalMoves.find((m) => m.to === move.to && (!move.promotion || m.promotion === move.promotion));`
  implication: For non-promotion moves, `m.promotion` is undefined. When `move.promotion` is `'q'`, `!move.promotion` is false, and `undefined === 'q'` is false. Result is `matchingMove === undefined`, triggering line 872 `return { success: false, error: 'Illegal chess move' }`.
- checked: Node reproduction via `tsx`
  found: `makeMove({ from: 'e2', to: 'e4', promotion: 'q' })` fails with `Illegal chess move`. `makeMove({ from: 'e2', to: 'e4' })` succeeds.

## Resolution
root_cause: Faulty promotion equality check in DeckChessEngine.ts combined with default `promotion = 'q'` parameter in useDeckChessGame.ts.
fix:
1. Updated `DeckChessEngine.ts`: `matchingMove` checks `if (m.promotion) return m.promotion === (move.promotion || 'q'); return true;` so non-promoting moves ignore `move.promotion` while actual pawn promotions still match correctly.
2. Updated `useDeckChessGame.ts`: Removed default `'q'` on `promotion?: string` in `makeMove`.
3. Updated `useDeckChessGame.ts`: Added `useEffect` to automatically trigger the AI turn whenever `mode === 'ai' && !gameState.isGameOver && !isAiThinking && gameState.turn !== playerColor`.
4. Updated `DeckChessBoard.tsx`: Added `data-square={squareName}` attribute to all board squares.
5. Deployed build to Cloudflare Pages (`https://wormhole-chess.com`).
verification:
- Full-stack typecheck clean (`npm run typecheck:all`).
- Production build clean (`npm run build:all`).
- Headless Chrome test against live production URL (`https://wormhole-chess.com`):
  - User moved pawn `e2` -> `e4` (Verified in Combat Log: "White moved e4").
  - AI Bot computed and responded with `Nc6` (Verified in Combat Log: "AI Bot moved Nc6").
  - User moved knight `g1` -> `f3` (Verified in Combat Log: "White moved Nf3").
  - AI Bot computed and responded with `Nf6` (Verified in Combat Log: "AI Bot moved Nf6").
  - 0 illegal move errors.
  - Screenshot verified: `.agent/state/artifacts/screenshots/deck_builder_playable_verified.png`.
