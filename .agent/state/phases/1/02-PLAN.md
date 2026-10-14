---
phase: 1
plan: 2
wave: 2
depends_on: ["1.1"]
files_modified:
  - package.json
  - src/App.tsx
  - src/components/Navigation.tsx
  - src/pages/HomePage.tsx
  - src/pages/WormholePage.tsx
  - src/pages/DeckBuilderPage.tsx
  - src/pages/DashboardPage.tsx
  - src/pages/AuthPage.tsx
autonomous: true

must_haves:
  truths:
    - "Root route `/` displays the Home landing page with game variant cards and navigation"
    - "Route `/wormhole` loads the full 3D Wormhole Chessboard scene with back-navigation"
    - "Client routing enables switching between Home, Wormhole Chess, and variant placeholders"
  artifacts:
    - "src/components/Navigation.tsx"
    - "src/pages/HomePage.tsx"
    - "src/pages/WormholePage.tsx"
    - "src/App.tsx"
---

# Plan 1.2: Implement Client Routing & Encapsulate Wormhole Chess

<objective>
Establish client-side routing with `react-router-dom` to transform the single-page prototype into a multi-page gaming platform. Create the Home landing page with game variant discovery, and encapsulate the 3D Wormhole Chess engine inside `/wormhole` with zero gameplay regressions.

Purpose: Provide the structural shell for multiple chess variants, user dashboards, and authentication screens.
Output: Navigation bar, Home landing page, dedicated Wormhole Chess route, placeholder views for Deck Builder and Dashboard, and router integration in `App.tsx`.
</objective>

<context>
- .agent/state/SPEC.md
- .agent/state/ARCHITECTURE.md
- .agent/state/phases/1/RESEARCH.md
- src/App.tsx
- src/components/ChessboardScene.tsx
</context>

<tasks>

<task type="auto">
  <name>Install React Router & Setup Route Hierarchy</name>
  <files>package.json, src/App.tsx, src/components/Navigation.tsx</files>
  <action>
    1. Install `react-router-dom` using `npm install react-router-dom`.
    2. Create `src/components/Navigation.tsx`:
       - Top navigation bar styled with clean modern dark aesthetics matching the chess theme.
       - Brand logo/title ("Wormhole Chess Platform").
       - Links to Home (`/`), 3D Wormhole (`/wormhole`), Deck Builder (`/deck-builder`), Dashboard (`/dashboard`), and Sign In (`/login`).
    3. Update `src/App.tsx` with `BrowserRouter` and `Routes`:
       - `/` -> `<HomePage />`
       - `/wormhole` -> `<WormholePage />`
       - `/deck-builder` -> `<DeckBuilderPage />` (Phase 4 shell)
       - `/dashboard` -> `<DashboardPage />` (Phase 2 shell)
       - `/login` -> `<AuthPage mode="login" />` (Phase 2 shell)
       - `/register` -> `<AuthPage mode="register" />` (Phase 2 shell)
       - `*` -> Navigate to `/`
    AVOID: Do not wrap `/wormhole` in fixed-height layout wrappers that shrink or deform the WebGL canvas.
  </action>
  <verify>npm run build</verify>
  <done>React Router installed and App.tsx renders route switch</done>
</task>

<task type="auto">
  <name>Create Home Page & Encapsulate Wormhole Chess Route</name>
  <files>src/pages/HomePage.tsx, src/pages/WormholePage.tsx, src/pages/DeckBuilderPage.tsx, src/pages/DashboardPage.tsx, src/pages/AuthPage.tsx</files>
  <action>
    1. Create `src/pages/HomePage.tsx`:
       - Hero header introducing the multi-variant chess platform.
       - Variant cards grid:
         - **Wormhole Chess:** 3D non-Euclidean board topology with connected planes. "Play 3D Wormhole" button linking to `/wormhole`.
         - **Deck Builder Chess:** 2D card-infused tactical chess. "Explore Rules & Preview" linking to `/deck-builder`.
       - Feature highlights (Online Matchmaking, Guest Access, Persistent Stats).
    2. Create `src/pages/WormholePage.tsx`:
       - Mounts `<ChessboardScene />` in a full-screen `100vw` by `100vh` container.
       - Includes a floating top-left overlay button ("← Home") linking back to `/`.
    3. Create shell placeholder pages for `DeckBuilderPage.tsx`, `DashboardPage.tsx`, and `AuthPage.tsx` with roadmapped status badges and navigation back to Home.
  </action>
  <verify>npm run build</verify>
  <done>All pages build cleanly and link to one another</done>
</task>

<task type="auto">
  <name>Verify Routing and 3D Canvas Rendering</name>
  <files>src/App.tsx, src/pages/WormholePage.tsx</files>
  <action>
    1. Execute `npm run build` and ensure TypeScript and Vite bundle without errors.
    2. Confirm `build/index.html` is generated and that the bundle size is reported.
    3. Verify that 3D assets (`/chessboard/wormhole-chessboard.glb` and `/chessboard/pieces.glb`) resolve properly in public directory.
  </action>
  <verify>npm run build</verify>
  <done>Production build succeeds in < 10s with zero errors</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `npm run build` succeeds in < 10 seconds
- [ ] `src/pages/HomePage.tsx` and `src/pages/WormholePage.tsx` exist
- [ ] Navigating to `/` displays the Home landing page
- [ ] Navigating to `/wormhole` displays the full 3D ChessboardScene
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Routing functions across all specified routes
- [ ] 3D Wormhole Chess runs with zero regression
- [ ] Must-haves confirmed
</success_criteria>
