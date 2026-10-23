# UX Defect Ledger & Conformance Audit

**Sweep Date:** 2026-10-22 18:56
**Scope:** All Application Surface Routes (`/`, `/deck-builder`, `/wormhole`, `/dashboard`, `/login`, `/register`, `/play/:code`)
**Mode:** Standard Exploratory & Sensory Ergonomics Sweep
**Target Environment:** Local Vite Preview (`http://localhost:4178`)
**Total Inspected:** 6 routes, 63 interactive elements, 16 retina screenshots across Desktop (1280x800 & 1280x850) and Mobile (390x844 & 375x667)
**Total Defects Found:** 0 Active (P0: 0, P1: 0, P2: 0, P3: 0)
**Defects Remediated in Session:** 1 (100% resolved and verified)

---

## Active Defects

None. All 6 surface routes rendered cleanly with zero console runtime crashes, zero horizontal layout overflows (`scrollWidth === clientWidth`), verified form validation alerts, active tab toggles, modal escapability, and seamless multi-screen navigation loops across the fluid 11-column Main Menu Hub, Full-Screen Multiplayer Character Stage, Tactical Arena, and Forge.

---

## Remediated Defects (Session 2026-10-22 18:56 - 19:18)

### [DEF-008] Private Match Creation Modal Missing Route Navigation & Remote Turn Sync
- **Severity:** P0 (Functional Blocker / Private Multiplayer Unplayable)
- **Route:** `/deck-builder` (Multiplayer Character Stage) & `/play/:code`
- **Observed Behavior:** Clicking "Create & Enter Room" in the Private Match modal merely showed a stub notification without navigating to the match room. Furthermore, in `/play/:code`, incoming remote turns were not applied to `DeckChessEngine`, the local dev fallback did not distinguish between two tabs running on the same origin/account, and `/api` proxy lacked WebSocket support.
- **Expected Behavior:** Clicking "Create & Enter Room" generates a shareable room code (`WH-XXXX`), launches the game room (`/play/WH-XXXX?variant=deck_builder&timeControl=...`), enables challenger to join via direct link or code, transitions status to `in_progress` across both clients, renders opponent board perspective (White bottom vs Black bottom), and synchronizes cards, chess moves, and clocks in real time.
- **Evidence:** `.agent/state/artifacts/screenshots/mp_test_01_p1_waiting.png`, `mp_test_02_p1_started.png`, `mp_test_03_p2_after_move.png`
- **Resolution:**
  1. Updated `MultiplayerCharacterStage.tsx` with room code generation, time control selection (`3+0`, `5+0`, `10+0`, `untimed`), and direct navigation to `/play/:code`.
  2. Implemented seamless dual-mode networking in `useGameRoom.ts`: local `BroadcastChannel` fallback for local multi-tab dev and production Cloudflare Durable Object WebSocket (`wss://.../api/room/:code`).
  3. Added per-tab session identifiers (`sessionStorage.getItem('wormhole_tab_id_...')`) so two tabs on the same machine/account properly seat Player 1 as White and Player 2 as Black.
  4. Added `applyRemoteTurn(payload)` hookup in `PlayRoomPage.tsx` and `useDeckChessGame.ts`, using authoritative FEN syncing, card consumption, modifier tracking, and audio cues.
  5. Verified end-to-end multi-tab match in headless Playwright test (`scripts/test-multiplayer-private-match.mjs`): room creation, challenger join, transition to `in_progress`, White move execution, and Black turn synchronization verified with 100% pass rate.

### [DEF-007] "My Deck" Action Footer Button in Arena Failed to Open Forge View
- **Severity:** P1 (Functional Defect / Broken Navigation)
- **Route:** `/deck-builder` (Tactical Arena match view)
- **Element:** Action footer button `"My Deck"` (`DeckBuilderPage.tsx#L461-L467`)
- **Observed Behavior:** Clicking `"My Deck"` in the Arena footer called `onClick={() => setScreen('multiplayer')}`, returning to the Multiplayer Character Stage rather than opening the dedicated Forge view (`screen === 'forge'`). Furthermore, the top navigation already provided an explicit `← Stage` button, leaving the Forge deck customizer view unreachable from the active match.
- **Expected Behavior:** Clicking `"My Deck"` should navigate to `screen === 'forge'`, rendering `DeckBuilderView` ("Deck Loadout") with card slot editing and a `"Back to Arena"` button for seamless circular round-trips.
- **Evidence:** `.agent/state/artifacts/screenshots/sweep_02_arena_desktop.png`
- **Suspect File(s):** `src/pages/DeckBuilderPage.tsx#L463`
- **Resolution:** Updated `onClick` handler on the `"My Deck"` button to `setScreen('forge')`. Verified end-to-end navigation loop (Arena → Forge → Back to Arena → Stage → Main Menu) with 0 console errors and clean DOM assertions.

---

## Historical Resolved Defects

### [DEF-005] React Shorthand/Non-Shorthand Style Conflict on Home Tab Toggle
- **Severity:** P1 (Console Warning / Styling Bug Risk)
- **Status:** Resolved in Session 2026-10-15 22:37
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
- **Status:** Resolved in Session 2026-10-15 22:37
- **Route:** `/login` and `/register`
- **Element:** `#auth-tab-register` and `#auth-tab-guest` mode switchers
- **Observed Behavior:** Toggling authentication modes triggered React console warning: `Removing a style property during rerender (backgroundColor) when a conflicting property is set (background) can lead to styling bugs.`
- **Expected Behavior:** Smooth background transitions without console warnings during tab rerender.
- **Evidence:** `.agent/state/artifacts/screenshots/sweep_05_auth_login_desktop.png`
- **Suspect File(s):** `src/pages/AuthPage.tsx#L443`
- **Resolution:** Normalized `tabStyle` from `background: 'transparent'` to `backgroundColor: 'transparent'`, preventing style attribute collisions with `activeTabStyle.backgroundColor`. Verified clean console logs.

---

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
