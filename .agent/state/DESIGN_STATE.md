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
