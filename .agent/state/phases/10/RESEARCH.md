# Phase 10 Research: Gameplay Ergonomics, Card Tag Previews, R1 Ray Distance & Move Animation Engine

## Executive Summary

Phase 10 refines the tactile and visual core of Deck Builder Chess before launching the Campaign puzzle sequences. Based on user feedback and playtesting, four interconnected ergonomics and UX improvements are addressed:
1. **R1 (`Make Way`) Ray Distance Mechanics**: Upgrades R1 from an adjacent-only requirement to full orthogonal ray-distance scanning. A Rook can instruct any friendly Pawn down an unobstructed rank or file to step aside perpendicular to an open square, clearing the line for the Rook to charge through.
2. **Card Deselection Blank Slate**: Eliminates sticky piece selection when deselecting an armed card, resetting selection to neutral so players can immediately click any other card or piece.
3. **Card Tag Previews (Desktop Tooltips & Mobile Popovers)**: Replaces plain text card codes (`[R1]`, `[N4]`) in `<MoveTableDesktop />` and `<MoveStreamMobile />` with an interactive `<CardTagBadge />` featuring a hover preview on desktop and a non-intrusive tap popover on mobile.
4. **Move Animation Engine**: Implements smooth piece sliding transitions using FLIP CSS transforms for standard moves, plus theatrical card manifestation banners and 6 generalized card animation archetypes (`charge`, `leap`, `teleport`, `beam`, `displace`, `shockwave`).

---

## 1. R1 (`Make Way`) Ray-Distance Mechanics

### Current Limitations
In Phase 3/7, `r1_make_way` was implemented strictly for immediately adjacent Pawns (`step = 1`). This meant:
- A Rook on `h2` with a Pawn on `c2` (and empty squares on `g2, f2, e2, d2`) could not activate `R1`.
- This contradicted the tactical intuition of Rooks as long-range battery pieces.

### Target Mechanics
- **Ray Scan**:
  - From the Rook's square $(f_R, r_R)$, cast rays in all 4 orthogonal directions:
    - $+x$ (Right: $[1, 0]$), $-x$ (Left: $[-1, 0]$), $+y$ (Up: $[0, 1]$), $-y$ (Down: $[0, -1]$).
  - Advance `step = 1, 2, 3...`:
    - If square is empty and not blocked by barrier, continue scanning.
    - If an obstacle is encountered:
      - If it is an enemy piece or non-Pawn ally: **Ray is blocked**; stop scanning this ray.
      - If it is a friendly Pawn: **Candidate found**!
- **Pawn Step-Aside Validation**:
  - For the friendly Pawn at $(f_P, r_P)$, calculate the two perpendicular directions:
    - If ray was horizontal $[df, 0]$, perpendiculars are $[0, 1]$ and $[0, -1]$ (up/down).
    - If ray was vertical $[0, dr]$, perpendiculars are $[1, 0]$ and $[-1, 0]$ (right/left).
  - Check if either perpendicular square is on the board, empty, and not blocked by a barrier.
  - If no empty perpendicular square exists: the Pawn cannot step aside; stop scanning this ray.
- **Rook Destination Generation**:
  - When the Pawn steps aside to an empty square $S_{\text{pawnDest}}$, the entire ray up to and beyond the Pawn becomes accessible to the Rook:
    1. **Intermediate squares**: Any empty square between the Rook and the original Pawn square (`step = 1 .. stepPawn - 1`).
    2. **Vacated square**: The square originally occupied by the Pawn (`pawnSq`).
    3. **Squares beyond**: Continue stepping along the ray beyond `pawnSq` (`step = stepPawn + 1 ..`):
       - If square is empty and not blocked by barrier, Rook can stop there.
       - If square contains an enemy piece (non-King) and not shielded, Rook can capture it and stop.
       - If square contains an ally or King or barrier, stop ray.
  - Every valid Rook destination is paired with each valid `pawnDest` as a `TargetOption` (`{ to: rookDest, extraSquare: pawnDest }`).

### State Transition & Execution
- In `playbook36Handlers.ts`:
  1. Validate that `targetSquare` is along the orthogonal line of `anchorSquare`.
  2. Locate the friendly Pawn along that line.
  3. Validate `extraSquare` is an empty perpendicular square adjacent to the Pawn.
  4. Move Pawn to `extraSquare`.
  5. Move Rook to `targetSquare` (capturing any enemy present at `targetSquare`).

---

## 2. Card Deselection Blank Slate State Machine

### Defect Analysis
In `src/hooks/useDeckChessGame.ts`:
```typescript
// Current behavior when toggling off an armed card:
if (selectedCardId === cardId) {
  setSelectedCardId(null);
  setSelectedCard(null);
  setPendingCardMove(null);
  setDisambiguationCandidates(null);
  setEmpoweredMovesForSelected([]);
  if (selectedSquare) {
    const legalStandard = engineRef.current.getLegalMoves(selectedSquare).map((m) => m.to);
    setLegalMovesForSelected(legalStandard);
  }
  return;
}
```
**Issue**: When the player taps the armed card to deselect it, `selectedSquare` remains set to whatever piece was active. If the user then taps a *different* card in hand (e.g. a Knight card while a Bishop was selected), the system evaluates the Knight card against the Bishop, resulting in no valid moves or unexpected auto-selection.

### Fix Specification
When deselecting an armed card:
1. `setSelectedCardId(null)`
2. `setSelectedCard(null)`
3. `setPendingCardMove(null)`
4. `setDisambiguationCandidates(null)`
5. `setEmpoweredMovesForSelected([])`
6. `clearPieceSelection()` (resets `selectedSquare = null`, `legalMovesForSelected = []`)

This guarantees an immediate clean, unselected "blank slate", allowing the player to tap any other card or piece seamlessly.

---

## 3. Card Tag Tooltips & Popovers

### Requirements
- Move history in `<MoveTableDesktop />` and `<MoveStreamMobile />` contains tags like `[R1]`, `[N4]`, `[Q2]`.
- Clicking a move row currently navigates the timeline scrubber (`onSelectMove`).
- The card tag must be an isolated interactive trigger (`e.stopPropagation()`) that previews the card without navigating the scrubber.
- **Desktop**:
  - Hovering/focusing displays a floating tooltip positioned directly above/below the tag.
  - Smooth fade/scale animation, dark backdrop (`#161B22`), border colored by piece theme (`PIECE_CARD_COLORS`).
  - Dismisses on `onMouseLeave` or loss of focus.
- **Mobile**:
  - Tapping the tag opens a lightweight, non-modal popover.
  - Positioned non-intrusively near the tape (e.g., above the mobile stream) so the chessboard remains visible.
  - Contains card art, name, piece tag, condition badge, and effect text.
  - Dismisses on tapping outside, tapping the '✕' close button, or tapping the tag again.

### Data Architecture
- Helper: `getCardByCode(code: string): CardDefinition | undefined` resolves card metadata from `RELEASE_ROSTER_36`.
- Shared component: `<CardTagBadge cardCode={code} className={...} />`.

---

## 4. Move Animation Engine Architecture

### Standard Chess Move Sliding (FLIP Technique)
Chess pieces should glide between squares rather than teleporting instantly:
1. **FLIP Animation (First, Last, Invert, Play)**:
   - When a standard move completes, `lastMoveFrom` and `lastMoveTo` update.
   - The DOM element is rendered in its new square `to` (guaranteeing semantic DOM correctness).
   - We calculate $\Delta x = x_{\text{from}} - x_{\text{to}}$ and $\Delta y = y_{\text{from}} - y_{\text{to}}$ based on file and rank offsets (accounting for board orientation `w` vs `b`).
   - The piece is styled with `transform: translate(Δx, Δy)` initially, then transitioned to `translate(0, 0)` with `transition: transform 180ms cubic-bezier(0.2, 0, 0.2, 1)`.
2. **Scrubber Exemption**:
   - When `isViewingHistory === true` or when jumping rapidly through timeline scrubbers, animations are bypassed (`duration: 0ms`) to ensure instant responsiveness.
3. **Capture Dissolve**:
   - If `lastMove` was a capture, a transient particle / burst effect plays on the destination square.

### Theatrical Card Manifestation Banner
When an empowered card move executes:
- A dynamic banner manifests across the top-center of the board:
  - `"⚡ FLASH PLAY: [CARD NAME]"` with the card's piece color aura (`#A855F7` for Rook, `#3FB950` for Knight, etc.).
  - Plays for 400ms before dissolving into the piece animation.

### 6 Generalized Card Animation Archetypes
Rather than hand-crafting 36 animations, all 36 cards map to 6 generalized archetypes:

| Archetype | Associated Cards | Visual Effect & Trajectory |
|-----------|------------------|----------------------------|
| **Charge** | `R1`, `R2`, `R4`, `P1`, `P2`, `P7` | Linear high-speed streak with motion-blur wake and ground line particles |
| **Arc Leap** | `N1`, `N2`, `N3`, `N4`, `N5`, `N6`, `N7` | Parabolic arc trajectory with vertical scale bounce and impact shockwave ring on landing |
| **Rift Teleport** | `P4`, `P5`, `B3`, `R6`, `Q3` | Particle collapse/dissolve at source square, cyan/purple rift tear ripple at destination |
| **Radiant Beam** | `B1`, `B2`, `B5`, `B6`, `B7`, `Q1`, `Q2` | Glowing diagonal/orthogonal light beam traces line of sight before high-speed slide |
| **Twin Displace**| `R1` (Pawn aside), `R3`, `R5`, `K1`, `K3` | Dual curved paths where the displaced unit steps aside while anchor charges or swaps |
| **Shockwave Blast**| `P3`, `P6`, `P8`, `B4`, `K2`, `K4`, `Q4` | Expanding radial energy ring with subtle board micro-shake on impact |

---

## Verification & Test Plan

1. **Mechanics & Invariants Test Suite (`scripts/verify-phase10-mechanics.ts`)**:
   - R1 ray distance: 1-square, 2-square, 5-square distances.
   - R1 intermediate square moves, vacated square moves, and beyond-pawn capture moves.
   - R1 obstruction blocking (enemy piece, ally non-pawn).
   - R1 perpendicular square availability (0 squares = blocked, 1 square = valid, 2 squares = disambiguation).
   - Card deselection resets both card selection and piece selection.
2. **Playbook & Overhaul Regression Suites**:
   - `scripts/verify-36-playbook.ts` (170/170 passing).
   - `scripts/verify-phase7-overhaul.ts` (146/146 passing).
   - `scripts/verify-36-mechanics-edge-cases.ts` (43/43 passing).
   - `npm test`.
3. **Playwright E2E UI Tests**:
   - Desktop move table card tag hover tooltip display & dismissal.
   - Mobile move stream card tag tap popover display & dismissal on outside click.
   - Smooth slide transition assertion on move execution.
