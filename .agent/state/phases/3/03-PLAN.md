---
phase: 3
plan: 3
wave: 2
depends_on: ["01"]
files_modified:
  - src/hooks/usePlayerProfiles.ts
  - src/components/DeckBuilderMainMenu.tsx
  - src/components/MultiplayerCharacterStage.tsx
  - src/components/DeckBuilderView.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - "DeckBuilderMainMenu implements the approved Fluid 11-Column Loden Green Grid (grid-template-columns: repeat(11, minmax(0, 1fr))) with Columns 3–6 for Mode Buttons, Column 7 gutter, and Columns 8–10 for the Player Showcase Card—zero hardcoded pixel column widths"
    - "Switch Profile modal supports switching between local profile slots (Slot 1–3, + New Slot) and toggling Playtest Mode (Unlock All 36 Cards & 5 Copies)"
    - "Clicking Multiplayer opens MultiplayerCharacterStage full-screen with the player's Living Piece character backdrop, Top-Right Play Buttons (Offline Match, Search for Opponent, Private Match, Async Matches), Equipped 8-Card Hand, and Filterable/Sortable 36-Card Library"
    - "Every card in the hand and library renders with its Pokémon-style Piece-Colored Frame (Gray, Green, Blue, Purple, Red, Gold) and a vertical 5-Dot Copy Stack (●) indicating allowed/equipped copies (1–5)"
  artifacts:
    - "src/hooks/usePlayerProfiles.ts exists and persists multi-slot profiles in localStorage"
    - "src/components/DeckBuilderMainMenu.tsx exists and implements the fluid 11-column grid"
    - "src/components/MultiplayerCharacterStage.tsx exists and renders the full-screen character backdrop, top-right play cluster, 8-card hand, and 5-dot 36-card library"
---

# Plan 3.3: Multi-Profile Manager, Fluid 11-Column Main Menu Hub & Full-Screen Multiplayer Character Stage

<objective>
Build the local Multi-Profile Manager (`usePlayerProfiles.ts`), the approved **Fluid 11-Column Loden Green Main Menu Hub (`DeckBuilderMainMenu.tsx`)**, and the **Full-Screen Multiplayer Character Stage (`MultiplayerCharacterStage.tsx`)** featuring the Top-Right Play Cluster (`Offline Match`, `Search for Opponent`, `Private Match`, `Async Matches`), configurable 8-card equipped hand, Pokémon-style piece-colored card frames, and 36-card filterable/sortable library with the 5-dot copy stack.

Purpose: Delivers the complete menu, profile switching, and deck-building/matchmaking hub defined in `@design-phase 3` and `[DECISION-027]`.
Output: `src/hooks/usePlayerProfiles.ts`, `src/components/DeckBuilderMainMenu.tsx`, `src/components/MultiplayerCharacterStage.tsx`, and updated `src/components/DeckBuilderView.tsx`.
</objective>

<context>
Load for context:
- .agent/rules/STYLE.md (Section 8: Fluid 11-Column Focal Grid)
- .agent/state/DESIGN_STATE.md
- .agent/state/DECISIONS.md ([DECISION-027])
- .agent/state/artifacts/design/phase_3_menu_hub_approved.png
- src/engine/cards/releaseRoster36.ts
- src/components/DeckBuilderView.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create Local Multi-Profile Hook (usePlayerProfiles.ts)</name>
  <files>src/hooks/usePlayerProfiles.ts</files>
  <action>
    Create `src/hooks/usePlayerProfiles.ts` to manage up to 4 local player profile slots persisted in `localStorage` (`wc_deck_profiles_v3`):
    - Each `PlayerProfile` includes:
      - `id: string` (`slot_1`, `slot_2`, `slot_3`)
      - `name: string` (default `'Wooden Pawn'`)
      - `level: number` (default `1`)
      - `gold: number` (default `240`)
      - `playtestAll36: boolean` (default `true` on Slot 1 so all 36 cards and 5 copies per card are unlocked immediately for playtesting; `false` on fresh Campaign slots)
      - `unlockedCards: string[]` (all 36 card IDs when `playtestAll36` is true; `['p1_sidestep']` on a fresh campaign slot)
      - `copyLimits: Record<string, number>` (defaults to `1` copy per card; returns `5` when `playtestAll36` is true)
      - `handSize: number` (configurable `1` to `8`, default `8`)
      - `equippedHand: string[]` (array of card IDs up to `handSize`)
      - `gear: { material: string; headgear: string; base: string }` (default `{ material: 'Carved Oak', headgear: 'None', base: 'Tavern Coin' }`)
    - Expose actions: `switchProfile(id)`, `createOrResetProfile(id, name, playtestAll36)`, `updateProfileName(name)`, `setHandSize(size)`, `equipCard(cardId)`, `unequipCardAtIndex(index)`, `clearHand()`, `togglePlaytestMode()`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>`usePlayerProfiles.ts` compiles cleanly and manages multi-slot profiles, hand size (`1–8`, default `8`), and copy limits (`1–5`).</done>
</task>

<task type="auto">
  <name>Task 2: Build the Fluid 11-Column Loden Green Main Menu Hub (DeckBuilderMainMenu.tsx)</name>
  <files>src/components/DeckBuilderMainMenu.tsx</files>
  <action>
    Create `src/components/DeckBuilderMainMenu.tsx` matching `.agent/state/artifacts/design/phase_3_menu_hub_approved.png` and Section 8 of `.agent/rules/STYLE.md`:
    1. **Fullscreen Loden Green & Smokey Taupe Atmospheric Background SVG**:
       - Render the architectural castle causeway & perspective board floor SVG in Loden Green (`#3C493F`, `#4C5C4C`), Smokey Taupe (`#8B7E74`), and Deep Charcoal (`#191B1D`).
    2. **Fluid 11-Column CSS Grid (`grid-template-columns: repeat(11, minmax(0, 1fr))`)**:
       - NEVER use hardcoded pixel widths (`470px`, `320px`) or fixed pixel heights (`215px`).
       - **Left Primary Menu Stack (`grid-column: 3 / span 4` on desktop)**:
         - Header: `Deck Builder Chess`
         - **`Campaign`** button (`onOpenCampaign`)
         - **`Multiplayer`** button (`onOpenMultiplayer`)
         - Bottom Row: **`My Profile`** button (`onOpenProfileModal`) paired with the compact **`⇄ Switch Profile`** button (`onOpenSwitchModal`).
       - **Center Gutter**: Column 7 (`1fr` natural grid spacer).
       - **Right Companion Showcase Card (`grid-column: 8 / span 3` on desktop)**:
         - Top Telemetry Bar: Active slot pill (`Slot 1`), profile name (`Wooden Pawn`), `LVL`, and `🪙 Gold`.
         - **Character Canvas**: Uses `aspect-ratio: 4 / 3` (responsive, zero fixed pixel height) with the Living Pawn pedestal preview (`data-testid="character-canvas"`).
         - **Gear & Cosmetics Strip**: 3-column grid displaying `Material`, `Headgear`, and `Base`.
         - **Equipped Hand Footer**: Shows `HAND ({equipped}/{handSize})` and the compact card codes (`P1 · N1 · B2...`).
    3. **Modals for `My Profile`, `Switch Profile`, and `Campaign Preview`**:
       - `Switch Profile` modal lets the user switch between `Slot 1`, `Slot 2`, `Slot 3`, create/reset a slot, or toggle `Playtest Mode (All 36 Cards & 5 Copies)`.
       - `My Profile` modal lets the user edit their profile name, inspect their Gear/Cosmetics, and toggle `Playtest Mode`.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>`DeckBuilderMainMenu.tsx` renders the fluid 11-column Loden Green grid with zero hardcoded pixel column widths and full profile switching.</done>
</task>

<task type="auto">
  <name>Task 3: Build the Full-Screen Multiplayer Character Stage, Pokémon Piece-Color Cards & 5-Dot Library (MultiplayerCharacterStage.tsx)</name>
  <files>src/components/MultiplayerCharacterStage.tsx, src/components/DeckBuilderView.tsx</files>
  <action>
    Create `src/components/MultiplayerCharacterStage.tsx` (and update `DeckBuilderView.tsx` to share/delegate to the new 36-card library components) per `[DECISION-027]`:
    1. **Full-Screen Character Room Backdrop**:
       - Expands the Character Canvas to full screen (`position: relative; min-height: calc(100vh - 54px)`), placing the player's Living Chess Piece standing inside an atmospheric Loden Green & Taupe chamber as the upper/background focal stage, with a `← Main Menu` button at top-left.
    2. **Top-Right Play Action Cluster (Chess.com-inspired)**:
       - **`Offline Match`**: Opens inline/modal match configurator (Player Color `White / Black`, AI Difficulty `Easy / Medium / Tactical`, Hand Size `1–8` default `8`, and AI Deck mode `Random 8-Card Hand / Mirror My Hand / Standard 0-Card Towny`) and launches the match (`onStartOfflineMatch`).
       - **`Search for Opponent`**: Launches/opens online matchmaking queue (`onSearchOpponent`).
       - **`Private Match`**: Opens Create Room / Join with Code flow (`onOpenPrivateMatch`).
       - **`Async Matches`**: Opens asynchronous active matches drawer/modal (`onOpenAsyncMatches`).
    3. **Lower Stage — Equipped 8-Card Hand + Filterable/Sortable 36-Card Library**:
       - **Equipped Hand Row**: Shows the `handSize` (default `8`) card slots directly below the character stage, with a compact `Hand Size: [8 ▾]` selector (`1–8`) and `Clear Hand` / `Auto-Fill` actions.
       - **Filterable & Sortable 36-Card Library**:
         - Filter tabs by Piece Class: `All (36)`, `Pawn (8)`, `Knight (7)`, `Bishop (7)`, `Rook (6)`, `Queen (4)`, `King (4)`.
         - Sort dropdown/toggle: `By Playbook Order (P1–K4)`, `By Piece Class`, `By World (W1–W7)`, `Alphabetical`.
       - **Pokémon-Style Piece-Colored Card Outline + Placeholder Art Window**:
         - Each card is framed in its piece-class color (`Pawn: #8A9199 Gray`, `Knight: #3FB950 Green`, `Bishop: #3B82F6 Blue`, `Rook: #A855F7 Purple`, `Queen: #EF4444 Red`, `King: #D4AF37 Gold`) with card code (`P1`) + title in the top header, a clean piece-tinted placeholder art window in the center, and full zero-ellipsis `Condition ➔ Effect` rules text below.
       - **5-Dot Copy Stack (`●`)**:
         - Rendered vertically alongside each library card (`data-testid="copy-dot-stack"`), showing 5 dots: lit dots indicate how many copies the player is allowed (`1` default, `5` in Playtest Mode), with an indicator of how many copies are currently equipped in the hand. Clicking a card adds a copy to the hand (up to `maxCopies` and `handSize`).
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>`MultiplayerCharacterStage.tsx` and `DeckBuilderView.tsx` compile cleanly with full-screen character backdrop, top-right play buttons, 8-card hand, Pokémon piece-colored cards, and 5-dot copy stacks.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npx tsc --noEmit` exits with code 0
- [ ] `DeckBuilderMainMenu.tsx` uses `grid-template-columns: repeat(11, minmax(0, 1fr))` (`grid-column: 3 / span 4` and `grid-column: 8 / span 3`) with zero hardcoded pixel column widths
- [ ] `MultiplayerCharacterStage.tsx` renders the 5-dot copy stack (`1–5`) and Pokémon piece-colored card frames (`Gray, Green, Blue, Purple, Red, Gold`)
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
