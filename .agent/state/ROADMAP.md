---
milestone: v2.0 Visual Craft & Frontend Redesign
version: 2.0.0
updated: 2026-10-15T13:04:00Z
---

# Roadmap

> **Current Milestone:** v2.0 Visual Craft & Frontend Redesign
> **Current Phase:** Phase 6 - Major Unit Card Graph & Royal Power Taxonomy (Rook, Queen, King)
> **Status:** 🔄 In Progress

## Milestone Goal

Systematically eliminate AI-slop across all user-facing screens, establish a distinctive, bespoke visual identity (dark tactical sci-fi / high-craft gaming UI), fix awkward screen proportions (particularly on the Deck Builder and Dashboard), and design each page through `@design-phase.md` while strictly requiring explicit user confirmation before writing any user-facing copy.

## Must-Haves

- [x] **Mandatory Copy Approval**: Never write or inject user-facing copy into templates, headings, hero sections, cards, or alerts without explicit prior user confirmation (preventing cringey AI filler).
- [x] **Global Design Tokens & Identity**: Aesthetic tokens (colors, typography pairings, border radii, spacing rhythm, elevation) locked in `.agent/rules/STYLE.md` and `.agent/state/DESIGN_STATE.md`.
- [x] **Player Dashboard Redesign**: Refactored player profile, combat stats, matchmaking lobby, and historical replay viewer with clean density and high craft.
- [x] **Tactical Deck Builder Arena Redesign**: Balanced widescreen layout, properly proportioned 2D board, tactile hand bar, energy meter, and card curator/inspector without vertical bloating or awkward grid stretching.
- [x] **Home Landing & Authentication Redesign**: Atmospheric dark tactical hero, distinct typography, variant showcase cards, and sleek tabbed auth modals.
- [x] **3D Wormhole & PlayRoom HUD Redesign**: Non-intrusive floating glass HUD, move notation ticker, game clock integration, and room coordination status.
- [ ] **Full 180-Card Canonical Graph**: Author, integrate, and test all 90 cards for Major Units (30 Rook, 30 Queen, 30 King), completing the full 180-card library across all 6 piece classes with 0 engine regressions.
- [x] **Zero Gameplay Regressions**: All 140 automated card engine tests (`npm test`), 3D WebGL controls, and Cloudflare multiplayer synchronization continue passing 100%.

---

## Phases

### Phase 1: Design System Foundations & Player Dashboard Redesign
**Status:** ✅ Complete
**Objective:** Ground visual identity in niche benchmarks, establish global tokens in `STYLE.md`, and design/implement a high-craft Player Dashboard (`DashboardPage.tsx`), Top Navigation, Matchmaking Lobby, and Historical Replay Viewer using `@design-phase.md` with approved copy.
**Deliverables:**
- Global design system tokens in `.agent/rules/STYLE.md` & `.agent/state/DESIGN_STATE.md`
- Redesigned Top Navigation bar (`Navigation.tsx`)
- Redesigned Player Dashboard (`DashboardPage.tsx`)
- Redesigned Matchmaking Lobby (`MatchmakingLobby.tsx`)
- Redesigned Replay Viewer modal (`HistoricalMatchViewer.tsx`)

---

### Phase 2: Tactical Deck Builder Page & Arena Layout Redesign
**Status:** ✅ Complete
**Objective:** Eliminate proportion distortion on the Deck Builder page. Re-architect the screen layout so the 2D chessboard, tactical hand bar, energy meter, card curator, and combat log fit harmoniously without vertical scroll jank or stretched assets.
**Deliverables:**
- Balanced arena layout for `DeckBuilderPage.tsx`
- Refactored `DeckChessBoard.tsx` framing and coordinates
- Refined `TacticalHandBar.tsx` and card inspector with tactile states
- Redesigned 8-card loadout curator in `DeckBuilderView.tsx`

---

### Phase 3: Home Landing & Authentication Redesign
**Status:** ✅ Complete
**Objective:** Design and implement a compelling, atmospheric Home page (`HomePage.tsx`) with restrained, user-approved copy, distinctive game variant showcase cards, feature highlights, and a sleek tabbed Auth page (`AuthPage.tsx`).
**Deliverables:**
- Redesigned `HomePage.tsx` hero, mode cards, and CTA sections
- Redesigned `AuthPage.tsx` with seamless Login / Register / Guest tabs
- Polished active session and quick-play entry points

---

### Phase 4: 3D Wormhole HUD & Multiplayer PlayRoom Redesign
**Status:** ✅ Complete
**Objective:** Replace cluttered overlays on 3D Wormhole Chess (`WormholePage.tsx`, `ChessboardScene.tsx`) and multiplayer room arena (`PlayRoomPage.tsx`) with a minimalist, non-intrusive floating HUD, move notation drawer, and tactile chess clocks.
**Deliverables:**
- Floating glass HUD for `WormholePage.tsx`
- Refined `ChessClock.tsx` visual states and disconnect warnings
- Streamlined `PlayRoomPage.tsx` multiplayer battle arena layout

---

### Phase 5: Deck Builder Card Graph & Power Taxonomy
**Status:** ✅ Complete
**Objective:** Systematize the compositional multi-partite card graph across all pieces (King, Queen, Rook, Bishop, Knight, Pawn). Establish clear condition genres (position, relational, tactical, status) and thematic effect genres per piece (e.g., King = spawning/reinforcements, Bishop = movement augmentation/color-shift, etc.). Balance energy tiers (1⚡, 2⚡, 3⚡) with consistent distributions across pieces, implement the expanded card registry & handlers, and verify with comprehensive engine tests and UI hand bar integration.
**Deliverables:**
- Condition-to-effect genre taxonomy & energy distribution matrix across piece anchors
- Formalized card definitions and behavior handlers in `src/engine/cards/cardRegistry.ts`
- Engine invariant verification and expanded automated unit test suite (140 tests)
- `TacticalHandBar.tsx` and `DeckBuilderView.tsx` UI catalog updates with 90 canonical cards and one-click execution

---

### Phase 6: Major Unit Card Graph & Royal Power Taxonomy (Rook, Queen, King)
**Status:** ✅ Complete
**Objective:** Author, validate, and integrate the 90 canonical cards for the Royal Court Major Units (30 Rook, 30 Queen, 30 King) into the catalog, completing the 180-card library under the 6×6 condition-to-effect grammar matrix and symmetrical Major 3-cycle (Rook: Good at Neighbors, excl. Position; King: Good at Position, excl. Threat; Queen: Good at Threat, excl. Neighbors). Implement Major Unit behavior handlers and invariant checks in `cardRegistry.ts` / `DeckChessEngine.ts`, expand `DeckBuilderView.tsx` filter tabs to all 6 piece classes (`All (180)`, `Pawn (30)`, `Knight (30)`, `Bishop (30)`, `Rook (30)`, `Queen (30)`, `King (30)`), and verify with contract tests and headless Playwright suite.
**Deliverables:**
- 90 canonical Major Unit cards (30 Rook, 30 Queen, 30 King) in `src/engine/cards/cardCatalog180.json` (or updated catalog) with 12/12/6 energy cost curve
- Behavior handlers for Rook, Queen, and King cards in `src/engine/cards/cardRegistry.ts` and `src/engine/DeckChessEngine.ts`
- Automated test suites (card catalog integrity, king safety, fairy geometry, and engine invariants) expanding engine tests
- `DeckBuilderView.tsx` updated with 6 piece filter tabs and 180-card curator rack
- Playwright headless UI verification and visual evidence screenshots

---

### Phase 7: Global Polish, Micro-interactions, Responsive Audit & Release
**Status:** ⬜ Not Started
**Objective:** Conduct cross-page continuity audits, verify mobile and tablet responsive behaviors, add subtle micro-interactions/audio feedback, and deploy the updated frontend to Cloudflare Pages.
**Deliverables:**
- Comprehensive UX sweep across all 6 live routes
- Responsive breakpoint hardening
- Production build and Cloudflare Pages deployment verification

---

## Completed Milestones

- **v1.0 Platform Expansion** (Phases 1–5 complete, verified, and archived in `.agent/state/milestones/v1.0-AUDIT.md` and `.agent/state/milestones/v1.0-ROADMAP.md`).
