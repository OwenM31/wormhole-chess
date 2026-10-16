---
phase: 2
plan: "01"
wave: 1
depends_on: []
must_haves:
  - "DeckChessBoard.tsx rendered with smokey taupe (#8B7E74) and loden green dark (#3C493F) squares with 470px width"
  - "DeckBuilderPage.tsx arena layout featuring collapsible left navigation rail and right tabular move history"
  - "Active turn indicated by Chess.com-style illumination (warm gold/white active player vs dimmed opponent)"
  - "Opponent and player status bars display actual piece glyphs (♟ ♞) for graveyards instead of text labels"
---

# Plan 2.1: Arena Layout & Chessboard Redesign

## Objective
Re-architect the 2D battle arena layout in `DeckBuilderPage.tsx` and refactor `DeckChessBoard.tsx` to eliminate vertical scrolling on standard desktop viewports (1280x800). Implement the collapsible left navigation rail, Chess.com-style active turn illumination, piece graveyard glyphs, and the authentic Wormhole Chess color palette (`#191B1D` base, `#24272A` cards, `#8B7E74` / `#3C493F` board squares, `#D4AF37` gold highlights).

## Context
- `.agent/rules/STYLE.md` — Wormhole authentic palette and approved copy
- `.agent/state/DESIGN_STATE.md` — Variant A Refined directives
- `.agent/state/phases/2/RESEARCH.md` — Component architecture and token specs
- `src/components/DeckChessBoard.tsx` — Current 2D chessboard component
- `src/pages/DeckBuilderPage.tsx` — Current arena page container
- `src/components/Constants.tsx` — Original color constants

## Tasks

<task type="auto">
  <name>Task 1: Refactor DeckChessBoard styling with authentic Wormhole squares and 470px framing</name>
  <files>src/components/DeckChessBoard.tsx</files>
  <action>
    Update `src/components/DeckChessBoard.tsx` to match the approved Phase 2 design tokens:
    1. Set the board container to a balanced desktop size of 470px by 470px (with responsive scaling on mobile: `w-full max-w-[470px] aspect-square`), eliminating vertical overflow.
    2. Update checkerboard square colors from generic slate to authentic Wormhole palette:
       - Light squares: Smokey Taupe (`#8B7E74`, with hover brightness 1.15)
       - Dark squares: Loden Green Dark (`#3C493F`, with hover brightness 1.15)
    3. Update coordinate labels:
       - Rank coordinates (1-8) and file coordinates (a-h) styled with `#FAF9F6` at opacity 0.6 in `font-mono`.
    4. Refine tactical overlays:
       - Move dots: Subtle emerald/gold indicators (`#D4AF37` / `#10b981`)
       - Capture rings: `#AA4A44` border pulse on squares with capturable pieces
       - Holographic barrier: `#3C493F` translucent fill with `#D4AF37` border and `🛡️ 2T` badge
       - King check glow: `#AA4A44` pulse border
    5. Maintain all existing props (`fen`, `orientation`, `selectedSquare`, `legalMoves`, `validAnchorSquares`, `validTargetSquares`, `activeModifiers`, `inCheck`, `onSquareClick`) and preserve data-square attributes.
  </action>
  <verify>npm run typecheck:all</verify>
  <done>DeckChessBoard renders with 470px dimensions, smokey taupe and loden green squares, coordinate markers, and clean typecheck.</done>
</task>

<task type="auto">
  <name>Task 2: Refactor DeckBuilderPage arena shell with collapsible left rail, status bars, and move history</name>
  <files>src/pages/DeckBuilderPage.tsx</files>
  <action>
    Update `src/pages/DeckBuilderPage.tsx` to adopt the Variant A Refined layout:
    1. Top Subheader:
       - Clean restrained title: "Deck Builder Chess" (no subtitle, no emojis).
       - Mode tabs: "Find Match" (active in arena) and "My Deck" (switches to customizer).
       - Background `#141618`, border `rgba(139, 126, 116, 0.2)`.
    2. Left Collapsible Navigation Rail:
       - Render a 58px sidebar rail on desktop with icon links for Home (`🏠`), 3D Wormhole (`🌀`), Deck Builder active state (`🃏` with gold indicator), Profile (`📊`), Settings (`⚙️`), and collapse toggle (`◀`).
       - Background `#141618`, border `rgba(139, 126, 116, 0.2)`.
    3. Center Arena Stage:
       - Opponent Status Bar (dimmed when opponent turn, `#191B1D` with `#8B7E74` text): "Tactical AI (Medium)" · Graveyard piece icons (`♟ ♟`) · Clock `10:00`.
       - Centered `DeckChessBoard` (470px).
       - Player Status Bar (illuminated when active, `#24272A` with `#FAF9F6` and `#D4AF37` border glow): "GrandmasterX" · Graveyard piece icons (`♟ ♞`) with advantage tally (`+2`) · Clock `09:42`.
       - Tactical Hand Bar mount point (flush 470px width).
    4. Right Move History Sidebar:
       - Header: "Move History" (text-xs uppercase font-bold text-smokeyTaupe `#8B7E74`) and "Turn {n}".
       - Tabular move list with algebraic notation plies (`1. e4 e5`, `2. Nf3 Nc6`) and subtle card activation tags (`✦ Holo-Barrier (e3)`).
       - Action footer with "Resign" (`#AA4A44`), "New Game", and primary "Find Match" (`#4C5C4C` loden green).
       - Remove the redundant match setup settings inputs from live gameplay.
    5. Post-Game Modal Overlay:
       - Update colors to `#24272A` surface, `#D4AF37` highlights, and approved copy ("Victory", "Defeat", "Draw", "Rematch", "My Deck").
  </action>
  <verify>npm run typecheck:all &amp;&amp; npm run build</verify>
  <done>DeckBuilderPage compiles cleanly, renders the collapsible left rail, active/dimmed player bars with piece graveyards, and tabular move history within standard 1280x800 viewport without vertical scrolling.</done>
</task>

## Success Criteria
- [ ] `DeckChessBoard.tsx` renders with `#8B7E74` and `#3C493F` squares and 470px desktop width.
- [ ] `DeckBuilderPage.tsx` arena incorporates the collapsible left rail, active/dimmed player bars, and tabular move history.
- [ ] Full-stack typecheck (`npm run typecheck:all`) passes cleanly with 0 errors.
- [ ] Production build (`npm run build`) passes cleanly in under 2 seconds.
