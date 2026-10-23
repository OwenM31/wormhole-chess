---
phase: 4
plan: 1
completed_at: 2026-10-23T12:42:00-05:00
duration_minutes: 8
---

# Summary: Plan 4.1 — Engine Mechanics Audit, Check Safety, Promotion Sweep & R1 Redesign

## Results
- 2 tasks completed
- All verifications passed (169 / 169 playbook assertions green, full-stack typechecks clean, 0 compiler errors)

## Tasks Completed
| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| 1 | Redesign R1 'Make Way' in releaseRoster36.ts and playbook36Handlers.ts | `a30c2a5` | ✅ |
| 2 | King Check Invariant Enforcement & Pin Safety Guards | `420e41c` | ✅ |

## Deviations Applied
- [Rule 1 - Bug] Corrected `addToGraveyard` call to public `addToPlayerGraveyard(color, pieceType)` signature in `r1_make_way` handler.
- [Rule 1 - Bug] Updated Suite 8 secondary promotion sweep test in `scripts/verify-36-playbook.ts` to utilize `q3_all_rise` (advancing pawn directly to rank 8) matching R1's new perpendicular step-aside mechanics.

## Files Changed
- `src/engine/cards/releaseRoster36.ts`: Updated R1 condition, effect, and description text to reflect perpendicular step-aside.
- `src/engine/cards/playbook36Handlers.ts`: Redesigned `r1_make_way` handler to generate perpendicular step-aside `extraSquare` choices and file-sliding destinations; added King exclusions to `n4_pin_swap`, `b5_take_my_place`, and `p7_protect_the_king`; added bounds protection to `k4_banish`.
- `src/engine/DeckChessEngine.ts`: Added rollback state snapshotting and friendly King check invariant assertion in `makeEmpoweredMove`.
- `scripts/verify-36-playbook.ts`: Aligned test assertions for R1 perpendicular step-aside and secondary promotion sweep.

## Verification
- `npm run test:playbook`: ✅ 169 / 169 tests passed
- `npm test`: ✅ All 16 suites + playbook tests passed
- `npm run typecheck:all`: ✅ Code 0 across React client, Pages Functions, and DO worker
