---
phase: 5
plan: 5
wave: 1
depends_on: []
files_modified:
  - src/pages/HomePage.tsx
  - src/components/ChessboardScene.tsx
  - src/pages/WormholePage.tsx
autonomous: true
gap_closure: true

must_haves:
  truths:
    - "Home page variant card displays green 'Playable (2D)' status and primary action button"
    - "3D Wormhole Chess navigation overlay renders cleanly with zero text overlap or clipping from the scene canvas"
  artifacts:
    - "src/pages/HomePage.tsx with updated Deck Builder Chess card"
    - "src/components/ChessboardScene.tsx with hideHeaderTitle support"
    - "src/pages/WormholePage.tsx passing hideHeaderTitle"
  key_links:
    - "HomePage links directly to /deck-builder with live variant call-to-action"
    - "WormholePage cleanly encapsulates ChessboardScene without UI collision"
---

# Plan 5.5: 3D Wormhole Header & Home Page Variant Card Polish

<objective>
Resolve DEF-002 (P2 UX Glitch) and DEF-003 (P3 Polish) by updating the Home page variant card for Deck Builder Chess to reflect its completed playable status, and eliminating text overlap in 3D Wormhole Chess by allowing WormholePage to suppress the underlying canvas header title.

Purpose: Fix stale roadmap messaging on the landing page and prevent visual text clipping in the 3D scene.
Output: Polished Home landing card and clean 3D Wormhole header layout.
</objective>

<context>
Load for context:
- .agent/state/DEFECTS.md
- src/pages/HomePage.tsx
- src/components/ChessboardScene.tsx
- src/pages/WormholePage.tsx
</context>

<tasks>

<task type="auto">
  <name>Update Home Page Deck Builder variant card to Playable (2D)</name>
  <files>src/pages/HomePage.tsx</files>
  <action>
    1. In `src/pages/HomePage.tsx#L48-L58`, change the status tag from `statusTagRoadmapStyle` ("In Development (2D)") to `statusTagLiveStyle` ("Playable (2D)").
    2. Change the button link style from `secondaryButtonActionStyle` to `primaryButtonActionStyle`.
    3. Update the button text from `Explore Rules & Preview →` to `Play Deck Builder Chess →`.
    AVOID: Modifying other cards, navigation links, or hero messaging.
  </action>
  <verify>grep -q "Playable (2D)" src/pages/HomePage.tsx && grep -q "Play Deck Builder Chess →" src/pages/HomePage.tsx</verify>
  <done>Home page variant card renders 'Playable (2D)' badge and 'Play Deck Builder Chess →' primary button.</done>
</task>

<task type="auto">
  <name>Suppress duplicate scene title to eliminate WormholePage header clipping</name>
  <files>src/components/ChessboardScene.tsx, src/pages/WormholePage.tsx</files>
  <action>
    1. In `src/components/ChessboardScene.tsx`, add an optional prop `hideHeaderTitle?: boolean` to the component props interface (defaulting to false for backwards compatibility).
    2. In the top bar header of `ChessboardScene.tsx` (around lines 2219-2236), conditionally hide or render an empty spacer when `hideHeaderTitle` is true, so that only the right-side controls (Sandbox/Competitive switch, Reset Game) render in the top bar.
    3. In `src/pages/WormholePage.tsx`, pass `hideHeaderTitle={true}` into `<ChessboardScene hideHeaderTitle={true} />`.
    AVOID: Modifying camera controls, 3D WebGL canvas dimensions, or piece animation logic in `ChessboardScene`.
  </action>
  <verify>npm run typecheck:all && npm run build</verify>
  <done>Typecheck passes cleanly with 0 errors, build succeeds, and WormholePage renders without duplicate text clipping.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `src/pages/HomePage.tsx` contains `Playable (2D)` and `Play Deck Builder Chess →`
- [ ] `src/components/ChessboardScene.tsx` accepts `hideHeaderTitle?: boolean`
- [ ] `src/pages/WormholePage.tsx` passes `hideHeaderTitle={true}`
- [ ] Full-stack typecheck passes (`npm run typecheck:all`)
- [ ] Production build succeeds (`npm run build`)
</verification>

<success_criteria>
- [ ] DEF-003 (P3 Polish) resolved: Home page clearly indicates Deck Builder Chess is live and playable
- [ ] DEF-002 (P2 UX Glitch) resolved: 3D Wormhole overlay has zero overlapping or clipped text
- [ ] Zero TypeScript or bundling errors
</success_criteria>
