---
milestone: v3.0 Parallel World Key Campaign, 36-Card Pyramid & Grandmaster Trials
version: 3.0.0
updated: 2026-10-24T14:52:00-05:00
---

# Roadmap

> **Current Milestone:** v3.0 Parallel World Key Campaign, 36-Card Pyramid & Grandmaster Trials
> **Current Phase:** Phase 5 — Home & Deck Builder Matchmaking UI Revamp, Atmospheric Assets & 36-Card Copywriting Polish
> **Status:** 🔄 Ready for Planning & Execution (Phases 1–4 Complete & Verified)

## Milestone Goal

Implement the curated **36-Card Piece-Abundance Pyramid** (`8 Pawn, 7 Knight, 7 Bishop, 6 Rook, 4 Queen, 4 King`) with 100% bespoke mechanics and zero Energy clutter, launch a vibrant **Deck Builder Main Menu Hub** (`Campaign`, `Multiplayer`, `My Profile` + `Switch Profile`, and Right-Side Player Stats/Canvas), complete the **Multiplayer & AI Playtest Prototype** (36-card Deck Builder, Private Room Matchmaking, and Card-Aware AI), and then build out the **7-World Castle Campaign & Town Tavern Sandbox** defined in `STORYBOARD.md`.

## Must-Haves

- [x] **180-Card Nomenclature & Schema Foundation (Phase 1)**: Concise names (<=21 chars), zero-ellipsis rule formulas (<=120 chars), and `artId` mappings across all 180 catalog cards.
- [x] **Battlefield Minor Unit Art Suite (Phase 2)**: 90 custom vector SVG illustrations for Pawn, Knight, and Bishop cards wired into `<CardArt />`.
- [x] **Campaign Storyboard & 36-Card Specification (`STORYBOARD.md`)**: Locked all 36 cards (`P1–P8, N1–N7, B1–B7, R1–R6, Q1–Q4, K1–K4`), Global Engine Invariants, Concurrent Castle Wings (`Worlds 3–6`), Town Tavern Hustle, and Jester Shop.
- [x] **36-Card Engine & Global Invariants (Phase 3)**: Implement all 36 bespoke card handlers in `cardRegistry.ts` and global rules in `DeckChessEngine.ts` (1 card per turn / no Energy cost, Rank 1 Pawn legalization, Rank 8 instant promotion, relaxed Bishop color switching, `limitPawnsTo8` toggle).
- [x] **Deck Builder Main Menu Hub & Multi-Profile Switcher (Phase 3)**: Vibrant main menu at `/deck-builder` with `Campaign`, `Multiplayer`, `My Profile` + `Switch Profile` (multi-slot local profiles), and a right-hand Player Stats (`Gold Coins`, `Level`) + Aesthetic Canvas area.
- [x] **Multiplayer & AI Playtest Prototype (Phase 3)**: 36-card Deck Builder loadout screen, Private Room Matchmaking (`/play/:code`), and Custom AI Playtest mode to test cards and tune AI opponents.
- [x] **Gameplay Bugfixes, 36-Card Audit & Mobile Ergonomics (Phase 4)**: Sleek standard move vs empowered card move choice, full 36-card mechanics/condition audit (including perpendicular R1 step-aside), mobile horizontal card scroll wheels, and auto-sorting spent cards to hand end.
- [ ] **Home & Deck Builder Matchmaking UI Revamp, Atmospheric Assets & Copywriting (Phase 5)**: Purge lingering "energy" mentions across home page and menus, integrate rich atmospheric tabletop and castle hall visuals, rename Deck Builder Stage to Deck Builder Matchmaking, and refine condition/effect copywriting across all 36 cards.
- [ ] **Grandmaster Card-Aware AI Engine, Campaign Hints & 30M Deck Simulation (Phase 6)**: Build latent threat heatmap card anticipation into AI search, create 3-tier campaign hint engine, and author headless multi-worker Monte Carlo tournament simulation harness with tier reports.
- [ ] **Campaign Engine, Town Tavern & Worlds 1–7 (Phases 7–9)**: Build the Castle Map UI, Town Tavern 0-card bot hustle, Jester's Coat Shop (`Rewind`, `Hint`, `Carbon Copy`, `+1 Slot`), and the 7-World Campaign puzzle sequences.

---

## Phases

### Phase 1: Card Nomenclature Polish & Schema Finalization (All 180 Cards)
**Status:** ✅ Complete
**Objective:** Audit and finalize all 180 card titles (<=21 characters), refine condition/effect copy to eradicate awkward phrasing, standardize asset naming IDs, and author contract validation tests.

---

### Phase 2: Minor Unit Vector Artwork Suite (90 Cards: Pawn, Knight, Bishop)
**Status:** ✅ Complete
**Objective:** Generate, review, and integrate 90 custom vector illustration assets for Battlefield Minor Units (30 Pawn, 30 Knight, 30 Bishop) using `@create-asset.md`, rendering into card faces and interactive mini-board explainers.

---

### Phase 3: 36-Card Engine, Deck Builder Main Menu Hub & Multiplayer / AI Playtest Prototype
**Status:** ✅ Complete
**Objective:** Implement all 36 locked cards (`P1–P8, N1–N7, B1–B7, R1–R6, Q1–Q4, K1–K4`) and global engine invariants in `DeckChessEngine.ts` and `cardRegistry.ts`; build the vibrant Deck Builder Main Menu Hub (`Campaign`, `Multiplayer`, `My Profile` + `Switch Profile`, and Right-Side Player Stats & Aesthetic Canvas); and wire up the full Multiplayer & AI Playtest Prototype (36-Card Deck Builder screen, Private Matchmaking rooms, and AI opponent playtesting).
**Deliverables:**
- `src/engine/cards/releaseRoster36.ts` and 36/36 bespoke `CardBehaviorHandler` implementations in `src/engine/cards/cardRegistry.ts` with 100% unit test coverage
- Global engine updates in `src/engine/DeckChessEngine.ts` (1 card per turn / no Energy costs, Rank 1 Pawn support via `{ skipValidation: true }`, Rank 8 instant promotion, relaxed Bishop color switching, `limitPawnsTo8` flag)
- Vector SVG artwork for the curated Major Unit cards in `public/assets/cards/{rook,queen,king}/`
- Vibrant Deck Builder Main Menu Hub (`Campaign`, `Multiplayer`, `My Profile` + `Switch Profile` multi-slot manager, and Right-Hand Stats + Player Aesthetic Canvas)
- Multiplayer & AI Playtest Lobby: 36-card Deck Builder screen (`DeckBuilderView.tsx`), Private Matchmaking (`PlayRoomPage.tsx` / `MatchmakingLobby.tsx`), and AI Playtest Arena

---

### Phase 4: Gameplay Bugfixes, 36-Card Mechanics Audit & Mobile Card Ergonomics
**Status:** ✅ Complete
**Objective:** Resolve piece move vs card move collision (provide an intuitive way to make standard chess moves without forcing empowered card play), conduct a comprehensive condition/effect audit and bug squash across all 36 playable cards (including perpendicular pawn evasion for R1 "Make Way"), implement mobile horizontal scroll wheels for card containers (Deck Builder and Tactical Hand Bar), and auto-sort spent/grayed-out cards to the end of the player's hand.

---

### Phase 5: Home & Deck Builder Matchmaking UI Revamp, Atmospheric Assets & 36-Card Copywriting Polish
**Status:** 🔄 Ready for Planning
**Objective:** Purge lingering legacy "energy" mentions and UI relics across `HomePage.tsx`, `DeckBuilderView.tsx`, and matchmaking headers; rename "Deck Builder Stage" to "Deck Builder Matchmaking"; integrate rich atmospheric environmental visual assets (weathered tabletop, castle backdrop, ornate elements) to make the interface lived-in and tactile; and perform a comprehensive card-by-card copywriting review and polish on all 36 release roster cards.
**Dependencies:** Phase 4 (Complete)

---

### Phase 6: Grandmaster Card-Aware AI Engine, Campaign Hint System & Deck Balance Simulation Matrix
**Status:** ⬜ Not Started
**Objective:** Upgrade `DeckChessAI.ts` from naive standard-move search to a modular Grandmaster engine that computes latent threat heatmaps from opponent's unspent card hands; implement a 3-tier Campaign Hint Engine (Concept -> Target -> Solution); and build a headless multi-threaded Monte Carlo tournament simulation harness to evaluate deck balance and card win-rate contribution across the 30M+ deck permutation space.
**Dependencies:** Phase 4 (36-Card Engine), Phase 5 (Copywriting & Asset Polish)

---

### Phase 7: Campaign Engine, Jester's Shop, Town Tavern Sandbox & World 1 (`The Causeway`)
**Status:** ⬜ Not Started
**Objective:** Build the Campaign Map & Puzzle Engine (`Foreshadow -> Officer Duel -> Forced-Slot` cycle), Jester's Coat Shop (`Rewind`, `Hint`, `Carbon Copy`, `+1 Slot`), "Back to Town" Tavern Hustle (0-card Towny bots for Gold Coins), and World 1 (`The Causeway` — 7 Cards: `P1, P2, P3, N1, B1, N2, R1`).
**Dependencies:** Phase 6

---

### Phase 8: World 2 (`Outer Courtyard`) & Concurrent Castle Wings (`Worlds 3–6`)
**Status:** ⬜ Not Started
**Objective:** Author and verify the puzzle cycles, Wing Keys, and Boss Duels across World 2 (`N3, R2, B2, R3`) and the 4 Concurrent Wings off the Central Rotunda: World 3 (`The Barracks`), World 4 (`The Chapel`), World 5 (`The Armory`), and World 6 (`The Royal Court`).
**Dependencies:** Phase 7

---

### Phase 9: World 7 (`The Throne Room`), The Jester Final Boss & Release Audit
**Status:** ⬜ Not Started
**Objective:** Author and verify World 7 (`N7, P8, B7, Q4, K4`), the Iron King Boss Duel, and the True Final Boss showdown against the Scheming Jester (36-card Master AI), followed by full UX verification and Milestone v3.0 release.
**Dependencies:** Phase 8

---

## Completed Milestones

- **v1.0 Platform Expansion** (Phases 1–5 complete, verified, and archived in `.agent/state/milestones/v1.0-AUDIT.md` and `.agent/state/milestones/v1.0-ROADMAP.md`).
- **v2.0 Visual Craft & Frontend Redesign** (Phases 1–7 complete, verified, and archived in `.agent/state/milestones/v2.0-AUDIT.md` and `.agent/state/milestones/v2.0-ROADMAP.md`).
