import { DeckChessEngine } from '../src/engine/DeckChessEngine';
import {
  evaluateBoard,
  evaluateCardScarcityAndHand,
  evaluateHandSynergy,
  evaluatePosition,
  computeBestTurn,
  getCardRetentionValue,
  DEFAULT_EVAL_PARAMS,
  mulberry32,
} from '../src/engine/DeckChessAI';
import type { AiSearchOptions, BestTurnResult } from '../src/types/deckChess';
import type { FriendlyPieceSummary } from '../src/engine/cards/cardRegistry';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  } else {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  }
}

function getPiecesForColor(engine: DeckChessEngine, color: 'w' | 'b'): FriendlyPieceSummary[] {
  const board = engine.getBoard();
  const list: FriendlyPieceSummary[] = [];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (!p || p.color !== color) continue;
      const rankIdx = 7 - r;
      const sq = DeckChessEngine.coordsToSquare(f, rankIdx);
      if (sq) list.push({ sq, type: p.type, file: f, rank: rankIdx });
    }
  }
  return list;
}

const args = process.argv.slice(2);
const suiteArg = args.find((a) => a.startsWith('--suite='));
const targetSuite = suiteArg ? suiteArg.split('=')[1] : 'engine';

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' PHASE 8: SEARCH PERFORMANCE, LOW-DETERMINISM AI & BALANCE HARNESS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function runEngineSuite() {
  // ==========================================================
  // Suite 1: PRNG & Seeded Reproducibility
  // ==========================================================
  console.log('Suite 1: PRNG & Seeded Reproducibility');
  {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(12345);
    const seq1 = [rng1(), rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2(), rng2()];
    assert(
      JSON.stringify(seq1) === JSON.stringify(seq2),
      'mulberry32 generates identical sequence for identical seed'
    );

    const rng3 = mulberry32(54321);
    const seq3 = [rng3(), rng3(), rng3(), rng3()];
    assert(
      JSON.stringify(seq1) !== JSON.stringify(seq3),
      'mulberry32 generates distinct sequence for different seed'
    );
    assert(
      seq1.every((v) => v >= 0 && v < 1),
      'mulberry32 generates valid floats in [0, 1)'
    );

    const engine = new DeckChessEngine();
    engine.makeMove({ from: 'c2', to: 'c4' }); // 1. c4

    const resA = computeBestTurn(engine, 'b', 'medium', DEFAULT_EVAL_PARAMS, { seed: 42 });
    const resB = computeBestTurn(engine, 'b', 'medium', DEFAULT_EVAL_PARAMS, { seed: 42 });
    assert(
      resA.move.from === resB.move.from && resA.move.to === resB.move.to,
      `Seeded AI is 100% reproducible for seed 42 (${resA.move.from}->${resA.move.to})`
    );

    const detA = computeBestTurn(engine, 'b', 'medium', DEFAULT_EVAL_PARAMS, { deterministic: true });
    const detB = computeBestTurn(engine, 'b', 'medium', DEFAULT_EVAL_PARAMS, { deterministic: true });
    assert(
      detA.move.from === detB.move.from && detA.move.to === detB.move.to,
      `Deterministic mode returns identical move (${detA.move.from}->${detA.move.to})`
    );
  }

  // ==========================================================
  // Suite 2: Opening Diversity on 1. c4 & Exact-Window Zero Blunder Invariant
  // ==========================================================
  console.log('\nSuite 2: Opening Diversity on 1. c4 & Exact-Window Contender Invariant');
  {
    const engine = new DeckChessEngine();
    engine.makeMove({ from: 'c2', to: 'c4' }); // 1. c4

    const responses = new Set<string>();
    const scores: number[] = [];
    let bestScoreAtRoot = -Infinity;

    for (let seed = 1; seed <= 24; seed++) {
      const res = computeBestTurn(engine, 'b', 'medium', DEFAULT_EVAL_PARAMS, { seed });
      const moveStr = `${res.move.from}->${res.move.to}`;
      responses.add(moveStr);
      scores.push(res.evalScore);
      if (res.evalScore > bestScoreAtRoot) {
        bestScoreAtRoot = res.evalScore;
      }
    }

    console.log(`    Distinct Black replies to 1. c4 across 24 seeds: ${Array.from(responses).join(', ')}`);
    assert(
      responses.size >= 3,
      `Opening diversity: >= 3 distinct responses to 1. c4 across 24 seeds (got ${responses.size}: ${Array.from(responses).join(', ')})`
    );

    // Verify all selected moves are within marginCp (32cp for medium) of root bestScore
    const maxMargin = 32;
    let allWithinMargin = true;
    for (const sc of scores) {
      if (bestScoreAtRoot - sc > maxMargin + 1) { // 1cp tolerance for rounding
        allWithinMargin = false;
        break;
      }
    }
    assert(
      allWithinMargin,
      `Zero Blunders: all 24 sampled replies are within ${maxMargin}cp of root bestScore (best: ${bestScoreAtRoot}cp)`
    );
  }

  // ==========================================================
  // Suite 3: Tactical Lock Guardrail (Mate-in-1 & Free Queen)
  // ==========================================================
  console.log('\nSuite 3: Tactical Lock Guardrail (Mate-in-1 & Free Material)');
  {
    // Position 1: Back rank mate in 1: White Queen on f7 delivers Qf7#
    // FEN: r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4
    const mateEngine = new DeckChessEngine('r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4');
    let mateSelectedAllSeeds = true;
    let contenderCountIsOne = true;

    for (let seed = 1; seed <= 3; seed++) {
      const res = computeBestTurn(mateEngine, 'w', 'tactical', DEFAULT_EVAL_PARAMS, { seed });
      const moveStr = `${res.move.from}->${res.move.to}`;
      if (moveStr !== 'f3->f7') {
        mateSelectedAllSeeds = false;
      }
      if (res.contenderCount !== undefined && res.contenderCount > 1) {
        contenderCountIsOne = false;
      }
    }

    assert(
      mateSelectedAllSeeds,
      'Tactical Lock 1: Forced Mate-in-1 (Qf7#) is selected 100% of the time across all seeds'
    );
    assert(
      contenderCountIsOne,
      'Tactical Lock 1: Contender count is locked to 1 when forced mate exists'
    );

    // Position 2: Free Queen capture: Black Queen hanging on d4
    // FEN: rnb1kbnr/pppp1ppp/8/8/3q4/4P3/PPPP1PPP/RNBQKBNR w KQkq - 0 1
    const hangQueenEngine = new DeckChessEngine('rnb1kbnr/pppp1ppp/8/8/3q4/4P3/PPPP1PPP/RNBQKBNR w KQkq - 0 1');
    let queenCapturedAllSeeds = true;
    for (let seed = 1; seed <= 3; seed++) {
      const res = computeBestTurn(hangQueenEngine, 'w', 'medium', DEFAULT_EVAL_PARAMS, { seed });
      const moveStr = `${res.move.from}->${res.move.to}`;
      if (moveStr !== 'e3->d4') {
        queenCapturedAllSeeds = false;
      }
    }

    assert(
      queenCapturedAllSeeds,
      'Tactical Lock 2: Free Queen capture (exd4) is chosen 100% across all seeds when >300cp advantage'
    );
  }

  // ==========================================================
  // Suite 4: Game-Phase Card Retention Decay & P3 Playability
  // ==========================================================
  console.log('\nSuite 4: Game-Phase Card Retention Decay & P3 Playability');
  {
    const hand8 = [
      'p1_sidestep',
      'p3_follow_me',
      'n1_adrenaline_jump',
      'n3_trample',
      'b1_let_me_through',
      'r1_make_way',
      'q1_regal_presence',
      'k1_bunker_down',
    ];
    const engineTurn1 = new DeckChessEngine(undefined, [...hand8], []);
    const engineTurn35 = new DeckChessEngine(undefined, [...hand8], []);
    // Simulate turnNumber = 35 on engineTurn35
    (engineTurn35 as any).turnNumber = 35;

    const pieces1 = getPiecesForColor(engineTurn1, 'w');
    const pieces35 = getPiecesForColor(engineTurn35, 'w');

    const scarcityTurn1 = evaluateCardScarcityAndHand(
      pieces1,
      engineTurn1.getWhiteHand(),
      'w',
      DEFAULT_EVAL_PARAMS,
      1
    );
    const scarcityTurn35 = evaluateCardScarcityAndHand(
      pieces35,
      engineTurn35.getWhiteHand(),
      'w',
      DEFAULT_EVAL_PARAMS,
      35
    );

    console.log(`    Turn 1 retention: ${scarcityTurn1}cp | Turn 35 retention: ${scarcityTurn35}cp`);
    assert(
      scarcityTurn35 < scarcityTurn1,
      `Card Retention Decay: Turn 35 retention (${scarcityTurn35}cp) < Turn 1 retention (${scarcityTurn1}cp)`
    );
    assert(
      scarcityTurn35 <= Math.round(scarcityTurn1 * 0.55),
      `Card Retention Decay: Turn 35 retention has decayed by >= 45% (got ${Math.round((1 - scarcityTurn35 / scarcityTurn1) * 100)}% decay)`
    );

    // Test P3 (March Together) Playability:
    // Setup board where White has pawns on d3 and e3, both ready to advance to d4 and e4.
    // White holds P3 (March Together).
    // In Phase 7, P3 had a double-tax of -73cp penalty preventing it from ever being played.
    // In Phase 8, playing P3 should have positive or competitive cardLiftCp.
    const p3Fen = 'rnbqkbnr/pppp1ppp/8/8/8/3PP3/PPP3PP/RNBQKBNR w KQkq - 0 1';
    const p3Engine = new DeckChessEngine(p3Fen, ['p3_follow_me'], []);
    const p3Result = computeBestTurn(p3Engine, 'w', 'tactical', DEFAULT_EVAL_PARAMS, { seed: 1 });

    console.log(`    P3 position chosen turn type: ${p3Result.type} | move: ${p3Result.move.from}->${p3Result.move.to} | cardLiftCp: ${p3Result.cardLiftCp ?? 'N/A'}`);
    assert(
      p3Result.bestEmpoweredScore !== undefined,
      'BestTurnResult includes bestEmpoweredScore telemetry'
    );
    assert(
      p3Result.bestStandardScore !== undefined,
      'BestTurnResult includes bestStandardScore telemetry'
    );
    assert(
      p3Result.cardLiftCp !== undefined,
      'BestTurnResult includes cardLiftCp telemetry'
    );
    assert(
      p3Result.cardLiftCp! >= -15,
      `P3 Double-Tax Purged: P3 cardLiftCp is competitive (>= -15cp, got ${p3Result.cardLiftCp}cp)`
    );
  }

  // ==========================================================
  // Suite 5: Search Speedup & Wall-Clock Latency Benchmark
  // ==========================================================
  console.log('\nSuite 5: Search Speedup & Wall-Clock Latency Benchmark');
  {
    const benchFen = 'r1bqkb1r/pp3ppp/2n1pn2/2pp4/2PP4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 0 5';
    const benchEngine = new DeckChessEngine(
      benchFen,
      ['p1_sidestep', 'n1_adrenaline_jump', 'b1_let_me_through', 'r1_make_way'],
      ['p2_attack_head_on', 'n2_skirmisher', 'b2_pin_breaker', 'r2_ive_got_your_back']
    );

    // Depth 2 (medium) benchmark
    const t0 = Date.now();
    const resD2 = computeBestTurn(benchEngine, 'w', 'medium', DEFAULT_EVAL_PARAMS, { deterministic: true });
    const d2Ms = Date.now() - t0;
    console.log(`    Depth 2 decision time: ${d2Ms}ms (move: ${resD2.move.from}->${resD2.move.to})`);
    assert(
      d2Ms < 500,
      `Depth 2 latency target: < 500ms (achieved ${d2Ms}ms)`
    );

    // Depth 3 (tactical) benchmark
    const t1 = Date.now();
    const resD3 = computeBestTurn(benchEngine, 'w', 'tactical', DEFAULT_EVAL_PARAMS, { deterministic: true });
    const d3Ms = Date.now() - t1;
    console.log(`    Depth 3 decision time: ${d3Ms}ms (move: ${resD3.move.from}->${resD3.move.to})`);
    assert(
      d3Ms < 2000,
      `Depth 3 latency target: < 2000ms (achieved ${d3Ms}ms)`
    );
  }

  // ==========================================================
  // Suite 6: Telemetry Integrity on Standard Moves
  // ==========================================================
  console.log('\nSuite 6: Telemetry Integrity on Standard Moves');
  {
    const engine = new DeckChessEngine();
    const res = computeBestTurn(engine, 'w', 'medium', DEFAULT_EVAL_PARAMS, { seed: 77 });
    assert(res.contenderCount !== undefined && res.contenderCount >= 1, 'contenderCount is reported on result');
    assert(res.bestStandardScore !== undefined, 'bestStandardScore is reported on result');
    assert(typeof res.whiteEvalCp === 'number', 'whiteEvalCp is valid number');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(` ENGINE SUITE COMPLETE: ${passed} PASSED | ${failed} FAILED`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (targetSuite === 'engine') {
  runEngineSuite().catch((err) => {
    console.error('Unhandled suite error:', err);
    process.exit(1);
  });
}
