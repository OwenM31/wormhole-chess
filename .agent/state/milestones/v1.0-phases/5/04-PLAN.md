---
phase: 5
plan: 4
wave: 1
depends_on: []
files_modified:
  - package.json
  - vite.config.ts
  - src/index.css
  - src/pages/DeckBuilderPage.tsx
  - src/components/DeckChessBoard.tsx
autonomous: true
gap_closure: true

must_haves:
  truths:
    - "Tailwind CSS utility classes compile properly during Vite production build"
    - "2D Deck Builder Chessboard renders an aligned 8x8 grid with properly scaled piece SVGs"
    - "Deck Builder Subheader displays clean player-facing 'Tactical 2D' badge instead of internal '2D Phase 4'"
  artifacts:
    - "@tailwindcss/vite and tailwindcss in package.json"
    - "vite.config.ts configured with tailwindcss plugin"
    - "src/index.css importing tailwindcss"
  key_links:
    - "Vite build pipeline generates Tailwind stylesheet consumed by React DOM"
---

# Plan 5.4: Tailwind CSS Setup & 2D Deck Builder Layout Fix

<objective>
Resolve DEF-001 (P0 Blocker) and DEF-004 (P3 Polish) by installing and configuring Tailwind CSS v4 in the Vite project, ensuring that all existing Tailwind utility classes across DeckBuilderPage, DeckChessBoard, TacticalHandBar, and DeckBuilderView compile into responsive, styled UI components, and updating the subheader badge to player-facing copy.

Purpose: Fix the collapsed 8x8 chessboard grid, unconstrained piece SVGs, and unstyled buttons discovered in /ux-sweep.
Output: Integrated Tailwind compiler in Vite, verified 8x8 grid rendering, and polished subheader copy.
</objective>

<context>
Load for context:
- .agent/state/DEFECTS.md
- vite.config.ts
- package.json
- src/index.css
- src/pages/DeckBuilderPage.tsx
- src/components/DeckChessBoard.tsx
</context>

<tasks>

<task type="auto">
  <name>Install and configure Tailwind CSS v4 in Vite</name>
  <files>package.json, vite.config.ts, src/index.css</files>
  <action>
    1. Run `npm install -D @tailwindcss/vite tailwindcss` to install Tailwind v4 tooling.
    2. In `vite.config.ts`, import `tailwindcss from '@tailwindcss/vite'` and add `tailwindcss()` to the `plugins` array alongside `react()`.
    3. In `src/index.css`, prepend `@import "tailwindcss";` at the top of the file so all Tailwind v4 utilities, CSS variables, and layout resets are bundled.
    AVOID: Creating legacy tailwind.config.js or postcss.config.js files unless required, as Tailwind v4 with @tailwindcss/vite is zero-config and processes directly through the Vite plugin.
  </action>
  <verify>npm run build && node -e "const css = require('fs').readFileSync('build/assets/' + require('fs').readdirSync('build/assets').find(f => f.endsWith('.css')), 'utf8'); if (!css.includes('grid-template-columns') && !css.includes('display:flex')) throw new Error('Tailwind utilities missing'); console.log('Tailwind compiled successfully!');"</verify>
  <done>Production bundle compiles with Tailwind CSS utilities included in build/assets/*.css in < 5s.</done>
</task>

<task type="auto">
  <name>Constrain piece SVGs and update Deck Builder subheader copy</name>
  <files>src/pages/DeckBuilderPage.tsx, src/components/DeckChessBoard.tsx</files>
  <action>
    1. In `src/pages/DeckBuilderPage.tsx#L79-L81`, update the badge text from `2D Phase 4` to `Tactical 2D` with consistent styling.
    2. In `src/components/DeckChessBoard.tsx`, ensure `ChessPieceSvg` components have explicit inline or style bounds (`style={{ width: '80%', height: '80%', maxHeight: '100%' }}`) in addition to `w-4/5 h-4/5` to guarantee pieces never overflow their square containers regardless of CSS loading state.
    3. Ensure `DeckChessBoard` square containers maintain `aspect-ratio: 1/1` and `display: flex; align-items: center; justify-content: center`.
    AVOID: Altering game logic, FEN parsing, or click handler callbacks in `DeckChessBoard`.
  </action>
  <verify>npm run typecheck:all && npm run build</verify>
  <done>TypeScript typecheck passes cleanly with 0 errors, build succeeds, and subheader displays 'Tactical 2D'.</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `@tailwindcss/vite` and `tailwindcss` are listed in `devDependencies`
- [ ] `vite.config.ts` includes `tailwindcss()` plugin
- [ ] `src/index.css` includes `@import "tailwindcss";`
- [ ] `npm run build` generates CSS containing grid, flex, and background classes
- [ ] Subheader badge in `DeckBuilderPage.tsx` reads `Tactical 2D`
</verification>

<success_criteria>
- [ ] DEF-001 (P0 Blocker) resolved: 2D chessboard and hand components rendered with full Tailwind styling
- [ ] DEF-004 (P3 Polish) resolved: internal Phase 4 label replaced with Tactical 2D
- [ ] Build and typecheck pass cleanly with 0 errors
</success_criteria>
