---
phase: 3
plan: 2
wave: 2
depends_on: ["01"]
---

# Plan 3.2: Authentication Page Wiring & Empirical Playwright UX Verification

## Objective

Wire the presentational UI shell in `src/pages/AuthPage.tsx` with full authentication state management (`AuthContext`), input validation, guest session upgrade notice, and error handling. Build and run an automated Playwright UX verification suite (`scripts/verify-phase3-ux.mjs`) to empirically validate visual craft, responsive breakpoints (1280px desktop and 375px mobile), tab interactions, and zero horizontal scroll.

## Context

- `.agent/rules/STYLE.md` — Wormhole palette tokens and approved copy rules
- `.agent/state/DESIGN_STATE.md` — Phase 3 approved layout specifications
- `.agent/state/phases/3/RESEARCH.md` — Phase 3 architecture and component details
- `src/pages/AuthPage.tsx` — Target authentication component
- `src/context/AuthContext.tsx` — Authentication state and session hook
- `scripts/verify-phase2-ux.mjs` — Verification suite reference pattern

## Tasks

<task type="auto">
  <name>Task 1: Wire tab modes, guest conversion banner, and validation state in AuthPage.tsx</name>
  <files>src/pages/AuthPage.tsx</files>
  <action>
    - Wire segmented navigation tabs (`Sign In`, `Register` / `Upgrade`, `Guest`) to respond to URL routing (`/login`, `/register`) and user clicks.
    - Connect form submission to `useAuth()` actions:
      - Sign In: calls `login({ username, password })` and navigates to `/dashboard`.
      - Register: validates 3-24 char alphanumeric username and 8+ char password with confirmation; calls `register({ username, password, email })` and navigates to `/dashboard`.
      - Guest: calls `loginAsGuest()` and navigates to `/dashboard`.
    - When active guest session exists (`user?.isGuest`):
      - Display guest notice banner: "Playing as {user.username}. Registering links your stats." with warm gold accent (`#D4AF37`).
      - Display "Upgrade" on the registration tab.
    - Render validation and API error alerts in a restrained alert box styled with danger red (`#AA4A44`) background and warm white text.
    - Ensure automatic redirect to `/dashboard` if user is already authenticated as a non-guest.
    - Apply Wormhole design tokens (`#191B1D` canvas, `#24272A` surface, 6px border radius, 1px micro-borders, `#4C5C4C` submit button).
  </action>
  <verify>npm run typecheck:all &amp;&amp; npm run build</verify>
  <done>AuthPage.tsx compiles cleanly, binds to AuthContext, handles all 3 auth modes, and displays guest upgrade notice when applicable.</done>
</task>

<task type="auto">
  <name>Task 2: Create automated Playwright verification suite scripts/verify-phase3-ux.mjs and execute verification sweep</name>
  <files>scripts/verify-phase3-ux.mjs</files>
  <action>
    - Author `scripts/verify-phase3-ux.mjs` using Playwright chromium headless browser with Vite preview server on port 4176.
    - Desktop Sweep (1280x800, scale factor 2):
      - Navigate to `/`: verify hero title "Wormhole Chess", subtitle "A collection of chess variants.", and capture `phase3_home_desktop.png`.
      - Test Deck Builder tab: verify 4 tactical cards and `⚡ ENERGY 3/3` pill.
      - Click "3D Wormhole Chess" tab: verify dynamic tab switch, copy "Two 8x8 boards linked by a hole in the middle, for up to 4 players.", and capture `phase3_home_3d_tab.png`.
      - Navigate to `/login`: verify 400px centered card, tab switching (`Sign In` ↔ `Register` ↔ `Guest`), and capture `phase3_auth_desktop.png`.
    - Mobile Sweep (375x667, scale factor 2):
      - Navigate to `/`: verify zero horizontal overflow (`scrollWidth <= 375`) and capture `phase3_home_mobile.png`.
      - Navigate to `/login`: verify mobile layout and capture `phase3_auth_mobile.png`.
    - Run `node scripts/verify-phase3-ux.mjs` and confirm all assertions pass.
  </action>
  <verify>node scripts/verify-phase3-ux.mjs</verify>
  <done>Playwright verification suite runs cleanly, validates all copy and responsive requirements, and saves 5 retina screenshots in .agent/state/artifacts/screenshots/.</done>
</task>

## Success Criteria

- [ ] `AuthPage.tsx` correctly handles Sign In, Register, and Guest Play with `useAuth()`.
- [ ] Active guest sessions display the upgrade notice banner.
- [ ] Automated Playwright test suite `scripts/verify-phase3-ux.mjs` passes all desktop and mobile assertions.
- [ ] Zero horizontal scroll detected on mobile (375px) across Home and Auth routes.
- [ ] Full-stack typecheck, production build, and all 83 card engine tests pass with 0 errors.
