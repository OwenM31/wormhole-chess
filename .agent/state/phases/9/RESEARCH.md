# Phase 9 Research: Chess.com-Style Move Stream & In-Game Timeline Inspection

## 1. Architectural Overview & Design Synthesis

Following user alignment (`[DECISION-038]`):
- Replace generic VCR transport buttons (`|◀`, `▶|`, etc.) and engine jargon ("ply") with the authentic, chess-native convention used by Chess.com and Lichess.
- **Mobile (`< lg`)**: Render `<MoveStreamMobile />` directly below the Tactical Hand. A sleek horizontal move tape with `[ ‹ ]` on the left, `[ › ]` on the right, and a horizontally scrolling stream with edge fade gradients. Moves are displayed in numbered chess notation (`1. e4`, `e5`, `2. Nf3`, `Nc6`). Tapping any move jumps the board to that move, highlights the move in tactical green (`#3FB950`), and auto-scrolls the tape to center it. Stepping left before Move 1 shows the initial starting board.
- **Desktop (`>= lg`)**: Render `<MoveTableDesktop />` inside the Right Column's `Moves` tab as a 2-column move table:
  ```
  Turn   White       Black
  1.     e4          e5
  2.     Nf3 [🟩]    Nc6
  ```
  The green highlight box advances **cell-by-cell** from White's move to Black's move and down row-by-row, matching whichever exact board state is currently being inspected.
- **Piece-Colored Card Tags**: Empowered card moves render a compact badge (e.g. `[N1]`, `[P2]`, `[Q2]`, `[R1]`) whose font color strictly matches its piece card frame color:
  - Pawn (`P1–P8`): `#8A9199` (Gray)
  - Knight (`N1–N7`): `#3FB950` (Green)
  - Bishop (`B1–B7`): `#3B82F6` (Blue)
  - Rook (`R1–R6`): `#A855F7` (Purple)
  - Queen (`Q1–Q4`): `#EF4444` (Red)
  - King (`K1–K4`): `#D4AF37` (Gold)

---

## 2. Data Contracts

### Layer 1: Recorded Turn & Move Pair Structure
```typescript
export interface RecordedTurn {
  turnNumber: number; // 1-based full turn number
  player: PieceColor; // 'w' | 'b'
  chessMove: DeckChessMove;
  cardAction?: DeckChessCardAction;
  cardCode?: string; // e.g. "N1", "P2", "Q2"
  cardPieceType?: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  san?: string; // Standard Algebraic Notation e.g. "Nf3", "e4", "O-O"
  fenAfter: string;
  stateSnapshot: DeckChessEngineState;
  timestamp: number;
}

export interface TurnRow {
  turnNumber: number;
  white?: RecordedTurn;
  whiteIndex?: number;
  black?: RecordedTurn;
  blackIndex?: number;
}
```

### Layer 2: Timeline Scrubber Hook Contract (`useDeckChessGame.ts`)
- `viewIndex: number | null`:
  - `null`: Live view (tracks latest live move at `recordedTurns.length - 1`, or initial state if 0 moves).
  - `-1`: Starting position before Move 1.
  - `0 .. recordedTurns.length - 1`: Historical position after `recordedTurns[viewIndex]`.
- `activeMoveIndex: number`:
  - `viewIndex !== null ? viewIndex : recordedTurns.length - 1`.
- `isViewingHistory: boolean`:
  - `viewIndex !== null && viewIndex < recordedTurns.length - 1`.
- `stepBackward()`:
  - Steps back 1 move (`activeMoveIndex - 1`), clamping at `-1`.
- `stepForward()`:
  - Steps forward 1 move (`activeMoveIndex + 1`). If reaching `recordedTurns.length - 1`, sets `viewIndex = null` (Live).
- `stepToMove(index: number | null)`:
  - Jumps directly to move index `index` (`null` or `-1 .. recordedTurns.length - 1`).
- `jumpToLive()`:
  - Sets `viewIndex = null`.

### Layer 3: Piece Color Token Mapping
```typescript
export const PIECE_CARD_COLORS: Record<string, string> = {
  p: '#8A9199', // Pawn - Gray
  n: '#3FB950', // Knight - Green
  b: '#3B82F6', // Bishop - Blue
  r: '#A855F7', // Rook - Purple
  q: '#EF4444', // Queen - Red
  k: '#D4AF37', // King - Gold
};
```

---

## 3. Invariants

1. **INV-STREAM-01 (Single-Arrow Step)**: Mobile stream has exactly one left `‹` and one right `›` button. No redundant jump-to-end buttons.
2. **INV-STREAM-02 (Cell-by-Cell Fidelity)**: On desktop, the active green highlight box is positioned on the exact move cell (`White` or `Black`) corresponding to `activeMoveIndex`.
3. **INV-STREAM-03 (Edge Fade Transparency)**: Mobile stream container uses CSS mask-image gradient so moves fade out smoothly at the left and right edges.
4. **INV-STREAM-04 (Read-Only Guard)**: When `isViewingHistory === true`, board clicks are non-mutating until returning to Live.
5. **INV-STREAM-05 (Piece-Color Card Tag Fidelity)**: Card tags (`[P1]`, `[N1]`, etc.) match their respective piece frame color.
