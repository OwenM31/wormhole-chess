# Phase 5 Research: UI Revamp, Atmospheric Assets & Copywriting

## 1. Complete Engine & UI Energy Purge

### Current State
In early v1.0 / v2.0 development, cards were gated by an "energy" pool (3 energy per turn, cards cost 1-3 energy). In v3.0, the core game invariant was redesigned to:
- **Zero Energy Costs**: Cards cost no energy.
- **Strict Turn Gating**: 1 card action per turn max (`hasPlayedCardThisTurn` flag).

However, vestigial traces of the energy system persist across the codebase:
- `DeckChessEngine.ts`: Internal `energy = 3` state, `getEnergy()`, `rollbackEnergy`, energy deduction, and energy reset on turn transition.
- `types/deckChess.ts`: `energy: number` in `DeckChessState`, `energyCost: number` in `CardDefinition`, and `EmpoweredMoveOption.energyCost`.
- `HomePage.tsx`: "3 energy per turn" description and `ENERGY 3/3` pill.
- `DeckBuilderView.tsx`: `⚡{card.energyCost}` badge in card list and modal.
- `TacticalHandBar.tsx`: Optional `energy?: number` prop and zero-energy pip header comment.
- `DashboardPage.tsx` & `MatchmakingLobby.tsx`: Subtitles mentioning "energy management".
- `HistoricalMatchViewer.tsx`: `energyTag` styling.

### Target Architecture
1. **Engine Cleanliness**:
   - Remove `energy` property, `getEnergy()` getter, and energy decrement/reset logic from `DeckChessEngine.ts`.
   - Update `EmpoweredMoveOption` to drop `energyCost`.
   - Remove `energyCost` requirement from `CardDefinition` (or keep `energyCost?: number` as deprecated optional if legacy catalogs reference it, while release roster 36 drops it).
2. **UI Purge**:
   - Remove `ENERGY 3/3` pill and "3 energy per turn" text from `HomePage.tsx`.
   - Remove energy lightning badges (`⚡`) from `DeckBuilderView.tsx` and `DashboardPage.tsx`.
   - Clean up `TacticalHandBar.tsx` props.
3. **Test Synchronization**:
   - Update `scripts/verify-36-playbook.ts` to assert that all 36 cards operate under the zero-energy turn-gated model.

---

## 2. Matchmaking Navigation & Renaming

### Current State
- `DeckBuilderMainMenu.tsx` has a button subtext: `Deck Builder Stage · Offline & Online`.
- `MultiplayerCharacterStage.tsx` refers to the character stage and lobby.

### Target Architecture
- Rename subtext to `Deck Builder Matchmaking · Offline & Online`.
- Keep existing `data-testid` attributes or add aliases so any existing Playwright tests continue to function seamlessly.

---

## 3. "Medieval Village" Aesthetic & Atmospheric Asset Palette

### Palette Tokens
To fulfill the user's directive ("medieval village colors, with a nice soft bright grassy green, soft woody browns, and cobblestone light gray and dark gray; weathered theme"):

| Token Name | Hex Code | Visual Application |
| :--- | :--- | :--- |
| `--village-grass-bright` | `#5B8C5A` | Primary active badges, healthy accents, highlights |
| `--village-grass-soft` | `#4D7C4D` | Subtle borders, active tab outlines, success states |
| `--village-grass-deep` | `#355E35` | Background tints, muted card highlights |
| `--village-wood-warm` | `#8C6D53` | Timber card borders, stage header trim, warm accents |
| `--village-wood-deep` | `#5A412F` | Shadow bevels, wooden plinth textures |
| `--village-wood-light` | `#D9C5B2` | Parchment subtext, warm neutral text |
| `--village-stone-light` | `#D1CCC7` | Cobblestone highlights, primary headings |
| `--village-stone-mid` | `#8A8580` | Muted descriptions, subtle dividers |
| `--village-stone-dark` | `#2D3033` | Panel and card backdrops, elevated surfaces |
| `--village-stone-deep` | `#1A1C1E` | Base body background, deep vignette shadows |
| `--village-gold-accent` | `#D4AF37` | Royal insignia, gold coin counters, crown badges |

### Asset Integration
- `public/assets/backgrounds/village-backdrop.jpg`: Used with soft radial lighting and warm vignette on `HomePage.tsx` and `DeckBuilderMainMenu.tsx`.
- `public/assets/backgrounds/tabletop-arena.jpg`: Integrated into `TabletopArena.tsx` behind the chessboard to provide tactile dark-wood depth.

---

## 4. Landing Page (`HomePage.tsx`) Live Showcase

### Current State
- Shows 4 hardcoded mockup cards:
  - `Knight Escort 2⚡`
  - `Shield Wall 1⚡`
  - `Spatial Warp 3⚡`
  - `King Decree 2⚡`
- Uses generic SVG/unicode icons and outdated energy badges.

### Target State (Option A)
- Showcase 4–6 authentic cards from `releaseRoster36.ts`:
  - `P1 Sidestep` (Pawn)
  - `N1 Adrenaline Jump` (Knight)
  - `B1 Let Me Through` (Bishop)
  - `R1 Make Way` (Rook)
  - `Q2 The Queen's Gambit` (Queen)
  - `K2 Royal Knighting` (King)
- Render using the actual `<PlayingCard />` component with piece-colored Pokémon frames, vector art illustrations, and punchy rule copy.
- Add direct navigation links to Deck Builder Matchmaking (`/deck-builder`).

---

## 5. 36-Card Copywriting Updates

### Approved Copy Changes
- **P1 (Sidestep)**:
  - *Condition:* "Pawn has enemy piece directly in front."
  - *Effect:* "Step Pawn 1 square horizontally (left or right) onto an empty square."
- **P2 (Attack Head On)** *(renamed)*:
  - *Condition:* "Pawn has enemy Pawn directly in front."
  - *Effect:* "Capture enemy Pawn straight ahead."
- **P3 (Follow Me)**:
  - *Condition:* "Pawn has ally piece directly behind."
  - *Effect:* "Move both ally Pawn and ally piece 1 square forward."
- **P4 (Attack Together)**:
  - *Condition:* "Pawn is threatening enemy piece and defended by ally Pawn."
  - *Effect:* "Capture enemy piece and move defending ally Pawn into vacated square."
- **P5 (Get Behind Me)**:
  - *Condition:* "Pawn has ally piece on rear diagonal and empty square behind."
  - *Effect:* "Move ally piece into empty square behind ally Pawn."
- **P6 (Tag Out)**:
  - *Condition:* "Pawn has ally piece directly in front."
  - *Effect:* "Pawn and ally piece swap places."
- **P7 (Protect the King)**:
  - *Condition:* "Pawn is pinned to your king."
  - *Effect:* "Destroy enemy piece on Pawn's forward diagonal without moving Pawn."
- **P8 (Call Reserves)**:
  - *Condition:* "Pawn is in enemy territory and has an ally piece to left or right and an empty square behind."
  - *Effect:* "Spawn additional Pawn into empty square behind Pawn."
- **N1 (Adrenaline Jump)**:
  - *Condition:* "Knight is under attack."
  - *Effect:* "Jump 3 squares in one direction and 1 square perpendicular. (3x1 jump)"
- **N2 (Swap With Me)**:
  - *Condition:* "Knight is targeting an ally piece."
  - *Effect:* "Knight and ally piece swap places."

### Validation Invariants
- `CANONICAL_36_CARDS` in `releaseRoster36.ts` must maintain exact concordance with `verify-36-playbook.ts`.
- The engine behavior handlers in `playbook36Handlers.ts` and `cardRegistry.ts` remain unchanged (only copy/names in `releaseRoster36.ts` are updated).
