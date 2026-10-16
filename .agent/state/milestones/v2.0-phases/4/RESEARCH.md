# Phase 4 Research: 3D Wormhole HUD & Multiplayer PlayRoom Redesign

## Discovery Level: Level 0 (Internal Component Architecture & UI Shell Wiring)

### Objective
Replace the cluttered, legacy overlays on 3D Wormhole Chess (`WormholePage.tsx`, `ChessboardScene.tsx`) and multiplayer room arena (`PlayRoomPage.tsx`, `ChessClock.tsx`) with the user-approved **Variant A: Tactical Glass HUD** architecture:
1. Floating top glass HUD capsule with unified game status and actions.
2. Floating bottom-center camera control dock with tactile keybinding chips (`[T]`, `[F]`, `[R]`, `[L]`, `[X]`).
3. Collapsible right telemetry slide-out drawer (`290px`) replacing the fixed 380px olive sidebar, allowing 100% full-screen spatial immersion.
4. Cohesive styling across `ChessClock.tsx` and `PlayRoomPage.tsx` adhering to the authentic Wormhole Chess design system tokens (`#191B1D`, `#24272A`, `#1C1E20`, `#D4AF37`, `#8B7E74`, `#4C5C4C`).

---

## 1. Architectural Analysis of `ChessboardScene.tsx`

### Current Obstacles & Clutter
1. **Fixed 80px Top Header**:
   - Statically mounted above the canvas (`position: "absolute", top: 0, height: "80px"`), creating duplicate headers with `WormholePage.tsx`.
   - Contains a bulky `Sandbox Mode / Competitive Mode` checkbox toggle and `RESET GAME` button.
2. **Fixed 380px Right Sidebar**:
   - Permanently rendered alongside the canvas (`width: "380px", backgroundColor: COLORS.lodenGreenDark`), stealing nearly one-third of the desktop viewport width and constricting the 3D Three.js canvas.
   - Contains `Open Themes` button, `GameInfo`, `MoveLog`, and `ControlsInfo`.
3. **Scattered Floating Canvas Buttons**:
   - `Horizontal Lock 🔒 (L)` button floating in top-right with raw `backgroundColor: polarLocked ? "green" : "gray"`.
   - Cluster of three buttons in bottom-right (`180° 🔄 (F)`, `Rotate 90° ⟳ (R)`, `Reset Orientation ⬜ (X)`) with raw white/black inline styles overlapping the board geometry.
   - `Players ⚡` button floating in top-left with raw popover.

### Refactored Architecture (Variant A: Tactical Glass HUD)
1. **Edge-to-Edge Three.js Canvas**:
   - Canvas container expands to 100vw × 100vh full viewport.
   - Zero fixed sidebars squeezing the WebGL projection.
2. **Floating Top HUD Capsule (in `WormholePage.tsx` / `ChessboardScene.tsx`)**:
   - `← Home` nav pill.
   - Mode badge: `3D Wormhole` (`SPATIAL`).
   - Active turn status: `⚪ White to move · Turn {N}` with live gold glow.
   - Tabular monospace clocks: `04:42 vs 05:00`.
   - Conclude match trigger: `#4C5C4C` button (`🏁 Conclude Match`).
3. **Floating Bottom-Center Camera Dock**:
   - Compact glass island grouping all 5 camera operations:
     - `Top View` (`[T]`)
     - `Flip 180°` (`[F]`)
     - `Rotate 90°` (`[R]`)
     - `Orbit Lock` (`[L]`)
     - `Reset` (`[X]`)
4. **Collapsible Right Telemetry Slide-Out Drawer (`290px`)**:
   - Smooth slide-out drawer triggered by a discreet floating tab `Moves ({count}) ◨`.
   - Houses move notation feed (`1. e4 e5`, `3. Bc4 🌀 d6` with wormhole traversal marker).
   - Houses player slot customizer and camera keyboard/mouse controls hint.

---

## 2. Multiplayer PlayRoom & ChessClock Alignment

### `ChessClock.tsx`
- Replaced 14px rounded cards and `#6366f1` indigo accents with 6px `#24272A` cards and `#D4AF37` warm gold active player glow.
- Monospace tabular numerals `fontVariantNumeric: 'tabular-nums'`.

### `PlayRoomPage.tsx`
- Replaced deep blue `#0a0b1e` background with authentic `#191B1D`.
- Replaced all raw inline styling with the design system tokens.
- Enforced zero-fluff microcopy: `Chat` (not "Match Chat"), `No messages` (not "No messages yet. Say hello!").

---

## 3. Plan Decomposition & Wave Architecture

### Wave 1: 3D Wormhole HUD Overlays & Camera Dock
- **Plan 4.1**: `ChessboardScene.tsx` & `WormholePage.tsx` Refactor:
  - Eliminate fixed 80px header and 380px fixed green sidebar.
  - Implement full-viewport Three.js canvas.
  - Build floating bottom-center camera control dock with keybinding badges (`Top View [T]`, `Flip 180° [F]`, `Rotate 90° [R]`, `Orbit Lock [L]`, `Reset [X]`).
  - Wire collapsible right slide-out telemetry drawer (`290px`) for move notation and camera tips.

### Wave 2: Multiplayer PlayRoom & Empirical Headless UX Sweep
- **Plan 4.2**: `PlayRoomPage.tsx` Integration & Automated Playwright Verification:
  - Integrate refined `ChessClock.tsx` into live room lifecycle.
  - Build automated Playwright verification test `scripts/verify-phase4-ux.mjs` verifying:
    - Desktop (1280x800) and mobile (375x667) viewports.
    - Full-viewport canvas without fixed 380px sidebar constriction.
    - Floating top HUD capsule and bottom camera dock presence and keybindings.
    - Zero horizontal overflow.
  - Execute full test suite and capture retina verification screenshots.
