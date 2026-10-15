---
phase: 4
plan: 3
wave: 3
depends_on:
  - "01"
  - "02"
files_modified:
  - src/components/DeckChessBoard.tsx
  - src/components/TacticalHandBar.tsx
  - src/components/DeckBuilderView.tsx
  - src/pages/DeckBuilderPage.tsx
autonomous: true
user_setup: []

must_haves:
  truths:
    - DeckChessBoard renders an 8x8 responsive SVG/CSS grid with coordinate labels, crisp piece visuals, legal move indicators, and modifier overlays (energy barriers, shields)
    - TacticalHandBar displays the player's 8-card hand with piece-class color badges, energy cost tags, 3-cell energy meter (⚡ 3/3), and card activation controls
    - DeckBuilderView allows browsing the card library, curating an 8-card tactical battle loadout, and saving to localStorage or D1
    - DeckBuilderPage provides a mode selector between Solo Play vs AI and Online Room Play, connecting the board to both local AI and real-time GameRoomDO multiplayer
  artifacts:
    - src/components/DeckChessBoard.tsx
    - src/components/TacticalHandBar.tsx
    - src/components/DeckBuilderView.tsx
    - src/pages/DeckBuilderPage.tsx
---

# Plan 4.3: 2D Board UI, Tactical Hand Bar, Deck Builder & Multiplayer Integration

<objective>
Assemble the full user-facing 2D Deck Builder Chess experience. Build the responsive 2D SVG/CSS chessboard with modifier auras (`DeckChessBoard.tsx`), the piece-anchored tactical hand bar with energy meter (`TacticalHandBar.tsx`), the custom deck loadout builder (`DeckBuilderView.tsx`), and mount them into `DeckBuilderPage.tsx` with dual mode launchers (Solo Play vs AI and Online Multiplayer via `GameRoomDO`).

Purpose: Deliver the complete, playable 2D Deck Builder Chess experience meeting REQ-08, REQ-09, REQ-10, REQ-11, and CON-03.
Output: Visual board component, tactical hand bar, loadout builder view, and complete `DeckBuilderPage.tsx`.
</objective>

<context>
Load for context:
- .agent/state/SPEC.md
- .agent/state/phases/4/RESEARCH.md
- .agent/state/phases/4/01-PLAN.md
- .agent/state/phases/4/02-PLAN.md
- src/hooks/useDeckChessGame.ts
- src/hooks/useGameRoom.ts
- src/engine/cardGraph.ts
- src/pages/DeckBuilderPage.tsx
</context>

<tasks>

<task type="auto">
  <name>Build DeckChessBoard and TacticalHandBar components</name>
  <files>src/components/DeckChessBoard.tsx, src/components/TacticalHandBar.tsx</files>
  <action>
    1. Create `src/components/DeckChessBoard.tsx`:
       - Responsive 8x8 chessboard styled in dark-sci-fi theme (dark square `#1b222d`, light square `#2d3748`).
       - Crisp SVG chess pieces for White and Black with drop shadows.
       - Coordinate file (a-h) and rank (1-8) labels.
       - Board orientation toggle (White on bottom vs Black on bottom based on player role).
       - Interactive highlights:
         * Selected piece square highlighted in glowing blue (`#388bfd44`).
         * Legal move target dots (`#238636` green dot for empty destination, `#f85149` red ring for capturable piece).
         * Card targeting valid squares highlighted in amber or violet when picking anchor/target.
       - Visual Modifier Overlays:
         * Active barrier squares rendered with a glowing holographic energy grid icon.
         * Shielded pieces rendered with a golden hexagonal shield aura.
       - Click handling: Square selection, destination click, and card targeting clicks.
    2. Create `src/components/TacticalHandBar.tsx`:
       - Fixed bottom or inline dock showing the player's 8-card loadout.
       - 3-cell glowing energy counter: `⚡ 3 / 3 Energy`.
       - Card cards styled with piece-class theme colors (`#d29922` Pawn, `#3fb950` Knight, `#bc8cff` Bishop, `#58a6ff` Rook, `#f778ba` Queen, `#e3b341` King).
       - Displays card cost, piece class badge icon, card title, and brief ability tooltip.
       - Card status states: `Ready` (clickable if affordable), `Selected` (active targeting), `Consumed` (dimmed/used this match), `Disabled` (insufficient energy or card window closed).
       - Targeting action controls: "Confirm Target", "Cancel", and indicator of current targeting requirement (e.g. "Select a friendly Knight").
    AVOID: Drag-and-drop complexity that breaks on mobile touch devices; ensure full click-to-select and click-to-target interactions are primary.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>DeckChessBoard and TacticalHandBar render cleanly with full styling and compile with zero TypeScript errors.</done>
</task>

<task type="auto">
  <name>Build DeckBuilderView for custom 8-card battle loadout management</name>
  <files>src/components/DeckBuilderView.tsx</files>
  <action>
    Create `src/components/DeckBuilderView.tsx`:
    1. Loadout Curator:
       - Displays currently selected 8-card battle deck and remaining available cards in the library.
       - Filter by piece class anchor (All, Pawn, Knight, Bishop, Rook, Queen, King).
       - Card detail card with energy cost, conditions, effect description, and piece-class color styling.
       - Add / Remove cards with visual counter (e.g. `8 / 8 Cards Selected`).
       - Enforces deck building constraints: Exactly 8 cards, at least 1 pawn card, at least 1 minor piece card.
    2. Persistence:
       - Saves active deck to `localStorage` under `deck_builder_loadout_v1` so guests retain their setup.
       - If user is logged in, provides "Save to Cloud" button interacting with custom deck storage.
       - "Reset to Starter Deck" button to immediately restore the balanced 8-card starter pool.
  </action>
  <verify>npx tsc --noEmit</verify>
  <done>DeckBuilderView allows adding/removing cards, validates the 8-card deck constraint, and saves loadouts cleanly.</done>
</task>

<task type="auto">
  <name>Assemble DeckBuilderPage with dual mode launchers (Solo AI & Online Matchmaking)</name>
  <files>src/pages/DeckBuilderPage.tsx</files>
  <action>
    Upgrade `src/pages/DeckBuilderPage.tsx` from placeholder into the full tactical battle arena:
    1. Header & Navigation:
       - Top `Navigation` bar.
       - Mode tabs: `Battle Arena` and `Deck Builder (Customize)`.
    2. Game Mode Selector:
       - When in Battle Arena without an active match:
         * "Solo Play vs AI": Choose difficulty (Easy / Tactical), choose side (White / Black / Random), and launch instant local game.
         * "Play Online": Embedded quick match queue or private room creation (seamlessly linking to `MatchmakingLobby.tsx` or `/play/:code`).
    3. Active Match View:
       - Opponent Status Bar: Opponent name/bot label, captured pieces graveyard, turn indicator, and remaining cards.
       - Center: `DeckChessBoard` component connected to `useDeckChessGame` hook.
       - Bottom: `TacticalHandBar` with live energy meter and interactive targeting.
       - Game Over Overlay: Displays winner, checkmate/resignation reason, "Play Again" button, and rematch launcher.
       - Turn history / Combat log: Compact side panel recording moves in SAN and card activations (e.g. `White played [Cavalry Escort] -> Nf3`).
    4. Seamless integration with `useGameRoom`:
       - If entered with a room code (or online mode), binds WebSocket events to `useDeckChessGame.applyRemoteTurn` and sends moves through `sendTurn`.
  </action>
  <verify>npm run build</verify>
  <done>DeckBuilderPage renders the complete 2D chess arena with playable solo AI bot, interactive card hand, deck customizer, and online room launcher; production build passes in under 10 seconds.</done>
</task>

</tasks>

## Success Criteria
- [ ] `DeckChessBoard` renders 8x8 SVG board with pieces, legal move dots, and energy barrier/shield overlays.
- [ ] `TacticalHandBar` renders 8 cards with piece-class theme colors (`#d29922`, `#3fb950`, `#bc8cff`, `#58a6ff`, `#f778ba`, `#e3b341`) and live 3-cell energy meter.
- [ ] `DeckBuilderView` provides intuitive 8-card loadout curation with local and cloud persistence.
- [ ] `DeckBuilderPage` offers instant Solo Play vs AI bot and Online Room battles.
- [ ] Complete production build passes cleanly (`npm run build`).
