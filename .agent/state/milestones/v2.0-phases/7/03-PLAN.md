---
phase: 7
plan: 3
wave: 3
depends_on: [1, 2]
---

# Plan 7.3: 3D Wormhole Mobile HUD Hardening, Multi-Viewport Playwright Audit & Release Verification

## Objective
Harden the 3D Wormhole HUD (`WormholePage.tsx` & `ChessboardScene.tsx`) for mobile and tablet viewports while eliminating render-loop console spam, then author and execute a comprehensive Multi-Viewport Playwright Verification Suite (`scripts/verify-phase7-polish.mjs`) across all 6 live routes and 3 viewport classes (`375×812` mobile, `768×1024` tablet, `1440×900` desktop) alongside full production build verification.

## Context
- `.agent/rules/STYLE.md`
- `.agent/state/DESIGN_STATE.md`
- `.agent/state/DECISIONS.md` (DECISION-020)
- `.agent/state/phases/7/RESEARCH.md`
- `src/pages/WormholePage.tsx`
- `src/components/ChessboardScene.tsx`

## Tasks

<task type="auto">
  <name>Task 1: Harden 3D Wormhole HUD for Mobile Viewports & Remove Render-Loop Console Spam</name>
  <files>src/pages/WormholePage.tsx, src/components/ChessboardScene.tsx</files>
  <action>
    1. In `src/pages/WormholePage.tsx`:
       - Add `maxWidth: 'calc(100vw - 2.5rem)'` to `overlayNavStyle` so the floating top HUD capsule wraps cleanly inside `375px` mobile viewports without overflowing horizontally.
    2. In `src/components/ChessboardScene.tsx`:
       - Remove the stray per-piece `console.log("player " + player + ": " + color + " " + piece);` inside the piece render loop at line 2297 to eliminate console spam and improve render performance.
       - Update the Floating Bottom Camera Control Dock container (`bottom: '24px'`, line 2365) to include `flexWrap: 'wrap'`, `justifyContent: 'center'`, and `maxWidth: 'calc(100vw - 1.5rem)'` so all 5 camera preset buttons wrap cleanly inside `375px` mobile screens without horizontal clipping.
  </action>
  <verify>npm run typecheck:all && npm run build</verify>
  <done>WormholePage.tsx and ChessboardScene.tsx compile cleanly, render-loop console.log is removed, and floating HUD overlays wrap cleanly within 375px mobile viewports.</done>
</task>

<task type="auto">
  <name>Task 2: Author & Execute Multi-Viewport Playwright Verification Suite (scripts/verify-phase7-polish.mjs)</name>
  <files>scripts/verify-phase7-polish.mjs</files>
  <action>
    Create `scripts/verify-phase7-polish.mjs` and run it against the production Vite preview build (`npm run build` + `vite preview`):
    1. Verify all 6 live routes (`/`, `/login`, `/dashboard`, `/deck-builder`, `/wormhole`, `/play/TEST01`) across 3 viewport classes:
       - Mobile (`375×812`)
       - Tablet (`768×1024`)
       - Desktop (`1440×900`)
    2. Assert zero horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`) on every route across all 3 viewports.
    3. Assert Authentic Wormhole Palette compliance:
       - Top `<header class="nav-header">` computed background is `rgb(28, 30, 32)` (`#1C1E20`).
       - `/dashboard` page container computed background is `rgb(25, 27, 29)` (`#191B1D`).
    4. Assert the Phase 7 3-Column TCG Ruffle Hand Stage on `/deck-builder` at `1440×900`:
       - Assert 8 portrait `.tcg-card` elements are rendered in the Left Hand Stage.
       - Hover a `.tcg-card` and verify the mini-board visual explainer (`[data-testid="tcg-mini-board"]` or `.mini-grid`) is visible inside the card art window.
       - Assert the Right Panel renders both `Moves` and `Chat` tab buttons; click `Chat` to verify the chat panel renders, then switch back to `Moves`.
       - Select a piece on the `512×512` board and capture a high-DPI visual proof screenshot to `.agent/state/artifacts/screenshots/phase7_global_polish.png`.
    5. Assert 0 uncaught page errors or console errors across the entire run.
  </action>
  <verify>npm test && npm run typecheck:all && npm run build && node scripts/verify-phase7-polish.mjs</verify>
  <done>All 203 card engine tests pass, typecheck and production build succeed with 0 errors, and scripts/verify-phase7-polish.mjs exits 0 with all 6 routes and 3 viewports verified.</done>
</task>

## Success Criteria
- [ ] All 6 live routes (`/`, `/login`, `/dashboard`, `/deck-builder`, `/wormhole`, `/play/TEST01`) exhibit `scrollWidth <= innerWidth` at `375×812`, `768×1024`, and `1440×900`.
- [ ] `Navigation.tsx` and `DashboardPage.tsx` pass computed style assertions for Authentic Wormhole Palette tokens.
- [ ] `/deck-builder` 3-Column TCG Ruffle Hand Stage, mini-board visual explainer, `512×512` board, and `Moves | Chat` tabs are verified in headless Chromium and captured in `.agent/state/artifacts/screenshots/phase7_global_polish.png`.
- [ ] `npm test`, `npm run typecheck:all`, `npm run build`, and `node scripts/verify-phase7-polish.mjs` all exit with code 0.
