# UX Defect Ledger & Conformance Audit

**Sweep Date:** 2026-10-15 22:37
**Scope:** All Application Surface Routes (`/`, `/deck-builder`, `/wormhole`, `/dashboard`, `/login`, `/register`, `/play/:code`)
**Mode:** Standard Exploratory & Sensory Ergonomics Sweep
**Target Environment:** Local Full-Stack Dev (`http://localhost:5173`)
**Total Inspected:** 6 routes, 51 interactive elements, 15 retina screenshots across Desktop (1280x800) and Mobile (390x844 & 375x667)
**Total Defects Found:** 0 Active (P0: 0, P1: 0, P2: 0, P3: 0)
**Defects Remediated in Session:** 2 (100% resolved and verified)

---

## Active Defects

None. All 6 surface routes rendered cleanly with zero console runtime crashes, zero horizontal layout overflows (`scrollWidth === clientWidth`), verified form validation alerts, active tab toggles, and modal escapability.

---

## Remediated Defects (Session 2026-10-15 22:37)

### [DEF-005] React Shorthand/Non-Shorthand Style Conflict on Home Tab Toggle
- **Severity:** P1 (Console Warning / Styling Bug Risk)
- **Route:** `/` (Home Landing Page)
- **Element:** `#tab-deck-builder` and `#tab-wormhole` variant switchers
- **Observed Behavior:** Switching tabs triggered React console warning: `Removing a style property during rerender (borderColor) when a conflicting property is set (border) can lead to styling bugs. To avoid this, don't mix shorthand and non-shorthand properties for the same value.`
- **Expected Behavior:** Tab styles should cleanly toggle without conflicting style shorthand properties or console warnings.
- **Evidence:** `.agent/state/artifacts/screenshots/sweep_01_home_desktop.png`
- **Suspect File(s):** `src/pages/HomePage.tsx#L383`
- **Resolution:** Replaced non-shorthand `borderColor: 'rgba(139, 126, 116, 0.25)'` with unified shorthand `border: '1px solid rgba(139, 126, 116, 0.25)'` matching `tabBtnStyle`. Verified clean console logs.

---

### [DEF-006] React Shorthand/Non-Shorthand Background Property Conflict on Auth Tabs
- **Severity:** P1 (Console Warning / Styling Bug Risk)
- **Route:** `/login` and `/register`
- **Element:** `#auth-tab-register` and `#auth-tab-guest` mode switchers
- **Observed Behavior:** Toggling authentication modes triggered React console warning: `Removing a style property during rerender (backgroundColor) when a conflicting property is set (background) can lead to styling bugs.`
- **Expected Behavior:** Smooth background transitions without console warnings during tab rerender.
- **Evidence:** `.agent/state/artifacts/screenshots/sweep_05_auth_login_desktop.png`
- **Suspect File(s):** `src/pages/AuthPage.tsx#L443`
- **Resolution:** Normalized `tabStyle` from `background: 'transparent'` to `backgroundColor: 'transparent'`, preventing style attribute collisions with `activeTabStyle.backgroundColor`. Verified clean console logs.

---

## Historical Resolved Defects

### [DEF-001] Deck Builder Chess visual layout collapsed and pieces overflowing due to missing Tailwind CSS compiler
- **Severity:** P0 (Blocker)
- **Status:** Resolved in Plan 5.4
- **Route:** `/deck-builder`
- **Resolution:** Configured `@tailwindcss/vite` and `tailwindcss` in `vite.config.ts` and `src/index.css`. Constrained chessboard squares and piece SVGs.

---

### [DEF-002] 3D Wormhole Chess Header title text overlapped and clipped by floating navigation buttons
- **Severity:** P2 (UX / State Glitch)
- **Status:** Resolved in Plan 5.5
- **Route:** `/wormhole`
- **Resolution:** Added `hideHeaderTitle` prop to `ChessboardScene.tsx` when mounted in `WormholePage`.

---

### [DEF-003] Home page displays "In Development (2D)" badge and "Explore Rules & Preview →" for Deck Builder Chess
- **Severity:** P3 (Visual Polish / Slop)
- **Status:** Resolved in Plan 5.5 & Phase 3
- **Route:** `/`
- **Resolution:** Redesigned Home landing page with unified interactive variant switcher tabs and live playable action buttons.

---

### [DEF-004] Deck Builder Subheader displays raw phase milestone label "2D Phase 4"
- **Severity:** P3 (Visual Polish / Slop)
- **Status:** Resolved in Plan 5.4 & Phase 2
- **Route:** `/deck-builder`
- **Resolution:** Updated subheader to player-facing copy "Tactical 2D".
