---
milestone: v3.0 Deck Builder Visual Immersion & Board Action Effects
version: 3.0.0
updated: 2026-10-16T09:06:00Z
---

# Roadmap

> **Current Milestone:** v3.0 Deck Builder Visual Immersion & Board Action Effects
> **Current Phase:** Not Started (Ready for Phase 1 Planning)
> **Status:** ⬜ Not Started

## Milestone Goal

Transform Deck Builder Chess into a visually rewarding, visceral tactical experience by authoring and generating bespoke card artwork assets for all 180 canonical cards, and introducing dynamic, responsive board animations, leap/teleport arcs, ranged beam cues, and capture impact effects on the chessboard.

## Must-Haves

- [ ] **180-Card Art & Nomenclature Finalization**: Finalize polished, concise names and rules copy across all 180 canonical cards, and generate/promote high-craft SVG assets for each card using the `@create-asset.md` workflow.
- [ ] **Battlefield Minor Unit Art Suite (90 Cards)**: Author and promote vector art for 30 Pawn, 30 Knight, and 30 Bishop cards, wired into card faces and hover mini-board explainers.
- [ ] **Royal Court Major Unit Art Suite (90 Cards)**: Author and promote vector art for 30 Rook, 30 Queen, and 30 King cards, completing the 180-card visual library.
- [ ] **Tactical Board Piece Animations**: Smooth piece movement animations for standard moves, parabolic leap arcs for Knight and Fairy vectors (Camel, Zebra, Dabbaba), and instant teleport/swap effects (Outflank, Trench Shift, Bodyguard Switch).
- [ ] **Ranged Strikes, Shield & State FX**: Visual projectile/beam effects for ranged attacks (Railgun Bolt, Counter Smite, Prism Ray), glowing energy shield envelopes (Regent's Aegis, Cathedral Dome), and pawn boundary/promotion cues.
- [ ] **Interactive Visual Rewards & Audio Sync**: Responsive capture impact animations, check warning auras, and synchronized procedural sound triggers.
- [ ] **Zero Performance & Engine Regressions**: 60fps animation performance, all 203 automated card engine unit tests passing 100%, and clean full-stack typechecks.

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
**Status:** ⬜ Not Started
**Objective:** Generate, review, and integrate 90 custom vector illustration assets for Battlefield Minor Units (30 Pawn, 30 Knight, 30 Bishop) using `@create-asset.md`, rendering into card faces and interactive mini-board explainers.
**Deliverables:**
- 30 custom vector SVG illustrations for Pawn cards
- 30 custom vector SVG illustrations for Knight cards
- 30 custom vector SVG illustrations for Bishop cards
- Card component integration in `TacticalHandBar.tsx` and `DeckBuilderView.tsx`

---

### Phase 3: Major Unit Vector Artwork Suite (90 Cards: Rook, Queen, King)
**Status:** ⬜ Not Started
**Objective:** Generate, review, and integrate 90 custom vector illustration assets for Royal Court Major Units (30 Rook, 30 Queen, 30 King) using `@create-asset.md`, completing the full 180-card visual library.
**Deliverables:**
- 30 custom vector SVG illustrations for Rook cards
- 30 custom vector SVG illustrations for Queen cards
- 30 custom vector SVG illustrations for King cards
- Complete 180/180 card illustration library with zero missing art assets

---

### Phase 4: Chessboard Move & Leap Trajectory Animations
**Status:** ⬜ Not Started
**Objective:** Implement smooth CSS/DOM/SVG piece translation transitions for standard moves, curved parabolic jump arcs for Knight/Fairy vectors (Camel, Zebra, Dabbaba), and swap/teleport dissolve effects (Outflank, Trench Shift, Bodyguard Switch).
**Deliverables:**
- Piece translation animation system in `DeckChessBoard.tsx`
- Parabolic leap arc rendering for Knight and Fairy vectors
- Dissolve and swap transition effects for position-exchange cards

---

### Phase 5: Ranged Beams, Shield Bubbles & Empowered Capture FX
**Status:** ⬜ Not Started
**Objective:** Implement dynamic visual FX for ranged snipes (Railgun Bolt, Counter Smite, Prism Ray piercing beams), tactical shield bubbles (Regent's Aegis, Cathedral Dome), glowing capture impact bursts, and King check threat pulses.
**Deliverables:**
- Ranged sniper beam / ray graphics across board coordinates
- Tactical shield aura indicators for protected squares/pieces
- Capture explosion / particle dissipation visual cues
- King danger / check pulse animation

---

### Phase 6: Visual Audio Synchronization, Multi-Viewport Audit & Milestone Release
**Status:** ⬜ Not Started
**Objective:** Synchronize Web Audio sound cues with board animation keyframes, conduct 60fps performance profiling across desktop and mobile viewports, run UX sweep, and release Milestone v3.0.
**Deliverables:**
- Audio-visual synchronization for all moves and card triggers
- 60fps performance validation on desktop and mobile viewports
- Full exploratory UX sweep confirming zero visual glitches or animation lag
- Production release build and milestone completion audit

---

## Completed Milestones

- **v1.0 Platform Expansion** (Phases 1–5 complete, verified, and archived in `.agent/state/milestones/v1.0-AUDIT.md` and `.agent/state/milestones/v1.0-ROADMAP.md`).
- **v2.0 Visual Craft & Frontend Redesign** (Phases 1–7 complete, verified, and archived in `.agent/state/milestones/v2.0-AUDIT.md` and `.agent/state/milestones/v2.0-ROADMAP.md`).
