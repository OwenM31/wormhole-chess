---
updated: 2026-10-18T11:05:09-05:00
---

# Project State

## Current Position

- **Milestone**: v3.0 Parallel World Key Campaign, 36-Card Pyramid & Grandmaster Trials
- **Phase**: 3 — Campaign Storyboard & One-by-One 36-Card Pyramid Curation (`8P, 7K, 7B, 6R, 4Q, 4Kg`) (in discussion)
- **Task**: Reviewing 8 Pawn candidate cards (`P1–P8`) and locking World 1–7 card placement
- **Status**: Paused at 2026-10-18 11:05
- **Roadmap Status**: Phases 1–2 Complete; Phase 3 Storyboard & Card-by-Card Review in Progress

## Last Session Summary
Pivoted Milestone v3.0 to a *Plants vs. Zombies 2*-inspired **Parallel World Key Campaign & 36-Card Pyramid Curation** (`[DECISION-025]`):
- **36-Card Piece-Abundance Pyramid**: Locked distribution at **8 Pawns, 7 Knights, 7 Bishops, 6 Rooks, 4 Queens, 4 Kings** (`= 36 Cards` for Release 1), ensuring 100% bespoke engine handlers in `cardRegistry.ts` and reducing immediate Major Unit art scope to 14 SVGs.
- **Asymmetric 7-World Parallel Progression & World Key Atlas**:
  - **World 1 (7 Cards + 1 Key)**: `P → P → P → K → B → P → K → R + [World Key]` (`3P, 2K, 1B, 1R`). Guided opening (first 2–3 missions automatic/guided).
  - **World 2 (4 Cards + 2 Keys)**: `K → R → [World Key] → B → R → [World Key]` (`1K, 1B, 2R`).
  - **World 3 (5 Cards + 2 Keys)**: `B → P → R → [World Key] → K → Q#1 + [World Key]` (`1P, 1K, 1B, 1R, 1Q` — introduces first Queen card at finale).
  - **World 4 (5 Cards + 2 Keys)**: `K → [World Key] → P → R → B → Kg#1 + [World Key]` (`1P, 1K, 1B, 1R, 1Kg` — introduces first King card at finale).
  - **World 5 (5 Cards + 1 Key)**: `P → B → Q#2 → [World Key] → K → Kg#2` (`1P, 1K, 1B, 1Q, 1Kg`).
  - **World 6 (5 Cards + 1 Key)**: `B → P → Kg#3 → [World Key] → R → Q#3` (`1P, 1B, 1R, 1Q, 1Kg`).
  - **World 7 (5 Cards + 1 Key → World 8+)**: `K → P → B → Q#4 → Kg#4 + [World Key]` (`1P, 1K, 1B, 1Q, 1Kg` — leaves Atlas open for future Worlds 8, 9, 10+).
- **Multi-Copy Campaign vs. PvP Mastery Rules**:
  - **Campaign**: Players can bring unlimited copies of any unlocked card in their hand.
  - **PvP**: Players start with 1 copy of each unlocked card and complete repeatable **PvP Mastery Challenges** (card-specific actions in PvP) to unlock extra copies.
- **3-Scale Level Architecture (All Main Levels = Bring Your Own Hand)**:
  1. **Card Award Practice Drills (4×4 or 5×5 Boards)**: 1–2 quick mini-puzzles immediately upon unlocking a card to teach its Condition + Effect.
  2. **Standard Path Missions (5×5, 6×6, or 8×8 Boards)**: Bring-Your-Own-Hand levels featuring *Locked & Loaded* (1 slot pre-locked to upcoming card, player builds the rest of their hand) and *Objective Modes* (*VIP Escort, Wave Survival, Fortress Breaker, Target Assassination*).
  3. **Gatekeeper Challenges (Full 8×8 Game-Like Setups)**: Deep, genuine full-board tactical puzzles guarding World Keys and World Finales.
- **Started One-by-One Card Review (Batch 1 — 8 Pawn Candidates)**:
  - Presented top 8 Pawn picks (`Sidestep`, `Bayonet Charge`, `Call Reserves`, `Trench Barricade`, `Vanguard Tow`, `Catapult Launch`, `Hold the Line`, `Sniper Shot`) for user review.

## In-Progress Work

- Files modified: `.agent/state/ROADMAP.md`, `.agent/state/DECISIONS.md`, `.agent/state/STATE.md`, `.agent/state/JOURNAL.md`
- Tests status: Passing (236/236 unit tests, 90/90 Minor Unit SVG contracts)

## Blockers

None.

## Context Dump

### Decisions Made
- [DECISION-019]: Phase 5 Deck Builder Card Graph: 6x6 Taxonomy, Symmetrical 3-Cycles, 90-Card Slice & Unified Action Model.
- [DECISION-020]: Phase 7 Global Polish, 3-Column TCG Ruffle Hand Stage, Palette Unification, and Release Scope.
- [DECISION-023]: Phase 1 Card Nomenclature, Zero-Ellipsis Rule Constraints & Static Vector Asset Pipeline.
- [DECISION-024]: Phase 2 Minor Unit Vector Artwork Suite Architecture & Design Directives.
- [DECISION-025]: Milestone v3.0 Strategic Pivot: PvZ2-Style Parallel World Key Campaign, 36-Card Pyramid Curation (`8P, 7K, 7B, 6R, 4Q, 4Kg`) & Multi-Copy / PvP Mastery Architecture.

### Files of Interest
- `.agent/state/ROADMAP.md`: Updated Milestone v3.0 roadmap with Phases 3–6.
- `.agent/state/DECISIONS.md`: Architectural decision ledger including `[DECISION-025]`.
- `src/engine/cards/cardCatalog90.json`: 90 Minor Unit cards (Pawn, Knight, Bishop).
- `src/engine/cards/cardCatalogMajor90.json`: 90 Major Unit cards (Rook, Queen, King).
- `src/engine/cards/cardRegistry.ts`: Modular card behavior handlers (39 bespoke handlers currently).

## Next Steps

1. Review and lock the **8 Pawn Cards** (`Sidestep`, `Bayonet Charge`, `Call Reserves`, `Trench Barricade`, `Vanguard Tow`, `Catapult Launch`, `Hold the Line`, `Sniper Shot` — or any swaps).
2. Review and lock the **7 Knight Cards**, **7 Bishop Cards**, **6 Rook Cards**, **4 Queen Cards**, and **4 King Cards** one-by-one.
3. Finalize the exact World 1–7 card unlock slot assignments (`STORYBOARD.md`) and proceed to `@[.agent/workflows/plan.md] 3`.
