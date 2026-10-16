# UX Defect Ledger

**Latest Sweep Date:** 2026-10-15 19:19
**Scope:** All Application Surface Routes (`/`, `/login`, `/register`, `/dashboard`, `/deck-builder`, `/wormhole`, `/play/:code`)
**Target Environment:** Local Full-Stack Preview (`http://localhost:4173`)
**Total Inspected:** 6 routes, 26 interactive elements, 13 retina screenshots (Desktop 1280x800 and Mobile 375x667)
**Active Defects:** 0 (P0: 0, P1: 0, P2: 0, P3: 0)
**Historical Defects Resolved:** 4/4 (100% resolved in Plans 5.4 & 5.5)

---

## Active Defects

None. All 6 surface routes rendered cleanly with zero console runtime crashes, zero horizontal overflows (`scrollWidth === clientWidth`), verified form validation alerts, active tab toggles, and modal escapability.

---

## Planned Visual Polish Observations (Scoped to Upcoming Phases)

### [OBS-001] 3D Wormhole Controls Overlay & Action Bar Visual Craft
- **Severity:** P3 (Planned Phase 4 Redesign Scope)
- **Route:** `/wormhole`
- **Observed:** The 3D camera controls (`180° (F)`, `Rotate 90° (R)`, `Reset Orientation (X)`) render as legacy light gray rectangular buttons sitting against the 3D board canvas border, and the top-left action buttons mix bright blue and dark gray styles.
- **Planned Action:** Fully addressed in upcoming **Phase 4: 3D Wormhole HUD & Multiplayer PlayRoom Redesign** (`@[.agent/workflows/design-phase.md] 4 wormhole`), which introduces floating tactical glass HUD overlays, unified camera presets, and design token alignment.
- **Evidence:** `.agent/state/artifacts/screenshots/sweep_03_wormhole_desktop.png`

---

## Historical Resolved Defects

### [DEF-001] Deck Builder Chess visual layout collapsed and pieces overflowing due to missing Tailwind CSS compiler
- **Severity:** P0 (Blocker)
- **Status:** Resolved in Plan 5.4
- **Route:** `/deck-builder`
- **Resolution:** Configured `@tailwindcss/vite` and `tailwindcss` in `vite.config.ts` and `src/index.css`. Constrained chessboard squares and piece SVGs.

---

### [DEF-002] 3D Wormhole Chess Header title text overlapped and clipped by floating navigation buttons
- **Severity:** P2 (UX / State Glitch)
- **Status:** Resolved in Plan 5.5
- **Route:** `/wormhole`
- **Resolution:** Added `hideHeaderTitle` prop to `ChessboardScene.tsx` when mounted in `WormholePage`.

---

### [DEF-003] Home page displays "In Development (2D)" badge and "Explore Rules & Preview →" for Deck Builder Chess
- **Severity:** P3 (Visual Polish / Slop)
- **Status:** Resolved in Plan 5.5 & Phase 3
- **Route:** `/`
- **Resolution:** Redesigned Home landing page with unified interactive variant switcher tabs and live playable action buttons.

---

### [DEF-004] Deck Builder Subheader displays raw phase milestone label "2D Phase 4"
- **Severity:** P3 (Visual Polish / Slop)
- **Status:** Resolved in Plan 5.4 & Phase 2
- **Route:** `/deck-builder`
- **Resolution:** Updated subheader to player-facing copy "Tactical 2D".
