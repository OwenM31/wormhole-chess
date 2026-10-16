# Design State & Aesthetic Continuity Log

> **Purpose**: Cumulative log of approved visual directions, tokens, and continuity rules across all phases of milestone v2.0.

---

## Phase 1: Design System Foundations & Player Dashboard Redesign

- **Date Approved:** 2026-10-15
- **Selected Variant:** **Variant A: Technical Density (2-Column Command Layout)**
- **Reference Image:** `.agent/state/artifacts/design/phase_1_approved.png`

### Rationale
- Maximizes screen efficiency and eliminates excessive vertical scrolling on desktop/laptop displays.
- Separates high-frequency interactive controls (quick play, matchmaking queues, and recent match list) into an expansive left feed, while anchoring identity, tabular statistics, and deck loadouts in a compact right sidebar.
- Crisp 6px borders with 1px hairline strokes evoke high-craft developer & strategy tools (Linear, Raycast) rather than bloated generic templates.

### Continuity Directives for Subsequent Pages (Phases 2–5)
1. **Background & Card Surfaces**:
   - Page canvas strictly `#090a0f`.
   - Card/Panel bodies strictly `#0e1118` with `#0c0e14` panel headers and `1px solid rgba(255, 255, 255, 0.08)` borders.
   - Hover elevations must use subtle border tinting (`rgba(56, 189, 248, 0.35)`) and dark surface shifts (`#11141d`).
2. **Typography & Tabular Numerals**:
   - High-contrast sans headers with uppercase metadata subheadings (`text-xs font-semibold tracking-wider text-slate-400`).
   - All numerical metrics (ratings, turn counts, clocks, coordinates) must use `ui-monospace` with `font-variant-numeric: tabular-nums`.
3. **Restrained Copy Policy**:
   - Zero hyperbolic lore or filler text.
   - Core game mode terms: "Wormhole" (3D) and "Deck Builder" (2D).
   - Navigation: "Wormhole Chess" · "Home" · "Wormhole" · "Deck Builder" · "Profile".
   - Actions: "Find Match", "Create Room", "Join with Code", "Replay".
4. **Phase 2 (Deck Builder) Application**:
   - Use the 6px card radius and hairline stroke styling on the tactical hand bar and card cards.
   - Ensure the 2D chessboard and combat log follow the balanced multi-column layout without vertical scroll bloating.

---

## Phase 2: Tactical Deck Builder Page & Arena Layout Redesign

- **Date Approved:** 2026-10-15
- **Selected Variant:** **Variant A (Refined) with Authentic Wormhole Palette**
- **Reference Image:** `.agent/state/artifacts/design/phase_2_approved.png`

### Rationale
- Completely eliminates vertical scrolling on standard desktop screens (1280×800) by balancing the board at 470px and locking the tactical card dock flush to the exact board width.
- Incorporates a collapsible left navigation rail (Home, 3D Wormhole, Deck Builder, Profile, Settings) that anchors the layout and eliminates dead space on the left.
- Communicates active turn state via Chess.com-style illumination/shading (bright active player vs dimmed opponent).
- Features an accordion/carousel hover expand effect where hovering a card smoothly expands it horizontally to reveal its rules and effect without exceeding the board width.
- Adopts the user's authentic custom-designed Wormhole Chess color scheme (`#191B1D` deep charcoal base, `#24272A` surface, `#FAF9F6` warm white, `#8B7E74` smokey taupe, `#3C493F` / `#4C5C4C` loden green, `#D4AF37` warm gold, `#AA4A44` brick red).

### Continuity Directives for Subsequent Pages (Phases 3–5)
1. **Global Color Identity**:
   - Apply the Wormhole Chess palette project-wide across Home, Auth, 3D Wormhole HUD, and Profile.
   - Headers and active states highlight with warm gold (`#D4AF37`).
   - Primary interactive triggers use loden green (`#4C5C4C` / `#5C6C5C`).
2. **Approved Copy Ground Rules**:
   - Mode Header: "Deck Builder Chess" (no subtitle).
   - Navigation Tabs: "Find Match" and "My Deck".
   - Graveyard: Real piece glyphs (`♟ ♞`) with advantage tally (`+2`).
   - Move history table with zero cringey titles (no "Combat Log").
3. **Future Polish Tracking**:
   - [TODO]: Further enhance the tactical card carousel with full-card pop-out reveal effect once card visual artwork/archetypes are fully fleshed out.

---

## Phase 3: Home Landing & Authentication Redesign

- **Date Approved:** 2026-10-15
- **Selected Variant:** **Variant Refined (Minimal Unified Stage with Card Asset Showcase)**
- **Reference Image:** `.agent/state/artifacts/design/phase_3_approved.png`

### Rationale
- Combines the unified tabbed stage from Variant B with the tactical card asset preview from Variant C.
- Strictly adheres to "less is more": completely removes the 3 unnecessary under-hero feature cards, eliminating corporate/generic AI filler.
- Features an ultra-restrained hero: `Wormhole Chess` with subtitle `A collection of chess variants.`.
- Direct mode one-liners approved by user:
  - 3D Wormhole: "Two 8x8 boards linked by a hole in the middle, for up to 4 players."
  - Deck Builder: "Standard chess rules with an 8-card loadout and 3 energy per turn."
- Features live 4-card sample loadout preview with piece-class accents (`#3fb950` Knight, `#58a6ff` Rook/Shield, `#A855F7` Warp, `#D4AF37` King) and energy badges.
- Tabbed authentication view (`Sign In` · `Register` · `Guest`) with crisp 6px card container and 1px hairline inputs, eliminating wordy marketing paragraphs.

### Continuity Directives for Subsequent Pages (Phases 4–5)
1. **Unified Stage & Tabs**:
   - Tab switchers must use `#1C1E20` container with 3px padding, 4px border radius, and active `#24272A` background with `#FAF9F6` high-contrast text.
2. **Minimalist Copy Standard**:
   - Every headline and subtext must remain ultra-concise ("less is more").
   - Eliminate filler metrics or generic feature blocks whenever possible.
3. **Card Asset Integration**:
   - Tactical card previews should continue using authentic piece-class colors and energy costs as new card archetypes are introduced.

---

## Phase 4: 3D Wormhole HUD & Multiplayer PlayRoom Redesign

- **Date Approved:** 2026-10-15
- **Selected Variant:** **Variant A: Tactical Glass HUD (Floating Command Overlay)**
- **Reference Image:** `.agent/state/artifacts/design/phase_4_approved.png`

### Rationale
- Completely liberates the 3D canvas from the clunky 380px fixed green sidebar and neon floating buttons, delivering full edge-to-edge spatial immersion.
- Introduces floating dark glass capsules (`rgba(28, 30, 32, 0.88)` + `backdrop-filter: blur(12px)`) with hairline warm gold and taupe accents.
- Top HUD capsule integrates `← Home`, mode pill `3D Wormhole`, Chess.com-style active turn status (`⚪ White to move · Turn 4`), and tabular chess clocks (`04:42 vs 05:00`).
- Bottom camera dock unifies camera presets (`Top View [T]`, `Flip 180° [F]`, `Rotate 90° [R]`, `Orbit Lock [L]`, `Reset [X]`) with tactile keybinding chips.
- Slide-out right telemetry drawer (`290px`) tucks move history and camera control hints away until summoned by the user.

### Continuity Directives for Subsequent Pages (Phase 5)
1. **Glass Overlay Consistency**:
   - Floating gaming HUDs and overlays must use `rgba(28, 30, 32, 0.88)` with `backdrop-filter: blur(12px)` and 6px border radii.
2. **Keyboard Shortcut Accessibility**:
   - Display tactile monospace key chips (`[T]`, `[F]`, `[R]`, `[L]`, `[X]`) alongside interactive camera actions.
3. **Multiplayer PlayRoom Cohesion**:
   - Apply the same dark glass cards, warm gold turn highlights, and tabular clock formatting to `PlayRoomPage.tsx` and `ChessClock.tsx`.

---

## Phase 7: Global Polish, 3-Column TCG Ruffle Hand Stage & Palette Unification

- **Date Approved:** 2026-10-16
- **Selected Variant:** **Variant D (Refined): Pure Left TCG Ruffle Hand + Full 512×512 Center Board + Right Moves/Chat Panel**
- **Reference Image:** `.agent/state/artifacts/design/phase_7_refined.png`

### Rationale
- Eliminates all redundant chrome and explanatory filler on `DeckBuilderPage.tsx`:
  1. Removes the desktop left route icon rail (`aside`), secondary full-width sub-header bar, and bottom under-board card bar.
  2. Keeps the Left Hand Stage (`356px` on desktop) ultra-pure: **only** the `⚡ ENERGY` bar (`3/3`) at the top and the **2×4 Portrait TCG Ruffle Hand** below—no `Find Match` / `My Deck` tabs in the left column and no instructional text notes (`"7/8 IN HAND"` or `"Hover any card..."`).
  3. Expands the Center Chessboard to a full `512×512px` square flanked only by the Opponent and Player status bars.
  4. Adds **`Moves` | `Chat`** segmented tabs to the top of the Right Panel (`280px`) alongside the `Turn` counter, with concise bottom match actions (`Resign` · `New Game` · `My Deck`).
- Each portrait card (`5:7` aspect ratio) follows a Pokémon/TCG layout (Header with Title & `⚡` Cost, Center Art / Animated Mini-Board Explainer Window showing the piece's move geometry, and Bottom Rules Box with `Condition ➔ Effect` tags and description) with smooth hover pop-out (`scale(1.22) translateY(-18px) rotate(0deg)`).
- Unifies Phase 1 views (`Navigation.tsx`, `DashboardPage.tsx`, `MatchmakingLobby.tsx`, `HistoricalMatchViewer.tsx`) onto the Authentic Wormhole Palette (`#191B1D`, `#24272A`, `#1C1E20`, `#D4AF37`, `#4C5C4C`).

---

## Milestone v3.0 — Phase 2: Minor Unit Vector Artwork Suite (90 Cards: Pawn, Knight, Bishop)

- **Date Approved:** 2026-10-16
- **Selected Baseline:** **Standardized 5×5 Isometric Board Foundation (Option B Ivory & Obsidian) with Authentic Staunton Piece Silhouette & Pure Vector Optics (Option 1: Centered Over Center)**
- **Reference Image:** `.agent/state/artifacts/design/phase_2_approved.png`
- **Canonical Asset Scaffold:** `public/assets/cards/knight/knight_cavalry_charge.svg`

### Rationale
- Completely eliminates floating/stepped square visual defects by establishing an immutable, mathematically coplanar 5×5 isometric board ($W=10.5, H=5.8, X_0=60, Y_0=38$, $dz=6$) that is reused across all card illustrations.
- Eliminates adjacent same-color square defects with a strict alternating parity formula `(col + row) % 2 === 0`.
- Option B (Alabaster Ivory `#D5CDC0` & Dark Obsidian `#2C3539`) delivers maximum visual contrast, allowing piece silhouettes, high 3D ballistic arcs, and glowing target reticles to remain crisp and readable at both full 220px zoom and in 38px TCG hand windows.
- Redesigned Knight piece using the official brand Staunton warhorse profile (tucked chin, Roman nose, broad muscular crest with 4 mane notches, turned plinth base, zero alpaca features), strictly centered on the origin tile with a 50% FIDE base-to-tile ratio ($rx=5.0, ry=2.75$).
- Eliminates raw text on board squares (`LEAP OVER`), relying strictly on high-craft vector optics: high 3D ballistic leap arcs, dashed ground-plane trajectory guides, glowing landing reticles with impact chevrons, and top HUD trigger condition badges (`COND: 2 SQUARES CLEAR`).

### Continuity Directives for Artwork Generation (Phases 2 & 3)
1. **Immutable Board Base**:
   - Every single Minor Unit (Pawn, Knight, Bishop) and Major Unit (Rook, Queen, King) vector asset MUST inherit the exact 5×5 coplanar board geometry and Option B palette.
2. **Strict Centering & Sizing**:
   - Piece bases must sit dead-center on the origin tile, with base diameter $\le 50\%$ tile width ($rx=5.0, ry=2.75$) and height $16–18$px. Zero overhang into adjacent squares.
3. **Pure Vector Storytelling**:
   - No stamped text on board tiles. Trigger conditions must live exclusively in the top HUD badge. Actions/effects must be rendered via luminous vector trajectories, beams, arcs, or impact reticles.
4. **Decoupled `<CardArt />` Component**:
   - Render assets via `public/assets/cards/{piece}/{artId}.svg` with zero layout shift and graceful piece glyph fallback.


