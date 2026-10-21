---
updated: 2026-10-21T11:19:30-05:00
---

# Project State

## Current Position

- **Milestone**: v3.0 Parallel World Key Campaign, 36-Card Pyramid & Grandmaster Trials
- **Phase**: 3 — 36-Card Engine, Deck Builder Main Menu Hub & Multiplayer / AI Playtest Prototype (Ready for Design / Planning)
- **Task**: Sequence locked (Option A: 36-Card Engine + Vibrant Main Menu Hub + Multiplayer/AI Playtest Prototype first, followed by Campaign in Phases 4–6)
- **Status**: Active (resumed 2026-10-21 10:46)
- **Roadmap Status**: Phases 1–2 Complete; Phase 3 Scope Locked (`STORYBOARD.md` + `ROADMAP.md`)

## Last Session Summary
Completed the full mechanical design and audit of all **36 Cards** (`P1–P8, N1–N7, B1–B7, R1–R6, Q1–Q4, K1–K4`), locked the **Global Engine Invariants** (`[DECISION-026]`), and authored the complete **Campaign Storyboard (`STORYBOARD.md`)**:
1. **All 36 Cards Finalized & Audited (`[DECISION-026]`)**:
   - **Pawns (`8`)**: `P1 Sidestep`, `P2 Head On`, `P3 Follow Me`, `P4 Attack Together`, `P5 Get Behind Me`, `P6 Tag Out`, `P7 Protect the King`, `P8 Call Reserves`.
   - **Knights (`7`)**: `N1 Adrenaline Jump`, `N2 Swap With Me`, `N3 Trample`, `N4 Pin Swap`, `N5 Get to the King`, `N6 Flanking Support`, `N7 Outpost Support`.
   - **Bishops (`7`)**: `B1 Let Me Through`, `B2 Pierce`, `B3 Ricochet`, `B4 Change Color`, `B5 Take My Place`, `B6 Come This Way`, `B7 Bishop's Blessing`.
   - **Rooks (`6`)**: `R1 Make Way`, `R2 I've Got Your Back`, `R3 Cut Across`, `R4 Move in Unison`, `R5 Catapult`, `R6 Garrison`.
   - **Queens (`4`)**: `Q1 Royal Summons`, `Q2 The Queen's Gambit`, `Q3 All Rise`, `Q4 One Fell Swoop`.
   - **Kings (`4`)**: `K1 Conscription`, `K2 Royal Knighting`, `K3 Royal Execution`, `K4 Banish`.
2. **Global Engine Rules Locked**:
   - **Energy Backburnered**: Removed active Energy costs (`⚡`); card plays are regulated by "1 card per turn" ("The Card IS the Move") and board conditions.
   - **No Terrain Walls/Shields & No Starting-Square Conditions**.
   - **Rank 1 Pawn Legalization**: Pawns may legally exist on Rank 1 (`a1–h1` relative to owner) via card effects (`K1`, `K4`), stepping 1 square forward to Rank 2 (no double-step, no *en passant*). Any Pawn on Rank 2 can move 1 or 2 squares. `DeckChessEngine.ts` must pass `{ skipValidation: true }` to `chess.load(fen, { skipValidation: true })`.
   - **Rank 8 Instant Promotion Invariant** & **Bishop Color-Complex Switching Relaxed** (`B4`, `R5`, `K3`).
   - **Pawn Spawning Config Flag (`limitPawnsTo8: boolean`)**: Only 4 cards spawn Pawns (`P8`, `N7`, `R6`, `K1`).
3. **Campaign Storyboard (`STORYBOARD.md`), Concurrent Wings (`Worlds 3–6`), Tavern Hustle & Jester Shop Locked**:
   - **Back to Town (`The Tavern Hustle`)**: Limitless currency & sandbox mode where players play full 8×8 games against 0-card standard-chess Towny bots (*Barnaby, Greta, Bram, Mayor Aldric*) while using their unlocked cards.
   - **Castle Wing Progression (Option B Semi-Themed Balance)**:
     - **World 1 (`The Causeway` — 7 Cards)**: `P1, P2, P3, N1, B1, N2, R1 (Boss)`
     - **World 2 (`Outer Courtyard` — 4 Cards + 2 Wing Keys)**: `N3, R2, B2, R3 (Boss)` $\rightarrow$ **Central Rotunda**.
     - **4 Concurrent Wings (`Worlds 3–6` off the Rotunda)**:
       - **World 3 (`The Barracks` — 5 Cards)**: `P4, N4, B3 (swapped Bishop), N6, K2 (Boss)` + `1 Wing Key` + `Throne Seal #1`
       - **World 4 (`The Chapel` — 5 Cards)**: `P5, B4, N5 (swapped Knight), B5, B6 (Boss)` + `1 Wing Key` + `Throne Seal #2`
       - **World 5 (`The Armory` — 5 Cards)**: `P6, R4, Q1 (swapped Queen), R5, K1 (Boss)` + `1 Wing Key` + `Throne Seal #3`
       - **World 6 (`The Royal Court` — 5 Cards)**: `P7, Q2, R6 (swapped Rook), Q3, K3 (Boss)` + `1 Wing Key` + `Throne Seal #4`
     - **World 7 (`The Throne Room` — 5 Cards)**: `N7, P8, B7, Q4, K4 (King Boss)` $\rightarrow$ **True Final Boss: The Scheming Jester (36-Card Playbook Duel)**.
   - **Forced-Slot Rule**: Newly won card `C_{n-1}` is auto-slotted for **only the very next puzzle** (Foreshadow Puzzle 1 of `C_n`), with **no forced-slot puzzle after Area Finale Boss cards** (`R1, R3, K2, B6, K1, K3, K4`).
   - **Streamlined Jester's Coat Shop (`4 Items`)**: `Jester's Distraction` (Rewind 1 Turn), `Jester's Whisper` (Engine Hint), `Carbon Copy` (Campaign Duplicate Card), and `+1 "Up Your Sleeve" Card Slot`.

## In-Progress Work

- Files modified: `.agent/state/STORYBOARD.md`, `.agent/state/DECISIONS.md`, `.agent/state/STATE.md`
- Tests status: Passing (236/236 unit tests, 90/90 Minor Unit SVG contracts)

## Blockers

None.

## Context Dump

### Decisions Made
- `[DECISION-025]`: Milestone v3.0 Strategic Pivot: PvZ2-Style Parallel World Key Campaign & 36-Card Pyramid Curation (`8P, 7K, 7B, 6R, 4Q, 4Kg`).
- `[DECISION-026]`: Phase 3 Complete 36-Card Specification, Global Engine Invariants, Concurrent Castle Wings (`Worlds 3–6`), Tavern Hustle & Jester Shop.

### Files of Interest
- `.agent/state/STORYBOARD.md`: Canonical 7-World Campaign Storyboard, 36-Card Pyramid table, Tavern Hustle, and Jester Shop specification.
- `.agent/state/DECISIONS.md`: Contains `[DECISION-026]` with all 36 card definitions, engine invariants, and Castle Wing narrative architecture.
- `.agent/state/ROADMAP.md`: Milestone v3.0 roadmap.
- `src/engine/DeckChessEngine.ts`: Needs `{ skipValidation: true }` on `chess.load(fen, { skipValidation: true })`, energy-free 1-card-per-turn mode, and `limitPawnsTo8` config flag.
- `src/engine/cards/cardRegistry.ts`: Will house the 36 bespoke card handlers.

## Next Steps

1. Run `@[.agent/workflows/plan.md] 3` (or `/plan 3`) to decompose Phase 3 into executable waves (implementing the 36 bespoke card handlers in `cardRegistry.ts`, Rank 1 Pawn & global engine invariants in `DeckChessEngine.ts`, `releaseRoster36.ts`, and the Major Unit vector SVGs).
2. Execute Phase 3 via `@[.agent/workflows/execute.md] 3`.
