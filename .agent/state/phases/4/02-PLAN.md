---
phase: 4
plan: 2
wave: 2
---

# Plan 4.2: PlayRoom Page Polish & Empirical Playwright UX Verification

## Objective
Verify that `PlayRoomPage.tsx` and `ChessClock.tsx` operate seamlessly with the approved design system tokens and zero-fluff microcopy, and build an automated headless Playwright UX test suite `scripts/verify-phase4-ux.mjs` verifying desktop (1280x800) and mobile (375x667) viewports across `/wormhole` and `/play/:code`.

## Context
- `.agent/rules/STYLE.md` (Design tokens, zero-fluff copy, 4-state invariants)
- `.agent/state/DESIGN_STATE.md` (Phase 4 design continuity directives)
- `src/pages/PlayRoomPage.tsx` (Multiplayer room arena)
- `src/components/ChessClock.tsx` (Tactical chess clocks)
- `src/pages/WormholePage.tsx` (3D Wormhole HUD page)

## Tasks

<task type="auto">
  <name>Task 1: Verify PlayRoom Room Lifecycle & Conclude Dialog Polish</name>
  <files>src/pages/PlayRoomPage.tsx, src/components/ChessClock.tsx</files>
  <action>
    1. In `src/pages/PlayRoomPage.tsx`:
       - Verify room code badge, share link button, and spectator banner inherit the 6px card radius and `#1C1E20` / `#24272A` styling.
       - Ensure chat sidebar renders restrained zero-fluff copy ("Chat", "No messages", "Send message...").
       - Verify game-over conclusion modal inherits `#24272A` card styling and `#4C5C4C` primary action button without default blue gradients.
    2. In `src/components/ChessClock.tsx`:
       - Confirm active turn illumination uses `#D4AF37` warm gold border and glow.
       - Confirm disconnect banner renders clean warning without layout shift.
  </action>
  <verify>npm run typecheck:all</verify>
  <done>PlayRoomPage and ChessClock compile cleanly with zero type errors and inherit all design tokens.</done>
</task>

<task type="auto">
  <name>Task 2: Author and Execute Headless Playwright Verification Suite</name>
  <files>scripts/verify-phase4-ux.mjs, .agent/state/phases/4/VERIFICATION.md</files>
  <action>
    1. Author `scripts/verify-phase4-ux.mjs` using Playwright (`channel: 'chrome'`):
       - Test Desktop viewport (1280x800):
         - Navigate to `/wormhole`:
           - Verify canvas fills full viewport without fixed 380px sidebar.
           - Verify floating top HUD capsule renders `← Home`, `3D Wormhole`, and `🏁 Conclude Match`.
           - Verify floating bottom camera dock renders all 5 camera actions with keybinding badges.
           - Click drawer toggle and verify `Moves` drawer slides out cleanly.
           - Capture screenshot `.agent/state/artifacts/screenshots/phase4_wormhole_desktop.png`.
         - Navigate to `/play/TEST4`:
           - Verify room bar, chess clocks, and arena placeholder render design system tokens.
           - Capture screenshot `.agent/state/artifacts/screenshots/phase4_playroom_desktop.png`.
       - Test Mobile viewport (375x667):
         - Navigate to `/wormhole`:
           - Verify zero horizontal scrolling (`scrollWidth === clientWidth`).
           - Capture screenshot `.agent/state/artifacts/screenshots/phase4_wormhole_mobile.png`.
         - Navigate to `/play/TEST4`:
           - Verify mobile stack and responsive clocks.
           - Capture screenshot `.agent/state/artifacts/screenshots/phase4_playroom_mobile.png`.
    2. Run the test suite and verify 0 errors.
    3. Compile `.agent/state/phases/4/VERIFICATION.md` documenting test results, screenshots, and PASS verdict.
  </action>
  <verify>node scripts/verify-phase4-ux.mjs</verify>
  <done>Playwright UX verification suite passes with 0 errors and captures all 4 retina screenshots.</done>
</task>

## Success Criteria
- [ ] Automated Playwright UX test suite passes cleanly across desktop and mobile.
- [ ] 3D Wormhole HUD verified edge-to-edge without fixed 380px sidebar constriction.
- [ ] All 4 retina verification screenshots captured in `.agent/state/artifacts/screenshots/`.
- [ ] `VERIFICATION.md` recorded with PASS verdict.
