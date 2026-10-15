---
phase: 1
plan: 2
wave: 2
depends_on:
  - "01"
files_modified:
  - src/components/HistoricalMatchViewer.tsx
  - src/pages/DashboardPage.tsx
autonomous: true

must_haves:
  truths:
    - "HistoricalMatchViewer modal renders with dark backdrop and #0e1118 surface with 6px radius"
    - "Move notation sidebar displays tabular monospace figures with active move auto-scroll"
    - "Playback controls (Prev, Auto Play, Next) use clean 4px button styling"
    - "DashboardPage 2-column layout collapses cleanly to single column on viewports under 900px"
    - "Full-stack typecheck and production build pass with zero errors"
  artifacts:
    - "src/components/HistoricalMatchViewer.tsx"
    - "src/pages/DashboardPage.tsx"
---

# Plan 1.2: Historical Replay Viewer Modal Polish & Responsive Layout Hardening

<objective>
Refactor `HistoricalMatchViewer.tsx` to inherit Phase 1 design system tokens (dark backdrop overlay, `#0e1118` modal body, 6px radii, monospace move list, and clean playback controls), and add responsive breakpoint handling to `DashboardPage.tsx` so the 2-column layout gracefully collapses to a single-column stack on viewports narrower than 900px.

Purpose: Complete the Phase 1 visual overhaul with polished match replay telemetry and responsive device hardening.
Output: Refactored `HistoricalMatchViewer.tsx` and responsive `DashboardPage.tsx`.
</objective>

<context>
Load for context:
- .agent/state/SPEC.md
- .agent/rules/STYLE.md
- .agent/state/DESIGN_STATE.md
- src/components/HistoricalMatchViewer.tsx
- src/pages/DashboardPage.tsx
- src/components/DeckChessBoard.tsx
</context>

<tasks>

<task type="auto">
  <name>Refactor HistoricalMatchViewer modal styling to locked design tokens</name>
  <files>src/components/HistoricalMatchViewer.tsx</files>
  <action>
    Update modal overlay, modal container, board frame, and sidebar styling in `src/components/HistoricalMatchViewer.tsx`:
    1. Overlay: Backdrop `rgba(9, 10, 15, 0.85)` with `backdropFilter: blur(8px)`.
    2. Modal dialog: `#0e1118` surface with `1px solid rgba(255, 255, 255, 0.08)`, `borderRadius: 6px`, max-width 1040px, and max-height 90vh.
    3. Modal header: Clean restrained title ("Match Replay", White vs Black, date, and result badge) with clean close button (✕).
    4. Move notation sidebar: Monospace tabular numbers (`ui-monospace`), `#090a0f` background, clean active ply highlight (`rgba(56, 189, 248, 0.12)`), and piece-anchor badge colors for tactical card plays.
    5. Playback bar: Clean 4px buttons for `◀ Prev`, `Auto Play` / `Pause`, `Next ▶`, and `Flip Board` with emerald/cyan accent highlights.
    6. AVOID: Do not touch sound triggers (`playCardSound`, `playMoveSound`), move navigation indices, or FEN synchronization logic.
  </action>
  <verify>npm run typecheck:all</verify>
  <done>HistoricalMatchViewer compiles cleanly with zero TypeScript errors and matches Phase 1 styling.</done>
</task>

<task type="auto">
  <name>Harden responsive layout breakpoints in DashboardPage</name>
  <files>src/pages/DashboardPage.tsx</files>
  <action>
    Add responsive styling to `DashboardPage.tsx`:
    1. Implement a responsive CSS class or `@media` breakpoint:
       - On viewports >= 960px: 2-column grid (`1fr 340px`, gap `1.5rem`).
       - On viewports < 960px: Single-column flex stack with full-width cards.
    2. Ensure Quick Play cards wrap gracefully on narrow screens (< 600px).
    3. Verify that tables, match rows, and stats boxes do not produce horizontal scrolling on mobile viewports (375px width).
    4. Run full production build to ensure all styling and TypeScript checks pass.
  </action>
  <verify>npm run build</verify>
  <done>Production bundle compiles in < 10s and responsive layout operates without horizontal overflow.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] HistoricalMatchViewer modal matches Phase 1 design tokens (6px radii, dark glass overlay).
- [ ] DashboardPage layout collapses smoothly below 960px without horizontal scroll.
- [ ] Full-stack typecheck passes (`npm run typecheck:all`).
- [ ] Production build succeeds (`npm run build`).
- [ ] All 83 automated card engine tests pass (`npm test`).
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
