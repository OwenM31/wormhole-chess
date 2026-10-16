---
phase: 1
level: 2
researched_at: 2026-10-16
---

# Phase 1 Research: Card Nomenclature Polish & Schema Finalization (All 180 Cards)

> **Objective**: Conduct technical research, establish 5-layer data contracts, define state transitions and immutable precision invariants, and design the asset mapping ledger for all 180 canonical cards ahead of Phase 1 task planning.

---

## 1. Questions Investigated

1. **How to enforce the Zero-Ellipsis Rule across all viewport classes and components?**
   - Investigated `TacticalHandBar.tsx` (left hand stage) and `DeckBuilderView.tsx` (curator grid).
   - Identified that `TacticalHandBar.tsx` currently uses `line-clamp-2` and `DeckBuilderView.tsx` uses `line-clamp-2`, causing long descriptions (currently 150–376 chars) to force `...` ellipses.
   - Discovered that reducing card descriptions to concise tactical formulas ($\le 120$ characters) allows rules text to fit fully in 2–3 lines at $7.5\text{px}$–$8\text{px}$ without requiring `line-clamp-2` or producing ellipses.

2. **Which card titles contain flowery, fantasy, or metaphorical jargon that must be replaced?**
   - Audited all 180 card names across `cardCatalog90.json` (Minor Units) and `cardCatalogMajor90.json` (Major Units).
   - All 180 names currently satisfy the $\le 21$ character length limit.
   - Identified 13 titles with archaic, religious, or fantasy-RPG jargon (`Astral Transpose`, `Tractor Grace`, `Boomerang Grace`, `Arcane Dogleg`, `Zealot Convert`, `Stained Barrier`, `Maiden Leap`, `Nave Procession`, `Censure Sweep`, `Halo Strike`, `Taunting Beckon`, `Monarch's Decree`, `Break the Pin`).
   - Designed concrete, direct tactical replacements (e.g., `Diagonal Swap`, `Diagonal Tow`, `Recoil Hop`, `Dogleg Leap`, `Recruit Pawn`, `Prism Wall`, `Royal Leap`, `Orthogonal Glide`, `Bishop Cleave`, `Bishop Smite`, `Vanguard Beckon`, `Royal Strike`, `Pin Breaker`).

3. **How should the JSON schema be normalized across catalogs?**
   - Both catalogs currently have 14 keys: `id`, `name`, `card_name`, `piece`, `anchor`, `energyCost`, `score`, `condition_type`, `condition_exact`, `effect_type`, `effect_exact`, `description`, `card_description`, and `image_description`.
   - `card_name` and `card_description` are legacy duplicates of `name` and `description`.
   - Normalization approach: Retain canonical `name` and `description`, introduce `artId` (e.g. `pawn_hold_the_line`), and keep backwards-compatible getters in `cardGraph.ts` so no existing consumers break.

4. **How should the asset mapping architecture be structured for Phases 2 & 3?**
   - Evaluated static assets in `public/assets/cards/{piece}/{artId}.svg` vs bundled inline React components.
   - Bundling 180 SVGs directly into the Vite bundle would bloat the client bundle by 200–500 KB and slow initial page loads.
   - Recommended: Store vector SVGs as static assets in `public/assets/cards/{piece}/{artId}.svg`. Provide a shared `<CardArt piece={anchor} artId={artId} />` React component with browser caching, instant loading, and fallback piece glyph rendering.

5. **What contract validation test suite is needed?**
   - Design `Suite 16` in `scripts/verify-all-cards.ts` to programmatically validate all 180 cards against schema completeness, character limits, anti-ellipsis rules, 6×6 taxonomy exclusions, and 12/12/6 energy curves.

---

## 2. Technical Architecture & Contracts (Data Architect Skill)

### 5-Layer Contract Alignment Table

| Domain Concept | Schema / Storage (`.json` / D1) | Shared TypeScript (`deckChess.ts`) | Runtime / Test Validation | API Request / DTO | UI Component / Client State |
|---|---|---|---|---|---|
| **Card Identifier** | `"id": "pawn_hold_the_line"` | `id: string` (immutable snake_case) | `z.string().regex(/^[a-z]+_[a-z0-9_]+$/)` | `cardId: string` | `data-card-id={card.id}` |
| **Card Title** | `"name": "Hold the Line"` | `name: string` ($\le 21$ chars) | `assert(card.name.length <= 21)` | `name: string` | `<h4 className="card-name">{card.name}</h4>` |
| **Piece Anchor** | `"anchor": "pawn"` | `anchor: PieceAnchor` | `['pawn','knight','bishop','rook','queen','king']` | `anchor: PieceAnchor` | Color Theme & Badge Glyphs (`♟ ♞ ♝ ♜ ♛ ♚`) |
| **Energy Cost** | `"energyCost": 2` | `energyCost: number` ($1 \dots 3$) | `assert([1,2,3].includes(card.energyCost))` | `energyCost: number` | Energy Badge `⚡{energyCost}` |
| **Condition Genre** | `"condition_type": "Blocked"` | `condition_type: ConditionGenre` | `['Position','Neighbors','Lines','Threat','Blocked','Momentum']` | `condition_type` | Tactical Hand Filter Pill |
| **Condition Trigger** | `"condition_exact": "Absolute Pin"` | `condition_exact: string` | `assert(card.condition_exact.length > 0)` | `condition_exact` | Hand Card Subtitle Header |
| **Effect Genre** | `"effect_type": "Special Captures"` | `effect_type: EffectGenre` | `['New Moves','Jump & Leap','Move Others','Special Captures','Walls & Shields','Spawning']` | `effect_type` | Board Ring Highlight Category |
| **Effect Trigger** | `"effect_exact": "In-Place Diagonal Capture"` | `effect_exact: string` | `assert(card.effect_exact.length > 0)` | `effect_exact` | Mini-Board Explainer Schema |
| **Rules Description** | `"description": "While pinned to King, destroy diagonal enemy in-place."` | `description: string` ($\le 120$ chars, no ellipses) | `assert(len <= 120 && !desc.includes('...'))` | `description: string` | Card Body `<p>{card.description}</p>` |
| **Art Asset Identifier** | `"artId": "pawn_hold_the_line"` | `artId: string` | Matches SVG filename on disk | `artId: string` | `<CardArt artId={card.artId} />` |
| **Image Brief** | `"image_description": "..."` | `image_description: string` | `assert(card.image_description.length > 20)` | `image_description` | Generator Prompt Specification |

---

### Exhaustive State Transition Matrix: Unified Action Model

| Current Game State | Event: `SELECT_PIECE(sq)` | Event: `STANDARD_MOVE(from, to)` | Event: `EMPOWERED_MOVE(from, to, cardId)` | Event: `END_TURN` |
|---|---|---|---|---|
| **`TURN_START` (White / Black)** | ➔ `PIECE_SELECTED` (calc legal standard & empowered moves) | 400 `MUST_SELECT_FIRST` | 400 `MUST_SELECT_FIRST` | 400 `ACTION_REQUIRED` |
| **`PIECE_SELECTED`** | ➔ `PIECE_SELECTED` (switch active piece) | ➔ `RESOLVING_MOVE` (0⚡ cost, no card consumed) | ➔ `RESOLVING_EMPOWERED` (deduct 1–3⚡, consume card from hand) | ➔ `TURN_START` (Deselect) |
| **`RESOLVING_MOVE`** | 400 `BUSY` | 400 `BUSY` | 400 `BUSY` | ➔ `TURN_START` (Next player turn, reset energy to 3) |
| **`RESOLVING_EMPOWERED`** | 400 `BUSY` | 400 `BUSY` | 400 `BUSY` | ➔ `TURN_START` (Next player turn, reset energy to 3) |
| **`GAME_OVER`** | Ignored | 400 `MATCH_CONCLUDED` | 400 `MATCH_CONCLUDED` | 400 `MATCH_CONCLUDED` |

---

### Immutable System Invariants

1. **Zero-Ellipsis / Zero-Truncation Invariant**:
   - No card title, rules note, or UI description may contain an ellipsis (`...`) or be clipped by `line-clamp-2` or `text-overflow: ellipsis`.
   - *Enforcement*: Contract tests in `verify-all-cards.ts#Suite 16` validating `!desc.includes('...')` and character length bounds ($\le 120$ chars). CSS rules removal of `line-clamp` on card descriptions.
2. **Card ID Immutability**:
   - The primary identifier `id` of each card must remain strictly unchanged across all 180 cards.
   - *Enforcement*: `cardRegistry.ts` registers handlers keyed to `cardId`. Renaming an `id` would break gameplay handlers and cause tests to fail.
3. **Card Title Length Limit**:
   - Every card title must be 21 characters or less to fit on portrait cards and mobile ribbons.
   - *Enforcement*: `assert(card.name.length <= 21)` in test suite.
4. **Energy Cost Curve Balance**:
   - Each of the 6 pieces has exactly 30 cards, distributed strictly as:
     - 12 cards at `1⚡`
     - 12 cards at `2⚡`
     - 6 cards at `3⚡`
   - *Enforcement*: Automated distribution assertion per piece in `Suite 16`.
5. **6×6 Symmetrical 3-Cycle Invariant**:
   - Minor Units: Pawn excludes `Momentum`, Knight excludes `Lines`, Bishop excludes `Blocked`.
   - Major Units: Rook excludes `Position`, King excludes `Threat`, Queen excludes `Neighbors`.
   - *Enforcement*: Automated exclusion query check in `Suite 12` and `Suite 14`.
6. **Chess Safety & Rank Invariants**:
   - Pawns can never land on rank 1 or 8 without promoting.
   - No move (standard or empowered) can leave the friendly King in check.
   - *Enforcement*: FEN validation simulation in `DeckChessEngine.ts`.

---

## 3. Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| **Rules Text Format** | Direct concise description ($\le 120$ chars) | Fits comfortably in 2–3 lines on card faces without truncation or ellipses. |
| **Nomenclature Polish** | Replace 13 fantasy/melodramatic titles with direct tactical names | Eliminates flowery RPG jargon; aligns with user directive. |
| **Schema Normalization** | Keep `name`, `description`, `artId`; deprecate duplicates | Cleans JSON structure while keeping backwards compatibility. |
| **Asset Directory Convention** | `public/assets/cards/{piece}/{artId}.svg` | Prevents Vite JS bundle bloat and provides instant browser caching. |
| **Contract Verification** | Author `Suite 16` in `verify-all-cards.ts` | Provides continuous CI/test proof for all 180 cards. |

---

## 4. Asset Directory & Mapping Ledger

```
public/assets/cards/
├── pawn/
│   ├── pawn_hold_the_line.svg
│   ├── pawn_bayonet_charge.svg
│   └── ... (30 files)
├── knight/
│   ├── knight_cavalry_charge.svg
│   └── ... (30 files)
├── bishop/
│   ├── bishop_file_smite.svg
│   └── ... (30 files)
├── rook/
│   ├── rook_rampart_seal.svg
│   └── ... (30 files)
├── queen/
│   ├── queen_counter_smite.svg
│   └── ... (30 files)
└── king/
    ├── king_keep_garrison.svg
    └── ... (30 files)
```

Each card record maps to: `public/assets/cards/${card.anchor}/${card.artId}.svg`.

---

## 5. Patterns to Follow

- **Direct Action Formula**: Rules descriptions should follow: `[Trigger/Condition], [Action/Effect] [Target] [Constraints]`.
  - Example: *"While pinned to your King, destroy an adjacent diagonal enemy in-place."*
  - Example: *"When adjacent to an ally, place an impassable barrier for 2 turns on an adjacent empty square."*
- **Active Verbs**: Use *"destroy"*, *"slide"*, *"leap"*, *"swap"*, *"place barrier"*, *"grant shield"*, *"summon"*. Avoid passive or flowery fluff (*"channeled by grace"*, *"manifests"*, *"whispers"*).

---

## 6. Anti-Patterns to Avoid

- **`line-clamp-2` with Unbounded Text**: Do not use CSS line-clamp or ellipses to hide text overflow on game cards; tune text lengths to fit containers natively.
- **Modifying Card IDs**: Never edit `card.id` because behavioral handlers in `cardRegistry.ts` depend on exact IDs.
- **Bundling 180 SVGs in JavaScript**: Do not import 180 SVGs statically in `cardGraph.ts` or component files; use static public asset paths.

---

## 7. Ready for Planning

- [x] Questions answered and constraints defined
- [x] 5-layer contracts and system invariants mathematically specified
- [x] Titles and descriptions audited for zero ellipses and direct language
- [x] Asset storage directory structure designed
- [x] Test suite contract specified (`Suite 16`)
