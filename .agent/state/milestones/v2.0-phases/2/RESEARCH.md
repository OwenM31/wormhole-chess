# Phase 2 Research: Tactical Deck Builder Page & Arena Layout Redesign

## 1. Executive Summary & Objective

Phase 2 eliminates proportion distortion and vertical scrolling on the Deck Builder page (`/deck-builder`). In the v1 implementation, the vertical stacking of Top Navigation (52px) + Subheader (45px) + Opponent Bar (45px) + 520px Chessboard + Tactical Hand Bar (140px) caused the page height to exceed 800px, creating disruptive vertical scroll jank on standard 1280x800 and 1080p desktop viewports.

During `@design-phase.md 2`, the user approved **Variant A (Refined)** with the creator's authentic custom Wormhole Chess color scheme (`Constants.tsx`), a collapsible left navigation rail, flush 470px board and card dock, and an accordion/carousel hover expand effect.

---

## 2. Aesthetic & Token Specifications (Approved in Phase 2)

### 2.1 Authentic Wormhole Color Palette
| Token | Hex Value | Usage |
|---|---|---|
| `charcoal` (base) | `#191B1D` | Global canvas background |
| `charcoalSurface` | `#24272A` | Cards, panels, modal backdrops |
| `charcoalHeader` | `#1C1E20` | Headers, collapsible rail, action bars |
| `charcoalLight` | `#282B2E` | Elevated inputs, hover states |
| `warmWhite` | `#FAF9F6` | Primary high-contrast headings & text |
| `smokeyTaupe` | `#8B7E74` | Light chessboard squares, labels, subtitles |
| `lodenGreenDark` | `#3C493F` | Dark chessboard squares |
| `lodenGreen` | `#4C5C4C` | Primary actions ("Find Match"), positive statuses |
| `accentGold` | `#D4AF37` | Active player highlight, clocks, energy pips `⚡` |
| `red` | `#AA4A44` | Resign / danger actions, check highlights |
| `tacticalPurple` | `#A855F7` | Card targeting selection ring & active aura |

### 2.2 Approved Copy & Micro-copy
- **Header**: `Deck Builder Chess` (no subtitle)
- **Navigation Tabs**: `Find Match` and `My Deck`
- **Opponent Bar**: `Tactical AI (Medium)` · Graveyard piece glyphs (`♟ ♟`) · Clock `10:00`
- **Player Bar**: `GrandmasterX` · Graveyard piece glyphs (`♟ ♞ +2`) · Clock `09:42`
- **Turn Communication**: Chess.com-style illumination (active player bright with `#D4AF37` / `#FAF9F6`, inactive dimmed `#191B1D` with `#8B7E74`)
- **Move History**: Clean tabular notation (`1. e4 e5`, `✦ Holo-Barrier (e3)`, `2. Nf3 Nc6`) with zero cringey titles (no "Combat Log")
- **Tactical Hand**: `⚡ ENERGY 3/3`, `?` rules popover trigger, 8 flush cards with accordion hover expansion
- **Deck Forge ("My Deck")**: Title `Deck Loadout`, equipped status `8/8 Cards Equipped`, clean action buttons `Back to Arena`, `Reset Starter`, `Save Loadout`

---

## 3. Component Architecture & Decomposition

### 3.1 `DeckBuilderPage.tsx` (Top-Level Container & Router)
- Houses the top navigation header and subheader with mode tabs (`Find Match` and `My Deck`).
- Embeds the collapsible left sidebar rail (Home, 3D Wormhole, Deck Builder active indicator, Profile/Dashboard, Settings, and collapse/expand toggle).
- Manages active tab state (`arena` vs `forge` / `My Deck`).
- Manages game coordinator via `useDeckChessGame`.

### 3.2 `DeckChessBoard.tsx` (2D Board Component)
- Constrained to exactly 470px width and height on desktop (`aspect-ratio: 1 / 1`).
- Checkerboard styling updated to `smokeyTaupe` (`#8B7E74`) light squares and `lodenGreenDark` (`#3C493F`) dark squares.
- Coordinate labels (`a-h`, `1-8`) rendered with `#FAF9F6` at 60% opacity.
- King check alert styled with `#AA4A44` glow.
- Holographic barrier styled with `#3C493F` + `#D4AF37` border and `🛡️ 2T` badge.
- Capture indicator and legal move dots aligned to tactical gold/loden accents.

### 3.3 `TacticalHandBar.tsx` (Card Dock Component)
- Constrained to strictly 470px width (flush with chessboard).
- Displays top status line with `⚡ ENERGY [■][■][■] 3/3` and `(?)` help popover.
- Renders the 8 cards in an accordion/carousel layout (`cards-accordion`):
  - In resting state: All 8 cards occupy `flex: 1` (~42px min-width), displaying piece icon badge, cost pill (`2⚡`), and compact title.
  - On hover: The hovered card smoothly expands horizontally (`flex: 2.6`, ~115px) and lifts up (`transform: translateY(-4px)`), revealing full card name and 2-line effect rules (`card-desc-expanded`), while neighboring cards gently compress to keep the rack strictly within 470px.
  - On selection: Selected card displays `#D4AF37` / `#A855F7` border and glow aura.
  - Consumed / used cards show dashed border and reduced opacity (0.25).

### 3.4 `DeckBuilderView.tsx` ("My Deck" Loadout Curator)
- Aligned to the Wormhole color scheme (`#191B1D` base, `#24272A` cards, `#D4AF37` accents).
- Streamlined copy: "Deck Loadout", "Equipped Cards", "Card Library".
- Removes verbose instructional paragraph as requested by user.
- 8 equipped card slots with single-click remove and filter tabs (`All`, `Pawn`, `Knight`, `Bishop`, `Rook`, `Queen`, `King`).
- Preserves cloud synchronization (`/api/decks`) with guest `localStorage` fallback.

---

## 4. Execution Wave Strategy

To follow aggressive atomicity (2-3 tasks per plan, 2 plans total):

- **Plan 2.1 (Wave 1: Arena Shell & Chessboard Redesign)**:
  - Task 1: Refactor `DeckChessBoard.tsx` with 470px framing, `smokeyTaupe`/`lodenGreenDark` squares, coordinate styling, and tactical modifier overlays.
  - Task 2: Refactor `DeckBuilderPage.tsx` arena layout with collapsible left rail, active/dimmed player bars with piece graveyard glyphs, tabular move history, and match controls.

- **Plan 2.2 (Wave 2: Tactical Hand Bar & Deck Curator Redesign)**:
  - Task 1: Refactor `TacticalHandBar.tsx` with flush 470px width, 3-pip energy meter, and accordion/carousel hover expand effect.
  - Task 2: Refactor `DeckBuilderView.tsx` ("My Deck") with Wormhole Chess tokens, approved clean copy, and equipped loadout rack.
