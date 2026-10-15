# UX Defect Ledger

**Latest Sweep Date:** 2026-10-15 03:41
**Scope:** All Live Routes (`/`, `/login`, `/register`, `/dashboard`, `/deck-builder`, `/wormhole`, `/play/:code`)
**Target Environment:** `https://wormhole-chess.com`
**Total Inspected:** 6 routes, 9 interactive elements
**Active Defects:** 0 (P0: 0, P1: 0, P2: 0, P3: 0)
**Historical Defects Resolved:** 4/4 (100% resolved in Plans 5.4 & 5.5)

---

## Defects

### [DEF-001] Deck Builder Chess visual layout collapsed and pieces overflowing due to missing Tailwind CSS compiler
- **Severity:** P0 (Blocker)
- **Route:** `/deck-builder`
- **Actor Role:** Any player (Guest or Registered)
- **Element:** Chessboard (`DeckChessBoard`), Tactical Hand (`TacticalHandBar`), Sub-header, and Deck Forge (`DeckBuilderView`)
- **Observed Behavior:** Components in the Deck Builder experience were constructed using Tailwind CSS utility classes (`grid`, `flex`, `w-[520px]`, `w-4/5`, `max-w-4xl`, etc.). However, Tailwind CSS is not installed or configured in Vite. Consequently, the 8x8 chessboard fails to form a grid, SVG pieces have no width constraints and blow up to fill the viewport, and control buttons render as default unstyled browser buttons.
- **Expected Behavior:** Chessboard should render as an 8x8 grid with sharp piece SVGs, the 8-card tactical hand should display aligned cards with glowing energy counters, and action buttons should match the platform's dark theme design system.
- **Evidence:** `.agent/state/artifacts/screenshots/deck_builder_desktop.png`
- **Suspect File(s):** `package.json`, `vite.config.ts`, `src/index.css`, `src/pages/DeckBuilderPage.tsx`, `src/components/DeckChessBoard.tsx`
- **Suggested Fix:** Install `@tailwindcss/vite` (or `tailwindcss`), configure the plugin in `vite.config.ts`, and import Tailwind in `src/index.css` so that utility classes compile properly into the production bundle.

---

### [DEF-002] 3D Wormhole Chess Header title text overlapped and clipped by floating navigation buttons
- **Severity:** P2 (UX / State Glitch)
- **Route:** `/wormhole`
- **Actor Role:** Any player
- **Element:** Top-left return and conclude overlay buttons
- **Observed Behavior:** The floating header overlay bar containing `← Home`, `3D Wormhole Chess`, and `🏁 Conclude Match` is positioned over the underlying Three.js canvas title, causing partially cut-off text (`n... ... s`) to leak behind the overlay buttons.
- **Expected Behavior:** Overlay controls should have dedicated top spacing or the underlying Three.js scene header should be hidden when wrapped inside `WormholePage`.
- **Evidence:** `.agent/state/artifacts/screenshots/wormhole_desktop.png`
- **Suspect File(s):** `src/pages/WormholePage.tsx`, `src/components/ChessboardScene.tsx`
- **Suggested Fix:** Add a CSS rule or prop to `ChessboardScene` to suppress the duplicate canvas title when mounted inside `WormholePage`.

---

### [DEF-003] Home page displays "In Development (2D)" badge and "Explore Rules & Preview →" for Deck Builder Chess
- **Severity:** P3 (Visual Polish / Slop)
- **Route:** `/`
- **Actor Role:** Public visitor
- **Element:** Deck Builder Chess variant card (`src/pages/HomePage.tsx#L48-L58`)
- **Observed Behavior:** The variant card displays an amber badge `In Development (2D)` and a dark gray secondary button `Explore Rules & Preview →`, despite Phase 4 & Phase 5 completion where Deck Builder Chess was fully delivered with AI, custom decks, and multiplayer.
- **Expected Behavior:** Card should display a green `Playable (2D)` badge and blue primary button `Launch Deck Builder Chess →`.
- **Evidence:** `.agent/state/artifacts/screenshots/home_desktop.png`
- **Suspect File(s):** `src/pages/HomePage.tsx#L48-L58`
- **Suggested Fix:** Change badge to `statusTagLiveStyle` ("Playable (2D)") and button to `primaryButtonActionStyle` ("Play Deck Builder Chess →").

---

### [DEF-004] Deck Builder Subheader displays raw phase milestone label "2D Phase 4"
- **Severity:** P3 (Visual Polish / Slop)
- **Route:** `/deck-builder`
- **Actor Role:** Any player
- **Element:** Subheader badge in `src/pages/DeckBuilderPage.tsx#L80`
- **Observed Behavior:** The subheader displays `Deck Builder Chess` with a badge reading `2D Phase 4`. To an end user, exposing internal engineering sprint numbers is confusing and resembles development scaffolding.
- **Expected Behavior:** Should display player-facing text like `Tactical 2D` or `Card Variant`.
- **Evidence:** `.agent/state/artifacts/screenshots/deck_builder_desktop.png`
- **Suspect File(s):** `src/pages/DeckBuilderPage.tsx#L80`
- **Suggested Fix:** Change badge text from `2D Phase 4` to `Tactical 2D`.
