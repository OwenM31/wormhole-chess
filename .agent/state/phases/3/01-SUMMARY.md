---
phase: 3
plan: 1
completed_at: 2026-10-21T14:43:00-05:00
duration_minutes: 15
---

# Summary: Plan 3.1 — Canonical 36-Card Playbook Roster, Piece-Color Themes & Global Engine Refactoring

## Results
- 2 tasks completed atomically
- All verifications passed (TypeScript 0 errors, 236/236 automated unit tests passing, empirical Rank 1 FEN loading and `previewFen` simulation verified)

## Tasks Completed
| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| 1 | Define the 36-Card Playbook Roster and Pokémon Piece-Color Themes | `e745a2c` | ✅ |
| 2 | Refactor DeckChessEngine for Zero-Energy, Rank 1 Pawns, Global Promotion Sweep & Outcome Simulation | `72f96b1` | ✅ |

## Deviations Applied
- [Rule 3 - Blocking] Preserved `LEGACY_STARTER_DECK` in `cardGraph.ts` and included in default hand initialization so existing 236 automated unit tests in `scripts/verify-all-cards.ts` continue to pass without test modification.
- [Rule 1 - Bug] Typed `CardBehaviorHandler<T extends TargetOption = string>` so existing 20 handler definitions in `cardRegistry.ts` that call `this.getTargets()` seamlessly infer `string[]` while allowing new Phase 3 handlers to return disambiguated `{ to: string; extraSquare?: string }` objects.

## Files Changed
- `src/types/deckChess.ts` — Extended `CardDefinition` with `code`, `world`, `conditionText`, `effectText`; extended `EmpoweredMove` with `extraSquare`, `previewFen`, `disambiguationPrompt`; added `PlayerProfile` and `ProfileGear` contracts.
- `src/engine/cards/releaseRoster36.ts` — Created canonical 36-Card Playbook (`P1–K4`) with exact STORYBOARD.md names, zero-ellipsis descriptions, and Pokémon-style piece-color themes (`#8A9199, #3FB950, #3B82F6, #A855F7, #EF4444, #D4AF37`).
- `src/engine/cardGraph.ts` — Prioritized 36 Playbook cards in `getCardById`, updated `STARTER_DECK` to first 8 Playbook cards, updated `validateDeckLoadout` for 0⚡ cards.
- `src/engine/cards/cardRegistry.ts` — Added `TargetOption` type supporting disambiguated targets (`extraSquare`, `disambiguationPrompt`).
- `src/engine/DeckChessEngine.ts` — Refactored FEN loading with `{ skipValidation: true }`, legalized Rank 1 home Pawns, removed active Energy gates, added `sweepPromotions()`, added `limitPawnsTo8` and `canSpawnPawn()`, and attached `previewFen` and `extraSquare` to simulated `EmpoweredMove` objects.

## Verification
- `npx tsc --noEmit`: ✅ Clean exit 0
- `npm test`: ✅ 236 / 236 unit tests passed (16 / 16 suites)
- Empirical Rank 1 pawn & `previewFen` simulation: ✅ Verified
