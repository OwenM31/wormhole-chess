---
phase: 7
level: 2
researched_at: 2026-10-16T05:26:30-05:00
---

# Phase 7 Research: Global Polish, Micro-interactions, Responsive Audit & Release

## Questions Investigated
1. **Cross-Page Aesthetic & Palette Continuity**: Where do color tokens or navigation patterns diverge across the 6 live routes (`/`, `/login`, `/dashboard`, `/deck-builder`, `/wormhole`, `/play/:code`) relative to `.agent/rules/STYLE.md`?
2. **3-Column Tactical Stage Architecture (`DeckBuilderPage.tsx`)**: How should the new Left Tactical Panel integrate with `useDeckChessGame`, `TacticalHandBar`, and `DeckChessBoard` to provide an Active 8-Card Loadout Tracker and live Card Inspector while reclaiming vertical space?
3. **Multi-Viewport Responsive Hardening**: What specific CSS/layout bottlenecks exist at Mobile (`375×812`), Tablet (`768×1024`), and Desktop (`1440×900`) viewports across all 6 routes and modal overlays?
4. **Procedural Audio & Micro-Interaction Completeness**: Which gameplay transitions (empowered captures, checkmate/game-over conclusions, card hover inspection) currently lack Web Audio or tactile visual feedback?

---

## Findings

### 1. Cross-Page Palette Unification (Phase 1 vs. Phase 2+ Token Drift)
In Phase 1, `Navigation.tsx`, `DashboardPage.tsx`, `MatchmakingLobby.tsx`, and `HistoricalMatchViewer.tsx` were built with the initial cool-slate/cyan/emerald palette (`#090a0f` base, `#0e1118` surface, `#0c0e14` header, `#38bdf8` cyan accents, `#10b981` emerald buttons). In Phase 2 (`[DECISION-016]`), the project locked the **Authentic Wormhole Chess Palette** (`#191B1D` base, `#24272A` surface, `#1C1E20` header, `#FAF9F6` warm white, `#8B7E74` smokey taupe, `#D4AF37` warm gold, `#4C5C4C` loden green, `#AA4A44` brick red), which was subsequently applied to Phases 2–6.

**Recommendation:**
Migrate `Navigation.tsx`, `DashboardPage.tsx`, `MatchmakingLobby.tsx`, and `HistoricalMatchViewer.tsx` to the Authentic Wormhole Palette tokens codified in `.agent/rules/STYLE.md`. Also update legacy board header strings in `PlayRoomPage.tsx` (`'3D Wormhole Hyperbolic Arena'` ➔ `'3D Wormhole'`, `'Deck Builder Chess Board'` ➔ `'Deck Builder'`).

### 2. 3-Column TCG Ruffle Hand Stage Architecture (`DeckBuilderPage.tsx` & `TacticalHandBar.tsx`)
Previously, `DeckBuilderPage.tsx` rendered:
- Global `<Navigation />` (`52px` height)
- A secondary full-width `<header>` (`41px` height) containing `"Deck Builder Chess"` and `"Find Match" | "My Deck"` buttons
- A desktop left `<aside>` icon rail (`58px` width) repeating the exact same 4 links as `<Navigation />` (`Home`, `Wormhole`, `Deck Builder`, `Profile`)
- A horizontal `TacticalHandBar` squeezed underneath a `470px` board.

**Recommendation:**
Implement **Variant D (Refined) (`[DECISION-020]`) — 3-Column TCG Ruffle Hand Stage**:
- Remove the secondary `<header>`, the redundant `<aside>` route icon rail, and the bottom under-board card strip.
- Structure the desktop arena (`lg:flex-row`) into 3 balanced columns (`596px` height) centered in the viewport:
  1. **Left TCG Hand Stage (`w-full lg:w-[356px]`)**:
     - Top bar: Pure `⚡ ENERGY` meter (`3/3` with 3 gold pips) — zero redundant mode tabs or `"7/8 IN HAND"` / `"Hover any card..."` text notes.
     - **2×4 Portrait TCG Ruffle Hand (`5:7` aspect ratio, `112×160px`)**: 2 rows of 4 overlapping portrait cards (`-ml-6`, subtle fan rotation) with smooth hover pop-out (`scale(1.22) translateY(-18px) rotate(0deg)`). Each card has a Top Header (Title + `⚡` Cost), Center Art / Visual Explainer Window (displaying the piece glyph or a 5×4 mini-board schematic on hover/active), and Bottom Rules Box (`Condition ➔ Effect` + description).
  2. **Center Board Stage (`w-full max-w-[512px]`)**:
     - Opponent status bar (`36px`) + Full **`512×512px` square `DeckChessBoard`** + Player status bar (`36px`).
  3. **Right Moves & Chat Panel (`w-full lg:w-[280px]`)**:
     - Top header with **`Moves` | `Chat`** segmented tabs and `Turn {N}` badge.
     - Scrollable algebraic move & card history (or interactive match chat panel when `Chat` is selected).
     - Bottom match action footer: `Resign` · `New Game` · `My Deck`.

### 3. Multi-Viewport Responsive Bottlenecks & Fixes
Audit across Mobile (`375×812`), Tablet (`768×1024`), and Desktop (`1440×900`) identified specific responsive items to harden:
- **`WormholePage.tsx` & `ChessboardScene.tsx`**:
  - Top HUD capsule (`overlayNavStyle`): Add `maxWidth: 'calc(100vw - 2rem)'` and compact mobile padding so it never overflows `375px` viewports.
  - Bottom Camera Dock (`ChessboardScene.tsx` line 2365): Currently lacks `flexWrap: 'wrap'` and `maxWidth: 'calc(100vw - 1.5rem)'`. Adding `flexWrap: 'wrap'`, `justifyContent: 'center'`, and `maxWidth: 'calc(100vw - 1.5rem)'` prevents horizontal overflow on `375px` mobile screens.
  - Remove stray per-piece `console.log("player " + ...)` at `ChessboardScene.tsx:2297` to keep browser console output clean and improve frame times.
- **`HistoricalMatchViewer.tsx`**:
  - `.body` uses inline `flexDirection: 'row'` and fixed `sidebar: { width: '280px' }`. Adding responsive media query classes (`.replay-modal-body`, `.replay-sidebar`) to stack vertically below `860px` ensures clean mobile/tablet replay viewing.
- **`PlayRoomPage.tsx`**:
  - `.playroom-layout` uses inline `gridTemplateColumns: 'minmax(0, 1fr) 300px'`. Adding a `<style>` media query to collapse `.playroom-layout` to `1fr` below `860px` prevents horizontal overflow on mobile/tablet.
- **`TacticalHandBar.tsx`**:
  - Update the `?` rules tooltip copy from legacy `"Pre-Move Window: Play 1 tactical card per turn using your energy before moving a chess piece"` to reflect the Unified Action Model (`"Empowered Moves: Select a piece to view standard moves (0⚡) and glowing gold card moves (1–3⚡), or pick a card from your hand."`) and wire `onHoverCard?: (cardId: string | null) => void` so hovering any card in the hand bar updates the Left Tactical Panel's Card Inspector.

### 4. Procedural Audio & Micro-Interaction Completeness
- In `src/hooks/useDeckChessGame.ts`:
  - `makeEmpoweredMove` currently calls `playCardSound()` and `playCheckSound()`, but does not trigger `playVictorySound()` / `playDefeatSound()` when an empowered move or standard move ends the game (`engineRef.current.isGameOver()`), nor does `triggerAiTurn` play victory/defeat audio when the AI checkmates the player.
  - Wiring game-over audio detection in `useDeckChessGame.ts` completes the Web Audio feedback loop across all game modes.

---

## Technical Architecture & Contracts

### 5-Layer Contract Alignment
| Domain Concept | Storage / Config | Shared TypeScript | Runtime Validation | Component Props Contract | UI / Client State |
|---|---|---|---|---|---|
| **Authentic Wormhole Theme Tokens** | `.agent/rules/STYLE.md` & `src/components/Constants.tsx` | Hex constants (`#191B1D`, `#24272A`, `#1C1E20`, `#D4AF37`, `#4C5C4C`, `#8B7E74`, `#AA4A44`) | Playwright computed style assertions | Inline / Tailwind style tokens across all 6 routes | Unified dark charcoal / warm gold / loden green surfaces |
| **Card Inspector State** | Canonical 180-Card Catalog (`cardCatalog90.json` + `cardCatalogMajor90.json`) | `CardDefinition` (`id`, `name`, `anchor`, `energyCost`, `conditionGenre`, `effectGenre`, `description`) | `getCardById(cardId)` lookup | `inspectedCardId: string \| null`, `onHoverCard?: (id: string \| null) => void` | Left Tactical Panel live inspector + `Active Loadout` status list |
| **Responsive Viewport Contract** | CSS Media Queries & Tailwind (`sm:`, `md:`, `lg:`) | Viewport dimensions (`375×812`, `768×1024`, `1440×900`) | `document.documentElement.scrollWidth <= window.innerWidth` | Responsive class hooks (`.dashboard-grid`, `.playroom-layout`, `.replay-modal-body`) | Zero horizontal overflow across all 6 routes |

### State Transition Matrix (Deck Builder 3-Column Arena & Inspector)
| Current UI State | Event: Hover Card in Hand / Loadout | Event: Select Piece on Board | Event: Click `"My Deck"` Toggle | Event: Match Concludes (`isGameOver = true`) |
|---|---|---|---|---|
| **Arena Idle (`activeTab = 'arena'`)** | `inspectedCard` ➔ hovered `CardDefinition` | Shows `0⚡` dots & `1–3⚡` gold rings; `inspectedCard` ➔ first usable card for piece | `activeTab` ➔ `'forge'` (renders 180-card `DeckBuilderView`) | Plays `playVictorySound()` or `playDefeatSound()`; displays Game Over overlay |
| **Card Targeting (`selectedCard != null`)** | `inspectedCard` remains locked to `selectedCard` | If valid anchor/target, advances targeting or executes card | Cancels targeting; `activeTab` ➔ `'forge'` | Plays conclusion audio; resets targeting |
| **Deck Curator (`activeTab = 'forge'`)** | Displays card details in curator grid | N/A (board hidden while curating) | Clicking `"Back to Match"` or `"Save Loadout"` ➔ `activeTab = 'arena'` | N/A |

### Immutable System Invariants
1. **Zero Horizontal Viewport Overflow**: Across all 6 routes (`/`, `/login`, `/dashboard`, `/deck-builder`, `/wormhole`, `/play/:code`) at `375×812`, `768×1024`, and `1440×900`, `document.documentElement.scrollWidth` MUST be `<= window.innerWidth`.
2. **100% Authentic Palette Compliance**: No Phase 1 legacy cool-slate/cyan backgrounds (`#090a0f`, `#0e1118`, `#0c0e14`) may remain on `Navigation.tsx`, `DashboardPage.tsx`, `MatchmakingLobby.tsx`, or `HistoricalMatchViewer.tsx`.
3. **Engine & Test Suite Integrity**: All 203 automated card engine assertions (`npm test`) and full-stack TypeScript checks (`npm run typecheck:all`) must continue passing with 0 errors.

---

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Cross-page palette unification | Migrate Phase 1 views to `#191B1D` / `#24272A` / `#D4AF37` / `#4C5C4C` | Eliminates visual seam between Home/DeckBuilder/Wormhole and Navigation/Dashboard (`[DECISION-020]`) |
| `DeckBuilderPage` desktop layout | 3-Column Tactical Stage (Left Tactical Panel + Center Board + Right Move History) | Eliminates redundant route rail & sub-header while filling left desktop space with Active Loadout & Card Inspector (`[DECISION-020]`) |
| `PlayRoomPage` board titles | `'3D Wormhole'` and `'Deck Builder'` | Matches restrained copy mandate in `.agent/rules/STYLE.md` (`[DECISION-020]`) |
| Release verification | Multi-viewport Playwright suite + `npm test` + `npm run typecheck:all` + `npm run build` | Provides deterministic empirical proof across all routes and viewports (`[DECISION-020]`) |

## Patterns to Follow
- Use `PIECE_COLOR_THEMES[card.anchor]` for consistent piece-class accents in the Left Tactical Panel's Active Loadout and Card Inspector.
- Keep desktop 3-column stage heights harmonized (`585px` panel height matching the `36px + 470px + 36px + handBar` center column) so the entire arena fits comfortably inside a `1280×800` / `1440×900` viewport without vertical page scrolling.
- On viewports below `1024px` (`lg`), stack the Center Board Stage first (`order-1`), followed by the Left Tactical Panel / Right Move History so mobile/tablet players see the chessboard and hand bar immediately at the top of the screen.

## Anti-Patterns to Avoid
- **Duplicate Navigation Chrome**: Do not render secondary route icon rails on pages that already mount `<Navigation />`.
- **Unwrapped Fixed-Width Flex Bars on Mobile**: Always pair floating HUD docks and filter bars with `flex-wrap: wrap` and `max-width: calc(100vw - ...)` so `375px` viewports never clip or scroll horizontally.
- **Render-Loop Console Spam**: Avoid `console.log` statements inside React Three Fiber scene render loops (`ChessboardScene.tsx`).

## Dependencies Identified
| Package | Version | Purpose |
|---------|---------|---------|
| `playwright` | `^1.59.1` | Multi-viewport (`375×812`, `768×1024`, `1440×900`) cross-route verification |
| `vite` / `typescript` | `^6.2.0` / `^5.7.2` | Production bundle compilation & full-stack typecheck |

## Risks
- **Mobile Board + Hand Bar Vertical Density**: Mitigated by ordering the Center Board & Hand Stage first on mobile/tablet (`order-1 lg:order-2`) and keeping the Left Tactical Panel compact below the board on small screens.

## Ready for Planning
- [x] Questions answered
- [x] Contracts and invariants specified
- [x] Approach selected
- [x] Dependencies identified
