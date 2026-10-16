# Phase 1 Research: Design System Foundations & Player Dashboard Redesign

## Discovery Level: Level 0 (Internal Styling & Component Refactoring)

All architectural and visual discoveries were conducted during `@design-phase.md 1` with explicit user confirmation of candidate UI copy and visual direction selection (**Variant A: Technical Density**).

---

## 1. Locked Visual System Tokens & Identity

### Design Foundations
- **Base Canvas**: `#090a0f` (deep jet space)
- **Primary Surface / Cards**: `#0e1118` with `#0c0e14` panel headers
- **Elevated Controls / Inactive Filters**: `#141722` or `#171b26` (border `rgba(255, 255, 255, 0.08)`)
- **Card Hover Elevation**: `#11141d` with subtle border highlight `rgba(56, 189, 248, 0.35)`
- **Dividers & Strokes**: strictly `1px solid rgba(255, 255, 255, 0.08)` (subtle dividers: `rgba(255, 255, 255, 0.04)`)
- **Accents**:
  - Cyan: `#38bdf8`
  - Emerald (Matchmaking / Win): `#10b981` (hover `#059669`; badge `#4ade80`, bg `rgba(74, 222, 128, 0.1)`)
  - Rose (Loss / Danger): `#f87171`
  - 3D Arena Blue: `#2563eb`
  - Deck Builder Purple: `#7c3aed`
- **Typography**:
  - Sans: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif`
  - Monospace: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace` with `font-variant-numeric: tabular-nums` for all metrics, timers, ratings, and move counts.
- **Radii**: `6px` for structural panels, cards, and modal dialogs; `4px` for buttons, pills, and inputs.

---

## 2. Approved UI Copy & Tone of Voice

1. **Top Navigation**:
   - Logo: `Wormhole Chess` with `v2.0` badge
   - Links: `Home` · `Wormhole` · `Deck Builder` · `Profile`
   - Audio: `🔊` / `🔇`
   - User pill: `{user.username} · {elo} ELO` (no emojis)
   - Account: `Member` vs `Guest`
2. **Dashboard Quick Play**:
   - `Wormhole`: "3D chess across connected boards and portals." [Play Wormhole →]
   - `Deck Builder`: "Chess with card actions and energy management." [Play Deck Builder →]
3. **Matchmaking Lobby**:
   - Modes: `Deck Builder` / `Wormhole`
   - Clocks: `Untimed`, `3 min`, `5 min`, `10 min`
   - Actions: `Find Match`, `Create Room`, `Join with Code`
4. **Recent Matches**:
   - Filters: `All`, `Online`, `Offline`
   - Status: `Win` (emerald), `Loss` (rose), `Draw` (muted slate)
   - Action: `Replay` (launches historical viewer modal)
5. **Historical Replay Viewer**:
   - Header: `Match Replay` (`[White] vs [Black] · [Date]`)
   - Controls: `◀ Prev`, `Auto Play`, `Next ▶`, `Flip Board`

---

## 3. Scope Decomposition for Phase 1 Execution

The presentational UI shell for `Navigation.tsx` and `DashboardPage.tsx` was established in `@design-phase.md`. Phase 1 execution now decomposes into two focused plans:

- **Plan 1.1 (Wave 1): Matchmaking Lobby Component Alignment**
  - Refactor `MatchmakingLobby.tsx` internal styles and copy to inherit Phase 1 tokens (segmented control, clock pills, 6px panel styling, approved text strings, clean responsive wrapping).
  - Ensure real-time WebSocket events and private room generation remain 100% functional without regressions.
  
- **Plan 1.2 (Wave 2): Historical Replay Viewer Modal Polish & Mobile Responsive Hardening**
  - Refactor `HistoricalMatchViewer.tsx` modal styling to match Phase 1 design tokens (deep `#090a0f` overlay, `#0e1118` modal body, 6px radius, tabular monospace move notations, clean step/auto-play controls).
  - Harden responsive breakpoints for the 2-column Dashboard grid so on screens < 900px it stacks into a single column cleanly.
