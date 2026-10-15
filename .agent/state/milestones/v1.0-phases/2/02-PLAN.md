---
phase: 2
plan: 2
wave: 2
depends_on: ["01"]
---

# Plan 2.2: Frontend Auth Integration, AuthContext & Player Dashboard UI

## Objective

Build the frontend authentication layer and Player Dashboard by introducing a centralized React `AuthContext`, connecting the UI to the Cloudflare Pages Functions backend, upgrading `Navigation.tsx` with live authentication state, creating an intuitive `AuthPage.tsx` (Sign In, Register, One-Click Guest), and crafting a feature-rich, responsive `DashboardPage.tsx` displaying player ratings, win/loss stats, game variant launchers, and guest upgrade capabilities.

## Context

- [.agent/state/SPEC.md](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/.agent/state/SPEC.md) — Goal 2 (Authentication & Player Dashboard)
- [.agent/state/REQUIREMENTS.md](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/.agent/state/REQUIREMENTS.md) — REQ-05, REQ-06, NFR-02
- [.agent/state/phases/2/01-PLAN.md](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/.agent/state/phases/2/01-PLAN.md) — Plan 2.1 Backend endpoints & shared types
- [.agent/state/phases/2/RESEARCH.md](file:///C:/Users/omeye/OneDrive/Desktop/dev/repos/wormhole-chess/.agent/state/phases/2/RESEARCH.md) — Findings on Vite proxy and optimistic AuthContext initialization

## Tasks

<task type="auto">
  <name>Task 1: Build API client service, AuthContext provider, and dynamic navigation bar</name>
  <files>
    src/services/api.ts
    src/context/AuthContext.tsx
    src/components/Navigation.tsx
    src/App.tsx
  </files>
  <action>
    1. Create `src/services/api.ts`:
       - Typed fetch wrapper with `credentials: 'include'` to pass HttpOnly session cookies automatically.
       - Include `Content-Type: application/json` and `X-Requested-With: XMLHttpRequest` headers to safeguard against CSRF.
       - Export `authApi`:
         - `register(data: RegisterRequest): Promise<AuthResponse>`
         - `login(data: LoginRequest): Promise<AuthResponse>`
         - `loginAsGuest(): Promise<AuthResponse>`
         - `logout(): Promise<{ success: boolean }>`
         - `getMe(): Promise<AuthResponse>`
    2. Create `src/context/AuthContext.tsx`:
       - Define `AuthContextType` with `user`, `stats`, `isLoading`, `error`, `login`, `register`, `loginAsGuest`, `logout`, and `refreshUser`.
       - On mount, invoke `authApi.getMe()`: if valid session cookie exists, populate `user` and `stats`; if 401, set user to `null` cleanly without throwing errors.
       - Custom hook `useAuth()` exposing the context with guard check.
    3. Update `src/App.tsx`:
       - Wrap router views with `<AuthProvider>`.
    4. Update `src/components/Navigation.tsx`:
       - Consume `useAuth()`.
       - When authenticated as Registered User: display username with player icon, link to `/dashboard`, and "Sign Out" button.
       - When authenticated as Guest: display `Guest_xxxx` badge with "[Guest]" chip, link to `/dashboard`, and "Sign In / Register" prompt.
       - When unauthenticated: display "Sign In" button leading to `/login`.
    5. Avoid: Storing session tokens in `localStorage` (session is governed securely by HttpOnly cookies).
  </action>
  <verify>
    npm run build
  </verify>
  <done>
    `AuthContext` and `api.ts` provide complete session state, `Navigation.tsx` dynamically reflects user/guest/unauthenticated status, and production build compiles with zero errors.
  </done>
</task>

<task type="auto">
  <name>Task 2: Implement full AuthPage, Player Dashboard UI, and Vite dev API proxy</name>
  <files>
    vite.config.ts
    src/pages/AuthPage.tsx
    src/pages/DashboardPage.tsx
  </files>
  <action>
    1. Update `vite.config.ts`:
       - Add `server.proxy` forwarding `/api` to `http://localhost:8788` for local development when running alongside Wrangler.
    2. Implement `src/pages/AuthPage.tsx`:
       - Tabbed interface switching between "Sign In", "Create Account", and "Play as Guest".
       - Form controls for `username`, `password`, `confirmPassword` (register mode), and optional `email`.
       - Client-side validation: username length (3-24 characters), password minimum length (8 characters), password matching.
       - Guest upgrade alert: If `user?.isGuest` is true, show prominent message: "🎮 You are currently playing as {username}. Creating an account will link your stats and rating permanently!"
       - One-click "Continue as Guest" button with instant onboarding.
       - Smooth redirection to `/dashboard` upon successful session establishment.
    3. Implement `src/pages/DashboardPage.tsx`:
       - Profile Banner: Avatar/emblem, username, account status badge ("Registered Player" or "Guest Session"), registration date, and ELO rating pill.
       - Guest Upgrade Card (rendered only when `user?.isGuest` is true): Prominent call-to-action with "Upgrade Account" button redirecting to `/register`.
       - Player Statistics Grid:
         - ELO Rating card (default 1200)
         - Total Games Played
         - Win Rate %
         - Wins / Losses / Draws breakdown
       - Quick Game Launchers:
         - "3D Wormhole Chess" launcher card (description, thumbnail/icon, "Launch 3D Game" button -> `/wormhole`).
         - "2D Deck Builder Chess" launcher card (description, preview badge, "Launch Deck Builder" button -> `/deck-builder`).
       - Recent Match History:
         - Table or list layout with empty-state card ("No matches played yet. Launch a game variant to start your competitive record!").
       - Account Actions:
         - "Log Out" button with confirmation.
    4. Ensure responsive styling matching the dark cosmic aesthetic defined in Phase 1 (deep blacks, purples, neon accents, crisp typography).
    5. Avoid: Hardcoding user data; all displayed attributes must originate from `useAuth()`.
  </action>
  <verify>
    npm run build
  </verify>
  <done>
    `AuthPage.tsx` and `DashboardPage.tsx` are fully functional and responsive, supporting registered users, guests, account conversion, and variant launching, passing production build in < 5 seconds.
  </done>
</task>

## Success Criteria

- [ ] `AuthContext` seamlessly detects active sessions on mount via `/api/auth/me`
- [ ] Navigation bar reflects authenticated, guest, and logged-out states dynamically
- [ ] `AuthPage` supports Sign In, Account Creation, and instant One-Click Guest access
- [ ] Guest users are notified of and can perform in-place account upgrades
- [ ] `DashboardPage` displays player rating, lifetime win/loss statistics, game launchers, and match history
- [ ] `vite.config.ts` configures proxy for local `/api` routing
- [ ] `npm run build` completes cleanly in sub-5s with zero TypeScript warnings or errors
