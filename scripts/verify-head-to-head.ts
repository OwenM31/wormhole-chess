import { DeckChessEngine } from '../src/engine/DeckChessEngine';
import {
  computeBestTurn,
  DEFAULT_EVAL_PARAMS,
} from '../src/engine/DeckChessAI';
import { evaluateBoardPure } from './sim-single-match';

const defaultDeck1 = [
  'p1_sidestep', 'p3_follow_me', 'n1_adrenaline_jump', 'n3_trample',
  'b1_let_me_through', 'r1_make_way', 'q1_regal_presence', 'k1_bunker_down',
];
const defaultDeck2 = [
  'p2_head_on', 'p4_rally', 'n2_swap_with_me', 'n4_high_jump',
  'b2_break_through', 'r2_reinforce', 'q2_queens_gambit', 'k2_royal_step',
];

interface H2HMatchResult {
  winner: 'A' | 'B' | 'draw';
  plies: number;
  opening6: string;
}

function playMatch(
  whiteMode: 'A' | 'B',
  blackMode: 'A' | 'B',
  deckWhite: string[],
  deckBlack: string[],
  seed: number,
  maxPlies: number = 50
): { winner: 'white' | 'black' | 'draw'; plies: number; opening6: string } {
  const engine = new DeckChessEngine(undefined, deckWhite, deckBlack);
  const openingMoves: string[] = [];
  let plies = 0;
  let mercyPlies = 0;

  while (plies < maxPlies && !engine.isGameOver()) {
    const turn = engine.getTurn();
    const isTurnA = (turn === 'w' && whiteMode === 'A') || (turn === 'b' && blackMode === 'A');

    const pureEval = evaluateBoardPure(engine);
    if (plies >= 24 && Math.abs(pureEval) >= 650) {
      mercyPlies++;
      if (mercyPlies >= 4) {
        const winner = pureEval > 0 ? 'white' : 'black';
        return { winner, plies, opening6: openingMoves.slice(0, 6).join(' ') };
      }
    } else {
      mercyPlies = 0;
    }

    const plySeed = (seed * 1664525 + plies * 1013904223) >>> 0;
    const decision = isTurnA
      ? computeBestTurn(engine, turn, 'medium', DEFAULT_EVAL_PARAMS, { seed: plySeed, deterministic: false })
      : computeBestTurn(engine, turn, 'medium', DEFAULT_EVAL_PARAMS, { deterministic: true });

    if (plies < 6) {
      openingMoves.push(`${decision.move.from}-${decision.move.to}`);
    }

    if (decision.type === 'empowered' && decision.empoweredMove) {
      const res = engine.makeEmpoweredMove(decision.empoweredMove);
      if (!res.success) {
        engine.makeMove(decision.move);
      }
    } else {
      engine.makeMove(decision.move);
    }

    plies++;
  }

  const pureEval = evaluateBoardPure(engine);
  let winner: 'white' | 'black' | 'draw' = 'draw';
  if (engine.isGameOver()) {
    const engWin = engine.getWinner();
    winner = engWin === 'w' ? 'white' : engWin === 'b' ? 'black' : 'draw';
  } else if (pureEval >= 140) {
    winner = 'white';
  } else if (pureEval <= -140) {
    winner = 'black';
  }

  return { winner, plies, opening6: openingMoves.slice(0, 6).join(' ') };
}

export async function runHeadToHeadBenchmark() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' HEAD-TO-HEAD BENCHMARK: LOW-DETERMINISM AI (A) vs DETERMINISTIC (B)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Part 1: Head-to-Head Strength Across 5 Color-Swapped Pairs (10 matches)
  const pairsCount = 5;
  let scoreA = 0;
  let scoreB = 0;

  for (let p = 0; p < pairsCount; p++) {
    const seed = 50000 + p * 100;

    // Match 1: A as White vs B as Black
    const res1 = playMatch('A', 'B', defaultDeck1, defaultDeck2, seed, 50);
    if (res1.winner === 'white') scoreA += 1;
    else if (res1.winner === 'black') scoreB += 1;
    else { scoreA += 0.5; scoreB += 0.5; }

    const winner1 = res1.winner === 'white' ? 'A' : res1.winner === 'black' ? 'B' : 'draw';
    console.log(`  Pair ${p + 1} (A=White vs B=Black): Winner ${winner1} in ${res1.plies} plies (${res1.opening6})`);

    // Match 2: B as White vs A as Black
    const res2 = playMatch('B', 'A', defaultDeck1, defaultDeck2, seed, 50);
    if (res2.winner === 'white') scoreB += 1;
    else if (res2.winner === 'black') scoreA += 1;
    else { scoreA += 0.5; scoreB += 0.5; }

    const winner2 = res2.winner === 'white' ? 'B' : res2.winner === 'black' ? 'A' : 'draw';
    console.log(`  Pair ${p + 1} (B=White vs A=Black): Winner ${winner2} in ${res2.plies} plies (${res2.opening6})`);
  }

  const totalMatches = pairsCount * 2;
  const winRateA = (scoreA / totalMatches) * 100;
  console.log('\n──────────────────────────────────────────────────────────────────');
  console.log(`Strength Result: Low-Determinism AI (A) scored ${scoreA}/${totalMatches} (${winRateA.toFixed(1)}%) vs Baseline (B) ${scoreB}/${totalMatches}`);
  console.log('──────────────────────────────────────────────────────────────────\n');

  // Part 2: Opening Diversity Benchmark (Self-Play Across 5 Games)
  console.log('Running Opening Diversity Benchmark (5 self-play games each)...');
  const openingsA = new Set<string>();
  const openingsB = new Set<string>();

  for (let i = 0; i < 5; i++) {
    const seed = 80000 + i * 111;
    const resA = playMatch('A', 'A', defaultDeck1, defaultDeck2, seed, 6);
    openingsA.add(resA.opening6);

    const resB = playMatch('B', 'B', defaultDeck1, defaultDeck2, seed, 6);
    openingsB.add(resB.opening6);
  }

  console.log(`Unique 6-Ply Opening Lines across 5 seeds:`);
  console.log(`  Deterministic Baseline (B vs B): ${openingsB.size} unique (100% monotonous replay)`);
  console.log(`  Low-Determinism AI     (A vs A): ${openingsA.size} unique (${(openingsA.size / openingsB.size).toFixed(1)}x diversity)`);

  if (winRateA < 50) {
    console.error(`❌ Benchmark Failed: Low-Determinism win rate ${winRateA.toFixed(1)}% < 50% threshold.`);
    process.exit(1);
  }
  if (openingsA.size < 5 || openingsB.size !== 1) {
    console.error(`❌ Benchmark Failed: Expected 5 unique openings for A and 1 for B.`);
    process.exit(1);
  }

  console.log('\n✅ Head-to-Head & Opening Diversity Benchmark PASSED: Low-Determinism AI maintains >=50% strength and 5x opening diversity!\n');
}

if (process.argv[1]?.includes('verify-head-to-head')) {
  runHeadToHeadBenchmark().catch((err) => {
    console.error('Benchmark error:', err);
    process.exit(1);
  });
}
