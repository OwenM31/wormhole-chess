---
updated: 2026-10-21T10:43:15-05:00
---

# Project State

## Current Position

- **Milestone**: v3.0 Parallel World Key Campaign, 36-Card Pyramid & Grandmaster Trials
- **Phase**: 3 — Campaign Storyboard & One-by-One 36-Card Pyramid Curation (`8P, 7K, 7B, 6R, 4Q, 4Kg`) (in discussion)
- **Task**: Confirming Class-Focused Wing Card Grouping (`Barracks / Chapel / Armory / Royal Court`) and Campaign Reward / Shop system before authoring `STORYBOARD.md`
- **Status**: Paused at 2026-10-21 10:43
- **Roadmap Status**: Phases 1–2 Complete; Phase 3 Storyboard & Campaign Architecture nearly locked

## Last Session Summary
Completed the full mechanical design and audit of all **36 Cards** (`P1–P8, N1–N7, B1–B7, R1–R6, Q1–Q4, K1–K4`), locked the **Global Engine Invariants** (`[DECISION-026]`), and established the **Campaign Narrative, Living Chess Piece Cast, and Castle Wing Architecture**:
1. **All 36 Cards Finalized & Audited (`[DECISION-026]`)**:
   - **Pawns (`8`)**: `P1 Sidestep`, `P2 Head On`, `P3 Follow Me`, `P4 Attack Together`, `P5 Get Behind Me`, `P6 Tag Out`, `P7 Protect the King`, `P8 Call Reserves`.
   - **Knights (`7`)**: `N1 Adrenaline Jump`, `N2 Swap With Me`, `N3 Trample`, `N4 Pin Swap`, `N5 Get to the King`, `N6 Flanking Support`, `N7 Outpost Support`.
   - **Bishops (`7`)**: `B1 Let Me Through`, `B2 Pierce`, `B3 Ricochet`, `B4 Change Color`, `B5 Take My Place`, `B6 Come This Way`, `B7 Bishop's Blessing`.
   - **Rooks (`6`)**: `R1 Make Way`, `R2 I've Got Your Back`, `R3 Cut Across`, `R4 Move in Unison`, `R5 Catapult`, `R6 Garrison`.
   - **Queens (`4`)**: `Q1 Royal Summons` ("Come Here"), `Q2 The Queen's Gambit`, `Q3 All Rise`, `Q4 One Fell Swoop`.
   - **Kings (`4`)**: `K1 Conscription`, `K2 Royal Knighting`, `K3 Royal Execution`, `K4 Banish`.
2. **Global Engine Rules Locked**:
   - **Energy Backburnered**: Removed active Energy costs (`⚡`); card plays are regulated by "1 card per turn" ("The Card IS the Move") and board conditions.
   - **No Terrain Walls/Shields & No Starting-Square Conditions**.
   - **Rank 1 Pawn Legalization**: Pawns may legally exist on Rank 1 (`a1–h1` relative to owner) via card effects (`K1`, `K4`), stepping 1 square forward to Rank 2 (no double-step, no *en passant*). Any Pawn on Rank 2 can move 1 or 2 squares. `DeckChessEngine.ts` must pass `{ skipValidation: true }` to `chess.load(fen, { skipValidation: true })`.
   - **Rank 8 Instant Promotion Invariant** & **Bishop Color-Complex Switching Relaxed** (`B4`, `R5`, `K3`).
   - **Pawn Spawning Config Flag (`limitPawnsTo8: boolean`)**: Only 4 cards spawn Pawns (`P8`, `N7`, `R6`, `K1`).
3. **Campaign Narrative, Cast & Castle Wing Architecture Locked**:
   - **Living Chess Pieces**: Everyone is an expressive carved/armored chess piece (Player = unpainted wooden Pawn from town; Jester = crooked banned 9th-file piece; Guards = iron-helmed Pawns/Rooks; Lieutenants = ornate elite pieces).
   - **The Scheming Jester's Hook**: The King standardized the board from 9×9 to 8×8, stole the Jester's 36-page Playbook, banished him on sight, and distributed the moves to his Captains and Lieutenants. The Jester uses a tavern puzzle to recruit the Player as his unassuming proxy/front-man.
   - **Castle Wing Progression**:
     - **World 1 (`The Causeway` — 7 Cards)** $\rightarrow$ **World 2 (`Outer Courtyard` — 4 Cards)** $\rightarrow$ **Central Rotunda**.
     - **Outer Wings (Worlds 3 & 4)**: **The Barracks** (Horse/Knight Bosses) and **The Chapel** (Bishop Bosses).
     - **Inner Wings (Worlds 5 & 6)**: Inside the Barracks is **The Armory** (Rook Bosses); inside the Chapel is **The Royal Court** (Queen Boss).
     - **World 7 (`The Throne Room` — 5 Cards)**: Unlocked via Heavy Keys. Beat **The King** (`K4 Banish`), after which **The Jester double-crosses you**, steals the completed 36-card Playbook, and challenges you as the **True Final Boss** (strong card-aware AI with master deck).
   - **Level Rhythm per Card**: 2–4 themed puzzles per card: 1–2 foreshadowing puzzles where the Lieutenant/Officer uses the card against you $\rightarrow$ win the card $\rightarrow$ immediate next cycle auto-locks the new card into one of your slots so you are forced to use it.

## In-Progress Work

- Files modified: `.agent/state/DECISIONS.md`, `.agent/state/STATE.md`, `.agent/state/JOURNAL.md`
- Tests status: Passing (236/236 unit tests, 90/90 Minor Unit SVG contracts)

## Blockers

None.

## Context Dump

### Decisions Made
- `[DECISION-025]`: Milestone v3.0 Strategic Pivot: PvZ2-Style Parallel World Key Campaign & 36-Card Pyramid Curation (`8P, 7K, 7B, 6R, 4Q, 4Kg`).
- `[DECISION-026]`: Phase 3 Complete 36-Card Specification, Global Engine Invariants & Castle Wing Narrative Architecture.

### Pending Questions for User on Resume
We just presented two final confirmation questions to the user before writing `STORYBOARD.md`:
1. **Class-Focused Wing Card Grouping (`Worlds 3–6`)**:
   - **World 1 (`The Causeway` — 7 Cards)**: `P1, P2, P3, N1, B1, N2, R1`
   - **World 2 (`Outer Courtyard` — 4 Cards)**: `N3, R2, B2, R3`
   - **World 3 (`The Barracks` — Horse Bosses — 5 Cards)**: `P4, N4, N5, N6` + Boss Card `K2 (Royal Knighting)`
   - **World 4 (`The Chapel` — Bishop Bosses — 5 Cards)**: `P5, B3, B4, B5` + Boss Card `B6 (Come This Way)`
   - **World 5 (`The Armory` — Rook Bosses, inside Barracks — 5 Cards)**: `P6, R4, R5, R6` + Boss Card `K1 (Conscription)`
   - **World 6 (`The Royal Court` — Queen Boss, inside Chapel — 5 Cards)**: `P7, Q1, Q2, Q3` + Boss Card `K3 (Royal Execution)`
   - **World 7 (`The Throne Room` — King & Jester — 5 Cards)**: `N7, P8, B7, Q4, K4`
2. **Campaign Rewards & "The Jester's Coat" Shop**:
   - Confirm whether to award baseline Card Slots & Keys directly at milestones while using currency in the Jester's Shop for **Forging Extra Copies of Cards**, **Mulligan/Rewind Upgrades**, **+1 Bonus Sleeve Slot**, and **Living Piece Material/Hat Cosmetics** (or skip the shop and award all upgrades directly on the map).

### Files of Interest
- `.agent/state/DECISIONS.md`: Contains `[DECISION-026]` with all 36 card definitions, engine invariants, and Castle Wing narrative architecture.
- `.agent/state/ROADMAP.md`: Milestone v3.0 roadmap.
- `src/engine/DeckChessEngine.ts`: Needs `{ skipValidation: true }` on `chess.load(fen, { skipValidation: true })` and `limitPawnsTo8` config flag during Phase 3/4 execution.
- `src/engine/cards/cardRegistry.ts`: Will house the 36 bespoke card handlers.

## Next Steps

1. Get user's answer on the 2 pending questions (Class-Focused Wing Card Grouping & Shop vs. Direct Map Rewards).
2. Finalize the level-by-level `STORYBOARD.md` across Worlds 1–7 (`Foreshadow -> Officer Duel -> Forced-Slot Mastery` cycles).
3. Proceed to `@[.agent/workflows/plan.md] 3`.
