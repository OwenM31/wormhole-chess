---
phase: 1
plan: 4
wave: 3
depends_on:
  - "02"
  - "03"
files_modified:
  - src/components/TacticalHandBar.tsx
  - src/components/DeckBuilderView.tsx
autonomous: true
must_haves:
  truths:
    - TacticalHandBar.tsx and DeckBuilderView.tsx render card rules without line-clamp truncation or ellipses
    - public/assets/cards/ contains scaffolded directories for pawn, knight, bishop, rook, queen, king
    - Full test suite passes 100% green (all 16 suites)
    - Full-stack typecheck passes with 0 errors across client, Pages Functions, and DO workers
    - Production build compiles cleanly
  artifacts:
    - src/components/TacticalHandBar.tsx
    - src/components/DeckBuilderView.tsx
    - public/assets/cards/
---

# Plan 1.4: UI Card Component Zero-Ellipsis Polish & Static Asset Directory Scaffolding

<objective>
Update `TacticalHandBar.tsx` and `DeckBuilderView.tsx` to remove `line-clamp-2` and `text-overflow: ellipsis` on card rules containers, allowing concise rules formulas to render cleanly and completely with zero ellipses. Scaffold the static vector asset directory structure in `public/assets/cards/` ready for Phases 2 & 3, and run full-stack verification.

Purpose: Completes Phase 1 deliverables by guaranteeing that the polished zero-ellipsis rules text renders without truncation on live UI surfaces, and establishes the asset filesystem contract for upcoming SVG generation.
Output: Updated UI components, scaffolded asset directories, and verified production build.
</objective>

<context>
- `.agent/rules/STYLE.md`
- `.agent/state/DECISIONS.md` (DECISION-023)
- `.agent/state/phases/1/RESEARCH.md`
- `.agent/state/phases/1/02-PLAN.md`
- `.agent/state/phases/1/03-PLAN.md`
- `src/components/TacticalHandBar.tsx`
- `src/components/DeckBuilderView.tsx`
- `public/assets/cards/`
</context>

<tasks>

<task type="auto">
  <name>Task 1: Eliminate line-clamp and ellipses in TacticalHandBar.tsx and DeckBuilderView.tsx</name>
  <files>src/components/TacticalHandBar.tsx, src/components/DeckBuilderView.tsx</files>
  <action>
    1. In `src/components/TacticalHandBar.tsx`:
       - On line 257 (bottom rules description), change:
         `className="text-[7.5px] text-[#FAF9F6]/85 line-clamp-2 leading-tight text-center mt-0.5"`
         to:
         `className="text-[7.5px] text-[#FAF9F6]/85 leading-tight text-center mt-0.5"`
         (removing `line-clamp-2` so the concise text renders cleanly without ellipsis cutoff).
       - Ensure card bottom container handles 2–3 lines smoothly.
    2. In `src/components/DeckBuilderView.tsx`:
       - Ensure card title and description containers in the card library grid and equipped card list render without `line-clamp-2` or `text-overflow: ellipsis`.
       - Check line 265 and line 349: remove unnecessary `line-clamp` restrictions.
    AVOID: Altering the 3-column TCG layout geometry or breaking hover animations.
  </action>
  <verify>npm run typecheck:all</verify>
  <done>TacticalHandBar.tsx and DeckBuilderView.tsx compile cleanly with 0 type errors and render card text without ellipses.</done>
</task>

<task type="auto">
  <name>Task 2: Scaffold public/assets/cards/ directories and run full verification</name>
  <files>public/assets/cards/</files>
  <action>
    1. Scaffold static asset directories under `public/assets/cards/`:
       - `public/assets/cards/pawn/`
       - `public/assets/cards/knight/`
       - `public/assets/cards/bishop/`
       - `public/assets/cards/rook/`
       - `public/assets/cards/queen/`
       - `public/assets/cards/king/`
       Add a `.gitkeep` file in each directory to ensure git tracks the asset folders.
    2. Run full test suite:
       - `npm test` (verify all 16 suites including `Suite 16` pass 100%).
    3. Run full-stack typecheck:
       - `npm run typecheck:all` (0 errors across React client, Pages Functions, and DO workers).
    4. Run production build:
       - `npm run build` (confirm build succeeds in < 3s).
  </action>
  <verify>npm test && npm run typecheck:all && npm run build</verify>
  <done>Asset directories scaffolded, all 16 test suites pass green, full-stack typecheck clean, and production build succeeds.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] No `line-clamp-2` causing ellipses on card rules text.
- [ ] `public/assets/cards/{pawn,knight,bishop,rook,queen,king}/` directories exist on disk.
- [ ] `npm test` passes 100% (all 16 suites).
- [ ] `npm run typecheck:all` passes with 0 errors.
- [ ] `npm run build` succeeds.
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
</success_criteria>
