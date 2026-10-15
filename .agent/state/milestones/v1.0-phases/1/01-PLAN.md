---
phase: 1
plan: 1
wave: 1
depends_on: []
files_modified:
  - package.json
  - vite.config.ts
  - index.html
  - tsconfig.json
  - .env
  - src/vite-env.d.ts
  - src/react-app-env.d.ts
  - src/App.test.tsx
autonomous: true

must_haves:
  truths:
    - "Vite compiles the production bundle in under 10 seconds without errors"
    - "Build outputs to build/ directory maintaining Cloudflare Pages backward compatibility"
  artifacts:
    - "vite.config.ts"
    - "index.html"
    - "src/vite-env.d.ts"
    - "build/index.html"
---

# Plan 1.1: Migrate CRA to Vite & Modernize Tooling

<objective>
Replace deprecated Create React App (`react-scripts` 5.0.1) with Vite. This cuts production build times from ~120s down to < 5s, provides instant HMR, fixes TypeScript configuration, and ensures compatibility with Cloudflare Pages and modern serverless workflows.

Purpose: Eliminate the primary development blocker (slow builds, CRA deprecation) and prepare clean bundling for upcoming features.
Output: Working Vite configuration (`vite.config.ts`), root `index.html`, modernized `tsconfig.json`, and verified production build in `build/`.
</objective>

<context>
- .agent/state/SPEC.md
- .agent/state/ARCHITECTURE.md
- .agent/state/phases/1/RESEARCH.md
- package.json
- tsconfig.json
</context>

<tasks>

<task type="auto">
  <name>Migrate Build Tooling from CRA to Vite</name>
  <files>package.json, vite.config.ts, index.html, tsconfig.json, .env</files>
  <action>
    1. Uninstall `react-scripts` and install `vite` and `@vitejs/plugin-react` as devDependencies.
    2. Create `vite.config.ts` configuring `@vitejs/plugin-react` and explicitly setting `build.outDir: 'build'` to maintain parity with Cloudflare Pages.
    3. Copy and convert `public/index.html` to root `index.html`:
       - Remove all `%PUBLIC_URL%` tokens (e.g. `%PUBLIC_URL%/favicon.ico` -> `/favicon.ico`).
       - Add `<script type="module" src="/src/index.tsx"></script>` before `</body>`.
    4. Update `package.json` scripts:
       - `"dev": "vite"`
       - `"build": "tsc && vite build"`
       - `"preview": "vite preview"`
    5. Modernize `tsconfig.json` compilerOptions for Vite: set `"target": "ES2020"`, `"moduleResolution": "bundler"`, `"module": "ESNext"`.
    6. Remove CRA-specific `.env` content (`GENERATE_SOURCEMAP=false`).
    AVOID: Do not change the build output directory to `dist/`; keep it as `build/` so existing Cloudflare Pages deployments continue uninterrupted.
  </action>
  <verify>npm run build</verify>
  <done>Vite compiles bundle into build/ in < 10 seconds</done>
</task>

<task type="auto">
  <name>Clean Deprecated CRA Artifacts & Update Types</name>
  <files>src/vite-env.d.ts, src/react-app-env.d.ts, src/App.test.tsx</files>
  <action>
    1. Replace `src/react-app-env.d.ts` with `src/vite-env.d.ts` containing `/// <reference types="vite/client" />`.
    2. Remove obsolete `src/react-app-env.d.ts`.
    3. Update `src/App.test.tsx` to remove the outdated CRA "learn react" assertion and verify clean mounting.
  </action>
  <verify>npm run build</verify>
  <done>Build passes cleanly with no CRA type errors</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run build` completes in < 10 seconds
- [ ] `build/index.html` and `build/static/` or `build/assets/` are generated
- [ ] Zero references to `react-scripts` in `package.json`
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Production build succeeds with Vite
- [ ] Must-haves confirmed
</success_criteria>
