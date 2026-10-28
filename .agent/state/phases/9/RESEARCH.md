# Phase 9 Research: In-Game Read-Only Rewind Scrubber & Interactive Move Log

## 1. Architectural Context & Current State

Currently in `src/hooks/useDeckChessGame.ts`:
- `recordedTurns: RecordedTurn[]` records each executed ply (`makeMove`, `confirmPendingCardMove`, `triggerAiTurn`, and `applyRemoteTurn`), storing `turnNumber`, `player`, `chessMove`, `cardAction`, `fenAfter`, `combatText`, and `timestamp`.
- `combatLog: CombatLogEntry[]` records text strings (`type: 'move' | 'card' | 'system'`), but entries do not carry a `plyIndex` linking them to `recordedTurns`.
- `useDeckChessGame` always returns live `gameState` (`fen`, `whiteHand`, `blackHand`, `graveyard`, `activeModifiers`, `inCheck`) directly from `engineRef.current.getState()`. There is no timeline cursor (`viewPlyIndex`) to inspect earlier plies during or after a match.

In `src/pages/DeckBuilderPage.tsx`:
- On mobile (`< lg`), the arena layout stacks vertically:
  1. `order-1`: Center Chessboard Column (Opponent bar, `TabletopArena` + `DeckChessBoard`, Player bar)
  2. `order-2`: Left Column (`TacticalHandBar`)
  3. `order-3`: Right Column (`Moves | Chat` panel + Action Footer)
- On desktop (`>= lg`), the 3 columns sit side-by-side (`Left Hand | Center Board | Right Moves/Chat`).
- Inside the Right Column (`Moves` tab), `game.combatLog` renders as a static list of `<div>` items without click-to-jump or transport controls (`|◀`, `◀`, `▶`, `▶|`).

---

## 2. Canonical 5-Layer Data Contracts

### Layer 1: Per-Ply State Snapshot (`RecordedTurn` & `CombatLogEntry`)
```typescript
export interface CombatLogEntry {
  id: string;
  text: string;
  timestamp: number;
  type: 'move' | 'card' | 'system';
  playerColor?: PieceColor;
  plyIndex?: number; // -1 for initial setup, 0..N-1 for recordedTurns index
}

export interface RecordedTurn {
  plyIndex: number; // 0-based index in recordedTurns
  turnNumber: number;
  player: PieceColor;
  chessMove: DeckChessMove;
  cardAction?: DeckChessCardAction;
  fenAfter: string;
  stateSnapshot?: DeckChessEngineState; // Full engine snapshot after this ply
  combatText?: string;
  timestamp: number;
}
```

### Layer 2: Timeline Scrubber State & Actions (`useDeckChessGame` Return Contract)
- `viewPlyIndex: number | null`:
  - `null`: Live view (tracking the latest state at `recordedTurns.length - 1`, or initial state when `recordedTurns.length === 0`).
  - `-1`: Viewing the initial board setup before Ply 1 (`initialStateSnapshot`).
  - `0 .. recordedTurns.length - 1`: Viewing the historical snapshot after `recordedTurns[viewPlyIndex]`.
- `activePlyIndex: number`:
  - Resolved integer index currently displayed (`viewPlyIndex !== null ? viewPlyIndex : recordedTurns.length - 1`).
- `totalPlies: number`:
  - `recordedTurns.length`.
- `isViewingHistory: boolean`:
  - `viewPlyIndex !== null && viewPlyIndex < recordedTurns.length - 1` (true whenever the user is inspecting an earlier state prior to the latest live ply).
- `viewedMove: RecordedTurn | null`:
  - The `RecordedTurn` at `activePlyIndex` (when `activePlyIndex >= 0`), used to highlight `from` / `to` / `anchorSquare` / `targetSquare` on `DeckChessBoard` and display card annotations.
- **Navigation Actions**:
  - `stepToPly(plyIndex: number | null): void`: Clamps index to `[-1, recordedTurns.length - 1]`; if `plyIndex >= recordedTurns.length - 1` or `plyIndex === null`, sets `viewPlyIndex = null` (Live). Clears any active piece/card selection on the board when entering history view.
  - `stepBackward(): void`:
    - If `recordedTurns.length === 0`, no-op.
    - From `null` (Live), steps to `recordedTurns.length - 2` (or `-1` if `recordedTurns.length === 1`).
    - From `k > -1`, steps to `k - 1`.
  - `stepForward(): void`:
    - If `viewPlyIndex === null`, no-op.
    - If `viewPlyIndex + 1 >= recordedTurns.length - 1`, sets `viewPlyIndex = null` (returns to Live).
    - Otherwise sets `viewPlyIndex = viewPlyIndex + 1`.
  - `jumpToStart(): void`:
    - If `recordedTurns.length > 0`, sets `viewPlyIndex = -1`.
  - `jumpToLive(): void`:
    - Sets `viewPlyIndex = null`.

### Layer 3: Effective Displayed State Projection
When `isViewingHistory === true`:
- `displayedState` is resolved from:
  - `viewPlyIndex === -1`: `initialStateSnapshot`
  - `viewPlyIndex >= 0`: `recordedTurns[viewPlyIndex].stateSnapshot` (falling back to `{ ...gameState, fen: recordedTurns[viewPlyIndex].fenAfter }`)
- `fen`, `whiteHand`, `blackHand`, `graveyard`, `activeModifiers`, `inCheck`, and `evaluation` (`EvalBar`) all reflect `displayedState` so the board, side evaluation bar, captured pieces, and hand reflect that exact moment in the match!
- Last-move square highlights: when `viewedMove` exists and no piece is actively selected, `lastMoveHighlights` (`from` and `to`) can be shown subtly on the board.

### Layer 4: Reusable `<RewindBar />` Component (`src/components/RewindBar.tsx`)
Props:
```typescript
export interface RewindBarProps {
  activePlyIndex: number; // -1 .. totalPlies - 1
  totalPlies: number;
  isViewingHistory: boolean;
  onJumpToStart: () => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  onJumpToLive: () => void;
  className?: string;
}
```
Layout & Responsive Ordering inside the Move Log Panel:
- **Mobile (`< lg`)**: `order-1 lg:order-2 mb-2 lg:mb-0 lg:mt-2` — renders **above** the scrolling Move Log (and immediately below the Tactical Hand).
- **Desktop (`>= lg`)**: `order-1 lg:order-2` — renders **below** the scrolling Move Log (and immediately above the Action Footer).

---

## 3. State Transition Matrix & Read-Only Guards

| Current Mode | User / System Action | Transition & Guard Behavior |
|---|---|---|
| `LIVE` (`isViewingHistory = false`) | Click `◀` or `\|◀` or earlier Move Log row | Enters `HISTORY` (`viewPlyIndex` set to target ply), cancels any armed card/piece selection, updates board, `EvalBar`, graveyard, and hand to historical snapshot. |
| `HISTORY` (`isViewingHistory = true`) | Click `▶` reaching `totalPlies - 1`, or click `▶\|`, or click `"Return to Live"` status pill | Exits `HISTORY` (`viewPlyIndex = null`), restores live board, hand, and active turn controls. |
| `HISTORY` (`isViewingHistory = true`) | Click a board square or card in hand | **Read-Only Guard**: Blocked from executing moves or arming cards while inspecting history (`handleSquareClick` and `selectCardFromHand` return early when `isViewingHistory` is true). |
| `HISTORY` or `LIVE` | AI or Remote Opponent completes a move, or `resetGame` runs | `resetGame` resets `viewPlyIndex = null` and captures fresh `initialStateSnapshot`. |
| `GAME_OVER` (`Review Board` active) | Click `\|◀`, `◀`, `▶`, `▶\|`, or Move Log rows | Full timeline scrubbing works identically after Game Over so players can review every turn of the completed match with `<EvalBar />`. |

---

## 4. Immutable System Invariants

1. **INV-REW-01 (Read-Only Integrity)**: Scrubbing to any historical ply (`-1 .. totalPlies - 2`) MUST NEVER mutate `engineRef.current`, overwrite `recordedTurns`, or allow piece/card move execution until returning to Live (`isViewingHistory === false`).
2. **INV-REW-02 (Complete Snapshot Fidelity)**: At any ply index `k` (`-1 .. totalPlies - 1`), `fen`, `whiteHand`, `blackHand`, `graveyard`, `activeModifiers`, `inCheck`, and `evaluation` MUST match the exact state recorded at ply `k`.
3. **INV-REW-03 (Responsive DOM Ordering)**: On mobile viewports (`< 1024px`), the Rewind Bar bounding box `top` MUST be strictly above the Move Log scroll container `top` (and below the Tactical Hand Bar). On desktop viewports (`>= 1024px`), the Rewind Bar `top` MUST be strictly below the Move Log scroll container `top`.
4. **INV-REW-04 (Scroll Anchor Stability)**: Clicking move rows or stepping with `◀` / `▶` on mobile MUST auto-scroll the Move Log container internally (`scrollTop`) without shifting `window.scrollY`.
