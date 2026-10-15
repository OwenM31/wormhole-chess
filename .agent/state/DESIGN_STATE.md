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
