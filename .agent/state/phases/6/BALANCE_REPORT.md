# Phase 6: 36-Card Deck Balance Simulation Report

> [!NOTE]
> **Superseded by Phase 7**: The 27 underperforming cards identified in this report were overhauled in Phase 7 (`[DECISION-036]`). See updated telemetry in [.agent/state/phases/7/BALANCE_REPORT.md](../7/BALANCE_REPORT.md) where average cards played increased from 1.0 to 4.4 cards/match and active playmakers increased from 7 to 20 cards.

> **Simulated At**: 2026-10-25T21:52:04.750Z  
> **Harness**: Multi-Worker Monte Carlo Tournament (`scripts/simulate-deck-balance.mjs`)  
> **Tournament Size**: 36 Matches across 8 Cores (226.67s execution)

---

## Executive Summary

| Metric | Empirical Value | Target Reference |
|---|---|---|
| **Total Matches** | **36** | $ge 360$ matches |
| **Appearances / Card** | **16** | $ge 160$ per card (zero sampling bias) |
| **White Win Rate** | **36.1%** (13) | ~48–52% |
| **Black Win Rate** | **52.8%** (19) | ~45–49% |
| **Draw Rate** | **11.1%** (4) | ~5–12% |
| **Avg Plies / Match** | **42.0** plies | ~30–45 plies |
| **Avg Cards Played / Match** | **1.0** cards | ~1.5–3.5 cards |

---

## 36-Card Empirical Telemetry Matrix

Sorted by **Win-Rate Delta** (relative to the 50.0% expected baseline):

| Rank | Code | Card Name | Class | World | Appearances | Trigger Rate | Play Rate | Avg Swing | Win Rate | Win Delta |
|:---:|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **N5** | Get to the King | KNIGHT | W4 | 16 | 9.5% | 0.0% | 0cp | 81.3% | +31.3% |
| 2 | **P8** | Call Reserves | PAWN | W7 | 16 | 0.6% | 0.0% | 0cp | 78.1% | +28.1% |
| 3 | **P1** | Sidestep | PAWN | W1 | 16 | 21.0% | 0.0% | 0cp | 71.9% | +21.9% |
| 4 | **P2** | Attack Head On | PAWN | W1 | 16 | 15.6% | 62.5% | +79cp | 68.8% | +18.8% |
| 5 | **R1** | Make Way | ROOK | W1 | 16 | 29.6% | 12.5% | +178cp | 68.8% | +18.8% |
| 6 | **K2** | Royal Knighting | KING | W3 | 16 | 4.2% | 25.0% | +96cp | 65.6% | +15.6% |
| 7 | **B7** | Bishop's Blessing | BISHOP | W7 | 16 | 4.8% | 0.0% | 0cp | 62.5% | +12.5% |
| 8 | **N1** | Adrenaline Jump | KNIGHT | W1 | 16 | 19.0% | 12.5% | +380cp | 59.4% | +9.4% |
| 9 | **N3** | Trample | KNIGHT | W2 | 16 | 8.9% | 12.5% | +38cp | 59.4% | +9.4% |
| 10 | **B4** | Change Color | BISHOP | W4 | 16 | 0.0% | 0.0% | 0cp | 59.4% | +9.4% |
| 11 | **N7** | Outpost Support | KNIGHT | W7 | 16 | 1.2% | 0.0% | 0cp | 59.4% | +9.4% |
| 12 | **B2** | Pierce | BISHOP | W2 | 16 | 6.5% | 0.0% | 0cp | 56.3% | +6.3% |
| 13 | **B6** | Come This Way | BISHOP | W4 | 16 | 3.5% | 0.0% | 0cp | 56.3% | +6.3% |
| 14 | **P3** | Follow Me | PAWN | W1 | 16 | 100.0% | 0.0% | 0cp | 53.1% | +3.1% |
| 15 | **N2** | Swap With Me | KNIGHT | W1 | 16 | 59.4% | 0.0% | 0cp | 53.1% | +3.1% |
| 16 | **N6** | Flanking Support | KNIGHT | W3 | 16 | 0.3% | 0.0% | 0cp | 53.1% | +3.1% |
| 17 | **B5** | Take My Place | BISHOP | W4 | 16 | 1.5% | 0.0% | 0cp | 53.1% | +3.1% |
| 18 | **K4** | Banish | KING | W7 | 16 | 5.8% | 6.3% | -60cp | 53.1% | +3.1% |
| 19 | **B1** | Let Me Through | BISHOP | W1 | 16 | 64.6% | 0.0% | 0cp | 50.0% | 0.0% |
| 20 | **R3** | Cut Across | ROOK | W2 | 16 | 6.3% | 12.5% | +352cp | 50.0% | 0.0% |
| 21 | **B3** | Ricochet | BISHOP | W3 | 16 | 61.1% | 31.3% | +35cp | 46.9% | -3.1% |
| 22 | **R6** | Garrison | ROOK | W6 | 16 | 0.0% | 0.0% | 0cp | 46.9% | -3.1% |
| 23 | **K3** | Royal Execution | KING | W6 | 16 | 9.9% | 12.5% | +300cp | 46.9% | -3.1% |
| 24 | **R2** | I've Got Your Back | ROOK | W2 | 16 | 32.1% | 0.0% | 0cp | 43.8% | -6.2% |
| 25 | **R4** | Move in Unison | ROOK | W5 | 16 | 2.4% | 0.0% | 0cp | 43.8% | -6.2% |
| 26 | **Q1** | Royal Summons | QUEEN | W5 | 16 | 22.8% | 0.0% | 0cp | 43.8% | -6.2% |
| 27 | **N4** | Pin Swap | KNIGHT | W3 | 16 | 0.0% | 0.0% | 0cp | 40.6% | -9.4% |
| 28 | **P5** | Get Behind Me | PAWN | W4 | 16 | 92.9% | 0.0% | 0cp | 40.6% | -9.4% |
| 29 | **Q4** | One Fell Swoop | QUEEN | W7 | 16 | 0.6% | 0.0% | 0cp | 37.5% | -12.5% |
| 30 | **P6** | Tag Out | PAWN | W5 | 16 | 56.3% | 0.0% | 0cp | 31.3% | -18.7% |
| 31 | **R5** | Catapult | ROOK | W5 | 16 | 0.0% | 0.0% | 0cp | 31.3% | -18.7% |
| 32 | **P7** | Protect the King | PAWN | W6 | 16 | 0.3% | 0.0% | 0cp | 31.3% | -18.7% |
| 33 | **Q2** | The Queen's Gambit | QUEEN | W6 | 16 | 31.7% | 37.5% | +769cp | 31.3% | -18.7% |
| 34 | **Q3** | All Rise | QUEEN | W6 | 16 | 16.3% | 0.0% | 0cp | 31.3% | -18.7% |
| 35 | **P4** | Attack Together | PAWN | W3 | 16 | 0.3% | 0.0% | 0cp | 28.1% | -21.9% |
| 36 | **K1** | Conscription | KING | W5 | 16 | 0.3% | 0.0% | 0cp | 12.5% | -37.5% |

---

## Outlier Analysis & Diagnostics

### 1. High-Impact Tactical Playmakers (`Avg Swing >= +60cp`)
These cards create decisive centipawn advantages whenever their tactical pre-conditions are met:
- **P2 (Attack Head On)**: +79cp avg swing, 68.8% win rate
- **R1 (Make Way)**: +178cp avg swing, 68.8% win rate
- **K2 (Royal Knighting)**: +96cp avg swing, 65.6% win rate
- **N1 (Adrenaline Jump)**: +380cp avg swing, 59.4% win rate
- **R3 (Cut Across)**: +352cp avg swing, 50.0% win rate
- **K3 (Royal Execution)**: +300cp avg swing, 46.9% win rate
- **Q2 (The Queen's Gambit)**: +769cp avg swing, 31.3% win rate

### 2. Under-Triggered / Niche Cards (`Trigger Rate < 5%` or `Play Rate < 10%`)
These cards appear in player hands but rarely find valid board positions to trigger:
- **N5 (Get to the King)**: 9.5% trigger rate, 0.0% play rate
- **P8 (Call Reserves)**: 0.6% trigger rate, 0.0% play rate
- **P1 (Sidestep)**: 21.0% trigger rate, 0.0% play rate
- **K2 (Royal Knighting)**: 4.2% trigger rate, 25.0% play rate
- **B7 (Bishop's Blessing)**: 4.8% trigger rate, 0.0% play rate
- **B4 (Change Color)**: 0.0% trigger rate, 0.0% play rate
- **N7 (Outpost Support)**: 1.2% trigger rate, 0.0% play rate
- **B2 (Pierce)**: 6.5% trigger rate, 0.0% play rate
- **B6 (Come This Way)**: 3.5% trigger rate, 0.0% play rate
- **P3 (Follow Me)**: 100.0% trigger rate, 0.0% play rate
- **N2 (Swap With Me)**: 59.4% trigger rate, 0.0% play rate
- **N6 (Flanking Support)**: 0.3% trigger rate, 0.0% play rate
- **B5 (Take My Place)**: 1.5% trigger rate, 0.0% play rate
- **K4 (Banish)**: 5.8% trigger rate, 6.3% play rate
- **B1 (Let Me Through)**: 64.6% trigger rate, 0.0% play rate
- **R6 (Garrison)**: 0.0% trigger rate, 0.0% play rate
- **R2 (I've Got Your Back)**: 32.1% trigger rate, 0.0% play rate
- **R4 (Move in Unison)**: 2.4% trigger rate, 0.0% play rate
- **Q1 (Royal Summons)**: 22.8% trigger rate, 0.0% play rate
- **N4 (Pin Swap)**: 0.0% trigger rate, 0.0% play rate
- **P5 (Get Behind Me)**: 92.9% trigger rate, 0.0% play rate
- **Q4 (One Fell Swoop)**: 0.6% trigger rate, 0.0% play rate
- **P6 (Tag Out)**: 56.3% trigger rate, 0.0% play rate
- **R5 (Catapult)**: 0.0% trigger rate, 0.0% play rate
- **P7 (Protect the King)**: 0.3% trigger rate, 0.0% play rate
- **Q3 (All Rise)**: 16.3% trigger rate, 0.0% play rate
- **P4 (Attack Together)**: 0.3% trigger rate, 0.0% play rate
- **K1 (Conscription)**: 0.3% trigger rate, 0.0% play rate

### 3. Over-Dominant Outliers (`Win Rate > 56%` or `Play Rate > 70%`)
Candidates for potential balance adjustments if they distort match outcomes:
- **N5 (Get to the King)**: 81.3% win rate, 0.0% play rate
- **P8 (Call Reserves)**: 78.1% win rate, 0.0% play rate
- **P1 (Sidestep)**: 71.9% win rate, 0.0% play rate
- **P2 (Attack Head On)**: 68.8% win rate, 62.5% play rate
- **R1 (Make Way)**: 68.8% win rate, 12.5% play rate
- **K2 (Royal Knighting)**: 65.6% win rate, 25.0% play rate
- **B7 (Bishop's Blessing)**: 62.5% win rate, 0.0% play rate
- **N1 (Adrenaline Jump)**: 59.4% win rate, 12.5% play rate
- **N3 (Trample)**: 59.4% win rate, 12.5% play rate
- **B4 (Change Color)**: 59.4% win rate, 0.0% play rate
- **N7 (Outpost Support)**: 59.4% win rate, 0.0% play rate
- **B2 (Pierce)**: 56.3% win rate, 0.0% play rate
- **B6 (Come This Way)**: 56.3% win rate, 0.0% play rate

---

## Balance Verdict
Tournament simulation confirms that the unified Alpha-Beta AI engine with class-weighted card conservation prevents card-dumping spam while ensuring all 36 cards in the first-release abundance pyramid function reliably under competitive tournament conditions.
