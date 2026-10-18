---
milestone: v3.0 Parallel World Key Campaign, 36-Card Pyramid & Grandmaster Trials
version: 3.0.0
updated: 2026-10-18T11:05:09-05:00
---

# Roadmap

> **Current Milestone:** v3.0 Parallel World Key Campaign, 36-Card Pyramid & Grandmaster Trials
> **Current Phase:** Phase 3 — Campaign Storyboard & 36-Card Pyramid Curation (`8P, 7K, 7B, 6R, 4Q, 4Kg`)
> **Status:** 🔄 In Progress (Phases 1–2 Complete; Phase 3 Discussion in Progress)

## Milestone Goal

Transform Deck Builder Chess into an interactive, non-linear tactical campaign inspired by *Plants vs. Zombies 2*, where players progress across an open-ended **Atlas of Parallel Worlds** unlocked via **World Keys**, bringing their own multi-copy custom hands into varied tactical challenges (4×4/5×5 Card Unlock Drills, 5×5–8×8 Objective & Locked-and-Loaded Missions, and Full-Board 8×8 Gatekeeper Challenges) to unlock a rigorously audited First-Release Pyramid of **36 bespoke cards** (`8 Pawn, 7 Knight, 7 Bishop, 6 Rook, 4 Queen, 4 King`).

## Must-Haves

- [x] **180-Card Nomenclature & Schema Foundation (Phase 1)**: Concise names (<=21 chars), zero-ellipsis rule formulas (<=120 chars), and `artId` mappings across all 180 catalog cards.
- [x] **Battlefield Minor Unit Art Suite (Phase 2)**: 90 custom vector SVG illustrations for Pawn, Knight, and Bishop cards wired into `<CardArt />`.
- [ ] **Asymmetric 7-World Parallel Storyboard & Open-Ended Atlas**: Define the 7-World unlock sequence (`W1: 7 cards + 1 Key`, `W2: 4 cards + 2 Keys`, `W3: 5 cards + 2 Keys [Q#1]`, `W4: 5 cards + 2 Keys [Kg#1]`, `W5: 5 cards + 1 Key`, `W6: 5 cards + 1 Key`, `W7: 5 cards + 1 Key → World 8+`) with open-ended narrative hooks for future Worlds 8, 9, 10+.
- [ ] **One-by-One 36-Card Pyramid Curation & Bespoke Mechanics Audit**: Select and review the 36 First-Release cards (`8 Pawn, 7 Knight, 7 Bishop, 6 Rook, 4 Queen, 4 King`), ensuring 100% bespoke, bug-free handlers in `cardRegistry.ts` and custom SVG art for the 14 curated Major Unit cards (`6 Rook, 4 Queen, 4 King`).
- [ ] **Multi-Copy Campaign Hand vs. PvP Mastery Copy System**: Support unlimited copies of any unlocked card in Campaign hands, and 1 base copy in PvP with repeatable card-specific **PvP Mastery Challenges** to unlock additional copies.
- [ ] **3-Scale Challenge Engine & Parallel World Key UI**: Support 4×4/5×5 Card Award Practice Drills, 5×5–8×8 Bring-Your-Own-Hand Missions (*Locked & Loaded* with 1 pre-filled slot, *VIP Escort*, *Wave Survival*, *Fortress Breaker*, *Target Assassination*), and Full-Board 8×8 *Gatekeeper* Puzzles.
- [ ] **Zero Regressions & Full Empirical Verification**: Automated challenge/drill verification tests, 100% unit test pass rate, and clean full-stack typechecks.

---

## Phases

### Phase 1: Card Nomenclature Polish & Schema Finalization (All 180 Cards)
**Status:** ✅ Complete
**Objective:** Audit and finalize all 180 card titles (<=21 characters), refine condition/effect copy to eradicate awkward phrasing, standardize asset naming IDs, and author contract validation tests.
**Deliverables:**
- Polished titles and rule descriptions for all 180 cards in `cardCatalog90.json` and `cardCatalogMajor90.json`
- Contract tests enforcing schema, length, and typography constraints
- Asset directory structure and mapping ledger for the 180 card illustrations

---

### Phase 2: Minor Unit Vector Artwork Suite (90 Cards: Pawn, Knight, Bishop)
**Status:** ✅ Complete
**Objective:** Generate, review, and integrate 90 custom vector illustration assets for Battlefield Minor Units (30 Pawn, 30 Knight, 30 Bishop) using `@create-asset.md`, rendering into card faces and interactive mini-board explainers.
**Deliverables:**
- 30 custom vector SVG illustrations for Pawn cards
- 30 custom vector SVG illustrations for Knight cards
- 30 custom vector SVG illustrations for Bishop cards
- Card component integration in `TacticalHandBar.tsx` and `DeckBuilderView.tsx`

---

### Phase 3: Campaign Storyboard & One-by-One 36-Card Pyramid Curation (`8P, 7K, 7B, 6R, 4Q, 4Kg`)
**Status:** 🔄 In Discussion
**Objective:** Lock the 7-World asymmetric parallel storyboard (with World Keys and open-ended expansion hooks for Worlds 8+), review and select the 36 First-Release cards (`8 Pawn, 7 Knight, 7 Bishop, 6 Rook, 4 Queen, 4 King`) one-by-one, audit/implement 100% bespoke engine handlers in `cardRegistry.ts` for all 36 cards, and generate custom vector SVGs for the 14 curated Major Unit cards.
**Deliverables:**
- Campaign Storyboard & 7-World Progression Ledger (`STORYBOARD.md`) detailing Worlds 1–7 card unlock slots, World Key nodes, and World 8+ expansion hooks
- Curated 36-Card First-Release Manifest (`releaseRoster36.ts`) following the `8 Pawn, 7 Knight, 7 Bishop, 6 Rook, 4 Queen, 4 King` pyramid
- 36/36 bespoke, one-by-one verified `CardBehaviorHandler` implementations in `src/engine/cards/cardRegistry.ts` (zero generic fallback usage in Release 1)
- 14 custom vector SVG illustrations (`public/assets/cards/{rook,queen,king}/`) for the curated Major Unit cards

---

### Phase 4: 3-Scale Challenge Engine, Multi-Copy / PvP Mastery Deck Rules & World Key Map UI
**Status:** ⬜ Not Started
**Objective:** Build the 3-Scale Challenge Engine supporting cropped 4×4/5×5 Card Unlock Practice Drills, 5×5–8×8 Bring-Your-Own-Hand Objective & Locked-and-Loaded Missions, and Full-Board 8×8 Gatekeeper Challenges; implement multi-copy Campaign deck building + PvP Mastery Challenges for unlocking extra PvP copies; and build the PvZ2-style Parallel World Key Atlas UI.
**Deliverables:**
- Cropped board viewport support (`4×4`, `5×5`, `6×6`, `8×8`) and objective evaluators (*Checkmate*, *Target Assassination*, *VIP Escort*, *Wave Survival*, *Fortress Breaker*, *Locked & Loaded* 1-slot lock)
- Multi-copy Campaign hand selector + PvP 1-copy base limit with repeatable **PvP Mastery Challenge** copy unlock tracking
- Interactive Parallel World Key Map UI (Worlds 1–7 + locked World 8+ frontier) and Card Award Practice Drill modal

---

### Phase 5: Worlds 1–4 Campaign Missions, Practice Drills & Gatekeepers (21 Cards + 7 World Keys)
**Status:** ⬜ Not Started
**Objective:** Design, author, and verify all campaign levels, 4×4/5×5 card unlock practice drills, and 8×8 Gatekeeper challenges across World 1 (7 cards, 1 Key), World 2 (4 cards, 2 Keys), World 3 (5 cards incl. `Queen #1`, 2 Keys), and World 4 (5 cards incl. `King #1`, 2 Keys).
**Deliverables:**
- World 1 guided opening + full mission sequence (3 Pawns, 2 Knights, 1 Bishop, 1 Rook + 1 World Key)
- Worlds 2, 3, and 4 parallel mission sequences, practice drills, and full-board Gatekeeper battles
- Automated verification suite confirming all World 1–4 drills and challenges function cleanly

---

### Phase 6: Worlds 5–7 Campaign Missions, Practice Drills & Gatekeepers (15 Cards + 3 World Keys) & Release
**Status:** ⬜ Not Started
**Objective:** Design, author, and verify all campaign levels, 4×4/5×5 card unlock practice drills, and 8×8 Gatekeeper challenges across Worlds 5, 6, and 7 (15 remaining cards incl. `Queens #2–4` and `Kings #2–4`, ending with a World Key for World 8+), conduct a full multi-viewport UX sweep, and release Milestone v3.0.
**Deliverables:**
- Worlds 5, 6, and 7 parallel mission sequences, practice drills, and full-board Gatekeeper battles
- Complete 36-card / 7-World verification, Playwright UX sweep, and Milestone v3.0 release audit

---

## Future Milestones Backlog

- **v4.0 Board Action Visual FX & Worlds 8+ Expansion**:
  - Chessboard piece translation animations, parabolic leap arcs, ranged sniper beams, shield bubbles, and synchronized audio keyframes.
  - Worlds 8, 9, 10+ on the Parallel Atlas unlocking new cards from the remaining 144-card catalog.

## Completed Milestones

- **v1.0 Platform Expansion** (Phases 1–5 complete, verified, and archived in `.agent/state/milestones/v1.0-AUDIT.md` and `.agent/state/milestones/v1.0-ROADMAP.md`).
- **v2.0 Visual Craft & Frontend Redesign** (Phases 1–7 complete, verified, and archived in `.agent/state/milestones/v2.0-AUDIT.md` and `.agent/state/milestones/v2.0-ROADMAP.md`).
