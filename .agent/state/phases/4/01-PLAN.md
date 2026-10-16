---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: 3D Wormhole HUD & Floating Camera Dock Refactor

## Objective
Refactor `ChessboardScene.tsx` and `WormholePage.tsx` to eliminate the clutter of the fixed 80px top bar, 380px olive sidebar, and scattered neon buttons. Implement the user-approved **Variant A: Tactical Glass HUD** architecture with an edge-to-edge 100vw × 100vh Three.js canvas, floating top HUD capsule, floating bottom-center camera control dock (`Top View [T]`, `Flip 180° [F]`, `Rotate 90° [R]`, `Orbit Lock [L]`, `Reset [X]`), and a collapsible right telemetry slide-out drawer (`290px`) for move notation and controls hints.

## Context
- `.agent/rules/STYLE.md` (Design tokens, glass overlay rules, and restrained copy)
- `.agent/state/DESIGN_STATE.md` (Phase 4 Variant A approval and directives)
- `.agent/state/artifacts/design/phase_4_approved.png` (Visual reference for Variant A)
- `src/components/ChessboardScene.tsx` (Current 3D Three.js scene and overlay components)
- `src/pages/WormholePage.tsx` (Wormhole route wrapper and match persistence)

## Tasks

<task type="auto">
  <name>Task 1: Eliminate Fixed Sidebars & Expand Canvas to Full Viewport</name>
  <files>src/components/ChessboardScene.tsx, src/pages/WormholePage.tsx</files>
  <action>
    1. In `src/components/ChessboardScene.tsx`:
       - Remove the fixed 80px top header bar (`height: "80px", backgroundColor: COLORS.charcoal`), eliminating duplicate header collision with `WormholePage.tsx`.
       - Remove the fixed 380px right sidebar (`width: "380px", backgroundColor: COLORS.lodenGreenDark`), allowing the canvas container to occupy full width and height.
       - Remove the raw unstyled floating buttons (`Horizontal Lock 🔒 (L)`, `180° 🔄 (F)`, `Rotate 90° ⟳ (R)`, `Reset Orientation ⬜ (X)`, and raw `Players ⚡` button) from the canvas container.
       - Ensure all 3D WebGL functionality, Three.js models, OrbitControls, piece movement, animations, sounds, and wormhole topological transformations remain 100% functional.
    2. In `src/pages/WormholePage.tsx`:
       - Mount the unified Variant A top glass HUD capsule (`← Home`, `3D Wormhole SPATIAL`, active turn indicator `⚪ White to move · Turn {N}`, tabular clocks, and `🏁 Conclude Match`).
       - Ensure `containerStyle` and `canvasContainerStyle` fill `100vw × 100vh` without scrollbars.
  </action>
  <verify>npm run typecheck:all</verify>
  <done>ChessboardScene mounts edge-to-edge with no fixed 80px header or 380px fixed sidebar, and typecheck passes cleanly.</done>
</task>

<task type="auto">
  <name>Task 2: Build Floating Bottom Camera Dock & Collapsible Telemetry Drawer</name>
  <files>src/components/ChessboardScene.tsx</files>
  <action>
    1. Implement the floating bottom-center camera control dock in `src/components/ChessboardScene.tsx`:
       - Container: `rgba(28, 30, 32, 0.88)` + `backdrop-filter: blur(14px)`, `border: 1px solid rgba(139, 126, 116, 0.25)`, `borderRadius: 6px`.
       - Buttons with monospace keybinding badges:
         - `Top View` (`[T]` key)
         - `Flip 180°` (`[F]` key)
         - `Rotate 90°` (`[R]` key)
         - `Orbit Lock` (`[L]` key, toggles `polarLocked` with active gold border `#D4AF37`)
         - `Reset` (`[X]` key)
       - Bind keyboard event listeners (`T`, `F`, `R`, `L`, `X`) and button clicks to existing camera rotation/lock functions.
    2. Implement the collapsible right telemetry slide-out drawer (`290px`):
       - Default state: drawer closed, showing a discreet floating toggle tab on the right edge: `Moves ({count}) ◨` with gold chip.
       - Expanded state: slides out from right edge (`width: 290px`, `background: rgba(28, 30, 32, 0.95)`, `backdropFilter: blur(16px)`).
       - Drawer content:
         - Header: `Moves` with ply count badge.
         - Body: Clean tabular move notation list (`1. e4 e5`, `3. Bc4 🌀 d6` with wormhole traversal marker).
         - Footer: Clean `Camera Tips` section explaining OrbitControls (Left Drag: orbit, Right Drag: pan, Scroll: zoom).
       - Close trigger button to collapse back to floating tab.
  </action>
  <verify>npm run build</verify>
  <done>Camera dock and collapsible telemetry drawer are implemented with tactile keybinding chips and build succeeds cleanly.</done>
</task>

## Success Criteria
- [ ] 3D Three.js canvas renders edge-to-edge with zero fixed 80px header or 380px fixed sidebar.
- [ ] Floating bottom camera dock controls view orientation and locks polar angle cleanly.
- [ ] Collapsible telemetry drawer slides out on demand showing move notation and camera tips.
- [ ] Production build succeeds cleanly.
