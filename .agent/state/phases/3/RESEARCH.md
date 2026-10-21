---
phase: 3
level: 2
researched_at: 2026-10-21
---

# Phase 3 Research: 36-Card Engine, Fluid 11-Column Main Menu Hub & Multiplayer / AI Playtest Prototype

## Questions Investigated
1. How do we refactor `DeckChessEngine.ts`, `cardGraph.ts`, and `cardRegistry.ts` from the legacy 180-card Energy-gated catalog to the canonical **36-Card Playbook** (`P1–P8, N1–N7, B1–B7, R1–R6, Q1–Q4, K1–K4`) while supporting Rank 1 Pawns, Rank 8 instant promotion across all affected squares, and zero-Energy ("1 card per turn") rules?
2. How do we structure the **Bidirectional Move Flow (`Piece-First` & `Card-First`)**, **Card Hover Board Preview**, **Multi-Option Disambiguation (`extraSquare`)**, and **Mandatory Card Outcome Preview + Confirmation Bar (`✓` / `✕`)**?
3. How do we architect the **Fluid 11-Column Main Menu Hub**, **Local Multi-Profile Switcher (`Slot 1–3`)**, and **Full-Screen Multiplayer Character Stage** (with Top-Right Play Cluster, 8-Card Hand, 36-Card Filterable Library, 5-Dot Copy Stack, and Pokémon-Style Piece-Colored Card Frames)?

---

## Findings

### 1. Engine Refactoring & Rank 1 Pawn Support in `chess.js`
- **Rank 1 Pawn FEN Loading**: By default, `new Chess(fen)` and `chess.load(fen)` validate that no Pawns exist on Rank 1 (`a1–h1`) or Rank 8 (`a8–h8`). However, passing `{ skipValidation: true }` to `this.chess.load(fen, { skipValidation: true })` allows Pawns on Rank 1 (`K1 Conscription`, `K4 Banish`) and empirically generates legal 1-square forward Pawn moves (`a1 -> a2`) with zero double-step or *en passant* side effects.
- **Global Promotion Sweep vs. Rank 1 Home-Rank Distinction**:
  - White Pawns promote on `Rank 8` (`a8–h8`) and may legally exist as unpromoted Pawns on `Rank 1` (`a1–h1`).
  - Black Pawns promote on `Rank 1` (`a1–h1`) and may legally exist as unpromoted Pawns on `Rank 8` (`a8–h8`).
  - Because cards like `P3 (Follow Me)`, `P4 (Attack Together)`, `R1 (Make Way)`, `R2 (I've Got Your Back)`, `Q3 (All Rise)`, and `K4 (Banish)` can move or push Pawns that are *not* the primary `move.to` square, `makeEmpoweredMove()` must sweep all 8 files of the promotion rank (`Rank 8` for White, `Rank 1` for Black) after `handler.execute()` to auto-promote any Pawn that reached its promotion rank.
- **Simulation-Generated Outcome Preview (`previewFen`)**:
  - Because `getEmpoweredMoves()` already clones the engine (`const sim = this.clone()`) to verify King safety (`!sim.getInternalChess().isAttacked(kingSq, oppColor)`), we can capture `sim.getFen()` (after applying the promotion sweep) directly onto each `EmpoweredMove` as `previewFen: string`.
  - This gives the UI an instant, 100% exact board preview for both **Card Hover Preview** and the **Pre-Commit Confirmation State (`✓` / `✕`)** with zero duplicate engine logic.

**Recommendation:** Refactor `DeckChessEngine.ts` to use `chess.load(fen, { skipValidation: true })`, remove Energy gates (`energyCost = 0`), sweep promotion ranks after every card execution, and attach `previewFen` and `extraSquare` disambiguation metadata to every `EmpoweredMove`.

---

### 2. Pokémon-Style Piece-Colored Card Frames & 5-Dot Copy Stack
- Every card in the 36-Card Playbook uses a unified Pokémon-style TCG frame color-coded by piece class (`[DECISION-027]`):
  - **Pawn (`P1–P8`)**: Gray (`#8A9199`)
  - **Knight (`N1–N7`)**: Green (`#3FB950`)
  - **Bishop (`B1–B7`)**: Blue (`#3B82F6`)
  - **Rook (`R1–R6`)**: Purple (`#A855F7`)
  - **Queen (`Q1–Q4`)**: Red (`#EF4444`)
  - **King (`K1–K4`)**: Gold (`#D4AF37`)
- **5-Dot Copy Stack**: Beside each card in the Multiplayer Library, render a vertical stack of 5 dots (`1..5`), lighting up `allowedCopies` dots (`1` by default; `5` when Playtest Mode is active on the profile) and showing how many copies are currently equipped in the active hand (default `8` slots, configurable `1–8`).

---

## Technical Architecture & Contracts

### 5-Layer Contract Alignment
| Domain Concept | Local / D1 Storage | Shared TypeScript (`src/types/deckChess.ts`) | Runtime Validation | Engine / Room Payload DTO | UI / Client State |
|---|---|---|---|---|---|
| **Canonical Card ID** | `TEXT` (`p1_sidestep` .. `k4_banish`) | `CardCode = 'P1' \| ... \| 'K4'`, `id: string` | `RELEASE_36_IDS.has(id)` | `{ cardId: string }` | Pokémon-style Piece-Colored Card (`Gray/Green/Blue/Purple/Red/Gold`) |
| **Empowered Card Move & Preview** | Ephemeral / Move Log JSON | `EmpoweredMove { from, to, extraSquare?, cardId, previewFen, description }` | Engine simulation & King-safety check | `DeckChessTurnPayload { cardAction, resultingFen }` | Hover Preview + Pending Confirmation (`✓` Green Check / `✕` Red X) |
| **Player Profile Slot** | `localStorage['wc_profiles_v3']` | `PlayerProfile { id, name, level, gold, unlockedCards, copyLimits, playtestAll36, handSize, equippedHand, gear }` | Schema fallback initializer | Profile sync payload | Main Menu Hub Companion Card & `Switch Profile` modal |
| **Copy Allowance (`1–5`)** | `Record<string, number>` (`1..5`) | `maxCopies: number` (`1..5`) | `1 <= count <= 5` | Deck validation on match start | Vertical 5-Dot Stack (`●`) beside library card |

---

### State Transition Matrix (Board Turn & Card Confirmation Lifecycle)
| Current UI State | Event: Click Piece (`Piece-First`) | Event: Click Card (`Card-First`) | Event: Select Target Square | Event: Select Disambiguation Square (`extraSquare`) | Event: Click `✓` (Confirm) | Event: Click `✕` (Cancel) |
|---|---|---|---|---|---|---|
| **`IDLE`** | ➔ `PIECE_SELECTED` (shows standard moves + pops out matching hand cards; dims others) | ➔ `CARD_SELECTED` (highlights eligible anchor pieces on board; or ➔ `PREVIEW_CONFIRM` if global/single-outcome) | Ignored | Ignored | Ignored | Ignored |
| **`PIECE_SELECTED`** | ➔ `PIECE_SELECTED` (switches piece) or `IDLE` | ➔ `CARD_TARGETING` (filters board targets to chosen card for this piece) | If standard move: **Instant Execute** ➔ `OPPONENT_TURN`. If card move (1 path): ➔ `PREVIEW_CONFIRM`. If >1 path: ➔ `DISAMBIGUATE_EXTRA`. | Ignored | Ignored | ➔ `IDLE` |
| **`CARD_SELECTED`** | ➔ `CARD_TARGETING` (locks anchor piece for chosen card; shows target squares) | ➔ `CARD_SELECTED` (switches card) or `IDLE` | If only 1 eligible anchor piece & 1 path: ➔ `PREVIEW_CONFIRM` | Ignored | Ignored | ➔ `IDLE` |
| **`CARD_TARGETING`** | ➔ `PIECE_SELECTED` | ➔ `CARD_SELECTED` | If 1 path (`extraSquare` unique/none): ➔ `PREVIEW_CONFIRM`. If >1 `extraSquare`: ➔ `DISAMBIGUATE_EXTRA`. | Ignored | Ignored | ➔ `IDLE` |
| **`DISAMBIGUATE_EXTRA`** | Cancels ➔ `PIECE_SELECTED` | Cancels ➔ `CARD_SELECTED` | Cancels ➔ `CARD_TARGETING` | ➔ `PREVIEW_CONFIRM` (renders `previewFen` + `✓ / ✕` bar) | Ignored | ➔ `IDLE` |
| **`PREVIEW_CONFIRM`** | Ignored (must confirm or cancel) | Ignored | Ignored | Ignored | **Commits Card Move** (`makeEmpoweredMove`), consumes card slot ➔ `OPPONENT_TURN` | Restores pre-move board ➔ `IDLE` |

---

### Immutable System Invariants
1. **King Safety & Non-Royal Capture Invariant**:
   - No card move may ever leave the active player's own King in check (`sim.getInternalChess().isAttacked(friendlyKingSq, oppColor) === false`), and no card effect may ever capture, destroy, sacrifice, or displace an enemy King (`targetPiece.type !== 'k'`).
   - *Enforcement*: Verified in `DeckChessEngine.getEmpoweredMoves()` simulation filter and individual `cardRegistry.ts` handlers.
2. **Rank 1 Legalization & Rank 8 Instant Promotion Invariant**:
   - Pawns on Rank 1 (`a1–h1` for White, `a8–h8` for Black) are legal via `{ skipValidation: true }` and step 1 square forward. Any Pawn reaching its promotion rank (`a8–h8` for White, `a1–h1` for Black) via any primary or secondary card effect immediately promotes to a Queen before turn handoff.
   - *Enforcement*: Global promotion rank sweep inside `DeckChessEngine.applyCardExecutionAndPromote()`.
3. **Mandatory Card Confirmation Invariant**:
   - Standard chess moves execute immediately; **100% of card moves** transition through `PREVIEW_CONFIRM` displaying the resulting board state and require explicit confirmation via the bottom **Green Check (`✓`)** button (or cancellation via **Red X (`✕`)**).
   - *Enforcement*: `useDeckChessGame.ts` state machine (`pendingCardMove: EmpoweredMove | null`).
4. **Fluid 11-Column Grid Invariant**:
   - The Main Menu Hub uses `grid-template-columns: repeat(11, minmax(0, 1fr))` (`grid-column: 3 / span 4` for the Menu Stack and `grid-column: 8 / span 3` for the Player Showcase Card) with `aspect-ratio` and `clamp()`—zero hardcoded pixel column widths.
   - *Enforcement*: CSS contract assertions in Phase 3 UX verification script.

---

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Roster Scope** | Replace 180-card catalog in active UI/Engine with the **36-Card Playbook** (`releaseRoster36.ts`) | Eliminates placeholder mechanics; ensures 100% bespoke, playtest-ready handlers. |
| **Card Visuals** | Pokémon-style Piece-Colored Card Frames (`Gray, Green, Blue, Purple, Red, Gold`) | Instant piece-class recognition without waiting on 36 custom SVG illustrations. |
| **Card Execution UX** | Bidirectional (`Piece-First` & `Card-First`) + Hover Preview + `✓ / ✕` Confirmation Bar | Prevents misclicks on complex multi-piece cards and clearly communicates board outcomes. |
| **Multiplayer Stage** | Full-screen Character Backdrop + Top-Right Play Buttons + Bottom 8-Card Hand & 5-Dot Library | Combines Chess.com quick-play ergonomics with tactile TCG deck customization. |

## Patterns to Follow
- Pure functional simulation (`const sim = this.clone()`) to compute `previewFen` and verify King safety for every candidate `EmpoweredMove`.
- Responsive CSS Grid (`repeat(11, minmax(0, 1fr))`) and `aspect-ratio` for all new layout stages.

## Anti-Patterns to Avoid
- **Hardcoded Pixel Layouts**: Never use fixed pixel widths (`470px`, `320px`) for responsive grid columns.
- **Unvalidated `chess.load(fen)` Calls**: Always pass `{ skipValidation: true }` whenever loading FEN strings in `DeckChessEngine.ts` so Rank 1 Pawns never throw `chess.js` validation exceptions.

## Ready for Planning
- [x] Questions answered
- [x] Contracts and invariants specified
- [x] Approach selected
- [x] Dependencies identified
