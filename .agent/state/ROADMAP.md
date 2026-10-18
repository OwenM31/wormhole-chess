---
milestone: v3.0 Tactical Campaign, 36-Card Curation & Grandmaster Trials
version: 3.0.0
updated: 2026-10-18T09:43:00-05:00
---

# Roadmap

> **Current Milestone:** v3.0 Tactical Campaign, 36-Card Curation & Grandmaster Trials
> **Current Phase:** Phase 3 — Campaign Storyboard & 36-Card Roster Curation (`2,1,1,1,1,0` Matrix)
> **Status:** 🔄 In Progress (Phases 1–2 Complete; Ready for Phase 3)

## Milestone Goal

Transform Deck Builder Chess into a progression-driven tactical campaign ("The Grandmaster Trials") inspired by *Plants vs. Zombies*, where players progress through 6 Grandmaster Houses, solving 5-puzzle tactical gauntlets (180 puzzles total) to unlock a rigorously audited First-Release roster of 36 bespoke cards (6 per piece class following the `(2, 1, 1, 1, 1, 0)` condition distribution and `1-per-Effect-Genre` balance).

## Must-Haves

- [x] **180-Card Nomenclature & Schema Foundation (Phase 1)**: Concise names (<=21 chars), zero-ellipsis rule formulas (<=120 chars), and `artId` mappings across all 180 catalog cards.
- [x] **Battlefield Minor Unit Art Suite (Phase 2)**: 90 custom vector SVG illustrations for Pawn, Knight, and Bishop cards wired into `<CardArt />`.
- [ ] **Campaign Storyboard & Extensible Narrative Architecture**: Establish "The Grandmaster Trials (Order of the Six Houses)" narrative arc with built-in hooks for future Tiers II–V card expansions, Cross-House Conclaves, and Rift Anomaly puzzles.
- [ ] **One-by-One 36-Card Roster Curation & Bespoke Mechanics Audit**: Select and review 6 cards per piece ($6 \times 6 = 36$ cards) adhering to the `(2, 1, 1, 1, 1, 0)` condition breakdown (2 on specialty condition, 1 on each of the 4 secondary conditions, 0 on excluded) and `1-per-Effect-Genre` coverage, ensuring 100% bespoke, bug-free handlers in `cardRegistry.ts` and custom SVG art for the 18 curated Major Unit cards.
- [ ] **Tactical Puzzle Engine & PvZ-Style Unlock Progression UI**: Deterministic puzzle runner supporting custom starting FENs, fixed puzzle hands, energy budgets, multi-turn objectives (Mate-in-N, Capture Target, Survive & Counter), scripted opponent responses, persistent card unlock progression, and an interactive Campaign Map UI.
- [ ] **180-Puzzle Campaign Suite (36 Card Gauntlets × 5 Puzzles)**: 180 verified tactical puzzles structured around the 5-step pedagogical loop (*1: Demonstration → 2: Condition Trigger → 3: Defensive Counter → 4: Tactical Combo → 5: House Boss Trial*).
- [ ] **Zero Regressions & Full Empirical Verification**: Automated puzzle solver/validator tests confirming every puzzle has a deterministic legal solution, 100% unit test pass rate, and clean full-stack typechecks.

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

### Phase 3: Campaign Storyboard & One-by-One 36-Card Roster Curation (`2,1,1,1,1,0` Matrix)
**Status:** ⬜ Not Started
**Objective:** Author the 6-Act "Grandmaster Trials" campaign storyboard (with extensible narrative hooks for future Tiers II–V and Cross-House Conclaves), review and select the 36 First-Release cards (6 per piece class: `2` Specialty + `1,1,1,1` Secondary + `0` Excluded condition distribution across all 6 Effect Genres), audit/implement 100% bespoke engine handlers in `cardRegistry.ts` for all 36 cards, and generate custom vector SVGs for the 18 curated Major Unit cards.
**Deliverables:**
- Campaign Storyboard & Narrative Bible (`STORYBOARD.md`) detailing the 6 Grandmaster Houses, unlock order, and future expansion hooks
- Curated 36-Card First-Release Manifest (`releaseRoster36.ts` / catalog flags) satisfying the `(2, 1, 1, 1, 1, 0)` condition matrix and `1-per-Effect-Genre` balance
- 36/36 bespoke, one-by-one verified `CardBehaviorHandler` implementations in `src/engine/cards/cardRegistry.ts` (zero generic fallback usage in Release 1)
- 18 custom vector SVG illustrations (`public/assets/cards/{rook,queen,king}/`) for the curated Major Unit cards

---

### Phase 4: Tactical Puzzle Engine, Challenge Schema & PvZ-Style Campaign Progression UI
**Status:** ⬜ Not Started
**Objective:** Build the core Puzzle & Challenge Engine supporting custom board FEN setups, scripted puzzle hands, turn/energy constraints, deterministic opponent replies, and objective evaluators, paired with a *Plants vs. Zombies*-style Campaign Map, 5-node Card Unlock Gauntlet tracker, and Card Unlock reward modal integrated with the Deck Builder.
**Deliverables:**
- `PuzzleDefinition` schema and `PuzzleEngine` / `usePuzzleGame` hook supporting multi-turn scripted challenges and win-condition verification
- Persistent Campaign & Card Unlock state (`localStorage` + D1 cloud sync compatibility) gating uncollected cards in `DeckBuilderView.tsx`
- Interactive Campaign Map UI (6 Grandmaster Houses × 6 Card Gauntlets × 5 Puzzle Nodes) and post-gauntlet Card Unlock celebration screen

---

### Phase 5: Acts I–III Campaign Puzzles — Minor Unit Houses (Pawn, Knight, Bishop: 18 Cards / 90 Puzzles)
**Status:** ⬜ Not Started
**Objective:** Design, author, and programmatically verify the first 90 campaign puzzles across Act I (House of the Trench — Pawn), Act II (House of the Stirrup — Knight), and Act III (House of the Prism — Bishop), with 5 themed puzzles per card following the *Teach → Trigger → Counter → Combo → Boss* progression loop.
**Deliverables:**
- Act I (Pawn Infantry): 6 Card Gauntlets × 5 Puzzles = 30 verified puzzles
- Act II (Knight Cavalry): 6 Card Gauntlets × 5 Puzzles = 30 verified puzzles
- Act III (Bishop Cleric): 6 Card Gauntlets × 5 Puzzles = 30 verified puzzles
- Automated puzzle solution verification suite (`scripts/verify-campaign-puzzles.ts`) proving every puzzle is 100% solvable

---

### Phase 6: Acts IV–VI Campaign Puzzles — Major Unit Houses (Rook, Queen, King: 18 Cards / 90 Puzzles) & Release
**Status:** ⬜ Not Started
**Objective:** Design, author, and programmatically verify the remaining 90 campaign puzzles across Act IV (House of the Bastion — Rook), Act V (House of Vengeance — Queen), and Act VI (House of the Throne — King), run a full end-to-end UX and progression sweep across all 180 puzzles, and release Milestone v3.0.
**Deliverables:**
- Act IV (Rook Citadel): 6 Card Gauntlets × 5 Puzzles = 30 verified puzzles
- Act V (Queen Regent): 6 Card Gauntlets × 5 Puzzles = 30 verified puzzles
- Act VI (Royal Sovereign): 6 Card Gauntlets × 5 Puzzles = 30 verified puzzles
- Complete 180/180 automated puzzle solver verification, multi-viewport Playwright UX sweep, and Milestone v3.0 release audit

---

## Future Milestones Backlog

- **v4.0 Board Action Visual FX & Tier II–V Card Expansions**:
  - Chessboard piece translation animations, parabolic leap arcs, ranged sniper beams, shield bubbles, and synchronized audio keyframes.
  - Tier II–V Grandmaster Circuit expansions (unlocking the remaining 144 catalog cards in 36-card `(2, 1, 1, 1, 1, 0)` seasonal waves) and Cross-House Conclave puzzle packs.

## Completed Milestones

- **v1.0 Platform Expansion** (Phases 1–5 complete, verified, and archived in `.agent/state/milestones/v1.0-AUDIT.md` and `.agent/state/milestones/v1.0-ROADMAP.md`).
- **v2.0 Visual Craft & Frontend Redesign** (Phases 1–7 complete, verified, and archived in `.agent/state/milestones/v2.0-AUDIT.md` and `.agent/state/milestones/v2.0-ROADMAP.md`).
