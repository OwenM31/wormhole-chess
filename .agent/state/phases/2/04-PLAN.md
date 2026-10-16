---
phase: 2
plan: 4
wave: 3
depends_on:
  - "2.1"
  - "2.2"
  - "2.3"
files_modified:
  - src/components/TacticalHandBar.tsx
  - src/components/DeckBuilderView.tsx
autonomous: true
must_haves:
  truths:
    - TacticalHandBar.tsx displays CardArt at rest and smoothly reveals the mini-board schematic on hover or active selection
    - DeckBuilderView.tsx renders CardArt in card catalog listings and equipped deck cards with zero layout shift
    - Zero-ellipsis rule preserved: card descriptions remain <= 120 chars and are 100% visible with zero truncation or text clipping
    - All 90 Minor Unit SVG illustrations pass 100% of contract tests in scripts/verify-phase2-assets.mjs
    - All 16 automated card test suites in scripts/verify-all-cards.ts pass 100%
  artifacts:
    - src/components/TacticalHandBar.tsx
    - src/components/DeckBuilderView.tsx
---

# Plan 2.4: UI Component Integration, Full Contract Audit & Multi-Viewport Verification

<objective>
Wire the decoupled `<CardArt />` component into `TacticalHandBar.tsx` (idle 38px TCG window; flips to mini-board on hover/active) and `DeckBuilderView.tsx` (top visual frame in card curator), execute the comprehensive 90-card contract verification harness, and validate with multi-viewport visual audits.

Purpose: Completes the full end-to-end integration of the Minor Unit vector artwork suite into live gameplay and curator interfaces, guaranteeing zero layout shifts and zero ellipses.
Output: Integrated `TacticalHandBar.tsx` and `DeckBuilderView.tsx`, 100% passing contract audit, and visual verification artifacts.
</objective>

<context>
- `.agent/state/SPEC.md`
- `.agent/state/ROADMAP.md`
- `.agent/state/phases/2/RESEARCH.md`
- `.agent/rules/STYLE.md` (Sections 5 & 6: Hand Stage, Deck Builder & Zero-Ellipsis Directives)
- `.agent/state/DESIGN_STATE.md` (Milestone v3.0 Phase 2 approved baseline)
- `src/components/CardArt.tsx` (Presentational vector card art component)
- `src/components/TacticalHandBar.tsx` (Left TCG hand dock)
- `src/components/DeckBuilderView.tsx` (Deck builder curator and card catalog)
- `scripts/verify-phase2-assets.mjs` (Phase 2 contract test harness)
- `scripts/verify-all-cards.ts` (Automated card engine test harness)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Wire CardArt into TacticalHandBar and DeckBuilderView</name>
  <files>src/components/TacticalHandBar.tsx, src/components/DeckBuilderView.tsx</files>
  <action>
    1. In `src/components/TacticalHandBar.tsx`:
       - Import `CardArt` from `./CardArt`.
       - In the card center window (38px height):
         - When idle (neither hovered nor selected nor active), render `<CardArt anchor={card.anchor} artId={card.artId} cardName={card.name} />`.
         - When hovered (`hoveredCard?.id === card.id`) or selected (`isSelected || isActiveForPiece`), reveal the existing interactive mini-board coordinate explainer.
         - Ensure smooth transition and strict bounding box (`w-full h-full`, `overflow-hidden`, `rounded`) with zero layout shift.
    2. In `src/components/DeckBuilderView.tsx`:
       - Import `CardArt` from `./CardArt`.
       - In the card library listing items:
         - Render a compact art frame (52px–56px height) displaying `<CardArt anchor={card.anchor} artId={card.artId} cardName={card.name} />` above or alongside the card metadata.
         - In the equipped deck card slots: display `<CardArt />` thumbnail.
       - Strictly preserve zero-ellipsis constraints: ensure rules descriptions have ample space, wrapping cleanly without clipping, `overflow: hidden` truncation, or `line-clamp`.
    3. Run `npm run typecheck:all` to ensure zero TypeScript regressions.
    AVOID: Reintroducing `line-clamp-2` or causing card heights to expand unpredictably on hover.
  </action>
  <verify>npm run typecheck:all</verify>
  <done>TacticalHandBar.tsx and DeckBuilderView.tsx compile cleanly with 0 TypeScript errors and render CardArt seamlessly.</done>
</task>

<task type="auto">
  <name>Task 2: Run full 90-card contract audit, test suite, and visual Playwright sweep</name>
  <files>scripts/verify-phase2-assets.mjs, scripts/verify-all-cards.ts</files>
  <action>
    1. Run `node scripts/verify-phase2-assets.mjs` (without flags):
       - Asserts all 90 Minor Unit SVGs (30 Pawn, 30 Knight, 30 Bishop) exist in `public/assets/cards/`.
       - Asserts valid XML, strict `viewBox`, Option B board presence, top HUD badge, and zero text on tiles across all 90 files.
    2. Run `npx tsx scripts/verify-all-cards.ts` to confirm all 16 engine test suites pass 100%.
    3. Run `npm run build` to confirm production bundle builds cleanly in Vite.
    4. Run an automated Playwright headless sweep on `DeckBuilderPage` and `PlayRoomPage` (or interactive test script) to capture verification screenshots and assert that card descriptions render with `scrollWidth === clientWidth` (zero text clipping).
    AVOID: Marking phase complete without empirical verification across all 90 assets.
  </action>
  <verify>node scripts/verify-phase2-assets.mjs && npx tsx scripts/verify-all-cards.ts && npm run build</verify>
  <done>All 90 Minor Unit vector assets verified; all test suites pass; production build succeeds.</done>
</task>

</tasks>

<verification>
After completing tasks, verify:
- [ ] node scripts/verify-phase2-assets.mjs passes with 90/90 cards verified
- [ ] npx tsx scripts/verify-all-cards.ts passes all 16 suites (236+ tests)
- [ ] npm run typecheck:all passes with 0 errors
- [ ] npm run build completes cleanly
- [ ] TacticalHandBar and DeckBuilderView render vector card illustrations without layout shift
</verification>

<success_criteria>
- [ ] Full Minor Unit vector artwork suite (90 cards) fully integrated and verified in UI
- [ ] Zero layout shifts, zero text clipping, zero ellipses
</success_criteria>
